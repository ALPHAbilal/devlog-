/**
 * Session-based cache for documents and blocks
 * Now using LRU cache to prevent memory leaks
 */
import { getSessionCache } from './LRUCache';

// Get the singleton LRU cache instance
const lruCache = getSessionCache();

/**
 * Cache Statistics Tracker
 * Tracks cache performance metrics
 */
class CacheStatsTracker {
  constructor() {
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      updates: 0,
      entryBlocksUsed: 0, // When entry.blocks prop is used instead of cache
      databaseLoads: 0,
      totalLoadTime: 0,
      cacheLoadTime: 0,
      databaseLoadTime: 0,
      entryLoadTime: 0,
      lastReset: Date.now()
    };
  }

  recordHit(loadTime = 0) {
    this.stats.hits++;
    this.stats.cacheLoadTime += loadTime;
    this.stats.totalLoadTime += loadTime;
  }

  recordMiss() {
    this.stats.misses++;
  }

  recordWrite() {
    this.stats.writes++;
  }

  recordUpdate() {
    this.stats.updates++;
  }

  recordEntryBlocks(loadTime = 0) {
    this.stats.entryBlocksUsed++;
    this.stats.entryLoadTime += loadTime;
    this.stats.totalLoadTime += loadTime;
  }

  recordDatabaseLoad(loadTime = 0) {
    this.stats.databaseLoads++;
    this.stats.databaseLoadTime += loadTime;
    this.stats.totalLoadTime += loadTime;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses + this.stats.entryBlocksUsed + this.stats.databaseLoads;
    const hitRate = totalRequests > 0 
      ? ((this.stats.hits / totalRequests) * 100).toFixed(1) 
      : '0.0';
    
    const avgCacheTime = this.stats.hits > 0 
      ? (this.stats.cacheLoadTime / this.stats.hits).toFixed(2) 
      : '0.00';
    
    const avgDatabaseTime = this.stats.databaseLoads > 0 
      ? (this.stats.databaseLoadTime / this.stats.databaseLoads).toFixed(2) 
      : '0.00';
    
    const avgEntryTime = this.stats.entryBlocksUsed > 0 
      ? (this.stats.entryLoadTime / this.stats.entryBlocksUsed).toFixed(2) 
      : '0.00';

    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      avgCacheTime: `${avgCacheTime}ms`,
      avgDatabaseTime: `${avgDatabaseTime}ms`,
      avgEntryTime: `${avgEntryTime}ms`,
      uptime: `${((Date.now() - this.stats.lastReset) / 1000).toFixed(0)}s`
    };
  }

  reset() {
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      updates: 0,
      entryBlocksUsed: 0,
      databaseLoads: 0,
      totalLoadTime: 0,
      cacheLoadTime: 0,
      databaseLoadTime: 0,
      entryLoadTime: 0,
      lastReset: Date.now()
    };
  }

  logSummary() {
    const stats = this.getStats();
    console.log(`[CACHE-STATS] 📊 Cache Performance Summary:`, {
      'Total Requests': stats.totalRequests,
      'Cache Hits': stats.hits,
      'Cache Misses': stats.misses,
      'Entry Blocks Used': stats.entryBlocksUsed,
      'Database Loads': stats.databaseLoads,
      'Hit Rate': stats.hitRate,
      'Avg Cache Time': stats.avgCacheTime,
      'Avg Database Time': stats.avgDatabaseTime,
      'Avg Entry Time': stats.avgEntryTime,
      'Cache Writes': stats.writes,
      'Cache Updates': stats.updates,
      'Uptime': stats.uptime
    });
  }
}

/**
 * SessionCache API wrapper for backward compatibility
 * This maintains the existing API while using LRU cache underneath
 */
