-- Comprehensive fix for document sharing system
-- This migration fixes all known issues with the sharing functions

-- Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS get_shared_document_blocks(text, uuid);
DROP FUNCTION IF EXISTS get_shared_document(text, text);
DROP FUNCTION IF EXISTS get_shared_document_profile(uuid);

-- Fix get_shared_document_blocks: Remove non-existent parent_id column
CREATE OR REPLACE FUNCTION get_shared_document_blocks(
  p_share_code text,
  p_document_id uuid
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  type text,
  content text,
  metadata jsonb,
  "position" integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  share_record RECORD;
BEGIN
  -- Verify the share is valid and has view permissions
  -- Using explicit table aliases to avoid ambiguity
  SELECT 
    ds.id as share_id,
    ds.document_id,
    ds.permissions,
    ds.is_active,
    d.deleted_at
  INTO share_record
  FROM document_shares ds
  INNER JOIN documents d ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
    AND ds.document_id = p_document_id
    AND ds.is_active = true
    AND d.deleted_at IS NULL
  LIMIT 1;
  
  -- Check if share exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid share or document' 
      USING HINT = 'The share code may be invalid or the document may not exist';
  END IF;
  
  -- Check if share has view permissions
  IF NOT ('view' = ANY(share_record.permissions) OR 
          'comment' = ANY(share_record.permissions) OR 
          'edit' = ANY(share_record.permissions)) THEN
    RAISE EXCEPTION 'Insufficient permissions' 
      USING HINT = 'This share does not have view, comment, or edit permissions';
  END IF;
  
  -- Return blocks without parent_id (which doesn't exist in the blocks table)
  RETURN QUERY
  SELECT 
    b.id,
    b.document_id,
    b.type,
    b.content,
    b.metadata,
    b."position",
    b.created_at,
    b.updated_at
  FROM blocks b
  WHERE b.document_id = p_document_id
    AND b.deleted_at IS NULL
  ORDER BY b."position";
END;
$$;

-- Ensure get_shared_document uses explicit column references
CREATE OR REPLACE FUNCTION get_shared_document(
  p_share_code text,
  p_password text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  tags text[],
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  metadata jsonb,
  user_id uuid,
  permissions share_permission[],  -- Use the actual enum type
  share_settings jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  share_record RECORD;
BEGIN
  -- Get share details with explicit column references
  SELECT 
    ds.id as share_id,
    ds.document_id,
    ds.permissions,
    ds.settings,
    ds.is_active,
    d.id as doc_id,
    d.title as doc_title,
    d.tags as doc_tags,
    d.created_at as doc_created_at,
    d.updated_at as doc_updated_at,
    d.metadata as doc_metadata,
    d.user_id as doc_user_id,
    d.deleted_at
  INTO share_record
  FROM document_shares ds
  INNER JOIN documents d ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
    AND ds.is_active = true
    AND d.deleted_at IS NULL
  LIMIT 1;
  
  -- Check if share exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found or inactive' 
      USING HINT = 'The share code may be invalid or the share may have been deactivated';
  END IF;
  
  -- Check password if required
  IF share_record.settings->>'requires_password' = 'true' THEN
    IF p_password IS NULL OR 
       share_record.settings->>'password' IS NULL OR
       share_record.settings->>'password' != p_password THEN
      RAISE EXCEPTION 'Invalid password' 
        USING HINT = 'This share requires a password';
    END IF;
  END IF;
  
  -- Return document details
  RETURN QUERY
  SELECT 
    share_record.doc_id,
    share_record.doc_title,
    share_record.doc_tags,
    share_record.doc_created_at,
    share_record.doc_updated_at,
    share_record.doc_metadata,
    share_record.doc_user_id,
    share_record.permissions,
    share_record.settings;
END;
$$;

-- Ensure get_shared_document_profile is robust
CREATE OR REPLACE FUNCTION get_shared_document_profile(p_user_id uuid)
RETURNS TABLE(
  username text,
  display_name text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return profile information
  -- Handle case where profile doesn't exist by using COALESCE
  RETURN QUERY
  SELECT 
    COALESCE(p.username, 'Anonymous User')::text,
    COALESCE(p.display_name, 'Anonymous User')::text,
    p.avatar_url
  FROM profiles p
  WHERE p.id = p_user_id
  LIMIT 1;
  
  -- If no profile found, return default anonymous user
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      'Anonymous User'::text,
      'Anonymous User'::text,
      NULL::text;
  END IF;
END;
$$;

-- Grant necessary permissions for anonymous users
GRANT EXECUTE ON FUNCTION get_shared_document(text, text) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_document_profile(uuid) TO anon;

-- Also grant to authenticated users
GRANT EXECUTE ON FUNCTION get_shared_document(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_profile(uuid) TO authenticated;

-- Add helpful comments for future developers
COMMENT ON FUNCTION get_shared_document(text, text) IS 
'Retrieves document details for a given share code. 
Parameters:
- p_share_code: The share code
- p_password: Optional password if the share is password-protected
Returns document details with permissions if access is granted.
Common issues to avoid:
- Always use explicit table aliases in queries
- Check that all referenced columns exist in the table
- Handle NULL cases appropriately';

COMMENT ON FUNCTION get_shared_document_blocks(text, uuid) IS 
'Retrieves document blocks for a shared document.
Parameters:
- p_share_code: The share code
- p_document_id: The document ID (for extra validation)
Returns blocks ordered by position.
Note: The blocks table does not have a parent_id column.';

COMMENT ON FUNCTION get_shared_document_profile(uuid) IS 
'Retrieves user profile information for document author.
Parameters:
- p_user_id: The user ID
Returns profile info or default "Anonymous User" if not found.';