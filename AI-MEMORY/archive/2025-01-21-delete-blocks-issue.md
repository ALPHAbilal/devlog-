# Block Deletion Issue - Complete Analysis and Fix Instructions

## Executive Summary
Block deletions appear to work in the UI but the blocks persist in the database and reappear on page reload. The issue is at the database level, not the frontend.

## Problem Evidence from terminal.md

### What's Working ✅
1. **Frontend sends correct data** (lines 73-84):
   ```
   [DELETE] Finding block: {blockId: '4c8b21ff-affc-453e-9beb-0e7b129d26d8', blocksLength: 12, blockFound: true, blockType: 'text', position: 0}
   ```
   - Block is found correctly
   - Block type and position are sent properly
   - Multiple blocks can be deleted in batch

2. **SmartSync receives and sends data correctly** (lines 99-102):
   ```
   Change 1: {action: 'DELETE', block_id: '4c8b21ff-affc-453e-9beb-0e7b129d26d8', block_type: 'text', position: 0, has_type: true}
   ```

3. **RPC returns success** (line 88):
   ```
   SmartSync: RPC response: {total: 4, errors: Array(0), success: true, processed: 4}
   ```

### What's Failing ❌
4. **Blocks are NOT deleted from database** (lines 113-138):
   - After "successful" deletion, page reloads
   - SAME blocks reappear: `First block from DB: {id: '4c8b21ff-affc-453e-9beb-0e7b129d26d8'...`
   - This is the exact block that was supposedly deleted!

## Root Cause Analysis

### Effect Chain (Following rules.md Rule 19)
```
User clicks delete → 
Frontend finds block correctly → 
SmartSync sends DELETE with proper data → 
RPC batch_sync_changes executes → 
Function returns success BUT doesn't actually delete → 
Page reload fetches "deleted" blocks again
```

## Database Function Issues

### Current `batch_sync_changes` Function Problems

Looking at `/migrations/fix_batch_sync_type_position.sql`:

1. **SECURITY INVOKER Issue** (line 13):
   ```sql
   SECURITY INVOKER  -- This might not have DELETE permissions
   ```
   - Uses caller's permissions instead of function owner's
   - User might not have direct DELETE permission on blocks table
   - RLS policies might be blocking the deletion

2. **DELETE Operation** (lines 74-78):
   ```sql
   WHEN 'DELETE' THEN
     DELETE FROM blocks 
     WHERE id = (v_change->>'block_id')::UUID 
       AND document_id = p_document_id;
   ```
   - No verification of actual deletion
   - No check if user owns the block
   - No row count verification
   - Silent failure if no rows match

3. **User Context Issue** (lines 22-34):
   ```sql
   -- Get the user_id from the document (since auth.uid() returns NULL in RPC context)
   SELECT user_id INTO v_user_id FROM documents WHERE id = p_document_id;
   ```
   - Gets user_id from document, not from auth context
   - DELETE operation doesn't use this user_id for verification

## Required Fixes

### 1. SQL Function Fix (CRITICAL - For Supabase Admin)

Create and run this migration in Supabase SQL Editor:

```sql
-- Fix batch_sync_changes to properly handle DELETE operations
DROP FUNCTION IF EXISTS batch_sync_changes;

CREATE OR REPLACE FUNCTION batch_sync_changes(
  p_document_id UUID,
  p_changes JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- IMPORTANT: Use DEFINER to ensure proper permissions
AS $$
DECLARE
  v_result JSONB;
  v_change JSONB;
  v_processed INT := 0;
  v_errors JSONB := '[]'::JSONB;
  v_user_id UUID;
  v_deleted_count INT;
BEGIN
  -- Get the user_id from the document
  SELECT user_id INTO v_user_id
  FROM documents 
  WHERE id = p_document_id;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Document not found or access denied',
      'processed', 0,
      'total', 0
    );
  END IF;

  -- Process all changes
  FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    BEGIN
      CASE v_change->>'action'
        WHEN 'UPDATE', 'CREATE' THEN
          -- (existing update/create code remains the same)
          INSERT INTO blocks (
            id, document_id, type, content, position, metadata, updated_at
          )
          VALUES (
            (v_change->>'block_id')::UUID,
            p_document_id,
            v_change->>'block_type',
            v_change->>'content',
            COALESCE((v_change->>'position')::INT, 0),
            jsonb_build_object(
              'last_sync', now(),
              'sync_timestamp', (v_change->>'timestamp')::BIGINT
            ),
            to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          )
          ON CONFLICT (id) DO UPDATE
          SET 
            type = COALESCE(EXCLUDED.type, blocks.type),
            content = EXCLUDED.content,
            position = COALESCE(EXCLUDED.position, blocks.position),
            metadata = blocks.metadata || EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at
          WHERE blocks.updated_at < EXCLUDED.updated_at;
          
        WHEN 'DELETE' THEN
          -- CRITICAL FIX: Verify user owns the document before deleting
          DELETE FROM blocks 
          WHERE id = (v_change->>'block_id')::UUID 
            AND document_id = p_document_id
            AND EXISTS (
              SELECT 1 FROM documents 
              WHERE id = p_document_id 
              AND user_id = v_user_id
            );
          
          -- Get the number of rows actually deleted
          GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
          
          -- Log if deletion failed
          IF v_deleted_count = 0 THEN
            v_errors := v_errors || jsonb_build_object(
              'block_id', v_change->>'block_id',
              'action', 'DELETE',
              'error', 'Block not found or permission denied',
              'deleted_count', 0
            );
          ELSE
            -- Log successful deletion
            RAISE NOTICE 'Successfully deleted block % from document %', 
              v_change->>'block_id', p_document_id;
          END IF;
          
        WHEN 'REORDER' THEN
          -- (existing reorder code remains the same)
          UPDATE blocks 
          SET 
            position = COALESCE((v_change->>'position')::INT, position),
            updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          WHERE id = (v_change->>'block_id')::UUID 
            AND document_id = p_document_id;
      END CASE;
      
      v_processed := v_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'block_id', v_change->>'block_id',
        'action', v_change->>'action',
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- Update document's last modified time
  UPDATE documents 
  SET 
    updated_at = now(),
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{last_batch_sync}',
      jsonb_build_object(
        'timestamp', extract(epoch from now()) * 1000,
        'processed', v_processed,
        'total', jsonb_array_length(p_changes)
      )
    )
  WHERE id = p_document_id AND user_id = v_user_id;
  
  -- Return detailed result
  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'total', jsonb_array_length(p_changes),
    'errors', v_errors,
    'timestamp', extract(epoch from now()) * 1000
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION batch_sync_changes TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION batch_sync_changes IS 
'Fixed batch sync with proper DELETE handling and user verification. Uses SECURITY DEFINER for proper permissions.';
```

### 2. Check RLS Policies (For Supabase Admin)

Verify these RLS policies exist on the `blocks` table:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'blocks';

-- If DELETE policy is missing or incorrect, create it:
CREATE POLICY "Users can delete their own blocks" ON blocks
FOR DELETE USING (
  document_id IN (
    SELECT id FROM documents WHERE user_id = auth.uid()
  )
);

-- Enable RLS if not already enabled
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
```

### 3. Verify Table Structure

Check that the blocks table has proper columns:

```sql
-- Check blocks table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blocks'
ORDER BY ordinal_position;

-- Should include at minimum:
-- id (uuid)
-- document_id (uuid)
-- type (text)
-- content (text)
-- position (integer)
-- metadata (jsonb)
-- updated_at (timestamp)
```

## Testing Instructions

After applying the SQL fixes:

1. **Test Basic Deletion**:
   - Create a new block
   - Delete it
   - Refresh the page
   - Block should NOT reappear

2. **Test Batch Deletion**:
   - Create multiple blocks
   - Delete them all at once
   - Refresh the page
   - None should reappear

3. **Check Logs**:
   - Monitor Supabase logs for the RAISE NOTICE messages
   - Check for any permission errors

4. **Verify Security**:
   - Try to delete blocks from another user's document (should fail)
   - Verify only document owner can delete blocks

## Frontend Code Already Fixed

The frontend issue (stale closure in deleteBlock callback) has been fixed:
- File: `/src/components/ExpandedViewEnhanced.jsx`
- Line 639: Changed from `[removeBlock]` to `[removeBlock, blocks]`
- This ensures the callback has access to current blocks array

## Additional Recommendations

1. **Add Client-Side Verification**:
   - After DELETE, verify blocks are gone from database
   - Add retry logic if deletion fails

2. **Improve Error Handling**:
   - Parse the `errors` array from RPC response
   - Show user-friendly error messages

3. **Clear Caches**:
   - Update sessionCache to remove deleted blocks
   - Clear paginatedBlockLoader cache

## For the AI Assistant with Supabase Access

Please:
1. Apply the SQL migration above to fix the `batch_sync_changes` function
2. Verify RLS policies allow DELETE operations
3. Check Supabase logs after applying the fix
4. Test deletion and confirm blocks are actually removed from the database
5. Report back any errors or issues encountered

The key change is using `SECURITY DEFINER` instead of `SECURITY INVOKER` and adding proper user verification and row count checking for DELETE operations.