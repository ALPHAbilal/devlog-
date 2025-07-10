import { supabase } from '../../lib/supabase';
import { SupabaseAdapterOptimized } from './SupabaseAdapterOptimized';
import IndexedDBAdapter from './IndexedDBAdapter';
import eventBus, { EVENT_TYPES } from '../eventBus';
import realtimeManager from '../realtimeManager';

/**
 * Event-Aware Storage Wrapper
 * Integrates storage operations with event system and realtime updates
 */
class EventAwareStorageWrapper {
  constructor() {
    this.adapter = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.userId = null;
    this.useSupabase = false;
  }

  async init(userId) {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize(userId);
    return this.initPromise;
  }

  async _initialize(userId) {
    if (this.isInitialized && this.userId === userId) {
      return this.adapter;
    }

    this.userId = userId;
    console.log('EventAwareStorageWrapper: Initializing with userId:', userId);

    // Check if we should use Supabase
    const { data: { session } } = await supabase.auth.getSession();
    this.useSupabase = !!session && !!userId;

    if (this.useSupabase) {
      console.log('Using Supabase for storage');
      this.adapter = new SupabaseAdapterOptimized();
      await this.adapter.init(userId);
      
      // Initialize realtime subscriptions
      await realtimeManager.initialize(userId);
      
      // Emit auth state
      eventBus.emit(EVENT_TYPES.AUTH_STATE_CHANGED, { 
        authenticated: true, 
        userId 
      });
    } else {
      console.log('Using IndexedDB for storage (offline mode)');
      this.adapter = await this.createIndexedDBWrapper();
      await this.adapter.init();
      
      eventBus.emit(EVENT_TYPES.AUTH_STATE_CHANGED, { 
        authenticated: false 
      });
    }

    this.isInitialized = true;
    return this.adapter;
  }

  createIndexedDBWrapper() {
    const wrapper = {
      async init() {
        return await IndexedDBAdapter.init();
      },

      async getDocuments() {
        return await IndexedDBAdapter.getAllDocuments();
      },

      async saveDocument(document, blocks) {
        const result = await IndexedDBAdapter.saveDocument(document);
        
        // Emit local events
        eventBus.emit(EVENT_TYPES.DOCUMENT_UPDATED, document);
        eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
          type: 'document',
          action: 'save',
          data: document
        });
        
        return result;
      },

      async deleteDocument(id) {
        await IndexedDBAdapter.deleteDocument(id);
        
        eventBus.emit(EVENT_TYPES.DOCUMENT_DELETED, { id });
        eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
          type: 'document',
          action: 'delete',
          data: { id }
        });
      },

      async updateBlock(documentId, blockId, updates) {
        const document = await IndexedDBAdapter.getDocument(documentId);
        if (!document) return;

        const blockIndex = document.blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
          document.blocks[blockIndex] = {
            ...document.blocks[blockIndex],
            ...updates
          };
          await IndexedDBAdapter.saveDocument(document);
          
          eventBus.emit(EVENT_TYPES.BLOCK_UPDATED, {
            documentId,
            blockId,
            updates
          });
        }
      },

      // Add other methods as needed
      async searchDocuments(userId, query) {
        const allDocs = await IndexedDBAdapter.getAllDocuments();
        const lowerQuery = query.toLowerCase();
        return allDocs.filter(doc => 
          doc.title?.toLowerCase().includes(lowerQuery) ||
          doc.preview?.toLowerCase().includes(lowerQuery)
        );
      }
    };

    return wrapper;
  }

  // Proxy methods with event emissions
  async getDocuments() {
    if (!this.adapter) throw new Error('Storage not initialized');
    return this.adapter.getDocuments();
  }

  async saveDocument(document, blocks) {
    if (!this.adapter) throw new Error('Storage not initialized');
    
    try {
      eventBus.emit(EVENT_TYPES.SYNC_STARTED, { 
        type: 'document', 
        id: document.id 
      });
      
      const result = await this.adapter.saveDocument(document, blocks);
      
      // For Supabase, realtime will handle the events
      // For IndexedDB, we emit them manually (handled in wrapper)
      
      eventBus.emit(EVENT_TYPES.SYNC_COMPLETED, { 
        type: 'document', 
        id: document.id 
      });
      
      // Notify cross-tab
      localStorage.setItem('databaseUsageUpdate', Date.now().toString());
      
      return result;
    } catch (error) {
      eventBus.emit(EVENT_TYPES.SYNC_FAILED, { 
        type: 'document', 
        id: document.id, 
        error 
      });
      throw error;
    }
  }

  async deleteDocument(id) {
    if (!this.adapter) throw new Error('Storage not initialized');
    
    try {
      await this.adapter.deleteDocument(id);
      
      // Notify cross-tab
      localStorage.setItem('databaseUsageUpdate', Date.now().toString());
    } catch (error) {
      eventBus.emit(EVENT_TYPES.STORAGE_ERROR, { 
        action: 'delete', 
        id, 
        error 
      });
      throw error;
    }
  }

  async updateBlock(documentId, blockId, updates) {
    if (!this.adapter) throw new Error('Storage not initialized');
    
    try {
      const result = await this.adapter.updateBlock(documentId, blockId, updates);
      
      // For IndexedDB, events are emitted in the wrapper
      // For Supabase, realtime handles it
      
      return result;
    } catch (error) {
      eventBus.emit(EVENT_TYPES.STORAGE_ERROR, { 
        action: 'updateBlock', 
        documentId, 
        blockId, 
        error 
      });
      throw error;
    }
  }

  async searchDocuments(query) {
    if (!this.adapter) throw new Error('Storage not initialized');
    return this.adapter.searchDocuments(this.userId, query);
  }

  // Subscribe to document presence (for collaborative features)
  async subscribeToDocument(documentId) {
    if (this.useSupabase) {
      await realtimeManager.subscribeToPresence(documentId);
    }
  }

  async unsubscribeFromDocument(documentId) {
    if (this.useSupabase) {
      await realtimeManager.unsubscribeFromPresence(documentId);
    }
  }

  // Clean up
  async cleanup() {
    if (this.useSupabase) {
      await realtimeManager.cleanup();
    }
    
    this.adapter = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.userId = null;
  }
}

// Create singleton instance
const eventAwareStorage = new EventAwareStorageWrapper();

export default eventAwareStorage;