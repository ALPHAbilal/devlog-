# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Journey Log Compass (aka Devlog) is a developer-focused knowledge management system built as a React SPA with Supabase backend. It's designed to capture, organize, and interconnect a developer's learning journey through a flexible block-based document system.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Lint code (ESLint)
npm run lint

# Preview production build
npm run preview
```

## High-Level Architecture

### Core Technologies
- **Frontend**: React 19 with Vite, TailwindCSS, React Router
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Hybrid approach - Supabase primary, IndexedDB fallback
- **State Management**: React Context (AuthContext) + custom hooks
- **Styling**: TailwindCSS with custom dark theme design system

### Key Architectural Patterns

#### 1. **Block-Based Document System**
Documents are composed of different block types, each with its own component:
- `TextBlock` - Markdown-enabled text with inline tagging
- `CodeBlock` - Syntax highlighting with file path tracking
- `TableBlock` - Dynamic tables with drag-and-drop
- `AIBlock` - Preserved AI conversations
- `TemplateBlock` - Interactive components (API builders, etc.)
- `FileTreeBlock` - Visual project structure
- `HeadingBlock`, `TodoBlock`, `MathBlock`

Each block extends from a base structure and can be converted between types.

#### 2. **Storage Adapter Pattern**
The app uses a flexible storage system (`storageWrapper.js`) that can switch between:
- **SupabaseAdapter** - Cloud storage with auth
- **IndexedDBAdapter** - Local storage with compression
- **Fallback chain**: Supabase → IndexedDB → localStorage

#### 3. **Performance Optimizations**
- **Virtualized rendering** for document grids
- **Paginated block loading** for large documents
- **Debounced auto-save** with backup protection
- **Session caching** to reduce auth calls
- **Optimized Supabase queries** with single-fetch patterns

#### 4. **Component Organization**
```
src/
├── components/
│   ├── blocks/          # All block type components
│   ├── Auth.jsx         # Authentication UI
│   ├── Block.jsx        # Block container/wrapper
│   ├── ExpandedViewEnhanced.jsx  # Document editor
│   └── ...
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── lib/                # External integrations (Supabase)
├── pages/              # Route components
├── utils/              # Utilities and helpers
│   └── storage/        # Storage adapters
└── styles/             # CSS files
```

### Database Schema

#### Core Tables:
1. **documents** - Document metadata (title, tags, user_id)
2. **blocks** - Document content (type, content, position, metadata)
3. **profiles** - User profiles
4. **document_links** - Inter-document connections
5. **images** - Image storage references
6. **settings** - User preferences

#### Key Relationships:
- Documents have many blocks (1:N)
- Blocks reference documents via `document_id`
- All tables use Row Level Security (RLS) for user isolation
- Soft delete pattern with `deleted_at` columns

### Authentication Flow
1. User signs up/in via Supabase Auth
2. Session stored in localStorage with key `journey-log-auth`
3. AuthContext provides user state throughout app
4. RLS policies ensure users only see their own data

### Critical Files to Understand

1. **`src/utils/storage/SupabaseAdapter.js`** - Handles all database operations
2. **`src/components/ExpandedViewEnhanced.jsx`** - Main document editor logic
3. **`src/pages/Dashboard.jsx`** - Document list and management
4. **`src/components/Block.jsx`** - Block rendering orchestrator
5. **`src/utils/autoSaveManager.js`** - Auto-save with backup protection
6. **`supabase/migrations/`** - Database schema and functions

### Supabase Integration

#### Environment Variables Required:
```bash
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

#### Key Supabase Features Used:
- Row Level Security (RLS) for data isolation
- Atomic save operations via PostgreSQL functions
- Real-time subscriptions (prepared but not active)
- Storage buckets (prepared for future image uploads)

### Performance Considerations

1. **Table Block Performance** - Recently optimized to prevent UI lag
   - Removed complex parseMarkdown in cells
   - Simplified save operations
   - Added data consistency checks

2. **Document Loading** - Uses optimized patterns
   - Single query to load all blocks
   - 5-second cache for navigation
   - Skeleton loading states

3. **Auto-Save System**
   - 3-second debounce to prevent rapid saves
   - Local backup before each save attempt
   - Retry logic with exponential backoff

### Common Development Tasks

#### Adding a New Block Type:
1. Create component in `src/components/blocks/`
2. Add to `BLOCK_COMPONENTS` in `Block.jsx`
3. Update block type selector in `AddBlockRow.jsx`
4. Add any specific metadata handling in `SupabaseAdapter`

#### Debugging Save Issues:
1. Check browser console for save logs
2. Verify `block.id` is included in `onUpdate` calls
3. Check Supabase logs for RLS policy violations
4. Ensure `user_id` is properly set in adapter

#### Running Migrations:
1. Copy SQL from `supabase/migrations/` or project migrations
2. Run in Supabase SQL Editor in order
3. Use fixed versions if available (e.g., `*_fixed.sql`)

### Recent Optimizations Applied

