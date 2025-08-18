import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Plus, Link2 } from 'lucide-react';
import { VariableSizeList as List } from 'react-window';
import Block from './Block';
import AddBlockRow from './AddBlockRow';
import { getBacklinks } from '../utils/extractLinks';

// Cache for block heights
const blockHeightCache = new Map();
const DEFAULT_BLOCK_HEIGHT = 150;
const ADD_BUTTON_HEIGHT = 40;

// Get estimated height for different block types
const getEstimatedHeight = (block) => {
  // Use cached height if available
  const cacheKey = `${block.id}-${block.type}`;
  if (blockHeightCache.has(cacheKey)) {
    return blockHeightCache.get(cacheKey);
  }

  // Estimate based on block type
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
      return 400; // Heavy component, fixed height
    case 'issue-tracker':
      return 350; // Heavy component, fixed height
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
      return DEFAULT_BLOCK_HEIGHT;
  }
};

export default function VirtualizedExpandedView({ 
  entry, 
  onClose, 
  onUpdate, 
  allEntries = [] 
}) {
  const [blocks, setBlocks] = useState([]);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState(null);
  const [title, setTitle] = useState(entry.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [backlinks, setBacklinks] = useState([]);
  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  const listRef = useRef();
  const itemHeights = useRef({});

  // Initialize blocks from entry data
  useEffect(() => {
    if (entry.blocks) {
      setBlocks(entry.blocks);
    } else {
      // Convert legacy format to blocks
      const initialBlocks = [];
      
      if (entry.type === 'ai_interaction' && entry.fullContent?.messages) {
        initialBlocks.push({
          id: crypto.randomUUID(),
          type: 'ai',
          messages: entry.fullContent.messages
        });
      } else if (entry.fullContent) {
        initialBlocks.push({
          id: crypto.randomUUID(),
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateBlock = useCallback((blockId, updates) => {
    const updatedBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    // Save to parent/localStorage
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  }, [blocks, onUpdate, entry.id]);

  const deleteBlock = useCallback((blockId) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(updatedBlocks);
    
    // Clear cached height for deleted block
    blocks.forEach(block => {
      if (block.id === blockId) {
        blockHeightCache.delete(`${block.id}-${block.type}`);
      }
    });
    
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
  }, [blocks, onUpdate, entry.id]);

  const convertBlock = useCallback((blockId, newType, meta = {}) => {
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        // Clear old cached height
        blockHeightCache.delete(`${block.id}-${block.type}`);
        
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
    
    // Reset list cache after conversion
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [blocks, onUpdate, entry.id]);

  const addBlock = useCallback((type, afterBlockId = null) => {
    const newBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      isNew: true // Flag to trigger auto-focus
    };

    // Initialize block based on type
    if (type === 'ai') {
      newBlock.messages = [];
    } else if (type === 'heading') {
      newBlock.level = 2;
    } else if (type === 'version-track') {
      newBlock.title = 'New Version Track';
      newBlock.versions = [];
      newBlock.currentVersion = null;
      newBlock.viewMode = 'metro';
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
    
    // Reset list cache after adding
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [blocks, onUpdate, entry.id]);

  const handleAddBelowBlock = useCallback((blockId) => {
    setSelectorPosition(blockId);
    setShowBlockSelector(true);
  }, []);

  const handleAddAtEnd = useCallback(() => {
    setSelectorPosition('end');
    setShowBlockSelector(true);
  }, []);

  const handleTitleSave = useCallback(() => {
    // Check for duplicate names in the same folder
    const documentsInSameLevel = allEntries.filter(doc => 
      doc.folder_id === entry.folder_id && 
      doc.id !== entry.id &&
      !doc.deleted_at
    );
    
    const isDuplicate = documentsInSameLevel.some(doc => doc.title === title);
    
    if (isDuplicate) {
      alert(`A document named "${title}" already exists in this ${entry.folder_id ? 'folder' : 'location'}.`);
      // Restore original title
      setTitle(entry.title);
      setIsEditingTitle(false);
      return;
    }
    
    if (onUpdate) {
      onUpdate(entry.id, { title });
    }
    setIsEditingTitle(false);
  }, [title, entry, allEntries, onUpdate]);

  // Clear focus when clicking outside any block
  const handleBackgroundClick = useCallback((e) => {
    // Only clear focus if clicking on the background, not on any child elements
    if (e.target === e.currentTarget) {
      setFocusedBlockId(null);
    }
  }, []);

  // Get item size for virtual list
  const getItemSize = useCallback((index) => {
    // Check if we have a measured height
    if (itemHeights.current[index]) {
      return itemHeights.current[index];
    }
    
    // Return estimated height
    if (blocks[index]) {
      return getEstimatedHeight(blocks[index]) + ADD_BUTTON_HEIGHT;
    }
    
    return DEFAULT_BLOCK_HEIGHT + ADD_BUTTON_HEIGHT;
  }, [blocks]);

  // Set measured height after render
  const setItemSize = useCallback((index, size) => {
    if (itemHeights.current[index] !== size) {
      itemHeights.current[index] = size;
      if (listRef.current) {
        listRef.current.resetAfterIndex(index);
      }
    }
  }, []);

  // Row renderer for virtual list
  const Row = useCallback(({ index, style }) => {
    const block = blocks[index];
    if (!block) return null;

    return (
      <div 
        style={style}
        className="relative"
        ref={(el) => {
          if (el) {
            const height = el.getBoundingClientRect().height;
            setItemSize(index, height);
          }
        }}
      >
        <Block
          block={block}
          onUpdate={updateBlock}
          onDelete={deleteBlock}
          onAddBelow={handleAddBelowBlock}
          onConvert={convertBlock}
          showAddButton={true}
          isFocused={focusedBlockId === null ? null : focusedBlockId === block.id}
          onFocus={setFocusedBlockId}
          index={index}
          allBlocks={blocks}
        />
        <AddBlockRow
          show={showBlockSelector && selectorPosition === block.id}
          onSelect={(type) => addBlock(type, block.id)}
          onClose={() => setShowBlockSelector(false)}
        />
      </div>
    );
  }, [
    blocks, 
    updateBlock, 
    deleteBlock, 
    handleAddBelowBlock, 
    convertBlock,
    focusedBlockId, 
    showBlockSelector, 
    selectorPosition, 
    addBlock,
    setItemSize
  ]);

  // Calculate list height (subtract header and footer space)
  const listHeight = useMemo(() => {
    return windowHeight - 250; // Account for header, tags, and add button
  }, [windowHeight]);

  return (
    <div 
      className="max-w-4xl mx-auto fade-in"
      onClick={handleBackgroundClick}
    >
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

      {/* Virtualized Blocks */}
      <div 
        className="mb-8 relative pl-14 md:pl-16 lg:pl-20"
        onClick={(e) => {
          // Clear focus if clicking in empty space between blocks
          if (e.target === e.currentTarget) {
            setFocusedBlockId(null);
          }
        }}
      >
        {blocks.length > 0 ? (
          <List
            ref={listRef}
            height={listHeight}
            itemCount={blocks.length}
            itemSize={getItemSize}
            width="100%"
            overscanCount={2}
            className="virtual-list"
          >
            {Row}
          </List>
        ) : (
          <div style={{ minHeight: listHeight }} className="flex items-center justify-center">
            <p className="text-text-secondary">No blocks yet. Add one below.</p>
          </div>
        )}

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
  );
}