// src/shared/db/rxdb-replication.ts
/**
 * Supabase Replication for RxDB
 *
 * Uses official replicateSupabase plugin.
 * Includes workarounds for known bugs (Jan 2025):
 * - Bug #7513: push.modifier not called → Use pre-insert hooks
 * - Bug #7612: Deletion fails for unsynced docs → Track sync state
 *
 * CRITICAL: Uses singleton Supabase client from @/shared/api
 * Creating multiple clients causes GoTrueClient conflicts and breaks realtime.
 *
 * Reference: resources/rxdb-migration-guide.md Part 2
 */

import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import type { RxReplicationState } from 'rxdb/plugins/replication';
import type { RxCollection } from 'rxdb';
import { supabase } from '@/shared/api'; // Use SINGLETON client - DO NOT create new client!
import type { DevlogDatabase } from './rxdb';

// Verify client is ready
console.log('[RxDB Replication] Using singleton client');
console.log('[RxDB Replication] Client channel method:', typeof supabase.channel);
console.log('[RxDB Replication] Realtime available:', typeof supabase.realtime);

// =============================================================================
// WebSocket Ready Check (Fix for "channel undefined" race condition)
// =============================================================================

/**
 * CRITICAL FIX: Ensure Supabase Realtime WebSocket is fully connected.
 *
 * ROOT CAUSE EXPLAINED:
 * In Supabase JS v2, `supabase.realtime.socket` is NOT created when you call `createClient()`.
 * The WebSocket is LAZY INITIALIZED - it only gets created when you SUBSCRIBE to a channel.
 *
 * Our previous fix (polling for socket.readyState) failed because the socket NEVER EXISTS
 * until we subscribe to something.
 *
 * SOLUTION: Create and subscribe to a test channel to force WebSocket initialization,
 * wait for SUBSCRIBED status, then clean up the test channel.
 *
 * @param timeoutMs Maximum time to wait (default 10 seconds)
 * @returns true if ready, false if timeout/error
 */
