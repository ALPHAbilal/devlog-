# Universal Caching Module Implementation Plan

## Overview

Implement a universal, agnostic caching system that eliminates skeleton loading flashes when navigating between pages. The module will work seamlessly with pagination and virtualization, providing instant data restoration while maintaining fresh data through intelligent background refresh and cross-tab invalidation.

## Current State Analysis

Based on comprehensive codebase research:

### What Exists Now:
- **Pagination**: `usePaginatedDashboard` hook loads 50 documents/page with infinite scroll
- **Virtualization**: `react-window` for document blocks, custom manual virtualization for dashboard grid
- **Folder Caching**: Module-level cache with 30-second TTL in `useFolders.js:7-9`
- **Multi-layer Storage**: Memory (LRUCache) → IndexedDB → Supabase with write-behind pattern
- **Event Bus**: Fully defined but underutilized for cache invalidation
- **Realtime Subscriptions**: Supabase realtime works but doesn't trigger cache invalidation

### What's Missing:
- **No document list caching** between route navigations
- **No cross-tab cache invalidation** - tabs show stale data
- **Event bus not connected to UI refresh** - events emitted but not consumed
- **No unified caching interface** - each hook implements its own caching logic

### Key Discoveries:
- Dashboard uses `DocumentGridRedesigned` with NO virtualization (renders all 50 docs)
- `VirtualizedGrid.jsx` exists but unused in dashboard
- Document editor uses `react-window`'s `VariableSizeList` for blocks
- Pagination triggers at 200px before bottom
- Current skeleton condition: `isLoadingDocuments && paginatedDocuments.length === 0`
- Smart Sync batches changes but only clears block cache, not document list cache

## Desired End State

After this implementation:

1. **Zero skeleton flashes** when navigating back to previously visited pages
2. **Instant data restoration** from cache (<5ms) with background refresh
3. **Cross-tab synchronization** using event bus and BroadcastChannel
4. **Universal caching interface** that any component can use
5. **Agnostic design** - easy to add new features without modifying core cache logic
6. **Seamless pagination support** - cache individual pages or full datasets
7. **Virtualization compatible** - works with react-window and custom implementations

### Verification:
- Navigate Dashboard → Document → Dashboard: **No skeleton, instant load**
- Create document in Tab A → Tab B updates automatically
- Edit blocks in DocumentPage → Return to page: **Instant load, no refetch**
- Scroll to page 3 in dashboard → Navigate away → Return: **All 3 pages cached, instant**

## What We're NOT Doing

To prevent scope creep:
- ❌ Not replacing existing `MultiLayerStorage` architecture
- ❌ Not modifying IndexedDB or Supabase adapters
- ❌ Not changing virtualization implementations (react-window stays)
- ❌ Not adding new database migrations or RPC functions
- ❌ Not implementing service workers or advanced offline sync
- ❌ Not changing how Smart Sync batches block updates
- ❌ Not modifying folder tree structure or hierarchy logic

## Implementation Approach

### Strategy:
**Build a thin caching layer** on top of existing storage that:
1. Sits between React hooks and data fetching functions
2. Uses existing LRUCache for memory storage
3. Leverages existing event bus for invalidation signals
4. Provides both simple (`useCachedData`) and paginated (`useCachedPaginatedData`) interfaces
5. Designed as a **pure utility** - no business logic, just caching primitives

### Architecture:
```
React Component
    ↓
useCachedData / useCachedPaginatedData (new hooks)
    ↓
CacheManager (new singleton)
    ↓
Existing fetchFn (getDocumentsWithRealActivity, etc.)
    ↓
Existing Storage Layer (MultiLayerStorage → Supabase)
```

### Key Design Principles:
1. **Agnostic**: Cache doesn't know about documents, folders, or blocks
2. **Pluggable**: Any fetch function can be cached
3. **Composable**: Hooks can be combined or extended
4. **Observable**: Emits events for other components to react to
5. **Fail-safe**: Always works even if cache fails

---

## Phase 1: Core CacheManager Implementation

### Overview
Create the foundational `CacheManager` class with namespace support, TTL management, pattern-based invalidation, and performance metrics. This will be the agnostic core that any feature can use.

### Changes Required:

#### 1. Create CacheManager Class
**File**: `src/utils/cache/CacheManager.js` (new file)
**Changes**: Implement core caching engine with agnostic design

```javascript
/**
 * Universal CacheManager - Agnostic caching utility
 *
 * Design principles:
 * - Namespace-based keys prevent collisions
 * - Pattern-based invalidation for related data
 * - TTL (Time To Live) for automatic expiration
 * - Performance metrics for debugging
 * - Event emission for reactive updates
 */

import { eventBus, EVENT_TYPES } from '../eventBus';

class CacheManager {
  constructor(options = {}) {
    // Configuration
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 30000; // 30 seconds

    // Storage
    this.cache = new Map(); // key → { data, timestamp, ttl }
    this.metadata = new Map(); // key → { hits, misses, lastAccess }

    // Locking (prevents duplicate fetches)
    this.pendingFetches = new Map(); // key → Promise

    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      invalidations: 0
    };
  }

  /**
   * Generate namespaced key
   * Example: getKey('documents', user.id) → 'documents:abc123'
   */
  getKey(namespace, ...parts) {
    return [namespace, ...parts].filter(Boolean).join(':');
  }

  /**
   * Get value from cache with TTL check
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this._updateMetadata(key, 'miss');
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.metadata.delete(key);
      this.metrics.misses++;
      this.metrics.evictions++;
      return null;
    }

    // Cache hit
    this.metrics.hits++;
    this._updateMetadata(key, 'hit');

    return entry.data;
  }

  /**
   * Set value in cache with optional TTL override
   */
  set(key, data, ttl = this.defaultTTL) {
    // Auto-evict if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.metrics.sets++;
    this._updateMetadata(key, 'set');

    // Emit cache update event
    eventBus.emit(EVENT_TYPES.CACHE_UPDATED, { key, size: this.cache.size });
  }

  /**
   * Check if cache entry exists and is fresh
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  /**
   * Check if cache entry is fresh (within TTL)
   */
  isFresh(key, customTTL = null) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const ttl = customTTL || entry.ttl;
    const age = Date.now() - entry.timestamp;
    return age < ttl;
  }

  /**
   * Invalidate single cache entry
   */
  invalidate(key) {
    const deleted = this.cache.delete(key);
    this.metadata.delete(key);

    if (deleted) {
      this.metrics.invalidations++;
      eventBus.emit(EVENT_TYPES.CACHE_INVALIDATED, { key });
    }

    return deleted;
  }

  /**
   * Invalidate by pattern (regex or string match)
   * Example: invalidatePattern('documents:') → clears all document caches
   */
  invalidatePattern(pattern) {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : pattern;

    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.metadata.delete(key);
    });

    if (keysToDelete.length > 0) {
      this.metrics.invalidations += keysToDelete.length;
      eventBus.emit(EVENT_TYPES.CACHE_INVALIDATED, {
        pattern: pattern.toString(),
        count: keysToDelete.length
      });
    }

    return keysToDelete.length;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.metadata.clear();
    this.pendingFetches.clear();

    this.metrics.invalidations += size;
    eventBus.emit(EVENT_TYPES.CACHE_CLEARED, { count: size });

    return size;
  }

  /**
   * Evict least recently used entry
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestAccess = Infinity;

    for (const [key, meta] of this.metadata.entries()) {
      if (meta.lastAccess < oldestAccess) {
        oldestAccess = meta.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.invalidate(oldestKey);
      this.metrics.evictions++;
    }
  }

  /**
   * Update metadata for cache key
   */
  _updateMetadata(key, action) {
    const meta = this.metadata.get(key) || { hits: 0, misses: 0, sets: 0, lastAccess: 0 };

    if (action === 'hit') meta.hits++;
    if (action === 'miss') meta.misses++;
    if (action === 'set') meta.sets++;
    meta.lastAccess = Date.now();

    this.metadata.set(key, meta);
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const hitRate = this.metrics.hits + this.metrics.misses > 0
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses) * 100).toFixed(2)
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      ...this.metrics
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get metadata for specific key (for debugging)
   */
  getMetadata(key) {
    return this.metadata.get(key) || null;
  }

  /**
   * Prevent duplicate fetches for same key
   * Returns existing promise if fetch is in progress
   */
  async dedupeFetch(key, fetchFn) {
    // Check if already fetching
    if (this.pendingFetches.has(key)) {
      return this.pendingFetches.get(key);
    }

    // Start new fetch
    const promise = fetchFn()
      .then(data => {
        this.pendingFetches.delete(key);
        return data;
      })
      .catch(error => {
        this.pendingFetches.delete(key);
        throw error;
      });

    this.pendingFetches.set(key, promise);
    return promise;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager({
  maxSize: 100,
  defaultTTL: 30000 // 30 seconds
});

// Export class for testing
export { CacheManager };
```

