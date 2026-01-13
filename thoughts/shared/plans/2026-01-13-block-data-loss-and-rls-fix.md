# Block Data Loss & RLS Failure - Implementation Plan

## Overview

Critical fixes for three interconnected issues causing data loss and sync failures:
1. **Serializer strips `document_id` and `user_id`** → RLS failures
2. **RxDB schema missing `user_id`** → blocks can't sync to Supabase
3. **Blocks not created with `user_id`** → RLS failures on push

## Current State Analysis (Verified 2026-01-13)

### Issue 1: Serializer Creates New Object Without Critical Fields

**File**: `src/features/block/lib/serializer.ts:58-65`
```typescript
const serialized: Record<string, unknown> = {
  id: block.id,
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};
// ❌ MISSING: document_id, user_id
```

**Impact**: Even if block has `document_id` and `user_id`, serializer creates a NEW object without them.

### Issue 2: RxDB Schema Missing `user_id`

**File**: `src/shared/db/rxdb-schemas.ts:86-112`
```typescript
export const blockSchema: RxJsonSchema<any> = {
  properties: {
    id: { type: 'string', maxLength: 36 },
    document_id: { type: 'string', maxLength: 36 },  // ✅ EXISTS
    type: { type: 'string' },
    // ... other fields
    // ❌ NO user_id field!
  },
  required: ['id', 'document_id', 'type', 'position'],  // ❌ user_id not required
};
```

**Impact**: `user_id` never stored in RxDB → can't be sent to Supabase → RLS fails.

### Issue 3: Block Creation Doesn't Set `user_id`

**File**: `src/shared/db/hooks/use-blocks.ts:107-120`
```typescript
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
  // ❌ NO user_id!
};
```

**Impact**: New blocks don't have `user_id`, causing RLS policy violations.

### Comparison with Documents/Folders (Working Code)

**Documents hook** (`use-documents.ts:105`):
```typescript
user_id: user.id,  // ✅ Gets user from useAuth()
```

**Folders hook** (`use-folders.ts:157`):
```typescript
user_id: user.id,  // ✅ Gets user from useAuth()
```

### Existing Plan Gap

The existing plan at `thoughts/shared/plans/rxdb-schema-missing-fields-fix.md` addresses **Issue 3 (block-specific fields)** but does NOT address:
- Serializer stripping `document_id` / `user_id` (Issue 1)
- RxDB schema missing `user_id` (Issue 2)
- Block creation not setting `user_id` (Issue 3 - different)

## Desired End State

After these fixes:
1. Serializer preserves `document_id` and `user_id` in output
2. RxDB schema includes `user_id` for blocks
3. Block creation hook sets `user_id` from auth context
4. No more RLS 403 errors when syncing blocks
5. Block data persists correctly

### Verification Criteria

**Automated**:
- `npm run build` compiles without errors
- `npm run lint` passes

**Manual**:
- Create block → check Supabase → `user_id` column populated
- Edit block → sync → no 403 errors
- Reload page → block data persists
- Check browser console for "[RxDB Replication] blocks: Pushed" without errors

## What We're NOT Doing

