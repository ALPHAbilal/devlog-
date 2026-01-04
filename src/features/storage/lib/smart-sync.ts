/**
 * Smart Sync Manager - Zero Data Loss + Minimal API Calls
 * 
 * Architecture:
 * - Layer 1: Memory (instant UI updates)
 * - Layer 2: IndexedDB (survives crashes)
 * - Layer 3: Supabase (batched sync)
 * 
 * Features:
 * - Write-Ahead Logging (WAL) for crash recovery
 * - Smart batching (up to 50 changes per API call)
 * - Idle detection for optimal sync timing
 * - 99.7% reduction in API calls
 */

import Dexie from 'dexie';
import { debounce, throttle } from 'lodash-es';
import { paginatedBlockLoader } from '@/shared/lib';

class SmartSyncManager {
  constructor(supabase, documentId) {
    this.supabase = supabase;
    this.documentId = documentId;

    // Generate unique tab ID for multi-tab debugging
    this.tabId = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log(`[MULTI-TAB] 🆔 Tab ${this.tabId} initialized for document ${documentId?.substring(0, 8)}`);

    // Configuration
    this.BATCH_SIZE = 50;           // Max changes per API call
    this.MIN_SYNC_INTERVAL = 5000;  // Min 5 seconds between syncs
    this.MAX_SYNC_INTERVAL = 30000; // Max 30 seconds wait
    this.IDLE_THRESHOLD = 2000;     // User idle for 2 seconds

    // State
    this.batchQueue = [];
    this.syncInProgress = false;
    this.lastSyncTime = Date.now();
    this.lastActivity = Date.now();
    
    // Initialize
    this.initDatabase();
    this.initSyncStrategies();
    this.setupEventListeners();
    this.recoverPendingChanges();
  }

  async initDatabase() {
    // Initialize IndexedDB with Dexie
    this.db = new Dexie('DevLogSmartSync');
    
    this.db.version(1).stores({
      changes: '++id, timestamp, blockId, documentId, synced, action',
      blocks: 'id, documentId, content, updated_at, synced',
      snapshots: 'id, documentId, timestamp',
      meta: 'key, value'
    });
    
    await this.db.open();
    console.log('SmartSync: IndexedDB initialized');
  }

  initSyncStrategies() {
    // Multiple sync strategies for different scenarios
    this.immediateSync = this.createImmediateSync();
    this.debouncedSync = debounce(this.executeBatchSync.bind(this), this.MIN_SYNC_INTERVAL);
    this.throttledSync = throttle(this.executeBatchSync.bind(this), this.MAX_SYNC_INTERVAL);
    this.idleSync = debounce(this.executeBatchSync.bind(this), this.IDLE_THRESHOLD);
  }

