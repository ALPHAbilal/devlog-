import { useState } from 'react';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlockRefined';
import HeadingBlock from './blocks/HeadingBlock';
import FileTreeBlock from './blocks/FileTreeBlock';
import BlockDivider from './BlockDivider';
import BlockControls from './BlockControls';

const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
  filetree: FileTreeBlock,
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
  index 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const BlockComponent = blockComponents[block.type] || TextBlock;
  
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

  return (
    <>
      <div 
        className={`group relative transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-[0.98]' : ''
        }`}
        style={{ zIndex: isHovered ? 10 : 1 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Enhanced Block Controls */}
        <BlockControls
          isVisible={isHovered && !isDragging}
          onDelete={() => onDelete(block.id)}
          onDuplicate={() => onDuplicate?.(block.id)}
          onMoveUp={() => onMoveUp?.(block.id)}
          onMoveDown={() => onMoveDown?.(block.id)}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />

        {/* Visual indicator for focused block */}
        <div className={`
          absolute -left-0.5 top-0 bottom-0 w-0.5 bg-accent-green rounded-full
          transition-all duration-200
          ${isFocused === true ? 'opacity-100' : 'opacity-0'}
        `} />

        {/* Block Content */}
        <div className={`relative transition-all duration-200 ${
          isFocused === false ? 'opacity-40' : 'opacity-100'
        }`}>
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

      {/* Add Block Divider - Separate hover zone */}
      {showAddButton && (
        <BlockDivider onAdd={() => onAddBelow(block.id)} />
      )}
    </>
  );
}