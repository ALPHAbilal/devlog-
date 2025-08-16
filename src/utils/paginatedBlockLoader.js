import { supabase } from '../lib/supabase';
import { optimizedBlockLoader } from './optimizedBlockLoader';

/**
 * Paginated block loader for handling large documents efficiently
 */
export class PaginatedBlockLoader {
  constructor() {
    this.pageSize = 50; // Default page size
    this.cache = new Map(); // documentId -> { pages: Map, totalCount: number }
    this.activeLoads = new Map();
    this.pendingRequests = new Map(); // Track pending requests to deduplicate
    this.cacheValidityMs = 5 * 60 * 1000; // 5 minutes cache validity (was 5 seconds)
  }

  /**
   * Load the first page of blocks for a document
   */
  async loadDocumentFirstPage(documentId, pageSize = this.pageSize) {
    // Check if we have cached data
    const cached = this.cache.get(documentId);
    if (cached && cached.pages.has(0)) {
      const cachedPage = cached.pages.get(0);
      if (Date.now() - cachedPage.timestamp < this.cacheValidityMs) {
        return {
          blocks: cachedPage.blocks,
          totalCount: cached.totalCount,
          hasMore: cached.totalCount > pageSize,
          fromCache: true
        };
      }
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

        // First, get the total count
        const { count: totalCount, error: countError } = await supabase
          .from('blocks')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', documentId);

        if (countError) throw countError;
        if (controller.signal.aborted) return null;

      // Then fetch the page of blocks
      console.log(`PaginatedBlockLoader: Loading page ${page} (offset: ${offset}, limit: ${pageSize}) for document ${documentId}`);
      
      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position')
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      if (controller.signal.aborted) return null;

      console.log(`PaginatedBlockLoader: Loaded ${blocks?.length || 0} blocks for page ${page} of document ${documentId}`);

      // Transform blocks
      const transformedBlocks = blocks.map(block => 
        optimizedBlockLoader.transformBlockFromDB(block)
      );

      // Update cache
      if (!this.cache.has(documentId)) {
        this.cache.set(documentId, {
          pages: new Map(),
          totalCount: totalCount || 0
        });
      }

      const docCache = this.cache.get(documentId);
      docCache.pages.set(page, {
        blocks: transformedBlocks,
        timestamp: Date.now()
      });
      docCache.totalCount = totalCount || 0;

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
    const docCache = this.cache.get(documentId);
    const allBlocks = [];
    
    // Load all pages up to target page
    for (let page = 0; page <= targetPage; page++) {
      // Check cache first
      if (docCache && docCache.pages.has(page)) {
        const cachedPage = docCache.pages.get(page);
        if (Date.now() - cachedPage.timestamp < this.cacheValidityMs) {
          allBlocks.push(...cachedPage.blocks);
          continue;
        }
      }

      // Load page if not cached
      const result = await this.loadDocumentPage(documentId, page, pageSize);
      if (result && result.blocks) {
        allBlocks.push(...result.blocks);
      }
    }

    return {
      blocks: allBlocks,
      totalCount: docCache?.totalCount || allBlocks.length,
      hasMore: allBlocks.length < (docCache?.totalCount || 0)
    };
  }

  /**
   * Preload the next page for smooth scrolling
   */
  async preloadNextPage(documentId, currentPage, pageSize = this.pageSize) {
    const nextPage = currentPage + 1;
    const docCache = this.cache.get(documentId);
    
    // Check if we already have the next page or if there are no more pages
    if (docCache) {
      const totalPages = Math.ceil(docCache.totalCount / pageSize);
      if (nextPage >= totalPages) return;
      
      if (docCache.pages.has(nextPage)) {
        const cachedPage = docCache.pages.get(nextPage);
        if (Date.now() - cachedPage.timestamp < this.cacheValidityMs) {
          return; // Already cached and fresh
        }
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
    this.cache.delete(documentId);
    
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
   * Remove a block from cache (for deletions)
   */
  removeBlockFromCache(documentId, blockId) {
    const docCache = this.cache.get(documentId);
    if (!docCache) return;

    // Find and remove the block from cached pages
    for (const [page, pageData] of docCache.pages) {
      const blockIndex = pageData.blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        pageData.blocks.splice(blockIndex, 1);
        docCache.totalCount--;
        break;
      }
    }
  }
}

// Export singleton instance
export const paginatedBlockLoader = new PaginatedBlockLoader();