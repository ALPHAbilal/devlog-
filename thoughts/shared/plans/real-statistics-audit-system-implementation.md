# Real Statistics Audit System Implementation Plan

**Created**: 2025-11-02
**Status**: Ready for Implementation
**Estimated Time**: 7-11 hours
**Complexity**: Medium
**Approach**: PostgreSQL audit logging with triggers

---

## Overview

Replace 100% synthetic dashboard statistics with real activity tracking by implementing PostgreSQL audit logging using triggers. Track every document and block change in an `audit.record_version` table, then query this historical data to generate accurate weekly activity charts.

---

## ⚠️ CRITICAL: Schema Change Rules

**The existing database schema is the pillar of Devlog. All changes MUST be strictly additive.**

### What We CAN Do ✅

**NEW Infrastructure (Audit System)**:
- ✅ Create NEW `audit` schema (completely separate namespace)
- ✅ Create NEW `audit.record_version` table
- ✅ Create NEW audit trigger functions (in `audit` schema)
- ✅ Create NEW audit triggers on existing tables (AFTER triggers only)
- ✅ Create NEW PostgreSQL functions for querying audit data
- ✅ Create NEW indexes on audit tables
- ✅ Create NEW materialized views in audit schema
- ✅ Add NEW RLS policies on audit tables

### What We CANNOT Do ❌

**Existing Core Infrastructure (PROTECTED)**:
- ❌ Modify `documents` table structure (no new columns, no type changes)
- ❌ Modify `blocks` table structure (no new columns, no type changes)
- ❌ Modify `document_cache` table structure
- ❌ Drop or modify existing triggers:
  - `update_document_search_vector_trigger`
  - `handle_documents_updated_at`
  - `refresh_stats_on_document_change`
  - `update_folder_timestamp_on_document_change`
  - `update_cache_on_block_change`
  - `update_document_on_block_change`
  - `refresh_stats_on_block_change`
  - `set_block_user_id_trigger`
  - `update_block_search_vector_trigger`
- ❌ Drop or modify existing indexes on documents/blocks tables
- ❌ Modify existing RLS policies
- ❌ Change existing function signatures
- ❌ Alter authentication or user management

### Verification Requirements

**After EVERY schema change, we MUST verify**:
1. All existing triggers still exist and function
2. All existing indexes remain intact
3. All existing RLS policies are unchanged
4. No performance degradation on core operations (save, load, delete)
5. Existing application functionality works identically

### Implementation Strategy

**Separation of Concerns**:
- Audit system lives in its own `audit` schema (namespace isolation)
- Audit triggers are AFTER triggers (fire AFTER core operations complete)
- Audit operations never block or interfere with core operations
- If audit system fails, core system continues working
- Audit can be disabled/removed without affecting core functionality

**Migration Approach**:
- Use Supabase MCP `apply_migration` tool for ALL schema changes
- Each migration is atomic and reversible
- Verify existing schema integrity before and after each migration
- Test rollback procedures before deploying to production

---

## Current State Analysis

### Database Schema (Verified via Supabase MCP)

**Documents Table**:
- ✅ Has `user_id`, `created_at`, `updated_at`, `metadata`, `deleted_at`
- ✅ Well-indexed: 11 indexes including composite indexes on (user_id, updated_at)
- ✅ Existing triggers: `update_document_search_vector_trigger`, `handle_documents_updated_at`, `refresh_stats_on_document_change`, `update_folder_timestamp_on_document_change`

**Blocks Table**:
- ✅ Has `document_id`, `type`, `content`, `position`, `user_id`, `created_at`, `updated_at`, `metadata`, `deleted_at`
- ✅ Well-indexed: 14 indexes including (document_id, position), (document_id, updated_at)
- ✅ Existing triggers: `update_cache_on_block_change`, `update_document_on_block_change`, `refresh_stats_on_block_change`, `set_block_user_id_trigger`, `update_block_search_vector_trigger`

**Audit Infrastructure**:
- ❌ `audit` schema does NOT exist yet
- ❌ No audit triggers on documents/blocks tables yet
- ✅ `uuid_generate_v5()` function available (for stable record IDs)
- ✅ `document_cache` table exists and is maintained by existing triggers

**Key Discovery**: The database already has comprehensive triggers for cache updates and stats refreshing. We're adding NEW audit functionality on top of this existing infrastructure.

### Frontend Current State

**Synthetic Statistics** (`src/components/EntryCardRedesigned.jsx:72-83`):
```javascript
const activityData = useMemo(() => {
  const fullData = generateActivityData(entry);  // SYNTHETIC
  return fullData.slice(-20);  // Last 20 weeks
}, [entry.id, entry.updatedAt, entry.createdAt]);
```

**Algorithm** (`src/utils/activityData.js`):
- Generates fake activity using timestamps + random sine waves
- Based on `createdAt`, `updatedAt`, block count
- NOT real edit history

**Available but UNUSED** (`src/lib/supabase-optimizations.ts:173-192`):
- `getDocumentsWithStats()` function exists
- Would query `document_cache` table
- Never imported or called

---

## Desired End State

### Database Layer

1. **Audit Schema Created**: `audit.record_version` table stores all changes
2. **Audit Triggers Active**: Fire on INSERT/UPDATE/DELETE to documents and blocks
3. **Statistics Functions Deployed**:
   - `get_document_activity(doc_id, weeks)` - Weekly activity timeline
   - `get_user_activity_stats(user_id)` - User-level statistics
   - `get_documents_with_real_activity(user_id, limit, offset)` - Dashboard data

### Frontend Layer

1. **Real Activity Charts**: EntryCardRedesigned displays actual edit counts
2. **Dashboard Integration**: usePaginatedDashboard calls `get_documents_with_real_activity()`
3. **Synthetic Code Removed**: activityData.js deleted or archived

### Verification

**Automated Verification**:
```bash
# Database migration applies cleanly
supabase migration up

# Triggers are created
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('documents', 'blocks')
AND trigger_name LIKE 'audit_%';

# Audit table receives data after edits
SELECT COUNT(*) FROM audit.record_version;

# Statistics functions exist
SELECT proname FROM pg_proc WHERE proname LIKE 'get_%activity%';
```

**Manual Verification**:
- [ ] Edit a document → audit.record_version row created
- [ ] Dashboard displays real activity bars (not synthetic patterns)
- [ ] Activity chart bars correspond to actual edit counts
- [ ] No errors in browser console
- [ ] Performance is acceptable (<100ms for dashboard load)

---

## What We're NOT Doing

- ❌ Modifying the Smart Sync save flow (works perfectly, don't touch)
- ❌ Changing existing triggers (document_cache, search_vector, etc.)
- ❌ Adding UI for viewing detailed audit history (future feature)
- ❌ Implementing document versioning/undo (future feature)
- ❌ Exposing audit logs to users (admin/debugging only for now)
- ❌ Changing how blocks are serialized or stored
- ❌ Backfilling historical data (start fresh, build over time)
- ❌ **ARCHIVING or KEEPING legacy code** (delete permanently, no backups)

---

## Implementation Approach

Use PostgreSQL's native trigger system (same approach as Supabase's own `supa_audit` extension). Triggers fire automatically on every INSERT/UPDATE/DELETE, storing complete change history in JSONB format. Statistics functions query this audit trail to generate real activity metrics.

