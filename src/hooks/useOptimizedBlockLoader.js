import { useState, useEffect, useRef } from 'react';
import { optimizedBlockLoader, OptimizedBlockLoader } from '../utils/optimizedBlockLoader';
import { sessionCache } from '../utils/sessionCache';

/**
 * React hook for optimized block loading with skeleton management
 */
export function useOptimizedBlockLoader(documentId, entry) {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!documentId || loadingRef.current) return;

    const loadBlocks = async () => {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Check if blocks are already in entry
        if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
          // Use existing blocks, no loading needed
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

        // Start with intelligent skeletons
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
  }, [documentId, entry]);

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

  return {
    blocks,
    isLoading,
    error,
    updateBlocks,
    preloadNearbyDocuments
  };
}