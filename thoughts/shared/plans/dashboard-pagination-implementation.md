# Dashboard Pagination Implementation Plan

## Overview

Implement pagination for the Dashboard to handle thousands of documents efficiently. Currently, the dashboard loads ALL documents in a single query with no limit, causing performance issues for users with large document collections. This plan implements incremental loading with 50 documents per page using infinite scroll for seamless UX.

## Current State Analysis

### Data Fetching Flow
**Entry Point**: `src/pages/Dashboard.jsx:366`
```javascript
const savedEntries = await storageWrapper.getEntries();
```

**Flow**:
1. Dashboard → `storageWrapper.getEntries()` (storageWrapper.js:188)
2. Wrapper → `adapter.getDocuments()` (storageWrapper.js:57)
3. Adapter → Supabase query (SupabaseAdapter.js:232-237)

**Database Query** (SupabaseAdapter.js:232-237):
```javascript
const { data, error } = await supabase
  .from('documents')
  .select('id, title, tags, created_at, updated_at, metadata, is_template, project_id, folder_id, position')
  .eq('user_id', this.userId)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false });
// NO LIMIT CLAUSE - fetches everything!
```

### Key Issues Identified

1. **NO Pagination**: Query loads ALL documents regardless of count
2. **Linear Scaling**: Load time grows linearly with document count
   - 100 docs = ~100ms
   - 1,000 docs = ~500ms
   - 10,000 docs = ~5+ seconds
3. **Wrong Adapter**: Uses `SupabaseAdapter` (old) instead of `SupabaseAdapterOptimized` (new)
4. **Memory Pressure**: All documents stored in React state simultaneously
5. **Network Bandwidth**: Large payloads on slow connections (1,000 docs × 500 bytes = 500KB)

### What Currently Works Well

1. **Blocks Excluded**: Documents load WITHOUT blocks for performance (SupabaseAdapter.js:304)
2. **5-Minute Cache**: Reduces repeated queries (SupabaseAdapter.js:217-221)
3. **Session Cache**: Optimistic updates for recently modified docs (Dashboard.jsx:372-401)
4. **Virtual Rendering**: `VirtualizedGrid` only renders visible cards (Dashboard.jsx:9)
5. **Lazy Block Loading**: Blocks fetched only when document opened (Dashboard.jsx:155)

## Desired End State

### Performance Targets

**Initial Load**:
- Load first 50 documents (1 page)
- Query time: <100ms (regardless of total count)
- Time to Interactive: <400ms
- Network transfer: ~25KB (50 docs × 500 bytes)

**Infinite Scroll**:
- Load next 50 documents when user scrolls near bottom
- Smooth transitions with loading skeletons
- Background preloading of next page
- Progress indicator showing X of Y documents loaded

**Scalability**:
- Support 10,000+ documents per user
- Consistent performance regardless of total count
- Memory usage grows incrementally (not all at once)

### Verification Criteria

**How to Verify Implementation is Complete**:

1. **Database Queries Use Pagination**:
   - Check browser DevTools Network tab
   - Supabase queries include `.range(0, 49)` for first page
   - Subsequent queries use `.range(50, 99)`, `.range(100, 149)`, etc.

2. **Initial Load Speed**:
   - Dashboard loads in <400ms with 10,000 total documents
   - Only 50 documents in initial payload

3. **Infinite Scroll Works**:
   - Scroll to bottom triggers load of next page
   - Skeleton loaders appear while loading
   - New documents append smoothly to grid

4. **State Management**:
   - `allDocuments` state starts with 50 items
   - Grows to 100, 150, 200 as user scrolls
   - `hasMore` and `totalCount` tracked correctly

5. **No Regressions**:
   - Folder navigation still works
   - Search still works
   - Document creation/deletion still works
   - Sorting by recent activity still works

## What We're NOT Doing

**Out of Scope for This Implementation**:

1. **Folder Pagination**: Folders remain fully loaded (typically <50 per user)
2. **Search Pagination**: Search will load all matching results (future optimization)
3. **VirtualizedGrid Changes**: Keep existing virtual rendering as-is
4. **Offline Mode Changes**: IndexedDB adapter behavior unchanged
5. **Block Pagination**: Blocks already use `usePaginatedBlockLoader` (no changes needed)
6. **UI Redesign**: Keep current dashboard layout and styling
7. **Advanced Prefetching**: No predictive loading based on user behavior (future enhancement)
8. **Compression**: No payload compression (future optimization)