**Why This Approach**:
1. **Automatic**: Triggers work transparently without application changes
2. **Reliable**: Triggers fire even if frontend has bugs
3. **Complete**: Captures ALL changes, including bulk operations
4. **Proven**: Same design as Supabase's own audit extension
5. **Performant**: ~0.5-2ms overhead per edit (acceptable for <3,000 ops/sec)

---

## Phase 1: Database Audit Infrastructure

**Time Estimate**: 1-2 hours

### Overview
Create the audit schema, record_version table, trigger function, and helper functions for enabling/disabling audit tracking.

### ⚠️ Implementation Method

**CRITICAL**: All schema changes MUST use Supabase MCP tools:
- `mcp__supabase__apply_migration` for all DDL operations
- `mcp__supabase__execute_sql` for verification queries ONLY
- Never use direct SQL files or manual migrations

### Pre-Migration Verification

**BEFORE applying any changes, verify existing schema integrity**:

```javascript
// Verify all existing triggers are present
const existingTriggers = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name, event_object_table, action_timing
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks')
    ORDER BY event_object_table, trigger_name;
  `
});

// Expected results:
// - update_document_search_vector_trigger on documents
// - handle_documents_updated_at on documents
// - refresh_stats_on_document_change on documents
// - update_folder_timestamp_on_document_change on documents
// - update_cache_on_block_change on blocks
// - update_document_on_block_change on blocks
// - refresh_stats_on_block_change on blocks
// - set_block_user_id_trigger on blocks
// - update_block_search_vector_trigger on blocks

console.log('Existing triggers BEFORE audit migration:', existingTriggers);
```

### Changes Required

#### 1. Create Audit Schema and Table

```sql
-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Schema for audit logging and change tracking';

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main audit table
CREATE TABLE audit.record_version (
  id BIGSERIAL PRIMARY KEY,

  -- Record identification (stable across changes)
  record_id UUID NOT NULL,
  old_record_id UUID,

  -- Operation metadata
  op VARCHAR(10) NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Table identification
  table_oid OID NOT NULL,
  table_schema TEXT NOT NULL,
  table_name TEXT NOT NULL,

  -- Change data (JSONB for schema flexibility)
  record JSONB,
  old_record JSONB,

  -- User tracking (CRITICAL: from document ownership, not auth.uid())
  user_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE audit.record_version IS 'Stores complete audit trail of all changes to documents and blocks';
COMMENT ON COLUMN audit.record_version.record_id IS 'Stable UUID based on table OID and primary key';
COMMENT ON COLUMN audit.record_version.op IS 'Operation type: INSERT, UPDATE, DELETE, or TRUNCATE';
COMMENT ON COLUMN audit.record_version.user_id IS 'User who made the change (from document ownership, not auth context)';
```

#### 2. Create Performance Indexes

```sql
-- Performance indexes
CREATE INDEX idx_record_version_ts ON audit.record_version USING BRIN (ts);
COMMENT ON INDEX idx_record_version_ts IS 'BRIN index for time-range queries (100x smaller than BTREE)';

CREATE INDEX idx_record_version_record_id ON audit.record_version (record_id);
COMMENT ON INDEX idx_record_version_record_id IS 'BTREE index for single record history queries';

CREATE INDEX idx_record_version_table_oid ON audit.record_version (table_oid);
COMMENT ON INDEX idx_record_version_table_oid IS 'Filter by table for optimal performance';

CREATE INDEX idx_record_version_user_id ON audit.record_version (user_id);
COMMENT ON INDEX idx_record_version_user_id IS 'User activity queries';

CREATE INDEX idx_record_version_table_ts ON audit.record_version (table_name, ts DESC);
COMMENT ON INDEX idx_record_version_table_ts IS 'Table-specific time-range queries';
```

#### 3. Create Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE audit.record_version ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit.record_version
  FOR SELECT
  USING (
    user_id = auth.uid()
  );

COMMENT ON POLICY "Users can view their own audit logs" ON audit.record_version
IS 'Users can only view audit records for their own changes';

-- Policy: No direct inserts/updates/deletes (triggers only)
CREATE POLICY "Only triggers can modify audit logs"
  ON audit.record_version
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON POLICY "Only triggers can modify audit logs" ON audit.record_version
IS 'Audit records are insert-only via triggers, users cannot modify';
```

#### 4. Create Generic Audit Trigger Function

```sql
CREATE OR REPLACE FUNCTION audit.insert_update_delete_trigger()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
DECLARE
  v_record_id UUID;
  v_old_record_id UUID;
  v_user_id UUID;
  v_document_id UUID;
BEGIN
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

  -- Get user_id from record or document ownership
  -- CRITICAL: auth.uid() returns NULL in trigger context, must get from data
  IF TG_TABLE_NAME = 'documents' THEN
    -- For documents table, user_id is directly on the record
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'blocks' THEN
    -- For blocks table, get user_id from parent document
    v_document_id := COALESCE(NEW.document_id, OLD.document_id);
    SELECT user_id INTO v_user_id FROM documents WHERE id = v_document_id;

    -- Fallback to block's user_id if document lookup fails
    IF v_user_id IS NULL THEN
      v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    END IF;
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
    user_id,
    metadata
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
    v_user_id,
    jsonb_build_object(
      'trigger_name', TG_NAME,
      'trigger_when', TG_WHEN,
      'trigger_level', TG_LEVEL
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION audit.insert_update_delete_trigger()
IS 'Generic trigger function that logs all INSERT/UPDATE/DELETE operations to audit.record_version';
```

#### 5. Create Enable/Disable Tracking Functions

```sql
-- Enable audit tracking for a table
CREATE OR REPLACE FUNCTION audit.enable_tracking(target_table regclass)
RETURNS void
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  -- Generate trigger name
  v_trigger_name := 'audit_' || replace(target_table::text, '.', '_');

  -- Drop trigger if it exists (idempotent)
  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %s',
    v_trigger_name,
    target_table
  );

  -- Create trigger
  EXECUTE format(
    'CREATE TRIGGER %I
     AFTER INSERT OR UPDATE OR DELETE ON %s
     FOR EACH ROW EXECUTE FUNCTION audit.insert_update_delete_trigger()',
    v_trigger_name,
    target_table
  );

  RAISE NOTICE 'Audit tracking enabled for %', target_table;
END;
$$;

COMMENT ON FUNCTION audit.enable_tracking(regclass)
IS 'Enable audit tracking on a table by creating an AFTER trigger';

-- Disable audit tracking
CREATE OR REPLACE FUNCTION audit.disable_tracking(target_table regclass)
RETURNS void
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  v_trigger_name := 'audit_' || replace(target_table::text, '.', '_');

  EXECUTE format(
    'DROP TRIGGER IF EXISTS %I ON %s',
    v_trigger_name,
    target_table
  );

  RAISE NOTICE 'Audit tracking disabled for %', target_table;
END;
$$;

COMMENT ON FUNCTION audit.disable_tracking(regclass)
IS 'Disable audit tracking on a table by dropping the audit trigger';
```

#### 6. Enable Tracking on Documents and Blocks

```sql
-- Enable tracking on documents table
SELECT audit.enable_tracking('public.documents'::regclass);

-- Enable tracking on blocks table (this is where real activity happens!)
SELECT audit.enable_tracking('public.blocks'::regclass);

-- Verify triggers were created
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_%'
ORDER BY event_object_table, trigger_name;
```

### Migration Execution Steps

**Step 1: Combine all SQL into single migration**

Combine steps 1-6 above into a single SQL script for the migration.

**Step 2: Apply migration using MCP tool**

```javascript
// Apply the audit tracking system migration
const migrationResult = await mcp__supabase__apply_migration({
  project_id: PROJECT_ID,
  name: 'audit_tracking_system',
  query: `
    -- [PASTE ALL SQL FROM STEPS 1-6 HERE AS SINGLE STRING]
    -- This includes:
    -- 1. CREATE SCHEMA audit
    -- 2. CREATE TABLE audit.record_version
    -- 3. CREATE indexes
    -- 4. CREATE RLS policies
    -- 5. CREATE trigger function
    -- 6. CREATE enable/disable tracking functions
    -- 7. Enable tracking on documents and blocks
  `
});

console.log('Migration applied:', migrationResult);
```

**Step 3: Verify migration success**

```javascript
// Verify audit schema exists
const schemaCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'audit';"
});
console.log('Audit schema exists:', schemaCheck.length > 0);

// Verify audit table exists
const tableCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'audit' AND table_name = 'record_version';
  `
});
console.log('Audit table exists:', tableCheck.length > 0);

