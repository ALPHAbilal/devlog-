-- Create the save_document_blocks_v3 function that was missing
-- This function saves document metadata and blocks atomically

CREATE OR REPLACE FUNCTION save_document_blocks_v3(
  p_document_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_tags TEXT[] DEFAULT '{}',
  p_blocks JSONB DEFAULT '[]'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_exists BOOLEAN;
  v_preview_text TEXT;
  v_block_count INTEGER;
  v_result JSONB;
BEGIN
  -- Check if document exists and user owns it
  SELECT EXISTS(
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND user_id = p_user_id
    AND deleted_at IS NULL
  ) INTO v_document_exists;

  IF NOT v_document_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Document not found or unauthorized'
    );
  END IF;

  -- Start transaction
  BEGIN
    -- Update document metadata
    UPDATE documents 
    SET 
      title = p_title,
      tags = p_tags,
      updated_at = NOW()
    WHERE id = p_document_id 
    AND user_id = p_user_id;

    -- Generate preview text from blocks
    v_preview_text := '';
    v_block_count := 0;
    
    IF p_blocks IS NOT NULL AND jsonb_array_length(p_blocks) > 0 THEN
      -- Extract text content from blocks for preview
      SELECT 
        string_agg(
          CASE 
            WHEN (block->>'type') = 'text' THEN 
              COALESCE(block->>'content', '')
            WHEN (block->>'type') = 'heading' THEN 
              COALESCE(block->>'content', '')
            ELSE ''
          END, 
          ' '
        ),
        COUNT(*)
      INTO v_preview_text, v_block_count
      FROM jsonb_array_elements(p_blocks) AS block
      WHERE block->>'content' IS NOT NULL 
        AND block->>'content' != '';

      -- Limit preview length
      IF LENGTH(v_preview_text) > 500 THEN
        v_preview_text := SUBSTRING(v_preview_text, 1, 497) || '...';
      END IF;

      -- Delete existing blocks
      DELETE FROM blocks WHERE document_id = p_document_id;

      -- Insert new blocks
      INSERT INTO blocks (
        id, 
        document_id, 
        user_id,
        type, 
        content, 
        metadata, 
        position, 
        language,
        file_path,
        created_at, 
        updated_at
      )
      SELECT 
        COALESCE((block->>'id')::uuid, gen_random_uuid()),
        p_document_id,
        p_user_id,
        block->>'type',
        COALESCE(block->>'content', ''),
        CASE 
          WHEN block->'metadata' IS NOT NULL THEN block->'metadata'
          ELSE '{}'::jsonb
        END,
        (block->>'position')::integer,
        block->>'language',
        block->>'file_path',
        NOW(),
        NOW()
      FROM jsonb_array_elements(p_blocks) AS block;
    END IF;

    -- Update document metadata with preview and block count
    UPDATE documents 
    SET 
      metadata = COALESCE(metadata, '{}'::jsonb) || 
        jsonb_build_object(
          'preview', v_preview_text,
          'blockCount', v_block_count,
          'lastSyncedAt', NOW()
        )
    WHERE id = p_document_id;

    -- Update folder's updated_at if document has a folder
    UPDATE folders 
    SET updated_at = NOW() 
    WHERE id = (
      SELECT folder_id FROM documents WHERE id = p_document_id
    );

    v_result := jsonb_build_object(
      'success', true,
      'message', 'Document and blocks saved successfully',
      'document_id', p_document_id,
      'block_count', v_block_count
    );

    RETURN v_result;

  EXCEPTION 
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
END;
$$;

-- Add comment
COMMENT ON FUNCTION save_document_blocks_v3 IS 'Saves document metadata and blocks atomically, replacing all existing blocks';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION save_document_blocks_v3 TO authenticated;