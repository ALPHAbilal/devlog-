# RxDB Schema Missing Fields - Root Cause Analysis

**Status**: NEEDS VERIFICATION
**Date**: 2026-01-13
**Severity**: Critical - Data Loss

---

## Symptom

- AI blocks lose `messages` after app reload
- Table/Todo/IssueTracker blocks lose `data`
- FileTree blocks lose `treeData`
- Image blocks lose `images`
- Supabase shows `content: ""` or `content_length: 0` for new blocks

---

## Suspected Root Cause

**RxDB schema (`src/shared/db/rxdb-schemas.ts`) does NOT include block-specific fields.**

### Current Schema (lines 86-112):
```typescript
export const blockSchema: RxJsonSchema<any> = {
  properties: {
    id: { type: 'string' },
    document_id: { type: 'string' },
    type: { type: 'string' },
    content: { type: ['string', 'object'] },  // Only this exists
    position: { type: 'number' },
    metadata: { type: 'object' },
    created_at: { type: 'number' },
    updated_at: { type: 'number' },
    _modified: { type: 'number' },
    _deleted: { type: 'boolean' },
  },
  // ...
};
```

### Missing Fields:
| Block Type | Missing Field | Used By |
|------------|---------------|---------|
| ai | `messages` | AIBlockRefined.jsx |
| table | `data` | TableBlock.jsx |
| todo | `data` | TodoBlock.jsx |
| issue-tracker | `data` | IssueTrackerBlock.jsx |
| filetree | `treeData`, `snapshots` | FileTreeBlock.jsx |
| image | `images` | ImageBlock.jsx |

---

## Data Flow (Suspected)

```
1. AIBlock calls: onUpdate(blockId, { messages: [...] })
                              ↓
2. useRxBlocks.updateBlock: doc.patch({ messages: [...] })
                              ↓
3. RxDB: "messages" not in schema → IGNORED/STRIPPED
                              ↓
4. Push handler receives doc WITHOUT messages
                              ↓
5. serializeBlock: get(block, 'messages') → undefined → []
                              ↓
6. Supabase: content = '{"messages":[],"metadata":{}}'
```

---

## Evidence

### From Supabase Query:
```
| Block ID       | content_length | updated_at  |
|----------------|----------------|-------------|
| d51a7622-...   | 0              | 2026-01-12  | ← NEW block, empty
| 8b1de8f2-...   | 29             | 2026-01-04  | ← Older, has {}
| older blocks   | 29-153         | 2025-xx-xx  | ← Have data
```

### From Console Logs:
```
🔎 BlockSerializer.deserialize INPUT: {
  id: '2243e5c0-...',
  type: 'ai',
  contentLength: 0  ← Already empty when pulled
}
```

---

## Verification Needed

### Test 1: Confirm RxDB strips unknown fields
```javascript
// In browser console after patching an AI block:
const db = await getDatabase();
const doc = await db.blocks.findOne('BLOCK_ID').exec();
console.log('Stored doc:', doc.toJSON());
// Check if 'messages' exists in output
```

### Test 2: Check what push handler receives
Add logging BEFORE serializeBlock in `rxdb-replication.ts:471`:
```javascript
console.log('PRE-SERIALIZE:', {
  id: docToProcess.id,
  type: docToProcess.type,
  hasMessages: 'messages' in docToProcess,
  messages: docToProcess.messages,
});
```

### Test 3: Verify RxDB behavior
Check RxDB docs: Does it strip fields not in schema, or store them anyway?

---

## Potential Fixes (If Confirmed)

### Option A: Add fields to RxDB schema
```typescript
export const blockSchema = {
  properties: {
    // ... existing fields
    messages: { type: 'array', default: [] },
    data: { type: 'object' },
    treeData: { type: 'array', default: [] },
    images: { type: 'array', default: [] },
    snapshots: { type: 'array', default: [] },
  }
};
```
**Risk**: Schema migration needed for existing data

### Option B: Serialize BEFORE RxDB storage
Store everything as `content` locally too, not just for Supabase.
```
UI → serialize → RxDB (content only) → Supabase
Supabase → RxDB (content) → deserialize → UI
```
**Risk**: More refactoring, all block components need updates

### Option C: Use additionalProperties in schema
```typescript
export const blockSchema = {
  additionalProperties: true,  // Allow any extra fields
  // ...
};
```
**Risk**: Need to verify RxDB supports this

---

## Files Involved

- `src/shared/db/rxdb-schemas.ts` - Schema definition
- `src/shared/db/rxdb-replication.ts` - Push/pull handlers
- `src/shared/db/hooks/use-blocks.ts` - updateBlock function
- `src/features/block/lib/serializer.ts` - serialize/deserialize
- `src/components/blocks/AIBlockRefined.jsx` - Uses messages field

---

## Next Steps

1. Run verification tests above
2. Confirm RxDB behavior with unknown fields
3. Choose fix option (A, B, or C)
4. Implement fix
5. Test with fresh blocks AND existing data migration
