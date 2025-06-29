-- Fix save_document_blocks function to properly handle metadata and all block fields
-- This ensures table, todo, and template blocks persist their data correctly

CREATE OR REPLACE FUNCTION save_document_blocks(
  doc_id UUID, 
  blocks JSONB
)
RETURNS VOID AS $$
BEGIN
  -- First, delete existing blocks for this document
  -- Only deletes blocks that belong to the current user
  DELETE FROM blocks 
  WHERE document_id = doc_id 
    AND user_id = auth.uid();
  
  -- Then insert new blocks with all fields including metadata
  INSERT INTO blocks (
    id, 
    document_id, 
    user_id, 
    type, 
    content, 
    position, 
    metadata,
    extracted_tags,
    language, 
    file_path, 
    created_at,
    updated_at
  )
  SELECT 
    COALESCE((b->>'id')::UUID, gen_random_uuid()),
    doc_id,
    auth.uid(),
    b->>'type',
    COALESCE(b->>'content', ''),
    (b->>'position')::INTEGER,
    COALESCE((b->'metadata')::JSONB, '{}'::JSONB),  -- Use -> instead of ->> to preserve JSONB
    COALESCE((b->'tags')::TEXT[], ARRAY[]::TEXT[]),  -- Handle tags array
    b->>'language',
    b->>'file_path',
    NOW(),
    NOW()
  FROM jsonb_array_elements(blocks) AS b;
  
  -- Log for debugging (remove in production)
  RAISE NOTICE 'Saved % blocks for document %', jsonb_array_length(blocks), doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_document_blocks TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION save_document_blocks IS 'Atomically saves all blocks for a document, properly preserving metadata for table/todo/template blocks';