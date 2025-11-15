# Cache System Verification Guide

## Overview
This guide explains how to verify that the existing cache system is working correctly in the document page. All cache operations are now logged with the `[CACHE-TRACK]` prefix for easy filtering.

## How to Verify Cache is Working

### Step 1: Open Browser Console
Open your browser's developer console (F12) and filter for `[CACHE-TRACK]` to see only cache-related logs.

### Step 2: Test Cache Flow

#### First Visit (Cache Miss - Expected)
1. Navigate to a document page for the first time
2. Look for these logs in sequence:
   ```
   [CACHE-TRACK] 📄 ExpandedViewEnhanced: Document [id] - loader: OPTIMIZED/PAGINATED
   [CACHE-TRACK] 🚀 useOptimizedBlockLoader: Starting load for document [id]
   [CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks([id])
   [CACHE-TRACK] ❌ MISS: getBlocks([id]) - No blocks in cache
   [CACHE-TRACK] ❌ CACHE MISS: No blocks in cache, loading from database...
   [CACHE-TRACK] 📊 DATABASE: Loaded from DB in [X]ms
   [CACHE-TRACK] 📦 RECEIVED: [N] blocks from loader
   [CACHE-TRACK] 💾 CACHING: Storing [N] blocks in sessionCache
   [CACHE-TRACK] 💾 SET: cacheBlocks([id]) - Caching [N] blocks
   [CACHE-TRACK] ⏱️ COMPLETE: Total load time: [X]ms
   [CACHE-TRACK] ✅ READY: [N] blocks ready for rendering
   ```

#### Second Visit (Cache Hit - Expected)
1. Navigate away from the document (go to dashboard)
2. Navigate back to the same document
3. Look for these logs in sequence:
   ```
   [CACHE-TRACK] 📄 ExpandedViewEnhanced: Document [id] - loader: OPTIMIZED/PAGINATED
   [CACHE-TRACK] 🚀 useOptimizedBlockLoader: Starting load for document [id]
   [CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks([id])
   [CACHE-TRACK] ✅ HIT: getBlocks([id]) - Found [N] blocks in cache
   [CACHE-TRACK] ✅ CACHE HIT: Found [N] blocks in sessionCache - Load time: [X]ms
   [CACHE-TRACK] ⏱️ COMPLETE: Loaded from cache in [X]ms
   [CACHE-TRACK] ✅ READY: [N] blocks ready for rendering
   ```

**Key Indicator**: If you see `✅ CACHE HIT` and the load time is < 10ms, the cache is working!

## Log Categories

### 🚀 Loader Start
- Indicates which loader (Optimized or Paginated) is being used
- Shows document ID being loaded

### 🔍 Cache Check
- Shows which cache is being checked (sessionCache, paginatedBlockLoader)
- Indicates if checking entry.blocks prop first

### ✅ Cache Hit
- Blocks found in cache
- Shows block count and load time (should be < 10ms)

### ❌ Cache Miss
- No blocks in cache
- Will trigger database load

### 📊 Database Load
- Loading from database (cache miss)
- Shows load time (typically 50-200ms)

### 💾 Caching
- Storing blocks in cache after loading
- Shows block count being cached

### ✅ Ready
- Blocks are ready for rendering
- Final confirmation that cache flow completed

## Expected Behavior

### First Visit
- **Cache**: MISS (expected)
- **Source**: Database
- **Load Time**: 50-200ms
- **Skeleton**: May show briefly

### Subsequent Visits
- **Cache**: HIT (expected)
- **Source**: sessionCache
- **Load Time**: < 10ms
- **Skeleton**: Should NOT show (instant load)

## Troubleshooting

### Problem: Cache always misses
**Symptoms**: Always see `❌ CACHE MISS` even on second visit

**Possible Causes**:
1. Cache is being cleared between visits
2. Document ID is changing
3. Cache TTL expired (check LRU cache settings)

**Check**:
- Look for `[CACHE-TRACK] 🔄 UPDATE` or `💾 SET` logs to confirm blocks are being cached
- Check if `clearDocument` or `clearAll` is being called

### Problem: Cache hit but slow
**Symptoms**: See `✅ CACHE HIT` but load time > 50ms

**Possible Causes**:
1. Large block arrays causing slow processing
2. Other operations blocking the main thread

**Check**:
- Look at block count in cache hit log
- Check for other console errors

### Problem: Blocks not rendering after cache hit
**Symptoms**: Cache hit logged but blocks don't appear

**Possible Causes**:
1. Blocks array is empty or corrupted
2. Virtualization issue
3. Component not re-rendering

**Check**:
- Look for `✅ READY` log to confirm blocks reached component
- Check for virtualization errors
- Verify block count matches expected

## Performance Benchmarks

### Cache Hit Performance
- **Target**: < 10ms from cache check to blocks ready
- **Acceptable**: < 50ms
- **Needs Investigation**: > 50ms

### Cache Miss Performance
- **Target**: < 200ms from database query to blocks ready
- **Acceptable**: < 500ms
- **Needs Investigation**: > 500ms

## Log Filtering Tips

### Filter by Document ID
In console, filter: `[CACHE-TRACK].*[document-id-prefix]`

### Filter by Operation
- Cache hits: `[CACHE-TRACK].*HIT`
- Cache misses: `[CACHE-TRACK].*MISS`
- Database loads: `[CACHE-TRACK].*DATABASE`
- Cache writes: `[CACHE-TRACK].*CACHING`

### Filter by Loader
- Optimized loader: `[CACHE-TRACK].*useOptimizedBlockLoader`
- Paginated loader: `[CACHE-TRACK].*usePaginatedBlockLoader`

## Next Steps

Once you've verified the cache is working:
1. Document the cache hit rate (should be > 80% on second visits)
2. Note any performance issues
3. Proceed with integrating dashboard cache system
4. Ensure virtualization compatibility is maintained

