/**
 * LRU (Least Recently Used) Cache Implementation
 * 
 * Features:
 * - O(1) get and set operations
 * - Automatic eviction of least recently used items
 * - Optional TTL (Time To Live) for entries
 * - Size-based eviction
 */
export class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || null; // milliseconds
    this.cache = new Map();
    this.accessOrder = new Map(); // Track access times
  }

  /**
   * Get value from cache
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    
    // Check TTL
    if (this.ttl && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Update access order (move to end)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value) {
    // If key exists, delete it first to maintain order
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check if we need to evict
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Add new entry
    const entry = {
      value,
      timestamp: Date.now()
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
  }

  /**
   * Delete entry from cache
   */
  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  /**
   * Check if key exists
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const entry = this.cache.get(key);
    
    // Check TTL
    if (this.ttl && Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: `${(this.cache.size / this.maxSize * 100).toFixed(1)}%`,
      ttl: this.ttl ? `${this.ttl / 1000}s` : 'none'
    };
  }

  /**
   * Prune expired entries
   */
  prune() {
    if (!this.ttl) return;

    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
    
    return keysToDelete.length;
  }
}