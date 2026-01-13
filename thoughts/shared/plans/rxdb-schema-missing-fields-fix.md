# RxDB Schema Missing Fields Fix - Implementation Plan

## Overview

Critical data loss bug where block-specific fields (`messages`, `data`, `treeData`, `images`) are being lost after app reload. The root cause is a mismatch between where serialization happens (replication push handler) vs where data is stored (RxDB).

## Current State Analysis

### The Problem

The data flow currently works like this:
```
UI Component (AIBlock, TableBlock, etc.)
    ↓
calls onUpdate(blockId, { messages: [...], data: {...}, etc. })
    ↓
use-blocks.ts: updateBlock → doc.patch({ messages: [...] })
    ↓
RxDB stores the doc (but blockSchema doesn't define 'messages')
    ↓
RxDB replication push handler: serializeBlock(doc)
    ↓
BUT: doc.messages is UNDEFINED because RxDB stripped it!
    ↓
serializeBlock sees messages=[] → content='{"messages":[]}'
    ↓
Supabase receives empty content
```

### Key Discoveries

1. **RxDB Schema** (`rxdb-schemas.ts:86-112`):
   - Only defines: `id`, `document_id`, `type`, `content`, `position`, `metadata`, timestamps, replication fields
   - Does NOT define: `messages`, `data`, `treeData`, `images`, `snapshots`

2. **Block Components** pass special fields directly:
   - `AIBlockRefined.jsx:53`: `onUpdate(block.id, { messages: updatedMessages })`
   - `TableBlock.jsx`: `onUpdate(block.id, { data: {...} })`
   - `FileTreeBlock.jsx`: `onUpdate(block.id, { treeData: [...], snapshots: [...] })`

3. **use-blocks.ts:111-115** passes updates directly to RxDB:
   ```typescript
   await doc.patch({
     ...updates,  // ← includes messages, data, etc.
     updated_at: Date.now(),
     _modified: Date.now(),
   })
   ```

4. **RxDB Behavior**: By default, RxDB ignores fields not in schema during `patch()`

5. **Serializer** (`serializer.ts:42-203`) is called in push handler (`rxdb-replication.ts:471-483`):
   - It tries to get `messages` from the doc, but RxDB already stripped it
   - `get(b, 'messages')` returns `undefined` → falls back to `[]`

### The Fix Strategy

**Option B from the bug report**: Serialize BEFORE RxDB storage.

This means:
1. Block components call `onUpdate(blockId, { messages: [...] })` (unchanged)
2. `use-blocks.ts` serializes the update into `content` field BEFORE patching RxDB
3. RxDB stores `content` (already in schema) with serialized data
4. Replication push handler sends `content` as-is (already serialized)
5. On pull, deserialize happens in the pull handler (already implemented)

## Desired End State

After this fix:
1. All block types preserve their data after page reload
2. Data flow: UI → serialize → RxDB (content) → Supabase (content) → pull → deserialize → UI
3. No RxDB schema changes needed (avoids migration complexity)
4. Backward compatible with existing data

### Verification Criteria
- AI blocks retain messages after reload
- Table blocks retain rows/headers after reload
- FileTree blocks retain treeData and snapshots after reload
- Todo blocks retain todos after reload
- Image blocks retain images array after reload
- Supabase `content` column shows non-empty JSON for special blocks

## What We're NOT Doing

- NOT changing RxDB schema (would require migration)
- NOT changing how block components call `onUpdate`
- NOT modifying the serializer logic
- NOT changing Supabase schema

## Implementation Approach

The fix requires modifying `use-blocks.ts` to serialize special fields into `content` before storing in RxDB, and deserialize when reading from RxDB.

## Phase 1: Add Serialization to use-blocks.ts

### Overview
Modify the hooks to serialize/deserialize blocks at the RxDB boundary.

### Changes Required

#### 1. Import serializer in use-blocks.ts
**File**: `src/shared/db/hooks/use-blocks.ts`

Add import at top:
```typescript
import { serializeBlock, deserializeBlock } from '@/features/block/lib/serializer';
```