#### 2. Add Cache Event Types to Event Bus
**File**: `src/utils/eventBus.js`
**Changes**: Add cache-related event types

```javascript
// Add to EVENT_TYPES object (around line 127)
export const EVENT_TYPES = {
  // ... existing types ...

  // Cache events (NEW)
  CACHE_UPDATED: 'cache:updated',
  CACHE_INVALIDATED: 'cache:invalidated',
  CACHE_CLEARED: 'cache:cleared',
  CACHE_HIT: 'cache:hit',
  CACHE_MISS: 'cache:miss',
};
```

#### 3. Create Cache Invalidation Helper
**File**: `src/utils/cache/cacheInvalidation.js` (new file)
**Changes**: Provide convenient invalidation methods for common patterns

```javascript
/**
 * Cache Invalidation Utilities
 *
 * Provides semantic helpers for invalidating related caches.
 * Makes it easy to invalidate without knowing exact cache keys.
 */

import { cacheManager } from './CacheManager';
import { eventBus, EVENT_TYPES } from '../eventBus';

/**
 * Invalidate all document-related caches
 */
export const invalidateDocuments = (userId = null) => {
  const pattern = userId ? `documents:${userId}` : 'documents:';
  const count = cacheManager.invalidatePattern(pattern);
  console.log(`[Invalidation] Cleared ${count} document cache entries`);
  return count;
};

/**
 * Invalidate specific document cache
 */
export const invalidateDocument = (documentId) => {
  const pattern = `document:${documentId}`;
  const count = cacheManager.invalidatePattern(pattern);
  console.log(`[Invalidation] Cleared document ${documentId} cache`);
  return count;
};

/**
 * Invalidate folder caches
 */
export const invalidateFolders = (userId = null) => {
  const pattern = userId ? `folders:${userId}` : 'folders:';
  const count = cacheManager.invalidatePattern(pattern);
  console.log(`[Invalidation] Cleared ${count} folder cache entries`);
  return count;
};

/**
 * Invalidate specific folder cache
 */
export const invalidateFolder = (folderId) => {
  const pattern = `folder:${folderId}`;
  const count = cacheManager.invalidatePattern(pattern);
  console.log(`[Invalidation] Cleared folder ${folderId} cache`);
  return count;
};

/**
 * Invalidate all caches for a user
 */
export const invalidateUser = (userId) => {
  const patterns = ['documents:', 'folders:', 'document:', 'blocks:'];
  let totalCount = 0;

  patterns.forEach(pattern => {
    const fullPattern = `${pattern}${userId}`;
    totalCount += cacheManager.invalidatePattern(fullPattern);
  });

  console.log(`[Invalidation] Cleared ${totalCount} caches for user ${userId}`);
  return totalCount;
};

/**
 * Invalidate everything (use sparingly)
 */
export const invalidateAll = () => {
  const count = cacheManager.clear();
  console.log(`[Invalidation] Cleared ALL caches (${count} entries)`);
  return count;
};

/**
 * Hook into event bus for automatic invalidation
 */
export const setupAutoInvalidation = () => {
  // Invalidate on document CRUD
  eventBus.on(EVENT_TYPES.DOCUMENT_CREATED, () => {
    invalidateDocuments();
  });

  eventBus.on(EVENT_TYPES.DOCUMENT_UPDATED, (payload) => {
    invalidateDocument(payload.new?.id || payload.id);
    invalidateDocuments(); // Also invalidate list
  });

  eventBus.on(EVENT_TYPES.DOCUMENT_DELETED, (payload) => {
    invalidateDocument(payload.id);
    invalidateDocuments();
  });

  // Invalidate on storage changes
  eventBus.on(EVENT_TYPES.STORAGE_CHANGED, (payload) => {
    if (payload.type === 'document') {
      invalidateDocuments();
    } else if (payload.type === 'folder') {
      invalidateFolders();
    }
  });

  console.log('[CacheInvalidation] Auto-invalidation listeners registered');
};
```

### Success Criteria:

#### Automated Verification:
- [ ] CacheManager file exists: `ls src/utils/cache/CacheManager.js`
- [ ] Cache invalidation helper exists: `ls src/utils/cache/cacheInvalidation.js`
- [ ] No TypeScript/ESLint errors: `npm run lint`
- [ ] Event types added to eventBus: `grep -n "CACHE_UPDATED" src/utils/eventBus.js`
- [ ] Singleton exports correctly: `node -e "console.log(require('./src/utils/cache/CacheManager').cacheManager)"`

#### Manual Verification:
- [ ] CacheManager can store and retrieve data with TTL
- [ ] Pattern-based invalidation works (test with regex)
- [ ] Metrics track hits/misses accurately
- [ ] Event bus emits cache events when data changes
- [ ] Deduplication prevents concurrent fetches for same key

---

## Phase 2: React Hooks for Simple and Paginated Caching

### Overview
Create two React hooks: `useCachedData` for simple data fetching and `useCachedPaginatedData` for paginated data with infinite scroll support. Both hooks use CacheManager under the hood.

### Changes Required:

#### 1. Create useCachedData Hook
**File**: `src/hooks/useCachedData.js` (new file)
**Changes**: Simple cache-first data fetching hook

