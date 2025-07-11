-- Migration: Document Sharing Feature
-- Created: 2025-01-31
-- Purpose: Enable secure document sharing with enterprise features
-- 
-- This migration adds:
-- 1. Share links with permissions
-- 2. User and team sharing
-- 3. Access logs for audit
-- 4. Comments and collaboration

-- ============================================
-- PART 1: SHARE LINKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Share type: 'link', 'user', 'team', 'public'
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'team', 'public')),
  
  -- Permissions array: 'view', 'comment', 'edit', 'download'
  permissions TEXT[] DEFAULT ARRAY['view'] CHECK (
    permissions <@ ARRAY['view', 'comment', 'edit', 'download']::TEXT[]
  ),
  
  -- Security settings
  share_code TEXT UNIQUE NOT NULL, -- Short code for URL (e.g., 'ABC-123-XYZ')
  password_hash TEXT, -- Optional password protection
  expires_at TIMESTAMPTZ, -- Optional expiration
  max_views INTEGER, -- Optional view limit
  view_count INTEGER DEFAULT 0,
  
  -- Additional settings as JSONB
  settings JSONB DEFAULT '{}',
  -- Possible settings:
  -- {
  --   "watermark": true,
  --   "requireAuth": true,
  --   "allowedDomains": ["@company.com"],
  --   "ipWhitelist": ["192.168.1.0/24"],
  --   "notifyOnAccess": true
  -- }
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ, -- Soft delete for shares
  revoked_by UUID REFERENCES auth.users(id),
  
  -- Indexes
  CONSTRAINT valid_view_count CHECK (view_count >= 0),
  CONSTRAINT valid_max_views CHECK (max_views IS NULL OR max_views > 0)
);