## Implementation Approach

### Strategy

Use a **three-layer incremental loading** approach:

```
Layer 1: Initial Load (50 documents)
  ↓ User scrolls
Layer 2: Progressive Loading (next 50 on scroll)
  ↓ Continues scrolling
Layer 3: Background Preloading (next page in advance)
```

### Why This Approach

1. **Leverage Existing Patterns**: `usePaginatedBlockLoader` already implements this pattern successfully
2. **Minimal Code Changes**: Switch adapter + add pagination hook
3. **Graceful Degradation**: Falls back to IndexedDB (no pagination) when offline
4. **No UI Breaking Changes**: Infinite scroll feels seamless to users
5. **Backwards Compatible**: Existing features (search, folders, sorting) continue working

---

## Phase 1: Switch to Paginated Adapter

### Overview
Replace `SupabaseAdapter` with `SupabaseAdapterOptimized` to enable pagination support.

### Changes Required

#### 1. Update storageWrapper.js Imports

**File**: `src/utils/storage/storageWrapper.js`

**Line 2 - Change Import**:
```javascript
// OLD:
import { SupabaseAdapter } from './SupabaseAdapter';

// NEW:
import { SupabaseAdapterOptimized } from './SupabaseAdapterOptimized';
```

#### 2. Update Adapter Instantiation

**File**: `src/utils/storage/storageWrapper.js:161`

```javascript
// OLD:
const supabaseAdapter = new SupabaseAdapter();

// NEW:
const supabaseAdapter = new SupabaseAdapterOptimized();
```

#### 3. Add Pagination Support to Wrapper Methods

**File**: `src/utils/storage/storageWrapper.js:56-57`

**Current**:
```javascript
async loadEntries() {
  return await adapter.getDocuments();
}
```

**New**:
```javascript
async loadEntries(options = {}) {
  // For paginated loading
  if (options.page !== undefined) {
    const userId = adapter.userId;
    const result = await adapter.loadAllDocuments(userId, options);
    return result; // Returns { documents, totalCount, page, pageSize, hasMore }
  }

  // Legacy non-paginated (for backwards compatibility)
  return await adapter.getDocuments();
}
```

#### 4. Add New Method for Paginated Document Loading

**File**: `src/utils/storage/storageWrapper.js` (add after line 191)

```javascript
/**
 * Load documents with pagination support
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page index (0-based)
 * @param {number} options.limit - Items per page (default: 50)
 * @param {string} options.orderBy - Column to sort by (default: 'updated_at')
 * @param {boolean} options.ascending - Sort direction (default: false)
 * @returns {Promise<{documents, totalCount, page, pageSize, hasMore}>}
 */
export async function loadDocumentsPaginated(options = {}) {
  const storageAdapter = await init();

  // Check if adapter supports pagination
  if (storageAdapter.loadDocumentsPaginated) {
    return storageAdapter.loadDocumentsPaginated(options);
  }

  // Fallback for IndexedDB (no pagination)
  const allDocs = await storageAdapter.loadEntries();
  const page = options.page || 0;
  const limit = options.limit || 50;
  const start = page * limit;
  const end = start + limit;

  return {
    documents: allDocs.slice(start, end),
    totalCount: allDocs.length,
    page,
    pageSize: limit,
    hasMore: end < allDocs.length
  };
}
```

#### 5. Update Wrapper to Expose Pagination Method

**File**: `src/utils/storage/storageWrapper.js:56-133` (in createSupabaseWrapper)

Add new method:
```javascript
async loadDocumentsPaginated(options = {}) {
  const userId = adapter.userId;
  return await adapter.loadAllDocuments(userId, options);
}
```

### Success Criteria

#### Automated Verification:
- [x] No TypeScript/ESLint errors: `npm run lint`
- [x] Application builds successfully: `npm run build`
- [x] Import resolves correctly (check browser console for errors)
- [x] SupabaseAdapterOptimized constructor runs without errors

#### Manual Verification:
- [x] Dashboard still loads documents (may load all for now - pagination hook not yet implemented)
- [x] No console errors about missing methods
- [x] Cache still works (check Network tab - should see cached responses)
- [x] Document opening/editing still works
- [x] Folders still load correctly