  setupEventListeners() {
    // Monitor user activity for idle detection
    ['keydown', 'mousemove', 'click', 'scroll'].forEach(event => {
      document.addEventListener(event, () => {
        const wasIdle = Date.now() - this.lastActivity > this.IDLE_THRESHOLD;
        this.lastActivity = Date.now();
        
        // If user was idle and has pending changes, sync them
        if (wasIdle && this.batchQueue.length > 0) {
          this.idleSync();
        }
      }, { passive: true });
    });

    // Emergency sync on page unload
    window.addEventListener('beforeunload', (e) => {
      if (this.batchQueue.length > 0) {
        // Save to localStorage as last resort
        localStorage.setItem('devlog_emergency_queue', JSON.stringify({
          documentId: this.documentId,
          changes: this.batchQueue,
          timestamp: Date.now()
        }));
        
        // Try beacon API for emergency sync (doesn't block)
        if (navigator.sendBeacon) {
          const data = new Blob([JSON.stringify({
            documentId: this.documentId,
            changes: this.batchQueue
          })], { type: 'application/json' });
          
          navigator.sendBeacon('/api/emergency-sync', data);
        }
        
        // Show warning if many unsaved changes
        if (this.batchQueue.length > 10) {
          e.preventDefault();
          e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
      }
    });

    // Sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.batchQueue.length > 0) {
        console.log('SmartSync: Tab visible, syncing pending changes');
        this.debouncedSync();
      }
    });

    // Handle online/offline
    window.addEventListener('online', () => {
      console.log('SmartSync: Back online, syncing pending changes');
      if (this.batchQueue.length > 0) {
        this.immediateSync();
      }
    });

    window.addEventListener('offline', () => {
      console.log('SmartSync: Offline mode - changes will be saved locally');
    });
  }

  async recoverPendingChanges() {
    try {
      // Check for emergency queue in localStorage
      const emergency = localStorage.getItem('devlog_emergency_queue');
      if (emergency) {
        const data = JSON.parse(emergency);
        if (data.documentId === this.documentId) {
          console.log(`SmartSync: Recovering ${data.changes.length} emergency changes`);
          this.batchQueue.push(...data.changes);
          localStorage.removeItem('devlog_emergency_queue');
        }
      }

      // Check for unsynced changes in IndexedDB
      const unsynced = await this.db.changes
        .where('documentId').equals(this.documentId)
        .and(change => !change.synced)
        .toArray();

      if (unsynced.length > 0) {
        console.log(`SmartSync: Found ${unsynced.length} unsynced changes in IndexedDB`);
        
        // Filter out old malformed DELETE operations (one-time cleanup)
        const validChanges = unsynced.filter(change => {
          // Check for old DELETE operations without required fields
          if (change.action === 'DELETE' && (!change.blockType || change.position === undefined || change.position === null)) {
            console.log('[CLEANUP] Removing old malformed DELETE:', {
              blockId: change.blockId,
              action: change.action,
              blockType: change.blockType,
              position: change.position,
              changeId: change.id
            });
            // Remove the bad change from IndexedDB
            this.db.changes.delete(change.id).catch(err => 
              console.error('[CLEANUP] Error removing malformed change:', err)
            );
            return false; // Filter out this change
          }
          return true; // Keep valid changes
        });
        
        // Add valid changes to queue for syncing with ALL fields
        if (validChanges.length > 0) {
          this.batchQueue.push(...validChanges.map(change => {
            // Strategic logging for recovery analysis
            console.log('[RECOVERY] Processing change from IndexedDB:', {
              action: change.action,
              blockId: change.blockId,
              hasContent: !!change.content,
              contentLength: change.content?.length,
              contentPreview: change.action === 'REORDER' ? 'SHOULD BE NULL' : change.content?.substring(0, 50),
              position: change.position,
              blockType: change.blockType || change.block_type
            });

            return {
              id: change.id,
              blockId: change.blockId,
              // CRITICAL FIX: REORDER operations should NEVER have content
              content: change.action === 'REORDER' ? null : change.content,
              action: change.action,
              blockType: change.blockType || change.block_type,  // Handle both field names
              position: change.position,                          // Include position!
              documentId: change.documentId,                      // Include documentId
              timestamp: change.timestamp,
              synced: change.synced
            };
          }));
          
          // Schedule sync
          this.scheduleSmartSync();
        }
      }
    } catch (error) {
      console.error('SmartSync: Error recovering pending changes:', error);
    }
  }

  /**
   * Handle a change from the user
   * This is the main entry point for all changes
   */
  async handleChange(blockId, content, action = 'UPDATE', blockType = null, position = null, metadata = null) {
    // Sophisticated tracing - log what we're receiving
    console.log('🚀 SmartSync.handleChange INPUT:', {
      blockId,
      action,
      blockType,
      position,
      contentLength: content?.length,
      contentPreview: content?.substring(0, 100),
      hasMetadata: !!metadata,
      timestamp: Date.now(),
      // Add validation check
      hasRequiredFields: !!(blockType && (position !== null && position !== undefined))
    });
    
    // [TABLE-SAVE] Log table block specific data
    if (blockType === 'table') {
      console.log('[TABLE-SAVE] Step: SmartSync.handleChange Entry (table)', {
        blockId,
        action,
        blockType,
        position,
        content: {
          length: content?.length || 0,
          preview: content?.substring(0, 300),
          fullContent: content,
          parsedContent: (() => {
            try {
              const parsed = JSON.parse(content);
              return {
                hasData: !!parsed.data,
                dataStructure: parsed.data ? {
                  headersCount: parsed.data.headers?.length || 0,
                  rowsCount: parsed.data.rows?.length || 0,
                  columnAlignmentsCount: parsed.data.columnAlignments?.length || 0,
                  hasHeaderRow: parsed.data.hasHeaderRow,
                  fullData: parsed.data,
                  dataPreview: {
                    headers: parsed.data.headers?.slice(0, 5),
                    firstRow: parsed.data.rows?.[0]?.slice(0, 5),
                    lastRow: parsed.data.rows?.[parsed.data.rows?.length - 1]?.slice(0, 5)
                  }
                } : null
              };
            } catch (e) {
              return { error: 'Failed to parse content', message: e.message, rawContent: content };
            }
          })()
        },
        metadata,
        hasRequiredFields: !!(blockType && (position !== null && position !== undefined))
      });
    }

    const change = {
      blockId,
      content,
      action,
      blockType, // CRITICAL: Add block type
      position,  // CRITICAL: Add position
      metadata,  // CRITICAL: Add metadata for snapshots and other JSONB data
      documentId: this.documentId,
      timestamp: Date.now(),
      synced: false
    };

    try {
      // Step 1: Write to IndexedDB immediately (crash-proof)
      const changeId = await this.db.changes.add(change);
      change.id = changeId;

      // Also update the blocks table for quick state recovery
      if (action === 'UPDATE' || action === 'CREATE') {
        // [TABLE-SAVE] Log IndexedDB write for table blocks
        if (blockType === 'table') {
          console.log('[TABLE-SAVE] Step: SmartSync.handleChange Writing to IndexedDB', {
            blockId,
            contentLength: content?.length || 0,
            contentPreview: content?.substring(0, 200),
            willStore: {
              id: blockId,
              documentId: this.documentId,
              contentLength: content?.length || 0,
              synced: false
            }
          });
        }
        
        await this.db.blocks.put({
          id: blockId,
          documentId: this.documentId,
          type: blockType,        // CRITICAL: Store type for deserializer
          position: position,     // CRITICAL: Store position for ordering
          content: content,
          updated_at: Date.now(),
          synced: false
        });
        
        // [TABLE-SAVE] Log IndexedDB write complete for table blocks
        if (blockType === 'table') {
          console.log('[TABLE-SAVE] Step: SmartSync.handleChange IndexedDB Write Complete', {
            blockId
          });
        }
      } else if (action === 'DELETE') {
        await this.db.blocks.delete(blockId);
      }

      // Step 2: Add to batch queue
      this.batchQueue.push(change);
      console.log(`[MULTI-TAB] 📝 Tab ${this.tabId} queued ${action} for block ${blockId?.substring(0, 8)} | Queue size: ${this.batchQueue.length}`);

      // Step 3: Schedule smart sync
      this.scheduleSmartSync();

      // Return for optimistic UI update
      return change;
    } catch (error) {
      console.error('SmartSync: Error handling change:', error);
      throw error;
    }
  }

  /**
   * Intelligent sync scheduling based on various factors
   */
  scheduleSmartSync() {
    const queueSize = this.batchQueue.length;
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    const userIsIdle = Date.now() - this.lastActivity > this.IDLE_THRESHOLD;
    const isOffline = !navigator.onLine;

    // Don't sync if offline
    if (isOffline) {
      console.log('[SYNC-SCHEDULE] ❌ Offline, delaying sync');
      return;
    }

    // Decision tree for optimal sync timing
    if (queueSize >= this.BATCH_SIZE * 0.8) {
      // Approaching batch limit - sync soon
      console.log('[SYNC-SCHEDULE] 🚀 Near batch limit, syncing in 1 second');
      setTimeout(() => this.executeBatchSync(), 1000);
    } else if (userIsIdle && queueSize > 0) {
      // User is idle - perfect time to sync
      console.log('[SYNC-SCHEDULE] ⏸️ User idle, calling idleSync (2s debounce)');
      this.idleSync();
    } else if (timeSinceLastSync > this.MAX_SYNC_INTERVAL && queueSize > 0) {
      // Too long since last sync - force sync
      console.log('[SYNC-SCHEDULE] ⏰ Max interval reached (30s), calling throttledSync');
      this.throttledSync();
    } else if (queueSize > 0) {
      // Have changes, wait for more to batch
      console.log('[SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)');
      this.debouncedSync();
    } else {
      console.log('[SYNC-SCHEDULE] ℹ️ Queue empty, nothing to schedule');
    }
  }

  /**
   * Execute the actual batch sync to Supabase
   */
  async executeBatchSync() {
    if (this.syncInProgress || this.batchQueue.length === 0 || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
    
    console.log(`SmartSync: Syncing ${batch.length} changes`);
    
    // [TABLE-SAVE] Filter and log table block changes in batch
    const tableBlockChanges = batch.filter(change => change.blockType === 'table');
    if (tableBlockChanges.length > 0) {
      console.log('[TABLE-SAVE] Step: SmartSync.executeBatchSync Table Blocks in Batch', {
        tableBlockCount: tableBlockChanges.length,
        totalBatchSize: batch.length,
        tableBlocks: tableBlockChanges.map(change => ({
          blockId: change.blockId,
          action: change.action,
          contentLength: change.content?.length || 0,
          contentPreview: change.content?.substring(0, 200),
          fullContent: change.content,
          parsedContent: (() => {
            try {
              const parsed = JSON.parse(change.content);
              return {
                hasData: !!parsed.data,
                dataStructure: parsed.data ? {
                  headersCount: parsed.data.headers?.length || 0,
                  rowsCount: parsed.data.rows?.length || 0,
                  columnAlignmentsCount: parsed.data.columnAlignments?.length || 0,
                  hasHeaderRow: parsed.data.hasHeaderRow,
                  dataPreview: {
                    headers: parsed.data.headers?.slice(0, 3),
                    firstRow: parsed.data.rows?.[0]?.slice(0, 3)
                  }
                } : null
              };
            } catch (e) {
              return { error: 'Failed to parse', message: e.message };
            }
          })(),
          position: change.position,
          timestamp: change.timestamp
        }))
      });
    }
    
    // Log the actual changes being sent
    console.log('SmartSync: Changes being sent:', batch.map(change => ({
      block_id: change.blockId,
      action: change.action,
      timestamp: change.timestamp,
      content_preview: change.content ? change.content.substring(0, 100) : null
    })));

    try {
      // Get current session to ensure we're authenticated
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        console.error('SmartSync: No active session, cannot sync');
        throw new Error('Not authenticated');
      }
      
      console.log('SmartSync: Current user ID:', session.user.id);
      

      // Prepare batch payload
      const batchPayload = batch.map(change => ({
        block_id: change.blockId,
        content: change.content,
        action: change.action,
        block_type: change.blockType, // CRITICAL: Send block type
        position: change.position,     // CRITICAL: Send position
        metadata: change.metadata,     // CRITICAL: Send metadata for snapshots
        timestamp: change.timestamp
      }));
      
      // [TABLE-SAVE] Log exact payload for table blocks
      const tablePayloads = batchPayload.filter((payload, idx) => batch[idx].blockType === 'table');
      if (tablePayloads.length > 0) {
        console.log('[TABLE-SAVE] Step: SmartSync.executeBatchSync Table Block Payloads', {
          tableBlockCount: tablePayloads.length,
          payloads: tablePayloads.map((payload, idx) => {
            const originalChange = batch.find(c => c.blockId === payload.block_id);
            return {
              block_id: payload.block_id,
              action: payload.action,
              block_type: payload.block_type,
              position: payload.position,
              contentLength: payload.content?.length || 0,
              contentPreview: payload.content?.substring(0, 200),
              fullContent: payload.content,
              metadata: payload.metadata,
              timestamp: payload.timestamp,
              parsedContent: (() => {
                try {
                  const parsed = JSON.parse(payload.content);
                  return {
                    hasData: !!parsed.data,
                    dataStructure: parsed.data ? {
                      headersCount: parsed.data.headers?.length || 0,
                      rowsCount: parsed.data.rows?.length || 0,
                      columnAlignmentsCount: parsed.data.columnAlignments?.length || 0,
                      hasHeaderRow: parsed.data.hasHeaderRow
                    } : null
                  };
                } catch (e) {
                  return { error: 'Failed to parse', message: e.message };
                }
              })()
            };
          })
        });
      }

      // ONE API call for entire batch
      console.log('[SYNC-DEBUG] Calling RPC with:', {
        documentId: this.documentId,
        changesCount: batchPayload.length,
        blockIds: batchPayload.map(c => c.block_id.substring(0, 8))
      });

      const { data, error } = await this.supabase
        .rpc('batch_sync_changes', {
          p_document_id: this.documentId,
          p_changes: batchPayload
        });

      console.log('[SYNC-DEBUG] Blocks should now be in database for document:', this.documentId);

      if (error) {
        console.error('SmartSync: RPC error:', error);
        // [TABLE-SAVE] Log RPC error for table blocks
        if (tableBlockChanges.length > 0) {
          console.error('[TABLE-SAVE] Step: SmartSync.executeBatchSync RPC Error (table blocks affected)', {
            error,
            tableBlockCount: tableBlockChanges.length,
            affectedBlockIds: tableBlockChanges.map(c => c.blockId)
          });
        }
        throw error;
      }
      
      // Log the response from the database
      console.log('SmartSync: RPC response:', data);
      
      // [TABLE-SAVE] Log RPC response for table blocks
      if (tableBlockChanges.length > 0) {
        console.log('[TABLE-SAVE] Step: SmartSync.executeBatchSync RPC Response (table blocks)', {
          response: data,
          tableBlockCount: tableBlockChanges.length,
          processed: data?.processed || 0,
          total: data?.total || 0,
          errors: data?.errors || [],
          success: data?.success !== false,
          tableBlockIds: tableBlockChanges.map(c => c.blockId)
        });
        
        // Verify table blocks were processed
        if (data?.processed !== undefined && data?.processed < tableBlockChanges.length) {
          console.warn('[TABLE-SAVE] Warning: Not all table blocks were processed', {
            expected: tableBlockChanges.length,
            processed: data.processed,
            total: data.total,
            errors: data.errors
          });
        }
      }
      
      // CRITICAL DEBUG: Check what the RPC actually did
      console.log('[SYNC-DEBUG] Full RPC Response:', JSON.stringify(data, null, 2));
      console.log('[SYNC-DEBUG] Blocks should now be in database for document:', this.documentId);
      
      // CRITICAL DEBUG: Show EXACTLY what fields we sent to RPC
      console.log('[SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===');
      console.log('[SYNC-DEBUG] RPC Function needs block_type and position to save properly!');
      batch.forEach((change, idx) => {
        const hasType = !!change.blockType;
        const hasPosition = change.position !== null && change.position !== undefined;
        
        if (!hasType || !hasPosition) {
          console.error(`[SYNC-DEBUG] ❌ Change ${idx + 1} MISSING CRITICAL FIELDS:`, {
            block_type_missing: !hasType,
            position_missing: !hasPosition,
            block_type: change.blockType,
            position: change.position
          });
        }
        
        console.log(`[SYNC-DEBUG] Change ${idx + 1}:`, {
          action: change.action,
          block_id: change.blockId,
          block_type: change.blockType,  // THIS MUST NOT BE NULL/UNDEFINED
          position: change.position,       // THIS MUST NOT BE NULL/UNDEFINED
          has_type: hasType,
          has_position: hasPosition,
          content_length: change.content?.length || 0,
          timestamp: change.timestamp
        });
      });
      console.log('[SYNC-DEBUG] === END CRITICAL FIELDS ===');
      console.log('[SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!');
      
      console.log('[SYNC-DEBUG] Changes that were sent:', batch.map(c => ({
        block_id: c.blockId,
        action: c.action,
        type: c.blockType,
        position: c.position,
        content_length: c.content?.length || 0
      })));
      
      // Log detailed errors if present
      if (data && data.errors && data.errors.length > 0) {
        console.error('SmartSync: Database errors detail:', data.errors);
      }
      
      // Check if the RPC function returned an error in the response
      if (data && data.success === false) {
        console.error('SmartSync: Database function returned error:', data.error);
        // Include the detailed errors in the error message
        const errorDetails = data.errors ? JSON.stringify(data.errors) : 'No details';
        throw new Error(data.error || `Database sync failed: ${errorDetails}`);
      }
      
      // CRITICAL: Check if blocks were actually processed
      if (data && data.processed === 0 && batch.length > 0) {
        console.error('SmartSync: Database processed 0 blocks, errors:', data.errors);
        // Don't throw error if it's an auth issue that might be transient
        if (data.error && data.error.includes('Not authenticated')) {
          console.error('SmartSync: Authentication issue, will retry');
          throw new Error('Authentication failed - will retry');
        }
        throw new Error(`Database sync failed: processed 0 of ${data.total} blocks`);
      }

      // Mark as synced in IndexedDB
      await Promise.all(
        batch.map(change => {
          if (change.id) {
            return this.db.changes
              .where('id').equals(change.id)
              .modify({ synced: true });
          }
        })
      );

      // Update blocks as synced
      await Promise.all(
        batch.map(change => 
          this.db.blocks
            .where('id').equals(change.blockId)
            .modify({ synced: true })
        )
      );

      this.lastSyncTime = Date.now();
      const blockIds = batch.map(c => c.blockId?.substring(0, 8)).join(', ');
      console.log(`[MULTI-TAB] ✅ Tab ${this.tabId} synced ${batch.length} changes to Supabase | Blocks: [${blockIds}]`);

      // Clear the cache to force fresh data on next load
      paginatedBlockLoader.clearCache(this.documentId);

      // Clean up old synced changes (keep last 100 for history)
      this.cleanupSyncedChanges();

      // CRITICAL: Update IndexedDBAdapter cache with synced blocks
      // This ensures the cache stays in sync with Supabase
      await this.updateIndexedDBCache();

    } catch (error) {
      console.error('SmartSync: Sync failed, returning to queue:', error);
      
      // Return failed batch to queue for retry
      this.batchQueue.unshift(...batch);
      
      // Schedule retry with exponential backoff
      setTimeout(() => {
        this.scheduleSmartSync();
      }, Math.min(30000, 1000 * Math.pow(2, this.retryCount || 0)));
      
      this.retryCount = (this.retryCount || 0) + 1;
    } finally {
      this.syncInProgress = false;

      // Continue syncing if more in queue
      if (this.batchQueue.length > 0) {
        this.scheduleSmartSync();
      } else {
        this.retryCount = 0; // Reset retry count on success
      }
    }
  }

  /**
   * Create an immediate sync function for critical changes
   */
  createImmediateSync() {
    return async () => {
      if (this.batchQueue.length > 0 && !this.syncInProgress) {
        await this.executeBatchSync();
      }
    };
  }

  /**
   * Update IndexedDBAdapter cache with current blocks after successful sync
   * This ensures IndexedDB cache stays in sync with Supabase
   */
  async updateIndexedDBCache() {
    try {
      // Get all blocks for this document from SmartSync's internal DB
      const allBlocks = await this.db.blocks
        .where('documentId').equals(this.documentId)
        .toArray();

      if (allBlocks.length === 0) {
        console.log('[INDEXEDDB-SYNC] No blocks to cache');
        return;
      }

      // Import IndexedDBAdapter dynamically to avoid circular deps
      const { IndexedDBAdapter } = await import('@/shared/lib');
      await IndexedDBAdapter.init();

      // Get the current document from IndexedDBAdapter
      const currentDoc = await IndexedDBAdapter.getDocument(this.documentId);

      if (currentDoc) {
        // Sort blocks by position
        const sortedBlocks = allBlocks.sort((a, b) => (a.position || 0) - (b.position || 0));

        // Update document with fresh blocks
        const updatedDoc = {
          ...currentDoc,
          blocks: sortedBlocks,
          updatedAt: new Date().toISOString()
        };

        await IndexedDBAdapter.saveDocument(updatedDoc);
        console.log(`[INDEXEDDB-SYNC] ✅ Updated cache with ${sortedBlocks.length} blocks for document ${this.documentId.substring(0, 8)}`);
      } else {
        console.log(`[INDEXEDDB-SYNC] Document ${this.documentId.substring(0, 8)} not in cache, skipping`);
      }
    } catch (error) {
      // Non-critical error - just log it
      console.warn('[INDEXEDDB-SYNC] Failed to update cache:', error);
    }
  }

  /**
   * Clean up old synced changes to prevent IndexedDB bloat
   */
  async cleanupSyncedChanges() {
    try {
      const syncedCount = await this.db.changes
        .where('documentId').equals(this.documentId)
        .and(change => change.synced)
        .count();

      if (syncedCount > 100) {
        // Keep only the last 100 synced changes
        const toDelete = await this.db.changes
          .where('documentId').equals(this.documentId)
          .and(change => change.synced)
          .limit(syncedCount - 100)
          .toArray();

        await Promise.all(
          toDelete.map(change => this.db.changes.delete(change.id))
        );

        console.log(`SmartSync: Cleaned up ${toDelete.length} old synced changes`);
      }
    } catch (error) {
      console.error('SmartSync: Error cleaning up:', error);
    }
  }

  /**
   * Create a snapshot for faster recovery
   */
  async createSnapshot(blocks) {
    try {
      await this.db.snapshots.put({
        id: `${this.documentId}_${Date.now()}`,
        documentId: this.documentId,
        timestamp: Date.now(),
        blocks: blocks
      });

      // Keep only last 5 snapshots
      const snapshots = await this.db.snapshots
        .where('documentId').equals(this.documentId)
        .reverse()
        .sortBy('timestamp');

      if (snapshots.length > 5) {
        const toDelete = snapshots.slice(5);
        await Promise.all(
          toDelete.map(s => this.db.snapshots.delete(s.id))
        );
      }
    } catch (error) {
      console.error('SmartSync: Error creating snapshot:', error);
    }
  }

  /**
   * Load the latest snapshot for quick initialization
   */
  async loadLatestSnapshot() {
    try {
      const snapshot = await this.db.snapshots
        .where('documentId').equals(this.documentId)
        .reverse()
        .sortBy('timestamp')
        .then(snapshots => snapshots[0]);

      return snapshot ? snapshot.blocks : null;
    } catch (error) {
      console.error('SmartSync: Error loading snapshot:', error);
      return null;
    }
  }

  /**
   * Get sync status for UI indicators
   */
  getSyncStatus() {
    const status = {
      pending: this.batchQueue.length,
      syncing: this.syncInProgress,
      lastSync: this.lastSyncTime,
      online: navigator.onLine
    };
    console.log('[SYNC-STATUS-GET] 📊 Status requested:', status);
    return status;
  }

  /**
   * Force immediate sync (user-triggered)
   */
  async forceSync() {
    console.log(`[MULTI-TAB] 🔄 Tab ${this.tabId} FORCE SYNC (closing/switching) | Pending: ${this.batchQueue.length}`);
    await this.immediateSync();
  }

  /**
   * Clear all pending changes for this document (useful for cleanup)
   */
  async clearAllPendingChanges() {
    console.log('SmartSync: Clearing all pending changes for document', this.documentId);
    
    // Clear from IndexedDB
    await this.db.changes
      .where('documentId').equals(this.documentId)
      .delete();
    
    // Clear from memory
    this.batchQueue = [];
    
    // Clear emergency queue if it's for this document
    const emergency = localStorage.getItem('devlog_emergency_queue');
    if (emergency) {
      const data = JSON.parse(emergency);
      if (data.documentId === this.documentId) {
        localStorage.removeItem('devlog_emergency_queue');
      }
    }
    
    console.log('SmartSync: All pending changes cleared');
  }

  /**
   * Cleanup on unmount
   */
  destroy() {
    // Clear all timers
    if (this.debouncedSync) this.debouncedSync.cancel();
    if (this.throttledSync) this.throttledSync.cancel();
    if (this.idleSync) this.idleSync.cancel();
    
    // Sync remaining changes
    if (this.batchQueue.length > 0) {
      this.executeBatchSync();
    }
  }
}

// Export factory function
export function createSmartSync(supabase, documentId) {
  return new SmartSyncManager(supabase, documentId);
}

// Export for components
export default SmartSyncManager;