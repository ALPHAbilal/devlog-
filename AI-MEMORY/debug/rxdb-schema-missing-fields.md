# Block Data Loss & RLS Failure - Root Cause Analysis

**Status**: FIXED (v11)
**Date**: 2026-01-13
**Severity**: Critical - Data Loss + Sync Failure

---

## Issue 4: prepareFromSupabase Breaks Document Queries (FIXED)

**File**: `src/shared/db/rxdb-replication.ts` (line ~390)

**Symptom**: 100 folders show but only 1 document (should be 395)

**Root Cause**:
- `prepareFromSupabase()` converts snake_case → camelCase (`user_id` → `userId`)
- RxDB schema uses snake_case (`user_id`, `updated_at`)
- Query selectors use snake_case (`{ user_id: userId }`)
- Result: Query looks for `user_id`, data has `userId` → NO MATCH

**Why Folders Worked**: Folder query has NO `user_id` filter, only `_deleted`

**Fix Applied**:
```typescript
// BEFORE (broken):
let converted = prepareFromSupabase(doc, tableName);

// AFTER (fixed):
let converted = doc;  // Keep snake_case from Supabase
```

**Schema Version**: Bumped to v11 to force fresh DB

---

## Symptoms

1. **Data Loss**: AI/Table/Todo/FileTree blocks lose their data after reload
2. **RLS Failure**: `new row violates row-level security policy for table "blocks"` (code 42501)
3. **Serialization appears to work** but content is empty or defaults only

---

## Root Causes Found (3 Issues)

### Issue 1: Serializer Strips Critical Fields

**File**: `src/features/block/lib/serializer.ts` (lines 58-65)

```typescript
const serialized: Record<string, unknown> = {
  id: block.id,
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};
// Later adds: content
```

**Missing**: `document_id`, `user_id`

**Result**: Even if block has these fields, serializer creates NEW object without them → RLS fails.

---

### Issue 2: RxDB Schema Missing `user_id`

**File**: `src/shared/db/rxdb-schemas.ts` (lines 86-112)

```typescript
export const blockSchema: RxJsonSchema<any> = {
  properties: {
    id: { type: 'string' },
    document_id: { type: 'string' },  // ✅ EXISTS
    type: { type: 'string' },
    content: { type: ['string', 'object'] },
    position: { type: 'number' },
    metadata: { type: 'object' },
    created_at: { type: 'number' },
    updated_at: { type: 'number' },
    _modified: { type: 'number' },
    _deleted: { type: 'boolean' },
    // ❌ NO user_id!
  },
};
```

**Result**: `user_id` never stored in RxDB → can't be sent to Supabase → RLS fails.

---

### Issue 3: RxDB Schema Missing Block-Specific Fields

**Same file**: `src/shared/db/rxdb-schemas.ts`

**Missing fields:**
| Block Type | Missing Field |
|------------|---------------|
| ai | `messages` |
| table | `data` |
| todo | `data` |
| issue-tracker | `data` |
| filetree | `treeData`, `snapshots` |
| image | `images` |

**Result**: When UI calls `onUpdate({ messages: [...] })`, RxDB ignores the field → data lost.

---

## Evidence from Logs

### Serializer Input Shows Missing Data
```
🔍 BlockSerializer.serialize INPUT: {
  id: 'a15bffa2-...',
  type: 'table',
  hasContent: true,
  hasData: false,    ← NO DATA FIELD!
  blockKeys: Array(10)
}
```

### Serializer Output Has Content (but it's DEFAULTS)
```
🔍 BlockSerializer.serialize OUTPUT: {
  contentLength: 116,
  contentPreview: '{"data":{"headers":["Column 1","Column 2"]...'
}
```
The 116 chars are DEFAULT values, not user data!

### Push Fails with RLS
```
POST .../blocks 403 (Forbidden)
Error: 'new row violates row-level security policy for table "blocks"'
Code: 42501
```

### Document Missing user_id
```json
"newDocumentState": {
  "id": "a15bffa2-...",
  "document_id": "640612a7-...",
  "type": "table",
  "content": "",
  // NO user_id!
}
```

---

## Complete Data Flow (Broken)

```
1. User edits table block, adds data
   ↓
2. Component calls: onUpdate({ data: {...} })
   ↓
3. RxDB.patch({ data: {...} })
   ↓
4. RxDB: "data" not in schema → IGNORED ❌
   RxDB: "user_id" not in schema → IGNORED ❌
   ↓
5. Push handler receives: { content: "", document_id: "...", NO user_id }
   ↓
6. serializeBlock() creates NEW object:
   - Strips document_id ❌
   - Strips user_id (wasn't there anyway) ❌
   - data missing → uses DEFAULTS
   ↓
7. prepareForSupabase() receives: { id, type, position, metadata, content: "defaults" }
   ↓
8. Supabase INSERT fails:
   - RLS requires user_id → MISSING → 403 Forbidden
```

---

## Required Fixes

### Fix 1: Update Serializer to Preserve Fields (CRITICAL)

`src/features/block/lib/serializer.ts` line 58-65:

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
  document_id: (block as any).document_id,  // PRESERVE!
  user_id: (block as any).user_id,          // PRESERVE!
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};
```

### Fix 2: Add user_id to RxDB Schema

`src/shared/db/rxdb-schemas.ts`:

```typescript
export const blockSchema: RxJsonSchema<any> = {
  properties: {
    // ... existing
    user_id: { type: 'string', maxLength: 36 },  // ADD THIS
  },
  required: ['id', 'document_id', 'type', 'position', 'user_id'],  // ADD user_id
};
```

### Fix 3: Add Block-Specific Fields to RxDB Schema

```typescript
export const blockSchema: RxJsonSchema<any> = {
  properties: {
    // ... existing
    messages: { type: 'array', default: [] },     // For AI blocks
    data: { type: 'object' },                      // For table/todo/issue-tracker
    treeData: { type: 'array', default: [] },     // For filetree
    images: { type: 'array', default: [] },       // For image blocks
    snapshots: { type: 'array', default: [] },    // For filetree
  },
};
```

### Fix 4: Ensure user_id is Set on Block Creation

Check where blocks are created and ensure `user_id` is set from auth context.

---

## Files to Modify

1. `src/features/block/lib/serializer.ts` - Preserve document_id, user_id
2. `src/shared/db/rxdb-schemas.ts` - Add missing fields
3. Block creation code - Ensure user_id is set

---

## Testing After Fix

1. Create new AI block → Add messages → Reload → Messages should persist
2. Create new table block → Edit data → Reload → Data should persist
3. Check Supabase: blocks should have user_id and document_id
4. No more RLS 403 errors

---

## Risk Assessment

- **Schema change**: May require RxDB migration or DB reset for existing users
- **Serializer change**: Low risk, additive change
- **user_id requirement**: Need to verify all block creation paths set user_id
