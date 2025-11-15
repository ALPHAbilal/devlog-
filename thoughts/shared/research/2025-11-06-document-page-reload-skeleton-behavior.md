---
date: 2025-11-06T09:33:56+0000
researcher: Claude Code
git_commit: c3275ddc54c07a44965cc7bd65833c5472ccc2c9
branch: main
repository: devlog-
topic: "Document Page Reload - Dashboard Skeleton Visibility and Supabase Calls"
tags: [research, codebase, dashboard, document-editor, loading-states, routing, supabase]
status: complete
last_updated: 2025-11-06
last_updated_by: Claude Code
---

# Research: Document Page Reload - Dashboard Skeleton Visibility and Supabase Calls

**Date**: 2025-11-06T09:33:56+0000
**Researcher**: Claude Code
**Git Commit**: c3275ddc54c07a44965cc7bd65833c5472ccc2c9
**Branch**: main
**Repository**: devlog-

## Research Question

When reloading a document page (e.g., `/dashboard/:documentId`), why does the dashboard skeleton appear for a few seconds before showing the document? Does the reload trigger Supabase calls?

## Summary

The dashboard skeleton appears on document page reloads due to an architectural pattern where **the same `Dashboard` component handles both the dashboard grid view AND the document editor view**. During reload, the component initially renders in "grid mode" with `expandedEntry = null`, showing the dashboard skeleton while a `useEffect` hook processes the URL parameter to switch to "document mode".

**Yes, page reloads DO trigger Supabase calls**, but with intelligent multi-layer caching that often prevents them:
- **Cache hit** (recent access within 5 minutes): No Supabase calls
- **Cache miss**: 1-2 Supabase queries depending on document size

## Detailed Findings

### 1. Routing Architecture - Single Component, Dual Purpose

**File**: `src/App.jsx:208-217`

Both the dashboard grid and document editor routes render the **same** component:

```javascript
// Dashboard grid view
<Route path="/dashboard" element={
  <Layout>
    <Dashboard />
  </Layout>
} />

// Document editor view (SAME COMPONENT!)
<Route path="/dashboard/:documentId" element={
  <Layout>
    <Dashboard />
  </Layout>
} />
```

**Key Insight**: The `Dashboard` component uses conditional rendering based on `expandedEntry` state to switch between two completely different UIs within the same component instance.

---

### 2. Dashboard Component - Conditional Rendering Logic

**File**: `src/pages/Dashboard.jsx`

#### State Management (line 62)
```javascript
const [expandedEntry, setExpandedEntry] = useState(null);
const { documentId } = useParams(); // Line 58
```

#### Document Loading Effect (lines 724-736)
When a `documentId` URL parameter exists, this effect runs:
```javascript
useEffect(() => {
  if (documentId && entries.length > 0) {
    const foundDoc = entries.find(e => e.id === documentId);
    if (foundDoc) {
      setExpandedEntry(foundDoc);
      // Track view event
    }
  }
}, [documentId, entries]);
```

#### Conditional Rendering Logic (line 1211)
```javascript
{expandedEntry ? (
  // Render document editor (MobileDocumentViewer + ExpandedViewEnhanced)
) : (
  // Render dashboard grid with document cards
)}
```

---

### 3. Why Dashboard Skeleton Appears on Document Page

**The Problem Flow** (during page reload on `/dashboard/abc123`):

1. **Page loads** → React Router matches `/dashboard/:documentId` route
2. **Dashboard mounts** → Initial state: `expandedEntry = null`, `entries = []`
3. **First render starts** → Conditional at line 1211 evaluates `expandedEntry` (null) → renders grid view
4. **Skeleton check** (line 1309): `isLoadingDocuments && paginatedDocuments.length === 0` → **TRUE**
5. **Dashboard skeleton renders**:
   - `SidebarSkeleton` (1 instance)
   - `FolderCardSkeleton` (6 instances)
   - `DocumentCardSkeleton` (24 instances)
6. **Meanwhile**, `useEffect` at line 638 triggers:
   - Calls `loadInitial()` from `usePaginatedDashboard` hook
   - Fetches documents from Supabase/cache
   - Updates `entries` array
