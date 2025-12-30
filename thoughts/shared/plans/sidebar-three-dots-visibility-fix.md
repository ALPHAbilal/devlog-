# Sidebar Three Dots Visibility Fix - Implementation Plan

## Overview

Fix the three dots context menu button not appearing in the sidebar at certain viewport sizes. This is a **frontend-only CSS fix** with no backend changes.

## Current State Analysis

### Problem
The three dots (MoreHorizontal icon) button in `SidebarTreeItemEnhanced.jsx` is being clipped/hidden due to CSS overflow and padding issues introduced after the new sidebar UI implementation.

### Root Causes Identified

1. **`[&>div]:!pr-3` in ScrollArea** (scroll-area.jsx:11) - Forces 12px right padding with `!important` on all child divs, overriding ExplorerView's `pr-4`
2. **No `pr-*` on tree/compact view row** (SidebarTreeItemEnhanced.jsx:204-212) - The flex container has no explicit right padding
3. **`overflow-hidden` on multiple containers** - Clips content at boundaries

### Files Affected

| File | Line | Current State |
|------|------|---------------|
| `src/components/ui/scroll-area.jsx` | 11 | Has `[&>div]:!pr-3` (the root cause) |
| `src/components/sidebar/SidebarTreeItemEnhanced.jsx` | 204-212 | Tree/compact view row has no `pr-*` padding |
| `src/components/sidebar/SidebarTreeItemEnhanced.jsx` | 96-105 | Table view row has `px-2` (adequate) |
| `src/components/sidebar/views/ExplorerView.jsx` | 208, 224 | Has `pr-4` (currently overridden by !important) |

## Desired End State

- Three dots button visible on hover in ALL viewport sizes
- No overlapping between count badges and other elements
- Consistent spacing across tree, compact, and table view modes
- No regression in existing sidebar functionality

### Verification:
- Three dots button appears on hover for all items
- Works at sidebar width of 280px
- Works for deeply nested folders (3+ levels)
- Works for items with count badges
- No horizontal scrollbar appears
- Dropdown menu positions correctly when clicked

## What We're NOT Doing

- NOT changing backend/database
- NOT modifying Supabase queries
- NOT changing the sidebar width (280px)
- NOT altering the Portal-based dropdown menu logic
- NOT changing the ActivityBar or view switching

## Implementation Approach

**Strategy**: Remove the problematic `!important` override from ScrollArea and add explicit padding to the tree item row. This gives each component control over its own spacing.

---

## Phase 1: Remove ScrollArea !important Override

### Overview
Remove the `[&>div]:!pr-3` from ScrollArea that's forcing padding on all child divs.

### Changes Required:

#### 1. Update ScrollArea Component
**File**: `src/components/ui/scroll-area.jsx`

**Line 11 - BEFORE**:
```jsx
<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!pr-3">
```

**Line 11 - AFTER**:
```jsx
<ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
```

### Why This Change:
- Removes CSS specificity war (`!important`)
- Allows child components to control their own padding
- Returns to original design from commit `0ac9b0c`

### Success Criteria:

#### Automated Verification:
- [ ] App builds without errors: `npm run build`
- [ ] No TypeScript/ESLint errors: `npm run lint`
- [ ] Dev server starts: `npm run dev`

#### Manual Verification:
- [ ] ScrollArea still scrolls correctly in sidebar
- [ ] No horizontal overflow in sidebar content
- [ ] Scrollbar appears when content overflows vertically

---

## Phase 2: Add Explicit Padding to Tree Item Row (If Needed)

### Overview
Add right padding to the tree item flex container to reserve space for the three dots button. **Test after Phase 1 first** - removing the `!important` override may be sufficient on its own.

### Changes Required:

#### 1. Update Tree/Compact View Row
**File**: `src/components/sidebar/SidebarTreeItemEnhanced.jsx`

**Lines 204-212 (the className attribute) - BEFORE**:
```jsx
className={`
  flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 group relative rounded-lg