// Verify audit triggers were created
const auditTriggersCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE trigger_name LIKE 'audit_%'
    ORDER BY event_object_table, trigger_name;
  `
});
console.log('Audit triggers created:', auditTriggersCheck);
// Expected: audit_public_documents on documents, audit_public_blocks on blocks
```

**Step 4: CRITICAL - Verify existing triggers still intact**

```javascript
// Verify ALL original triggers still exist
const postMigrationTriggers = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name, event_object_table, action_timing
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks')
    ORDER BY event_object_table, trigger_name;
  `
});

// Compare with pre-migration results
// MUST include all 9 original triggers PLUS 2 new audit triggers = 11 total
console.log('Post-migration triggers:', postMigrationTriggers);

// Verify count
if (postMigrationTriggers.length < 11) {
  throw new Error('CRITICAL: Original triggers may have been lost!');
}
```

### Success Criteria

#### Automated Verification (using MCP tools):

```javascript
// 1. Verify audit schema exists
const schemaExists = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'audit';"
});
console.assert(schemaExists.length === 1, 'Audit schema must exist');

// 2. Verify audit table exists with correct columns
const tableStructure = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'audit' AND table_name = 'record_version'
    ORDER BY ordinal_position;
  `
});
console.assert(tableStructure.length >= 12, 'All audit columns must exist');

// 3. Verify audit triggers exist (exactly 2)
const auditTriggers = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'audit_%';"
});
console.assert(auditTriggers.length === 2, 'Must have 2 audit triggers');

// 4. Verify all original triggers still exist (at least 9)
const originalTriggers = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks')
      AND trigger_name NOT LIKE 'audit_%';
  `
});
console.assert(originalTriggers[0].count >= 9, 'Original triggers must be intact');

// 5. Verify indexes exist on audit table
const auditIndexes = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT indexname FROM pg_indexes WHERE schemaname = 'audit';"
});
console.assert(auditIndexes.length >= 5, 'All audit indexes must exist');

// 6. Verify RLS is enabled on audit table
const rlsEnabled = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT relname, relrowsecurity
    FROM pg_class
    WHERE relname = 'record_version' AND relnamespace = 'audit'::regnamespace;
  `
});
console.assert(rlsEnabled[0].relrowsecurity === true, 'RLS must be enabled');

console.log('✅ Phase 1 automated verification complete');
```

#### Manual Verification:
- [ ] Create a new document → audit.record_version has 1 INSERT record
- [ ] Edit a block → audit.record_version has 1 UPDATE record
- [ ] Delete a block → audit.record_version has 1 DELETE record
- [ ] Verify `user_id` is correctly populated (not NULL)
- [ ] Verify `record` JSONB contains complete block data
- [ ] No errors in Supabase logs

---

## Phase 2: Statistics Query Functions

**Time Estimate**: 2-3 hours

### Overview
Create PostgreSQL functions that query the audit trail to generate real statistics: weekly activity timelines, user statistics, and dashboard data with real edit counts.

### ⚠️ Implementation Method

**CRITICAL**: Use Supabase MCP tools for function deployment:
- `mcp__supabase__apply_migration` for creating new functions
- `mcp__supabase__execute_sql` for testing functions after deployment
- These functions are READ-ONLY (no modifications to existing schema)

### Changes Required

#### 1. Document Activity Timeline Function

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
)
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH weeks AS (
    -- Generate last N weeks
    SELECT
      date_trunc('week', CURRENT_DATE - (n || ' weeks')::interval)::date AS week_start
    FROM generate_series(0, p_weeks - 1) AS n
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
$$;

COMMENT ON FUNCTION get_document_activity(uuid, integer)
IS 'Returns weekly activity breakdown for a document (blocks added/modified/deleted)';
```

#### 2. User Activity Statistics Function

```sql
CREATE OR REPLACE FUNCTION get_user_activity_stats(p_user_id UUID)
RETURNS TABLE (
  total_edits BIGINT,
  documents_modified BIGINT,
  blocks_created BIGINT,
  blocks_modified BIGINT,
  most_active_day TEXT,
  avg_daily_edits NUMERIC
)
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
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
$$;

COMMENT ON FUNCTION get_user_activity_stats(uuid)
IS 'Returns aggregate statistics for a user (total edits, most active day, etc.)';
```

#### 3. Documents with Real Activity Function

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
  folder_id UUID,
  position INTEGER,
  metadata JSONB,
  tags TEXT[],
  block_count INTEGER,
  last_edited TIMESTAMPTZ,
  edit_count_7d INTEGER,
  edit_count_30d INTEGER,
  recent_activity JSONB
)
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.created_at,
    d.updated_at,
    d.folder_id,
    d.position,
    d.metadata,
    d.tags,
    COALESCE(dc.block_count, 0)::integer AS block_count,
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
      SELECT jsonb_agg(
        jsonb_build_object(
          'ts', ts,
          'op', op,
          'block_id', record->>'id'
        ) ORDER BY ts DESC
      )
      FROM (
        SELECT ts, op, record
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
$$;

COMMENT ON FUNCTION get_documents_with_real_activity(uuid, integer, integer)
IS 'Returns documents with real activity metrics from audit logs (for Dashboard)';
```

### Migration Execution Steps

**Step 1: Apply statistics functions migration**

```javascript
// Apply the audit statistics functions migration
const functionsResult = await mcp__supabase__apply_migration({
  project_id: PROJECT_ID,
  name: 'audit_statistics_functions',
  query: `
    -- [PASTE ALL SQL FROM STEPS 1-3 HERE AS SINGLE STRING]
    -- This includes:
    -- 1. get_document_activity function
    -- 2. get_user_activity_stats function
    -- 3. get_documents_with_real_activity function
  `
});

console.log('Statistics functions migration applied:', functionsResult);
```

**Step 2: Verify functions exist**

```javascript
// Verify all 3 functions were created
const functionsCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT proname, pronargs
    FROM pg_proc
    WHERE proname IN (
      'get_document_activity',
      'get_user_activity_stats',
      'get_documents_with_real_activity'
    )
    ORDER BY proname;
  `
});

