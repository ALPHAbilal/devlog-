# Implementation Plan: Fix Supabase Data Deletion Issue

## Root Cause Summary
The current "delete-then-insert" pattern is fundamentally flawed because:
1. It creates a destructive window where data is permanently lost if insertion fails
2. Race conditions occur when blocks array is empty or undefined
3. No transaction safety - delete and insert are separate operations
4. RLS policies might block insert after delete succeeds

## Solution Strategy: UPSERT with Atomic Operations

### Phase 1: Database Setup (Immediate)

#### 1.1 Create Atomic Save Function
Create a PostgreSQL function that handles the entire save operation in a transaction:

```sql
-- Run this in Supabase SQL editor
CREATE OR REPLACE FUNCTION save_document_blocks(
  doc_id UUID, 
  blocks JSONB
)
RETURNS VOID AS $$
BEGIN
  -- Delete existing blocks for this document
  DELETE FROM blocks WHERE document_id = doc_id AND user_id = auth.uid();
  
  -- Insert new blocks
  INSERT INTO blocks (id, document_id, user_id, type, content, position, metadata, created_at)
  SELECT 
    COALESCE((b->>'id')::UUID, gen_random_uuid()),
    doc_id,
    auth.uid(),
    b->>'type',
    b->>'content',
    (b->>'position')::INTEGER,
    (b->>'metadata')::JSONB,
    NOW()
  FROM jsonb_array_elements(blocks) AS b;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION save_document_blocks TO authenticated;
```

#### 1.2 Add Unique Constraint for UPSERT
```sql
-- Add composite unique constraint for UPSERT operations
ALTER TABLE blocks 
ADD CONSTRAINT blocks_document_position_unique 
UNIQUE (document_id, position);
```

### Phase 2: Update SupabaseAdapter (Today)

#### 2.1 Implement New Save Method
Replace the current saveDocument method with:

```javascript
async saveDocument(document) {
  const { blocks, ...docData } = document;
  
  // 1. Verify authentication first
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('Authentication error:', authError);
    throw new Error('Authentication required for save operation');
  }
  
  // 2. Save/update document metadata
  const { data: savedDoc, error: docError } = await supabase
    .from('documents')
    .upsert({
      id: docData.id,
      user_id: this.userId,
      title: docData.title,
      is_template: docData.isTemplate || false,
      tags: docData.tags || [],
      created_at: docData.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (docError) {
    console.error('Error saving document:', docError);
    throw docError;
  }
  
  // 3. Use atomic function to save blocks
  if (blocks && blocks.length > 0) {
    const blocksToSave = blocks.map((block, index) => ({
      id: block.id || null,
      type: block.type,
      content: block.content,
      position: index,
      metadata: block.metadata || {}
    }));
    
    const { error: blocksError } = await supabase.rpc('save_document_blocks', {
      doc_id: savedDoc.id,
      blocks: blocksToSave
    });
    
    if (blocksError) {
      console.error('Error saving blocks:', blocksError);
      throw blocksError;
    }
    
    console.log(`Successfully saved ${blocks.length} blocks atomically`);
  } else {
    // If no blocks, still call the function to clear existing blocks
    const { error: clearError } = await supabase.rpc('save_document_blocks', {
      doc_id: savedDoc.id,
      blocks: []
    });
    
    if (clearError) {
      console.error('Error clearing blocks:', clearError);
      throw clearError;
    }
  }
  
  // Invalidate cache after successful save
  this.invalidateCache();
  
  return savedDoc.id;
}
```

#### 2.2 Add Race Condition Prevention
Add to the SupabaseAdapter class:

```javascript
constructor(userId) {
  this.userId = userId;
  this.initialized = false;
  this.saveQueue = new Map(); // Prevent concurrent saves
  // ... existing code
}

async saveDocumentSafe(document) {
  const documentId = document.id;
  
  // Prevent concurrent saves for the same document
  if (this.saveQueue.has(documentId)) {
    console.log(`Waiting for previous save of document ${documentId} to complete`);
    await this.saveQueue.get(documentId);
  }
  
  const savePromise = this.saveDocument(document);
  this.saveQueue.set(documentId, savePromise);
  
  try {
    const result = await savePromise;
    return result;
  } finally {
    this.saveQueue.delete(documentId);
  }
}
```

### Phase 3: Update storageWrapper (Today)

Update the saveDocument method in storageWrapper to use the new safe method:

```javascript
export async function saveDocument(document) {
  const storageAdapter = await init();
  
  // Use the new safe save method if available
  if (storageAdapter.saveDocumentSafe) {
    return storageAdapter.saveDocumentSafe(document);
  } else if (storageAdapter.saveDocument) {
    return storageAdapter.saveDocument(document);
  }
  
  throw new Error('Current storage adapter does not support single document saves');
}
```

### Phase 4: Optimize RLS Policies (Optional, Later)

```sql
-- Optimize policies with SELECT wrapper for better performance
DROP POLICY IF EXISTS "Users can manage own blocks" ON blocks;

CREATE POLICY "Users can select own blocks" ON blocks
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own blocks" ON blocks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own blocks" ON blocks
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own blocks" ON blocks
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

## Testing Plan

1. **Test atomic saves**: Create a document with blocks, verify they save correctly
2. **Test empty blocks**: Save a document with no blocks, verify existing blocks are cleared
3. **Test concurrent saves**: Trigger multiple saves rapidly, verify no data loss
4. **Test error handling**: Disconnect network during save, verify rollback works
5. **Test with expired session**: Let session expire, verify auth error is handled

## Migration Steps

1. **Backup existing data** (if any critical data exists)
2. **Run SQL migrations** in Supabase dashboard
3. **Deploy updated code**
4. **Test with a few documents** before full rollout
5. **Monitor for any errors** in console logs

## Expected Outcomes

- **No more data loss** - Atomic operations ensure all-or-nothing saves
- **Better performance** - Single RPC call instead of delete + insert
- **Race condition protection** - Queue prevents concurrent saves
- **Improved error handling** - Clear error messages and rollback on failure

## Timeline

- **Today**: Implement database function and update JavaScript code
- **Tomorrow**: Test thoroughly with various scenarios
- **This week**: Monitor for any issues and optimize if needed

This plan addresses all the issues identified by the experts and provides a robust, production-ready solution.