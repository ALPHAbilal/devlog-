// src/shared/db/rxdb-replication.ts
/**
 * Supabase Replication for RxDB
 *
 * USES: rxdb-supabase library (community-maintained, works with Supabase v2)
 * NOT: rxdb/plugins/replication-supabase (has bugs with Supabase v2)
 *
 * The official RxDB plugin has a known bug where it fails with:
 * "TypeError: Cannot read properties of undefined (reading 'channel')"
 * even after WebSocket initialization. The rxdb-supabase library handles
 * Supabase v2's realtime API correctly.
 *
 * CRITICAL: Uses singleton Supabase client from @/shared/api
 * Creating multiple clients causes GoTrueClient conflicts and breaks realtime.
 *
 * Reference: resources/rxdb-migration-guide.md Part 2
 */

import { SupabaseReplication } from 'rxdb-supabase';
import type { RxCollection } from 'rxdb';
import { supabase } from '@/shared/api'; // Use SINGLETON client - DO NOT create new client!
import type { DevlogDatabase } from './rxdb';

// Verify client is ready
console.log('[RxDB Replication] Using singleton client');
console.log('[RxDB Replication] Client channel method:', typeof supabase.channel);
console.log('[RxDB Replication] Realtime available:', typeof supabase.realtime);
console.log('[RxDB Replication] Using rxdb-supabase library (not built-in plugin)');

// =============================================================================
// Sync State Tracking
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
// Pre-Insert Hook Setup
// =============================================================================

/**
 * Setup pre-insert hooks to ensure _modified is properly set.
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
// Replication Setup using rxdb-supabase
// =============================================================================

// Store replication instances for management
type ReplicationInstance = InstanceType<typeof SupabaseReplication<any>>;

/**
 * Setup Supabase replication for a collection using rxdb-supabase library
 */
export function setupCollectionReplication<T extends { id: string; _deleted?: boolean }>(
  collection: RxCollection<T>,
  tableName: string,
  userId: string
): ReplicationInstance {
  console.log(`[RxDB Replication] Setting up replication for ${tableName}`);

  const replication = new SupabaseReplication<T>({
    supabaseClient: supabase,
    collection,
    table: tableName,
    replicationIdentifier: `supabase-${tableName}-${userId}`,

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
  });

  // Log replication errors
  replication.error$.subscribe((error: any) => {
    if (error) {
      console.error(`[RxDB Replication] ${tableName}: Error`, error);
    }
  });

  console.log(`[RxDB Replication] ${tableName}: Started`);
  return replication;
}

/**
 * Start all replications for a user
 */
export async function startAllReplications(
  db: DevlogDatabase,
  userId: string
): Promise<Map<string, ReplicationInstance>> {
  // Setup pre-insert hooks for all collections
  setupPreInsertHooks(db);

  console.log('[RxDB Replication] Starting replications with rxdb-supabase library...');

  const replications = new Map<string, ReplicationInstance>();

  try {
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

    console.log('[RxDB Replication] All replications started successfully!');
  } catch (err) {
    console.error('[RxDB Replication] Failed to start replications:', err);
    throw err;
  }

  return replications;
}

/**
 * Stop all replications
 */
export async function stopAllReplications(
  replications: Map<string, ReplicationInstance>
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
  replications: Map<string, ReplicationInstance>
): Promise<void> {
  for (const [name, replication] of replications) {
    await replication.reSync();
    console.log(`[RxDB Replication] ${name}: Resyncing`);
  }
}

// =============================================================================
// Legacy exports for backwards compatibility
// =============================================================================

// These are no longer needed with rxdb-supabase but kept for any external imports
export async function ensureSupabaseRealtimeReady(_timeoutMs = 10000): Promise<boolean> {
  console.log('[RxDB Replication] ensureSupabaseRealtimeReady() - not needed with rxdb-supabase');
  return true;
}

export async function waitForRealtimeReady(maxWaitMs = 10000): Promise<boolean> {
  return ensureSupabaseRealtimeReady(maxWaitMs);
}

export function forceRealtimeConnect(): void {
  console.log('[RxDB Replication] forceRealtimeConnect() - not needed with rxdb-supabase');
}
