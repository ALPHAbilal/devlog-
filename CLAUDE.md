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
- `FileTreeBlock` - Visual project structure
- `HeadingBlock`, `TodoBlock`, `ImageBlock`, `InlineImageBlock`

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
6. **Event-Driven Architecture** - Replaced polling with event-based updates
7. **Multi-Layer Storage** - Memory → IndexedDB → Supabase with automatic fallback

### Known Issues and Fixes

1. **Position is a reserved keyword** - Must be quoted in SQL: `"position"`
2. **RLS on views not allowed** - Views inherit RLS from base tables
3. **React 19 Strict Mode** - Double mounting handled with proper cleanup
4. **Save cascades** - Prevented with initialization flags and debouncing

## 🛡️ Bulletproof Architecture (January 2025)

The application now includes comprehensive error handling and data protection systems that make it virtually impossible to lose data or experience crashes.

### Architecture Overview

The bulletproofing consists of 6 interconnected systems that work together to ensure reliability:

1. **Global Error Boundary System** (`/src/components/ErrorBoundary.jsx`)
   - Catches all React rendering errors
   - Provides user-friendly recovery UI
   - Saves crash reports to localStorage
   - Allows restoration of last known good state
   - Automatic recovery attempts with fallback options

2. **Data Integrity Layer** (`/src/utils/integrity/DataIntegrityManager.js`)
   - SHA-256 checksums on all documents using Web Crypto API
   - Automatic corruption detection on load
   - Snapshot system maintaining 5 versions per document
   - Self-healing from corrupted data
   - Validation rules for all data types

3. **Distributed Lock Manager** (`/src/utils/locking/LockManager.js`)
   - Prevents race conditions across multiple tabs
   - Uses BroadcastChannel API for cross-tab communication
   - Fallback to localStorage events for older browsers
   - Priority-based queue system
   - Deadlock detection and automatic resolution

4. **Transaction System** (`/src/utils/transactions/TransactionManager.js`)
   - ACID-like guarantees for complex operations
   - Rollback capability with compensation logic
   - Saga pattern support for multi-step workflows
   - Operation snapshots for recovery
   - Automatic cleanup of stale transactions

5. **Network Resilience** (`/src/utils/network/CircuitBreaker.js`)
   - Circuit breaker pattern prevents cascade failures
   - Automatic retry with exponential backoff
   - Graceful degradation to offline mode
   - Health monitoring and auto-recovery
   - Request queuing when circuit is open

6. **Recovery System** (`/src/utils/recovery/RecoveryManager.js`)
   - Automatic crash detection on startup
   - Multiple recovery strategies (documents, session, transactions, locks)
   - Auto-save every 30 seconds
   - Error state preservation
   - Manual recovery trigger option

### How It Works Together

```javascript
// Example: Saving a document with all protections
async function saveDocument(document) {
  // 1. Lock Manager prevents concurrent edits
  await lockManager.withLock(`doc:${document.id}`, async () => {
    
    // 2. Transaction ensures atomicity
    const txn = await transactionManager.beginTransaction();
    
    try {
      // 3. Data Integrity adds checksums
      const validated = await dataIntegrityManager.prepareForSave('document', document);
      
      // 4. Circuit Breaker handles network issues
      await circuitBreakerManager.execute('supabase-write', async () => {
        await supabase.saveDocument(validated);
      });
      
      // 5. Commit transaction on success
      await txn.commit();
      
    } catch (error) {
      // 6. Recovery System captures state
      recoveryManager.saveRecoveryCheckpoint();
      
      // Transaction rollback
      await txn.rollback();
      
      // Error Boundary will catch if this propagates
      throw error;
    }
  });
}
```

### System Monitoring

The application includes two monitoring systems accessible via keyboard shortcuts:

#### Performance Monitor (Cmd/Ctrl + Shift + P)
Displays real-time metrics:
- Cache hit rates and storage layer status
- Sync status and pending changes
- Average operation times
- Recent operations timeline

