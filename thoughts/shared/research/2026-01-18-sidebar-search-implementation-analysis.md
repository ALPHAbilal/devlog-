# Research: Sidebar Search Feature Implementation Analysis

**Date**: 2026-01-18
**Repository**: devlog-
**Branch**: main

## Research Question

Analyze the sidebar search feature to determine:
1. What is currently implemented for search
2. Whether it searches actual page content and folder titles
3. Identify the correct (non-duplicate) files

---

## Summary

The application has **two completely separate search implementations**:

| Feature | Sidebar SearchView | Dashboard Search |
|---------|-------------------|------------------|
| **Location** | `src/components/sidebar/views/SearchView.jsx` | `src/pages/Dashboard.jsx:952-992` |
| **Method** | Client-side `.includes()` filtering | Server-side PostgreSQL FTS |
| **Searches Titles** | ✅ Yes (in-memory) | ✅ Yes (FTS) |
| **Searches Block Content** | ❌ No (only if `content` prop exists) | ✅ Yes (database FTS) |
| **Searches Tags** | ❌ No | ✅ Yes |
| **Searches Folders** | ❌ No | ❌ No |
| **Debounce** | None (instant) | 300ms |
| **Limit** | 20 results | 100 results |

**Key Finding**: The sidebar search does NOT search actual page content (blocks) or folder names. It only filters documents already loaded in memory by their title/name fields.

---

## Detailed Findings

### 1. Sidebar SearchView Component

**File**: `src/components/sidebar/views/SearchView.jsx`

**Current Implementation** (lines 17-49):
```javascript
const searchResults = useMemo(() => {
  if (!searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  const results = documents
    .filter(doc =>
      (doc.title?.toLowerCase().includes(term)) ||
      (doc.name?.toLowerCase().includes(term)) ||
      (doc.content?.toLowerCase().includes(term))  // Only if content exists on document object
    )
    .slice(0, 20);
  // ...sorting logic
}, [searchTerm, documents]);
```

**What it searches**:
- `doc.title` - document title (string)
- `doc.name` - document name (string, if present)
- `doc.content` - only if this field exists on the document object passed as prop

**What it does NOT search**:
- Block content from database
- Folder names
- Tags

**Props received**: `{ documents, onOpenDocument }` - receives pre-loaded documents array from parent

---

### 2. Dashboard Server-Side Search

**File**: `src/pages/Dashboard.jsx:952-992`

**Implementation**:
```javascript
useEffect(() => {
  if (!searchTerm || searchTerm.trim() === '') {
    setSearchResults([]);
    return;
  }

  const searchTimer = setTimeout(async () => {
    setIsSearching(true);
    try {
      const results = await storageWrapper.searchDocuments(user.id, searchTerm.trim(), {
        limit: 100,
        offset: 0
      });
      // ...format and set results
    } catch (error) {
      setSearchError(error.message);
    }
  }, 300); // 300ms debounce
}, [searchTerm, user?.id]);
```

**What it searches** (via PostgreSQL FTS):
- Document titles (with FTS ranking)
- Document tags (ILIKE matching)
- Block content (FTS on blocks table)

---

### 3. Database Search Functions

**Supabase Project**: `zqcjipwiznesnbgbocnu` (devlog)

**Available search-related functions**:
| Function | Purpose |
|----------|---------|
| `search_documents_with_blocks` | Main FTS function - searches titles, tags, blocks |
| `search_documents_optimized` | Optimized document search |
| `mcp_search_documents` | MCP API document search |
| `mcp_search_blocks` | MCP API block search |
| `update_block_search_vector` | Trigger to update block search vectors |
| `update_document_search_vector` | Trigger to update document search vectors |

**FTS Infrastructure** (from migration `20251102193725_add_full_text_search.sql`):

```sql
-- GIN indexes exist on:
CREATE INDEX idx_blocks_content_fts
ON blocks USING gin(to_tsvector('english', coalesce(content, '')));

CREATE INDEX idx_documents_title_fts
ON documents USING gin(to_tsvector('english', coalesce(title, '')));
```

**search_documents_with_blocks function** searches:
1. **Document titles** - FTS with `ts_rank()` scoring + ILIKE fallback
2. **Document tags** - ILIKE matching against tags array
3. **Block content** - FTS with aggregated content from blocks table

---

### 4. Folder Search Status

**Current state**: Folders are NOT searchable

**Database table** `folders`:
- Has `name` column (text)
- NO `search_vector` column
- NO FTS index on `name`

**No folder search in**:
- SearchView.jsx
- Dashboard.jsx
- Any RPC functions

---

### 5. Storage Layer

**File**: `src/utils/storage/SupabaseAdapterOptimized.js:444-476`

```javascript
async searchDocuments(userId, query, options = {}) {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await this.supabase.rpc('search_documents_with_blocks', {
    p_user_id: userId,
    p_search_query: query,
    p_limit: limit,
    p_offset: offset
  });

  // Sort by relevance score
  return result.data.sort((a, b) => b.match_score - a.match_score);
}
```

