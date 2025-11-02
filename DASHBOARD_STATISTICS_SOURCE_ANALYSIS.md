# Dashboard Statistics Source Analysis

**Date**: 2025-11-02
**Investigator**: Claude
**Question**: Where do the statistics in the dashboard documents come from?

---

## Executive Summary

**TL;DR**: The statistics you see in the dashboard are **100% SYNTHETIC/FAKE**, generated client-side with random data. However, **REAL statistics DO exist** in the database (`document_cache` table) and can be queried, but the dashboard currently doesn't use them.

---

## Visible Statistics in Dashboard

### 1. Document Count - "All Documents (251)"

**Location**: `src/components/Dashboard/DashboardHeader.jsx:81`

```javascript
<h1 className="text-white/90">
  All Documents <span className="text-white/40">({entries.length})</span>
</h1>
```

**Source**: **Computed client-side** by counting the `entries` array length

**Data Flow**:
- Dashboard fetches documents via pagination hook
- `entries` array contains all loaded documents
- Header displays `entries.length`

**Real or Fake**: ✅ **REAL** - This is an accurate count of documents

---

### 2. Activity Chart (20 bars on each document card)

**Location**: `src/components/EntryCardRedesigned.jsx:72-80`

```javascript
// Generate activity data (memoized)
const activityData = useMemo(() => {
  const fullData = generateActivityData(entry);
  return fullData.slice(-20); // Show last 20 weeks
}, [entry.id, entry.updatedAt, entry.createdAt]);
```

**Source**: **Computed client-side** using `generateActivityData()` from `src/utils/activityData.js`

**Algorithm** (`activityData.js`):
```javascript
export function generateActivityData(entry) {
  // Generates 26 weeks of activity data based on:

  // 1. Document creation week (high activity spike)
  if (createdAt >= weekStart && createdAt <= weekEnd) {
    weeklyActivity += 50 + Math.random() * 20;
  }

  // 2. Last update week (high activity spike)
  if (lastUpdate >= weekStart && lastUpdate <= weekEnd) {
    weeklyActivity += 40 + Math.random() * 20;
  }

  // 3. Block count bonus (more blocks = more activity)
  if (entry.blocks && entry.blocks.length > 0) {
    const blockBonus = Math.min(entry.blocks.length / 10, 5);
    weeklyActivity += blockBonus * Math.random() * 5;
  }

  // 4. Block type bonuses (code blocks, AI blocks add extra)

  // 5. Seasonal variation (sine wave pattern)

  // 6. Decay factor for old documents

  return data; // Array of 26 weekly activity values
}
```

**Real or Fake**: ⚠️ **SYNTHETIC** - Based on metadata (`createdAt`, `updatedAt`, `blocks`) but NOT real edit history

**Why It Looks Realistic**:
- Uses document timestamps to create activity spikes
- Considers block count and types
- Adds sine wave variation for natural appearance
- BUT: Does NOT track actual edit events or real user activity

---

## Real Statistics Available in Database

### Database Table: `document_cache`

**Schema**:
```sql
CREATE TABLE document_cache (
  document_id UUID PRIMARY KEY REFERENCES documents(id),
  block_count INTEGER DEFAULT 0,                    -- Real block count
  total_content_length INTEGER DEFAULT 0,           -- Total characters
  last_block_update TIMESTAMPTZ,                    -- Last edit timestamp
  tag_list TEXT[] DEFAULT '{}',                     -- Document tags
  link_count INTEGER DEFAULT 0,                     -- Number of links
  cache_updated_at TIMESTAMPTZ DEFAULT NOW()        -- Cache timestamp
);
```

**Purpose**: Performance cache for document statistics (comment in schema)

**Data**: Contains **REAL** statistics:
- `block_count`: Actual count of blocks in the document
- `total_content_length`: Total character count across all blocks
- `last_block_update`: Last time any block was modified
- `link_count`: Number of backlinks to this document

**Current Rows**: 290 cached documents (from Supabase MCP query)

---

### Database Function: `get_documents_with_stats()`

**Location**: Database migration `20240115_add_projects.sql:115-150`

```sql
CREATE OR REPLACE FUNCTION get_documents_with_stats(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title TEXT,
    preview TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    block_count BIGINT,          -- Real block count from cache
    version INTEGER,
    project_id UUID,
    project_name TEXT,
    project_color TEXT
)
```

**Purpose**: Optimized query that returns documents WITH real statistics from `document_cache`

**Status**: ❌ **DEFINED BUT NEVER CALLED** by the frontend

---

### TypeScript Wrapper: `supabase-optimizations.ts`

**Location**: `src/lib/supabase-optimizations.ts:173-192`

