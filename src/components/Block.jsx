import { useState } from 'react';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlockRefined';
import HeadingBlock from './blocks/HeadingBlock';
import FileTreeBlock from './blocks/FileTreeBlock';
import TableBlock from './blocks/TableBlock';
import TemplateBlock from './blocks/TemplateBlock';
import MathBlock from './blocks/MathBlock';
import TodoBlock from './blocks/TodoBlock';
import BlockDivider from './BlockDivider';
import BlockControls from './BlockControls';

const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
  filetree: FileTreeBlock,
  table: TableBlock,
  template: TemplateBlock,
  math: MathBlock,
  todo: TodoBlock,
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
    e.dataTransfer.setData('text/plain', block.id);
    
    // Create a better drag image
    const dragImage = document.createElement('div');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: #1e3a5f;
      color: #e0e7ff;
      padding: 8px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-size: 14px;
      font-family: inherit;
    `;
    dragImage.textContent = `Moving ${block.type} block`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 100, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    if (onDragStart) onDragStart(block.id);
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Enhanced Block Controls - Use CSS :hover instead of state */}
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
            onUpdate={(updates) => onUpdate(block.id, updates)}
            onConvert={handleConvert}
            isFocused={isFocused}
            onFocus={onFocus}
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