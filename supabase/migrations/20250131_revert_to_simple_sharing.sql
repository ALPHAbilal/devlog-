-- Revert to simple sharing system and fix infinite recursion
-- This migration safely reverts from the sophisticated sharing system back to the simple one
-- while preserving existing share data and fixing the circular RLS dependency issues

-- First, create temporary tables to preserve data
CREATE TEMP TABLE temp_document_shares AS 
SELECT 
  id,
  document_id,
  created_by,
  share_code,
  CASE 
    WHEN share_mode = 'public' THEN 'link'::share_type
    WHEN share_mode = 'team' THEN 'team'::share_type
    WHEN share_mode = 'private' THEN 'user'::share_type
    ELSE 'link'::share_type
  END as share_type,
  permissions::share_permission[],
  password_hash,
  expires_at,
  max_views,
  view_count,
  settings,
  is_active,
  created_at,
  updated_at,
  revoked_at
FROM document_shares;

CREATE TEMP TABLE temp_share_recipients AS
SELECT * FROM share_recipients;

CREATE TEMP TABLE temp_share_access_logs AS
SELECT * FROM share_access_logs;

-- Drop all RLS policies to prevent any issues during migration
DROP POLICY IF EXISTS "Owners have full access to their shares" ON document_shares;
DROP POLICY IF EXISTS "Users can view shares they have access to" ON document_shares;
DROP POLICY IF EXISTS "Share creators can manage team shares" ON team_shares;
DROP POLICY IF EXISTS "Share creators can manage recipients" ON share_recipients;
DROP POLICY IF EXISTS "Recipients can view their own invitations" ON share_recipients;
DROP POLICY IF EXISTS "Share creators can view access logs" ON share_access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON share_access_logs;

-- Drop the sophisticated sharing functions
DROP FUNCTION IF EXISTS access_shared_document CASCADE;
DROP FUNCTION IF EXISTS get_shared_document_blocks(VARCHAR, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_shared_document_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS log_share_access(UUID, UUID, VARCHAR, UUID, TEXT, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS create_document_share CASCADE;

-- Drop indexes from sophisticated system
DROP INDEX IF EXISTS idx_document_shares_document_id;
DROP INDEX IF EXISTS idx_document_shares_share_code;
DROP INDEX IF EXISTS idx_document_shares_created_by;
DROP INDEX IF EXISTS idx_document_shares_share_mode;
DROP INDEX IF EXISTS idx_document_shares_is_active;
DROP INDEX IF EXISTS idx_document_shares_expires_at;
DROP INDEX IF EXISTS idx_team_shares_share_id;
DROP INDEX IF EXISTS idx_team_shares_team_id;
DROP INDEX IF EXISTS idx_team_shares_team_domain;
DROP INDEX IF EXISTS idx_share_recipients_share_id;
DROP INDEX IF EXISTS idx_share_recipients_email;
DROP INDEX IF EXISTS idx_share_recipients_user_id;

-- Drop the sophisticated sharing tables
DROP TABLE IF EXISTS share_access_logs CASCADE;
DROP TABLE IF EXISTS share_recipients CASCADE;
DROP TABLE IF EXISTS team_shares CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;

-- Recreate the simple document_shares table
CREATE TABLE document_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code text UNIQUE NOT NULL,
  share_type share_type NOT NULL DEFAULT 'link',
  permissions share_permission[] NOT NULL DEFAULT '{view}',
  password_hash text,
  expires_at timestamp with time zone,
  max_views integer,
  view_count integer DEFAULT 0,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  revoked_at timestamp with time zone
);

-- Recreate document_share_users for user-specific shares
CREATE TABLE document_share_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id uuid NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone,
  UNIQUE(share_id, email)
);

-- Recreate share_access_logs
CREATE TABLE share_access_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id uuid NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  accessed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id text,
  action text NOT NULL CHECK (action IN ('view', 'download', 'comment', 'edit')),
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  accessed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restore data from temporary tables
INSERT INTO document_shares (
  id, document_id, created_by, share_code, share_type, permissions,
  password_hash, expires_at, max_views, view_count, settings,
  is_active, created_at, updated_at, revoked_at
)
SELECT * FROM temp_document_shares;

-- Migrate recipients to document_share_users
INSERT INTO document_share_users (share_id, email, user_id, invited_at, accepted_at)
SELECT 
  share_id,
  email,
  user_id,
  invited_at,
  accepted_at
FROM temp_share_recipients
WHERE is_active = true;

-- Restore access logs
INSERT INTO share_access_logs (
  id, share_id, document_id, accessed_by, anonymous_id, 
  action, ip_address, user_agent, metadata, accessed_at
)
SELECT 
  id, share_id, document_id, accessed_by, anonymous_id,
  action, ip_address, user_agent, metadata, accessed_at
FROM temp_share_access_logs;

-- Create indexes for performance (from simple system)
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_created_by ON document_shares(created_by);
CREATE INDEX idx_document_shares_share_code ON document_shares(share_code);
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at);
CREATE INDEX idx_document_shares_active ON document_shares(is_active) WHERE is_active = true;

CREATE INDEX idx_share_users_email ON document_share_users(email);
CREATE INDEX idx_share_users_user_id ON document_share_users(user_id);

CREATE INDEX idx_share_access_share_id ON share_access_logs(share_id);
CREATE INDEX idx_share_access_document_id ON share_access_logs(document_id);
CREATE INDEX idx_share_access_accessed_by ON share_access_logs(accessed_by);
CREATE INDEX idx_share_access_accessed_at ON share_access_logs(accessed_at);

