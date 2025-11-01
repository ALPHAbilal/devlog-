import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { loadDocumentsPaginated } from '../utils/storage/storageWrapper';

/**
 * Hook for paginated dashboard document loading with infinite scroll
 * Modeled after usePaginatedBlockLoader.js pattern
 * Updated: 2025-10-26
 *
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Documents per page (default: 50)
 * @param {string} options.orderBy - Sort column (default: 'updated_at')
 * @param {boolean} options.ascending - Sort direction (default: false)
 * @param {boolean} options.enableInfiniteScroll - Auto-load on scroll (default: true)
 * @param {boolean} options.preloadNextPage - Background preload (default: true)
 * @returns {Object} Pagination state and controls
 */
export function usePaginatedDashboard(options = {}) {
  const {
    pageSize = 50,
    orderBy = 'updated_at',
    ascending = false,
    enableInfiniteScroll = true,
    preloadNextPage = true
  } = options;

  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Prevent duplicate loads
  const loadingRef = useRef(false);
  const preloadingRef = useRef(false);

  /**
   * Load initial page of documents
   */
  const loadInitial = useCallback(async () => {
    console.log('usePaginatedDashboard: loadInitial() CALLED', {
      userId: user?.id,
      loadingRef: loadingRef.current,
      pageSize,
      orderBy
    });

    if (!user?.id || loadingRef.current) {
      console.log('usePaginatedDashboard: loadInitial() BLOCKED - no user or already loading');
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('usePaginatedDashboard: Calling loadDocumentsPaginated with page 0');
      const result = await loadDocumentsPaginated({
        page: 0,
        limit: pageSize,
        orderBy,
        ascending
      });

      console.log('usePaginatedDashboard: Got result:', {
        documentCount: result.documents?.length,
        totalCount: result.totalCount,
        hasMore: result.hasMore
      });

      setDocuments(result.documents);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setCurrentPage(0);

      // Preload next page in background
      if (preloadNextPage && result.hasMore) {
        preloadNextPageInBackground(1);
      }
    } catch (err) {
      console.error('usePaginatedDashboard: Error loading initial documents:', err);
      setError(err);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id, pageSize, orderBy, ascending, preloadNextPage]);

  /**
   * Load next page of documents (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    console.log('usePaginatedDashboard: loadMore() called', {
      userId: user?.id,
      loadingRef: loadingRef.current,
      hasMore,
      isLoadingMore,
      currentPage
    });

    if (!user?.id || loadingRef.current || !hasMore || isLoadingMore) {
      console.log('usePaginatedDashboard: loadMore() blocked by conditions');
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      console.log(`usePaginatedDashboard: Loading page ${nextPage}`);

      const result = await loadDocumentsPaginated({
        page: nextPage,
        limit: pageSize,
        orderBy,
        ascending
      });

      console.log(`usePaginatedDashboard: Loaded ${result.documents.length} documents, hasMore: ${result.hasMore}`);

      setDocuments(prev => [...prev, ...result.documents]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);

      // Preload next page in background
      if (preloadNextPage && result.hasMore) {
        preloadNextPageInBackground(nextPage + 1);
      }
    } catch (err) {
      console.error('usePaginatedDashboard: Error loading more documents:', err);
      setError(err);
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [user?.id, currentPage, hasMore, isLoadingMore, pageSize, orderBy, ascending, preloadNextPage]);

  /**
   * Preload next page in background (non-blocking)
   */
  const preloadNextPageInBackground = useCallback((page) => {
    if (preloadingRef.current) return;

    preloadingRef.current = true;

    // Fire and forget - don't await, don't update state
    loadDocumentsPaginated({
      page,
      limit: pageSize,
      orderBy,
      ascending
    }).then(() => {
      preloadingRef.current = false;
    }).catch(() => {
      preloadingRef.current = false;
    });
  }, [pageSize, orderBy, ascending]);

  /**
   * Check if should load more based on scroll position
   * Auto-triggered when infinite scroll enabled
   */
  const checkLoadMore = useCallback((scrollElement) => {
    if (!scrollElement) {
      console.log('usePaginatedDashboard: No scroll element');
      return;
    }

    if (!hasMore) {
      console.log('usePaginatedDashboard: No more documents to load');
      return;
    }

    if (isLoadingMore) {
      console.log('usePaginatedDashboard: Already loading more');
      return;
    }

    if (!enableInfiniteScroll) {
      console.log('usePaginatedDashboard: Infinite scroll disabled');
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollPosition = scrollTop + clientHeight;
    const threshold = scrollHeight - 200; // Load 200px before bottom

    console.log('usePaginatedDashboard: Scroll check:', {
      scrollTop,
      scrollHeight,
      clientHeight,
      scrollPosition,
      threshold,
      shouldLoad: scrollPosition >= threshold
    });

    if (scrollPosition >= threshold) {
      console.log('usePaginatedDashboard: Triggering loadMore()');
      loadMore();
    }
  }, [hasMore, isLoadingMore, enableInfiniteScroll, loadMore]);

  /**
   * Reset pagination (used when filters change)
   */
  const reset = useCallback(() => {
    setDocuments([]);
    setCurrentPage(0);
    setTotalCount(0);
    setHasMore(true);
    setError(null);
    loadInitial();
  }, [loadInitial]);

  // Progress tracking
  const progress = {
    loaded: documents.length,
    total: totalCount,
    percentage: totalCount > 0 ? (documents.length / totalCount) * 100 : 0
  };

  // Add loading skeletons when loading more
  const documentsWithSkeletons = isLoadingMore
    ? [...documents, ...Array(10).fill({ id: 'skeleton', type: 'skeleton' })]
    : documents;

  return {
    documents,
    documentsWithSkeletons,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    loadInitial,
    checkLoadMore,
    reset,
    progress,
    error,
    currentPage,
    totalCount
  };
}
