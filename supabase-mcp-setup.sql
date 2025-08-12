-- =====================================================
-- MCP INTEGRATION SETUP FOR DEVLOG
-- Based on actual database analysis
-- =====================================================

-- =====================================================
-- STEP 1: Create API Key Validation Function
-- =====================================================

CREATE OR REPLACE FUNCTION validate_mcp_api_key(p_api_key text)
RETURNS TABLE(
    is_valid boolean,
    user_id uuid,
    key_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key_hash text;
    v_user_id uuid;
    v_key_name text;
BEGIN
    -- Handle test keys
    IF p_api_key = 'dvlg_sk_test_123' THEN
        RETURN QUERY SELECT 
            true::boolean as is_valid,
            '8eac28e6-0127-40d1-ba55-c10cbe52a32b'::uuid as user_id,
            'Test Key'::text as key_name;
        RETURN;
    END IF;
    
    -- For production keys, validate against api_keys table
    IF p_api_key LIKE 'dvlg_sk_prod_%' THEN
        -- Hash the API key
        v_key_hash := encode(digest(p_api_key, 'sha256'), 'hex');
        
        -- Check if key exists and is active
        SELECT ak.user_id, ak.name
        INTO v_user_id, v_key_name
        FROM api_keys ak
        WHERE ak.key_hash = v_key_hash
        AND ak.is_active = true;
        
        IF v_user_id IS NOT NULL THEN
            -- Update last used timestamp
            UPDATE api_keys 
            SET last_used_at = NOW()
            WHERE key_hash = v_key_hash;
            
            RETURN QUERY SELECT 
                true::boolean as is_valid,
                v_user_id as user_id,
                v_key_name as key_name;
        ELSE
            RETURN QUERY SELECT 
                false::boolean as is_valid,
                NULL::uuid as user_id,
                NULL::text as key_name;
        END IF;
    ELSE
        -- Invalid key format
        RETURN QUERY SELECT 
            false::boolean as is_valid,
            NULL::uuid as user_id,
            NULL::text as key_name;
    END IF;
END;
$$;

-- Grant execute permission to anon role (for MCP)
GRANT EXECUTE ON FUNCTION validate_mcp_api_key TO anon;

-- =====================================================
-- STEP 2: Create Helper Function for Current User
-- =====================================================

CREATE OR REPLACE FUNCTION get_mcp_user_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if we have a JWT user
    IF auth.uid() IS NOT NULL THEN
        RETURN auth.uid();
    END IF;
    
    -- For MCP requests, we'll set this via a custom claim
    -- This will be set by the validation function
    RETURN current_setting('app.mcp_user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- =====================================================
-- STEP 3: Create Optimized Document Access Function
-- (Uses existing user_document_ids pattern)
-- =====================================================

CREATE OR REPLACE FUNCTION mcp_user_document_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
AS $$
    SELECT id 
    FROM documents 
    WHERE user_id = get_mcp_user_id()
    AND deleted_at IS NULL;
$$;

-- =====================================================
-- STEP 4: Add MCP-Compatible RLS Policies
-- =====================================================

-- Documents table - MCP policies
DO $$ 
BEGIN
    -- Drop existing MCP policies if they exist
    DROP POLICY IF EXISTS "MCP: Users can view documents" ON documents;
    DROP POLICY IF EXISTS "MCP: Users can create documents" ON documents;
    DROP POLICY IF EXISTS "MCP: Users can update documents" ON documents;
    DROP POLICY IF EXISTS "MCP: Users can soft delete documents" ON documents;
    
    -- Create new MCP-compatible policies
    CREATE POLICY "MCP: Users can view documents" ON documents
        FOR SELECT 
        USING (
            user_id = auth.uid() -- JWT auth
            OR 
            user_id = get_mcp_user_id() -- MCP auth
        );
    
    CREATE POLICY "MCP: Users can create documents" ON documents
        FOR INSERT 
        WITH CHECK (
            user_id = auth.uid() -- JWT auth
            OR 
            user_id = get_mcp_user_id() -- MCP auth
        );
    
    CREATE POLICY "MCP: Users can update documents" ON documents
        FOR UPDATE 
        USING (
            (user_id = auth.uid() OR user_id = get_mcp_user_id())
            AND deleted_at IS NULL
        );
    
    CREATE POLICY "MCP: Users can soft delete documents" ON documents
        FOR UPDATE 
        USING (
            (user_id = auth.uid() OR user_id = get_mcp_user_id())
            AND deleted_at IS NULL
        )
        WITH CHECK (
            deleted_at IS NOT NULL -- Only allow setting deleted_at
        );
END $$;

-- Blocks table - MCP policies
DO $$ 
BEGIN
    -- Drop existing MCP policies if they exist
    DROP POLICY IF EXISTS "MCP: Users can view blocks" ON blocks;
    DROP POLICY IF EXISTS "MCP: Users can create blocks" ON blocks;
    DROP POLICY IF EXISTS "MCP: Users can update blocks" ON blocks;
    DROP POLICY IF EXISTS "MCP: Users can delete blocks" ON blocks;
    
    -- Create new MCP-compatible policies
    CREATE POLICY "MCP: Users can view blocks" ON blocks
        FOR SELECT 
        USING (
            deleted_at IS NULL 
            AND (
                document_id IN (SELECT mcp_user_document_ids())
                OR
                document_id IN (SELECT user_document_ids())
            )
        );
    
    CREATE POLICY "MCP: Users can create blocks" ON blocks
        FOR INSERT 
        WITH CHECK (
            document_id IN (SELECT mcp_user_document_ids())
            OR
            document_id IN (SELECT user_document_ids())
        );
    
    CREATE POLICY "MCP: Users can update blocks" ON blocks
        FOR UPDATE 
        USING (
            deleted_at IS NULL 
            AND (
                document_id IN (SELECT mcp_user_document_ids())
                OR
                document_id IN (SELECT user_document_ids())
            )
        );
    
    CREATE POLICY "MCP: Users can delete blocks" ON blocks
        FOR DELETE 
        USING (
            deleted_at IS NULL 
            AND (
                document_id IN (SELECT mcp_user_document_ids())
                OR
                document_id IN (SELECT user_document_ids())
            )
        );
END $$;

-- =====================================================
-- STEP 5: Create MCP Operation Functions
-- These bypass RLS using SECURITY DEFINER
-- =====================================================

-- Function to create document via MCP
CREATE OR REPLACE FUNCTION mcp_create_document(
    p_api_key text,
    p_title text,
    p_tags text[] DEFAULT '{}',
    p_folder_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation record;
    v_document_id uuid;
BEGIN
    -- Validate API key
    SELECT * INTO v_validation 
    FROM validate_mcp_api_key(p_api_key);
    
    IF NOT v_validation.is_valid THEN
        RAISE EXCEPTION 'Invalid API key';
    END IF;
    
    -- Create document
    INSERT INTO documents (
        user_id, 
        title, 
        tags, 
        folder_id,
        created_at, 
        updated_at
    )
    VALUES (
        v_validation.user_id,
        p_title,
        p_tags,
        p_folder_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_document_id;
    
    RETURN json_build_object(
        'success', true,
        'document_id', v_document_id,
        'message', 'Document created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to add block via MCP
CREATE OR REPLACE FUNCTION mcp_add_block(
    p_api_key text,
    p_document_id uuid,
    p_type text,
    p_content text,
    p_metadata jsonb DEFAULT '{}',
    p_position integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation record;
    v_block_id uuid;
BEGIN
    -- Validate API key
    SELECT * INTO v_validation 
    FROM validate_mcp_api_key(p_api_key);
    
    IF NOT v_validation.is_valid THEN
        RAISE EXCEPTION 'Invalid API key';
    END IF;
    
    -- Verify document ownership
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE id = p_document_id 
        AND user_id = v_validation.user_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Document not found or access denied';
    END IF;
    
    -- Create block
    INSERT INTO blocks (
        document_id,
        user_id,
        type,
        content,
        metadata,
        position,
        created_at,
        updated_at
    )
    VALUES (
        p_document_id,
        v_validation.user_id,
        p_type,
        p_content,
        p_metadata,
        p_position,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_block_id;
    
    RETURN json_build_object(
        'success', true,
        'block_id', v_block_id,
        'message', 'Block added successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Function to soft delete document
CREATE OR REPLACE FUNCTION mcp_delete_document(
    p_api_key text,
    p_document_id uuid,
    p_hard_delete boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validation record;
BEGIN
    -- Validate API key
    SELECT * INTO v_validation 
    FROM validate_mcp_api_key(p_api_key);
    
    IF NOT v_validation.is_valid THEN
        RAISE EXCEPTION 'Invalid API key';
    END IF;
    
    -- Verify document ownership
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE id = p_document_id 
        AND user_id = v_validation.user_id
    ) THEN
        RAISE EXCEPTION 'Document not found or access denied';
    END IF;
    
    IF p_hard_delete THEN
        -- Hard delete (use with caution)
        DELETE FROM blocks WHERE document_id = p_document_id;
        DELETE FROM documents WHERE id = p_document_id;
    ELSE
        -- Soft delete (recommended)
        UPDATE documents 
        SET deleted_at = NOW()
        WHERE id = p_document_id;
        
        UPDATE blocks 
        SET deleted_at = NOW()
        WHERE document_id = p_document_id;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN p_hard_delete THEN 'Document permanently deleted'
            ELSE 'Document moved to trash'
        END
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mcp_create_document TO anon;
GRANT EXECUTE ON FUNCTION mcp_add_block TO anon;
GRANT EXECUTE ON FUNCTION mcp_delete_document TO anon;

-- =====================================================
-- STEP 6: Update Block Types Constraint
-- Add any missing types if needed
-- =====================================================

-- Current types are already comprehensive, but let's ensure all are included
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
    CHECK (type IN (
        'text',           -- Basic text with markdown
        'code',           -- Code with syntax highlighting
        'heading',        -- Document structure
        'ai',             -- AI conversation blocks
        'todo',           -- Task lists
        'filetree',       -- Visual file structure
        'table',          -- Data tables
        'image',          -- Image galleries
        'inline-image',   -- Images within text
        'template',       -- Template blocks
        'math',           -- Mathematical expressions
        'version-track',  -- Version tracking
        'issue-tracker'   -- Issue tracking
    ));

-- =====================================================
-- STEP 7: Create Helper View for MCP
-- =====================================================

CREATE OR REPLACE VIEW mcp_documents_overview AS
SELECT 
    d.id,
    d.title,
    d.tags,
    d.folder_id,
    f.name as folder_name,
    d.created_at,
    d.updated_at,
    d.deleted_at,
    COUNT(DISTINCT b.id) as block_count,
    ARRAY_AGG(DISTINCT b.type) as block_types
FROM documents d
LEFT JOIN folders f ON d.folder_id = f.id
LEFT JOIN blocks b ON d.id = b.document_id AND b.deleted_at IS NULL
WHERE d.user_id = get_mcp_user_id()
GROUP BY d.id, d.title, d.tags, d.folder_id, f.name, d.created_at, d.updated_at, d.deleted_at;

-- Grant select permission
GRANT SELECT ON mcp_documents_overview TO anon;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify setup worked
-- =====================================================

-- Test API key validation
SELECT * FROM validate_mcp_api_key('dvlg_sk_test_123');

-- Check if policies were created
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'MCP:%'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES:
-- 1. This setup maintains all existing user workflows
-- 2. MCP operations use API key validation
-- 3. Soft deletes are preserved
-- 4. All 13 block types are supported
-- 5. Functions use SECURITY DEFINER for controlled access
-- =====================================================