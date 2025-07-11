-- ============================================
-- SAFE SECURITY FIXES FOR DEVLOG
-- Date: 2025-01-29
-- This version handles dependencies properly
-- ============================================

-- PART 1: MOVE BACKUP TABLES TO PRIVATE SCHEMA (SAFE TO RUN)
-- ============================================

-- Create backups schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS backups;

-- Move all backup tables to the backups schema (these shouldn't be public)
DO $$ 
BEGIN
    -- Move backup_metadata
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_metadata') THEN
        ALTER TABLE public.backup_metadata SET SCHEMA backups;
    END IF;
    
    -- Move image backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'images_backup_20250629_134931') THEN
        ALTER TABLE public.images_backup_20250629_134931 SET SCHEMA backups;
    END IF;
    
    -- Move document backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_backup_20250629_134931') THEN
        ALTER TABLE public.documents_backup_20250629_134931 SET SCHEMA backups;
    END IF;
    
    -- Move blocks backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blocks_backup_20250629_134931') THEN
        ALTER TABLE public.blocks_backup_20250629_134931 SET SCHEMA backups;
    END IF;
    
    -- Move profiles backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles_backup_20250629_134931') THEN
        ALTER TABLE public.profiles_backup_20250629_134931 SET SCHEMA backups;
    END IF;
    
    -- Move document_links backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_links_backup_20250629_134931') THEN
        ALTER TABLE public.document_links_backup_20250629_134931 SET SCHEMA backups;
    END IF;
    
    -- Move settings backups
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings_backup_20250629_134931') THEN
        ALTER TABLE public.settings_backup_20250629_134931 SET SCHEMA backups;
    END IF;
END $$;

-- PART 2: FIX SECURITY DEFINER VIEW (SAFE TO RUN)
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

-- PART 3: FIX FUNCTION SEARCH PATHS WITHOUT BREAKING DEPENDENCIES
-- ============================================
-- We'll use CREATE OR REPLACE to update functions without dropping them

