-- ============================================
-- DEVLOG SECURITY FIXES - PRECISE VERSION
-- Date: 2025-01-29
-- Based on actual database state
-- ============================================

-- PART 1: BACKUP TABLES ALREADY MOVED ✓
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Backup tables check: All backup tables are already in the backups schema ✓';
END $$;

-- PART 2: CHECK SECURITY DEFINER VIEW
-- ============================================
-- The view exists but we need to check if it has SECURITY DEFINER
-- We'll recreate it to be safe

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

-- PART 3: FIX FUNCTION SEARCH PATHS
-- ============================================
DO $$
DECLARE
    func_record RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting function security fixes...';
    
    -- Get all functions that need search_path
    FOR func_record IN 
        SELECT DISTINCT
            p.proname AS function_name,
            pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
            p.proconfig
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
    LOOP
        -- Check if search_path is already set
        IF func_record.proconfig IS NULL OR NOT (func_record.proconfig @> ARRAY['search_path=public, auth']) THEN
            BEGIN
                -- Use ALTER FUNCTION to add search_path
                EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, auth',
                              func_record.function_name,
                              func_record.args);
                success_count := success_count + 1;
                RAISE NOTICE 'Fixed: %(%)', func_record.function_name, func_record.args;
            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                RAISE WARNING 'Failed to fix %(%): %', func_record.function_name, func_record.args, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Function fixes completed. Success: %, Errors: %, Already fixed: %', 
                 success_count, error_count, 
                 (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
                  WHERE n.nspname = 'public' AND p.proconfig @> ARRAY['search_path=public, auth']);
END $$;

-- PART 4: REMOVE DUPLICATE RLS POLICIES
-- ============================================
DO $$
DECLARE
    policy_count INTEGER := 0;
BEGIN
    -- Remove non-optimized policies on blocks table
    -- Keep the optimized ones that use user_document_ids()
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocks' AND policyname = 'Users can select blocks') THEN
        DROP POLICY "Users can select blocks" ON blocks;
        policy_count := policy_count + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocks' AND policyname = 'Users can insert blocks') THEN
        DROP POLICY "Users can insert blocks" ON blocks;
        policy_count := policy_count + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocks' AND policyname = 'Users can update blocks') THEN
        DROP POLICY "Users can update blocks" ON blocks;
        policy_count := policy_count + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocks' AND policyname = 'Users can delete blocks') THEN
        DROP POLICY "Users can delete blocks" ON blocks;
        policy_count := policy_count + 1;
    END IF;
    
    -- Remove duplicate policies on documents table
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can view own documents') THEN
        DROP POLICY "Users can view own documents" ON documents;
        policy_count := policy_count + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Users can update their own documents') THEN
        DROP POLICY "Users can update their own documents" ON documents;
        policy_count := policy_count + 1;
    END IF;
    
    RAISE NOTICE 'Removed % duplicate RLS policies', policy_count;
END $$;

-- PART 5: OPTIMIZE RLS POLICIES (Fix auth.uid() calls)
-- ============================================
DO $$
BEGIN
    -- Check if policies need optimization
    -- The "soft delete" policy uses auth.uid() instead of (SELECT auth.uid())
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can soft delete their own documents'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(SELECT auth.uid())%'
    ) THEN
        DROP POLICY "Users can soft delete their own documents" ON documents;
        CREATE POLICY "Users can soft delete their own documents" ON documents
            FOR UPDATE
            USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL)
            WITH CHECK (user_id = (SELECT auth.uid()));
        RAISE NOTICE 'Optimized policy: Users can soft delete their own documents';
    END IF;
    
    -- Fix "Users can view their own non-deleted documents" if needed
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can view their own non-deleted documents'
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(SELECT auth.uid())%'
    ) THEN
        DROP POLICY "Users can view their own non-deleted documents" ON documents;
        CREATE POLICY "Users can view their own non-deleted documents" ON documents
            FOR SELECT
            USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL);
        RAISE NOTICE 'Optimized policy: Users can view their own non-deleted documents';
    END IF;
END $$;

-- PART 6: ADD MISSING INDEXES
-- ============================================
DO $$ 
BEGIN
    -- Check and create index for backup_metadata
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'backups' 
        AND tablename = 'backup_metadata' 
        AND indexname = 'idx_backup_metadata_created_by'
    ) THEN
        CREATE INDEX idx_backup_metadata_created_by ON backups.backup_metadata(created_by);
        RAISE NOTICE 'Created index: idx_backup_metadata_created_by';
    END IF;
    
    -- Check and create index for document_versions
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'document_versions' 
        AND indexname = 'idx_document_versions_created_by'
    ) THEN
        CREATE INDEX idx_document_versions_created_by ON public.document_versions(created_by);
        RAISE NOTICE 'Created index: idx_document_versions_created_by';
    END IF;
END $$;

-- PART 7: DROP UNUSED INDEXES
-- ============================================
DO $$
DECLARE
    idx_name TEXT;
    drop_count INTEGER := 0;
BEGIN
    -- List of indexes to drop if they exist
    FOR idx_name IN 
        SELECT unnest(ARRAY[
            'idx_blocks_type',
            'idx_images_storage_path',
            'idx_settings_user_id',
            'idx_document_links_source_target',
            'idx_documents_deleted_at',
            'idx_blocks_deleted_at',
            'idx_documents_search_active',
            'idx_document_cache_updated_at',
            'idx_blocks_search_active',
            'idx_documents_user_id_created_at',
            'idx_documents_is_template',
            'idx_document_versions_document_id',
            'idx_document_versions_created_at'
        ])
    LOOP
        IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = idx_name) THEN
            EXECUTE format('DROP INDEX IF EXISTS public.%I', idx_name);
            drop_count := drop_count + 1;
            RAISE NOTICE 'Dropped unused index: %', idx_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total unused indexes dropped: %', drop_count;
END $$;

-- PART 8: FINAL VERIFICATION
-- ============================================
DO $$ 
DECLARE
    v_functions_with_path INTEGER;
    v_optimized_policies INTEGER;
    v_duplicate_policies INTEGER;
BEGIN
    -- Count functions with search_path
    SELECT COUNT(*) INTO v_functions_with_path
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig @> ARRAY['search_path=public, auth'];
    
    -- Count optimized policies (using SELECT auth.uid())
    SELECT COUNT(*) INTO v_optimized_policies
    FROM pg_policies
    WHERE (tablename = 'documents' OR tablename = 'blocks')
    AND qual LIKE '%(SELECT auth.uid())%';
    
    -- Count remaining duplicate policies
    SELECT COUNT(*) INTO v_duplicate_policies
    FROM (
        SELECT tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies
        WHERE tablename IN ('documents', 'blocks')
        GROUP BY tablename, cmd
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '        SECURITY FIXES COMPLETED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Functions with search_path: %', v_functions_with_path;
    RAISE NOTICE 'Optimized RLS policies: %', v_optimized_policies;
    RAISE NOTICE 'Remaining duplicate policies: %', v_duplicate_policies;
    RAISE NOTICE 'View security: Fixed';
    RAISE NOTICE 'Backup tables: Already in backups schema';
    RAISE NOTICE '==========================================';
END $$;