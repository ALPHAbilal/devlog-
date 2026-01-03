import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for detecting when an element enters/exits the viewport
 * Optimized for performance monitoring
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const defaultOptions = {
      threshold: 0.1, // Trigger when 10% visible
      rootMargin: '100px', // Start observing 100px before entering viewport
      ...options
    };

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        const visible = intersecting && entry.intersectionRatio > 0.1;
        
        setIsIntersecting(intersecting);
        setIsVisible(visible);

        // Performance logging in debug mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Intersection Observer:`, {
            target: entry.target.dataset.blockId || 'unknown',
            isIntersecting: intersecting,
            isVisible: visible,
            intersectionRatio: entry.intersectionRatio,
            timestamp: new Date().toISOString()
          });
        }
      },
      defaultOptions
    );

    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options.threshold, options.rootMargin]);

  return { targetRef, isIntersecting, isVisible };
}

/**
 * Hook specifically for canvas animation control
 * Provides more granular control for heavy animations
 */
export function useCanvasVisibility(options = {}) {
  const { targetRef, isIntersecting, isVisible } = useIntersectionObserver({
    threshold: 0.2, // Require 20% visibility for canvas animations
    rootMargin: '50px', // Smaller margin for canvas to be more conservative
    ...options
  });

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      // Start animation immediately when visible
      setShouldAnimate(true);
      
      // Clear any pending stop timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    } else {
      // Delay stopping animation to prevent flickering during fast scrolling
      animationTimeoutRef.current = setTimeout(() => {
        setShouldAnimate(false);
      }, 500); // 500ms delay before stopping animation
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isVisible]);

  return { targetRef, isIntersecting, isVisible, shouldAnimate };
}