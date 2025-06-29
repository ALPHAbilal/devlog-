# Table Block Persistence Debug Guide

## Steps to Test:

1. **Open Browser Console** (F12)
2. **Navigate to a document with a table block**
3. **Edit the table** (add some data to cells)
4. **Look for these console logs:**

### Expected Log Sequence:

1. 🟦 **TableBlock: saveTable called** - Shows the data being saved
2. 🟩 **ExpandedViewEnhanced: updateBlock called** - Shows data passed to update
3. 🟨 **SupabaseAdapter: Processing block for save** - Shows how block is prepared
4. 🟨 **SupabaseAdapter: Block prepared for DB** - Shows final metadata assignment

### After Page Reload:

1. 🟧 **SupabaseAdapter: transformBlockFromDB called** - Shows data from database
2. 🟧 **SupabaseAdapter: Restoring data property** - Shows table data restoration
3. 🟦 **TableBlock: Initializing with block data** - Shows what TableBlock receives

## What to Check:

1. **Is `metadata` being saved with table data?**
   - Look for `metadataAssigned` in SupabaseAdapter logs
   - Should contain headers, rows, columnAlignments

2. **Is `metadata` being loaded correctly?**
   - Check `restoredData` in transformBlockFromDB logs
   - Should not be empty object

3. **Is TableBlock receiving the data?**
   - Check `blockData` in TableBlock initialization
   - Should contain the saved table structure

## Quick Database Check:

Run this query in Supabase SQL editor:
```sql
SELECT id, type, metadata 
FROM blocks 
WHERE type = 'table' 
AND document_id = 'YOUR_DOCUMENT_ID';
```

The metadata column should contain your table data.