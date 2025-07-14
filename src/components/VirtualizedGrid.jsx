import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EntryCard from './EntryCard';
import Sparkline from './Sparkline';
import { generateActivityData } from '../utils/activityData';
import './VirtualizedGrid.css';

export default function VirtualizedGrid({ 
  entries, 
  onExpand,
  searchTerm,
  selectedDocuments = new Set(),
  onSelectDocument,
  selectionMode = false
}) {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollProgress, setScrollProgress] = useState({ top: 0, bottom: 1 });
  
  // Configuration for cards - balanced for readability
  const CARD_WIDTH = 320; // Proper width for content
  const CARD_HEIGHT = 200; // Proper height for preview  
  const GAP = 20; // Good spacing between cards
  const MAX_COLUMNS = 4; // Optimal columns for readability
  const BUFFER_ROWS = 2; // Extra rows to render for smooth scrolling

  // Calculate columns based on container width
  const columns = Math.min(
    Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)) || 1,
    MAX_COLUMNS
  );
  
  // Calculate centering offset
  const totalGridWidth = columns * CARD_WIDTH + (columns - 1) * GAP;
  const centerOffset = Math.max(0, (containerWidth - totalGridWidth) / 2);

  // Use entries directly without create new card
  const allItems = entries;
  const rows = Math.ceil(allItems.length / columns) || 1; // At least 1 row for empty state

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle scroll to update visible range and fade effects
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const scrollHeight = containerRef.current.scrollHeight;
    
    // Calculate visible range
    const startRow = Math.max(0, Math.floor(scrollTop / (CARD_HEIGHT + GAP)) - BUFFER_ROWS);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + containerHeight) / (CARD_HEIGHT + GAP)) + BUFFER_ROWS
    );
    
    const start = startRow * columns;
    const end = Math.min(allItems.length, endRow * columns);
    
    setVisibleRange({ start, end });
    
    // Calculate fade intensities
    const fadeDistance = 100; // pixels to fade over
    const topFade = Math.min(1, scrollTop / fadeDistance);
    const bottomFade = Math.min(1, (scrollHeight - scrollTop - containerHeight) / fadeDistance);
    
    setScrollProgress({ top: topFade, bottom: bottomFade });
  }, [columns, rows, allItems.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Get position for each item
  const getItemStyle = (index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      position: 'absolute',
      top: row * (CARD_HEIGHT + GAP),
      left: centerOffset + col * (CARD_WIDTH + GAP),
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  };

  return (
    <div className="relative w-full h-full">
      {/* Top fade effect - only visible when scrolled */}
      <div 
        className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-dark-primary to-transparent z-10 pointer-events-none transition-opacity duration-300"
        style={{ opacity: scrollProgress.top * 0.9 }}
      />
      
      {/* Bottom fade effect - only visible when not at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-dark-primary to-transparent z-10 pointer-events-none transition-opacity duration-300"
        style={{ opacity: scrollProgress.bottom * 0.9 }}
      />
      
      {/* Scrollable container */}
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-thin grid-container"
        style={{ 
          paddingTop: 20,
          paddingBottom: 20,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
        }}
      >
        {/* Virtual spacer to maintain scrollbar */}
        <div 
          style={{ 
            height: rows * (CARD_HEIGHT + GAP) - GAP,
            position: 'relative'
          }}
        >
        {/* Render only visible items */}
        {allItems.slice(visibleRange.start, visibleRange.end).map((item, index) => {
          const actualIndex = visibleRange.start + index;
          
          return (
            <div key={item.id} style={getItemStyle(actualIndex)}>
              <EntryCard 
                entry={item} 
                onExpand={onExpand}
                isSelected={selectedDocuments.has(item.id)}
                onSelect={onSelectDocument}
                selectionMode={selectionMode}
              />
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

// Compact version of EntryCard
function CompactEntryCard({ entry, onExpand, searchTerm, isSelected = false, onSelect, selectionMode = false }) {
  // Generate activity data for the sparkline
  const activityData = useMemo(() => generateActivityData(entry), [entry]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Highlight search term
  const highlightText = (text, term) => {
    if (!term) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() 
        ? <mark key={i} className="bg-accent-green/30 text-text-primary">{part}</mark>
        : part
    );
  };

  // Count content types
  const blockTypes = entry.blocks?.reduce((acc, block) => {
    acc[block.type] = (acc[block.type] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div 
      onClick={() => onExpand(entry)}
      className="w-full h-full bg-card-gradient rounded p-3 cursor-pointer 
                 transition-all duration-200 hover:scale-102 hover:shadow-lg
                 flex flex-col group"
    >
      {/* Compact header */}
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary/60">
          {blockTypes.code > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 bg-blue-500/70 rounded-full"></span>
              <span className="text-[10px]">{blockTypes.code}</span>
            </span>
          )}
          {blockTypes.ai > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 bg-purple-500/70 rounded-full"></span>
              <span className="text-[10px]">{blockTypes.ai}</span>
            </span>
          )}
        </div>
        {entry.updatedAt && (
          <div className="text-text-secondary/50 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDate(entry.updatedAt)}
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-text-primary text-sm font-medium mb-1.5 line-clamp-1 leading-tight">
        {highlightText(entry.title, searchTerm)}
      </h3>
      
      {/* Activity Sparkline - 6 months of weekly data */}
      <div className="mb-1.5">
        <Sparkline 
          data={activityData} 
          width={230} 
          height={24}
          className="opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        />
      </div>
      
      {/* Preview - ultra compact */}
      <p className="text-text-secondary/70 text-xs line-clamp-2 flex-grow leading-snug">
        {highlightText(entry.preview, searchTerm)}
      </p>

      {/* Minimal tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-1.5 flex gap-1 overflow-hidden">
          {entry.tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="text-[10px] px-1.5 py-0.5 bg-dark-secondary/40 rounded 
                         text-text-secondary/60 truncate max-w-[60px]"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 2 && (
            <span className="text-[10px] text-text-secondary/50">
              +{entry.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}