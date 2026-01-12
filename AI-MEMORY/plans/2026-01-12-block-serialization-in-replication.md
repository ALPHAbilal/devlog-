# Block Serialization in RxDB Replication - Implementation Plan

## Overview

Add block serialization/deserialization at the RxDB replication boundary to ensure special block data (messages, data, treeData, images) is properly stored in Supabase's `content` field and restored when pulled back.

## Current State Analysis

### The Problem
1. **Components store data in special fields**: `messages` (AI), `data` (IssueTracker, Todo, Table), `treeData`/`snapshots` (FileTree), `images` (Image)
2. **RxDB stores these as raw top-level fields** in IndexedDB
3. **Push handler strips them** because they're not in `SUPABASE_COLUMNS` whitelist
4. **Supabase receives empty `content`** - data is lost
5. **On reload**: Blocks appear empty

### What Already Exists
- **Serializer** at `src/features/block/lib/serializer.ts`:
  - `serializeBlock()` - converts special fields → JSON in `content`
  - `deserializeBlock()` - converts `content` JSON → special fields
  - Handles all block types correctly

- **Replication handlers** at `src/shared/db/rxdb-replication.ts`:
  - `pullHandler` - fetches from Supabase, converts snake_case → camelCase
  - `pushHandler` - sends to Supabase, converts camelCase → snake_case
  - `prepareForSupabase()` - strips fields not in whitelist
  - `prepareFromSupabase()` - converts field names

## Desired End State

```
PUSH Flow (RxDB → Supabase):
┌─────────────────────────────────────────────────────────────────────┐
│  RxDB has: { id, type, messages: [...], ... }                       │
│                         ↓                                           │
│  serializeBlock() → { id, type, content: '{"messages":[...]}' }    │
│                         ↓                                           │
│  prepareForSupabase() → snake_case + timestamp conversion           │
│                         ↓                                           │
│  Supabase stores: { id, type, content: '{"messages":[...]}' }      │
└─────────────────────────────────────────────────────────────────────┘

PULL Flow (Supabase → RxDB):
┌─────────────────────────────────────────────────────────────────────┐
│  Supabase returns: { id, type, content: '{"messages":[...]}' }     │
│                         ↓                                           │
│  prepareFromSupabase() → camelCase conversion                       │
│                         ↓                                           │
│  deserializeBlock() → { id, type, messages: [...], ... }           │
│                         ↓                                           │
│  RxDB stores: { id, type, messages: [...], ... }                   │
│                         ↓                                           │
│  Component receives: { messages: [...] } ✓                         │
└─────────────────────────────────────────────────────────────────────┘
```

### Verification
After implementation:
1. Create an AI block with messages → reload → messages still there
2. Create an IssueTracker with issues → reload → issues still there
3. Create a FileTree with files/content → reload → files and content preserved
4. Create an Image block with images → reload → images still there

## What We're NOT Doing

- NOT changing the RxDB schema
- NOT changing the Supabase schema
- NOT modifying use-blocks.ts hooks
- NOT modifying any block components
- NOT adding new Supabase columns

## Implementation Approach

Integrate the existing serializer into the replication handlers:
1. Import serializer functions into `rxdb-replication.ts`
2. Call `serializeBlock()` in push handler BEFORE `prepareForSupabase()`
3. Call `deserializeBlock()` in pull handler AFTER `prepareFromSupabase()`

This is minimal, surgical, and uses existing tested code.

---

## Phase 1: Add Serialization to Push Handler

### Overview
Serialize blocks before sending to Supabase so special fields are stored in `content`.

### Changes Required:

#### 1. Import Serializer
**File**: `src/shared/db/rxdb-replication.ts`
**Location**: After line 26 (imports section)

```typescript
// Import block serializer for converting special fields to content
import { serializeBlock, deserializeBlock } from '@/features/block/lib/serializer';
```

#### 2. Modify Push Handler
**File**: `src/shared/db/rxdb-replication.ts`
**Location**: Lines 442-447 (inside pushHandler, before prepareForSupabase)

**Current code:**
```typescript
        // Prepare doc for Supabase:
        // 1. Convert camelCase → snake_case (filePath → file_path)
        // 2. Strip fields that don't exist in Supabase (isNew, etc.)
        // 3. Remove _modified (Supabase generates via trigger) and _rev (RxDB internal)
        const preparedDoc = prepareForSupabase(newDoc as any, tableName);
        const { _modified, _rev, ...docToUpsert } = preparedDoc as any;
```

**New code:**
```typescript
        // Prepare doc for Supabase:
        // 1. For blocks: Serialize special fields (messages, data, treeData, images) into content
        // 2. Convert camelCase → snake_case (filePath → file_path)
        // 3. Strip fields that don't exist in Supabase (isNew, etc.)
        // 4. Remove _modified (Supabase generates via trigger) and _rev (RxDB internal)

        let docToProcess = newDoc as any;

        // Serialize blocks - converts messages/data/treeData/images → content JSON
        if (tableName === 'blocks' && docToProcess.type) {
          try {
            docToProcess = serializeBlock(docToProcess);
            console.log(`[RxDB Replication] ${tableName}: Serialized block ${newDoc.id}`, {
              type: docToProcess.type,
              contentLength: docToProcess.content?.length || 0
            });
          } catch (serializeErr) {
            console.error(`[RxDB Replication] ${tableName}: Serialization failed for ${newDoc.id}`, serializeErr);
            // Continue with original doc if serialization fails
            docToProcess = newDoc as any;
          }
        }

        const preparedDoc = prepareForSupabase(docToProcess, tableName);
        const { _modified, _rev, ...docToUpsert } = preparedDoc as any;
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run typecheck` (or `npx tsc --noEmit`)
- [ ] No import errors - serializer is found
- [ ] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Create a new AI block with a message
- [ ] Check browser console for `[RxDB Replication] blocks: Serialized block` log
- [ ] Check that `contentLength` is > 0 (not empty)
- [ ] Check Supabase `blocks` table - `content` column should have JSON with `messages`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Add Deserialization to Pull Handler

