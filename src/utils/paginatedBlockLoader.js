import { supabase } from '@/shared/api';
import { optimizedBlockLoader } from './optimizedBlockLoader';
import { LRUCache } from './storage/LRUCache';

/**
 * Paginated block loader for handling large documents efficiently
 */
export class PaginatedBlockLoader {
  constructor() {
    this.pageSize = 50; // Default page size
    // Using LRUCache with 30-second TTL for active editing (was 5 minutes!)
    this.cache = new LRUCache({ 
      maxSize: 50,  // Max 50 documents cached
      ttl: 30000    // 30 seconds TTL - perfect for active editing
    });
    this.activeLoads = new Map();
    this.pendingRequests = new Map(); // Track pending requests to deduplicate
    this.cacheValidityMs = 30000; // 30 seconds cache validity (was 5 minutes!)
  }

  /**
   * Load the first page of blocks for a document
   */
  async loadDocumentFirstPage(documentId, pageSize = this.pageSize) {
    // Check if we have cached data
    const cacheKey = `${documentId}-page-0`;
    const cachedPage = this.cache.get(cacheKey);
    if (cachedPage) {
      // Cache hit - using cached data (LRUCache handles TTL automatically)
      return {
        blocks: cachedPage.blocks,
        totalCount: cachedPage.totalCount || cachedPage.blocks.length,
        hasMore: cachedPage.totalCount > pageSize,
        fromCache: true
      };
    }

    return this.loadDocumentPage(documentId, 0, pageSize);
  }

  /**
   * Load a specific page of blocks
   */
  async loadDocumentPage(documentId, page = 0, pageSize = this.pageSize) {
    const cacheKey = `${documentId}-${page}`;
    
    // Check if there's already a pending request for this exact page
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`PaginatedBlockLoader: Deduplicating request for ${cacheKey}`);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Cancel any existing load for this page
    const existingController = this.activeLoads.get(cacheKey);
    if (existingController) {
      existingController.abort();
    }

    const controller = new AbortController();
    this.activeLoads.set(cacheKey, controller);

