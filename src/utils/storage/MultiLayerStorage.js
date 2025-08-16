import { LRUCache } from './LRUCache';
import IndexedDBAdapter from './IndexedDBAdapter';
import { SupabaseAdapterOptimized } from './SupabaseAdapterOptimized';
import eventBus, { EVENT_TYPES } from '../eventBus';
import dataIntegrityManager from '../integrity/DataIntegrityManager';
import lockManager from '../locking/LockManager';

/**
 * Multi-Layer Storage System
 * 
 * Layer 1: Memory Cache (LRU) - <1ms
 * Layer 2: IndexedDB - <10ms
 * Layer 3: Supabase - 50-200ms
 * 
 * Features:
 * - Read-through caching
 * - Write-behind with batching
 * - Automatic layer synchronization
 * - Conflict resolution
 */
export class MultiLayerStorage {
  constructor() {
    // Layer 1: Memory Cache
    this.memoryCache = new LRUCache({
      maxSize: 50, // 50 documents
      ttl: 5 * 60 * 1000 // 5 minutes
    });
    
    // Layer 2: IndexedDB
    this.indexedDB = IndexedDBAdapter;
    
    // Layer 3: Supabase
    this.supabase = null;
    
    // Write queue for write-behind pattern
    this.writeQueue = new Map();
    this.writeTimeout = null;
    this.writeDelay = 3000; // 3 seconds
    
    // Sync state
    this.syncInProgress = false;
    this.conflictResolver = this.defaultConflictResolver.bind(this);
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      reads: 0,
      writes: 0
    };
  }

  async init(userId, useSupabase = true) {
    // Initialize IndexedDB
    await this.indexedDB.init();
    
    // Initialize Supabase if authenticated
    if (useSupabase && userId) {
      this.supabase = new SupabaseAdapterOptimized();
      // No init method needed for SupabaseAdapterOptimized
      
      // Start background sync
      this.startBackgroundSync();
    }
    
    this.userId = userId;
    console.log('MultiLayerStorage: Initialized with', useSupabase ? 'all layers' : 'local layers only');
  }

  /**
   * Read-Through Cache Pattern
   * Tries each layer in order, populating higher layers on the way back
   */
  async getDocument(documentId) {
    this.metrics.reads++;
    
    // Layer 1: Memory Cache
    let document = this.memoryCache.get(documentId);
    if (document) {
      this.metrics.cacheHits++;
      console.log('MultiLayerStorage: Memory cache hit');
      return document;
    }
    
    this.metrics.cacheMisses++;
    
    // Layer 2: IndexedDB
    try {
      document = await this.indexedDB.getDocument(documentId);
      if (document) {
        console.log('MultiLayerStorage: IndexedDB hit');
        // Verify integrity
        try {
          const verified = await dataIntegrityManager.verifyAfterLoad('document', document);
          this.memoryCache.set(documentId, verified);
          return verified;
        } catch (error) {
          console.error('Integrity check failed:', error);
          // Continue to next layer
        }
      }
    } catch (error) {
      console.error('IndexedDB read error:', error);
    }
    
    // Layer 3: Supabase
    if (this.supabase) {
      try {
        const documents = await this.supabase.getDocuments();
        document = documents.find(d => d.id === documentId);
        
        if (document) {
          console.log('MultiLayerStorage: Supabase hit');
          // Populate higher layers
          await this.indexedDB.saveDocument(document);
          this.memoryCache.set(documentId, document);
          return document;
        }
      } catch (error) {
        console.error('Supabase read error:', error);
      }
    }
    
    return null;
  }

  /**
   * Get all documents with multi-layer optimization
   */
  async getDocuments() {
    // Try to get from the most complete source
    if (this.supabase) {
      try {
        const documents = await this.supabase.getDocuments();
        
        // Update local layers in background
        this.updateLocalLayers(documents);
        
        return documents;
      } catch (error) {
        console.error('Supabase getDocuments error:', error);
        // Fall through to local storage
      }
    }
    
    // Fallback to IndexedDB
    return await this.indexedDB.getAllDocuments();
  }

  /**
   * Write-Behind Pattern
   * Writes to local layers immediately, queues for remote sync
   */
  async saveDocument(document, blocks) {
    this.metrics.writes++;
    
    // Acquire lock for this document
    return lockManager.withLock(`doc:${document.id}`, async () => {
      // Prepare data with integrity checks
      const preparedDoc = await dataIntegrityManager.prepareForSave('document', document);
      
      // Immediate write to memory and IndexedDB
      this.memoryCache.set(preparedDoc.id, preparedDoc);
      await this.indexedDB.saveDocument({ ...preparedDoc, blocks });
      
      // Emit immediate update event
      eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
        type: 'document',
        action: 'save',
        data: preparedDoc
      });
      
      // Queue for remote sync if available
      if (this.supabase) {
        this.queueWrite('document', preparedDoc.id, { document: preparedDoc, blocks });
      }
      
      return preparedDoc.id;
    }, { priority: 1, queue: true });
  }

  /**
   * Update a single block with write-behind
   */
  async updateBlock(documentId, blockId, updates) {
    // Get document from fastest source
    const document = await this.getDocument(documentId);
    if (!document) throw new Error('Document not found');
    
    // Update block
    const blockIndex = document.blocks?.findIndex(b => b.id === blockId);
    if (blockIndex !== -1) {
      document.blocks[blockIndex] = {
        ...document.blocks[blockIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Save through write-behind pattern
      await this.saveDocument(document, document.blocks);
    }
    
    return true;
  }

  /**
   * Queue write operation for batch processing
   */
  queueWrite(type, id, data) {
    const key = `${type}:${id}`;
    this.writeQueue.set(key, {
      type,
      id,
      data,
      timestamp: Date.now()
    });
    
    // Reset write timer
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    
    this.writeTimeout = setTimeout(() => {
      this.processWriteQueue();
    }, this.writeDelay);
  }

  /**
   * Process queued writes in batch
   */
  async processWriteQueue() {
    if (this.writeQueue.size === 0 || !this.supabase) return;
    
    const writes = Array.from(this.writeQueue.values());
    this.writeQueue.clear();
    
    console.log(`MultiLayerStorage: Processing ${writes.length} queued writes`);
    
    try {
      eventBus.emit(EVENT_TYPES.SYNC_STARTED, { count: writes.length });
      
      // Group writes by type
      const documentWrites = writes.filter(w => w.type === 'document');
      
      // Process document writes
      for (const write of documentWrites) {
        try {
          await this.supabase.saveDocument(
            write.data.document,
            write.data.blocks
          );
        } catch (error) {
          console.error('Write failed, re-queueing:', error);
          // Re-queue failed writes
          this.queueWrite(write.type, write.id, write.data);
        }
      }
      
      eventBus.emit(EVENT_TYPES.SYNC_COMPLETED, { count: writes.length });
      eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
      
    } catch (error) {
      console.error('Batch write failed:', error);
      eventBus.emit(EVENT_TYPES.SYNC_FAILED, { error });
      
      // Re-queue all writes
      writes.forEach(write => {
        this.queueWrite(write.type, write.id, write.data);
      });
    }
  }

  /**
   * Update local layers with remote data
   */
  async updateLocalLayers(documents) {
    // Don't block on this operation
    Promise.resolve().then(async () => {
      for (const doc of documents) {
        this.memoryCache.set(doc.id, doc);
        await this.indexedDB.saveDocument(doc);
      }
    });
  }

  /**
   * Background sync between layers
   */
  startBackgroundSync() {
    // Sync every 30 seconds if there are pending writes
    setInterval(() => {
      if (this.writeQueue.size > 0) {
        this.processWriteQueue();
      }
    }, 30000);
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('MultiLayerStorage: Back online, processing queue');
      this.processWriteQueue();
    });
  }

  /**
   * Default conflict resolver - last write wins
   */
  defaultConflictResolver(local, remote) {
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();
    
    return localTime > remoteTime ? local : remote;
  }

  /**
   * Set custom conflict resolver
   */
  setConflictResolver(resolver) {
    this.conflictResolver = resolver;
  }

  /**
   * Resolve conflicts between local and remote data
   */
  async resolveConflicts() {
    if (!this.supabase || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      // Get all local documents
      const localDocs = await this.indexedDB.getAllDocuments();
      
      // Get all remote documents
      const remoteDocs = await this.supabase.getDocuments();
      
      // Create maps for easy lookup
      const localMap = new Map(localDocs.map(d => [d.id, d]));
      const remoteMap = new Map(remoteDocs.map(d => [d.id, d]));
      
      // Find conflicts
      const conflicts = [];
      
      for (const [id, localDoc] of localMap) {
        const remoteDoc = remoteMap.get(id);
        
        if (remoteDoc && localDoc.updated_at !== remoteDoc.updated_at) {
          conflicts.push({ id, local: localDoc, remote: remoteDoc });
        }
      }
      
      // Resolve conflicts
      for (const conflict of conflicts) {
        const resolved = this.conflictResolver(conflict.local, conflict.remote);
        
        if (resolved === conflict.local) {
          // Local wins, update remote
          await this.supabase.saveDocument(resolved, resolved.blocks);
        } else {
          // Remote wins, update local
          await this.indexedDB.saveDocument(resolved);
          this.memoryCache.set(resolved.id, resolved);
        }
      }
      
      console.log(`MultiLayerStorage: Resolved ${conflicts.length} conflicts`);
      
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get storage metrics
   */
  getMetrics() {
    const hitRate = this.metrics.reads > 0 
      ? (this.metrics.cacheHits / this.metrics.reads * 100).toFixed(2)
      : 0;
      
    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      queuedWrites: this.writeQueue.size
    };
  }

  /**
   * Clear all layers
   */
  async clear() {
    this.memoryCache.clear();
    await this.indexedDB.clear();
    this.writeQueue.clear();
    
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
  }
}

// Create singleton
const multiLayerStorage = new MultiLayerStorage();

export default multiLayerStorage;