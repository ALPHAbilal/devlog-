import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EntryCard from './EntryCard';
import { sessionCache } from '../utils/sessionCache';
import './VirtualizedGrid.css';

// Skeleton card component
const SkeletonCard = () => (
  <div className="bg-dark-secondary/30 rounded-lg p-4 h-[140px] 
                  border border-dark-secondary/50 animate-pulse">
    <div className="h-5 bg-gray-800/50 rounded w-3/4 mb-3" />
    <div className="space-y-2 mb-3">
      <div className="h-3 bg-gray-800/30 rounded" />
      <div className="h-3 bg-gray-800/30 rounded w-5/6" />
    </div>
    <div className="flex gap-2 mt-auto">
      <div className="h-5 w-16 bg-gray-800/30 rounded-full" />
      <div className="h-5 w-20 bg-gray-800/30 rounded-full" />
    </div>
  </div>
);

export default function VirtualizedGridOptimized({ 
  entries, 
  onExpand,
  searchTerm,
  onNeedMore // Callback to request more entries
}) {
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const loadedCardsRef = useRef(new Set());
  
  const [visibleCards, setVisibleCards] = useState(new Map());
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Configuration
  const CARD_WIDTH = 260;
  const CARD_HEIGHT = 140;
  const GAP = 16;
  const MAX_COLUMNS = 5;
  const INITIAL_LOAD = 12; // Load first 12 cards
  const LOAD_MORE_THRESHOLD = 0.8; // Load more when 80% scrolled
  
  // Calculate layout
  const columns = Math.min(
    Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)) || 1,
    MAX_COLUMNS
  );
  
  const totalGridWidth = columns * CARD_WIDTH + (columns - 1) * GAP;
  const centerOffset = Math.max(0, (containerWidth - totalGridWidth) / 2);
  const rows = Math.ceil(entries.length / columns) || 1;

  // Update container width
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

  // Initialize visible cards from cache or with initial set
  useEffect(() => {
    const initialCards = new Map();
    
    // Load from cache first
    entries.slice(0, INITIAL_LOAD).forEach((entry, index) => {
      const cached = sessionCache.getDocument(entry.id);
      if (cached) {
        initialCards.set(index, cached);
      } else {
        initialCards.set(index, entry);
        sessionCache.cacheDocument(entry);
      }
      loadedCardsRef.current.add(index);
    });
    
    setVisibleCards(initialCards);
  }, [entries]);

  // Setup intersection observer for progressive loading
  useEffect(() => {
    if (!containerRef.current) return;

    // Create observer for card placeholders
    const observerOptions = {
      root: containerRef.current,
      rootMargin: '100px', // Start loading 100px before visible
      threshold: 0.01
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        const index = parseInt(entry.target.dataset.index);
        
        if (entry.isIntersecting && !loadedCardsRef.current.has(index)) {
          // Load this card
          const cardData = entries[index];
          if (cardData) {
            loadedCardsRef.current.add(index);
            
            // Check cache first
            const cached = sessionCache.getDocument(cardData.id);
            
            setVisibleCards(prev => {
              const newMap = new Map(prev);
              newMap.set(index, cached || cardData);
              return newMap;
            });
            
            // Cache if not already cached
            if (!cached) {
              sessionCache.cacheDocument(cardData);
            }
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(observerCallback, observerOptions);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [entries, containerRef.current]);

  // Render callback for cards
  const renderCard = useCallback((index) => {
    const entry = visibleCards.get(index);
    
    if (!entry) {
      // Render placeholder that will trigger loading when visible
      return (
        <div
          key={`placeholder-${index}`}
          data-index={index}
          ref={(el) => {
            if (el && observerRef.current) {
              observerRef.current.observe(el);
            }
          }}
          style={{
            position: 'absolute',
            left: `${centerOffset + (index % columns) * (CARD_WIDTH + GAP)}px`,
            top: `${Math.floor(index / columns) * (CARD_HEIGHT + GAP)}px`,
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`
          }}
        >
          <SkeletonCard />
        </div>
      );
    }

    // Render actual card
    return (
      <div
        key={entry.id}
        style={{
          position: 'absolute',
          left: `${centerOffset + (index % columns) * (CARD_WIDTH + GAP)}px`,
          top: `${Math.floor(index / columns) * (CARD_HEIGHT + GAP)}px`,
          width: `${CARD_WIDTH}px`,
          height: `${CARD_HEIGHT}px`
        }}
      >
        <EntryCard
          entry={entry}
          onExpand={() => {
            // Update cache with latest data before expanding
            sessionCache.cacheDocument(entry);
            onExpand(entry);
          }}
          searchTerm={searchTerm}
          compact={true}
        />
      </div>
    );
  }, [visibleCards, columns, centerOffset, onExpand, searchTerm]);

  // Handle scroll for loading more entries
  const handleScroll = useCallback((e) => {
    const container = e.target;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Check if we need to load more entries
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > LOAD_MORE_THRESHOLD && onNeedMore && !isLoadingMore) {
      setIsLoadingMore(true);
      onNeedMore().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [onNeedMore, isLoadingMore]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      <div
        style={{
          position: 'relative',
          height: `${rows * CARD_HEIGHT + (rows - 1) * GAP}px`,
          minHeight: '100%'
        }}
      >
        {/* Render all cards (visible ones with data, others with skeleton) */}
        {Array.from({ length: entries.length }, (_, index) => renderCard(index))}
        
        {/* Loading more indicator */}
        {isLoadingMore && (
          <div 
            className="absolute bottom-0 left-0 right-0 flex justify-center p-4"
            style={{ 
              top: `${rows * CARD_HEIGHT + (rows - 1) * GAP}px`
            }}
          >
            <div className="bg-dark-secondary/50 rounded-lg px-4 py-2 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-accent-green/50 border-t-accent-green 
                              rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Loading more documents...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}