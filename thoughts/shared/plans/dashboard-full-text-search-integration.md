# Dashboard Full-Text Search Integration Plan

## Overview

Integrate PostgreSQL full-text search into the dashboard to enable searching across all document blocks (titles, tags, and block content) without loading blocks to the client. This will make the search feature actually useful by allowing users to find documents based on their content, not just titles.

## Current State Analysis

### What Exists:
- **Migration file exists locally**: `supabase/migrations/20250201_add_full_text_search.sql`
  - Defines `search_documents_with_blocks()` PostgreSQL function
  - Creates GIN indexes for fast full-text search
  - Searches titles, tags, and ALL block content
  - Returns match reason (title/tags/blocks) and relevance scores

- **Basic search in frontend**: `src/utils/storage/SupabaseAdapterOptimized.js:438-464`
  - Uses simple ILIKE pattern matching
  - Only searches document titles
  - Does NOT use any server-side search functions

- **Client-side filtering**: `src/pages/Dashboard.jsx:1087-1145`
  - Filters already-loaded documents
  - Has `getFullTextContent()` helper (lines 1009-1075)
  - Can't search blocks because they're not loaded in dashboard

- **Pagination system**: Loads 50 documents at a time (metadata only, no blocks)
  - `src/hooks/usePaginatedDashboard.js`
  - Intentionally doesn't load blocks for performance

### What's Missing:
- **Migration NOT applied to database** (verified via MCP Supabase)
  - Function `search_documents_with_blocks` does NOT exist in production
  - GIN indexes do NOT exist
  - Need to apply migration with proper timestamp

- **Frontend NOT integrated with server-side search**
  - `searchDocuments()` doesn't call the RPC function
  - Dashboard still uses client-side title-only filtering
  - Can't search unopened documents' blocks

### Key Discoveries:
- Database has `mcp_search_documents` (title/tags only) and `mcp_search_blocks` (single document) functions
- These are used by MCP server but NOT by web app
- Performance data: MCP search averages ~129ms (from AI-MEMORY/PATTERNS.md:835)
- Migration file is back-dated (20250201) but never applied
- Latest applied migration: `20251102130239_fix_audit_trigger_uuid_qualified`

## Desired End State

### Functional Requirements:
1. ✅ Users can search ALL document content (titles, tags, blocks) from dashboard
2. ✅ Search works WITHOUT loading blocks to client
3. ✅ Results sorted by relevance (best matches first)
4. ✅ Fast search response (~100-200ms)
5. ✅ Match indicators show WHERE the match occurred (title/tags/blocks)
6. ✅ Search debounced (300ms) to prevent excessive queries
7. ✅ Loading states during search
8. ✅ Helpful empty state when no results found

### Technical Requirements:
1. ✅ `search_documents_with_blocks()` function exists in database
2. ✅ GIN indexes on `blocks.content` and `documents.title`
3. ✅ `SupabaseAdapterOptimized.searchDocuments()` calls RPC function
4. ✅ Dashboard uses server-side search instead of client-side filtering
5. ✅ Legacy `getFullTextContent()` function removed (no longer needed)
6. ✅ Proper error handling and fallback behavior

### Verification:
- Search for "react" finds documents with "react" in blocks (not just title)
- Search results show match reason badges (Title/Tags/Content)
- Results sorted by relevance score
- Search completes in < 200ms
- No blocks loaded to client during search

## What We're NOT Doing

- ❌ Adding fuzzy search or typo correction (can be added later)
- ❌ Adding search filters by date/folder/project (can be added later)
- ❌ Adding search history or suggestions (can be added later)
- ❌ Adding search result highlighting/snippets (optional Phase 4)
- ❌ Modifying the MCP search functions (those work fine)
- ❌ Changing pagination system (works well as-is)
- ❌ Loading blocks to client (defeats the purpose)

## Implementation Approach

### Strategy:
1. **Database first**: Apply migration with correct timestamp
2. **Backend integration**: Update storage adapter to use RPC function
3. **Frontend integration**: Update dashboard to call new search
4. **Cleanup**: Remove legacy client-side search code
5. **Polish**: Add UI enhancements for better UX