---

## Phase 2: Implement Pagination Hook

### Overview
Create a custom hook `usePaginatedDashboard` that manages paginated document loading with infinite scroll support, modeled after the existing `usePaginatedBlockLoader` pattern.

### Changes Required

#### 1. Create usePaginatedDashboard Hook

**New File**: `src/hooks/usePaginatedDashboard.js`

```javascript
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContextOptimized';
import { loadDocumentsPaginated } from '../utils/storage/storageWrapper';

/**
 * Hook for paginated dashboard document loading with infinite scroll
 * Modeled after usePaginatedBlockLoader.js pattern
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
    if (!user?.id || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await loadDocumentsPaginated({
        page: 0,
        limit: pageSize,
        orderBy,
        ascending
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
      console.error('Error loading initial documents:', err);
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
    if (!user?.id || loadingRef.current || !hasMore || isLoadingMore) {
      return;
    }

    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const result = await loadDocumentsPaginated({
        page: nextPage,
        limit: pageSize,
        orderBy,
        ascending
      });

      setDocuments(prev => [...prev, ...result.documents]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);

      // Preload next page in background
      if (preloadNextPage && result.hasMore) {
        preloadNextPageInBackground(nextPage + 1);
      }
    } catch (err) {
      console.error('Error loading more documents:', err);
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
    if (!scrollElement || !hasMore || isLoadingMore || !enableInfiniteScroll) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const scrollPosition = scrollTop + clientHeight;
    const threshold = scrollHeight - 200; // Load 200px before bottom

    if (scrollPosition >= threshold) {
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

  return {
    documents,
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
```

### Success Criteria

#### Automated Verification:
- [x] Hook file exists at correct path: `ls src/hooks/usePaginatedDashboard.js`
- [x] No import errors: `npm run build`
- [x] No ESLint warnings: `npm run lint`

#### Manual Verification:
- [x] Hook can be imported in test file without errors
- [x] Hook returns expected properties (documents, isLoading, hasMore, loadMore, etc.)
- [x] Calling `loadInitial()` loads first 50 documents
- [x] Calling `loadMore()` loads next 50 documents
- [x] `hasMore` correctly indicates if more pages available
- [x] Progress tracking shows correct percentages

---

## Phase 3: Integrate Pagination into Dashboard

### Overview
Update the Dashboard component to use the new `usePaginatedDashboard` hook and implement infinite scroll UI.

### Changes Required

#### 1. Update Dashboard Component State Management

**File**: `src/pages/Dashboard.jsx`

**Import the hook** (add to imports around line 38):
```javascript
import { usePaginatedDashboard } from '../hooks/usePaginatedDashboard';
```

**Replace loadEntries logic** (around lines 343-499):

**OLD** (lines 363-417):
```javascript
const loadEntries = useCallback(async () => {
  // ... existing code that loads ALL documents
  const savedEntries = await storageWrapper.getEntries();
  // ... 80+ lines of processing
}, []);
```

**NEW**:
```javascript
// Initialize pagination hook
const {
  documents: paginatedDocuments,
  isLoading: isLoadingDocuments,
  isLoadingMore,
  hasMore,
  loadMore,
  loadInitial,
  checkLoadMore,
  progress
} = usePaginatedDashboard({
  pageSize: 50,
  orderBy: 'updated_at',
  ascending: false,
  enableInfiniteScroll: true,
  preloadNextPage: true
});

// Load initial documents on mount
useEffect(() => {
  loadInitial();
}, [loadInitial]);

// Keep existing folder loading (folders are small, don't paginate)
const loadFolders = useCallback(async () => {
  // ... existing folder loading logic from lines 443-465
}, [user?.id]);

// Combine paginated documents with folders (existing logic)
const entries = useMemo(() => {
  // Filter root documents (no folder_id)
  const rootDocs = paginatedDocuments
    .filter(doc => !doc.folder_id)
    .map(doc => ({ ...doc, type: 'document' }));

  // Populate folders with their documents (existing logic from lines 500-558)
  const populatedFolders = folders.map(populateFolderWithDocuments);

  // Combine and sort by recent activity (existing logic from lines 549-564)
  const combined = [...populatedFolders, ...rootDocs].sort((a, b) => {
    const aTime = new Date(
      a.effectiveUpdatedAt || a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0
    );
    const bTime = new Date(
      b.effectiveUpdatedAt || b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0
    );
    return bTime - aTime;
  });

  return combined;
}, [paginatedDocuments, folders]);

// Update allDocuments state (used by other components)
useEffect(() => {
  setAllDocuments(paginatedDocuments);
}, [paginatedDocuments]);
```