console.log('Statistics functions created:', functionsCheck);
console.assert(functionsCheck.length === 3, 'All 3 functions must exist');
```

**Step 3: Test functions with sample data**

```javascript
// Test get_user_activity_stats (should work even with no audit data)
const statsTest = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT *
    FROM get_user_activity_stats(
      (SELECT id FROM auth.users LIMIT 1)::uuid
    );
  `
});
console.log('User activity stats test:', statsTest);

// Test get_documents_with_real_activity
const docsTest = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT id, title, edit_count_7d, edit_count_30d
    FROM get_documents_with_real_activity(
      (SELECT id FROM auth.users LIMIT 1)::uuid,
      10,
      0
    )
    LIMIT 5;
  `
});
console.log('Documents with activity test:', docsTest);
```

**Step 4: CRITICAL - Verify no schema changes**

```javascript
// Verify original triggers still intact
const triggersCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks');
  `
});
console.assert(triggersCheck[0].count >= 11, 'All triggers must remain intact');

// Verify no changes to documents/blocks tables
const tablesCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_name IN ('documents', 'blocks')
    ORDER BY table_name, ordinal_position;
  `
});
console.log('Core tables structure unchanged:', tablesCheck.length);
// This should match the original column count
```

### Success Criteria

#### Automated Verification (using MCP tools):

```javascript
// 1. Verify all functions exist
const allFunctions = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT proname, pg_get_functiondef(oid) as definition
    FROM pg_proc
    WHERE proname IN (
      'get_document_activity',
      'get_user_activity_stats',
      'get_documents_with_real_activity'
    );
  `
});
console.assert(allFunctions.length === 3, 'All 3 functions must exist');

// 2. Verify functions are SECURITY DEFINER (safe execution)
const securityCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT proname, prosecdef
    FROM pg_proc
    WHERE proname LIKE 'get_%activity%';
  `
});
console.assert(securityCheck.every(f => f.prosecdef === true), 'All functions must be SECURITY DEFINER');

// 3. Test execution (with dummy user ID if no real users)
const executionTest = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT
      (SELECT COUNT(*) FROM get_user_activity_stats('00000000-0000-0000-0000-000000000000'::uuid)) as stats_works,
      (SELECT COUNT(*) FROM get_documents_with_real_activity('00000000-0000-0000-0000-000000000000'::uuid, 10, 0)) as docs_works;
  `
});
console.log('Function execution test:', executionTest);

console.log('✅ Phase 2 automated verification complete');
```

#### Manual Verification:
- [ ] Call `get_document_activity(doc_id, 20)` → returns 20 weeks with correct counts
- [ ] Call `get_user_activity_stats(user_id)` → returns aggregate statistics
- [ ] Call `get_documents_with_real_activity(user_id, 50, 0)` → returns documents with activity data
- [ ] Verify performance: all queries complete in <100ms
- [ ] Edit counts match actual edits made in audit.record_version

---

## Phase 3: Frontend Integration

**Time Estimate**: 3-4 hours

### Overview
Update the Dashboard and EntryCardRedesigned to fetch and display real statistics instead of synthetic data.

### Changes Required

#### 1. Add TypeScript Wrapper (supabase-optimizations.ts)

**File**: `src/lib/supabase-optimizations.ts`
**Location**: Add after existing functions (around line 200)

```typescript
// Real Activity Statistics (Audit-Based)

interface DocumentActivity {
  week_start: string;
  edit_count: number;
  blocks_added: number;
  blocks_modified: number;
  blocks_deleted: number;
  total_changes: number;
}

interface UserActivityStats {
  total_edits: number;
  documents_modified: number;
  blocks_created: number;
  blocks_modified: number;
  most_active_day: string;
  avg_daily_edits: number;
}

interface DocumentWithRealActivity {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  position: number;
  metadata: Record<string, any>;
  tags: string[];
  block_count: number;
  last_edited: string | null;
  edit_count_7d: number;
  edit_count_30d: number;
  recent_activity: any[] | null;
}

export async function getDocumentActivity(
  documentId: string,
  weeks: number = 20
): Promise<DocumentActivity[]> {
  const { data, error } = await supabase.rpc('get_document_activity', {
    p_document_id: documentId,
    p_weeks: weeks
  });

  if (error) throw error;
  return data || [];
}

export async function getUserActivityStats(
  userId: string
): Promise<UserActivityStats> {
  const { data, error } = await supabase.rpc('get_user_activity_stats', {
    p_user_id: userId
  });

  if (error) throw error;
  return data;
}

export async function getDocumentsWithRealActivity(options: {
  userId: string;
  limit?: number;
  offset?: number;
} = { userId: '', limit: 50, offset: 0 }): Promise<DocumentWithRealActivity[]> {
  const { data, error } = await supabase.rpc('get_documents_with_real_activity', {
    p_user_id: options.userId,
    p_limit: options.limit || 50,
    p_offset: options.offset || 0
  });

  if (error) throw error;
  return data || [];
}
```

#### 2. Update usePaginatedDashboard Hook

**File**: `src/hooks/usePaginatedDashboard.js`
**Changes**: Replace document loading to include real activity data

**Line ~50-55** - Import the new function:
```javascript
import { getDocumentsWithRealActivity } from '../lib/supabase-optimizations';
```

