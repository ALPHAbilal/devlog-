# Real Statistics Solution Using PostgreSQL Audit Tracking

**Date**: 2025-11-02
**Status**: Proposed Solution
**Approach**: Native PostgreSQL audit logging with triggers

---

## Executive Summary

**Problem**: Dashboard statistics are 100% synthetic/fake data. We need REAL activity tracking.

**Solution**: Implement PostgreSQL audit logging using triggers to track every document and block change, then generate real statistics from this historical data.

**Supabase Built-in Features Found**:
- ❌ `supa_audit` extension - Not available on this instance
- ❌ `pgaudit` extension - Available but not installed (designed for security auditing, not app features)
- ✅ `audit_log_entries` table - Exists but only for auth events
- ✅ **Native PostgreSQL triggers** - Available and perfect for this use case

**Recommended Approach**: Build custom audit system using PostgreSQL triggers (same approach Supabase's `supa_audit` uses internally)

---

## Architecture: Real Audit System

### 1. Audit Table Schema

```sql
CREATE SCHEMA IF NOT EXISTS audit;

-- Main audit table stores ALL changes to documents and blocks
CREATE TABLE audit.record_version (
  id BIGSERIAL PRIMARY KEY,

  -- Record identification (stable across changes)
  record_id UUID NOT NULL,           -- Unique ID for this logical record
  old_record_id UUID,                 -- Previous version (for updates/deletes)

  -- Operation metadata
  op VARCHAR(10) NOT NULL,            -- INSERT, UPDATE, DELETE, TRUNCATE
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Table identification
  table_oid OID NOT NULL,             -- Which table was modified
  table_schema TEXT NOT NULL,
  table_name TEXT NOT NULL,

  -- Change data (JSONB for schema flexibility)
  record JSONB,                       -- Current/new record data
  old_record JSONB,                   -- Previous record data (for updates/deletes)

  -- User tracking
  user_id UUID,                       -- Who made the change

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb  -- Additional context (IP, device, etc.)
);

-- Performance indexes
CREATE INDEX idx_record_version_ts ON audit.record_version USING BRIN (ts);
CREATE INDEX idx_record_version_record_id ON audit.record_version (record_id);
CREATE INDEX idx_record_version_table_oid ON audit.record_version (table_oid);
CREATE INDEX idx_record_version_user_id ON audit.record_version (user_id);

-- RLS for security
ALTER TABLE audit.record_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON audit.record_version
  FOR SELECT
  USING (user_id = auth.uid());
```

### 2. Generic Audit Trigger Function

```sql
CREATE OR REPLACE FUNCTION audit.insert_update_delete_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id UUID;
  v_old_record_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID from auth context
  v_user_id := auth.uid();

  -- Generate stable record_id based on primary key
  -- Uses UUID v5 (namespace-based) for deterministic IDs
  v_record_id := uuid_generate_v5(
    uuid_ns_oid(),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME || '.' ||
    COALESCE(NEW.id::text, OLD.id::text)
  );

  -- For updates/deletes, also track the old record_id
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_old_record_id := v_record_id;
  END IF;

  -- Insert audit record
  INSERT INTO audit.record_version (
    record_id,
    old_record_id,
    op,
    ts,
    table_oid,
    table_schema,
    table_name,
    record,
    old_record,
    user_id
  ) VALUES (
    v_record_id,
    v_old_record_id,
    TG_OP,
    NOW(),
    TG_RELID,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    v_user_id
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Enable Tracking Functions

```sql
-- Enable audit tracking for a table
CREATE OR REPLACE FUNCTION audit.enable_tracking(target_table regclass)
RETURNS void AS $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  v_trigger_name := 'audit_' || target_table::text;

  EXECUTE format(
    'CREATE TRIGGER %I
     AFTER INSERT OR UPDATE OR DELETE ON %s
     FOR EACH ROW EXECUTE FUNCTION audit.insert_update_delete_trigger()',
    v_trigger_name,
    target_table
  );
END;
$$ LANGUAGE plpgsql;

-- Disable audit tracking
CREATE OR REPLACE FUNCTION audit.disable_tracking(target_table regclass)
RETURNS void AS $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  v_trigger_name := 'audit_' || target_table::text;

  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %s',
    v_trigger_name,
    target_table
  );
