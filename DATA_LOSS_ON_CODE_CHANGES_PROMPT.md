# Supabase Data Loss on Code Changes - Research Request

## Issue Description
When making changes to our React/Supabase codebase and refreshing the application, we're experiencing partial data loss:
- ✅ Document titles are preserved
- ✅ Number of documents remains the same
- ❌ Blocks (content) inside documents are lost/empty
- ❌ Data inside blocks disappears

This happens when we modify code files and refresh, NOT during normal app usage.

## Technical Context

### Stack
- Frontend: React 19 with Vite dev server
- Database: Supabase (PostgreSQL with RLS enabled)
- Authentication: Supabase Auth with JWT tokens
- Development: Hot Module Replacement (HMR) enabled

### Database Structure
```sql
-- Documents table
documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  tags TEXT[],
  -- No blocks column here
)

-- Blocks table (separate)
blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT,
  content TEXT,
  position INTEGER,
  metadata JSONB
)
```

### Current Implementation
1. We use an atomic PostgreSQL function `save_document_blocks` for saving
2. Documents are loaded without blocks initially (lazy loading)
3. Blocks are loaded on-demand when opening a document
4. We have a 5-second cache in the application
5. Session storage is used for caching blocks

## Symptoms Details
1. Make any code change (e.g., update a component)
2. Save the file (triggers Vite HMR or page refresh)
3. After refresh:
   - All documents still visible in the list
   - Document titles intact
   - Opening any document shows it as empty (no blocks)
   - Database still contains the blocks (verified via SQL queries)

## Research Questions

1. **Is this related to Vite HMR and Supabase session handling?**
   - Does Vite dev server clear certain caches on refresh?
   - Are Supabase auth tokens being invalidated during HMR?

2. **Could this be a React 19 Strict Mode issue?**
   - React 19's strict mode behavior with effects
   - Double mounting causing issues with data loading?

3. **Is this a known Supabase RLS issue?**
   - RLS policies temporarily failing after auth token refresh?
   - Race condition between auth restoration and data fetching?

4. **Session/Cache persistence during development?**
   - Are we losing sessionStorage/localStorage during HMR?
   - Is the optimized block loader's cache being cleared?

5. **Common patterns or solutions?**
   - Best practices for preserving application state during development
   - How do other Supabase + React apps handle this?
   - Should we implement a different caching strategy for development?

## Additional Context
- This ONLY happens during development (code changes + refresh)
- Normal app usage (without code changes) works perfectly
- The blocks exist in the database but fail to load after code refresh
- Using lazy loading pattern where blocks load on document open

## What We Need
Please research:
1. Common causes of partial data loss during React + Supabase development
2. Whether this is expected behavior or a bug
3. Best practices to prevent this during development
4. Whether other developers face similar issues with Supabase + Vite + React

## Keywords for Research
- Supabase data loss development
- Vite HMR Supabase session
- React strict mode Supabase RLS
- Supabase auth token refresh data loading
- Lazy loading data loss after refresh
- PostgreSQL RLS cache invalidation
- Vite dev server localStorage clear