1. **Soft Delete System** - Documents/blocks use `deleted_at` instead of hard delete
2. **Batch Operations** - `save_document_blocks_v2` for atomic saves
3. **Performance Cache** - `document_cache` table for quick stats
4. **Optimized RLS** - Helper functions reduce query complexity
5. **Connection Pooling** - Reuses database connections

### Known Issues and Fixes

1. **Position is a reserved keyword** - Must be quoted in SQL: `"position"`
2. **RLS on views not allowed** - Views inherit RLS from base tables
3. **React 19 Strict Mode** - Double mounting handled with proper cleanup
4. **Save cascades** - Prevented with initialization flags and debouncing

### ⚠️ CRITICAL: Production Migration Safety

**WARNING**: Database migrations can potentially delete user data if not handled carefully. During development, we discovered that running migrations cleared the entire blocks table.

#### Safe Migration Practices for Production:

1. **Always backup before migrations**
   ```sql
   -- Create a backup of critical tables before ANY migration
   CREATE TABLE blocks_backup_YYYYMMDD AS SELECT * FROM blocks;
   CREATE TABLE documents_backup_YYYYMMDD AS SELECT * FROM documents;
   ```

2. **Test migrations on a staging database first**
   - Clone production data to staging
   - Run migrations on staging
   - Verify data integrity before production

3. **Use transactions for DDL operations**
   ```sql
   BEGIN;
   -- Your migration here
   -- Verify with SELECT COUNT(*) to ensure data exists
   COMMIT; -- or ROLLBACK if issues
   ```

4. **Never use DELETE without WHERE in migrations**
   - Always use soft deletes when possible
   - If hard delete needed, be extremely specific with WHERE clauses

5. **Monitor migration impact**
   - Check row counts before and after
   - Have rollback scripts ready
   - Use Supabase's point-in-time recovery if available

6. **For atomic save functions**
   - Ensure they use UPSERT patterns, not DELETE then INSERT
   - Test with sample data before deploying
   - Add validation to prevent empty block arrays from clearing all data

#### Example Safe Migration Pattern:
```sql
-- 1. Backup
CREATE TABLE blocks_backup_20250130 AS SELECT * FROM blocks;

-- 2. Add new column safely
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS new_field TEXT;

-- 3. Verify data still exists
SELECT COUNT(*) FROM blocks; -- Should match backup count

-- 4. Only proceed if counts match
```

This is critical for production deployments where user data loss is unacceptable.


## 🚨 CRITICAL: When Data Loss Actually Happens in Supabase

### The Good News
**During normal operations, your data is SAFE**. Supabase automatically:
- Creates daily backups (retained 7-30 days based on plan)
- Handles millions of transactions reliably
- Used by Mozilla, 1Password, NASA's Epsilon3

### When Data Loss ACTUALLY Occurs

#### 1. **NEVER Use These Commands in Production**
```bash
# ❌ NEVER DO THIS - Deletes ALL data
supabase db reset

# ❌ AVOID THIS - Can corrupt data if done wrong
DROP TABLE blocks;
ALTER TABLE blocks DROP COLUMN important_field;
```

#### 2. **Safe Migration Checklist**
Before ANY database structure change:
```sql
-- 1. Create backup FIRST
SELECT create_data_backup('Before migration - describe change here');

-- 2. Test in a branch
-- Create branch in Supabase dashboard or CLI
-- Run migration there first

-- 3. Use transactions
BEGIN;
  -- Your migration here
  ALTER TABLE blocks ADD COLUMN new_field TEXT;
  -- Verify it worked
  SELECT COUNT(*) FROM blocks; -- Should match before count
COMMIT; -- or ROLLBACK if something's wrong
```

#### 3. **Enable PITR (Point-in-Time Recovery)**
- **Cost**: $100/month
- **Why**: Recover to any second in the last 7 days
- **When**: Before ANY risky operation
- **How**: Supabase Dashboard → Database → Backups → Enable PITR

### Simple Rules to NEVER Lose Data

1. **Before changing database structure**:
   - Always backup first
   - Test in branch/staging
   - Use transactions

2. **Never use `supabase db reset`** in production

3. **For table changes**:
   - ADD columns = Safe ✅
   - DROP columns = Dangerous ⚠️ (backup first)
   - RENAME = Use proper migration syntax

4. **If you mess up**:
   - With PITR: Restore to 1 minute before the mistake
   - Without PITR: Restore from last daily backup (lose up to 24h data)

### Real Examples from Companies

**Mobbin** (200k users migrated from Firebase):
- Used dual-write pattern during migration
- Zero data loss

**Common Horror Story**:
- Developer runs `supabase db reset` thinking it's like git reset
- ALL data gone instantly
- No PITR = permanent loss

### The One Command That Saves Everything
```bash
# Run this before ANY database change
supabase db dump --db-url "$DATABASE_URL" -f backup_before_migration_$(date +%Y%m%d_%H%M%S).sql
```

Remember: **Data loss in Supabase is 99% human error during migrations, not platform failure**.