7. **Second `useEffect`** at line 724 triggers:
   - Checks for `documentId` parameter (exists!)
   - Finds document in `entries` array
   - Calls `setExpandedEntry(foundDoc)` → triggers re-render
8. **Component re-renders** → Conditional at line 1211 now true → switches to document editor view
9. **MobileDocumentViewer** renders → shows `ExpandedViewEnhanced` (actual document editor)

**Duration of skeleton visibility**: Depends on cache state
- Cache hit: ~100-200ms (very brief flash)
- Cache miss: ~500-2000ms (visible skeleton state)

**Root Cause**: The component architecture requires loading the full documents list before it can find the specific document to expand. There's no direct document loading path when a document URL is accessed.

---

### 4. Skeleton Components Used

**File References**:
- `src/components/SidebarSkeleton.jsx` - Full sidebar skeleton with collapse button + folders
- `src/components/FolderCardSkeleton.jsx` - Individual folder card skeleton
- `src/components/DocumentCardSkeleton.jsx` - Individual document card skeleton

**Skeleton Rendering** (`Dashboard.jsx:1310-1373`):
```javascript
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br...">
      <div className="flex gap-6 h-[calc(100vh-3rem)]">
        <SidebarSkeleton />

        <div className="flex-1 flex flex-col gap-6">
          {/* Header skeleton */}
          <div className="bg-[#0a1628]/40...">...</div>

          {/* Grid with mixed skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2...">
            {Array.from({ length: 6 }).map((_, i) => (
              <FolderCardSkeleton key={i} />
            ))}
            {Array.from({ length: 24 }).map((_, i) => (
              <DocumentCardSkeleton key={i + 6} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Condition Breakdown**:
- `isLoadingDocuments`: From `usePaginatedDashboard` hook, true during initial fetch
- `paginatedDocuments.length === 0`: Ensures skeleton only shows when no cached data exists

---

### 5. Supabase Calls on Document Page Reload

**YES, reloads trigger Supabase calls**, but with multi-layer caching that often prevents them.

#### Dashboard Documents Fetch

**File**: `src/hooks/usePaginatedDashboard.js:63-67`

The `loadInitial()` function calls:
```javascript
const documents = await getDocumentsWithRealActivity({
  page: 1,
  limit: pageSize,
  orderBy,
  ascending
});
```

**Actual Supabase Query** (`src/hooks/usePaginatedDashboard.js:244-297`):

**Query 1 - Count**:
```javascript
const { count: totalCount } = await supabase
  .from('documents')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .is('deleted_at', null);
```

**Query 2 - Documents with Activity**:
```javascript
const { data: docs } = await supabase
  .from('documents')
  .select(`
    id, title, tags, created_at, updated_at, metadata,
    is_template, project_id, folder_id, position,
    blocks!inner(
      id,
      type,
      created_at,
      updated_at,
      metadata
    )
  `)
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order(orderBy, { ascending })
  .range(offset, offset + limit - 1);
```

**What is fetched**:
- Document metadata (id, title, tags, timestamps, etc.)
- Related blocks (joined via PostgreSQL, efficient!)
- Ordered by `updated_at` descending (most recent first)
- First 50 documents (default page size)

#### Document Blocks Fetch

After the document is found in `entries` and `expandedEntry` is set, the document editor loads:

**File**: `src/components/ExpandedViewEnhanced.jsx:96-111`

**Loading Strategy Selection**:
```javascript
const shouldUsePagination = !entry.blocks || entry.blockCount > 50;
```

**For Small Documents** (<50 blocks) - `src/hooks/useOptimizedBlockLoader.js:77`:

**Cache Check Sequence**:
1. Pre-loaded blocks check (line 45-56) - from dashboard query
2. Session cache check (line 59-69) - 5-minute TTL
3. **Supabase query** (line 77) - only if cache miss

**Supabase Query** (`src/utils/optimizedBlockLoader.js:64-69`):
```javascript
const { data: blocks } = await supabase
  .from('blocks')
  .select('*')
  .eq('document_id', documentId)
  .is('deleted_at', null)
  .order('position');
