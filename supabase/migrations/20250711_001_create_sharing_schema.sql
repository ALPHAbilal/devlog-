-- Create sharing schema for document collaboration
-- This migration creates all necessary tables for the sharing functionality

-- Create enum for share permissions
CREATE TYPE share_permission AS ENUM ('view', 'comment', 'edit', 'download');

-- Create enum for share types
CREATE TYPE share_type AS ENUM ('link', 'user', 'team', 'public');

-- Main document shares table
CREATE TABLE IF NOT EXISTS document_shares (
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

-- User-specific shares
CREATE TABLE IF NOT EXISTS document_share_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id uuid NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at timestamp with time zone,
  UNIQUE(share_id, email)
);

-- Share access logs for analytics
CREATE TABLE IF NOT EXISTS share_access_logs (
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

-- Comments on shared documents
CREATE TABLE IF NOT EXISTS document_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  share_id uuid REFERENCES document_shares(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  content text NOT NULL,
  thread_id uuid,
  parent_id uuid REFERENCES document_comments(id) ON DELETE CASCADE,
  resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
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

CREATE INDEX idx_comments_document_id ON document_comments(document_id);
CREATE INDEX idx_comments_block_id ON document_comments(block_id);
CREATE INDEX idx_comments_thread_id ON document_comments(thread_id);
CREATE INDEX idx_comments_parent_id ON document_comments(parent_id);

-- Enable RLS on all tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_share_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_shares
-- Users can see shares they created
CREATE POLICY "Users can view own shares" ON document_shares
  FOR SELECT USING (auth.uid() = created_by);

-- Users can see shares for their documents
CREATE POLICY "Users can view shares for own documents" ON document_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
  );

-- Users can create shares for their documents
CREATE POLICY "Users can create shares for own documents" ON document_shares
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_shares.document_id 
      AND documents.user_id = auth.uid()
    )
    AND auth.uid() = created_by
  );

-- Users can update their own shares
CREATE POLICY "Users can update own shares" ON document_shares
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares" ON document_shares
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for document_share_users
-- Share creators can manage share users
CREATE POLICY "Share creators can manage users" ON document_share_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.id = document_share_users.share_id 
      AND document_shares.created_by = auth.uid()
    )
  );

-- Users can see shares they're invited to
CREATE POLICY "Users can see own invitations" ON document_share_users
  FOR SELECT USING (
    auth.jwt() ->> 'email' = email 
    OR user_id = auth.uid()
  );

-- RLS Policies for share_access_logs
-- Share creators can view access logs
CREATE POLICY "Share creators can view logs" ON share_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.id = share_access_logs.share_id 
      AND document_shares.created_by = auth.uid()
    )
  );

-- Anyone can insert logs (for tracking access)
CREATE POLICY "Anyone can log access" ON share_access_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for document_comments
-- Users can view comments on documents they have access to
CREATE POLICY "Users can view accessible comments" ON document_comments
  FOR SELECT USING (
    -- Own documents
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_comments.document_id 
      AND documents.user_id = auth.uid()
    )
    OR
    -- Shared documents with comment permission
    EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.id = document_comments.share_id 
      AND document_shares.is_active = true
      AND ('comment' = ANY(document_shares.permissions) OR 'edit' = ANY(document_shares.permissions))
    )
  );