#### 2. Modify toBlockData to deserialize
**File**: `src/shared/db/hooks/use-blocks.ts`

Change the `toBlockData` function (lines 25-35) to deserialize content:

```typescript
// Convert RxDB doc to BlockData format
function toBlockData(doc: BlockDocType): BlockData {
  // First convert to base structure
  const base = {
    id: doc.id,
    type: doc.type,
    content: doc.content,
    position: doc.position,
    metadata: doc.metadata,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };

  // Deserialize to expand content into messages/data/treeData/images
  return deserializeBlock(base as any) as BlockData;
}
```

#### 3. Modify createBlock to serialize
**File**: `src/shared/db/hooks/use-blocks.ts`

Change `createBlock` function (lines 81-98) to serialize before insert:

```typescript
// Create block
const createBlock = useCallback(async (block: BlockData) => {
  if (!collection || !documentId) return;

  const now = Date.now();

  // Serialize block to convert messages/data/treeData/images → content
  const serialized = serializeBlock({
    ...block,
    id: block.id || crypto.randomUUID(),
    created_at: block.created_at || now,
    updated_at: now,
  } as any);

  const newBlock: BlockDocType = {
    id: serialized.id,
    document_id: documentId,
    type: serialized.type,
    content: serialized.content || '',
    position: serialized.position,
    metadata: serialized.metadata || {},
    created_at: now,
    updated_at: now,
    _modified: now,
    _deleted: false,
  };

  await collection.insert(newBlock);
}, [collection, documentId]);
```

#### 4. Modify updateBlock to serialize
**File**: `src/shared/db/hooks/use-blocks.ts`

Change `updateBlock` function (lines 102-116) to serialize before patch:

```typescript
// Update block
const updateBlock = useCallback(async (id: string, updates: Partial<BlockData>) => {
  if (!collection) return;

  const doc = await collection.findOne(id).exec();
  if (!doc) {
    console.warn(`[useRxBlocks] Block ${id} not found`);
    return;
  }

  // Get current state and merge with updates
  const currentData = doc.toJSON();
  const merged = {
    ...currentData,
    ...updates,
  };

  // Serialize to convert messages/data/treeData/images → content
  const serialized = serializeBlock(merged as any);

  await doc.patch({
    content: serialized.content,
    metadata: serialized.metadata,
    updated_at: Date.now(),
    _modified: Date.now(),
  } as Partial<BlockDocType>);
}, [collection]);
```

#### 5. Modify updateBlocks (bulk) to serialize
**File**: `src/shared/db/hooks/use-blocks.ts`

Change `updateBlocks` function (lines 133-167) to serialize each block:

```typescript
// Bulk update (for reordering)
const updateBlocks = useCallback(async (newBlocks: BlockData[]) => {
  if (!collection || !documentId) return;

  const now = Date.now();

  // Update each block with new position
  for (let i = 0; i < newBlocks.length; i++) {
    const block = newBlocks[i];
    const doc = await collection.findOne(block.id).exec();

    // Serialize block
    const serialized = serializeBlock({
      ...block,
      position: i,
    } as any);

    if (doc) {
      await doc.patch({
        position: i,
        content: serialized.content,
        metadata: serialized.metadata,
        updated_at: now,
        _modified: now,
      } as Partial<BlockDocType>);
    } else {
      // Insert new block if doesn't exist
      await collection.insert({
        id: block.id || crypto.randomUUID(),
        document_id: documentId,
        type: serialized.type,
        content: serialized.content || '',
        position: i,
        metadata: serialized.metadata || {},
        created_at: now,
        updated_at: now,
        _modified: now,
        _deleted: false,
      });
    }
  }
}, [collection, documentId]);
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Dev server starts: `npm run dev`

#### Manual Verification:
- [ ] Create new AI block, add messages, reload page → messages persist
- [ ] Create new Table block, add rows, reload page → rows persist
- [ ] Create new FileTree block, add files, reload page → files persist
- [ ] Create new Todo block, add items, reload page → items persist
- [ ] Create new Image block, add images, reload page → images persist
- [ ] Check Supabase: `SELECT id, content FROM blocks WHERE type='ai'` shows non-empty content

---

## Phase 2: Update Replication Push Handler

### Overview
Since blocks are now serialized in RxDB, the push handler should NOT re-serialize. However, we need to ensure the flow is correct.

### Changes Required

#### 1. Verify push handler behavior
**File**: `src/shared/db/rxdb-replication.ts`

The push handler (lines 444-532) calls `serializeBlock` on the document. Since the document now has `content` already serialized, we need to check if `serializeBlock` handles this gracefully.

Looking at `serializer.ts:79-82`:
```typescript
if (block.type === 'text' || block.type === 'heading' || block.type === 'code') {
  dataToValidate = { content: get(b, 'content') || '' };
}
```

For blocks like `ai`, it looks for `messages`:
```typescript
} else if (block.type === 'ai') {
  dataToValidate = {
    messages: get(b, 'messages') || [],
    metadata: get(b, 'metadata') || {}
  };
}
```

**Issue**: The serializer expects `messages` field, but after Phase 1, it's already inside `content`.

**Fix**: The push handler should check if `content` is already a string (serialized) and skip re-serialization:

```typescript
// In push handler, before serializeBlock call:
if (tableName === 'blocks' && docToProcess.type) {
  // Check if content is already serialized (string)
  if (typeof docToProcess.content === 'string' && docToProcess.content.startsWith('{')) {
    // Already serialized, skip
    console.log(`[RxDB Replication] ${tableName}: Block ${newDoc.id} already serialized, skipping`);
  } else {
    try {
      docToProcess = serializeBlock(docToProcess);
      // ... rest of logging
    } catch (serializeErr) {
      // ... error handling
    }
  }
}
```

Actually, looking more carefully at the serializer, it handles the case where content already exists. Let me re-check.

In `serializeBlock`:
- For `ai` type: `messages: get(b, 'messages') || []`
- If `messages` is undefined, it uses `[]`
- Then serializes to `content: JSON.stringify({ messages: [], metadata: {} })`

This WILL cause data loss because the serializer doesn't check if content is already populated with the correct data.

**Better Fix**: Modify push handler to NOT re-serialize if content is already a valid JSON string:

```typescript
// In push handler (rxdb-replication.ts ~line 471)
if (tableName === 'blocks' && docToProcess.type) {
  // Skip serialization if content is already a valid JSON string
  // (means it was serialized at the use-blocks.ts layer)
  const contentIsAlreadySerialized =
    typeof docToProcess.content === 'string' &&
    docToProcess.content.length > 2 &&  // Not just "{}"
    docToProcess.content.startsWith('{');

  if (!contentIsAlreadySerialized) {
    try {
      docToProcess = serializeBlock(docToProcess);
      console.log(`[RxDB Replication] ${tableName}: Serialized block ${newDoc.id}`, {
        type: docToProcess.type,
        contentLength: docToProcess.content?.length || 0
      });
    } catch (serializeErr) {
      console.error(`[RxDB Replication] ${tableName}: Serialization failed for ${newDoc.id}`, serializeErr);
    }
  } else {
    console.log(`[RxDB Replication] ${tableName}: Block ${newDoc.id} already serialized, content length: ${docToProcess.content.length}`);
  }
}
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Dev server starts: `npm run dev`

#### Manual Verification:
- [ ] Make a change to an AI block, check console for "already serialized" log
- [ ] Verify Supabase content is correct (not double-serialized)

---

## Phase 3: Handle Existing Data Migration

### Overview
Existing blocks in Supabase already have serialized content (thanks to the old SmartSync system or recent changes). We need to ensure:
1. Pull handler correctly deserializes them
2. They work correctly with the new flow

### Changes Required

The pull handler already calls `deserializeBlock` (line 392-406 in rxdb-replication.ts):
```typescript
if (tableName === 'blocks' && converted.type) {
  try {
    converted = deserializeBlock(converted as any) as any;
    // ... logging
  } catch (deserializeErr) {
    // ... error handling
  }
}
```

