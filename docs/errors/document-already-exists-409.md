# Document Already Exists 409 Error

**Date Solved**: 2025-01-20  
**Severity**: High  
**Category**: Backend/Database  

## Symptoms
- Documents failing to save after initial creation
- 409 Conflict errors in console
- Auto-save repeatedly failing
- Error occurs for documents that were successfully saved before
- Affects documents with folder assignments

## Error Messages
```
POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/rpc/create_document_with_folder_check 409 (Conflict)
Error saving document: {code: '23505', message: 'Document with this ID already exists'}
```

## Root Cause
The system incorrectly identified existing documents as "new" and tried to CREATE them instead of UPDATE:

1. **Faulty condition**: The `isNewDocumentForSave` check was TRUE when:
   ```javascript
   !docData.createdAt || 
   docData.metadata?.createdLocally === true ||
   docData.metadata?.isNewDocument === true
   ```

2. **Metadata flags not cleared**: Documents retained `createdLocally` or `isNewDocument` flags even after being saved

3. **Wrong operation**: When a document with a folder_id was incorrectly marked as "new", the system used `create_document_with_folder_check` (INSERT) instead of UPDATE

4. **Unique constraint violation**: PostgreSQL error 23505 because document ID already exists

## Solution
Fixed the new document detection logic:
```javascript
// Old logic - too broad
const isNewDocumentForSave = !docData.createdAt || 
                             docData.metadata?.createdLocally === true ||
                             docData.metadata?.isNewDocument === true;

// New logic - only truly new documents
const isNewDocumentForSave = !docData.createdAt && !docData.created_at;
```

Also ensured `created_at` field is checked (database field name with underscore).

## Files Changed
- `src/utils/storage/SupabaseAdapter.js`: 
  - Line 458: Updated `isNewDocumentForSave` condition
  - Line 506: Added fallback for `created_at` field

## Prevention
1. **Clear identification of new vs existing**: Use database presence, not metadata flags
2. **Consistent field naming**: Handle both `createdAt` and `created_at` variations
3. **Clean up metadata flags**: Ensure temporary flags are cleared after operations
4. **Use UPSERT when possible**: For operations that might be create or update
5. **Separate concerns**: Different code paths for:
   - New document creation (INSERT)
   - Existing document updates (UPDATE)
   - Documents with/without folders

## Related Issues
- IndexedDB sync with Supabase
- Metadata flag management
- Create vs Update detection
- Unique constraint handling

## Lessons Learned
- Metadata flags can become stale and shouldn't be the sole indicator of document state
- Always check actual database state rather than relying on client-side flags
- Consider the source of data (IndexedDB vs Supabase) when determining operations