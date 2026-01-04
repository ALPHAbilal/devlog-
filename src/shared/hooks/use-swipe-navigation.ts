import { useState, useRef, useCallback, useEffect } from 'react';

export function useSwipeNavigation({
  currentIndex,
  totalItems,
  onNavigate,
  threshold = 100,
  enabled = true
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipping, setIsSwipping] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  // Navigate to previous item
  const navigatePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  // Navigate to next item
  const navigateNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, totalItems, onNavigate]);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (!enabled) return;
    
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    currentXRef.current = touch.clientX;
    setIsSwipping(true);
  }, [enabled]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    if (!enabled || !isSwipping) return;
    
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;
    const delta = currentXRef.current - startXRef.current;
    
    // Apply resistance at edges
    let offset = delta;
    if ((currentIndex === 0 && delta > 0) || 
        (currentIndex === totalItems - 1 && delta < 0)) {
      offset = delta * 0.3; // Resistance factor
    }
    
    setSwipeOffset(offset);
    
    // Prevent vertical scrolling while swiping horizontally
    if (Math.abs(delta) > 10) {
      e.preventDefault();
    }
  }, [enabled, isSwipping, currentIndex, totalItems]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!enabled || !isSwipping) return;
    
    const delta = currentXRef.current - startXRef.current;
    const velocity = delta / (Date.now() - startXRef.current);
    
    // Determine if we should navigate
    if (Math.abs(delta) > threshold || Math.abs(velocity) > 0.5) {
      if (delta > 0 && currentIndex > 0) {
        navigatePrevious();
      } else if (delta < 0 && currentIndex < totalItems - 1) {
        navigateNext();
      }
    }
    
    // Reset
    setSwipeOffset(0);
    setIsSwipping(false);
  }, [enabled, isSwipping, currentIndex, totalItems, threshold, navigatePrevious, navigateNext]);

  // Set up event listeners
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enabled) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  // Keyboard navigation
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigatePrevious();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navigatePrevious, navigateNext]);

  return {
    containerRef,
    swipeOffset,
    isSwipping,
    canSwipeLeft: currentIndex > 0,
    canSwipeRight: currentIndex < totalItems - 1,
    navigatePrevious,
    navigateNext
  };
}

// Hook for carousel-style swipe navigation
export function useCarouselSwipe({
  items,
  onChange,
  loop = false,
  autoPlay = false,
  autoPlayInterval = 5000
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  // Handle navigation
  const handleNavigate = useCallback((newIndex) => {
    let finalIndex = newIndex;
    
    if (loop) {
      if (newIndex < 0) {
        finalIndex = items.length - 1;
      } else if (newIndex >= items.length) {
        finalIndex = 0;
      }
    } else {
      finalIndex = Math.max(0, Math.min(newIndex, items.length - 1));
    }
    
    setCurrentIndex(finalIndex);
    onChange?.(finalIndex);
  }, [items.length, loop, onChange]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const startAutoPlay = () => {
      intervalRef.current = setInterval(() => {
        handleNavigate(currentIndex + 1);
      }, autoPlayInterval);
    };

    startAutoPlay();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, currentIndex, items.length, handleNavigate]);

  // Pause auto-play on interaction
  const pauseAutoPlay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const swipeProps = useSwipeNavigation({
    currentIndex,
    totalItems: items.length,
    onNavigate: (index) => {
      pauseAutoPlay();
      handleNavigate(index);
    },
    enabled: true
  });

  return {
    ...swipeProps,
    currentIndex,
    currentItem: items[currentIndex],
    goTo: (index) => {
      pauseAutoPlay();
      handleNavigate(index);
    },
    goToPrevious: () => {
      pauseAutoPlay();
      handleNavigate(currentIndex - 1);
    },
    goToNext: () => {
      pauseAutoPlay();
      handleNavigate(currentIndex + 1);
    }
  };
}