-- =====================================================
-- SAFE SCRIPT TO CHECK EXISTING RLS POLICIES
-- This only READS, doesn't change anything
-- =====================================================

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('documents', 'blocks', 'document_links', 'images', 'folders')
ORDER BY tablename;

-- List all existing policies
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
WHERE schemaname = 'public'
AND tablename IN ('documents', 'blocks', 'document_links', 'images', 'folders')
ORDER BY tablename, policyname;

-- This will show you:
-- 1. Which tables have RLS enabled
-- 2. What policies already exist
-- 3. What those policies actually do