-- Users can create comments on documents they have permission to
CREATE POLICY "Users can create comments" ON document_comments
  FOR INSERT WITH CHECK (
    -- Own documents
    EXISTS (
      SELECT 1 FROM documents 
      WHERE documents.id = document_comments.document_id 
      AND documents.user_id = auth.uid()
    )
    OR
    -- Shared documents with comment permission
    EXISTS (
      SELECT 1 FROM document_shares 
      WHERE document_shares.id = document_comments.share_id 
      AND document_shares.is_active = true
      AND ('comment' = ANY(document_shares.permissions) OR 'edit' = ANY(document_shares.permissions))
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON document_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON document_comments
  FOR DELETE USING (user_id = auth.uid());

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer;
BEGIN
  -- Generate XXX-XXX-XXX format
  FOR i IN 1..9 LOOP
    IF i IN (4, 7) THEN
      result := result || '-';
    END IF;
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check share access
CREATE OR REPLACE FUNCTION check_share_access(
  p_share_code text,
  p_password text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  has_access boolean,
  share_id uuid,
  document_id uuid,
  permissions share_permission[],
  requires_password boolean,
  message text
) AS $$
DECLARE
  v_share record;
BEGIN
  -- Get share details
  SELECT * INTO v_share 
  FROM document_shares 
  WHERE share_code = p_share_code 
  AND is_active = true;

  -- Check if share exists
  IF v_share IS NULL THEN
    RETURN QUERY SELECT 
      false::boolean,
      NULL::uuid,
      NULL::uuid,
      NULL::share_permission[],
      false::boolean,
      'Share not found or inactive'::text;
    RETURN;
  END IF;

  -- Check expiration
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN
    RETURN QUERY SELECT 
      false::boolean,
      v_share.id,
      v_share.document_id,
      v_share.permissions,
      false::boolean,
      'Share has expired'::text;
    RETURN;
  END IF;

  -- Check view limit
  IF v_share.max_views IS NOT NULL AND v_share.view_count >= v_share.max_views THEN
    RETURN QUERY SELECT 
      false::boolean,
      v_share.id,
      v_share.document_id,
      v_share.permissions,
      false::boolean,
      'Share view limit reached'::text;
    RETURN;
  END IF;

  -- Check password
  IF v_share.password_hash IS NOT NULL THEN
    IF p_password IS NULL THEN
      RETURN QUERY SELECT 
        false::boolean,
        v_share.id,
        v_share.document_id,
        v_share.permissions,
        true::boolean,
        'Password required'::text;
      RETURN;
    END IF;
    
    -- In production, use proper password hashing
    IF v_share.password_hash != crypt(p_password, v_share.password_hash) THEN
      RETURN QUERY SELECT 
        false::boolean,
        v_share.id,
        v_share.document_id,
        v_share.permissions,
        true::boolean,
        'Invalid password'::text;
      RETURN;
    END IF;
  END IF;

  -- Check user-specific share
  IF v_share.share_type = 'user' THEN
    IF p_user_id IS NULL THEN
      RETURN QUERY SELECT 
        false::boolean,
        v_share.id,
        v_share.document_id,
        v_share.permissions,
        false::boolean,
        'Authentication required'::text;
      RETURN;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM document_share_users 
      WHERE share_id = v_share.id 
      AND user_id = p_user_id
    ) THEN
      RETURN QUERY SELECT 
        false::boolean,
        v_share.id,
        v_share.document_id,
        v_share.permissions,
        false::boolean,
        'User not authorized for this share'::text;
      RETURN;
    END IF;
  END IF;

  -- Check authentication requirement
  IF (v_share.settings->>'requireAuth')::boolean AND p_user_id IS NULL THEN
    RETURN QUERY SELECT 
      false::boolean,
      v_share.id,
      v_share.document_id,
      v_share.permissions,
      false::boolean,
      'Authentication required'::text;
    RETURN;
  END IF;

  -- Access granted
  RETURN QUERY SELECT 
    true::boolean,
    v_share.id,
    v_share.document_id,
    v_share.permissions,
    false::boolean,
    'Access granted'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log share access
CREATE OR REPLACE FUNCTION log_share_access(
  p_share_id uuid,
  p_document_id uuid,
  p_action text,
  p_user_id uuid DEFAULT NULL,
  p_anonymous_id text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  -- Insert access log
  INSERT INTO share_access_logs (
    share_id, document_id, action, accessed_by, 
    anonymous_id, ip_address, user_agent, metadata
  ) VALUES (
    p_share_id, p_document_id, p_action, p_user_id,
    p_anonymous_id, p_ip_address, p_user_agent, p_metadata
  );

  -- Increment view count if action is 'view'
  IF p_action = 'view' THEN
    UPDATE document_shares 
    SET view_count = view_count + 1
    WHERE id = p_share_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get documents shared with a user
CREATE OR REPLACE FUNCTION get_shared_documents(p_user_id uuid)
RETURNS TABLE (
  document_id uuid,
  title text,
  shared_by text,
  shared_at timestamp with time zone,
  permissions share_permission[],
  share_type share_type,
  expires_at timestamp with time zone
) AS $$
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
    AND (
      -- Public shares
      ds.share_type = 'public'
      OR
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate share codes
CREATE OR REPLACE FUNCTION trigger_generate_share_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    LOOP
      NEW.share_code := generate_share_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM document_shares 
        WHERE share_code = NEW.share_code
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_share_code_trigger
  BEFORE INSERT ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_share_code();

-- Trigger to update updated_at timestamp
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

CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();