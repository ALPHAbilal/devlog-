# Document Persistence Fix V2 - Root Cause Analysis

## Critical Fix: Document Title Editing Causing Entry ID Loss

### Problem
When editing a document title in `DocumentPage`, the document would lose its `id` property, causing:
- `TypeError: Cannot read properties of undefined (reading 'substring')`
- `[ExpandedViewEnhanced] Cannot save title: entry or entry.id is undefined`
- Document becoming unusable after title edit

### Root Cause
**File**: `src/pages/DocumentPage.jsx`

The `handleUpdate` function had an incorrect signature:
- **Expected**: `handleUpdate(updatedDocument)` - single parameter
- **Actual**: `onUpdate(entryId, updates)` - two parameters (as called by `ExpandedViewEnhanced`)

When `ExpandedViewEnhanced` called `onUpdate(entry.id, { title: 'new title' })`:
1. `handleUpdate` received `entry.id` (a string) as the first parameter
2. `setDocument(entry.id)` set `document` to a string instead of an object
3. `document.id` became `undefined` because strings don't have an `id` property

### Fix Applied
Updated `DocumentPage.jsx` `handleUpdate` to:
1. Accept correct signature: `(entryId, updates)` instead of `(updatedDocument)`
2. Merge updates into current document: `{ ...document, ...updates, id: document.id }`
3. Always preserve `id` field explicitly
4. Save to storage after updating

**Code Change**:
```javascript
// BEFORE (WRONG):
const handleUpdate = useCallback((updatedDocument) => {
  setDocument(updatedDocument);
}, []);

// AFTER (CORRECT):
const handleUpdate = useCallback(async (entryId, updates) => {
  if (!document || !document.id) return;
  const updatedDocument = {
    ...document,
    ...updates,
    id: document.id, // CRITICAL: Always preserve id
    updated_at: new Date().toISOString()
  };
  setDocument(updatedDocument);
  await storageWrapper.saveDocument({ ...updatedDocument, blocks: undefined });
}, [document, navigate]);
```

### Additional Safeguards Added
- **ExpandedViewEnhanced.jsx**: Added guards against `undefined` entry or `entry.id` throughout
- **Dashboard.jsx**: Added `id` preservation when creating `updatedEntry`
- All components now validate `entry.id` exists before using it

---

## Previous Root Causes Identified

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

### 3. Document Title Editing Fix (Latest)
- **File**: `src/pages/DocumentPage.jsx`
- Fixed `handleUpdate` function signature mismatch
- Now correctly handles `(entryId, updates)` signature from `ExpandedViewEnhanced`
- Always preserves document `id` when merging updates
- See "Critical Fix: Document Title Editing Causing Entry ID Loss" section above for details

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