**File**: `src/utils/storage/storageWrapper.js:288-310`

```javascript
export async function searchDocuments(userId, query, options = {}) {
  const storageAdapter = await init();

  if (storageAdapter.supabaseAdapter?.searchDocuments) {
    return await storageAdapter.supabaseAdapter.searchDocuments(userId, query, options);
  }

  // Fallback: client-side filter (only title/content)
  const allEntries = await storageAdapter.loadEntries();
  return allEntries.filter(entry =>
    entry.title?.toLowerCase().includes(query.toLowerCase()) ||
    entry.content?.toLowerCase().includes(query.toLowerCase())
  );
}
```

---

## File Reference Map (Active Files Only)

### Primary Search Files
| File | Purpose | Status |
|------|---------|--------|
| `src/components/sidebar/views/SearchView.jsx` | Sidebar search UI | ✅ Active - client-side only |
| `src/pages/Dashboard.jsx` | Dashboard with server-side search | ✅ Active |
| `src/utils/storage/storageWrapper.js` | Storage abstraction | ✅ Active |
| `src/utils/storage/SupabaseAdapterOptimized.js` | Supabase FTS calls | ✅ Active |

### Database Migrations
| File | Purpose |
|------|---------|
| `supabase/migrations/20251102193725_add_full_text_search.sql` | FTS setup (deployed) |

### Related (Not Duplicate)
| File | Purpose |
|------|---------|
| `src/components/sidebar/SidebarEnhanced.jsx` | Renders SearchView |
| `src/components/NavigationCommandPalette.jsx` | Quick navigation fuzzy search |
| `src/components/CommandPalette.jsx` | Command palette search |

### Legacy/Unused (Ignore)
| File | Reason |
|------|--------|
| `src/components/ProjectExplorer/SearchBar.jsx` | Old component, ProjectExplorer less used |

---

## Existing Plan

A comprehensive implementation plan exists at:
`thoughts/shared/plans/2026-01-15-supabase-fts-search-enhancement.md`

This plan proposes:
1. Add folder search to RPC via new `search_all()` function
2. Update SearchView to call FTS instead of local filtering
3. Add loading states and match reason badges

**Status**: Plan exists but NOT implemented yet

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Types in Search                    │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   Sidebar SearchView    │          │    Dashboard Search     │
│   (SearchView.jsx)      │          │    (Dashboard.jsx)      │
└─────────────────────────┘          └─────────────────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   Client-side Filter    │          │  storageWrapper.        │
│   on `documents` prop   │          │  searchDocuments()      │
│   - title.includes()    │          └─────────────────────────┘
│   - name.includes()     │                       │
│   - content.includes()  │                       ▼
└─────────────────────────┘          ┌─────────────────────────┐
           │                          │  SupabaseAdapter.       │
           ▼                          │  searchDocuments()      │
┌─────────────────────────┐          └─────────────────────────┘
│   Returns 20 results    │                       │
│   No block content      │                       ▼
│   No folders            │          ┌─────────────────────────┐
│   No tags               │          │  Supabase RPC:          │
└─────────────────────────┘          │  search_documents_      │
                                     │  with_blocks()          │
                                     └─────────────────────────┘
                                                  │
                                                  ▼
                                     ┌─────────────────────────┐
                                     │  PostgreSQL FTS         │
                                     │  - titles (GIN index)   │
                                     │  - tags (ILIKE)         │
                                     │  - blocks (GIN index)   │
                                     │  - ❌ NO folders        │
                                     └─────────────────────────┘
```

---

## Gaps Summary

| Feature | Current State | Location of Gap |
|---------|--------------|-----------------|
| Sidebar searches block content | ❌ Not implemented | `SearchView.jsx` uses client-side filter |
| Sidebar searches folder names | ❌ Not implemented | No folder search anywhere |
| Sidebar uses FTS | ❌ Not implemented | Uses `.includes()` instead |
| Dashboard searches folders | ❌ Not implemented | RPC doesn't include folders |
| Folder FTS index | ❌ Not created | No migration for folder FTS |

---

## Database Schema Reference

### documents table (search-relevant columns)
- `title` (text) - ✅ Indexed with GIN FTS
- `tags` (text[]) - ✅ Searched with ILIKE
- `search_vector` (tsvector) - ✅ Exists

### blocks table (search-relevant columns)
- `content` (text) - ✅ Indexed with GIN FTS
- `search_vector` (tsvector) - ✅ Exists

### folders table (search-relevant columns)
- `name` (text) - ❌ No FTS index
- No `search_vector` column

---

## Open Questions

1. Should SearchView use the same `storageWrapper.searchDocuments()` as Dashboard, or a new `searchAll()` function that includes folders?
2. Should folder search be a separate feature or integrated into the unified search?
3. How should search results display the match context (which field matched)?
