-- Fix batch_sync_changes to include type and position fields
-- CRITICAL: Without type field, blocks cannot be deserialized!

-- Drop the old function
DROP FUNCTION IF EXISTS batch_sync_changes;

-- Create the fixed function with type and position support
CREATE OR REPLACE FUNCTION batch_sync_changes(
  p_document_id UUID,
  p_changes JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER  -- Use INVOKER to get actual user context
AS $$
DECLARE
  v_result JSONB;
  v_change JSONB;
  v_processed INT := 0;
  v_errors JSONB := '[]'::JSONB;
  v_user_id UUID;
BEGIN
  -- Get the user_id from the document (since auth.uid() returns NULL in RPC context)
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

  -- Process all changes in a single transaction
  FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    BEGIN
      -- Handle different action types
      CASE v_change->>'action'
        WHEN 'UPDATE', 'CREATE' THEN
          -- Upsert block with ALL necessary fields including type and position
          INSERT INTO blocks (
            id, 
            document_id,
            type,        -- CRITICAL: Save block type
            content, 
            position,    -- CRITICAL: Save position
            metadata,
            updated_at
          )
          VALUES (
            (v_change->>'block_id')::UUID,
            p_document_id,
            v_change->>'block_type',  -- Save the block type
            v_change->>'content',
            COALESCE((v_change->>'position')::INT, 0),  -- Save position, default to 0
            jsonb_build_object(
              'last_sync', now(),
              'sync_timestamp', (v_change->>'timestamp')::BIGINT
            ),
            to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
          )
          ON CONFLICT (id) DO UPDATE
          SET 
            type = COALESCE(EXCLUDED.type, blocks.type),  -- Update type if provided
            content = EXCLUDED.content,
            position = COALESCE(EXCLUDED.position, blocks.position),  -- Update position if provided
            metadata = blocks.metadata || EXCLUDED.metadata,
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
            position = COALESCE((v_change->>'position')::INT, position),
            metadata = jsonb_set(
              COALESCE(metadata, '{}'::jsonb),
              '{position}',
              to_jsonb((v_change->>'position')::INT)
            ),
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
        'processed', v_processed,
        'total', jsonb_array_length(p_changes)
      )
    )
  WHERE id = p_document_id AND user_id = v_user_id;
  
  -- Return result
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
'Batch sync changes for blocks with proper type and position handling. 
Critical fix: Saves block type and position to enable proper deserialization.';