---
date: 2025-11-09T20:22:03+01:00
researcher: Claude Code
git_commit: 7f7dcf2dd79e082d87b609a1713507ca7bd4ad50
branch: main
repository: devlog-
topic: "Dashboard Full Reload on Navigation - Data Flow and Incremental Update Architecture"
tags: [research, dashboard, navigation, caching, data-flow, incremental-updates]
status: complete
last_updated: 2025-11-09
last_updated_by: Claude Code
---

# Research: Dashboard Full Reload on Navigation - Data Flow and Incremental Update Architecture

**Date**: 2025-11-09T20:22:03+01:00
**Researcher**: Claude Code
**Git Commit**: 7f7dcf2dd79e082d87b609a1713507ca7bd4ad50
**Branch**: main
**Repository**: devlog-

## Research Question

The dashboard reloads completely every time navigating to it from the document page or settings, fetching the full dataset from Supabase. The desired behavior is:

1. **Incremental updates**: Only update cards that have changed
2. **No skeleton loading on navigation**: Skeleton should only appear on genuine first-time loading
3. **Preserve existing data**: Keep unchanged documents as-is when navigating back to dashboard

The goal is to identify all places where changes are needed to introduce incremental updates instead of full reloads.

## Summary

The application currently uses a **full reload pattern** where navigating to the dashboard always fetches fresh data from Supabase if the documents array is empty. However, there's a critical architectural issue: **the main init effect doesn't have location as a dependency**, which means it only loads once on mount and never refreshes on navigation.

The skeleton loading appears only when `isLoadingDocuments && paginatedDocuments.length === 0`, which means it shows during the **initial page load** but NOT when navigating back (since documents are already in state).

The current architecture has three caching layers (SessionCache, Adapter Cache, React State), but **none of them are cleared on navigation**, leading to potentially stale data when returning to the dashboard.

## Current Data Flow Architecture

### High-Level Overview

```
USER NAVIGATES TO DASHBOARD
    ↓
[Router] React Router loads Dashboard.jsx component
    ↓
[Dashboard Mount/Update] useEffect evaluates conditions
    ↓
CONDITION CHECK: user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments
    ↓
IF FALSE (documents already loaded):
    → Shows existing state from memory (instant)
    → NO database queries
    → NO skeleton loading
    ↓
IF TRUE (first load or empty):
    → Triggers loadInitial()
    → Shows skeleton loading
    → Fetches from Supabase
```

### Critical File Paths

1. **Dashboard Entry Point**: `src/pages/Dashboard.jsx:639-645`
2. **Pagination Hook**: `src/hooks/usePaginatedDashboard.js:44-132`
3. **Data Fetch Function**: `src/lib/supabase-optimizations.ts:274-287`
4. **Storage Wrapper**: `src/utils/storage/storageWrapper.js:136-186`
5. **Supabase Adapter**: `src/utils/storage/SupabaseAdapterOptimized.js`
6. **Session Cache**: `src/utils/sessionCache.js:129-460`
7. **Skeleton Components**: `src/components/DocumentCardSkeleton.jsx`, `src/components/FolderCardSkeleton.jsx`, `src/components/SidebarSkeleton.jsx`

## Detailed Findings

### 1. Navigation Flow (React Router)

**Router Configuration**: `src/App.jsx:206-233`

Routes:
- `/dashboard` → Dashboard component
- `/document/:documentId` → DocumentPage component
- `/settings` → SettingsClaude component

**Navigation Pattern**:
- All navigation uses `replace: true` to avoid polluting history stack
- No `location.state` used - all data fetched fresh from storage
- Document navigation: `navigate(\`/document/${document.id}\`, { replace: true })` (Dashboard.jsx:194)
- Back to dashboard: `navigate('/dashboard', { replace: true })` (DocumentPage.jsx:175)

**Key Finding**: Navigation changes URL but does NOT trigger data refresh because the main init effect has no location dependency.

---

### 2. Dashboard Initialization Logic

**Main Init Effect** (`src/pages/Dashboard.jsx:639-645`):
```javascript
useEffect(() => {
  console.log('[DEBUG-INIT] Dashboard mounted, user:', user?.id, 'paginatedDocs:', paginatedDocuments.length);
  if (user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments) {
    console.log('[DEBUG-INIT] Triggering loadInitial()');
    loadInitial();
  }
}, [user?.id]); // ❌ No location dependency
```

**Conditions for Loading**:
1. User is authenticated (`user?.id` exists)
2. No documents loaded yet (`paginatedDocuments.length === 0`)
3. Not currently loading (`!isLoadingDocuments`)

**Dependencies**: `[user?.id]`
- Only re-runs when user ID changes (login/logout)
- **Does NOT re-run on navigation** to dashboard

**Result**:
- First visit: Loads data (skeleton shown)
- Navigate away and back: Shows cached state (no skeleton, no network call)