class SessionCache {
  constructor() {
    this.cache = lruCache;
    this.statsTracker = new CacheStatsTracker();
    
    // In development, log cache stats periodically
    if (process.env.NODE_ENV === 'development') {
      this.statsInterval = setInterval(() => {
        const stats = this.cache.getStats();
        if (stats.size > 0) {
          console.log('SessionCache Stats:', {
            ...stats,
            documents: this.getDocumentCount(),
            blocks: this.getBlocksCount()
          });
        }
        
        // Log cache performance summary every 2 minutes
        if (this.statsTracker.getStats().totalRequests > 0) {
          this.statsTracker.logSummary();
        }
      }, 120000); // Every 2 minutes
    }
  }

  /**
   * Generate cache key for documents
   */
  getDocumentKey(documentId) {
    return `doc:${documentId}`;
  }

  /**
   * Generate cache key for blocks
   */
  getBlocksKey(documentId) {
    return `blocks:${documentId}`;
  }

  /**
   * Generate cache key for metadata
   */
  getMetadataKey(documentId) {
    return `meta:${documentId}`;
  }

  /**
   * Cache a document
   */
  cacheDocument(document) {
    // Store document without blocks to avoid duplication
    const docToCache = { ...document, blocks: undefined };
    this.cache.set(this.getDocumentKey(document.id), docToCache);
    
    // Update metadata
    this.cache.set(this.getMetadataKey(document.id), {
      lastAccessed: Date.now(),
      loadedAt: Date.now()
    });
    
    console.log(`SessionCache: Cached document ${document.id}`);
  }

  /**
   * Cache blocks for a document
   */
  cacheBlocks(documentId, blocks) {
    const blockCount = Array.isArray(blocks) ? blocks.length : 0;
    const cacheKey = this.getBlocksKey(documentId);
    const writeStart = performance.now();
    
    // [CACHE-TRACK] Log cache write
    console.log(`[CACHE-TRACK] 💾 SET: cacheBlocks(${documentId.substring(0, 8)}) - Caching ${blockCount} blocks`);
    
    this.cache.set(cacheKey, blocks);
    const writeTime = performance.now() - writeStart;
    
    // Track cache write
    this.statsTracker.recordWrite();
    
    // Update metadata
    const metaKey = this.getMetadataKey(documentId);
    const meta = this.cache.get(metaKey) || {};
    this.cache.set(metaKey, {
      ...meta,
      lastAccessed: Date.now(),
      blocksLoadedAt: Date.now()
    });
    
    console.log(`SessionCache: Cached ${blocks.length} blocks for document ${documentId} (write: ${writeTime.toFixed(2)}ms)`);
  }

  /**
   * Get cached document
   */
  getDocument(documentId) {
    const doc = this.cache.get(this.getDocumentKey(documentId));
    if (doc) {
      // Update last accessed in metadata
      const metaKey = this.getMetadataKey(documentId);
      const meta = this.cache.get(metaKey) || {};
      this.cache.set(metaKey, {
        ...meta,
        lastAccessed: Date.now()
      });
    }
    return doc;
  }

  /**
   * Get cached blocks
   */
  getBlocks(documentId) {
    const cacheKey = this.getBlocksKey(documentId);
    const lookupStart = performance.now();
    const blocks = this.cache.get(cacheKey);
    const lookupTime = performance.now() - lookupStart;
    
    // [CACHE-TRACK] Log cache lookup
    if (blocks) {
      const blockCount = Array.isArray(blocks) ? blocks.length : 0;
      console.log(`[CACHE-TRACK] ✅ HIT: getBlocks(${documentId.substring(0, 8)}) - Found ${blockCount} blocks in cache (lookup: ${lookupTime.toFixed(2)}ms)`);
      
      // Track cache hit
      this.statsTracker.recordHit(lookupTime);
      
      // Update last accessed in metadata
      const metaKey = this.getMetadataKey(documentId);
      const meta = this.cache.get(metaKey) || {};
      this.cache.set(metaKey, {
        ...meta,
        lastAccessed: Date.now()
      });
    } else {
      console.log(`[CACHE-TRACK] ❌ MISS: getBlocks(${documentId.substring(0, 8)}) - No blocks in cache (lookup: ${lookupTime.toFixed(2)}ms)`);
      
      // Track cache miss
      this.statsTracker.recordMiss();
    }
    
    return blocks;
  }