#### System Health Monitor (Cmd/Ctrl + Shift + H)
Shows bulletproofing system status:
- Active locks and deadlock count
- Transaction statistics
- Circuit breaker states
- Data integrity reports
- Recovery system status
- Recent system alerts

### Configuration

Most systems work out of the box, but can be configured:

```javascript
// Circuit Breaker Configuration
const breaker = circuitBreakerManager.getBreaker('api-calls', {
  failureThreshold: 5,      // Open after 5 failures
  resetTimeout: 60000,      // Try again after 1 minute
  timeout: 10000,          // Request timeout 10 seconds
  volumeThreshold: 10      // Min requests before opening
});

// Lock Manager Configuration
const lock = await lockManager.acquireLock('resource-id', {
  timeout: 30000,         // Lock expires after 30 seconds
  priority: 2,            // Higher priority gets lock first
  queue: true            // Queue if lock unavailable
});

// Transaction Configuration
const txn = await transactionManager.beginTransaction({
  isolationLevel: 'READ_COMMITTED',
  metadata: { feature: 'bulk-update' }
});
```

### Development Considerations

When developing new features:

1. **Always use transactions** for multi-step operations
2. **Acquire locks** before modifying shared resources
3. **Add data validation** to the integrity manager for new data types
4. **Use circuit breakers** for all external API calls
5. **Test error scenarios** - the error boundary should catch all failures

### What This Prevents

- ❌ **Data loss from crashes** → Error boundary + Recovery system
- ❌ **Race conditions** → Lock manager + Transactions
- ❌ **Network failures** → Circuit breaker + Offline queue
- ❌ **Data corruption** → Integrity checksums + Snapshots
- ❌ **Partial saves** → Transactions + Atomic operations
- ❌ **Multi-tab conflicts** → Distributed locks + BroadcastChannel
- ❌ **Cascade failures** → Circuit breaker pattern
- ❌ **Lost work** → Auto-save + Recovery checkpoints

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

## 🔴 CRITICAL: Block Data Persistence Architecture

### The Problem We Solved
Complex block types (FileTreeBlock, AIBlock, ImageBlock, etc.) store data in custom properties that weren't being saved to Supabase. This caused data loss when reloading documents.

### How Block Data Storage Works

#### Database Schema
The `blocks` table uses a JSONB `metadata` column to store all block-specific data:
```sql
blocks table:
- id (uuid)
- type (text) 
- content (text) -- For simple text content
- metadata (jsonb) -- For ALL complex data structures
- position, document_id, etc.
```

#### Saving Blocks (SupabaseAdapter.js)
When saving, ALL non-standard properties are extracted into metadata:
```javascript
const extractBlockData = (block) => {
  const metadata = {};
  const excludedProps = ['id', 'type', 'content', 'position', 'tags', 'language', 'filePath', 'isNew', 'createdAt', 'updatedAt'];
  
  // Copy ALL other properties to metadata
  Object.keys(block).forEach(key => {
    if (!excludedProps.includes(key) && block[key] !== undefined) {
      metadata[key] = block[key];
    }
  });
  
  return metadata;
};
```

#### Loading Blocks (transformBlockFromDB)
When loading, block-specific properties are restored from metadata:
```javascript
// Special handling for known block types
if (block.type === 'filetree' && block.metadata.treeData) {
  baseBlock.treeData = block.metadata.treeData;
}
if (block.type === 'ai' && block.metadata.messages) {
  baseBlock.messages = block.metadata.messages;
}
if (block.type === 'image' && block.metadata.images) {
  baseBlock.images = block.metadata.images;
}
// ... etc
```

### Block Type Data Mappings

| Block Type | Custom Properties | Storage Location |
|------------|------------------|------------------|
| filetree | `treeData` (nested folder/file structure) | metadata.treeData |
| ai | `messages` (array of conversations) | metadata.messages |
| image | `images` (array of image objects) | metadata.images |
| table | `data` (headers, rows) | metadata (as data property) |
| todo | `data` (todos array) | metadata (as data property) |
| inline-image | `url`, `alt`, `dimensions` | metadata.* |

