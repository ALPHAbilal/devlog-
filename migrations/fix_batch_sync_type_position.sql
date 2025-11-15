-- Migration: Fix batch_sync_changes to include type and position fields
-- Purpose: Resolve "null value in column type violates not-null constraint" error
-- Issue: The function was not inserting block type and position, causing database constraint violations

CREATE OR REPLACE FUNCTION batch_sync_changes(
  p_document_id UUID,
  p_changes JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_change JSONB;
  v_processed INT := 0;
  v_errors JSONB := '[]'::JSONB;
  v_client_metadata JSONB;
BEGIN
  -- Process all changes in a single transaction
  FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    BEGIN
      -- Handle different action types
      CASE v_change->>'action'
        WHEN 'UPDATE', 'CREATE' THEN
          -- Parse metadata from client if provided
          BEGIN
            v_client_metadata := CASE
              WHEN v_change->>'metadata' IS NOT NULL
              THEN (v_change->>'metadata')::JSONB
              ELSE '{}'::JSONB
            END;
          EXCEPTION WHEN OTHERS THEN
            v_client_metadata := '{}'::JSONB;
          END;

          -- Upsert block with conflict resolution based on timestamp
          INSERT INTO blocks (
            id,
            document_id,
            type,              -- CRITICAL FIX: Add type field
            position,          -- CRITICAL FIX: Add position field
            content,
            metadata,
            updated_at
          )
          VALUES (
            (v_change->>'block_id')::UUID,
            p_document_id,
            v_change->>'block_type',  -- CRITICAL FIX: Map block_type from payload
            COALESCE((v_change->>'position')::INT, 0),  -- CRITICAL FIX: Map position from payload
            v_change->>'content',
            -- Merge client metadata with sync tracking
            v_client_metadata || jsonb_build_object(
              'last_sync', now(),
              'sync_timestamp', (v_change->>'timestamp')::BIGINT
            ),
            to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          )
          ON CONFLICT (id) DO UPDATE
          SET
            type = EXCLUDED.type,        -- CRITICAL FIX: Update type on conflict
            position = EXCLUDED.position,  -- CRITICAL FIX: Update position on conflict
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at
          WHERE blocks.updated_at < EXCLUDED.updated_at; -- Prevent older changes from overwriting

        WHEN 'DELETE' THEN
          -- Delete block
          DELETE FROM blocks
          WHERE id = (v_change->>'block_id')::UUID
            AND document_id = p_document_id;

        WHEN 'REORDER' THEN
          -- Update block position
          UPDATE blocks
          SET
            position = (v_change->>'position')::INT,  -- CRITICAL FIX: Use actual position column
            updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          WHERE id = (v_change->>'block_id')::UUID
            AND document_id = p_document_id;

        ELSE
          -- Unknown action, log it
          v_errors := v_errors || jsonb_build_object(
            'block_id', v_change->>'block_id',
            'action', v_change->>'action',
            'error', 'Unknown action type'
          );
          CONTINUE;
      END CASE;

      v_processed := v_processed + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue processing other changes
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
        'changes_processed', v_processed
      )
    )
  WHERE id = p_document_id;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'total', jsonb_array_length(p_changes),
    'errors', v_errors,
    'timestamp', extract(epoch from now()) * 1000
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error result
  RETURN jsonb_build_object(
    'success', false,
    'processed', 0,
    'error', SQLERRM,
    'timestamp', extract(epoch from now()) * 1000
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION batch_sync_changes IS 'Processes multiple block changes in a single transaction. Updated to preserve client metadata and include type/position fields.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION batch_sync_changes TO authenticated;
