/**
 * Performance Optimization Utilities
 * 
 * Provides utilities for optimizing application performance including:
 * - Image lazy loading
 * - Component lazy loading
 * - Debouncing and throttling
 * - Resource preloading
 * - Performance measurements
 */

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Preload critical resources
 * @param {Array<string>} urls - URLs to preload
 */
export function preloadResources(urls) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    // Determine resource type based on extension
    const extension = url.split('.').pop();
    switch (extension) {
      case 'css':
        link.as = 'style';
        break;
      case 'js':
        link.as = 'script';
        break;
      case 'woff':
      case 'woff2':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        link.as = 'image';
        break;
      default:
        link.as = 'fetch';
    }
    
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Intersection Observer for lazy loading
 * @param {string} selector - CSS selector for elements to observe
 * @param {Function} callback - Callback when element is visible
 * @param {Object} options - IntersectionObserver options
 * @returns {IntersectionObserver} Observer instance
 */
export function createLazyLoader(selector, callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { ...defaultOptions, ...options });
  
  // Start observing elements
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => observer.observe(el));
  
  return observer;
}

/**
 * Lazy load images
 * @param {string} selector - CSS selector for images
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  return createLazyLoader(selector, (img) => {
    img.src = img.dataset.src;
    img.classList.add('loaded');
    delete img.dataset.src;
  });
}

/**
 * Request idle callback with fallback
 * @param {Function} callback - Function to run when idle
 * @param {Object} options - Options for requestIdleCallback
 */
export function whenIdle(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    // Fallback using setTimeout
    setTimeout(callback, 1);
  }
}

/**
 * Measure performance of a function
 * @param {string} name - Name for the measurement
 * @param {Function} func - Function to measure
 * @returns {*} Function result
 */
export async function measurePerformance(name, func) {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;
  
  performance.mark(startMark);
  
  try {
    const result = await func();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
    
    // Clean up marks and measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return result;
  } catch (error) {
    performance.clearMarks(startMark);
    throw error;
  }
}

/**
 * Batch DOM updates
 * @param {Array<Function>} updates - Array of update functions
 */
export function batchDOMUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Create a virtual list for rendering large lists efficiently
 * @param {Object} config - Virtual list configuration
 * @returns {Object} Virtual list controller
 */
export function createVirtualList(config) {
  const {
    container,
    itemHeight,
    totalItems,
    renderItem,
    buffer = 5
  } = config;
  
  let scrollTop = 0;
  let visibleStart = 0;
  let visibleEnd = 0;
  
  const updateVisibleItems = () => {
    const containerHeight = container.clientHeight;
    scrollTop = container.scrollTop;
    
    visibleStart = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    visibleEnd = Math.min(
      totalItems,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    render();
  };
  
  const render = () => {
    // Clear container
    container.innerHTML = '';
    
    // Create spacer for items before visible range
    const spacerTop = document.createElement('div');
    spacerTop.style.height = `${visibleStart * itemHeight}px`;
    container.appendChild(spacerTop);
    
    // Render visible items
    for (let i = visibleStart; i < visibleEnd; i++) {
      const item = renderItem(i);
      container.appendChild(item);
    }
    
    // Create spacer for items after visible range
    const spacerBottom = document.createElement('div');
    spacerBottom.style.height = `${(totalItems - visibleEnd) * itemHeight}px`;
    container.appendChild(spacerBottom);
  };
  
  // Add scroll listener with throttling
  const handleScroll = throttle(updateVisibleItems, 16); // ~60fps
  container.addEventListener('scroll', handleScroll);
  
  // Initial render
  updateVisibleItems();
  
  return {
    refresh: updateVisibleItems,
    destroy: () => {
      container.removeEventListener('scroll', handleScroll);
    }
  };
}

/**
 * Prefetch data for likely navigation
 * @param {string} url - URL to prefetch
 * @param {Object} options - Fetch options
 */
export async function prefetchData(url, options = {}) {
  if ('link' in document.createElement('link')) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  } else {
    // Fallback: fetch and cache
    whenIdle(() => {
      fetch(url, { ...options, cache: 'force-cache' });
    });
  }
}

/**
 * Memory-efficient memoization
 * @param {Function} fn - Function to memoize
 * @param {number} maxSize - Maximum cache size
 * @returns {Function} Memoized function
 */
export function memoizeWithLimit(fn, maxSize = 100) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Move to end (LRU)
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Remove oldest entries if cache is too large
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Performance observer for monitoring metrics
 * @param {Function} callback - Callback for performance entries
 * @returns {PerformanceObserver} Observer instance
 */
export function observePerformance(callback) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      callback(entry);
    }
  });
  
  // Observe various performance entry types
  try {
    observer.observe({ entryTypes: ['measure', 'navigation', 'resource', 'largest-contentful-paint'] });
  } catch (e) {
    // Fallback for browsers that don't support all entry types
    observer.observe({ entryTypes: ['measure'] });
  }
  
  return observer;
}