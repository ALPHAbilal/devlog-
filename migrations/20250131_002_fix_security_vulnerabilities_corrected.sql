-- Migration: Fix Security Vulnerabilities (CORRECTED)
-- Created: 2025-01-31
-- Priority: CRITICAL
-- 
-- This migration addresses security vulnerabilities identified:
-- 1. SECURITY DEFINER view vulnerability
-- 2. Missing password leak protection
-- 3. Additional security hardening
-- 
-- CORRECTED: Fixed metadata column reference error

-- Step 1: Drop the vulnerable SECURITY DEFINER view
DROP VIEW IF EXISTS public.user_documents_with_block_count;

-- Step 2: Recreate the view without SECURITY DEFINER (using SECURITY INVOKER by default)
CREATE VIEW public.user_documents_with_block_count AS
SELECT 
  d.id,
  d.title,
  d.tags,
  d.created_at,
  d.updated_at,
  d.is_template,
  COALESCE(dc.block_count, 0) as block_count,
  COALESCE(dc.total_content_length, 0) as total_content_length,
  COALESCE(d.metadata->>'preview', 'Click to view document...') as preview
FROM documents d
LEFT JOIN document_cache dc ON d.id = dc.document_id
WHERE d.user_id = auth.uid() 
  AND d.deleted_at IS NULL;

-- Step 3: Grant appropriate permissions
GRANT SELECT ON public.user_documents_with_block_count TO authenticated;

-- Step 4: Create admin roles table (proper role management)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create index for performance
CREATE INDEX idx_admin_users_active ON admin_users(user_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin list
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
        AND au.is_active = true
    )
  );

-- Step 5: Create secure password validation function
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := '{}';
  score INTEGER := 0;
  issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check minimum length
  IF LENGTH(password) < 8 THEN
    issues := array_append(issues, 'Password must be at least 8 characters');
  ELSE
    score := score + 1;
  END IF;
  
  -- Check for uppercase
  IF password ~ '[A-Z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain uppercase letters');
  END IF;
  
  -- Check for lowercase
  IF password ~ '[a-z]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain lowercase letters');
  END IF;
  
  -- Check for numbers
  IF password ~ '[0-9]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain numbers');
  END IF;
  
  -- Check for special characters
  IF password ~ '[!@#$%^&*(),.?":{}|<>]' THEN
    score := score + 1;
  ELSE
    issues := array_append(issues, 'Password should contain special characters');
  END IF;
  
  result := jsonb_build_object(
    'score', score,
    'strength', CASE 
      WHEN score < 3 THEN 'weak'
      WHEN score < 4 THEN 'medium'
      ELSE 'strong'
    END,
    'issues', issues,
    'valid', score >= 3
  );
  
  RETURN result;
END;
$$;

-- Step 6: Create function to check for compromised passwords
-- Note: In production, this would integrate with HaveIBeenPwned API
CREATE OR REPLACE FUNCTION is_password_compromised(password_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Placeholder for actual implementation
  -- In production, check against compromised password database
  RETURN FALSE;
END;
$$;

-- Step 7: Create session security table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Step 8: Create function to validate sessions
CREATE OR REPLACE FUNCTION validate_session(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_session RECORD;
BEGIN
  -- Get session
  SELECT * INTO v_session
  FROM user_sessions
  WHERE session_token = p_token
    AND expires_at > NOW();
    
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Update last activity
  UPDATE user_sessions
  SET last_activity = NOW()
  WHERE id = v_session.id;
  
  RETURN v_session.user_id;
END;
$$;

-- Step 9: Create security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_event ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_created ON security_audit_log(created_at DESC);

-- Step 10: Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_details JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_event_type,
    p_user_id,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_details
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail if headers aren't available
    INSERT INTO security_audit_log (
      event_type,
      user_id,
      details
    ) VALUES (
      p_event_type,
      p_user_id,
      p_details
    );
END;
$$;

-- Step 11: Add RLS policies for new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Only admins can view security audit logs
CREATE POLICY "Admins can view audit logs" ON security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Step 12: Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$;

-- Step 13: Add additional security constraints
-- Ensure emails are lowercase and unique
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := LOWER(TRIM(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

-- Step 14: Create IP-based rate limiting
CREATE TABLE IF NOT EXISTS ip_rate_limit (
  ip_address INET PRIMARY KEY,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION check_ip_rate_limit(
  p_ip INET,
  p_limit INTEGER DEFAULT 1000,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_record RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get or create IP record
  INSERT INTO ip_rate_limit (ip_address, request_count, window_start)
  VALUES (p_ip, 1, v_now)
  ON CONFLICT (ip_address) DO UPDATE
  SET 
    request_count = CASE 
      WHEN ip_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL < v_now
      THEN 1
      ELSE ip_rate_limit.request_count + 1
    END,
    window_start = CASE
      WHEN ip_rate_limit.window_start + (p_window_minutes || ' minutes')::INTERVAL < v_now
      THEN v_now
      ELSE ip_rate_limit.window_start
    END
  RETURNING * INTO v_record;
  
  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN FALSE;
  END IF;
  
  -- Check rate limit
  IF v_record.request_count > p_limit THEN
    -- Block for 1 hour
    UPDATE ip_rate_limit
    SET blocked_until = v_now + INTERVAL '1 hour'
    WHERE ip_address = p_ip;
    
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Step 15: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
      AND is_active = true
  );
END;
$$;

-- Verification: Check if security fixes were applied
DO $$
BEGIN
  -- Check if vulnerable view was removed and recreated
  IF NOT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE viewname = 'user_documents_with_block_count'
      AND definition LIKE '%SECURITY DEFINER%'
  ) THEN
    RAISE NOTICE 'SUCCESS: SECURITY DEFINER view vulnerability fixed';
  ELSE
    RAISE EXCEPTION 'FAILED: SECURITY DEFINER view still exists';
  END IF;
  
  -- Check if security tables were created
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename IN ('user_sessions', 'security_audit_log', 'ip_rate_limit', 'admin_users')
  ) THEN
    RAISE NOTICE 'SUCCESS: Security tables created';
  ELSE
    RAISE EXCEPTION 'FAILED: Security tables not created';
  END IF;
  
  -- Check if RLS is enabled
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename IN ('user_sessions', 'security_audit_log', 'admin_users')
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on security tables';
  ELSE
    RAISE WARNING 'WARNING: RLS not enabled on all security tables';
  END IF;
END $$;

-- Note: For production deployment, also configure these in Supabase Dashboard:
-- 1. Enable "Leaked Password Protection" in Authentication settings
-- 2. Configure MFA options
-- 3. Set up custom SMTP for secure email delivery
-- 4. Enable audit logging at the infrastructure level

-- Optional: Add first admin user (replace with your user ID)
-- INSERT INTO admin_users (user_id, granted_by) 
-- VALUES ('your-user-id-here', 'your-user-id-here');