**Issue**: After deserialization, the block has `messages`, `data`, etc. But we're now storing these inside `content` in RxDB. So the pull handler needs to RE-serialize before storing in RxDB.

Wait, that's circular. Let me think about this more carefully.

**Current flow (after Phase 1 & 2)**:
1. **Create/Update in UI**: Component calls `updateBlock({ messages: [...] })`
2. **use-blocks.ts**: Serializes to `content`, stores in RxDB
3. **Push handler**: Sends `content` to Supabase (skips re-serialization)
4. **Supabase**: Stores `content` JSON

**Pull flow**:
1. **Pull handler**: Gets `content` from Supabase
2. **deserializeBlock**: Expands `content` into `messages`, `data`, etc.
3. **RxDB**: Stores the deserialized doc... but wait, we now need `content` to persist!

**Problem**: The pull handler deserializes, which extracts `messages` from `content`. But RxDB doesn't store `messages` in the schema. So on the next push, the data would be lost.

**Better Solution**: DON'T deserialize in the pull handler. Keep `content` as-is in RxDB.

Let me reconsider the architecture:

**Option A (Current plan, needs adjustment)**:
- Store serialized `content` in RxDB
- Deserialize when reading (in `toBlockData`)
- Serialize when writing (in `updateBlock`)
- Pull handler: DON'T deserialize, just store `content` as-is
- Push handler: DON'T re-serialize, send `content` as-is

This means:
- RxDB always has `content` as a JSON string
- UI always sees deserialized fields (`messages`, `data`, etc.)
- Serialization boundary is at use-blocks.ts

### Updated Changes Required

#### 1. Remove deserialization from pull handler
**File**: `src/shared/db/rxdb-replication.ts`

Remove or skip the deserialization in pull handler (lines 392-406):

```typescript
// REMOVE or comment out this section:
// Deserialize blocks - converts content JSON → messages/data/treeData/images
// if (tableName === 'blocks' && converted.type) {
//   try {
//     converted = deserializeBlock(converted as any) as any;
//     // ... logging
//   } catch (deserializeErr) {
//     // ... error handling
//   }
// }
```

The pull handler should just convert field names (snake_case → camelCase) and store in RxDB as-is.

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Dev server starts: `npm run dev`

#### Manual Verification:
- [ ] Clear IndexedDB, reload app
- [ ] Existing blocks from Supabase should load correctly with their data
- [ ] New blocks should save and load correctly

---

## Testing Strategy

### Unit Tests:
- Test `serializeBlock` with various block types
- Test `deserializeBlock` with various content formats
- Test round-trip: serialize → deserialize should preserve data

### Integration Tests:
- Create block → reload → verify data persists
- Create block → check Supabase → verify content is correct
- Sync from Supabase → verify block loads correctly

### Manual Testing Steps:
1. Clear IndexedDB in browser DevTools
2. Create a new AI block with 3 messages
3. Check browser console for serialization logs
4. Reload the page
5. Verify all 3 messages are still present
6. Check Supabase: `SELECT id, type, content FROM blocks WHERE type='ai' ORDER BY created_at DESC LIMIT 5`
7. Verify content contains the messages JSON

Repeat for:
- Table block (add 5 rows, 3 columns)
- FileTree block (add 10 files in folders)
- Todo block (add 5 items)
- Image block (add 3 images)

## Performance Considerations

- Serialization/deserialization adds minimal overhead (JSON.stringify/parse)
- Already happening in the replication layer, just moved to hooks layer
- No additional network requests

## Migration Notes

- No database migration required
- Existing data in Supabase is already serialized (content field has JSON)
- Existing data in IndexedDB may have unserialized blocks from before this fix
- First load after fix will pull from Supabase and store correctly

## References

- Bug report: `AI-MEMORY/debug/rxdb-schema-missing-fields.md`
- RxDB schemas: `src/shared/db/rxdb-schemas.ts:86-112`
- Block hooks: `src/shared/db/hooks/use-blocks.ts`
- Serializer: `src/features/block/lib/serializer.ts`
- Replication: `src/shared/db/rxdb-replication.ts`