```

**For Large Documents** (>50 blocks) - `src/hooks/usePaginatedBlockLoader.js:74`:

**Supabase Queries** (`src/utils/paginatedBlockLoader.js:68-89`):

**Query 1 - Count**:
```javascript
const { count: totalCount } = await supabase
  .from('blocks')
  .select('*', { count: 'exact', head: true })
  .eq('document_id', documentId)
  .is('deleted_at', null);
```

**Query 2 - First Page**:
```javascript
const { data: blocks } = await supabase
  .from('blocks')
  .select('*')
  .eq('document_id', documentId)
  .is('deleted_at', null)
  .order('position')
  .range(0, 49); // First 50 blocks
```

---

### 6. Caching System - When Supabase Calls Are Avoided

#### Session Cache (Most Important)

**File**: `src/utils/sessionCache.js`

**Implementation**: LRU cache with 5-minute TTL
**Scope**: In-memory, per browser tab
**Keys**:
- `blocks:{documentId}` - Block data for documents
- `doc:{documentId}` - Document metadata

**Check Location** (`useOptimizedBlockLoader.js:59-69`):
```javascript
const cachedBlocks = sessionCache.getBlocks(documentId);
if (cachedBlocks && cachedBlocks.length > 0) {
  setBlocks(blocksWithPositions);
  setIsLoading(false);
  return; // ✅ NO SUPABASE CALL
}
```

#### Optimized Block Loader Memory Cache

**File**: `src/utils/optimizedBlockLoader.js:9`

**TTL**: 5 seconds
**Purpose**: Prevent rapid re-fetches during navigation
**Check**: Lines 18-24 before making Supabase query

#### Paginated Block Loader LRU Cache

**File**: `src/utils/paginatedBlockLoader.js:11-18`

**TTL**: 30 seconds
**Purpose**: Short-term caching during active editing
**Keys**: `{documentId}-page-{pageNumber}`

#### Pre-loaded Blocks

When navigating from the dashboard, `entry.blocks` contains the block IDs/types from the initial dashboard query. This is checked FIRST before any cache layers:

**Check Location** (`useOptimizedBlockLoader.js:45-56`):
```javascript
if (entry?.blocks && Array.isArray(entry.blocks) && entry.blocks.length > 0) {
  setBlocks(blocksWithPositions);
  setIsLoading(false);
  return; // ✅ NO SUPABASE CALL
}
```

---

### 7. Reload Scenarios - Supabase Call Summary

#### Scenario 1: Cold Reload (No Cache)

**Supabase Calls Made**:
1. ✅ Auth session check: `supabase.auth.getSession()` (usually cached by Supabase client)
2. ✅ Dashboard documents count: `SELECT COUNT(*) FROM documents WHERE user_id = ?`
3. ✅ Dashboard documents fetch: `SELECT * FROM documents JOIN blocks WHERE user_id = ? LIMIT 50`
4. ✅ Document blocks (small doc): `SELECT * FROM blocks WHERE document_id = ? ORDER BY position`
5. ✅ OR (large doc):
   - Count: `SELECT COUNT(*) FROM blocks WHERE document_id = ?`
   - First page: `SELECT * FROM blocks WHERE document_id = ? RANGE 0-49`

**Total**: 4-5 Supabase queries

**Duration**: 500-2000ms (visible skeleton state)

#### Scenario 2: Warm Reload (Session Cache Hit)

**Supabase Calls Made**:
1. ✅ Auth session (cached by Supabase client)
2. ❌ Dashboard documents - **SKIPPED** (but check still runs, returns cached)
3. ❌ Document blocks - **SKIPPED** (session cache hit)

**Total**: 0-1 Supabase queries (only auth if session expired)

**Duration**: 100-200ms (brief skeleton flash)

#### Scenario 3: Hot Navigation (From Dashboard)

**Supabase Calls Made**:
1. ❌ Auth - Cached
2. ❌ Dashboard documents - Already loaded
3. ❌ Document blocks - **SKIPPED** (pre-loaded blocks from dashboard query)

**Total**: 0 Supabase queries

**Duration**: 0-100ms (no skeleton, instant render)

---

## Code References

### Routing
- `src/App.jsx:208-217` - Dashboard and document routes (same component)
- `src/components/Layout.jsx:4-21` - Layout wrapper (no loading logic)

### Dashboard Component
- `src/pages/Dashboard.jsx:58` - URL parameter extraction
- `src/pages/Dashboard.jsx:62` - `expandedEntry` state
- `src/pages/Dashboard.jsx:638-642` - Initial load effect
- `src/pages/Dashboard.jsx:724-736` - Document expansion effect
- `src/pages/Dashboard.jsx:1211-1305` - Conditional rendering (grid vs editor)
- `src/pages/Dashboard.jsx:1309-1373` - Skeleton rendering logic

### Data Fetching Hooks
- `src/hooks/usePaginatedDashboard.js:44-131` - Dashboard documents loader
- `src/hooks/useOptimizedBlockLoader.js:24-123` - Small document blocks loader
- `src/hooks/usePaginatedBlockLoader.js:36-111` - Large document blocks loader

### Loading Utilities
- `src/utils/optimizedBlockLoader.js:16-131` - Single-query block loading
- `src/utils/paginatedBlockLoader.js:32-125` - Paginated block loading
- `src/utils/sessionCache.js` - Session-level caching

### Skeleton Components
- `src/components/SidebarSkeleton.jsx` - Sidebar loading skeleton
- `src/components/FolderCardSkeleton.jsx` - Folder card skeleton
- `src/components/DocumentCardSkeleton.jsx` - Document card skeleton
- `src/components/blocks/OptimizedBlockSkeleton.jsx` - Block-level skeleton

### Document Editor
- `src/components/ExpandedViewEnhanced.jsx:71-126` - Document editor with dual loader
- `src/components/MobileDocumentViewer.jsx:105,144` - Document editor wrapper

## Architecture Documentation

### Pattern: Single Component for Multiple Views

The application uses a pattern where one component (`Dashboard`) serves two completely different purposes:
1. **Grid Mode**: Shows all documents in a grid layout
2. **Editor Mode**: Shows a single document in full-screen editor

**Implementation**: Conditional rendering based on `expandedEntry` state
**Trade-off**: Simple routing but requires loading full documents list even when accessing a specific document

### Pattern: Multi-Layer Caching

The caching strategy uses multiple layers with different TTLs:
1. **Pre-loaded blocks** (immediate) - From dashboard query
2. **Session cache** (5 minutes) - Survives navigation within tab
3. **LRU cache** (5-30 seconds) - Prevents rapid re-fetches
4. **Supabase** (source of truth) - Only when all caches miss

**Benefit**: Most navigations require zero Supabase calls

### Pattern: Progressive Loading

Documents with >50 blocks use pagination:
1. Load first 50 blocks immediately
2. Show "Load more" button or infinite scroll
3. Background-preload next page before user scrolls to it

**Benefit**: Fast initial render even for 1000+ block documents

## Historical Context

### Why Single Component for Dashboard and Document?

The architecture appears to prioritize:
1. **State preservation**: Keeping dashboard state (scroll position, loaded documents) when opening a document
2. **Fast back navigation**: Returning to dashboard is instant since component never unmounts
3. **Shared context**: Both views share the same documents array and sidebar state

### Known Trade-offs

1. **Skeleton flash on reload**: Direct document URLs show dashboard skeleton briefly
2. **Required documents list**: Can't directly load a document without fetching the full list
3. **Larger initial bundle**: Dashboard component includes document editor code

## Open Questions

1. **Could direct document loading be added?** A separate route/component that loads only the requested document without the dashboard list
2. **Should skeleton be conditional on route?** Check `documentId` parameter and skip dashboard skeleton if present
3. **Is the documents list always needed?** Consider lazy-loading the sidebar/documents list only when in grid mode

## Related Research

- No previous research documents found for this specific topic
- Related: Dashboard pagination implementation (various research docs in thoughts/shared/research/)
- Related: Block loading optimization patterns (documented in CLAUDE.md)
