# Test Delete Blocks Fix

## Test Procedure

1. **Create Test Blocks**:
   - Add a few text blocks
   - Add a code block
   - Note their IDs

2. **Test Single Block Deletion**:
   - Delete one block using the X button
   - Check console for:
     - `[DELETE] Finding block:`
     - `[DELETE-SUCCESS] Block marked for deletion:`
   - Refresh the page
   - **Expected**: Deleted block should NOT reappear

3. **Test Batch Deletion**:
   - Select multiple blocks (Shift+Click)
   - Delete them all at once
   - Check console for multiple deletion logs
   - Refresh the page
   - **Expected**: None of the deleted blocks should reappear

4. **Verify in Database** (Optional):
   - Check Supabase dashboard
   - Query: `SELECT id, type, deleted_at FROM blocks WHERE document_id = 'YOUR_DOC_ID'`
   - Deleted blocks should have `deleted_at` timestamp

## Console Logs to Watch

```javascript
// Successful deletion flow:
[DELETE] Finding block: {blockId: '...', blockFound: true, ...}
[DEBUG-FIX] DELETE operation with: {blockId: '...', blockType: '...', position: 0, action: 'DELETE'}
SmartSync: Syncing 1 changes
SmartSync: RPC response: {success: true, processed: 1, ...}
[DELETE-SUCCESS] Block marked for deletion: {blockId: '...', syncResult: {...}}
SessionCache: Cleared block ... from document ...
```

## What Was Fixed

1. **Database Function**: 
   - Changed from `SECURITY INVOKER` to `SECURITY DEFINER` for proper permissions
   - Added row count verification for DELETE operations
   - Added proper error logging

2. **Frontend Queries**:
   - Added `.is('deleted_at', null)` filter to all block loading queries
   - This prevents soft-deleted blocks from being loaded

3. **Cache Clearing**:
   - Added cache clearing after successful deletion
   - Prevents deleted blocks from reappearing from cache

4. **Verification**:
   - Added success/error logging for delete operations
   - Better visibility into what's happening

## Troubleshooting

If blocks still reappear after deletion:

1. **Check Console Errors**:
   - Look for `[DELETE-ERROR]` messages
   - Check for RPC errors

2. **Verify Migration Applied**:
   - In Supabase SQL Editor, run:
   ```sql
   SELECT prosecdef FROM pg_proc WHERE proname = 'batch_sync_changes';
   ```
   - Should return `true` (indicating SECURITY DEFINER)

3. **Check Indexes Exist**:
   - In Supabase SQL Editor, run:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'blocks' 
   AND indexname LIKE '%deleted%';
   ```
   - Should show the deleted_at indexes

4. **Verify Soft Delete is Working**:
   - After deleting a block, check in Supabase:
   ```sql
   SELECT id, type, position, deleted_at 
   FROM blocks 
   WHERE id = 'DELETED_BLOCK_ID';
   ```
   - Should show the block with a `deleted_at` timestamp