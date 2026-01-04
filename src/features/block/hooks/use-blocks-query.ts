// src/features/block/hooks/use-blocks-query.ts
/**
 * useBlocks Hook
 *
 * Hybrid pattern: Dexie useLiveQuery + TanStack Query.
 * Replaces sessionCache, useOptimizedBlockLoader, usePaginatedBlockLoader.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/storage/dexie-db';
import { blockRepository } from '@/entities/Block/Block.repository';
import { blockKeys } from '@/shared/api/query-keys';
import type { BlockData } from '@/features/block/lib/schemas';

interface UseBlocksOptions {
  enabled?: boolean;
}

export function useBlocks(documentId: string | undefined, options: UseBlocksOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  // Local-first: Dexie live query for instant reactivity
  const localBlocks = useLiveQuery(
    () => documentId
      ? db.blocks
          .where('document_id')
          .equals(documentId)
          .sortBy('position')
      : [],
    [documentId],
    []
  );

  // Remote sync: TanStack Query for Supabase (background)
  const remoteQuery = useQuery({
    queryKey: blockKeys.byDocument(documentId!),
    queryFn: () => blockRepository.getBlocks(documentId!),
    enabled: enabled && !!documentId && (typeof navigator !== 'undefined' ? navigator.onLine : true),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Update single block
  const updateBlockMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BlockData> }) =>
      blockRepository.updateBlock(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Create block
  const createBlockMutation = useMutation({
    mutationFn: (block: BlockData) =>
      blockRepository.createBlock(documentId!, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Delete block
  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => blockRepository.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Bulk update (for reordering)
  const updateBlocksMutation = useMutation({
    mutationFn: (blocks: BlockData[]) =>
      blockRepository.updateBlocks(documentId!, blocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Strip sync metadata from local blocks
  const blocks: BlockData[] = (localBlocks || []).map(block => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { document_id, _isSynced, _localUpdatedAt, ...blockData } = block;
    return blockData as BlockData;
  });

  const isLoading = localBlocks === undefined && remoteQuery.isLoading;
  const isSyncing = (localBlocks || []).some(b => !b._isSynced);

  // Callback wrappers for easier use
  const updateBlock = useCallback((id: string, updates: Partial<BlockData>) => {
    updateBlockMutation.mutate({ id, updates });
  }, [updateBlockMutation]);

  const createBlock = useCallback((block: BlockData) => {
    createBlockMutation.mutate(block);
  }, [createBlockMutation]);

  const deleteBlock = useCallback((id: string) => {
    deleteBlockMutation.mutate(id);
  }, [deleteBlockMutation]);

  const updateBlocks = useCallback((newBlocks: BlockData[]) => {
    updateBlocksMutation.mutate(newBlocks);
  }, [updateBlocksMutation]);

  return {
    blocks,
    isLoading,
    isSyncing,
    error: remoteQuery.error,

    // Single block operations
    updateBlock,
    createBlock,
    deleteBlock,

    // Bulk operations
    updateBlocks,

    // Mutation states
    isUpdating: updateBlockMutation.isPending || updateBlocksMutation.isPending,
    isCreating: createBlockMutation.isPending,
    isDeleting: deleteBlockMutation.isPending,

    // === COMPATIBILITY LAYER (for usePaginatedBlockLoader consumers) ===
    // Pagination (not applicable - all blocks loaded at once via Dexie)
    loadMore: () => {}, // noop - no pagination needed
    hasMore: false,
    isLoadingMore: false,
    totalCount: blocks.length,
    currentPage: 0,
    checkLoadMore: () => {}, // noop - no infinite scroll

    // Aliases for API compatibility
    removeBlock: deleteBlock, // alias for usePaginatedBlockLoader.removeBlock
    setBlocksDirectly: updateBlocks, // alias for usePaginatedBlockLoader.setBlocksDirectly

    // Progress tracking (computed)
    progress: {
      loaded: blocks.length,
      total: blocks.length,
      percentage: 100, // All blocks loaded instantly from Dexie
    },
  };
}
