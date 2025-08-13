# Supabase Database Analysis Request for MCP Integration

Please analyze my Supabase database to help configure MCP (Model Context Protocol) integration. I need to understand the current state before making changes.

## 1. Check RLS Status on Main Tables

Run this SQL query and provide the results:

```sql
-- Check which tables have RLS enabled
SELECT 
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('documents', 'blocks', 'document_links', 'images', 'folders', 'profiles', 'api_keys')
ORDER BY tablename;
```

## 2. List All Existing RLS Policies

Run this query to see all current policies:

```sql
-- Get all policies with their details
SELECT 
    tablename as "Table",
    policyname as "Policy Name",
    cmd as "Operation",
    permissive as "Permissive",
    roles as "Roles",
    substring(qual::text, 1, 100) as "USING Condition (first 100 chars)",
    substring(with_check::text, 1, 100) as "WITH CHECK Condition (first 100 chars)"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('documents', 'blocks', 'document_links', 'images', 'folders')
ORDER BY tablename, policyname;
```

## 3. Check Blocks Table Constraints

Check what block types are allowed:

```sql
-- Check block type constraints
SELECT 
    conname as "Constraint Name",
    pg_get_constraintdef(oid) as "Constraint Definition"
FROM pg_constraint
WHERE conrelid = 'blocks'::regclass
AND contype = 'c';
```

## 4. Check for User UUID

Verify if this user exists and get related stats:

```sql
-- Check if user exists and document count
SELECT 
    '8eac28e6-0127-40d1-ba55-c10cbe52a32b' as user_id,
    EXISTS(
        SELECT 1 FROM documents 
        WHERE user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    ) as "User Exists in Documents",
    (
        SELECT COUNT(*) FROM documents 
        WHERE user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    ) as "Document Count",
    (
        SELECT COUNT(*) FROM blocks 
        WHERE user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    ) as "Block Count",
    (
        SELECT COUNT(DISTINCT type) FROM blocks 
        WHERE user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    ) as "Unique Block Types Used";
```

## 5. Check Authentication Functions

See if there are any custom auth functions:

```sql
-- List auth-related functions
SELECT 
    proname as "Function Name",
    pg_get_function_identity_arguments(oid) as "Arguments"
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND (
    proname LIKE '%auth%' 
    OR proname LIKE '%api%key%' 
    OR proname LIKE '%validate%'
    OR proname LIKE '%mcp%'
)
ORDER BY proname;
```

## 6. Check Table Structure

Get the structure of key tables:

```sql
-- Get column details for documents and blocks
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('documents', 'blocks')
ORDER BY table_name, ordinal_position;
```

## 7. Check for Existing API Key Management

See if there's an API keys table or related structure:

```sql
-- Check for API key related tables
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
    tablename LIKE '%api%' 
    OR tablename LIKE '%key%' 
    OR tablename LIKE '%token%'
);

-- If api_keys table exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'api_keys'
ORDER BY ordinal_position;
```

## 8. Check for Folder/Organization Features

See if folders are implemented:

```sql
-- Check if folders exist and their structure
SELECT 
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'folders' 
        AND table_schema = 'public'
    ) as "Folders Table Exists",
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' 
        AND column_name = 'folder_id' 
        AND table_schema = 'public'
    ) as "Documents Have folder_id";
```

## 9. Check Block Types Currently in Use

See what block types are actually being used:

```sql
-- Get block type distribution
SELECT 
    type as "Block Type",
    COUNT(*) as "Count"
FROM blocks
GROUP BY type
ORDER BY COUNT(*) DESC;
```

## 10. Check for Soft Delete Implementation

See if soft deletes are implemented:

```sql
-- Check for soft delete columns
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('deleted_at', 'deleted', 'is_deleted')
AND table_name IN ('documents', 'blocks', 'folders')
ORDER BY table_name;
```

## Summary Questions:

After running these queries, please also answer:

1. **Are there any custom RLS policies that reference specific user IDs?**
2. **Is there an existing API key validation system?**
3. **What's the current approach for user authentication (JWT claims, user_id column, etc.)?**
4. **Are there any triggers or functions that might affect document/block creation?**
5. **Is the database using soft deletes or hard deletes?**

## Context:

I'm setting up MCP (Model Context Protocol) integration that needs to:
- Create, read, update, delete documents and blocks
- Work with all 11 block types
- Use API key authentication (dvlg_sk_prod_...)
- Operate with user_id: 8eac28e6-0127-40d1-ba55-c10cbe52a32b

Please provide all query results and let me know if you see any potential issues or security concerns with adding MCP access.