**Line ~70-100** - Update `loadDocumentsPaginated` function:
```javascript
const loadDocumentsPaginated = async ({ page, limit, orderBy = 'updated_at', ascending = false }) => {
  try {
    // Use the new audit-based function
    const documents = await getDocumentsWithRealActivity({
      userId: user.id,
      limit: limit,
      offset: page * limit
    });

    // Transform to match existing interface
    const transformed = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      folder_id: doc.folder_id,
      position: doc.position,
      metadata: doc.metadata,
      tags: doc.tags,
      blockCount: doc.block_count,

      // NEW: Real activity data from audit logs
      lastEdited: doc.last_edited,
      editCount7d: doc.edit_count_7d,
      editCount30d: doc.edit_count_30d,
      recentActivity: doc.recent_activity || []
    }));

    // Get total count (separate query for now)
    const { count } = await storageWrapper.supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null);

    return {
      documents: transformed,
      totalCount: count || 0,
      hasMore: (page + 1) * limit < count
    };
  } catch (error) {
    console.error('Error loading documents with real activity:', error);
    throw error;
  }
};
```

#### 3. Update EntryCardRedesigned Component

**File**: `src/components/EntryCardRedesigned.jsx`
**Changes**: Display real activity bars instead of synthetic data

**Line ~72-83** - Replace synthetic activity generation:

**BEFORE**:
```javascript
const activityData = useMemo(() => {
  const fullData = generateActivityData(entry);  // SYNTHETIC
  return fullData.slice(-20);
}, [entry.id, entry.updatedAt, entry.createdAt]);
```

**AFTER**:
```javascript
const activityData = useMemo(() => {
  if (!entry.recentActivity || entry.recentActivity.length === 0) {
    // No activity data yet (new document or audit just started)
    return Array(20).fill(0);
  }

  // Group recent activity by week
  const weeks = 20;
  const weekCounts = new Array(weeks).fill(0);
  const now = new Date();

  entry.recentActivity.forEach(activity => {
    const activityDate = new Date(activity.ts);
    const weeksSince = Math.floor((now - activityDate) / (1000 * 60 * 60 * 24 * 7));

    if (weeksSince >= 0 && weeksSince < weeks) {
      // Increment count for this week (most recent = index 19)
      weekCounts[weeks - 1 - weeksSince]++;
    }
  });

  // Normalize to 0-100 scale for bar height
  const maxCount = Math.max(...weekCounts, 1);
  return weekCounts.map(count => {
    const percentage = (count / maxCount) * 100;
    return Math.max(5, Math.min(95, percentage)); // 5-95% range
  });
}, [entry.recentActivity]);
```

**Line ~156-171** - Activity chart rendering (NO CHANGES NEEDED - already renders bars):
```javascript
{hasChart && (
  <div className="mt-auto h-16 flex items-end gap-1 px-1 pb-1">
    {activityData.map((value, i) => (
      <div
        key={i}
        className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-400/30 rounded-t
                   group-hover:from-emerald-500/60 group-hover:to-emerald-400/50
                   transition-all duration-300 shadow-sm shadow-emerald-500/20"
        style={{
          height: `${value}%`,
          transitionDelay: `${i * 20}ms`
        }}
        title={`Week ${i + 1}`}  // Add tooltip showing week number
      />
    ))}
  </div>
)}
```

#### 4. Remove Legacy Synthetic Data Code (MANDATORY)

**Principle**: Clean files only - NO legacy code survives.

##### Step 4.1: Delete Synthetic Activity Generator

**File**: `src/utils/activityData.js`
**Action**: **DELETE PERMANENTLY** (no archiving, no backup)

```bash
# Delete the entire file
rm src/utils/activityData.js

# Verify deletion
test ! -f src/utils/activityData.js && echo "✓ Legacy file removed"
```

##### Step 4.2: Remove Import from EntryCardRedesigned

**File**: `src/components/EntryCardRedesigned.jsx`
**Line**: ~7

**DELETE THIS LINE**:
```javascript
import { generateActivityData } from '../utils/activityData';
```

**Verification**:
```bash
# Ensure no references remain
grep -r "generateActivityData" src/ && echo "ERROR: References still exist" || echo "✓ Clean"
grep -r "activityData.js" src/ && echo "ERROR: Import still exists" || echo "✓ Clean"
```

##### Step 4.3: Remove Unused Document Statistics Infrastructure (If Any)

**Check and remove if present**:
```bash
# Check for unused statistics utilities
ls src/utils/documentStats.js 2>/dev/null && rm src/utils/documentStats.js
ls src/utils/syntheticStats.js 2>/dev/null && rm src/utils/syntheticStats.js

# Check for backup files
find src/ -name "*.backup" -delete
find src/ -name "*.old" -delete
find src/ -name "*~" -delete
```

##### Step 4.4: Clean Up Documentation References

**Files to update**:
- Remove any references to synthetic data from `DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md`
- Update `README.md` if it mentions fake statistics

```bash
# After implementation, update analysis doc
echo "## DEPRECATED - Replaced by Real Audit System

This analysis documented the OLD synthetic statistics system.
Replaced by real audit tracking on 2025-11-02.

See: thoughts/shared/plans/real-statistics-audit-system-implementation.md
" > DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md.deprecated

rm DASHBOARD_STATISTICS_SOURCE_ANALYSIS.md
```

### Success Criteria

#### Automated Verification:
```bash
# TypeScript compiles without errors
npm run typecheck

# No linting errors
npm run lint

# Build succeeds
npm run build

# CRITICAL: Verify legacy code is completely removed
! test -f src/utils/activityData.js || echo "ERROR: Legacy file still exists"
! grep -r "generateActivityData" src/ || echo "ERROR: Legacy function still referenced"
! grep -r "activityData.js" src/ || echo "ERROR: Legacy import still exists"
! find src/ -name "*.backup" | grep . || echo "ERROR: Backup files found"
! find src/ -name "*.old" | grep . || echo "ERROR: Old files found"

# Verify only clean code remains
echo "✓ All legacy code removed - clean files only"
```

#### Manual Verification:
- [ ] Dashboard loads without errors
- [ ] Document cards display activity bars
- [ ] Activity bar heights correspond to actual edits (not random patterns)
- [ ] Edit a document → activity bar updates on next dashboard load
- [ ] New documents show empty/minimal activity (not fake data)
- [ ] Performance is acceptable (<3 seconds for dashboard load)
- [ ] No console errors in browser
- [ ] Hover tooltips show week numbers
- [ ] **CRITICAL**: `src/utils/activityData.js` does NOT exist
- [ ] **CRITICAL**: No references to `generateActivityData` anywhere
- [ ] **CRITICAL**: No `.backup`, `.old`, or `~` files in codebase

---

## Phase 4: Performance & Optimization

**Time Estimate**: 1-2 hours

### Overview
Optimize query performance, add caching, and monitor system health.

### ⚠️ Implementation Method

**CRITICAL**: Use Supabase MCP tools for optimization deployment:
- `mcp__supabase__apply_migration` for creating materialized views and optimization functions
- `mcp__supabase__execute_sql` for testing and monitoring
- These optimizations are ADDITIVE (no modifications to existing schema)

### Changes Required

#### 1. Add Materialized View for Dashboard Stats

