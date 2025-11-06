import React, { useState, useEffect, useRef, useCallback, startTransition, useMemo, useDeferredValue, memo } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, Plus, Link2, LayoutList, LayoutGrid, Trash2, Share2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Block from './Block';
import CompactBlockLine from './CompactBlockLine';
import AddBlockRow from './AddBlockRow';
import OptimizedBlockSkeleton from './blocks/OptimizedBlockSkeleton';
import { getBacklinks } from '../utils/extractLinks';
import { useOptimizedBlockLoader } from '../hooks/useOptimizedBlockLoader';
import { usePaginatedBlockLoader } from '../hooks/usePaginatedBlockLoader';
import { getSmartSyncManager } from '../hooks/useAutoSave';
import { sessionCache } from '../utils/sessionCache';
import { serializeBlock } from '../utils/blockSerializer';
import storageWrapper from '../utils/storage/storageWrapper';
import { ShareDialogSimple } from './ShareDialogSimple';
import SaveIndicator from './SaveIndicator';
import FloatingControlsTrigger from './FloatingControlsTrigger';
import ScrollToTop from './ScrollToTop';
import MobileBottomSheet from './MobileBottomSheet';
import BlockErrorBoundary from './BlockErrorBoundary';
import { useAnalytics, useDocumentAnalytics } from '../hooks/useAnalytics';
// import OpacityForensics from './debug/OpacityForensics'; // Removed - was interfering with opacity transitions
import './VirtualizedGrid.css'; // For scrollbar styles

// [VIRT-DEBUG] Verify useVirtualizer import at module load time
console.log('[VIRT-DEBUG-IMPORT] useVirtualizer hook imported:', typeof useVirtualizer);

const DEFAULT_BLOCK_HEIGHT = 150;
const ADD_BUTTON_HEIGHT = 40;

// Get estimated height for different block types
// TanStack Virtual handles height caching automatically via ResizeObserver
// Better initial estimates = less layout shift = smoother scrolling
const getEstimatedHeight = (block) => {
  if (!block) return DEFAULT_BLOCK_HEIGHT;

  // More accurate estimates based on block type and content
  switch (block.type) {
    case 'text':
      // Estimate based on content length if available
      const textLength = block.content?.length || 0;
      if (textLength > 500) return 200;
      if (textLength > 200) return 150;
      return 100;

    case 'heading':
      return block.data?.level === 1 ? 80 : 60;

    case 'code':
      // Estimate based on line count if available
      const lines = block.content?.split('\n').length || 10;
      return Math.min(lines * 24 + 100, 600);

    case 'ai':
      // AI blocks tend to be large
      return 500;

    case 'table':
      return 300;

    case 'todo':
      return 200;

    case 'filetree':
      // Depends on tree depth, but usually large
      return 600;

    case 'image':
    case 'inline-image':
      return 400;

    case 'issue-tracker':
      return 400;

    default:
      return DEFAULT_BLOCK_HEIGHT;
  }
};

