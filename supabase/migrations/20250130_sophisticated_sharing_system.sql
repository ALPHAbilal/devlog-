-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS share_access_logs CASCADE;
DROP TABLE IF EXISTS document_share_users CASCADE;
DROP TABLE IF EXISTS share_recipients CASCADE;
DROP TABLE IF EXISTS team_shares CASCADE;
DROP TABLE IF EXISTS document_shares CASCADE;

-- Create enhanced document_shares table
CREATE TABLE document_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  share_code VARCHAR(20) UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text || clock_timestamp()::text), 1, 3) || '-' || substring(md5(random()::text), 1, 3) || '-' || substring(md5(random()::text), 1, 3)),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Sharing mode: 'public', 'team', 'private'
  share_mode VARCHAR(10) NOT NULL DEFAULT 'public' CHECK (share_mode IN ('public', 'team', 'private')),
  
  -- Permissions array
  permissions TEXT[] NOT NULL DEFAULT ARRAY['view'] CHECK (permissions <@ ARRAY['view', 'comment', 'edit', 'download']),
  
  -- Security settings
  password_hash TEXT,
  require_auth BOOLEAN DEFAULT false,
  
  -- Expiration and limits
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER DEFAULT 0,
  
  -- Advanced settings
  settings JSONB DEFAULT '{}',
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Create team_shares table for team-based sharing
CREATE TABLE team_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  team_id UUID NOT NULL,
  team_name VARCHAR(255),
  team_domain VARCHAR(255), -- For domain-based access
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(share_id, team_id)
);

-- Create share_recipients table for private sharing
CREATE TABLE share_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  
  -- Invitation tracking
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  -- Personal access settings
  personal_permissions TEXT[] CHECK (personal_permissions <@ ARRAY['view', 'comment', 'edit', 'download']),
  personal_message TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(share_id, email)
);

-- Create share_access_logs table
CREATE TABLE share_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Who accessed
  accessed_by UUID REFERENCES auth.users(id),
  anonymous_id TEXT,
  
  -- Access details
  action VARCHAR(50) NOT NULL DEFAULT 'view',
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_share_code ON document_shares(share_code);
CREATE INDEX idx_document_shares_created_by ON document_shares(created_by);
CREATE INDEX idx_document_shares_share_mode ON document_shares(share_mode);
CREATE INDEX idx_document_shares_is_active ON document_shares(is_active);
CREATE INDEX idx_document_shares_expires_at ON document_shares(expires_at);

CREATE INDEX idx_team_shares_share_id ON team_shares(share_id);
CREATE INDEX idx_team_shares_team_id ON team_shares(team_id);
CREATE INDEX idx_team_shares_team_domain ON team_shares(team_domain);

CREATE INDEX idx_share_recipients_share_id ON share_recipients(share_id);
CREATE INDEX idx_share_recipients_email ON share_recipients(email);
CREATE INDEX idx_share_recipients_user_id ON share_recipients(user_id);

CREATE INDEX idx_share_access_logs_share_id ON share_access_logs(share_id);
CREATE INDEX idx_share_access_logs_document_id ON share_access_logs(document_id);
CREATE INDEX idx_share_access_logs_accessed_by ON share_access_logs(accessed_by);
CREATE INDEX idx_share_access_logs_accessed_at ON share_access_logs(accessed_at);

-- Enable RLS on all tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_shares
-- Owners can do everything with their shares
CREATE POLICY "Owners have full access to their shares" ON document_shares
  FOR ALL USING (created_by = auth.uid());

-- Users can view active shares they have access to
CREATE POLICY "Users can view shares they have access to" ON document_shares
  FOR SELECT USING (
    is_active = true
    AND (
      -- Public shares are visible to all
      share_mode = 'public'
      -- Or user is the creator
      OR created_by = auth.uid()
      -- Or user has been granted access (checked via RPC)
      OR EXISTS (
        SELECT 1 FROM share_recipients sr 
        WHERE sr.share_id = document_shares.id 
        AND sr.user_id = auth.uid() 
        AND sr.is_active = true
      )
    )
  );

-- RLS Policies for team_shares
CREATE POLICY "Share creators can manage team shares" ON team_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_shares ds 
      WHERE ds.id = team_shares.share_id 
      AND ds.created_by = auth.uid()
    )
  );

-- RLS Policies for share_recipients
CREATE POLICY "Share creators can manage recipients" ON share_recipients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM document_shares ds 
      WHERE ds.id = share_recipients.share_id 
      AND ds.created_by = auth.uid()
    )
  );

CREATE POLICY "Recipients can view their own invitations" ON share_recipients
  FOR SELECT USING (
    user_id = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policies for share_access_logs
CREATE POLICY "Share creators can view access logs" ON share_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_shares ds 
      WHERE ds.id = share_access_logs.share_id 
      AND ds.created_by = auth.uid()
    )
  );

