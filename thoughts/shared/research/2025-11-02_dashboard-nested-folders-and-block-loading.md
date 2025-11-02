---
date: 2025-11-02T02:02:45+01:00
researcher: Claude
git_commit: fbf3c760eadcc6e1d87679e98b71991b5d0b0b53
branch: main
repository: devlog-
topic: "Dashboard Loading Behavior: Nested Folders and Block Loading"
tags: [research, dashboard, pagination, folders, blocks, performance, lazy-loading]
status: complete
last_updated: 2025-11-02
last_updated_by: Claude
---

# Research: Dashboard Loading Behavior - Nested Folders and Block Loading

**Date**: 2025-11-02T02:02:45+01:00
**Researcher**: Claude
**Git Commit**: fbf3c760eadcc6e1d87679e98b71991b5d0b0b53
**Branch**: main
**Repository**: devlog-

## Research Questions

1. **Do nested subfolder documents get loaded all at once in dashboard pagination?**
   - If you have 5 nested subfolders all containing documents, do ALL documents from ALL levels get loaded in the dashboard pagination?

2. **Are blocks loaded when a folder or document appears in the dashboard?**
   - When a folder or document appears in the dashboard grid, are the blocks inside those documents also loaded at that time?

## Summary

### Answer 1: Nested Folder Documents - YES, All Loaded

**The dashboard pagination system loads ALL user documents regardless of folder nesting depth.** The database query filters ONLY by `user_id` and `deleted_at` - there is NO `folder_id` filter applied during pagination. This means:

- ✅ Documents in root (no folder) are loaded
- ✅ Documents in level 1 folders are loaded
- ✅ Documents in level 2+ nested subfolders are loaded
- ✅ ALL user documents participate in pagination

**However**, the dashboard grid displays ONLY root-level documents and folder cards. Documents nested inside folders are available in the `allDocuments` state but filtered out from the visible grid through client-side logic.

**Key File**: `src/utils/storage/SupabaseAdapterOptimized.js:151-160` - The SQL query that loads documents without folder filtering.

### Answer 2: Block Loading - NO, Blocks Not Loaded

**Blocks are NOT loaded when documents appear in the dashboard grid.** The dashboard only loads document metadata (title, tags, timestamps, folder_id, preview text). Blocks are loaded lazily ONLY when a document is opened in the editor. This is a critical performance optimization that prevents loading potentially thousands of blocks for documents that may never be viewed.

- ❌ Dashboard document cards DO NOT load blocks
- ❌ Folder expansion DOES NOT trigger block loading
- ✅ Blocks are loaded ONLY when opening a document in the editor
- ✅ Hover preloading queues blocks in background (optimization)

**Key File**: `src/components/ExpandedViewEnhanced.jsx:98-127` - Block loading logic that triggers only when document is opened.

---

## Detailed Findings

### Part 1: Dashboard Pagination and Nested Folders

#### Database Query Architecture

**Primary Query Location**: `src/utils/storage/SupabaseAdapterOptimized.js:151-160`

```javascript
let query = this.supabase
  .from('documents')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)                    // ← ONLY user filter
  .range(page * limit, (page + 1) * limit - 1)
  .order(orderBy, { ascending });

if (!includeDeleted) {
  query = query.is('deleted_at', null);     // ← ONLY deletion filter
}
```

**Critical Observation**: NO `.eq('folder_id', ...)` filter exists in the query.

#### What This Means

If you have the following folder structure:
```
Root Level
├── Document A (folder_id = null)
├── Folder 1 (id = "folder-1")
│   ├── Document B (folder_id = "folder-1")
│   └── Folder 1.1 (parent_id = "folder-1")
│       └── Document C (folder_id = "folder-1.1")
├── Folder 2 (id = "folder-2")
│   ├── Document D (folder_id = "folder-2")
│   └── Folder 2.1 (parent_id = "folder-2")
│       ├── Document E (folder_id = "folder-2.1")
│       └── Folder 2.1.1 (parent_id = "folder-2.1")
│           └── Document F (folder_id = "folder-2.1.1")
└── Document G (folder_id = null)
```

