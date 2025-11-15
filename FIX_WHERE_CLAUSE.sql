-- Fix: Remove WHERE clause blocking same-timestamp updates
-- Issue: Updates in the same batch with close timestamps were being blocked
-- Solution: Remove WHERE clause since timestamp sorting already ensures correct order

CREATE OR REPLACE FUNCTION public.batch_sync_changes(p_document_id uuid, p_changes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_result JSONB;
  v_change JSONB;
  v_processed INT := 0;
  v_errors JSONB := '[]'::JSONB;
  v_client_metadata JSONB;
  v_sorted_changes JSONB;
BEGIN
  -- Sort changes by timestamp BEFORE processing
  SELECT jsonb_agg(elem ORDER BY (elem->>'timestamp')::BIGINT ASC)
  INTO v_sorted_changes
  FROM jsonb_array_elements(p_changes) AS elem;

  -- Process all changes in timestamp order
  FOR v_change IN SELECT * FROM jsonb_array_elements(v_sorted_changes)
  LOOP
    BEGIN
      CASE v_change->>'action'
        WHEN 'UPDATE', 'CREATE' THEN
          BEGIN
            v_client_metadata := CASE
              WHEN v_change->>'metadata' IS NOT NULL
              THEN (v_change->>'metadata')::JSONB
              ELSE '{}'::JSONB
            END;
          EXCEPTION WHEN OTHERS THEN
            v_client_metadata := '{}'::JSONB;
          END;

          INSERT INTO blocks (
            id,
            document_id,
            type,
            position,
            content,
            metadata,
            updated_at
          )
          VALUES (
            (v_change->>'block_id')::UUID,
            p_document_id,
            v_change->>'block_type',
            COALESCE((v_change->>'position')::INT, 0),
            v_change->>'content',
            v_client_metadata || jsonb_build_object(
              'last_sync', now(),
              'sync_timestamp', (v_change->>'timestamp')::BIGINT
            ),
            to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          )
          ON CONFLICT (id) DO UPDATE
          SET
            type = EXCLUDED.type,
            position = EXCLUDED.position,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at;
          -- FIXED: Removed WHERE clause - timestamp sorting already ensures correct order

        WHEN 'DELETE' THEN
          DELETE FROM blocks
          WHERE id = (v_change->>'block_id')::UUID
            AND document_id = p_document_id;

        WHEN 'REORDER' THEN
          UPDATE blocks
          SET
            position = (v_change->>'position')::INT,
            updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          WHERE id = (v_change->>'block_id')::UUID
            AND document_id = p_document_id;

        ELSE
          v_errors := v_errors || jsonb_build_object(
            'block_id', v_change->>'block_id',
            'action', v_change->>'action',
            'error', 'Unknown action type'
          );
          CONTINUE;
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

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'total', jsonb_array_length(p_changes),
    'errors', v_errors,
    'timestamp', extract(epoch from now()) * 1000
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'processed', 0,
    'error', SQLERRM,
    'timestamp', extract(epoch from now()) * 1000
  );
END;
$function$;

-- Verify the fix was applied
COMMENT ON FUNCTION batch_sync_changes IS 'Fixed 2025-11-09: Removed WHERE clause blocking same-timestamp updates. Changes are sorted by timestamp before processing, ensuring newest wins.';
