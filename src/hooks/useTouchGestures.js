import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Custom hook for handling touch gestures
 * Supports swipe, tap, long press, and pinch gestures
 */
export const useTouchGestures = (elementRef, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    swipeVelocityThreshold = 0.5,
    tapTimeout = 300,
    longPressTimeout = 500,
    preventScroll = false,
  } = options;

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchEndRef = useRef({ x: 0, y: 0, time: 0 });
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isPinchingRef = useRef(false);
  const initialPinchDistanceRef = useRef(0);

  // Calculate distance between two touch points (for pinch)
  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Handle pinch gesture start
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        onLongPress({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target,
        });
      }, longPressTimeout);
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [onLongPress, longPressTimeout, preventScroll]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    // Cancel long press if user moves
    if (longPressTimerRef.current) {
      const touch = e.touches[0];
      const moveThreshold = 10;
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      
      if (dx > moveThreshold || dy > moveThreshold) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Handle pinch gesture
    if (isPinchingRef.current && e.touches.length === 2 && onPinch) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      
      onPinch({
        scale,
        distance: currentDistance,
        center: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        },
      });
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [onPinch, preventScroll]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset pinch
    if (e.touches.length < 2) {
      isPinchingRef.current = false;
    }

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const deltaTime = touchEndRef.current.time - touchStartRef.current.time;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;

    // Detect swipe gestures
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const isSwipe = (absX > swipeThreshold || absY > swipeThreshold) && 
                    velocity > swipeVelocityThreshold;

    if (isSwipe) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight({ distance: absX, velocity, startX: touchStartRef.current.x, startY: touchStartRef.current.y });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft({ distance: absX, velocity, startX: touchStartRef.current.x, startY: touchStartRef.current.y });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown({ distance: absY, velocity, startX: touchStartRef.current.x, startY: touchStartRef.current.y });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp({ distance: absY, velocity, startX: touchStartRef.current.x, startY: touchStartRef.current.y });
        }
      }
    } else if (absX < 10 && absY < 10 && deltaTime < tapTimeout) {
      // Detect tap/double tap
      tapCountRef.current++;
      
      if (tapCountRef.current === 1) {
        // Single tap
        tapTimerRef.current = setTimeout(() => {
          if (tapCountRef.current === 1 && onTap) {
            onTap({
              x: touch.clientX,
              y: touch.clientY,
              target: e.target,
            });
          }
          tapCountRef.current = 0;
        }, tapTimeout);
      } else if (tapCountRef.current === 2 && onDoubleTap) {
        // Double tap
        clearTimeout(tapTimerRef.current);
        onDoubleTap({
          x: touch.clientX,
          y: touch.clientY,
          target: e.target,
        });
        tapCountRef.current = 0;
      }
    }
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    swipeThreshold,
    swipeVelocityThreshold,
    tapTimeout,
  ]);

  // Attach event listeners
  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      // Clean up timers
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll]);

  // Return helper functions
  return {
    // Programmatically trigger gestures (useful for testing)
    simulateSwipeLeft: () => onSwipeLeft?.({ distance: 100, velocity: 1 }),
    simulateSwipeRight: () => onSwipeRight?.({ distance: 100, velocity: 1 }),
    simulateTap: (x = 0, y = 0) => onTap?.({ x, y, target: elementRef.current }),
  };
};

// Hook for detecting pull-to-refresh gesture
export function usePullToRefresh(onRefresh, threshold = 80) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (elementRef.current?.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > threshold) {
      onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isPulling,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
}

// Simplified hook for common swipe gestures
export const useSwipe = (elementRef, { onSwipeLeft, onSwipeRight, threshold = 50 } = {}) => {
  return useTouchGestures(elementRef, {
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: threshold,
  });
};

// Hook for detecting horizontal swipe on the entire document
export const useDocumentSwipe = ({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) => {
  const documentRef = useRef(typeof document !== 'undefined' ? document.body : null);
  return useSwipe(documentRef, { onSwipeLeft, onSwipeRight, threshold });
};