### Key Decisions:
- Use proper migration timestamp (20251102XXXXXX) not back-dated
- Keep existing pagination system (compatible with LIMIT/OFFSET)
- 300ms debounce matches SearchBar component pattern
- Remove `getFullTextContent()` since server does the work
- Add match reason badges for better UX

---

## Phase 1: Database Migration & Verification

### Overview
Apply the full-text search migration to the production database and verify it works correctly.

### Changes Required:

#### 1. Rename Migration File
**File**: `supabase/migrations/20250201_add_full_text_search.sql`
**Action**: Rename to use current timestamp

```bash
mv supabase/migrations/20250201_add_full_text_search.sql \
   supabase/migrations/20251102201500_add_full_text_search.sql
```

**Reasoning**: Migration files must have timestamps newer than the latest applied migration to be picked up by Supabase.

#### 2. Apply Migration
**Command**: Push migration to Supabase

```bash
npx supabase db push
```

Or if using Supabase CLI directly:
```bash
supabase db push
```

**Expected Output**:
- Migration applies successfully
- Function `search_documents_with_blocks` created
- GIN indexes created on `blocks.content` and `documents.title`

#### 3. Verify Migration Applied
**Test Query**: Run directly in Supabase SQL Editor or via MCP

```sql
-- Check function exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name = 'search_documents_with_blocks'
) as function_exists;

-- Check indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN ('idx_blocks_content_fts', 'idx_documents_title_fts');

-- Test function with sample query
SELECT id, title, match_reason, match_score
FROM search_documents_with_blocks(
  'YOUR_USER_ID'::uuid,
  'test',
  10,
  0
)
LIMIT 5;
```

**Expected Results**:
- `function_exists` = `true`
- Both indexes listed
- Sample query returns documents with scores

### Success Criteria:

#### Automated Verification:
- [ ] Migration file renamed with timestamp: `ls supabase/migrations/20251102201500_add_full_text_search.sql`
- [ ] Migration applies without errors: `npx supabase db push`
- [ ] Function exists in database: SQL query returns `true`
- [ ] Indexes created: SQL query returns 2 rows

#### Manual Verification:
- [ ] Test query returns documents with match_score values
- [ ] Different search terms return different scores
- [ ] match_reason shows 'title', 'tags', or 'blocks' correctly
- [ ] Search completes in < 300ms (check query logs)

---

## Phase 2: Storage Adapter Integration

### Overview
Update the `SupabaseAdapterOptimized` to call the new RPC function instead of using ILIKE on titles.

### Changes Required:

#### 1. Update searchDocuments Method
**File**: `src/utils/storage/SupabaseAdapterOptimized.js`
**Lines**: 438-464

**Current Implementation** (REMOVE):
```javascript
async searchDocuments(userId, query, options = {}) {
  const { limit = 20 } = options;
  const cacheKey = `search:${userId}:${query}:${limit}`;
  const cached = this.getCached(cacheKey);
  if (cached) return cached;

  try {
    const result = await deduplicateRequest(cacheKey, async () => {
      return this.supabase
        .from('documents')
        .select('id, title, tags, updated_at')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .or(`title.ilike.%${query}%`)  // ❌ Only searches titles
        .order('updated_at', { ascending: false })
        .limit(limit);
    });

    if (result.error) throw result.error;

    this.setCache(cacheKey, result.data);
    return result.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}
```

**New Implementation** (REPLACE WITH):
```javascript
/**
 * Search documents using full-text search across titles, tags, and block content
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum results (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<Array>} Array of documents with match_reason and match_score
 */
async searchDocuments(userId, query, options = {}) {
  const { limit = 50, offset = 0 } = options;
  const cacheKey = `search:${userId}:${query}:${limit}:${offset}`;
  const cached = this.getCached(cacheKey);
  if (cached) return cached;

  try {
    const result = await deduplicateRequest(cacheKey, async () => {
      // Call the full-text search RPC function
      const { data, error } = await this.supabase.rpc('search_documents_with_blocks', {
        p_user_id: userId,
        p_search_query: query,
        p_limit: limit,
        p_offset: offset
      });

      if (error) throw error;

      return { data, error: null };
    });

    if (result.error) throw result.error;

    // Sort by relevance score (highest first)
    const sorted = result.data.sort((a, b) => b.match_score - a.match_score);

    this.setCache(cacheKey, sorted);
    return sorted;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}
```

