// src/shared/lib/storage/sync-queue-manager.ts
/**
 * Sync Queue Manager
 *
 * Handles offline queue and background sync to Supabase.
 * Uses Dexie syncQueue table for persistence.
 */

import { db, type SyncQueueItem } from './dexie-db';
import { optimizedSupabase } from '@/shared/api';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type RecordType = 'document' | 'block';

interface SyncQueueManagerOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  batchSize?: number;
}

export class SyncQueueManager {
  private isProcessing = false;
  private maxRetries: number;
  private retryDelayMs: number;
  private batchSize: number;
  private onlineHandler: () => void;

  constructor(options: SyncQueueManagerOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.batchSize = options.batchSize ?? 10;

    // Listen for online events
    this.onlineHandler = () => this.processQueue();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
    }
  }

  /**
   * Add operation to sync queue
   */
  async enqueue(
    recordType: RecordType,
    recordId: string,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      recordType,
      recordId,
      operation,
      data,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      lastAttempt: null,
      error: null,
    };

    await db.syncQueue.add(item);

    // Try to process immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Process pending sync queue items
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isProcessing = true;

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .limit(this.batchSize)
        .toArray();

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single sync queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    // Mark as syncing
    await db.syncQueue.update(item.id, {
      status: 'syncing',
      lastAttempt: Date.now(),
    });

    try {
      const supabase = optimizedSupabase.getClient();
      const table = item.recordType === 'document' ? 'documents' : 'blocks';

      switch (item.operation) {
        case 'CREATE':
        case 'UPDATE':
          await supabase.from(table).upsert(item.data);
          break;
        case 'DELETE':
          await supabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.recordId);
          break;
      }

      // Success - remove from queue
      await db.syncQueue.delete(item.id);

      // Mark local record as synced
      if (item.recordType === 'document') {
        await db.documents.update(item.recordId, {
          _isSynced: true,
          _serverUpdatedAt: new Date().toISOString(),
        });
      } else {
        await db.blocks.update(item.recordId, { _isSynced: true });
      }
    } catch (error) {
      const retryCount = item.retryCount + 1;

      if (retryCount >= this.maxRetries) {
        // Max retries reached - mark as failed
        await db.syncQueue.update(item.id, {
          status: 'failed',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        // Retry later
        await db.syncQueue.update(item.id, {
          status: 'pending',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Schedule retry with exponential backoff
        setTimeout(() => this.processQueue(), this.retryDelayMs * Math.pow(2, retryCount));
      }
    }
  }

  /**
   * Get sync status summary
   */
  async getStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
  }> {
    const [pending, syncing, failed] = await Promise.all([
      db.syncQueue.where('status').equals('pending').count(),
      db.syncQueue.where('status').equals('syncing').count(),
      db.syncQueue.where('status').equals('failed').count(),
    ]);

    return { pending, syncing, failed };
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0 });

    this.processQueue();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
    }
  }
}

// Singleton instance
export const syncQueueManager = new SyncQueueManager();
export default syncQueueManager;
