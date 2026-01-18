# Document Title Not Updating - Bug Fix Plan

## Overview

Document titles don't update in the UI after being changed. The root cause is a memo comparison function in `DocumentEditor.tsx` that doesn't check for title changes, preventing re-renders when the title updates.

## Current State Analysis

### Data Flow (Working Correctly)
1. User edits title in `HeaderControls` → `setTitle()` updates local state ✅
2. User saves (blur/enter) → `handleTitleSave()` calls `onUpdate(entry.id, { title })` ✅
3. `updateEntry` in Dashboard updates:
   - Local state: `setAllDocuments(prev.map(...))` ✅
   - Tab title: `updateTabTitle(entryId, updates.title)` ✅
   - RxDB: `doc.patch({ title })` ✅

### Bug Location
**File**: `src/components/DocumentEditor/DocumentEditor.tsx` (lines 430-443)

```typescript
export const DocumentEditor = memo(DocumentEditorComponent, (prevProps, nextProps) => {
  if (!prevProps.entry || !nextProps.entry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;
  if (prevProps.allEntries?.length !== nextProps.allEntries?.length) return false;
  return true;  // ❌ Always returns true if same ID → title change blocked!
});
```

The memo comparison only checks `entry.id`, not `entry.title`. When title changes:
1. `activeDocument` updates with new title ✅
2. `DocumentEditor` memo returns `true` (same id) → **blocks re-render** ❌
3. `useDocumentState`'s sync effect never runs ❌
4. UI still shows old title ❌

## Desired End State

After the fix:
1. User changes document title
2. UI immediately reflects the new title
3. Sidebar shows updated title
4. Tab bar shows updated title
5. RxDB and Supabase sync correctly

### Verification Steps
1. Change document title via input field
2. Blur or press Enter to save
3. Title should update in:
   - Header (immediate)
   - Sidebar document list
   - Tab bar
4. Refresh page → title persists

## What We're NOT Doing

- Not changing the RxDB sync logic (working correctly)
- Not changing how `updateEntry` works (working correctly)
- Not changing state management architecture
- Not adding new features

## Implementation Approach

Simple fix: Update the memo comparison to also check `entry.title`.

## Phase 1: Fix DocumentEditor Memo

### Overview
Update memo comparison to allow re-renders when title changes.

### Changes Required

**File**: `src/components/DocumentEditor/DocumentEditor.tsx`

**Current** (lines 430-443):
```typescript
export const DocumentEditor = memo(DocumentEditorComponent, (prevProps, nextProps) => {
  // Fast path: check ID first
  if (!prevProps.entry || !nextProps.entry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;

  // Check mobile view
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;

  // Check entries count (for backlinks)
  if (prevProps.allEntries?.length !== nextProps.allEntries?.length) return false;

  // All checks passed
  return true;
});
```

**Fixed**:
```typescript
export const DocumentEditor = memo(DocumentEditorComponent, (prevProps, nextProps) => {
  // Fast path: check ID first
  if (!prevProps.entry || !nextProps.entry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;

  // Check title (for sync after save)
  if (prevProps.entry.title !== nextProps.entry.title) return false;

  // Check mobile view
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;

  // Check entries count (for backlinks)
  if (prevProps.allEntries?.length !== nextProps.allEntries?.length) return false;

  // All checks passed
  return true;
});
```

### Success Criteria

#### Automated Verification
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] No TypeScript errors

#### Manual Verification
- [ ] Change document title → saves and displays correctly
- [ ] Title updates in sidebar document list
- [ ] Title updates in tab bar
- [ ] Refresh page → title persists from RxDB
- [ ] No unexpected re-renders (check React DevTools)

## Testing Strategy

### Manual Testing Steps
1. Open any document
2. Click title to edit
3. Change title to something unique (e.g., "Test Title 123")
4. Press Enter or click away
5. Verify:
   - Title in header shows "Test Title 123"
   - Sidebar shows "Test Title 123"
   - Tab shows "Test Title 123"
6. Refresh page
7. Verify title still shows "Test Title 123"

### Edge Cases
- Empty title → should handle gracefully
- Very long title → should truncate appropriately
- Special characters in title → should work

## References

- Root cause analysis in this plan
- `src/components/DocumentEditor/DocumentEditor.tsx:430-443`
- `src/features/document/hooks/use-document-state.ts:127-131` (sync effect)
- `src/pages/Dashboard.jsx:1125-1128` (tab title update)
