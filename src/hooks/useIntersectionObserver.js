import { useState, useEffect, useRef } from 'react';

/**
 * Optimized Intersection Observer hook for lazy loading and animations
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isIntersecting, entry]
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer with default options
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    };

    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, observerOptions);

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
        observerRef.current.disconnect();
      }
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return [elementRef, isIntersecting, entry];
}

/**
 * Hook for lazy loading components when they come into view
 * @param {Function} onIntersect - Callback when element intersects
 * @param {Object} options - Intersection Observer options
 * @returns {React.RefObject} Ref to attach to element
 */
export function useLazyLoad(onIntersect, options = {}) {
  const hasLoadedRef = useRef(false);
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.01,
    rootMargin: '100px',
    ...options,
  });

  useEffect(() => {
    if (isIntersecting && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      onIntersect?.();
    }
  }, [isIntersecting, onIntersect]);

  return ref;
}