**Key Changes**:
- ✅ Calls `rpc('search_documents_with_blocks')` instead of table query
- ✅ Accepts `offset` parameter for pagination
- ✅ Sorts results by `match_score` (relevance)
- ✅ Maintains caching and deduplication
- ✅ Returns full document objects with `match_reason` and `match_score`

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript/ESLint passes: `npm run lint`
- [ ] No compilation errors: `npm run build`
- [ ] Code follows existing patterns in file

#### Manual Verification:
- [ ] Calling `searchDocuments(userId, 'test')` returns results
- [ ] Results include `match_reason` and `match_score` fields
- [ ] Results sorted by score (highest first)
- [ ] Caching works (second call is instant)
- [ ] Error handling works (try with invalid user ID)

---

## Phase 3: Dashboard Search Integration

### Overview
Update the Dashboard component to use server-side search and remove legacy client-side filtering code.

### Changes Required:

#### 1. Add Server-Side Search State
**File**: `src/pages/Dashboard.jsx`
**Location**: Add near other state declarations (around line 79-97)

```javascript
// Add new state for server-side search
const [searchResults, setSearchResults] = useState([]);
const [isSearching, setIsSearching] = useState(false);
const [searchError, setSearchError] = useState(null);
```

#### 2. Add Search Effect Hook
**File**: `src/pages/Dashboard.jsx`
**Location**: Add after existing useEffect hooks (around line 633-638)

```javascript
// Server-side search effect
useEffect(() => {
  // Clear results when search term is empty
  if (!searchTerm || searchTerm.trim() === '') {
    setSearchResults([]);
    setSearchError(null);
    return;
  }

  // Debounce search by 300ms
  const searchTimer = setTimeout(async () => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const adapter = await storageWrapper.getAdapter();
      const results = await adapter.searchDocuments(user.id, searchTerm.trim(), {
        limit: 100,
        offset: 0
      });

      setSearchResults(results);
      console.log(`[Dashboard] Search found ${results.length} results for "${searchTerm}"`);
    } catch (error) {
      console.error('[Dashboard] Search error:', error);
      setSearchError(error.message);
      // Fallback: keep showing paginated documents
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 300); // 300ms debounce

  return () => clearTimeout(searchTimer);
}, [searchTerm, user?.id]);
```

**Key Features**:
- ✅ 300ms debounce prevents excessive queries
- ✅ Calls `adapter.searchDocuments()` with proper parameters
- ✅ Shows loading state during search
- ✅ Error handling with fallback to regular view
- ✅ Logs search results for debugging

#### 3. Update Display Logic
**File**: `src/pages/Dashboard.jsx`
**Location**: Replace `filteredEntries` logic (around lines 1077-1162)

**Current Code to REMOVE**:
```javascript
// Lines 1009-1075: getFullTextContent function - NO LONGER NEEDED
// Lines 1077-1162: filteredEntries useMemo - REPLACE
```

**New Code**:
```javascript
// Determine which entries to display: search results or paginated documents
const displayEntries = useMemo(() => {
  // If searching, use search results
  if (searchTerm && searchTerm.trim() !== '') {
    return searchResults;
  }

  // Otherwise, use regular paginated documents with filters
  return paginatedDocuments.filter(entry => {
    // Apply existing filters (project, tag, folder)
    if (selectedProject && entry.project_id !== selectedProject) return false;
    if (selectedTag && !entry.tags?.includes(selectedTag)) return false;
    if (selectedFolder !== undefined && entry.folder_id !== selectedFolder) return false;

    return true;
  });
}, [searchTerm, searchResults, paginatedDocuments, selectedProject, selectedTag, selectedFolder]);
```

**Key Changes**:
- ✅ Removed `getFullTextContent()` function (no longer needed)
- ✅ Removed client-side search filtering (done server-side now)
- ✅ Simplified logic: search results OR filtered paginated documents
- ✅ Maintains existing filter functionality (project, tag, folder)

#### 4. Update Grid Component Props
**File**: `src/pages/Dashboard.jsx`
**Location**: Update DocumentGridRedesigned call (around line 1578)