- NOT changing Supabase schema (already has `user_id` column)
- NOT changing RLS policies (they're correct)
- NOT modifying the replication push handler logic
- NOT adding migration for existing RxDB data (schema version bump handles it)

## Implementation Approach

Fix in order: Schema → Types → Serializer → Hooks

---

## Phase 1: Add `user_id` to RxDB Schema

### Overview
Add `user_id` field to RxDB block schema. This requires a schema version bump.

### Changes Required

#### 1. Update Block Schema
**File**: `src/shared/db/rxdb-schemas.ts`

```typescript
export const blockSchema: RxJsonSchema<any> = {
  version: 1,  // ← BUMP from 0 to 1
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    document_id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string', maxLength: 36 },  // ← ADD THIS
    type: { type: 'string' },
    content: { type: ['string', 'object'] },
    position: { type: 'number', default: 0 },
    metadata: {
      type: 'object',
      default: {}
    },
    created_at: { type: 'number', default: 0 },
    updated_at: { type: 'number', default: 0 },
    _modified: { type: 'number', default: 0 },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'document_id', 'user_id', 'type', 'position'],  // ← ADD user_id
  indexes: [
    'document_id',
    'position',
    'user_id'  // ← ADD INDEX
  ],
};
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`

#### Manual Verification:
- [ ] App starts without RxDB migration errors
- [ ] Existing blocks still load (from Supabase pull)

---

## Phase 2: Update TypeScript Types

### Overview
Update BlockDocType to include `user_id`.

### Changes Required

#### 1. Update Block Type Definition
**File**: `src/shared/db/rxdb-types.ts`

```typescript
export interface BlockDocType {
  id: string;
  document_id: string;
  user_id: string;  // ← ADD THIS
  type: string;
  content: string | Record<string, unknown>;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string | number;
  updated_at: string | number;
  _modified: number;
  _deleted: boolean;
}
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] No type errors in hooks files

---

## Phase 3: Update Serializer to Preserve Critical Fields

### Overview
Modify serializer to include `document_id` and `user_id` in output.

### Changes Required

#### 1. Update serializeBlock Function
**File**: `src/features/block/lib/serializer.ts`

Change lines 58-65:

```typescript
// BEFORE (BROKEN)
const serialized: Record<string, unknown> = {
  id: block.id,
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};

// AFTER (FIXED)
const serialized: Record<string, unknown> = {
  id: block.id,
  document_id: (block as any).document_id,  // ← ADD: Preserve document_id
  user_id: (block as any).user_id,          // ← ADD: Preserve user_id
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:
- [ ] Console log shows serializer output includes document_id and user_id

---

## Phase 4: Update Block Hooks to Set `user_id`

### Overview
Modify use-blocks.ts to get user_id from auth context and set it on block creation.

### Changes Required

#### 1. Import useAuth
**File**: `src/shared/db/hooks/use-blocks.ts`

Add import:
```typescript
import { useAuth } from '@/app/providers';
```

#### 2. Get User in Hook
**File**: `src/shared/db/hooks/use-blocks.ts`

Inside useRxBlocks function, add:
```typescript
export function useRxBlocks(documentId: string | undefined, options: UseRxBlocksOptions = {}) {
  const { enabled = true } = options;
  const db = useRxDB();
  const collection = useRxCollection<BlockDocType>('blocks');
  const { user } = useAuth();  // ← ADD THIS

  // ... rest of hook
```

#### 3. Update createBlock to Set user_id
**File**: `src/shared/db/hooks/use-blocks.ts`

Change createBlock callback:
```typescript
const createBlock = useCallback(async (block: BlockData) => {
  if (!collection || !documentId || !user?.id) return;  // ← ADD user check

  const now = Date.now();

  // Serialize block to convert messages/data/treeData/images → content
  const serialized = serializeBlock({
    ...block,
    id: block.id || crypto.randomUUID(),
    document_id: documentId,  // ← ADD: Ensure document_id is in serializer input
    user_id: user.id,         // ← ADD: Ensure user_id is in serializer input
    created_at: block.created_at || now,
    updated_at: now,
  } as any);

  const newBlock: BlockDocType = {
    id: serialized.id,
    document_id: documentId,
    user_id: user.id,  // ← ADD THIS
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
}, [collection, documentId, user?.id]);  // ← ADD user?.id to deps
```

#### 4. Update updateBlocks (bulk) to Include user_id
**File**: `src/shared/db/hooks/use-blocks.ts`

When inserting new blocks in bulk update:
```typescript
await collection.insert({
  id: block.id || crypto.randomUUID(),
  document_id: documentId,
  user_id: user.id,  // ← ADD THIS
  type: serialized.type,
  content: serialized.content || '',
  position: i,
  metadata: serialized.metadata || {},
  created_at: now,
  updated_at: now,
  _modified: now,
  _deleted: false,
});
```

Also update the function to check for user:
```typescript
const updateBlocks = useCallback(async (newBlocks: BlockData[]) => {
  if (!collection || !documentId || !user?.id) return;  // ← ADD user check
  // ...
}, [collection, documentId, user?.id]);  // ← ADD user?.id to deps
```

### Success Criteria

#### Automated Verification:
- [ ] TypeScript compiles: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Dev server starts: `npm run dev`

#### Manual Verification:
- [ ] Create new block → check RxDB via DevTools → user_id is set
- [ ] Create new block → check Supabase → user_id column has value
- [ ] No RLS 403 errors in console when syncing

---

## Phase 5: Handle RxDB Schema Migration

### Overview
RxDB version bump (0→1) requires migration strategy. Since we're adding a required field, we need to handle existing local data.

### Options

**Option A: Clear Local Data (Recommended)**
- Simplest approach
- User already has data in Supabase, it will be pulled again
- Clear IndexedDB on version mismatch

**Option B: Add Migration Handler**
- Complex
- Would need to fetch user_id from parent document
- Prone to errors

### Implementation (Option A)

RxDB handles schema migrations automatically when using the `migrationStrategies` option. Since `user_id` can be populated from Supabase on next pull, we can provide a simple migration that clears local blocks.

**File**: `src/shared/db/rxdb.ts`

Add migration strategy when creating blocks collection:
```typescript
await db.addCollections({
  // ...
  blocks: {
    schema: blockSchema,
    migrationStrategies: {
      1: function(oldDoc) {
        // Return null to delete this document
        // It will be re-pulled from Supabase with user_id
        return null;
      }
    }
  },
});
```

### Success Criteria

#### Automated Verification:
- [ ] App starts without errors after schema change

#### Manual Verification:
- [ ] Blocks are re-pulled from Supabase with correct user_id
- [ ] No data loss (Supabase is source of truth)

---

## Testing Strategy

### Unit Tests
- Serializer outputs include document_id and user_id
- Type definitions compile correctly

### Integration Tests
- Create block flow includes user_id
- Sync to Supabase succeeds
- Pull from Supabase includes user_id

### Manual Testing Steps

1. **Clear IndexedDB** in DevTools → Application → Storage → Clear site data
2. **Login** to the app
3. **Open a document**
4. **Create a new text block**, add some content
5. **Check RxDB** in DevTools:
   - Application → IndexedDB → devlog-rxdb → blocks
   - Verify block has `user_id` field with your user ID
6. **Check Supabase** (via SQL editor):
   ```sql
   SELECT id, document_id, user_id, type FROM blocks ORDER BY created_at DESC LIMIT 5;
   ```
   - Verify `user_id` is populated
7. **Create AI block**, add messages
8. **Reload page**
9. **Verify** messages persist
10. **Check console** for any RLS errors (should be none)

---

## Performance Considerations

- Schema change triggers local data migration (one-time)
- No additional network requests
- Adding index on `user_id` slightly increases write time but improves query performance

---

## Rollback Plan

If issues arise:
1. Revert the PR
2. Clear IndexedDB: `indexedDB.deleteDatabase('devlog-rxdb')`
3. Reload - data will be pulled from Supabase

---

## References

- Bug report: `AI-MEMORY/debug/rxdb-schema-missing-fields.md`
- RxDB schemas: `src/shared/db/rxdb-schemas.ts:86-112`
- Block hooks: `src/shared/db/hooks/use-blocks.ts`
- Serializer: `src/features/block/lib/serializer.ts:58-65`
- Replication: `src/shared/db/rxdb-replication.ts`
- Documents hook (reference): `src/shared/db/hooks/use-documents.ts:105`
- Folders hook (reference): `src/shared/db/hooks/use-folders.ts:157`
