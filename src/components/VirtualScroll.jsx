import { useState, useEffect, useRef, useCallback } from 'react';
import { useResponsive } from '@/shared/hooks';

/**
 * VirtualScroll Component
 * Efficiently renders large lists by only rendering visible items
 */
export default function VirtualScroll({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  gap = 0,
  getItemHeight,
  estimatedItemHeight = 50,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);
  const scrollTimeout = useRef(null);
  const { isMobile } = useResponsive();
  
  // Dynamic height support
  const itemHeights = useRef({});
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Calculate item positions
  const getItemPosition = useCallback((index) => {
    if (itemHeight) {
      return index * (itemHeight + gap);
    }
    
    let position = 0;
    for (let i = 0; i < index; i++) {
      position += (itemHeights.current[i] || estimatedItemHeight) + gap;
    }
    return position;
  }, [itemHeight, gap, estimatedItemHeight]);
  
  // Calculate total height
  const totalHeight = useCallback(() => {
    if (itemHeight) {
      return items.length * (itemHeight + gap) - gap;
    }
    
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += (itemHeights.current[i] || estimatedItemHeight) + gap;
    }
    return height - gap;
  }, [items.length, itemHeight, gap, estimatedItemHeight]);
  
  // Find start and end indices for visible items
  const getVisibleRange = useCallback(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / (itemHeight || estimatedItemHeight)) - overscan
    );
    
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / (itemHeight || estimatedItemHeight)) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, estimatedItemHeight, items.length, overscan]);
  
  // Handle scroll
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll(e);
    }
    
    // Debounce scroll end detection
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      // Scroll ended, could trigger data fetching here
    }, 150);
  }, [onScroll]);
  
  // Measure container
  useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    measureContainer();
    
    const resizeObserver = new ResizeObserver(measureContainer);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);
  
  // Measure item heights for dynamic sizing
  const measureItem = useCallback((index, element) => {
    if (!element || itemHeight) return;
    
    const height = element.getBoundingClientRect().height;
    if (itemHeights.current[index] !== height) {
      itemHeights.current[index] = height;
      setForceUpdate(prev => prev + 1);
    }
  }, [itemHeight]);
  
  const { startIndex, endIndex } = getVisibleRange();
  const visibleItems = [];
  
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    if (!item) continue;
    
    const position = getItemPosition(i);
    
    visibleItems.push(
      <div
        key={i}
        ref={(el) => measureItem(i, el)}
        style={{
          position: 'absolute',
          top: position,
          left: 0,
          right: 0,
          height: itemHeight || 'auto',
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${isMobile ? 'momentum-scroll' : ''} ${className}`}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div
        style={{
          height: totalHeight(),
          position: 'relative',
        }}
      >
        {/* Visible items */}
        {visibleItems}
      </div>
    </div>
  );
}

// Virtual list with sections
export function VirtualSectionList({
  sections,
  renderSectionHeader,
  renderItem,
  sectionHeaderHeight = 40,
  itemHeight,
  overscan = 3,
  className = '',
  gap = 0,
  stickyHeaders = true,
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef(null);
  const { isMobile } = useResponsive();
  
  // Flatten sections with metadata
  const flatItems = [];
  let currentPosition = 0;
  
  sections.forEach((section, sectionIndex) => {
    // Add section header
    flatItems.push({
      type: 'header',
      section,
      sectionIndex,
      position: currentPosition,
      height: sectionHeaderHeight,
    });
    currentPosition += sectionHeaderHeight + gap;
    
    // Add section items
    section.items.forEach((item, itemIndex) => {
      const height = itemHeight || item.height || 50;
      flatItems.push({
        type: 'item',
        item,
        sectionIndex,
        itemIndex,
        position: currentPosition,
        height,
      });
      currentPosition += height + gap;
    });
  });
  
  const totalHeight = currentPosition - gap;
  
  // Find visible items
  const getVisibleItems = () => {
    const startPosition = scrollTop - overscan * (itemHeight || 50);
    const endPosition = scrollTop + containerHeight + overscan * (itemHeight || 50);
    
    return flatItems.filter(
      item => item.position + item.height >= startPosition && item.position <= endPosition
    );
  };
  
  // Find sticky header
  const getStickyHeader = () => {
    if (!stickyHeaders) return null;
    
    for (let i = flatItems.length - 1; i >= 0; i--) {
      const item = flatItems[i];
      if (item.type === 'header' && item.position <= scrollTop) {
        return item;
      }
    }
    return null;
  };
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    measureContainer();
    
    const resizeObserver = new ResizeObserver(measureContainer);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);
  
  const visibleItems = getVisibleItems();
  const stickyHeader = getStickyHeader();
  
  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${isMobile ? 'momentum-scroll' : ''} ${className}`}
      onScroll={handleScroll}
    >
      {/* Sticky header */}
      {stickyHeader && (
        <div
          className="sticky top-0 z-10"
          style={{ height: sectionHeaderHeight }}
        >
          {renderSectionHeader(stickyHeader.section, stickyHeader.sectionIndex)}
        </div>
      )}
      
      {/* Scrollable content */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => {
          if (item.type === 'header') {
            // Skip sticky header if it's already rendered
            if (stickyHeaders && item === stickyHeader) return null;
            
            return (
              <div
                key={`header-${item.sectionIndex}`}
                style={{
                  position: 'absolute',
                  top: item.position,
                  left: 0,
                  right: 0,
                  height: item.height,
                }}
              >
                {renderSectionHeader(item.section, item.sectionIndex)}
              </div>
            );
          } else {
            return (
              <div
                key={`item-${item.sectionIndex}-${item.itemIndex}`}
                style={{
                  position: 'absolute',
                  top: item.position,
                  left: 0,
                  right: 0,
                  height: item.height,
                }}
              >
                {renderItem(item.item, item.itemIndex, item.sectionIndex)}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

// Hook for infinite scrolling
export function useInfiniteScroll({
  loadMore,
  hasMore,
  threshold = 100,
  isLoading = false,
}) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  
  useEffect(() => {
    if (!hasMore || isLoading) return;
    
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setIsFetching(true);
          await loadMore();
          setIsFetching(false);
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );
    
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    
    observerRef.current = observer;
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isFetching, loadMore, threshold]);
  
  return {
    loadingRef,
    isFetching,
  };
}

// Example usage component
export function VirtualListExample() {
  const [items] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    }))
  );
  
  const renderItem = (item) => (
    <div className="p-4 border-b border-dark-secondary">
      <h3 className="font-medium text-text-primary">{item.title}</h3>
      <p className="text-sm text-text-secondary">{item.description}</p>
    </div>
  );
  
  return (
    <div className="h-screen bg-dark-primary">
      <div className="p-4 border-b border-dark-secondary">
        <h2 className="text-xl font-bold text-text-primary">
          Virtual List Demo ({items.length} items)
        </h2>
      </div>
      
      <VirtualScroll
        items={items}
        itemHeight={80}
        renderItem={renderItem}
        className="h-[calc(100vh-64px)]"
      />
    </div>
  );
}