**Add new props**:
```javascript
<DocumentGridRedesigned
  documents={displayEntries}
  onDocumentClick={handleDocumentClick}
  onDocumentExpand={handleDocumentExpand}
  searchTerm={searchTerm}
  isSearching={isSearching}  // NEW: Show loading state
  searchError={searchError}   // NEW: Show errors
/>
```

#### 5. Update Empty State
**File**: `src/pages/Dashboard.jsx`
**Location**: Update empty state logic (around lines 1609-1627)

```javascript
{displayEntries.length === 0 && (
  <div className="text-center py-12">
    {isSearching ? (
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-500">Searching...</p>
      </div>
    ) : searchTerm ? (
      <div className="flex flex-col items-center gap-4">
        <svg className="w-16 h-16 text-gray-400" /* search icon */></svg>
        <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
        <p className="text-gray-500">
          No documents match your search for "<strong>{searchTerm}</strong>"
        </p>
        <p className="text-sm text-gray-400">
          Try different keywords or clear your search to see all documents.
        </p>
        {searchError && (
          <p className="text-sm text-red-500">Error: {searchError}</p>
        )}
      </div>
    ) : (
      <div className="flex flex-col items-center gap-4">
        <FileText className="w-16 h-16 text-gray-400" />
        <p className="text-gray-500">No documents yet. Create your first one!</p>
      </div>
    )}
  </div>
)}
```

**Key Features**:
- ✅ Shows loading spinner during search
- ✅ Helpful message when no results found
- ✅ Shows actual search term in message
- ✅ Displays errors if search fails
- ✅ Maintains existing empty state for no documents

### Success Criteria:

#### Automated Verification:
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No ESLint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in browser

#### Manual Verification:
- [ ] Typing in search bar triggers search after 300ms
- [ ] Search finds documents with matching titles
- [ ] Search finds documents with matching tags
- [ ] **Search finds documents with matching block content** (key test!)
- [ ] Search results sorted by relevance (best matches first)
- [ ] Loading spinner shows during search
- [ ] Empty state shows helpful message when no results
- [ ] Clearing search shows regular paginated documents
- [ ] Error handling works (disconnect network and try searching)
- [ ] Existing filters (project, tag, folder) still work

---

## Phase 4: UI Enhancements (Optional but Recommended)

### Overview
Add visual indicators to show where the match occurred (title/tags/blocks) and improve search result presentation.

### Changes Required:

#### 1. Add Match Reason Badge Component
**File**: `src/components/Dashboard/MatchReasonBadge.jsx` (NEW FILE)

```javascript
import React from 'react';
import { FileText, Tag, Code } from 'lucide-react';

/**
 * Badge showing where the search match occurred
 * @param {string} matchReason - 'title', 'tags', or 'blocks'
 * @param {number} matchScore - Relevance score (0.0-1.0)
 */
export function MatchReasonBadge({ matchReason, matchScore }) {
  const badges = {
    title: {
      icon: FileText,
      label: 'Title',
      className: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    tags: {
      icon: Tag,
      label: 'Tags',
      className: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    blocks: {
      icon: Code,
      label: 'Content',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    all: {
      icon: FileText,
      label: 'All',
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    }
  };

  const badge = badges[matchReason] || badges.all;
  const Icon = badge.icon;
  const scorePercent = Math.round(matchScore * 100);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${badge.className}`}>
      <Icon className="w-3 h-3" />
      <span>{badge.label}</span>
      {matchScore !== undefined && matchScore !== 1.0 && (
        <span className="opacity-75">· {scorePercent}%</span>
      )}
    </div>
  );
}
```

#### 2. Update DocumentGridRedesigned Component
**File**: `src/components/DocumentGridRedesigned.jsx`
**Changes**: Add match reason badge to document cards

```javascript
import { MatchReasonBadge } from './Dashboard/MatchReasonBadge';

// Inside the map function where documents are rendered:
<div className="document-card ...">
  {/* Existing document card content */}

  {/* Add match badge when searching */}
  {doc.match_reason && (
    <div className="mt-2">
      <MatchReasonBadge
        matchReason={doc.match_reason}
        matchScore={doc.match_score}
      />
    </div>
  )}
