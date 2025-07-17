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
      .select('id, title, tags, created_at, updated_at, is_template, metadata, folder_id, position')
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
      blockCount: doc.metadata?.blockCount || 0, // Include block count
      folder_id: doc.folder_id || null,
      position: doc.position || 0
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
    
    // Use direct query - don't try RPC function that doesn't exist
    console.log(`SupabaseAdapter: Querying documents for user ${this.userId}`);
    
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, tags, created_at, updated_at, metadata, is_template, project_id, folder_id, position')
      .eq('user_id', this.userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    
    documents = data;
    docError = error;
    
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
    
    // Check IndexedDB for unsynced documents
    let unsyncedDocs = [];
    try {
      const IndexedDBAdapter = (await import('./IndexedDBAdapter.js')).default;
      const allIndexedDBDocs = await IndexedDBAdapter.getAllDocuments();
      
      // Filter for documents that are marked as unsynced
      unsyncedDocs = allIndexedDBDocs.filter(doc => 
        doc.metadata?.syncStatus === 'pending' || 
        doc.metadata?.createdLocally === true
      );
      
      console.log(`SupabaseAdapter: Found ${unsyncedDocs.length} unsynced documents in IndexedDB`);
    } catch (error) {
      console.warn('Could not check IndexedDB for unsynced documents:', error);
    }
    
    // Create a map of Supabase documents for easy lookup
    const supabaseDocMap = new Map(documents.map(doc => [doc.id, doc]));
    
    // Merge unsynced documents with Supabase results
    const mergedDocuments = [...documents];
    
    for (const unsyncedDoc of unsyncedDocs) {
      if (!supabaseDocMap.has(unsyncedDoc.id)) {
        // This document only exists in IndexedDB
        mergedDocuments.push({
          ...unsyncedDoc,
          created_at: unsyncedDoc.createdAt,
          updated_at: unsyncedDoc.updatedAt,
          is_template: unsyncedDoc.isTemplate || false
        });
      }
    }
    
    console.log(`SupabaseAdapter: Total documents after merge: ${mergedDocuments.length}`);
    
    // Transform documents to app format
    const documentsWithBlocks = mergedDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      preview: doc.metadata?.preview || doc.preview || 'Click to view document...',
      createdAt: doc.created_at || doc.createdAt,
      updatedAt: doc.updated_at || doc.updatedAt,
      isTemplate: doc.is_template || doc.isTemplate || false,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: [], // Don't load blocks on document list - let ExpandedView handle it
      blockCount: doc.metadata?.blockCount || doc.block_count || doc.blockCount || 0,
      project_id: doc.project_id || null, // Include project_id for filtering
      folder_id: doc.folder_id || null,
      position: doc.position || 0
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
    
    // CRITICAL: Prevent data loss - check if we're trying to save 0 blocks for a document that has blocks
    const blocks = document.blocks || [];
    const documentId = document.id;
    const isNewDocument = document.metadata?.isNewDocument === true || 
                         document.metadata?.createdLocally === true ||
                         !document.createdAt;
    
    // Only perform the safety check for existing documents, not brand new ones
    if (blocks.length === 0 && documentId && documentId !== 'new' && !isNewDocument) {
      // Check if this document already has blocks
      const { data: existingBlocks, error: checkError } = await supabase
        .from('blocks')
        .select('id')
        .eq('document_id', documentId)
        .is('deleted_at', null)
        .limit(1);
      
      if (!checkError && existingBlocks && existingBlocks.length > 0) {
        console.error(`🚨 CRITICAL: Attempted to save 0 blocks for document ${documentId} that has existing blocks. Preventing data loss.`);
        console.warn('Stack trace:', new Error().stack);
        
        // Return the document without saving to prevent data loss
        return {
          ...document,
          id: documentId,
          blocks: [] // Return empty blocks as requested, but don't delete existing ones
        };
      }
    }
    
    const { blocks: documentBlocks, ...docData } = document;
    
    // CRITICAL FIX: If blocks are not provided, this is a partial update
    // Don't touch the blocks - only update document metadata
    if (documentBlocks === undefined) {
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
    if (!docData.preview && documentBlocks && documentBlocks.length > 0) {
      const firstTextBlock = documentBlocks.find(b => b.type === 'text' && b.content);
      const firstHeading = documentBlocks.find(b => b.type === 'heading' && b.content);
      preview = firstTextBlock?.content.substring(0, 100) + '...' || 
                firstHeading?.content || 
                'Click to start writing...';
    }
    
    // Check if this is a new document with a folder_id
    const isNewDocument = !docData.createdAt;
    const hasFolderId = docData.folder_id && docData.folder_id !== null;
    
    let savedDoc;
    let docError;
    
    if (isNewDocument && hasFolderId) {
      // Use the security definer function for new documents with folders
      console.log('SupabaseAdapter: Using security definer function for document creation with folder');
      
      const { data, error } = await supabase.rpc('create_document_with_folder_check', {
        p_id: docData.id,
        p_title: docData.title,
        p_folder_id: docData.folder_id,
        p_preview: preview,
        p_tags: docData.tags || [],
        p_metadata: {
          ...(docData.metadata || {}),
          preview: preview,
          blockCount: documentBlocks?.length || 0,
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          isNewDocument: false // Clear the flag after first save
        },
        p_is_template: docData.isTemplate || false,
        p_position: docData.position || 0
      });
      
      savedDoc = data;
      docError = error;
    } else {
      // Use regular upsert for updates or documents without folders
      const documentToSave = {
        id: docData.id,
        user_id: this.userId,
        title: docData.title,
        is_template: docData.isTemplate || false,
        tags: docData.tags || [],
        metadata: {
          ...(docData.metadata || {}),
          preview: preview,
          blockCount: documentBlocks?.length || 0,
          syncStatus: 'synced', // Mark as synced when saved to Supabase
          lastSyncedAt: new Date().toISOString(),
          isNewDocument: false // Clear the flag after first save
        },
        created_at: docData.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        folder_id: docData.folder_id || null,
        position: docData.position || 0
      };
      
      console.log('SupabaseAdapter: Saving document to Supabase:', {
        id: documentToSave.id,
        title: documentToSave.title,
        blockCount: documentBlocks?.length || 0,
        userId: this.userId,
        isNew: isNewDocument
      });
      
      if (isNewDocument) {
        // For new documents, use insert to avoid conflicts with soft-deleted documents
        const { data, error } = await supabase
          .from('documents')
          .insert(documentToSave)
          .select()
          .single();
        
        savedDoc = data;
        docError = error;
      } else {
        // For existing documents, use update to respect RLS policies
        const { data, error } = await supabase
          .from('documents')
          .update({
            title: documentToSave.title,
            is_template: documentToSave.is_template,
            tags: documentToSave.tags,
            metadata: documentToSave.metadata,
            updated_at: documentToSave.updated_at,
            folder_id: documentToSave.folder_id,
            position: documentToSave.position
          })
          .eq('id', documentToSave.id)
          .eq('user_id', this.userId)
          .is('deleted_at', null) // Only update non-deleted documents
          .select()
          .single();
        
        savedDoc = data;
        docError = error;
      }
    }
    
    if (docError) {
      console.error('Error saving document:', docError);
      throw docError;
    }
    
    if (!savedDoc) {
      console.error('Document save returned no data');
      throw new Error('Document save failed - no data returned');
    }
    
    console.log('SupabaseAdapter: Document saved successfully:', {
      id: savedDoc.id,
      title: savedDoc.title,
      updated_at: savedDoc.updated_at
    });
    
    // 3. Use atomic function to save blocks
    // console.log(`SupabaseAdapter: Using atomic save for ${documentBlocks?.length || 0} blocks`);
    
    // Prepare blocks for the RPC call - use Promise.resolve to prevent blocking
    const blocksToSave = await Promise.resolve((documentBlocks || []).map((block, index) => {
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
      // Try the safer save_document_blocks_v3 function that prevents data loss
      const { error } = await supabase.rpc('save_document_blocks_v3', {
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

    console.log(`SupabaseAdapter: updateAllDocuments called with ${documents.length} documents`);
    
    // Only save documents that have blocks loaded
    // Skip documents where blocks are undefined (not loaded from getDocuments)
    for (const doc of documents) {
      // CRITICAL: Skip documents without loaded blocks to prevent data loss
      if (doc.blocks === undefined) {
        console.log(`SupabaseAdapter: Skipping save for document ${doc.id} - blocks not loaded`);
        continue;
      }
      
      // CRITICAL: Skip documents with empty blocks array that came from getDocuments()
      // These documents have blocks: [] because getDocuments() doesn't load blocks for performance
      // We can identify them by checking if they have blockCount metadata but 0 blocks
      if (doc.blocks.length === 0 && doc.blockCount > 0) {
        console.log(`SupabaseAdapter: Skipping save for document ${doc.id} - has ${doc.blockCount} blocks but blocks not loaded`);
        continue;
      }
      
      // Only save if blocks are explicitly provided (even if empty array)
      console.log(`SupabaseAdapter: Saving document ${doc.id} with ${doc.blocks.length} blocks`);
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

  // Project CRUD operations
  async getProjects() {
    if (!this.initialized) await this.init();
    
    console.log('SupabaseAdapter: Getting projects...');
    
    try {
      // Get projects
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.error('SupabaseAdapter: Error getting projects:', projectsError);
        return [];
      }
      
      // Get document counts for each project
      const projectsWithCounts = await Promise.all(projects.map(async (project) => {
        const { count, error: countError } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', this.userId)
          .eq('project_id', project.id);
        
        if (countError) {
          console.error(`Error getting count for project ${project.id}:`, countError);
        }
        
        return {
          ...project,
          document_count: count || 0
        };
      }));
      
      console.log(`SupabaseAdapter: Found ${projectsWithCounts.length} projects`);
      return projectsWithCounts;
    } catch (error) {
      console.error('SupabaseAdapter: Failed to get projects:', error);
      return [];
    }
  }

  async createProject(projectData) {
    if (!this.initialized) await this.init();
    
    console.log('SupabaseAdapter: Creating project:', projectData);
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: this.userId,
        title: projectData.title,
        description: projectData.description || null,
        color: projectData.color || '#10b981',
        icon: projectData.icon || 'folder'
      })
      .select()
      .single();
    
    if (error) {
      console.error('SupabaseAdapter: Error creating project:', error);
      throw error;
    }
    
    console.log('SupabaseAdapter: Project created:', data);
    return data;
  }

  async updateProject(projectId, updates) {
    if (!this.initialized) await this.init();
    
    console.log('SupabaseAdapter: Updating project:', projectId, updates);
    
    const { data, error } = await supabase
      .from('projects')
      .update({
        title: updates.title,
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', this.userId)
      .select()
      .single();
    
    if (error) {
      console.error('SupabaseAdapter: Error updating project:', error);
      throw error;
    }
    
    console.log('SupabaseAdapter: Project updated:', data);
    return data;
  }

  async deleteProject(projectId) {
    if (!this.initialized) await this.init();
    
    console.log('SupabaseAdapter: Deleting project:', projectId);
    
    // First, unassign all documents from this project
    const { error: unassignError } = await supabase
      .from('documents')
      .update({ project_id: null })
      .eq('project_id', projectId)
      .eq('user_id', this.userId);
    
    if (unassignError) {
      console.error('SupabaseAdapter: Error unassigning documents:', unassignError);
      throw unassignError;
    }
    
    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', this.userId);
    
    if (error) {
      console.error('SupabaseAdapter: Error deleting project:', error);
      throw error;
    }
    
    console.log('SupabaseAdapter: Project deleted successfully');
    return true;
  }

  async assignDocumentToProject(documentId, projectId) {
    if (!this.initialized) await this.init();
    
    console.log('SupabaseAdapter: Assigning document to project:', { documentId, projectId });
    
    const { error } = await supabase
      .from('documents')
      .update({ 
        project_id: projectId,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', this.userId);
    
    if (error) {
      console.error('SupabaseAdapter: Error assigning document:', error);
      throw error;
    }
    
    // Invalidate cache to reflect the change
    this.invalidateCache();
    
    console.log('SupabaseAdapter: Document assigned successfully');
    return true;
  }
}