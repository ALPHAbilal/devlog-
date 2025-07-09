import { useState, useEffect, useCallback, useRef } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';
import Block from './Block';
import { 
  Search, Plus, FileText, Hash, Calendar, BarChart2, 
  Sparkles, ChevronRight, X, Maximize2, Minimize2 
} from 'lucide-react';

export default function InteractiveDocumentDemo() {
  const { 
    activeDemoDocument, 
    updateDemoBlock, 
    addDemoBlock, 
    deleteDemoBlock, 
    reorderDemoBlocks,
    searchDemoDocuments 
  } = useDemoMode();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showTooltip, setShowTooltip] = useState('slash-commands');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const results = searchDemoDocuments(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchDemoDocuments]);

  // Drag and drop state
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null);
  const dragCounter = useRef(0);

  // Handle drag start
  const handleDragStart = (e, blockId) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDropTargetId(null);
    setDropPosition(null);
    dragCounter.current = 0;
    
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowTooltip('search');
    }
  };

  // Handle drag over
  const handleDragOver = (e, blockId, position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedBlockId && draggedBlockId !== blockId) {
      setDropTargetId(blockId);
      setDropPosition(position);
    }
  };

  // Handle drop
  const handleDrop = (e, targetBlockId, position) => {
    e.preventDefault();
    
    if (!draggedBlockId || draggedBlockId === targetBlockId) return;
    
    const sourceIndex = activeDemoDocument.blocks.findIndex(b => b.id === draggedBlockId);
    let targetIndex = activeDemoDocument.blocks.findIndex(b => b.id === targetBlockId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // Adjust target index based on position
    if (position === 'after' && targetIndex > sourceIndex) {
      // No adjustment needed
    } else if (position === 'after') {
      targetIndex += 1;
    } else if (position === 'before' && targetIndex > sourceIndex) {
      targetIndex -= 1;
    }
    
    reorderDemoBlocks(activeDemoDocument.id, sourceIndex, targetIndex);
    handleDragEnd();
  };

  // Handle block updates
  const handleBlockUpdate = useCallback((blockId, updates) => {
    updateDemoBlock(activeDemoDocument.id, blockId, updates);
  }, [activeDemoDocument.id, updateDemoBlock]);

  // Handle block deletion
  const handleBlockDelete = useCallback((blockId) => {
    deleteDemoBlock(activeDemoDocument.id, blockId);
  }, [activeDemoDocument.id, deleteDemoBlock]);

  // Add new block
  const handleAddBlock = () => {
    const newBlock = {
      type: 'text',
      content: '',
      isNew: true
    };
    addDemoBlock(activeDemoDocument.id, newBlock);
    
    if (!hasInteracted) {
      setHasInteracted(true);
      setShowTooltip('markdown');
    }
  };

  // Handle navigating between blocks (for linked documents)
  const handleNavigateToBlock = (blockId) => {
    // In demo mode, just highlight the block
    const element = document.getElementById(`block-${blockId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-accent-green');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-accent-green');
      }, 2000);
    }
  };

  const tooltips = {
    'slash-commands': {
      title: 'Try Slash Commands',
      content: 'Type "/" in any text block to see available commands',
      position: 'bottom'
    },
    'drag-drop': {
      title: 'Drag & Drop',
      content: 'Drag blocks by their handle to reorder',
      position: 'left'
    },
    'search': {
      title: 'Instant Search',
      content: 'Press Cmd/Ctrl + K to search across all documents',
      position: 'top'
    },
    'markdown': {
      title: 'Markdown Support',
      content: 'Use **bold**, *italic*, # headings, and more',
      position: 'bottom'
    }
  };

  return (
    <div className={`bg-dark-secondary rounded-lg overflow-hidden transition-all ${
      isFullscreen ? 'fixed inset-4 z-50' : 'relative'
    }`}>
      {/* Header */}
      <div className="bg-dark-primary p-4 border-b border-dark-primary/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FileText className="text-accent-green" size={20} />
            <h3 className="text-lg font-semibold">{activeDemoDocument.title}</h3>
            <div className="flex gap-2">
              {activeDemoDocument.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-accent-green/10 text-accent-green rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-dark-secondary rounded transition-colors"
              title="Search (Cmd/Ctrl + K)"
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-dark-secondary rounded transition-colors"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-dark-secondary pl-10 pr-4 py-2 rounded border border-dark-primary/50 
                       focus:border-accent-green/50 focus:outline-none"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-dark-primary rounded-lg shadow-lg 
                            border border-dark-secondary/50 max-h-64 overflow-y-auto">
                {searchResults.map(doc => (
                  <div key={doc.id} className="p-3 hover:bg-dark-secondary cursor-pointer">
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-text-secondary mt-1">
                      {doc.tags.map(tag => `#${tag}`).join(' ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Tutorial Tooltip */}
        {!hasInteracted && showTooltip && (
          <div className="absolute z-50 bg-accent-green text-dark-primary p-3 rounded-lg shadow-lg 
                        text-sm font-medium animate-pulse" 
               style={{
                 top: tooltips[showTooltip].position === 'bottom' ? '100%' : 'auto',
                 bottom: tooltips[showTooltip].position === 'top' ? '100%' : 'auto',
                 left: '50%',
                 transform: 'translateX(-50%)',
                 marginTop: '8px'
               }}>
            <div className="font-semibold">{tooltips[showTooltip].title}</div>
            <div className="text-xs opacity-90">{tooltips[showTooltip].content}</div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                          border-l-[6px] border-l-transparent 
                          border-b-[8px] border-b-accent-green 
                          border-r-[6px] border-r-transparent"></div>
          </div>
        )}
      </div>

      {/* Document Stats */}
      <div className="px-4 py-2 bg-dark-primary/50 flex items-center gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1">
          <BarChart2 size={14} />
          <span>{activeDemoDocument.blocks.length} blocks</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>Updated {new Date(activeDemoDocument.updated_at).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Hash size={14} />
          <span>{activeDemoDocument.tags.length} tags</span>
        </div>
      </div>

      {/* Document Content */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          {activeDemoDocument.blocks
            .sort((a, b) => a.position - b.position)
            .map((block, index) => (
              <div key={block.id} id={`block-${block.id}`}>
                <Block
                  block={block}
                  index={index}
                  onUpdate={(updates) => handleBlockUpdate(block.id, updates)}
                  onDelete={() => handleBlockDelete(block.id)}
                  onNavigateToBlock={handleNavigateToBlock}
                  allBlocks={activeDemoDocument.blocks}
                  isDemoMode={true}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  draggedBlockId={draggedBlockId}
                  dropTargetId={dropTargetId}
                  dropPosition={dropPosition}
                />
              </div>
            ))}
        </div>

        {/* Add Block Button */}
        <button
          onClick={handleAddBlock}
          className="mt-4 w-full py-3 border-2 border-dashed border-dark-primary hover:border-accent-green/50 
                   rounded-lg flex items-center justify-center gap-2 text-text-secondary 
                   hover:text-accent-green transition-all group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span>Add Block</span>
        </button>
      </div>

      {/* Feature Highlights */}
      <div className="px-6 pb-6">
        <div className="bg-accent-green/10 rounded-lg p-4 border border-accent-green/30">
          <div className="flex items-start gap-3">
            <Sparkles className="text-accent-green mt-0.5" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-accent-green mb-1">Try These Features</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} />
                  <span>Type <code className="px-1 py-0.5 bg-dark-primary rounded text-xs">/</code> for commands</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} />
                  <span>Drag blocks to reorder</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} />
                  <span>Use <code className="px-1 py-0.5 bg-dark-primary rounded text-xs">[[</code> to link documents</span>
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight size={14} />
                  <span>Press <code className="px-1 py-0.5 bg-dark-primary rounded text-xs">Cmd+K</code> to search</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}