</div>
```

#### 3. Add Search Stats
**File**: `src/pages/Dashboard.jsx`
**Location**: Add above DocumentGridRedesigned (around line 1575)

```javascript
{searchTerm && searchResults.length > 0 && (
  <div className="mb-4 px-6">
    <p className="text-sm text-gray-600">
      Found <strong>{searchResults.length}</strong> document{searchResults.length !== 1 ? 's' : ''} matching "<strong>{searchTerm}</strong>"
      {isSearching && <span className="ml-2 text-gray-400">(searching...)</span>}
    </p>
  </div>
)}
```

### Success Criteria:

#### Automated Verification:
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No ESLint errors: `npm run lint`
- [ ] Component imports correctly

#### Manual Verification:
- [ ] Match badges appear on search results
- [ ] Badge shows "Title" for title matches (blue)
- [ ] Badge shows "Tags" for tag matches (purple)
- [ ] Badge shows "Content" for block matches (emerald)
- [ ] Relevance score percentage displays correctly
- [ ] Search stats show above results
- [ ] Stats update as search changes
- [ ] Badges are visually appealing and clear

---

## Phase 5: Testing & Cleanup

### Overview
Thoroughly test the search functionality and remove any remaining legacy code.

### Changes Required:

#### 1. Remove Legacy getFullTextContent Function
**File**: `src/pages/Dashboard.jsx`
**Lines**: 1009-1075
**Action**: DELETE the entire function (no longer used)

```javascript
// DELETE THESE LINES (1009-1075):
const getFullTextContent = useCallback((entry) => {
  // ... entire function ...
}, []);
```

**Reasoning**: Server-side search handles content extraction, this function is obsolete.

#### 2. Remove Unused Imports
**File**: `src/pages/Dashboard.jsx`
**Action**: Check for unused imports after removing `getFullTextContent`

#### 3. Update Documentation
**File**: `docs/FULL_TEXT_SEARCH_IMPLEMENTATION.md`
**Action**: Update to reflect actual implementation

Add note at top:
```markdown
## Status: ✅ IMPLEMENTED

**Applied**: November 2, 2025
**Migration**: `20251102201500_add_full_text_search.sql`
**Frontend Integration**: `Dashboard.jsx` and `SupabaseAdapterOptimized.js`

The full-text search is now live and actively used in the dashboard.
```

#### 4. Update Research Document
**File**: `thoughts/shared/research/2025-11-02_dashboard-search-blocks-solution.md`
**Action**: Add implementation status note at top

```markdown
## Implementation Status

✅ **IMPLEMENTED** - See implementation plan: `thoughts/shared/plans/dashboard-full-text-search-integration.md`

