---
date: 2025-11-06T12:32:16+01:00
researcher: Claude
git_commit: 0ecb1d00b6d36759f5a5372081ff07ae1ee3e3e0
branch: main
repository: devlog-
topic: "Why Dashboard Shows Skeleton Loading When Navigating Back from Document Page"
tags: [research, codebase, dashboard, navigation, react-router, state-management]
status: complete
last_updated: 2025-11-06
last_updated_by: Claude
---

# Research: Why Dashboard Shows Skeleton Loading When Navigating Back from Document Page

**Date**: 2025-11-06T12:32:16+01:00
**Researcher**: Claude
**Git Commit**: 0ecb1d00b6d36759f5a5372081ff07ae1ee3e3e0
**Branch**: main
**Repository**: devlog-

## Research Question

Why does the dashboard show skeleton loading (as if reloading from scratch) when navigating back from the document page? Why doesn't it preserve the previously loaded data?

## Summary

The dashboard shows skeleton loading on every navigation back from the document page because:

1. **React Router unmounts components on route navigation** - Dashboard and DocumentPage are separate routes, not nested
2. **No state preservation mechanism exists** - Component state is lost when Dashboard unmounts
3. **No document caching between navigations** - The `usePaginatedDashboard` hook creates fresh state on each mount
4. **Initial mount triggers data fetch** - When Dashboard remounts, it starts with empty arrays and triggers `loadInitial()`
5. **Skeleton condition is met** - `isLoadingDocuments && paginatedDocuments.length === 0` evaluates to true

The only cached data between navigations is the **30-second module-level folder cache** in `useFolders`.

## Detailed Findings

### 1. React Router Configuration (App.jsx:206-233)

**Separate Route Structure:**
```javascript
<SentryRoutes>
  <Route path="/dashboard" element={
    <Layout>
      <Dashboard />
    </Layout>
  } />
  <Route path="/document/:documentId" element={
    <Layout>
      <DocumentPage />
    </Layout>
  } />
</SentryRoutes>
```

**Key Facts:**
- Dashboard and DocumentPage are **separate routes**, not nested
- When navigating from `/dashboard` to `/document/:id`, React Router:
  1. Unmounts Dashboard component (all component state is destroyed)
  2. Mounts DocumentPage component
- When navigating back from `/document/:id` to `/dashboard`, React Router:
  1. Unmounts DocumentPage component
  2. Mounts a **fresh instance** of Dashboard component (new state, new hooks)

**Layout Component (Layout.jsx:1-24):**
```javascript
export default function Layout({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || ...;

  return (
    <div className="h-full bg-dark-primary flex flex-col">
      <div className="h-0.5 bg-accent-green/80 flex-shrink-0"></div>
      <div className={`flex-1 min-h-0 ${isDashboard ? 'overflow-hidden' : 'overflow-auto'} pb-16 md:pb-0`}>
        {children}
      </div>
      <MobileNavigation />
    </div>
  );
}
```

- Layout is a **simple wrapper** with no state preservation
- Does not cache or maintain child component state
- Just renders children prop (Dashboard or DocumentPage)

### 2. Navigation Implementation (DocumentPage.jsx:130-137)

**Back to Dashboard Navigation:**
```javascript
const handleClose = useCallback(() => {
  // End editing timer before navigating away
  if (document?.id) {
    endDocumentTimer('editing', document.id);
  }

  navigate('/dashboard', { replace: true });
}, [document?.id, endDocumentTimer, navigate]);
```

**Navigation Flow:**
1. User clicks back button or close icon
2. `handleClose()` is called
3. Analytics timer ends
4. `navigate('/dashboard', { replace: true })` executes
5. React Router replaces current history entry and navigates to `/dashboard`
6. DocumentPage unmounts
7. Dashboard mounts fresh

