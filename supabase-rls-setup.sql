-- =====================================================
-- COMPLETE RLS SETUP FOR DEVLOG MCP INTEGRATION
-- This enables all capabilities for authenticated users
-- =====================================================

-- Note: The MCP uses the anon key but authenticates with user_id
-- We need policies that check user_id matches in all operations

-- =====================================================
-- 1. DOCUMENTS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist (optional, be careful in production)
-- DROP POLICY IF EXISTS "Users can view own documents" ON documents;
-- DROP POLICY IF EXISTS "Users can create own documents" ON documents;
-- DROP POLICY IF EXISTS "Users can update own documents" ON documents;
-- DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- Policy: Users can create their own documents
CREATE POLICY "Users can create own documents" ON documents
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- Policy: Users can delete their own documents (soft delete)
CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- =====================================================
-- 2. BLOCKS TABLE POLICIES (All 11 block types)
-- =====================================================

-- Enable RLS on blocks table
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view blocks of their documents
CREATE POLICY "Users can view own blocks" ON blocks
    FOR SELECT USING (
        user_id::text = auth.uid()::text OR 
        user_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = blocks.document_id 
            AND (documents.user_id::text = auth.uid()::text OR documents.user_id = auth.uid()::text)
        )
    );

-- Policy: Users can create blocks in their documents
CREATE POLICY "Users can create own blocks" ON blocks
    FOR INSERT WITH CHECK (
        user_id::text = auth.uid()::text OR 
        user_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = blocks.document_id 
            AND (documents.user_id::text = auth.uid()::text OR documents.user_id = auth.uid()::text)
        )
    );

-- Policy: Users can update blocks in their documents
CREATE POLICY "Users can update own blocks" ON blocks
    FOR UPDATE USING (
        user_id::text = auth.uid()::text OR 
        user_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = blocks.document_id 
            AND (documents.user_id::text = auth.uid()::text OR documents.user_id = auth.uid()::text)
        )
    );

-- Policy: Users can delete blocks from their documents
CREATE POLICY "Users can delete own blocks" ON blocks
    FOR DELETE USING (
        user_id::text = auth.uid()::text OR 
        user_id = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = blocks.document_id 
            AND (documents.user_id::text = auth.uid()::text OR documents.user_id = auth.uid()::text)
        )
    );

-- =====================================================
-- 3. FOLDERS TABLE POLICIES (if you have folders)
-- =====================================================

-- Assuming you have a folders table
-- ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can manage own folders" ON folders
--     FOR ALL USING (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- =====================================================
-- 4. DOCUMENT_LINKS TABLE POLICIES
-- =====================================================

-- Enable RLS on document_links table (for linking documents)
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage links between their documents
CREATE POLICY "Users can manage own document links" ON document_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM documents 
            WHERE documents.id = document_links.source_document_id 
            AND (documents.user_id::text = auth.uid()::text OR documents.user_id = auth.uid()::text)
        )
    );

-- =====================================================
-- 5. IMAGES TABLE POLICIES (if you have images)
-- =====================================================

-- ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can manage own images" ON images
--     FOR ALL USING (user_id::text = auth.uid()::text OR user_id = auth.uid()::text);

-- =====================================================
-- 6. SPECIAL CONSIDERATION FOR MCP WITH ANON KEY
-- =====================================================

-- Since MCP uses anon key but provides user_id in the request,
-- we need a special approach. Create a function to validate this:

CREATE OR REPLACE FUNCTION is_valid_mcp_request(provided_user_id text)
RETURNS boolean AS $$
BEGIN
    -- For MCP requests, we trust the user_id provided if:
    -- 1. It matches the auth.uid() (for authenticated requests)
    -- 2. OR it's a valid UUID (for MCP with anon key)
    
    -- Check if authenticated user
    IF auth.uid() IS NOT NULL THEN
        RETURN provided_user_id::text = auth.uid()::text;
    END IF;
    
    -- For anon requests (MCP), validate the user_id format
    -- In production, you'd want to validate against your API keys table
    BEGIN
        -- Check if it's a valid UUID
        RETURN provided_user_id::uuid IS NOT NULL;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN false;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ALTERNATIVE: SIMPLER APPROACH FOR MCP
-- =====================================================

-- If the above is too complex, you can use this simpler approach
-- that just checks if user_id matches the one in the row:

-- For documents table (simplified)
CREATE POLICY "MCP can manage documents" ON documents
    FOR ALL USING (
        -- Always allow if user_id in the row matches the one provided
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR 
        -- For MCP with specific user_id
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    );

-- For blocks table (simplified)
CREATE POLICY "MCP can manage blocks" ON blocks
    FOR ALL USING (
        -- Check user_id matches
        user_id = current_setting('request.jwt.claims', true)::json->>'sub'
        OR 
        -- For MCP with specific user_id
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    );

-- =====================================================
-- 8. ENABLE ALL BLOCK TYPES
-- =====================================================

-- Ensure the blocks table accepts all 11 block types
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
        'version-track',  -- Version tracking blocks
        'issue-tracker'   -- Issue tracking blocks
    ));

-- =====================================================
-- 9. FUNCTIONS FOR ADVANCED OPERATIONS
-- =====================================================

-- Function to move document to another folder
CREATE OR REPLACE FUNCTION move_document_to_folder(
    p_document_id uuid,
    p_folder_id uuid,
    p_user_id text
)
RETURNS boolean AS $$
BEGIN
    UPDATE documents 
    SET folder_id = p_folder_id,
        updated_at = NOW()
    WHERE id = p_document_id 
    AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder blocks
CREATE OR REPLACE FUNCTION reorder_blocks(
    p_document_id uuid,
    p_block_ids uuid[],
    p_user_id text
)
RETURNS boolean AS $$
DECLARE
    i integer;
BEGIN
    -- Verify user owns the document
    IF NOT EXISTS (
        SELECT 1 FROM documents 
        WHERE id = p_document_id AND user_id = p_user_id
    ) THEN
        RETURN false;
    END IF;
    
    -- Update positions
    FOR i IN 1..array_length(p_block_ids, 1)
    LOOP
        UPDATE blocks 
        SET position = i - 1
        WHERE id = p_block_ids[i] 
        AND document_id = p_document_id;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. GRANT PERMISSIONS FOR ANON ROLE
-- =====================================================

-- Grant necessary permissions to anon role for MCP
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Test with a simple insert first
-- 3. The MCP integration hardcodes user_id in auth.ts
-- 4. For production, implement proper API key validation
-- =====================================================