---

### 3. Data Fetching Pipeline

#### Step 1: Pagination Hook (`src/hooks/usePaginatedDashboard.js:44-132`)

**loadInitial() Function**:
```javascript
const loadInitial = useCallback(async () => {
  if (!user?.id || loadingRef.current) return; // Duplicate load protection

  loadingRef.current = true;
  setIsLoading(true);

  const documents = await getDocumentsWithRealActivity({
    userId: user.id,
    limit: pageSize,     // 50 documents
    offset: 0
  });

  // Transform snake_case → camelCase
  const transformed = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    folder_id: doc.folder_id,
    // ... activity data
  }));

  setDocuments(uniqueDocs);
  setIsLoading(false);
}, [user?.id, pageSize, orderBy, ascending, preloadNextPage]);
```

**Deduplication Protection**:
- `loadingRef.current` prevents concurrent loads
- Returns early if already loading

#### Step 2: Database Query (`src/lib/supabase-optimizations.ts:274-287`)

**Function Call**:
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

**Database Function**: `get_documents_with_real_activity(p_user_id, p_limit, p_offset)`
- Queries: `documents` table + `audit.record_version` table
- Returns: Document metadata + real activity statistics (edit counts, recent edits)
- Sorting: `updated_at DESC`
- Pagination: LIMIT/OFFSET

#### Step 3: Supabase Client (`src/lib/supabaseOptimized.js`)

**Features**:
- **Connection pooling**: `poolSize: 50` (line 164)
- **Request retry**: 3 attempts with exponential backoff (lines 116-156)
- **Request deduplication**: Prevents duplicate concurrent requests (lines 404-417)
- **Circuit breaker**: Opens after 3 failures, 30s cooldown (SupabaseAdapterOptimized.js:277-285)

#### Step 4: Storage Adapter (`src/utils/storage/SupabaseAdapterOptimized.js`)

**Query Result Cache** (lines 22-39):
```javascript
getCached(key) {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.time < this.cacheExpiry) {
    return cached.data;
  }
  this.cache.delete(key);
  return null;
}
```

**Cache Settings**:
- **Duration**: 5 minutes (`cacheExpiry = 5 * 60 * 1000`)
- **Cache Keys**: `docs:${userId}:${page}:${limit}:${orderBy}:${ascending}`
- **Invalidation**: Automatic expiry + manual `invalidateCache()` calls

**Invalidation Trigger** (line 263-265):
```javascript
invalidateCache() {
  this.cache.clear();
}
```
Called only after document creation (Dashboard.jsx:281)

---

### 4. Caching Architecture

#### Layer 1: SessionCache (In-Memory LRU)

**Implementation**: `src/utils/sessionCache.js:129-460`

**Storage Structure**:
- `doc:{documentId}` - Document metadata (without blocks)
- `blocks:{documentId}` - Block arrays for each document
- `meta:{documentId}` - Access metadata (timestamps)

**Cache Operations**:
```javascript
// Write
cacheDocument(document) {
  this.cache.set(this.getDocumentKey(document.id), docToCache);
}

cacheBlocks(documentId, blocks) {
  this.cache.set(this.getBlocksKey(documentId), blocks);
}

// Read
getDocument(documentId) {
  return this.cache.get(this.getDocumentKey(documentId));
}

getBlocks(documentId) {
  return this.cache.get(this.getBlocksKey(documentId));
}
```

**Lifetime**:
- Persists until browser refresh (new session)
- No automatic expiration or TTL
- Only cleared on explicit calls

**Clearing Points**:
1. Block deletion: `sessionCache.clearBlock(documentId, blockId)` (ExpandedViewEnhanced.jsx:899)
2. Document deletion: `sessionCache.clearDocument(documentId)` (ExpandedViewEnhanced.jsx:2352, 2437)
3. Browser refresh (new session)

**Key Finding**: **Never cleared on navigation** - stale data persists

#### Layer 2: Adapter Cache (Query Results)

**Location**: `src/utils/storage/SupabaseAdapterOptimized.js:22-39`

**Stores**: Database query results
**Duration**: Until invalidated (no time-based expiration)
**Cleared**: Only after document creation (Dashboard.jsx:278-288)

**Cache Structure**:
```javascript
this.cache = new Map([
  ['docs:userId:0:50:updated_at:false', { data: [...], time: 1699564800000 }]
]);
```

#### Layer 3: React State

**Dashboard State** (`src/pages/Dashboard.jsx`):
```javascript
const [entries, setEntries] = useState([]);           // Combined folders + documents
const [allDocuments, setAllDocuments] = useState([]); // All documents (includes in folders)
const [expandedEntry, setExpandedEntry] = useState(null);
```