#### 2. Add Infinite Scroll Trigger

**File**: `src/pages/Dashboard.jsx`

**Add scroll event listener** (after the grid rendering, around line 1556):

```javascript
// In the main content area, after VirtualizedGrid/DocumentGridRedesigned
useEffect(() => {
  const scrollElement = document.querySelector('.dashboard-scroll-container');
  if (!scrollElement) return;

  const handleScroll = () => {
    checkLoadMore(scrollElement);
  };

  scrollElement.addEventListener('scroll', handleScroll, { passive: true });
  return () => scrollElement.removeEventListener('scroll', handleScroll);
}, [checkLoadMore]);
```

**Add scroll container class to grid wrapper** (around line 1325):

```javascript
// OLD:
<div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
  <div className="p-6 h-full overflow-auto">

// NEW: Add dashboard-scroll-container class
<div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
  <div className="dashboard-scroll-container p-6 h-full overflow-auto">
```

#### 3. Add Loading More UI

**File**: `src/pages/Dashboard.jsx`

**Add after the grid** (around line 1558, inside the grid container):

```javascript
{/* Infinite Scroll Loading State */}
{isLoadingMore && (
  <div className="col-span-full py-6 flex justify-center">
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span>Loading more documents...</span>
    </div>
  </div>
)}

{/* End of List Indicator */}
{!hasMore && paginatedDocuments.length > 0 && (
  <div className="col-span-full py-6 text-center text-sm text-gray-500">
    You've reached the end • {progress.loaded} documents loaded
  </div>
)}

{/* Progress Indicator (optional, shows while more to load) */}
{hasMore && paginatedDocuments.length > 0 && (
  <div className="col-span-full py-2 text-center text-xs text-gray-500">
    Showing {progress.loaded} of {progress.total} documents ({Math.round(progress.percentage)}%)
  </div>
)}
```

#### 4. Update Loading State Logic

**File**: `src/pages/Dashboard.jsx:1301-1366`

**Update initial loading check**:

```javascript
// OLD:
if (isLoading && !isInitialized.current) {

// NEW:
if (isLoadingDocuments && documents.length === 0) {
```

This ensures skeleton shows only on true initial load, not when loading more pages.

#### 5. Handle Sorting and Folders with Pagination

**File**: `src/pages/Dashboard.jsx`

**Important**: Keep folders separate from document pagination:

```javascript
// Load folders separately (they're small, <50 per user)
useEffect(() => {
  if (user?.id) {
    loadFolders();
  }
}, [user?.id, loadFolders]);

// Folders use existing useFolders hook (no changes needed)
const { folders, loading: foldersLoading } = useFolders();
```

**Sorting behavior**:
- Documents within each page are sorted by database (ORDER BY updated_at DESC)
- Client-side sorting happens AFTER folder/document combination
- Folder `effectiveUpdatedAt` calculation remains unchanged (lines 500-537)

### Success Criteria

#### Automated Verification:
- [x] Dashboard component compiles: `npm run build`
- [x] No ESLint errors: `npm run lint`
- [x] No TypeScript errors (if applicable)
- [x] No console errors on dashboard load

#### Manual Verification:
- [x] Dashboard loads first 50 documents initially
- [x] Scroll to bottom triggers loading of next 50 documents
- [x] "Loading more documents..." appears while loading next page
- [x] New documents append to grid smoothly
- [x] Progress indicator shows correct count (e.g., "Showing 100 of 250")
- [x] "You've reached the end" appears when all documents loaded
- [x] Folders still work (open folder, navigate, etc.)
- [x] Document sorting by recent activity still works
- [x] Search still works (may load all results - optimization later)
- [x] Creating new document shows immediately (optimistic update)
- [x] Deleting document removes from list

---

