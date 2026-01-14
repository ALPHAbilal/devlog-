# Favorites Feature Implementation Plan

## Overview

Implement complete favorites functionality for both documents and folders. The UI components in the sidebar (FavoritesView.jsx) are already implemented, but the RxDB schema and types are missing the `is_favorite`/`isFavorite` field, causing the feature to not persist properly.

## Current State Analysis

### What's Already Done (UI Layer)
- `src/components/sidebar/views/FavoritesView.jsx` - Complete UI for showing/managing favorites
- `src/components/FavoriteIndicator.jsx` - Star indicator component
- `src/components/ProjectExplorer/hooks/useFileTree.js` - Has `toggleFavorite` function (lines 324-344)
- UI checks for both `favorite` and `isFavorite` props (line 16-17 in FavoritesView)

### Supabase Schema (✅ Already Correct)
Both `documents` and `folders` tables already have `is_favorite BOOLEAN DEFAULT false`:
- `documents.is_favorite` - exists ✅
- `folders.is_favorite` - exists ✅

### What's Missing (RxDB Layer)

1. **RxDB Schemas** (`src/shared/db/rxdb-schemas.ts`):
   - `documentSchema` - Missing `is_favorite` field
   - `folderSchema` - Missing `is_favorite` field

2. **RxDB Types** (`src/shared/db/rxdb-types.ts`):
   - `DocumentDocType` - Missing `is_favorite: boolean`
   - `FolderDocType` - Missing `is_favorite: boolean`

3. **RxDB Hooks** (`src/shared/db/hooks/`):
   - `use-documents.ts` - `toDocument()` doesn't include `is_favorite`
   - `use-folders.ts` - `toFolder()` doesn't include `is_favorite`

### Replication Layer (✅ Already Correct)
The `rxdb-replication.ts` already has the field mappings:
- Line 149: `SUPABASE_COLUMNS.documents` includes `'is_favorite'`
- Line 181: `FIELD_MAPPINGS.documents` has `isFavorite: 'is_favorite'`
- Line 211: `REVERSE_FIELD_MAPPINGS.documents` has `is_favorite: 'isFavorite'`

But `folders` is missing from field mappings (line 152-154 and 184-189).

## Desired End State

After implementation:
1. Users can mark documents/folders as favorites
2. Favorites persist across sessions (synced to Supabase)
3. FavoritesView shows all favorited items
4. Toggling favorites works in both directions (add/remove)

### Verification:
1. Open app, favorite a document → refreshes and still shows favorite
2. Favorite a folder → refreshes and still shows favorite
3. FavoritesView shows all favorites correctly
4. Unfavorite an item → removed from favorites list

## What We're NOT Doing

- No schema version bump (adding optional field with default value)
- No migration script (field already exists in Supabase)
- No UI changes (already implemented)

## Implementation Approach

Since `is_favorite` already exists in Supabase and the replication layer has partial support, we only need to:
1. Add the field to RxDB schemas
2. Add the field to TypeScript types
3. Add the field to hooks' data transformers
4. Add folder field mappings to replication

## Phase 1: RxDB Schema Updates

### Overview
Add `is_favorite` to RxDB schemas so the field is recognized during replication.

### Changes Required:

#### 1. Document Schema
**File**: `src/shared/db/rxdb-schemas.ts`
**Lines**: 19-51

Add `is_favorite` property to documentSchema:

```typescript
// After line 43 (_deleted property):
is_favorite: { type: 'boolean', default: false },
```

#### 2. Folder Schema
**File**: `src/shared/db/rxdb-schemas.ts`
**Lines**: 57-80

Add `is_favorite` property to folderSchema:

```typescript
// After line 73 (_deleted property):
is_favorite: { type: 'boolean', default: false },
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles without errors: `npm run build`
- [ ] App starts without RxDB schema errors in console

#### Manual Verification:
- [ ] Check browser console for no schema-related errors on app load

---

## Phase 2: TypeScript Type Updates

### Overview
Add `is_favorite` to TypeScript interfaces for type safety.

### Changes Required:

#### 1. DocumentDocType
**File**: `src/shared/db/rxdb-types.ts`
**Lines**: 12-24

Add `is_favorite` to DocumentDocType interface:

```typescript
export interface DocumentDocType {
  id: string;
  user_id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  doc_position: number;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;  // ADD THIS
  _modified: number;
  _deleted: boolean;
}
```

#### 2. FolderDocType
**File**: `src/shared/db/rxdb-types.ts`
**Lines**: 33-44

Add `is_favorite` to FolderDocType interface:

```typescript
export interface FolderDocType {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  path: string;
  position: number;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;  // ADD THIS
  _modified: number;
  _deleted: boolean;
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [x] No type errors in IDE

---

## Phase 3: Hook Data Transformer Updates

### Overview
Update the hooks to include `is_favorite` in the data objects returned to components.

### Changes Required:

#### 1. use-documents.ts - Document interface and toDocument()
**File**: `src/shared/db/hooks/use-documents.ts`

Add to Document interface (around line 18):
```typescript
interface Document {
  // ... existing fields ...
  is_favorite?: boolean;  // ADD THIS
  isFavorite?: boolean;   // Alias for UI compatibility
}
```

Update toDocument function (around line 49):
```typescript
function toDocument(doc: DocumentDocType): Document {
  return {
    // ... existing fields ...
    is_favorite: doc.is_favorite ?? false,
    isFavorite: doc.is_favorite ?? false,  // Alias for FavoritesView
  };
}
```

#### 2. use-folders.ts - Folder interface and toFolder()
**File**: `src/shared/db/hooks/use-folders.ts`

Add to Folder interface (around line 18):
```typescript
interface Folder {
  // ... existing fields ...
  is_favorite?: boolean;  // ADD THIS
  isFavorite?: boolean;   // Alias for UI compatibility
}
```

Update toFolder function (around line 36):
```typescript
function toFolder(doc: FolderDocType): Folder {
  return {
    // ... existing fields ...
    is_favorite: doc.is_favorite ?? false,
    isFavorite: doc.is_favorite ?? false,  // Alias for FavoritesView
  };
}
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [ ] App loads without errors

#### Manual Verification:
- [ ] Console.log documents array shows `is_favorite` field
- [ ] Console.log folders array shows `is_favorite` field

---

## Phase 4: Replication Field Mapping Updates

### Overview
Add folder field mappings for `is_favorite` to ensure proper sync with Supabase.

### Changes Required:

#### 1. Add is_favorite to folders SUPABASE_COLUMNS
**File**: `src/shared/db/rxdb-replication.ts`
**Lines**: 151-154

Update folders column list:
```typescript
folders: [
  'id', 'user_id', 'name', 'parent_id', 'path', 'position',
  'created_at', 'updated_at', '_modified', '_deleted',
  'is_favorite'  // ADD THIS
],
```

#### 2. Add isFavorite mapping to FIELD_MAPPINGS.folders
**File**: `src/shared/db/rxdb-replication.ts`
**Lines**: 184-189

Update folders field mappings:
```typescript
folders: {
  userId: 'user_id',
  parentId: 'parent_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  isFavorite: 'is_favorite',  // ADD THIS
},
```

#### 3. Add is_favorite mapping to REVERSE_FIELD_MAPPINGS.folders
**File**: `src/shared/db/rxdb-replication.ts`
**Lines**: 213-218

Update folders reverse mappings:
```typescript
folders: {
  user_id: 'userId',
  parent_id: 'parentId',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  is_favorite: 'isFavorite',  // ADD THIS
},
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`
- [ ] No replication errors in console

#### Manual Verification:
- [ ] Favorite a folder → Check Supabase that is_favorite = true
- [ ] Refresh app → Folder still shows as favorite

---

## Phase 5: Toggle Favorite Function Updates

### Overview
Ensure the hooks have proper `toggleFavorite` functions for both documents and folders.

### Changes Required:

#### 1. Add toggleFavorite to use-documents.ts
**File**: `src/shared/db/hooks/use-documents.ts`

Add new function after `moveDocument` (around line 252):

```typescript
// Toggle document favorite status
const toggleFavorite = useCallback(async (id: string, isFavorite?: boolean) => {
  if (!collection) return;

  const doc = await collection.findOne(id).exec();
  if (!doc) {
    console.warn(`[useRxDocuments] Document ${id} not found`);
    return;
  }

  const currentValue = doc.get('is_favorite') ?? false;
  const newValue = isFavorite !== undefined ? isFavorite : !currentValue;

  const now = Date.now();
  await doc.patch({
    is_favorite: newValue,
    updated_at: new Date(now).toISOString(),
    _modified: now,
  } as Partial<DocumentDocType>);
}, [collection]);
```

Add to return object:
```typescript
return {
  // ... existing ...
  toggleFavorite,
};
```

#### 2. Add toggleFavorite to use-folders.ts
**File**: `src/shared/db/hooks/use-folders.ts`

Add new function after `moveDocumentToFolder` (around line 283):

```typescript
// Toggle folder favorite status
const toggleFavorite = useCallback(async (id: string, isFavorite?: boolean) => {
  if (!collection) return;

  const doc = await collection.findOne(id).exec();
  if (!doc) {
    console.warn(`[useRxFolders] Folder ${id} not found`);
    return;
  }

  const currentValue = doc.get('is_favorite') ?? false;
  const newValue = isFavorite !== undefined ? isFavorite : !currentValue;

  const now = Date.now();
  await doc.patch({
    is_favorite: newValue,
    updated_at: new Date(now).toISOString(),
    _modified: now,
  } as Partial<FolderDocType>);
}, [collection]);
```

Add to return object:
```typescript
return {
  // ... existing ...
  toggleFavorite,
};
```

### Success Criteria:

#### Automated Verification:
- [x] TypeScript compiles: `npm run build`

#### Manual Verification:
- [ ] Click star on document → status changes, persists after refresh
- [ ] Click star on folder → status changes, persists after refresh
- [ ] FavoritesView shows favorited items

---

## Testing Strategy

### Unit Tests:
- Test `toggleFavorite` toggles boolean value
- Test `toDocument` and `toFolder` include `is_favorite`

### Integration Tests:
- Create document → toggle favorite → verify in Supabase
- Create folder → toggle favorite → verify in Supabase

### Manual Testing Steps:
1. Open app, navigate to a document
2. Click favorite star → verify star turns gold
3. Refresh page → verify star is still gold
4. Open FavoritesView in sidebar → verify document appears
5. Click unfavorite → verify removed from FavoritesView
6. Repeat steps 1-5 for folders
7. Test with multiple favorites → verify all appear in FavoritesView

## Performance Considerations

None - adding a boolean field has negligible performance impact.

## Migration Notes

No migration needed - the `is_favorite` column already exists in Supabase with `DEFAULT false`. Existing rows will have `false` as the value.

## References

- FavoritesView UI: `src/components/sidebar/views/FavoritesView.jsx`
- useFileTree toggle: `src/components/ProjectExplorer/hooks/useFileTree.js:324-344`
- RxDB replication: `src/shared/db/rxdb-replication.ts`
- Supabase migration: `supabase/migrations/20250115_add_folders_hierarchy.sql`