### Files That MUST Be Synchronized
When adding new block types or modifying data persistence, ALL these files must be updated:

1. **`/src/utils/storage/SupabaseAdapter.js`**
   - `extractBlockData()` - Saves block data
   - `transformBlockFromDB()` - Loads block data

2. **`/src/utils/optimizedBlockLoader.js`**
   - `transformBlockFromDB()` - Must match SupabaseAdapter

3. **`/src/utils/blockStreamer.js`**  
   - `transformBlockFromDB()` - Must match SupabaseAdapter

4. **`/src/utils/paginatedBlockLoader.js`**
   - Uses optimizedBlockLoader.transformBlockFromDB

### Adding a New Block Type Checklist

1. **Create the block component** in `/src/components/blocks/`

2. **Update ALL transformBlockFromDB functions** to handle your data:
   ```javascript
   if (block.type === 'your-type' && block.metadata.yourData) {
     baseBlock.yourData = block.metadata.yourData;
   }
   ```

3. **Update the database constraint** if needed:
   ```sql
   ALTER TABLE blocks DROP CONSTRAINT blocks_type_check;
   ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
   CHECK (type = ANY (ARRAY['text', 'code', 'heading', 'ai', 'table', 
                            'filetree', 'todo', 'math', 
                            'image', 'inline-image', 'your-type']));
   ```

4. **Test persistence**:
   - Create a block with complex data
   - Save the document
   - Refresh the page
   - Verify ALL data is restored

### Common Data Loss Scenarios

1. **Forgetting to update transformBlockFromDB** - Data saves but doesn't load back
2. **Not including properties in extractBlockData** - Data never gets saved
3. **Mismatched property names** - Saving as `data` but loading as `yourData`
4. **Missing database constraint** - Block type rejected by database

### Debugging Data Persistence

1. **Check what's being saved**:
   ```javascript
   console.log('Block being saved:', blockToSave);
   console.log('Metadata field:', blockToSave.metadata);
   ```

2. **Check database directly**:
   ```sql
   SELECT id, type, metadata 
   FROM blocks 
   WHERE document_id = 'your-doc-id'
   AND type = 'your-block-type';
   ```

3. **Check what's being loaded**:
   ```javascript
   console.log('Block from DB:', block);
   console.log('Transformed block:', transformedBlock);
   ```

### CRITICAL: Multi-Image Block Implementation

The `ImageBlock` now supports multiple images with:
- `images` array stored in metadata
- Each image has: `{id, url, storagePath, alt, size, dimensions}`
- Backward compatibility for old single-image blocks
- Smart paste handling to group images pasted within 30 seconds

This pattern can be used for any block type that needs to store arrays or complex nested data.

## Recent Updates (January 2025)

### Critical Bug Fixes

#### Tag Save Data Loss Fix
**Problem**: Adding tags to a document caused all content to disappear on reload.
**Root Cause**: 
- Dashboard's updateEntry sent incomplete document data (with empty blocks array)
- Supabase's save_document_blocks RPC deletes all blocks before inserting new ones
- Result: Empty blocks array = all content deleted

**Solution**:
1. Modified SupabaseAdapter.js to detect partial updates (when blocks === undefined)
2. Partial updates now only update document metadata, not blocks
3. Dashboard.jsx now explicitly sets blocks: undefined for non-block updates

#### Document Link Navigation Fix
**Problem**: Clicking [[document links]] showed wrong document title in header.
**Solution**: Added useEffect in ExpandedViewEnhanced to update title when entry.id changes.

