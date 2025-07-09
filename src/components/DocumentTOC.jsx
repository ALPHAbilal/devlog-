import { useState, useEffect, useMemo } from 'react';
import { List, ChevronRight, ChevronDown, Hash, Type, Code, MessageSquare, Table, Folder, Package } from 'lucide-react';

const blockIcons = {
  heading: Hash,
  text: Type,
  code: Code,
  ai: MessageSquare,
  table: Table,
  filetree: Folder,
  template: Package
};

export default function DocumentTOC({ blocks, onNavigateToBlock, isVisible, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Generate TOC structure from blocks
  const tocStructure = useMemo(() => {
    const structure = [];
    let currentSection = null;
    
    blocks.forEach((block, index) => {
      if (block.type === 'heading') {
        const section = {
          id: block.id,
          title: block.content || `Heading ${index + 1}`,
          level: block.level || 2,
          blockIndex: index,
          children: []
        };
        
        if (block.level === 1 || !currentSection) {
          structure.push(section);
          currentSection = section;
        } else if (block.level === 2) {
          if (currentSection.level === 1) {
            currentSection.children.push(section);
          } else {
            structure.push(section);
            currentSection = section;
          }
        } else {
          // Level 3 headings go under level 2
          if (currentSection.children.length > 0) {
            currentSection.children[currentSection.children.length - 1].children.push(section);
          } else {
            currentSection.children.push(section);
          }
        }
      } else if (block.type === 'code' || block.type === 'ai' || block.type === 'table') {
        // Add significant blocks to current section
        if (currentSection) {
          const blockTitle = block.type === 'code' 
            ? (block.filePath || `Code Block`)
            : block.type === 'ai' 
            ? 'AI Conversation'
            : block.type === 'table'
            ? 'Table'
            : 'Block';
            
          currentSection.children.push({
            id: block.id,
            title: blockTitle,
            type: block.type,
            blockIndex: index,
            isBlock: true
          });
        }
      }
    });
    
    return structure;
  }, [blocks]);

  // Calculate reading progress and estimated time
  const documentStats = useMemo(() => {
    const totalBlocks = blocks.length;
    const textBlocks = blocks.filter(b => b.type === 'text').length;
    const codeBlocks = blocks.filter(b => b.type === 'code').length;
    const headings = blocks.filter(b => b.type === 'heading').length;
    
    // Rough reading time estimate (words per minute)
    const totalWords = blocks.reduce((count, block) => {
      if (block.content) {
        return count + block.content.split(/\s+/).length;
      }
      return count;
    }, 0);
    
    const readingTime = Math.ceil(totalWords / 200); // 200 WPM average
    
    return {
      totalBlocks,
      textBlocks,
      codeBlocks,
      headings,
      totalWords,
      readingTime
    };
  }, [blocks]);

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.scrollbar-stable');
      if (!scrollContainer) return;
      
      const scrollTop = scrollContainer.scrollTop;
      const containerHeight = scrollContainer.clientHeight;
      const viewportCenter = scrollTop + containerHeight / 2;
      
      // Find which block is currently in view
      let activeBlockId = null;
      blocks.forEach((block) => {
        const element = document.querySelector(`[data-block-id="${block.id}"]`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = scrollTop + rect.top;
          const elementBottom = elementTop + rect.height;
          
          if (elementTop <= viewportCenter && elementBottom >= viewportCenter) {
            activeBlockId = block.id;
          }
        }
      });
      
      setActiveSection(activeBlockId);
    };

    const scrollContainer = document.querySelector('.scrollbar-stable');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [blocks]);

  const handleSectionClick = (blockId) => {
    if (onNavigateToBlock) {
      onNavigateToBlock(blockId);
    }
  };

  const TOCItem = ({ item, level = 0 }) => {
    const Icon = item.isBlock ? blockIcons[item.type] : Hash;
    const isActive = activeSection === item.id;
    
    return (
      <div className={`toc-item ${level > 0 ? 'ml-4' : ''}`}>
        <button
          onClick={() => handleSectionClick(item.id)}
          className={`
            w-full text-left px-2 py-1.5 rounded text-sm transition-all duration-150
            flex items-center gap-2 group
            ${isActive 
              ? 'bg-accent-green/20 text-accent-green border-l-2 border-accent-green' 
              : 'text-text-secondary hover:text-text-primary hover:bg-dark-secondary/30'
            }
            ${item.isBlock ? 'opacity-75 text-xs' : ''}
          `}
        >
          <Icon size={item.isBlock ? 12 : 14} className={`
            ${isActive ? 'text-accent-green' : 'text-text-secondary/50'}
            ${item.isBlock ? '' : 'group-hover:text-accent-green/70'}
          `} />
          <span className={`
            truncate flex-1
            ${item.level === 1 ? 'font-medium' : ''}
            ${item.level === 3 ? 'text-xs' : ''}
          `}>
            {item.title}
          </span>
          {item.level === 1 && (
            <span className="text-xs text-text-secondary/50">
              {item.children.length}
            </span>
          )}
        </button>
        
        {item.children && item.children.length > 0 && (
          <div className="mt-1">
            {item.children.map((child) => (
              <TOCItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-4 top-24 bottom-24 w-80 z-40 flex flex-col">
      {/* TOC Header */}
      <div className="bg-dark-secondary/95 backdrop-blur-sm rounded-t-lg border border-dark-secondary/50 border-b-0">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 text-text-primary hover:bg-dark-primary/30 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <List size={16} />
            <span className="font-medium">Document Outline</span>
          </div>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {/* Quick Stats */}
        <div className="px-3 pb-3 text-xs text-text-secondary/70 space-y-1">
          <div className="flex justify-between">
            <span>{documentStats.totalBlocks} blocks</span>
            <span>{documentStats.readingTime} min read</span>
          </div>
          <div className="flex gap-4">
            <span>{documentStats.headings} sections</span>
            <span>{documentStats.codeBlocks} code</span>
            <span>{documentStats.totalWords} words</span>
          </div>
        </div>
      </div>

      {/* TOC Content */}
      {isExpanded && (
        <div className="flex-1 bg-dark-secondary/95 backdrop-blur-sm rounded-b-lg border border-dark-secondary/50 border-t-0 overflow-hidden">
          <div className="h-full overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {tocStructure.length > 0 ? (
              tocStructure.map((section) => (
                <TOCItem key={section.id} item={section} />
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary/50">
                <List size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No headings found</p>
                <p className="text-xs mt-1">Add heading blocks to see outline</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Button (when collapsed) */}
      {!isExpanded && (
        <button
          onClick={onToggle}
          className="absolute -left-10 top-0 p-2 bg-dark-secondary/95 backdrop-blur-sm
                     rounded-l-lg border border-dark-secondary/50 border-r-0
                     text-text-secondary hover:text-text-primary transition-all
                     hover:bg-dark-primary/50"
          title="Toggle document outline"
        >
          <List size={16} />
        </button>
      )}
    </div>
  );
}