// Mobile performance optimization utilities

// Debounce function for touch events
export function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function for scroll events
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Request idle callback polyfill
export const requestIdleCallback = 
  window.requestIdleCallback ||
  function (cb) {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
      });
    }, 1);
  };

export const cancelIdleCallback = 
  window.cancelIdleCallback ||
  function (id) {
    clearTimeout(id);
  };

// Detect device capabilities
export const deviceCapabilities = {
  // Check if device is low-end
  isLowEnd: () => {
    // Check for low memory
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
      return true;
    }
    
    // Check for slow CPU
    if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    // Check connection speed
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        return true;
      }
    }
    
    return false;
  },

  // Check if device prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if device is in power save mode
  isPowerSaveMode: () => {
    if ('getBattery' in navigator) {
      return navigator.getBattery().then(battery => {
        return battery.level < 0.2; // Less than 20% battery
      });
    }
    return Promise.resolve(false);
  },

  // Get optimal image format
  getOptimalImageFormat: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    if (canvas.toDataURL('image/webp').indexOf('image/webp') === 0) {
      return 'webp';
    } else if (canvas.toDataURL('image/avif').indexOf('image/avif') === 0) {
      return 'avif';
    }
    return 'jpeg';
  }
};

// Intersection Observer for lazy loading
export function createLazyLoader(options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };

  const observerOptions = { ...defaultOptions, ...options };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Load images
        if (element.dataset.src) {
          element.src = element.dataset.src;
          delete element.dataset.src;
        }
        
        // Load background images
        if (element.dataset.bgSrc) {
          element.style.backgroundImage = `url(${element.dataset.bgSrc})`;
          delete element.dataset.bgSrc;
        }
        
        // Trigger custom load event
        element.dispatchEvent(new Event('lazyloaded'));
        
        // Stop observing
        observer.unobserve(element);
      }
    });
  }, observerOptions);

  return {
    observe: (element) => observer.observe(element),
    unobserve: (element) => observer.unobserve(element),
    disconnect: () => observer.disconnect()
  };
}

// Virtual scrolling helper
export class VirtualScroller {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      itemHeight: options.itemHeight || 100,
      buffer: options.buffer || 5,
      onRender: options.onRender || (() => {}),
      ...options
    };
    
    this.items = [];
    this.visibleRange = { start: 0, end: 0 };
    this.scrollTop = 0;
    
    this.init();
  }

  init() {
    this.container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    this.update();
  }

  setItems(items) {
    this.items = items;
    this.update();
  }

  handleScroll() {
    this.scrollTop = this.container.scrollTop;
    this.update();
  }

  update() {
    const containerHeight = this.container.clientHeight;
    const { itemHeight, buffer } = this.options;
    
    const startIndex = Math.max(0, Math.floor(this.scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + containerHeight) / itemHeight) + buffer
    );
    
    if (startIndex !== this.visibleRange.start || endIndex !== this.visibleRange.end) {
      this.visibleRange = { start: startIndex, end: endIndex };
      this.options.onRender(this.visibleRange, this.items);
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
  }
}

// Touch-optimized image preloader
export class ImagePreloader {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  preload(urls) {
    const promises = urls.map(url => this.loadImage(url));
    return Promise.all(promises);
  }

  loadImage(url) {
    // Check cache
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url));
    }

    // Check if already loading
    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    // Load image
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(url, img);
        this.loading.delete(url);
        resolve(img);
      };
      
      img.onerror = () => {
        this.loading.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      
      img.src = url;
    });

    this.loading.set(url, promise);
    return promise;
  }

  clear() {
    this.cache.clear();
    this.loading.clear();
  }
}

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      loadTime: 0
    };
    this.callbacks = new Set();
  }

  start() {
    // Monitor FPS
    let lastTime = performance.now();
    let frames = 0;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        this.notify();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
    
    // Monitor memory (if available)
    if (performance.memory) {
      setInterval(() => {
        this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
        this.notify();
      }, 1000);
    }
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  notify() {
    this.callbacks.forEach(cb => cb(this.metrics));
  }
}

// Export singleton instances
export const lazyLoader = createLazyLoader();
export const performanceMonitor = new PerformanceMonitor();
export const imagePreloader = new ImagePreloader();