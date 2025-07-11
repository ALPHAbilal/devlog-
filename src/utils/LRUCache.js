/**
 * LRU (Least Recently Used) Cache Implementation
 * 
 * This replaces the unbounded SessionCache to prevent memory leaks.
 * Features:
 * - Maximum size limit (number of items)
 * - Maximum memory limit (in MB)
 * - Automatic eviction of least recently used items
 * - Performance metrics tracking
 */

export class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.maxMemoryMB = options.maxMemoryMB || 50;
    this.cache = new Map();
    this.accessOrder = [];
    this.memoryUsage = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Estimate the memory size of a value in bytes
   */
  estimateSize(value) {
    if (value === null || value === undefined) return 0;
    
    // Convert to string for size estimation
    try {
      const str = JSON.stringify(value);
      // Approximate: 2 bytes per character in JavaScript strings
      return str.length * 2;
    } catch (e) {
      // If stringify fails, make a rough estimate
      return 1024; // 1KB default
    }
  }

  /**
   * Get a value from the cache
   */
  get(key) {
    if (this.cache.has(key)) {
      this.hits++;
      this.updateAccess(key);
      return this.cache.get(key);
    }
    this.misses++;
    return null;
  }

  /**
   * Set a value in the cache
   */
  set(key, value) {
    const size = this.estimateSize(value);
    
    // Remove old entry if it exists
    if (this.cache.has(key)) {
      const oldValue = this.cache.get(key);
      this.memoryUsage -= this.estimateSize(oldValue);
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }
    
    // Check if single item exceeds memory limit
    if (size > this.maxMemoryMB * 1024 * 1024) {
      console.warn(`LRUCache: Item too large (${(size / 1024 / 1024).toFixed(2)}MB), not caching`);
      return;
    }
    
    // Evict items if needed
    while (
      (this.cache.size >= this.maxSize || 
       this.memoryUsage + size > this.maxMemoryMB * 1024 * 1024) && 
      this.accessOrder.length > 0
    ) {
      this.evictOldest();
    }
    
    // Add new entry
    this.cache.set(key, value);
    this.accessOrder.push(key);
    this.memoryUsage += size;
  }

  /**
   * Check if a key exists in the cache
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.memoryUsage -= this.estimateSize(value);
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return true;
    }
    return false;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.memoryUsage = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get the current size of the cache
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Evict the oldest (least recently used) item
   */
  evictOldest() {
    const oldest = this.accessOrder.shift();
    if (oldest && this.cache.has(oldest)) {
      const value = this.cache.get(oldest);
      this.memoryUsage -= this.estimateSize(value);
      this.cache.delete(oldest);
      this.evictions++;
    }
  }

  /**
   * Update access order when an item is accessed
   */
  updateAccess(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove a key from the access order array
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.hits + this.misses > 0 
      ? (this.hits / (this.hits + this.misses) * 100).toFixed(2)
      : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageMB: (this.memoryUsage / 1024 / 1024).toFixed(2),
      maxMemoryMB: this.maxMemoryMB,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Get all keys in the cache (for debugging)
   */
  keys() {
    return Array.from(this.cache.keys());
  }
}

/**
 * SessionCache - Specialized LRU cache for session data
 * Includes automatic memory monitoring and cleanup
 */
export class SessionCache extends LRUCache {
  constructor() {
    super({
      maxSize: 100,        // Maximum 100 documents/blocks
      maxMemoryMB: 50      // Maximum 50MB memory usage
    });
    
    this.monitoringInterval = null;
    this.setupMemoryMonitoring();
  }

  /**
   * Set up periodic memory monitoring
   */
  setupMemoryMonitoring() {
    // Only monitor in browser environment
    if (typeof window !== 'undefined' && window.performance?.memory) {
      this.monitoringInterval = setInterval(() => {
        const memoryInfo = window.performance.memory;
        const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
        const limitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;
        
        // Log warning if memory usage is high
        if (usedMB > limitMB * 0.8) {
          console.warn(`High memory usage detected: ${usedMB.toFixed(2)}MB / ${limitMB.toFixed(2)}MB`);
          
          // Emergency cleanup - remove 25% of cache
          const itemsToRemove = Math.floor(this.cache.size * 0.25);
          for (let i = 0; i < itemsToRemove; i++) {
            this.evictOldest();
          }
          
          console.log(`Emergency cleanup: Removed ${itemsToRemove} cached items`);
        }
        
        // Log stats periodically in development
        if (process.env.NODE_ENV === 'development') {
          const stats = this.getStats();
          if (stats.size > 0) {
            console.log('Cache Stats:', stats);
          }
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Clean up monitoring interval
   */
  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.clear();
  }
}

// Create singleton instance for the application
let sessionCacheInstance = null;

export function getSessionCache() {
  if (!sessionCacheInstance) {
    sessionCacheInstance = new SessionCache();
  }
  return sessionCacheInstance;
}

// Export for backward compatibility
export default getSessionCache();