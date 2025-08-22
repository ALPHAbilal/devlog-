import React, { useState, useEffect, memo } from 'react';
import { useBlockLazyLoading } from '../hooks/useBlockLazyLoading';
import LazyBlockSkeleton from './blocks/LazyBlockSkeleton';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlockRefined';
import HeadingBlock from './blocks/HeadingBlock';
import FileTreeBlock from './blocks/FileTreeBlock';
import TableBlock from './blocks/TableBlock';
import TodoBlock from './blocks/TodoBlock';
import ImageBlock from './blocks/ImageBlock';
import InlineImageBlock from './blocks/InlineImageBlock';
import OptimizedVersionTrackBlock from './blocks/OptimizedVersionTrackBlock';
import OptimizedIssueTrackerBlock from './blocks/OptimizedIssueTrackerBlock';
import BlockDivider from './BlockDivider';
import InlineActionBar from './InlineActionBar';
import MobileBlockControls from './MobileBlockControls';
import { useResponsive } from '../hooks/useResponsive';

const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
  filetree: FileTreeBlock,
  table: TableBlock,
  todo: TodoBlock,
  image: ImageBlock,
  'inline-image': InlineImageBlock,
  'version-track': OptimizedVersionTrackBlock,
  'issue-tracker': OptimizedIssueTrackerBlock,
};

// Helper function to estimate block height for skeletons
const getEstimatedHeight = (block) => {
  switch (block.type) {
    case 'text':
      const lineCount = (block.content || '').split('\n').length;
      return Math.max(100, lineCount * 24 + 40);
    case 'heading':
      return 80;
    case 'code':
      const codeLines = (block.content || '').split('\n').length;
      return Math.max(150, codeLines * 20 + 60);
    case 'ai':
      const messageCount = block.messages?.length || 0;
      return Math.max(200, messageCount * 100);
    case 'version-track':
      return 400;
    case 'issue-tracker':
      return 350;
    case 'table':
      return 300;
    case 'todo':
      const todoCount = block.todos?.length || 0;
      return Math.max(100, todoCount * 40 + 60);
    case 'image':
    case 'inline-image':
      return 300;
    case 'filetree':
      return 250;
    default:
      return 150;
  }
};

