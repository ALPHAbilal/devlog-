-- Fix for Block Deletion Issue
-- Problem: Blocks are soft-deleted but queries don't filter them, causing "deleted" blocks to reappear
-- Solution: Either implement proper soft-delete filtering OR switch to hard deletes
-- This migration does BOTH: fixes the function AND adds proper filtering

-- First, let's check current state and add logging
DO $$
BEGIN
  RAISE NOTICE 'Starting block deletion fix migration at %', NOW();
END $$;

-- Drop the existing function to replace it
DROP FUNCTION IF EXISTS batch_sync_changes CASCADE;

-- Create the fixed function with proper deletion handling
CREATE OR REPLACE FUNCTION batch_sync_changes(
  p_document_id UUID,
  p_changes JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- CRITICAL: Use DEFINER for proper permissions
AS $$
DECLARE
  v_result JSONB;
  v_change JSONB;
  v_processed INT := 0;
  v_errors JSONB := '[]'::JSONB;
  v_user_id UUID;
  v_deleted_count INT;
  v_block_id UUID;
  v_timestamp BIGINT;
  v_block_type TEXT;
  v_position INT;
BEGIN
  -- Get the user_id from the document
  SELECT user_id INTO v_user_id
  FROM documents 
  WHERE id = p_document_id
    AND deleted_at IS NULL;  -- Only work with non-deleted documents
  
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
      v_block_id := (v_change->>'block_id')::UUID;
      v_timestamp := COALESCE((v_change->>'timestamp')::BIGINT, extract(epoch from NOW()) * 1000);
      v_block_type := v_change->>'block_type';
      v_position := (v_change->>'position')::INT;
      
      CASE v_change->>'action'
        WHEN 'UPDATE', 'CREATE' THEN
          -- Upsert block with all necessary fields
          INSERT INTO blocks (
            id, 
            document_id,
            type,
            content,
            position,
            metadata,
            user_id,
            created_at,
            updated_at,
            deleted_at  -- Ensure deleted_at is NULL for new/updated blocks
          )
          VALUES (
            v_block_id,
            p_document_id,
            COALESCE(v_block_type, 'text'),
            v_change->>'content',
            COALESCE(v_position, 999),
            jsonb_build_object(
              'last_sync', NOW(),
              'sync_timestamp', v_timestamp
            ),
            v_user_id,
            NOW(),
            to_timestamp(v_timestamp / 1000),
            NULL  -- Explicitly set deleted_at to NULL
          )
          ON CONFLICT (id) DO UPDATE
          SET 
            type = COALESCE(EXCLUDED.type, blocks.type),
            content = EXCLUDED.content,
            position = COALESCE(EXCLUDED.position, blocks.position),
            metadata = blocks.metadata || EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at,
            deleted_at = NULL  -- Clear any previous soft delete
          WHERE blocks.updated_at < EXCLUDED.updated_at;
          
        WHEN 'DELETE' THEN
          -- OPTION 1: Hard delete (completely remove from database)
          -- Uncomment this block for hard delete:
          /*
          DELETE FROM blocks 
          WHERE id = v_block_id 
            AND document_id = p_document_id
            AND EXISTS (
              SELECT 1 FROM documents 
              WHERE id = p_document_id 
              AND user_id = v_user_id
            );
          */
          
          -- OPTION 2: Soft delete (mark as deleted)
          -- Currently using this approach for data recovery safety
          UPDATE blocks 
          SET 
            deleted_at = NOW(),
            updated_at = to_timestamp(v_timestamp / 1000),
            metadata = COALESCE(metadata, '{}'::JSONB) || 
              jsonb_build_object(
                'deleted_by', v_user_id,
                'delete_timestamp', v_timestamp
              )
          WHERE id = v_block_id 
            AND document_id = p_document_id
            AND deleted_at IS NULL  -- Don't re-delete already deleted blocks
            AND EXISTS (
              SELECT 1 FROM documents 
              WHERE id = p_document_id 
              AND user_id = v_user_id
            );
          
          -- Get the number of rows actually deleted/updated
          GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
          
          -- Log the deletion result
          IF v_deleted_count = 0 THEN
            v_errors := v_errors || jsonb_build_object(
              'block_id', v_block_id,
              'action', 'DELETE',
              'error', 'Block not found, already deleted, or permission denied',
              'deleted_count', 0
            );
            RAISE NOTICE 'Failed to delete block % from document %', v_block_id, p_document_id;
          ELSE
            RAISE NOTICE 'Successfully deleted block % from document % (soft delete)', v_block_id, p_document_id;
          END IF;
          
        WHEN 'REORDER' THEN
          -- Update block position
          UPDATE blocks 
          SET 
            position = COALESCE((v_change->>'position')::INT, position),
            updated_at = to_timestamp(v_timestamp / 1000),
            metadata = COALESCE(metadata, '{}'::JSONB) || 
              jsonb_build_object('reordered_at', NOW())
          WHERE id = v_block_id 
            AND document_id = p_document_id
            AND deleted_at IS NULL;  -- Don't reorder deleted blocks
            
        ELSE
          -- Unknown action
          v_errors := v_errors || jsonb_build_object(
            'block_id', v_block_id,
            'action', v_change->>'action',
            'error', 'Unknown action type'
          );
          CONTINUE;
      END CASE;
      
      v_processed := v_processed + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other changes
      v_errors := v_errors || jsonb_build_object(
        'block_id', v_block_id,
        'action', v_change->>'action',
        'error', SQLERRM,
        'detail', SQLSTATE
      );
      RAISE NOTICE 'Error processing block %: %', v_block_id, SQLERRM;
    END;
  END LOOP;
  
  -- Update document's last modified time
  IF v_processed > 0 THEN
    UPDATE documents 
    SET 
      updated_at = NOW(),
      metadata = COALESCE(metadata, '{}'::JSONB) || 
        jsonb_build_object(
          'last_batch_sync', jsonb_build_object(
            'timestamp', extract(epoch from NOW()) * 1000,
            'processed', v_processed,
            'total', jsonb_array_length(p_changes),
            'had_errors', jsonb_array_length(v_errors) > 0
          )
        )
    WHERE id = p_document_id 
      AND user_id = v_user_id;
  END IF;
  
  -- Return detailed result
  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'total', jsonb_array_length(p_changes),
    'errors', v_errors,
    'timestamp', extract(epoch from NOW()) * 1000
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error result
  RETURN jsonb_build_object(
    'success', false,
    'processed', 0,
    'error', SQLERRM,
    'detail', SQLSTATE,
    'timestamp', extract(epoch from NOW()) * 1000
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION batch_sync_changes TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION batch_sync_changes IS 
'Fixed batch sync with proper DELETE handling, user verification, and soft-delete support. 
Uses SECURITY DEFINER for proper permissions. Soft deletes blocks by setting deleted_at timestamp.';

-- Create or update RLS policies for DELETE operations
DO $$
BEGIN
  -- Drop existing DELETE policy if it exists
  DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocks;
  
  -- Create new DELETE policy
  CREATE POLICY "Users can delete their own blocks" ON blocks
  FOR DELETE USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid() 
        AND deleted_at IS NULL
    )
  );
  
  -- Also create UPDATE policy for soft deletes
  DROP POLICY IF EXISTS "Users can soft delete their own blocks" ON blocks;
  
  CREATE POLICY "Users can soft delete their own blocks" ON blocks
  FOR UPDATE USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid() 
        AND deleted_at IS NULL
    )
  ) WITH CHECK (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid() 
        AND deleted_at IS NULL
    )
  );
  
  RAISE NOTICE 'RLS policies for block deletion updated successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error updating RLS policies: %', SQLERRM;
END $$;

-- Create index on deleted_at for better query performance
CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at ON blocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_blocks_document_deleted ON blocks(document_id, deleted_at);

-- Add a helper view for non-deleted blocks (optional but useful)
CREATE OR REPLACE VIEW active_blocks AS
SELECT * FROM blocks 
WHERE deleted_at IS NULL;

-- Grant permissions on the view
GRANT SELECT ON active_blocks TO authenticated;

-- Final check and report
DO $$
DECLARE
  v_soft_deleted_count INT;
BEGIN
  -- Count soft-deleted blocks
  SELECT COUNT(*) INTO v_soft_deleted_count
  FROM blocks
  WHERE deleted_at IS NOT NULL;
  
  RAISE NOTICE 'Migration complete. Found % soft-deleted blocks in the database.', v_soft_deleted_count;
  RAISE NOTICE 'IMPORTANT: Frontend queries must now include "WHERE deleted_at IS NULL" or use the active_blocks view!';
END $$;