    // Create the request promise
    const requestPromise = (async () => {
      try {
        const offset = page * pageSize;

        // First, get the total count (excluding soft-deleted blocks)
        const { count: totalCount, error: countError } = await supabase
          .from('blocks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId)
          .is('deleted_at', null);  // CRITICAL: Filter out soft-deleted blocks

        if (countError) throw countError;
        if (controller.signal.aborted) return null;

      // Then fetch the page of blocks
      console.log(`PaginatedBlockLoader: Loading page ${page} (offset: ${offset}, limit: ${pageSize}) for document ${documentId}`);
      
      // CRITICAL DEBUG: Check what table we're querying
      console.log('[BLOCKS-LOAD-DEBUG] Querying blocks table for document:', documentId);
      
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .is('deleted_at', null)  // CRITICAL: Filter out soft-deleted blocks
        .order('position')
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (controller.signal.aborted) return null;

      console.log(`PaginatedBlockLoader: Loaded ${blocks?.length || 0} blocks for page ${page} of document ${documentId}`);
      
      // CRITICAL DEBUG: Check if blocks have type field
      if (blocks && blocks.length > 0) {
        console.log('[BLOCKS-LOAD-DEBUG] First block from DB:', {
          id: blocks[0].id,
          type: blocks[0].type,
          has_type: !!blocks[0].type,
          position: blocks[0].position,
          has_position: blocks[0].position !== null && blocks[0].position !== undefined,
          content_length: blocks[0].content?.length || 0
        });
      } else {
        console.log('[BLOCKS-LOAD-DEBUG] No blocks found in blocks table');
      }

      // Transform blocks
      const transformedBlocks = blocks.map(block => 
        optimizedBlockLoader.transformBlockFromDB(block)
      );

      // Update cache with page-specific key
      const pageCacheKey = `${documentId}-page-${page}`;
      this.cache.set(pageCacheKey, {
        blocks: transformedBlocks,
        totalCount: totalCount || 0,
        timestamp: Date.now()
      });
      
      // Also cache the total count separately
      this.cache.set(`${documentId}-totalCount`, totalCount || 0);

        this.activeLoads.delete(cacheKey);
        this.pendingRequests.delete(cacheKey); // Clean up pending request

        return {
          blocks: transformedBlocks,
          totalCount: totalCount || 0,
          page,
          pageSize,
          hasMore: offset + blocks.length < totalCount,
          fromCache: false
        };
      } catch (error) {
        this.activeLoads.delete(cacheKey);
        this.pendingRequests.delete(cacheKey); // Clean up pending request
        console.error('Error loading page:', error);
        throw error;
      }
    })();
    
    // Store the pending request
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  /**
   * Load all blocks up to a certain page (for smooth scrolling)
   */
  async loadBlocksUpToPage(documentId, targetPage, pageSize = this.pageSize) {
    const allBlocks = [];
    
    // Load all pages up to target page
    for (let page = 0; page <= targetPage; page++) {
      // Check cache first
      const pageCacheKey = `${documentId}-page-${page}`;
      const cachedPage = this.cache.get(pageCacheKey);
      if (cachedPage) {
        // LRUCache handles TTL, so if we got data, it's fresh
        allBlocks.push(...cachedPage.blocks);
        continue;
      }

      // Load page if not cached
      const result = await this.loadDocumentPage(documentId, page, pageSize);
      if (result && result.blocks) {
        allBlocks.push(...result.blocks);
      }
    }

    const totalCount = this.cache.get(`${documentId}-totalCount`) || allBlocks.length;
    return {
      blocks: allBlocks,
      totalCount: totalCount,
      hasMore: allBlocks.length < totalCount
    };
  }

  /**
   * Preload the next page for smooth scrolling
   */
  async preloadNextPage(documentId, currentPage, pageSize = this.pageSize) {
    const nextPage = currentPage + 1;
    const totalCount = this.cache.get(`${documentId}-totalCount`);
    
    // Check if we already have the next page or if there are no more pages
    if (totalCount) {
      const totalPages = Math.ceil(totalCount / pageSize);
      if (nextPage >= totalPages) return;
      
      const pageCacheKey = `${documentId}-page-${nextPage}`;
      const cachedPage = this.cache.get(pageCacheKey);
      if (cachedPage) {
        return; // Already cached and fresh (LRUCache handles TTL)
      }
    }

    // Preload in background
    this.loadDocumentPage(documentId, nextPage, pageSize).catch(err => {
      console.warn('Failed to preload next page:', err);
    });
  }

  /**
   * Get all cached blocks for a document
   */
  getCachedBlocks(documentId) {
    const docCache = this.cache.get(documentId);
    if (!docCache) return null;

    const allBlocks = [];
    const sortedPages = Array.from(docCache.pages.keys()).sort((a, b) => a - b);
    
    for (const page of sortedPages) {
      const pageData = docCache.pages.get(page);
      if (pageData && Date.now() - pageData.timestamp < 5000) {
        allBlocks.push(...pageData.blocks);
      }
    }

    return {
      blocks: allBlocks,
      totalCount: docCache.totalCount,
      hasMore: allBlocks.length < docCache.totalCount
    };
  }

  /**
   * Clear cache for a document
   */
  clearCache(documentId) {
    // Clear all pages for this document
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(documentId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Cancel any active loads for this document
    for (const [key, controller] of this.activeLoads.entries()) {
      if (key.startsWith(documentId)) {
        controller.abort();
        this.activeLoads.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this.cache.clear();
    
    // Cancel all active loads
    for (const controller of this.activeLoads.values()) {
      controller.abort();
    }
    this.activeLoads.clear();
  }

  /**
   * Update a single block in cache (for edits)
   */
  updateBlockInCache(documentId, blockId, updates) {
    const docCache = this.cache.get(documentId);
    if (!docCache) return;

    // Find and update the block in all cached pages
    for (const [page, pageData] of docCache.pages) {
      const blockIndex = pageData.blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        pageData.blocks[blockIndex] = {
          ...pageData.blocks[blockIndex],
          ...updates
        };
        break;
      }
    }
  }

  /**
   * Update cached blocks directly (for optimistic updates)
   */
  updateCachedBlocks(documentId, newBlocks) {
    console.log('[PAGINATED-CACHE] updateCachedBlocks called:', {
      documentId: documentId?.substring(0, 8),
      blockCount: newBlocks?.length
    });

    // Update the first page cache with new blocks
    const pageCacheKey = `${documentId}-page-0`;
    const existingPage = this.cache.get(pageCacheKey);

    this.cache.set(pageCacheKey, {
      blocks: newBlocks,
      totalCount: newBlocks.length,
      timestamp: Date.now()
    });

    // Also update total count
    this.cache.set(`${documentId}-totalCount`, newBlocks.length);

    console.log('[PAGINATED-CACHE] Cache updated for document:', documentId?.substring(0, 8));
  }

  /**
   * Remove a block from cache (for deletions)
   */
  removeBlockFromCache(documentId, blockId) {
    // Find and remove the block from cached pages
    let page = 0;
    
    while (true) {
      const pageCacheKey = `${documentId}-page-${page}`;
      const cachedPage = this.cache.get(pageCacheKey);
      
      if (!cachedPage) {
        // No more cached pages
        break;
      }
      
      const blockIndex = cachedPage.blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        // Found the block, remove it
        cachedPage.blocks.splice(blockIndex, 1);
        cachedPage.totalCount = Math.max(0, (cachedPage.totalCount || 0) - 1);
        // Re-cache the updated page
        this.cache.set(pageCacheKey, cachedPage);
        
        // Update total count
        const totalCount = this.cache.get(`${documentId}-totalCount`);
        if (totalCount) {
          this.cache.set(`${documentId}-totalCount`, Math.max(0, totalCount - 1));
        }
        break;
      }
      
      page++;
    }
  }
}

// Export singleton instance
export const paginatedBlockLoader = new PaginatedBlockLoader();