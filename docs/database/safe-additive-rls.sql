-- =====================================================
-- SAFE ADDITIVE RLS POLICIES (Won't Break Existing Users)
-- This ADDS permissions without removing any
-- =====================================================

-- IMPORTANT: This script is designed to be ADDITIVE only
-- It won't drop or modify existing policies

-- =====================================================
-- STEP 1: Add MCP-specific policies WITHOUT touching existing ones
-- =====================================================

-- For documents table - ADD a new policy specifically for MCP
DO $$ 
BEGIN
    -- Check if policy doesn't exist before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND policyname = 'MCP access for user 8eac28e6'
    ) THEN
        CREATE POLICY "MCP access for user 8eac28e6" ON documents
            FOR ALL 
            USING (user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b')
            WITH CHECK (user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b');
    END IF;
END $$;

-- For blocks table - ADD a new policy specifically for MCP
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'blocks' 
        AND policyname = 'MCP access for user 8eac28e6'
    ) THEN
        CREATE POLICY "MCP access for user 8eac28e6" ON blocks
            FOR ALL 
            USING (user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b')
            WITH CHECK (user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b');
    END IF;
END $$;

-- =====================================================
-- STEP 2: Alternative - Create an API service role approach
-- =====================================================

-- This is even safer - create a function that MCP can call
-- This way, no RLS changes needed at all!

CREATE OR REPLACE FUNCTION mcp_create_document(
    p_title text,
    p_user_id uuid,
    p_tags text[] DEFAULT '{}',
    p_api_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
AS $$
DECLARE
    v_document_id uuid;
BEGIN
    -- In production, validate p_api_key here
    -- For now, just check if user_id is your ID
    IF p_user_id::text != '8eac28e6-0127-40d1-ba55-c10cbe52a32b' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    -- Create document with SECURITY DEFINER privileges (bypasses RLS)
    INSERT INTO documents (title, user_id, tags, created_at, updated_at)
    VALUES (p_title, p_user_id, p_tags, NOW(), NOW())
    RETURNING id INTO v_document_id;
    
    RETURN v_document_id;
END;
$$;

-- Grant execute permission to anon role (for MCP)
GRANT EXECUTE ON FUNCTION mcp_create_document TO anon;

-- Similar function for blocks
CREATE OR REPLACE FUNCTION mcp_create_block(
    p_document_id uuid,
    p_type text,
    p_content text,
    p_metadata jsonb,
    p_position int,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_block_id uuid;
BEGIN
    -- Validate user owns the document
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE id = p_document_id 
        AND user_id = p_user_id::text
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    -- Create block
    INSERT INTO blocks (document_id, type, content, metadata, position, user_id, created_at, updated_at)
    VALUES (p_document_id, p_type, p_content, p_metadata, p_position, p_user_id::text, NOW(), NOW())
    RETURNING id INTO v_block_id;
    
    RETURN v_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mcp_create_block TO anon;

-- =====================================================
-- SAFEST APPROACH: Check what exists first
-- =====================================================

-- Run this to see current state:
SELECT 
    'Documents table RLS enabled: ' || 
    CASE 
        WHEN rowsecurity THEN 'YES' 
        ELSE 'NO' 
    END as status
FROM pg_tables
WHERE tablename = 'documents' AND schemaname = 'public'
UNION ALL
SELECT 
    'Number of existing policies on documents: ' || COUNT(*)::text
FROM pg_policies
WHERE tablename = 'documents' AND schemaname = 'public'
UNION ALL
SELECT 
    'Your user has access via policies: ' || 
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES (' || COUNT(*) || ' policies)'
        ELSE 'NO'
    END
FROM pg_policies
WHERE tablename = 'documents' 
AND schemaname = 'public'
AND (
    qual::text LIKE '%8eac28e6-0127-40d1-ba55-c10cbe52a32b%'
    OR with_check::text LIKE '%8eac28e6-0127-40d1-ba55-c10cbe52a32b%'
);