### Overview
Deserialize blocks after receiving from Supabase so special fields are restored from `content`.

### Changes Required:

#### 1. Modify Pull Handler
**File**: `src/shared/db/rxdb-replication.ts`
**Location**: Lines 385-398 (inside pullHandler, after prepareFromSupabase)

**Current code:**
```typescript
        // Convert snake_case → camelCase (file_path → filePath, etc.)
        const converted = prepareFromSupabase(doc, tableName);

        // Ensure _modified is a number
        if (typeof converted._modified === 'string') {
          converted._modified = new Date(converted._modified).getTime();
        }
        if (converted._modified === null || converted._modified === undefined) {
          converted._modified = 0;
        }

        // Mark as synced
        markAsSynced(tableName, converted.id);
        return converted;
```

**New code:**
```typescript
        // Convert snake_case → camelCase (file_path → filePath, etc.)
        let converted = prepareFromSupabase(doc, tableName);

        // Deserialize blocks - converts content JSON → messages/data/treeData/images
        if (tableName === 'blocks' && converted.type) {
          try {
            converted = deserializeBlock(converted as any) as any;
            console.log(`[RxDB Replication] ${tableName}: Deserialized block ${converted.id}`, {
              type: converted.type,
              hasMessages: 'messages' in converted,
              hasData: 'data' in converted,
              hasTreeData: 'treeData' in converted,
              hasImages: 'images' in converted,
            });
          } catch (deserializeErr) {
            console.error(`[RxDB Replication] ${tableName}: Deserialization failed for ${converted.id}`, deserializeErr);
            // Continue with unconverted doc if deserialization fails
          }
        }

        // Ensure _modified is a number
        if (typeof converted._modified === 'string') {
          converted._modified = new Date(converted._modified).getTime();
        }
        if (converted._modified === null || converted._modified === undefined) {
          converted._modified = 0;
        }

        // Mark as synced
        markAsSynced(tableName, converted.id);
        return converted;
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Reload the page after creating an AI block with messages
- [ ] Check console for `[RxDB Replication] blocks: Deserialized block` log
- [ ] Verify `hasMessages: true` in the log
- [ ] AI block should show the messages after reload

**Implementation Note**: After completing this phase, proceed to Phase 3 for full testing.

---

## Phase 3: Full Integration Testing

### Overview
Test all block types to ensure serialization/deserialization works correctly.

### Test Cases:

#### 1. AI Block
- [ ] Create AI block, add user message "Hello", get AI response
- [ ] Reload page
- [ ] Expected: Both messages (user + AI) still visible
- [ ] Console log should show `hasMessages: true` on pull

#### 2. Issue Tracker Block
- [ ] Create Issue Tracker, set milestone "v1.0", add issue "Bug fix"
- [ ] Reload page
- [ ] Expected: Milestone and issue still visible
- [ ] Console log should show `hasData: true` on pull

#### 3. FileTree Block
- [ ] Create FileTree, add folder "src", add file "index.ts" with content
- [ ] Add a snapshot with comment
- [ ] Reload page
- [ ] Expected: Folder, file, content, and snapshot with comment preserved
- [ ] Console log should show `hasTreeData: true` on pull

#### 4. Image Block
- [ ] Upload an image to Image block
- [ ] Reload page
- [ ] Expected: Image still visible
- [ ] Console log should show `hasImages: true` on pull

#### 5. Table Block
- [ ] Create Table block, add some data
- [ ] Reload page
- [ ] Expected: Table data preserved
- [ ] Console log should show `hasData: true` on pull

#### 6. Todo Block
- [ ] Create Todo block, add items
- [ ] Reload page
- [ ] Expected: Todo items preserved
- [ ] Console log should show `hasData: true` on pull

### Success Criteria:

#### Manual Verification:
- [ ] All 6 block types preserve their data after reload
- [ ] No console errors related to serialization/deserialization
- [ ] No data loss in Supabase (check `blocks` table `content` field)

---

## Testing Strategy

### Unit Tests (Future):
- Test `serializeBlock()` with each block type
- Test `deserializeBlock()` with each block type
- Test round-trip: serialize → deserialize = original data

### Integration Tests (Manual):
1. Create each block type with data
2. Trigger sync (wait for push)
3. Hard reload page
4. Verify data is preserved

### Edge Cases to Test:
- Empty blocks (no data yet)
- Blocks with very large content
- Blocks with special characters in content
- Legacy blocks (already in Supabase from old system)

---

## Rollback Plan

If issues occur:
1. Remove the serialization code from push handler
2. Remove the deserialization code from pull handler
3. Data in Supabase will remain as-is (content may be empty for new blocks)
4. Local RxDB data will still have raw fields

---

## Performance Considerations

- Serialization adds ~1-2ms per block on push
- Deserialization adds ~1-2ms per block on pull
- For batch operations (100+ blocks), this adds <200ms total
- No impact on UI responsiveness (happens in background)

---

## References

- Serializer: `src/features/block/lib/serializer.ts`
- Schemas: `src/features/block/lib/schemas.ts`
- Replication: `src/shared/db/rxdb-replication.ts`
- System mapping: `AI-MEMORY/debug/rxdb-system-mapping.md`
- Debugging journey: `AI-MEMORY/debug/rxdb-supabase-debugging-journey.md`
