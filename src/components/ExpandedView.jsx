import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import Block from './Block';
import AddBlockRow from './AddBlockRow';

export default function ExpandedView({ entry, onClose, onUpdate }) {
  const [blocks, setBlocks] = useState([]);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Initialize blocks from entry data
  useEffect(() => {
    if (entry.blocks) {
      setBlocks(entry.blocks);
    } else {
      // Convert legacy format to blocks
      const initialBlocks = [];
      
      if (entry.type === 'ai_interaction' && entry.fullContent?.messages) {
        initialBlocks.push({
          id: Date.now().toString(),
          type: 'ai',
          messages: entry.fullContent.messages
        });
      } else if (entry.fullContent) {
        initialBlocks.push({
          id: Date.now().toString(),
          type: 'text',
          content: entry.fullContent
        });
      }
      
      setBlocks(initialBlocks);
    }
  }, [entry]);

  const updateBlock = (blockId, updates) => {
    const updatedBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    // Save to parent/localStorage
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  };

  const deleteBlock = (blockId) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  };

  const addBlock = (type, afterBlockId = null) => {
    const newBlock = {
      id: Date.now().toString(),
      type,
      content: '',
    };

    let updatedBlocks;
    if (afterBlockId) {
      const index = blocks.findIndex(b => b.id === afterBlockId);
      updatedBlocks = [...blocks];
      updatedBlocks.splice(index + 1, 0, newBlock);
    } else {
      updatedBlocks = [...blocks, newBlock];
    }
    
    setBlocks(updatedBlocks);
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }

    setShowBlockSelector(false);
    setSelectorPosition(null);
  };

  const handleAddBelowBlock = (blockId) => {
    setSelectorPosition(blockId);
    setShowBlockSelector(true);
  };

  const handleAddAtEnd = () => {
    setSelectorPosition('end');
    setShowBlockSelector(true);
  };

  const handleTitleSave = () => {
    if (onUpdate) {
      onUpdate(entry.id, { title });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="text-text-secondary text-sm mb-2">
            Document
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
        <button 
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary ml-4"
        >
          <X size={24} />
        </button>
      </div>

      {/* Blocks */}
      <div className="space-y-4 mb-8">
        {blocks.map((block, index) => (
          <div key={block.id} className="relative">
            <Block
              block={block}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onAddBelow={handleAddBelowBlock}
              showAddButton={true}
            />
            <AddBlockRow
              show={showBlockSelector && selectorPosition === block.id}
              onSelect={(type) => addBlock(type, block.id)}
              onClose={() => setShowBlockSelector(false)}
            />
          </div>
        ))}

        {/* Add block at end */}
        <div className="relative pt-4">
          <button
            onClick={handleAddAtEnd}
            className="w-full py-8 border-2 border-dashed border-dark-secondary/50
                       rounded-lg text-text-secondary hover:text-text-primary
                       hover:border-accent-green/50 transition-all
                       flex items-center justify-center gap-2 group"
          >
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span>Add a block</span>
          </button>
          <AddBlockRow
            show={showBlockSelector && selectorPosition === 'end'}
            onSelect={(type) => addBlock(type)}
            onClose={() => setShowBlockSelector(false)}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-3 flex-wrap">
        {entry.tags?.map((tag, index) => (
          <span key={index} className="px-4 py-2 bg-dark-secondary/50 
                                      rounded-full text-text-secondary text-sm
                                      hover:bg-dark-secondary transition-colors cursor-default">
            {tag}
          </span>
        ))}
        {/* Tag input - appears as a subtle clickable area */}
        <button className="px-4 py-2 border border-dashed border-dark-secondary/50
                          rounded-full text-text-secondary text-sm
                          hover:border-text-secondary hover:text-text-primary
                          transition-all opacity-60 hover:opacity-100">
          Add tag...
        </button>
      </div>
    </div>
  );
}