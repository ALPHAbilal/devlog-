import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
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
        const loadStartTime = performance.now();
        
        // [CACHE-TRACK] Log loader start
        console.log(`[CACHE-TRACK] 🚀 useOptimizedBlockLoader: Starting load for document ${documentId.substring(0, 8)}`);
        
        // CRITICAL FIX: Do NOT use entry.blocks as a trusted source!
        // entry.blocks comes from IndexedDB cache and can be stale after SmartSync
        // has synced new blocks to Supabase. Always load from database to ensure
        // we have the freshest blocks.
        //
        // The only exception is during active editing when we pass blocks through
        // the entry prop intentionally - but that's handled by the sessionCache.
        //
        // OLD BROKEN LOGIC (was here before):
        // if (entry?.blocks && entry.blocks.length > 0) {
        //   setBlocks(entry.blocks); // STALE! Never loads from DB!
        //   return;
        // }
        //
        // NEW LOGIC: Skip entry.blocks entirely, let sessionCache or database handle it
        if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
          console.log(`[CACHE-TRACK] ⚠️ SKIP: entry.blocks has ${entry.blocks.length} blocks but we'll load from database to ensure freshness`);
          // Don't use entry.blocks - fall through to sessionCache/database loading
        }

        // Check session cache
        console.log(`[CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks(${documentId.substring(0, 8)})`);
        const cacheCheckStart = performance.now();
        const cachedBlocks = sessionCache.getBlocks(documentId);
        const cacheCheckTime = performance.now() - cacheCheckStart;
        
        if (cachedBlocks && cachedBlocks.length > 0) {
          // [CACHE-TRACK] Log cache hit
          const loadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ✅ CACHE HIT: Found ${cachedBlocks.length} blocks in sessionCache - Load time: ${loadTime.toFixed(2)}ms`);
          console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: sessionCache (cache hit)`);
          console.log(`[CACHE-TRACK] ⚡ PERFORMANCE: Cache lookup ${cacheCheckTime.toFixed(2)}ms, Total ${loadTime.toFixed(2)}ms`);
          
          // CRITICAL: Don't normalize positions - it breaks references!
          // The blocks array index IS the position
          setBlocks(cachedBlocks);
          setIsLoading(false);
          
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Loaded from cache in ${loadTime.toFixed(2)}ms`);
          return;
        }

        // [CACHE-TRACK] Log cache miss - loading from database
        console.log(`[CACHE-TRACK] ❌ CACHE MISS: No blocks in cache, loading from database...`);
        console.log(`[CACHE-TRACK] 📊 SOURCE TYPE: database (cache miss)`);

        // Only show skeletons when we're actually loading from database
        // This happens when entry.blocks is undefined (not loaded yet)
        const skeletons = OptimizedBlockLoader.generateSkeletons(null);
        setBlocks(skeletons);

        // Load actual blocks
        const dbLoadStart = performance.now();
        const result = await optimizedBlockLoader.loadDocument(documentId);
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
          console.log(`[CACHE-TRACK] 📦 RECEIVED: ${result.blocks.length} blocks from loader (fromCache: ${result.fromCache || false})`);
          
          // If blocks were loaded very quickly (< 200ms), skip animation
          const loadTime = result.fromCache ? 0 : 200;
          
          if (loadTime > 0) {
            // Show skeletons for minimum time to avoid flash
            await new Promise(resolve => setTimeout(resolve, loadTime));
          }

          if (!mountedRef.current) return;

          // Ensure all blocks have positions
          const blocksWithPositions = result.blocks.map((block, index) => ({
            ...block,
            position: block.position !== undefined ? block.position : index
          }));
          setBlocks(blocksWithPositions);
          
          // [CACHE-TRACK] Log caching
          console.log(`[CACHE-TRACK] 💾 CACHING: Storing ${blocksWithPositions.length} blocks in sessionCache`);
          sessionCache.cacheBlocks(documentId, blocksWithPositions);
          
          const totalLoadTime = performance.now() - loadStartTime;
          console.log(`[CACHE-TRACK] ⏱️ COMPLETE: Total load time: ${totalLoadTime.toFixed(2)}ms (DB: ${dbLoadTime.toFixed(2)}ms)`);
        } else {
          console.log(`[CACHE-TRACK] ⚠️ EMPTY: No blocks returned from loader`);
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
  }, [documentId, entry?.blocks, skip]);

  // Preload function for nearby documents
  const preloadNearbyDocuments = (documentIds) => {
    optimizedBlockLoader.preloadDocuments(documentIds);
  };

  // Function to update blocks (for edits)
  // OPTIMIZATION: Preserve block object references to prevent unnecessary re-renders
  const updateBlocks = useCallback((newBlocks) => {
    if (import.meta.env.DEV) {
      console.log('[UPDATE-BLOCKS-CALLED] updateBlocks invoked with', newBlocks.length, 'blocks');
    }
    
    setBlocks(prevBlocks => {
      if (import.meta.env.DEV) {
        console.log('[UPDATE-BLOCKS-SETTER] Inside setBlocks callback, prev:', prevBlocks?.length, 'new:', newBlocks.length);
      }
      
      // If previous blocks is empty, just return new blocks as-is
      if (!prevBlocks || prevBlocks.length === 0) {
        // Update caches
        sessionCache.updateBlocks(documentId, newBlocks);
        optimizedBlockLoader.clearCache(documentId);
        return newBlocks;
      }

      // CRITICAL FIX: Preserve references for unchanged blocks
      // Don't normalize positions - array index IS the position!
      
      let sameRefCount = 0;
      let contentSameCount = 0;
      let newBlockCount = 0;
      let changedCount = 0;
      
      const optimizedBlocks = newBlocks.map((newBlock, index) => {
        const prevBlock = prevBlocks.find(b => b.id === newBlock.id);

        // If block exists, check if we should reuse reference
        if (prevBlock) {
          // SUPER CRITICAL: If it's the exact same object reference, just return it!
          // This happens when we splice() the array in addBlock/moveBlock
          if (prevBlock === newBlock) {
            sameRefCount++;
            return prevBlock;  // ✅ SAME OBJECT - KEEP IT!
          }

          // Different object with same ID - check if content changed
          const contentSame = prevBlock.content === newBlock.content;
          const typeSame = prevBlock.type === newBlock.type;

          // If nothing changed, reuse exact reference
          if (contentSame && typeSame) {
            contentSameCount++;
            return prevBlock;  // ✅ PRESERVE REFERENCE
          }

          // Content or type changed, use new object
          changedCount++;
          return newBlock;
        }

        // New block, return as-is
        newBlockCount++;
        return newBlock;
      });
      
      if (import.meta.env.DEV) {
        console.log('[UPDATE-BLOCKS-DEBUG] Reference preservation analysis:', {
          total: newBlocks.length,
          sameRef: sameRefCount,
          contentSame: contentSameCount,
          changed: changedCount,
          new: newBlockCount,
          preserved: sameRefCount + contentSameCount
        });
      }

      // Update caches
      sessionCache.updateBlocks(documentId, optimizedBlocks);
      optimizedBlockLoader.clearCache(documentId);

      return optimizedBlocks;
    });
  }, [documentId]);

  // Function to update a single block
  const updateBlock = (blockId, updates) => {
    setBlocks(prevBlocks => {
      // Find the block to update
      const blockIndex = prevBlocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevBlocks; // Block not found, return same array

      const existingBlock = prevBlocks[blockIndex];

      // Check if updates would actually change anything
      // Use deep comparison for objects (data, metadata, etc.)
      let hasChanges = false;
      const changedKeys = [];

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
            changedKeys.push(key);
          }
        } else {
          // Shallow compare primitives
          if (existingValue !== newValue) {
            hasChanges = true;
            changedKeys.push(key);
          }
        }
      }

      if (changedKeys.length > 0) {
        console.log('[BLOCK-UPDATE-DEBUG] Changed keys:', changedKeys, 'for block:', blockId.substring(0, 8));
      }

      // If nothing changed, return the SAME array to prevent re-renders
      if (!hasChanges) {
        console.log('[BLOCK-UPDATE] No changes detected, preventing re-render');
        return prevBlocks;
      }

      console.log('[BLOCK-UPDATE] Changes detected, updating block:', blockId.substring(0, 8));

      // Create updated block
      const updatedBlock = { ...existingBlock, ...updates };

      // Check if the new block is actually different from the old one
      if (updatedBlock === existingBlock) {
        console.log('[BLOCK-UPDATE] Block reference unchanged after spread');
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

      return newBlocks;
    });
  };

  // Function to remove a block
  const removeBlock = (blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
  };

  // CRITICAL: Direct block setter that bypasses reference preservation logic
  // Use this when you've already preserved references externally
  const setBlocksDirectly = useCallback((newBlocks) => {
    console.log('[SET-BLOCKS-DIRECTLY] Bypassing reference preservation, setting blocks directly:', {
      blockCount: newBlocks.length
    });
    
    // CRITICAL: Store reference map BEFORE any operations
    const blockRefMap = new Map(newBlocks.map(b => [b.id, b]));
    
    // Update caches
    sessionCache.updateBlocks(documentId, newBlocks);
    optimizedBlockLoader.clearCache(documentId);
    
    // CRITICAL CHECK: Did cache operations mutate our blocks?
    const mutatedBlocks = newBlocks.filter(b => blockRefMap.get(b.id) !== b);
    if (mutatedBlocks.length > 0) {
      console.error('[SET-BLOCKS-DIRECTLY] ❌ Cache operations MUTATED block references!', {
        mutatedCount: mutatedBlocks.length,
        firstMutated: mutatedBlocks[0].id
      });
    } else {
      console.log('[SET-BLOCKS-DIRECTLY] ✅ Block references preserved through cache operations');
    }
    
    // Set blocks directly without any transformation
    setBlocks(newBlocks);
  }, [documentId]);

  return {
    blocks,
    isLoading,
    error,
    updateBlocks,
    updateBlock,
    removeBlock,
    setBlocksDirectly, // NEW: Direct setter
    preloadNearbyDocuments,
    // Provide empty implementations for pagination-specific features
    isLoadingMore: false,
    hasMore: false,
    loadMore: () => {},
    checkLoadMore: () => {},
    progress: null
  };
}