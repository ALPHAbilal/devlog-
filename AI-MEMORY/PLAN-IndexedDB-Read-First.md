# Implementation Plan: IndexedDB Read-First Strategy

## Overview

This plan implements **Option 3: IndexedDB Read-First Strategy** to preserve document content across navigation events (like going to /settings and back). The goal is to load documents from IndexedDB first (~5-20ms) then background sync with Supabase.

## Problem Statement

**Current Issue**: When user navigates to `/settings` and back to dashboard:
1. Tabs load from localStorage (sync) - instant
2. Documents load from Supabase (async) - 200-500ms
3. Race condition: `activeDocument` finds nothing because `allDocuments` is empty
4. User sees "No document open" flash

**Root Cause**: The tab system expects documents to be available immediately, but documents are only loaded after async Supabase fetch completes.

## Current Architecture Analysis

### Document Loading Flow (Dashboard.jsx)
```
User lands on Dashboard
    ↓
usePaginatedDashboard hook → loadInitial()
    ↓
storageWrapper.getEntries() → Supabase (async, 200-500ms)
    ↓
setAllDocuments(paginatedDocuments)
    ↓
activeDocument = allDocuments.find(doc => doc.id === activeTabId)
```

### IndexedDB Adapter (Already Exists!)
- Location: `/src/utils/storage/IndexedDBAdapter.js`
- Key methods:
  - `getAllDocuments()` - Returns all documents from IndexedDB
  - `saveDocument(doc)` - Saves single document
  - `saveAllDocuments(docs)` - Saves array of documents
  - `deleteDocument(id)` - Deletes document
- Performance: ~5-20ms reads vs 200-500ms Supabase

### Storage Wrapper
- Location: `/src/utils/storage/storageWrapper.js`
- Currently: Goes directly to Supabase when authenticated
- Need to modify: Read IndexedDB first, then background sync

## Implementation Phases

---

## Phase 1: Create IndexedDB Cache Layer

### Step 1.1: Create useIndexedDBCache Hook

Create a new hook that manages IndexedDB as a cache layer.

**File**: `/src/hooks/useIndexedDBCache.js`

```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import IndexedDBAdapter from '../utils/storage/IndexedDBAdapter';

/**
 * Hook for managing IndexedDB as a fast cache layer
 * Provides instant document access while background syncing with Supabase
 */
export function useIndexedDBCache() {
  const [cachedDocuments, setCachedDocuments] = useState([]);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncInProgress = useRef(false);

  // Load documents from IndexedDB on mount (FAST - ~5-20ms)
  const loadFromCache = useCallback(async () => {
    try {
      const docs = await IndexedDBAdapter.getAllDocuments();
      setCachedDocuments(docs || []);
      setIsCacheLoaded(true);
      return docs || [];
    } catch (error) {
      console.error('[IndexedDBCache] Failed to load from cache:', error);
      setIsCacheLoaded(true); // Mark as loaded even on error
      return [];
    }
  }, []);

  // Update cache with fresh data from Supabase
  const updateCache = useCallback(async (freshDocuments) => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    try {
      // Save all documents to IndexedDB
      await IndexedDBAdapter.saveAllDocuments(freshDocuments);
      setCachedDocuments(freshDocuments);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('[IndexedDBCache] Failed to update cache:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, []);

  // Update single document in cache
  const updateDocumentInCache = useCallback(async (document) => {
    try {
      await IndexedDBAdapter.saveDocument(document);
      setCachedDocuments(prev => {
        const exists = prev.some(d => d.id === document.id);
        if (exists) {
          return prev.map(d => d.id === document.id ? document : d);
        }
        return [document, ...prev];
      });
    } catch (error) {
      console.error('[IndexedDBCache] Failed to update document:', error);
    }
  }, []);

  // Remove document from cache
  const removeFromCache = useCallback(async (documentId) => {
    try {
      await IndexedDBAdapter.deleteDocument(documentId);
      setCachedDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (error) {
      console.error('[IndexedDBCache] Failed to remove document:', error);
    }
  }, []);

  // Get single document by ID (instant)
  const getDocument = useCallback((documentId) => {
    return cachedDocuments.find(d => d.id === documentId) || null;
  }, [cachedDocuments]);

  return {
    cachedDocuments,
    isCacheLoaded,
    lastSyncTime,
    loadFromCache,
    updateCache,
    updateDocumentInCache,
    removeFromCache,
    getDocument
  };
}
```