```javascript
/**
 * useCachedData - Universal caching hook for simple data
 *
 * Usage:
 * const { data, isLoading, error, refresh } = useCachedData({
 *   key: 'folders',
 *   fetchFn: () => getFolders(user.id),
 *   ttl: 30000,
 *   backgroundRefresh: true
 * });
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheManager } from '../utils/cache/CacheManager';
import { eventBus, EVENT_TYPES } from '../utils/eventBus';

export function useCachedData(options) {
  const {
    key,                      // Cache key (unique identifier)
    fetchFn,                  // Function to fetch fresh data
    ttl = 30000,              // Time to live (30 seconds default)
    backgroundRefresh = true, // Refresh in background after serving cache
    dependencies = [],        // Re-fetch when these change
    enabled = true,           // Enable/disable fetching
    onSuccess = null,         // Callback on successful fetch
    onError = null            // Callback on error
  } = options;

  // State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const isMounted = useRef(true);
  const fetchingRef = useRef(false);

  /**
   * Load data from cache or fetch fresh
   */
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!enabled || fetchingRef.current) {
      return;
    }

    try {
      // Try cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheManager.get(key);
        if (cached) {
          console.log(`[useCachedData] Cache HIT for ${key}`);
          setData(cached);
          setIsLoading(false);
          setError(null);

          // Background refresh if enabled
          if (backgroundRefresh) {
            refreshInBackground();
          }
          return;
        }
      }

      // Cache miss - fetch fresh data
      console.log(`[useCachedData] Cache MISS for ${key}, fetching...`);
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Use deduped fetch to prevent concurrent requests
      const freshData = await cacheManager.dedupeFetch(key, fetchFn);

      if (!isMounted.current) return;

      // Update cache
      cacheManager.set(key, freshData, ttl);

      // Update state
      setData(freshData);
      setIsLoading(false);

      // Callback
      if (onSuccess) onSuccess(freshData);

    } catch (err) {
      console.error(`[useCachedData] Error fetching ${key}:`, err);

      if (!isMounted.current) return;

      setError(err);
      setIsLoading(false);

      if (onError) onError(err);
    } finally {
      fetchingRef.current = false;
    }
  }, [key, fetchFn, ttl, backgroundRefresh, enabled, onSuccess, onError]);

  /**
   * Refresh in background without showing loading state
   */
  const refreshInBackground = useCallback(() => {
    fetchFn()
      .then(freshData => {
        if (!isMounted.current) return;

        // Compare with cached data
        const cached = cacheManager.get(key);
        const hasChanges = JSON.stringify(cached) !== JSON.stringify(freshData);

        if (hasChanges) {
          console.log(`[useCachedData] Background refresh found changes for ${key}`);
          cacheManager.set(key, freshData, ttl);
          setData(freshData);

          // Emit event for other components
          eventBus.emit(EVENT_TYPES.CACHE_UPDATED, { key, hasChanges: true });
        } else {
          console.log(`[useCachedData] Background refresh: no changes for ${key}`);
        }
      })
      .catch(err => {
        console.warn(`[useCachedData] Background refresh failed for ${key}:`, err);
      });
  }, [key, fetchFn, ttl]);

  /**
   * Force refresh (bypass cache)
   */
  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  /**
   * Invalidate cache manually
   */
  const invalidate = useCallback(() => {
    cacheManager.invalidate(key);
    setData(null);
  }, [key]);

  /**
   * Load data on mount and when dependencies change
   */
  useEffect(() => {
    isMounted.current = true;
    loadData();

    return () => {
      isMounted.current = false;
    };
  }, [loadData, ...dependencies]);

  /**
   * Listen for cache invalidation events
   */
  useEffect(() => {
    const handleInvalidation = (payload) => {
      if (payload.key === key || (payload.pattern && new RegExp(payload.pattern).test(key))) {
        console.log(`[useCachedData] Cache invalidated for ${key}, reloading...`);
        loadData(true);
      }
    };

    const unsubscribe = eventBus.on(EVENT_TYPES.CACHE_INVALIDATED, handleInvalidation);
    return unsubscribe;
  }, [key, loadData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    invalidate,
    isCached: cacheManager.has(key),
    cacheAge: cacheManager.getAge(key)
  };
}
```

#### 2. Create useCachedPaginatedData Hook
**File**: `src/hooks/useCachedPaginatedData.js` (new file)
**Changes**: Paginated data fetching with per-page caching