```sql
-- Materialized view for frequently accessed dashboard statistics
CREATE MATERIALIZED VIEW audit.document_activity_summary AS
SELECT
  d.id AS document_id,
  d.user_id,
  COUNT(DISTINCT DATE_TRUNC('week', arv.ts)) AS weeks_with_activity,
  COUNT(*) FILTER (WHERE arv.op = 'INSERT') AS total_blocks_added,
  COUNT(*) FILTER (WHERE arv.op = 'UPDATE') AS total_blocks_modified,
  COUNT(*) FILTER (WHERE arv.op = 'DELETE') AS total_blocks_deleted,
  MAX(arv.ts) AS last_activity,
  COUNT(*) AS total_changes
FROM documents d
LEFT JOIN audit.record_version arv ON
  arv.table_name = 'blocks' AND
  (arv.record->>'document_id')::uuid = d.id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.user_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_doc_activity_summary_doc_id ON audit.document_activity_summary (document_id);
CREATE INDEX idx_doc_activity_summary_user_id ON audit.document_activity_summary (user_id);

-- Refresh function (call periodically)
CREATE OR REPLACE FUNCTION audit.refresh_activity_summary()
RETURNS void
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY audit.document_activity_summary;
  RAISE NOTICE 'Activity summary refreshed at %', NOW();
END;
$$;

COMMENT ON FUNCTION audit.refresh_activity_summary()
IS 'Refresh the materialized view of document activity statistics';
```

#### 2. Update document_cache with Audit Statistics

```sql
-- Function to update document_cache from audit logs
CREATE OR REPLACE FUNCTION audit.update_cache_from_audit()
RETURNS void
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update document_cache with audit-derived statistics
  UPDATE document_cache dc
  SET
    last_block_update = COALESCE(
      (SELECT MAX(ts)
       FROM audit.record_version
       WHERE table_name = 'blocks'
         AND (record->>'document_id')::uuid = dc.document_id),
      dc.last_block_update
    ),
    cache_updated_at = NOW()
  WHERE EXISTS (
    SELECT 1
    FROM audit.record_version
    WHERE table_name = 'blocks'
      AND (record->>'document_id')::uuid = dc.document_id
      AND ts > dc.cache_updated_at
  );

  RAISE NOTICE 'Updated % document_cache entries from audit logs', FOUND;
END;
$$;

COMMENT ON FUNCTION audit.update_cache_from_audit()
IS 'Update document_cache table with latest activity timestamps from audit logs';
```

#### 3. Add Performance Monitoring Query

```sql
-- Function to analyze audit table performance
CREATE OR REPLACE FUNCTION audit.get_performance_stats()
RETURNS TABLE (
  total_records BIGINT,
  table_size_mb NUMERIC,
  index_size_mb NUMERIC,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ,
  avg_records_per_day NUMERIC
)
SECURITY DEFINER
SET search_path = public, audit
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_records,
    ROUND(pg_total_relation_size('audit.record_version')::numeric / 1024 / 1024, 2) AS table_size_mb,
    ROUND(pg_indexes_size('audit.record_version')::numeric / 1024 / 1024, 2) AS index_size_mb,
    MIN(ts) AS oldest_record,
    MAX(ts) AS newest_record,
    ROUND(
      COUNT(*)::numeric / NULLIF(EXTRACT(EPOCH FROM (MAX(ts) - MIN(ts))) / 86400, 0),
      2
    ) AS avg_records_per_day
  FROM audit.record_version;
END;
$$;

COMMENT ON FUNCTION audit.get_performance_stats()
IS 'Returns performance statistics for the audit system';
```

### Migration Execution Steps

**Step 1: Apply performance optimization migration**

```javascript
// Apply the performance optimization migration
const perfResult = await mcp__supabase__apply_migration({
  project_id: PROJECT_ID,
  name: 'audit_performance_optimization',
  query: `
    -- [PASTE ALL SQL FROM STEPS 1-3 HERE AS SINGLE STRING]
    -- This includes:
    -- 1. Materialized view document_activity_summary
    -- 2. Indexes on materialized view
    -- 3. refresh_activity_summary function
    -- 4. update_cache_from_audit function
    -- 5. get_performance_stats function
  `
});

console.log('Performance optimization migration applied:', perfResult);
```

**Step 2: Verify materialized view and functions**

```javascript
// Verify materialized view exists
const matViewCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT schemaname, matviewname
    FROM pg_matviews
    WHERE schemaname = 'audit' AND matviewname = 'document_activity_summary';
  `
});
console.assert(matViewCheck.length === 1, 'Materialized view must exist');

// Verify optimization functions exist
const optFunctionsCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT proname
    FROM pg_proc
    WHERE proname IN (
      'refresh_activity_summary',
      'update_cache_from_audit',
      'get_performance_stats'
    )
    AND pronamespace = 'audit'::regnamespace
    ORDER BY proname;
  `
});
console.assert(optFunctionsCheck.length === 3, 'All optimization functions must exist');
```

**Step 3: Test refresh and monitoring**

```javascript
// Test materialized view refresh
const refreshTest = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: 'SELECT audit.refresh_activity_summary();'
});
console.log('Materialized view refreshed:', refreshTest);

// Test performance monitoring
const perfStats = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: 'SELECT * FROM audit.get_performance_stats();'
});
console.log('Performance stats:', perfStats);
```

**Step 4: CRITICAL - Verify no schema changes to core tables**

```javascript
// Verify documents/blocks tables unchanged
const coreTablesCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('documents', 'blocks', 'document_cache');
  `
});
console.log('Core tables column count:', coreTablesCheck[0].count);
// This should match the original count before any migrations

// Verify all original triggers still exist
const triggersIntact = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks')
    ORDER BY trigger_name;
  `
});
console.assert(triggersIntact.length >= 11, 'All triggers must remain intact');
```

### Success Criteria

#### Automated Verification (using MCP tools):

```javascript
// 1. Verify materialized view exists and has data
const matViewData = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: 'SELECT COUNT(*) as count FROM audit.document_activity_summary;'
});
console.log('Materialized view row count:', matViewData[0].count);

// 2. Verify refresh function is callable
const canRefresh = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT proname, prosecdef
    FROM pg_proc
    WHERE proname = 'refresh_activity_summary'
      AND pronamespace = 'audit'::regnamespace;
  `
});
console.assert(canRefresh.length === 1 && canRefresh[0].prosecdef === true, 'Refresh function must be SECURITY DEFINER');

// 3. Verify performance stats function works
const perfCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: 'SELECT * FROM audit.get_performance_stats();'
});
console.assert(perfCheck.length === 1, 'Performance stats must return data');
console.log('Audit system size (MB):', perfCheck[0].table_size_mb);

// 4. Verify indexes on materialized view
const matViewIndexes = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'audit'
      AND tablename = 'document_activity_summary';
  `
});
console.assert(matViewIndexes.length >= 2, 'Materialized view must have indexes');

console.log('✅ Phase 4 automated verification complete');
```

