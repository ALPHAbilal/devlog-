import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Link2 } from 'lucide-react';
import Block from './Block';
import AddBlockRow from './AddBlockRow';
import { getBacklinks } from '../utils/extractLinks';
import { linkCodeVersions, markAsHavingVersions, VersionTimeline } from './blocks/CodeVersionTracker';
import './VirtualizedGrid.css'; // For scrollbar styles

export default function ExpandedView({ entry, onClose, onUpdate, allEntries = [] }) {
  const [blocks, setBlocks] = useState([]);
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
  const scrollContainerRef = useRef(null);
  const dragScrollInterval = useRef(null);

  // Initialize blocks from entry data
  useEffect(() => {
    if (entry.blocks) {
      // Clean up any stale isNew flags when loading
      const cleanedBlocks = entry.blocks.map(block => {
        if (block.isNew) {
          const { isNew, ...blockWithoutNew } = block;
          return blockWithoutNew;
        }
        return block;
      });
      setBlocks(cleanedBlocks);
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
    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        // Remove isNew flag when updating a block (user has interacted with it)
        const { isNew, ...blockWithoutNew } = block;
        return { ...blockWithoutNew, ...updates };
      }
      return block;
    });
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
    let duplicatedBlock = {
      ...blockToDuplicate,
      id: Date.now().toString(),
      isNew: false
    };
    
    // If duplicating a code block, set up version tracking
    if (blockToDuplicate.type === 'code') {
      // Link the new block to the original
      duplicatedBlock = linkCodeVersions(blockToDuplicate, duplicatedBlock);
      
      // Update the original block to indicate it has versions
      const updatedBlocks = [...blocks];
      updatedBlocks[blockIndex] = markAsHavingVersions(blockToDuplicate);
      updatedBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      
      setBlocks(updatedBlocks);
      if (onUpdate) {
        onUpdate(entry.id, { blocks: updatedBlocks });
      }
    } else {
      // Normal duplication for non-code blocks
      const updatedBlocks = [...blocks];
      updatedBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
      
      setBlocks(updatedBlocks);
      if (onUpdate) {
        onUpdate(entry.id, { blocks: updatedBlocks });
      }
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
  const handleDragStart = (blockId) => {
    setDraggedBlockId(blockId);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition('after');
    stopAutoScroll();
  };

  const handleDragOver = (e, blockId) => {
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
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the entire block area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (draggedId, targetId) => {
    if (draggedId === targetId) return;
    
    const draggedIndex = blocks.findIndex(b => b.id === draggedId);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const updatedBlocks = [...blocks];
    const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
    
    // Calculate insert index based on drop position
    let insertIndex = targetIndex;
    if (dropPosition === 'before') {
      insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    } else {
      insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
    }
    
    updatedBlocks.splice(insertIndex, 0, draggedBlock);
    
    setBlocks(updatedBlocks);
    if (onUpdate) {
      onUpdate(entry.id, { blocks: updatedBlocks });
    }
    
    // Clean up
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition('after');
    stopAutoScroll();
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


  // Tag management functions
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      if (onUpdate) {
        onUpdate(entry.id, { tags: updatedTags });
      }
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const updateTag = (index, value) => {
    if (value.trim() && !tags.includes(value.trim())) {
      const updatedTags = [...tags];
      updatedTags[index] = value.trim();
      setTags(updatedTags);
      if (onUpdate) {
        onUpdate(entry.id, { tags: updatedTags });
      }
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

  const deleteTag = (index) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    setTags(updatedTags);
    if (onUpdate) {
      onUpdate(entry.id, { tags: updatedTags });
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

  // Scroll to top when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, []); // Only on mount

  return (
    <div 
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-stable"
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
          <div className="flex items-center justify-between">
            <div className="text-text-secondary text-sm mb-2">
              Document
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

      {/* Blocks */}
      <div 
        ref={contentContainerRef}
        className="space-y-4 mb-8 min-h-[400px] relative pl-8"
        onClick={(e) => {
          // Clear focus if clicking in empty space between blocks
          if (e.target === e.currentTarget) {
            setFocusedBlockId(null);
          }
        }}>
        {/* Render version timelines */}
        {blocks.map((block, index) => {
          if (block.versionOf) {
            // Find the original block
            const originalBlock = blocks.find(b => b.id === block.versionOf);
            if (originalBlock) {
              return (
                <VersionTimeline
                  key={`timeline-${block.id}`}
                  startBlockId={block.versionOf}
                  endBlockId={block.id}
                  blocks={blocks}
                  containerRef={contentContainerRef}
                />
              );
            }
          }
          return null;
        })}
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-dark-secondary/50 
                           rounded-full text-text-secondary text-sm
                           hover:bg-dark-secondary transition-colors cursor-pointer group"
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