## Phase 4: Add Loading Skeletons for Infinite Scroll

### Overview
Add skeleton loaders that appear while loading more documents to provide visual feedback, similar to how `usePaginatedBlockLoader` adds block skeletons.

### Changes Required

#### 1. Update usePaginatedDashboard Hook to Include Skeletons

**File**: `src/hooks/usePaginatedDashboard.js`

**Modify return value** (around line 150):

```javascript
return {
  documents,
  // Add loading skeletons when loading more
  documentsWithSkeletons: isLoadingMore
    ? [...documents, ...Array(10).fill({ id: 'skeleton', type: 'skeleton' })]
    : documents,
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
```

#### 2. Update Dashboard to Render Skeletons

**File**: `src/pages/Dashboard.jsx`

**Use documentsWithSkeletons instead of documents**:

```javascript
// In the entries useMemo:
const entries = useMemo(() => {
  const rootDocs = documentsWithSkeletons  // Instead of paginatedDocuments
    .filter(doc => !doc.folder_id)
    .map(doc => ({ ...doc, type: doc.type || 'document' }));

  // ... rest of logic
}, [documentsWithSkeletons, folders]);
```

#### 3. Handle Skeleton Rendering in Grid

**File**: `src/components/DocumentGridRedesigned.jsx` or `src/components/VirtualizedGrid.jsx`

**Add skeleton detection**:

```javascript
// In the render loop:
entries.map((entry) => {
  // Render skeleton card
  if (entry.type === 'skeleton') {
    return entry.type === 'folder' ? (
      <FolderCardSkeleton key={`skeleton-${Math.random()}`} />
    ) : (
      <DocumentCardSkeleton key={`skeleton-${Math.random()}`} />
    );
  }

  // Render real card
  return entry.type === 'folder' ? (
    <FolderCard key={entry.id} folder={entry} />
  ) : (
    <EntryCardRedesigned key={entry.id} entry={entry} />
  );
})
```

### Success Criteria

#### Automated Verification:
- [x] No build errors: `npm run build`
- [x] No linting issues: `npm run lint`

#### Manual Verification:
- [x] Scroll to bottom shows 10 skeleton cards while loading
- [x] Skeletons replaced with real documents when loading completes
- [x] Skeleton animation (pulse) is visible
- [x] No flickering or layout shifts
- [x] Skeletons match actual card layout (height, spacing)

---

## Phase 5: Testing and Optimization

### Overview
Test the pagination implementation with various data sizes and optimize performance based on findings.

### Testing Strategy

#### 1. Create Test Data

**Script**: Create a test script to generate documents for testing

**New File**: `scripts/generate-test-documents.js`

```javascript
// Script to create test documents for pagination testing
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY
);

async function generateDocuments(userId, count) {
  console.log(`Generating ${count} test documents...`);

  const documents = Array.from({ length: count }, (_, i) => ({
    user_id: userId,
    title: `Test Document ${i + 1}`,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ['test', `batch-${Math.floor(i / 100)}`],
    metadata: { blockCount: Math.floor(Math.random() * 50) }
  }));

  // Insert in batches of 100
  for (let i = 0; i < documents.length; i += 100) {
    const batch = documents.slice(i, i + 100);
    const { error } = await supabase.from('documents').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i / 100}:`, error);
    } else {
      console.log(`Inserted batch ${i / 100 + 1} (${batch.length} documents)`);
    }
  }

  console.log('Done!');
}

// Usage: node scripts/generate-test-documents.js <userId> <count>
const userId = process.argv[2];
const count = parseInt(process.argv[3]) || 1000;

if (!userId) {
  console.error('Usage: node scripts/generate-test-documents.js <userId> <count>');
  process.exit(1);
}

