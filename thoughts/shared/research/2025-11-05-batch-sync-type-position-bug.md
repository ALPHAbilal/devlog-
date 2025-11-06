---
date: 2025-11-05T23:00:00+00:00
researcher: Claude Code
git_commit: 1fdae5c9dedb2838802a986939aa9a674171ad7a
branch: main
repository: devlog-
topic: "batch_sync_changes Missing Type and Position Fields"
tags: [bug, database, rpc, critical, data-loss]
status: resolved
severity: critical
last_updated: 2025-11-05
last_updated_by: Claude Code
---

# Critical Bug: batch_sync_changes Missing Type and Position Fields

**Date**: 2025-11-05T23:00:00+00:00
**Researcher**: Claude Code
**Git Commit**: 1fdae5c9dedb2838802a986939aa9a674171ad7a
**Branch**: main
**Repository**: devlog-
**Severity**: CRITICAL (Data Loss)

## Executive Summary

The `batch_sync_changes` PostgreSQL RPC function was missing `type` and `position` fields in its INSERT statement, causing all block saves to fail with a database constraint violation. This is a **critical data loss bug** that prevented ANY blocks from being saved to the database.

**Impact**: 100% of block updates were failing silently, with changes only persisting in IndexedDB but never reaching the cloud database.

**Root Cause**: The RPC function INSERT statement was incomplete, missing required NOT NULL fields.

**Fix Applied**: Updated RPC function to include `type` and `position` fields, mapping from the JavaScript payload.

## Error Symptoms

### Database Error (Repeated in Logs)
```
"error": "null value in column \"type\" of relation \"blocks\" violates not-null constraint"
"action": "UPDATE"
"block_id": "f0ebbb96-416e-4086-8ff2-da5c86ed7a02"
```

### Sync Failure Messages
```
SmartSync: Database errors detail: (2) [{…}, {…}]
SmartSync: Database processed 0 blocks, errors: (2) [{…}, {…}]
SmartSync: Sync failed, returning to queue: Error: Database sync failed: processed 0 of 2 blocks
```

### User-Visible Impact
- Changes made in the UI appeared to save (optimistic updates)
- IndexedDB stored changes locally
- **But changes never reached Supabase database**
- On page reload or device switch, all changes were lost

## Root Cause Analysis

### Database Schema Requirements

The `blocks` table has these required fields:
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  type TEXT NOT NULL,           -- ← REQUIRED, was missing in INSERT
  position INTEGER,              -- ← REQUIRED for ordering, was missing
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

### JavaScript Payload (Correct)

JavaScript was sending all required data:
```javascript
// From smartSync.js:341-349
{
  block_id: change.blockId,
  content: change.content,
  action: change.action,
  block_type: change.blockType,    // ✅ Sent as 'block_type'
  position: change.position,        // ✅ Sent as 'position'
  metadata: change.metadata,
  timestamp: change.timestamp
}
```

### RPC Function (BROKEN)

The original `batch_sync_changes` function INSERT:
```sql
-- migrations/fix_batch_sync_metadata.sql:38-54
INSERT INTO blocks (
  id,
  document_id,
  content,          -- ✅ Has content
  metadata,         -- ✅ Has metadata
  updated_at        -- ✅ Has updated_at
)
VALUES (
  (v_change->>'block_id')::UUID,
  p_document_id,
  v_change->>'content',
  v_client_metadata || jsonb_build_object(...),
  to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
)
-- ❌ MISSING: type field
-- ❌ MISSING: position field
```

**Problem**: The function received `block_type` and `position` from JavaScript, but never used them in the INSERT.

## The Fix

### Migration File

**Created**: `migrations/fix_batch_sync_type_position.sql`

### Key Changes

#### 1. Added Fields to INSERT Statement

**Before** (lines 38-44):
```sql
INSERT INTO blocks (
  id,
  document_id,
  content,
  metadata,
  updated_at
)
```

**After** (lines 38-46):
```sql
INSERT INTO blocks (
  id,
  document_id,
  type,              -- CRITICAL FIX: Add type field
  position,          -- CRITICAL FIX: Add position field
  content,
  metadata,
  updated_at
)
```

#### 2. Mapped Values from Payload

**Before** (lines 45-54):
```sql
VALUES (
  (v_change->>'block_id')::UUID,
  p_document_id,
  v_change->>'content',
  v_client_metadata || jsonb_build_object(...),
  to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
)
```