---

## Phase 2: Integrate Cache into Dashboard

### Step 2.1: Modify Dashboard.jsx Loading Flow

**Changes to Dashboard.jsx**:

```javascript
// ADD: Import the cache hook
import { useIndexedDBCache } from '../hooks/useIndexedDBCache';

// ADD: Inside Dashboard component, after existing hooks
const {
  cachedDocuments,
  isCacheLoaded,
  loadFromCache,
  updateCache,
  updateDocumentInCache,
  removeFromCache,
  getDocument: getCachedDocument
} = useIndexedDBCache();

// MODIFY: Initial load effect - Load from IndexedDB FIRST
useEffect(() => {
  const initializeDocuments = async () => {
    // Step 1: Load from IndexedDB immediately (5-20ms)
    console.log('[Dashboard] Loading from IndexedDB cache...');
    const cached = await loadFromCache();

    if (cached.length > 0) {
      console.log(`[Dashboard] Loaded ${cached.length} documents from cache`);
      setAllDocuments(cached);
    }

    // Step 2: Background sync with Supabase (don't block UI)
    if (user?.id) {
      console.log('[Dashboard] Starting background Supabase sync...');
      loadInitial().then(() => {
        console.log('[Dashboard] Background sync complete');
      });
    }
  };

  initializeDocuments();
}, [user?.id, loadFromCache, loadInitial]);

// MODIFY: Sync paginated documents to both state AND cache
useEffect(() => {
  if (paginatedDocuments && paginatedDocuments.length > 0) {
    setAllDocuments(paginatedDocuments);
    // Update IndexedDB cache with fresh Supabase data
    updateCache(paginatedDocuments);
  }
}, [paginatedDocuments, updateCache]);

// MODIFY: activeDocument lookup - use cached if main is empty
const activeDocument = useMemo(() => {
  if (!activeTabId) return null;

  // Try main documents first
  const fromMain = allDocuments.find(doc => doc.id === activeTabId);
  if (fromMain) return fromMain;

  // Fallback to cache (handles race condition)
  return getCachedDocument(activeTabId);
}, [activeTabId, allDocuments, getCachedDocument]);
```

### Step 2.2: Update Document Operations

**Update createNewEntry** to save to cache:
```javascript
// After: setAllDocuments(prev => [newEntry, ...prev]);
// ADD:
updateDocumentInCache(newEntry);
```

**Update handleCreateNewTab** to save to cache:
```javascript
// After: setAllDocuments(prev => [newEntry, ...prev]);
// ADD:
updateDocumentInCache(newEntry);
```

**Update updateEntry** to save to cache:
```javascript
// After updating allDocuments
// ADD:
updateDocumentInCache(updatedEntry);
```

---

## Phase 3: Handle Navigation State Preservation

### Step 3.1: Ensure Cache Persists Across Navigation

The IndexedDB cache automatically persists. Key scenarios:

1. **User opens document** → Document in allDocuments + IndexedDB
2. **User goes to /settings** → Dashboard unmounts, IndexedDB persists
3. **User returns to Dashboard** →
   - Tabs load from localStorage (instant)
   - Documents load from IndexedDB (5-20ms)
   - activeDocument found immediately
   - No "No document open" flash!

### Step 3.2: Add Cache Warming on Tab Restore

In TabContext, when restoring tabs, pre-warm the cache:

**File**: `/src/contexts/TabContext.jsx` (if needed)

```javascript
// When tabs are restored from localStorage, emit event for cache warming
useEffect(() => {
  if (tabs.length > 0 && isInitialized) {
    // Emit event so Dashboard can ensure these docs are in cache
    window.dispatchEvent(new CustomEvent('devlog:tabsRestored', {
      detail: { tabIds: tabs.map(t => t.id) }
    }));
  }
}, [tabs, isInitialized]);
```

---

## Phase 4: Conflict Resolution & Sync Status

### Step 4.1: Add Sync Status Tracking

Track which documents are synced vs pending:

```javascript
// In useIndexedDBCache hook, add:
const [syncStatus, setSyncStatus] = useState({}); // { docId: 'synced' | 'pending' | 'conflict' }

// When saving to IndexedDB, mark as pending
const updateDocumentInCache = useCallback(async (document, fromSupabase = false) => {
  // ... existing save logic

  setSyncStatus(prev => ({
    ...prev,
    [document.id]: fromSupabase ? 'synced' : 'pending'
  }));
}, []);
```

