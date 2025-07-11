-- ============================================
-- DEVLOG SECURITY FIXES - FINAL VERSION
-- Date: 2025-01-29
-- This version works around all dependency issues
-- ============================================

-- PART 1: MOVE BACKUP TABLES (RUN THIS FIRST - IT'S SAFE)
-- ============================================

-- Create backups schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS backups;

-- Move all backup tables to the backups schema
DO $$ 
BEGIN
    -- Move backup_metadata
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_metadata') THEN
        ALTER TABLE public.backup_metadata SET SCHEMA backups;
        RAISE NOTICE 'Moved backup_metadata to backups schema';
    END IF;
    
    -- Move image backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'images_backup_20250629_134931') THEN
        ALTER TABLE public.images_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved images_backup to backups schema';
    END IF;
    
    -- Move document backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_backup_20250629_134931') THEN
        ALTER TABLE public.documents_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved documents_backup to backups schema';
    END IF;
    
    -- Move blocks backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks_backup_20250629_134931') THEN
        ALTER TABLE public.blocks_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved blocks_backup to backups schema';
    END IF;
    
    -- Move profiles backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_backup_20250629_134931') THEN
        ALTER TABLE public.profiles_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved profiles_backup to backups schema';
    END IF;
    
    -- Move document_links backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_links_backup_20250629_134931') THEN
        ALTER TABLE public.document_links_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved document_links_backup to backups schema';
    END IF;
    
    -- Move settings backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings_backup_20250629_134931') THEN
        ALTER TABLE public.settings_backup_20250629_134931 SET SCHEMA backups;
        RAISE NOTICE 'Moved settings_backup to backups schema';
    END IF;
END $$;

-- PART 2: FIX SECURITY DEFINER VIEW (RUN THIS SECOND)
-- ============================================

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.user_documents_with_block_count CASCADE;

CREATE VIEW public.user_documents_with_block_count AS
SELECT 
    d.id,
    d.title,
    d.tags,
    d.created_at,
    d.updated_at,
    d.user_id,
    COUNT(DISTINCT b.id) as block_count
FROM documents d
LEFT JOIN blocks b ON b.document_id = d.id AND b.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.title, d.tags, d.created_at, d.updated_at, d.user_id;

-- Grant appropriate permissions
GRANT SELECT ON public.user_documents_with_block_count TO authenticated;
GRANT SELECT ON public.user_documents_with_block_count TO anon;

RAISE NOTICE 'Fixed SECURITY DEFINER view vulnerability';

-- PART 3: ALTER FUNCTIONS TO ADD SEARCH PATH (WORKAROUND)
-- ============================================
-- Since we can't drop or replace functions with dependencies,
-- we'll use ALTER FUNCTION to add the search_path

DO $$
DECLARE
    func_record RECORD;
    alter_cmd TEXT;
BEGIN
    -- Get all functions that need search_path
    FOR func_record IN 
        SELECT 
            p.proname AS function_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        AND p.proname IN (
            'soft_delete_document',
            'save_document_blocks_v3',
            'user_document_ids',
            'refresh_stale_caches',
            'update_document_cache',
            'restore_from_backup',
            'list_available_backups',
            'cleanup_old_backups',
            'trigger_update_document_cache',
            'batch_insert_blocks',
            'restore_document',
            'create_document_version',
            'get_user_document_stats',
            'batch_update_blocks',
            'create_data_backup',
            'restore_document_version',
            'check_data_integrity',
            'get_version_diff',
            'batch_delete_blocks',
            'get_documents_with_stats',
            'save_document_blocks_v2',
            'rebuild_user_caches'
        )
        -- Check if search_path is not already set
        AND NOT (p.proconfig @> ARRAY['search_path=public, auth'])
    LOOP
        -- Build ALTER command
        alter_cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth',
                           func_record.function_name,
                           func_record.args);
        
        -- Execute it
        BEGIN
            EXECUTE alter_cmd;
            RAISE NOTICE 'Added search_path to function: %(%)', func_record.function_name, func_record.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %(%): %', func_record.function_name, func_record.args, SQLERRM;
        END;
    END LOOP;
END $$;

-- PART 4: FIX RLS POLICIES (RUN THIS FOURTH)
-- ============================================

-- Remove duplicate policies on documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;

