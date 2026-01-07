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

const DB_NAME = 'devlog-rxdb';

/**
 * Clear the RxDB database (for schema migration or errors)
 */
async function clearDatabase(): Promise<void> {
  console.log('[RxDB] Clearing old database due to schema change...');

  // Destroy existing instance first if it exists
  if (dbInstance) {
    try {
      await dbInstance.destroy();
      dbInstance = null;
      console.log('[RxDB] Destroyed existing instance');
    } catch (e) {
      console.warn('[RxDB] Error destroying instance:', e);
    }
  }

  // Small delay to allow connections to close
  await new Promise(resolve => setTimeout(resolve, 100));

  // Delete all IndexedDB databases with our prefix
  const databases = await indexedDB.databases();
  for (const dbInfo of databases) {
    if (dbInfo.name?.startsWith(DB_NAME) || dbInfo.name?.startsWith('rxdb-dexie-' + DB_NAME)) {
      console.log(`[RxDB] Deleting database: ${dbInfo.name}`);
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbInfo.name!);
        req.onsuccess = () => resolve();
        req.onerror = () => {
          console.warn(`[RxDB] Error deleting ${dbInfo.name}:`, req.error);
          resolve(); // Continue even on error
        };
        req.onblocked = () => {
          console.warn(`[RxDB] Database ${dbInfo.name} blocked, waiting...`);
          // Wait a bit for connections to close then resolve
          setTimeout(resolve, 500);
        };
      });
    }
  }

  console.log('[RxDB] Old databases cleared');
}

/**
 * Get or create the RxDB database instance
 */
export async function getDatabase(): Promise<DevlogDatabase> {
  if (dbInstance) return dbInstance;

  console.log('[RxDB] Creating database...');

  try {
    dbInstance = await createRxDatabase<{
      documents: DocumentCollection;
      folders: FolderCollection;
      blocks: BlockCollection;
    }>({
      name: DB_NAME,
      storage: getRxStorageDexie(),
      multiInstance: true, // Enable multi-tab sync
      eventReduce: true,   // Optimize change events
      ignoreDuplicate: true, // Allow reusing existing database instance
    });

    // Add collections
    await dbInstance.addCollections({
      documents: { schema: documentSchema },
      folders: { schema: folderSchema },
      blocks: { schema: blockSchema },
    });

    console.log('[RxDB] Database ready with collections:', Object.keys(dbInstance.collections));

    return dbInstance;
  } catch (error: any) {
    // Handle schema mismatch (DB6), duplicate database (DB8), or index errors (DXE1)
    if (error?.code === 'DB6' || error?.code === 'DB8' || error?.code === 'DXE1' ||
        error?.message?.includes('DB6') || error?.message?.includes('DB8') || error?.message?.includes('DXE1')) {
      console.warn('[RxDB] Schema mismatch or duplicate database detected, clearing and retrying...');

      // Clear and retry once
      await clearDatabase();
      dbInstance = null;

      // Retry database creation
      dbInstance = await createRxDatabase<{
        documents: DocumentCollection;
        folders: FolderCollection;
        blocks: BlockCollection;
      }>({
        name: DB_NAME,
        storage: getRxStorageDexie(),
        multiInstance: true,
        eventReduce: true,
        ignoreDuplicate: true,
      });

      await dbInstance.addCollections({
        documents: { schema: documentSchema },
        folders: { schema: folderSchema },
        blocks: { schema: blockSchema },
      });

      console.log('[RxDB] Database recreated after schema fix');
      return dbInstance;
    }

    // Re-throw other errors
    throw error;
  }
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
