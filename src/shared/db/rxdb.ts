// src/shared/db/rxdb.ts
/**
 * RxDB Database Setup
 *
 * Single source of truth for all local data.
 * Uses Dexie storage adapter for IndexedDB access.
 */

import { createRxDatabase, addRxPlugin, removeRxDatabase, type RxDatabase, type RxStorage } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

import { documentSchema, folderSchema, blockSchema } from './rxdb-schemas';
import type { DocumentCollection, FolderCollection, BlockCollection } from './rxdb-types';

// Add plugins once at module load
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBQueryBuilderPlugin);

// ============================================================================
// CRITICAL: Create storage ONCE as singleton to avoid DB9 errors
// ============================================================================
let _storage: RxStorage<any, any> | null = null;
function getStorage(): RxStorage<any, any> {
  if (!_storage) {
    _storage = getRxStorageDexie();
  }
  return _storage;
}

// Database type
export type DevlogDatabase = RxDatabase<{
  documents: DocumentCollection;
  folders: FolderCollection;
  blocks: BlockCollection;
}>;

// Singleton instance
let dbInstance: DevlogDatabase | null = null;
let dbPromise: Promise<DevlogDatabase> | null = null;

const DB_NAME = 'devlog-rxdb';

// Schema version - increment when schema changes to force fresh DB
const SCHEMA_VERSION = 2;
const SCHEMA_VERSION_KEY = 'rxdb-schema-version';

/**
 * Check if schema version changed
 */
function needsMigration(): boolean {
  try {
    const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
    return stored !== String(SCHEMA_VERSION);
  } catch {
    return true;
  }
}

/**
 * Save current schema version
 */
function saveSchemaVersion(): void {
  try {
    localStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    // Ignore
  }
}

/**
 * Clear ALL RxDB related databases
 */
async function clearAllDatabases(): Promise<void> {
  console.log('[RxDB] Clearing all databases...');

  // Destroy existing instance
  if (dbInstance) {
    try {
      await dbInstance.remove(); // remove() also deletes the underlying storage
    } catch (e) {
      try {
        await dbInstance.destroy();
      } catch {
        // Ignore
      }
    }
    dbInstance = null;
    dbPromise = null;
  }

  // Try RxDB's official removal with same storage instance
  try {
    await removeRxDatabase(DB_NAME, getStorage());
    console.log('[RxDB] removeRxDatabase succeeded');
  } catch (e: any) {
    console.log('[RxDB] removeRxDatabase:', e?.message || e);
  }

  // Manually clear all related IndexedDB databases
  try {
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      const databases = await indexedDB.databases();
      for (const dbInfo of databases) {
        const name = dbInfo.name;
        if (!name) continue;

        // Delete anything related to RxDB or our app
        if (name.includes('rxdb') || name.includes('devlog') || name.includes('dexie')) {
          console.log(`[RxDB] Deleting IndexedDB: ${name}`);
          await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => {
              console.warn(`[RxDB] Delete blocked: ${name}`);
              resolve();
            };
          });
        }
      }
    }
  } catch (e) {
    console.log('[RxDB] IndexedDB cleanup error:', e);
  }

  // Clear localStorage schema version to force re-init
  try {
    localStorage.removeItem(SCHEMA_VERSION_KEY);
  } catch {
    // Ignore
  }

  // Wait for IndexedDB operations to settle
  await new Promise(r => setTimeout(r, 200));
  console.log('[RxDB] Cleanup complete');
}

/**
 * Create the database
 */
async function createDatabase(): Promise<DevlogDatabase> {
  console.log('[RxDB] Creating database...');

  const db = await createRxDatabase<{
    documents: DocumentCollection;
    folders: FolderCollection;
    blocks: BlockCollection;
  }>({
    name: DB_NAME,
    storage: getStorage(), // Use singleton storage
    multiInstance: true,
    eventReduce: true,
    ignoreDuplicate: true,
  });

  await db.addCollections({
    documents: { schema: documentSchema },
    folders: { schema: folderSchema },
    blocks: { schema: blockSchema },
  });

  console.log('[RxDB] Database ready:', Object.keys(db.collections));
  return db;
}

/**
 * Get or create the RxDB database instance
 */
export async function getDatabase(): Promise<DevlogDatabase> {
  // Return existing
  if (dbInstance) return dbInstance;

  // Return pending promise (prevent concurrent init)
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      // Check if migration needed
      if (needsMigration()) {
        console.log('[RxDB] Schema version changed, clearing old data...');
        await clearAllDatabases();
      }

      // Create database
      try {
        dbInstance = await createDatabase();
        saveSchemaVersion();
        return dbInstance;
      } catch (error: any) {
        const errorStr = String(error?.code || error?.message || error);
        console.warn('[RxDB] Init failed:', errorStr);

        // Any RxDB error - clear and retry once
        if (errorStr.includes('DB') || errorStr.includes('DXE') || errorStr.includes('RxError')) {
          console.log('[RxDB] Clearing and retrying...');
          await clearAllDatabases();
          await new Promise(r => setTimeout(r, 500));

          dbInstance = await createDatabase();
          saveSchemaVersion();
          return dbInstance;
        }

        throw error;
      }
    } catch (error) {
      dbPromise = null;
      throw error;
    }
  })();

  return dbPromise;
}

/**
 * Destroy database (for logout/cleanup)
 */
export async function destroyDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    dbPromise = null;
    console.log('[RxDB] Database destroyed');
  }
}

export default getDatabase;