```typescript
interface DocumentStats {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  block_count: number;        // Real block count
  content_length: number;     // Real content length
  link_count: number;         // Real link count
  // ...
}

export async function getDocumentsWithStats(options = {}): Promise<DocumentStats[]> {
  const { data, error } = await supabase.rpc('get_documents_with_stats', {
    page_size: options.pageSize || 20,
    page_offset: options.pageOffset || 0,
    // ...
  });

  if (error) throw error;
  return data || [];
}
```

**Purpose**: TypeScript wrapper for the database function

**Status**: ❌ **DEFINED BUT NEVER IMPORTED OR USED** anywhere in the codebase

---

## What Dashboard Currently Uses

### Current Data Flow

```
Dashboard.jsx
  ↓
usePaginatedDashboard hook
  ↓
storageWrapper.loadAllDocuments()
  ↓
SupabaseAdapterOptimized.loadAllDocuments()
  ↓
Supabase Query:
  .from('documents')
  .select('id, title, tags, created_at, updated_at, metadata, folder_id, position')
  .range(offset, offset + limit - 1)
```

**Notice**: This query does NOT:
- Join with `document_cache` table
- Call `get_documents_with_stats()` function
- Fetch `block_count`, `total_content_length`, or `link_count`

**What IS fetched**:
- Document metadata (id, title, tags, timestamps)
- Folder association (folder_id)
- Position for ordering

---

### Block Count Fallback

**Location**: `src/utils/storage/SupabaseAdapter.js:305`

```javascript
blockCount: doc.metadata?.blockCount || doc.block_count || doc.blockCount || 0
```

