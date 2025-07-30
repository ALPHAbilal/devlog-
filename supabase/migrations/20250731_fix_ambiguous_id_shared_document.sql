-- Fix ambiguous column reference 'id' in get_shared_document function
-- This error occurs because the function returns share_record.doc_id without proper aliasing

-- Drop the existing function
DROP FUNCTION IF EXISTS get_shared_document(TEXT, TEXT);

-- Recreate with proper column aliasing
CREATE OR REPLACE FUNCTION get_shared_document(
  p_share_code TEXT,
  p_password TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB,
  user_id UUID,
  permissions TEXT[],
  share_settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  share_record RECORD;
  v_user_id UUID;
BEGIN
  -- Get current user if authenticated
  v_user_id := auth.uid();
  
  -- Validate share code format
  IF p_share_code IS NULL OR LENGTH(p_share_code) < 6 THEN
    RAISE EXCEPTION 'Invalid share code';
  END IF;
  
  -- Get share details with proper aliasing
  SELECT 
    ds.*,
    d.id AS doc_id,
    d.title AS doc_title,
    d.tags AS doc_tags,
    d.created_at AS doc_created_at,
    d.updated_at AS doc_updated_at,
    d.metadata AS doc_metadata,
    d.user_id AS doc_user_id,
    d.deleted_at
  INTO share_record
  FROM document_shares ds
  INNER JOIN documents d ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
    AND ds.is_active = true
  LIMIT 1;
  
  -- Check if share exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found or inactive';
  END IF;
  
  -- Check if document is deleted
  IF share_record.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Document has been deleted';
  END IF;
  
  -- Check expiration
  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'Share link has expired';
  END IF;
  
  -- Check view limit
  IF share_record.max_views IS NOT NULL AND share_record.view_count >= share_record.max_views THEN
    RAISE EXCEPTION 'Share link has reached its view limit';
  END IF;
  
  -- Check password if required
  IF share_record.password_hash IS NOT NULL THEN
    IF p_password IS NULL THEN
      RAISE EXCEPTION 'Password required';
    END IF;
    -- For now, simple password check (in production, use proper hashing)
    IF share_record.password_hash != p_password THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;
  
  -- Check authentication requirement
  IF (share_record.settings->>'requireAuth')::boolean AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check user-specific share
  IF share_record.share_type = 'user' THEN
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required for user shares';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM document_share_users 
      WHERE share_id = share_record.id 
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'User not authorized for this share';
    END IF;
  END IF;
  
  -- Increment view count
  UPDATE document_shares 
  SET view_count = view_count + 1
  WHERE document_shares.id = share_record.id;
  
  -- Return document data with explicit column aliases
  RETURN QUERY
  SELECT 
    share_record.doc_id AS id,
    share_record.doc_title AS title,
    share_record.doc_tags AS tags,
    share_record.doc_created_at AS created_at,
    share_record.doc_updated_at AS updated_at,
    share_record.doc_metadata AS metadata,
    share_record.doc_user_id AS user_id,
    share_record.permissions::TEXT[] AS permissions,
    share_record.settings AS share_settings;
END;
$$;

-- Re-grant permissions
GRANT EXECUTE ON FUNCTION get_shared_document TO anon, authenticated;

-- Add comment explaining the fix
COMMENT ON FUNCTION get_shared_document IS 'Returns shared document data with proper column aliasing to avoid ambiguous id reference';