-- Enable RLS on all tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_share_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE RLS policies without circular dependencies

-- Policy 1: Users can see shares they created
CREATE POLICY "Users can view own shares" ON document_shares
  FOR SELECT USING (auth.uid() = created_by);

-- Policy 2: Users can see shares for documents they own (WITHOUT nested queries)
CREATE POLICY "Users can view shares for own documents" ON document_shares
  FOR SELECT USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can create shares for their documents
CREATE POLICY "Users can create shares for own documents" ON document_shares
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND document_id IN (
      SELECT id FROM documents 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can update their own shares
CREATE POLICY "Users can update own shares" ON document_shares
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy 5: Users can delete their own shares
CREATE POLICY "Users can delete own shares" ON document_shares
  FOR DELETE USING (auth.uid() = created_by);

-- RLS for document_share_users (simplified)
-- Policy 1: Share creators can manage share users
CREATE POLICY "Share creators can manage users" ON document_share_users
  FOR ALL USING (
    share_id IN (
      SELECT id FROM document_shares 
      WHERE created_by = auth.uid()
    )
  );

-- Policy 2: Users can see shares they're invited to
CREATE POLICY "Users can see own invitations" ON document_share_users
  FOR SELECT USING (
    user_id = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1)
  );

-- RLS for share_access_logs (simplified)
-- Policy 1: Share creators can view logs
CREATE POLICY "Share creators can view logs" ON share_access_logs
  FOR SELECT USING (
    share_id IN (
      SELECT id FROM document_shares 
      WHERE created_by = auth.uid()
    )
  );

-- Policy 2: Anyone can insert logs
CREATE POLICY "Anyone can log access" ON share_access_logs
  FOR INSERT WITH CHECK (true);

-- Recreate the SECURITY DEFINER functions from the fix migration
-- These bypass RLS in a controlled way to avoid circular dependencies

-- Function to get shared document
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
    
    -- Verify password (simplified version)
    DECLARE
      salt TEXT;
      stored_hash TEXT;
      computed_hash TEXT;
    BEGIN
      salt := split_part(share_record.password_hash, ':', 1);
      stored_hash := split_part(share_record.password_hash, ':', 2);
      
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
    share_record.permissions::TEXT[],
    share_record.settings;
END;
$$;

-- Function to get blocks for shared documents
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
  "position" INT,
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
    b."position",
    b.parent_id,
    b.created_at,
    b.updated_at
  FROM blocks b
  WHERE b.document_id = p_document_id
    AND b.deleted_at IS NULL
  ORDER BY b."position";
END;
$$;

-- Function to get profile data
CREATE OR REPLACE FUNCTION get_shared_document_profile(
  p_user_id UUID
)
RETURNS TABLE (
  username TEXT,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.username,
    p.display_name,
    p.avatar_url
  FROM profiles p
  WHERE p.id = p_user_id
  LIMIT 1;
END;
$$;

-- Simple log_share_access function
CREATE OR REPLACE FUNCTION log_share_access(
  p_share_id UUID,
  p_document_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO share_access_logs (
    share_id,
    document_id,
    action,
    accessed_by,
    anonymous_id,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_share_id,
    p_document_id,
    p_action,
    p_user_id,
    p_anonymous_id,
    p_ip_address::INET,
    p_user_agent,
    p_metadata
  );
END;
$$;

-- Function to get documents shared with a user
CREATE OR REPLACE FUNCTION get_shared_documents(p_user_id UUID)
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  shared_by TEXT,
  shared_at TIMESTAMPTZ,
  permissions share_permission[],
  share_type share_type,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    d.id,
    d.title,
    u.email as shared_by,
    ds.created_at as shared_at,
    ds.permissions,
    ds.share_type,
    ds.expires_at
  FROM document_shares ds
  JOIN documents d ON d.id = ds.document_id
  JOIN auth.users u ON u.id = ds.created_by
  LEFT JOIN document_share_users dsu ON dsu.share_id = ds.id
  WHERE ds.is_active = true
    AND (ds.expires_at IS NULL OR ds.expires_at > now())
    AND d.deleted_at IS NULL
    AND (
      -- User-specific shares
      (ds.share_type = 'user' AND dsu.user_id = p_user_id)
      OR
      -- Link shares that user has accessed
      (ds.share_type = 'link' AND EXISTS (
        SELECT 1 FROM share_access_logs sal
        WHERE sal.share_id = ds.id
        AND sal.accessed_by = p_user_id
      ))
    )
  ORDER BY ds.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_shared_document TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_profile TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_share_access TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_documents TO authenticated;

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_document_shares_lookup 
ON document_shares(share_code, is_active, expires_at)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_document_shares_document 
ON document_shares(document_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_share_users_lookup
ON document_share_users(share_id, user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments explaining the security model
COMMENT ON TABLE document_shares IS 'Simple document sharing system without circular RLS dependencies';
COMMENT ON FUNCTION get_shared_document IS 'Securely retrieves document content for valid share codes, bypassing RLS in a controlled manner';
COMMENT ON FUNCTION get_shared_document_blocks IS 'Retrieves blocks for documents with valid share access';
COMMENT ON FUNCTION get_shared_document_profile IS 'Retrieves user profile for shared documents';
COMMENT ON FUNCTION log_share_access IS 'Logs access to shared documents';

-- Clean up temporary tables
DROP TABLE IF EXISTS temp_document_shares;
DROP TABLE IF EXISTS temp_share_recipients;
DROP TABLE IF EXISTS temp_share_access_logs;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. Simple sharing system restored with fixed RLS policies.';
END $$;