// Virtual grid component
export function VirtualGrid({
  items,
  columnCount = 3,
  itemHeight,
  renderItem,
  gap = 16,
  className = '',
  overscan = 1,
}) {
  const rowCount = Math.ceil(items.length / columnCount);
  const rowHeight = itemHeight + gap;
  
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const startIndex = rowIndex * columnCount;
    return items.slice(startIndex, startIndex + columnCount);
  });
  
  const renderRow = (row, rowIndex) => (
    <div
      className="flex"
      style={{ gap, height: itemHeight }}
    >
      {row.map((item, colIndex) => {
        const itemIndex = rowIndex * columnCount + colIndex;
        return (
          <div
            key={itemIndex}
            style={{ flex: `0 0 calc((100% - ${gap * (columnCount - 1)}px) / ${columnCount})` }}
          >
            {renderItem(item, itemIndex)}
          </div>
        );
      })}
      {/* Fill empty cells */}
      {row.length < columnCount && Array.from({ length: columnCount - row.length }).map((_, i) => (
        <div
          key={`empty-${i}`}
          style={{ flex: `0 0 calc((100% - ${gap * (columnCount - 1)}px) / ${columnCount})` }}
        />
      ))}
    </div>
  );
  
  return (
    <VirtualScroll
      items={rows}
      itemHeight={rowHeight}
      renderItem={renderRow}
      overscan={overscan}
      className={className}
      gap={0}
    />
  );
}