  /**
   * Check if document is cached
   */
  hasDocument(documentId) {
    return this.cache.has(this.getDocumentKey(documentId));
  }

  /**
   * Check if blocks are cached
   */
  hasBlocks(documentId) {
    return this.cache.has(this.getBlocksKey(documentId));
  }

  /**
   * Get all cached documents
   */
  getAllDocuments() {
    const documents = [];
    const keys = this.cache.keys();
    
    for (const key of keys) {
      if (key.startsWith('doc:')) {
        const doc = this.cache.get(key);
        if (doc) {
          documents.push(doc);
        }
      }
    }
    
    return documents;
  }

  /**
   * Update a cached document
   */
  updateDocument(documentId, updates) {
    const docKey = this.getDocumentKey(documentId);
    const existing = this.cache.get(docKey);
    
    if (existing) {
      this.cache.set(docKey, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Update cached blocks
   */
  updateBlocks(documentId, blocks) {
    const blockCount = Array.isArray(blocks) ? blocks.length : 0;
    const cacheKey = this.getBlocksKey(documentId);
    const updateStart = performance.now();
    
    // [CACHE-TRACK] Log cache update
    console.log(`[CACHE-TRACK] 🔄 UPDATE: updateBlocks(${documentId.substring(0, 8)}) - Updating cache with ${blockCount} blocks`);
    
    this.cache.set(cacheKey, blocks);
    const updateTime = performance.now() - updateStart;
    
    // Track cache update
    this.statsTracker.recordUpdate();
    
    // Update metadata
    const metaKey = this.getMetadataKey(documentId);
    const meta = this.cache.get(metaKey) || {};
    this.cache.set(metaKey, {
      ...meta,
      lastAccessed: Date.now(),
      blocksUpdatedAt: Date.now()
    });
    
    console.log(`[CACHE-TRACK] ⏱️ UPDATE TIME: ${updateTime.toFixed(2)}ms`);
  }

  /**
   * Clear cache for a specific document
   */
  clearDocument(documentId) {
    this.cache.delete(this.getDocumentKey(documentId));
    this.cache.delete(this.getBlocksKey(documentId));
    this.cache.delete(this.getMetadataKey(documentId));
    console.log(`SessionCache: Cleared cache for document ${documentId}`);
  }

  /**
   * Clear a specific block from cache
   */
  clearBlock(documentId, blockId) {
    const blocks = this.getBlocks(documentId);
    if (blocks && Array.isArray(blocks)) {
      const filteredBlocks = blocks.filter(block => block.id !== blockId);
      if (filteredBlocks.length !== blocks.length) {
        this.updateBlocks(documentId, filteredBlocks);
        console.log(`SessionCache: Cleared block ${blockId} from document ${documentId}`);
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearAll() {
    this.cache.clear();
    console.log('SessionCache: Cleared all cached data');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    
    return {
      documentCount: this.getDocumentCount(),
      blocksCount: this.getBlocksCount(),
      totalSize: `${cacheStats.memoryUsageMB} MB`,
      maxSize: `${cacheStats.maxMemoryMB} MB`,
      hitRate: cacheStats.hitRate,
      evictions: cacheStats.evictions
    };
  }

  /**
   * Get cache performance statistics
   */
  getPerformanceStats() {
    return this.statsTracker.getStats();
  }

  /**
   * Log cache performance summary
   */
  logPerformanceSummary() {
    this.statsTracker.logSummary();
  }

  /**
   * Reset cache performance statistics
   */
  resetPerformanceStats() {
    this.statsTracker.reset();
    console.log('[CACHE-STATS] 🔄 Performance statistics reset');
  }

  /**
   * Get count of cached documents
   */
  getDocumentCount() {
    let count = 0;
    const keys = this.cache.keys();
    
    for (const key of keys) {
      if (key.startsWith('doc:')) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Get count of cached block arrays
   */
  getBlocksCount() {
    let count = 0;
    const keys = this.cache.keys();
    
    for (const key of keys) {
      if (key.startsWith('blocks:')) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();

// Clean up on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sessionCache.destroy();
  });
}