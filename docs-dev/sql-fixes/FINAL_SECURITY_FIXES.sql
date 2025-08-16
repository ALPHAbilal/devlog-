-- FINAL SECURITY FIXES FOR DEVLOG
-- Created: 2025-01-31
-- Priority: CRITICAL
-- 
-- This script fixes the remaining security issues found after initial migrations:
-- 1. SECURITY DEFINER view vulnerability
-- 2. Missing RLS on rate limiting tables
-- 3. Missing search_path on security functions

-- ============================================
-- PART 1: FIX SECURITY DEFINER VIEW (CRITICAL)
-- ============================================

-- Drop the vulnerable view
DROP VIEW IF EXISTS public.user_documents_with_block_count CASCADE;

-- Recreate without SECURITY DEFINER (uses SECURITY INVOKER by default)
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

-- Grant appropriate permissions
GRANT SELECT ON public.user_documents_with_block_count TO authenticated;

-- Verify the fix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_views 
    WHERE viewname = 'user_documents_with_block_count'
      AND definition LIKE '%SECURITY DEFINER%'
  ) THEN
    RAISE NOTICE 'SUCCESS: SECURITY DEFINER view vulnerability fixed';
  ELSE
    RAISE EXCEPTION 'FAILED: SECURITY DEFINER view still exists';
  END IF;
END $$;

-- ============================================
-- PART 2: ENABLE RLS ON RATE LIMITING TABLES
-- ============================================

-- Enable RLS on rate_limit_log
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for rate_limit_log
CREATE POLICY "Service role can manage rate limits" ON rate_limit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own rate limits" ON rate_limit_log
  FOR SELECT USING (user_id = auth.uid());

-- Enable RLS on ip_rate_limit
ALTER TABLE ip_rate_limit ENABLE ROW LEVEL SECURITY;

-- Create policies for ip_rate_limit
CREATE POLICY "Service role can manage IP rate limits" ON ip_rate_limit
  FOR ALL USING (auth.role() = 'service_role');

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename IN ('rate_limit_log', 'ip_rate_limit')
      AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on rate limiting tables';
  ELSE
    RAISE EXCEPTION 'FAILED: RLS not enabled on rate limiting tables';
  END IF;
END $$;

-- ============================================
-- PART 3: ADD SEARCH_PATH TO ALL NEW FUNCTIONS
-- ============================================

-- Fix search_path for all security functions
ALTER FUNCTION validate_password_strength(TEXT) SET search_path = public, auth;
ALTER FUNCTION is_password_compromised(TEXT) SET search_path = public, auth;
ALTER FUNCTION validate_session(TEXT) SET search_path = public, auth;
ALTER FUNCTION log_security_event(TEXT, UUID, JSONB) SET search_path = public, auth;
ALTER FUNCTION cleanup_expired_sessions() SET search_path = public, auth;
ALTER FUNCTION normalize_email() SET search_path = public, auth;
ALTER FUNCTION check_ip_rate_limit(INET, INTEGER, INTEGER) SET search_path = public, auth;
ALTER FUNCTION is_admin(UUID) SET search_path = public, auth;

-- Fix search_path for atomic save functions
ALTER FUNCTION save_document_blocks_atomic(UUID, JSONB, UUID) SET search_path = public, auth;
ALTER FUNCTION save_document_blocks_safe(UUID, JSONB) SET search_path = public, auth;
ALTER FUNCTION save_document_blocks(UUID, JSONB) SET search_path = public, auth;
ALTER FUNCTION check_rate_limit(UUID, TEXT, INTEGER, INTEGER) SET search_path = public, auth;
ALTER FUNCTION save_document_blocks_with_rate_limit(UUID, JSONB) SET search_path = public, auth;
ALTER FUNCTION cleanup_rate_limit_log() SET search_path = public, auth;
ALTER FUNCTION recover_deleted_blocks(UUID, TIMESTAMPTZ) SET search_path = public, auth;

-- Count functions with search_path set
DO $$
DECLARE
  v_functions_with_path INTEGER;
  v_total_functions INTEGER;
