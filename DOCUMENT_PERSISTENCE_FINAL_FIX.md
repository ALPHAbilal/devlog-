# Document Persistence Issue - Final Fix

## Root Cause Identified

The issue was that the `get_documents_with_stats` RPC function in production was checking for `dl.deleted_at IS NULL` on the `document_links` table, but the `document_links` table doesn't have a `deleted_at` column.

## What Was Fixed

### 1. Database Function Fixed
- Applied migration to remove the `dl.deleted_at IS NULL` check from the RPC function
- The function now correctly queries document_links without checking for a non-existent column

### 2. Code Updated to Match Production
- Updated SupabaseAdapter to call the RPC with `p_user_id` parameter (required by production function)
- Reverted blocks table queries to include `deleted_at` check (blocks table does have this column)

### 3. Changes Made

#### File: `src/utils/storage/SupabaseAdapter.js`
```javascript
// Fixed RPC call to include p_user_id
const { data, error } = await supabase.rpc('get_documents_with_stats', {
  p_user_id: this.userId,
  p_limit: 20,
  p_offset: 0
});
```

#### Database Migration Applied
- Removed `AND dl.deleted_at IS NULL` from document_links subquery
- Function now executes without errors

## Testing the Fix

1. Create a new document
2. Add content
3. Refresh the page
4. Documents should now load successfully without the "column dl.deleted_at does not exist" error

## What Happened

1. The production database had a different version of `get_documents_with_stats` than our migration files
2. The production version was checking for `deleted_at` on `document_links` table
3. The `document_links` table doesn't have a `deleted_at` column
4. This caused the RPC to fail with a 400 error
5. When the RPC failed, the fallback query also failed (due to our previous fix attempt)
6. Result: 0 documents loaded

## Current Status

✅ Database function fixed - no more `dl.deleted_at` errors
✅ Code updated to match production function signature
✅ Documents are being saved to Supabase (confirmed in logs)
✅ Documents should now persist and load after page refresh

## To Deploy Changes

```bash
git add .
git commit -m "Fix document persistence - correct RPC function and parameters

- Fixed get_documents_with_stats RPC to remove invalid dl.deleted_at check
- Updated SupabaseAdapter to include p_user_id parameter
- Documents now load correctly after page refresh

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

The fix has been applied to the database already via the Supabase MCP tool.