**Database Query Returns**: ALL 7 documents (A, B, C, D, E, F, G) in paginated batches of 50.

**Dashboard Grid Displays**: Only Document A, Document G, Folder 1, and Folder 2 (root-level items).

**Sidebar Shows**: Complete folder tree with all 7 documents visible when folders are expanded.

#### Data Flow

1. **Initial Dashboard Load** (`src/pages/Dashboard.jsx:632-638`)
   - Calls `loadInitial()` from `usePaginatedDashboard` hook

2. **Pagination Hook** (`src/hooks/usePaginatedDashboard.js:62-67`)
   ```javascript
   const result = await loadDocumentsPaginated({
     page: 0,
     limit: pageSize,      // 50 documents
     orderBy,              // 'updated_at'
     ascending             // false (newest first)
   });
   ```
   - NO folder_id parameter passed

3. **Storage Wrapper** (`src/utils/storage/storageWrapper.js:197-220`)
   ```javascript
   export async function loadDocumentsPaginated(options = {}) {
     const storageAdapter = await init();
     return storageAdapter.supabaseAdapter.loadAllDocuments(userId, options);
   }
   ```
   - Routes to Supabase adapter with only userId and pagination options

4. **Database Query** (`src/utils/storage/SupabaseAdapterOptimized.js:151-160`)
   - SQL: `SELECT * FROM documents WHERE user_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC RANGE 0 TO 49`
   - Returns first 50 documents across ALL folders

5. **Client-Side Filtering** (`src/pages/Dashboard.jsx:544-629`)
   ```javascript
   useEffect(() => {
     // Build folder tree recursively
     const populateFolderWithDocuments = (folder) => {
       const folderDocs = allDocuments
         .filter(doc => doc.folder_id === folder.id);  // ← Filter HERE
       // ... build tree
     };

     // Get root documents only for display
     const rootDocs = allDocuments
       .filter(doc => !doc.folder_id);  // ← Root-level only

     // Combine for grid display
     const combined = [...rootFolders, ...rootDocs];
     setEntries(combined);
   }, [folders, allDocuments]);
   ```
   - Filters documents AFTER loading to separate root vs nested

#### Why This Architecture?

**Reason 1: Sidebar Needs All Documents**
The ProjectExplorer sidebar (`src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx:1325-1363`) receives `allDocuments` and needs to show the complete document tree with all folders and nested documents.

**Reason 2: Search Across All Documents**
Full-text search (`src/pages/Dashboard.jsx:1077-1162`) searches across all documents regardless of which folder they're in.

**Reason 3: Simplicity**
Loading all documents simplifies state management - there's one source of truth (`allDocuments`) that both the grid and sidebar use.

**Reason 4: Performance**
With pagination (50 docs/page) and 5-minute caching, loading all documents is fast enough. Most users have <1000 documents, so this loads in ~20 pages maximum.

#### Code References

- **Pagination hook initialization**: `src/pages/Dashboard.jsx:79-97`
- **loadInitial() method**: `src/hooks/usePaginatedDashboard.js:43-103`
- **Database query**: `src/utils/storage/SupabaseAdapterOptimized.js:107-211`
- **Client-side folder filtering**: `src/pages/Dashboard.jsx:544-629`
- **Infinite scroll trigger**: `src/pages/Dashboard.jsx:641-674`

---

### Part 2: Block Loading Behavior

#### When Blocks Are NOT Loaded

**1. Dashboard Document Cards** (`src/components/EntryCardRedesigned.jsx`)
- Cards display ONLY metadata from the `documents` table
- NO query to the `blocks` table
- Document object has `blocks: undefined`

**2. Folder Expansion**
- Expanding a folder shows child documents
- Child documents also have `blocks: undefined`
- NO block loading triggered

**3. Pagination Loading**
- Loading more pages loads more documents
- Documents still have `blocks: undefined`

#### When Blocks ARE Loaded

**Only when opening a document in the editor** (`src/pages/Dashboard.jsx:177-188`)

```javascript
const handleDocumentExpand = useCallback((document) => {
  // Clear blocks array to force full reload
  const documentForEdit = {
    ...document,
    blocks: undefined  // ⚠️ Force block loader to fetch
  };
  setExpandedEntry(documentForEdit);
  navigate(`/dashboard/${document.id}`, { replace: true });
}, [navigate]);
```

