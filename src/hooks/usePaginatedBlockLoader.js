import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { paginatedBlockLoader } from '../utils/paginatedBlockLoader';
import { sessionCache } from '../utils/sessionCache';

/**
 * React hook for paginated block loading with infinite scroll support
 */
export function usePaginatedBlockLoader(documentId, entry, options = {}) {
  const {
    pageSize = 50,
    preloadNextPage = true,
    enableInfiniteScroll = true,
    skip = false
  } = options;

  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(!skip);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastLoadedDocRef = useRef(null); // Track last loaded document

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load initial blocks
  useEffect(() => {
    // Check if we're already loading this document
    if (!documentId || loadingRef.current || skip || lastLoadedDocRef.current === documentId) {
      // If skipped, set loading to false immediately
      if (skip && isLoading) {
        setIsLoading(false);
      }
      return;
    }

    const loadInitialBlocks = async () => {
      loadingRef.current = true;
      lastLoadedDocRef.current = documentId; // Mark as loading
      setIsLoading(true);
      setError(null);

      try {
        const loadStartTime = performance.now();
        
        // [CACHE-TRACK] Log loader start
        console.log(`[CACHE-TRACK] 🚀 usePaginatedBlockLoader: Starting load for document ${documentId.substring(0, 8)}`);
        
        // Check if blocks are already in entry with content
        if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
          // [CACHE-TRACK] Log entry blocks found
          console.log(`[CACHE-TRACK] ✅ SOURCE: entry.blocks - Found ${entry.blocks.length} blocks in entry prop (no cache check needed)`);
          
          // CRITICAL FIX: Deserialize blocks from entry.blocks
          // entry.blocks contains raw database format (with content JSON string)
          // We need to deserialize them to restore block-specific fields like images
          const { deserializeBlock } = await import('../utils/blockSerializer');
          const deserializedBlocks = entry.blocks.map(block => {
            // Check if block is already deserialized (has images field for image blocks)
            if (block.type === 'image' && block.images !== undefined) {
              // Already deserialized, use as-is
              return block;
            }
            // Deserialize the block to restore block-specific fields
            return deserializeBlock(block);
          });
          
          setBlocks(deserializedBlocks);
          setTotalCount(deserializedBlocks.length);
          setHasMore(false);
          setIsLoading(false);
          sessionCache.cacheBlocks(documentId, deserializedBlocks);
          
          const loadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Loaded from entry in ${loadTime.toFixed(2)}ms`);
          console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: entry.blocks (bypasses cache check)`);
          
          // Track entry.blocks usage
          if (sessionCache.statsTracker) {
            sessionCache.statsTracker.recordEntryBlocks(loadTime);
          }
          return;
        }

        // Check paginatedBlockLoader cache first
        console.log(`[CACHE-TRACK] 🔍 CHECKING: paginatedBlockLoader.getCachedBlocks(${documentId.substring(0, 8)})`);
        const paginatedCacheStart = performance.now();
        const cachedData = paginatedBlockLoader.getCachedBlocks(documentId);
        const paginatedCacheTime = performance.now() - paginatedCacheStart;
        
        if (cachedData && cachedData.blocks.length > 0) {
          // [CACHE-TRACK] Log cache hit from paginated loader
          const loadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ✅ CACHE HIT (paginated): Found ${cachedData.blocks.length} blocks in paginatedBlockLoader cache - Load time: ${loadTime.toFixed(2)}ms`);
          console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: paginatedBlockLoader cache (cache hit)`);
          console.log(`[CACHE-TRACK] ⚡ PERFORMANCE: Paginated cache lookup ${paginatedCacheTime.toFixed(2)}ms, Total ${loadTime.toFixed(2)}ms`);
          
          setBlocks(cachedData.blocks);
          setTotalCount(cachedData.totalCount);
          setHasMore(cachedData.hasMore);
          setIsLoading(false);
          
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Loaded from paginated cache in ${loadTime.toFixed(2)}ms`);
          return;
        }

        // Check sessionCache as fallback
        console.log(`[CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks(${documentId.substring(0, 8)}) as fallback`);
        const sessionCacheStart = performance.now();
        const sessionCachedBlocks = sessionCache.getBlocks(documentId);
        const sessionCacheTime = performance.now() - sessionCacheStart;
        
        if (sessionCachedBlocks && sessionCachedBlocks.length > 0) {
          // [CACHE-TRACK] Log cache hit from sessionCache
          const loadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ✅ CACHE HIT (sessionCache): Found ${sessionCachedBlocks.length} blocks in sessionCache - Load time: ${loadTime.toFixed(2)}ms`);
          console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: sessionCache (cache hit)`);
          console.log(`[CACHE-TRACK] ⚡ PERFORMANCE: SessionCache lookup ${sessionCacheTime.toFixed(2)}ms, Total ${loadTime.toFixed(2)}ms`);
          
          setBlocks(sessionCachedBlocks);
          setTotalCount(sessionCachedBlocks.length);
          setHasMore(false); // Assume all blocks loaded if from sessionCache
          setIsLoading(false);
          
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Loaded from sessionCache in ${loadTime.toFixed(2)}ms`);
          return;
        }

        // [CACHE-TRACK] Log cache miss - loading from database
        console.log(`[CACHE-TRACK] ❌ CACHE MISS: No blocks in any cache, loading from database...`);
        console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: database (cache miss)`);

        // Load first page from database
        const dbLoadStart = performance.now();
        const result = await paginatedBlockLoader.loadDocumentFirstPage(documentId, pageSize);
        const dbLoadTime = performance.now() - dbLoadStart;
        
        console.log(`[CACHE-TRACK] 📊 DATABASE: Loaded from DB in ${dbLoadTime.toFixed(2)}ms (fromCache: ${result?.fromCache || false})`);
        console.log(`[CACHE-TRACK] ⚡ PERFORMANCE: Database load ${dbLoadTime.toFixed(2)}ms`);
        
        // Track database load
        if (sessionCache.statsTracker && !result?.fromCache) {
          sessionCache.statsTracker.recordDatabaseLoad(dbLoadTime);
        }
        
        if (!mountedRef.current) return;

        if (result && result.blocks) {
          // [CACHE-TRACK] Log blocks received
          console.log(`[CACHE-TRACK] 📦 RECEIVED: ${result.blocks.length} blocks from loader (totalCount: ${result.totalCount}, hasMore: ${result.hasMore}, fromCache: ${result.fromCache || false})`);
          
          startTransition(() => {
            setBlocks(result.blocks);
            setTotalCount(result.totalCount);
            setHasMore(result.hasMore);
            setCurrentPage(0);
          });

          // [CACHE-TRACK] Log caching
          console.log(`[CACHE-TRACK] 💾 CACHING: Storing ${result.blocks.length} blocks in sessionCache`);
          sessionCache.cacheBlocks(documentId, result.blocks);

          // Preload next page if enabled
          if (preloadNextPage && result.hasMore) {
            console.log(`[CACHE-TRACK] 🔮 PRELOAD: Preloading next page...`);
            paginatedBlockLoader.preloadNextPage(documentId, 0, pageSize);
          }
          
          const totalLoadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Total load time: ${totalLoadTime.toFixed(2)}ms (DB: ${dbLoadTime.toFixed(2)}ms)`);
        } else {
          console.log(`[CACHE-TRACK] ⚠️ EMPTY: No blocks returned from loader`);
          startTransition(() => {
            setBlocks([]);
            setTotalCount(0);
            setHasMore(false);
          });
        }
      } catch (err) {
        console.error('Error loading blocks:', err);
        if (mountedRef.current) {
          setError(err);
          setBlocks([]);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
          loadingRef.current = false;
        }
      }
    };

    loadInitialBlocks();
  }, [documentId, entry?.blocks, pageSize, preloadNextPage, skip]);

  // Load more blocks
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !documentId) return;

    setIsLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const result = await paginatedBlockLoader.loadDocumentPage(documentId, nextPage, pageSize);
      
      if (!mountedRef.current) return;

      if (result && result.blocks) {
        setBlocks(prev => [...prev, ...result.blocks]);
        setCurrentPage(nextPage);
        setHasMore(result.hasMore);

        // Preload next page if enabled
        if (preloadNextPage && result.hasMore) {
          paginatedBlockLoader.preloadNextPage(documentId, nextPage, pageSize);
        }
      }
    } catch (err) {
      console.error('Error loading more blocks:', err);
      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [documentId, currentPage, hasMore, isLoadingMore, pageSize, preloadNextPage]);

  // Function to update blocks (for edits)
  // OPTIMIZATION: Preserve block object references to prevent unnecessary re-renders
  const updateBlocks = useCallback((newBlocks) => {
    setBlocks(prevBlocks => {
      // If previous blocks is empty, just use new blocks
      if (!prevBlocks || prevBlocks.length === 0) {
        // Update caches
        paginatedBlockLoader.clearCache(documentId);
        sessionCache.updateBlocks(documentId, newBlocks);
        return newBlocks;
      }

      // Preserve references for unchanged blocks
      const updatedBlocks = newBlocks.map((newBlock, index) => {
        const prevBlock = prevBlocks.find(b => b.id === newBlock.id);

        // If block exists, check if content changed
        if (prevBlock) {
          const contentSame = prevBlock.content === newBlock.content;
          const typeSame = prevBlock.type === newBlock.type;
          const positionSame = prevBlock.position === newBlock.position;

          // If nothing changed, reuse exact reference
          if (contentSame && typeSame && positionSame) {
            return prevBlock;
          }

          // Something changed, use new object
          return newBlock;
        }

        // New block, use new object
        return newBlock;
      });

      // Update caches
      paginatedBlockLoader.clearCache(documentId);
      sessionCache.updateBlocks(documentId, updatedBlocks);

      return updatedBlocks;
    });
  }, [documentId]);

  // Function to update a single block
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prevBlocks => {
      // Find the block to update
      const blockIndex = prevBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevBlocks; // Block not found, return same array

      const existingBlock = prevBlocks[blockIndex];

      // Check if updates would actually change anything
      // Use deep comparison for objects (data, metadata, etc.)
      let hasChanges = false;

      for (const key in updates) {
        const existingValue = existingBlock[key];
        const newValue = updates[key];

        // Deep compare objects
        if (typeof newValue === 'object' && newValue !== null &&
            typeof existingValue === 'object' && existingValue !== null) {
          const existingJSON = JSON.stringify(existingValue);
          const newJSON = JSON.stringify(newValue);
          if (existingJSON !== newJSON) {
            hasChanges = true;
            console.log('[BLOCK-UPDATE-PAGINATED-DEBUG] Object changed:', key, 'for block:', blockId.substring(0, 8));
            break;
          }
        } else {
          // Shallow compare primitives
          if (existingValue !== newValue) {
            hasChanges = true;
            console.log('[BLOCK-UPDATE-PAGINATED-DEBUG] Value changed:', key, 'for block:', blockId.substring(0, 8));
            break;
          }
        }
      }

      // If nothing changed, return the SAME array to prevent re-renders
      if (!hasChanges) {
        console.log('[BLOCK-UPDATE-PAGINATED] No changes detected, preventing re-render');
        return prevBlocks;
      }

      console.log('[BLOCK-UPDATE-PAGINATED] Changes detected, updating block:', blockId.substring(0, 8));

      // Create updated block
      const updatedBlock = { ...existingBlock, ...updates };

      // Check if the new block is actually different from the old one
      if (updatedBlock === existingBlock) {
        console.log('[BLOCK-UPDATE-PAGINATED] Block reference unchanged after spread');
        return prevBlocks;
      }

      // CRITICAL FIX: Use .map() with reference preservation
      // This ensures unchanged blocks keep EXACT same reference
      const newBlocks = prevBlocks.map((block, i) =>
        i === blockIndex ? updatedBlock : block
      );

      // Verify reference stability for unchanged blocks
      const unchangedCount = newBlocks.filter((block, i) => block === prevBlocks[i]).length;
      console.log(`[BLOCK-REF-STABILITY] ${unchangedCount}/${newBlocks.length} blocks kept same reference`);

      // Update in paginated cache
      paginatedBlockLoader.updateBlockInCache(documentId, blockId, updates);

      return newBlocks;
    });
  }, [documentId]);

  // Function to remove a block
  const removeBlock = useCallback((blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
    setTotalCount(prev => Math.max(0, prev - 1));
    
    // Update in paginated cache
    paginatedBlockLoader.removeBlockFromCache(documentId, blockId);
  }, [documentId]);

  // CRITICAL: Direct block setter that bypasses reference preservation logic
  // Use this when you've already preserved references externally
  const setBlocksDirectly = useCallback((newBlocks) => {
    console.log('[SET-BLOCKS-DIRECTLY] Bypassing reference preservation, setting blocks directly:', {
      blockCount: newBlocks.length
    });
    
    // Update in paginated cache
    paginatedBlockLoader.updateCachedBlocks(documentId, newBlocks);
    
    // Set blocks directly without any transformation
    setBlocks(newBlocks);
  }, [documentId]);

  // Function to check if we need to load more (for infinite scroll)
  const checkLoadMore = useCallback((scrollElement) => {
    if (!enableInfiniteScroll || !hasMore || isLoadingMore) return;

    const scrollTop = scrollElement.scrollTop;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    
    // Load more when user is 200px from the bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      loadMore();
    }
  }, [enableInfiniteScroll, hasMore, isLoadingMore, loadMore]);

  // Generate loading skeletons for "load more" state
  const loadingSkeletons = isLoadingMore ? Array(10).fill(null).map((_, i) => ({
    id: `skeleton-more-${i}`,
    type: 'text',
    isLoading: true,
    estimatedHeight: 80
  })) : [];

  return {
    blocks: [...blocks, ...loadingSkeletons],
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    currentPage,
    loadMore,
    updateBlocks,
    updateBlock,
    removeBlock,
    setBlocksDirectly, // NEW: Direct setter
    checkLoadMore,
    progress: {
      loaded: blocks.length,
      total: totalCount,
      percentage: totalCount > 0 ? (blocks.length / totalCount) * 100 : 0
    }
  };
}