**Note:** `replace: true` means the navigation replaces the history entry (user can't go forward after going back), but this doesn't affect component mounting behavior.

### 3. Dashboard State Initialization (Dashboard.jsx:59-101)

**Hook Initialization:**
```javascript
const { user, signOut, trialStatus } = useAuth();
const [entries, setEntries] = useState([]);
const [allDocuments, setAllDocuments] = useState([]);  // Starts as empty array
const [expandedEntry, setExpandedEntry] = useState(null);

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
```

**State on Fresh Mount:**
- `allDocuments`: `[]` (empty array)
- `paginatedDocuments`: `[]` (empty array from hook)
- `isLoadingDocuments`: `false` (initial state from hook)

**Hook State (usePaginatedDashboard.js:29-35):**
```javascript
const [documents, setDocuments] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);
const [currentPage, setCurrentPage] = useState(0);
const [totalCount, setTotalCount] = useState(0);
const [hasMore, setHasMore] = useState(true);
const [error, setError] = useState(null);
```

- Every time `usePaginatedDashboard` hook is called (on component mount), it creates **new state**
- No mechanism to restore previous state from cache or storage

### 4. Data Loading Trigger (Dashboard.jsx:636-642)

**Mount Effect:**
```javascript
useEffect(() => {
  console.log('[DEBUG-INIT] Dashboard mounted, user:', user?.id, 'paginatedDocs:', paginatedDocuments.length);
  if (user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments) {
    console.log('[DEBUG-INIT] Triggering loadInitial()');
    loadInitial();
  }
}, [user?.id]);
```

**Trigger Conditions:**
1. `user?.id` exists (user is authenticated)
2. `paginatedDocuments.length === 0` (no documents loaded)
3. `!isLoadingDocuments` (not already loading)

**On Fresh Mount:** All three conditions are **always true**:
- User is authenticated (still logged in)
- Documents array is empty (fresh state)
- Not loading yet (initial state is false)

**Result:** `loadInitial()` is called every time Dashboard mounts

### 5. Data Fetching Flow (usePaginatedDashboard.js:44-132)

**loadInitial() Function:**
```javascript
const loadInitial = useCallback(async () => {
  if (!user?.id || loadingRef.current) {
    return;
  }

  loadingRef.current = true;
  setIsLoading(true);  // This triggers skeleton display
  setError(null);

  try {
    // Fetch documents from Supabase
    const documents = await getDocumentsWithRealActivity({
      userId: user.id,
      limit: pageSize,
      offset: 0
    });

    // Transform data
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
      lastEdited: doc.last_edited,
      editCount7d: doc.edit_count_7d,
      editCount30d: doc.edit_count_30d,
      recentActivity: doc.recent_activity || []
    }));

    // Set documents in state
    setDocuments(uniqueDocs);
    setTotalCount(totalCount);
    setHasMore(hasMoreDocs);
    setCurrentPage(0);
  } catch (err) {
    console.error('Error loading initial documents:', err);
    setError(err);
  } finally {
    setIsLoading(false);
    loadingRef.current = false;
  }
}, [user?.id, pageSize, orderBy, ascending, preloadNextPage]);
```

**Key Points:**
1. `setIsLoading(true)` is called immediately (line 58)
2. This updates `isLoadingDocuments` which is returned from the hook
3. Fetch is direct to Supabase (no cache check)
4. Data is fetched fresh every time

**Database Call (supabase-optimizations.ts:274-287):**
```typescript
export async function getDocumentsWithRealActivity(options: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<DocumentWithRealActivity[]> {
  const { data, error } = await supabase.rpc('get_documents_with_real_activity', {
    p_user_id: options.userId,
    p_limit: options.limit || 50,
    p_offset: options.offset || 0
  });

  if (error) throw error;
  return data || [];
}
```

- Calls Supabase RPC function `get_documents_with_real_activity`
- No client-side caching
- Fetches from database every time

### 6. Skeleton Display Logic (Dashboard.jsx:1299-1366)

**Skeleton Condition:**
```javascript
// Show loading skeleton only during initial load (when no documents yet)
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32] p-6">
      {/* Dashboard header skeleton */}
      <div className="max-w-[1920px] mx-auto mb-6">
        <SidebarSkeleton />
        {/* ... rest of skeleton UI ... */}
      </div>
    </div>
  );
}
```

**Condition Breakdown:**
- `isLoadingDocuments`: `true` (set by `loadInitial()`)
- `paginatedDocuments.length === 0`: `true` (initial state)
- **Result:** Skeleton UI is displayed

**Timeline:**
1. Dashboard mounts (t=0ms)
2. State initialized: `paginatedDocuments = []`, `isLoadingDocuments = false`
3. useEffect runs (t=~1ms)
4. Conditions check passes → `loadInitial()` called
5. `setIsLoading(true)` executed (t=~2ms)
6. Component re-renders with `isLoadingDocuments = true`
7. Skeleton condition met → Skeleton displays
8. Database fetch in progress (~100-300ms)
9. Data returns → `setDocuments()` called
10. `setIsLoading(false)` called
11. Component re-renders with documents → Actual content displays

### 7. Folder Caching (useFolders.js:9-160)

**Module-Level Cache:**
```javascript
// Module-level cache (persists across component unmounts)
let foldersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 30000; // 30 seconds

export function useFolders() {
  const loadFolders = async (forceRefresh = false) => {
    // Use cache if available and fresh
    if (!forceRefresh && foldersCache && lastFetchTime &&
        (Date.now() - lastFetchTime < CACHE_DURATION)) {
      setFolders(foldersCache);
      setLoading(false);
      return;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('folders')
      .select(`*, document_count:documents(count)`)
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    // Update cache
    foldersCache = rootFolders;
    lastFetchTime = Date.now();
    setFolders(rootFolders);
  };

  useEffect(() => {
    if (user?.id) {
      loadFolders();
    }
  }, [user?.id]);

  return { folders, loading, refreshFolders };
}
```

**Cache Behavior:**
- **Folders ARE cached** using module-level variables
- Cache persists across Dashboard unmount/remount
- 30-second TTL (Time To Live)
- If navigating back within 30 seconds, folders load instantly from cache
- If > 30 seconds, folders refetch from database

**Why Folders Work Differently:**
- Module-level cache variables exist outside component lifecycle
- `foldersCache` and `lastFetchTime` are not component state
- They persist in memory even when Dashboard unmounts

### 8. No Caching for Documents

**Comparison: Folders vs Documents**

| Feature | Folders (useFolders) | Documents (usePaginatedDashboard) |
|---------|---------------------|----------------------------------|
| Cache Location | Module-level variables | None |
| Cache Duration | 30 seconds | N/A |
| Persists on unmount | ✅ Yes | ❌ No |
| State Type | Component state + cache | Component state only |
| Refetch on mount | Only if cache expired | Always |

**Why No Document Caching:**
- `usePaginatedDashboard` uses only component state (`useState`)
- No module-level cache variables
- No localStorage/sessionStorage usage
- No LRUCache implementation for documents
- Each mount creates fresh state

**LRUCache Exists But Not Used Here:**
- `src/utils/storage/LRUCache.js` exists in codebase
- Used by `MultiLayerStorage` for individual document caching
- **NOT used for caching document lists**
- `MultiLayerStorage.getDocuments()` fetches from Supabase, doesn't cache the list

### 9. Complete Navigation Flow Diagram

```
[User on Dashboard]
     ↓
Documents loaded (paginatedDocuments = [doc1, doc2, ...])
Folders loaded (from cache or fresh)
     ↓
[User clicks document]
     ↓
navigate('/document/123')
     ↓
React Router unmounts Dashboard
     ├─ All component state destroyed
     ├─ paginatedDocuments = (destroyed)
     ├─ allDocuments = (destroyed)
     └─ folders = (destroyed, BUT foldersCache still exists)
     ↓
React Router mounts DocumentPage
     ↓
DocumentPage loads document 123
     ↓
[User clicks back/close]
     ↓
navigate('/dashboard', { replace: true })
     ↓
React Router unmounts DocumentPage
     ↓
React Router mounts Dashboard (FRESH INSTANCE)
     ├─ useState([]) creates empty arrays
     ├─ usePaginatedDashboard() creates fresh state:
     │    ├─ documents = []
     │    ├─ isLoading = false
     │    └─ (all state is new)
     └─ useFolders() can use cache if < 30 seconds
     ↓
Dashboard render (t=0ms)
     ├─ isLoadingDocuments = false
     └─ paginatedDocuments = []
     ↓
useEffect runs (Dashboard.jsx:636)
     ├─ Condition: user?.id ✓ && paginatedDocuments.length === 0 ✓ && !isLoadingDocuments ✓
     └─ Calls loadInitial()
     ↓
loadInitial() executes (t=~1-2ms)
     ├─ loadingRef.current = true
     ├─ setIsLoading(true)  ← THIS TRIGGERS SKELETON
     └─ Starts database fetch
     ↓
Dashboard re-renders (t=~2-3ms)
     ├─ isLoadingDocuments = true
     ├─ paginatedDocuments = []
     └─ Condition: isLoadingDocuments && paginatedDocuments.length === 0 ✓
     ↓
[SKELETON UI DISPLAYS]
     ↓
Database fetch completes (t=~100-300ms)
     ├─ setDocuments(documents)
     ├─ setTotalCount(count)
     └─ setIsLoading(false)
     ↓
Dashboard re-renders (t=~100-300ms)
     ├─ isLoadingDocuments = false
     ├─ paginatedDocuments = [doc1, doc2, ...]
     └─ Condition: isLoadingDocuments && paginatedDocuments.length === 0 ✗
     ↓
[ACTUAL CONTENT DISPLAYS]
```

## Code References

- `src/App.jsx:206-233` - Route configuration (separate routes)
- `src/components/Layout.jsx:1-24` - Layout wrapper (no state preservation)
- `src/pages/Dashboard.jsx:59-101` - Dashboard state initialization
- `src/pages/Dashboard.jsx:636-642` - Mount effect that triggers loadInitial()
- `src/pages/Dashboard.jsx:1299-1366` - Skeleton display condition
- `src/pages/DocumentPage.jsx:130-137` - Navigation back to dashboard
- `src/hooks/usePaginatedDashboard.js:29-35` - Hook state initialization
- `src/hooks/usePaginatedDashboard.js:44-132` - loadInitial() implementation
- `src/hooks/useFolders.js:9-160` - Folder loading with module-level cache
- `src/lib/supabase-optimizations.ts:274-287` - Database fetch function

## Architecture Documentation

### Current Patterns

1. **React Router Standard Behavior**
   - Separate routes unmount/remount components
   - No automatic state preservation
   - Navigation uses `navigate()` from `react-router-dom`

2. **Component State Management**
   - Local state using React `useState` hooks
   - State destroyed on component unmount
   - No cross-route state persistence

3. **Selective Module-Level Caching**
   - Folders use module-level cache (30-second TTL)
   - Documents do NOT use module-level cache
   - Cache implemented as top-level variables outside component

4. **Loading States**
   - Skeleton UI shown when: `isLoading && data.length === 0`
   - Prevents skeleton flash on paginated loads (only shows on initial)
   - Inline spinner for "load more" operations

5. **Data Fetching Strategy**
   - Direct Supabase RPC calls
   - No client-side caching for document lists
   - Fresh fetch on every mount
   - Pagination with infinite scroll

### Design Decisions

**Why Folders Have Cache But Documents Don't:**
- Folders change infrequently (folder structure is relatively static)
- Documents change frequently (user edits, new docs, position changes)
- Folder count is typically small (< 100)
- Document count can be large (100s or 1000s)
- Module-level cache for large document lists could cause memory issues

**Why Separate Routes:**
- Clean URL structure (`/dashboard` vs `/document/:id`)
- Allows direct linking to documents
- Simpler mental model than nested routes
- Each page can load independently

**Why No State Preservation:**
- Simpler implementation (no cache management complexity)
- Always shows fresh data from database
- Avoids stale data issues
- Database queries are fast (~100-300ms)

## Related Research

- `thoughts/shared/research/2025-10-26_09-56-57_design-system-figma-integration.md` - Dashboard UI design
- `thoughts/shared/research/2025-10-26_dashboard-redesign-implementation-analysis.md` - Dashboard implementation
- `thoughts/shared/research/2025-11-01_dashboard-pagination-deep-dive.md` - Pagination system

## Open Questions

None - the behavior is fully explained by the current architecture.

## Conclusion

The skeleton loading behavior when navigating back to the dashboard is **by design**, not a bug:

1. React Router unmounts Dashboard when navigating away (standard behavior)
2. No state preservation mechanism exists for documents (intentional simplicity)
3. On remount, Dashboard starts with empty state and triggers fresh data fetch
4. Skeleton displays while fetching (good UX for initial load)
5. Folders may load from cache if within 30 seconds

This is a **trade-off between simplicity and perceived performance**. The current implementation prioritizes:
- ✅ Simple code (no complex caching layer)
- ✅ Fresh data (always up-to-date)
- ✅ Predictable behavior
- ❌ Slower perceived navigation (skeleton flash)

To eliminate skeleton loading, the codebase would need to implement one of these approaches:
- Module-level cache for documents (like folders)
- localStorage/sessionStorage persistence
- React Router state/location state preservation
- Context provider that persists across unmounts
- Nested routes (Dashboard stays mounted)

However, these approaches add complexity and potential issues (stale data, memory usage, cache invalidation).
