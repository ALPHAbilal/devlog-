import { useState, useEffect } from 'react';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlockRefined';
import HeadingBlock from './blocks/HeadingBlock';
import FileTreeBlock from './blocks/FileTreeBlock';
import TableBlock from './blocks/TableBlock';
import TodoBlock from './blocks/TodoBlock';
import ImageBlock from './blocks/ImageBlock';
import InlineImageBlock from './blocks/InlineImageBlock';
import BlockDivider from './BlockDivider';
import BlockControls from './BlockControls';

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
};

export default function Block({ 
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
  dropPosition
}) {
  const [isDragging, setIsDragging] = useState(false);
  const BlockComponent = blockComponents[block.type] || TextBlock;
  
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

  return (
    <>
      {/* Drop indicator before */}
      {isDropTarget && dropPosition === 'before' && !isDraggedBlock && (
        <div className="h-1 bg-accent-green rounded-full my-2 animate-pulse" />
      )}
      
      <div 
        className={`group relative transition-all duration-200 ${
          isDragging ? 'opacity-30 scale-[0.98]' : ''
        } ${
          isDropTarget && !isDraggedBlock ? 'transform scale-[0.98]' : ''
        }`}
        data-block-id={block.id}
        style={{ 
          position: 'relative', 
          zIndex: isDragging ? 10 : 'auto',
          // Extend the drop zone to include the drag handle area
          marginLeft: '-3rem',
          paddingLeft: '3rem',
          '@media (min-width: 768px)': {
            marginLeft: '-4rem',
            paddingLeft: '4rem'
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
        {/* Enhanced Block Controls - Back to original position */}
        <BlockControls
          isVisible={!isDragging}
          onDelete={() => onDelete(block.id)}
          onDuplicate={() => onDuplicate?.(block.id)}
          onMoveUp={() => onMoveUp?.(block.id)}
          onMoveDown={() => onMoveDown?.(block.id)}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          blockId={block.id}
        />

        {/* Block Content */}
        <div className={`relative ${
          isFocused === false ? 'opacity-40' : 'opacity-100'
        } transition-opacity duration-200`}>
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
        </div>
      </div>

      {/* Drop indicator after */}
      {isDropTarget && dropPosition === 'after' && !isDraggedBlock && (
        <div className="h-1 bg-accent-green rounded-full my-2 animate-pulse" />
      )}
      
      {/* Add Block Divider - Separate hover zone */}
      {showAddButton && !draggedBlockId && (
        <BlockDivider onAdd={() => onAddBelow(block.id)} />
      )}
    </>
  );
}