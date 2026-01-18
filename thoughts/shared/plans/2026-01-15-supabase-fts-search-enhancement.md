# Supabase Full-Text Search Enhancement - Implementation Plan

## Overview

Upgrade the sidebar search from client-side keyword matching to Supabase PostgreSQL Full-Text Search (FTS). This enables searching across all documents, blocks, folders, and tags with relevance ranking, stemming, and proper result display.

## Current State Analysis

### What Already Exists (Discovered During Research)

1. **FTS Migration**: `supabase/migrations/20251102201500_add_full_text_search.sql`
   - RPC function `search_documents_with_blocks()` already created
   - GIN indexes on `blocks.content` and `documents.title`
   - Searches: document titles, tags, block content
   - Returns: `match_reason` ('title', 'tags', 'blocks') and `match_score`

2. **Adapter Integration**: `src/utils/storage/SupabaseAdapterOptimized.js:444-476`
   - `searchDocuments()` method already calls the RPC
   - Exposed via `storageWrapper.searchDocuments()`

3. **Dashboard Usage**: `src/pages/Dashboard.jsx:963-966`
   - Already uses `storageWrapper.searchDocuments()` for search

### What's NOT Working

1. **SearchView.jsx** (lines 17-49): Uses client-side `.includes()` filtering instead of FTS
2. **Folders**: Not included in FTS search
3. **Block JSON Content**: Complex blocks (AI, Table, Todo) store JSON - FTS searches raw JSON string

## Desired End State

After implementation:
- Sidebar search uses Supabase FTS via `search_documents_with_blocks` RPC
- Search results show match context (where the match was found)
- Folders are searchable by name
- Results ranked by relevance with title matches prioritized
- Debounced search (300ms) to avoid excessive API calls
- Loading states during search

### Verification Criteria
- Searching "react" finds documents with "react" in title, blocks, or tags
- Searching "folder-name" finds matching folders
- Stemming works: "debugging" matches "debug"
- Results show which field matched (title/blocks/tags/folder)

## What We're NOT Doing

- Offline search fallback (explicitly excluded per user request)
- Extracting searchable text from complex JSON blocks (would require migration changes)
- Full-text search on folder descriptions (folders only have `name`)
- Search highlighting within block content
- Advanced search operators exposed to UI (AND/OR/NOT)

## Implementation Approach

Minimal changes to leverage existing infrastructure. The RPC function already exists - we just need to:
1. Add folder search to the RPC
2. Update SearchView to call the FTS instead of local filtering
3. Improve result display with match context

---

## Phase 1: Add Folder Search to RPC

### Overview
Extend the existing `search_documents_with_blocks` RPC to also search folders, or create a unified search function.

### Changes Required

#### 1. New Migration: Add Folder Search
**File**: `supabase/migrations/20260115_add_folder_search_to_fts.sql`

```sql
-- Migration: Add folder search to full-text search
-- Extends search_documents_with_blocks to include folders

-- Create index for folder name search
CREATE INDEX IF NOT EXISTS idx_folders_name_fts
ON folders USING gin(to_tsvector('english', coalesce(name, '')));

-- Create unified search function that returns both documents and folders
CREATE OR REPLACE FUNCTION search_all(
  p_user_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  result_type TEXT,           -- 'document' or 'folder'
  id UUID,
  title TEXT,                 -- document title or folder name
  parent_id UUID,             -- folder_id for documents, parent_id for folders
  match_reason TEXT,          -- 'title', 'tags', 'blocks', 'folder_name'
  match_score REAL,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query_tsquery tsquery;
  v_search_term TEXT;
BEGIN
  v_search_term := trim(p_search_query);

  -- Empty search returns recent items
  IF v_search_term = '' OR v_search_term IS NULL THEN
    RETURN QUERY
    (
      SELECT
        'document'::TEXT,
        d.id,
        d.title,
        d.folder_id,
        'all'::TEXT,
        1.0::REAL,
        d.updated_at
      FROM documents d
      WHERE d.user_id = p_user_id AND d.deleted_at IS NULL
      ORDER BY d.updated_at DESC
      LIMIT p_limit
    );
    RETURN;
  END IF;

  -- Prepare tsquery
  v_search_term := regexp_replace(v_search_term, '\s+', ' & ', 'g');
  v_query_tsquery := plainto_tsquery('english', v_search_term);

  RETURN QUERY
  WITH all_matches AS (
    -- Document title matches (weight: high)
    SELECT
      'document'::TEXT as result_type,
      d.id,
      d.title,
      d.folder_id as parent_id,
      'title'::TEXT as match_reason,
      ts_rank(to_tsvector('english', coalesce(d.title, '')), v_query_tsquery) + 0.5 as match_score,
      d.updated_at
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND (
        to_tsvector('english', coalesce(d.title, '')) @@ v_query_tsquery
        OR d.title ILIKE '%' || p_search_query || '%'
      )

    UNION ALL

    -- Document tag matches (weight: medium-high)
    SELECT
      'document'::TEXT,
      d.id,
      d.title,
      d.folder_id,
      'tags'::TEXT,
      0.8::REAL,
      d.updated_at
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 FROM unnest(d.tags) AS tag
        WHERE tag ILIKE '%' || p_search_query || '%'
      )

    UNION ALL

    -- Block content matches (weight: medium)
    SELECT DISTINCT
      'document'::TEXT,
      d.id,
      d.title,
      d.folder_id,
      'blocks'::TEXT,
      ts_rank(
        to_tsvector('english', coalesce(string_agg(b.content::text, ' '), '')),
        v_query_tsquery
      ) + 0.3 as match_score,
      d.updated_at
    FROM documents d
    INNER JOIN blocks b ON b.document_id = d.id
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND (
        to_tsvector('english', coalesce(b.content::text, '')) @@ v_query_tsquery
        OR b.content::text ILIKE '%' || p_search_query || '%'
      )
    GROUP BY d.id, d.title, d.folder_id, d.updated_at

    UNION ALL

    -- Folder name matches (weight: high)
    SELECT
      'folder'::TEXT,
      f.id,
      f.name,
      f.parent_id,
      'folder_name'::TEXT,
      ts_rank(to_tsvector('english', coalesce(f.name, '')), v_query_tsquery) + 0.6 as match_score,
      f.updated_at
    FROM folders f
    WHERE f.user_id = p_user_id
      AND f._deleted = false
      AND (
        to_tsvector('english', coalesce(f.name, '')) @@ v_query_tsquery
        OR f.name ILIKE '%' || p_search_query || '%'
      )
  )
  SELECT DISTINCT ON (all_matches.result_type, all_matches.id)
    all_matches.result_type,
    all_matches.id,
    all_matches.title,
    all_matches.parent_id,
    all_matches.match_reason,
    MAX(all_matches.match_score) OVER (PARTITION BY all_matches.result_type, all_matches.id),
    all_matches.updated_at
  FROM all_matches
  ORDER BY all_matches.result_type, all_matches.id, all_matches.match_score DESC
  LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_all(UUID, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION search_all IS
'Unified search across documents, blocks, tags, and folders using PostgreSQL FTS';
```

