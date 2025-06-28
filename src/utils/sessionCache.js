/**
 * Session-based cache for documents and blocks
 * Enhanced for development to survive HMR better
 */
class SessionCache {
  constructor() {
    // In development, try to restore from window object (survives HMR)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      if (window.__devSessionCache) {
        console.log('[Dev] Restoring session cache from window');
        this.documents = window.__devSessionCache.documents || new Map();
        this.blocks = window.__devSessionCache.blocks || new Map();
        this.metadata = window.__devSessionCache.metadata || new Map();
      } else {
        this.documents = new Map();
        this.blocks = new Map();
        this.metadata = new Map();
        window.__devSessionCache = { documents: this.documents, blocks: this.blocks, metadata: this.metadata };
      }
    } else {
      this.documents = new Map(); // documentId -> document data
      this.blocks = new Map(); // documentId -> blocks array
      this.metadata = new Map(); // documentId -> { lastAccessed, loadedAt }
    }
  }

  /**
   * Cache a document
   */
  cacheDocument(document) {
    this.documents.set(document.id, {
      ...document,
      blocks: undefined // Don't store blocks here to avoid duplication
    });
    
    this.metadata.set(document.id, {
      lastAccessed: Date.now(),
      loadedAt: Date.now()
    });
    
    console.log(`SessionCache: Cached document ${document.id}`);
  }

  /**
   * Cache blocks for a document
   */
  cacheBlocks(documentId, blocks) {
    this.blocks.set(documentId, blocks);
    
    const meta = this.metadata.get(documentId) || {};
    this.metadata.set(documentId, {
      ...meta,
      lastAccessed: Date.now(),
      blocksLoadedAt: Date.now()
    });
    
    console.log(`SessionCache: Cached ${blocks.length} blocks for document ${documentId}`);
  }

  /**
   * Get cached document
   */
  getDocument(documentId) {
    const doc = this.documents.get(documentId);
    if (doc) {
      // Update last accessed
      const meta = this.metadata.get(documentId) || {};
      this.metadata.set(documentId, {
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
    const blocks = this.blocks.get(documentId);
    if (blocks) {
      // Update last accessed
      const meta = this.metadata.get(documentId) || {};
      this.metadata.set(documentId, {
        ...meta,
        lastAccessed: Date.now()
      });
    }
    return blocks;
  }

  /**
   * Check if document is cached
   */
  hasDocument(documentId) {
    return this.documents.has(documentId);
  }

  /**
   * Check if blocks are cached
   */
  hasBlocks(documentId) {
    return this.blocks.has(documentId);
  }

  /**
   * Get all cached documents
   */
  getAllDocuments() {
    return Array.from(this.documents.values());
  }

  /**
   * Update a cached document
   */
  updateDocument(documentId, updates) {
    const existing = this.documents.get(documentId);
    if (existing) {
      this.documents.set(documentId, {
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
    this.blocks.set(documentId, blocks);
    const meta = this.metadata.get(documentId) || {};
    this.metadata.set(documentId, {
      ...meta,
      lastAccessed: Date.now(),
      blocksUpdatedAt: Date.now()
    });
  }

  /**
   * Clear cache for a specific document
   */
  clearDocument(documentId) {
    this.documents.delete(documentId);
    this.blocks.delete(documentId);
    this.metadata.delete(documentId);
    console.log(`SessionCache: Cleared cache for document ${documentId}`);
  }

  /**
   * Clear all cached data
   */
  clearAll() {
    this.documents.clear();
    this.blocks.clear();
    this.metadata.clear();
    console.log('SessionCache: Cleared all cached data');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      documentCount: this.documents.size,
      blocksCount: this.blocks.size,
      totalSize: this.estimateSize(),
      oldestEntry: this.getOldestEntry(),
      newestEntry: this.getNewestEntry()
    };
  }

  /**
   * Estimate cache size in bytes
   */
  estimateSize() {
    let size = 0;
    
    // Estimate documents size
    for (const doc of this.documents.values()) {
      size += JSON.stringify(doc).length * 2; // UTF-16
    }
    
    // Estimate blocks size
    for (const blocks of this.blocks.values()) {
      size += JSON.stringify(blocks).length * 2; // UTF-16
    }
    
    return size;
  }

  /**
   * Get oldest cached entry
   */
  getOldestEntry() {
    let oldest = null;
    let oldestTime = Date.now();
    
    for (const [id, meta] of this.metadata.entries()) {
      if (meta.loadedAt < oldestTime) {
        oldestTime = meta.loadedAt;
        oldest = id;
      }
    }
    
    return oldest;
  }

  /**
   * Get newest cached entry
   */
  getNewestEntry() {
    let newest = null;
    let newestTime = 0;
    
    for (const [id, meta] of this.metadata.entries()) {
      if (meta.loadedAt > newestTime) {
        newestTime = meta.loadedAt;
        newest = id;
      }
    }
    
    return newest;
  }
}

// Export singleton instance
export const sessionCache = new SessionCache();

// Log cache stats periodically in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = sessionCache.getStats();
    if (stats.documentCount > 0) {
      console.log('SessionCache Stats:', stats);
    }
  }, 60000); // Every minute
}