generateDocuments(userId, count);
```

#### 2. Performance Test Cases

**Test with varying document counts**:

| Test Case | Document Count | Expected Initial Load | Expected Scroll Load | Success Criteria |
|-----------|---------------|----------------------|---------------------|------------------|
| Small | 20 documents | <100ms | N/A (all loaded) | No pagination triggered |
| Medium | 100 documents | <100ms | <100ms per page | Smooth scrolling, no jank |
| Large | 1,000 documents | <150ms | <100ms per page | Consistent performance |
| Extra Large | 10,000 documents | <200ms | <100ms per page | No degradation over time |

**Metrics to Track**:
- Time to First Render (TTFR)
- Time to Interactive (TTI)
- Network payload size (first page vs total)
- Memory usage (initial vs after loading all)
- Scroll FPS (should maintain 60fps)
- Number of re-renders

#### 3. Manual Test Checklist

**Basic Functionality**:
- [ ] Initial load shows 50 documents
- [ ] Scroll to bottom loads next 50
- [ ] Can load all pages until end
- [ ] "End of list" message appears correctly
- [ ] Progress indicator accurate

**Edge Cases**:
- [ ] Works with 0 documents (empty state)
- [ ] Works with exactly 50 documents (1 page)
- [ ] Works with 51 documents (1.02 pages)
- [ ] Works with thousands of documents
- [ ] Handles network errors gracefully
- [ ] Works offline (falls back to IndexedDB)

**Integration**:
- [ ] Creating document adds to list immediately
- [ ] Updating document updates in list
- [ ] Deleting document removes from list
- [ ] Folders still work correctly
- [ ] Search still works (may load all - note for future)
- [ ] Sorting by recent activity works
- [ ] Opening document loads blocks correctly

**Performance**:
- [ ] No memory leaks (check DevTools Memory)
- [ ] No excessive re-renders (check React DevTools Profiler)
- [ ] Smooth scrolling (60fps in DevTools Performance)
- [ ] Cache works (check Network tab for 304s)
- [ ] Preloading works (next page loads before scroll)

**Browser Compatibility**:
- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

#### 4. Performance Optimization Opportunities

**If Tests Reveal Issues**:

1. **Slow Queries**: Add database indexes
   ```sql
   CREATE INDEX IF NOT EXISTS idx_documents_user_updated
   ON documents(user_id, updated_at DESC)
   WHERE deleted_at IS NULL;
   ```

2. **High Memory**: Implement memory management
   - Evict documents beyond 5 pages loaded
   - Keep only visible range + buffer

3. **Slow Scrolling**: Reduce re-renders
   - Memoize expensive calculations
   - Use React.memo on card components

4. **Large Payloads**: Request only needed fields
   ```javascript
   .select('id, title, tags, created_at, updated_at, folder_id, is_favorite')
   // Exclude metadata, is_template, project_id if not needed
   ```

5. **Slow Initial Load**: Reduce page size for mobile
   ```javascript
   const isMobile = window.innerWidth < 768;
   const pageSize = isMobile ? 20 : 50;
   ```

### Success Criteria

#### Automated Verification:
- [ ] All unit tests pass: `npm test` (if tests exist)
- [ ] No console errors during test run
- [ ] Lighthouse Performance score >90

#### Manual Verification:
- [ ] All manual test cases pass
- [ ] Performance targets met for all document counts
- [ ] No regressions in existing features
- [ ] Browser compatibility verified
- [ ] Mobile experience smooth

---

## Testing Strategy

### Unit Tests

**If unit testing framework exists**, add tests for:

1. **usePaginatedDashboard Hook**:
   - Returns correct initial state
   - loadInitial() loads first page
   - loadMore() loads next page
   - hasMore correctly indicates more pages
   - Progress tracking calculates correctly

2. **storageWrapper.loadDocumentsPaginated**:
   - Returns paginated results
   - Handles IndexedDB fallback
   - Respects page/limit/orderBy parameters

### Integration Tests

**Manual integration testing**:

1. **Dashboard Load Flow**:
   - User opens dashboard
   - First 50 documents load
   - User scrolls down
   - Next 50 documents load
   - Repeat until all loaded

2. **CRUD Operations with Pagination**:
   - Create document → appears at top of list
   - Update document → position updates if needed
   - Delete document → removes from list
   - All while pagination active

3. **Folder Integration**:
   - Open folder
   - Folder documents use pagination
   - Navigate between folders
   - Pagination resets correctly

### Performance Testing

**Browser DevTools**:

1. **Network Tab**:
   - Verify queries include `.range()`
   - Check payload sizes
   - Confirm caching works (304 responses)

2. **Performance Tab**:
   - Record scrolling session
   - Verify 60fps maintained
   - Check for long tasks (>50ms)

3. **Memory Tab**:
   - Heap snapshot before loading
   - Heap snapshot after loading 500 docs
   - Verify no detached DOM nodes

**Lighthouse**:
- Run Lighthouse audit on dashboard
- Target: Performance score >90
- Check Time to Interactive

## Performance Considerations

### Database Optimization

**Index Recommendations**:

```sql
-- Composite index for user + sort column
CREATE INDEX IF NOT EXISTS idx_documents_user_updated
ON documents(user_id, updated_at DESC)
WHERE deleted_at IS NULL;

