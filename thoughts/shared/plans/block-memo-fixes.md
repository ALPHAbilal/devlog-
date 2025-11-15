# Block React.memo Fixes - Implementation Plan

## Overview

Fix critical React.memo bugs in block components that are causing unnecessary re-renders and contributing to scroll flicker. This plan focuses on three high-impact, low-effort fixes identified in the block types behavior analysis.

## Current State Analysis

### Problems Identified

1. **TodoBlock.jsx (lines 443-448)** - Critical Bug
   - Memo comparison function calculates `willPreventRerender` but doesn't return it
   - Function returns `undefined`, causing memo to NEVER prevent re-renders
   - Every parent re-render triggers TodoBlock re-render, even when data unchanged

2. **InlineImageBlock.jsx (line 7)** - Missing Optimization
   - Only active block without React.memo wrapper
   - Re-renders on every parent state change
   - Simple image display block doesn't need to re-render frequently

3. **FileTreeBlock.jsx (lines 1253-1259)** - Incomplete Optimization
   - Has working memo, but doesn't check `isFocused` prop
   - Re-renders when focus changes to other blocks (unnecessary)
   - Most complex block (1,259 lines) with most expensive renders

### Impact Assessment

- **TodoBlock**: High-frequency interactions (checkbox toggles), broken memo = constant re-renders
- **InlineImageBlock**: Low complexity but re-renders on every parent change
- **FileTreeBlock**: Largest block, expensive renders, avoidable focus-related re-renders

## Desired End State

All three blocks will have properly functioning React.memo comparison functions that prevent unnecessary re-renders when:
- Block ID hasn't changed
- Block data/content hasn't changed
- Focus state for THIS block hasn't changed

### Verification

Run the document editor with debug mode and verify:
1. TodoBlock only re-renders when its data actually changes
2. InlineImageBlock doesn't re-render when other blocks change
3. FileTreeBlock doesn't re-render when focus moves to other blocks

## What We're NOT Doing