### Landing Page Conversion Optimization
Based on developer conversion research, redesigned landing page to focus on:
- Problem-first messaging ("How many times have you solved the same problem twice?")
- Outcome-based features ("Never lose a solution again")
- Action-oriented CTAs ("Start Building" not "Sign Up")
- Trust elements (data ownership, export anytime)
- Removed all tech stack mentions (React, Vite, etc.)

### UI/UX Improvements
- **Professional Image Viewer** with zoom/pan capabilities for tall/wide images
- **Collapsible Text Blocks** for long content (15+ lines) with persistent state
- **Extended Activity Sparklines** from 14 days to 6 months with weekly aggregation
- **Fixed Table Dimensions** display in lines view (was showing 0×0)
- **Custom Favicon** with Devlog terminal prompt logo
- **Template System Removal** - Simplified by removing all template blocks

### Performance & Architecture
- Fixed React 19 Strict Mode compatibility issues
- Optimized block loading with single-query approach
- Added 5-second document cache for faster navigation
- Improved auto-save reliability with local backup protection

## Deployment Workflow

### IMPORTANT: How Changes Are Deployed

1. **All code changes are made in the local directory**
   - Working directory: `/home/bilal/devlog-`
   - I make changes to files in this directory only

2. **GitHub deployment process**
   - After I complete changes, the user manually commits and pushes to GitHub
   - I should NEVER attempt to use git commands to push changes
   - User handles all git operations

3. **Vercel automatic deployment**
   - Vercel is connected to the GitHub repository
   - When user pushes to GitHub, Vercel automatically deploys frontend changes
   - No manual deployment steps needed for frontend

4. **Supabase database changes**
   - I provide SQL queries or step-by-step instructions
   - User executes these manually in the Supabase dashboard
   - I should NEVER attempt to run migrations directly
   - All database changes must be provided as SQL scripts with clear instructions

5. **What I should NEVER do**
   - Push to GitHub directly
   - Deploy to Vercel
   - Execute Supabase migrations automatically
   - Run any deployment commands

### Typical Workflow Example
```
1. I make code changes locally
2. I provide SQL scripts if database changes are needed
3. User reviews changes
4. User runs: git add, commit, push
5. Vercel auto-deploys frontend
6. User runs SQL scripts in Supabase if needed
```

## Important Commands to Run

Always run these before committing (if available):
```bash
npm run lint        # Check for code issues
npm run typecheck   # Check TypeScript types (if applicable)
```

If these commands are not available, ask the user for the correct commands and update this file.

## 🚨 CRITICAL: PRODUCTION DEPLOYMENT SAFETY

This section documents critical deployment mistakes that can severely impact user experience and how to prevent them. Every issue here was learned from real production incidents.

### 1. CSS Build Issues (The Hidden Navigation Incident)

**What Happened**: Sign In button disappeared on desktop after deployment
**Root Cause**: Tailwind CSS purged responsive utilities in production build
**Impact**: Users couldn't access the app on desktop

**Prevention**:
```javascript
// tailwind.config.js - Always safelist critical utilities
export default {
  safelist: [
    'hidden', 'block', 'flex', 'inline-flex',
    'md:hidden', 'md:block', 'md:flex', 'md:inline-flex',
    'lg:hidden', 'lg:block', 'lg:flex', 'lg:inline-flex',
  ]
}
```

**Testing**:
```bash
# ALWAYS test production build locally before deploying
npm run build
npm run preview
# Check responsive breakpoints at 768px, 1024px
```

### 2. Environment Variable Disasters

**Common Mistakes That Break Production**:
```bash
# ❌ Using dev database in production
VITE_SUPABASE_URL=http://localhost:54321  # DISASTER!

# ❌ Exposing service role key (full admin access)
VITE_SUPABASE_SERVICE_KEY=eyJ...  # SECURITY BREACH!

# ❌ Wrong environment keys
VITE_SUPABASE_ANON_KEY=<dev_key>  # Features won't work!
```

**Safe Practice**:
```bash
# Vercel environment setup
vercel env pull .env.production  # Get prod vars
vercel env add VITE_SUPABASE_URL  # Add safely

# Always verify before deploy
grep "localhost" .env*  # Should return nothing
```

