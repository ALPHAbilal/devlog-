/**
 * useBlockMove Hook
 *
 * Manages block move up/down operations:
 * - moveBlock function with position recalculation
 * - Memoized handleMoveUp/handleMoveDown
 * - SmartSync REORDER for all affected blocks
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useCallback, startTransition } from 'react';
import type { SmartSyncManager } from './use-block-sync';

// ============== Types ==============

export interface BlockData {
  id: string;
  type: string;
  position?: number;
  content?: string;
  [key: string]: unknown;
}

export interface UseBlockMoveOptions {
  blocksRef: React.MutableRefObject<BlockData[]>;
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
}

export interface UseBlockMoveReturn {
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  handleMoveUp: (blockId: string) => void;
  handleMoveDown: (blockId: string) => void;
}

// ============== Hook Implementation ==============

export function useBlockMove({
  blocksRef,
  updateLoadedBlocks,
  smartSyncManagerRef,
}: UseBlockMoveOptions): UseBlockMoveReturn {

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    // Enhanced debug logging with unique invocation ID
    const invocationId = Math.random().toString(36).substring(7);

    // CRITICAL FIX: Use blocksRef.current to avoid stale closure issue
    // The memoized BlockRenderer captures old 'blocks' from closure,
    // but blocksRef.current always has the latest blocks array
    const currentBlocks = blocksRef.current;

    console.log('[DEBUG-MOVE-3] moveBlock START:', {
      invocationId,
      blockId,
      direction,
      timestamp: Date.now(),
      blocksCount: currentBlocks?.length,
    });

    const blockIndex = currentBlocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      console.log('[DEBUG-MOVE-3] moveBlock ABORT - block not found:', { invocationId, blockId, blocksCount: currentBlocks?.length });
      return;
    }

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= currentBlocks.length) {
      console.log('[DEBUG-MOVE-3] moveBlock ABORT - invalid index:', { invocationId, newIndex });
      return;
    }

    const updatedBlocks = [...currentBlocks];
    const [movedBlock] = updatedBlocks.splice(blockIndex, 1);
    if (!movedBlock) {
      console.log('[DEBUG-MOVE-3] moveBlock ABORT - movedBlock is undefined');
      return;
    }
    updatedBlocks.splice(newIndex, 0, movedBlock);

    console.log('[DEBUG-MOVE-3] moveBlock STATE UPDATE:', {
      invocationId,
      blockId,
      oldIndex: blockIndex,
      newIndex,
      blockType: movedBlock.type
    });

    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });

    // Strategic logging for move position calculation
    console.log('[MOVE] Block move calculation:', {
      blockId: blockId,
      currentIndex: blockIndex,
      direction,
      newIndex,
      totalBlocks: currentBlocks.length,
    });

    // CRITICAL FIX: Call Smart Sync for ALL affected blocks, not just the moved one!
    // When moving from index 3 to index 0:
    // - Block at position 3 → position 0 (moved block)
    // - Block at position 0 → position 1 (shifted)
    // - Block at position 1 → position 2 (shifted)
    // - Block at position 2 → position 3 (shifted)
    if (smartSyncManagerRef.current && movedBlock) {
      // Determine which blocks need position updates
      const minIndex = Math.min(blockIndex, newIndex);
      const maxIndex = Math.max(blockIndex, newIndex);

      console.log('[DEBUG-MOVE-4] Sending REORDER for ALL affected blocks:', {
        invocationId,
        movedBlockId: movedBlock.id,
        fromIndex: blockIndex,
        toIndex: newIndex,
        affectedRange: `${minIndex} to ${maxIndex}`,
        totalAffected: maxIndex - minIndex + 1,
        timestamp: Date.now()
      });

      // Send REORDER for each block that needs a position update
      const reorderPromises: Promise<unknown>[] = [];
      for (let i = minIndex; i <= maxIndex; i++) {
        const block = updatedBlocks[i] as BlockData | undefined;
        if (block) {
          console.log('[DEBUG-MOVE-4] Sending REORDER for block:', {
            blockId: block.id.substring(0, 8),
            blockType: block.type,
            newPosition: i
          });

          reorderPromises.push(
            smartSyncManagerRef.current!.handleChange(
              block.id,
              null,           // REORDER doesn't need content
              'REORDER',
              block.type,     // Block type
              i               // New position (array index)
            )
          );
        }
      }

      // Wait for all REORDER operations
      Promise.all(reorderPromises).catch((error: Error) => {
        console.error('[DEBUG-MOVE-4] Smart Sync move error:', { invocationId, error });
      });
    }

    console.log('[DEBUG-MOVE-3] moveBlock END:', { invocationId, timestamp: Date.now() });
  }, [updateLoadedBlocks, blocksRef, smartSyncManagerRef]);

  // Memoized move handlers to prevent breaking React.memo on Block components
  const handleMoveUp = useCallback((blockId: string) => moveBlock(blockId, 'up'), [moveBlock]);
  const handleMoveDown = useCallback((blockId: string) => moveBlock(blockId, 'down'), [moveBlock]);

  return {
    moveBlock,
    handleMoveUp,
    handleMoveDown,
  };
}
