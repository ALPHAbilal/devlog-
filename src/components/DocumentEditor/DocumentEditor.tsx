/**
 * DocumentEditor Component
 *
 * Orchestrator component that replaces ExpandedViewEnhanced.jsx.
 * Composes extracted hooks and components for a clean, maintainable architecture.
 *
 * Part of Phase 5C: Component Decomposition
 * Target size: ~200 lines
 */

import { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';

// Feature hooks
import {
  useDocumentState,
  useTagOperations,
  useBlockSync,
  useBlockMove,
  useDragDrop,
  useBlockOperations,
  type BlockType,
  type BlockData,
} from '@/features/document';

import {
  useOptimizedBlockLoader,
  usePaginatedBlockLoader,
} from '@/features/block';

import { useAnalytics, useDocumentAnalytics } from '@/features/analytics';

// Local components
import { HeaderControls } from './HeaderControls';
import { BlockListView } from './BlockListView';
import { LinesView } from './LinesView';
import { TagManager } from './TagManager';
import { BacklinksSection } from './BacklinksSection';
import { DeleteConfirmation } from './DeleteConfirmation';
import { BlockRenderer } from './BlockRenderer';
import { type ViewMode } from './ViewModeToggle';

// External components
// @ts-expect-error - JSX component without type declarations
import { ShareDialogSimple } from '../ShareDialogSimple';
// @ts-expect-error - JSX component without type declarations
import FloatingControlsTrigger from '../FloatingControlsTrigger';
// @ts-expect-error - JSX component without type declarations
import ScrollToTop from '../ScrollToTop';

import '../VirtualizedGrid.css'; // For scrollbar styles

// ============== Types ==============

export interface DocumentEntry {
  id: string | null;
  title: string;
  tags: string[];
  blocks: unknown[];
  blockCount: number;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  folder_id: string | null;
  metadata?: Record<string, unknown>;
}

export interface DocumentEditorProps {
  entry: DocumentEntry;
  onClose?: () => void;
  onUpdate?: (id: string, updates: Partial<DocumentEntry> | null) => Promise<void>;
  allEntries?: DocumentEntry[];
  isMobileView?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** @deprecated - not used in DocumentEditor, kept for backwards compatibility */
  onShowBlockSelector?: () => void;
}

// ============== Component ==============

function DocumentEditorComponent({
  entry,
  onClose,
  onUpdate,
  allEntries = [],
  isMobileView = false,
  scrollContainerRef: externalScrollRef,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onShowBlockSelector: _onShowBlockSelector,
}: DocumentEditorProps) {
  // Refs
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = externalScrollRef || internalScrollRef;
  const blocksRef = useRef<BlockData[]>([]);
  const loadedBlocksRef = useRef<BlockData[]>([]);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Analytics
  const { trackEvent } = useAnalytics();
  const { trackDocumentEvent } = useDocumentAnalytics();

  // Track document view on mount
  useEffect(() => {
    if (entry?.id && entry?.title) {
      trackDocumentEvent('view', entry.id, {
        document_title: entry.title,
        block_count: entry.blockCount || 0,
        has_blocks: !!entry.blocks,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  // Document state (title, tags, backlinks, stableEntry)
  const {
    stableEntry,
    title,
    setTitle,
    isEditingTitle,
    setIsEditingTitle,
    tags,
    setTags,
    backlinks,
  } = useDocumentState({ entry, allEntries });

  // Block loader selection
  const shouldUsePagination = !stableEntry.blocks || stableEntry.blockCount > 50;

  const paginatedLoader = usePaginatedBlockLoader(entry?.id || null, entry, {
    pageSize: 50,
    enableInfiniteScroll: true,
    skip: !shouldUsePagination || !entry?.id,
  });

  const optimizedLoader = useOptimizedBlockLoader(entry?.id || null, entry, {
    skip: shouldUsePagination || !entry?.id,
  });

  const loader = shouldUsePagination ? paginatedLoader : optimizedLoader;

  const {
    blocks: loadedBlocks,
    isLoading: isLoadingBlocks,
    isLoadingMore = false,
    hasMore = false,
    loadMore = () => {},
    updateBlocks: updateLoadedBlocks,
    setBlocksDirectly,
    updateBlock: updateSingleBlock,
    removeBlock,
    progress = null,
  } = loader;

  // Memoize blocks to prevent unnecessary re-renders
  const blocks = useMemo(() => loadedBlocks || [], [loadedBlocks]);

  // Sync blocks to refs
  useEffect(() => {
    blocksRef.current = blocks;
    loadedBlocksRef.current = blocks;
  }, [blocks]);

  // Block sync (SmartSync)
  // Cast entry to the expected type for useBlockSync
  const { smartSyncManagerRef, isInitialLoadRef } = useBlockSync({
    documentId: entry?.id ?? null,
    entry: entry as unknown as Parameters<typeof useBlockSync>[0]['entry'],
  });

  // Tag operations
  const tagOps = useTagOperations({
    tags,
    setTags,
    onUpdate: onUpdate as ((id: string, updates: Record<string, unknown>) => Promise<void>) | undefined,
    entryId: entry?.id ?? null,
  });

  // Block move operations
  const { handleMoveUp, handleMoveDown } = useBlockMove({
    blocksRef: blocksRef as React.MutableRefObject<BlockData[]>,
    updateLoadedBlocks,
    smartSyncManagerRef,
  });

  // Drag and drop
  const dragDrop = useDragDrop({
    blocks,
    updateLoadedBlocks,
    smartSyncManagerRef,
    scrollContainerRef: scrollContainerRef as React.RefObject<HTMLElement | null>,
  });

  // Block CRUD operations
  const blockOps = useBlockOperations({
    documentId: entry?.id ?? null,
    blocks,
    blocksRef: blocksRef as React.MutableRefObject<BlockData[]>,
    loadedBlocksRef: loadedBlocksRef as React.MutableRefObject<BlockData[]>,
    updateSingleBlock,
    updateLoadedBlocks,
    setBlocksDirectly,
    removeBlock,
    smartSyncManagerRef,
    isInitialLoadRef,
    trackEvent,
  });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectedLineBlockId, setSelectedLineBlockId] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Title save handler
  const handleTitleSave = useCallback(async () => {
    if (!entry?.id || !onUpdate) return;
    setIsEditingTitle(false);
    try {
      await onUpdate(entry.id, { title });
    } catch (error) {
      console.error('Failed to save title:', error);
    }
  }, [entry?.id, onUpdate, title, setIsEditingTitle]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!entry?.id || !onUpdate) return;
    setIsDeleting(true);
    try {
      await onUpdate(entry.id, null);
      setShowDeleteConfirm(false);
      onClose?.();
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [entry?.id, onUpdate, onClose]);

  // Background click handler (clear focus)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setFocusedBlockId(null);
    }
  }, []);

  // Memoized Virtuoso callbacks
  const computeItemKey = useCallback((_index: number, block: BlockData) => block.id, []);

  const renderBlockItem = useCallback(
    (index: number, block: BlockData) => (
      <BlockRenderer
        block={block}
        index={index}
        isMobileView={isMobileView}
        // CRITICAL: When no block is focused (null), pass null not false to avoid graying all blocks
        isBlockFocused={focusedBlockId === null ? null : focusedBlockId === block.id}
        isShowingSelector={blockOps.showBlockSelector && blockOps.selectorPosition === block.id}
        draggedBlockId={dragDrop.draggedBlockId}
        dropTargetId={dragDrop.dropTargetId}
        dropPosition={dragDrop.dropPosition}
        blocksLength={blocks.length}
        onUpdate={blockOps.updateBlock}
        onDelete={blockOps.deleteBlock}
        onDuplicate={blockOps.duplicateBlock}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
        onConvert={(blockId: string, newType: string, meta?: Record<string, unknown>) =>
          blockOps.convertBlock(blockId, newType as BlockType, meta)
        }
        onInlineAdd={blockOps.handleInlineBlockAdd}
        onAddBlock={(type: string, afterBlockId: string) =>
          blockOps.addBlock(type as BlockType, afterBlockId)
        }
        onCloseSelector={() => blockOps.setShowBlockSelector(false)}
        onFocus={setFocusedBlockId}
        onDragStart={dragDrop.handleDragStart}
        onDragEnd={dragDrop.handleDragEnd}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={dragDrop.handleDrop}
        blocksRef={blocksRef as React.MutableRefObject<BlockData[]>}
      />
    ),
    [
      isMobileView,
      focusedBlockId,
      blocks.length,
      blockOps,
      dragDrop,
      handleMoveUp,
      handleMoveDown,
    ]
  );

  // Document link navigation handler
  const handleNavigateToDocument = useCallback((docTitle: string) => {
    // Use global handler if available
    if (typeof window !== 'undefined' && (window as unknown as { handleDocumentLink?: (title: string) => void }).handleDocumentLink) {
      (window as unknown as { handleDocumentLink: (title: string) => void }).handleDocumentLink(docTitle);
    }
  }, []);

  return (
    <>
      {/* Floating Controls (desktop only) */}
      {!isMobileView && (
        <FloatingControlsTrigger
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onShare={() => setShowShareDialog(true)}
          onDelete={() => setShowDeleteConfirm(true)}
          scrollThreshold={100}
          scrollContainerRef={scrollContainerRef}
        />
      )}

      {/* Main Content */}
      <div
        ref={internalScrollRef}
        className="h-full overflow-y-auto overflow-x-hidden"
      >
        <div className={`mx-auto fade-in ${isMobileView ? 'px-4 py-3' : 'max-w-4xl px-8 py-8'}`}>
          {/* Header Controls (desktop only) */}
          {!isMobileView && (
            <HeaderControls
              title={title}
              isEditingTitle={isEditingTitle}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              shouldUsePagination={shouldUsePagination}
              progress={progress}
              onTitleChange={setTitle}
              onStartEditingTitle={() => setIsEditingTitle(true)}
              onSaveTitle={handleTitleSave}
              onShare={() => setShowShareDialog(true)}
              onDelete={() => setShowDeleteConfirm(true)}
              documentId={entry?.id ?? null}
              syncManagerRef={smartSyncManagerRef}
            />
          )}

          {/* View Mode: Lines or Blocks */}
          {viewMode === 'lines' ? (
            <LinesView
              blocks={blocks as BlockData[]}
              isMobileView={isMobileView}
              selectedLineBlockId={selectedLineBlockId}
              onSelectLine={setSelectedLineBlockId}
              onSwitchToBlocksView={(id: string) => {
                setViewMode('blocks');
                setFocusedBlockId(id);
              }}
            />
          ) : (
            <BlockListView
              blocks={blocks as BlockData[]}
              isLoadingBlocks={isLoadingBlocks}
              isMobileView={isMobileView}
              scrollContainerRef={scrollContainerRef as React.RefObject<HTMLElement | null>}
              contentContainerRef={contentContainerRef}
              computeItemKey={computeItemKey}
              renderBlockItem={renderBlockItem}
              shouldUsePagination={shouldUsePagination}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              loadMore={loadMore}
              progress={progress}
              showBlockSelector={blockOps.showBlockSelector}
              selectorPosition={blockOps.selectorPosition}
              onAddAtEnd={blockOps.handleAddAtEnd}
              onAddBlock={(type: string) => blockOps.addBlock(type as BlockType)}
              onCloseSelector={() => blockOps.setShowBlockSelector(false)}
              onBackgroundClick={handleBackgroundClick}
            />
          )}

          {/* Tags Section */}
          <TagManager
            tags={tags}
            isMobileView={isMobileView}
            isAddingTag={tagOps.isAddingTag}
            newTag={tagOps.newTag}
            editingTagIndex={tagOps.editingTagIndex}
            editingTagValue={tagOps.editingTagValue}
            onAddTag={tagOps.addTag}
            onUpdateTag={tagOps.updateTag}
            onDeleteTag={tagOps.deleteTag}
            onSetIsAddingTag={tagOps.setIsAddingTag}
            onSetNewTag={tagOps.setNewTag}
            onSetEditingTagIndex={tagOps.setEditingTagIndex}
            onSetEditingTagValue={tagOps.setEditingTagValue}
          />

          {/* Backlinks Section */}
          <BacklinksSection
            backlinks={backlinks}
            isMobileView={isMobileView}
            onNavigateToDocument={handleNavigateToDocument}
          />
        </div>

        {/* Delete Confirmation */}
        <DeleteConfirmation
          isOpen={showDeleteConfirm}
          isMobileView={isMobileView}
          title={title}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        {/* Share Dialog */}
        {showShareDialog && (
          <ShareDialogSimple
            document={{
              id: entry?.id,
              title,
              blocks,
              tags,
              created_at: entry?.created_at,
              updated_at: entry?.updated_at,
            }}
            isOpen={showShareDialog}
            onClose={() => setShowShareDialog(false)}
          />
        )}
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </>
  );
}

// ============== Memoization ==============

export const DocumentEditor = memo(DocumentEditorComponent, (prevProps, nextProps) => {
  // Fast path: check ID first
  if (!prevProps.entry || !nextProps.entry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;

  // Check mobile view
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;

  // Check entries count (for backlinks)
  if (prevProps.allEntries?.length !== nextProps.allEntries?.length) return false;

  // All checks passed
  return true;
});

export default DocumentEditor;