BEGIN
  -- Count our functions that should have search_path
  SELECT COUNT(*) INTO v_total_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'validate_password_strength', 'is_password_compromised', 'validate_session',
    'log_security_event', 'cleanup_expired_sessions', 'normalize_email',
    'check_ip_rate_limit', 'is_admin', 'save_document_blocks_atomic',
    'save_document_blocks_safe', 'save_document_blocks', 'check_rate_limit',
    'save_document_blocks_with_rate_limit', 'cleanup_rate_limit_log',
    'recover_deleted_blocks'
  );
  
  -- Count how many have search_path set
  SELECT COUNT(*) INTO v_functions_with_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proconfig @> ARRAY['search_path=public, auth']
  AND p.proname IN (
    'validate_password_strength', 'is_password_compromised', 'validate_session',
    'log_security_event', 'cleanup_expired_sessions', 'normalize_email',
    'check_ip_rate_limit', 'is_admin', 'save_document_blocks_atomic',
    'save_document_blocks_safe', 'save_document_blocks', 'check_rate_limit',
    'save_document_blocks_with_rate_limit', 'cleanup_rate_limit_log',
    'recover_deleted_blocks'
  );
  
  RAISE NOTICE 'Functions with search_path: %/%', v_functions_with_path, v_total_functions;
  
  IF v_functions_with_path = v_total_functions THEN
    RAISE NOTICE 'SUCCESS: All functions have search_path set';
  ELSE
    RAISE WARNING 'Some functions may still need search_path set';
  END IF;
END $$;

-- ============================================
-- PART 4: ADDITIONAL SECURITY HARDENING
-- ============================================

-- Ensure all authentication functions use correct search_path
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%auth%' OR p.proname LIKE '%session%' OR p.proname LIKE '%password%'
    AND NOT (p.proconfig @> ARRAY['search_path=public, auth'])
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I(%s) SET search_path = public, auth', 
        func_record.function_name, func_record.args);
      RAISE NOTICE 'Fixed search_path for: %', func_record.function_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not fix search_path for %: %', func_record.function_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================
-- PART 5: FINAL VERIFICATION
-- ============================================

DO $$
DECLARE
  v_security_issues INTEGER := 0;
  v_issue_details TEXT := '';
BEGIN
  -- Check for SECURITY DEFINER views
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public'
      AND definition LIKE '%SECURITY DEFINER%'
  ) THEN
    v_security_issues := v_security_issues + 1;
    v_issue_details := v_issue_details || 'SECURITY DEFINER views still exist; ';
  END IF;
  
  -- Check for tables without RLS in public schema
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename NOT IN ('schema_migrations', 'migrations')
      AND rowsecurity = false
  ) THEN
    v_security_issues := v_security_issues + 1;
    v_issue_details := v_issue_details || 'Tables without RLS found; ';
  END IF;
  
  -- Check for functions without search_path
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND NOT (p.proconfig @> ARRAY['search_path=public, auth']
        OR p.proconfig @> ARRAY['search_path=public']
        OR p.proconfig @> ARRAY['search_path=auth'])
      AND p.prokind = 'f' -- Only functions, not aggregates
  ) THEN
    v_security_issues := v_security_issues + 1;
    v_issue_details := v_issue_details || 'Functions without search_path found; ';
  END IF;
  
  -- Report results
  RAISE NOTICE '';
  RAISE NOTICE '========== FINAL SECURITY STATUS ==========';
  IF v_security_issues = 0 THEN
    RAISE NOTICE 'ALL SECURITY ISSUES RESOLVED! ✅';
    RAISE NOTICE 'Your database is now secure.';
  ELSE
    RAISE WARNING 'Security issues remaining: %', v_security_issues;
    RAISE WARNING 'Details: %', v_issue_details;
  END IF;
  RAISE NOTICE '==========================================';
END $$;

-- ============================================
-- MANUAL STEPS REQUIRED
-- ============================================

-- IMPORTANT: You must also enable these in Supabase Dashboard:
-- 
-- 1. Enable Leaked Password Protection:
--    - Go to Authentication > Providers > Email
--    - Enable "Check passwords against HaveIBeenPwned"
-- 
-- 2. Enable MFA (optional but recommended):
--    - Go to Authentication > Providers
--    - Enable Multi-Factor Authentication
-- 
-- 3. Configure Session Settings:
--    - Go to Authentication > Settings
--    - Set appropriate session lifetime
--    - Enable refresh token rotation