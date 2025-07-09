-- Create batch operation functions for better performance
-- These functions reduce round trips and improve transaction efficiency

-- Batch insert blocks function
CREATE OR REPLACE FUNCTION public.batch_insert_blocks(
  doc_id UUID,
  blocks JSONB
)
RETURNS TABLE (
  id UUID,
  "position" INTEGER,
  success BOOLEAN,
  error TEXT
) AS $$
DECLARE
  block_record JSONB;
  new_id UUID;
  idx INTEGER := 0;
BEGIN
  -- Validate document ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = doc_id 
      AND user_id = auth.uid() 
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Process each block
  FOR block_record IN SELECT * FROM jsonb_array_elements(blocks)
  LOOP
    BEGIN
      new_id := COALESCE((block_record->>'id')::UUID, gen_random_uuid());
      
      INSERT INTO public.blocks (
        id,
        document_id,
        type,
        content,
        "position",
        metadata,
        language,
        file_path,
        extracted_tags,
        user_id
      ) VALUES (
        new_id,
        doc_id,
        block_record->>'type',
        COALESCE(block_record->>'content', ''),
        COALESCE((block_record->>'position')::INTEGER, idx),
        COALESCE((block_record->'metadata')::JSONB, '{}'::JSONB),
        block_record->>'language',
        block_record->>'file_path',
        CASE 
          WHEN block_record->>'type' = 'text' AND block_record->>'content' IS NOT NULL
          THEN string_to_array(
            regexp_replace(
              block_record->>'content',
              '#(\w+)',
              '\1',
              'g'
            ),
            ' '
          )
          ELSE ARRAY[]::TEXT[]
        END,
        auth.uid()
      );
      
      RETURN QUERY SELECT new_id, idx, true, NULL::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        COALESCE((block_record->>'id')::UUID, gen_random_uuid()), 
        idx, 
        false, 
        SQLERRM;
    END;
    
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch update blocks function
CREATE OR REPLACE FUNCTION public.batch_update_blocks(
  updates JSONB
)
RETURNS TABLE (
  block_id UUID,
  success BOOLEAN,
  error TEXT
) AS $$
DECLARE
  update_record JSONB;
  bid UUID;
BEGIN
  FOR update_record IN SELECT * FROM jsonb_array_elements(updates)
  LOOP
    BEGIN
      bid := (update_record->>'id')::UUID;
      
      -- Verify ownership through document
      IF NOT EXISTS (
        SELECT 1 FROM public.blocks b
        JOIN public.documents d ON b.document_id = d.id
        WHERE b.id = bid
          AND d.user_id = auth.uid()
          AND b.deleted_at IS NULL
          AND d.deleted_at IS NULL
      ) THEN
        RETURN QUERY SELECT bid, false, 'Block not found or access denied';
        CONTINUE;
      END IF;
      
      -- Update block
      UPDATE public.blocks
      SET 
        content = COALESCE(update_record->>'content', content),
        "position" = COALESCE((update_record->>'position')::INTEGER, "position"),
        metadata = COALESCE((update_record->'metadata')::JSONB, metadata),
        language = COALESCE(update_record->>'language', language),
        file_path = COALESCE(update_record->>'file_path', file_path),
        updated_at = NOW()
      WHERE id = bid;
      
      RETURN QUERY SELECT bid, true, NULL::TEXT;
      
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT bid, false, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimized save_document_blocks function using UNNEST for better performance
CREATE OR REPLACE FUNCTION public.save_document_blocks_v2(
  p_document_id UUID,
  p_blocks JSONB
)
RETURNS JSONB AS $$
DECLARE
  block_ids UUID[];
  block_types TEXT[];
  block_contents TEXT[];
  block_positions INTEGER[];
  block_metadatas JSONB[];
  block_languages TEXT[];
  block_file_paths TEXT[];
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Validate document ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = p_document_id 
      AND user_id = v_user_id 
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Extract arrays from JSONB for bulk operations
  SELECT 
    array_agg(COALESCE((b->>'id')::UUID, gen_random_uuid())),
    array_agg(b->>'type'),
    array_agg(COALESCE(b->>'content', '')),
    array_agg((b->>'position')::INTEGER),
    array_agg(COALESCE((b->'metadata')::JSONB, '{}'::JSONB)),
    array_agg(b->>'language'),
    array_agg(b->>'file_path')
  INTO 
    block_ids,
    block_types,
    block_contents,
    block_positions,
    block_metadatas,
    block_languages,
    block_file_paths
  FROM jsonb_array_elements(p_blocks) AS b;

  -- Delete existing blocks in a single operation
  DELETE FROM public.blocks 
  WHERE document_id = p_document_id 
    AND deleted_at IS NULL;

  -- Insert all blocks at once using UNNEST
  INSERT INTO public.blocks (
    id,
    document_id,
    type,
    content,
    "position",
    metadata,
    language,
    file_path,
    user_id,
    created_at,
    updated_at
  )
  SELECT 
    unnest(block_ids),
    p_document_id,
    unnest(block_types),
    unnest(block_contents),
    unnest(block_positions),
    unnest(block_metadatas),
    unnest(block_languages),
    unnest(block_file_paths),
    v_user_id,
    NOW(),
    NOW();
    
  -- Return the saved blocks
  RETURN jsonb_agg(row_to_json(b.*)::jsonb)
  FROM (
    SELECT * FROM public.blocks 
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL
    ORDER BY "position"
  ) b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch delete blocks function
CREATE OR REPLACE FUNCTION public.batch_delete_blocks(
  block_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Soft delete blocks that belong to user's documents
  UPDATE public.blocks b
  SET deleted_at = NOW()
  FROM public.documents d
  WHERE b.document_id = d.id
    AND b.id = ANY(block_ids)
    AND d.user_id = auth.uid()
    AND b.deleted_at IS NULL
    AND d.deleted_at IS NULL;
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.batch_insert_blocks TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_update_blocks TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_document_blocks_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_delete_blocks TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.batch_insert_blocks IS 'Efficiently inserts multiple blocks with error handling';
COMMENT ON FUNCTION public.batch_update_blocks IS 'Efficiently updates multiple blocks with validation';
COMMENT ON FUNCTION public.save_document_blocks_v2 IS 'Optimized version using bulk operations';
COMMENT ON FUNCTION public.batch_delete_blocks IS 'Soft deletes multiple blocks at once';