// src/shared/lib/storage/dexie-db.ts
/**
 * Dexie v4 Database for Offline-First Storage
 *
 * Uses EntityTable for type-safe tables.
 * Mirrors Supabase schema for seamless sync.
 */

import Dexie, { type EntityTable } from 'dexie';
import type { DocumentData } from '@/entities/Document/Document.schema';
import type { BlockData } from '@/features/block/lib/schemas';

// =============================================================================
// Sync Queue Types
// =============================================================================

export interface SyncQueueItem {
  id: string;
  recordType: 'document' | 'block';
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  createdAt: number;
  lastAttempt: number | null;
  error: string | null;
}

// =============================================================================
// Extended Types with Sync Metadata
// =============================================================================

export interface LocalDocument extends DocumentData {
  _isSynced: boolean;
  _localUpdatedAt: number;
  _serverUpdatedAt: string | null;
}

export interface LocalBlock extends BlockData {
  document_id: string;
  _isSynced: boolean;
  _localUpdatedAt: number;
}

// =============================================================================
// Database Definition
// =============================================================================

export class DevlogDatabase extends Dexie {
  documents!: EntityTable<LocalDocument, 'id'>;
  blocks!: EntityTable<LocalBlock, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('devlog-db');

    this.version(1).stores({
      // Documents: indexed by id, folder_id, and sync status
      documents: 'id, folder_id, updated_at, _isSynced, _localUpdatedAt',

      // Blocks: indexed by id, document_id (for querying all blocks in a doc), position
      blocks: 'id, document_id, position, _isSynced',

      // Sync Queue: for offline operations waiting to sync
      syncQueue: 'id, status, recordType, recordId, createdAt',
    });
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const db = new DevlogDatabase();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all unsynced documents
 */
export async function getUnsyncedDocuments(): Promise<LocalDocument[]> {
  return db.documents.where('_isSynced').equals(0).toArray();
}

/**
 * Get all pending sync queue items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('status').equals('pending').toArray();
}

/**
 * Mark document as synced
 */
export async function markDocumentSynced(
  documentId: string,
  serverUpdatedAt: string
): Promise<void> {
  await db.documents.update(documentId, {
    _isSynced: true,
    _serverUpdatedAt: serverUpdatedAt,
  });
}

/**
 * Clear all local data (for logout)
 */
export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', [db.documents, db.blocks, db.syncQueue], async () => {
    await db.documents.clear();
    await db.blocks.clear();
    await db.syncQueue.clear();
  });
}

export default db;
