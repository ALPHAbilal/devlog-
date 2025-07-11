-- Migration: Cleanup Duplicate Functions Before Performance Optimization
-- Created: 2025-01-31
-- Purpose: Remove all potentially duplicate functions before creating new ones
-- 
-- Run this BEFORE 20250131_003_performance_optimizations.sql

-- ============================================
-- CLEANUP ALL POTENTIALLY DUPLICATE FUNCTIONS
-- ============================================

DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Find and drop all versions of our performance functions
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'get_documents_with_stats',
            'search_documents_optimized',
            'get_blocks_for_documents',
            'refresh_user_dashboard_stats',
            'update_document_search_vector',
            'update_block_search_vector',
            'trigger_refresh_stats',
            'log_query_performance'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE',
                func_record.schema_name,
                func_record.function_name,
                func_record.arguments
            );
            RAISE NOTICE 'Dropped function: %.%(%)', 
                func_record.schema_name, 
                func_record.function_name, 
                func_record.arguments;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function %.%(%): %', 
                    func_record.schema_name, 
                    func_record.function_name, 
                    func_record.arguments,
                    SQLERRM;
        END;
    END LOOP;
END $$;

-- Also drop any materialized views that might conflict
DROP MATERIALIZED VIEW IF EXISTS user_dashboard_stats CASCADE;

-- Drop any tables that might conflict
DROP TABLE IF EXISTS pending_refreshes CASCADE;
DROP TABLE IF EXISTS query_performance_log CASCADE;

-- Verification
DO $$
DECLARE
    remaining_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'get_documents_with_stats',
        'search_documents_optimized',
        'get_blocks_for_documents',
        'refresh_user_dashboard_stats',
        'update_document_search_vector',
        'update_block_search_vector',
        'trigger_refresh_stats',
        'log_query_performance'
    );
    
    IF remaining_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All duplicate functions have been removed';
    ELSE
        RAISE WARNING 'WARNING: % functions still remain', remaining_count;
    END IF;
END $$;

-- ============================================
-- IMPORTANT: Now run 20250131_003_performance_optimizations.sql
-- ============================================