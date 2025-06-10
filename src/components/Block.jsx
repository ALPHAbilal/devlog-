import { useState } from 'react';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlockRefined';
import HeadingBlock from './blocks/HeadingBlock';
import FileTreeBlock from './blocks/FileTreeBlock';
import TableBlock from './blocks/TableBlock';
import TemplateBlock from './blocks/TemplateBlock';
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
        className={`group relative ${
          isDragging ? 'opacity-50 scale-[0.98] transition-all duration-200' : ''
        }`}
        data-block-id={block.id}
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

      {/* Add Block Divider - Separate hover zone */}
      {showAddButton && (
        <BlockDivider onAdd={() => onAddBelow(block.id)} />
      )}
    </>
  );
}