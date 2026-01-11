// src/shared/db/rxdb-replication.ts
/**
 * Supabase Replication for RxDB
 *
 * USES: Official RxDB Supabase plugin (rxdb/plugins/replication-supabase)
 * RELEASED: v16.19.0 (September 4, 2025)
 * STATUS: Beta but actively maintained by RxDB core team
 *
 * This plugin provides:
 * - Pull: PostgREST HTTP requests with checkpoint-based incremental sync
 * - Push: Optimistic concurrency guards via PostgREST
 * - Live: Supabase Realtime channels for streaming updates
 *
 * CRITICAL: Uses singleton Supabase client from @/shared/api
 * Creating multiple clients causes GoTrueClient conflicts and breaks realtime.
 *
 * Reference: https://rxdb.info/replication-supabase.html
 */

import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import type { RxCollection, RxReplicationState } from 'rxdb';
import { supabase } from '@/shared/api'; // Use SINGLETON client - DO NOT create new client!
import type { DevlogDatabase } from './rxdb';

// Verify client is ready
console.log('[RxDB Replication] Using singleton Supabase client');
console.log('[RxDB Replication] Using OFFICIAL RxDB Supabase plugin (v16.19.0+)');

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
// Replication Setup using Official RxDB Plugin
// =============================================================================

// Type alias for replication state
type ReplicationInstance = RxReplicationState<any, any>;

/**
 * Setup Supabase replication for a collection using official RxDB plugin
 *
 * Uses replicateSupabase from rxdb/plugins/replication-supabase
 * Released in RxDB v16.19.0 (September 2025)
 */
export async function setupCollectionReplication<T extends { id: string; _deleted?: boolean }>(
  collection: RxCollection<T>,
  tableName: string,
  userId: string
): Promise<ReplicationInstance> {
  console.log(`[RxDB Replication] Setting up replication for ${tableName}`);

  const replication = await replicateSupabase<T, any>({
    supabaseClient: supabase,
    collection,
    replicationIdentifier: `supabase-${tableName}-${userId}`,

    pull: {
      batchSize: tableName === 'blocks' ? 200 : 100,
      /**
       * Transform Supabase response for RxDB compatibility
       * CRITICAL: Supabase returns null, RxDB expects undefined
       */
      modifier: (doc: any) => {
        // Convert nulls to appropriate values for RxDB
        Object.keys(doc).forEach((key) => {
          if (doc[key] === null) {
            // For string fields that use sentinel values, use empty string
            if (key === 'folder_id' || key === 'parent_id' || key === 'path') {
              doc[key] = '';
            } else if (key === 'created_at' || key === 'updated_at') {
              doc[key] = '';
            } else {
              // For other fields, delete to let RxDB use defaults
              delete doc[key];
            }
          }
        });

        // Ensure _modified is a number
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
       * Transform RxDB document before pushing to Supabase
       * - Strip _modified (Supabase auto-generates via trigger)
       * - Skip deletions for never-synced documents
       */
      modifier: (doc: any) => {
        // If this is a deletion of a document that was never synced, skip it
        if (doc._deleted === true) {
          if (!wasSynced(tableName, doc.id)) {
            console.log(`[RxDB Replication] Skipping deletion of never-synced doc: ${doc.id}`);
            return null; // Skip this document - don't push to server
          }
        }

        // Strip _modified - Supabase generates this via trigger
        // Note: There's a known bug (RxDB #7513) where modifier may not be called
        // If _modified causes issues, add a Supabase trigger to ignore it
        const { _modified, ...rest } = doc;
        return rest;
      },
    },

    // Enable Realtime streaming for live updates
    live: true,

    // Retry failed operations
    retryTime: 5000,

    // Auto-start replication
    autoStart: true,
  });

  // Log replication state changes
  replication.active$.subscribe((active: boolean) => {
    console.log(`[RxDB Replication] ${tableName}: ${active ? 'Active' : 'Inactive'}`);
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

  console.log('[RxDB Replication] Starting replications with OFFICIAL RxDB plugin...');

  const replications = new Map<string, ReplicationInstance>();

  try {
    // Start replications sequentially to avoid race conditions
    const documentsRep = await setupCollectionReplication(
      db.documents,
      'documents',
      userId
    );
    replications.set('documents', documentsRep);

    const foldersRep = await setupCollectionReplication(
      db.folders,
      'folders',
      userId
    );
    replications.set('folders', foldersRep);

    const blocksRep = await setupCollectionReplication(
      db.blocks,
      'blocks',
      userId
    );
    replications.set('blocks', blocksRep);

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

// These functions are no longer needed with the official plugin but kept for external imports
export async function ensureSupabaseRealtimeReady(_timeoutMs = 10000): Promise<boolean> {
  console.log('[RxDB Replication] ensureSupabaseRealtimeReady() - handled by official plugin');
  return true;
}

export async function waitForRealtimeReady(maxWaitMs = 10000): Promise<boolean> {
  return ensureSupabaseRealtimeReady(maxWaitMs);
}

export function forceRealtimeConnect(): void {
  console.log('[RxDB Replication] forceRealtimeConnect() - handled by official plugin');
}
