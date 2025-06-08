import { useState } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import TextBlock from './blocks/TextBlock';
import CodeBlock from './blocks/CodeBlock';
import AIBlock from './blocks/AIBlock';
import HeadingBlock from './blocks/HeadingBlock';
import BlockDivider from './BlockDivider';

const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
};

export default function Block({ block, onUpdate, onDelete, onAddBelow, onConvert, showAddButton }) {
  const [isHovered, setIsHovered] = useState(false);
  const BlockComponent = blockComponents[block.type] || TextBlock;

  const handleConvert = (newType, meta = {}) => {
    if (onConvert) {
      onConvert(block.id, newType, meta);
    }
  };

  return (
    <>
      <div 
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Block Controls */}
        <div className={`absolute -left-12 top-2 flex gap-1 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button className="p-1 hover:bg-dark-secondary rounded cursor-move">
            <GripVertical size={16} className="text-text-secondary" />
          </button>
          <button 
            onClick={() => onDelete(block.id)}
            className="p-1 hover:bg-dark-secondary rounded"
          >
            <Trash2 size={16} className="text-text-secondary hover:text-red-500" />
          </button>
        </div>

        {/* Block Content */}
        <div className="relative">
          <BlockComponent 
            block={block} 
            onUpdate={(updates) => onUpdate(block.id, updates)}
            onConvert={handleConvert}
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