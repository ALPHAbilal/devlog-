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

// Add plugins once
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
let dbPromise: Promise<DevlogDatabase> | null = null;

const DB_NAME = 'devlog-rxdb';

// Schema version - increment this when schema changes
const SCHEMA_VERSION = 2;
const SCHEMA_VERSION_KEY = 'rxdb-schema-version';

/**
 * Check if schema version changed (needs migration)
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
    // Ignore localStorage errors
  }
}

/**
 * Clear ALL RxDB related databases
 */
async function clearAllDatabases(): Promise<void> {
  console.log('[RxDB] Clearing all databases for fresh start...');

  // Destroy existing instance first
  if (dbInstance) {
    try {
      await dbInstance.destroy();
    } catch (e) {
      // Ignore
    }
    dbInstance = null;
  }

  // Get storage instance for removeRxDatabase
  const storage = getRxStorageDexie();

  // Try RxDB's official removal
  try {
    await removeRxDatabase(DB_NAME, storage);
  } catch (e) {
    console.log('[RxDB] removeRxDatabase:', e);
  }

  // Also manually clear IndexedDB as backup
  try {
    const databases = await indexedDB.databases();
    const toDelete = databases.filter(db =>
      db.name?.includes('devlog') ||
      db.name?.includes('rxdb') ||
      db.name?.includes(DB_NAME)
    );

    for (const dbInfo of toDelete) {
      if (!dbInfo.name) continue;
      console.log(`[RxDB] Deleting: ${dbInfo.name}`);
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dbInfo.name!);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
  } catch (e) {
    console.log('[RxDB] IndexedDB cleanup error:', e);
  }

  // Small delay for IndexedDB to settle
  await new Promise(r => setTimeout(r, 100));
  console.log('[RxDB] Cleanup complete');
}

/**
 * Create the database with collections
 */
async function initDatabase(): Promise<DevlogDatabase> {
  console.log('[RxDB] Creating database...');

  const storage = getRxStorageDexie();

  const db = await createRxDatabase<{
    documents: DocumentCollection;
    folders: FolderCollection;
    blocks: BlockCollection;
  }>({
    name: DB_NAME,
    storage,
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

  // Start initialization
  dbPromise = (async () => {
    try {
      // Check if we need to migrate (schema version changed)
      if (needsMigration()) {
        console.log('[RxDB] Schema version changed, clearing old data...');
        await clearAllDatabases();
      }

      // Try to create database
      try {
        dbInstance = await initDatabase();
        saveSchemaVersion();
        return dbInstance;
      } catch (error: any) {
        // If any RxDB error, clear and retry ONCE
        const errorStr = String(error?.code || error?.message || error);
        console.warn('[RxDB] Init failed:', errorStr);

        if (errorStr.includes('DB') || errorStr.includes('DXE')) {
          console.log('[RxDB] Clearing corrupted database and retrying...');
          await clearAllDatabases();

          // Wait a bit more
          await new Promise(r => setTimeout(r, 300));

          // Retry
          dbInstance = await initDatabase();
          saveSchemaVersion();
          return dbInstance;
        }

        throw error;
      }
    } catch (error) {
      dbPromise = null; // Allow retry on next call
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
