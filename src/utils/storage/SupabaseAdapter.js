import { supabase } from '../../lib/supabase';

export class SupabaseAdapter {
  constructor() {
    this.initialized = false;
    this.documentsCache = null;
    this.cacheTimestamp = 0;
    this.CACHE_DURATION = 5000; // 5 seconds cache
    this.saveQueue = new Map(); // Prevent concurrent saves
  }
  
  invalidateCache() {
    this.documentsCache = null;
    this.cacheTimestamp = 0;
  }

  async init(userId = null) {
    // If userId is provided, use it directly (avoid extra auth call)
    if (userId) {
      console.log(`SupabaseAdapter: Init with provided userId ${userId}`);
      this.userId = userId;
      this.initialized = true;
      return true;
    }
    
    // Otherwise check if user is authenticated
    console.log('SupabaseAdapter: Getting user from auth...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('SupabaseAdapter: Auth error:', error);
      throw error;
    }
    
    if (!user) {
      console.error('SupabaseAdapter: No authenticated user');
      throw new Error('User must be authenticated');
    }
    
    console.log(`SupabaseAdapter: Init with auth userId ${user.id}`);
    this.userId = user.id;
    this.initialized = true;
    return true;
  }

  async getItem(key) {
    if (!this.initialized) await this.init();

    if (key === 'journeyLogEntries') {
      return this.getDocuments();
    }
    
    // For other settings/metadata
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('user_id', this.userId)
      .eq('key', key)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Error getting item:', error);
      return null;
    }
    
