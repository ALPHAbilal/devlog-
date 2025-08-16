/**
 * SaveCoordinator.js - Combined from production repositories
 * 
 * Sources:
 * - Outline: Debounce pattern (3000ms delay)
 * - Excalidraw: Flush capability and save management
 * - Firebase: WriteBatch mutation queue pattern
 * - Supabase: Batch upsert implementation
 * - Sequelize: Retry logic with exponential backoff
 */

import { debounce } from 'lodash';
import { supabase } from './supabase'; // Adjust path as needed

// Constants from production repos
const AUTOSAVE_DELAY = 3000; // From Outline (app/scenes/Document/components/Document.tsx)
const MAX_RETRIES = 3; // Standard from Sequelize
const BATCH_SIZE = 500; // Firebase WriteBatch limit

class SaveCoordinator {
  constructor() {
    // From Firebase WriteBatch - mutation queue pattern
    this._mutations = [];
    this._committed = false;
    
    // Modified from Excalidraw - dirty tracking with Set
    this.dirtyBlocks = new Set();
    
    // From Sequelize - retry configuration
    this.maxRetries = MAX_RETRIES;
    this.retryBackoffBase = 100; // milliseconds
    this.retryBackoffExponent = 1.1;
    
    // Status tracking from Outline
    this.isSaving = false;
    this.isPublishing = false;
    this.status = 'idle'; // idle, saving, saved, error
    
    // From Outline - debounced autosave
    this.autosave = debounce(
      () => this.processQueue({ autosave: true }),
      AUTOSAVE_DELAY
    );
    
    // From Excalidraw - immediate flush capability
    this.flushSave = () => {
      this.autosave.flush();
    };
  }
  
  /**
   * From Firebase WriteBatch pattern - add mutation to queue
   */
  enqueue(blockId, changes, documentId) {
    // Prevent duplicate entries
    if (!this.dirtyBlocks.has(blockId)) {
      this._mutations.push({
        blockId,
        documentId,
        changes,
        timestamp: Date.now()
      });
      this.dirtyBlocks.add(blockId);
    } else {
      // Update existing mutation
      const index = this._mutations.findIndex(m => m.blockId === blockId);
      if (index !== -1) {
        this._mutations[index] = {
          ...this._mutations[index],
          changes: { ...this._mutations[index].changes, ...changes },
          timestamp: Date.now()
        };
      }
    }
    
    // Trigger debounced save
    this.autosave();
  }
  
  /**
   * From Outline - process queue with options
   */
  async processQueue(options = { autosave: false }) {
    // From Outline - prevent save if nothing has changed
    if (options.autosave && this._mutations.length === 0) {
      return;
    }
    
    // Prevent concurrent saves
    if (this.isSaving) {
      return;
    }
    
    this.isSaving = true;
    this.status = 'saving';
    
    try {
      // From Firebase - copy mutations and clear queue
      const batch = [...this._mutations];
      this._mutations = [];
      
      // Process in batches if needed (Firebase limit)
      const chunks = this.chunkArray(batch, BATCH_SIZE);
      
      for (const chunk of chunks) {
        await this.saveWithRetry(chunk);
      }
      
      // Clear dirty tracking after successful save
      batch.forEach(mutation => {
        this.dirtyBlocks.delete(mutation.blockId);
      });
      
      this.status = 'saved';
      this.onSaveComplete?.();
      
    } catch (error) {
      this.status = 'error';
      // Re-add failed mutations back to queue
      this._mutations = [...batch, ...this._mutations];
      this.onSaveError?.(error);
      throw error;
      
    } finally {
      this.isSaving = false;
    }
  }
  
  /**
   * From Sequelize - retry logic with exponential backoff
   */
  async saveWithRetry(batch, attempt = 0) {
    try {
      // Prepare batch for Supabase upsert
      const preparedBatch = this.prepareBatchForSupabase(batch);
      
      // From Supabase pattern - batch upsert
      const { data, error } = await supabase
        .from('blocks')
        .upsert(preparedBatch, { 
          onConflict: 'id',
          returning: 'minimal' // Don't return data for performance
        });
      
      if (error) throw error;
      
      return data;
      
    } catch (error) {
      // From Sequelize - retry logic
      if (attempt >= this.maxRetries) {
        console.error(`Save failed after ${this.maxRetries} attempts:`, error);
        throw error;
      }
      
      // Exponential backoff calculation from Sequelize
      const delay = Math.floor(
        this.retryBackoffBase * Math.pow(this.retryBackoffExponent, attempt)
      );
      
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.saveWithRetry(batch, attempt + 1);
    }
  }
  
  /**
   * Prepare batch for Supabase schema
   */
  prepareBatchForSupabase(batch) {
    return batch.map(mutation => ({
      id: mutation.blockId,
      document_id: mutation.documentId,
      type: mutation.changes.type || 'text',
      content: mutation.changes.content || '',
      metadata: mutation.changes.data || mutation.changes.metadata || {},
      position: mutation.changes.position ?? 0,
      updated_at: new Date().toISOString()
    }));
  }
  
  /**
   * From Excalidraw - immediate save without debounce
   */
  async saveNow() {
    this.autosave.cancel();
    await this.processQueue({ autosave: false });
  }
  
  /**
   * From Firebase - verify not already committed
   */
  _verifyNotCommitted() {
    if (this._committed) {
      throw new Error('SaveCoordinator has been committed and cannot be reused');
    }
  }
  
  /**
   * Utility to chunk array for batch processing
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * From Outline - check if there are unsaved changes
   */
  isDirty() {
    return this.dirtyBlocks.size > 0 || this._mutations.length > 0;
  }
  
  /**
   * Clean up and cancel pending saves
   */
  destroy() {
    this.autosave.cancel();
    this._mutations = [];
    this.dirtyBlocks.clear();
    this._committed = true;
  }
  
  /**
   * Event handlers (to be set by consumer)
   */
  onSaveComplete = null;
  onSaveError = null;
  onStatusChange = null;
}

// Singleton instance (like Excalidraw's LocalData)
let instance = null;

export const getSaveCoordinator = () => {
  if (!instance) {
    instance = new SaveCoordinator();
  }
  return instance;
};

export default SaveCoordinator;