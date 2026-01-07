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
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRxDB, useRxCollection } from '../rxdb-hooks.tsx';
import type { BlockDocType } from '../rxdb-types';
import type { RxCollection, RxDocument } from 'rxdb';
import type { BlockData } from '@/features/block/lib/schemas';

interface UseRxBlocksOptions {
  enabled?: boolean;
}

// Convert RxDB doc to BlockData format
function toBlockData(doc: BlockDocType): BlockData {
  return {
    id: doc.id,
    type: doc.type,
    content: doc.content,
    position: doc.position,
    metadata: doc.metadata,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  } as BlockData;
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
  const createBlock = useCallback(async (block: BlockData) => {
    if (!collection || !documentId) return;

    const now = Date.now();
    const newBlock: BlockDocType = {
      id: block.id || crypto.randomUUID(),
      document_id: documentId,
      type: block.type,
      content: block.content || '',
      position: block.position,
      metadata: block.metadata || {},
      created_at: block.created_at || now,
      updated_at: now,
      _modified: now,
      _deleted: false,
    };

    await collection.insert(newBlock);
  }, [collection, documentId]);

  // Update block
  const updateBlock = useCallback(async (id: string, updates: Partial<BlockData>) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) {
      console.warn(`[useRxBlocks] Block ${id} not found`);
      return;
    }

    await doc.patch({
      ...updates,
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
  const updateBlocks = useCallback(async (newBlocks: BlockData[]) => {
    if (!collection || !documentId) return;

    const now = Date.now();

    // Update each block with new position
    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      const doc = await collection.findOne(block.id).exec();

      if (doc) {
        await doc.patch({
          position: i,
          content: block.content,
          metadata: block.metadata,
          updated_at: now,
          _modified: now,
        } as Partial<BlockDocType>);
      } else {
        // Insert new block if doesn't exist
        await collection.insert({
          id: block.id || crypto.randomUUID(),
          document_id: documentId,
          type: block.type,
          content: block.content || '',
          position: i,
          metadata: block.metadata || {},
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
