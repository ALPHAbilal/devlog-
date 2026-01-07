// src/shared/db/migration.ts
/**
 * Data Migration: Dexie/IndexedDB → RxDB
 *
 * Runs once on first app load after RxDB is installed.
 * Safely migrates all existing data.
 */

import Dexie from 'dexie';
import type { DevlogDatabase } from './rxdb';

const MIGRATION_KEY = 'rxdb-migration-complete';

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  return localStorage.getItem(MIGRATION_KEY) !== 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
  console.log('[Migration] Migration marked complete');
}

/**
 * Export data from old Dexie database
 */
async function exportDexieData(): Promise<{ blocks: any[] }> {
  try {
    const oldDb = new Dexie('devlog-db');
    oldDb.version(1).stores({
      blocks: 'id, document_id, position',
    });

    const blocks = await oldDb.table('blocks').toArray();
    console.log(`[Migration] Exported ${blocks.length} blocks from Dexie`);

    return { blocks };
  } catch (error) {
    console.warn('[Migration] No Dexie data to migrate:', error);
    return { blocks: [] };
  }
}

/**
 * Export data from old IndexedDB (journey-log-compass-db)
 */
async function exportIndexedDBData(): Promise<{ documents: any[] }> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('journey-log-compass-db', 1);

      request.onerror = () => {
        console.warn('[Migration] No IndexedDB data to migrate');
        resolve({ documents: [] });
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        try {
          const tx = db.transaction(['documents'], 'readonly');
          const store = tx.objectStore('documents');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            const documents = getAllRequest.result || [];
            console.log(`[Migration] Exported ${documents.length} documents from IndexedDB`);
            db.close();
            resolve({ documents });
          };

          getAllRequest.onerror = () => {
            db.close();
            resolve({ documents: [] });
          };
        } catch (e) {
          db.close();
          resolve({ documents: [] });
        }
      };
    } catch (error) {
      resolve({ documents: [] });
    }
  });
}

/**
 * Transform data for RxDB schema
 */
function transformForRxDB(docs: any[], userId: string): any[] {
  return docs.map(doc => ({
    ...doc,
    user_id: doc.user_id || userId,
    _modified: doc.updated_at
      ? new Date(doc.updated_at).getTime()
      : Date.now(),
    _deleted: false,
  }));
}

/**
 * Run the full migration
 */
export async function runMigration(
  rxdb: DevlogDatabase,
  userId: string,
  onProgress?: (message: string, percent: number) => void
): Promise<{ success: boolean; migrated: { documents: number; blocks: number } }> {
  if (!isMigrationNeeded()) {
    console.log('[Migration] Already migrated, skipping');
    return { success: true, migrated: { documents: 0, blocks: 0 } };
  }

  console.log('[Migration] Starting data migration...');
  onProgress?.('Starting migration...', 0);

  try {
    // 1. Export from old databases
    onProgress?.('Exporting old data...', 10);
    const [dexieData, indexedDBData] = await Promise.all([
      exportDexieData(),
      exportIndexedDBData(),
    ]);

    // 2. Transform data
    onProgress?.('Transforming data...', 30);
    const transformedDocs = transformForRxDB(indexedDBData.documents, userId);
    const transformedBlocks = transformForRxDB(dexieData.blocks, userId);

    // 3. Insert into RxDB (skip duplicates)
    onProgress?.('Inserting documents...', 50);
    if (transformedDocs.length > 0) {
      await rxdb.documents.bulkInsert(transformedDocs).catch(err => {
        // Ignore duplicate key errors
        if (!err.message?.includes('conflict')) throw err;
      });
    }

    onProgress?.('Inserting blocks...', 70);
    if (transformedBlocks.length > 0) {
      await rxdb.blocks.bulkInsert(transformedBlocks).catch(err => {
        if (!err.message?.includes('conflict')) throw err;
      });
    }

    // 4. Mark complete
    onProgress?.('Finalizing...', 90);
    markMigrationComplete();

    onProgress?.('Migration complete!', 100);
    console.log(`[Migration] Complete: ${transformedDocs.length} documents, ${transformedBlocks.length} blocks`);

    return {
      success: true,
      migrated: {
        documents: transformedDocs.length,
        blocks: transformedBlocks.length,
      },
    };
  } catch (error) {
    console.error('[Migration] Failed:', error);
    return {
      success: false,
      migrated: { documents: 0, blocks: 0 },
    };
  }
}

/**
 * Clean up old databases after successful migration
 *
 * Databases to clean:
 * - devlog-db (Dexie) - main storage
 * - DevLogSmartSync (Dexie) - smart sync state
 * - journey-log-compass-db (IndexedDB) - legacy document storage
 *
 * NOTE: devlog-snapshots is intentionally NOT deleted.
 * It's used by DataIntegrityManager for corruption recovery
 * and operates independently of the main storage system.
 */
export async function cleanupOldDatabases(): Promise<void> {
  try {
    // Delete old Dexie databases
    await Dexie.delete('devlog-db');
    console.log('[Migration] Deleted old devlog-db');

    await Dexie.delete('DevLogSmartSync');
    console.log('[Migration] Deleted old DevLogSmartSync');

    // Delete old IndexedDB
    indexedDB.deleteDatabase('journey-log-compass-db');
    console.log('[Migration] Deleted old journey-log-compass-db');

    // NOTE: devlog-snapshots is kept for data integrity features
    // See src/shared/lib/integrity/data-integrity.ts
  } catch (error) {
    console.warn('[Migration] Cleanup error (non-fatal):', error);
  }
}
