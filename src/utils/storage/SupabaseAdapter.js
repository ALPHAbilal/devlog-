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

    // Check cache first
    const now = Date.now();
    if (this.documentsCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('SupabaseAdapter: Returning cached documents');
      return this.documentsCache;
    }

    const queryStart = performance.now();
    
    // ONLY get documents - NO BLOCKS for dashboard view
    // Temporarily remove timeout to debug
    console.log(`SupabaseAdapter: Querying documents for user ${this.userId}`);
    
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, tags, created_at, updated_at, metadata, is_template')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(20);
    
    const queryTime = performance.now() - queryStart;
    console.log(`SupabaseAdapter: Documents query completed in ${Math.round(queryTime)}ms`);
    
    if (docError) {
      console.error('Error getting documents:', docError);
      return this.documentsCache || [];
    }
    
    if (!documents || documents.length === 0) {
      return [];
    }
    
    // Load first block for each document for preview
    const documentsWithBlocks = await Promise.all(documents.map(async (doc) => {
      const { data: blockData, error: blockError } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', doc.id)
        .order('position')
        .limit(1);
      
      if (blockError) {
        console.warn(`Error loading first block for document ${doc.id}:`, blockError);
      }
      
      // Get the first block from the array (if any)
      const firstBlock = blockData && blockData.length > 0 ? blockData[0] : null;
      
      // Generate preview from first block or use stored preview
      let preview = doc.metadata?.preview || 'Click to view document...';
      let blocks = [];
      
      if (firstBlock) {
        blocks = [this.transformBlockFromDB(firstBlock)];
        if (firstBlock.type === 'text' || firstBlock.type === 'heading') {
          preview = firstBlock.content.substring(0, 150);
          if (firstBlock.content.length > 150) preview += '...';
        }
      }
      
      return {
        id: doc.id,
        title: doc.title,
        preview: preview,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        isTemplate: doc.is_template || false,
        tags: doc.tags || [],
        metadata: doc.metadata || {},
        blocks: blocks, // Contains first block only
        blockCount: doc.metadata?.blockCount || (firstBlock ? 1 : 0)
      };
    }));
    
    // Transform to legacy format
    const transformedDocuments = documentsWithBlocks;
    
    // Update cache
    this.documentsCache = transformedDocuments;
    this.cacheTimestamp = now;
    
    console.log(`SupabaseAdapter: Returning ${transformedDocuments.length} documents with first blocks loaded`);
    
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
    
    // 1. Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Authentication required for save operation');
    }
    console.log(`SupabaseAdapter: Using userId ${this.userId} for save`);
    
    const { blocks, ...docData } = document;
    
    // Generate preview from blocks
    let preview = 'Click to view document...';
    if (blocks && blocks.length > 0) {
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
    console.log(`SupabaseAdapter: Using atomic save for ${blocks?.length || 0} blocks`);
    
    // Prepare blocks for the RPC call
    const blocksToSave = (blocks || []).map((block, index) => ({
      id: block.id || crypto.randomUUID(), // Generate ID if missing
      type: block.type,
      content: block.content || '',
      position: index,
      metadata: block.metadata || {},
      language: block.language || null,
      file_path: block.filePath || null
    }));
    
    console.log(`SupabaseAdapter: Preparing to save ${blocksToSave.length} blocks:`, 
      blocksToSave.map(b => ({ id: b.id, type: b.type, content: b.content.substring(0, 50) + '...' }))
    );
    
    // Call the atomic save function
    const { error: blocksError } = await supabase.rpc('save_document_blocks', {
      doc_id: savedDoc.id,
      blocks: blocksToSave
    });
    
    if (blocksError) {
      console.error('Error saving blocks atomically:', blocksError);
      throw blocksError;
    }
    
    console.log(`SupabaseAdapter: Successfully saved document ${savedDoc.id} with ${blocksToSave.length} blocks atomically`);
    
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
        console.log(`SupabaseAdapter: Verified ${savedBlocks?.length || 0} blocks saved for document ${savedDoc.id}`);
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
      
      // Delete blocks and document in parallel for better performance
      const deleteStart = performance.now();
      
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
      console.log(`SupabaseAdapter: Delete operations completed in ${Math.round(deleteTime)}ms`);
      
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

    // Parse metadata if needed
    if (block.metadata) {
      Object.assign(baseBlock, block.metadata);
    }

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