// src/shared/db/rxdb-replication.ts
/**
 * Supabase Replication for RxDB using GENERIC replication
 *
 * WHY replicateRxCollection instead of replicateSupabase?
 * - replicateSupabase IGNORES custom pull.handler / push.handler
 * - We NEED custom handlers to filter by user_id: .eq('user_id', userId)
 * - replicateRxCollection gives us FULL control over the sync logic
 *
 * Trade-offs:
 * - ✅ Full control over queries (can filter by user_id)
 * - ✅ Custom checkpoint logic
 * - ❌ No automatic Supabase Realtime (must add manually if needed)
 *
 * CRITICAL: Uses singleton Supabase client from @/shared/api
 * Creating multiple clients causes GoTrueClient conflicts.
 *
 * Reference: https://rxdb.info/replication.html
 */

// Solution 2: Using replicateRxCollection for full handler control
// replicateSupabase ignores custom handlers, but we need .eq('user_id', userId) filter
import { replicateRxCollection } from 'rxdb/plugins/replication';
import type { RxCollection, RxReplicationState } from 'rxdb';
import { supabase } from '@/shared/api'; // Use SINGLETON client - DO NOT create new client!
import type { DevlogDatabase } from './rxdb';

// Verify client is ready
console.log('[RxDB Replication] Using singleton Supabase client');
console.log('[RxDB Replication] Using replicateRxCollection (custom handlers)');

// =============================================================================
// DEBUG: Schema Verification Helper
// =============================================================================

/**
 * Check if Supabase tables have required _modified column
 * This is critical for RxDB replication to work
 */
