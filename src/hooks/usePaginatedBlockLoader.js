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
        // Check if blocks are already in entry with content
        if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
          setBlocks(entry.blocks);
          setTotalCount(entry.blocks.length);
          setHasMore(false);
          setIsLoading(false);
          sessionCache.cacheBlocks(documentId, entry.blocks);
          return;
        }

        // Check session cache for the first page
        const cachedData = paginatedBlockLoader.getCachedBlocks(documentId);
        if (cachedData && cachedData.blocks.length > 0) {
          setBlocks(cachedData.blocks);
          setTotalCount(cachedData.totalCount);
          setHasMore(cachedData.hasMore);
          setIsLoading(false);
          return;
        }

        // Load first page from database
        const result = await paginatedBlockLoader.loadDocumentFirstPage(documentId, pageSize);
        
        if (!mountedRef.current) return;

        if (result && result.blocks) {
          startTransition(() => {
            setBlocks(result.blocks);
            setTotalCount(result.totalCount);
            setHasMore(result.hasMore);
            setCurrentPage(0);
          });

          // Preload next page if enabled
          if (preloadNextPage && result.hasMore) {
            paginatedBlockLoader.preloadNextPage(documentId, 0, pageSize);
          }
        } else {
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
  }, [documentId, entry, pageSize, preloadNextPage, skip, isLoading]);

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
  const updateBlocks = useCallback((newBlocks) => {
    setBlocks(newBlocks);
    
    // Update cache - clear and let it rebuild on next load
    paginatedBlockLoader.clearCache(documentId);
    
    // Update session cache as well
    sessionCache.updateBlocks(documentId, newBlocks);
  }, [documentId]);

  // Function to update a single block
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
    
    // Update in paginated cache
    paginatedBlockLoader.updateBlockInCache(documentId, blockId, updates);
  }, [documentId]);

  // Function to remove a block
  const removeBlock = useCallback((blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
    setTotalCount(prev => Math.max(0, prev - 1));
    
    // Update in paginated cache
    paginatedBlockLoader.removeBlockFromCache(documentId, blockId);
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
    checkLoadMore,
    progress: {
      loaded: blocks.length,
      total: totalCount,
      percentage: totalCount > 0 ? (blocks.length / totalCount) * 100 : 0
    }
  };
}