export default function ExpandedView({
  entry,
  onClose,
  onUpdate,
  allEntries = [],
  isMobileView = false,
  scrollContainerRef: externalScrollRef,
  onShowBlockSelector
}) {
  // Analytics hooks
  const { trackEvent } = useAnalytics();
  const { trackDocumentEvent } = useDocumentAnalytics();
  
  // Track document view on mount (not as page view)
  useEffect(() => {
    if (entry?.id && entry?.title) {
      // Track as custom document_view event, not page_view
      trackDocumentEvent('view', entry.id, {
        document_title: entry.title,
        block_count: entry.blockCount || 0,
        has_blocks: !!entry.blocks
      });
    }
  }, [entry?.id]); // Only track once per document ID
  
  // Check if document might have many blocks (use pagination for documents with 50+ blocks)
  const shouldUsePagination = !entry.blocks || entry.blockCount > 50;

  // [VIRT-DEBUG-0] Log loading strategy
  console.log(`[VIRT-DEBUG-0] 📋 Document Loading Strategy`);
  console.log(`[VIRT-DEBUG-0] Document ID: ${entry.id}`);
  console.log(`[VIRT-DEBUG-0] Block count: ${entry.blockCount || 'unknown'}`);
  console.log(`[VIRT-DEBUG-0] Using: ${shouldUsePagination ? 'PAGINATED loader (50+ blocks)' : 'OPTIMIZED loader (<50 blocks)'}`);

  // Always call both hooks to maintain hook order, but only use one
  const paginatedLoader = usePaginatedBlockLoader(entry.id, entry, {
    pageSize: 50,
    enableInfiniteScroll: true,
    skip: !shouldUsePagination
  });

  const optimizedLoader = useOptimizedBlockLoader(entry.id, entry, {
    skip: shouldUsePagination
  });

  // Select which loader to use
  const loader = shouldUsePagination ? paginatedLoader : optimizedLoader;
  
  const { 
    blocks: loadedBlocks, 
    isLoading: isLoadingBlocks,
    isLoadingMore = false,
    hasMore = false,
    loadMore = () => {},
    updateBlocks: updateLoadedBlocks,
    updateBlock: updateSingleBlock,
    removeBlock,
    checkLoadMore = () => {},
    progress = null,
    preloadNearbyDocuments = () => {}
  } = loader;
  
  // We'll use loadedBlocks directly instead of duplicating state
  // Memoize blocks array to prevent unnecessary re-renders
  const blocks = useMemo(() => {
    const result = loadedBlocks || [];

    // [VIRT-DEBUG-5] Log blocks loaded for virtualization
    if (result.length > 0) {
      console.log(`[VIRT-DEBUG-5] 📦 Blocks loaded: ${result.length} total`);
      console.log(`[VIRT-DEBUG-5] Block types: ${result.map(b => b.type).join(', ')}`);

      // After a brief delay, count actual DOM nodes
      setTimeout(() => {
        const renderedNodes = document.querySelectorAll('[data-block-id]').length;
        console.log(`[VIRT-DEBUG-5] ✅ DOM VERIFICATION:`);
        console.log(`[VIRT-DEBUG-5] Total blocks: ${result.length}`);
        console.log(`[VIRT-DEBUG-5] Rendered in DOM: ${renderedNodes}`);
        console.log(`[VIRT-DEBUG-5] Virtualization ratio: ${((1 - renderedNodes / result.length) * 100).toFixed(1)}% blocks NOT rendered`);
        if (renderedNodes < result.length) {
          console.log(`[VIRT-DEBUG-5] ✅ VIRTUALIZATION WORKING - Only ${renderedNodes}/${result.length} blocks in DOM!`);
        } else {
          console.log(`[VIRT-DEBUG-5] ⚠️ ALL BLOCKS RENDERED - Virtualization may not be active!`);
        }
      }, 1000);
    }

    return result;
  }, [loadedBlocks]);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [backlinks, setBacklinks] = useState([]);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [tags, setTags] = useState(entry.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState('after'); // 'before' or 'after'
  const contentContainerRef = useRef(null);
  const internalScrollRef = useRef(null);
  const scrollContainerRef = externalScrollRef || internalScrollRef;
  const dragScrollInterval = useRef(null);
  // Removed forceRenderCount - was causing excessive re-renders
  const [isInternalUpdate, setIsInternalUpdate] = useState(false); // Track internal updates
  const [viewMode, setViewMode] = useState('blocks'); // 'blocks' or 'lines'
  const [selectedLineBlockId, setSelectedLineBlockId] = useState(null);
  const [linesScrollProgress, setLinesScrollProgress] = useState({ top: 0, bottom: 1 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const isInitialLoadRef = useRef(true); // Track initial load to prevent saves
  const saveStatusTimeoutRef = useRef(null);
  const [syncStatus, setSyncStatus] = useState({ pending: 0, syncing: false, online: navigator.onLine });
  const smartSyncManagerRef = useRef(null);

  // Memoize estimateSize to prevent infinite render loop
  const estimateSize = useCallback((index) => {
    // Estimate based on block type
    const block = blocks[index];
    if (!block) return DEFAULT_BLOCK_HEIGHT + ADD_BUTTON_HEIGHT;
    return Math.ceil(getEstimatedHeight(block) + ADD_BUTTON_HEIGHT);
  }, [blocks]);

  // Configure TanStack virtualizer with measure element override
  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize, // Use memoized function
    overscan: 3, // Render 3 extra blocks outside viewport
    // Override measureElement to round measurements (prevents floating-point loop)
    measureElement: (el) => {
      if (!el) return 0;
      // Round to nearest integer to prevent floating-point precision issues
      return Math.ceil(el.getBoundingClientRect().height);
    },
  });

  // [VIRT-DEBUG-2] Log virtualizer info
  console.log('[VIRT-DEBUG-2] ✅ VIRTUALIZATION ACTIVE (TanStack)');
  console.log('[VIRT-DEBUG-2] Total blocks:', blocks.length);
  console.log('[VIRT-DEBUG-2] Total height:', rowVirtualizer.getTotalSize(), 'px');
  console.log('[VIRT-DEBUG-2] Overscan count: 3 blocks');
  
  // Create a memoized block renderer component to avoid closure issues
  // React 19: ref can be accepted as a regular prop without forwardRef
  const BlockRenderer = memo(({
    block,
    index,
    ref,  // React 19: ref is just a regular prop now
    style,
    isMobileView,
    focusedBlockId,
    showBlockSelector,
    selectorPosition,
    draggedBlockId,
    dropTargetId,
    dropPosition
  }) => {
    const isBlockFocused = focusedBlockId === null ? null : focusedBlockId === block.id;
    const isShowingSelector = showBlockSelector && selectorPosition === block.id;

    return (
      <div
        ref={ref}  // Pass ref directly (React 19 allows this!)
        data-index={index}  // Required for TanStack to identify element
        style={style}
        className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
      >
        {block?.isLoading ? (
          <OptimizedBlockSkeleton 
            type={block.type} 
            estimatedHeight={block.estimatedHeight || 100}
          />
        ) : (
          <>
            <BlockErrorBoundary 
              blockType={block?.type} 
              blockId={block?.id}
            >
              <Block
                block={block}
                index={index}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onDuplicate={duplicateBlock}
                onMoveUp={(id) => moveBlock(id, 'up')}
                onMoveDown={(id) => moveBlock(id, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                isMobileView={isMobileView}
                onAddBelow={(data) => handleInlineBlockAdd(index, data)}
                onConvert={convertBlock}
                showAddButton={true}
                isFocused={isBlockFocused}
                onFocus={setFocusedBlockId}
                allBlocks={blocks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                draggedBlockId={draggedBlockId}
                dropTargetId={dropTargetId}
                dropPosition={dropPosition}
              />
            </BlockErrorBoundary>
            <AddBlockRow
              show={isShowingSelector}
              onSelect={(type) => addBlock(type, block.id)}
              onClose={() => setShowBlockSelector(false)}
              isMobileView={isMobileView}
            />
          </>
        )}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if these specific props changed
    return (
      prevProps.block === nextProps.block &&
      prevProps.index === nextProps.index &&
      prevProps.isMobileView === nextProps.isMobileView &&
      prevProps.focusedBlockId === nextProps.focusedBlockId &&
      prevProps.showBlockSelector === nextProps.showBlockSelector &&
      prevProps.selectorPosition === nextProps.selectorPosition &&
      prevProps.draggedBlockId === nextProps.draggedBlockId &&
      prevProps.dropTargetId === nextProps.dropTargetId &&
      prevProps.dropPosition === nextProps.dropPosition
    );
  });


  // Update title and tags when entry changes (e.g., when navigating via document links)
  // Also sync when title changes from parent (after save confirmation)
  useEffect(() => {
    setTitle(entry.title);
    setTags(entry.tags || []);
  }, [entry.id, entry.title, entry.tags]);
  
  // Cleanup save status timeout on unmount
  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  // Initialize Smart Sync for this document
  useEffect(() => {
    if (!entry.id) return;
    
    // Get or create Smart Sync manager for this document
    const syncManager = getSmartSyncManager(entry.id);
    smartSyncManagerRef.current = syncManager;
    
    // Update sync status periodically (only if changed)
    const statusInterval = setInterval(() => {
      if (smartSyncManagerRef.current) {
        const status = smartSyncManagerRef.current.getSyncStatus();
        setSyncStatus(prevStatus => {
          // Only update if values actually changed
          if (!prevStatus || 
              prevStatus.pending !== status.pending ||
              prevStatus.syncing !== status.syncing ||
              prevStatus.online !== status.online) {
            return status;
          }
          return prevStatus;
        });
      }
    }, 1000);
    
    // Load any snapshot for quick initialization
    if (syncManager) {
      syncManager.loadLatestSnapshot().then(snapshot => {
        if (snapshot && isInitialLoadRef.current) {
          console.log('SmartSync: Loaded snapshot for quick init');
        }
      });
    }
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [entry.id]);

  // Check for unsaved changes on mount
  useEffect(() => {
    const checkForBackup = async () => {
      const backup = await autoSaveManager.recoverFromBackup(entry.id);
      if (backup && backup.data && backup.data.blocks) {
        console.log(`Found unsaved changes for document ${entry.id}`);
        // You could show a notification here asking if user wants to restore
        // For now, we'll just log it
      }
    };
    checkForBackup();
    
    // Mark initial load as complete - shorter delay for new documents
    const isNewDocument = entry.metadata?.createdLocally || entry.blocks?.length === 0;
    const delay = isNewDocument ? 500 : 2000; // 0.5s for new docs, 2s for existing
    
    const timer = setTimeout(() => {
      console.log('ExpandedView: Initial load period complete, enabling saves');
      isInitialLoadRef.current = false;
    }, delay);
    
    return () => clearTimeout(timer);
  }, [entry.id, entry.metadata]);

  // Handle internal updates
  useEffect(() => {
    if (isInternalUpdate) {
      setIsInternalUpdate(false);
    }
  }, [isInternalUpdate]);

  // Preload nearby documents when this one is opened
  useEffect(() => {
    // Get nearby document IDs (e.g., next/prev in the list)
    const currentIndex = allEntries.findIndex(e => e.id === entry.id);
    const nearbyIds = [];
    
    if (currentIndex > 0) nearbyIds.push(allEntries[currentIndex - 1].id);
    if (currentIndex < allEntries.length - 1) nearbyIds.push(allEntries[currentIndex + 1].id);
    
    if (nearbyIds.length > 0) {
      preloadNearbyDocuments(nearbyIds);
    }
  }, [entry.id, allEntries, preloadNearbyDocuments]);


  // Calculate backlinks
  useEffect(() => {
    const links = getBacklinks(entry.title, allEntries);
    setBacklinks(links);
  }, [entry.title, allEntries]);


  const updateBlock = useCallback((blockId, updates) => {
    // Add defensive check for blockId
    if (!blockId || !updates) {
      console.warn('updateBlock called with invalid parameters:', { blockId, updates });
      return;
    }
    
    // Debug AI blocks specifically
    const block = blocks.find(b => b.id === blockId);
    if (block && block.type === 'ai') {
      console.log('🟣 AI Block Update:', {
        blockId,
        blockType: block.type,
        updates,
        hasMessages: 'messages' in updates,
        messageCount: updates.messages?.length || 0,
        currentMessageCount: block?.messages?.length || 0
      });
    }
    
    // console.log('🟩 ExpandedViewEnhanced: updateBlock called:', {
    //   blockId: blockId,
    //   updates: updates,
    //   hasDataField: 'data' in updates,
    //   dataContent: updates.data
    // });
    
    // Use the loader's updateBlock method
    startTransition(() => {
      updateSingleBlock(blockId, updates);
    });
    
    // Check if this is a significant update that needs saving
    const needsSave = updates.content !== undefined ||
                     updates.data !== undefined ||
                     updates.metadata !== undefined ||
                     updates.tags !== undefined ||
                     updates.messages !== undefined ||     // AI blocks
                     updates.treeData !== undefined ||     // FileTree blocks
                     updates.snapshots !== undefined ||    // FileTree snapshots
                     updates.currentSnapshotId !== undefined || // FileTree snapshot ID
                     updates.images !== undefined ||       // Image blocks
                     updates.items !== undefined ||        // Todo blocks
                     updates.url !== undefined ||          // InlineImage blocks
                     updates.dimensions !== undefined ||   // InlineImage blocks
                     updates.language !== undefined ||     // Code blocks
                     updates.filePath !== undefined ||     // Code blocks
                     updates.level !== undefined;          // Heading blocks
    
    // Skip saves during initial load
    if (needsSave && !isInitialLoadRef.current) {
      // Get the updated blocks for auto-save
      const updatedBlocks = blocks.map((block, index) => {
        if (!block) return null; // Defensive check for undefined blocks
        if (block.id === blockId) {
          // Remove isNew flag when updating a block (user has interacted with it)
          const { isNew, ...blockWithoutNew } = block;
          const updatedBlock = { 
            ...blockWithoutNew, 
            ...updates,
            // Use stored position if available, otherwise use array index
            position: block.position !== undefined ? block.position : index
          };
          
          // console.log('🟩 ExpandedViewEnhanced: Block before and after update:', {
          //   blockId: blockId,
          //   blockType: block.type,
          //   before: block,
          //   after: updatedBlock,
          //   hadData: !!block.data,
          //   hasData: !!updatedBlock.data
          // });
          
          return updatedBlock;
        }
        // Don't override existing positions
        return block.position !== undefined ? block : { ...block, position: index };
      }).filter(Boolean); // Remove any null blocks
      
      // console.log('🟩 ExpandedViewEnhanced: Passing to autoSaveManager:', {
      //   entryId: entry.id,
      //   blocksCount: updatedBlocks.length,
      //   updatedBlockId: blockId,
      //   updatedBlock: updatedBlocks.find(b => b.id === blockId)
      // });
      
      // Use Smart Sync for saving
      if (smartSyncManagerRef.current) {
        // Get the specific block that was updated
        const updatedBlock = updatedBlocks.find(b => b.id === blockId);
        if (updatedBlock) {
          // Serialize the block to normalize data structure
          const serializedBlock = serializeBlock(updatedBlock);

          // Smart Sync handles everything - pass the normalized content WITH type, position, and metadata
          smartSyncManagerRef.current.handleChange(
            blockId,
            serializedBlock.content, // Send normalized content field
            'UPDATE',
            updatedBlock.type,       // CRITICAL: Send block type
            updatedBlock.position,   // CRITICAL: Use the block's actual position, not array index
            serializedBlock.metadata // CRITICAL: Send metadata for snapshots and other JSONB data
          ).then(() => {
            // Update sync status will happen automatically via the interval
          }).catch(error => {
            console.error('Smart Sync error:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus(null), 3000);
          });
        }
      }
      
      // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
      // if (onUpdate) {
      //   setIsInternalUpdate(true);
      //   onUpdate(entry.id, { blocks: updatedBlocks });
      // }
    }
  }, [blocks, updateSingleBlock]);

  const deleteBlock = useCallback((blockId) => {
    // Defensive check
    if (!blockId) {
      console.warn('deleteBlock called with invalid blockId:', blockId);
      return;
    }
    
    // CRITICAL FIX: Find block BEFORE removing it from state
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    const blockToDelete = blockIndex >= 0 ? blocks[blockIndex] : null;
    
    // Track block deletion
    if (blockToDelete) {
      trackEvent('block_deleted', {
        block_type: blockToDelete.type,
        had_content: blockToDelete.content?.length > 0 || 
                    blockToDelete.data?.issues?.length > 0 || 
                    blockToDelete.rows?.length > 0,
        document_id: entry.id
      });
    }
    
    // Use the loader's removeBlock method
    removeBlock(blockId);
    
    // Call Smart Sync for delete operation
    if (smartSyncManagerRef.current) {
      // Strategic logging for DELETE block finding
      console.log('[DELETE] Finding block:', {
        blockId,
        blocksLength: blocks.length,
        blockFound: blockIndex >= 0,
        blockType: blockToDelete?.type,
        position: blockIndex,
        firstFewBlocks: blocks.slice(0, 3).map(b => ({id: b.id.substring(0,8), type: b.type}))
      });
      
      // DEBUG: Log what we're sending for DELETE
      console.log('[DEBUG-FIX] DELETE operation with:', {
        blockId: blockId,
        blockType: blockToDelete?.type || null,
        position: blockIndex >= 0 ? blockIndex : null,  // Use array index as position
        action: 'DELETE'
      });
      
      // Send all required parameters for DELETE
      smartSyncManagerRef.current.handleChange(
        blockId,
        null, // null content for delete
        'DELETE',
        blockToDelete?.type || null,           // ADD: block type (required!)
        blockIndex >= 0 ? blockIndex : null    // Use array index as position (required!)
      ).then((result) => {
        // Verification: Log successful deletion
        console.log('[DELETE-SUCCESS] Block marked for deletion:', {
          blockId,
          syncResult: result
        });
        
        // Clear from session cache to prevent reappearance
        if (window.sessionCache) {
          window.sessionCache.clearBlock(entry.id, blockId);
        }
        
        // Clear from paginated block loader cache
        if (window.paginatedBlockLoader) {
          window.paginatedBlockLoader.clearCache(entry.id);
        }
      }).catch(error => {
        console.error('[DELETE-ERROR] Smart Sync delete failed:', error);
        // TODO: Show user error notification
      });
    }
    
    // Get updated blocks for the parent update
    const updatedBlocks = blocks.filter(block => block && block.id !== blockId);
    // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
    // if (onUpdate) {
    //   setIsInternalUpdate(true);
    //   onUpdate(entry.id, { blocks: updatedBlocks });
    // }
  }, [removeBlock, blocks]);

  const duplicateBlock = useCallback((blockId) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const blockToDuplicate = blocks[blockIndex];
    let duplicatedBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      position: blockIndex + 1, // Set position for duplicated block
      created_at: Date.now(), // New created_at timestamp
      isNew: false
    };
    
    // Normal duplication for all blocks
    const updatedBlocks = [...blocks];
    updatedBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    
    // Update positions for all blocks after the insertion point
    for (let i = blockIndex + 2; i < updatedBlocks.length; i++) {
      updatedBlocks[i] = { ...updatedBlocks[i], position: i };
    }
    
    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });
    
    // CRITICAL FIX: Call Smart Sync for duplicate (create new block)
    if (smartSyncManagerRef.current) {
      // Serialize the block to normalize data structure
      const serializedBlock = serializeBlock(duplicatedBlock);

      smartSyncManagerRef.current.handleChange(
        duplicatedBlock.id,
        serializedBlock.content, // Send normalized content field
        'CREATE',
        duplicatedBlock.type,    // CRITICAL: Send block type
        duplicatedBlock.position, // CRITICAL: Send position
        serializedBlock.metadata // CRITICAL: Send metadata
      ).catch(error => {
        console.error('Smart Sync duplicate error:', error);
      });
    }
    
    // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
    // if (onUpdate && !isInitialLoadRef.current) {
    //   setIsInternalUpdate(true);
    //   onUpdate(entry.id, { blocks: updatedBlocks });
    // }
  }, [blocks, updateLoadedBlocks]);

  const moveBlock = useCallback((blockId, direction) => {
    // Enhanced debug logging with unique invocation ID
    const invocationId = Math.random().toString(36).substring(7);
    console.log('[DEBUG-MOVE-3] moveBlock START:', {
      invocationId,
      blockId,
      direction,
      timestamp: Date.now(),
      callStack: new Error().stack.substring(0, 300)
    });
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) {
      console.log('[DEBUG-MOVE-3] moveBlock ABORT - block not found:', { invocationId, blockId });
      return;
    }
    
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) {
      console.log('[DEBUG-MOVE-3] moveBlock ABORT - invalid index:', { invocationId, newIndex });
      return;
    }
    
    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(blockIndex, 1);
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
      totalBlocks: blocks.length,
      currentPositions: blocks.slice(0, 5).map(b => ({id: b.id.substring(0,8), pos: blocks.indexOf(b)}))
    });

    // CRITICAL FIX: Call Smart Sync for reorder operation
    if (smartSyncManagerRef.current && movedBlock) {
      // DEBUG: Log what we're sending for REORDER
      console.log('[DEBUG-MOVE-4] Calling SmartSync.handleChange:', {
        invocationId,
        blockId: movedBlock.id,
        blockType: movedBlock.type,
        position: newIndex,
        action: 'REORDER',
        timestamp: Date.now()
      });
      
      // Send all required parameters for REORDER
      smartSyncManagerRef.current.handleChange(
        movedBlock.id,
        null,               // REORDER doesn't need content - only position changes!
        'REORDER',
        movedBlock.type,    // ADD: block type (required!)
        newIndex            // ADD: position as number (required!)
      ).catch(error => {
        console.error('[DEBUG-MOVE-4] Smart Sync move error:', { invocationId, error });
      });
    }
    
    console.log('[DEBUG-MOVE-3] moveBlock END:', { invocationId, timestamp: Date.now() });
    
    // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
    // if (onUpdate && !isInitialLoadRef.current) {
    //   onUpdate(entry.id, { blocks: updatedBlocks });
    // }
  }, [blocks, updateLoadedBlocks]);

  // Auto-scroll during drag
  const startAutoScroll = (direction) => {
    if (dragScrollInterval.current) return;
    
    dragScrollInterval.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const scrollSpeed = 5;
        scrollContainerRef.current.scrollTop += direction === 'up' ? -scrollSpeed : scrollSpeed;
      }
    }, 16); // ~60fps
  };

  const stopAutoScroll = () => {
    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((blockId) => {
    setDraggedBlockId(blockId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition('after');
    stopAutoScroll();
  }, [stopAutoScroll]);

  const handleDragOver = useCallback((e, blockId) => {
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
  }, [startAutoScroll, stopAutoScroll]);

  const handleDragLeave = useCallback((e) => {
    // Only clear if leaving the entire block area
    if (e.relatedTarget && e.currentTarget && e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetId(null);
    } else if (!e.relatedTarget) {
      // If relatedTarget is null (mouse left the document), clear the drop target
      setDropTargetId(null);
    }
  }, []);

  const handleDrop = useCallback((draggedId, targetId) => {
    
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
      const updatedBlocks = [
        ...blocksWithoutDragged.slice(0, insertIndex),
        draggedBlock,
        ...blocksWithoutDragged.slice(insertIndex)
      ];
      
      
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
          draggedBlock.type,    // ADD: block type (required!)
          insertIndex           // ADD: position as number (required!)
        ).catch(error => {
          console.error('Smart Sync drag-drop error:', error);
        });
      }
      
      // Block state update will trigger re-render automatically
      
      // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
      // if (onUpdate) {
      //   setIsInternalUpdate(true);
      //   onUpdate(entry.id, { blocks: updatedBlocks });
      // }
    });
    
    // Clean up drag state after flushSync
    flushSync(() => {
      setDraggedBlockId(null);
      setDropTargetId(null);
      setDropPosition('after');
    });
    
    stopAutoScroll();
  }, [blocks, updateLoadedBlocks, dropPosition, stopAutoScroll]);

  const convertBlock = useCallback((blockId, newType, meta = {}) => {
    const updatedBlocks = blocks.map((block, index) => {
      if (block.id === blockId) {
        // Preserve content if possible
        const newBlock = {
          ...block,
          type: newType,
          position: block.position !== undefined ? block.position : index,  // Keep existing position if available
          ...meta
        };
        
        // Handle special conversions
        if (newType === 'heading' && meta.level) {
          newBlock.level = meta.level;
        }
        
        // Clear content for AI blocks as they use different structure
        if (newType === 'ai') {
          newBlock.content = '';
        }
        
        return newBlock;
      }
      // Don't override existing positions
      return block.position !== undefined ? block : { ...block, position: index };
    });
    
    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });
    
    // CRITICAL FIX: Call Smart Sync for block type conversion
    if (smartSyncManagerRef.current) {
      const convertedBlock = updatedBlocks.find(b => b.id === blockId);
      if (convertedBlock) {
        // Serialize the block to normalize data structure
        const serializedBlock = serializeBlock(convertedBlock);

        smartSyncManagerRef.current.handleChange(
          blockId,
          serializedBlock.content, // Send normalized content field
          'UPDATE',
          convertedBlock.type,     // CRITICAL: Send block type
          convertedBlock.position, // CRITICAL: Send position
          serializedBlock.metadata // CRITICAL: Send metadata
        ).catch(error => {
          console.error('Smart Sync convert error:', error);
        });
      }
    }
    
    // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
    // if (onUpdate && !isInitialLoadRef.current) {
    //   onUpdate(entry.id, { blocks: updatedBlocks });
    // }
  }, [blocks, updateLoadedBlocks]);

  const addBlock = useCallback((type, afterBlockId = null) => {
    // Calculate position for the new block
    let position;
    if (afterBlockId) {
      const index = blocks.findIndex(b => b.id === afterBlockId);
      position = index + 1;
    } else {
      position = blocks.length;
    }

    const newBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      position: position, // Add position field
      created_at: Date.now(), // Add created_at timestamp
      isNew: true // Flag to trigger auto-focus
    };

    // Initialize block based on type
    if (type === 'heading') {
      newBlock.level = 2;
    } else if (type === 'issue-tracker') {
      // Initialize issue-tracker with proper data structure
      newBlock.data = {
        milestone: '',
        issues: []
      };
      newBlock.content = ''; // Add empty content to prevent undefined errors
    }
    
    // Track block creation
    trackEvent('block_created', {
      block_type: type,
      position: position,
      after_block: !!afterBlockId,
      document_id: entry.id
    });

    let updatedBlocks;
    if (afterBlockId) {
      const index = blocks.findIndex(b => b.id === afterBlockId);
      updatedBlocks = [...blocks];
      updatedBlocks.splice(index + 1, 0, newBlock);
      // Update positions for all blocks after the insertion point
      for (let i = index + 2; i < updatedBlocks.length; i++) {
        updatedBlocks[i] = { ...updatedBlocks[i], position: i };
      }
    } else {
      updatedBlocks = [...blocks, newBlock];
    }
    
    startTransition(() => {
      updateLoadedBlocks(updatedBlocks);
    });
    
    // CRITICAL FIX: Call Smart Sync for new block creation
    if (smartSyncManagerRef.current) {
      console.log('ExpandedView: Calling Smart Sync for new block:', {
        id: newBlock.id,
        type: newBlock.type,
        position: newBlock.position,
        created_at: newBlock.created_at
      });
      
      // Serialize the block to normalize data structure
      const serializedBlock = serializeBlock(newBlock);

      smartSyncManagerRef.current.handleChange(
        newBlock.id,
        serializedBlock.content, // Send normalized content field
        'CREATE',
        newBlock.type,           // CRITICAL: Send block type
        newBlock.position,       // CRITICAL: Send position
        serializedBlock.metadata // CRITICAL: Send metadata
      ).catch(error => {
        console.error('Smart Sync add block error:', error);
      });
    }
    
    // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
    // if (onUpdate && !isInitialLoadRef.current) {
    //   onUpdate(entry.id, { blocks: updatedBlocks });
    // }

    setShowBlockSelector(false);
    setSelectorPosition(null);
  }, [blocks, updateLoadedBlocks, focusedBlockId]);

  const handleAddBelowBlock = useCallback((blockIdOrData) => {
    // If a block object is passed (from TextBlock paste), create it directly
    if (typeof blockIdOrData === 'object' && blockIdOrData.type) {
      // Find the TextBlock that called this function
      const callingBlockId = blocks.find(b => b.isNew || b.id === focusedBlockId)?.id;
      if (!callingBlockId) return;
      
      const index = blocks.findIndex(b => b.id === callingBlockId);
      
      const newBlock = {
        id: crypto.randomUUID(),
        ...blockIdOrData,
        position: index + 1, // Add position field
        created_at: Date.now(), // Add created_at timestamp
        createdAt: blockIdOrData.createdAt || new Date().toISOString()
      };
      
      const updatedBlocks = [...blocks];
      updatedBlocks.splice(index + 1, 0, newBlock);
      
      // Update positions for all blocks after the insertion point
      for (let i = index + 2; i < updatedBlocks.length; i++) {
        updatedBlocks[i] = { ...updatedBlocks[i], position: i };
      }
      
      startTransition(() => {
        updateLoadedBlocks(updatedBlocks);
      });
      
      // CRITICAL FIX: Call Smart Sync for new block from paste
      if (smartSyncManagerRef.current) {
        // Serialize the block to normalize data structure
        const serializedBlock = serializeBlock(newBlock);

        smartSyncManagerRef.current.handleChange(
          newBlock.id,
          serializedBlock.content, // Send normalized content field
          'CREATE',
          newBlock.type,           // CRITICAL: Send block type
          newBlock.position,       // CRITICAL: Send position
          serializedBlock.metadata // CRITICAL: Send metadata
        ).catch(error => {
          console.error('Smart Sync add below error:', error);
        });
      }
      
      // MILESTONE 2: Don't call onUpdate for blocks - Smart Sync handles this
      // if (onUpdate && !isInitialLoadRef.current) {
      //   onUpdate(entry.id, { blocks: updatedBlocks });
      // }
    } else {
      // Normal behavior - show block selector
      setSelectorPosition(blockIdOrData);
      setShowBlockSelector(true);
    }
  }, [blocks, updateLoadedBlocks, focusedBlockId]);

  const handleAddAtEnd = useCallback(() => {
    setSelectorPosition('end');
    setShowBlockSelector(true);
  }, []);

  // Memoized callback for inline block addition from Block component
  const handleInlineBlockAdd = useCallback((blockIndex, data) => {
    if (typeof data === 'object' && data.type) {
      // Direct block creation from TextBlock
      const newBlock = {
        id: crypto.randomUUID(),
        ...data,
        position: blockIndex + 1,
        created_at: Date.now(),
        createdAt: data.createdAt || new Date().toISOString()
      };
      
      const updatedBlocks = [...blocks];
      updatedBlocks.splice(blockIndex + 1, 0, newBlock);
      
      // Update positions for all blocks after the insertion point
      for (let i = blockIndex + 2; i < updatedBlocks.length; i++) {
        updatedBlocks[i] = { ...updatedBlocks[i], position: i };
      }
      
      startTransition(() => {
        updateLoadedBlocks(updatedBlocks);
      });
      
      // CRITICAL FIX: Call Smart Sync for inline new block
      if (smartSyncManagerRef.current) {
        // Serialize the block to normalize data structure
        const serializedBlock = serializeBlock(newBlock);

        smartSyncManagerRef.current.handleChange(
          newBlock.id,
          serializedBlock.content, // Send normalized content field
          'CREATE',
          newBlock.type,           // CRITICAL: Send block type
          newBlock.position,       // CRITICAL: Send position
          serializedBlock.metadata // CRITICAL: Send metadata
        ).catch(error => {
          console.error('Smart Sync inline add error:', error);
        });
      }
    } else {
      // Show selector
      handleAddBelowBlock(data);
    }
  }, [blocks, updateLoadedBlocks, handleAddBelowBlock]);

  // Helper function for saving with status updates
  const saveWithStatus = async (updates, description = 'changes') => {
    setSaveStatus('saving');
    try {
      const result = await onUpdate(entry.id, updates);
      
      // Check if saved to cloud or locally
      if (result?.savedToCloud === false) {
        setSaveStatus('offline');
      } else {
        setSaveStatus('saved');
      }
      
      // Clear status after 2 seconds
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error(`Failed to save ${description}:`, error);
      setSaveStatus('error');
      throw error;
    }
  };

  const handleTitleSave = async () => {
    if (onUpdate && title !== entry.title) {
      await saveWithStatus({ title }, 'title');
    }
    setIsEditingTitle(false);
  };


  // Tag management functions
  const addTag = async () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      if (onUpdate) {
        await saveWithStatus({ tags: updatedTags }, 'tags');
      }
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const updateTag = async (index, value) => {
    if (value.trim() && !tags.includes(value.trim())) {
      const updatedTags = [...tags];
      updatedTags[index] = value.trim();
      setTags(updatedTags);
      if (onUpdate) {
        await saveWithStatus({ tags: updatedTags }, 'tags');
      }
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

  const deleteTag = async (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    if (onUpdate) {
      await saveWithStatus({ tags: updatedTags }, 'tags');
    }
  };
  

  // Clear focus when clicking outside any block
  const handleBackgroundClick = (e) => {
    // Only clear focus if clicking on the background, not on any child elements
    if (e.target === e.currentTarget) {
      // Preserve scroll position before clearing focus
      const scrollTop = scrollContainerRef.current?.scrollTop;
      setFocusedBlockId(null);
      // Restore scroll position after state update
      if (scrollTop !== undefined) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollTop;
          }
        });
      }
    }
  };

  // Handle lines view scroll for shadow effects
  const handleLinesScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    
    setLinesScrollProgress({
      top: Math.min(scrollTop / 100, 1),
      bottom: Math.min(scrollBottom / 100, 1)
    });
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []); // Only on mount

  // Handle infinite scroll
  useEffect(() => {
    if (!shouldUsePagination || !checkLoadMore) return;

    const scrollElement = scrollContainerRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      checkLoadMore(scrollElement);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [shouldUsePagination, checkLoadMore])

  return (
    <>
      {/* Opacity forensics debugger removed - was interfering with transitions */}
      
      {/* Floating Controls - Desktop only */}
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
      
      <div 
        ref={scrollContainerRef}
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-stable"
        onClick={handleBackgroundClick}
      >
        <div className={`mx-auto fade-in ${isMobileView ? 'px-4 py-3' : 'max-w-4xl px-8 py-8'}`}>
      {/* Header - Hidden on mobile as it's handled by MobileDocumentHeader */}
      {!isMobileView && (
      <div className="flex items-start gap-4 mb-6">
        <button 
          onClick={async () => {
            // Save any pending changes before closing
            if (smartSyncManagerRef.current) {
              const status = smartSyncManagerRef.current.getSyncStatus();
              if (status.pending > 0) {
                await smartSyncManagerRef.current.forceSync();
              }
            }
            onClose();
          }}
          className="mt-1 p-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary/50 rounded-lg transition-all
                     group flex items-center gap-2"
          title="Back to dashboard"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-text-secondary text-sm mb-2">
              Document
            </div>
            {/* View Mode Toggle and Actions */}
            <div className="flex items-center gap-3">
              {/* Save Status Indicator */}
              <SaveIndicator status={saveStatus} />
              
              {/* Progress Indicator for Large Documents */}
              {shouldUsePagination && progress && progress.total > 0 && (
                <div className="flex items-center gap-2 text-xs text-text-secondary/60">
                  <span>{progress.loaded}/{progress.total} blocks</span>
                  <div className="w-16 h-1 bg-dark-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-green/50 transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Sync Status Indicator */}
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-dark-secondary/30">
                {!syncStatus.online ? (
                  <span className="text-xs text-yellow-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    Offline
                  </span>
                ) : syncStatus.syncing ? (
                  <span className="text-xs text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    Syncing
                  </span>
                ) : syncStatus.pending > 0 ? (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    {syncStatus.pending} pending
                  </span>
                ) : (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Saved
                  </span>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={() => setShowShareDialog(true)}
                className="p-1.5 text-text-secondary hover:text-blue-400 
                           hover:bg-blue-400/10 rounded transition-all"
                title="Share document"
              >
                <Share2 size={16} />
              </button>
              
              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-text-secondary hover:text-red-400 
                           hover:bg-red-400/10 rounded transition-all"
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
              
              {/* View Mode Toggle */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent-green/20 to-accent-green/10 
                                rounded-lg blur-xl opacity-50" />
                <div className="relative flex items-center gap-1 bg-dark-secondary/50 backdrop-blur-sm
                                rounded-lg p-1 border border-dark-secondary/50">
                <button
                  onClick={() => setViewMode('blocks')}
                  className={`relative p-1.5 rounded transition-all duration-200 ${
                    viewMode === 'blocks' 
                      ? 'bg-dark-primary text-accent-green shadow-lg' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="Blocks view"
                >
                  {viewMode === 'blocks' && (
                    <div className="absolute inset-0 bg-accent-green/20 rounded blur-sm" />
                  )}
                  <LayoutGrid size={16} className="relative z-10" />
                </button>
                <button
                  onClick={() => setViewMode('lines')}
                  className={`relative p-1.5 rounded transition-all duration-200 ${
                    viewMode === 'lines' 
                      ? 'bg-dark-primary text-accent-green shadow-lg' 
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  title="Lines view"
                >
                  {viewMode === 'lines' && (
                    <div className="absolute inset-0 bg-accent-green/20 rounded blur-sm" />
                  )}
                  <LayoutList size={16} className="relative z-10" />
                </button>
              </div>
            </div>
          </div>
          </div>
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="text-text-primary text-2xl font-medium bg-transparent
                         border-b border-text-secondary focus:border-accent-green
                         focus:outline-none w-full"
              autoFocus
            />
          ) : (
            <h1 
              onClick={() => setIsEditingTitle(true)}
              className="text-text-primary text-2xl font-medium cursor-text
                         hover:bg-dark-secondary/30 rounded px-2 py-1 -ml-2
                         transition-colors"
            >
              {title}
            </h1>
          )}
        </div>
      </div>
      )}

      {/* Blocks or Lines View */}
      {viewMode === 'lines' ? (
        /* Lines View */
        <div className={`mb-8 ${isMobileView ? '-mx-4' : '-mx-8'}`}>
          <div className="relative bg-dark-primary/30 backdrop-blur-sm rounded-lg 
                          border border-dark-secondary/20 overflow-hidden"
               style={{ maxHeight: '500px' }}>
            {/* Top fade shadow - visible when scrolled */}
            <div 
              className="absolute top-0 left-0 right-0 h-20 
                         bg-gradient-to-b from-dark-primary via-dark-primary/50 to-transparent 
                         z-10 pointer-events-none transition-opacity duration-300"
              style={{ opacity: linesScrollProgress.top * 0.9 }}
            />
            
            {/* Bottom fade shadow - visible when not at bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-20 
                         bg-gradient-to-t from-dark-primary via-dark-primary/50 to-transparent 
                         z-10 pointer-events-none transition-opacity duration-300"
              style={{ opacity: linesScrollProgress.bottom * 0.9 }}
            />
            
            {/* Scrollable container */}
            <div className="overflow-y-auto overflow-x-hidden 
                            scrollbar-thin scrollbar-stable"
                 style={{ maxHeight: '500px' }}
                 onScroll={handleLinesScroll}>
              {blocks.map((block, index) => (
                <CompactBlockLine
                key={block.id}
                block={block}
                index={index}
                isSelected={selectedLineBlockId === block.id}
                onClick={(blockId) => {
                  setSelectedLineBlockId(blockId);
                  // Scroll to the block if in blocks view
                  if (viewMode === 'lines') {
                    setViewMode('blocks');
                    setFocusedBlockId(blockId);
                    // Scroll to block after view change
                    setTimeout(() => {
                      const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
                      blockElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                  }
                }}
              />
            ))}
            </div>
          </div>
        </div>
      ) : (
        /* Blocks View */
        <div 
          ref={contentContainerRef}
          className={`space-y-4 mb-8 min-h-[400px] relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
          onClick={(e) => {
            // Clear focus if clicking in empty space between blocks
            if (e.target === e.currentTarget) {
              setFocusedBlockId(null);
            }
          }}>
          {/* Show loading skeletons during initial document load */}
          {isLoadingBlocks && blocks.length === 0 && (
            <>
              {/* Loading message */}
              <div className={`text-center mb-6 ${isMobileView ? '' : 'ml-8'}`}>
                <div className="inline-flex items-center gap-2 text-text-secondary animate-pulse">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          
          {/* Virtualized Block List with TanStack */}
          {blocks.length > 0 && (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const block = blocks[virtualRow.index];
                if (!block) return null;

                // [VIRT-DEBUG-1] Log which blocks render
                console.log(`[VIRT-DEBUG-1] Rendering block ${virtualRow.index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)}) at position ${virtualRow.start}px`);

                return (
                  <BlockRenderer
                    key={virtualRow.key}
                    ref={rowVirtualizer.measureElement}
                    block={block}
                    index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    data-index={virtualRow.index}
                    isMobileView={isMobileView}
                    focusedBlockId={focusedBlockId}
                    showBlockSelector={showBlockSelector}
                    selectorPosition={selectorPosition}
                    draggedBlockId={draggedBlockId}
                    dropTargetId={dropTargetId}
                    dropPosition={dropPosition}
                  />
                );
              })}
            </div>
          )}

          {/* Load More Indicator for Paginated Documents */}
          {shouldUsePagination && hasMore && (
            <div className="relative py-8">
              {isLoadingMore ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 text-text-secondary">
                    <div className="w-5 h-5 border-2 border-text-secondary/30 border-t-accent-green 
                                    rounded-full animate-spin" />
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
              onClick={handleAddAtEnd}
              className={`w-full ${isMobileView ? 'py-12' : 'py-8'} border-2 border-dashed 
                         ${isMobileView ? 'border-dark-secondary/70 bg-dark-secondary/10' : 'border-dark-secondary/50'}
                         rounded-lg text-text-secondary hover:text-text-primary
                         hover:border-dark-secondary/50 transition-all
                         flex items-center justify-center gap-2 group
                         ${isMobileView ? 'active:scale-98 touch-manipulation active:bg-dark-secondary/20' : ''}`}
            >
              <Plus size={isMobileView ? 24 : 20} className="group-hover:scale-110 transition-transform" />
              <span className={isMobileView ? 'text-base font-medium' : ''}>Add a block</span>
            </button>
            <AddBlockRow
              show={showBlockSelector && selectorPosition === 'end'}
              onSelect={(type) => addBlock(type)}
              onClose={() => setShowBlockSelector(false)}
              isMobileView={isMobileView}
            />
          </div>
        </div>
      )}


      {/* Tags */}
      <div className={`flex items-center gap-3 flex-wrap mb-8 ${isMobileView ? 'px-0' : ''}`}>
        {tags.map((tag, index) => (
          <div key={index} className="group relative">
            {editingTagIndex === index ? (
              <input
                type="text"
                value={editingTagValue}
                onChange={(e) => setEditingTagValue(e.target.value)}
                onBlur={() => {
                  if (editingTagValue.trim()) {
                    updateTag(index, editingTagValue);
                  } else {
                    setEditingTagIndex(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateTag(index, editingTagValue);
                  } else if (e.key === 'Escape') {
                    setEditingTagIndex(null);
                    setEditingTagValue('');
                  }
                }}
                className="px-4 py-2 bg-dark-secondary/50 rounded-full text-text-primary text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent-green/50"
                autoFocus
              />
            ) : (
              <span 
                onClick={() => {
                  setEditingTagIndex(index);
                  setEditingTagValue(tag);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-dark-secondary/50 
                           rounded-full text-text-secondary text-sm
                           hover:bg-dark-secondary transition-colors cursor-pointer group
                           ${isMobileView ? 'mobile-tag' : ''}`}
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTag(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity
                             text-text-secondary/50 hover:text-red-400"
                  title="Delete tag"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        ))}
        
        {/* Tag input */}
        {isAddingTag ? (
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onBlur={() => {
              if (newTag.trim()) {
                addTag();
              } else {
                setIsAddingTag(false);
                setNewTag('');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTag();
              } else if (e.key === 'Escape') {
                setIsAddingTag(false);
                setNewTag('');
              }
            }}
            placeholder="Type tag name..."
            className="px-4 py-2 bg-dark-secondary/50 rounded-full text-text-primary text-sm
                       focus:outline-none focus:ring-2 focus:ring-accent-green/50
                       placeholder-text-secondary/50"
            autoFocus
          />
        ) : (
          <button 
            onClick={() => setIsAddingTag(true)}
            className="px-4 py-2 border border-dashed border-dark-secondary/50
                       rounded-full text-text-secondary text-sm
                       hover:border-text-secondary hover:text-text-primary
                       transition-all opacity-60 hover:opacity-100"
          >
            Add tag...
          </button>
        )}
      </div>

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className={`border-t border-dark-secondary/30 pt-8 ${isMobileView ? 'px-0' : ''}`}>
          <h3 className="text-text-secondary text-sm font-medium mb-4 flex items-center gap-2">
            <Link2 size={16} />
            Linked References ({backlinks.length})
          </h3>
          <div className="space-y-3">
            {backlinks.map((backlink) => (
              <button
                key={backlink.id}
                onClick={() => {
                  // Navigate to the linking document
                  const linkedEntry = allEntries.find(e => e.id === backlink.id);
                  if (linkedEntry && window.handleDocumentLink) {
                    window.handleDocumentLink(linkedEntry.title);
                  }
                }}
                className="w-full text-left p-3 bg-dark-secondary/30 rounded-lg
                           hover:bg-dark-secondary/50 transition-colors group"
              >
                <div className="text-text-primary font-medium group-hover:text-text-primary 
                                transition-colors">
                  {backlink.title}
                </div>
                <div className="text-text-secondary text-sm line-clamp-1 mt-1">
                  {backlink.preview}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>

      {/* Delete Confirmation - Mobile Bottom Sheet */}
      {showDeleteConfirm && isMobileView && (
        <MobileBottomSheet
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Document?"
          height="auto"
        >
          <div className="p-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-text-secondary text-lg">
                Are you sure you want to delete "{title}"?
              </p>
              <p className="text-text-secondary/60 text-sm">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (isDeleting) return;
                  
                  try {
                    setIsDeleting(true);
                    console.log('Starting document deletion for:', entry.id);
                    
                    // Clear from session cache first
                    sessionCache.clearDocument(entry.id);
                    console.log('Cleared from session cache');
                    
                    // Delete from storage using the proper delete method
                    await storageWrapper.deleteEntry(entry.id);
                    console.log('Successfully deleted document from storage');
                    
                    // Close the delete confirmation modal
                    setShowDeleteConfirm(false);
                    
                    // Notify parent component to update the list
                    if (onUpdate) {
                      onUpdate(entry.id, null);
                    }
                  } catch (error) {
                    console.error('Error deleting document:', error);
                    const errorMessage = error?.message || 'Unknown error';
                    alert(`Failed to delete document: ${errorMessage}`);
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="w-full h-12 bg-red-500 hover:bg-red-600 active:bg-red-700
                         text-white rounded-xl font-medium transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2
                         active:scale-[0.98]"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Document
                  </>
                )}
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full h-12 bg-dark-secondary hover:bg-dark-secondary/80
                         text-text-primary rounded-xl font-medium transition-all
                         active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </MobileBottomSheet>
      )}

      {/* Delete Confirmation Modal - Desktop */}
      {showDeleteConfirm && !isMobileView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-dark-secondary rounded-lg p-6 max-w-md w-full mx-4 
                          border border-dark-primary/50 shadow-xl"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              Delete Document?
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary 
                           hover:bg-dark-primary/50 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Prevent multiple clicks
                  if (isDeleting) return;
                  
                  try {
                    setIsDeleting(true);
                    console.log('Starting document deletion for:', entry.id);
                    
                    // Clear from session cache first
                    sessionCache.clearDocument(entry.id);
                    console.log('Cleared from session cache');
                    
                    // Delete from storage using the proper delete method
                    await storageWrapper.deleteEntry(entry.id);
                    console.log('Successfully deleted document from storage');
                    
                    // Close the delete confirmation modal
                    setShowDeleteConfirm(false);
                    
                    // Notify parent component to update the list
                    // The Dashboard will handle closing the expanded view
                    if (onUpdate) {
                      onUpdate(entry.id, null);
                    }
                  } catch (error) {
                    console.error('Error deleting document:', error);
                    console.error('Error details:', {
                      message: error?.message,
                      stack: error?.stack,
                      name: error?.name,
                      fullError: error
                    });
                    
                    // More detailed error message
                    const errorMessage = error?.message || 
                                       (error?.error?.message) || 
                                       (typeof error === 'string' ? error : 'Unknown error');
                    
                    alert(`Failed to delete document: ${errorMessage}`);
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className={`px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 
                           rounded transition-colors flex items-center gap-2
                           ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-400/50 border-t-red-400 
                                    rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <ShareDialogSimple 
          document={{
            id: entry.id,
            title: title,
            blocks: blocks,
            tags: tags,
            user: entry.user,
            updated_at: entry.updated_at
          }}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      </div>
      
      {/* Scroll to Top Button - Rendered at the end */}
      <ScrollToTop scrollContainerRef={scrollContainerRef} />
    </>
  );
}
