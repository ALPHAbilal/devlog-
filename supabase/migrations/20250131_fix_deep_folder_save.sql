-- Migration to fix deep folder document saving issue
-- Creates an atomic save function that handles document creation and block saving in one transaction

-- Create the atomic save function for new documents with blocks
CREATE OR REPLACE FUNCTION save_document_with_blocks_atomic(
  p_document_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}',
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
  -- Check if document already exists
  SELECT EXISTS(
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND user_id = p_user_id
  ) INTO v_document_exists;

  IF v_document_exists THEN
    -- Use existing save_document_blocks_v3 for updates
    RETURN save_document_blocks_v3(p_document_id, p_user_id, p_title, p_tags, p_blocks);
  END IF;

  -- Start transaction for new document
  BEGIN
    -- Validate folder ownership if folder_id is provided
    IF p_folder_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM folders 
        WHERE id = p_folder_id 
        AND user_id = p_user_id
      ) THEN
        RAISE EXCEPTION 'Folder not found or unauthorized';
      END IF;
    END IF;

    -- Create the document first
    INSERT INTO documents (
      id, 
      user_id, 
      title, 
      folder_id,
      tags, 
      metadata,
      created_at,
      updated_at
    ) VALUES (
      p_document_id,
      p_user_id,
      p_title,
      p_folder_id,
      p_tags,
      p_metadata,
      NOW(),
      NOW()
    );

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

      -- Delete any existing blocks (shouldn't exist for new documents)
      DELETE FROM blocks WHERE document_id = p_document_id;

      -- Insert new blocks
      INSERT INTO blocks (id, document_id, type, content, metadata, position, created_at, updated_at)
      SELECT 
        COALESCE((block->>'id')::uuid, gen_random_uuid()),
        p_document_id,
        block->>'type',
        block->>'content',
        CASE 
          WHEN block->'metadata' IS NOT NULL THEN block->'metadata'
          ELSE '{}'::jsonb
        END,
        (block->>'position')::integer,
        NOW(),
        NOW()
      FROM jsonb_array_elements(p_blocks) AS block;
    END IF;

    -- Update document metadata with preview and block count
    UPDATE documents 
    SET 
      metadata = metadata || 
        jsonb_build_object(
          'preview', v_preview_text,
          'blockCount', v_block_count,
          'lastSyncedAt', NOW()
        ),
      updated_at = NOW()
    WHERE id = p_document_id;

    -- Update folder's updated_at timestamp
    IF p_folder_id IS NOT NULL THEN
      UPDATE folders 
      SET updated_at = NOW() 
      WHERE id = p_folder_id;
    END IF;

    v_result := jsonb_build_object(
      'success', true,
      'message', 'Document created and saved successfully',
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
COMMENT ON FUNCTION save_document_with_blocks_atomic IS 'Atomically creates a new document and saves its blocks in a single transaction to prevent race conditions';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION save_document_with_blocks_atomic TO authenticated;