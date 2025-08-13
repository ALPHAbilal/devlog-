-- =====================================================
-- ADD MISSING MCP_ADD_BLOCK FUNCTION
-- This completes the MCP integration
-- =====================================================

-- This function allows MCP to add blocks to documents
-- It was referenced in the code but not created in the initial setup

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
    -- Validate API key using existing function
    SELECT * INTO v_validation 
    FROM validate_mcp_api_key(p_api_key);
    
    IF NOT v_validation.is_valid THEN
        RAISE EXCEPTION 'Invalid API key';
    END IF;
    
    -- Verify document exists and user owns it
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE id = p_document_id 
        AND user_id = v_validation.user_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Document not found or access denied';
    END IF;
    
    -- Create the block
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
    
    -- Update document's updated_at timestamp
    UPDATE documents 
    SET updated_at = NOW()
    WHERE id = p_document_id;
    
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

-- Grant execute permission to anon role (for MCP access)
GRANT EXECUTE ON FUNCTION mcp_add_block TO anon;

-- =====================================================
-- VERIFICATION QUERY
-- Run this after creating the function to verify
-- =====================================================

-- Check if the function was created successfully
SELECT 
    proname as function_name,
    pronargs as num_arguments
FROM pg_proc 
WHERE proname = 'mcp_add_block';

-- Expected result:
-- function_name | num_arguments
-- mcp_add_block | 6