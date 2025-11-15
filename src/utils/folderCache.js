/**
 * Folder Cache Utility
 * 
 * Features:
 * - LRU (Least Recently Used) cache implementation
 * - Persistence to IndexedDB for offline support
 * - Automatic invalidation after TTL
 * - Memory-efficient with size limits
 */

import Dexie from 'dexie';

class FolderCache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = [];
    this.initDB();
  }

  async initDB() {
    // Initialize IndexedDB for persistence
    this.db = new Dexie('DevLogFolderCache');
    this.db.version(1).stores({
      folders: 'id, userId, timestamp, data'
    });
    await this.db.open();
    console.log('FolderCache: IndexedDB initialized');
  }

  /**
   * Get item from cache
   */
  async get(key) {
    // Check memory cache first
    const cached = this.cache.get(key);
    
    if (cached) {
      // Check if expired
      if (Date.now() - cached.timestamp > this.ttl) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        return null;
      }
      
      // Update access order (LRU)
      this.updateAccessOrder(key);
      return cached.data;
    }

    // Check IndexedDB
    try {
      const stored = await this.db.folders.get(key);
      if (stored && (Date.now() - stored.timestamp < this.ttl)) {
        // Restore to memory cache
        this.set(key, stored.data, false); // Don't persist again
        return stored.data;
      }
    } catch (err) {
      console.error('FolderCache: Error reading from IndexedDB:', err);
    }

    return null;
  }

  /**
   * Set item in cache
   */
  async set(key, data, persist = true) {
    // Enforce size limit (LRU eviction)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.removeFromAccessOrder(lruKey);
    }

    // Add to cache
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Update access order
    this.updateAccessOrder(key);

    // Persist to IndexedDB
    if (persist) {
      try {
        await this.db.folders.put({
          id: key,
          data,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('FolderCache: Error persisting to IndexedDB:', err);
      }
    }
  }

  /**
   * Invalidate specific key
   */
  async invalidate(key) {
    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    
    try {
      await this.db.folders.delete(key);
    } catch (err) {
      console.error('FolderCache: Error deleting from IndexedDB:', err);
    }
  }

  /**
   * Invalidate all cache for a user
   */
  async invalidateUser(userId) {
    // Clear memory cache for user
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`user_${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });

    // Clear IndexedDB for user
    try {
      await this.db.folders
        .where('id')
        .startsWith(`user_${userId}_`)
        .delete();
    } catch (err) {
      console.error('FolderCache: Error clearing user cache:', err);
    }
  }

  /**
   * Clear entire cache
   */
  async clear() {
    this.cache.clear();
    this.accessOrder = [];
    
    try {
      await this.db.folders.clear();
    } catch (err) {
      console.error('FolderCache: Error clearing IndexedDB:', err);
    }
  }

  /**
   * Update LRU access order
   */
  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
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
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;
    let totalSize = 0;

    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
      
      // Estimate size (rough)
      totalSize += JSON.stringify(value.data).length;
    }

    return {
      totalItems: this.cache.size,
      validItems: validCount,
      expiredItems: expiredCount,
      approximateSize: totalSize,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * Cleanup expired items
   */
  async cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    // Clean memory cache
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });

    // Clean IndexedDB
    try {
      const expiredTime = now - this.ttl;
      await this.db.folders
        .where('timestamp')
        .below(expiredTime)
        .delete();
    } catch (err) {
      console.error('FolderCache: Error cleaning IndexedDB:', err);
    }

    console.log(`FolderCache: Cleaned up ${keysToDelete.length} expired items`);
  }

  /**
   * Preload cache from IndexedDB
   */
  async preload(userId) {
    try {
      const stored = await this.db.folders
        .where('id')
        .startsWith(`user_${userId}_`)
        .limit(this.maxSize)
        .toArray();

      const now = Date.now();
      let loadedCount = 0;

      stored.forEach(item => {
        if (now - item.timestamp < this.ttl) {
          this.cache.set(item.id, {
            data: item.data,
            timestamp: item.timestamp
          });
          this.accessOrder.push(item.id);
          loadedCount++;
        }
      });

      console.log(`FolderCache: Preloaded ${loadedCount} items for user ${userId}`);
    } catch (err) {
      console.error('FolderCache: Error preloading from IndexedDB:', err);
    }
  }
}

// Export singleton instance
export const folderCache = new FolderCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  folderCache.cleanup();
}, 300000);

// Helper functions for key generation
export const getCacheKey = {
  folder: (userId, folderId) => `user_${userId}_folder_${folderId}`,
  structure: (userId) => `user_${userId}_structure`,
  documents: (userId, folderId) => `user_${userId}_docs_${folderId}`
};