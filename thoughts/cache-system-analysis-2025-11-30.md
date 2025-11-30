# Cache System Analysis

**Date**: 2025-11-30
**Status**: Working as Expected

## Overview

The caching system uses a multi-layer approach:
1. **SessionCache** (LRU in-memory) - fastest, current session only
2. **IndexedDB** - persistent local storage
3. **Supabase** - cloud storage, source of truth

## Cache Flow

### Document Load Sequence
```
User opens document
    ↓
Check sessionCache.getBlocks(docId)
    ↓
[HIT] → Return cached blocks (< 1ms)
[MISS] → Check entry.blocks prop
    ↓
[HAS BLOCKS] → Use entry.blocks, cache to sessionCache
[NO BLOCKS] → Load from IndexedDB/Supabase, cache to sessionCache
```

### Cache Keys Structure
- `doc:{documentId}` - Document metadata
- `blocks:{documentId}` - Block array
- `meta:{documentId}` - Access metadata (timestamps)

## Verified Behaviors

### 1. First Load (Cache MISS)
When a document is opened for the first time in a session:
```
[CACHE-TRACK] 🚀 useOptimizedBlockLoader: Starting load for document xxxxxxxx
[CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks(xxxxxxxx)
[CACHE-TRACK] ❌ MISS: getBlocks(xxxxxxxx) - No blocks in cache (lookup: 0.10ms)
[CACHE-TRACK] ✅ SOURCE: entry.blocks - Found N blocks (sessionCache was empty)
[CACHE-TRACK] 💾 SET: cacheBlocks(xxxxxxxx) - Caching N blocks
SessionCache: Cached N blocks for document xxxxxxxx (write: 0.20ms)
```

### 2. Cache Updates During Editing
When blocks are modified:
```
[CACHE-TRACK] 🔄 UPDATE: updateBlocks(xxxxxxxx) - Updating cache with N blocks
[CACHE-TRACK] ⏱️ UPDATE TIME: 0.20ms
```

### 3. Tab Close Cleanup
When a tab is closed, both sessionCache and IndexedDB are cleaned:
```
[CACHE-CLEANUP] 🗑️ Removed document xxxxxxxx from sessionCache (N entries cleared)
[MULTI-TAB] 🗑️ Tab closed, cache cleared for document xxxxxxxx
[IndexedDBCache] Document xxxxxxxx removed from cache
```

### 4. Cache HIT (Re-opening document)
When switching back to an already-opened document:
```
[CACHE-TRACK] ✅ HIT: getBlocks(xxxxxxxx) - Found N blocks in cache (lookup: 0.10ms)
```

## Performance Metrics

| Operation | Typical Time |
|-----------|--------------|
| Cache lookup | 0.00 - 0.10ms |
| Cache write | 0.10 - 0.20ms |
| Cache update | 0.10 - 0.20ms |
| Full load from entry.blocks | 27 - 41ms |

## Code Locations

- **SessionCache**: `src/utils/sessionCache.js`
- **LRU Cache**: `src/utils/LRUCache.js`
- **Block Loader**: `src/hooks/useOptimizedBlockLoader.js`
- **IndexedDB Adapter**: `src/utils/storage/IndexedDBAdapter.js`
- **Tab Close Handler**: `src/pages/Dashboard.jsx` → `handleCloseTab`

## Key Implementation Details

### SessionCache.removeDocument()
Added to clean up when tabs close:
```javascript
removeDocument(documentId) {
  this.cache.delete(this.getDocumentKey(documentId));    // doc:xxx
  this.cache.delete(this.getBlocksKey(documentId));      // blocks:xxx
  this.cache.delete(this.getMetadataKey(documentId));    // meta:xxx
}
```

### handleCloseTab in Dashboard.jsx
```javascript
const handleCloseTab = useCallback((tabId) => {
  closeTab(tabId);
  removeFromCache(tabId);                    // IndexedDB cleanup
  sessionCache.removeDocument(tabId);        // Memory cleanup
}, [closeTab, removeFromCache]);
```

## When to Expect Cache HITs vs MISSes

| Scenario | Expected Result |
|----------|-----------------|
| First time opening document | MISS |
| Switching between open tabs | HIT (if previously loaded) |
| After page refresh | MISS (sessionCache cleared) |
| After closing and reopening tab | MISS (cache was cleaned) |
| Same document in multiple browser tabs | Each tab has own cache (MISS) |

## Debugging Tips

1. Look for `[CACHE-TRACK]` logs to trace cache behavior
2. Check `[CACHE-CLEANUP]` to verify memory is freed on tab close
3. Monitor `[INDEXEDDB-SYNC]` for persistent storage updates
4. Use browser DevTools Memory tab to verify no memory leaks

## Related Patterns

See `AI-MEMORY/PATTERNS.md`:
- "Multi-Tab Cache Cleanup: SessionCache Not Cleared on Tab Close"
- "Save Pipeline Verification Pattern"