export async function ensureSupabaseRealtimeReady(timeoutMs = 10000): Promise<boolean> {
  console.log('[RxDB Replication] 🔌 Initializing Supabase Realtime...');

  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    // Create unique channel name for this initialization
    const testChannelName = `rxdb-init-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Create test channel - THIS triggers WebSocket creation
    const testChannel = supabase.channel(testChannelName);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[RxDB Replication] ⚠️ Realtime initialization timeout');
        // Clean up
        testChannel.unsubscribe().catch(() => {});
        supabase.removeChannel(testChannel).catch(() => {});
        resolve(false);
      }
    }, timeoutMs);

    // Subscribe to trigger WebSocket connection
    testChannel
      .on('system', { event: '*' }, () => {
        // System events indicate connection is working
      })
      .subscribe((status, err) => {
        const elapsed = Date.now() - startTime;
        console.log(`[RxDB Replication] 📡 Channel status: ${status} (${elapsed}ms)`);

        if (status === 'SUBSCRIBED') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.log('[RxDB Replication] ✅ Realtime WebSocket connected and ready!');

            // Clean up test channel (async, don't wait)
            setTimeout(() => {
              testChannel.unsubscribe().catch(() => {});
              supabase.removeChannel(testChannel).catch(() => {});
              console.log('[RxDB Replication] 🧹 Test channel cleaned up');
            }, 100);

            resolve(true);
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            console.error('[RxDB Replication] ❌ Realtime connection failed:', status, err);
            // Clean up
            testChannel.unsubscribe().catch(() => {});
            supabase.removeChannel(testChannel).catch(() => {});
            resolve(false);
          }
        }
        // CLOSED status is expected after unsubscribe, ignore it
      });
  });
}

// Legacy function kept for backwards compatibility - redirects to new implementation
export async function waitForRealtimeReady(maxWaitMs = 10000): Promise<boolean> {
  return ensureSupabaseRealtimeReady(maxWaitMs);
}

// Legacy function - no longer needed but kept for compatibility
export function forceRealtimeConnect(): void {
  console.log('[RxDB Replication] forceRealtimeConnect() called - now handled by ensureSupabaseRealtimeReady()');
}

// =============================================================================
// Sync State Tracking (Workaround for Bug #7612)
// =============================================================================

/**
 * Track which documents have been successfully synced to the server.
 * This prevents deletion errors for documents that were created offline
 * and deleted before ever being synced.
 */
const syncedDocuments = new Map<string, Set<string>>(); // collectionName -> Set of synced doc IDs

/**
 * Mark a document as synced after successful push
 */
export function markAsSynced(collectionName: string, docId: string): void {
  if (!syncedDocuments.has(collectionName)) {
    syncedDocuments.set(collectionName, new Set());
  }
  syncedDocuments.get(collectionName)!.add(docId);
}

/**
 * Check if a document was ever synced to the server
 */
export function wasSynced(collectionName: string, docId: string): boolean {
  return syncedDocuments.get(collectionName)?.has(docId) ?? false;
}

/**
 * Clear sync state (for logout)
 */
export function clearSyncState(): void {
  syncedDocuments.clear();
}

// =============================================================================
// Pre-Insert Hook Setup (Workaround for Bug #7513)
// =============================================================================

/**
 * Setup pre-insert hooks to ensure _modified is properly set.
 * This works around the push.modifier bug where the modifier function
 * is never called during push operations.
 */
export function setupPreInsertHooks(db: DevlogDatabase): void {
  const collections = ['documents', 'folders', 'blocks'] as const;

  for (const collName of collections) {
    const collection = db[collName];

    // Pre-insert: Ensure _modified is set to current timestamp
    collection.preInsert((doc: any) => {
      doc._modified = Date.now();
      doc._deleted = doc._deleted ?? false;
      return doc;
    }, false);

    // Pre-save (update): Update _modified timestamp
    collection.preSave((doc: any) => {
      doc._modified = Date.now();
      return doc;
    }, false);

    console.log(`[RxDB] Pre-insert hooks set up for ${collName}`);
  }
}

// =============================================================================
// Replication Setup
// =============================================================================

/**
 * Setup Supabase replication for a collection with bug workarounds
 */
export function setupCollectionReplication<T extends { id: string; _deleted?: boolean }>(
  collection: RxCollection<T>,
  tableName: string,
  userId: string
): RxReplicationState<T, any> {
  console.log(`[RxDB Replication] Setting up replication for ${tableName}`);

  const replicationState = replicateSupabase<T, any>({
    replicationIdentifier: `supabase-${tableName}-${userId}`,
    collection,
    supabaseClient: supabase, // Use SINGLETON client - critical for realtime to work
    table: tableName,

    pull: {
      batchSize: tableName === 'blocks' ? 200 : 100,
      // Transform Supabase nulls to empty strings (sentinel values) for RxDB
      modifier: (doc: any) => {
        // Convert nulls to sentinel values (empty strings)
        if (doc.folder_id === null) doc.folder_id = '';
        if (doc.parent_id === null) doc.parent_id = '';
        // Ensure timestamps have defaults
        if (!doc.created_at) doc.created_at = '';
        if (!doc.updated_at) doc.updated_at = '';
        // Ensure _modified is number
        if (typeof doc._modified === 'string') {
          doc._modified = new Date(doc._modified).getTime();
        }
        if (doc._modified === null || doc._modified === undefined) {
          doc._modified = 0;
        }
        // Mark as synced when pulled from server (it exists on server)
        markAsSynced(tableName, doc.id);
        return doc;
      },
    },

    push: {
      batchSize: tableName === 'blocks' ? 100 : 50,
      /**
       * WORKAROUND for Bug #7612: Deletion fails for unsynced docs
       *
       * Filter out deletions of documents that were never synced to the server.
       * These documents only exist locally and trying to delete them on the
       * server will cause a "not found" error.
       */
      modifier: (doc: any) => {
        // If this is a deletion...
        if (doc._deleted === true) {
          // Check if the document was ever synced to the server
          if (!wasSynced(tableName, doc.id)) {
            console.log(`[RxDB Replication] Skipping deletion of never-synced doc: ${doc.id}`);
            return null; // Skip this document - don't push to server
          }
        }
        return doc;
      },
    },

    // Retry on failure
    retryTime: 5000,
    autoStart: true,
  });

  // Track successful pushes to update sync state
  replicationState.sent$.subscribe((docs) => {
    for (const doc of docs) {
      if (!(doc as any)._deleted) {
        markAsSynced(tableName, (doc as any).id);
      }
    }
  });

  // Log replication status
  replicationState.active$.subscribe(isActive => {
    console.log(`[RxDB Replication] ${tableName}: ${isActive ? 'Active' : 'Inactive'}`);
  });

  replicationState.error$.subscribe(error => {
    if (error) {
      console.error(`[RxDB Replication] ${tableName}: Error`, error);
    }
  });

  return replicationState;
}

/**
 * Start all replications for a user
 */
export async function startAllReplications(
  db: DevlogDatabase,
  userId: string
): Promise<Map<string, RxReplicationState<any, any>>> {
  // Setup pre-insert hooks for all collections (Bug #7513 workaround)
  setupPreInsertHooks(db);

  // ==========================================================================
  // FIX: Ensure Supabase Realtime WebSocket is initialized before replication
  //
  // In Supabase JS v2, the WebSocket is LAZY - it only gets created when you
  // subscribe to a channel. We create a test channel to force initialization.
  // ==========================================================================
  const isReady = await ensureSupabaseRealtimeReady(10000); // Wait up to 10 seconds

  if (!isReady) {
    console.error('[RxDB Replication] ❌ Realtime initialization failed - replication may fail!');
    console.error('[RxDB Replication] 💡 Check: Supabase Realtime enabled? Network issues? Auth valid?');
    // Continue anyway - replication will retry on error
  }

  const replications = new Map<string, RxReplicationState<any, any>>();

  replications.set('documents', setupCollectionReplication(
    db.documents,
    'documents',
    userId
  ));

  replications.set('folders', setupCollectionReplication(
    db.folders,
    'folders',
    userId
  ));

  replications.set('blocks', setupCollectionReplication(
    db.blocks,
    'blocks',
    userId
  ));

  console.log('[RxDB Replication] All replications started');
  return replications;
}

/**
 * Stop all replications
 */
export async function stopAllReplications(
  replications: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  for (const [name, replication] of replications) {
    await replication.cancel();
    console.log(`[RxDB Replication] ${name}: Stopped`);
  }
  replications.clear();
}

/**
 * Force resync all collections (for recovering from stale data)
 */
export async function resyncAll(
  replications: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  for (const [name, replication] of replications) {
    await replication.reSync();
    console.log(`[RxDB Replication] ${name}: Resyncing`);
  }
}
