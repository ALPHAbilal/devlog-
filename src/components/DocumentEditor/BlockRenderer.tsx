/**
 * BlockRenderer Component
 *
 * Memoized block renderer that wraps Block with error boundary and AddBlockRow.
 * Computes boolean props to prevent unnecessary re-renders for unaffected blocks.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx (lines 301-436)
 */

import { memo } from 'react';
// @ts-expect-error - JSX component without type declarations
import Block from '../Block';
// @ts-expect-error - JSX component without type declarations
import AddBlockRow from '../AddBlockRow';
// @ts-expect-error - JSX component without type declarations
import BlockErrorBoundary from '../BlockErrorBoundary';
// @ts-expect-error - JSX component without type declarations
import OptimizedBlockSkeleton from '../blocks/OptimizedBlockSkeleton';

// ============== Types ==============

export interface BlockData {
  id: string;
  type: string;
  content?: string;
  isLoading?: boolean;
  estimatedHeight?: number;
  [key: string]: unknown;
}

export interface BlockRendererProps {
  block: BlockData;
  index: number;
  isMobileView: boolean;
  isBlockFocused: boolean | null; // null = no block focused, true = this block focused, false = other block focused
  isShowingSelector: boolean;
  draggedBlockId: string | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after';
  blocksLength: number;

  // Callbacks
  onUpdate: (blockId: string, updates: Partial<BlockData>) => void;
  onDelete: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  onConvert: (
    blockId: string,
    newType: string,
    meta?: Record<string, unknown>
  ) => void;
  onInlineAdd: (index: number, data: string | BlockData) => void;
  onAddBlock: (type: string, afterBlockId: string) => void;
  onCloseSelector: () => void;
  onFocus: (blockId: string | null) => void;

  // Drag handlers
  onDragStart: (blockId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, blockId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (draggedId: string, targetId: string) => void;

  // Ref for all blocks (used by Block component)
  blocksRef: React.MutableRefObject<BlockData[]>;
}

// ============== Component ==============

function BlockRendererComponent({
  block,
  index,
  isMobileView,
  isBlockFocused,
  isShowingSelector,
  draggedBlockId,
  dropTargetId,
  dropPosition,
  blocksLength,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onConvert,
  onInlineAdd,
  onAddBlock,
  onCloseSelector,
  onFocus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  blocksRef,
}: BlockRendererProps) {
  // Compute move availability
  const canMoveUp = index > 0;
  const canMoveDown = index < blocksLength - 1;

  return (
    <div
      className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
      style={{ zIndex: isBlockFocused ? 50 : 1 }}
    >
      {block?.isLoading ? (
        <OptimizedBlockSkeleton
          type={block.type}
          estimatedHeight={block.estimatedHeight || 100}
        />
      ) : (
        <>
          <BlockErrorBoundary blockType={block?.type} blockId={block?.id}>
            <Block
              block={block}
              index={index}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              isMobileView={isMobileView}
              onAddBelow={(data: string | BlockData) => onInlineAdd(index, data)}
              onConvert={onConvert}
              showAddButton={true}
              isFocused={isBlockFocused}
              onFocus={onFocus}
              allBlocks={blocksRef.current}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              draggedBlockId={draggedBlockId}
              dropTargetId={dropTargetId}
              dropPosition={dropPosition}
            />
          </BlockErrorBoundary>
          <AddBlockRow
            show={isShowingSelector}
            onSelect={(type: string) => {
              onAddBlock(type, block.id);
            }}
            onClose={onCloseSelector}
            isMobileView={isMobileView}
          />
        </>
      )}
    </div>
  );
}

// ============== Memoization ==============

// Vite environment type declaration
declare const __DEV__: boolean | undefined;

export const BlockRenderer = memo(
  BlockRendererComponent,
  (prevProps, nextProps) => {
    // DEV ONLY: Log what caused re-render
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : (import.meta as any).env?.DEV;
    if (isDev) {
      const reasons: string[] = [];
      if (prevProps.block !== nextProps.block) reasons.push('block');
      if (prevProps.index !== nextProps.index) reasons.push('index');
      if (prevProps.isBlockFocused !== nextProps.isBlockFocused)
        reasons.push('focus');
      if (prevProps.isShowingSelector !== nextProps.isShowingSelector)
        reasons.push('selector');

      const prevDragged = prevProps.draggedBlockId === prevProps.block.id;
      const nextDragged = nextProps.draggedBlockId === nextProps.block.id;
      if (prevDragged !== nextDragged) reasons.push('drag');

      const prevDropTarget = prevProps.dropTargetId === prevProps.block.id;
      const nextDropTarget = nextProps.dropTargetId === nextProps.block.id;
      if (prevDropTarget !== nextDropTarget) reasons.push('dropTarget');

      if (
        prevDropTarget &&
        nextDropTarget &&
        prevProps.dropPosition !== nextProps.dropPosition
      ) {
        reasons.push('dropPosition');
      }

      if (prevProps.isMobileView !== nextProps.isMobileView)
        reasons.push('mobileView');

      if (reasons.length > 0) {
        console.log(
          `[MEMO-DEBUG] Block ${nextProps.block.id.substring(0, 8)} re-render: ${reasons.join(', ')}`
        );
      }
    }

    // Fast path: Check most frequently changing props first
    // Block reference changes most often (content edits)
    if (prevProps.block !== nextProps.block) return false;
    if (prevProps.index !== nextProps.index) return false;
    if (prevProps.blocksLength !== nextProps.blocksLength) return false;

    // Check computed boolean props (these only change when THIS block is affected)
    if (prevProps.isBlockFocused !== nextProps.isBlockFocused) return false;
    if (prevProps.isShowingSelector !== nextProps.isShowingSelector)
      return false;

    // Check if THIS block is affected by drag operations
    const prevDragged = prevProps.draggedBlockId === prevProps.block.id;
    const nextDragged = nextProps.draggedBlockId === nextProps.block.id;
    if (prevDragged !== nextDragged) return false;

    const prevDropTarget = prevProps.dropTargetId === prevProps.block.id;
    const nextDropTarget = nextProps.dropTargetId === nextProps.block.id;
    if (prevDropTarget !== nextDropTarget) return false;

    // Only check dropPosition if this block is the drop target
    if (prevDropTarget && nextDropTarget) {
      if (prevProps.dropPosition !== nextProps.dropPosition) return false;
    }

    // Rarely changes
    if (prevProps.isMobileView !== nextProps.isMobileView) return false;

    // All checks passed - skip re-render
    return true;
  }
);

export default BlockRenderer;
