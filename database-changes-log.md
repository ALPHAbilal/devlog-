# Database Changes Log

## Date: 2025-08-15

### Change 1: Created atomic_save_blocks Function

**What was created:**
A new database function `atomic_save_blocks` was created to handle atomic saving of multiple blocks.

**Current Status:**
- Function exists but returns 0 saved blocks
- Issue identified: The function tries to save `data` field but blocks table uses `metadata` field

**SQL to create (what was done):**
```sql
CREATE OR REPLACE FUNCTION atomic_save_blocks(
  p_document_id UUID,
  p_blocks JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_saved_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_rows_affected INTEGER;
  v_block JSONB;
BEGIN
  -- Validate input
  IF p_blocks IS NULL OR jsonb_array_length(p_blocks) = 0 THEN
    RAISE EXCEPTION 'Cannot save 0 blocks';
  END IF;
  
  -- Process blocks in a single statement with RETURNING
  WITH upserted AS (
    INSERT INTO blocks (
      id,
      document_id,
      type,
      content,
      metadata,
      position,
      updated_at
    )
    SELECT 
      (block_data->>'id')::UUID,
      p_document_id,
      COALESCE(block_data->>'type', 'text'),
      COALESCE(block_data->>'content', ''),
      COALESCE(block_data->'metadata', '{}'),
      COALESCE((block_data->>'position')::INTEGER, 0),
      NOW()
    FROM jsonb_array_elements(p_blocks) AS block_data
    ON CONFLICT (id) DO UPDATE
    SET
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      position = EXCLUDED.position,
      updated_at = NOW()
    WHERE
      -- Only update if actually changed
      blocks.content IS DISTINCT FROM EXCLUDED.content OR
      blocks.metadata IS DISTINCT FROM EXCLUDED.metadata OR
      blocks.position IS DISTINCT FROM EXCLUDED.position
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_rows_affected FROM upserted;
  
  v_saved_count := v_rows_affected;
  
  -- Update document timestamp
  UPDATE documents
  SET updated_at = NOW()
  WHERE id = p_document_id;
  
  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'saved_count', v_saved_count,
    'error_count', v_error_count,
    'total_blocks', jsonb_array_length(p_blocks)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION atomic_save_blocks TO authenticated;
```

**How to rollback (undo this change):**
```sql
-- To completely remove the function:
DROP FUNCTION IF EXISTS atomic_save_blocks(UUID, JSONB);

-- Or to revert to a previous version, just run CREATE OR REPLACE with the old code
```

---

## Issues Identified

### Problem: Function returns 0 saved blocks

**Root Cause Analysis:**
1. The SaveCoordinator is sending blocks with a `data` field
2. The blocks table doesn't have a `data` column - it uses `metadata` for JSON data
3. The function tries to map `block_data->'metadata'` but SaveCoordinator sends `block_data->'data'`

**Blocks Table Structure:**
```
- id (uuid)
- document_id (uuid)  
- type (text)
- content (text)
- metadata (jsonb) <- This is where JSON data should go
- position (integer)
- created_at (timestamp)
- updated_at (timestamp)
- extracted_tags (array)
- language (text)
- file_path (text)
- version_of (uuid)
- search_vector (tsvector)
- user_id (uuid)
- deleted_at (timestamp)
```

**What SaveCoordinator is sending:**
```javascript
// From SaveCoordinator.js line 209-212
const blocksData = blocks.map(({ blockId, changes }) => ({
  id: blockId,
  ...changes  // This includes 'data' field from components
}));
```

**What the function expects:**
The function expects `metadata` field, not `data` field.

---

## Recommended Fix

The function needs to be updated to handle the `data` field correctly:

```sql
CREATE OR REPLACE FUNCTION atomic_save_blocks(
  p_document_id UUID,
  p_blocks JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_saved_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_rows_affected INTEGER;
BEGIN
  -- Validate input
  IF p_blocks IS NULL OR jsonb_array_length(p_blocks) = 0 THEN
    RAISE EXCEPTION 'Cannot save 0 blocks';
  END IF;
  
  -- Process blocks - map 'data' to 'metadata' column
  WITH upserted AS (
    INSERT INTO blocks (
      id,
      document_id,
      type,
      content,
      metadata,  -- This column stores the 'data' field
      position,
      updated_at
    )
    SELECT 
      (block_data->>'id')::UUID,
      p_document_id,
      COALESCE(block_data->>'type', 'text'),
      COALESCE(block_data->>'content', ''),
      COALESCE(block_data->'data', block_data->'metadata', '{}'),  -- Map 'data' to metadata column
      COALESCE((block_data->>'position')::INTEGER, 0),
      NOW()
    FROM jsonb_array_elements(p_blocks) AS block_data
    ON CONFLICT (id) DO UPDATE
    SET
      type = EXCLUDED.type,
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      position = EXCLUDED.position,
      updated_at = NOW()
    WHERE
      -- Only update if actually changed
      blocks.type IS DISTINCT FROM EXCLUDED.type OR
      blocks.content IS DISTINCT FROM EXCLUDED.content OR
      blocks.metadata IS DISTINCT FROM EXCLUDED.metadata OR
      blocks.position IS DISTINCT FROM EXCLUDED.position
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_rows_affected FROM upserted;
  
  v_saved_count := v_rows_affected;
  
  -- Update document timestamp if blocks were saved
  IF v_saved_count > 0 THEN
    UPDATE documents
    SET updated_at = NOW()
    WHERE id = p_document_id;
  END IF;
  
  -- Return result
  v_result := jsonb_build_object(
    'success', true,
    'saved_count', v_saved_count,
    'error_count', v_error_count,
    'total_blocks', jsonb_array_length(p_blocks)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
```

---

## Testing Commands

To test if the function works:
```sql
-- Test with sample data
SELECT atomic_save_blocks(
  '2841e61d-358b-48c8-99c4-a4e63d791ff0'::UUID,
  '[{"id": "217360cc-4b3c-4bb5-959a-6e74195c4fd4", "type": "version-track", "content": "", "data": {"version": 1}}]'::JSONB
);
```

---

## Complete Rollback Instructions

If you need to completely undo all database changes:

```sql
-- 1. Remove the atomic_save_blocks function
DROP FUNCTION IF EXISTS atomic_save_blocks(UUID, JSONB);

-- 2. That's it - no other database changes were made
```

The SaveCoordinator will then fail with "function does not exist" error, which will trigger the retry logic and eventually save to localStorage as a backup.