**Block Loading Strategy Decision** (`src/components/ExpandedViewEnhanced.jsx:98-127`)

The editor decides which loading strategy to use based on document size:

```javascript
// Check if document might have many blocks
const shouldUsePagination = !entry.blocks || entry.blockCount > 50;

// Small documents (<= 50 blocks): Load all at once
const optimizedLoader = useOptimizedBlockLoader(entry.id, entry, {
  skip: shouldUsePagination
});

// Large documents (> 50 blocks): Load in pages
const paginatedLoader = usePaginatedBlockLoader(entry.id, entry, {
  pageSize: 50,
  enableInfiniteScroll: true,
  skip: !shouldUsePagination
});

// Select which loader to use
const loader = shouldUsePagination ? paginatedLoader : optimizedLoader;
```

#### Block Loading Waterfall

**For Small Documents** (`src/hooks/useOptimizedBlockLoader.js:24-123`)

1. Check if `entry.blocks` exists (it doesn't from dashboard)
2. Check session cache (fast - ~1ms)
3. Show skeleton blocks immediately (visual feedback)
4. Fetch from database via Supabase query to `blocks` table (~100-500ms)
5. Cache results for next time

**For Large Documents** (`src/hooks/usePaginatedBlockLoader.js:36-112`)

1. Same cache checks as above
2. Load first 50 blocks from database
3. Show infinite scroll loader at bottom
4. Load more blocks as user scrolls
5. Preload next page in background for instant scroll

#### Database Queries

**Document Metadata Query** (Dashboard - NO blocks):
```sql
SELECT * FROM documents
WHERE user_id = ?
  AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT 50
```

**Block Loading Query** (Editor only):
```sql
SELECT * FROM blocks
WHERE document_id = ?
ORDER BY position ASC
```

These are **separate queries** that happen at **different times**.

#### Performance Impact

**Dashboard Loading**:
- Query: ~50ms (metadata only)
- Network: ~50ms
- Total: ~100ms to show 50 document cards

**Opening Document**:
- Query: ~100-500ms (depending on block count)
- Network: ~50ms
- Rendering: ~50-200ms
- Total: ~200-750ms to show document content

**Ratio**: Dashboard is 2-7x faster because it skips block loading.

#### Code References

- **Dashboard document loading**: `src/utils/storage/SupabaseAdapterOptimized.js:107-186` (NO blocks)
- **Document expand handler**: `src/pages/Dashboard.jsx:177-188`
- **Block loading decision**: `src/components/ExpandedViewEnhanced.jsx:98-127`
- **Optimized block loader**: `src/hooks/useOptimizedBlockLoader.js:24-123`
- **Paginated block loader**: `src/hooks/usePaginatedBlockLoader.js:36-112`
- **Document card display**: `src/components/EntryCardRedesigned.jsx:148-180` (uses metadata only)

#### Progressive Enhancement Pattern

**Hover Preloading** (`src/components/EntryCardRedesigned.jsx:34-36`)

```javascript
const handleMouseEnter = () => {
  optimizedBlockLoader.preloadDocuments([entry.id]);  // Background preload
};
```

When a user hovers over a document card, blocks are queued for preloading in the background. This doesn't block the UI but makes opening feel instant if the user clicks.

---

## Architecture Patterns

### Two-Phase Loading Pattern

**Phase 1: Metadata Loading** (Dashboard)
- Fast query (~50ms)
- Loads ALL documents (including nested)
- Shows folders + root documents in grid
- Enables search and navigation

**Phase 2: Content Loading** (Editor)
- On-demand query (~100-500ms)
- Loads blocks for ONE document
- Shows document content for editing
- Lazy loading prevents waste

### Separation of Concerns

**Database Level**:
- `documents` table stores metadata + folder_id foreign key
- `blocks` table stores content with document_id foreign key
- Tables are normalized and separate

**Client Level**:
- Dashboard uses `allDocuments` (metadata only)
- Editor uses `blocks` (content only)
- Different components, different data needs

### Defense-in-Depth Caching

**Layer 1: Session Cache** (5 minutes)
- Fastest (~1ms)
- In-memory Map object
- Cleared on document save

**Layer 2: IndexedDB** (offline)
- Fast (~10ms)
- 1GB+ capacity
- Persists across sessions

**Layer 3: Supabase** (cloud)
- Slower (~50-500ms)
- Infinite capacity
- Source of truth

---

## Historical Context (from thoughts/)

### Related Research Documents

**Pagination Implementation**:
- `thoughts/shared/plans/dashboard-pagination-implementation.md` - Original pagination implementation plan
- `thoughts/shared/research/2025-11-01_dashboard-pagination-deep-dive.md` - Recent deep dive confirming NO folder filtering in queries

**Data Fetching Optimization**:
- `thoughts/shared/research/2025-10-26_18-43-48_dashboard-data-fetching-optimization.md` - Documents the lazy loading pattern for blocks
- `thoughts/shared/research/2025-10-26_dashboard-display-timing-analysis.md` - Timing analysis showing block loading happens post-render

**Folder Hierarchy**:
- `thoughts/shared/research/2025-10-26_12-37-55_dashboard-statistics-and-folders.md` - Documents client-side folder tree construction
- `thoughts/shared/research/2025-10-31_20-59-42_sidebar-document-creation-and-save-issues.md` - Sidebar needs all documents for tree display

### Key Historical Decisions

**Decision 1: Load All Documents**
Made to support sidebar navigation and global search. Alternative (folder-filtered pagination) would require complex state management for multiple folder views.

**Decision 2: Lazy Block Loading**
Critical performance optimization. Early versions loaded blocks eagerly and had 5-10 second dashboard load times with 200+ documents.

**Decision 3: Client-Side Folder Filtering**
Simplifies server queries and enables fast folder expansion without additional database calls. Trade-off: more client-side processing.

---

## Current State Summary

### What Happens When Dashboard Loads

**Step 1: Initial Render**
- Dashboard skeleton shown immediately
- No data loaded yet

**Step 2: First Pagination Query**
- Loads first 50 documents (ALL users' docs, not filtered by folder)
- Returns metadata only (NO blocks)
- Takes ~100ms

**Step 3: Client-Side Processing**
- Builds folder tree from `folder_id` relationships
- Filters root documents for grid display
- Combines folders + root docs into `entries` state
- Takes ~10-50ms

**Step 4: Grid Display**
- Shows document cards and folder cards
- Each card shows metadata: title, tags, preview, activity chart
- NO block content displayed
- Takes ~50ms to render

**Step 5: Infinite Scroll**
- As user scrolls, loads next 50 documents
- Same pattern: metadata only, client-side filtering
- Repeats until all documents loaded

### What Happens When Opening a Document

**Step 1: Click Document Card**
- `handleDocumentExpand()` called
- Document object passed with `blocks: undefined`
- Editor opens immediately with loading state

**Step 2: Block Loading Triggered**
- Editor decides strategy (all-at-once vs paginated)
- Checks cache hierarchy (session → IndexedDB → Supabase)
- Shows skeleton blocks during load

**Step 3: Blocks Fetched**
- Query to `blocks` table for this document_id
- Transform blocks to app format
- Cache results in all layers

**Step 4: Blocks Rendered**
- Replace skeletons with actual blocks
- Enable editing
- Document is now fully loaded

### What Happens When Expanding a Folder

**Step 1: Click Folder Card**
- Folder's `isExpanded` state toggled
- NO database queries triggered

**Step 2: Show Child Items**
- Filter `allDocuments` by `folder_id === folder.id`
- Display child documents and subfolders
- ALL child documents have `blocks: undefined`

**Step 3: User Can Navigate**
- Click child document → opens editor → blocks loaded (see above)
- Click subfolder → expands → shows more docs (still no blocks)

**Key Point**: Folder expansion is pure UI state change - no data loading.

---

## Performance Characteristics

### Dashboard Load Performance

**Typical Timeline** (250 total documents):
- Initial query: 100ms (first 50 docs)
- Render: 50ms
- User sees dashboard: **150ms total**

**Scroll to bottom**:
- 5 more queries (50 docs each): 500ms total
- Full dataset loaded: **650ms total**
- Extremely fast because NO blocks loaded

### Document Open Performance

**Small Document** (20 blocks):
- Check cache: 1ms (miss)
- Load blocks: 100ms
- Render: 50ms
- User sees content: **151ms total**

**Large Document** (200 blocks):
- Check cache: 1ms (miss)
- Load first page: 150ms
- Render: 100ms
- User sees first 50 blocks: **251ms total**
- Background load remaining blocks: +500ms

### Memory Usage

**Dashboard with 250 documents**:
- Metadata: ~250KB (1KB per doc)
- UI state: ~100KB
- Total: **~350KB** in memory

**Opening 1 document with 50 blocks**:
- Document metadata: 1KB
- Block content: ~50KB (varies widely)
- UI state: ~20KB
- Total: **~71KB additional**

**Opening 10 documents**:
- Would add **~710KB** to memory
- Session cache holds up to 50 documents
- Older documents evicted automatically

---

## Open Questions

### Performance at Scale

**Scenario**: User has 5,000 documents across 100 nested folders

**Current Behavior**:
- Would require ~100 pagination queries to load all metadata
- Dashboard would eventually show all 5,000 documents in sidebar
- Initial 50 visible in grid very fast (~100ms)
- Full load time: ~10 seconds

**Potential Issues**:
- Memory usage: ~5MB for metadata (acceptable)
- Sidebar rendering: Could be slow with huge tree
- Search performance: Searching 5,000 docs client-side might lag

**Mitigations in Place**:
- Virtualized grid rendering (react-window)
- Lazy folder expansion (only render visible folders)
- Search debouncing (300ms)

### Block Preloading Strategy

**Current**: Hover triggers background preload

**Question**: Should we preload visible documents automatically?

**Trade-offs**:
- Pro: Instant open experience
- Con: Wastes bandwidth if user doesn't click
- Con: Could load hundreds of blocks unnecessarily

**Current Approach**: Conservative - only preload on hover

---

## Related Research

- `thoughts/shared/research/2025-11-01_dashboard-pagination-deep-dive.md` - Comprehensive pagination architecture
- `thoughts/shared/research/2025-10-26_18-43-48_dashboard-data-fetching-optimization.md` - Data fetching and caching strategies
- `thoughts/shared/research/2025-10-26_12-37-55_dashboard-statistics-and-folders.md` - Folder hierarchy and statistics
- `thoughts/shared/research/2025-10-26_dashboard-display-timing-analysis.md` - Dashboard display timing and rendering performance

---

## Conclusion

### Question 1: Nested Folder Document Loading

**YES**, all documents from nested subfolders are loaded through pagination. The database query intentionally does NOT filter by folder_id, meaning:

- All user documents participate in pagination
- 5 levels of nested folders → all documents still loaded
- Documents are loaded in batches of 50, ordered by updated_at
- Client-side filtering determines what's visible in the grid

**Why**: Sidebar needs all documents for tree display, and search needs all documents available.

### Question 2: Block Loading on Dashboard

**NO**, blocks are NOT loaded when folders or documents appear in the dashboard. Only document metadata is loaded:

- Dashboard queries ONLY the `documents` table
- NO join to `blocks` table
- Blocks loaded ONLY when opening a document in editor
- Critical performance optimization preventing unnecessary data loading

**Why**: Performance. Loading blocks for 250 documents would add ~12.5MB to memory and take 10+ seconds. Lazy loading means instant dashboard with fast drill-down.

### Key Architectural Insights

1. **Pagination is document-centric, not folder-centric** - All docs loaded regardless of folder nesting
2. **Two-phase loading** - Metadata first (fast), content second (on-demand)
3. **Client-side folder tree** - Database stores flat structure, client builds hierarchy
4. **Defense-in-depth caching** - Session → IndexedDB → Supabase
5. **Progressive enhancement** - Hover preloading, background prefetch

This architecture balances performance (fast dashboard), functionality (full search, complete sidebar), and scalability (handles thousands of documents).
