-- Fix create_document_with_folder_check function to remove preview column reference
-- The preview data is now stored in metadata JSONB field instead of a dedicated column

-- Drop the existing function
DROP FUNCTION IF EXISTS create_document_with_folder_check(UUID, TEXT, UUID, TEXT, TEXT[], JSONB, BOOLEAN, INTEGER);

-- Recreate the function without the preview column
CREATE OR REPLACE FUNCTION create_document_with_folder_check(
  p_id UUID,
  p_title TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_preview TEXT DEFAULT 'Click to start writing...', -- Keep parameter for backward compatibility
  p_tags TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_is_template BOOLEAN DEFAULT false,
  p_position INTEGER DEFAULT 0
)
RETURNS documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_document documents;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- If folder_id is provided, verify user owns it
  IF p_folder_id IS NOT NULL THEN
    -- Check if the folder exists and belongs to the user
    IF NOT EXISTS (
      SELECT 1 FROM folders 
      WHERE id = p_folder_id 
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'Folder not found or access denied' 
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  
  -- Insert the document WITHOUT preview column (it's stored in metadata instead)
  INSERT INTO documents (
    id, 
    user_id, 
    title, 
    folder_id, 
    tags,
    metadata, 
    is_template,
    position,
    created_at, 
    updated_at
  )
  VALUES (
    p_id, 
    v_user_id, 
    p_title, 
    p_folder_id, 
    p_tags,
    p_metadata,
    p_is_template,
    p_position,
    NOW(), 
    NOW()
  )
  RETURNING * INTO v_document;
  
  RETURN v_document;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Document with this ID already exists'
      USING ERRCODE = '23505';
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION 'Invalid folder reference'
      USING ERRCODE = '23503';
  WHEN OTHERS THEN
    -- Re-raise the exception with original error code
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_document_with_folder_check TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION create_document_with_folder_check IS 
'Securely creates a document with optional folder assignment. 
Validates folder ownership before creation. 
This function bypasses RLS for the insert operation but maintains security through explicit checks.
Note: preview is now stored in metadata JSONB field, not as a separate column.';