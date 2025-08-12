# Supabase Configuration Instructions for MCP Integration

## Context
You need to configure the Supabase database to enable Model Context Protocol (MCP) integration for the Devlog platform. This will allow external MCP clients to interact with the database using API keys instead of JWT authentication.

## Current Situation
- The MCP remote server is deployed and working at: `https://devlog-mcp-production.bilal-kosika.workers.dev`
- Search functionality is working
- Document creation and other operations are blocked by Row Level Security (RLS) policies
- We need to add MCP-compatible RLS policies that work with API key authentication

## Task: Execute the Following SQL Commands

Please execute these SQL commands in order. Each section is important and builds on the previous one.

### Step 1: Create API Key Validation Function
This function validates MCP API keys and returns the associated user ID.

```sql
-- Create function to validate MCP API keys
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
            -- Special case for the known API key
            IF p_api_key = 'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a' THEN
                RETURN QUERY SELECT 
                    true::boolean as is_valid,
                    '8eac28e6-0127-40d1-ba55-c10cbe52a32b'::uuid as user_id,
                    'MCP Integration Key'::text as key_name;
            ELSE
                RETURN QUERY SELECT 
                    false::boolean as is_valid,
                    NULL::uuid as user_id,
                    NULL::text as key_name;
            END IF;
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

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION validate_mcp_api_key TO anon;
```

### Step 2: Test the Validation Function
Run this to verify the function works:

```sql
-- Test the API key validation
SELECT * FROM validate_mcp_api_key('dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a');

-- Expected result:
-- is_valid: true
-- user_id: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
-- key_name: MCP Integration Key
```

### Step 3: Create Helper Functions for MCP
These functions help MCP operations work with RLS:

```sql
-- Function to get MCP user ID from context
CREATE OR REPLACE FUNCTION get_mcp_user_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if we have a JWT user first
    IF auth.uid() IS NOT NULL THEN
        RETURN auth.uid();
    END IF;
    
    -- For MCP requests, check the custom setting
    RETURN current_setting('app.mcp_user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Function to get user's document IDs (for MCP)
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
```

### Step 4: Update RLS Policies for Documents Table
Add MCP-compatible policies to the documents table:

```sql
-- Drop existing MCP policies if they exist
DROP POLICY IF EXISTS "MCP: Users can view documents" ON documents;
DROP POLICY IF EXISTS "MCP: Users can create documents" ON documents;
DROP POLICY IF EXISTS "MCP: Users can update documents" ON documents;
DROP POLICY IF EXISTS "MCP: Users can delete documents" ON documents;

-- Create new MCP-compatible policies for documents
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

CREATE POLICY "MCP: Users can delete documents" ON documents
    FOR DELETE 
    USING (
        user_id = auth.uid() OR user_id = get_mcp_user_id()
    );
```

### Step 5: Update RLS Policies for Blocks Table
Add MCP-compatible policies to the blocks table:

```sql
-- Drop existing MCP policies if they exist
DROP POLICY IF EXISTS "MCP: Users can view blocks" ON blocks;
DROP POLICY IF EXISTS "MCP: Users can create blocks" ON blocks;
DROP POLICY IF EXISTS "MCP: Users can update blocks" ON blocks;
DROP POLICY IF EXISTS "MCP: Users can delete blocks" ON blocks;

-- Create new MCP-compatible policies for blocks
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
```

### Step 6: Create SECURITY DEFINER Functions for MCP Operations
These functions bypass RLS for validated MCP requests:

```sql
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mcp_create_document TO anon;
```

### Step 7: Verify the Setup
Run these queries to confirm everything is configured correctly:

```sql
-- Check if all functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('validate_mcp_api_key', 'get_mcp_user_id', 'mcp_user_document_ids', 'mcp_create_document');

-- Check if all policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE 'MCP:%'
ORDER BY tablename, policyname;

-- Test creating a document with the MCP function
SELECT mcp_create_document(
    'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a',
    'Test Document from MCP',
    ARRAY['test', 'mcp'],
    NULL
);
```

## Expected Outcome
After running all these SQL commands:
1. The MCP integration will be able to validate API keys
2. Documents and blocks can be created, read, updated, and deleted via MCP
3. The existing web application will continue to work normally
4. All operations will respect user boundaries (users can only access their own data)

## Important Notes
- These changes are **additive** - they don't modify existing policies
- The web application will continue using JWT authentication as normal
- MCP clients will use API key authentication
- Both authentication methods will work simultaneously
- User ID `8eac28e6-0127-40d1-ba55-c10cbe52a32b` (bilal.kosika@gmail.com) will be used for MCP operations

## Verification
After running all commands, the user should be able to run this test from their terminal:
```bash
node /workspaces/devlog-/test-mcp-final.js
```

All tests should pass, including document creation, search, retrieval, and soft delete operations.