import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Link2 } from 'lucide-react';
import Block from './Block';
import AddBlockRow from './AddBlockRow';
import { getBacklinks } from '../utils/extractLinks';
import './VirtualizedGrid.css'; // For scrollbar styles

export default function ExpandedView({ entry, onClose, onUpdate, allEntries = [] }) {
  const [blocks, setBlocks] = useState([]);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [backlinks, setBacklinks] = useState([]);
  const [focusedBlockId, setFocusedBlockId] = useState(null);

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

  // Calculate backlinks
  useEffect(() => {
    const links = getBacklinks(entry.title, allEntries);
    setBacklinks(links);
  }, [entry.title, allEntries]);

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

  const duplicateBlock = (blockId) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const blockToDuplicate = blocks[blockIndex];
    const duplicatedBlock = {
      ...blockToDuplicate,
      id: Date.now().toString(),
      isNew: false
    };
    
    const updatedBlocks = [...blocks];
    updatedBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
    
    setBlocks(updatedBlocks);
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  };

  const moveBlock = (blockId, direction) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    
    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(blockIndex, 1);
    updatedBlocks.splice(newIndex, 0, movedBlock);
    
    setBlocks(updatedBlocks);
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  };

  const convertBlock = (blockId, newType, meta = {}) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        // Preserve content if possible
        const newBlock = {
          ...block,
          type: newType,
          ...meta
        };
        
        // Handle special conversions
        if (newType === 'heading' && meta.level) {
          newBlock.level = meta.level;
        }
        
        // Clear content for AI blocks as they use different structure
        if (newType === 'ai') {
          newBlock.content = '';
          newBlock.messages = [];
        }
        
        return newBlock;
      }
      return block;
    });
    
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
      isNew: true // Flag to trigger auto-focus
    };

    // Initialize block based on type
    if (type === 'ai') {
      newBlock.messages = [];
    } else if (type === 'heading') {
      newBlock.level = 2;
    }

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

  // Clear focus when clicking outside any block
  const handleBackgroundClick = (e) => {
    // Only clear focus if clicking on the background, not on any child elements
    if (e.target === e.currentTarget) {
      setFocusedBlockId(null);
    }
  };

  return (
    <div 
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin"
      onClick={handleBackgroundClick}
    >
      <div className="max-w-4xl mx-auto fade-in px-8 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button 
          onClick={onClose}
          className="mt-1 p-2 text-text-secondary hover:text-text-primary 
                     hover:bg-dark-secondary/50 rounded-lg transition-all
                     group flex items-center gap-2"
          title="Back to dashboard"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
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
      </div>

      {/* Blocks */}
      <div 
        className="space-y-4 mb-8 min-h-[400px]"
        onClick={(e) => {
          // Clear focus if clicking in empty space between blocks
          if (e.target === e.currentTarget) {
            setFocusedBlockId(null);
          }
        }}>
        {blocks.map((block, index) => (
          <div key={block.id} className="relative">
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
              onAddBelow={handleAddBelowBlock}
              onConvert={convertBlock}
              showAddButton={true}
              isFocused={focusedBlockId === null ? null : focusedBlockId === block.id}
              onFocus={setFocusedBlockId}
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
      <div className="flex items-center gap-3 flex-wrap mb-8">
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

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="border-t border-dark-secondary/30 pt-8">
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
                <div className="text-text-primary font-medium group-hover:text-accent-green 
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
    </div>
  );
}