-- ============================================
-- FIX REMAINING RLS POLICY OPTIMIZATIONS
-- Date: 2025-01-29
-- ============================================

-- Fix auth function calls in remaining policies for better performance
-- These policies need auth.uid() replaced with (SELECT auth.uid())

-- 1. Fix profiles table policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT
    WITH CHECK (id = (SELECT auth.uid()));

-- 2. Fix document_versions table policies
DROP POLICY IF EXISTS "Users can view versions of their documents" ON document_versions;
CREATE POLICY "Users can view versions of their documents" ON document_versions
    FOR SELECT
    USING (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create versions of their documents" ON document_versions;
CREATE POLICY "Users can create versions of their documents" ON document_versions
    FOR INSERT
    WITH CHECK (
        document_id IN (
            SELECT id FROM documents 
            WHERE user_id = (SELECT auth.uid())
        )
    );

-- Verify the fixes
DO $$
DECLARE
    v_fixed_count INTEGER;
BEGIN
    -- Count policies that now use (SELECT auth.uid())
    SELECT COUNT(*) INTO v_fixed_count
    FROM pg_policies
    WHERE tablename IN ('profiles', 'document_versions')
    AND qual LIKE '%(SELECT auth.uid())%';
    
    RAISE NOTICE 'Fixed % RLS policies with optimized auth calls', v_fixed_count;
END $$;