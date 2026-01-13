// src/shared/db/hooks/use-blocks.ts
/**
 * useRxBlocks Hook
 *
 * RxDB-based blocks hook.
 * Replaces useBlocks from use-blocks-query.ts.
 *
 * Features:
 * - Real-time reactivity via RxDB subscriptions
 * - Automatic Supabase sync via replication
 * - Same API as old useBlocks for drop-in replacement
 *
 * CRITICAL: Serialization/Deserialization happens HERE, not in replication layer.
 * - RxDB stores serialized `content` (JSON string)
 * - UI sees deserialized fields (messages, data, treeData, images)
 * - This prevents data loss from RxDB ignoring unknown schema fields
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRxDB, useRxCollection } from '../rxdb-hooks.tsx';
import type { BlockDocType } from '../rxdb-types';
import type { RxCollection, RxDocument } from 'rxdb';
import type { BlockData } from '@/features/block/lib/schemas';
import { serializeBlock, deserializeBlock } from '@/features/block/lib/serializer';

interface UseRxBlocksOptions {
  enabled?: boolean;
}

// Convert RxDB doc to BlockData format
// Deserializes content JSON to expand messages/data/treeData/images for UI
function toBlockData(doc: BlockDocType): BlockData {
  // First convert to base structure
  const base = {
    id: doc.id,
    type: doc.type,
    content: doc.content,
    position: doc.position,
    metadata: doc.metadata,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };

  // Deserialize to expand content into messages/data/treeData/images
  // This converts RxDB storage format → UI format
  return deserializeBlock(base as any) as BlockData;
}

export function useRxBlocks(documentId: string | undefined, options: UseRxBlocksOptions = {}) {
  const { enabled = true } = options;
  const db = useRxDB();
  const collection = useRxCollection<BlockDocType>('blocks');

  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to blocks for this document
  useEffect(() => {
    if (!db || !collection || !documentId || !enabled) {
      setIsLoading(false);
      setBlocks([]);
      return;
    }

    setIsLoading(true);

    const query = collection.find({
      selector: {
        document_id: documentId,
        _deleted: { $ne: true },
      },
      sort: [{ position: 'asc' }],
    });

    const subscription = query.$.subscribe({
      next: (docs: RxDocument<BlockDocType>[]) => {
        setBlocks(docs.map(doc => toBlockData(doc.toJSON())));
        setIsLoading(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsLoading(false);
        console.error('[useRxBlocks] Error:', err);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collection, documentId, enabled]);

  // Create block
  // Serializes messages/data/treeData/images → content JSON before RxDB storage
  const createBlock = useCallback(async (block: BlockData) => {
    if (!collection || !documentId) return;

    const now = Date.now();

    // Serialize block to convert messages/data/treeData/images → content
    const serialized = serializeBlock({
      ...block,
      id: block.id || crypto.randomUUID(),
      created_at: block.created_at || now,
      updated_at: now,
    } as any);

    const newBlock: BlockDocType = {
      id: serialized.id,
      document_id: documentId,
      type: serialized.type,
      content: serialized.content || '',
      position: serialized.position,
      metadata: serialized.metadata || {},
      created_at: now,
      updated_at: now,
      _modified: now,
      _deleted: false,
    };

    await collection.insert(newBlock);
  }, [collection, documentId]);

  // Update block
  // Merges updates with current state, serializes, then patches RxDB
  const updateBlock = useCallback(async (id: string, updates: Partial<BlockData>) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) {
      console.warn(`[useRxBlocks] Block ${id} not found`);
      return;
    }

    // Get current state (raw from RxDB - may be serialized)
    const currentData = doc.toJSON();

    // First deserialize current state to get full block with messages/data/etc
    const deserializedCurrent = deserializeBlock(currentData as any);

    // Merge with updates (updates may contain messages, data, treeData, images)
    const merged = {
      ...deserializedCurrent,
      ...updates,
    };

    // Serialize to convert messages/data/treeData/images → content
    const serialized = serializeBlock(merged as any);

    await doc.patch({
      content: serialized.content,
      metadata: serialized.metadata,
      updated_at: Date.now(),
      _modified: Date.now(),
    } as Partial<BlockDocType>);
  }, [collection]);

  // Delete block
  const deleteBlock = useCallback(async (id: string) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) return;

    // Soft delete via _deleted flag (for replication)
    await doc.patch({
      _deleted: true,
      _modified: Date.now(),
    });
  }, [collection]);

  // Bulk update (for reordering)
  // Serializes each block before updating RxDB
  const updateBlocks = useCallback(async (newBlocks: BlockData[]) => {
    if (!collection || !documentId) return;

    const now = Date.now();

    // Update each block with new position
    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      const doc = await collection.findOne(block.id).exec();

      // Serialize block to convert messages/data/treeData/images → content
      const serialized = serializeBlock({
        ...block,
        position: i,
      } as any);

      if (doc) {
        await doc.patch({
          position: i,
          content: serialized.content,
          metadata: serialized.metadata,
          updated_at: now,
          _modified: now,
        } as Partial<BlockDocType>);
      } else {
        // Insert new block if doesn't exist
        await collection.insert({
          id: block.id || crypto.randomUUID(),
          document_id: documentId,
          type: serialized.type,
          content: serialized.content || '',
          position: i,
          metadata: serialized.metadata || {},
          created_at: now,
          updated_at: now,
          _modified: now,
          _deleted: false,
        });
      }
    }
  }, [collection, documentId]);

  return {
    blocks,
    isLoading,
    isSyncing: false, // RxDB handles sync automatically
    error,

    // Single block operations
    updateBlock,
    createBlock,
    deleteBlock,

    // Bulk operations
    updateBlocks,

    // Mutation states (RxDB mutations are synchronous to local)
    isUpdating: false,
    isCreating: false,
    isDeleting: false,

    // === COMPATIBILITY LAYER (for usePaginatedBlockLoader consumers) ===
    loadMore: () => {}, // noop - all blocks loaded
    hasMore: false,
    isLoadingMore: false,
    totalCount: blocks.length,
    currentPage: 0,
    checkLoadMore: () => {}, // noop

    // Aliases for API compatibility
    removeBlock: deleteBlock,
    setBlocksDirectly: updateBlocks,

    // Progress tracking
    progress: {
      loaded: blocks.length,
      total: blocks.length,
      percentage: 100,
    },
  };
}
