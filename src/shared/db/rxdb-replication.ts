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
