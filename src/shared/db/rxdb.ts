// src/shared/db/rxdb.ts
/**
 * RxDB Database Setup
 *
 * Single source of truth for all local data.
 * Uses Dexie storage adapter for IndexedDB access.
 */

import { createRxDatabase, addRxPlugin, removeRxDatabase, type RxDatabase } from 'rxdb';
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
let isInitializing = false;

const DB_NAME = 'devlog-rxdb';
const storage = getRxStorageDexie();

/**
 * Clear the RxDB database completely (for schema migration)
 */
async function clearDatabase(): Promise<void> {
  console.log('[RxDB] Clearing old database due to schema change...');

  // First, destroy any existing instance
  if (dbInstance) {
    try {
      await dbInstance.destroy();
    } catch (e) {
      console.warn('[RxDB] Error destroying instance:', e);
    }
    dbInstance = null;
  }

  // Use RxDB's removeRxDatabase to properly clean up
  try {
    await removeRxDatabase(DB_NAME, storage);
    console.log('[RxDB] Database removed via RxDB API');
  } catch (e) {
    console.warn('[RxDB] removeRxDatabase failed, trying manual cleanup:', e);
  }

  // Also manually delete IndexedDB databases as fallback
  try {
    const databases = await indexedDB.databases();
    for (const dbInfo of databases) {
      if (dbInfo.name?.includes(DB_NAME) || dbInfo.name?.includes('rxdb-dexie')) {
        console.log(`[RxDB] Deleting IndexedDB: ${dbInfo.name}`);
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(dbInfo.name!);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve(); // Continue even on error
          req.onblocked = () => {
            console.warn(`[RxDB] Delete blocked for ${dbInfo.name}`);
            resolve();
          };
        });
      }
    }
  } catch (e) {
    console.warn('[RxDB] Manual IndexedDB cleanup failed:', e);
  }

  console.log('[RxDB] Database cleanup complete');
}

/**
 * Create database with collections
 */
async function createDb(): Promise<DevlogDatabase> {
  const db = await createRxDatabase<{
    documents: DocumentCollection;
    folders: FolderCollection;
    blocks: BlockCollection;
  }>({
    name: DB_NAME,
    storage,
    multiInstance: true,
    eventReduce: true,
    ignoreDuplicate: true, // Allow re-creation after errors
  });

  await db.addCollections({
    documents: { schema: documentSchema },
    folders: { schema: folderSchema },
    blocks: { schema: blockSchema },
  });

  return db;
}

/**
 * Get or create the RxDB database instance
 */
export async function getDatabase(): Promise<DevlogDatabase> {
  // Return existing instance
  if (dbInstance) return dbInstance;

  // Prevent concurrent initialization
  if (isInitializing) {
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    return getDatabase();
  }

  isInitializing = true;
  console.log('[RxDB] Creating database...');

  try {
    dbInstance = await createDb();
    console.log('[RxDB] Database ready with collections:', Object.keys(dbInstance.collections));
    return dbInstance;
  } catch (error: any) {
    const errorCode = error?.code || error?.message || '';
    const isSchemaError = ['DB6', 'DXE1', 'DB8'].some(code =>
      errorCode.includes(code) || error?.message?.includes(code)
    );

    if (isSchemaError) {
      console.warn(`[RxDB] Database error (${errorCode}), clearing and retrying...`);

      // Full cleanup
      await clearDatabase();

      // Wait a moment for IndexedDB to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Retry once
      try {
        dbInstance = await createDb();
        console.log('[RxDB] Database recreated successfully');
        return dbInstance;
      } catch (retryError) {
        console.error('[RxDB] Retry failed:', retryError);
        throw retryError;
      }
    }

    // Re-throw other errors
    throw error;
  } finally {
    isInitializing = false;
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