### 3. Database Migration Catastrophes

**The Horror Story**: Running migrations can DELETE ALL USER DATA
```sql
-- ❌ NEVER run this in production
TRUNCATE TABLE blocks;  -- All content gone!
DROP TABLE documents CASCADE;  -- Everything deleted!

-- ❌ Dangerous RPC function
CREATE FUNCTION save_blocks(blocks_array jsonb[])
BEGIN
  DELETE FROM blocks WHERE document_id = $1;  -- Deletes first!
  -- If insert fails, data is gone forever
END;
```

**Safe Migration Process**:
```sql
-- 1. ALWAYS backup first
CREATE TABLE blocks_backup_$(date +%Y%m%d) AS SELECT * FROM blocks;

-- 2. Use transactions
BEGIN;
  -- Your migration
  ALTER TABLE blocks ADD COLUMN new_field TEXT;
  -- Verify data intact
  SELECT COUNT(*) FROM blocks;
ROLLBACK;  -- If count wrong

-- 3. Use Supabase branching
-- Test on branch first, then merge
```

### 4. Breaking API/Route Changes

**What Breaks Users**:
```javascript
// ❌ Changing routes without redirects
// Old: /dashboard
// New: /app/dashboard  
// Result: All bookmarks broken!

// ✅ Safe approach
// Add redirects in vercel.json
{
  "redirects": [
    { "source": "/dashboard", "destination": "/app/dashboard", "permanent": false }
  ]
}
```

### 5. Performance Degradation

**Hidden Performance Killers**:
```javascript
// ❌ Loading everything eagerly
import HeavyComponent from './HeavyComponent';
import AnotherBigComponent from './AnotherBig';

// ✅ Lazy load non-critical components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 6. Authentication State Loss

**Common Mistake**: Changing auth storage keys
```javascript
// ❌ DON'T change storage keys without migration
// Old: localStorage.setItem('auth-token', token)
// New: localStorage.setItem('journey-log-auth', token)
// Result: All users logged out!

// ✅ Migration approach
const oldAuth = localStorage.getItem('auth-token');
if (oldAuth && !localStorage.getItem('journey-log-auth')) {
  localStorage.setItem('journey-log-auth', oldAuth);
}
```

### Pre-Deployment Safety Checklist

```bash
# 1. Build & Test Locally
npm run build
npm run preview
# Test all critical user flows

# 2. Check for Breaking Changes
git diff main -- '*.jsx' '*.js' | grep -E "(route|path|localStorage|api/)"

# 3. Verify Environment Variables
# Never commit .env files
git status  # Should NOT show .env files

# 4. Database Safety
# - Backup production database
# - Test migrations on Supabase branch
# - Have rollback SQL ready

# 5. CSS/Style Verification
# Open browser DevTools
# Test at: 375px (mobile), 768px (tablet), 1024px (desktop)

# 6. API Compatibility
# Keep old endpoints working
# Version new endpoints (/api/v2/)
```

### Deployment Monitoring

**Set Up Immediately After Deploy**:
1. **Error Tracking** (Sentry/LogRocket)
   ```javascript
   window.addEventListener('error', (e) => {
     // Log to monitoring service
     console.error('Production Error:', e);
   });
   ```

2. **User Flow Monitoring**
   - Sign up success rate
   - Document save success rate
   - Page load times

3. **Real User Feedback Loop**
   ```javascript
   // Add feedback widget
   if (window.location.hostname === 'devlog.design') {
     // Show "Report Issue" button
   }
   ```

### Emergency Rollback Procedures

**When Things Go Wrong**:
```bash
# 1. Vercel - Instant Rollback
vercel rollback  # Returns to previous deployment

# 2. Database - Point in Time Recovery
# Supabase Dashboard > Database > Backups > Restore