CREATE POLICY "System can insert access logs" ON share_access_logs
  FOR INSERT WITH CHECK (true);

-- Create the main RPC function for accessing shared documents
CREATE OR REPLACE FUNCTION access_shared_document(
  p_share_code VARCHAR,
  p_password TEXT DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL
) RETURNS TABLE (
  document_id UUID,
  title TEXT,
  content JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID,
  permissions TEXT[],
  share_settings JSONB,
  share_mode VARCHAR,
  is_expired BOOLEAN,
  requires_auth BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_record RECORD;
  v_current_user_id UUID;
  v_current_user_email TEXT;
  v_has_access BOOLEAN := false;
  v_is_expired BOOLEAN := false;
BEGIN
  -- Get current user info if authenticated
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NOT NULL THEN
    SELECT email INTO v_current_user_email 
    FROM auth.users 
    WHERE id = v_current_user_id;
  ELSE
    v_current_user_email := p_user_email;
  END IF;

  -- Get share record
  SELECT 
    ds.*,
    d.id as doc_id,
    d.title as doc_title,
    d.content as doc_content,
    d.tags as doc_tags,
    d.created_at as doc_created_at,
    d.updated_at as doc_updated_at,
    d.user_id as doc_user_id
  INTO v_share_record
  FROM document_shares ds
  JOIN documents d ON d.id = ds.document_id
  WHERE ds.share_code = p_share_code
    AND ds.is_active = true
    AND d.deleted_at IS NULL;

  -- Check if share exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Share not found or document has been deleted';
  END IF;

  -- Check expiration
  IF v_share_record.expires_at IS NOT NULL AND v_share_record.expires_at < now() THEN
    v_is_expired := true;
    RAISE EXCEPTION 'Share link has expired';
  END IF;

  -- Check view limit
  IF v_share_record.max_views IS NOT NULL AND v_share_record.view_count >= v_share_record.max_views THEN
    RAISE EXCEPTION 'Share link has reached its view limit';
  END IF;

  -- Check password if required
  IF v_share_record.password_hash IS NOT NULL THEN
    IF p_password IS NULL THEN
      RAISE EXCEPTION 'Password required';
    END IF;
    -- Password verification would happen here
    -- For now, we'll do a simple check (in production, use proper password hashing)
    IF v_share_record.password_hash != p_password THEN
      RAISE EXCEPTION 'Invalid password';
    END IF;
  END IF;

  -- Determine access based on share mode
  CASE v_share_record.share_mode
    WHEN 'public' THEN
      -- Public shares don't require authentication unless specified
      IF v_share_record.require_auth AND v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
      END IF;
      v_has_access := true;
      
    WHEN 'team' THEN
      -- Check if user belongs to allowed team
      IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required for team shares';
      END IF;
      
      -- Check team membership (simplified - would check actual team membership)
      v_has_access := EXISTS (
        SELECT 1 FROM team_shares ts
        WHERE ts.share_id = v_share_record.id
          AND (
            -- Check by team_id if you have a team membership table
            -- OR check by domain
            (ts.team_domain IS NOT NULL AND v_current_user_email LIKE '%@' || ts.team_domain)
          )
      );
      
      IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: Not a member of the allowed team';
      END IF;
      
    WHEN 'private' THEN
      -- Check if user is in recipients list
      IF v_current_user_id IS NULL AND v_current_user_email IS NULL THEN
        RAISE EXCEPTION 'Authentication or email required for private shares';
      END IF;
      
      v_has_access := EXISTS (
        SELECT 1 FROM share_recipients sr
        WHERE sr.share_id = v_share_record.id
          AND sr.is_active = true
          AND (
            (sr.user_id IS NOT NULL AND sr.user_id = v_current_user_id)
            OR (sr.email = v_current_user_email)
          )
      );
      
      IF NOT v_has_access THEN
        RAISE EXCEPTION 'Access denied: You are not authorized to view this document';
      END IF;
  END CASE;

  -- If we get here, access is granted
  -- Increment view count
  UPDATE document_shares 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = v_share_record.id;

  -- Return document data
  RETURN QUERY
  SELECT 
    v_share_record.doc_id,
    v_share_record.doc_title,
    v_share_record.doc_content,
    v_share_record.doc_tags,
    v_share_record.doc_created_at,
    v_share_record.doc_updated_at,
    v_share_record.doc_user_id,
    v_share_record.permissions,
    v_share_record.settings,
    v_share_record.share_mode,
    v_is_expired,
    v_share_record.require_auth;
END;
$$;

-- Function to get document blocks for shared documents
CREATE OR REPLACE FUNCTION get_shared_document_blocks(
  p_share_code VARCHAR,
  p_document_id UUID
) RETURNS TABLE (
  id UUID,
  content TEXT,
  type VARCHAR,
  metadata JSONB,
  position INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the share code matches the document
  IF NOT EXISTS (
    SELECT 1 FROM document_shares ds
    WHERE ds.share_code = p_share_code
      AND ds.document_id = p_document_id
      AND ds.is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid share code for document';
  END IF;

  -- Return blocks
  RETURN QUERY
  SELECT 
    b.id,
    b.content,
    b.type,
    b.metadata,
    b.position,
    b.created_at,
    b.updated_at
  FROM blocks b
  WHERE b.document_id = p_document_id
    AND b.deleted_at IS NULL
  ORDER BY b.position ASC;
END;
$$;

-- Function to get user profile for shared documents
CREATE OR REPLACE FUNCTION get_shared_document_profile(
  p_user_id UUID
) RETURNS TABLE (
  username VARCHAR,
  display_name VARCHAR,
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
  WHERE p.id = p_user_id;
END;
$$;

-- Function to log share access
CREATE OR REPLACE FUNCTION log_share_access(
  p_share_id UUID,
  p_document_id UUID,
  p_action VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_anonymous_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID
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
    referrer,
    metadata
  ) VALUES (
    p_share_id,
    p_document_id,
    p_action,
    p_user_id,
    p_anonymous_id,
    p_ip_address::INET,
    p_user_agent,
    p_referrer,
    p_metadata
  );
END;
$$;

-- Function to create a share with all options
CREATE OR REPLACE FUNCTION create_document_share(
  p_document_id UUID,
  p_share_mode VARCHAR,
  p_permissions TEXT[],
  p_password TEXT DEFAULT NULL,
  p_require_auth BOOLEAN DEFAULT false,
  p_expires_in INTERVAL DEFAULT NULL,
  p_max_views INTEGER DEFAULT NULL,
  p_settings JSONB DEFAULT '{}',
  p_team_ids UUID[] DEFAULT NULL,
  p_team_domains TEXT[] DEFAULT NULL,
  p_recipient_emails TEXT[] DEFAULT NULL
) RETURNS TABLE (
  share_id UUID,
  share_code VARCHAR,
  share_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share_id UUID;
  v_share_code VARCHAR;
  v_expires_at TIMESTAMPTZ;
  v_password_hash TEXT;
BEGIN
  -- Check if user owns the document
  IF NOT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = p_document_id
      AND d.user_id = auth.uid()
      AND d.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Calculate expiration
  IF p_expires_in IS NOT NULL THEN
    v_expires_at := now() + p_expires_in;
  END IF;

  -- Hash password if provided (simplified - use proper hashing in production)
  IF p_password IS NOT NULL THEN
    v_password_hash := p_password; -- In production, use proper password hashing
  END IF;

  -- Create the share
  INSERT INTO document_shares (
    document_id,
    created_by,
    share_mode,
    permissions,
    password_hash,
    require_auth,
    expires_at,
    max_views,
    settings
  ) VALUES (
    p_document_id,
    auth.uid(),
    p_share_mode,
    p_permissions,
    v_password_hash,
    p_require_auth,
    v_expires_at,
    p_max_views,
    p_settings
  ) RETURNING id, share_code INTO v_share_id, v_share_code;

  -- Handle team shares
  IF p_share_mode = 'team' AND (p_team_ids IS NOT NULL OR p_team_domains IS NOT NULL) THEN
    -- Insert team IDs
    IF p_team_ids IS NOT NULL THEN
      INSERT INTO team_shares (share_id, team_id)
      SELECT v_share_id, unnest(p_team_ids);
    END IF;
    
    -- Insert team domains
    IF p_team_domains IS NOT NULL THEN
      INSERT INTO team_shares (share_id, team_domain)
      SELECT v_share_id, unnest(p_team_domains);
    END IF;
  END IF;

  -- Handle private shares
  IF p_share_mode = 'private' AND p_recipient_emails IS NOT NULL THEN
    INSERT INTO share_recipients (share_id, email)
    SELECT v_share_id, unnest(p_recipient_emails);
  END IF;

  -- Return share details
  RETURN QUERY
  SELECT 
    v_share_id,
    v_share_code,
    'https://www.devlog.design/shared/' || v_share_code;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION access_shared_document TO anon;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks TO anon;
GRANT EXECUTE ON FUNCTION get_shared_document_profile TO anon;
GRANT EXECUTE ON FUNCTION log_share_access TO anon;
GRANT EXECUTE ON FUNCTION create_document_share TO authenticated;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();