-- Index for folder navigation
CREATE INDEX IF NOT EXISTS idx_documents_folder
ON documents(user_id, folder_id, updated_at DESC)
WHERE deleted_at IS NULL;
```

**Why**: Pagination queries with ORDER BY + LIMIT + OFFSET benefit from covering indexes.

### Memory Management

**Current Approach**: Store all loaded documents in state (grows indefinitely)

**Future Optimization** (out of scope, but noted):
- Implement virtual scrolling with windowing
- Evict documents beyond N pages from viewport
- Keep only visible range + buffer in memory

### Caching Strategy

**Three-Layer Cache**:

1. **Memory Cache** (SupabaseAdapterOptimized):
   - 5-minute TTL per page
   - Keyed by `docs:${userId}:${page}:${limit}:${orderBy}`

2. **Session Cache** (React state):
   - Current pagination state
   - Recently loaded documents

3. **IndexedDB Cache** (offline fallback):
   - All synced documents
   - Used when offline

**Cache Invalidation**:
- Document created/updated/deleted → clear relevant pages
- Manual refresh → clear all caches
- TTL expired → fetch from database

### Network Optimization

**Request Batching**:
- Already implemented in SupabaseAdapterOptimized
- Batch multiple saves with 50ms delay

**Preloading Strategy**:
- Preload next page when user reaches 80% of current page
- Non-blocking background fetch
- Populates cache before user needs it

**Payload Optimization**:
- Exclude blocks from initial query (already done)
- Only request needed fields
- Future: compress large payloads with gzip

## Migration Notes

### Rollout Strategy

**Phase 1: Development Testing**
- Enable pagination in development environment
- Test with team members
- Gather feedback on UX

**Phase 2: Beta Release**
- Enable for subset of users (e.g., power users with >500 docs)
- Monitor performance metrics
- Fix issues before wider rollout

**Phase 3: General Availability**
- Enable for all users
- Monitor error rates and performance
- Keep fallback to non-paginated for emergencies

### Backwards Compatibility

**storageWrapper.getEntries()** maintains backwards compatibility:
- Still works without pagination (returns all documents)
- New code can pass `options` to enable pagination
- IndexedDB adapter works unchanged (no pagination)

**Graceful Degradation**:
- If SupabaseAdapterOptimized fails → falls back to SupabaseAdapter
- If pagination fails → loads all documents (old behavior)
- If offline → IndexedDB without pagination

### Data Migration

**No database migration needed**:
- Uses existing `documents` table
- No schema changes required
- No data transformation needed

**Code Migration**:
1. Deploy new code with feature flag OFF
2. Test in production (no impact yet)
3. Enable feature flag for 1% of users
4. Gradually increase to 100%

### Rollback Plan

**If Issues Arise**:

1. **Disable Feature Flag**:
   - Toggle flag to use old non-paginated loading
   - Immediate rollback, no code deploy needed

2. **Revert Code Changes**:
   - Git revert to previous commit
   - Restore old SupabaseAdapter import
   - Redeploy

3. **Database Rollback**:
   - No database changes, so no rollback needed

**Monitoring**:
- Error rate (should be <1%)
- Query performance (should be faster)
- User complaints (should be fewer)

## References

- Original research: `thoughts/shared/research/2025-10-26_18-43-48_dashboard-data-fetching-optimization.md`
- Similar implementation: `src/hooks/usePaginatedBlockLoader.js:1-221`
- Adapter with pagination: `src/utils/storage/SupabaseAdapterOptimized.js:60-105`
- Infinite scroll component: `src/components/InfiniteScrollDocuments.jsx:1-91`
- Virtual grid rendering: `src/components/VirtualizedGrid.jsx:1-445`
- Performance docs: `docs/DOCUMENT_RENDERING_PERFORMANCE_MASTERPLAN.md`
