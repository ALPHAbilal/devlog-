# Document Title Not Updating - Bug Fix Plan

## Overview

Document titles don't update in the UI after being changed. The root cause is that `updateEntry` looks for documents in `entries` (which only contains root-level items), so documents inside folders can't be found and the update silently fails.

## Current State Analysis

### Data Flow
1. User edits title in `HeaderControls` → `setTitle()` updates local state ✅
2. User saves (blur/enter) → `handleTitleSave()` calls `onUpdate(entry.id, { title })` ✅
3. `updateEntry` in Dashboard tries to find document... **FAILS for docs in folders** ❌

### Bug Location
**File**: `src/pages/Dashboard.jsx` (line 1080)

```javascript
// BROKEN: entries only contains root-level items (folders + root documents)
// Documents inside folders are nested in folder.items, not at top level
const entryToUpdate = entries.find(entry => entry.id === entryId);
if (!entryToUpdate) {
  return;  // ← SILENTLY RETURNS for documents in folders!
}
```

### Why `entries` Doesn't Work
- `entries` is populated from `allDocuments` + `folders` in a useEffect (lines 838-922)
- Root documents go directly into `entries`
- Documents in folders are nested inside their folder's `items` array
- `entries.find()` only searches top-level items, not nested ones

## Root Cause

In `updateEntry` (Dashboard.jsx):
1. Code looks for document in `entries` using `entries.find(entry => entry.id === entryId)`
2. `entries` only contains ROOT-level items (folders + root documents)
3. Documents inside folders are nested in `folder.items`, not at top level
4. `entries.find()` returns `undefined` for documents in folders
5. Function returns early without updating anything
6. No error logged, so issue was silent

## Desired End State

After the fix:
1. User changes document title (whether in folder or not)
2. UI immediately reflects the new title
3. Sidebar shows updated title
4. Tab bar shows updated title
5. RxDB and Supabase sync correctly

## What We're NOT Doing

- Not changing the folder structure
- Not changing the RxDB sync logic
- Not adding new features

## Implementation

### Fix 1: Look in `allDocuments` instead of `entries`

**File**: `src/pages/Dashboard.jsx`

```javascript
// OLD (broken for docs in folders):
const entryToUpdate = entries.find(entry => entry.id === entryId);

// NEW (works for all docs):
const entryToUpdate = allDocuments.find(doc => doc.id === entryId);
```

### Fix 2: Add `allDocuments` to dependency array

```javascript
// OLD:
}, [entries, expandedEntry, updateStorageInfo, ...]);

// NEW:
}, [entries, allDocuments, expandedEntry, updateStorageInfo, ...]);
```

### Fix 3: Add warning log for debugging

```javascript
if (!entryToUpdate) {
  console.warn('[Dashboard] updateEntry: Document not found:', entryId?.substring(0, 8));
  return;
}
```

## Success Criteria

### Manual Verification
- [ ] Change title of document in root → saves correctly
- [ ] Change title of document inside folder → saves correctly
- [ ] Title updates in sidebar
- [ ] Title updates in tab bar
- [ ] Refresh page → title persists

## Files Changed

1. `src/pages/Dashboard.jsx` - Main fix (look in allDocuments)
2. `src/components/DocumentEditor/DocumentEditor.tsx` - Memo fix (allow title re-renders)
