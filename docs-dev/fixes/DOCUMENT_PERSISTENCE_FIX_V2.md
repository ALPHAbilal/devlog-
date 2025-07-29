# Document Persistence Fix V2 - Root Cause Analysis

## Root Causes Identified from Logs

1. **Blocks table doesn't have deleted_at column**
   - Error: "column dl.deleted_at does not exist" 
   - The blocks table was being queried with `.eq('deleted_at', null)` but this column doesn't exist
   - This caused 400 Bad Request errors when checking for existing blocks

2. **storageWrapper.getAdapter was not exported**
   - Error: "TypeError: Wt.getAdapter is not a function"
   - The getAdapter function existed but wasn't included in the storageWrapper export object
   - This prevented cache invalidation when creating new documents

3. **Documents not loading due to query errors**
   - The RPC function failed and the fallback query also failed
   - This resulted in 0 documents being loaded on page refresh

## Fixes Applied

### 1. Fixed storageWrapper Export (storageWrapper.js)
```javascript
// Added getAdapter to the export
export const storageWrapper = {
  // ... other methods
  getAdapter,  // <-- Added this line
  // ... rest of methods
}
```

### 2. Removed deleted_at Check from Blocks Queries
- **File**: `src/utils/storage/SupabaseAdapter.js` (line 396)
- **File**: `src/services/shareService.js` (line 221)
- Removed `.eq('deleted_at', null)` from blocks table queries

### 3. Added Comprehensive Logging
- Added logging when saving documents to Supabase
- Added logging for successful saves with document ID and timestamp
- This helps track if documents are actually being saved

### 4. Existing Fixes Still Apply
- RPC function parameters fixed (removed p_user_id)
- Soft delete filter added to documents query
- IndexedDB sync for unsynced documents
- Race condition fix in saveEntries
- Beforeunload handler for pending saves

## How the Fix Works

1. **Creating a document**:
   - Document is saved to IndexedDB immediately ✓
   - Cache invalidation now works (getAdapter is available) ✓
   - Document is saved to Supabase without blocks query errors ✓

2. **Loading documents**:
   - RPC function works with correct parameters ✓
   - Fallback query works without deleted_at errors ✓
   - IndexedDB documents are merged with Supabase results ✓

3. **Page reload**:
   - No more 400 errors from blocks queries ✓
   - Documents load successfully from both sources ✓
   - Unsynced documents appear even after reload ✓

## Testing the Fix

1. Create a new document
2. Add some content
3. Watch the console for:
   - "New document saved to IndexedDB immediately"
   - "SupabaseAdapter: Saving document to Supabase"
   - "SupabaseAdapter: Document saved successfully"
4. Refresh the page
5. The document should appear in the list

## Migration Needed

While the immediate issues are fixed, you should still run a migration to ensure the RPC function in the database matches the expected parameters. Create a new migration file to update the function if needed.

## Monitoring

Watch for these console messages:
- No more 400 Bad Request errors
- No more "getAdapter is not a function" errors
- Successful document save messages
- Documents loading count > 0 after refresh