import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../hooks/useResponsive';

/**
 * PullToRefresh Component
 * Implements native-like pull-to-refresh functionality for mobile
 */
export default function PullToRefresh({ 
  onRefresh, 
  children, 
  threshold = 80,
  maxPull = 150,
  disabled = false,
  refreshText = "Pull to refresh",
  releaseText = "Release to refresh",
  loadingText = "Refreshing...",
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);
  
  const { isMobile, isTouchDevice } = useResponsive();
  
  // Motion values for smooth animations
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, threshold], [0, 180]);
  const scale = useTransform(y, [0, threshold], [0.8, 1]);
  const opacity = useTransform(y, [0, threshold / 2], [0, 1]);

  // Only enable on touch devices
  const isEnabled = !disabled && isTouchDevice;

  const handleTouchStart = useCallback((e) => {
    if (!isEnabled || isRefreshing) return;
    
    const touch = e.touches[0];
    startY.current = touch.clientY;
    
    // Check if we're at the top of the scrollable content
    const scrollTop = contentRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      isPulling.current = true;
    }
  }, [isEnabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling.current || isRefreshing) return;
    
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const distance = currentY.current - startY.current;
    
    if (distance > 0) {
      // Prevent default to stop bounce effect
      e.preventDefault();
      
      // Apply resistance as pull distance increases
      const resistance = 1 - Math.min(distance / (maxPull * 2), 0.7);
      const adjustedDistance = Math.min(distance * resistance, maxPull);
      
      setPullDistance(adjustedDistance);
      y.set(adjustedDistance);
      
      // Check if we've passed the threshold
      if (adjustedDistance >= threshold && !canRefresh) {
        setCanRefresh(true);
        // Haptic feedback when threshold reached
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } else if (adjustedDistance < threshold && canRefresh) {
        setCanRefresh(false);
      }
    }
  }, [isRefreshing, threshold, maxPull, canRefresh, y]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    
    isPulling.current = false;
    
    if (canRefresh && !isRefreshing) {
      // Trigger refresh
      setIsRefreshing(true);
      
      // Animate to loading position
      y.set(threshold);
      setPullDistance(threshold);
      
      // Haptic feedback on refresh
      if (navigator.vibrate) {
        navigator.vibrate([20, 10, 20]);
      }
      
      try {
        // Call refresh handler
        await onRefresh();
      } finally {
        // Reset after refresh
        setIsRefreshing(false);
        setCanRefresh(false);
        setPullDistance(0);
        y.set(0);
      }
    } else {
      // Animate back to top
      setPullDistance(0);
      y.set(0);
      setCanRefresh(false);
    }
    
    startY.current = 0;
    currentY.current = 0;
  }, [canRefresh, isRefreshing, onRefresh, threshold, y]);

  // Add touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isEnabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Get status text
  const getStatusText = () => {
    if (isRefreshing) return loadingText;
    if (canRefresh) return releaseText;
    return refreshText;
  };

  if (!isEnabled) {
    // Just render children without pull-to-refresh on desktop
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="absolute top-0 left-0 right-0 flex flex-col items-center 
                       justify-end pointer-events-none z-20"
            style={{ height: threshold }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="flex flex-col items-center gap-2 pb-4"
              style={{ opacity }}
            >
              <motion.div
                style={{ rotate, scale }}
                className={`p-2 rounded-full ${
                  canRefresh ? 'bg-accent-green/20' : 'bg-dark-secondary/50'
                }`}
              >
                <RefreshCw 
                  size={20} 
                  className={`${
                    isRefreshing ? 'animate-spin' : ''
                  } ${
                    canRefresh ? 'text-accent-green' : 'text-text-secondary'
                  }`}
                />
              </motion.div>
              <motion.span 
                className="text-xs text-text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: pullDistance > 20 ? 1 : 0 }}
              >
                {getStatusText()}
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content container */}
      <motion.div
        ref={contentRef}
        className="h-full overflow-y-auto overflow-x-hidden momentum-scroll"
        style={{ y }}
      >
        {children}
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            className="absolute inset-0 bg-dark-primary/20 backdrop-blur-sm z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for programmatic refresh
export function usePullToRefresh(onRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return { isRefreshing, refresh };
}

// Example usage component
export function RefreshableList({ items, onRefresh }) {
  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    await onRefresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4 space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="p-4 bg-dark-secondary rounded-lg"
          >
            {item}
          </div>
        ))}
      </div>
    </PullToRefresh>
  );
}