```

**AFTER** (add `pr-2` at the end):
```jsx
className={`
  flex items-center ${styles.spacing} ${styles.padding} ${styles.fontSize} transition-all duration-200 group relative rounded-lg pr-2
```

#### 2. Table View Row - NO CHANGE NEEDED
**File**: `src/components/sidebar/SidebarTreeItemEnhanced.jsx` (lines 96-105)

The table view row already has `px-2` which sets both left AND right padding to 8px.
After removing the ScrollArea `!important` override in Phase 1, the parent container's `pr-4` (from ExplorerView line 208) will also apply correctly.

**Do NOT add `pr-2` after `px-2`** - this would be redundant since `px-2` already includes `padding-right: 0.5rem`.

### Why This Change:
- `pr-2` (8px) reserves explicit space for the three dots button in tree/compact views
- Table view already has adequate padding via `px-2` and parent `pr-4`
- Each row controls its own spacing
- Consistent with the original design intent

### Success Criteria:

#### Automated Verification:
- [ ] App builds without errors: `npm run build`
- [ ] No console errors in browser DevTools
- [ ] Dev server runs without warnings

#### Manual Verification:
- [ ] Three dots button visible on hover (tree view)
- [ ] Three dots button visible on hover (compact view)
- [ ] Three dots button visible on hover (table view)
- [ ] Button appears for root-level items
- [ ] Button appears for nested items (2+ levels deep)
- [ ] Button appears for items with count badges
- [ ] Clicking button opens dropdown menu correctly

---

## Phase 3: Clean Up Debug Attributes (Optional)

### Overview
Remove debug data attributes that were added during investigation.

### Changes Required:

#### 1. Remove Debug Attributes
**File**: `src/components/sidebar/SidebarTreeItemEnhanced.jsx`

**Lines 200-203 - REMOVE these lines**:
```jsx
data-debug="sidebar-tree-item-enhanced"
data-item-name={item.name || item.title}
data-view-mode={viewMode}
data-margin-right="28px"
```

### Why This Change:
- Removes unnecessary DOM pollution
- Cleaner HTML output
- No functional impact

### Success Criteria:

#### Automated Verification:
- [ ] App builds without errors: `npm run build`

#### Manual Verification:
- [ ] Sidebar still functions correctly
- [ ] No debug attributes visible in DOM inspector

---

## Testing Strategy

### Manual Testing Steps

1. **Tree View Mode**:
   - [ ] Hover over a root folder → three dots appear
   - [ ] Hover over a nested folder → three dots appear
   - [ ] Hover over a document → three dots appear
   - [ ] Click three dots → dropdown menu opens
   - [ ] Dropdown actions work (New Folder, New Document, Delete)

2. **Compact View Mode**:
   - [ ] Switch to compact view via dropdown
   - [ ] Hover over items → three dots appear
   - [ ] Dropdown menu works correctly

3. **Table View Mode**:
   - [ ] Switch to table view via dropdown
   - [ ] Hover over rows → three dots appear
   - [ ] Dropdown menu works correctly

4. **Edge Cases**:
   - [ ] Items with very long names (truncated) → three dots visible
   - [ ] Items with count badges → three dots visible
   - [ ] Deeply nested items (3+ levels) → three dots visible
   - [ ] Resize window to various widths → three dots always visible on hover

5. **Regression Testing**:
   - [ ] Scrolling in sidebar works
   - [ ] Folder expand/collapse works
   - [ ] Document selection works
   - [ ] Search view works
   - [ ] Recent view works
   - [ ] Favorites view works

---

## Rollback Plan

If issues arise, revert changes in this order:

1. **Revert Phase 2**: Remove `pr-2` from SidebarTreeItemEnhanced.jsx
2. **Revert Phase 1**: Add back `[&>div]:!pr-3` to scroll-area.jsx

Git commands:
```bash
git checkout HEAD~1 -- src/components/sidebar/SidebarTreeItemEnhanced.jsx
git checkout HEAD~1 -- src/components/ui/scroll-area.jsx
```

---

## Implementation Order

1. **Phase 1** first - Remove the !important override
2. **Test** - Verify sidebar still scrolls correctly AND check if three dots are now visible
3. **Phase 2** (if needed) - Only add `pr-2` to tree/compact view if Phase 1 wasn't sufficient
4. **Test** - Verify three dots visible in all modes
5. **Phase 3** (optional) - Clean up debug attributes
6. **Final Test** - Run through all testing scenarios

**Important**: Phase 1 alone may be sufficient. The `!important` override was forcing 12px padding instead of the intended 16px (`pr-4`) from ExplorerView. Removing it restores 4px of space which may be enough.

---

## Files Modified Summary

| File | Change |
|------|--------|
| `src/components/ui/scroll-area.jsx` | Remove `[&>div]:!pr-3` from line 11 |
| `src/components/sidebar/SidebarTreeItemEnhanced.jsx` | Add `pr-2` to tree/compact view row (line 205), remove debug attrs (lines 200-203) |

**Total files changed**: 2
**Lines changed**: ~5
**Risk level**: Low (CSS-only changes, no logic changes)

**Note**: Table view row does NOT need modification - it already has `px-2` which includes right padding.

---

## References

- Research document: `thoughts/shared/research/2025-12-21-sidebar-three-dots-visibility-investigation.md`
- Original new UI commit: `0ac9b0c`
- Problematic commits: `2c1c08e`, `a68bf9d`
