# Supabase Preview Column Missing

**Date Solved**: 2025-01-20  
**Severity**: High  
**Category**: Database/Backend  

## Symptoms
- Document saves failing with 400 Bad Request
- Auto-save repeatedly attempting and failing
- New documents with folders cannot be created
- Error appears when using `create_document_with_folder_check` RPC function

## Error Messages
```
POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/rpc/create_document_with_folder_check 400 (Bad Request)
Error saving document: {code: '42703', message: 'column "preview" of relation "documents" does not exist'}
```

## Root Cause
The database schema evolved over time:
1. Originally, the `documents` table had a `preview` column
2. The preview data was migrated to be stored in the `metadata` JSONB field
3. The `preview` column was removed from the table
4. The `create_document_with_folder_check` function was not updated to reflect this change
5. The function still tried to INSERT into the non-existent `preview` column

## Solution
Created and applied a database migration to update the function:
1. Removed `preview` from the INSERT column list
2. Removed `p_preview` from the VALUES list
3. Kept the preview parameter for backward compatibility
4. Preview data continues to be stored in metadata->>'preview'

## Files Changed
- `supabase/migrations/20250120_fix_preview_column_issue.sql`: New migration file
- Function updated in Supabase via MCP tool

## Prevention
1. **Keep functions synchronized**: When changing table schema, audit all functions that interact with that table
2. **Use metadata for flexible fields**: Store variable/optional data in JSONB columns rather than dedicated columns
3. **Document schema changes**: Maintain a changelog of database schema modifications
4. **Test migrations thoroughly**: Include function testing in migration validation
5. **Version control database changes**: All schema and function changes should be in migration files

## Related Issues
- Database schema evolution
- JSONB vs column storage decisions
- RPC function maintenance
- Migration best practices

## Historical Context
Looking at the codebase:
- `preview: doc.metadata?.preview || doc.preview || 'Click to view document...'` shows the transition period
- Older functions (from January 2024) reference `d.preview` directly
- Current approach stores preview in metadata for flexibility