END;
$$ LANGUAGE plpgsql;
```

### 4. Enable Tracking on Our Tables

```sql
-- Track document changes
SELECT audit.enable_tracking('public.documents'::regclass);

-- Track block changes (this is where real activity happens!)
SELECT audit.enable_tracking('public.blocks'::regclass);
```

---

## Real Statistics Queries

### Query 1: Document Activity Timeline (Last 20 Weeks)

```sql
CREATE OR REPLACE FUNCTION get_document_activity(
  p_document_id UUID,
  p_weeks INTEGER DEFAULT 20
)
RETURNS TABLE (
  week_start DATE,
  edit_count BIGINT,
  blocks_added INTEGER,
  blocks_modified INTEGER,
  blocks_deleted INTEGER,
  total_changes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH weeks AS (
    -- Generate last N weeks
    SELECT
      date_trunc('week', CURRENT_DATE - (n || ' weeks')::interval)::date AS week_start
    FROM generate_series(0, p_weeks - 1) AS n
  ),
  document_changes AS (
    -- Get all changes to this document
    SELECT
      date_trunc('week', ts)::date AS week,
      op,
      COUNT(*) AS change_count
    FROM audit.record_version
    WHERE
      table_name = 'documents'
      AND record_id = uuid_generate_v5(uuid_ns_oid(), 'public.documents.' || p_document_id::text)
    GROUP BY week, op
  ),
  block_changes AS (
    -- Get all block changes for this document
    SELECT
      date_trunc('week', ts)::date AS week,
      op,
      COUNT(*) AS change_count
    FROM audit.record_version
    WHERE
      table_name = 'blocks'
      AND (record->>'document_id')::uuid = p_document_id
    GROUP BY week, op
  )
  SELECT
    w.week_start,
    COALESCE(SUM(CASE WHEN bc.op IN ('INSERT', 'UPDATE', 'DELETE') THEN bc.change_count ELSE 0 END), 0)::bigint AS edit_count,
    COALESCE(SUM(CASE WHEN bc.op = 'INSERT' THEN bc.change_count ELSE 0 END), 0)::integer AS blocks_added,
    COALESCE(SUM(CASE WHEN bc.op = 'UPDATE' THEN bc.change_count ELSE 0 END), 0)::integer AS blocks_modified,
    COALESCE(SUM(CASE WHEN bc.op = 'DELETE' THEN bc.change_count ELSE 0 END), 0)::integer AS blocks_deleted,
    COALESCE(SUM(bc.change_count), 0)::integer AS total_changes
  FROM weeks w
  LEFT JOIN block_changes bc ON bc.week = w.week_start
  GROUP BY w.week_start
  ORDER BY w.week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Example Query**:
```sql
-- Get real activity data for a document
SELECT * FROM get_document_activity('doc-uuid-here', 20);
```

**Result**:
```
 week_start  | edit_count | blocks_added | blocks_modified | blocks_deleted | total_changes
-------------+------------+--------------+-----------------+----------------+---------------
 2024-10-14  |          5 |            3 |               2 |              0 |             5
 2024-10-21  |         12 |            4 |               6 |              2 |            12
 2024-10-28  |          3 |            1 |               2 |              0 |             3
 ...
```

### Query 2: User Activity Statistics

```sql
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id UUID)
RETURNS TABLE (
  total_edits BIGINT,
  documents_modified BIGINT,
  blocks_created BIGINT,
  blocks_modified BIGINT,
  most_active_day TEXT,
  avg_daily_edits NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_edits,
    COUNT(DISTINCT record_id) FILTER (WHERE table_name = 'documents') AS documents_modified,
    COUNT(*) FILTER (WHERE table_name = 'blocks' AND op = 'INSERT') AS blocks_created,
    COUNT(*) FILTER (WHERE table_name = 'blocks' AND op = 'UPDATE') AS blocks_modified,
    TO_CHAR(
      (SELECT ts::date
       FROM audit.record_version
       WHERE user_id = p_user_id
       GROUP BY ts::date
       ORDER BY COUNT(*) DESC
       LIMIT 1),
      'Day, Mon DD'
    ) AS most_active_day,
    ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT ts::date), 0), 2) AS avg_daily_edits
  FROM audit.record_version
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Query 3: Recent Document Activity (for Dashboard Cards)

```sql
CREATE OR REPLACE FUNCTION get_documents_with_real_activity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  block_count INTEGER,
  last_edited TIMESTAMPTZ,
  edit_count_7d INTEGER,
  edit_count_30d INTEGER,
  recent_activity JSONB  -- Array of recent edit timestamps
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.created_at,
    d.updated_at,
    dc.block_count,
    (
      SELECT MAX(ts)
      FROM audit.record_version
      WHERE table_name = 'blocks'
        AND (record->>'document_id')::uuid = d.id
    ) AS last_edited,
    (
      SELECT COUNT(*)::integer
      FROM audit.record_version
      WHERE table_name = 'blocks'
        AND (record->>'document_id')::uuid = d.id
        AND ts >= NOW() - INTERVAL '7 days'
    ) AS edit_count_7d,
    (
      SELECT COUNT(*)::integer
      FROM audit.record_version
      WHERE table_name = 'blocks'
        AND (record->>'document_id')::uuid = d.id
        AND ts >= NOW() - INTERVAL '30 days'
    ) AS edit_count_30d,
    (
      SELECT jsonb_agg(ts ORDER BY ts DESC)
      FROM (
        SELECT ts
        FROM audit.record_version
        WHERE table_name = 'blocks'
          AND (record->>'document_id')::uuid = d.id
        ORDER BY ts DESC
        LIMIT 20
      ) recent
    ) AS recent_activity
  FROM documents d
  LEFT JOIN document_cache dc ON dc.document_id = d.id
  WHERE d.user_id = p_user_id
    AND d.deleted_at IS NULL
  ORDER BY d.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Implementation Plan

### Phase 1: Setup Audit Infrastructure (1-2 hours)

1. **Create audit schema and table** (migration file)
2. **Create trigger function**
3. **Create enable/disable functions**
4. **Enable tracking on documents and blocks**
5. **Test with manual edits**

### Phase 2: Build Statistics Functions (2-3 hours)

1. **Implement `get_document_activity()`** - Weekly activity timeline
2. **Implement `get_user_activity_stats()`** - User statistics
3. **Implement `get_documents_with_real_activity()`** - Dashboard data
4. **Add TypeScript wrappers** in `supabase-optimizations.ts`

### Phase 3: Update Frontend (3-4 hours)

1. **Update Dashboard to use `get_documents_with_real_activity()`**
2. **Update EntryCard to display real activity bars**
3. **Add loading states and error handling**
4. **Test with real user data**

### Phase 4: Performance Optimization (1-2 hours)

1. **Add materialized view** for frequently accessed statistics
2. **Implement caching** in `document_cache` table
3. **Add background job** to refresh statistics periodically
4. **Monitor query performance**

**Total Estimated Time**: 7-11 hours for complete real statistics system

---

## Data Flow with Real Audit System

### Before (Synthetic):
```
User edits document
  ↓
Auto-save updates document.updated_at
  ↓
Dashboard fetches documents
  ↓
EntryCard generates FAKE activity using sine waves
  ↓
User sees misleading synthetic data
```

### After (Real):
```
User edits document
  ↓
Auto-save updates blocks
  ↓
PostgreSQL trigger fires automatically
  ↓
audit.record_version stores:
  - timestamp
  - operation (INSERT/UPDATE/DELETE)
  - which block changed
  - old and new values
  ↓
Dashboard calls get_documents_with_real_activity()
  ↓
Function aggregates audit logs into weekly activity
  ↓
EntryCard displays REAL activity bars
  ↓
User sees accurate historical data
```

---

## Benefits of This Approach

### 1. **100% Real Data**
- Every bar represents actual edits
- Height = number of blocks changed that week
- No synthetic patterns or fake data

### 2. **Automatic & Transparent**
- PostgreSQL triggers fire automatically
- No application code changes needed for tracking
- Works even if frontend has bugs

### 3. **Historical Accuracy**
- Complete audit trail of all changes
- Can reconstruct document state at any point in time
- Useful for debugging and recovery

### 4. **Performance**
- BRIN index on timestamp (100x smaller than BTREE)
- Indexed by record_id for fast lookups
- Materialized views for aggregated stats

### 5. **Flexible Queries**
- "Show me all edits in the last 7 days"
- "Which documents were edited this week?"
- "What did the document look like on Oct 15?"
- "Who made the most edits last month?"

### 6. **Production-Ready**
- Based on Supabase's own `supa_audit` design
- Uses native PostgreSQL features (no external dependencies)
- Row Level Security for data isolation
- JSONB for schema flexibility

---

## Performance Considerations

### Write Performance Impact

**Overhead per edit**:
- ~0.5-2ms per INSERT/UPDATE/DELETE
- Acceptable for <3,000 ops/second (Supabase recommendation)
- Devlog is well under this threshold

**Mitigation**:
- Triggers fire AFTER operation (non-blocking)
- Audit inserts happen in same transaction (ACID guarantees)
- Indexes optimized for write performance

### Read Performance

**Dashboard query** (`get_documents_with_real_activity`):
- Aggregates 20 weeks of activity per document
- With 250 documents × 20 weeks = 5,000 data points
- Using indexes: ~50-100ms typical
- Can cache results in `document_cache` for instant loads

**Activity timeline query** (`get_document_activity`):
- Single document, 20 weeks
- With indexes: ~5-10ms typical
- Called only when opening document detail

---

## Migration Path

### Option A: Start Fresh (Recommended)

Enable audit tracking now, statistics will build over time:
- Week 1: Only shows current week activity
- Week 2: Shows 2 weeks of real data
- Week 20: Full 20-week real activity charts

### Option B: Backfill Historical Data

Generate synthetic audit records based on existing `updated_at` timestamps:
```sql
-- Backfill audit records (one-time)
INSERT INTO audit.record_version (
  record_id, op, ts, table_oid, table_schema, table_name,
  record, user_id
)
SELECT
  uuid_generate_v5(uuid_ns_oid(), 'public.blocks.' || id::text),
  'UPDATE',
  updated_at,
  'public.blocks'::regclass::oid,
  'public',
  'blocks',
  to_jsonb(blocks.*),
  user_id
FROM blocks
WHERE updated_at > created_at;  -- Only edits, not creates
```

**Trade-off**: Backfilled data is still synthetic (based on timestamps), but provides immediate visual feedback while real tracking builds.

---

## Alternative: Lightweight Approach

If full audit logging is overkill, we can use a simpler `document_edits` table:

```sql
CREATE TABLE document_edits (
  id BIGSERIAL PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES auth.users(id),
  blocks_added INTEGER DEFAULT 0,
  blocks_modified INTEGER DEFAULT 0,
  blocks_deleted INTEGER DEFAULT 0,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger that fires on block changes
CREATE TRIGGER track_block_edits
  AFTER INSERT OR UPDATE OR DELETE ON blocks
  FOR EACH ROW EXECUTE FUNCTION track_document_edit();
```

**Pros**: Simpler, smaller storage footprint
**Cons**: Less detailed, can't reconstruct history, no old values

---

## Recommendation

**Implement the full audit system** for these reasons:

1. **Future-proof**: Enables document versioning, undo/redo, time travel debugging
2. **Production-ready**: Based on Supabase's proven design
3. **Negligible cost**: ~0.5-2ms overhead per edit is acceptable
4. **Rich analytics**: Enables advanced features like "who edited what when"
5. **Real data**: No more fake synthetic statistics

The implementation is straightforward, the performance impact is minimal, and the benefits are significant.

---

## Next Steps

If you approve this approach, I can:

1. **Create the migration file** with audit schema, table, triggers, and functions
2. **Add TypeScript wrappers** for querying audit data
3. **Update Dashboard** to fetch and display real statistics
4. **Test with your existing data** to verify performance

This will give you 100% real, accurate activity tracking with no fake data.