Applied: November 2, 2025
```

### Testing Checklist:

#### Unit Tests (if applicable):
- Test `searchDocuments()` method with various queries
- Test edge cases (empty query, special characters, very long query)
- Test caching behavior
- Test error handling

#### Integration Tests:
- End-to-end search flow: type → search → display results
- Search across different match types (title, tags, blocks)
- Pagination with search results
- Filter interaction (project, tag, folder) with search

### Manual Testing Steps:

#### Basic Search:
1. [ ] Open dashboard
2. [ ] Type "react" in search bar
3. [ ] Wait 300ms for debounce
4. [ ] Verify loading spinner shows briefly
5. [ ] Verify results appear
6. [ ] Verify results include documents with "react" in blocks (not just titles)
7. [ ] Verify match badges show correct type (Title/Tags/Content)

#### Advanced Search:
8. [ ] Search for term that appears in multiple places (title + blocks)
9. [ ] Verify results sorted by relevance (title matches ranked higher)
10. [ ] Search for term that ONLY appears in blocks (not titles)
11. [ ] Verify those documents still found
12. [ ] Search for nonsense term "xyzabc123"
13. [ ] Verify empty state shows with helpful message

#### Performance:
14. [ ] Search completes in < 200ms (check Network tab)
15. [ ] No blocks loaded to client (check Network tab payload size)
16. [ ] Second search with same term is instant (cached)
17. [ ] Dashboard remains responsive during search

#### Error Handling:
18. [ ] Disconnect network
19. [ ] Try searching
20. [ ] Verify error message shows
21. [ ] Verify fallback to regular view works
22. [ ] Reconnect network and verify search works again

#### Filters Integration:
23. [ ] Apply project filter
24. [ ] Search within filtered results
25. [ ] Verify both filters work together
26. [ ] Clear search, verify project filter persists
27. [ ] Repeat with tag and folder filters

#### Edge Cases:
28. [ ] Search with empty string → shows all documents
29. [ ] Search with only spaces → shows all documents
30. [ ] Search with special characters: `"react" & "hooks"`
31. [ ] Search with very long query (100+ characters)
32. [ ] Search while pagination loading
33. [ ] Search, then immediately navigate to document

### Success Criteria:

#### Automated Verification:
- [ ] All unit tests pass: `npm test` (if tests exist)
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] No ESLint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors or warnings in browser

#### Manual Verification:
- [ ] All 33 manual test steps pass
- [ ] Search finds documents by content (not just title)
- [ ] Performance acceptable (< 200ms search time)
- [ ] No blocks loaded to client during search
- [ ] Match badges show correct types
- [ ] Empty states are helpful and clear
- [ ] Error handling works gracefully
- [ ] No visual glitches or UI bugs
- [ ] Mobile experience works well (if applicable)

---

## Testing Strategy

### Unit Tests

**File**: `src/utils/storage/__tests__/SupabaseAdapterOptimized.test.js`

Tests to add:
- `searchDocuments()` returns results in correct format
- `searchDocuments()` includes match_reason and match_score fields
- `searchDocuments()` sorts by relevance score
- `searchDocuments()` handles empty query
- `searchDocuments()` handles pagination (offset)
- `searchDocuments()` caches results correctly
- `searchDocuments()` handles errors gracefully

### Integration Tests

**Scenario 1: Basic Search Flow**
1. User opens dashboard → paginated documents load
2. User types "react" in search → search triggers after 300ms
3. Server-side search executes → RPC function called
4. Results returned → sorted by relevance
5. UI updates → results displayed with badges
6. User clears search → back to paginated view

**Scenario 2: Content-Only Match**
1. User searches for term that only appears in block content
2. Document found even though term not in title
3. Badge shows "Content" as match reason
4. Score indicates relevance

**Scenario 3: Mixed Filtering**
1. User applies project filter → documents filtered
2. User searches within project → search + filter both applied
3. Results match both criteria
4. User clears search → project filter persists

### Performance Benchmarks

**Target Metrics**:
- Search query execution: < 150ms (database)
- Total search time: < 200ms (including network)
- Initial page load: < 3 seconds (unchanged)
- Dashboard render: < 100ms (unchanged)

**Measurement**:
```javascript
// Add to Dashboard.jsx search effect for testing
console.time('Search Duration');
const results = await adapter.searchDocuments(user.id, searchTerm);
console.timeEnd('Search Duration');
```

Check Supabase logs for query execution time.

---

## Performance Considerations

### Query Performance:
- **GIN indexes** make full-text search fast (< 100ms for 1000s of documents)
- **Partial indexes** (`WHERE deleted_at IS NULL`) reduce index size
- **LIMIT/OFFSET** prevents loading too many results
- **Caching** in SupabaseAdapter reduces repeated queries

### Network Performance:
- Search payload is small (document metadata only, NO blocks)
- 300ms debounce reduces number of queries
- Deduplication prevents concurrent identical queries
- Results cached for 5 minutes (existing cache system)

### Client Performance:
- No client-side block processing (done server-side)
- Simplified filtering logic (removed complex `getFullTextContent()`)
- React memoization on `displayEntries` prevents unnecessary re-renders
- Pagination system unchanged (still efficient)

### Database Load:
- GIN indexes prevent full table scans
- Function uses `LIMIT` to cap result size
- Filters applied at query time (not post-processing)
- No N+1 query issues (single RPC call)

### Potential Issues & Mitigations:

**Issue**: Search slower than expected (> 300ms)
- **Check**: GIN indexes created (`EXPLAIN ANALYZE` the query)
- **Fix**: Ensure migration applied correctly
- **Monitor**: Supabase query logs

**Issue**: Too many search queries
- **Check**: Debounce working (should be 300ms)
- **Fix**: Verify `setTimeout` cleanup in useEffect
- **Optimize**: Increase debounce to 500ms if needed

**Issue**: Stale cache results
- **Check**: Cache expiry time (currently 5 minutes)
- **Fix**: Reduce cache TTL or invalidate on document changes
- **Consider**: Event-based cache invalidation

---

## Migration Notes

### Applying the Migration:

**Pre-requisites**:
- Supabase CLI installed or access to Supabase dashboard
- Database connection configured
- Backup recommended (Supabase auto-backs up, but verify)

**Steps**:
1. Rename migration file with current timestamp
2. Review migration SQL (ensure no harmful commands)
3. Apply via CLI: `npx supabase db push`
4. Verify function and indexes created
5. Test function with sample query

**Rollback Plan** (if needed):
```sql
-- If migration fails or causes issues, rollback:
DROP FUNCTION IF EXISTS search_documents_with_blocks(UUID, TEXT, INTEGER, INTEGER);
DROP INDEX IF EXISTS idx_blocks_content_fts;
DROP INDEX IF EXISTS idx_documents_title_fts;
```

Save this as `rollback_full_text_search.sql` for emergency use.

### Data Migration:
- **No data migration needed** - function operates on existing data
- **Indexes built automatically** - may take 1-2 minutes for large databases
- **No downtime required** - function can be added while app is running
- **Backward compatible** - old search code continues working until replaced

### Deployment Strategy:

**Option A: Deploy Frontend After Database** (Recommended)
1. Apply database migration first
2. Verify function works in production
3. Deploy frontend changes
4. Monitor for errors

**Option B: Feature Flag** (Safest)
1. Add environment variable: `ENABLE_FULL_TEXT_SEARCH=false`
2. Deploy frontend with flag check
3. Apply database migration
4. Test in production with flag enabled for you
5. Enable for all users once verified

**Feature Flag Implementation**:
```javascript
// In Dashboard.jsx search effect
const USE_FULL_TEXT_SEARCH = import.meta.env.VITE_ENABLE_FULL_TEXT_SEARCH !== 'false';

