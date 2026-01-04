// src/entities/Block/Block.repository.ts
/**
 * Block Repository
 *
 * Same hybrid pattern as DocumentRepository:
 * Dexie first, Supabase sync in background.
 *
 * CRITICAL: This repository handles serialization/deserialization:
 * - Dexie stores DESERIALIZED blocks (expanded format for fast local access)
 * - Supabase stores SERIALIZED blocks (content as JSON string)
 */

import { db, type LocalBlock } from '@/shared/lib/storage/dexie-db';
import { optimizedSupabase } from '@/shared/api';
import { BaseBlockSchema, type BlockData, type SerializedBlock } from '@/features/block/lib/schemas';
import { deserializeBlock } from '@/features/block/lib/serializer';

// NOTE: Supabase syncing is handled by SmartSync (via useBlockOperations.handleChange())
// BlockRepository only manages local Dexie storage for instant reactivity via useLiveQuery

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
   * NOTE: Only stores to Dexie. SmartSync handles Supabase syncing via useBlockOperations.
   */
  async updateBlock(id: string, updates: Partial<BlockData>): Promise<BlockData | null> {
    const existing = await db.blocks.get(id);
    if (!existing) return null;

    // Store DESERIALIZED in Dexie for fast local access
    const updated: LocalBlock = {
      ...existing,
      ...updates,
      _isSynced: false, // Mark as needing sync (SmartSync will handle it)
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(updated);

    // NOTE: Supabase syncing is handled by SmartSync via useBlockOperations.handleChange()
    // This avoids double-syncing conflicts between syncQueueManager and SmartSync.

    return this.toBlockData(updated);
  }

  /**
   * Create new block
   * NOTE: Only stores to Dexie. SmartSync handles Supabase syncing via useBlockOperations.
   */
  async createBlock(documentId: string, block: BlockData): Promise<BlockData> {
    // Store DESERIALIZED in Dexie for fast local access
    const localBlock: LocalBlock = {
      ...block,
      document_id: documentId,
      _isSynced: false, // Mark as needing sync (SmartSync will handle it)
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(localBlock);

    // NOTE: Supabase syncing is handled by SmartSync via useBlockOperations.handleChange()

    return block;
  }

  /**
   * Delete block
   * NOTE: Only deletes from Dexie. SmartSync handles Supabase syncing via useBlockOperations.
   */
  async deleteBlock(id: string): Promise<void> {
    await db.blocks.delete(id);
    // NOTE: Supabase syncing is handled by SmartSync via useBlockOperations.handleChange()
  }

  /**
   * Bulk update blocks (for reordering, etc.)
   * NOTE: Only stores to Dexie. SmartSync handles Supabase syncing via useBlockOperations.
   */
  async updateBlocks(documentId: string, blocks: BlockData[]): Promise<void> {
    // Store DESERIALIZED in Dexie for fast local access
    await db.transaction('rw', db.blocks, async () => {
      for (const block of blocks) {
        const localBlock: LocalBlock = {
          ...block,
          document_id: documentId,
          _isSynced: false, // Mark as needing sync (SmartSync will handle it)
          _localUpdatedAt: Date.now(),
        };
        await db.blocks.put(localBlock);
      }
    });

    // NOTE: Supabase syncing is handled by SmartSync via useBlockOperations.handleChange()
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
   * CRITICAL: Supabase stores SERIALIZED blocks, must deserialize for local use
   */
  private async fetchBlocksFromServer(documentId: string): Promise<BlockData[]> {
    const supabase = optimizedSupabase.getClient();
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('position', { ascending: true });

    if (error || !data) return [];

    // CRITICAL: Deserialize blocks from Supabase format
    // Supabase has content as JSON string, we need expanded format
    return data.map((block: unknown) => {
      // First validate base structure
      const validated = BaseBlockSchema.parse(block);
      // Then deserialize to expand content
      return deserializeBlock(validated as SerializedBlock);
    });
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
