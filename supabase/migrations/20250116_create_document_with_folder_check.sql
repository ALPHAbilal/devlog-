-- Create a secure function to handle document creation with folder validation
-- This follows enterprise best practices used by Google, Microsoft, and other tech giants

-- Drop the function if it exists (for idempotency)
DROP FUNCTION IF EXISTS create_document_with_folder_check(UUID, TEXT, UUID, JSONB);

-- Create the security definer function
CREATE OR REPLACE FUNCTION create_document_with_folder_check(
  p_id UUID,
  p_title TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_preview TEXT DEFAULT 'Click to start writing...',
  p_tags TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_is_template BOOLEAN DEFAULT false,
  p_position INTEGER DEFAULT 0
) RETURNS documents
SECURITY DEFINER -- Runs with the privileges of the function owner
SET search_path = public -- Prevents search path injection attacks
LANGUAGE plpgsql
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
  
  -- Insert the document with all fields
  INSERT INTO documents (
    id, 
    user_id, 
    title, 
    folder_id, 
    preview,
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
    p_preview,
    p_tags,
    p_metadata,
    p_is_template,
    p_position,
    NOW(), 
    NOW()
  )
  RETURNING * INTO v_document;
  
  -- Log the creation for audit purposes (optional - uncomment if audit table exists)
  -- INSERT INTO document_audit_log (document_id, action, user_id, folder_id)
  -- VALUES (v_document.id, 'CREATE', v_user_id, p_folder_id);
  
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
This function bypasses RLS for the insert operation but maintains security through explicit checks.';

-- Create an index to optimize the folder ownership check
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

-- Create an index to optimize document queries by folder
CREATE INDEX IF NOT EXISTS idx_documents_folder_user ON documents(folder_id, user_id);