function Block({ 
  block, 
  onUpdate, 
  onDelete, 
  onAddBelow, 
  onConvert, 
  showAddButton, 
  isFocused, 
  onFocus,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  allBlocks,
  onNavigateToBlock,
  index,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedBlockId,
  dropTargetId,
  dropPosition,
  isMobileView = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const BlockComponent = blockComponents[block.type] || TextBlock;
  const { isMobile } = useResponsive();
  const useMobileControls = isMobileView || isMobile;
  
  // Debug logging for props
  useEffect(() => {
    console.log('[BLOCK] Component mounted/updated:', {
      blockId: block.id,
      blockType: block.type,
      hasOnMoveUp: !!onMoveUp,
      hasOnMoveDown: !!onMoveDown,
      canMoveUp,
      canMoveDown,
      isFocused,
      index,
      timestamp: Date.now()
    });
  }, [block.id, onMoveUp, onMoveDown, isFocused]);
  
  // Use lazy loading for heavy blocks
  const { 
    targetRef: lazyRef, 
    shouldRender, 
    isLoading: isLazyLoading, 
    isHeavyBlock 
  } = useBlockLazyLoading(block.type);
  
  // Debug mode detection
  const isDebugMode = typeof window !== 'undefined' && 
    window.location.search.includes('debug=blockcontrols');
  
  // Debug logging
  useEffect(() => {
    if (isDebugMode) {
      console.log('🎯 Block Debug:', {
        blockId: block.id,
        blockType: block.type,
        hasBlockControls: true,
        parentClasses: 'group block-wrapper relative',
        timestamp: new Date().toISOString()
      });
    }
  }, [isDebugMode, block.id, block.type]);
  
  const isDropTarget = dropTargetId === block.id;
  const isDraggedBlock = draggedBlockId === block.id;
  
  // Debug log
  if (!BlockComponent) {
    console.error('BlockComponent is undefined for type:', block.type);
    return <div>Error: Unknown block type "{block.type}"</div>;
  }

  const handleConvert = (newType, meta = {}) => {
    if (onConvert) {
      onConvert(block.id, newType, meta);
    }
  };

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(block.id));
    
    if (onDragStart) {
      onDragStart(block.id);
    }
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) onDragOver(e, block.id);
  };

  const handleDragLeave = (e) => {
    if (onDragLeave) onDragLeave(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    
    if (draggedId && draggedId !== block.id && onDrop) {
      onDrop(draggedId, block.id);
    }
  };

  // Mobile controls wrapper
  if (useMobileControls) {
    return (
      <MobileBlockControls
        block={block}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
      >
        <div className="relative" ref={lazyRef}>
          {!shouldRender && isHeavyBlock ? (
            <LazyBlockSkeleton 
              blockType={block.type} 
              estimatedHeight={getEstimatedHeight(block)}
            />
          ) : (
            <BlockComponent 
              block={block} 
              onUpdate={onUpdate}
              onConvert={handleConvert}
              isFocused={isFocused}
              onFocus={onFocus}
              onAddBelow={onAddBelow}
              allBlocks={allBlocks}
              onNavigateToBlock={onNavigateToBlock}
            />
          )}
        </div>
      </MobileBlockControls>
    );
  }
  
  // Desktop view
  return (
    <>
      {/* Drop indicator before */}
      {isDropTarget && dropPosition === 'before' && !isDraggedBlock && (
        <div className="h-1 bg-accent-green rounded-full my-2 animate-pulse" />
      )}
      
      <div 
        ref={lazyRef}
        className={`group block-wrapper relative transition-all duration-200 ${
          isDragging ? 'opacity-30 scale-[0.98]' : ''
        } ${
          isDropTarget && !isDraggedBlock ? 'transform scale-[0.98]' : ''
        } ${
          isDebugMode ? 'debug-block-controls' : ''
        }`}
        data-block-id={block.id}
        style={{ 
          position: 'relative', 
          zIndex: isDragging ? 10 : 'auto'
        }}
        // Mouse events for hover detection with better handling
        onMouseEnter={() => {
          if (isDebugMode) {
            console.log('Block onMouseEnter:', block.id);
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          // Check if mouse is moving to child element
          const relatedTarget = e.relatedTarget;
          // Add null check to prevent TypeError
          if (relatedTarget && e.currentTarget && e.currentTarget.contains(relatedTarget)) {
            return; // Don't hide if moving to child element
          }
          
          // Don't hide if menu is open
          if (!showMenu) {
            if (isDebugMode) {
              console.log('Block onMouseLeave:', block.id);
            }
            setIsHovered(false);
          }
        }}
        // Make the whole block draggable as fallback
        draggable={false}
        onDragStart={(e) => {
          // Prevent drag from block content
          if (!e.target.classList.contains('drag-handle')) {
            e.preventDefault();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (onDragOver) onDragOver(e, block.id);
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* World-Class Inline Action Bar - Only show when block is rendered */}
        <InlineActionBar
          isVisible={isHovered && !isDragging && shouldRender}
          onDelete={() => onDelete(block.id)}
          onDuplicate={() => onDuplicate?.(block.id)}
          onMoveUp={() => {
            console.log('[DEBUG-MOVE-2] Block.onMoveUp wrapper called:', {
              blockId: block.id,
              blockType: block.type,
              hasOnMoveUp: !!onMoveUp,
              onMoveUpType: typeof onMoveUp,
              timestamp: Date.now()
            });
            if (onMoveUp) {
              onMoveUp(block.id);
            } else {
              console.error('[BLOCK] onMoveUp prop is undefined!', {
                blockId: block.id,
                allProps: {
                  onUpdate: !!onUpdate,
                  onDelete: !!onDelete,
                  onMoveUp: !!onMoveUp,
                  onMoveDown: !!onMoveDown,
                  isFocused
                }
              });
            }
          }}
          onMoveDown={() => {
            console.log('[DEBUG-MOVE-2] Block.onMoveDown wrapper called:', {
              blockId: block.id,
              blockType: block.type,
              hasOnMoveDown: !!onMoveDown,
              onMoveDownType: typeof onMoveDown,
              timestamp: Date.now()
            });
            if (onMoveDown) {
              onMoveDown(block.id);
            } else {
              console.error('[BLOCK] onMoveDown prop is undefined!', {
                blockId: block.id,
                allProps: {
                  onUpdate: !!onUpdate,
                  onDelete: !!onDelete,
                  onMoveUp: !!onMoveUp,
                  onMoveDown: !!onMoveDown,
                  isFocused
                }
              });
            }
          }}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          blockId={block.id}
        />

        {/* Block Content or Lazy Loading Skeleton */}
        <div className={`relative ${
          isFocused === false ? 'opacity-40' : 'opacity-100'
        } transition-opacity duration-200`}>
          {!shouldRender && isHeavyBlock ? (
            <LazyBlockSkeleton 
              blockType={block.type} 
              estimatedHeight={getEstimatedHeight(block)}
            />
          ) : (
            <BlockComponent 
              block={block} 
              onUpdate={onUpdate}
              onConvert={handleConvert}
              isFocused={isFocused}
              onFocus={onFocus}
              onAddBelow={onAddBelow}
              allBlocks={allBlocks}
              onNavigateToBlock={onNavigateToBlock}
            />
          )}
        </div>
      </div>

      {/* Drop indicator after */}
      {isDropTarget && dropPosition === 'after' && !isDraggedBlock && (
        <div className="h-1 bg-accent-green rounded-full my-2 animate-pulse" />
      )}
      
      {/* Add Block Divider - Separate hover zone */}
      {showAddButton && !draggedBlockId && (
        <BlockDivider onAdd={() => onAddBelow(block.id)} isMobileView={isMobileView} />
      )}
    </>
  );
}

// Memoize Block component to prevent unnecessary re-renders
export default memo(Block, (prevProps, nextProps) => {
  // Fast path: if block reference didn't change and it's the same content, skip
  if (prevProps.block === nextProps.block) {
    // Still need to check focus and drag states
    const focusChanged = prevProps.isFocused !== nextProps.isFocused;
    const dragChanged = (prevProps.draggedBlockId !== nextProps.draggedBlockId) ||
                       (prevProps.dropTargetId !== nextProps.dropTargetId) ||
                       (prevProps.dropPosition !== nextProps.dropPosition);
    
    return !focusChanged && !dragChanged;
  }
  
  // Check if this specific block's focus state changed
  const prevWasFocused = prevProps.isFocused === prevProps.block.id;
  const nextIsFocused = nextProps.isFocused === nextProps.block.id;
  if (prevWasFocused !== nextIsFocused) return false;
  
  // Check if this block is involved in drag operations
  const prevIsDragged = prevProps.draggedBlockId === prevProps.block.id;
  const nextIsDragged = nextProps.draggedBlockId === nextProps.block.id;
  if (prevIsDragged !== nextIsDragged) return false;
  
  const prevIsDropTarget = prevProps.dropTargetId === prevProps.block.id;
  const nextIsDropTarget = nextProps.dropTargetId === nextProps.block.id;
  if (prevIsDropTarget !== nextIsDropTarget) return false;
  
  // Re-render only if these specific props change
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data === nextProps.block.data &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.type === nextProps.block.type &&
    prevProps.showAddButton === nextProps.showAddButton &&
    prevProps.canMoveUp === nextProps.canMoveUp &&
    prevProps.canMoveDown === nextProps.canMoveDown &&
    prevProps.index === nextProps.index &&
    prevIsDragged === nextIsDragged &&
    prevIsDropTarget === nextIsDropTarget &&
    prevProps.dropPosition === nextProps.dropPosition &&
    prevProps.dropTargetId === nextProps.dropTargetId
  );
});