/**
 * BlockListView Component
 *
 * Virtualized block list using React Virtuoso with pagination support.
 * Includes loading states, load more button, and add block at end.
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx (lines 2121-2236)
 */

import { memo, type RefObject } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Plus } from 'lucide-react';
// @ts-expect-error - JSX component without type declarations
import AddBlockRow from '../AddBlockRow';
// @ts-expect-error - JSX component without type declarations
import OptimizedBlockSkeleton from '../blocks/OptimizedBlockSkeleton';

// ============== Types ==============

export interface BlockData {
  id: string;
  type: string;
  content?: string;
  [key: string]: unknown;
}

export interface PaginationProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface BlockListViewProps {
  blocks: BlockData[];
  isLoadingBlocks: boolean;
  isMobileView: boolean;

  // Virtuoso config
  scrollContainerRef: RefObject<HTMLElement | null>;
  contentContainerRef?: RefObject<HTMLDivElement | null>;
  computeItemKey: (index: number, block: BlockData) => string;
  renderBlockItem: (index: number, block: BlockData) => React.ReactNode;

  // Pagination (for large documents)
  shouldUsePagination: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  progress: PaginationProgress | null;

  // Add block at end
  showBlockSelector: boolean;
  selectorPosition: string | null;
  onAddAtEnd: () => void;
  onAddBlock: (type: string) => void;
  onCloseSelector: () => void;

  // Focus handling
  onBackgroundClick?: (e: React.MouseEvent) => void;
}

// ============== Component ==============

function BlockListViewComponent({
  blocks,
  isLoadingBlocks,
  isMobileView,
  scrollContainerRef,
  contentContainerRef,
  computeItemKey,
  renderBlockItem,
  shouldUsePagination,
  hasMore,
  isLoadingMore,
  loadMore,
  progress,
  showBlockSelector,
  selectorPosition,
  onAddAtEnd,
  onAddBlock,
  onCloseSelector,
  onBackgroundClick,
}: BlockListViewProps) {
  return (
    <div
      ref={contentContainerRef}
      className={`mb-8 min-h-[400px] relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--block-gap, 16px)' }}
      onClick={onBackgroundClick}
    >
      {/* Show loading skeletons during initial document load */}
      {isLoadingBlocks && blocks.length === 0 && (
        <>
          {/* Loading message */}
          <div className={`text-center mb-6 ${isMobileView ? '' : 'ml-8'}`}>
            <div className="inline-flex items-center gap-2 text-text-secondary animate-pulse">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-sm">Loading document...</span>
            </div>
          </div>

          {/* Skeleton blocks */}
          <div className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}>
            <OptimizedBlockSkeleton type="heading" estimatedHeight={60} />
          </div>
          <div className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}>
            <OptimizedBlockSkeleton type="text" estimatedHeight={120} />
          </div>
          <div className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}>
            <OptimizedBlockSkeleton type="text" estimatedHeight={100} />
          </div>
          <div className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}>
            <OptimizedBlockSkeleton type="code" estimatedHeight={150} />
          </div>
        </>
      )}

      {/* Virtualized Block List with React Virtuoso */}
      {blocks.length > 0 && scrollContainerRef.current && (
        <Virtuoso
          useWindowScroll={false}
          customScrollParent={scrollContainerRef.current}
          style={{ height: '100%', willChange: 'contents' }}
          data={blocks}
          defaultItemHeight={150}
          increaseViewportBy={{ top: 400, bottom: 800 }}
          skipAnimationFrameInResizeObserver={true}
          computeItemKey={computeItemKey}
          itemContent={renderBlockItem}
          rangeChanged={(range) => {
            console.log('[VIRTUOSO-RANGE] Visible range changed:', {
              startIndex: range.startIndex,
              endIndex: range.endIndex,
              visibleCount: range.endIndex - range.startIndex + 1,
            });
          }}
        />
      )}

      {/* Load More Indicator for Paginated Documents */}
      {shouldUsePagination && hasMore && progress && (
        <div className="relative py-8">
          {isLoadingMore ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-text-secondary">
                <div
                  className="w-5 h-5 border-2 border-text-secondary/30 border-t-accent-green
                                    rounded-full animate-spin"
                />
                <span>Loading more blocks...</span>
              </div>
              <div className="text-xs text-text-secondary/60">
                {progress.loaded} of {progress.total} blocks loaded
              </div>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="w-full py-4 border border-dark-secondary/50 rounded-lg
                             text-text-secondary hover:text-text-primary
                             hover:border-dark-secondary/50 transition-all
                             flex items-center justify-center gap-2 group"
            >
              <span>Load more blocks</span>
              <span className="text-xs text-text-secondary/60">
                ({progress.total - progress.loaded} remaining)
              </span>
            </button>
          )}
        </div>
      )}

      {/* Add block at end */}
      <div className="relative pt-4">
        <button
          onClick={onAddAtEnd}
          className={`w-full ${isMobileView ? 'py-12' : 'py-8'} border-2 border-dashed
                     ${isMobileView ? 'border-dark-secondary/70 bg-dark-secondary/10' : 'border-dark-secondary/50'}
                     rounded-lg text-text-secondary hover:text-text-primary
                     hover:border-dark-secondary/50 transition-all
                     flex items-center justify-center gap-2 group
                     ${isMobileView ? 'active:scale-98 touch-manipulation active:bg-dark-secondary/20' : ''}`}
        >
          <Plus
            size={isMobileView ? 24 : 20}
            className="group-hover:scale-110 transition-transform"
          />
          <span className={isMobileView ? 'text-base font-medium' : ''}>
            Add a block
          </span>
        </button>
        <AddBlockRow
          show={showBlockSelector && selectorPosition === 'end'}
          onSelect={(type: string) => onAddBlock(type)}
          onClose={onCloseSelector}
          isMobileView={isMobileView}
        />
      </div>
    </div>
  );
}

export const BlockListView = memo(BlockListViewComponent);
export default BlockListView;
