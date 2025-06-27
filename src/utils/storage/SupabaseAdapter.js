import { supabase } from '../../lib/supabase';

export class SupabaseAdapter {
  constructor() {
    this.initialized = false;
    this.documentsCache = null;
    this.cacheTimestamp = 0;
    this.CACHE_DURATION = 5000; // 5 seconds cache
  }
  
  invalidateCache() {
    this.documentsCache = null;
    this.cacheTimestamp = 0;
  }

  async init(userId = null) {
    // If userId is provided, use it directly (avoid extra auth call)
    if (userId) {
      this.userId = userId;
      this.initialized = true;
      return true;
    }
    
    // Otherwise check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }
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
      preview: 'Click to view document...', // Default preview since it's not in DB
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: [] // Empty blocks array for list view
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
    // Add timeout and limit for better performance
    // Use simplified query to avoid potential RLS issues
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title, tags, created_at, updated_at, is_template, metadata')
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false })
      .limit(50) // Reduce to 50 for better performance
      .abortSignal(AbortSignal.timeout(10000)); // 10 second timeout
    
    const queryTime = performance.now() - queryStart;
    console.log(`SupabaseAdapter: Documents query completed in ${Math.round(queryTime)}ms (NO BLOCKS)`);
    
    if (docError) {
      console.error('Error getting documents:', docError);
      return this.documentsCache || [];
    }
    
    if (!documents || documents.length === 0) {
      return [];
    }
    
    // Transform to legacy format - with EMPTY blocks array
    const transformedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      preview: 'Click to view document...', // Default preview since it's not in DB
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template,
      tags: doc.tags || [],
      metadata: doc.metadata || {},
      blocks: [] // Empty blocks - will be loaded on demand
    }));
    
    // Update cache
    this.documentsCache = transformedDocuments;
    this.cacheTimestamp = now;
    
    console.log(`SupabaseAdapter: Returning ${transformedDocuments.length} documents (blocks will load on demand)`);
    
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

    const { blocks, ...docData } = document;
    
    // Check if document exists
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('id')
      .eq('id', docData.id)
      .eq('user_id', this.userId)
      .maybeSingle();
    
    let savedDoc;
    
    if (existingDoc) {
      // Update existing document
      const { data, error } = await supabase
        .from('documents')
        .update({
          title: docData.title,
          is_template: docData.isTemplate || false,
          tags: docData.tags || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', docData.id)
        .eq('user_id', this.userId)
        .select()
        .maybeSingle();
        
      if (error) {
        console.error('Error updating document:', error);
        throw error;
      }
      savedDoc = data;
    } else {
      // Insert new document
      const { data, error } = await supabase
        .from('documents')
        .insert({
          id: docData.id,
          user_id: this.userId,
          title: docData.title,
          is_template: docData.isTemplate || false,
          tags: docData.tags || [],
          created_at: docData.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();
        
      if (error) {
        console.error('Error inserting document:', error);
        throw error;
      }
      savedDoc = data;
    }

    // Delete existing blocks
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('document_id', savedDoc.id);

    if (deleteError) {
      console.error('Error deleting old blocks:', deleteError);
    }

    // Save new blocks
    if (blocks && blocks.length > 0) {
      const blocksToSave = blocks.map((block, index) => 
        this.transformBlockToDB(block, savedDoc.id, index)
      );

      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToSave);

      if (blocksError) {
        console.error('Error saving blocks:', blocksError);
        throw blocksError;
      }
    }

    // Invalidate cache after successful save
    this.invalidateCache();

    return savedDoc.id;
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