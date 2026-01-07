// src/shared/db/rxdb.ts
/**
 * RxDB Database Setup
 *
 * Single source of truth for all local data.
 * Uses Dexie storage adapter for IndexedDB access.
 */

import { createRxDatabase, addRxPlugin, type RxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

import { documentSchema, folderSchema, blockSchema } from './rxdb-schemas';
import type { DocumentCollection, FolderCollection, BlockCollection } from './rxdb-types';

// Add plugins
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBQueryBuilderPlugin);

// Database type
export type DevlogDatabase = RxDatabase<{
  documents: DocumentCollection;
  folders: FolderCollection;
  blocks: BlockCollection;
}>;

// Singleton instance
let dbInstance: DevlogDatabase | null = null;

/**
 * Get or create the RxDB database instance
 */
export async function getDatabase(): Promise<DevlogDatabase> {
  if (dbInstance) return dbInstance;

  console.log('[RxDB] Creating database...');

  dbInstance = await createRxDatabase<{
    documents: DocumentCollection;
    folders: FolderCollection;
    blocks: BlockCollection;
  }>({
    name: 'devlog-rxdb',
    storage: getRxStorageDexie(),
    multiInstance: true, // Enable multi-tab sync
    eventReduce: true,   // Optimize change events
  });

  // Add collections
  await dbInstance.addCollections({
    documents: { schema: documentSchema },
    folders: { schema: folderSchema },
    blocks: { schema: blockSchema },
  });

  console.log('[RxDB] Database ready with collections:', Object.keys(dbInstance.collections));

  return dbInstance;
}

/**
 * Destroy database (for logout/cleanup)
 */
export async function destroyDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('[RxDB] Database destroyed');
  }
}

export default getDatabase;
