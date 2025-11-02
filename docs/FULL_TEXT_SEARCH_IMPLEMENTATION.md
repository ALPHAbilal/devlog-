# Full Text Search Implementation

## Overview

This implementation adds server-side full-text search across documents and their blocks using PostgreSQL's Full Text Search (FTS) capabilities. This allows users to search block content without loading all blocks to the client, significantly improving performance.

## What Was Implemented

### 1. Database Function (`supabase/migrations/20250201_add_full_text_search.sql`)

Created a PostgreSQL function `search_documents_with_blocks` that:
- Searches across document titles using FTS
- Searches across document tags
- Searches across block content using FTS
- Returns documents with match reason and relevance score
- Uses GIN indexes for fast full-text search

**Key Features:**
- Uses `to_tsvector()` and `to_tsquery()` for PostgreSQL FTS
- Handles multiple search terms (AND logic)
- Falls back to ILIKE for partial matches
- Returns match reason (title, tags, or blocks)
- Includes relevance scoring

### 2. Frontend Integration (`src/lib/supabase-optimizations.ts`)

Added `searchDocumentsWithBlocks()` function that:
- Calls the database RPC function
- Handles errors gracefully
- Returns typed results

### 3. Dashboard Updates (`src/pages/Dashboard.jsx`)

Updated the Dashboard component to:
- Use server-side search when a search term is provided
- Debounce search requests (300ms)
- Show loading state during search
- Sort results by relevance score
- Fall back to client-side search if server-side search fails

## How It Works

1. **User Types in Search Bar**: When user types a search term, the Dashboard waits 300ms (debounce)

2. **Server-Side Search**: If search term is provided:
   - Calls `searchDocumentsWithBlocks()` RPC function
   - Database searches across:
     - Document titles (FTS)
     - Document tags (ILIKE)
     - Block content (FTS)
   - Returns matching documents with relevance scores

3. **Results Display**: 
   - Results are sorted by match score (highest first)
   - Project and tag filters are still applied client-side
   - Results show match reason in console (for debugging)

## Benefits

✅ **Searches Block Content**: Can now search inside documents without loading blocks
✅ **Performance**: Uses database indexes instead of loading all blocks
✅ **Scalability**: Works efficiently even with thousands of documents
✅ **Relevance Scoring**: Results sorted by relevance
✅ **Backward Compatible**: Falls back to client-side search if needed

## Usage

The search functionality is automatically enabled. Users simply type in the search bar and results will include:
- Documents with matching titles
- Documents with matching tags  
- Documents with matching block content

## Migration

To apply the database changes:

1. Run the migration file in Supabase SQL Editor:
   ```sql
   -- Run: supabase/migrations/20250201_add_full_text_search.sql
   ```

2. The migration will:
   - Create the `search_documents_with_blocks` function
   - Create GIN indexes for fast full-text search
   - Grant permissions to authenticated users

## Testing

To test the search functionality:

1. Type a search term in the dashboard search bar
2. Check browser console for search logs
3. Verify that documents with matching block content are returned
4. Verify that results are sorted by relevance

## Notes

- Search uses PostgreSQL Full Text Search which handles:
  - Word stemming (e.g., "run" matches "running")
  - Case-insensitive matching
  - Multiple word searches (AND logic)
- The function uses `plainto_tsquery()` which is safer for user input
- Indexes are created automatically on `blocks.content` and `documents.title`