### Success Criteria

#### Automated Verification:
- [x] Migration applies cleanly: `npx supabase db push` or apply via dashboard
- [x] Function exists: Query `SELECT * FROM search_all('user-uuid', 'test', 10)` returns results

#### Manual Verification:
- [ ] Search for folder name returns folder results
- [ ] Search for document content returns document results
- [ ] Results include `result_type` distinguishing documents from folders

---

## Phase 2: Add Storage Wrapper Method

### Overview
Add a new method to call the `search_all` RPC function.

### Changes Required

#### 1. Update SupabaseAdapterOptimized
**File**: `src/utils/storage/SupabaseAdapterOptimized.js`

Add after `searchDocuments()` method (around line 476):

```javascript
/**
 * Search all content using PostgreSQL Full Text Search
 * Searches documents (title, tags, blocks) and folders
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Array of results with result_type, match_reason, match_score
 */
async searchAll(userId, query, options = {}) {
  const { limit = 50 } = options;
  const cacheKey = `searchAll:${userId}:${query}:${limit}`;

  try {
    const result = await deduplicateRequest(cacheKey, async () => {
      const { data, error } = await this.supabase.rpc('search_all', {
        p_user_id: userId,
        p_search_query: query,
        p_limit: limit
      });

      if (error) {
        console.error('[SupabaseAdapter] searchAll error:', error);
        throw error;
      }

      return { data };
    });

    // Sort by score descending
    return (result.data || []).sort((a, b) => b.match_score - a.match_score);
  } catch (error) {
    console.error('[SupabaseAdapter] searchAll failed:', error);
    return [];
  }
}
```

#### 2. Update Storage Wrapper
**File**: `src/utils/storage/storageWrapper.js`

Add after `searchDocuments()` function (around line 310):

```javascript
/**
 * Search all content (documents, blocks, folders) using FTS
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results with result_type
 */
export async function searchAll(userId, query, options = {}) {
  const storageAdapter = await init();

  if (storageAdapter.supabaseAdapter?.searchAll) {
    return await storageAdapter.supabaseAdapter.searchAll(userId, query, options);
  }

  // No fallback - requires Supabase
  console.warn('[storageWrapper] searchAll requires Supabase adapter');
  return [];
}
```

Add to exports (around line 337):
```javascript
  searchAll,
```

### Success Criteria

#### Automated Verification:
- [x] No TypeScript/ESLint errors: `npm run lint`
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Call `storageWrapper.searchAll(userId, 'test')` from console returns results

---

## Phase 3: Update SearchView Component

### Overview
Replace client-side filtering with FTS API call. Add loading states and result type indicators.

### Changes Required

#### 1. Rewrite SearchView
**File**: `src/components/sidebar/views/SearchView.jsx`

```jsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, FileText, Folder, Tag, AlignLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';
import { useAuth } from '@/app/providers';
import * as storageWrapper from '@/utils/storage/storageWrapper';

// Match reason icons
const MATCH_ICONS = {
  title: FileText,
  tags: Tag,
  blocks: AlignLeft,
  folder_name: Folder,
  all: FileText,
};

// Match reason labels
const MATCH_LABELS = {
  title: 'Title',
  tags: 'Tag',
  blocks: 'Content',
  folder_name: 'Folder',
  all: '',
};

export function SearchView({ onOpenDocument, onOpenFolder }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchTimeoutRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches')) || [];
    } catch {
      return [];
    }
  });

  // Debounced search
  useEffect(() => {
    if (!user?.id) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await storageWrapper.searchAll(user.id, term, { limit: 30 });
        setResults(data || []);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, user?.id]);

  // Handle result selection
  const handleSelect = useCallback((result) => {
    // Save to recent searches
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    if (result.result_type === 'folder') {
      onOpenFolder?.({ id: result.id, name: result.title });
    } else {
      onOpenDocument?.({ id: result.id, title: result.title });
    }
    setSearchTerm('');
  }, [searchTerm, recentSearches, onOpenDocument, onOpenFolder]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Search Header */}
      <div className="p-3 pt-10">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents, folders..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
        <div className="px-3 pb-3 w-full min-w-0">
          <AnimatePresence mode="wait">
            {searchTerm ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Loading / Results count */}
                <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    `${results.length} result${results.length !== 1 ? 's' : ''}`
                  )}
                </div>

                {/* Results list */}
                {results.length > 0 ? (
                  <div className="w-full min-w-0 space-y-1">
                    {results.map((result, index) => {
                      const MatchIcon = MATCH_ICONS[result.match_reason] || FileText;
                      const isFolder = result.result_type === 'folder';

                      return (
                        <motion.button
                          key={`${result.result_type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className={`
                            w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200
                            ${index === selectedIndex
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'hover:bg-white/[0.03] text-white/70 hover:text-white/90'
                            }
                          `}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-400/70 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-white/30 flex-shrink-0" />
                          )}
                          <span className="flex-1 truncate text-sm">{result.title}</span>
                          {/* Match reason badge */}
                          {result.match_reason !== 'all' && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/40">
                              <MatchIcon className="w-2.5 h-2.5" />
                              {MATCH_LABELS[result.match_reason]}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : !isLoading ? (
                  <div className="py-8 text-center">
                    <div className="text-white/30 text-sm">No results found</div>
                    <div className="text-white/20 text-xs mt-1">Try different keywords</div>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="text-xs text-white/40 mb-2">Recent searches</div>
                    <div className="space-y-1">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchTerm(term)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          <span className="truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search tips */}
                <div className="text-xs text-white/30 space-y-1">
                  <p>Search across:</p>
                  <ul className="list-disc list-inside text-white/20">
                    <li>Document titles</li>
                    <li>Block content</li>
                    <li>Tags</li>
                    <li>Folder names</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
```

#### 2. Update SidebarEnhanced to pass onOpenFolder
**File**: `src/components/sidebar/SidebarEnhanced.jsx`

Update the SearchView usage (around line 217):

```jsx
case ACTIVITY_VIEWS.SEARCH:
  return (
    <SearchView
      onOpenDocument={onOpenDocument}
      onOpenFolder={(folder) => {
        // Navigate to folder in explorer view
        setActiveView(ACTIVITY_VIEWS.EXPLORER);
        // Could also expand the folder in the tree
      }}
    />
  );
```

### Success Criteria

#### Automated Verification:
- [x] No lint errors: `npm run lint` (in modified files)
- [x] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Type in search box, see loading indicator
- [ ] Results appear after 300ms debounce
- [ ] Document results show FileText icon
- [ ] Folder results show Folder icon with amber color
- [ ] Match reason badges show (Title/Content/Tag/Folder)
- [ ] Keyboard navigation (up/down/enter) works
- [ ] Clicking result opens document/folder
- [ ] Recent searches saved and displayed

---

## Testing Strategy

### Manual Testing Steps

1. **Basic Search**
   - Type "react" → should find documents with "react" in title, blocks, or tags
   - Type folder name → should find matching folders
   - Type tag name → should find documents with that tag

2. **Stemming**
   - Search "debugging" → should match documents containing "debug"
   - Search "tests" → should match "test", "testing"

3. **Result Types**
   - Verify folder results have amber folder icon
   - Verify document results have white file icon
   - Verify match badges show correct type

4. **Edge Cases**
   - Empty search → shows recent searches
   - Single character → should still search
   - Special characters → should not crash
   - No results → shows "No results found"

5. **Performance**
   - Search should feel responsive (< 500ms total)
   - Typing quickly should not cause duplicate results

---

## Performance Considerations

1. **Debounce**: 300ms prevents excessive API calls while typing
2. **GIN Indexes**: Already created in existing migration for fast FTS
3. **Result Limit**: Capped at 30 results to prevent slow queries
4. **Request Deduplication**: Existing `deduplicateRequest()` prevents concurrent identical searches

---

## References

- Existing FTS migration: `supabase/migrations/20251102201500_add_full_text_search.sql`
- Supabase adapter: `src/utils/storage/SupabaseAdapterOptimized.js:444-476`
- Current SearchView: `src/components/sidebar/views/SearchView.jsx`
- Supabase FTS docs: https://supabase.com/docs/guides/database/full-text-search
