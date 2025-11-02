import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { loadDocumentsPaginated } from '../utils/storage/storageWrapper';
import { getDocumentsWithRealActivity } from '../lib/supabase-optimizations';

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
      console.log('usePaginatedDashboard: Calling getDocumentsWithRealActivity with page 0');
      const documents = await getDocumentsWithRealActivity({
        userId: user.id,
        limit: pageSize,
        offset: 0
      });

      console.log('usePaginatedDashboard: Got real activity documents:', {
        documentCount: documents?.length,
        sampleActivity: documents[0]?.recent_activity
      });

      // Transform to match existing interface and add real activity data
      const transformed = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        folder_id: doc.folder_id,
        position: doc.doc_position,
        metadata: doc.metadata,
        tags: doc.tags,
        blockCount: doc.block_count,
        // NEW: Real activity data from audit logs
        lastEdited: doc.last_edited,
        editCount7d: doc.edit_count_7d,
        editCount30d: doc.edit_count_30d,
        recentActivity: doc.recent_activity || []
      }));

      // Get total count (separate query for accurate pagination)
      // This will be cached by Supabase for performance
      const allDocs = await getDocumentsWithRealActivity({
        userId: user.id,
        limit: 1000, // Get enough to know total count
        offset: 0
      });
      const totalCount = allDocs.length;

      // Deduplicate initial documents (safety check)
      const uniqueDocs = transformed.reduce((acc, doc) => {
        if (!acc.find(d => d.id === doc.id)) {
          acc.push(doc);
        }
        return acc;
      }, []);

      if (uniqueDocs.length !== transformed.length) {
        console.warn(`usePaginatedDashboard: Initial load had ${transformed.length - uniqueDocs.length} duplicates`);
      }

      setDocuments(uniqueDocs);
      setTotalCount(totalCount);
      const hasMoreDocs = (0 + 1) * pageSize < totalCount;
      setHasMore(hasMoreDocs);
      setCurrentPage(0);

      // Preload next page in background
      if (preloadNextPage && hasMoreDocs) {
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

      const documents = await getDocumentsWithRealActivity({
        userId: user.id,
        limit: pageSize,
        offset: nextPage * pageSize
      });

      // Transform to match existing interface
      const transformed = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        folder_id: doc.folder_id,
        position: doc.doc_position,
        metadata: doc.metadata,
        tags: doc.tags,
        blockCount: doc.block_count,
        // NEW: Real activity data from audit logs
        lastEdited: doc.last_edited,
        editCount7d: doc.edit_count_7d,
        editCount30d: doc.edit_count_30d,
        recentActivity: doc.recent_activity || []
      }));

      console.log(`usePaginatedDashboard: Loaded ${transformed.length} documents`);

      // Deduplicate documents by ID before appending (prevents race condition duplicates)
      setDocuments(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newDocs = transformed.filter(d => !existingIds.has(d.id));

        if (newDocs.length !== transformed.length) {
          console.warn(`usePaginatedDashboard: Filtered out ${transformed.length - newDocs.length} duplicate documents`);
        }

        return [...prev, ...newDocs];
      });

      const hasMoreDocs = (nextPage + 1) * pageSize < totalCount;
      setHasMore(hasMoreDocs);
      setCurrentPage(nextPage);

      // Preload next page in background
      if (preloadNextPage && hasMoreDocs) {
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
    if (preloadingRef.current || !user?.id) return;

    preloadingRef.current = true;

    // Fire and forget - don't await, don't update state
    getDocumentsWithRealActivity({
      userId: user.id,
      limit: pageSize,
      offset: page * pageSize
    }).then(() => {
      preloadingRef.current = false;
    }).catch(() => {
      preloadingRef.current = false;
    });
  }, [user?.id, pageSize]);

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