**Pagination Hook State** (`src/hooks/usePaginatedDashboard.js`):
```javascript
const [documents, setDocuments] = useState([]);       // Current loaded documents
const [currentPage, setCurrentPage] = useState(0);
const [totalCount, setTotalCount] = useState(0);
const [hasMore, setHasMore] = useState(true);
```

**Lifetime**: Component lifetime
**Cleared**: Component unmount or manual reset

---

### 5. Skeleton Loading Implementation

#### Skeleton Components

1. **DocumentCardSkeleton** (`src/components/DocumentCardSkeleton.jsx`):
   - Mimics document card with title lines + activity chart
   - Uses `animate-pulse` CSS animation
   - Dimensions: `min-h-[140px]`

2. **FolderCardSkeleton** (`src/components/FolderCardSkeleton.jsx`):
   - Folder icon + title + count badge
   - Smaller than document cards

3. **SidebarSkeleton** (`src/components/SidebarSkeleton.jsx`):
   - Full sidebar with favorites + explorer sections
   - Fixed width: `w-72`

#### Skeleton Display Logic

**Dashboard Full-Page Skeleton** (`src/pages/Dashboard.jsx:1309-1376`):

**Condition**: `isLoadingDocuments && paginatedDocuments.length === 0`

```javascript
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32] p-6">
      <div className="flex gap-6 h-[calc(100vh-3rem)] max-w-[1800px] mx-auto">
        {/* Sidebar Skeleton */}
        <SidebarSkeleton />

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl">
            <div className="p-6 h-full overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                <FolderCardSkeleton />
                <DocumentCardSkeleton />
                <DocumentCardSkeleton />
                {/* ... 30 total skeleton cards ... */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Trigger Conditions**:
1. `isLoadingDocuments === true` (from pagination hook)
2. `paginatedDocuments.length === 0` (no documents loaded yet)

**When It Shows**:
- ✅ First page load (genuine first-time loading)
- ❌ Navigate away and back (documents already in state)
- ❌ Page refresh with cached data

**Loading State Source** (`usePaginatedDashboard.js:58`):
```javascript
loadingRef.current = true;
setIsLoading(true);  // This becomes isLoadingDocuments in Dashboard
```

---

### 6. State Synchronization Flow

#### Sync 1: Paginated to All Documents (`src/pages/Dashboard.jsx:544-549`)

```javascript
useEffect(() => {
  if (paginatedDocuments && paginatedDocuments.length > 0) {
    setAllDocuments(paginatedDocuments);
  }
}, [paginatedDocuments]);
```

Purpose: Keep `allDocuments` (used for sidebar) in sync with paginated data

#### Sync 2: Combine Folders and Documents (`src/pages/Dashboard.jsx:552-636`)

```javascript
useEffect(() => {
  // Get root folders and populate with documents
  const rootFolders = (folders || [])
    .filter(f => !f.parent_id)
    .map(populateFolderWithDocuments);

  // Get root documents (not in any folder)
  const rootDocs = allDocuments
    .filter(doc => !doc.folder_id)
    .map(doc => ({ ...doc, type: 'document' }));

  // Sort by most recent activity
  const combined = [...rootFolders, ...rootDocs].sort((a, b) => {
    const aTime = new Date(a.effectiveUpdatedAt || a.updatedAt || ...);
    const bTime = new Date(b.effectiveUpdatedAt || b.updatedAt || ...);
    return bTime - aTime;  // Most recent first
  });

  setEntries(combined);
}, [folders, allDocuments]);
```

**Dependencies**: `[folders, allDocuments]`
- Re-runs whenever folders OR documents change
- Combines data from two separate sources
- Sorts by most recent activity (folders use activity from contained documents)

**Purpose**: Create unified view for dashboard grid

---

## Key Architectural Gaps

### Gap 1: No Location-Based Refresh

**Problem**: Main init effect doesn't depend on location

**Current Code** (`Dashboard.jsx:639-645`):
```javascript
useEffect(() => {
  if (user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments) {
    loadInitial();
  }
}, [user?.id]); // ❌ No location dependency
```

**Result**:
- Only loads on mount or user change
- Navigating to dashboard doesn't trigger refresh
- Stale data persists across navigation

**Example Scenario**:
1. User loads dashboard (fresh data)
2. User opens document editor
3. Another user updates documents on server
4. User navigates back to dashboard
5. **Result**: Shows old cached data, no network call

### Gap 2: SessionCache Never Cleared on Navigation

**Problem**: Session cache persists indefinitely within browser session

**Cache Lifetime** (`sessionCache.js`):
- Persists until browser refresh
- No automatic expiration
- No staleness detection

**Clearing Points**:
1. Block deletion (per-block) - line 363
2. Document deletion (per-document) - line 353
3. Browser refresh (all)

**Missing**:
- ❌ Clear on navigation
- ❌ Time-based expiration
- ❌ Visibility-based refresh
- ❌ Tab focus detection

### Gap 3: Adapter Cache Persists

**Problem**: Query result cache only invalidated after document creation

**Invalidation Point** (`Dashboard.jsx:278-288`):
```javascript
// Invalidate cache after creating new document
const adapter = await storageWrapper.getAdapter();
if (adapter?.invalidateCache) {
  adapter.invalidateCache();
}
```

**Missing Invalidation**:
- ❌ On navigation to dashboard
- ❌ After document edits in editor
- ❌ Periodic refresh
- ❌ Real-time updates

### Gap 4: Skeleton Shows Only on Empty State

**Problem**: Skeleton condition checks if documents array is empty

**Current Logic** (`Dashboard.jsx:1311`):
```javascript
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return <SkeletonUI />;
}
```

**Result**:
- Shows on first page load ✅
- Hidden when navigating back (documents in state) ❌
- Hidden even when fetching fresh data ❌

**User Experience**:
- Navigate away: Instant (no skeleton)
- Navigate back: Instant (no skeleton, shows stale data)
- No visual feedback that data is being refreshed

---

## Data Staleness Scenarios

### Scenario A: Edit in Separate Tab

1. User opens document in **Tab A**
2. User opens dashboard in **Tab B**
3. User edits document in **Tab A** (updates database)
4. User switches to **Tab B** (dashboard)
5. **Result**: Dashboard shows stale data (no refresh triggered)

**Gap**: No cross-tab communication or cache invalidation

### Scenario B: Mobile Background

1. User opens dashboard
2. User backgrounds app for 30 minutes
3. Server-side updates occur (other users editing)
4. User foregrounds app
5. **Result**: Shows old data (no refresh on visibility change)

**Gap**: No visibility API integration for background refresh

### Scenario C: Navigate Away and Back

1. User loads dashboard (fresh data loaded)
2. User opens document editor
3. Another user updates documents on server
4. User clicks back to dashboard
5. **Result**: Shows cached data (no network call, no skeleton)

**Gap**: No location-based refresh trigger

### Scenario D: Long Session

1. User loads dashboard at 9:00 AM
2. User browses documents all day
3. At 5:00 PM, user returns to dashboard
4. **Result**: Shows 8-hour-old data (no time-based expiration)

**Gap**: No TTL (Time To Live) mechanism in cache

---

## Code Locations for Incremental Update Implementation

### 1. Navigation Detection

**File**: `src/pages/Dashboard.jsx`

**Current Effect** (line 639):
```javascript
useEffect(() => {
  if (user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments) {
    loadInitial();
  }
}, [user?.id]);
```

**Need to Add**:
- Import `useLocation` from React Router
- Add location dependency to detect navigation
- Add logic to check if refresh is needed (time-based or change detection)

**Proposed Addition**:
```javascript
const location = useLocation();

