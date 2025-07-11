/**
 * Performance-oriented React hooks
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { debounce, throttle, whenIdle } from '../utils/performance';

/**
 * Hook for debounced values
 * @param {*} value - Value to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {*} Debounced value
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled values
 * @param {*} value - Value to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {*} Throttled value
 */
export function useThrottle(value, delay) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook for lazy loading with IntersectionObserver
 * @param {Object} options - IntersectionObserver options
 * @returns {[React.RefObject, boolean]} [ref, isIntersecting]
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [options.root, options.rootMargin, options.threshold]);

  return [targetRef, isIntersecting];
}

/**
 * Hook for running code when browser is idle
 * @param {Function} callback - Function to run when idle
 * @param {Array} deps - Dependencies
 */
export function useIdleCallback(callback, deps = []) {
  useEffect(() => {
    const handle = whenIdle(callback);
    return () => {
      if (handle && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(handle);
      }
    };
  }, deps);
}

/**
 * Hook for viewport size with debouncing
 * @returns {Object} { width, height }
 */
export function useViewportSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 250);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

/**
 * Hook for media queries
 * @param {string} query - Media query string
 * @returns {boolean} Matches
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Hook for prefetching data
 * @param {Function} fetchFn - Fetch function
 * @param {Array} deps - Dependencies
 * @returns {Object} { prefetch, data, loading, error }
 */
export function usePrefetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cache = useRef(new Map());

  const prefetch = useCallback(async (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.current.has(key)) {
      setData(cache.current.get(key));
      return cache.current.get(key);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(...args);
      cache.current.set(key, result);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  return { prefetch, data, loading, error };
}

/**
 * Hook for virtual scrolling
 * @param {Object} config - Virtual scroll configuration
 * @returns {Object} Virtual scroll state and helpers
 */
export function useVirtualScroll({
  items,
  itemHeight,
  containerHeight,
  buffer = 5,
  scrollingDelay = 150
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef(null);

  const startIndex = useMemo(
    () => Math.max(0, Math.floor(scrollTop / itemHeight) - buffer),
    [scrollTop, itemHeight, buffer]
  );

  const endIndex = useMemo(
    () => Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    ),
    [scrollTop, containerHeight, itemHeight, buffer, items.length]
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
    setIsScrolling(true);

    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [scrollingDelay]);

  useEffect(() => {
    return () => {
      clearTimeout(scrollTimeout.current);
    };
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    isScrolling,
    startIndex,
    endIndex
  };
}

/**
 * Hook for progressive image loading
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {Object} { src, isLoading, error }
 */
export function useProgressiveImage(src, placeholder) {
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = (e) => {
      setError(e);
      setIsLoading(false);
    };
    
    img.src = src;
  }, [src]);

  return { src: currentSrc, isLoading, error };
}

/**
 * Hook for network status
 * @returns {Object} Network status information
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState({
    online: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null,
    rtt: navigator.connection?.rtt || null,
    saveData: navigator.connection?.saveData || false
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus({
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || null,
        rtt: navigator.connection?.rtt || null,
        saveData: navigator.connection?.saveData || false
      });
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}