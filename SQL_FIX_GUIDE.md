# SQL Migration Fix Guide

## The Problem
The error occurred because `position` is a reserved keyword in PostgreSQL. When using reserved keywords as column names in function return types, they must be quoted.

## The Fix
I've created a fixed version: `20250129_003_create_batch_operations_fixed.sql`

### Key Changes:
1. **Quoted "position" in RETURNS TABLE**:
   ```sql
   RETURNS TABLE (
     id UUID,
     "position" INTEGER,  -- Added quotes
     success BOOLEAN,
     error TEXT
   )
   ```

2. **Quoted "position" everywhere it's used as a column**:
   ```sql
   "position" = COALESCE((update_record->>'position')::INTEGER, "position")
   ```

3. **Fixed function parameters** to match what the app expects:
   - `save_document_blocks_v2` now uses `p_document_id` and `p_blocks`
   - Returns JSONB instead of VOID

4. **Added user_id field** to INSERT statements where needed

## How to Apply

### Option 1: Skip the problematic files
Since migrations 001 and 002 likely already worked, you can:
1. Skip `20250129_003_create_batch_operations.sql` 
2. Use `20250129_003_create_batch_operations_fixed.sql` instead
3. Continue with migrations 004-007

### Option 2: Run only what's needed
Check what's already created:
```sql
-- Check if soft delete columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name = 'deleted_at';

-- Check if functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('batch_insert_blocks', 'save_document_blocks_v2');
```

Then only run the migrations that haven't been applied yet.

## Fixed Files

### 1. **20250129_003_create_batch_operations_fixed.sql**
- Fixed: `position` is a reserved keyword - must be quoted
- Fixed: Function parameters to match app expectations
- Fixed: Added missing user_id fields

### 2. **20250129_005_optimize_rls_policies_fixed.sql**
- Fixed: Can't create RLS policies on views (PostgreSQL limitation)
- Views inherit RLS from their base tables automatically
- Removed the invalid policy creation on the view

## Quick Apply Commands

Run these in order in your Supabase SQL Editor:

```sql
-- 1. If soft delete columns don't exist, run:
-- (Copy from 20250129_001_add_soft_delete_columns.sql)

-- 2. If performance indexes don't exist, run:
-- (Copy from 20250129_002_create_performance_indexes.sql)

-- 3. For batch operations (use the FIXED version):
-- (Copy from 20250129_003_create_batch_operations_fixed.sql)

-- 4. Continue with the rest:
-- (Copy from 20250129_004_create_document_versions.sql)

-- 5. For RLS optimization (use the FIXED version):
-- (Copy from 20250129_005_optimize_rls_policies_fixed.sql)

-- 6. Continue with:
-- (Copy from 20250129_006_create_performance_cache.sql)
-- (Copy from 20250129_007_fix_performance_issues.sql)
```

## Verify Success
After running, verify the functions were created:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%batch%' OR routine_name LIKE '%save_document%';
```

You should see:
- batch_insert_blocks
- batch_update_blocks
- save_document_blocks_v2
- batch_delete_blocks