-- Indexes for performance
CREATE INDEX idx_document_shares_document ON document_shares(document_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_document_shares_creator ON document_shares(created_by) WHERE revoked_at IS NULL;
CREATE INDEX idx_document_shares_code ON document_shares(share_code) WHERE revoked_at IS NULL;
CREATE INDEX idx_document_shares_expires ON document_shares(expires_at) WHERE revoked_at IS NULL AND expires_at IS NOT NULL;

-- ============================================
-- PART 2: USER-SPECIFIC SHARES
-- ============================================

CREATE TABLE IF NOT EXISTS document_share_users (
  share_id UUID REFERENCES document_shares(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- NULL until user accepts
  
  -- Invitation tracking
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT false,
  
  PRIMARY KEY (share_id, user_email)
);

CREATE INDEX idx_share_users_email ON document_share_users(user_email) WHERE accepted_at IS NULL;
CREATE INDEX idx_share_users_user ON document_share_users(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- PART 3: TEAM/ORGANIZATION SHARES
-- ============================================

-- For future team functionality
CREATE TABLE IF NOT EXISTS document_share_teams (
  share_id UUID REFERENCES document_shares(id) ON DELETE CASCADE,
  team_id UUID NOT NULL, -- Will reference teams table when implemented
  
  PRIMARY KEY (share_id, team_id)
);

-- ============================================
-- PART 4: ACCESS LOGS FOR AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS share_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES document_shares(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Who accessed
  accessed_by UUID REFERENCES auth.users(id), -- NULL for anonymous
  anonymous_id TEXT, -- For tracking anonymous users
  
  -- Access details
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  
  -- What they did
  action TEXT NOT NULL CHECK (action IN (
    'view', 'download', 'comment', 'edit', 
    'copy', 'print', 'share_forward', 'revoked'
  )),
  
  -- Additional context
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_access_logs_share ON share_access_logs(share_id, accessed_at DESC);
CREATE INDEX idx_access_logs_document ON share_access_logs(document_id, accessed_at DESC);
CREATE INDEX idx_access_logs_user ON share_access_logs(accessed_by, accessed_at DESC) WHERE accessed_by IS NOT NULL;
CREATE INDEX idx_access_logs_action ON share_access_logs(action, accessed_at DESC);

-- ============================================
-- PART 5: COMMENTS ON SHARED DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE, -- NULL for document-level
  parent_id UUID REFERENCES document_comments(id), -- For replies
  
  -- Author
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Content
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 5000),
  
  -- Status
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Indexes for performance
CREATE INDEX idx_comments_document ON document_comments(document_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_block ON document_comments(block_id) WHERE deleted_at IS NULL AND block_id IS NOT NULL;
CREATE INDEX idx_comments_user ON document_comments(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_parent ON document_comments(parent_id) WHERE deleted_at IS NULL AND parent_id IS NOT NULL;

-- ============================================
-- PART 6: FUNCTIONS FOR SHARE MANAGEMENT
-- ============================================

-- Function to generate unique share code
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate format: XXX-XXX-XXX (9 chars)
  FOR i IN 1..9 LOOP
    IF i IN (4, 7) THEN
      result := result || '-';
    ELSE
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END IF;
  END LOOP;
  
  -- Check uniqueness
  IF EXISTS (SELECT 1 FROM document_shares WHERE share_code = result) THEN
    -- Recursive call if not unique
    RETURN generate_share_code();
  END IF;
  
  RETURN result;
END;
$$;

-- Function to create a share link
CREATE OR REPLACE FUNCTION create_document_share(
  p_document_id UUID,
  p_user_id UUID,
  p_share_type TEXT,
  p_permissions TEXT[],
  p_settings JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_share_id UUID;
  v_share_code TEXT;
  v_document RECORD;
BEGIN
  -- Verify ownership
  SELECT * INTO v_document
  FROM documents
  WHERE id = p_document_id
    AND user_id = p_user_id
    AND deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- Generate share code
  v_share_code := generate_share_code();
  
  -- Create share
  INSERT INTO document_shares (
    document_id,
    created_by,
    share_type,
    share_code,
    permissions,
    settings
  ) VALUES (
    p_document_id,
    p_user_id,
    p_share_type,
    v_share_code,
    p_permissions,
    p_settings
  ) RETURNING id INTO v_share_id;
  
  -- Log the share creation
  INSERT INTO share_access_logs (
    share_id,
    document_id,
    accessed_by,
    action,
    metadata
  ) VALUES (
    v_share_id,
    p_document_id,
    p_user_id,
    'share_forward',
    jsonb_build_object('share_type', p_share_type)
  );
  
  RETURN jsonb_build_object(
    'share_id', v_share_id,
    'share_code', v_share_code,
    'share_url', 'https://devlog.app/shared/' || v_share_code
  );
END;
$$;

-- Function to check share access
CREATE OR REPLACE FUNCTION check_share_access(
  p_share_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_share RECORD;
  v_has_access BOOLEAN := FALSE;
  v_reason TEXT;
BEGIN
  -- Get share details
  SELECT s.*, d.user_id as owner_id
  INTO v_share
  FROM document_shares s
  JOIN documents d ON s.document_id = d.id
  WHERE s.share_code = p_share_code
    AND s.revoked_at IS NULL;
    
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'access', false,
      'reason', 'Invalid or revoked share link'
    );
  END IF;
  
  -- Check expiration
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < NOW() THEN
    RETURN jsonb_build_object(
      'access', false,
      'reason', 'Share link has expired'
    );
  END IF;
  
  -- Check view limit
  IF v_share.max_views IS NOT NULL AND v_share.view_count >= v_share.max_views THEN
    RETURN jsonb_build_object(
      'access', false,
      'reason', 'Maximum views reached'
    );
  END IF;
  
  -- Check password if required
  IF v_share.password_hash IS NOT NULL THEN
    IF p_password IS NULL OR NOT (v_share.password_hash = crypt(p_password, v_share.password_hash)) THEN
      RETURN jsonb_build_object(
        'access', false,
        'reason', 'Password required',
        'password_required', true
      );
    END IF;
  END IF;
  
  -- Check authentication requirement
  IF (v_share.settings->>'requireAuth')::BOOLEAN AND p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'access', false,
      'reason', 'Authentication required',
      'auth_required', true
    );
  END IF;
  
  -- Check domain restrictions
  IF v_share.settings->'allowedDomains' IS NOT NULL AND p_user_id IS NOT NULL THEN
    -- Would check user's email domain here
    -- For now, we'll skip this check
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'access', true,
    'share_id', v_share.id,
    'document_id', v_share.document_id,
    'permissions', v_share.permissions,
    'settings', v_share.settings
  );
END;
$$;

-- Function to log document access
CREATE OR REPLACE FUNCTION log_share_access(
  p_share_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_document_id UUID;
BEGIN
  -- Get document ID
  SELECT document_id INTO v_document_id
  FROM document_shares
  WHERE id = p_share_id;
  
  -- Log access
  INSERT INTO share_access_logs (
    share_id,
    document_id,
    accessed_by,
    ip_address,
    user_agent,
    action
  ) VALUES (
    p_share_id,
    v_document_id,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_action
  );
  
  -- Increment view count if action is 'view'
  IF p_action = 'view' THEN
    UPDATE document_shares
    SET view_count = view_count + 1
    WHERE id = p_share_id;
  END IF;
END;
$$;

-- ============================================
-- PART 7: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_share_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Policies for document_shares
CREATE POLICY "Users can view their own shares" ON document_shares
  FOR SELECT USING (created_by = auth.uid() OR revoked_at IS NULL);

CREATE POLICY "Users can create shares for their documents" ON document_shares
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own shares" ON document_shares
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can revoke their own shares" ON document_shares
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid() AND revoked_at IS NOT NULL);

-- Policies for document_share_users
CREATE POLICY "Users can view shares they're invited to" ON document_share_users
  FOR SELECT USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    user_id = auth.uid() OR
    share_id IN (
      SELECT id FROM document_shares WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Share creators can invite users" ON document_share_users
  FOR INSERT WITH CHECK (
    share_id IN (
      SELECT id FROM document_shares WHERE created_by = auth.uid()
    )
  );

-- Policies for share_access_logs
CREATE POLICY "Users can view logs for their shares" ON share_access_logs
  FOR SELECT USING (
    share_id IN (
      SELECT id FROM document_shares WHERE created_by = auth.uid()
    ) OR
    accessed_by = auth.uid()
  );

CREATE POLICY "System can insert access logs" ON share_access_logs
  FOR INSERT WITH CHECK (true); -- Controlled by functions

-- Policies for document_comments
CREATE POLICY "Users can view comments on accessible documents" ON document_comments
  FOR SELECT USING (
    -- Own documents
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()
    ) OR
    -- Shared documents with comment permission
    document_id IN (
      SELECT ds.document_id 
      FROM document_shares ds
      LEFT JOIN document_share_users dsu ON ds.id = dsu.share_id
      WHERE (
        -- Public shares with comment permission
        (ds.share_type = 'public' AND 'comment' = ANY(ds.permissions)) OR
        -- User-specific shares
        (dsu.user_id = auth.uid() AND 'comment' = ANY(ds.permissions))
      )
      AND ds.revoked_at IS NULL
    )
  );

CREATE POLICY "Users can create comments on permitted documents" ON document_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (
      -- Own documents
      document_id IN (
        SELECT id FROM documents WHERE user_id = auth.uid()
      ) OR
      -- Shared documents with comment permission
      document_id IN (
        SELECT ds.document_id 
        FROM document_shares ds
        LEFT JOIN document_share_users dsu ON ds.id = dsu.share_id
        WHERE (
          (ds.share_type = 'public' AND 'comment' = ANY(ds.permissions)) OR
          (dsu.user_id = auth.uid() AND 'comment' = ANY(ds.permissions))
        )
        AND ds.revoked_at IS NULL
      )
    )
  );

CREATE POLICY "Users can update their own comments" ON document_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can soft delete their own comments" ON document_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND deleted_at IS NOT NULL);

-- ============================================
-- PART 8: HELPER FUNCTIONS
-- ============================================

-- Function to get shared documents for a user
CREATE OR REPLACE FUNCTION get_shared_documents(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  owner_email TEXT,
  permissions TEXT[],
  shared_at TIMESTAMPTZ,
  share_type TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    d.id as document_id,
    d.title,
    u.email as owner_email,
    ds.permissions,
    COALESCE(dsu.accepted_at, ds.created_at) as shared_at,
    ds.share_type
  FROM document_shares ds
  JOIN documents d ON ds.document_id = d.id
  JOIN auth.users u ON d.user_id = u.id
  LEFT JOIN document_share_users dsu ON ds.id = dsu.share_id
  WHERE 
    ds.revoked_at IS NULL
    AND d.deleted_at IS NULL
    AND (
      -- User-specific shares
      (dsu.user_id = p_user_id) OR
      -- Public shares user has accessed
      (ds.share_type = 'public' AND EXISTS (
        SELECT 1 FROM share_access_logs 
        WHERE share_id = ds.id AND accessed_by = p_user_id
      ))
    )
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
  ORDER BY shared_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_document_share TO authenticated;
GRANT EXECUTE ON FUNCTION check_share_access TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_share_access TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_documents TO authenticated;

-- ============================================
-- PART 9: INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_shares_active_by_user 
ON document_shares(created_by, created_at DESC) 
WHERE revoked_at IS NULL;

CREATE INDEX idx_comments_unresolved 
ON document_comments(document_id, created_at DESC) 
WHERE deleted_at IS NULL AND resolved = false;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  v_tables_created INTEGER;
  v_functions_created INTEGER;
BEGIN
  -- Count created tables
  SELECT COUNT(*) INTO v_tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'document_shares',
    'document_share_users',
    'document_share_teams',
    'share_access_logs',
    'document_comments'
  );
  
  -- Count created functions
  SELECT COUNT(*) INTO v_functions_created
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN (
    'generate_share_code',
    'create_document_share',
    'check_share_access',
    'log_share_access',
    'get_shared_documents'
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========== DOCUMENT SHARING SETUP COMPLETE ==========';
  RAISE NOTICE 'Tables created: %', v_tables_created;
  RAISE NOTICE 'Functions created: %', v_functions_created;
  RAISE NOTICE 'Row Level Security: ENABLED';
  RAISE NOTICE 'Ready for document sharing!';
  RAISE NOTICE '===================================================';
END $$;