/**
 * useDragDrop Hook
 *
 * Manages drag and drop operations for blocks:
 * - Drag state (draggedBlockId, dropTargetId, dropPosition)
 * - Auto-scroll during drag
 * - Drag/drop event handlers
 * - SmartSync REORDER on drop
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useState, useCallback, useRef, startTransition } from 'react';
import { flushSync } from 'react-dom';
import type { SmartSyncManager } from './use-block-sync';

// ============== Types ==============

export interface BlockData {
  id: string;
  type: string;
  position?: number;
  content?: string;
  [key: string]: unknown;
}

export interface UseDragDropOptions {
  blocks: BlockData[];
  updateLoadedBlocks: (blocks: BlockData[]) => void;
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export interface UseDragDropReturn {
  // Drag state
  draggedBlockId: string | null;
  setDraggedBlockId: (id: string | null) => void;
  dropTargetId: string | null;
  setDropTargetId: (id: string | null) => void;
  dropPosition: 'before' | 'after';
  setDropPosition: (position: 'before' | 'after') => void;

  // Handlers (to pass to Block components)
  handleDragStart: (blockId: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, blockId: string) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (draggedId: string, targetId: string) => void;
}

// ============== Hook Implementation ==============

export function useDragDrop({
  blocks,
  updateLoadedBlocks,
  smartSyncManagerRef,
  scrollContainerRef,
}: UseDragDropOptions): UseDragDropReturn {

  // Drag state
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after');

  // Auto-scroll interval ref
  const dragScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll during drag
  const startAutoScroll = useCallback((direction: 'up' | 'down') => {
    if (dragScrollInterval.current) return;

    dragScrollInterval.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const scrollSpeed = 5;
        scrollContainerRef.current.scrollTop += direction === 'up' ? -scrollSpeed : scrollSpeed;
      }
    }, 16); // ~60fps
  }, [scrollContainerRef]);

  const stopAutoScroll = useCallback(() => {
    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition('after');
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();

    // Auto-scroll detection
    if (scrollContainerRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollThreshold = 100;

      if (e.clientY < rect.top + scrollThreshold) {
        startAutoScroll('up');
      } else if (e.clientY > rect.bottom - scrollThreshold) {
        startAutoScroll('down');
      } else {
        stopAutoScroll();
      }
    }

    // Determine drop position (before or after the block)
    const blockElement = e.currentTarget;
    const rect = blockElement.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    if (e.clientY < midpoint) {
      setDropPosition('before');
    } else {
      setDropPosition('after');
    }

    setDropTargetId(blockId);
  }, [scrollContainerRef, startAutoScroll, stopAutoScroll]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the entire block area
    if (e.relatedTarget && e.currentTarget && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetId(null);
    } else if (!e.relatedTarget) {
      // If relatedTarget is null (mouse left the document), clear the drop target
      setDropTargetId(null);
    }
  }, []);

  const handleDrop = useCallback((draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Use flushSync to ensure immediate state update
    flushSync(() => {
      // Get the dragged block
      const draggedBlock = blocks[draggedIndex];

      // Create a new array without the dragged block
      const blocksWithoutDragged = blocks.filter((_, index) => index !== draggedIndex);

      // Calculate insert index based on drop position
      let insertIndex = targetIndex;
      if (draggedIndex < targetIndex) {
        // If dragging down, adjust index since we removed an item
        insertIndex = dropPosition === 'before' ? targetIndex - 1 : targetIndex;
      } else {
        // If dragging up
        insertIndex = dropPosition === 'before' ? targetIndex : targetIndex + 1;
      }

      // Create final array by inserting at the correct position
      const updatedBlocks: BlockData[] = [
        ...blocksWithoutDragged.slice(0, insertIndex),
        draggedBlock,
        ...blocksWithoutDragged.slice(insertIndex)
      ].filter((b): b is BlockData => b !== undefined);

      // Update state with completely new array
      startTransition(() => {
        updateLoadedBlocks(updatedBlocks);
      });

      // CRITICAL FIX: Call Smart Sync for drag-drop reorder
      if (smartSyncManagerRef.current && draggedBlock) {
        // DEBUG: Log what we're sending for drag-drop REORDER
        console.log('[DEBUG-FIX] Drag-drop REORDER operation with:', {
          blockId: draggedBlock.id,
          blockType: draggedBlock.type,
          position: insertIndex,
          action: 'REORDER'
        });

        // Send all required parameters for REORDER
        smartSyncManagerRef.current.handleChange(
          draggedBlock.id,
          null,                 // REORDER doesn't need content - only position changes!
          'REORDER',
          draggedBlock.type,    // block type (required!)
          insertIndex           // position as number (required!)
        ).catch((error: Error) => {
          console.error('Smart Sync drag-drop error:', error);
        });
      }
    });

    // Clean up drag state after flushSync
    flushSync(() => {
      setDraggedBlockId(null);
      setDropTargetId(null);
      setDropPosition('after');
    });

    stopAutoScroll();
  }, [blocks, updateLoadedBlocks, dropPosition, stopAutoScroll, smartSyncManagerRef]);

  return {
    draggedBlockId,
    setDraggedBlockId,
    dropTargetId,
    setDropTargetId,
    dropPosition,
    setDropPosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