### Step 4.2: Handle Merge Conflicts

When Supabase returns newer data:

```javascript
const updateCache = useCallback(async (freshDocuments) => {
  // Compare timestamps and handle conflicts
  const conflicts = [];

  for (const fresh of freshDocuments) {
    const cached = cachedDocuments.find(d => d.id === fresh.id);

    if (cached && cached.metadata?.syncStatus === 'pending') {
      // Local has unsaved changes
      const localTime = new Date(cached.updated_at || cached.updatedAt);
      const serverTime = new Date(fresh.updated_at || fresh.updatedAt);

      if (serverTime > localTime) {
        conflicts.push({ local: cached, server: fresh });
      }
    }
  }

  if (conflicts.length > 0) {
    console.warn('[IndexedDBCache] Conflicts detected:', conflicts);
    // For now: Server wins (future: show conflict UI)
  }

  // ... rest of save logic
}, [cachedDocuments]);
```

---

## Phase 5: Performance Optimization

### Step 5.1: Selective Document Loading

Only load full documents when needed:

```javascript
// Add to IndexedDBAdapter or create new method
async getDocumentMetadata() {
  // Returns only: id, title, folder_id, updated_at, tags
  // Excludes: blocks (the heavy part)
}

async getDocumentById(id) {
  // Returns full document including blocks
}
```

### Step 5.2: Lazy Block Loading

Documents in sidebar only need metadata. Full blocks loaded when opened:

```javascript
// Initial load: metadata only (fast)
const metadataOnly = await IndexedDBAdapter.getAllDocumentMetadata();
setAllDocuments(metadataOnly);

// When document opened: load full document
const handleDocumentExpand = async (docMetadata) => {
  const fullDoc = await IndexedDBAdapter.getDocumentById(docMetadata.id);
  openTab(fullDoc);
};
```

---

## Implementation Checklist

### Phase 1: Cache Layer
- [x] Create `/src/hooks/useIndexedDBCache.js`
- [x] Test cache load/save operations
- [x] Verify ~5-20ms load times

### Phase 2: Dashboard Integration
- [x] Import useIndexedDBCache in Dashboard.jsx
- [x] Modify initial load to read IndexedDB first
- [x] Update paginatedDocuments sync to write to cache
- [x] Update activeDocument to fallback to cache
- [x] Update createNewEntry to write to cache
- [x] Update handleCreateNewTab to write to cache
- [x] Update updateEntry to write to cache

### Phase 3: Navigation
- [ ] Test: Open document → Go to /settings → Come back
- [ ] Verify no "No document open" flash
- [ ] Verify document content preserved

### Phase 4: Sync Status (Optional Enhancement)
- [x] Add sync status tracking
- [x] Handle conflict detection
- [ ] Add UI indicator for sync status

### Phase 5: Performance (Future)
- [ ] Implement metadata-only loading
- [ ] Implement lazy block loading
- [ ] Profile and optimize

---

## Risk Mitigation

### Risk 1: Data Inconsistency
**Mitigation**: Supabase is always source of truth. IndexedDB is read-first cache.

### Risk 2: Stale Cache
**Mitigation**: Always background sync after cache read. Cache updated on every Supabase response.

### Risk 3: Storage Limits
**Mitigation**: IndexedDB has 1GB+ capacity. Monitor via existing `storageInfo`.

### Risk 4: Browser Support
**Mitigation**: IndexedDBAdapter already has localStorage fallback.

---

## Success Criteria

1. **Navigation preserves state**: Going to /settings and back shows open documents
2. **No flash of empty state**: Documents appear within 50ms of Dashboard mount
3. **Data stays in sync**: IndexedDB cache matches Supabase within 5 seconds
4. **Non-destructive**: No breaking changes to existing functionality
5. **Future-proof**: Cache layer can be extended for offline support later

---

## Future Enhancements (Not in this implementation)

1. **Full Offline Support**: Queue changes when offline, sync when online
2. **Real-time Sync**: WebSocket-based sync instead of polling
3. **Selective Sync**: Only sync recent/active documents
4. **Compression**: Compress large documents in IndexedDB