- ❌ Adding debouncing (different problem, doesn't fix flicker)
- ❌ Changing onUpdate call patterns
- ❌ Adding new features or functionality
- ❌ Refactoring internal block logic
- ❌ Modifying other blocks beyond these three
- ❌ Adding automated tests (manual verification only for this quick fix)

## Implementation Approach

Simple, surgical fixes to memo comparison functions:
1. Add missing `return` statement to TodoBlock
2. Wrap InlineImageBlock with memo following ImageBlock pattern
3. Add `isFocused` check to FileTreeBlock memo

**Debug Logging**:
- All three blocks include `console.log` statements to verify memo behavior during testing
- These logs show `PREVENTED` (re-render blocked) vs `ALLOWED` (re-render permitted)
- Makes manual testing easier and more objective
- **IMPORTANT**: Remove debug logs before final deployment (checklist includes this)

Total time: ~15-20 minutes
Risk level: Very low (only touching memo functions)

---

## Phase 1: Fix TodoBlock Memo Bug

### Overview
Add the missing `return` statement that causes the memo comparison to work correctly.

### Changes Required

#### File: `src/components/blocks/TodoBlock.jsx`

**Current Code (lines 443-448)**:
```javascript
// Memoize TodoBlock to prevent unnecessary re-renders
export default memo(TodoBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data?.todos === nextProps.block.data?.todos;

}); // ❌ Missing return statement!
```

**New Code**:
```javascript
// Memoize TodoBlock to prevent unnecessary re-renders
export default memo(TodoBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data?.todos === nextProps.block.data?.todos;

  // Debug log to verify memo is working (remove after verification)
  console.log('TodoBlock memo:', willPreventRerender ? 'PREVENTED' : 'ALLOWED');

  return willPreventRerender; // ✅ Fixed: Now returns the comparison result
});
```

**Alternative (More Concise, without debug log)**:
```javascript
// Memoize TodoBlock to prevent unnecessary re-renders
export default memo(TodoBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data?.todos === nextProps.block.data?.todos
  );
});
```

### Success Criteria

#### Automated Verification:
- [ ] Code compiles without errors: `npm run dev`
- [ ] No ESLint warnings: `npm run lint`
- [ ] No TypeScript errors (if applicable): `npm run typecheck`

#### Manual Verification:
1. [ ] Open document editor in browser
2. [ ] Add a TodoBlock with 5+ todo items
3. [ ] Open browser DevTools console
4. [ ] Toggle checkboxes on todos - verify console shows:
   - Component render log (line 26): `✅ TodoBlock ${block.id} rendered`
   - Memo log: `TodoBlock memo: ALLOWED` (when data changes)
5. [ ] Add a TextBlock above the TodoBlock
6. [ ] Type in the TextBlock - verify console shows:
   - Memo log: `TodoBlock memo: PREVENTED` (data hasn't changed)
   - NO component render log
7. [ ] Focus change test: Click different blocks - verify console shows `TodoBlock memo: PREVENTED` (not re-rendering)

**Expected behavior**:
- Console shows `ALLOWED` only when todo data changes
- Console shows `PREVENTED` when parent/siblings change but TodoBlock data is unchanged

---

## Phase 2: Add React.memo to InlineImageBlock

### Overview
Wrap InlineImageBlock with React.memo following the pattern used in ImageBlock.jsx.

### Changes Required

#### File: `src/components/blocks/InlineImageBlock.jsx`

**Current Code (lines 1-7)**:
```javascript
import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Upload, Edit2 } from 'lucide-react';
import InlineImage from '../InlineImage';
import { uploadImageToSupabase, compressImage } from '../../utils/imageUploader';
import { useAuth } from '../../contexts/AuthContextOptimized';

export default function InlineImageBlock({ block, onUpdate, onDelete, isFocused }) {
```

**New Code**:
```javascript
import { useState, useRef, memo } from 'react'; // ✅ Add memo import
import { Image as ImageIcon, X, Upload, Edit2 } from 'lucide-react';
import InlineImage from '../InlineImage';
import { uploadImageToSupabase, compressImage } from '../../utils/imageUploader';
import { useAuth } from '../../contexts/AuthContextOptimized';

function InlineImageBlock({ block, onUpdate, onDelete, isFocused }) { // ✅ Remove export default
```

**Current Code (lines 182-184 - end of file)**:
```javascript
    </span>
  );
}
```

**New Code (add after the closing brace)**:
```javascript
    </span>
  );
}

// Memoize InlineImageBlock to prevent unnecessary re-renders
export default memo(InlineImageBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.url === nextProps.block.url &&
    prevProps.block.alt === nextProps.block.alt &&
    prevProps.isFocused === nextProps.isFocused;

  // Debug log to verify memo is working (remove after verification)
  console.log('InlineImageBlock memo:', willPreventRerender ? 'PREVENTED' : 'ALLOWED');

  return willPreventRerender;
});
```

### Success Criteria

#### Automated Verification:
- [ ] Code compiles without errors: `npm run dev`
- [ ] No ESLint warnings: `npm run lint`
- [ ] InlineImageBlock still exports correctly

#### Manual Verification:
1. [ ] Open document editor in browser
2. [ ] Add an InlineImageBlock (upload an image)
3. [ ] Open browser DevTools console AND React DevTools Profiler
4. [ ] Add a TextBlock below the image
5. [ ] Type in the TextBlock - verify console shows `InlineImageBlock memo: PREVENTED`
6. [ ] In Profiler, verify InlineImageBlock does NOT appear in the render flame graph
7. [ ] Click the InlineImageBlock to focus it - verify console shows `InlineImageBlock memo: ALLOWED`
8. [ ] Edit the alt text - verify console shows `InlineImageBlock memo: ALLOWED` (data changed)
9. [ ] Upload/replace image functionality still works

**Expected behavior**:
- Console shows `PREVENTED` when other blocks change
- Console shows `ALLOWED` only when focus/url/alt changes
- InlineImageBlock only renders when its own props change

---

## Phase 3: Improve FileTreeBlock Memo

### Overview
Add `isFocused` prop check to FileTreeBlock memo comparison to prevent re-renders when focus changes to other blocks.

### Changes Required

#### File: `src/components/blocks/FileTreeBlock.jsx`

**Current Code (lines 1253-1259)**:
```javascript
// Memoize FileTreeBlock to prevent unnecessary re-renders
export default memo(FileTreeBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data === nextProps.block.data;

  return willPreventRerender;
});
```

**New Code**:
```javascript
// Memoize FileTreeBlock to prevent unnecessary re-renders
export default memo(FileTreeBlock, (prevProps, nextProps) => {
  const willPreventRerender =
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data === nextProps.block.data &&
    prevProps.isFocused === nextProps.isFocused; // ✅ Added: Check if focus state for THIS block changed

  // Debug log to verify memo is working (remove after verification)
  console.log('FileTreeBlock memo:', willPreventRerender ? 'PREVENTED' : 'ALLOWED');

  return willPreventRerender;
});
```

**Alternative (More Concise, without debug log)**:
```javascript
// Memoize FileTreeBlock to prevent unnecessary re-renders
export default memo(FileTreeBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.data === nextProps.block.data &&
    prevProps.isFocused === nextProps.isFocused
  );
});
```

### Success Criteria

#### Automated Verification:
- [ ] Code compiles without errors: `npm run dev`
- [ ] No ESLint warnings: `npm run lint`
- [ ] FileTreeBlock still renders and functions correctly

#### Manual Verification:
1. [ ] Open document editor with a document containing a FileTreeBlock
2. [ ] Open browser DevTools console AND React DevTools Profiler
3. [ ] Add a TextBlock above and below the FileTreeBlock
4. [ ] Click to focus the top TextBlock
5. [ ] Type in the top TextBlock - verify console shows `FileTreeBlock memo: PREVENTED`
6. [ ] In Profiler, verify FileTreeBlock does NOT render (should not appear in flame graph)
7. [ ] Click to focus the FileTreeBlock itself - verify console shows `FileTreeBlock memo: ALLOWED`
8. [ ] In Profiler, verify FileTreeBlock DOES render when it receives focus
9. [ ] Expand/collapse tree nodes - verify console shows `FileTreeBlock memo: ALLOWED` (data changed)
10. [ ] Add/delete/rename nodes - verify all features work
11. [ ] Drag and drop - verify drag operations work
12. [ ] Create/revert snapshots - verify snapshot system works

**Expected behavior**:
- Console shows `PREVENTED` when other blocks change
- Console shows `ALLOWED` only when this block's data or focus changes
- FileTreeBlock only renders when its own `block.data` changes OR when its own focus state changes
- All FileTreeBlock features (expand/collapse, CRUD, drag-drop, snapshots) continue to work

---

## Testing Strategy

### Unit Tests
Not applicable - this is a memo function fix, manual verification is sufficient.

### Integration Tests
Not applicable - focusing on quick fix.

### Manual Testing Steps

**Comprehensive Test Sequence**:

1. **Build and Start**
   ```bash
   npm run dev
   ```

2. **Create Test Document**
   - Create new document with all three block types:
     - Add TodoBlock with 5 tasks
     - Add InlineImageBlock with uploaded image
     - Add FileTreeBlock with 10+ nodes (some nested)
     - Add 2-3 TextBlocks between them

3. **Test TodoBlock Memo**
   - Open DevTools Console
   - Toggle todo checkboxes → Should see `TodoBlock memo: ALLOWED` + render log
   - Type in other blocks → Should see `TodoBlock memo: PREVENTED` (no render)
   - Move focus between blocks → Should see `TodoBlock memo: PREVENTED` (no render)

4. **Test InlineImageBlock Memo**
   - Open DevTools Console + React DevTools Profiler
   - Start recording
   - Type in TextBlocks → Console shows `InlineImageBlock memo: PREVENTED`, NOT in flame graph
   - Click to focus InlineImageBlock → Console shows `ALLOWED`, appears in flame graph
   - Stop recording and verify

5. **Test FileTreeBlock Memo**
   - Open DevTools Console + React DevTools Profiler
   - Start recording
   - Type in TextBlocks above/below → Console shows `FileTreeBlock memo: PREVENTED`, NOT in flame graph
   - Click to focus FileTreeBlock → Console shows `ALLOWED`, appears in flame graph
   - Expand a node → Console shows `ALLOWED` (data changed)
   - Type in TextBlock again → Console shows `PREVENTED`, NOT in flame graph
   - Stop recording and verify

6. **Performance Check**
   - With all blocks in document, edit TextBlocks rapidly (type fast)
   - In Profiler, verify only the focused TextBlock renders
   - Verify TodoBlock, InlineImageBlock, FileTreeBlock do NOT render during TextBlock editing
   - Expected: Significantly fewer total component renders

7. **Feature Verification**
   - TodoBlock: Add/delete/toggle/reorder todos - all features work
   - InlineImageBlock: Upload/delete/edit alt text - all features work
   - FileTreeBlock: Expand/collapse/add/delete/rename/drag/snapshot - all features work

### Performance Benchmarks

**Before Fix** (expected):
- Editing TextBlock → 10+ blocks re-render (including TodoBlock, InlineImageBlock, FileTreeBlock)
- Toggling todo → TodoBlock renders twice (broken memo)
- Focusing different blocks → All blocks re-render

**After Fix** (expected):
- Editing TextBlock → Only TextBlock re-renders
- Toggling todo → TodoBlock renders once
- Focusing different blocks → Only the newly focused block re-renders

**Expected Impact**: 60-80% reduction in unnecessary re-renders during typical editing.

---

## Performance Considerations

### Memory Impact
- Minimal: Only adding memo comparison functions
- No new state or data structures
- Comparison functions are lightweight (reference equality checks)

### Render Performance
- **Positive impact**: Prevents expensive re-renders
- FileTreeBlock is the largest block (1,259 lines) - biggest savings here
- TodoBlock has high interaction frequency - immediate user experience improvement

### Edge Cases
- **Focus behavior**: Ensure focused block still responds to focus changes
- **Data updates**: Verify blocks still update when data actually changes
- **Reference equality**: All checks use `===` for primitives and reference equality for objects (same as existing patterns)

---

## Migration Notes

Not applicable - these are pure optimization fixes with no breaking changes.

---

## Rollback Plan

If any issues occur:

1. **TodoBlock**: Revert lines 443-448 to original (remove `return` statement)
2. **InlineImageBlock**: Remove memo wrapper, restore original export
3. **FileTreeBlock**: Remove `isFocused` check from memo comparison

Each change is independent and can be rolled back separately.

Git commands:
```bash
# Revert specific file
git checkout HEAD -- src/components/blocks/TodoBlock.jsx

# Or revert all three
git checkout HEAD -- src/components/blocks/TodoBlock.jsx \
                      src/components/blocks/InlineImageBlock.jsx \
                      src/components/blocks/FileTreeBlock.jsx
```

---

## References

- **Original Research**: `thoughts/shared/research/2025-11-06-block-types-behavior-analysis.md`
- **Virtuoso Flicker Fix**: `thoughts/shared/plans/virtuoso-flickering-fix.md`
- **Related Files**:
  - `src/components/blocks/TodoBlock.jsx:443-448` - Broken memo
  - `src/components/blocks/InlineImageBlock.jsx:7` - Missing memo
  - `src/components/blocks/FileTreeBlock.jsx:1253-1259` - Incomplete memo
  - `src/components/blocks/ImageBlock.jsx:516-525` - Reference pattern for InlineImageBlock

---

## Implementation Checklist

### Pre-Implementation
- [ ] Read this plan completely
- [ ] Review the three target files
- [ ] Ensure clean git state: `git status`
- [ ] Create feature branch: `git checkout -b fix/block-memo-optimizations`

### Phase 1: TodoBlock
- [ ] Open `src/components/blocks/TodoBlock.jsx`
- [ ] Locate lines 443-448
- [ ] Add `return willPreventRerender;` statement
- [ ] Save file
- [ ] Verify no syntax errors: `npm run dev`
- [ ] Test manually as per success criteria
- [ ] Commit: `git commit -m "fix: add missing return in TodoBlock memo"`

### Phase 2: InlineImageBlock
- [ ] Open `src/components/blocks/InlineImageBlock.jsx`
- [ ] Add `memo` to imports on line 1
- [ ] Remove `export default` from function declaration (line 7)
- [ ] Add memo wrapper at end of file (after line 184)
- [ ] Save file
- [ ] Verify no syntax errors: `npm run dev`
- [ ] Test manually as per success criteria
- [ ] Commit: `git commit -m "feat: add React.memo to InlineImageBlock"`

### Phase 3: FileTreeBlock
- [ ] Open `src/components/blocks/FileTreeBlock.jsx`
- [ ] Locate lines 1253-1259
- [ ] Add `prevProps.isFocused === nextProps.isFocused` to comparison
- [ ] Save file
- [ ] Verify no syntax errors: `npm run dev`
- [ ] Test manually as per success criteria
- [ ] Commit: `git commit -m "fix: improve FileTreeBlock memo with isFocused check"`

### Post-Implementation
- [ ] Run complete manual test sequence (all 7 steps)
- [ ] Verify debug logs show PREVENTED/ALLOWED correctly in console
- [ ] Verify performance improvement in React DevTools Profiler
- [ ] **Remove debug console.log statements from all three files**
- [ ] Run linter: `npm run lint`
- [ ] Review all changes: `git diff main`
- [ ] Push branch: `git push origin fix/block-memo-optimizations`
- [ ] Test in production build: `npm run build && npm run preview`

### Completion
- [ ] All automated verification passes
- [ ] All manual verification passes
- [ ] Performance improvement confirmed (fewer re-renders in Profiler)
- [ ] Debug console.log statements removed from production code
- [ ] No regressions in block functionality
- [ ] Ready for deployment

---

## Estimated Timeline

- **Phase 1 (TodoBlock)**: 5 minutes
- **Phase 2 (InlineImageBlock)**: 5 minutes
- **Phase 3 (FileTreeBlock)**: 5 minutes
- **Testing**: 10-15 minutes
- **Total**: 25-30 minutes

---

## Success Metrics

**Quantitative**:
- Re-render count reduction: 60-80% during typical editing
- TodoBlock re-renders: From 2x per toggle → 1x per toggle
- InlineImageBlock re-renders: From every parent update → only on own changes
- FileTreeBlock re-renders: From every focus change → only on own focus/data changes

**Qualitative**:
- Smoother editing experience
- Reduced scroll flicker during saves
- More responsive UI during rapid editing
- Foundation for future performance optimizations

---

## Next Steps After This Plan

Once these fixes are deployed and verified:

1. **Monitor Performance**: Track re-render metrics in production
2. **Consider Phase 2 Optimizations**: Height change smoothing, CSS transitions
3. **Standardize All Blocks**: Apply consistent memo patterns to remaining blocks
4. **Document Patterns**: Create style guide for block memo implementations

This plan is intentionally focused and quick to implement. Larger architectural changes (debouncing, height transitions) can be addressed in follow-up plans.