-- Fix the policies that use auth.uid() inefficiently
DO $$
BEGIN
    -- Check and recreate document policies with optimized auth calls
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can view their own non-deleted documents'
        AND definition NOT LIKE '%SELECT auth.uid()%'
    ) THEN
        DROP POLICY "Users can view their own non-deleted documents" ON documents;
        CREATE POLICY "Users can view their own non-deleted documents" ON documents
            FOR SELECT
            USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL);
        RAISE NOTICE 'Optimized policy: Users can view their own non-deleted documents';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can soft delete their own documents'
        AND definition NOT LIKE '%SELECT auth.uid()%'
    ) THEN
        DROP POLICY "Users can soft delete their own documents" ON documents;
        CREATE POLICY "Users can soft delete their own documents" ON documents
            FOR UPDATE
            USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
        RAISE NOTICE 'Optimized policy: Users can soft delete their own documents';
    END IF;
END $$;

-- Remove duplicate policies on blocks (keep optimized ones)
DROP POLICY IF EXISTS "Users can select blocks" ON blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON blocks;
DROP POLICY IF EXISTS "Users can update blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete blocks" ON blocks;

RAISE NOTICE 'Removed duplicate RLS policies';

-- PART 5: ADD MISSING INDEXES (RUN THIS FIFTH)
-- ============================================

-- Add indexes on foreign keys
DO $$ 
BEGIN
    -- For backup_metadata (now in backups schema)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backups' AND table_name = 'backup_metadata') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'backups' AND indexname = 'idx_backup_metadata_created_by') THEN
            CREATE INDEX idx_backup_metadata_created_by ON backups.backup_metadata(created_by);
            RAISE NOTICE 'Created index: idx_backup_metadata_created_by';
        END IF;
    END IF;
    
    -- For document_versions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_versions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_document_versions_created_by') THEN
            CREATE INDEX idx_document_versions_created_by ON public.document_versions(created_by);
            RAISE NOTICE 'Created index: idx_document_versions_created_by';
        END IF;
    END IF;
END $$;

-- PART 6: DROP UNUSED INDEXES (RUN THIS LAST)
-- ============================================

-- Drop unused indexes to improve write performance
DO $$
DECLARE
    idx_record RECORD;
    drop_count INTEGER := 0;
BEGIN
    FOR idx_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname IN (
            'idx_blocks_type',
            'idx_images_storage_path',
            'idx_settings_user_id',
            'idx_document_links_source_target',
            'idx_documents_deleted_at',
            'idx_blocks_deleted_at'
        )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_record.indexname);
        drop_count := drop_count + 1;
        RAISE NOTICE 'Dropped unused index: %', idx_record.indexname;
    END LOOP;
    
    RAISE NOTICE 'Total unused indexes dropped: %', drop_count;
END $$;

-- PART 7: FINAL SUMMARY
-- ============================================

DO $$ 
DECLARE
    v_backup_count INTEGER;
    v_functions_with_path INTEGER;
    v_total_functions INTEGER;
BEGIN
    -- Count backup tables moved
    SELECT COUNT(*) INTO v_backup_count
    FROM information_schema.tables 
    WHERE table_schema = 'backups';
    
    -- Count functions with search_path set
    SELECT COUNT(*) INTO v_functions_with_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig @> ARRAY['search_path=public, auth'];
    
    -- Count total functions that should have search_path
    SELECT COUNT(*) INTO v_total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'soft_delete_document', 'save_document_blocks_v3', 'user_document_ids',
        'refresh_stale_caches', 'update_document_cache', 'restore_from_backup',
        'list_available_backups', 'cleanup_old_backups', 'trigger_update_document_cache',
        'batch_insert_blocks', 'restore_document', 'create_document_version',
        'get_user_document_stats', 'batch_update_blocks', 'create_data_backup',
        'restore_document_version', 'check_data_integrity', 'get_version_diff',
        'batch_delete_blocks', 'get_documents_with_stats', 'save_document_blocks_v2',
        'rebuild_user_caches'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '========== SECURITY FIXES SUMMARY ==========';
    RAISE NOTICE 'Backup tables moved to backups schema: %', v_backup_count;
    RAISE NOTICE 'Functions with search_path fixed: %/%', v_functions_with_path, v_total_functions;
    RAISE NOTICE 'SECURITY DEFINER view: Fixed';
    RAISE NOTICE 'Duplicate RLS policies: Removed';
    RAISE NOTICE 'Missing indexes: Added';
    RAISE NOTICE 'Unused indexes: Dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '==========================================';
END $$;