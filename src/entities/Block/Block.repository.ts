// src/entities/Block/Block.repository.ts
/**
 * Block Repository
 *
 * Same hybrid pattern as DocumentRepository:
 * Dexie first, Supabase sync in background.
 */

import { db, type LocalBlock } from '@/shared/lib/storage/dexie-db';
import { syncQueueManager } from '@/shared/lib/storage/sync-queue-manager';
import { optimizedSupabase } from '@/shared/api';
import { BaseBlockSchema, type BlockData } from '@/features/block/lib/schemas';

export class BlockRepository {
  /**
   * Get all blocks for a document
   */
  async getBlocks(documentId: string): Promise<BlockData[]> {
    // Try Dexie first
    const localBlocks = await db.blocks
      .where('document_id')
      .equals(documentId)
      .sortBy('position');

    if (localBlocks.length > 0) {
      // Trigger background sync if any blocks unsynced
      const hasUnsynced = localBlocks.some(b => !b._isSynced);
      if (hasUnsynced && typeof navigator !== 'undefined' && navigator.onLine) {
        this.syncBlocksFromServer(documentId);
      }
      return localBlocks.map(this.toBlockData);
    }

    // Not in Dexie, fetch from Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const serverBlocks = await this.fetchBlocksFromServer(documentId);
      if (serverBlocks.length > 0) {
        await this.saveBlocksToLocal(documentId, serverBlocks, true);
        return serverBlocks;
      }
    }

    return [];
  }

  /**
   * Update single block
   */
  async updateBlock(id: string, updates: Partial<BlockData>): Promise<BlockData | null> {
    const existing = await db.blocks.get(id);
    if (!existing) return null;

    const updated: LocalBlock = {
      ...existing,
      ...updates,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(updated);

    // Queue for sync
    await syncQueueManager.enqueue(
      'block',
      id,
      'UPDATE',
      this.toBlockData(updated) as Record<string, unknown>
    );

    return this.toBlockData(updated);
  }

  /**
   * Create new block
   */
  async createBlock(documentId: string, block: BlockData): Promise<BlockData> {
    const localBlock: LocalBlock = {
      ...block,
      document_id: documentId,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(localBlock);

    await syncQueueManager.enqueue(
      'block',
      block.id,
      'CREATE',
      { ...block, document_id: documentId } as Record<string, unknown>
    );

    return block;
  }

  /**
   * Delete block
   */
  async deleteBlock(id: string): Promise<void> {
    await db.blocks.delete(id);
    await syncQueueManager.enqueue('block', id, 'DELETE', { id });
  }

  /**
   * Bulk update blocks (for reordering, etc.)
   */
  async updateBlocks(documentId: string, blocks: BlockData[]): Promise<void> {
    await db.transaction('rw', db.blocks, async () => {
      for (const block of blocks) {
        const localBlock: LocalBlock = {
          ...block,
          document_id: documentId,
          _isSynced: false,
          _localUpdatedAt: Date.now(),
        };
        await db.blocks.put(localBlock);
      }
    });

    // Queue sync for each block
    for (const block of blocks) {
      await syncQueueManager.enqueue(
        'block',
        block.id,
        'UPDATE',
        { ...block, document_id: documentId } as Record<string, unknown>
      );
    }
  }

  /**
   * Sync blocks from server
   */
  private async syncBlocksFromServer(documentId: string): Promise<void> {
    try {
      const serverBlocks = await this.fetchBlocksFromServer(documentId);
      if (serverBlocks.length > 0) {
        await this.saveBlocksToLocal(documentId, serverBlocks, true);
      }
    } catch (error) {
      console.error('Error syncing blocks from server:', error);
    }
  }

  /**
   * Fetch blocks from Supabase
   */
  private async fetchBlocksFromServer(documentId: string): Promise<BlockData[]> {
    const supabase = optimizedSupabase.getClient();
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('position', { ascending: true });

    if (error || !data) return [];
    return data.map((block: unknown) => BaseBlockSchema.parse(block));
  }

  /**
   * Save blocks to Dexie
   */
  private async saveBlocksToLocal(
    documentId: string,
    blocks: BlockData[],
    isSynced: boolean
  ): Promise<void> {
    await db.transaction('rw', db.blocks, async () => {
      for (const block of blocks) {
        const localBlock: LocalBlock = {
          ...block,
          document_id: documentId,
          _isSynced: isSynced,
          _localUpdatedAt: Date.now(),
        };
        await db.blocks.put(localBlock);
      }
    });
  }

  /**
   * Convert LocalBlock to BlockData (strip sync metadata)
   */
  private toBlockData(localBlock: LocalBlock): BlockData {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { document_id, _isSynced, _localUpdatedAt, ...blockData } = localBlock;
    return blockData as BlockData;
  }
}

// Singleton instance
export const blockRepository = new BlockRepository();
export default blockRepository;