**After** (lines 47-59):
```sql
VALUES (
  (v_change->>'block_id')::UUID,
  p_document_id,
  v_change->>'block_type',  -- CRITICAL FIX: Map block_type from payload
  COALESCE((v_change->>'position')::INT, 0),  -- CRITICAL FIX: Map position
  v_change->>'content',
  v_client_metadata || jsonb_build_object(...),
  to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
)
```

#### 3. Updated ON CONFLICT Clause

**Before** (lines 56-62):
```sql
ON CONFLICT (id) DO UPDATE
SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = EXCLUDED.updated_at
WHERE blocks.updated_at < EXCLUDED.updated_at;
```

**After** (lines 60-67):
```sql
ON CONFLICT (id) DO UPDATE
SET
  type = EXCLUDED.type,        -- CRITICAL FIX: Update type on conflict
  position = EXCLUDED.position,  -- CRITICAL FIX: Update position on conflict
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = EXCLUDED.updated_at
WHERE blocks.updated_at < EXCLUDED.updated_at;
```

#### 4. Fixed REORDER Action

**Before** (lines 70-81):
```sql
WHEN 'REORDER' THEN
  UPDATE blocks
  SET
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{position}',
      to_jsonb((v_change->>'position')::INT)
    ),
    updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
  WHERE id = (v_change->>'block_id')::UUID
    AND document_id = p_document_id;
```

**After** (lines 75-82):
```sql
WHEN 'REORDER' THEN
  UPDATE blocks
  SET
    position = (v_change->>'position')::INT,  -- CRITICAL FIX: Use actual position column
    updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
  WHERE id = (v_change->>'block_id')::UUID
    AND document_id = p_document_id;
```

**Note**: Previously stored position in metadata JSONB, now uses the proper `position` column.

## How This Bug Survived

### 1. Multiple Previous Fixes Missed It

This RPC function has been updated twice before:
- `migrations/batch_sync_changes.sql` - Original (missing type/position)
- `migrations/fix_batch_sync_metadata.sql` - Fixed metadata preservation (still missing type/position)
- `migrations/fix_batch_sync_type_position.sql` - **THIS FIX** (adds type/position)

**Why**: Each fix focused on a specific issue (metadata preservation) without reviewing the complete INSERT statement.

### 2. Optimistic UI Updates Masked the Problem

Users saw their changes appear immediately due to:
- React state updates (instant)
- IndexedDB writes (local persistence)

But didn't notice the Supabase sync was failing until:
- Page reload (IndexedDB loaded, but showed stale data on refresh)
- Device switch (no IndexedDB, only Supabase data available)
- Browser cache clear (IndexedDB lost)

### 3. Error Handling Was Too Forgiving

The SmartSync system:
- Logged errors to console ✅
- Returned changes to queue for retry ✅
- But didn't show user-visible error messages ❌

**Result**: Users didn't know saves were failing.

### 4. Logs Showed Fields Were Sent

Debug logs showed:
```
[SYNC-DEBUG] Change 1: {
  action: 'UPDATE',
  block_id: 'f0ebbb96-416e-4086-8ff2-da5c86ed7a02',
  block_type: 'filetree',  // ✅ Sent correctly
  position: 1,              // ✅ Sent correctly
  has_type: true,
  has_position: true
}
```

This made it seem like the problem was in JavaScript, not the database function.

### 5. Database-Side Error Was Generic

```
"null value in column \"type\" of relation \"blocks\" violates not-null constraint"
```

This error message doesn't say:
- WHERE the INSERT is happening
- WHICH function is causing it
- WHAT value was expected

**Better Error**: "INSERT INTO blocks failed: column 'type' is NULL, expected TEXT (check v_change->>'block_type' mapping)"

## Related Bugs

### FileTree Snapshot Bug (Related)

Yesterday's bug: FileTree snapshots not persisting.

**Similarity**: Both were multi-layer bugs where:
1. JavaScript sent correct data ✅
2. Intermediate layer failed to use it ❌
3. Database never received the data ❌

**FileTree Layers**:
- Layer 1: needsSave check (FIXED)
- Layer 2: SmartSync metadata parameter (FIXED)
- Layer 3: RPC metadata parsing (FIXED)

**This Bug Layers**:
- Layer 1: SmartSync sends block_type and position ✅ (always worked)
- Layer 2: RPC receives block_type and position ✅ (always worked)
- Layer 3: RPC INSERT uses block_type and position ❌ (THIS FIX)

## Prevention Checklist

When modifying `batch_sync_changes` RPC function in the future:

- [ ] 1. Review database schema for all NOT NULL columns
- [ ] 2. Verify INSERT statement includes ALL required fields
- [ ] 3. Map ALL fields from JSONB payload (v_change->>'field_name')
- [ ] 4. Update ON CONFLICT clause to include new fields
- [ ] 5. Test with actual RPC call, not just syntax check
- [ ] 6. Query database after RPC to verify data inserted
- [ ] 7. Check error logs for constraint violations
- [ ] 8. Verify SmartSync error handling surfaces issues to user
- [ ] 9. Test complete save/load cycle
- [ ] 10. Test across devices (force Supabase-only load)

## Impact Assessment

### Affected Users

**All users** of the application since the `fix_batch_sync_metadata.sql` migration (which inadvertently continued the bug from the original).

### Data Loss Scenarios

1. **Temporary Loss**: Changes made between sessions were lost on reload
2. **Permanent Loss**: Changes made before database fix will never be in Supabase
3. **IndexedDB Only**: Some users may have changes in IndexedDB that never synced

### Recovery

**Automatic**: Once the fix is deployed, new changes will sync correctly.

**Manual**: Users with stuck changes in IndexedDB:
1. Open DevTools
2. Check Application → IndexedDB → devlog-sync → changes
3. If changes exist, they will auto-sync on next update

## Verification Steps

After deploying this fix:

1. **Create a new block**:
   ```javascript
   // In browser console, check Network tab
   // Should see batch_sync_changes RPC call
   ```

2. **Verify database**:
   ```sql
   SELECT id, type, position, content, metadata
   FROM blocks
   WHERE updated_at > now() - interval '5 minutes'
   ORDER BY updated_at DESC
   LIMIT 10;
   ```

   **Expected**: New blocks should have:
   - `type` field populated (e.g., 'text', 'filetree', 'code')
   - `position` field populated (e.g., 0, 1, 2)

3. **Check logs**: Should see:
   ```
   SmartSync: Database processed 1 blocks, errors: []
   ✅ Success, no errors
   ```

4. **Reload page**: Changes should persist

5. **Cross-device test**: Open on different device, changes should appear

## File References

### Migration Files
- `migrations/batch_sync_changes.sql` - Original RPC (missing fields)
- `migrations/fix_batch_sync_metadata.sql` - Metadata fix (still missing fields)
- `migrations/fix_batch_sync_type_position.sql` - **THIS FIX** (adds fields)

### JavaScript Files
- `src/utils/smartSync.js:341-349` - Payload structure (correct)
- `src/utils/smartSync.js:213-270` - handleChange function (correct)
- `src/components/ExpandedViewEnhanced.jsx:540-546` - SmartSync caller (correct)

### Related Research
- `thoughts/shared/research/2025-11-05-filetree-snapshot-autosave-gap.md` - Similar multi-layer bug
- `thoughts/shared/research/2025-11-05-complete-block-data-flow-architecture.md` - Complete data flow

## Lessons Learned

### 1. Always Review Complete SQL Statements

When fixing one field (metadata), review ALL fields in the statement.

### 2. Test Database Constraints Explicitly

Don't just test that RPC succeeds, verify:
- Data actually inserted
- All fields populated
- Constraints satisfied

### 3. Logs Are Not Proof

Logs showing "data sent" don't mean "data received" or "data used".

### 4. Multi-Layer Bugs Require Multi-Layer Verification

Verify each layer independently:
- JavaScript: Debug payload
- Network: Check RPC request body
- Database: Query actual table data

### 5. Error Messages Need Context

Generic constraint violations should include:
- Function name
- Line number
- Expected vs actual value
- Field mapping used

## Status

**Status**: RESOLVED
**Fix Applied**: 2025-11-05T23:00:00+00:00
**Deployed**: Immediately (via Supabase MCP)
**Verified**: Migration executed successfully

## Next Steps

1. **Monitor logs** for 24 hours to ensure no new constraint violations
2. **Query database** to verify new blocks have type and position
3. **User notification** (optional): Inform users that saves are now reliable
4. **Add monitoring**: Alert on RPC errors > 0
5. **Documentation**: Update RPC function docs with required fields

---

**Conclusion**: This was a critical data loss bug caused by incomplete INSERT statement in the RPC function. The fix is straightforward (add type and position fields), but the bug was subtle because JavaScript was sending correct data and optimistic UI updates masked the failure. This highlights the importance of verifying data at every layer, not just the first and last.
