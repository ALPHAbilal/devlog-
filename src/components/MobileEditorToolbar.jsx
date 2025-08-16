import { useState, useRef, useEffect } from 'react';
import { 
  Type, Hash, Code, MessageSquare, Table, FileTree, 
  CheckSquare, Bold, Italic, Link2, List, Image,
  Undo, Redo, MoreHorizontal, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileEditorToolbar({ 
  onAddBlock, 
  onFormat, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo,
  activeBlock
}) {
  const [showBlockTypes, setShowBlockTypes] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const scrollContainerRef = useRef(null);

  const blockTypes = [
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'heading', icon: Hash, label: 'Heading' },
    { type: 'code', icon: Code, label: 'Code' },
    { type: 'ai', icon: MessageSquare, label: 'AI Chat' },
    { type: 'table', icon: Table, label: 'Table' },
    { type: 'filetree', icon: FileTree, label: 'File Tree' },
    { type: 'todo', icon: CheckSquare, label: 'Todo List' }
  ];

  const formatOptions = [
    { action: 'bold', icon: Bold, label: 'Bold' },
    { action: 'italic', icon: Italic, label: 'Italic' },
    { action: 'link', icon: Link2, label: 'Link' },
    { action: 'list', icon: List, label: 'List' }
  ];

  // Auto-hide expanded sections when scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setShowBlockTypes(false);
        setShowFormatting(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-primary border-t 
                    border-dark-secondary/50 z-40 pb-safe">
      {/* Block Types Panel */}
      <AnimatePresence>
        {showBlockTypes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-dark-secondary/30 overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-2 p-3">
              {blockTypes.map((block) => (
                <button
                  key={block.type}
                  onClick={() => {
                    onAddBlock(block.type);
                    setShowBlockTypes(false);
                  }}
                  className="flex flex-col items-center gap-1 p-3 
                           bg-dark-secondary/40 rounded-lg 
                           active:bg-accent-green/20 active:scale-95
                           transition-all duration-150"
                >
                  <block.icon size={20} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">{block.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formatting Panel */}
      <AnimatePresence>
        {showFormatting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-dark-secondary/30 overflow-hidden"
          >
            <div className="flex gap-2 p-3">
              {formatOptions.map((format) => (
                <button
                  key={format.action}
                  onClick={() => {
                    onFormat(format.action);
                    setShowFormatting(false);
                  }}
                  className="flex-1 flex flex-col items-center gap-1 p-3 
                           bg-dark-secondary/40 rounded-lg 
                           active:bg-accent-green/20 active:scale-95
                           transition-all duration-150"
                >
                  <format.icon size={20} className="text-text-secondary" />
                  <span className="text-xs text-text-secondary">{format.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toolbar */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Undo/Redo */}
        <div className="flex gap-1 mr-2 border-r border-dark-secondary/30 pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2.5 rounded-lg bg-dark-secondary/40 
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:bg-accent-green/20 active:scale-95
                     transition-all duration-150"
          >
            <Undo size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2.5 rounded-lg bg-dark-secondary/40 
                     disabled:opacity-30 disabled:cursor-not-allowed
                     active:bg-accent-green/20 active:scale-95
                     transition-all duration-150"
          >
            <Redo size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* Quick Actions */}
        <button
          onClick={() => {
            setShowBlockTypes(!showBlockTypes);
            setShowFormatting(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg 
                     ${showBlockTypes ? 'bg-accent-green/20' : 'bg-dark-secondary/40'}
                     active:scale-95 transition-all duration-150 flex-shrink-0`}
        >
          <Plus size={18} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Block</span>
        </button>

        <button
          onClick={() => {
            setShowFormatting(!showFormatting);
            setShowBlockTypes(false);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg 
                     ${showFormatting ? 'bg-accent-green/20' : 'bg-dark-secondary/40'}
                     active:scale-95 transition-all duration-150 flex-shrink-0`}
        >
          <Type size={18} className="text-text-secondary" />
          <span className="text-sm text-text-secondary">Format</span>
        </button>

        {/* Quick Block Type Buttons */}
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => onAddBlock('heading')}
            className="p-2.5 rounded-lg bg-dark-secondary/40 
                     active:bg-accent-green/20 active:scale-95
                     transition-all duration-150"
          >
            <Hash size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={() => onAddBlock('code')}
            className="p-2.5 rounded-lg bg-dark-secondary/40 
                     active:bg-accent-green/20 active:scale-95
                     transition-all duration-150"
          >
            <Code size={18} className="text-text-secondary" />
          </button>
          <button
            onClick={() => onAddBlock('todo')}
            className="p-2.5 rounded-lg bg-dark-secondary/40 
                     active:bg-accent-green/20 active:scale-95
                     transition-all duration-150"
          >
            <CheckSquare size={18} className="text-text-secondary" />
          </button>
        </div>

        {/* More Options */}
        <button
          className="p-2.5 rounded-lg bg-dark-secondary/40 ml-2
                   active:bg-accent-green/20 active:scale-95
                   transition-all duration-150"
        >
          <MoreHorizontal size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Scroll Indicators */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2 
                      pointer-events-none opacity-50">
        <ChevronLeft size={16} className="text-text-secondary" />
      </div>
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2 
                      pointer-events-none opacity-50">
        <ChevronRight size={16} className="text-text-secondary" />
      </div>
    </div>
  );
}

// Plus icon component
function Plus({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}