```javascript
/**
 * useCachedPaginatedData - Pagination-aware caching hook
 *
 * Caches each page separately and supports infinite scroll.
 * Compatible with virtualization (react-window, custom).
 *
 * Usage:
 * const { documents, loadMore, isLoading, hasMore } = useCachedPaginatedData({
 *   key: 'documents',
 *   fetchPageFn: (page) => getDocuments({ offset: page * 50, limit: 50 }),
 *   pageSize: 50,
 *   ttl: 30000
 * });
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cacheManager } from '../utils/cache/CacheManager';
import { eventBus, EVENT_TYPES } from '../utils/eventBus';

export function useCachedPaginatedData(options) {
  const {
    key,                      // Base cache key
    fetchPageFn,              // (pageNumber) => Promise<data[]>
    pageSize = 50,            // Items per page
    ttl = 30000,              // Cache TTL per page
    backgroundRefresh = true, // Refresh pages in background
    enabled = true,           // Enable/disable fetching
    dependencies = []         // Re-fetch when these change
  } = options;

  // State
  const [pages, setPages] = useState(new Map()); // page number → data
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const isMounted = useRef(true);
  const loadingPages = useRef(new Set()); // Track which pages are currently loading

  /**
   * Generate cache key for specific page
   */
  const getPageKey = useCallback((pageNum) => {
    return cacheManager.getKey(key, 'page', pageNum);
  }, [key]);

  /**
   * Load a specific page
   */
  const loadPage = useCallback(async (pageNum, forceRefresh = false) => {
    if (!enabled || loadingPages.current.has(pageNum)) {
      return;
    }

    const pageKey = getPageKey(pageNum);

    try {
      // Try cache first
      if (!forceRefresh) {
        const cached = cacheManager.get(pageKey);
        if (cached) {
          console.log(`[useCachedPaginatedData] Cache HIT for ${key} page ${pageNum}`);

          setPages(prev => new Map(prev).set(pageNum, cached));
          setLoadedPages(prev => new Set(prev).add(pageNum));

          // Background refresh
          if (backgroundRefresh) {
            refreshPageInBackground(pageNum);
          }

          return cached;
        }
      }

      // Cache miss - fetch page
      console.log(`[useCachedPaginatedData] Fetching ${key} page ${pageNum}`);
      loadingPages.current.add(pageNum);

      if (pageNum === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const data = await cacheManager.dedupeFetch(pageKey, () => fetchPageFn(pageNum));

      if (!isMounted.current) return;

      // Cache the page
      cacheManager.set(pageKey, data, ttl);

      // Update state
      setPages(prev => new Map(prev).set(pageNum, data));
      setLoadedPages(prev => new Set(prev).add(pageNum));

      // Check if there's more data
      if (data.length < pageSize) {
        setHasMore(false);
      }

      return data;

    } catch (err) {
      console.error(`[useCachedPaginatedData] Error loading page ${pageNum}:`, err);
      if (!isMounted.current) return;

      setError(err);
      setHasMore(false); // Stop trying to load more on error
    } finally {
      loadingPages.current.delete(pageNum);
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [enabled, key, pageKey, fetchPageFn, pageSize, ttl, backgroundRefresh]);

  /**
   * Refresh page in background
   */
  const refreshPageInBackground = useCallback((pageNum) => {
    const pageKey = getPageKey(pageNum);

    fetchPageFn(pageNum)
      .then(freshData => {
        if (!isMounted.current) return;

        const cached = cacheManager.get(pageKey);
        const hasChanges = JSON.stringify(cached) !== JSON.stringify(freshData);

        if (hasChanges) {
          console.log(`[useCachedPaginatedData] Background refresh found changes for ${key} page ${pageNum}`);
          cacheManager.set(pageKey, freshData, ttl);
          setPages(prev => new Map(prev).set(pageNum, freshData));
        }
      })
      .catch(err => {
        console.warn(`[useCachedPaginatedData] Background refresh failed for page ${pageNum}:`, err);
      });
  }, [key, fetchPageFn, getPageKey, ttl]);

  /**
   * Load initial page
   */
  const loadInitial = useCallback(async () => {
    await loadPage(0);
    setCurrentPage(0);
  }, [loadPage]);

  /**
   * Load next page (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    const nextPage = currentPage + 1;
    await loadPage(nextPage);
    setCurrentPage(nextPage);
  }, [hasMore, isLoadingMore, currentPage, loadPage]);

  /**
   * Force refresh all loaded pages
   */
  const refresh = useCallback(async () => {
    const pagesToRefresh = Array.from(loadedPages);
    for (const pageNum of pagesToRefresh) {
      await loadPage(pageNum, true);
    }
  }, [loadedPages, loadPage]);

  /**
   * Invalidate all pages
   */
  const invalidate = useCallback(() => {
    const pattern = cacheManager.getKey(key, 'page');
    cacheManager.invalidatePattern(pattern);
    setPages(new Map());
    setLoadedPages(new Set());
    setCurrentPage(0);
    setHasMore(true);
  }, [key]);

  /**
   * Get all items (flatten pages)
   */
  const allItems = useMemo(() => {
    const sorted = Array.from(pages.entries()).sort((a, b) => a[0] - b[0]);
    return sorted.flatMap(([_, items]) => items);
  }, [pages]);

  /**
   * Load initial page on mount
   */
  useEffect(() => {
    isMounted.current = true;

    if (enabled && loadedPages.size === 0) {
      loadInitial();
    }

    return () => {
      isMounted.current = false;
    };
  }, [enabled, loadInitial, ...dependencies]);

  /**
   * Listen for cache invalidation
   */
  useEffect(() => {
    const handleInvalidation = (payload) => {
      const pattern = cacheManager.getKey(key, 'page');
      if (payload.pattern && payload.pattern.includes(pattern)) {
        console.log(`[useCachedPaginatedData] Cache invalidated for ${key}, reloading...`);
        invalidate();
        loadInitial();
      }
    };

    const unsubscribe = eventBus.on(EVENT_TYPES.CACHE_INVALIDATED, handleInvalidation);
    return unsubscribe;
  }, [key, invalidate, loadInitial]);

  return {
    data: allItems,
    pages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    loadInitial,
    refresh,
    invalidate,
    currentPage,
    loadedPageCount: loadedPages.size,
    error
  };
}
```

### Success Criteria:

#### Automated Verification:
- [ ] useCachedData hook file exists: `ls src/hooks/useCachedData.js`
- [ ] useCachedPaginatedData hook file exists: `ls src/hooks/useCachedPaginatedData.js`
- [ ] No ESLint errors: `npm run lint src/hooks/useCached*.js`
- [ ] Hooks export correctly: `grep -n "export function useCachedData" src/hooks/useCachedData.js`

#### Manual Verification:
- [ ] useCachedData returns cached data instantly on re-mount
- [ ] Background refresh detects and applies changes
- [ ] useCachedPaginatedData caches each page separately
- [ ] Paginated hook flattens pages correctly for virtualization
- [ ] Both hooks respond to cache invalidation events
- [ ] Loading states update correctly (isLoading vs isLoadingMore)

---

## Phase 3: Dashboard Integration

### Overview
Replace `usePaginatedDashboard` with `useCachedPaginatedData` to eliminate skeleton loading when returning to dashboard. Integrate with existing infinite scroll and virtualization setup.

### Changes Required:

#### 1. Update Dashboard to use useCachedPaginatedData
**File**: `src/pages/Dashboard.jsx`
**Changes**: Replace pagination hook with cached version

```javascript
// BEFORE (lines 84-101):
const {
  documents: paginatedDocuments,
  documentsWithSkeletons,
  isLoading: isLoadingDocuments,
  isLoadingMore,
  hasMore,
  loadMore,
  loadInitial,
  checkLoadMore,
  progress,
  currentPage
} = usePaginatedDashboard({
  pageSize: 50,
  orderBy: 'updated_at',
  ascending: false,
  enableInfiniteScroll: true,
  preloadNextPage: true
});

// AFTER:
import { useCachedPaginatedData } from '../hooks/useCachedPaginatedData';
import { getDocumentsWithRealActivity } from '../lib/supabase-optimizations';

const {
  data: paginatedDocuments,
  isLoading: isLoadingDocuments,
  isLoadingMore,
  hasMore,
  loadMore,
  loadInitial,
  currentPage,
  loadedPageCount
} = useCachedPaginatedData({
  key: `dashboard-documents:${user?.id}`,
  fetchPageFn: async (page) => {
    const documents = await getDocumentsWithRealActivity({
      userId: user.id,
      limit: 50,
      offset: page * 50
    });

    // Transform to match existing format
    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      folder_id: doc.folder_id,
      position: doc.doc_position,
      metadata: doc.metadata,
      tags: doc.tags,
      blockCount: doc.block_count,
      lastEdited: doc.last_edited,
      editCount7d: doc.edit_count_7d,
      editCount30d: doc.edit_count_30d,
      recentActivity: doc.recent_activity || []
    }));
  },
  pageSize: 50,
  ttl: 30000, // 30 seconds
  backgroundRefresh: true,
  enabled: !!user?.id,
  dependencies: [user?.id]
});
```

#### 2. Update Skeleton Display Condition
**File**: `src/pages/Dashboard.jsx` (line 1301)
**Changes**: Only show skeleton if NO pages cached at all

```javascript
// BEFORE:
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return <SkeletonUI />;
}

// AFTER:
// Show skeleton ONLY if loading initial page AND no cached data
if (isLoadingDocuments && loadedPageCount === 0) {
  return <SkeletonUI />;
}

// Otherwise show cached data immediately (even if background refreshing)
```

