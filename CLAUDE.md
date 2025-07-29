# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Devlog (Journey Log Compass) is a developer-focused knowledge management system - a block-based documentation platform where developers capture, organize, and interconnect their learning journey. Built with React 19, Vite, and Supabase.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview

# Run tests (Vitest configured but no npm script)
npx vitest
```

## High-Level Architecture

### Storage Architecture (Critical to Understand)

The app uses a multi-layer storage system with automatic fallback:

1. **Supabase** (primary) - Cloud storage with RLS
2. **IndexedDB** (fallback) - 1GB+ local storage with compression
3. **LocalStorage** (last resort) - 5-10MB limit

Key files:
- `src/utils/storage/storageWrapper.js` - Orchestrates storage adapters
- `src/utils/storage/SupabaseAdapter.js` - Database operations
- `src/utils/storage/IndexedDBAdapter.js` - Local storage with LZ-String compression

### Block System Architecture

Documents are composed of blocks. Each block type has:
- A component in `src/components/blocks/`
- Data persistence handling in storage adapters
- Type-specific metadata stored in JSONB

Current block types:
- `text` - Markdown with inline tags/images
- `code` - Syntax highlighting, file paths, version tracking
- `table` - Dynamic tables with drag-and-drop
- `ai` - AI conversation preservation
- `filetree` - Visual project structure
- `todo` - Task lists
- `heading` - Document structure
- `image` - Multi-image galleries
- `inline-image` - Images within text blocks

### Critical Data Flow

1. **Document Loading**:
   - `Dashboard.jsx` → `ExpandedViewEnhanced.jsx`
   - Uses `useOptimizedBlockLoader` (single query) or `usePaginatedBlockLoader` (50+ blocks)
   - 5-second cache for fast navigation

2. **Block Saving**:
   - Auto-save after 3 seconds of inactivity
   - Local backup before each save attempt
   - Atomic save via `save_document_blocks_v3` PostgreSQL function
   - Retry logic with exponential backoff

3. **Block Data Persistence** (⚠️ CRITICAL):
   - Block-specific data stored in `metadata` JSONB column
   - Must update ALL transform functions when adding block types:
     - `SupabaseAdapter.js` → `extractBlockData()` & `transformBlockFromDB()`
     - `optimizedBlockLoader.js` → `transformBlockFromDB()`
     - `blockStreamer.js` → `transformBlockFromDB()`

### Authentication & Security

- Supabase Auth with email/password
- Session stored in localStorage: `journey-log-auth`
- Row Level Security (RLS) ensures data isolation
- All database operations check `auth.uid()`

### Performance Optimizations

1. **Virtualized Rendering** - Document grid handles thousands of items
2. **Debounced Auto-save** - Prevents rapid save cascades
3. **Skeleton Loading** - Content-aware placeholders
4. **Session Caching** - Reduces auth calls
5. **Event-driven Updates** - No polling, uses event listeners

## Database Schema

### Core Tables
- `documents` - Metadata (title, tags, user_id)
- `blocks` - Content (type, content, metadata JSONB, position)
- `profiles` - User data
- `document_links` - Inter-document connections
- `images` - Image storage references

### Key Patterns
- Soft deletes via `deleted_at` column
- Atomic saves via PostgreSQL functions
- JSONB for extensible metadata
- Position-based block ordering

## Common Development Tasks

### Adding a New Block Type

1. Create component in `src/components/blocks/NewBlock.jsx`
2. Add to `BLOCK_COMPONENTS` in `Block.jsx`
3. Update block selector in `AddBlockRow.jsx`
4. **CRITICAL**: Update ALL transform functions:
   ```javascript
   // In SupabaseAdapter.js, optimizedBlockLoader.js, blockStreamer.js
   if (block.type === 'newtype' && block.metadata.customData) {
     baseBlock.customData = block.metadata.customData;
   }
   ```
5. Update database constraint:
   ```sql
   ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
   ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
   CHECK (type = ANY (ARRAY['text', 'code', 'heading', 'ai', 'table', 
                            'filetree', 'todo', 'image', 'inline-image', 'newtype']));
   ```

### Debugging Save Issues

1. Check browser console for auto-save logs
2. Verify `block.id` is included in all updates
3. Check Supabase logs for RLS violations
4. Ensure partial updates set `blocks: undefined` (not empty array)

### Running Database Migrations

1. **ALWAYS backup first**:
   ```sql
   CREATE TABLE blocks_backup_$(date +%Y%m%d) AS SELECT * FROM blocks;
   ```
2. Test on Supabase branch first
3. Use transactions for safety
4. Run in Supabase SQL Editor

## Bulletproof Architecture (6-Layer Protection)

The app includes comprehensive error handling to prevent data loss:

1. **Error Boundaries** - Catch React errors, provide recovery UI
2. **Data Integrity** - SHA-256 checksums, 5 snapshots per document
3. **Lock Manager** - Prevent race conditions across tabs
4. **Transactions** - ACID-like guarantees, automatic rollback
5. **Circuit Breaker** - Network resilience, request queuing
6. **Recovery System** - Auto-save every 30s, crash detection

Monitoring shortcuts:
- `Cmd/Ctrl + Shift + P` - Performance monitor
- `Cmd/Ctrl + Shift + H` - System health monitor

## Critical Production Safety

### Pre-deployment Checklist
```bash
# 1. Test production build locally
npm run build && npm run preview

# 2. Check for breaking changes
git diff main -- '*.jsx' '*.js' | grep -E "(localStorage|route|api)"

# 3. Test responsive breakpoints
# 375px (mobile), 768px (tablet), 1024px (desktop)
```

### Database Migration Safety
```sql
-- NEVER run these in production:
-- TRUNCATE TABLE blocks;
-- DROP TABLE documents CASCADE;
-- DELETE FROM blocks; (without WHERE)

-- Safe pattern:
BEGIN;
  -- Your migration
  SELECT COUNT(*) FROM blocks; -- Verify data intact
COMMIT; -- or ROLLBACK if wrong
```

### Common Pitfalls
1. **CSS purging** - Safelist critical Tailwind utilities
2. **Auth key changes** - Will log out all users
3. **Route changes** - Add redirects in vercel.json
4. **Empty blocks array** - Deletes all document content

## Environment Variables

```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# Optional Sentry monitoring
SENTRY_DSN=[dsn]
SENTRY_ORG=[org]
SENTRY_PROJECT=[project]
```

## Recent Critical Fixes (January 2025)

1. **Tag Save Data Loss** - Fixed by detecting partial updates in SupabaseAdapter
2. **Document Link Navigation** - Fixed title update in ExpandedViewEnhanced
3. **Block Data Persistence** - Added comprehensive metadata handling for all block types
4. **Multi-Image Support** - ImageBlock now supports galleries with backward compatibility

## Quick Reference

- **Main Editor**: `src/components/ExpandedViewEnhanced.jsx`
- **Block Container**: `src/components/Block.jsx`
- **Storage Logic**: `src/utils/storage/SupabaseAdapter.js`
- **Auto-save**: `src/utils/autoSaveManager.js`
- **Dashboard**: `src/pages/Dashboard.jsx`
- **Auth Flow**: `src/contexts/AuthContext.jsx`

## Test-First Development Approach

When implementing new features:
1. Create test scripts first
2. Test independently to verify functionality
3. Only integrate after successful testing
4. Wait for user confirmation before integration