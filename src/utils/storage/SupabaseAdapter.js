import { supabase } from '../../lib/supabase';

export class SupabaseAdapter {
  constructor() {
    this.initialized = false;
  }

  async init() {
    // Check if user is authenticated
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

  // Document-specific methods
  async getDocuments() {
    if (!this.initialized) await this.init();

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        blocks (
          *
        )
      `)
      .eq('user_id', this.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error getting documents:', error);
      return [];
    }

    // Transform to legacy format
    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      isTemplate: doc.is_template,
      tags: doc.tags || [],
      blocks: (doc.blocks || [])
        .sort((a, b) => a.position - b.position)
        .map(block => this.transformBlockFromDB(block))
    }));
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

    return savedDoc.id;
  }

  async deleteDocument(documentId) {
    if (!this.initialized) await this.init();

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
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