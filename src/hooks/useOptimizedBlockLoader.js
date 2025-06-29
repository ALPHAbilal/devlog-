import { useState, useEffect, useRef, startTransition } from 'react';
import { optimizedBlockLoader, OptimizedBlockLoader } from '../utils/optimizedBlockLoader';
import { sessionCache } from '../utils/sessionCache';

/**
 * React hook for optimized block loading with skeleton management
 */
export function useOptimizedBlockLoader(documentId, entry, options = {}) {
  const { skip = false } = options;
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastLoadedDocRef = useRef(null); // Track last loaded document

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Check if we're already loading this document
    if (!documentId || loadingRef.current || skip || lastLoadedDocRef.current === documentId) {
      // If skipped, set loading to false immediately
      if (skip && isLoading) {
        setIsLoading(false);
      }
      return;
    }

    // AbortController to handle double mounting in React Strict Mode
    const abortController = new AbortController();

    const loadBlocks = async () => {
      loadingRef.current = true;
      lastLoadedDocRef.current = documentId; // Mark as loading
      setIsLoading(true);
      setError(null);

      try {
        // Check if blocks are already in entry AND have content
        if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
          // If blocks array exists with content, they were already loaded
          setBlocks(entry.blocks);
          setIsLoading(false);
          sessionCache.cacheBlocks(documentId, entry.blocks);
          return;
        }

        // Check session cache
        const cachedBlocks = sessionCache.getBlocks(documentId);
        if (cachedBlocks && cachedBlocks.length > 0) {
          setBlocks(cachedBlocks);
          setIsLoading(false);
          return;
        }

        // Only show skeletons when we're actually loading from database
        // This happens when entry.blocks is undefined (not loaded yet)
        const skeletons = OptimizedBlockLoader.generateSkeletons(null);
        setBlocks(skeletons);

        // Load actual blocks
        const result = await optimizedBlockLoader.loadDocument(documentId);
        
        if (!mountedRef.current) return;

        if (result && result.blocks) {
          // If blocks were loaded very quickly (< 200ms), skip animation
          const loadTime = result.fromCache ? 0 : 200;
          
          if (loadTime > 0) {
            // Show skeletons for minimum time to avoid flash
            await new Promise(resolve => setTimeout(resolve, loadTime));
          }

          if (!mountedRef.current) return;

          setBlocks(result.blocks);
          sessionCache.cacheBlocks(documentId, result.blocks);
        } else {
          setBlocks([]);
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

    loadBlocks();

    // Cleanup function to abort fetch on unmount (handles React Strict Mode)
    return () => {
      abortController.abort();
      loadingRef.current = false;
    };
  }, [documentId, entry, skip, isLoading]);

  // Preload function for nearby documents
  const preloadNearbyDocuments = (documentIds) => {
    optimizedBlockLoader.preloadDocuments(documentIds);
  };

  // Function to update blocks (for edits)
  const updateBlocks = (newBlocks) => {
    setBlocks(newBlocks);
    sessionCache.updateBlocks(documentId, newBlocks);
    optimizedBlockLoader.clearCache(documentId);
  };

  // Function to update a single block
  const updateBlock = (blockId, updates) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    );
  };

  // Function to remove a block
  const removeBlock = (blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
  };

  return {
    blocks,
    isLoading,
    error,
    updateBlocks,
    updateBlock,
    removeBlock,
    preloadNearbyDocuments,
    // Provide empty implementations for pagination-specific features
    isLoadingMore: false,
    hasMore: false,
    loadMore: () => {},
    checkLoadMore: () => {},
    progress: null
  };
}