#### 3. Update Scroll Event Listener
**File**: `src/pages/Dashboard.jsx` (lines 686-720)
**Changes**: Use new loadMore function

```javascript
// Keep existing scroll listener, just ensure it calls the right loadMore
useEffect(() => {
  const scrollElement = document.querySelector('.dashboard-scroll-container');
  if (!scrollElement) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollPosition = scrollTop + clientHeight;
    const threshold = scrollHeight - 200; // Load 200px before bottom

    if (scrollPosition >= threshold && hasMore && !isLoadingMore) {
      loadMore(); // This now uses cached pagination
    }
  };

  scrollElement.addEventListener('scroll', handleScroll, { passive: true });
  return () => scrollElement.removeEventListener('scroll', handleScroll);
}, [loadMore, hasMore, isLoadingMore]);
```

#### 4. Integrate with Folder Cache
**File**: `src/hooks/useFolders.js`
**Changes**: Replace module-level cache with useCachedData hook

```javascript
// BEFORE (module-level variables):
let foldersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 30000;

export function useFolders() {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  // ... manual cache logic ...
}

// AFTER:
import { useCachedData } from './useCachedData';

export function useFolders() {
  const { user } = useAuth();
  const { supabase } = useSupabase();

  const {
    data: folders,
    isLoading: loading,
    refresh: refreshFolders
  } = useCachedData({
    key: `folders:${user?.id}`,
    fetchFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select(`*, document_count:documents(count)`)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;

      // Build tree structure
      const folderMap = new Map();
      const rootFolders = [];

      data.forEach(folder => {
        const docCount = folder.document_count?.[0]?.count || 0;
        folderMap.set(folder.id, {
          ...folder,
          documentCount: docCount,
          children: []
        });
      });

      data.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(folderMap.get(folder.id));
          }
        } else {
          rootFolders.push(folderMap.get(folder.id));
        }
      });

      return rootFolders;
    },
    ttl: 30000,
    backgroundRefresh: true,
    enabled: !!user?.id,
    dependencies: [user?.id]
  });

  return {
    folders: folders || [],
    loading,
    refreshFolders
  };
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Dashboard imports new hook: `grep -n "useCachedPaginatedData" src/pages/Dashboard.jsx`
- [ ] useFolders uses useCachedData: `grep -n "useCachedData" src/hooks/useFolders.js`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No console errors on dashboard load: (manual browser check)

#### Manual Verification:
- [ ] Navigate to Dashboard → loads with skeleton on first visit
- [ ] Navigate Dashboard → Document → Dashboard: **NO skeleton, instant load**
- [ ] Scroll to load page 2 → navigate away → return: **Pages 1-2 both cached**
- [ ] Wait 31 seconds → return to dashboard: **Background refresh fetches new data**
- [ ] Create new document → dashboard list updates without full reload
- [ ] Folders load instantly from cache on return visits

---

## Phase 4: DocumentPage Integration

### Overview
Add caching to DocumentPage so returning to the same document loads instantly from cache instead of refetching from Supabase.

### Changes Required:

#### 1. Update DocumentPage to use useCachedData
**File**: `src/pages/DocumentPage.jsx`
**Changes**: Wrap document loading with cache

```javascript
// BEFORE (lines 45-95):
const loadDocument = useCallback(async () => {
  if (!documentId) {
    setError('No document ID provided');
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    startDocumentTimer('loading', documentId);

    await storageWrapper.init();

    const doc = await storageWrapper.getDocument(documentId);

    if (!doc) {
      setError('Document not found or you do not have access to it.');
      endDocumentTimer('loading', documentId);
      setLoading(false);
      return;
    }

    setDocument(doc);
    trackDocumentEvent('view', documentId, { /* ... */ });
    startDocumentTimer('editing', documentId);
    endDocumentTimer('loading', documentId);
    setLoading(false);
  } catch (err) {
    console.error('Failed to load document:', err);
    setError(err.message || 'Failed to load document. Please try again.');
    endDocumentTimer('loading', documentId);
    setLoading(false);
  }
}, [documentId, startDocumentTimer, endDocumentTimer, trackDocumentEvent]);

useEffect(() => {
  if (!user) {
    navigate(`/auth?redirect=/document/${documentId}`);
    return;
  }
  loadDocument();
  // ...
}, [user, documentId, navigate, loadDocument]);

// AFTER:
import { useCachedData } from '../hooks/useCachedData';

const {
  data: document,
  isLoading: loading,
  error,
  refresh: reloadDocument
} = useCachedData({
  key: `document:${user?.id}:${documentId}`,
  fetchFn: async () => {
    startDocumentTimer('loading', documentId);

    await storageWrapper.init();
    const doc = await storageWrapper.getDocument(documentId);

    if (!doc) {
      throw new Error('Document not found or you do not have access to it.');
    }

    trackDocumentEvent('view', documentId, {
      document_title: doc.title,
      block_count: doc.blocks?.length || 0,
      access_type: 'direct_url',
      load_source: 'document_page'
    });

    endDocumentTimer('loading', documentId);
    startDocumentTimer('editing', documentId);

    return doc;
  },
  ttl: 60000, // 1 minute (longer for documents)
  backgroundRefresh: true,
  enabled: !!user && !!documentId,
  dependencies: [user?.id, documentId],
  onError: (err) => {
    endDocumentTimer('loading', documentId);
  }
});

// Redirect if not authenticated
useEffect(() => {
  if (!user) {
    navigate(`/auth?redirect=/document/${documentId}`);
  }
}, [user, documentId, navigate]);

// End editing timer on unmount
useEffect(() => {
  return () => {
    if (document?.id) {
      endDocumentTimer('editing', document.id);
    }
  };
}, [document?.id, endDocumentTimer]);
```

#### 2. Add Cache Invalidation After Block Updates
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Changes**: Invalidate document cache after saves

```javascript
import { invalidateDocument } from '../utils/cache/cacheInvalidation';

// After successful save (find the save callback around line 800+)
const handleSave = useCallback(async () => {
  try {
    // ... existing save logic ...

    await storageWrapper.saveDocument(entry, blocks);

    // Invalidate document cache to force fresh load next time
    invalidateDocument(entry.id);

    toast.success('Document saved');
  } catch (error) {
    console.error('Save failed:', error);
    toast.error('Failed to save document');
  }
}, [entry, blocks]);
```

### Success Criteria:

#### Automated Verification:
- [ ] DocumentPage imports useCachedData: `grep -n "useCachedData" src/pages/DocumentPage.jsx`
- [ ] ExpandedViewEnhanced invalidates cache: `grep -n "invalidateDocument" src/components/ExpandedViewEnhanced.jsx`
- [ ] No TypeScript errors: `npm run typecheck`

#### Manual Verification:
- [ ] Open document → first load shows loading spinner
- [ ] Navigate away → return to same document: **NO loading spinner, instant**
- [ ] Edit blocks → save → return to document: **Fresh data loaded, cache invalidated**
- [ ] Open document in Tab A → edit in Tab B → return to Tab A: **Background refresh updates**
- [ ] Wait 61 seconds → return to document: **Background refresh gets new data**

---

## Phase 5: Cross-Tab Invalidation via Event Bus

### Overview
Enable cache invalidation across browser tabs using BroadcastChannel API and event bus integration. When one tab creates/updates/deletes data, all other tabs invalidate their cache and reload.

### Changes Required:

#### 1. Create BroadcastChannel Coordinator
**File**: `src/utils/cache/broadcastCoordinator.js` (new file)
**Changes**: Cross-tab communication for cache invalidation

```javascript
/**
 * BroadcastChannel Coordinator
 *
 * Synchronizes cache invalidation across browser tabs using BroadcastChannel API.
 * Falls back gracefully if API not available (Safari < 15.4).
 */