useEffect(() => {
  // Check if we're navigating TO dashboard (not just re-rendering)
  if (location.pathname === '/dashboard' && user?.id) {
    // Determine if refresh needed:
    // - Time since last load > threshold
    // - OR forced refresh flag
    // - OR documents empty
    if (shouldRefresh()) {
      loadInitial();
    }
  }
}, [user?.id, location.pathname]);
```

### 2. Incremental Update Function

**File**: `src/hooks/usePaginatedDashboard.js` (new function)

**Need to Create**:
```javascript
const refreshModified = useCallback(async (lastSyncTimestamp) => {
  // Query only documents modified since lastSyncTimestamp
  const modifiedDocs = await getDocumentsWithRealActivity({
    userId: user.id,
    modifiedSince: lastSyncTimestamp,
    limit: 1000 // Get all modified
  });

  // Merge with existing documents
  setDocuments(prev => {
    const updated = [...prev];
    modifiedDocs.forEach(modifiedDoc => {
      const index = updated.findIndex(d => d.id === modifiedDoc.id);
      if (index !== -1) {
        updated[index] = modifiedDoc; // Update existing
      } else {
        updated.unshift(modifiedDoc); // Add new
      }
    });
    return updated;
  });
}, [user?.id]);
```

**Location to Add**: After `loadInitial()` function definition (line 133)

### 3. Database Query for Modified Documents

**File**: `src/lib/supabase-optimizations.ts`

**Need to Add**:
```typescript
export async function getModifiedDocumentsWithRealActivity(options: {
  userId: string;
  modifiedSince: string; // ISO timestamp
  limit?: number;
}): Promise<DocumentWithRealActivity[]> {
  const { data, error } = await supabase.rpc('get_modified_documents_with_real_activity', {
    p_user_id: options.userId,
    p_modified_since: options.modifiedSince,
    p_limit: options.limit || 1000
  });

  if (error) throw error;
  return data || [];
}
```

**Location to Add**: After `getDocumentsWithRealActivity()` function (line 288)

**Database Function Needed**:
```sql
CREATE OR REPLACE FUNCTION get_modified_documents_with_real_activity(
  p_user_id UUID,
  p_modified_since TIMESTAMPTZ,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (/* same as get_documents_with_real_activity */)
AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM documents d
  WHERE d.user_id = p_user_id
    AND d.updated_at > p_modified_since
  ORDER BY d.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Last Sync Timestamp Storage

**File**: `src/utils/sessionCache.js`

**Need to Add**:
```javascript
// Store last sync timestamp per user
setLastSyncTime(userId) {
  this.cache.set(`lastSync:${userId}`, Date.now());
}

getLastSyncTime(userId) {
  return this.cache.get(`lastSync:${userId}`) || 0;
}
```

**Location to Add**: After `getBlocksCount()` function (line 450)

### 5. Skeleton Loading Enhancement

**File**: `src/pages/Dashboard.jsx`

**Current Condition** (line 1311):
```javascript
if (isLoadingDocuments && paginatedDocuments.length === 0) {
  return <SkeletonUI />;
}
```

**Need to Change To**:
```javascript
// Show loading indicator when refreshing (not full skeleton)
const isRefreshing = isLoadingDocuments && paginatedDocuments.length > 0;

if (isLoadingDocuments && paginatedDocuments.length === 0) {
  // Full skeleton on first load
  return <SkeletonUI />;
}

// Elsewhere in JSX (inside main dashboard render):
{isRefreshing && (
  <div className="absolute top-4 right-4 flex items-center gap-2 bg-dark-lighter/80 backdrop-blur px-3 py-2 rounded-lg">
    <Loader2 className="w-4 h-4 animate-spin text-accent-green" />
    <span className="text-sm text-text-secondary">Syncing...</span>
  </div>
)}
```

**Location for Indicator**: Inside dashboard header area (after line 1472)

### 6. Cache Invalidation Strategy

**Option A: Location-Based Clearing** (`src/pages/Dashboard.jsx`):
```javascript
useEffect(() => {
  // Clear stale cache when navigating away from dashboard
  return () => {
    if (location.pathname !== '/dashboard') {
      sessionCache.clearAll();
    }
  };
}, [location.pathname]);
```

**Option B: Time-Based Expiration** (`src/utils/sessionCache.js`):
```javascript
// Add TTL to metadata
cacheBlocks(documentId, blocks) {
  this.cache.set(this.getBlocksKey(documentId), blocks);
  this.cache.set(this.getMetadataKey(documentId), {
    lastAccessed: Date.now(),
    blocksLoadedAt: Date.now(),
    expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
  });
}

// Check expiration on get
getBlocks(documentId) {
  const meta = this.cache.get(this.getMetadataKey(documentId));
  if (meta && meta.expiresAt < Date.now()) {
    this.clearDocument(documentId); // Auto-clear expired
    return null;
  }
  return this.cache.get(this.getBlocksKey(documentId));
}
```

**Option C: Visibility API** (`src/pages/Dashboard.jsx`):
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && location.pathname === '/dashboard') {
      const lastLoad = sessionCache.getLastSyncTime(user.id);
      const timeSinceLoad = Date.now() - lastLoad;

      if (timeSinceLoad > 5 * 60 * 1000) { // 5 minutes
        refreshModified(new Date(lastLoad).toISOString());
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [location.pathname, user?.id]);
```

### 7. Optimistic UI Updates

**File**: `src/pages/Dashboard.jsx`

**Current Document Creation** (lines 266-269):
```javascript
// ✅ OPTIMISTIC UPDATE: Update UI immediately
const updatedEntries = [newEntry, ...entries];
setEntries(updatedEntries);
setExpandedEntry(newEntry);
```

**Already Implemented**: Document creation updates UI immediately before database save

**Need to Extend**:
- Document updates from editor
- Document deletions
- Title/metadata changes

**Location**: `updateEntry()` function (line 735)

### 8. Change Detection Metadata

**File**: `src/hooks/usePaginatedDashboard.js`

**Need to Track**:
```javascript
const [lastSyncTimestamp, setLastSyncTimestamp] = useState(null);
const [changesSinceLoad, setChangesSinceLoad] = useState([]);

// After successful load
const loadInitial = useCallback(async () => {
  // ... existing code ...

  setLastSyncTimestamp(new Date().toISOString());
  sessionCache.setLastSyncTime(user.id);
}, [user?.id, pageSize]);
```

---

## Related Components Analysis

### DocumentPage.jsx - No Dashboard Interaction

**File**: `src/pages/DocumentPage.jsx`

**Data Flow**:
- Loads single document directly from storage (line 63)
- No dependency on dashboard state
- Saves updates directly to storage (line 158)
- No cache invalidation for dashboard

**Gap**: Document edits don't notify dashboard of changes

### Settings Page - No Dashboard Interaction

**File**: `src/pages/SettingsClaude.jsx`

**Navigation Back** (line 426):
```javascript
onClick={() => navigate('/dashboard')}
```

**No Data Impact**: Settings page doesn't modify documents

### ProjectExplorer - Uses Dashboard State

**File**: `src/components/ProjectExplorer/ProjectExplorerRedesigned.jsx`

**Props from Dashboard**:
- `documents={allDocuments}` (Dashboard.jsx:1430)
- `selectedDocumentId={expandedEntry?.id}` (line 1428)

**Updates Dashboard Via Callbacks**:
- `onDocumentSelect` (line 1414)
- `onDocumentMove` (line 1431)
- `onDocumentDelete` (line 1434)

**Integration**: Tightly coupled with dashboard state

---

## Performance Considerations

### Current Optimizations

1. **Request Deduplication** (`supabaseOptimized.js:404-417`):
   - Prevents duplicate network requests
   - Promise caching by request key

2. **5-Minute Adapter Cache** (`SupabaseAdapterOptimized.js:22-39`):
   - Instant loads for repeated queries
   - Per-page result caching

3. **Background Preloading** (`usePaginatedDashboard.js:217-232`):
   - Preloads page 2 after page 1 loads
   - Zero-latency next page

4. **Infinite Scroll** (`usePaginatedDashboard.js:238-276`):
   - Seamless browsing
   - 200px threshold from bottom

5. **Optimistic UI Updates** (Dashboard.jsx:266-269):
   - Instant document creation feedback
   - Background sync

### Proposed Optimization: Incremental Updates

**Benefits**:
- Reduced network bandwidth (only fetch modified)
- Faster refresh (smaller dataset)
- Lower database load (filtered query)
- Better UX (minimal disruption)

**Trade-offs**:
- More complex state management
- Need to track last sync timestamp
- Merge logic for updates
- Potential for sync conflicts

**Estimated Impact**:
- Network: 90% reduction for typical session (few changes)
- Load time: 200ms → 50ms for incremental (75% faster)
- Database: Indexed query on `updated_at` column

---

## Recommended Implementation Approach

### Phase 1: Add Location-Based Refresh Detection

**Priority**: High
**Complexity**: Low
**Files**: `src/pages/Dashboard.jsx`

**Steps**:
1. Import `useLocation` from React Router
2. Add `location.pathname` to init effect dependency array
3. Add condition check before calling `loadInitial()`
4. Test navigation flow

**Estimated Effort**: 1 hour

### Phase 2: Implement Last Sync Timestamp Tracking

**Priority**: High
**Complexity**: Low
**Files**: `src/utils/sessionCache.js`, `src/hooks/usePaginatedDashboard.js`

**Steps**:
1. Add `setLastSyncTime()` and `getLastSyncTime()` to sessionCache
2. Store timestamp after successful `loadInitial()`
3. Add timestamp metadata to dashboard state
4. Test timestamp persistence

**Estimated Effort**: 2 hours

### Phase 3: Create Incremental Update Query

**Priority**: High
**Complexity**: Medium
**Files**: `src/lib/supabase-optimizations.ts`, database migration

**Steps**:
1. Create `getModifiedDocumentsWithRealActivity()` TypeScript function
2. Write database migration for new RPC function
3. Test query performance with indexed `updated_at` column
4. Add error handling

**Estimated Effort**: 4 hours

### Phase 4: Implement Incremental Refresh Function

**Priority**: High
**Complexity**: Medium
**Files**: `src/hooks/usePaginatedDashboard.js`, `src/pages/Dashboard.jsx`

**Steps**:
1. Add `refreshModified()` function to pagination hook
2. Implement merge logic for updated documents
3. Add loading state for incremental refresh
4. Wire up to dashboard navigation effect
5. Test edge cases (new docs, deleted docs, updated docs)

**Estimated Effort**: 6 hours

### Phase 5: Enhance Skeleton/Loading Indicators

**Priority**: Medium
**Complexity**: Low
**Files**: `src/pages/Dashboard.jsx`

**Steps**:
1. Add `isRefreshing` state for incremental updates
2. Create subtle "Syncing..." indicator (not full skeleton)
3. Position indicator in dashboard header
4. Animate appearance/disappearance
5. Test UX with delays

**Estimated Effort**: 2 hours

### Phase 6: Add Visibility API Integration

**Priority**: Low
**Complexity**: Low
**Files**: `src/pages/Dashboard.jsx`

**Steps**:
1. Add visibility change listener
2. Check time since last sync on tab focus
3. Trigger incremental refresh if stale
4. Test across browsers (mobile Safari, Chrome, Firefox)

**Estimated Effort**: 2 hours

### Phase 7: Implement Cache TTL

**Priority**: Low
**Complexity**: Medium
**Files**: `src/utils/sessionCache.js`

**Steps**:
1. Add `expiresAt` to cache metadata
2. Check expiration on `getBlocks()` and `getDocument()`
3. Auto-clear expired entries
4. Configure TTL per cache type
5. Test memory usage over time

**Estimated Effort**: 3 hours

**Total Estimated Effort**: 20 hours (2.5 days)

---

## Testing Strategy

### Unit Tests Needed

1. **Incremental Update Merge Logic**:
   - New document added → appears at top
   - Existing document updated → position changes
   - Document deleted → removed from list
   - Multiple simultaneous updates

2. **Cache Timestamp Tracking**:
   - Timestamp set after load
   - Timestamp retrieved correctly
   - Timestamp persists across renders

3. **Database Query**:
   - Returns only modified documents
   - Handles empty result set
   - Correctly filters by timestamp

### Integration Tests Needed

1. **Navigation Flow**:
   - Dashboard → Document → Dashboard (incremental refresh)
   - Dashboard → Settings → Dashboard (no changes, no refresh)
   - Multiple rapid navigations (deduplication works)

2. **Real-Time Scenarios**:
   - User A edits document, User B sees update on dashboard
   - Document created in another tab, appears after refresh
   - Long session with periodic refreshes

3. **Performance**:
   - Incremental refresh faster than full load
   - No memory leaks over extended session
   - Smooth UI during refresh (no flicker)

### Manual Testing Checklist

- [ ] First page load shows skeleton
- [ ] Navigate away and back shows instant state
- [ ] Edit document, navigate back, see updated title
- [ ] Create document, appears at top of dashboard
- [ ] Delete document, removed from dashboard
- [ ] Long session (1+ hour), data stays fresh
- [ ] Background tab, foreground again, triggers refresh if stale
- [ ] Multiple users editing, changes appear correctly
- [ ] Mobile Safari visibility API works
- [ ] Network failure during refresh handles gracefully

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER NAVIGATES TO DASHBOARD             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│            React Router (src/App.jsx)                          │
│  - Loads Dashboard.jsx component                              │
│  - No location.state passed                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│        Dashboard Component Mount/Update                        │
│  (src/pages/Dashboard.jsx:639)                                 │
│                                                                │
│  useEffect(() => {                                             │
│    if (user?.id && docs.length === 0 && !loading) {           │
│      loadInitial(); ← ONLY if documents array is empty        │
│    }                                                           │
│  }, [user?.id]); ← NO location dependency                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    CONDITION        CONDITION
      TRUE            FALSE
(First load)    (Navigate back)
         │                │
         ▼                │
┌─────────────────┐       │
│  loadInitial()  │       │
│  (Hook call)    │       │
└────┬────────────┘       │
     │                    │
     ▼                    ▼
┌─────────────────┐  ┌──────────────────────────┐
│ Show Skeleton   │  │  Show Cached State      │
│ (Full UI)       │  │  (Instant, No Network)   │
└────┬────────────┘  └──────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│       usePaginatedDashboard Hook                               │
│       (src/hooks/usePaginatedDashboard.js:44)                  │
│                                                                │
│  1. Check deduplication guard (loadingRef)                     │
│  2. Set isLoading = true                                      │
│  3. Call getDocumentsWithRealActivity()                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│      Database Query Function                                   │
│      (src/lib/supabase-optimizations.ts:274)                   │
│                                                                │
│  - Calls: supabase.rpc('get_documents_with_real_activity')    │
│  - Params: userId, limit: 50, offset: 0                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│      Supabase Client with Optimizations                       │
│      (src/lib/supabaseOptimized.js)                            │
│                                                                │
│  - Request deduplication (lines 404-417)                       │
│  - Retry with exponential backoff (lines 116-156)             │
│  - Connection pooling (poolSize: 50)                          │
│  - Circuit breaker (SupabaseAdapterOptimized.js:277)          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│    Supabase Adapter Cache Check                               │
│    (src/utils/storage/SupabaseAdapterOptimized.js:22)         │
│                                                                │
│  Cache Key: docs:userId:0:50:updated_at:false                 │
│  TTL: 5 minutes                                               │
└────────────────┬────────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    CACHE HIT        CACHE MISS
         │                │
         │                ▼
         │    ┌─────────────────────────────────────┐
         │    │   PostgreSQL Database                │
         │    │   Function: get_documents_with_...   │
         │    │   - Apply RLS (filter by user_id)   │
         │    │   - Join documents + audit logs     │
         │    │   - Aggregate edit counts           │
         │    │   - LIMIT 50 OFFSET 0               │
         │    └─────────────────────────────────────┘
         │                │
         │                ▼
         │    ┌─────────────────────────────────────┐
         │    │   Cache Result (5 min expiry)       │
         │    └─────────────────────────────────────┘
         │                │
         └────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Data Transformation (Hook)                               │
│       (usePaginatedDashboard.js:76-92)                         │
│                                                                │
│  - Convert snake_case → camelCase                             │
│  - Add activity data (edit counts, recent activity)           │
│  - Deduplicate by document ID                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Set React State                                          │
│       (usePaginatedDashboard.js:115-119)                       │
│                                                                │
│  - setDocuments(uniqueDocs)                                   │
│  - setTotalCount(totalCount)                                  │
│  - setHasMore(hasMoreDocs)                                    │
│  - setCurrentPage(0)                                          │
│  - setIsLoading(false)                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Dashboard State Sync (useEffect)                         │
│       (Dashboard.jsx:544-549)                                  │
│                                                                │
│  paginatedDocuments → setAllDocuments()                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Combine Folders + Documents (useEffect)                  │
│       (Dashboard.jsx:552-636)                                  │
│                                                                │
│  - Populate folders with their documents                      │
│  - Combine root folders + root documents                      │
│  - Sort by most recent activity                               │
│  - setEntries(combined)                                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       Render Dashboard UI                                      │
│       (Dashboard.jsx:1500)                                     │
│                                                                │
│  <DocumentGridRedesigned entries={filteredEntries} />         │
│  - Displays folder cards                                      │
│  - Displays document cards with activity charts              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary of Actionable Changes

### Files to Modify

1. **src/pages/Dashboard.jsx**:
   - Import `useLocation`
   - Add location dependency to init effect
   - Add incremental refresh logic
   - Add "Syncing..." indicator component
   - Add visibility API listener

2. **src/hooks/usePaginatedDashboard.js**:
   - Add `refreshModified()` function
   - Add `lastSyncTimestamp` state
   - Expose refresh function to Dashboard
   - Add merge logic for incremental updates

3. **src/lib/supabase-optimizations.ts**:
   - Add `getModifiedDocumentsWithRealActivity()` function
   - Add TypeScript interface for modified query options

4. **src/utils/sessionCache.js**:
   - Add `setLastSyncTime()` function
   - Add `getLastSyncTime()` function
   - (Optional) Add TTL to cache entries

5. **Database Migration** (new file):
   - Create `get_modified_documents_with_real_activity()` PostgreSQL function
   - Add index on `documents.updated_at` if not exists

### New Components Needed

1. **RefreshIndicator Component**:
   - Small badge in dashboard header
   - Shows during incremental refresh
   - Animated spinner + "Syncing..." text

### Testing Files to Create

1. **src/hooks/usePaginatedDashboard.test.js**:
   - Test incremental refresh merge logic
   - Test deduplication
   - Test error handling

2. **src/utils/sessionCache.test.js**:
   - Test timestamp storage/retrieval
   - Test cache expiration (if implemented)

### Documentation to Update

1. **CLAUDE.md**:
   - Add section on incremental updates
   - Document refresh strategy
   - Update data flow diagram

2. **thoughts/shared/research/** (this document):
   - Reference from CLAUDE.md
   - Link to implementation PRs

---

## Open Questions

1. **Refresh Frequency**: How often should incremental refresh occur?
   - On every navigation? (could be excessive)
   - Only if > 5 minutes since last load? (recommended)
   - Manual refresh button? (additional option)

2. **Conflict Resolution**: How to handle conflicts during incremental refresh?
   - Last write wins (simple)
   - Merge strategies (complex)
   - Show conflict UI (most user-friendly)

3. **Real-Time Updates**: Should we implement WebSocket/real-time updates?
   - Supabase Realtime subscriptions
   - Polling interval
   - Hybrid approach

4. **Cache Strategy**: Should we use more aggressive caching?
   - IndexedDB for offline access
   - Service Worker for background sync
   - Cache-first with background refresh

5. **Mobile Considerations**: Different strategy for mobile?
   - More aggressive caching (slower networks)
   - Background refresh restrictions
   - Data saver mode

---

## Related Research Documents

- **thoughts/shared/research/2025-11-06-dashboard-reload-skeleton-behavior.md** - Dashboard skeleton behavior analysis
- **thoughts/shared/plans/dashboard-pagination-implementation.md** - Pagination implementation plan
- **thoughts/shared/research/2025-10-26_dashboard-data-fetching-optimization.md** - Data fetching optimization research

---

## Conclusion

The current architecture loads data **once on mount** and caches it indefinitely within the browser session. Navigating back to the dashboard shows cached data instantly with no skeleton loading or network calls. This provides excellent perceived performance but can lead to stale data.

To implement incremental updates while maintaining performance:

1. **Add location-based refresh detection** to trigger updates when navigating to dashboard
2. **Track last sync timestamp** to determine what data has changed
3. **Create incremental query** to fetch only modified documents
4. **Merge updates** into existing state without full reload
5. **Show subtle indicator** during refresh (not full skeleton)

This approach balances **freshness** (show updated data) with **performance** (minimize network calls and UI disruption).

**Estimated implementation effort**: 20 hours over 2-3 days with full testing.