# 3. Feature Flags - Disable without deploy
const FEATURES = {
  BROKEN_FEATURE: false,  // Turn off immediately
};
```

### Safe Iteration Patterns

**Deploy Features Gradually**:
```javascript
// 1. Percentage Rollout
const showNewFeature = Math.random() < 0.1; // 10% of users

// 2. User Whitelist
const betaUsers = ['user-id-1', 'user-id-2'];
const showNewFeature = betaUsers.includes(user.id);

// 3. Time-Based Rollout
const rolloutDate = new Date('2025-02-01');
const showNewFeature = new Date() > rolloutDate;
```

### Critical Files to Review Before Deploy

1. **package.json** - Dependency changes can break builds
2. **tailwind.config.js** - CSS generation changes
3. **vite.config.js** - Build process changes
4. **.env.example** - Document new env vars
5. **vercel.json** - Routing and build settings
6. **supabase/migrations/** - Database changes

### Lessons from Production Incidents

1. **"It works locally" ≠ "It works in production"**
   - Dev and prod builds are different
   - Always test production builds

2. **Users don't report obvious bugs**
   - They just leave
   - Monitor everything

3. **Database migrations are the #1 cause of data loss**
   - Always backup
   - Always use transactions
   - Test on staging/branch first

4. **CSS issues are silent killers**
   - Purged utilities
   - Media query conflicts
   - Missing responsive designs

5. **Performance degradation is gradual**
   - Monitor bundle sizes
   - Track Core Web Vitals
   - Lazy load everything possible

### The Golden Rules

1. **Never deploy on Friday** (or before holidays)
2. **Always have a rollback plan**
3. **Test the exact production build locally**
4. **Monitor everything after deploy**
5. **Keep old APIs working** (deprecate slowly)
6. **Document every production incident**

Remember: **Every production incident is a learning opportunity**. Update this guide when new issues are discovered.

## Future Actions & Roadmap

### Recently Completed ✅
1. **Bulletproof Architecture Implementation**
   - Global error boundaries for crash recovery
   - Data integrity layer with checksums and snapshots
   - Distributed lock manager for race condition prevention
   - Transaction system with rollback capability
   - Circuit breaker for network resilience
   - Automatic recovery system
   - Real-time monitoring dashboards

2. **Phase 2: Performance Optimizations (February 2025)**
   - Database performance improvements with optimized indexes
   - Full-text search implementation with PostgreSQL
   - Materialized views for dashboard statistics
   - Frontend performance utilities (debounce, throttle, lazy loading)
   - React component code splitting with lazy loading
   - Optimized image components with progressive loading
   - Service Worker for advanced caching strategies
   - Performance monitoring hooks and utilities

### High Priority
1. **GitHub SSO Implementation**
   - Research shows 34% conversion increase with GitHub login
   - Enable GitHub provider in Supabase Auth
   - Add GitHub button to Auth component
   - Update landing page when implemented

2. **Real Screenshots for Landing Page**
   - Replace simplified demos with actual product screenshots
   - Show real Devlog interface in action
   - Include search, code blocks, and document linking

3. **Settings Panel Implementation**
   - Currently Settings button has no functionality
   - Add user preferences (theme, editor settings)
   - Export/import options
   - Account management

### Medium Priority
1. **Enhanced Search**
   - Full-text search across all blocks
   - Search filters (by type, date, tags)
   - Search history and suggestions

2. **Performance Monitoring**
   - Implement telemetry for save operations
   - Track document load times
   - Monitor block rendering performance

3. **Collaboration Features**
   - Share read-only documents
   - Public document links
   - Team workspaces

### Long Term Vision
1. **Plugin System**
   - Custom block types
   - Third-party integrations
   - Community marketplace

2. **Mobile Apps**
   - React Native implementation
   - Offline-first architecture
   - Cross-device sync

3. **AI Features**
   - Smart suggestions based on content
   - Auto-tagging and categorization
   - Similar document recommendations
   - Content summarization