async function verifySupabaseSchema(tableName: string): Promise<{ hasModified: boolean; hasDeleted: boolean; rowCount: number; error?: string }> {
  try {
    // Try to query with _modified column - if it fails, column doesn't exist
    const { data, error, count } = await supabase
      .from(tableName)
      .select('id, _modified, _deleted', { count: 'exact' })
      .limit(5);

    if (error) {
      // Check if error is about missing column
      if (error.message?.includes('_modified') || error.code === '42703') {
        console.error(`[RxDB Replication] ❌ Table "${tableName}" missing _modified column!`);
        return { hasModified: false, hasDeleted: false, rowCount: 0, error: error.message };
      }
      if (error.message?.includes('_deleted')) {
        console.error(`[RxDB Replication] ❌ Table "${tableName}" missing _deleted column!`);
        return { hasModified: true, hasDeleted: false, rowCount: 0, error: error.message };
      }
      console.error(`[RxDB Replication] ❌ Schema check error for "${tableName}":`, error);
      return { hasModified: false, hasDeleted: false, rowCount: 0, error: error.message };
    }

    const rowCount = count ?? data?.length ?? 0;
    console.log(`[RxDB Replication] ✅ Table "${tableName}" has required columns. Row count: ${rowCount}`);

    // DEBUG: Log sample data to verify _modified values
    if (data && data.length > 0) {
      console.log(`[RxDB Replication] 📊 Sample ${tableName} data:`,
        data.slice(0, 2).map((d: any) => ({
          id: d.id?.substring(0, 8),
          _modified: d._modified,
          _deleted: d._deleted
        }))
      );
    } else {
      console.log(`[RxDB Replication] ℹ️ Table "${tableName}" is empty (0 rows)`);
    }

    return { hasModified: true, hasDeleted: true, rowCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[RxDB Replication] ❌ Failed to verify schema for "${tableName}":`, message);
    return { hasModified: false, hasDeleted: false, rowCount: 0, error: message };
  }
}

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

  // DEBUG: Verify supabase client is available
  console.log(`[RxDB Replication] DEBUG supabase client check:`, {
    supabaseExists: !!supabase,
    hasFrom: typeof supabase?.from === 'function',
    hasChannel: typeof supabase?.channel === 'function',
  });

  const batchSize = tableName === 'blocks' ? 200 : 100;

  // ✅ CRITICAL FIX: Custom pull handler as arrow function to capture supabase in closure
  // The RxDB plugin's internal handler loses the supabaseClient reference
  const pullHandler = async (
    checkpoint: { modified: number } | null,
    batchSize: number
  ): Promise<{ documents: T[]; checkpoint: { modified: number } | null }> => {
    try {
      console.log(`[RxDB Replication] ${tableName}: Pull starting`, { checkpoint, batchSize });

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .gt('_modified', checkpoint?.modified ?? 0)
        .order('_modified', { ascending: true })
        .limit(batchSize);

      if (error) {
        console.error(`[RxDB Replication] ${tableName}: Pull error`, error);
        throw error;
      }

      // Transform documents for RxDB compatibility
      const documents = (data || []).map((doc: any) => {
        // Convert nulls to appropriate values
        Object.keys(doc).forEach((key) => {
          if (doc[key] === null) {
            if (key === 'folder_id' || key === 'parent_id' || key === 'path') {
              doc[key] = '';
            } else if (key === 'created_at' || key === 'updated_at') {
              doc[key] = '';
            } else {
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

        // Mark as synced
        markAsSynced(tableName, doc.id);
        return doc;
      });

      // Calculate new checkpoint
      const newCheckpoint = documents.length > 0
        ? { modified: documents[documents.length - 1]._modified }
        : checkpoint;

      console.log(`[RxDB Replication] ${tableName}: Pulled ${documents.length} docs`, {
        newCheckpoint,
        hasMore: documents.length === batchSize,
      });

      return {
        documents,
        checkpoint: newCheckpoint,
      };
    } catch (err) {
      console.error(`[RxDB Replication] ${tableName}: Pull handler error`, err);
      throw err;
    }
  };

  // ✅ Push handler for replicateRxCollection
  // Format: receives rows with { newDocumentState, assumedMasterState }
  // Returns: array of conflicts (empty = all succeeded)
  const pushHandler = async (
    rows: { newDocumentState: T; assumedMasterState: T | null }[]
  ): Promise<T[]> => {
    try {
      console.log(`[RxDB Replication] ${tableName}: Push starting`, { count: rows.length });

      const conflicts: T[] = [];

      for (const row of rows) {
        const newDoc = row.newDocumentState;
        const assumedMasterState = row.assumedMasterState; // null = INSERT, otherwise UPDATE

        // Skip deletion of never-synced documents
        if ((newDoc as any)._deleted === true && !wasSynced(tableName, newDoc.id)) {
          console.log(`[RxDB Replication] Skipping deletion of never-synced doc: ${newDoc.id}`);
          continue;
        }

        // Strip _modified and _rev - Supabase generates _modified via trigger
        const { _modified, _rev, ...docToUpsert } = newDoc as any;

        if (!assumedMasterState) {
          // INSERT - new document
          const { error } = await supabase
            .from(tableName)
            .insert([docToUpsert]);

          if (error) {
            if (error.code === '23505') {
              // Conflict - document already exists
              console.log(`[RxDB Replication] ${tableName}: Conflict on INSERT ${newDoc.id}`);
              conflicts.push(newDoc);
            } else {
              console.error(`[RxDB Replication] ${tableName}: Insert error for ${newDoc.id}`, error);
              throw error;
            }
          } else {
            markAsSynced(tableName, newDoc.id);
          }
        } else {
          // UPDATE with optimistic concurrency
          const { data, error } = await supabase
            .from(tableName)
            .update(docToUpsert)
            .eq('id', newDoc.id)
            .select();

          if (error) {
            console.error(`[RxDB Replication] ${tableName}: Update error for ${newDoc.id}`, error);
            throw error;
          }

          if (!data || data.length === 0) {
            // Conflict - document was modified or deleted
            console.log(`[RxDB Replication] ${tableName}: Conflict on UPDATE ${newDoc.id}`);
            conflicts.push(newDoc);
          } else {
            markAsSynced(tableName, newDoc.id);
          }
        }
      }

      console.log(`[RxDB Replication] ${tableName}: Pushed ${rows.length - conflicts.length} docs, ${conflicts.length} conflicts`);
      return conflicts;
    } catch (err) {
      console.error(`[RxDB Replication] ${tableName}: Push handler error`, err);
      throw err;
    }
  };

  // Using replicateRxCollection - our custom handlers WILL be called
  const replication = replicateRxCollection<T, { modified: number }>({
    collection,
    replicationIdentifier: `supabase-${tableName}-${userId}`,

    pull: {
      batchSize,
      handler: pullHandler,  // ✅ WILL be called (unlike replicateSupabase)
    },

    push: {
      batchSize: tableName === 'blocks' ? 100 : 50,
      handler: pushHandler,  // ✅ WILL be called (unlike replicateSupabase)
    },

    // No live mode with generic replication (would need manual Realtime setup)
    live: false,

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

  // DEBUG: Log when documents are received from pull
  replication.received$.subscribe((docs: any) => {
    console.log(`[RxDB Replication] ${tableName}: Received ${docs?.length || 0} docs from pull`,
      docs?.slice(0, 2).map((d: any) => ({ id: d.id?.substring(0, 8), title: d.title }))
    );
  });

  // DEBUG: Log when documents are sent via push
  replication.sent$.subscribe((docs: any) => {
    console.log(`[RxDB Replication] ${tableName}: Sent ${docs?.length || 0} docs via push`);
  });

  // DEBUG: Log replication state for debugging
  console.log(`[RxDB Replication] ${tableName}: Replication object created`, {
    isStopped: replication.isStopped(),
    collection: collection.name,
    identifier: `supabase-${tableName}-${userId}`,
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

  console.log('[RxDB Replication] Starting replications with replicateRxCollection...');

  // DEBUG: Verify Supabase schema has required columns BEFORE starting replication
  console.log('[RxDB Replication] 🔍 Verifying Supabase schema...');
  const schemaChecks = await Promise.all([
    verifySupabaseSchema('documents'),
    verifySupabaseSchema('folders'),
    verifySupabaseSchema('blocks'),
  ]);

  const [docsSchema, foldersSchema, blocksSchema] = schemaChecks;
  const allSchemasValid = docsSchema.hasModified && foldersSchema.hasModified && blocksSchema.hasModified;

  if (!allSchemasValid) {
    console.error('[RxDB Replication] ❌ SCHEMA MISMATCH DETECTED!');
    console.error('[RxDB Replication] Required columns (_modified, _deleted) missing from Supabase tables.');
    console.error('[RxDB Replication] Run migration: supabase/migrations/20260111_rxdb_replication_columns.sql');
    console.error('[RxDB Replication] Schema check results:', { documents: docsSchema, folders: foldersSchema, blocks: blocksSchema });
    // Continue anyway to see what happens, but warn the user
  } else {
    console.log('[RxDB Replication] ✅ All Supabase tables have required columns');
  }

  // CRITICAL: Force Supabase Realtime WebSocket to initialize BEFORE replication
  // Supabase v2 uses lazy initialization - socket doesn't exist until first subscribe
  const realtimeReady = await ensureSupabaseRealtimeReady(10000);
  if (!realtimeReady) {
    console.warn('[RxDB Replication] ⚠️ Realtime may not be ready, proceeding anyway...');
  }

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

/**
 * Force Supabase Realtime WebSocket to initialize.
 *
 * CRITICAL: In Supabase v2, the WebSocket is LAZY INITIALIZED.
 * It doesn't exist until you subscribe to your first channel.
 * The RxDB plugin assumes it exists, causing "channel undefined" errors.
 *
 * This function creates a test channel and subscribes to force WebSocket creation.
 */
export async function ensureSupabaseRealtimeReady(timeoutMs = 10000): Promise<boolean> {
  console.log('[RxDB Replication] 🔌 Forcing Supabase Realtime WebSocket initialization...');

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn('[RxDB Replication] ⚠️ Realtime initialization timeout - proceeding anyway');
      resolve(false);
    }, timeoutMs);

    // Create a unique test channel name
    const testChannelName = `rxdb-init-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const testChannel = supabase.channel(testChannelName);

    testChannel
      .on('system', { event: '*' }, () => {
        // System events listener (required for subscription)
      })
      .subscribe((status, err) => {
        console.log(`[RxDB Replication] Channel status: ${status}`, err ? err : '');

        if (status === 'SUBSCRIBED') {
          console.log('[RxDB Replication] ✅ Realtime WebSocket connected and ready!');
          clearTimeout(timeoutId);

          // Clean up test channel
          testChannel.unsubscribe().then(() => {
            supabase.removeChannel(testChannel);
          });

          resolve(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[RxDB Replication] ❌ Realtime connection failed:', err);
          clearTimeout(timeoutId);
          resolve(false);
        }
      });
  });
}

export async function waitForRealtimeReady(maxWaitMs = 10000): Promise<boolean> {
  return ensureSupabaseRealtimeReady(maxWaitMs);
}

export function forceRealtimeConnect(): void {
  // Fire and forget - just triggers WebSocket initialization
  ensureSupabaseRealtimeReady(5000).catch(console.error);
}
