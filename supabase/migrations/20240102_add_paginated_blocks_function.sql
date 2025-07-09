-- Migration: Add paginated block loading functions
-- Description: Adds functions for efficient paginated loading of blocks to support large documents

-- Create function for efficient paginated block loading
CREATE OR REPLACE FUNCTION get_blocks_paginated(
  p_document_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
) 
RETURNS TABLE (
  blocks JSONB,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_total_count BIGINT;
  v_blocks JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user owns the document
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- Get total count of blocks
  SELECT COUNT(*)::BIGINT INTO v_total_count
  FROM blocks
  WHERE document_id = p_document_id;
  
  -- Get paginated blocks
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'type', b.type,
        'content', b.content,
        'position', b.position,
        'language', b.language,
        'file_path', b.file_path,
        'version_of', b.version_of,
        'metadata', b.metadata,
        'created_at', b.created_at,
        'updated_at', b.updated_at
      ) ORDER BY b.position
    ),
    '[]'::jsonb
  ) INTO v_blocks
  FROM blocks b
  WHERE b.document_id = p_document_id
  ORDER BY b.position
  LIMIT p_limit
  OFFSET p_offset;
  
  -- Return results
  RETURN QUERY
  SELECT v_blocks, v_total_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_blocks_paginated TO authenticated;

-- Create function to get block count for a document
CREATE OR REPLACE FUNCTION get_block_count(p_document_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count BIGINT;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if user owns the document
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
    AND user_id = v_user_id
  ) THEN
    RETURN 0;
  END IF;
  
  -- Get count
  SELECT COUNT(*)::BIGINT INTO v_count
  FROM blocks
  WHERE document_id = p_document_id;
  
  RETURN v_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_block_count TO authenticated;

-- Add comment explaining the functions
COMMENT ON FUNCTION get_blocks_paginated IS 'Returns paginated blocks for a document along with total count. Used for efficient loading of large documents.';
COMMENT ON FUNCTION get_block_count IS 'Returns the total number of blocks in a document. Used for pagination UI.';