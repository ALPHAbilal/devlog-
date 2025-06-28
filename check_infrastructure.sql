-- Infrastructure Check Queries for Journey Log Compass
-- Run these in Supabase SQL Editor to understand your current setup

-- ========================================
-- 1. LIST ALL TABLES
-- ========================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ========================================
-- 2. CHECK TABLE STRUCTURES
-- ========================================
-- Documents table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;

-- Blocks table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'blocks'
ORDER BY ordinal_position;

-- ========================================
-- 3. CHECK INDEXES
-- ========================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('documents', 'blocks', 'profiles', 'settings', 'images')
ORDER BY tablename, indexname;

-- ========================================
-- 4. CHECK CONSTRAINTS
-- ========================================
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('documents', 'blocks', 'profiles', 'settings', 'images')
ORDER BY tc.table_name, tc.constraint_type;

-- ========================================
-- 5. CHECK RLS STATUS
-- ========================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ========================================
-- 6. LIST ALL RLS POLICIES
-- ========================================
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- 7. CHECK TRIGGERS
-- ========================================
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 8. CHECK FUNCTIONS
-- ========================================
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ========================================
-- 9. CHECK DATA STATISTICS
-- ========================================
SELECT 
    'documents' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.documents
UNION ALL
SELECT 
    'blocks' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT document_id) as unique_documents,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.blocks
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as row_count,
    NULL as unique_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.profiles
UNION ALL
SELECT 
    'settings' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.settings
UNION ALL
SELECT 
    'images' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.images;

-- ========================================
-- 10. CHECK EXTENSIONS
-- ========================================
SELECT 
    extname as extension_name,
    extversion as version
FROM pg_extension
ORDER BY extname;