**Fallback Chain**:
1. Try `doc.metadata.blockCount` (stored in JSONB metadata column)
2. Try `doc.block_count` (from JOIN with document_cache - but we don't JOIN)
3. Try `doc.blockCount` (alternative naming)
4. Default to 0 if none exist

**Current Reality**: Since we don't JOIN with `document_cache`, we only get `metadata.blockCount` if it was manually stored in the metadata JSONB field.

---

### Google Analytics Tracking (External)

**Location**: `src/components/ExpandedViewEnhanced.jsx:92`

```javascript
trackDocumentEvent('view', entry.id, {
  document_title: entry.title,
  block_count: entry.blockCount || 0,   // Tracked for analytics
  has_blocks: !!entry.blocks
});
```

**Purpose**: Tracks document views and block count in Google Analytics 4

**Status**: ✅ **ACTIVELY USED** - Sends data to Google Analytics, but:
- Only used for external analytics dashboard
- NOT visualized in the app UI
- NOT the source of activity charts

---

## The Gap: Real vs. Synthetic Data

### What EXISTS but ISN'T USED:

1. ✅ **`document_cache` table** with real statistics (290 rows)
2. ✅ **`get_documents_with_stats()` database function** to query it
3. ✅ **`getDocumentsWithStats()` TypeScript wrapper** to call it
4. ✅ **Cache update functions** to keep it fresh:
   - `update_document_cache(doc_id)`
   - `rebuild_user_caches()`

### What IS USED instead:

1. ❌ **`generateActivityData()`** - Synthetic activity based on timestamps
2. ❌ **Random sine wave patterns** for visual appeal
3. ❌ **Client-side computation** instead of database queries

---

## Why Current Implementation Uses Synthetic Data

From the research document (`2025-10-26_12-37-55_dashboard-statistics-and-folders.md`):

**Pros of Synthetic Data**:
- ⚡ **Fast**: No additional database queries needed
- 📦 **Always available**: Works even with incomplete data
- 🎨 **Visually appealing**: Sine wave patterns look realistic

**Cons of Synthetic Data**:
- ❌ **Misleading**: Doesn't reflect actual user activity
- ❌ **No value**: Users can't learn from fake patterns
- ❌ **Wasted potential**: Real data exists but isn't shown

**Historical Context**:
The activity charts were likely designed as placeholders during UI development and never replaced with real data, even though the backend infrastructure was built.

---

## How Document Updates ARE Tracked

### Database Level

**Migration**: `20250131_create_save_document_blocks_v3.sql:44`

```sql
UPDATE documents
SET
  title = p_title,
  tags = p_tags,
  updated_at = NOW(),           -- Automatic timestamp on every save
  metadata = jsonb_build_object(
    'preview', v_preview,
    'blockCount', array_length(p_blocks, 1),  -- Block count in metadata
    'lastSyncedAt', NOW()
  )
WHERE id = p_document_id AND user_id = p_user_id;
```

**Result**: Every save updates:
- `updated_at` timestamp
- `metadata.blockCount` (stored in JSONB)
- `metadata.lastSyncedAt`

### Storage Layer

**Location**: `src/utils/storage/SupabaseAdapterOptimized.js:216`

```javascript
.upsert(documents.map(doc => ({
  ...doc,
  updated_at: new Date().toISOString()  // Frontend sets timestamp
})));
```

### Auto-Save System

**Location**: `src/hooks/useAutoSave.js`

- Debounces saves for 1 second after last edit
- Creates backups before save
- 3 retry attempts with exponential backoff
- Updates `updated_at` on every save

**Result**: `updated_at` timestamp is VERY accurate for when document was last modified

---

## Recommendations

### Option 1: Use Real Block Count (Quick Fix)

**Change**: Display real block count instead of synthetic activity chart

**Dashboard Card**:
```javascript
// Instead of 20 activity bars
<div className="stats">
  <span className="block-count">{entry.blockCount} blocks</span>
  <span className="last-edited">Edited {formatRelativeTime(entry.updatedAt)}</span>
</div>
```

**Pros**:
- ✅ Shows real, useful information
- ✅ No database changes needed (blockCount already in metadata)
- ✅ Fast to implement (1-2 hours)

**Cons**:
- ❌ Less visually interesting than chart
- ❌ Doesn't show historical activity

---

### Option 2: Query document_cache for Real Stats

**Change**: Use `getDocumentsWithStats()` instead of current query

**In Dashboard**:
```javascript
// Import the function
import { getDocumentsWithStats } from '../lib/supabase-optimizations';

// In loadDocuments
const documents = await getDocumentsWithStats({
  pageSize: limit,
  pageOffset: page * limit,
  sortBy: 'updated_at',
  sortDesc: true
});

// Now documents have real block_count, content_length, link_count
```

**Pros**:
- ✅ Shows real statistics from database
- ✅ Infrastructure already built
- ✅ Includes link count, content length

**Cons**:
- ❌ Requires migration from current query
- ❌ Still doesn't show historical activity timeline

---

### Option 3: Track Real Edit History (Long-term)

**Change**: Create `document_activity` table to track every edit

**New Table**:
```sql
CREATE TABLE document_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT,                    -- 'create', 'edit', 'delete'
  blocks_added INTEGER,
  blocks_removed INTEGER,
  blocks_modified INTEGER,
  content_delta INTEGER,          -- Character change (+/-)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Visualization**:
```javascript
// Query weekly edit activity
const activity = await getDocumentActivity(documentId, { weeks: 20 });

// Display real bars based on actual edits
{activity.map((week, i) => (
  <div
    key={i}
    className="activity-bar"
    style={{ height: `${week.editCount * 5}%` }}
    title={`${week.editCount} edits`}
  />
))}
```

**Pros**:
- ✅ Shows REAL edit activity over time
- ✅ Users can see their actual work patterns
- ✅ Useful for analytics and insights

**Cons**:
- ❌ Requires new database table and triggers
- ❌ Adds storage overhead for every edit
- ❌ Needs historical data migration (can't show past activity)

---

## Conclusion

### Current State
- ❌ Activity charts are **100% synthetic/fake** (random sine waves)
- ✅ Document count is **real** (entries.length)
- ⚠️ Block count exists in metadata but **not displayed**

### Available Infrastructure (Unused)
- ✅ `document_cache` table with real statistics
- ✅ `get_documents_with_stats()` database function
- ✅ `getDocumentsWithStats()` TypeScript wrapper
- ✅ Cache update functions

### Why It's Synthetic
The activity charts were likely designed as **visual placeholders** during UI development and never replaced with real data, even though the backend infrastructure exists.

### Best Next Step
**Use Option 1 or 2**:
1. **Quick win**: Display real block count + last edited timestamp (Option 1)
2. **Better**: Use `getDocumentsWithStats()` to show real statistics from cache (Option 2)

Both options require minimal code changes and leverage existing infrastructure.

---

## Code References

### Statistics Display
- `src/components/Dashboard/DashboardHeader.jsx:81` - Document count display
- `src/components/EntryCardRedesigned.jsx:72-80` - Activity chart generation
- `src/utils/activityData.js` - Synthetic activity algorithm

### Real Statistics Infrastructure
- Database: `document_cache` table (290 rows)
- Function: `get_documents_with_stats()` in migrations
- Wrapper: `src/lib/supabase-optimizations.ts:173-192`
- Cache management: `update_document_cache()`, `rebuild_user_caches()`

### Document Update Tracking
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql:44`
- `src/utils/storage/SupabaseAdapterOptimized.js:216`
- `src/hooks/useAutoSave.js`

### Analytics Tracking
- `src/components/ExpandedViewEnhanced.jsx:92` - Google Analytics events
- External only, not visualized in-app
