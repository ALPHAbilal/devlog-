-- Fix for log.md errors
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX 1: Enable uuid-ossp extension
-- ============================================
-- This fixes the "function uuid_ns_oid() does not exist" error
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extension is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) THEN
    RAISE EXCEPTION 'Failed to enable uuid-ossp extension';
  ELSE
    RAISE NOTICE 'uuid-ossp extension enabled successfully';
  END IF;
END $$;

-- ============================================
-- FIX 2: Verify documents table exists and is accessible
-- ============================================
-- Check if documents table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'documents'
  ) THEN
    RAISE EXCEPTION 'documents table does not exist!';
  ELSE
    RAISE NOTICE 'documents table exists';
  END IF;
END $$;

-- ============================================
-- FIX 3: Check RLS policies on documents table
-- ============================================
-- List all policies on documents table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'documents';

-- ============================================
-- FIX 4: Verify audit triggers (if they exist)
-- ============================================
-- Check if audit triggers are installed
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgisinternal as is_internal,
  tgenabled as is_enabled
FROM pg_trigger 
WHERE tgname LIKE '%audit%' 
   OR tgname LIKE '%insert_update_delete%';

-- ============================================
-- FIX 5: If audit triggers fail, temporarily disable them
-- ============================================
-- Uncomment the following lines if you want to disable audit triggers temporarily
-- ALTER TABLE documents DISABLE TRIGGER ALL;
-- ALTER TABLE blocks DISABLE TRIGGER ALL;
-- Note: Re-enable them after fixing uuid-ossp extension:
-- ALTER TABLE documents ENABLE TRIGGER ALL;
-- ALTER TABLE blocks ENABLE TRIGGER ALL;

-- ============================================
-- Verification queries
-- ============================================
-- Test uuid_ns_oid function
SELECT uuid_ns_oid() as test_uuid_ns_oid;

-- Test uuid_generate_v5 function
SELECT uuid_generate_v5(uuid_ns_oid(), 'test') as test_uuid_v5;

-- Test basic documents query (should not fail with RLS)
SELECT COUNT(*) as document_count FROM documents LIMIT 1;