import { eventBus, EVENT_TYPES } from '../eventBus';
import { cacheManager } from './CacheManager';
import { invalidateDocument, invalidateDocuments, invalidateFolders } from './cacheInvalidation';

class BroadcastCoordinator {
  constructor() {
    this.channel = null;
    this.isSupported = 'BroadcastChannel' in window;
    this.tabId = crypto.randomUUID();
  }

  /**
   * Initialize broadcast channel
   */
  init() {
    if (!this.isSupported) {
      console.warn('[BroadcastCoordinator] BroadcastChannel not supported, cross-tab sync disabled');
      return;
    }

    try {
      this.channel = new BroadcastChannel('devlog-cache-sync');

      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      console.log('[BroadcastCoordinator] Initialized with tab ID:', this.tabId);

      // Setup event bus listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('[BroadcastCoordinator] Failed to initialize:', error);
      this.isSupported = false;
    }
  }

  /**
   * Handle incoming messages from other tabs
   */
  handleMessage(data) {
    const { type, payload, tabId } = data;

    // Ignore messages from this tab
    if (tabId === this.tabId) return;

    console.log(`[BroadcastCoordinator] Received ${type} from tab ${tabId}`, payload);

    switch (type) {
      case 'INVALIDATE_DOCUMENT':
        invalidateDocument(payload.documentId);
        // Emit local event to trigger UI refresh
        eventBus.emit(EVENT_TYPES.DOCUMENT_UPDATED, { id: payload.documentId, source: 'cross-tab' });
        break;

      case 'INVALIDATE_DOCUMENTS':
        invalidateDocuments(payload.userId);
        eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, { type: 'document', source: 'cross-tab' });
        break;

      case 'INVALIDATE_FOLDERS':
        invalidateFolders(payload.userId);
        eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, { type: 'folder', source: 'cross-tab' });
        break;

      case 'INVALIDATE_PATTERN':
        cacheManager.invalidatePattern(payload.pattern);
        break;

      case 'CLEAR_ALL':
        cacheManager.clear();
        break;

