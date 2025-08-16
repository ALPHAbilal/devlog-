-- Fix document sharing with SECURITY DEFINER functions
-- This migration creates functions that bypass RLS for controlled shared document access

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_shared_document(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_shared_document_blocks(TEXT, TEXT);

-- Create function to get shared document content
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
  
  -- Get share details
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
    RAISE EXCEPTION 'Share not found or has been disabled';
  END IF;
  
  -- Check if document is deleted
  IF share_record.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Document not found or has been deleted';
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
    
    -- Verify password (assuming password_hash is in format salt:hash)
    DECLARE
      salt TEXT;
      stored_hash TEXT;
      computed_hash TEXT;
    BEGIN
      salt := split_part(share_record.password_hash, ':', 1);
      stored_hash := split_part(share_record.password_hash, ':', 2);
      
      -- Note: In production, use a proper password hashing function
      -- This is a simplified version for demonstration
      computed_hash := encode(digest(salt || p_password, 'sha256'), 'hex');
      
      IF stored_hash != computed_hash THEN
        RAISE EXCEPTION 'Invalid password';
      END IF;
    END;
  END IF;
  
  -- Check authentication requirement
  IF share_record.settings->>'requireAuth' = 'true' AND v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check user-specific share
  IF share_record.share_type = 'user' THEN
    IF v_user_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check if user has access
    IF NOT EXISTS (
      SELECT 1 FROM document_share_users
      WHERE share_id = share_record.id
      AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'You do not have access to this document';
    END IF;
  END IF;
  
  -- Update view count
  UPDATE document_shares 
  SET view_count = view_count + 1
  WHERE id = share_record.id;
  
  -- Return document data
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

-- Create function to get blocks for shared documents
CREATE OR REPLACE FUNCTION get_shared_document_blocks(
  p_share_code TEXT,
  p_document_id UUID
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  type TEXT,
  content TEXT,
  metadata JSONB,
  position INT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  share_record RECORD;
BEGIN
  -- Verify the share is valid and has view permissions
  SELECT ds.*, d.deleted_at
  INTO share_record
  FROM document_shares ds
  INNER JOIN documents d ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
    AND ds.document_id = p_document_id
    AND ds.is_active = true
    AND d.deleted_at IS NULL
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid share or document';
  END IF;
  
  -- Check if share has view permissions
  IF NOT ('view' = ANY(share_record.permissions) OR 
          'comment' = ANY(share_record.permissions) OR 
          'edit' = ANY(share_record.permissions)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Return blocks
  RETURN QUERY
  SELECT 
    b.id,
    b.document_id,
    b.type,
    b.content,
    b.metadata,
    b.position,
    b.parent_id,
    b.created_at,
    b.updated_at
  FROM blocks b
  WHERE b.document_id = p_document_id
    AND b.deleted_at IS NULL
  ORDER BY b.position;
END;
$$;

-- Create helper function to get profile data
CREATE OR REPLACE FUNCTION get_shared_document_profile(
  p_user_id UUID
)
RETURNS TABLE (
  username TEXT,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    p.display_name
  FROM profiles p
  WHERE p.id = p_user_id
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_shared_document TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_profile TO anon, authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_shares_lookup 
ON document_shares(share_code, is_active, expires_at)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_document_shares_document 
ON document_shares(document_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_share_users_lookup
ON document_share_users(share_id, user_id);

-- Add comment explaining the security model
COMMENT ON FUNCTION get_shared_document IS 'Securely retrieves document content for valid share codes, bypassing RLS in a controlled manner';
COMMENT ON FUNCTION get_shared_document_blocks IS 'Retrieves blocks for documents with valid share access';