#### Manual Verification:
- [ ] Dashboard loads in <3 seconds with 250+ documents
- [ ] Audit table size is reasonable (<100MB for moderate usage)
- [ ] Query performance monitored and acceptable
- [ ] Materialized view refresh completes in <10 seconds
- [ ] No performance degradation compared to before audit system

---

## Phase 5: Migration Strategy & Rollback

**Time Estimate**: 30 minutes

### Overview
Plan for gradual rollout and provide rollback strategy if issues arise.

### Migration Strategy

#### Option A: Start Fresh (Recommended)

**Approach**: Enable audit tracking now, let statistics build over time.

**Timeline**:
- Week 1: Only current week activity shown
- Week 2: 2 weeks of real data
- Week 20: Full 20-week real activity charts

**Pros**:
- ✅ All data is 100% real
- ✅ No risk of backfill errors
- ✅ Simpler implementation

**Cons**:
- ❌ Empty charts initially (gradual build)

**Implementation**: Just deploy Phases 1-4, no backfill needed.

#### Option B: Backfill Historical Data (Advanced)

**Approach**: Generate synthetic audit records from existing `updated_at` timestamps.

**SQL Script** (run once after Phase 1):
```sql
-- WARNING: This creates synthetic audit data based on timestamps
-- Only use if you want immediate visual feedback

INSERT INTO audit.record_version (
  record_id,
  op,
  ts,
  table_oid,
  table_schema,
  table_name,
  record,
  user_id,
  metadata
)
SELECT
  uuid_generate_v5(uuid_ns_oid(), 'public.blocks.' || id::text),
  'UPDATE',
  updated_at,
  'public.blocks'::regclass::oid,
  'public',
  'blocks',
  to_jsonb(blocks.*),
  user_id,
  jsonb_build_object('backfilled', true, 'source', 'updated_at_timestamp')
FROM blocks
WHERE updated_at > created_at  -- Only edits, not creates
  AND updated_at > NOW() - INTERVAL '20 weeks'  -- Last 20 weeks only
  AND deleted_at IS NULL;

-- Log backfill
INSERT INTO audit.record_version (
  record_id,
  op,
  ts,
  table_oid,
  table_schema,
  table_name,
  metadata
) VALUES (
  uuid_generate_v4(),
  'TRUNCATE',
  NOW(),
  'public.blocks'::regclass::oid,
  'public',
  'blocks',
  jsonb_build_object(
    'backfilled', true,
    'backfill_date', NOW(),
    'note', 'Historical data backfilled from updated_at timestamps'
  )
);
```

**Pros**:
- ✅ Immediate visual feedback
- ✅ Charts populated on day 1

**Cons**:
- ❌ Backfilled data is still synthetic (based on timestamps)
- ❌ Risk of errors during backfill
- ❌ Misleading accuracy (looks real but isn't)

**Recommendation**: Only use if user explicitly wants immediate charts.

### Rollback Strategy

If audit system causes issues, follow these steps using MCP tools:

#### 1. Disable Audit Tracking (Immediate)

```javascript
// Stop recording new audit logs without dropping anything
const disableResult = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT audit.disable_tracking('public.documents'::regclass);
    SELECT audit.disable_tracking('public.blocks'::regclass);
  `
});
console.log('Audit tracking disabled:', disableResult);

// Verify triggers were removed
const triggersCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE trigger_name LIKE 'audit_%';
  `
});
console.assert(triggersCheck.length === 0, 'All audit triggers must be removed');
```

#### 2. Revert Frontend Changes (Next Deploy)

```bash
# Revert EntryCardRedesigned to use synthetic data
git revert <commit-hash-of-phase-3>

# Redeploy
npm run build
# Deploy to production
```

#### 3. Drop Audit Infrastructure (If Needed)

**WARNING**: This permanently deletes all audit history.

```javascript
// Drop entire audit schema (cascades to all objects)
const dropResult = await mcp__supabase__apply_migration({
  project_id: PROJECT_ID,
  name: 'emergency_drop_audit_system',
  query: `
    -- WARNING: This deletes all audit history
    DROP SCHEMA IF EXISTS audit CASCADE;

    -- Confirm no audit schema remains
    SELECT 'Audit system completely removed' AS status;
  `
});
console.log('Audit system dropped:', dropResult);
```

#### 4. Full Rollback Migration (Graceful Approach)

Use this if you want to cleanly remove audit system piece by piece:

```javascript
// Full rollback migration that cleanly removes everything
const fullRollback = await mcp__supabase__apply_migration({
  project_id: PROJECT_ID,
  name: 'rollback_audit_system',
  query: `
    -- Step 1: Disable tracking
    SELECT audit.disable_tracking('public.documents'::regclass);
    SELECT audit.disable_tracking('public.blocks'::regclass);

    -- Step 2: Drop functions (in dependency order)
    DROP FUNCTION IF EXISTS get_documents_with_real_activity(uuid, integer, integer);
    DROP FUNCTION IF EXISTS get_user_activity_stats(uuid);
    DROP FUNCTION IF EXISTS get_document_activity(uuid, integer);
    DROP FUNCTION IF EXISTS audit.refresh_activity_summary();
    DROP FUNCTION IF EXISTS audit.update_cache_from_audit();
    DROP FUNCTION IF EXISTS audit.get_performance_stats();
    DROP FUNCTION IF EXISTS audit.enable_tracking(regclass);
    DROP FUNCTION IF EXISTS audit.disable_tracking(regclass);
    DROP FUNCTION IF EXISTS audit.insert_update_delete_trigger();

    -- Step 3: Drop materialized view
    DROP MATERIALIZED VIEW IF EXISTS audit.document_activity_summary;

    -- Step 4: Drop table
    DROP TABLE IF EXISTS audit.record_version CASCADE;

    -- Step 5: Drop schema
    DROP SCHEMA IF EXISTS audit CASCADE;

    -- Confirm rollback
    SELECT 'Audit system rolled back successfully' AS status;
  `
});
console.log('Full rollback complete:', fullRollback);
```

#### 5. Verify Complete Rollback

```javascript
// Verify audit schema no longer exists
const schemaGone = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'audit';"
});
console.assert(schemaGone.length === 0, 'Audit schema must not exist');

// Verify no audit triggers remain
const noAuditTriggers = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT trigger_name FROM information_schema.triggers WHERE trigger_name LIKE 'audit_%';"
});
console.assert(noAuditTriggers.length === 0, 'No audit triggers should remain');

// CRITICAL: Verify all original triggers are still intact
const originalTriggersCheck = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE event_object_table IN ('documents', 'blocks')
    ORDER BY trigger_name;
  `
});
console.assert(originalTriggersCheck.length === 9, 'All 9 original triggers must remain');
console.log('✅ Rollback complete - original system intact');
```

### Success Criteria

#### Automated Verification (using MCP tools):

```javascript
// 1. Verify audit schema is gone
const noAuditSchema = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: "SELECT COUNT(*) as count FROM information_schema.schemata WHERE schema_name = 'audit';"
});
console.assert(noAuditSchema[0].count === 0, 'Audit schema must be removed');