      default:
        console.warn('[BroadcastCoordinator] Unknown message type:', type);
    }
  }

  /**
   * Broadcast message to other tabs
   */
  broadcast(type, payload) {
    if (!this.isSupported || !this.channel) return;

    this.channel.postMessage({
      type,
      payload,
      tabId: this.tabId,
      timestamp: Date.now()
    });
  }

  /**
   * Setup event bus listeners to broadcast cache changes
   */
  setupEventListeners() {
    // Document created
    eventBus.on(EVENT_TYPES.DOCUMENT_CREATED, (doc) => {
      this.broadcast('INVALIDATE_DOCUMENTS', { userId: doc.user_id });
    });

    // Document updated
    eventBus.on(EVENT_TYPES.DOCUMENT_UPDATED, (payload) => {
      const docId = payload.new?.id || payload.id;
      this.broadcast('INVALIDATE_DOCUMENT', { documentId: docId });
      this.broadcast('INVALIDATE_DOCUMENTS', { userId: payload.new?.user_id });
    });

    // Document deleted
    eventBus.on(EVENT_TYPES.DOCUMENT_DELETED, (doc) => {
      this.broadcast('INVALIDATE_DOCUMENT', { documentId: doc.id });
      this.broadcast('INVALIDATE_DOCUMENTS', { userId: doc.user_id });
    });

    // Storage changed (catch-all)
    eventBus.on(EVENT_TYPES.STORAGE_CHANGED, (payload) => {
      if (payload.type === 'document') {
        this.broadcast('INVALIDATE_DOCUMENTS', { userId: payload.data?.user_id });
      } else if (payload.type === 'folder') {
        this.broadcast('INVALIDATE_FOLDERS', { userId: payload.data?.user_id });
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Create singleton
export const broadcastCoordinator = new BroadcastCoordinator();
```

#### 2. Initialize Broadcast Coordinator in App
**File**: `src/App.jsx`
**Changes**: Initialize cross-tab sync on app mount

```javascript
import { broadcastCoordinator } from './utils/cache/broadcastCoordinator';
import { setupAutoInvalidation } from './utils/cache/cacheInvalidation';

function App() {
  // Initialize cache coordination
  useEffect(() => {
    // Setup auto-invalidation listeners
    setupAutoInvalidation();

    // Initialize cross-tab broadcast
    broadcastCoordinator.init();

    return () => {
      broadcastCoordinator.destroy();
    };
  }, []);

  return (
    // ... existing app structure
  );
}
```

#### 3. Update RealtimeManager to Trigger Invalidation
**File**: `src/utils/realtimeManager.js`
**Changes**: Clear caches before emitting events

```javascript
import { invalidateDocument, invalidateDocuments } from './cache/cacheInvalidation';

handleDocumentChange(payload) {
  const { eventType, new: newDoc, old: oldDoc } = payload;

  // INVALIDATE CACHES FIRST (before emitting events)
  if (eventType === 'INSERT') {
    invalidateDocuments(); // Clear document list caches
  } else if (eventType === 'UPDATE') {
    invalidateDocument(newDoc.id); // Clear specific document
    invalidateDocuments(); // Also clear list
  } else if (eventType === 'DELETE') {
    invalidateDocument(oldDoc.id);
    invalidateDocuments();
  }

  // Then emit events (existing code)
  switch (eventType) {
    case 'INSERT':
      eventBus.emit(EVENT_TYPES.DOCUMENT_CREATED, newDoc);
      break;
    case 'UPDATE':
      eventBus.emit(EVENT_TYPES.DOCUMENT_UPDATED, { old: oldDoc, new: newDoc });
      break;
    case 'DELETE':
      eventBus.emit(EVENT_TYPES.DOCUMENT_DELETED, oldDoc);
      break;
  }

  eventBus.emit(EVENT_TYPES.STORAGE_CHANGED, {
    type: 'document',
    action: eventType.toLowerCase(),
    data: newDoc || oldDoc
  });
}
```

### Success Criteria:

#### Automated Verification:
- [ ] BroadcastChannel coordinator exists: `ls src/utils/cache/broadcastCoordinator.js`
- [ ] App initializes coordinator: `grep -n "broadcastCoordinator.init" src/App.jsx`
- [ ] RealtimeManager invalidates caches: `grep -n "invalidateDocument" src/utils/realtimeManager.js`
- [ ] No ESLint errors: `npm run lint src/utils/cache/`

#### Manual Verification:
- [ ] Open app in 2 tabs (Tab A, Tab B)
- [ ] Create document in Tab A → Tab B's dashboard updates automatically
- [ ] Edit document in Tab A → Tab B's cache invalidates and reloads
- [ ] Delete folder in Tab B → Tab A's folder list updates
- [ ] Works in Chrome, Firefox, Edge (BroadcastChannel supported)
- [ ] Graceful degradation in Safari < 15.4 (no errors, just no cross-tab sync)

---

## Phase 6: Testing and Performance Verification

### Overview
Comprehensive testing to ensure caching works correctly, doesn't break existing functionality, and provides measurable performance improvements.

### Changes Required:

#### 1. Create Unit Tests for CacheManager
**File**: `src/utils/cache/__tests__/CacheManager.test.js` (new file)
**Changes**: Test core cache functionality

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from '../CacheManager';

describe('CacheManager', () => {
  let cache;

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 5, defaultTTL: 1000 });
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should expire values after TTL', async () => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    expect(cache.get('key1')).toBe('value1');

    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  it('should invalidate single keys', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    cache.invalidate('key1');
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should invalidate by pattern', () => {
    cache.set('doc:1', 'value1');
    cache.set('doc:2', 'value2');
    cache.set('folder:1', 'value3');

    const count = cache.invalidatePattern('doc:');
    expect(count).toBe(2);
    expect(cache.get('doc:1')).toBeNull();
    expect(cache.get('doc:2')).toBeNull();
    expect(cache.get('folder:1')).toBe('value3');
  });

  it('should evict oldest entry when max size reached', () => {
    // Fill cache
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');
    cache.set('key5', 'value5');

    // This should evict key1 (oldest)
    cache.set('key6', 'value6');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key6')).toBe('value6');
  });

  it('should track metrics correctly', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // hit
    cache.get('key2'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.sets).toBe(1);
    expect(stats.hitRate).toBe('50.00%');
  });

  it('should generate namespaced keys', () => {
    const key = cache.getKey('documents', 'user123', 'page', 0);
    expect(key).toBe('documents:user123:page:0');
  });

  it('should deduplicate concurrent fetches', async () => {
    let fetchCount = 0;
    const fetchFn = () => {
      fetchCount++;
      return new Promise(resolve => setTimeout(() => resolve('data'), 100));
    };

    // Start 3 concurrent fetches for same key
    const promise1 = cache.dedupeFetch('key1', fetchFn);
    const promise2 = cache.dedupeFetch('key1', fetchFn);
    const promise3 = cache.dedupeFetch('key1', fetchFn);

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);

    // All should return same data
    expect(result1).toBe('data');
    expect(result2).toBe('data');
    expect(result3).toBe('data');

    // But fetchFn should only be called once
    expect(fetchCount).toBe(1);
  });
});
```

#### 2. Create Integration Tests
**File**: `src/__tests__/cache-integration.test.jsx` (new file)
**Changes**: Test hooks with React components

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useCachedData } from '../hooks/useCachedData';
import { cacheManager } from '../utils/cache/CacheManager';

// Test component
function TestComponent({ fetchFn, cacheKey }) {
  const { data, isLoading, error } = useCachedData({
    key: cacheKey,
    fetchFn,
    ttl: 1000
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>Data: {JSON.stringify(data)}</div>;
}

describe('useCachedData Integration', () => {
  beforeEach(() => {
    cacheManager.clear();
  });

  it('should fetch data on first mount', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ value: 'test' }));

    render(<TestComponent fetchFn={fetchFn} cacheKey="test-key" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Data: {"value":"test"}')).toBeInTheDocument();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('should use cache on second mount', async () => {
    const fetchFn = vi.fn(() => Promise.resolve({ value: 'test' }));

    // First mount - fetch data
    const { unmount } = render(<TestComponent fetchFn={fetchFn} cacheKey="test-key" />);
    await waitFor(() => screen.getByText('Data: {"value":"test"}'));
    unmount();

    // Second mount - should use cache
    render(<TestComponent fetchFn={fetchFn} cacheKey="test-key" />);

    // Should NOT show loading (instant from cache)
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Data: {"value":"test"}')).toBeInTheDocument();

    // Fetch should still only be called once
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
```

#### 3. Add Performance Monitoring
**File**: `src/utils/cache/performanceMonitor.js` (new file)
**Changes**: Track cache performance metrics

```javascript
/**
 * Performance Monitor for Cache System
 *
 * Tracks and logs cache performance metrics in development.
 */

import { cacheManager } from './CacheManager';
import { eventBus, EVENT_TYPES } from '../eventBus';

class CachePerformanceMonitor {
  constructor() {
    this.metrics = {
      cacheHitSavings: 0, // Total time saved by cache hits
      averageFetchTime: 0,
      totalFetches: 0
    };

    this.fetchTimes = [];
  }

  /**
   * Record fetch time
   */
  recordFetch(duration) {
    this.fetchTimes.push(duration);
    this.metrics.totalFetches++;

    // Calculate average
    const sum = this.fetchTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageFetchTime = sum / this.fetchTimes.length;
  }

  /**
   * Calculate time saved by cache hits
   */
  calculateSavings() {
    const stats = cacheManager.getStats();
    this.metrics.cacheHitSavings = stats.hits * this.metrics.averageFetchTime;
  }

  /**
   * Log performance report
   */
  logReport() {
    this.calculateSavings();

    const stats = cacheManager.getStats();
    const savingsSeconds = (this.metrics.cacheHitSavings / 1000).toFixed(2);

    console.group('📊 Cache Performance Report');
    console.log('Cache Stats:', stats);
    console.log(`Average Fetch Time: ${this.metrics.averageFetchTime.toFixed(0)}ms`);
    console.log(`Time Saved: ${savingsSeconds}s (${stats.hits} cache hits)`);
    console.log(`Efficiency: ${stats.hitRate} hit rate`);
    console.groupEnd();
  }

  /**
   * Start periodic logging (development only)
   */
  startMonitoring() {
    if (process.env.NODE_ENV !== 'development') return;

    // Log report every 30 seconds
    setInterval(() => {
      if (this.metrics.totalFetches > 0) {
        this.logReport();
      }
    }, 30000);

    // Listen to cache events
    eventBus.on(EVENT_TYPES.CACHE_HIT, () => {
      // Cache hits don't fetch, so savings = avg fetch time
      this.calculateSavings();
    });
  }
}

export const performanceMonitor = new CachePerformanceMonitor();
```

#### 4. Add Cache Stats to Dev Tools
**File**: `src/components/DevTools.jsx` (new file - development only)
**Changes**: In-app cache debugging panel

```javascript
/**
 * DevTools - Cache debugging panel (development only)
 *
 * Press Ctrl+Shift+C to toggle
 */

import { useState, useEffect } from 'react';
import { cacheManager } from '../utils/cache/CacheManager';

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({});
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setStats(cacheManager.getStats());
        setKeys(cacheManager.getKeys());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: 400,
      maxHeight: 500,
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: 12,
      padding: 16,
      overflow: 'auto',
      zIndex: 99999,
      border: '2px solid #0f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>⚡ Cache DevTools</h3>
        <button onClick={() => cacheManager.clear()} style={{ background: '#f00', border: 'none', color: '#fff', padding: '4px 8px', cursor: 'pointer' }}>
          Clear All
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div>Size: {stats.size} / {stats.maxSize}</div>
        <div>Hit Rate: {stats.hitRate}</div>
        <div>Hits: {stats.hits} | Misses: {stats.misses}</div>
        <div>Evictions: {stats.evictions}</div>
      </div>

      <div>
        <h4 style={{ marginBottom: 8 }}>Cache Keys ({keys.length}):</h4>
        <div style={{ maxHeight: 200, overflow: 'auto' }}>
          {keys.map(key => {
            const age = cacheManager.getAge(key);
            const isFresh = cacheManager.isFresh(key);
            return (
              <div key={key} style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isFresh ? '#0f0' : '#f90' }}>{key}</span>
                <span style={{ color: '#888' }}>{(age / 1000).toFixed(0)}s</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] All unit tests pass: `npm test src/utils/cache/__tests__`
- [ ] Integration tests pass: `npm test src/__tests__/cache-integration.test.jsx`
- [ ] No memory leaks detected: (manual profiling with Chrome DevTools)
- [ ] Bundle size increase < 10KB: `npm run build && ls -lh dist/assets/*.js`

#### Manual Verification:
- [ ] DevTools panel opens with Ctrl+Shift+C
- [ ] Cache stats show accurate hit rates
- [ ] Performance monitor logs time savings
- [ ] Navigation Dashboard → Document → Dashboard: **<50ms load time (vs 200ms before)**
- [ ] Memory usage stable after 100+ navigation cycles
- [ ] No console errors during normal usage
- [ ] Cross-tab sync works in multi-tab scenarios

---

## Testing Strategy

### Unit Tests:
- **CacheManager**: Set, get, TTL expiration, pattern invalidation, eviction
- **useCachedData**: Cache hits, misses, background refresh, error handling
- **useCachedPaginatedData**: Page caching, infinite scroll, deduplication
- **Cache Invalidation**: Pattern matching, event bus integration

### Integration Tests:
- **Dashboard Navigation**: Cache restoration, pagination, scroll position
- **Document Loading**: Single document caching, block updates, invalidation
- **Cross-Tab Sync**: BroadcastChannel messaging, event propagation
- **Realtime Updates**: Supabase subscriptions trigger cache invalidation

### Manual Testing Steps:
1. **Basic Caching**:
   - Load dashboard → navigate to document → back to dashboard (should be instant)
   - Check DevTools shows cache hit

2. **Pagination**:
   - Scroll dashboard to page 3 → navigate away → return (all 3 pages cached)
   - Check cache keys show `documents:page:0`, `documents:page:1`, `documents:page:2`

3. **Cross-Tab**:
   - Open 2 tabs
   - Create document in Tab A → verify Tab B updates
   - Edit document in Tab A → verify Tab B cache invalidates

4. **TTL Expiration**:
   - Load dashboard → wait 31 seconds → return (should background refresh)
   - Check console shows "Background refresh found changes"

5. **Error Handling**:
   - Disconnect network → load cached page (should work)
   - Try to load uncached page (should show error)

## Performance Considerations

### Expected Improvements:
- **Dashboard navigation**: 200ms → **<50ms** (4x faster)
- **Document loading**: 300ms → **<50ms** (6x faster)
- **Folder loading**: 150ms → **instant** (cached)
- **Scroll position**: Restored instantly (no re-fetch)

### Memory Impact:
- **Cache size**: ~5-10MB for 100 documents
- **LRU eviction**: Automatic cleanup when > 100 entries
- **TTL expiration**: Auto-cleanup after 30-60 seconds
- **Total overhead**: <1% of available RAM

### Network Savings:
- **Cache hit rate**: Expected 70-80% after warmup
- **API calls reduced**: By 75% for active users
- **Background refresh**: Non-blocking, doesn't affect UX

## Migration Notes

### No Breaking Changes:
- All existing hooks remain functional
- Dashboard gradually migrates to new hooks
- DocumentPage adds caching without changing API
- Event bus listeners additive (don't replace existing)

### Rollback Strategy:
If issues arise:
1. Revert `Dashboard.jsx` to use `usePaginatedDashboard`
2. Revert `DocumentPage.jsx` to direct `storageWrapper` calls
3. Remove `broadcastCoordinator.init()` from `App.jsx`
4. Keep `CacheManager` for future use (isolated, no side effects)

### Gradual Rollout:
1. **Phase 1-2**: Core infrastructure (no UI changes)
2. **Phase 3**: Dashboard only (monitor for issues)
3. **Phase 4**: DocumentPage (low risk, additive)
4. **Phase 5-6**: Cross-tab + testing (optional features)

## References

- Current state research: `thoughts/shared/research/2025-11-06-dashboard-reload-skeleton-behavior.md`
- Pagination deep dive: `thoughts/shared/research/2025-11-01_dashboard-pagination-deep-dive.md`
- Smart Sync architecture: `docs/database/SMART_SYNC_ARCHITECTURE.md`
- Event bus implementation: `src/utils/eventBus.js:82-127`
- Existing LRU cache: `src/utils/LRUCache.js:12-186`
- Multi-layer storage: `src/utils/storage/MultiLayerStorage.js:21-401`
- react-window usage: `src/components/ExpandedViewEnhanced.jsx:163-298`

---

## Appendix: Key Design Decisions

### Why Module-Level Cache Instead of React Context?
- **Performance**: No React re-renders on cache updates
- **Simplicity**: Less boilerplate than Context Provider
- **Agnostic**: Works outside React components (service workers, utils)
- **Testable**: Easy to test in isolation

### Why TTL-Based Expiration?
- **Freshness**: Guarantees data isn't stale beyond X seconds
- **Automatic Cleanup**: No manual cache management
- **Flexible**: Different TTL for different data types (documents=60s, folders=30s)

### Why Background Refresh?
- **Best of Both Worlds**: Instant load + fresh data
- **Non-Blocking**: Doesn't impact perceived performance
- **User Feedback**: Subtle updates when data changes

### Why BroadcastChannel Over localStorage Events?
- **Purpose-Built**: Designed for tab communication
- **Structured Messages**: JSON payloads, not string keys
- **Performance**: Doesn't write to disk
- **Limitations**: Not supported in Safari < 15.4 (graceful fallback)

### Why Per-Page Caching for Pagination?
- **Granularity**: Cache individual pages, not entire dataset
- **Memory Efficient**: Only cache what user scrolled to
- **Scroll Restoration**: Knows exact pages to load
- **Invalidation**: Can refresh specific pages

### Why Keep Existing Storage Layer?
- **Risk Mitigation**: Don't change core infrastructure
- **Incremental**: Add caching on top, not replace bottom
- **Compatibility**: Works with IndexedDB, Supabase, Smart Sync
- **Rollback**: Easy to disable without breaking everything