if (USE_FULL_TEXT_SEARCH) {
  // Use new server-side search
  const results = await adapter.searchDocuments(user.id, searchTerm);
} else {
  // Fall back to old client-side search
  // ... existing code ...
}
```

---

## References

- **Research Document**: `thoughts/shared/research/2025-11-02_dashboard-search-blocks-solution.md`
- **Migration File**: `supabase/migrations/20250201_add_full_text_search.sql` (to be renamed)
- **Documentation**: `docs/FULL_TEXT_SEARCH_IMPLEMENTATION.md`
- **AI-MEMORY Patterns**: `AI-MEMORY/PATTERNS.md:835` (MCP search performance data)
- **Storage Adapter**: `src/utils/storage/SupabaseAdapterOptimized.js:438-464`
- **Dashboard Search**: `src/pages/Dashboard.jsx:1087-1145`
- **Pagination Hook**: `src/hooks/usePaginatedDashboard.js`

---

## Implementation Timeline Estimate

**Phase 1** (Database): 30 minutes
- Rename migration: 2 minutes
- Apply migration: 5 minutes
- Verify function/indexes: 10 minutes
- Test queries: 13 minutes

**Phase 2** (Storage Adapter): 45 minutes
- Update searchDocuments(): 20 minutes
- Test method: 15 minutes
- Handle edge cases: 10 minutes

**Phase 3** (Dashboard): 1.5 hours
- Add search state: 10 minutes
- Add search effect: 20 minutes
- Update display logic: 30 minutes
- Update empty states: 20 minutes
- Testing: 10 minutes

**Phase 4** (UI Enhancements): 1 hour
- Create badge component: 30 minutes
- Integrate badges: 20 minutes
- Add search stats: 10 minutes

**Phase 5** (Testing & Cleanup): 1 hour
- Remove legacy code: 15 minutes
- Update documentation: 15 minutes
- Manual testing: 30 minutes

**Total**: ~4.5 hours for complete implementation

---

## Next Steps

1. ✅ Get approval on this plan
2. ⏳ Apply database migration (Phase 1)
3. ⏳ Update storage adapter (Phase 2)
4. ⏳ Integrate with dashboard (Phase 3)
5. ⏳ Add UI enhancements (Phase 4)
6. ⏳ Test and cleanup (Phase 5)

Each phase can be tested independently before moving to the next, allowing for iterative validation and early detection of issues.
