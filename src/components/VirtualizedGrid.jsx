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
  selectionMode = false,
  sidebarCollapsed = false
}) {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerWidth, setContainerWidth] = useState(0);
  
  
  // Configuration for cards - more compact and modern
  const CARD_WIDTH = 280; // Compact width
  const CARD_HEIGHT = 160; // Reduced height for more cards  
  const GAP = 16; // Tighter spacing
  const BUFFER_ROWS = 2; // Extra rows to render for smooth scrolling
  
  // Dynamic max columns based on screen size for enterprise-grade responsiveness
  const calculateMaxColumns = useCallback(() => {
    if (containerWidth < 640) return 1; // Mobile
    if (containerWidth < 768) return 2; // Small tablet
    if (containerWidth < 1024) return 3; // Tablet
    if (containerWidth < 1280) return 4; // Small desktop
    if (containerWidth < 1536) return 5; // Desktop
    return 6; // Large desktop/4K
  }, [containerWidth]);
  
  const MAX_COLUMNS = calculateMaxColumns();

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

  // Update container width using ResizeObserver for better performance
  useEffect(() => {
    if (!containerRef.current) return;
    
    let resizeTimeout;
    const updateWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.offsetWidth;
        setContainerWidth(newWidth);
      }
    };

    // Initial width
    updateWidth();
    
    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      // Clear any pending timeout
      clearTimeout(resizeTimeout);
      
      // For smooth transitions, update immediately
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const newWidth = entry.contentRect.width;
          setContainerWidth(newWidth);
        }
      }
    });
    
    // Also watch for class changes on the main dashboard container
    const dashboardContainer = containerRef.current.closest('.grid');
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Immediately update width when grid container style changes
          updateWidth();
        }
      }
    });
    
    if (dashboardContainer) {
      mutationObserver.observe(dashboardContainer, {
        attributes: true,
        attributeFilter: ['style']
      });
    }
    
    // Also listen to window resize as a fallback
    const handleWindowResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateWidth, 150);
    };

    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(resizeTimeout);
    };
  }, []);
  
  // Force recalculation when sidebar state changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Get the main grid container (parent of parent)
    const scrollContainer = containerRef.current.parentElement;
    const mainContainer = scrollContainer?.parentElement;
    if (!mainContainer) return;
    
    // Calculate the exact final width based on sidebar state
    const viewportWidth = window.innerWidth;
    const sidebarWidth = sidebarCollapsed ? 80 : 280;
    const finalContainerWidth = viewportWidth - sidebarWidth;
    
    // Apply the final width immediately
    setContainerWidth(finalContainerWidth - 48); // Subtract padding (24px each side)
    
    // Use a single RAF loop for smooth updates during transition
    let startTime = null;
    const duration = 300; // Match CSS transition duration
    
    const updateWidth = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (containerRef.current) {
        const currentWidth = containerRef.current.offsetWidth;
        setContainerWidth(currentWidth);
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateWidth);
      }
    };
    
    requestAnimationFrame(updateWidth);
  }, [sidebarCollapsed]);
  
  // Remove debug logging to prevent console spam

  // Handle scroll to update visible range
  const handleScroll = useCallback(() => {
    // Find the parent scrollable container (the cards container in Dashboard)
    const scrollContainer = containerRef.current?.closest('.overflow-y-scroll, .overflow-y-auto');
    if (!scrollContainer) return;

    const scrollTop = scrollContainer.scrollTop;
    const containerHeight = scrollContainer.clientHeight;
    
    // Calculate visible range based on parent's scroll position
    const startRow = Math.max(0, Math.floor(scrollTop / (CARD_HEIGHT + GAP)) - BUFFER_ROWS);
    const endRow = Math.min(
      rows,
      Math.ceil((scrollTop + containerHeight) / (CARD_HEIGHT + GAP)) + BUFFER_ROWS
    );
    
    const start = startRow * columns;
    const end = Math.min(allItems.length, endRow * columns);
    
    setVisibleRange({ start, end });
  }, [columns, rows, allItems.length]);

  useEffect(() => {
    // Find the parent scrollable container
    const scrollContainer = containerRef.current?.closest('.overflow-y-scroll, .overflow-y-auto');
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Get position for each item with smooth transitions
  const getItemStyle = (index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'transform',
      // Use transform for positioning - better performance than left/top
      transform: `translate3d(${centerOffset + col * (CARD_WIDTH + GAP)}px, ${row * (CARD_HEIGHT + GAP)}px, 0)`
    };
  };

  // Calculate total height including padding
  const totalHeight = rows * (CARD_HEIGHT + GAP) - GAP; // Removed padding from calculation
  
  // Debug logging
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest('.overflow-y-scroll, .overflow-y-auto');
    if (scrollContainer) {
      const info = {
        totalHeight,
        containerHeight: scrollContainer.clientHeight,
        hasOverflow: totalHeight > scrollContainer.clientHeight,
        parentIsCardsContainer: scrollContainer.classList.contains('custom-scrollbar')
      };
      console.log('VirtualizedGrid - scroll container:', JSON.stringify(info));
      
      // Also check what the actual parent element is
      const directParent = containerRef.current?.parentElement;
      if (directParent && directParent !== scrollContainer) {
        console.log('Direct parent is different:', {
          className: directParent.className,
          height: directParent.clientHeight
        });
      }
    }
  }, [totalHeight]);

  // TEMPORARY: Make VirtualizedGrid itself scrollable to test
  const TEST_SELF_SCROLL = false;
  
  if (TEST_SELF_SCROLL) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full overflow-y-scroll"
        style={{ 
          maxHeight: '600px', // Force a max height to create overflow
          backgroundColor: 'rgba(255,0,0,0.1)', // Red tint to see container
          border: '2px solid lime' // Green border to see edges
        }}
        onScroll={(e) => {
          console.log('VirtualizedGrid scrolling:', e.target.scrollTop);
          handleScroll();
        }}
      >
        <div 
          style={{ 
            height: totalHeight,
            minHeight: totalHeight,
            paddingTop: 20,
            paddingBottom: 20,
            position: 'relative'
          }}
        >
          {/* Render ALL items to test if content exists */}
          {allItems.map((item, index) => {
            return (
              <div key={item.id} style={getItemStyle(index)}>
                <CompactEntryCard 
                  entry={item} 
                  onExpand={onExpand}
                  searchTerm={searchTerm}
                  isSelected={selectedDocuments.has(item.id)}
                  onSelect={onSelectDocument}
                  selectionMode={selectionMode}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full virtualized-grid-container"
      style={{ 
        height: totalHeight,
        minHeight: totalHeight,
        paddingTop: 20,
        paddingBottom: 20
      }}
    >
      {/* Render only visible items - no wrapper div */}
      {allItems.slice(visibleRange.start, visibleRange.end).map((item, index) => {
        const actualIndex = visibleRange.start + index;
        
        return (
          <div key={item.id} className="virtualized-grid-item" style={getItemStyle(actualIndex)}>
            <CompactEntryCard 
              entry={item} 
              onExpand={onExpand}
              searchTerm={searchTerm}
              isSelected={selectedDocuments.has(item.id)}
              onSelect={onSelectDocument}
              selectionMode={selectionMode}
            />
          </div>
        );
      })}
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
      className="w-full h-full bg-gradient-to-br from-dark-secondary/90 to-dark-secondary/70 
                 rounded-lg p-3 cursor-pointer 
                 transition-all duration-300 hover:shadow-2xl
                 flex flex-col group relative overflow-hidden
                 border border-gray-800/50 hover:border-accent-green/30"
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 
                      group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Accent glow on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-accent-green/0 via-accent-green/20 to-accent-green/0 
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg pointer-events-none" />
      {/* Compact header */}
      <div className="flex justify-between items-start mb-1 relative z-10">
        <div className="flex items-center gap-1 text-xs text-text-secondary/60">
          {blockTypes.code > 0 && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-500/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-blue-400">{blockTypes.code}</span>
            </span>
          )}
          {blockTypes.ai > 0 && (
            <span className="flex items-center gap-0.5 px-1 py-0.5 bg-purple-500/10 rounded-full">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-purple-400">{blockTypes.ai}</span>
            </span>
          )}
        </div>
        {entry.updatedAt && (
          <div className="text-text-secondary/40 text-[9px] opacity-0 group-hover:opacity-100 transition-all duration-300">
            {formatDate(entry.updatedAt)}
          </div>
        )}
      </div>
      
      {/* Title */}
      <h3 className="text-text-primary text-[13px] font-medium mb-1 line-clamp-1 leading-tight">
        {highlightText(entry.title, searchTerm)}
      </h3>
      
      {/* Activity Sparkline - smaller for compact cards */}
      <div className="mb-1">
        <Sparkline 
          data={activityData} 
          width={200} 
          height={20}
          className="opacity-50 group-hover:opacity-90 transition-opacity duration-300"
        />
      </div>
      
      {/* Preview - ultra compact */}
      <p className="text-text-secondary/60 text-[11px] line-clamp-2 flex-grow leading-relaxed">
        {highlightText(entry.preview, searchTerm)}
      </p>

      {/* Minimal tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-1 flex gap-1 overflow-hidden">
          {entry.tags.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="text-[9px] px-1 py-0.5 bg-accent-green/10 rounded-full 
                         text-accent-green/70 truncate max-w-[50px]
                         border border-accent-green/20"
            >
              {tag}
            </span>
          ))}
          {entry.tags.length > 2 && (
            <span className="text-[9px] text-text-secondary/50">
              +{entry.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}