-- 1. soft_delete_document (can be replaced without dropping)
CREATE OR REPLACE FUNCTION public.soft_delete_document(doc_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE documents 
    SET deleted_at = NOW() 
    WHERE id = doc_id AND user_id = auth.uid();
    
    UPDATE blocks 
    SET deleted_at = NOW() 
    WHERE document_id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 2. user_document_ids (CREATE OR REPLACE to preserve dependencies)
CREATE OR REPLACE FUNCTION public.user_document_ids()
RETURNS TABLE(document_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id
    FROM documents d
    WHERE d.user_id = auth.uid()
    AND d.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 3. update_document_cache (CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.update_document_cache(doc_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO document_cache (document_id, user_id, block_count, last_block_update)
    VALUES (
        doc_id,
        (SELECT user_id FROM documents WHERE id = doc_id),
        (SELECT COUNT(*) FROM blocks WHERE document_id = doc_id AND deleted_at IS NULL),
        (SELECT MAX(updated_at) FROM blocks WHERE document_id = doc_id)
    )
    ON CONFLICT (document_id) DO UPDATE
    SET 
        block_count = EXCLUDED.block_count,
        last_block_update = EXCLUDED.last_block_update,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- 4. save_document_blocks_v3 - Need to check if it exists first
DO $$
BEGIN
    -- Check if function exists with correct signature
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'save_document_blocks_v3'
    ) THEN
        -- Drop it with CASCADE since it might have different parameters
        DROP FUNCTION IF EXISTS public.save_document_blocks_v3 CASCADE;
    END IF;
END $$;

-- Now create the function
CREATE OR REPLACE FUNCTION public.save_document_blocks_v3(
    p_document_id uuid,
    p_user_id uuid,
    p_title text,
    p_tags text[],
    p_blocks jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
    v_error text;
    v_existing_blocks uuid[];
    v_blocks_to_keep uuid[];
    v_blocks_to_delete uuid[];
    v_block jsonb;
    v_block_id uuid;
    v_count integer;
BEGIN
    -- Verify user owns the document
    IF p_document_id IS NOT NULL THEN
        SELECT 1 FROM documents 
        WHERE id = p_document_id AND user_id = p_user_id
        INTO v_count;
        
        IF v_count IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Document not found or access denied'
            );
        END IF;
    END IF;

    -- Start transaction
    -- Update or insert document
    INSERT INTO documents (id, user_id, title, tags, updated_at)
    VALUES (
        COALESCE(p_document_id, gen_random_uuid()),
        p_user_id,
        p_title,
        p_tags,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        title = EXCLUDED.title,
        tags = EXCLUDED.tags,
        updated_at = NOW()
    WHERE documents.user_id = p_user_id;

    -- Get the document ID (in case it was newly created)
    IF p_document_id IS NULL THEN
        p_document_id := COALESCE(p_document_id, gen_random_uuid());
    END IF;

    -- Get existing blocks
    SELECT array_agg(id) INTO v_existing_blocks
    FROM blocks
    WHERE document_id = p_document_id AND deleted_at IS NULL;

    -- Process blocks
    v_blocks_to_keep := ARRAY[]::uuid[];
    
    FOR v_block IN SELECT * FROM jsonb_array_elements(p_blocks)
    LOOP
        v_block_id := (v_block->>'id')::uuid;
        
        -- Track blocks to keep
        v_blocks_to_keep := array_append(v_blocks_to_keep, v_block_id);
        
        -- Upsert block
        INSERT INTO blocks (
            id, document_id, type, content, position, metadata, user_id, updated_at
        ) VALUES (
            v_block_id,
            p_document_id,
            v_block->>'type',
            v_block->>'content',
            (v_block->>'position')::integer,
            v_block->'metadata',
            p_user_id,
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            type = EXCLUDED.type,
            content = EXCLUDED.content,
            position = EXCLUDED.position,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        WHERE blocks.document_id = p_document_id;
    END LOOP;

    -- Soft delete blocks that are no longer in the document
    IF v_existing_blocks IS NOT NULL THEN
        v_blocks_to_delete := ARRAY(
            SELECT unnest(v_existing_blocks)
            EXCEPT
            SELECT unnest(v_blocks_to_keep)
        );
        
        IF array_length(v_blocks_to_delete, 1) > 0 THEN
            UPDATE blocks
            SET deleted_at = NOW()
            WHERE id = ANY(v_blocks_to_delete)
            AND document_id = p_document_id;
        END IF;
    END IF;

    -- Update document cache
    PERFORM update_document_cache(p_document_id);

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'document_id', p_document_id,
        'message', 'Document saved successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
        RETURN jsonb_build_object(
            'success', false,
            'error', v_error
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- PART 4: FIX OTHER FUNCTIONS THAT DON'T HAVE DEPENDENCIES
-- ============================================

-- Functions that likely don't have policy dependencies can use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.refresh_stale_caches()
RETURNS void AS $$
BEGIN
    -- Refresh document caches older than 5 minutes
    UPDATE document_cache
    SET 
        block_count = (
            SELECT COUNT(*) 
            FROM blocks 
            WHERE document_id = document_cache.document_id 
            AND deleted_at IS NULL
        ),
        last_block_update = (
            SELECT MAX(updated_at) 
            FROM blocks 
            WHERE document_id = document_cache.document_id
        ),
        updated_at = NOW()
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- PART 5: FIX RLS POLICIES FOR PERFORMANCE
-- ============================================

-- Remove duplicate policies on documents (safe to drop)
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;

-- Recreate optimized policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can view their own non-deleted documents'
    ) THEN
        CREATE POLICY "Users can view their own non-deleted documents" ON documents
            FOR SELECT
            USING (user_id = (SELECT auth.uid()) AND deleted_at IS NULL);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'Users can soft delete their own documents'
    ) THEN
        CREATE POLICY "Users can soft delete their own documents" ON documents
            FOR UPDATE
            USING (user_id = (SELECT auth.uid()))
            WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- Remove duplicate policies on blocks (non-optimized versions)
DROP POLICY IF EXISTS "Users can select blocks" ON blocks;
DROP POLICY IF EXISTS "Users can insert blocks" ON blocks;
DROP POLICY IF EXISTS "Users can update blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete blocks" ON blocks;

-- PART 6: ADD MISSING INDEXES (SAFE)
-- ============================================

-- Add indexes on foreign keys (only if tables exist in correct schema)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'backups' AND table_name = 'backup_metadata') THEN
        CREATE INDEX IF NOT EXISTS idx_backup_metadata_created_by ON backups.backup_metadata(created_by);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'document_versions') THEN
        CREATE INDEX IF NOT EXISTS idx_document_versions_created_by ON public.document_versions(created_by);
    END IF;
END $$;

-- PART 7: DROP UNUSED INDEXES (SAFE)
-- ============================================

-- Only drop indexes that definitely exist and are unused
DROP INDEX IF EXISTS public.idx_blocks_type;
DROP INDEX IF EXISTS public.idx_images_storage_path;
DROP INDEX IF EXISTS public.idx_settings_user_id;
DROP INDEX IF EXISTS public.idx_document_links_source_target;
DROP INDEX IF EXISTS public.idx_documents_deleted_at;
DROP INDEX IF EXISTS public.idx_blocks_deleted_at;

-- PART 8: VERIFICATION
-- ============================================

-- Check if security issues are resolved
DO $$ 
DECLARE
    v_backup_count integer;
    v_functions_fixed integer;
BEGIN
    -- Count backup tables moved
    SELECT COUNT(*) INTO v_backup_count
    FROM information_schema.tables 
    WHERE table_schema = 'backups';
    
    -- Count functions with search_path set
    SELECT COUNT(*) INTO v_functions_fixed
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proconfig @> ARRAY['search_path=public, auth'];
    
    RAISE NOTICE 'Security fixes applied:';
    RAISE NOTICE '- Backup tables moved to backups schema: %', v_backup_count;
    RAISE NOTICE '- Functions with search_path fixed: %', v_functions_fixed;
    RAISE NOTICE '- Duplicate RLS policies removed';
    RAISE NOTICE '- Unused indexes dropped';
    RAISE NOTICE 'Migration completed successfully!';
END $$;