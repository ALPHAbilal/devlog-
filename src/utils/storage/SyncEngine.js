import eventBus, { EVENT_TYPES } from '../eventBus';
import multiLayerStorage from './MultiLayerStorage';
import IndexedDBAdapter from './IndexedDBAdapter';

/**
 * Advanced Sync Engine
 * 
 * Features:
 * - Offline queue management
 * - Automatic retry with exponential backoff
 * - Batch synchronization
 * - Delta sync for efficiency
 * - Conflict detection and resolution
 */
export class SyncEngine {
  constructor() {
    this.offlineQueue = [];
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.baseRetryDelay = 1000; // 1 second
    
    // Sync state
    this.pendingChanges = new Map();
    this.conflictLog = [];
    
    // Performance tracking
    this.syncMetrics = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsResolved: 0,
      averageSyncTime: 0
    };
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('SyncEngine: Device online, starting sync');
      this.sync();
    });
    
    window.addEventListener('offline', () => {
      console.log('SyncEngine: Device offline');
    });
    
    // Listen for storage changes
    eventBus.on(EVENT_TYPES.STORAGE_CHANGED, (event) => {
      this.trackChange(event);
    });
    
    // Periodic sync every 5 minutes
    setInterval(() => {
      if (navigator.onLine && this.pendingChanges.size > 0) {
        this.sync();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Track changes for delta sync
   */
  trackChange(event) {
    const { type, action, data } = event;
    const key = `${type}:${data.id || data}`;
    
    this.pendingChanges.set(key, {
      type,
      action,
      data,
      timestamp: Date.now()
    });
    
    // Queue for offline sync if offline
    if (!navigator.onLine) {
      this.queueOfflineAction(event);
    }
  }

  /**
   * Queue action for offline processing
   */
  queueOfflineAction(action) {
    this.offlineQueue.push({
      ...action,
      queuedAt: Date.now()
    });
    
    // Save queue to IndexedDB for persistence
    this.persistOfflineQueue();
  }

  /**
   * Main sync method
   */
  async sync() {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }
    
    this.syncInProgress = true;
    const syncStartTime = Date.now();
    
    try {
      eventBus.emit(EVENT_TYPES.SYNC_STARTED);
      
      // Process offline queue first
      if (this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }
      
      // Perform delta sync
      await this.deltaSync();
      
      // Resolve any conflicts
      await this.resolveConflicts();
      
      // Update metrics
      const syncTime = Date.now() - syncStartTime;
      this.updateMetrics(true, syncTime);
      
      this.lastSyncTime = Date.now();
      this.retryAttempts = 0;
      
      eventBus.emit(EVENT_TYPES.SYNC_COMPLETED, {
        duration: syncTime,
        changesSynced: this.pendingChanges.size
      });
      
      // Clear pending changes
      this.pendingChanges.clear();
      
    } catch (error) {
      console.error('SyncEngine: Sync failed', error);
      this.updateMetrics(false);
      
      eventBus.emit(EVENT_TYPES.SYNC_FAILED, { error });
      
      // Retry with exponential backoff
      this.scheduleRetry();
      
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    console.log(`SyncEngine: Processing ${this.offlineQueue.length} offline actions`);
    
    const failedActions = [];
    
    for (const action of this.offlineQueue) {
      try {
        await this.processOfflineAction(action);
      } catch (error) {
        console.error('Failed to process offline action:', error);
        failedActions.push(action);
      }
    }
    
    // Keep failed actions for retry
    this.offlineQueue = failedActions;
    
    if (failedActions.length > 0) {
      this.persistOfflineQueue();
    } else {
      this.clearOfflineQueue();
    }
  }

  /**
   * Process single offline action
   */
  async processOfflineAction(action) {
    const { type, data } = action;
    
    switch (type) {
      case 'document':
        if (action.action === 'save') {
          await multiLayerStorage.saveDocument(data.document, data.blocks);
        } else if (action.action === 'delete') {
          await multiLayerStorage.supabase?.deleteDocument(data.id);
        }
        break;
        
      case 'block':
        if (action.action === 'update') {
          await multiLayerStorage.updateBlock(
            data.documentId,
            data.blockId,
            data.updates
          );
        }
        break;
    }
  }

  /**
   * Delta sync - only sync changes since last sync
   */
  async deltaSync() {
    if (!multiLayerStorage.supabase || this.pendingChanges.size === 0) {
      return;
    }
    
    console.log(`SyncEngine: Delta sync for ${this.pendingChanges.size} changes`);
    
    // Group changes by document
    const documentChanges = new Map();
    
    for (const [key, change] of this.pendingChanges) {
      if (change.type === 'document') {
        documentChanges.set(change.data.id, change);
      }
    }
    
    // Sync document changes
    for (const [docId, change] of documentChanges) {
      try {
        if (change.action === 'save') {
          await multiLayerStorage.processWriteQueue();
        } else if (change.action === 'delete') {
          await multiLayerStorage.supabase.deleteDocument(docId);
        }
      } catch (error) {
        console.error(`Failed to sync document ${docId}:`, error);
        throw error;
      }
    }
  }

  /**
   * Resolve conflicts
   */
  async resolveConflicts() {
    try {
      await multiLayerStorage.resolveConflicts();
      
      // Log resolved conflicts
      const conflicts = multiLayerStorage.getMetrics().conflictsResolved || 0;
      if (conflicts > 0) {
        this.syncMetrics.conflictsResolved += conflicts;
        this.conflictLog.push({
          timestamp: Date.now(),
          count: conflicts
        });
      }
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  }

  /**
   * Schedule retry with exponential backoff
   */
  scheduleRetry() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      console.error('SyncEngine: Max retry attempts reached');
      return;
    }
    
    this.retryAttempts++;
    const delay = this.baseRetryDelay * Math.pow(2, this.retryAttempts - 1);
    
    console.log(`SyncEngine: Retrying in ${delay}ms (attempt ${this.retryAttempts})`);
    
    setTimeout(() => {
      this.sync();
    }, delay);
  }

  /**
   * Update sync metrics
   */
  updateMetrics(success, syncTime = 0) {
    this.syncMetrics.totalSyncs++;
    
    if (success) {
      this.syncMetrics.successfulSyncs++;
      
      // Update average sync time
      const currentAvg = this.syncMetrics.averageSyncTime;
      const totalSyncs = this.syncMetrics.successfulSyncs;
      this.syncMetrics.averageSyncTime = 
        (currentAvg * (totalSyncs - 1) + syncTime) / totalSyncs;
    } else {
      this.syncMetrics.failedSyncs++;
    }
  }

  /**
   * Persist offline queue to IndexedDB
   */
  async persistOfflineQueue() {
    try {
      await IndexedDBAdapter.setItem('offlineQueue', this.offlineQueue);
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Load offline queue from IndexedDB
   */
  async loadOfflineQueue() {
    try {
      const queue = await IndexedDBAdapter.getItem('offlineQueue');
      if (queue) {
        this.offlineQueue = queue;
        console.log(`SyncEngine: Loaded ${queue.length} offline actions`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  async clearOfflineQueue() {
    this.offlineQueue = [];
    try {
      await IndexedDBAdapter.removeItem('offlineQueue');
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      online: navigator.onLine,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.pendingChanges.size,
      offlineQueueSize: this.offlineQueue.length,
      metrics: this.syncMetrics
    };
  }

  /**
   * Force sync
   */
  forceSync() {
    this.retryAttempts = 0;
    return this.sync();
  }

  /**
   * Initialize sync engine
   */
  async init() {
    // Load offline queue from storage
    await this.loadOfflineQueue();
    
    // Start initial sync if online
    if (navigator.onLine) {
      this.sync();
    }
  }
}

// Create singleton
const syncEngine = new SyncEngine();

export default syncEngine;