// 2. Verify all audit functions are gone
const noAuditFunctions = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT COUNT(*) as count
    FROM pg_proc
    WHERE proname LIKE '%activity%' OR pronamespace = 'audit'::regnamespace;
  `
});
console.log('Audit functions remaining:', noAuditFunctions[0].count);

// 3. CRITICAL: Verify core system is untouched
const coreIntact = await mcp__supabase__execute_sql({
  project_id: PROJECT_ID,
  query: `
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('documents', 'blocks', 'document_cache')) as tables_count,
      (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table IN ('documents', 'blocks')) as triggers_count;
  `
});
console.assert(coreIntact[0].tables_count === 3, 'Core tables must exist');
console.assert(coreIntact[0].triggers_count === 9, 'Original triggers must remain');

console.log('✅ Rollback verification complete - system restored to original state');
```

#### Manual Verification:
- [ ] Rollback plan documented and tested
- [ ] Stakeholders informed of gradual statistics build (if Option A)
- [ ] Monitoring in place to detect issues early
- [ ] Backup of current state before deploying

---

## Performance Considerations

### Write Performance Impact

**Expected Overhead**:
- ~0.5-2ms per INSERT/UPDATE/DELETE
- Acceptable for <3,000 ops/second (Supabase recommendation)
- Devlog is well under this threshold

**Monitoring**:
```sql
-- Check write performance
SELECT
  table_name,
  COUNT(*),
  ROUND(AVG(EXTRACT(EPOCH FROM (ts - LAG(ts) OVER (ORDER BY ts)))), 3) AS avg_interval_sec
FROM audit.record_version
WHERE ts > NOW() - INTERVAL '1 hour'
GROUP BY table_name;
```

### Read Performance

**Dashboard Query** (`get_documents_with_real_activity`):
- Aggregates 20 weeks × 250 documents = 5,000 data points
- With indexes: ~50-100ms typical
- Can cache results in `document_cache` for instant loads

**Activity Timeline Query** (`get_document_activity`):
- Single document, 20 weeks
- With indexes: ~5-10ms typical
- Called only when opening document detail

**Optimization Strategies**:
1. **BRIN index on ts**: 100x smaller than BTREE for time-range queries
2. **Materialized view**: Pre-aggregated statistics refreshed periodically
3. **document_cache**: Store frequently accessed statistics
4. **Query result caching**: Frontend caches for 5 minutes

---

## Testing Strategy

### Unit Tests

**Test File**: `src/utils/__tests__/realActivityUtils.test.js`

```javascript
import { getDocumentActivity, getUserActivityStats, getDocumentsWithRealActivity } from '../lib/supabase-optimizations';

describe('Real Activity Statistics', () => {
  it('should fetch document activity timeline', async () => {
    const activity = await getDocumentActivity('test-doc-id', 4);
    expect(activity).toHaveLength(4);
    expect(activity[0]).toHaveProperty('week_start');
    expect(activity[0]).toHaveProperty('edit_count');
  });

  it('should fetch user activity stats', async () => {
    const stats = await getUserActivityStats('test-user-id');
    expect(stats).toHaveProperty('total_edits');
    expect(stats).toHaveProperty('blocks_created');
  });

  it('should fetch documents with real activity', async () => {
    const docs = await getDocumentsWithRealActivity({
      userId: 'test-user-id',
      limit: 10
    });
    expect(docs).toBeInstanceOf(Array);
    expect(docs[0]).toHaveProperty('recentActivity');
  });
});
```

### Integration Tests

**Manual Test Scenarios**:

1. **Create New Document**:
   - Create document → audit.record_version has INSERT for document
   - Add block → audit.record_version has INSERT for block
   - Verify `user_id` is populated correctly

2. **Edit Existing Document**:
   - Edit block content → audit.record_version has UPDATE
   - Delete block → audit.record_version has DELETE
   - Verify old_record contains previous state

3. **Dashboard Display**:
   - Load dashboard → documents have `recentActivity` array
   - Verify activity bars appear (not all zero)
   - Edit document → refresh dashboard → activity updated

4. **Performance Test**:
   - Load dashboard with 250+ documents
   - Measure time to first paint (<3 seconds)
   - Check database query time (<100ms)

---

## Monitoring & Health Checks

### Database Monitoring

```sql
-- Daily health check
SELECT
  'Audit Health' AS metric,
  (SELECT COUNT(*) FROM audit.record_version) AS total_records,
  (SELECT COUNT(DISTINCT user_id) FROM audit.record_version) AS active_users,
  (SELECT COUNT(*) FROM audit.record_version WHERE ts > NOW() - INTERVAL '24 hours') AS records_last_24h,
  (SELECT ROUND(pg_total_relation_size('audit.record_version')::numeric / 1024 / 1024, 2)) AS table_size_mb;
```

### Application Monitoring

**Frontend Metrics** (via console logs):
- Dashboard load time
- Number of documents with activity data
- Activity chart render time

**Backend Metrics**:
- Audit record creation rate
- Query performance (p50, p95, p99)
- Database table size growth

---

## References

- Original proposal: `/mnt/c/Users/pc/Desktop/my/devlog-/REAL_STATISTICS_SOLUTION.md`
- Database schema verification: Supabase MCP queries (2025-11-02)
- Migration pattern: `supabase/migrations/YYYYMMDD_description.sql`
- Similar implementation: Supabase `supa_audit` extension (https://github.com/supabase/supa_audit)

---

## Timeline Summary

| Phase | Time | Deliverable |
|-------|------|-------------|
| Phase 1: Database Infrastructure | 1-2 hours | Audit schema, triggers, RLS policies |
| Phase 2: Statistics Functions | 2-3 hours | Query functions for activity data |
| Phase 3: Frontend Integration | 3-4 hours | Dashboard displays real statistics + **CLEAN legacy code** |
| Phase 4: Performance Optimization | 1-2 hours | Materialized views, caching |
| Phase 5: Rollback Planning | 30 mins | Documented rollback strategy |
| **Total** | **7-11 hours** | **Production-ready audit system with ZERO legacy code** |

---

## Success Metrics

After full implementation:

1. **Accuracy**: 100% of dashboard statistics based on real audit data (not synthetic)
2. **Performance**: Dashboard loads in <3 seconds with 250+ documents
3. **Reliability**: Audit triggers fire on 100% of document/block changes
4. **Transparency**: Users can trust that activity charts reflect actual work
5. **Maintainability**: Audit system operates automatically with no manual intervention

---

## Next Steps

1. Review this plan with stakeholders
2. Decide on migration strategy (fresh start vs. backfill)
3. Execute Phase 1 (database infrastructure)
4. Test thoroughly in development
5. Deploy to production
6. Monitor performance and iterate