    return data?.value || null;
  }

  async setItem(key, value) {
    if (!this.initialized) await this.init();

    if (key === 'journeyLogEntries') {
      // Handle batch update of all documents
      return this.updateAllDocuments(value);
    }

    // For other settings - check if exists first
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('user_id', this.userId)
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('settings')
        .update({
          value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .eq('key', key);

      if (error) {
        console.error('Error updating setting:', error);
        throw error;
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('settings')
        .insert({
          user_id: this.userId,
          key,
          value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error inserting setting:', error);
        throw error;
      }
    }
  }

  async removeItem(key) {
    if (!this.initialized) await this.init();

    const { error } = await supabase
      .from('settings')
      .delete()
      .eq('user_id', this.userId)
      .eq('key', key);

    if (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  async clear() {
    if (!this.initialized) await this.init();

    // Delete all user's documents
    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .eq('user_id', this.userId);

    if (docsError) {
      console.error('Error clearing documents:', docsError);
      throw docsError;
    }

    // Delete all user's settings
    const { error: settingsError } = await supabase
      .from('settings')
      .delete()
      .eq('user_id', this.userId);

    if (settingsError) {
      console.error('Error clearing settings:', settingsError);
      throw settingsError;
    }
  }

  // Get documents list without blocks (for dashboard/list views)
  async getDocumentsList() {
    if (!this.initialized) await this.init();

    const queryStart = performance.now();
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, tags, created_at, updated_at, is_template, metadata')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });
    
    const queryTime = performance.now() - queryStart;
    console.log(`SupabaseAdapter: Documents list query completed in ${Math.round(queryTime)}ms`);
    
    if (error) {
      console.error('Error getting documents list:', error);
      return [];
    }
    
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      preview: doc.metadata?.preview || 'Click to view document...', // Use stored preview
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: [], // Empty blocks array for list view
      blockCount: doc.metadata?.blockCount || 0 // Include block count
    }));
  }

  // Document-specific methods - NOW RETURNS DOCUMENTS WITHOUT BLOCKS
  async getDocuments() {
    if (!this.initialized) await this.init();
    console.log('SupabaseAdapter: getDocuments called');

    // Check cache first
    const now = Date.now();
    if (this.documentsCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('SupabaseAdapter: Returning cached documents');
      return this.documentsCache;
    }

    const queryStart = performance.now();
    
    // Try optimized function first
    let documents = null;
    let docError = null;
    
    try {
      // Try the optimized get_documents_with_stats function
      const { data, error } = await supabase.rpc('get_documents_with_stats', {
        p_user_id: this.userId,
        p_limit: 20
      });
      
      if (!error && data) {
        console.log('SupabaseAdapter: Using optimized document query');
        documents = data;
      } else if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
        console.log('SupabaseAdapter: Optimized function not available');
      } else {
        docError = error;
      }
    } catch (e) {
      // Fallback to regular query
    }
    
    // Fallback to regular query if optimized not available
    if (!documents && !docError) {
      console.log(`SupabaseAdapter: Querying documents for user ${this.userId}`);
      
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, tags, created_at, updated_at, metadata, is_template')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false })
        .limit(20);
      
      documents = data;
      docError = error;
    }
    
    const queryTime = performance.now() - queryStart;
    console.log(`SupabaseAdapter: Documents query completed in ${Math.round(queryTime)}ms`);
    
    if (docError) {
      console.error('Error getting documents:', docError);
      return this.documentsCache || [];
    }
    
    if (!documents || documents.length === 0) {
      console.log('SupabaseAdapter: No documents found, returning empty array');
      return [];
    }
    
    console.log(`SupabaseAdapter: Found ${documents.length} documents`);
    
    // Transform documents to app format
    const documentsWithBlocks = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      preview: doc.metadata?.preview || doc.preview || 'Click to view document...',
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template || false,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: [], // Don't load blocks on document list - let ExpandedView handle it
      blockCount: doc.metadata?.blockCount || doc.block_count || 0
    }));
    
    // Transform to legacy format
    const transformedDocuments = documentsWithBlocks;
    
    // Update cache
    this.documentsCache = transformedDocuments;
    this.cacheTimestamp = now;
    
    console.log(`SupabaseAdapter: Returning ${transformedDocuments.length} documents`);
    
    return transformedDocuments;
  }

  // Get a single document with blocks (for editing)
  async getDocument(documentId) {
    if (!this.initialized) await this.init();
    
    const queryStart = performance.now();
    
    // Get document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', this.userId)
      .single();
    
    if (docError) {
      console.error('Error getting document:', docError);
      return null;
    }
    
    // Get blocks for this document
    const { data: blocks, error: blockError } = await supabase
      .from('blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('position');
    
    if (blockError) {
      console.error('Error getting blocks:', blockError);
    }
    
    const queryTime = performance.now() - queryStart;
    console.log(`SupabaseAdapter: Single document query completed in ${Math.round(queryTime)}ms`);
    console.log(`SupabaseAdapter: Loaded ${blocks?.length || 0} blocks for document ${documentId}`);
    
    return {
      id: doc.id,
      title: doc.title,
      preview: this.generatePreview(blocks || []),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: (blocks || []).map(block => this.transformBlockFromDB(block))
    };
  }

  async saveDocument(document) {
    if (!this.initialized) await this.init();

    console.log(`SupabaseAdapter: saveDocument called for ${document.id} with ${document.blocks?.length || 0} blocks`);
    
    // Skip auth check if we already have userId (reduces latency)
    if (!this.userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication required for save operation');
      }
    }
    console.log(`SupabaseAdapter: Using userId ${this.userId} for save`);
    
    const { blocks, ...docData } = document;
    
    // CRITICAL FIX: If blocks are not provided, this is a partial update
    // Don't touch the blocks - only update document metadata
    if (blocks === undefined) {
      console.log('SupabaseAdapter: Partial update detected (no blocks provided), updating only document metadata');
      
      const updateData = {};
      
      // Only include fields that were explicitly provided
      if (docData.title !== undefined) updateData.title = docData.title;
      if (docData.tags !== undefined) updateData.tags = docData.tags;
      if (docData.metadata !== undefined) {
        // Merge with existing metadata to not lose fields
        const { data: currentDoc } = await supabase
          .from('documents')
          .select('metadata')
          .eq('id', docData.id)
          .single();
        
        updateData.metadata = {
          ...(currentDoc?.metadata || {}),
          ...docData.metadata
        };
      }
      
      updateData.updated_at = new Date().toISOString();
      
      const { data: savedDoc, error: docError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', docData.id)
        .eq('user_id', this.userId)
        .select()
        .single();
      
      if (docError) {
        console.error('Error updating document metadata:', docError);
        throw docError;
      }
      
      // Invalidate cache and return
      this.invalidateCache();
      return savedDoc.id;
    }
    
    // Use preview from document if already provided, otherwise generate
    let preview = docData.preview || 'Click to view document...';
    if (!docData.preview && blocks && blocks.length > 0) {
      const firstTextBlock = blocks.find(b => b.type === 'text' && b.content);
      const firstHeading = blocks.find(b => b.type === 'heading' && b.content);
      preview = firstTextBlock?.content.substring(0, 100) + '...' || 
                firstHeading?.content || 
                'Click to start writing...';
    }
    
    // 2. Save/update document metadata using UPSERT
    const { data: savedDoc, error: docError } = await supabase
      .from('documents')
      .upsert({
        id: docData.id,
        user_id: this.userId,
        title: docData.title,
        is_template: docData.isTemplate || false,
        tags: docData.tags || [],
        metadata: {
          ...(docData.metadata || {}),
          preview: preview,
          blockCount: blocks?.length || 0
        },
        created_at: docData.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (docError) {
      console.error('Error saving document:', docError);
      throw docError;
    }
    
    if (!savedDoc) {
      console.error('Document save returned no data');
      throw new Error('Document save failed - no data returned');
    }
    
    // 3. Use atomic function to save blocks
    // console.log(`SupabaseAdapter: Using atomic save for ${blocks?.length || 0} blocks`);
    
    // Prepare blocks for the RPC call - use Promise.resolve to prevent blocking
    const blocksToSave = await Promise.resolve((blocks || []).map((block, index) => {
      // console.log(`🟨 SupabaseAdapter: Processing block for save:`, {
      //   index: index,
      //   blockId: block.id,
      //   blockType: block.type,
      //   hasData: !!block.data,
      //   hasMetadata: !!block.metadata,
      //   dataContent: block.data,
      //   metadataContent: block.metadata,
      //   blockKeys: Object.keys(block)
      // });
      
      // Extract all block data that should be persisted in metadata
      const extractBlockData = (block) => {
        const metadata = {};
        
        // List of properties to exclude from metadata (they have their own columns)
        const excludedProps = ['id', 'type', 'content', 'position', 'tags', 'language', 'filePath', 'isNew', 'createdAt', 'updatedAt'];
        
        // Copy all non-excluded properties to metadata
        Object.keys(block).forEach(key => {
          if (!excludedProps.includes(key) && block[key] !== undefined) {
            metadata[key] = block[key];
          }
        });
        
        // Also merge any existing data or metadata
        if (block.data) {
          Object.assign(metadata, block.data);
        }
        if (block.metadata) {
          Object.assign(metadata, block.metadata);
        }
        
        // Debug logging for AI blocks
        if (block.type === 'ai') {
          console.log('🔵 AI Block Save Debug:', {
            blockId: block.id,
            hasMessages: !!block.messages,
            messageCount: block.messages?.length || 0,
            metadataKeys: Object.keys(metadata),
            hasMessagesInMetadata: !!metadata.messages
          });
        }
        
        return metadata;
      };
      
      const blockToSave = {
        id: block.id || crypto.randomUUID(), // Generate ID if missing
        type: block.type,
        content: block.content || '',
        position: index,
        metadata: extractBlockData(block),  // Extract all block-specific data
        tags: block.tags || [],  // Include tags for the RPC function
        language: block.language || null,
        file_path: block.filePath || null
      };
      
      // console.log(`🟨 SupabaseAdapter: Block prepared for DB:`, {
      //   blockId: blockToSave.id,
      //   blockType: blockToSave.type,
      //   metadataAssigned: blockToSave.metadata,
      //   metadataSource: block.data ? 'block.data' : (block.metadata ? 'block.metadata' : 'empty object')
      // });
      
      return blockToSave;
    }));
    
    // console.log(`SupabaseAdapter: Preparing to save ${blocksToSave.length} blocks:`, 
    //   blocksToSave.map(b => ({ id: b.id, type: b.type, content: b.content.substring(0, 50) + '...' }))
    // );
    
    // Try optimized save function first, fallback to original if not available
    let blocksError = null;
    let useOptimized = true;
    
    try {
      // Try the optimized save_document_blocks_v2 function
      const { error } = await supabase.rpc('save_document_blocks_v2', {
        p_document_id: savedDoc.id,
        p_blocks: blocksToSave
      });
      
      if (error) {
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          console.log('SupabaseAdapter: Optimized function not available, falling back to original');
          useOptimized = false;
        } else {
          blocksError = error;
        }
      }
    } catch (e) {
      useOptimized = false;
    }
    
    // Fallback to original function with retry logic
    if (!useOptimized) {
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        const { error } = await supabase.rpc('save_document_blocks', {
          doc_id: savedDoc.id,
          blocks: blocksToSave
        });
        
        blocksError = error;
        
        // If no error or not a duplicate key error, break
        if (!error || error.code !== '23505') {
          break;
        }
        
        // On duplicate key error, wait and retry
        console.log(`Duplicate key error, retrying (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        retryCount++;
      }
    }
    
    if (blocksError) {
      console.error('Error saving blocks atomically:', blocksError);
      throw blocksError;
    }
    
    // console.log(`SupabaseAdapter: Successfully saved document ${savedDoc.id} with ${blocksToSave.length} blocks atomically`);
    
    // Verify blocks were saved (in development only)
    if (process.env.NODE_ENV === 'development') {
      const { data: savedBlocks, error: verifyError } = await supabase
        .from('blocks')
        .select('id, type, content, position')
        .eq('document_id', savedDoc.id)
        .order('position');
      
      if (verifyError) {
        console.error('Error verifying saved blocks:', verifyError);
      } else {
        // console.log(`SupabaseAdapter: Verified ${savedBlocks?.length || 0} blocks saved for document ${savedDoc.id}`);
      }
    }
    
    // Invalidate cache after successful save
    this.invalidateCache();

    return savedDoc.id;
  }

  // Safe save method that prevents concurrent saves for the same document
  async saveDocumentSafe(document) {
    const documentId = document.id;
    
    // Prevent concurrent saves for the same document
    if (this.saveQueue.has(documentId)) {
      console.log(`SupabaseAdapter: Waiting for previous save of document ${documentId} to complete`);
      await this.saveQueue.get(documentId);
    }
    
    const savePromise = this.saveDocument(document);
    this.saveQueue.set(documentId, savePromise);
    
    try {
      const result = await savePromise;
      return result;
    } finally {
      this.saveQueue.delete(documentId);
    }
  }

  async deleteDocument(documentId) {
    if (!this.initialized) await this.init();

    try {
      console.log(`SupabaseAdapter: Starting deletion of document ${documentId}`);
      
      const deleteStart = performance.now();
      
      // Try soft delete first (if function exists)
      try {
        const { data, error } = await supabase.rpc('soft_delete_document', {
          p_document_id: documentId
        });
        
        if (!error) {
          console.log('SupabaseAdapter: Soft delete successful');
          this.invalidateCache();
          const deleteTime = performance.now() - deleteStart;
          console.log(`SupabaseAdapter: Soft delete completed in ${Math.round(deleteTime)}ms`);
          return true;
        } else if (!error.message?.includes('function') || !error.message?.includes('does not exist')) {
          // If it's not a "function doesn't exist" error, throw it
          throw error;
        }
      } catch (e) {
        if (!e.message?.includes('function') || !e.message?.includes('does not exist')) {
          throw e;
        }
      }
      
      // Fallback to hard delete if soft delete not available
      console.log('SupabaseAdapter: Soft delete not available, using hard delete');
      
      // Use Promise.allSettled to continue even if one fails
      const [blocksResult, docResult] = await Promise.allSettled([
        // Delete blocks
        supabase
          .from('blocks')
          .delete()
          .eq('document_id', documentId),
        
        // Delete document
        supabase
          .from('documents')
          .delete()
          .eq('id', documentId)
          .eq('user_id', this.userId)
      ]);
      
      const deleteTime = performance.now() - deleteStart;
      console.log(`SupabaseAdapter: Hard delete operations completed in ${Math.round(deleteTime)}ms`);
      
      // Check results
      if (blocksResult.status === 'rejected') {
        console.error('Error deleting blocks:', blocksResult.reason);
      } else if (blocksResult.value.error) {
        console.error('Error deleting blocks:', blocksResult.value.error);
      }
      
      if (docResult.status === 'rejected') {
        console.error('Error deleting document:', docResult.reason);
        throw docResult.reason;
      } else if (docResult.value.error) {
        console.error('Error deleting document:', docResult.value.error);
        throw docResult.value.error;
      }

      // Invalidate cache after successful delete
      this.invalidateCache();
      
      console.log(`Successfully deleted document ${documentId}`);
      return true;
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  // Generate preview from blocks
  generatePreview(blocks) {
    if (!blocks || blocks.length === 0) {
      return 'Click to view document...';
    }
    
    // Find first text content block
    const firstTextBlock = blocks.find(b => 
      (b.type === 'text' || b.type === 'heading') && b.content
    );
    
    if (firstTextBlock) {
      const preview = firstTextBlock.content.substring(0, 150);
      return preview.length < firstTextBlock.content.length ? preview + '...' : preview;
    }
    
    return 'Click to view document...';
  }

  // Transform blocks between DB and app formats
  transformBlockFromDB(block) {
    // console.log(`🟧 SupabaseAdapter: transformBlockFromDB called:`, {
    //   blockId: block.id,
    //   blockType: block.type,
    //   hasMetadata: !!block.metadata,
    //   metadataContent: block.metadata,
    //   dbBlockKeys: Object.keys(block)
    // });
    
    const baseBlock = {
      id: block.id,
      type: block.type,
      content: block.content
    };

    // Add type-specific fields
    if (block.type === 'code') {
      baseBlock.language = block.language;
      baseBlock.filePath = block.file_path;
      baseBlock.versionOf = block.version_of;
    }

    // For blocks that use 'data' property (table, todo, template), restore it from metadata
    if (block.type === 'table' || block.type === 'todo' || block.type === 'template') {
      baseBlock.data = block.metadata || {};
      // console.log(`🟧 SupabaseAdapter: Restoring data property for ${block.type} block:`, {
      //   blockId: block.id,
      //   restoredData: baseBlock.data,
      //   isEmptyData: Object.keys(baseBlock.data).length === 0
      // });
    } else if (block.metadata) {
      // For other blocks, merge metadata properties directly
      Object.assign(baseBlock, block.metadata);
      
      // Debug logging for AI blocks
      if (block.type === 'ai') {
        console.log('🔵 AI Block Load Debug:', {
          blockId: block.id,
          metadataKeys: Object.keys(block.metadata || {}),
          hasMessagesInMetadata: !!block.metadata?.messages,
          messageCount: block.metadata?.messages?.length || 0,
          hasMessagesInBaseBlock: !!baseBlock.messages
        });
      }
      
      // Also handle specific known properties for certain block types
      if (block.type === 'filetree' && block.metadata.treeData) {
        baseBlock.treeData = block.metadata.treeData;
      }
      if (block.type === 'ai' && block.metadata.messages) {
        baseBlock.messages = block.metadata.messages;
      }
      if (block.type === 'image' && block.metadata.images) {
        baseBlock.images = block.metadata.images;
      }
      if (block.type === 'inline-image') {
        // inline-image stores properties directly in metadata
        if (block.metadata.url) baseBlock.url = block.metadata.url;
        if (block.metadata.alt) baseBlock.alt = block.metadata.alt;
        if (block.metadata.dimensions) baseBlock.dimensions = block.metadata.dimensions;
      }
    }

    // console.log(`🟧 SupabaseAdapter: Block transformed from DB:`, {
    //   blockId: baseBlock.id,
    //   blockType: baseBlock.type,
    //   hasData: !!baseBlock.data,
    //   transformedBlockKeys: Object.keys(baseBlock),
    //   finalBlock: baseBlock
    // });

    return baseBlock;
  }

  transformBlockToDB(block, documentId, position) {
    const dbBlock = {
      id: block.id,
      document_id: documentId,
      user_id: this.userId, // Add user_id for RLS policy
      type: block.type,
      content: block.content,
      position: position,
      metadata: {}
    };

    // Handle type-specific fields
    if (block.type === 'code') {
      dbBlock.language = block.language;
      dbBlock.file_path = block.filePath;
      dbBlock.version_of = block.versionOf;
    }

    // Store other fields in metadata
    const knownFields = ['id', 'type', 'content', 'language', 'filePath', 'versionOf'];
    Object.keys(block).forEach(key => {
      if (!knownFields.includes(key)) {
        dbBlock.metadata[key] = block[key];
      }
    });

    return dbBlock;
  }

  // Batch update for compatibility
  async updateAllDocuments(documents) {
    if (!this.initialized) await this.init();

    // Save each document
    for (const doc of documents) {
      await this.saveDocument(doc);
    }

    // Invalidate cache after successful update
    this.invalidateCache();
  }

  // Storage info methods (for compatibility)
  async getStorageInfo() {
    return {
      usage: 0,
      quota: Infinity,
      percentUsed: 0
    };
  }

  isAvailable() {
    return true;
  }

  getName() {
    return 'Supabase';
  }
}