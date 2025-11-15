# TanStack React Virtual Migration - Implementation Plan

## Overview

This plan migrates the document block virtualization from `react-window` to `@tanstack/react-virtual` to fix two critical UI issues:
1. **Double scrollbar** - Parent container and VariableSizeList both create scrollbars
2. **Block overlapping** - Blocks render on top of each other due to height measurement issues

The migration will completely replace `react-window` with `@tanstack/react-virtual`, leveraging its superior dynamic height handling and simpler API.

## Current State Analysis

### Evidence from Console Logs:
- Virtualization IS working correctly (7/36 blocks rendered = 80.6% not in DOM)
- User reports: "there's overlapping between blocks and most importantly that now we have two scrollbar"
- Second scrollbar appears "in the right of the blocks it close"
- Scroll behavior changed from original

### Current Implementation Details:

**File**: `src/components/ExpandedViewEnhanced.jsx`

**Current Library**: `react-window` v1.8.11
```javascript
// Line 4: Current import
import { VariableSizeList as List } from 'react-window';

// Lines 213-225: Height estimation with cache
const getItemSize = useCallback((index) => {
  if (itemHeights.current[index]) {
    return itemHeights.current[index];
  }
  return getEstimatedHeight(blocks[index]) + ADD_BUTTON_HEIGHT;
}, [blocks]);

// Lines 228-242: Manual height measurement with resetAfterIndex
const setItemSize = useCallback((index, size) => {
  if (itemHeights.current[index] !== size) {
    itemHeights.current[index] = size;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
  }
}, [blocks]);

// Lines 341-373: VirtualRow renderer
const VirtualRow = useCallback(({ index, style }) => {
  const block = blocks[index];
  return (
    <BlockRenderer
      block={block}
      style={style}  // ← Absolute positioning via style prop
      onMeasure={setItemSize}
    />
  );
}, [blocks, setItemSize]);

// Lines 1391-1395: Parent scroll container (SCROLLBAR #1)
<div
  ref={scrollContainerRef}
  className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-stable"
>

// Lines 1656-1667: VariableSizeList creates own scroll (SCROLLBAR #2)
<List
  ref={listRef}
  height={listHeight || 600}  // ← Fixed height = internal scrolling
  itemCount={validBlocks.length}
  itemSize={getItemSize}
  width="100%"
  overscanCount={3}
>
  {VirtualRow}
</List>
```

### Root Causes:

**Problem 1 - Double Scrollbar**:
- Parent div has `overflow-y-auto` (creates scrollbar #1)
- `react-window` List has fixed height (creates scrollbar #2)
- No `outerRef` connection between them

**Problem 2 - Block Overlapping**:
- Manual height measurement with `resetAfterIndex` is unreliable
- Race conditions between render and measurement
- Height cache doesn't update reactively

### Key Discoveries:
- `react-window` v1.8.11 installed (will be replaced)
- `react-window-infinite-loader` v1.0.10 installed (not used, can remove)
- Parent container `scrollContainerRef` at line 1392
- BlockRenderer has measurement ref callback at lines 265-275
- All business logic (block operations, state, SmartSync) is working correctly

## Desired End State

### Success State:
1. **Single scrollbar** - Only parent container scrolls
2. **No overlapping** - Blocks render with correct spacing at all times
3. **Dynamic height** - Automatic measurement using TanStack's built-in system
4. **Virtualization works** - Only visible blocks render (80%+ blocks not in DOM)
5. **Original behavior** - Scrolling feels exactly like before virtualization
6. **Zero business logic changes** - All block operations, state management, save logic unchanged
7. **Simpler code** - Fewer lines, cleaner API with useVirtualizer hook

### Verification:
- Visual: Only ONE scrollbar visible on the right
- Visual: Blocks have proper spacing, no overlap
- Console: Only 6-10 blocks rendering at once
- Functional: All block operations (add, delete, move, edit) work identically
- Performance: 60fps scrolling, no jank
- Code: ~50 lines removed, cleaner implementation

## What We're NOT Doing

This plan explicitly **DOES NOT**:
- ❌ Change any block operation logic (add, delete, move, duplicate)
- ❌ Modify state management or data flow
- ❌ Alter SmartSync or auto-save behavior
- ❌ Modify Block component or any block-specific components
- ❌ Change business rules or validation
- ❌ Alter infinite scroll pagination logic
- ❌ Modify mobile view or responsive behavior
- ❌ Add new features beyond fixing scrollbar + overlap

**Scope**: This is a library replacement + UI layout fix. Same functionality, better implementation.

## Implementation Approach

We'll use the **TanStack Virtual with automatic measurement** pattern:

1. **Replace react-window with @tanstack/react-virtual**
   - Install new library, uninstall old one
   - Replace `VariableSizeList` with `useVirtualizer` hook

2. **Leverage built-in dynamic measurement**
   - Use `measureElement` ref callback (built-in to TanStack)
   - Remove manual `setItemSize` and `resetAfterIndex` logic
   - Let TanStack handle height caching automatically

3. **Use parent scroll container**
   - Configure `getScrollElement` to return parent ref
   - Remove fixed height requirement
   - Single scrollbar solution

This approach:
- ✅ Eliminates double scrollbar (parent scroll only)
- ✅ Fixes overlapping (automatic accurate measurement)
- ✅ Simpler code (~50 lines less complexity)
- ✅ Better performance (TanStack's optimized ResizeObserver)
- ✅ Zero impact on business logic

---

## Phase 1: Install Dependencies and Remove Old Library

### Overview
Replace `react-window` with `@tanstack/react-virtual`.

### Changes Required:

#### 1. Uninstall Old Packages
**File**: `package.json`
**Action**: Remove old virtualization libraries

```bash
npm uninstall react-window react-window-infinite-loader
```

**Reason**: Clean removal before adding new library.

#### 2. Install @tanstack/react-virtual
**File**: `package.json`
**Action**: Add new dependency

```bash
npm install @tanstack/react-virtual
```

**Expected Change**:
```json
"dependencies": {
  // ... existing dependencies
  "@tanstack/react-virtual": "^3.10.8",
  // react-window and react-window-infinite-loader REMOVED
  // ... remaining dependencies
}
```

**Bundle Size Impact**:
- Removed: react-window (6KB) + react-window-infinite-loader (2KB) = 8KB removed
- Added: @tanstack/react-virtual (12KB) = 12KB added
- **Net change: +4KB** (acceptable for better functionality)

### Success Criteria:

#### Automated Verification:
- [ ] Old packages uninstalled: `npm list react-window` returns nothing
- [ ] New package installed: `npm list @tanstack/react-virtual` shows v3.10.8+
- [ ] No dependency conflicts: `npm ls` shows no errors
- [ ] Build succeeds: `npm run build`

#### Manual Verification:
- [ ] Development server starts without errors: `npm run dev`
- [ ] No import errors in console

---

## Phase 2: Replace react-window with TanStack Virtual

### Overview
Replace the `VariableSizeList` component with the `useVirtualizer` hook and update all related code.

### Changes Required:

#### 1. Update Import Statements
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Line 4
**Changes**: Replace react-window import with TanStack import

**BEFORE** (Line 4):
```javascript
import { VariableSizeList as List } from 'react-window';
```

**AFTER** (Line 4):
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';
```

**Reason**: TanStack uses a hook-based API instead of component-based.

**Important - React 19 Note**: Do NOT add `forwardRef` to imports. React 19 allows passing `ref` as a regular prop without `forwardRef` wrapper. Using `forwardRef` in React 19 causes referential instability that breaks memoization.

#### 2. Remove Manual Height Management Code
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Lines 213-242
**Changes**: **DELETE** the manual height management functions

**DELETE these functions** (no longer needed):
```javascript
// ❌ DELETE - Line 213-225: getItemSize
const getItemSize = useCallback((index) => {
  if (itemHeights.current[index]) {
    return itemHeights.current[index];
  }
  if (blocks[index]) {
    return getEstimatedHeight(blocks[index]) + ADD_BUTTON_HEIGHT;
  }
  return DEFAULT_BLOCK_HEIGHT + ADD_BUTTON_HEIGHT;
}, [blocks]);

// ❌ DELETE - Line 228-242: setItemSize
const setItemSize = useCallback((index, size) => {
  if (itemHeights.current[index] !== size) {
    const oldHeight = itemHeights.current[index];
    itemHeights.current[index] = size;
    // ... logging and resetAfterIndex logic
  }
}, [blocks]);
```

**Reason**: TanStack handles height measurement automatically via `measureElement`.

#### 3. Add useVirtualizer Hook
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: After block state setup (around line 200)
**Changes**: Add TanStack virtualizer configuration

**ADD this code**:
```javascript
// Configure TanStack virtualizer
const rowVirtualizer = useVirtualizer({
  count: blocks.length,
  getScrollElement: () => scrollContainerRef.current,
  estimateSize: (index) => {
    // Estimate based on block type
    const block = blocks[index];
    if (!block) return DEFAULT_BLOCK_HEIGHT + ADD_BUTTON_HEIGHT;
    return getEstimatedHeight(block) + ADD_BUTTON_HEIGHT;
  },
  overscan: 3, // Render 3 extra blocks outside viewport
  measureElement: (element) => {
    // TanStack will call this automatically via ref
    return element?.getBoundingClientRect().height ?? 0;
  },
});

// [VIRT-DEBUG-2] Log virtualizer info
console.log('[VIRT-DEBUG-2] ✅ VIRTUALIZATION ACTIVE (TanStack)');
console.log('[VIRT-DEBUG-2] Total blocks:', blocks.length);
console.log('[VIRT-DEBUG-2] Total height:', rowVirtualizer.getTotalSize(), 'px');
console.log('[VIRT-DEBUG-2] Overscan count: 3 blocks');

// ⚠️ REACT 19 WORKAROUND (if needed):
// If getVirtualItems() returns 0 items due to compiler hoisting (TanStack issue #743),
// wrap the virtualizer in a ref:
// const virtualizerRef = useRef(rowVirtualizer);
// Then use: virtualizerRef.current.getVirtualItems()
// Only apply this if you experience the issue - try without it first.
```

**Key Options Explained**:
- `count`: Total number of blocks to virtualize
- `getScrollElement`: Returns parent scroll container (fixes double scrollbar)
- `estimateSize`: Initial height estimate per block type
- `overscan`: Number of extra blocks to render outside viewport (smooth scrolling)
- `measureElement`: How to measure actual heights (automatic via ResizeObserver)

#### 4. Update BlockRenderer Component
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Lines 245-338
**Changes**: Remove manual measurement logic, accept ref as regular prop (React 19 style)

**BEFORE** (Lines 265-275):
```javascript
ref={(el) => {
  if (el && !block?.isLoading) {
    // Manual measurement with requestAnimationFrame
    requestAnimationFrame(() => {
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        onMeasure(index, height);
      }
    });
  }
}}
```

**AFTER**:
```javascript
ref={ref}  // ← Pass ref from parent directly
data-index={index}  // ← Required for TanStack to identify element
```

**Remove `onMeasure` prop** from BlockRenderer since it's no longer needed.

**Updated BlockRenderer (React 19 - ref as regular prop)**:
```javascript
// NO forwardRef needed in React 19!
// ref can be accepted as a regular prop in function components

const BlockRenderer = memo(({
  block,
  index,
  ref,  // ← React 19: ref is just a regular prop now
  style,
  isMobileView,
  focusedBlockId,
  showBlockSelector,
  selectorPosition,
  draggedBlockId,
  dropTargetId,
  dropPosition,
  // ❌ REMOVED: onMeasure
}) => {
  // ... component code

  return (
    <div
      ref={ref}  // ← Pass ref directly (React 19 allows this!)
      data-index={index}  // ← Required for TanStack to identify element
      style={style}
      className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
    >
      {/* ... rest of component */}
    </div>
  );
});
```

#### 5. Update VirtualRow Renderer
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Lines 341-373
**Changes**: Adapt to TanStack's virtual item structure

**BEFORE** (react-window pattern):
```javascript
const VirtualRow = useCallback(({ index, style }) => {
  const block = blocks[index];
  if (!block) return null;

  console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length}...`);

  return (
    <BlockRenderer
      block={block}
      index={index}
      style={style}  // ← react-window provides positioning style
      // ... other props
      onMeasure={setItemSize}
    />
  );
}, [blocks, setItemSize]);
```

**AFTER** (TanStack pattern):
```javascript
// ❌ DELETE VirtualRow - no longer needed as separate function
// TanStack virtualizer renders items directly in JSX
```

**Reason**: TanStack uses `getVirtualItems()` which returns ready-to-render items with positioning data. No need for separate row renderer component.

#### 6. Update Render JSX - Replace List Component
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Lines 1643-1669
**Changes**: Replace `<List>` component with TanStack's manual rendering

**Important**: The parent `<div ref={scrollContainerRef}>` at line 1392 stays unchanged. We're only replacing the `<List>` component (lines 1656-1667) that's inside it.

**Parent Structure** (line 1392, keep as-is):
```javascript
<div
  ref={scrollContainerRef}
  className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-stable"
>
  {/* Header content */}

  {/* Virtualized Block List - THIS IS WHAT WE'RE REPLACING */}
  <List ... />  {/* Lines 1656-1667 */}

  {/* Load more section */}
</div>
```

**BEFORE** (react-window):
```javascript
{/* Virtualized Block List */}
{blocks.length > 0 ? (
  (() => {
    const validBlocks = blocks.filter(b => b !== null && b !== undefined);
    console.log(`[VIRT-DEBUG-2] ✅ VIRTUALIZATION ACTIVE`);
    console.log(`[VIRT-DEBUG-2] Total blocks: ${validBlocks.length}`);
    console.log(`[VIRT-DEBUG-2] List height: ${listHeight || 600}px`);

    return (
      <List
        ref={listRef}
        height={listHeight || 600}  // ← PROBLEM: Fixed height
        itemCount={validBlocks.length}
        itemSize={getItemSize}
        width="100%"
        overscanCount={3}
        className="virtual-list"
      >
        {VirtualRow}
      </List>
    );
  })()
) : null}
```

**AFTER** (TanStack Virtual):
```javascript
{/* Virtualized Block List with TanStack */}
{blocks.length > 0 && (
  <div
    style={{
      height: `${rowVirtualizer.getTotalSize()}px`,
      width: '100%',
      position: 'relative',
    }}
  >
    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const block = blocks[virtualRow.index];
      if (!block) return null;

      // [VIRT-DEBUG-1] Log which blocks render
      console.log(`[VIRT-DEBUG-1] Rendering block ${virtualRow.index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)}) at position ${virtualRow.start}px`);

      return (
        <BlockRenderer
          key={virtualRow.key}
          ref={rowVirtualizer.measureElement}  // ← Pass TanStack's measurement ref
          block={block}
          index={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
          data-index={virtualRow.index}  // ← Required for TanStack
          isMobileView={isMobileView}
          focusedBlockId={focusedBlockId}
          showBlockSelector={showBlockSelector}
          selectorPosition={selectorPosition}
          draggedBlockId={draggedBlockId}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
          // ❌ REMOVED: onMeasure prop
        />
      );
    })}
  </div>
)}
```

**Key Changes Explained**:

1. **Outer div height**: `rowVirtualizer.getTotalSize()`
   - Represents total scrollable area
   - Parent container scrolls this full height

2. **No fixed height**: Removed `height={listHeight || 600}`
   - Prevents internal scrolling
   - Parent `scrollContainerRef` handles all scrolling

3. **Manual rendering**: `getVirtualItems().map()`
   - TanStack returns array of visible items
   - We render them with absolute positioning

4. **Positioning style**:
   ```javascript
   style={{
     position: 'absolute',
     top: 0,
     left: 0,
     width: '100%',
     transform: `translateY(${virtualRow.start}px)`,
   }}
   ```
   - `transform: translateY()` positions each block
   - Hardware-accelerated, smooth scrolling
   - `virtualRow.start` is calculated by TanStack

5. **Key from virtualRow**: `key={virtualRow.key}`
   - TanStack provides stable keys
   - Better React reconciliation

#### 7. Remove Old State and Refs
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Various
**Changes**: Clean up unused react-window artifacts

**REMOVE these** (no longer needed):
```javascript
// ❌ REMOVE - Line 30: blockHeightCache declaration and Map
const blockHeightCache = new Map();

// ❌ REMOVE - Line 198: itemHeights ref (TanStack tracks heights internally)
const itemHeights = useRef({});

// ❌ REMOVE - Line 197: listRef (no List component anymore)
const listRef = useRef();

// ❌ REMOVE - Lines 376-378: listHeight calculation (TanStack uses parent height)
const listHeight = useMemo(() => {
  return windowHeight - 350;
}, [windowHeight]);
```

**MODIFY this function** (remove caching, keep estimation logic):
```javascript
// ⚠️ MODIFY - Lines 35-62: getEstimatedHeight function
// REMOVE the blockHeightCache usage (lines 38-42) but KEEP the function
// The function is still needed for TanStack's estimateSize option

const getEstimatedHeight = (block) => {
  if (!block) return DEFAULT_BLOCK_HEIGHT;

  // ❌ DELETE these lines (38-42) - TanStack handles caching internally
  // const cacheKey = `${block.id}-${block.type}`;
  // if (blockHeightCache.has(cacheKey)) {
  //   return blockHeightCache.get(cacheKey);
  // }

  // ✅ KEEP the estimation logic (lines 45-62) - used by TanStack's estimateSize
  switch (block.type) {
    case 'text':
      const lineCount = (block.content || '').split('\n').length;
      return Math.max(100, lineCount * 24 + 40);
    case 'heading':
      return 80;
    // ... rest of switch cases
  }
};
```

**KEEP these** (still needed):
```javascript
// ✅ KEEP - scrollContainerRef (parent scroll element)
const scrollContainerRef = useRef();

// ✅ KEEP - windowHeight state (for other layout calculations)
const [windowHeight, setWindowHeight] = useState(window.innerHeight);

// ✅ KEEP - DEFAULT_BLOCK_HEIGHT constant
const DEFAULT_BLOCK_HEIGHT = 150;

// ✅ KEEP - ADD_BUTTON_HEIGHT constant
const ADD_BUTTON_HEIGHT = 40;

// ✅ KEEP - getEstimatedHeight function (modified as shown above)
```

#### 8. Update Debug Logging
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Line 27
**Changes**: Update import verification log

**BEFORE**:
```javascript
console.log('[VIRT-DEBUG-IMPORT] List component imported:', typeof List, List);
```

**AFTER**:
```javascript
console.log('[VIRT-DEBUG-IMPORT] useVirtualizer hook imported:', typeof useVirtualizer);
```

#### 9. Add DOM Verification (Keep Existing)
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Around line 1700 (after blocks render)
**Changes**: **NO CHANGES** - existing verification still works

**KEEP this code** (already exists):
```javascript
// [VIRT-DEBUG-5] Verify virtualization is working
useEffect(() => {
  if (blocks.length > 10) {
    setTimeout(() => {
      const renderedBlocks = document.querySelectorAll('[data-block-id]');
      console.log('[VIRT-DEBUG-5] ✅ DOM VERIFICATION:');
      console.log('[VIRT-DEBUG-5] Total blocks:', blocks.length);
      console.log('[VIRT-DEBUG-5] Rendered in DOM:', renderedBlocks.length);
      console.log('[VIRT-DEBUG-5] Virtualization ratio:',
        Math.round((1 - renderedBlocks.length / blocks.length) * 100) + '% blocks NOT rendered');
    }, 1000);
  }
}, [blocks.length]);
```

**Reason**: DOM verification is independent of virtualization library.

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript/ESLint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors about undefined `List` or `getItemSize`
- [ ] No console errors about `useVirtualizer` or `measureElement`
- [ ] Development server runs: `npm run dev`

#### Manual Verification:
- [ ] **Single scrollbar**: Only ONE scrollbar visible on right side
- [ ] **No overlapping**: All blocks have proper spacing between them
- [ ] **Virtualization works**: Console shows only 6-10 blocks rendering (check [VIRT-DEBUG-1] logs)
- [ ] **Smooth scrolling**: Scrolling feels natural, 60fps
- [ ] **Window resize**: Resizing browser window works smoothly
- [ ] **All block operations work**: Add, delete, move, edit blocks function normally
- [ ] **AutoSave works**: Changes save automatically after 1 second
- [ ] **No regressions**: Dashboard, navigation, other features unaffected

---

## Phase 3: Optimize Height Estimation

### Overview
Fine-tune the `getEstimatedHeight` function (modified in Phase 2) for better initial height predictions, reducing layout shifts.

**Note**: In Phase 2, we removed the `blockHeightCache` usage from this function. Now we'll enhance the estimation logic itself for more accurate predictions.

### Changes Required:

#### 1. Enhance getEstimatedHeight Function
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Lines 35-62 (modified in Phase 2)
**Changes**: Add more accurate estimates per block type

**Current** (after Phase 2 modifications):
```javascript
const getEstimatedHeight = (block) => {
  if (!block) return DEFAULT_BLOCK_HEIGHT;

  // No more blockHeightCache - that was removed in Phase 2

  // Basic estimates (lines 45-62)
  switch (block.type) {
    case 'text':
      const lineCount = (block.content || '').split('\n').length;
      return Math.max(100, lineCount * 24 + 40);
    case 'heading':
      return 80;
    case 'code':
      return 200;
    // ... other basic cases
    default:
      return DEFAULT_BLOCK_HEIGHT;
  }
};
```

**Enhanced** (more detailed estimates):
```javascript
const getEstimatedHeight = (block) => {
  // More accurate estimates based on block type and content
  switch (block.type) {
    case 'text':
      // Estimate based on content length if available
      const textLength = block.content?.length || 0;
      if (textLength > 500) return 200;
      if (textLength > 200) return 150;
      return 100;

    case 'heading':
      return block.data?.level === 1 ? 80 : 60;

    case 'code':
      // Estimate based on line count if available
      const lines = block.content?.split('\n').length || 10;
      return Math.min(lines * 24 + 100, 600);

    case 'ai':
      // AI blocks tend to be large
      return 500;

    case 'table':
      return 300;

    case 'todo':
      return 200;

    case 'filetree':
      // Depends on tree depth, but usually large
      return 600;

    case 'image':
    case 'inlineImage':
      return 400;

    case 'issueTracker':
      return 400;

    default:
      return DEFAULT_BLOCK_HEIGHT;
  }
};
```

**Reason**: Better initial estimates = less layout shift = smoother scrolling.

### Success Criteria:

#### Automated Verification:
- [ ] Build succeeds: `npm run build`
- [ ] No console errors

#### Manual Verification:
- [ ] **Less jumping**: Initial scroll position more stable
- [ ] **Smooth loading**: Blocks appear without major layout shifts
- [ ] **Accurate scrollbar**: Scrollbar size/position more accurate from start

---

## Phase 4: Cleanup and Optimization (Optional)

### Overview
Remove unused code and optimize performance.

### Changes Required:

#### 1. Remove Unused CSS Classes
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Line 1662 (in old List component)
**Changes**: Check if `virtual-list` class is still needed

**Note**: Line 24 imports `'./VirtualizedGrid.css'` for scrollbar styles. This CSS file should be **KEPT** as it contains general scrollbar styling (not virtualization-specific).

**OLD**:
```javascript
<List className="virtual-list">
```

**Check**: Is `.virtual-list` CSS class used anywhere?
- If NO: Remove only the `.virtual-list` class definition from VirtualizedGrid.css (keep the file)
- If YES: Apply to new virtualized container div

**Keep the import**:
```javascript
// Line 24 - KEEP THIS
import './VirtualizedGrid.css'; // For scrollbar styles (unrelated to virtualization)
```

#### 2. Remove Debug Logs (Optional)
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Multiple locations
**Changes**: Reduce verbose logging

**Recommended logs to KEEP**:
```javascript
// Line 27: Import verification
console.log('[VIRT-DEBUG-IMPORT] useVirtualizer hook imported:', typeof useVirtualizer);

// Virtualizer config (new location)
console.log('[VIRT-DEBUG-2] ✅ VIRTUALIZATION ACTIVE (TanStack)');
console.log('[VIRT-DEBUG-2] Total blocks:', blocks.length);

// DOM verification (existing)
console.log('[VIRT-DEBUG-5] ✅ VIRTUALIZATION WORKING');
```

**Logs to REMOVE** (too verbose):
```javascript
// ❌ REMOVE - Per-block render logs
console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length}...`);

// ❌ REMOVE - Height measurement logs
console.log(`[VIRT-DEBUG-4] Measured block ${index}...`);
```

#### 3. Clean Up Comments
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Location**: Throughout file
**Changes**: Remove outdated comments about react-window

**Remove references to**:
- "VariableSizeList"
- "react-window"
- "resetAfterIndex"
- "outerRef" (if mentioned incorrectly)

**Add new comments**:
- "TanStack Virtual handles measurement automatically"
- "Using parent scroll container (single scrollbar)"
- "Automatic ResizeObserver-based height tracking"

### Success Criteria:

#### Automated Verification:
- [ ] Build succeeds: `npm run build`
- [ ] No unused imports warning
- [ ] Code linting passes: `npm run lint`

#### Manual Verification:
- [ ] Console is clean (only essential logs)
- [ ] Code is readable and well-commented
- [ ] No dead code or unused functions

---

## Testing Strategy

### Unit Tests:
**Status**: No new unit tests required

**Reason**: This is a library swap with same input/output behavior. Existing tests (if any) should continue to pass.

### Integration Tests:
**Status**: Verify existing tests pass

**Action**: Run existing test suite (if present) to ensure no regressions.

### Manual Testing Steps:

#### Test 1: Single Scrollbar Verification ⭐ CRITICAL
1. Open any document with 30+ blocks
2. **Verify**: Only ONE scrollbar visible on right side
3. **Verify**: No second scrollbar inside block area
4. **Verify**: Scrollbar looks and behaves like original

#### Test 2: Block Overlap Prevention ⭐ CRITICAL
1. Open document with mixed block types (text, code, filetree, tables)
2. Scroll through entire document slowly
3. **Verify**: No blocks overlap or render on top of each other
4. **Verify**: Consistent spacing between all blocks
5. **Verify**: Large blocks (filetree, tables) display completely

#### Test 3: Virtualization Performance ⭐ CRITICAL
1. Open browser console (F12)
2. Search for `[VIRT-DEBUG-5]` logs
3. **Verify**: Message shows "✅ VIRTUALIZATION WORKING"
4. **Verify**: "Rendered in DOM" count is 6-10 (not 36+)
5. **Verify**: Ratio shows 70-85% blocks NOT rendered

#### Test 4: Smooth Scrolling
1. Open document with 50+ blocks
2. Scroll up and down rapidly
3. **Verify**: 60fps smooth scrolling (no jank)
4. **Verify**: No layout shifts or jumps
5. **Verify**: Blocks appear/disappear smoothly at edges

#### Test 5: Window Resize Behavior
1. Open document in browser
2. Resize browser window (make smaller and larger)
3. **Verify**: Virtualization adapts automatically
4. **Verify**: No scrollbar jumps or glitches
5. **Verify**: Blocks remain properly spaced

#### Test 6: Block Operations Still Work
1. **Add block**: Verify appears at correct position
2. **Delete block**: Verify remaining blocks reflow
3. **Move block up/down**: Verify reordering works
4. **Edit block content**: Verify height adjusts automatically
5. **Duplicate block**: Verify copy appears correctly

#### Test 7: Height Measurement
1. Open document with various block types
2. **Verify**: Each block type renders with correct height
3. **Edit** a text block to add lots of content
4. **Verify**: Block height updates automatically (no overlap)
5. **Check console**: Should see automatic remeasurement

#### Test 8: Edge Cases
1. **Empty document** (0 blocks) - Verify no errors
2. **Single block** - Verify displays correctly
3. **Very long document** (100+ blocks) - Verify smooth scrolling
4. **Rapid scrolling** - Verify no visual glitches
5. **Scroll to bottom then add block** - Verify correct positioning

#### Test 9: Mobile View (if applicable)
1. Open document on mobile device or emulation
2. **Verify**: Single scrollbar behavior
3. **Verify**: Touch scrolling smooth
4. **Verify**: No overlapping blocks

#### Test 10: Existing Features Unchanged
1. **AutoSave**: Edit block, verify saves after 1 second
2. **Share**: Share document, verify link works
3. **Navigation**: Navigate between documents
4. **Search**: Search blocks (if feature exists)
5. **Backlinks**: Verify backlinks display (if feature exists)

---

## Performance Considerations

### Expected Performance:

**TanStack Virtual advantages**:
- ✅ **Built-in ResizeObserver**: More efficient than manual measurement
- ✅ **Optimized reconciliation**: Smarter update batching
- ✅ **Better scrolling**: Hardware-accelerated transforms
- ✅ **Less code**: Simpler API = fewer bugs

**Metrics** (100-block document):
- Initial load: < 1 second
- Scrolling FPS: 58-60fps (smooth)
- Memory usage: 40-120MB (similar to current)
- DOM nodes: 250-500 (only visible blocks)
- Render time per scroll: < 16ms (60fps budget)

### Performance Verification:

1. **Chrome DevTools > Performance**:
   - Record while scrolling
   - **Verify**: Frame rate above 55fps
   - **Verify**: No layout thrashing
   - **Verify**: Minimal forced reflows

2. **Chrome DevTools > Memory**:
   - Take heap snapshot
   - **Verify**: Memory stable (no leaks)
   - **Verify**: Reasonable memory usage (<150MB)

3. **React DevTools > Profiler**:
   - Profile scrolling interaction
   - **Verify**: Fast component updates
   - **Verify**: No unnecessary re-renders

### Potential Issues & Mitigations:

**Issue**: Initial scroll jump during measurement
- **Mitigation**: Accurate `estimateSize` reduces jump (Phase 3)
- **Fallback**: TanStack's automatic correction

**Issue**: Slow measurement on complex blocks
- **Mitigation**: TanStack uses ResizeObserver (native, fast)
- **Fallback**: Increase `overscan` if needed

**Issue**: Memory increase vs react-window
- **Mitigation**: TanStack is efficient; difference negligible
- **Monitoring**: Track via Chrome DevTools

---

## Migration Notes

### Rollback Plan:

If critical issues occur, revert to react-window:

```bash
# 1. Reinstall react-window
npm install react-window

# 2. Uninstall TanStack
npm uninstall @tanstack/react-virtual

# 3. Revert code changes
git checkout HEAD -- src/components/ExpandedViewEnhanced.jsx

# 4. Rebuild
npm run build
```

**Important**: Keep a git commit before migration as rollback point.

### Breaking Changes:
**None** - This is an internal implementation change. External behavior identical.

### User Impact:
- **Positive**: Better scrolling UX, no more double scrollbar
- **Positive**: Blocks no longer overlap
- **Positive**: More reliable height measurement
- **Neutral**: Visual appearance identical
- **No migration needed**: No data structure changes

### Developer Impact:
- **Positive**: Simpler code (less manual height management)
- **Positive**: Fewer bugs (library handles edge cases)
- **Positive**: Better maintainability
- **Learning**: New API to understand (TanStack documentation)

---

## References

### Documentation:
- **TanStack Virtual Docs**: (provided in tanstack-react-virtual-docs.md)
- **Migration Guide**: Lines 634-644 in docs (react-window differences)
- **Dynamic Heights**: Lines 96-147 in docs (measureElement pattern)
- **Basic Usage**: Lines 36-93 in docs (core concepts)

### Code References:
- **Current Implementation**: `src/components/ExpandedViewEnhanced.jsx`
  - Line 4: Import statement
  - Lines 213-242: Height management (to be replaced)
  - Lines 341-373: VirtualRow (to be replaced)
  - Lines 1643-1669: List component (to be replaced)
- **Old Plan**: `thoughts/shared/plans/virtualization-scrollbar-fix-implementation.md`
  - Lines 23-42: Problem diagnosis (still valid)
  - Lines 213-225: Current getItemSize code
  - Lines 445-504: Testing strategy (still applicable)

### Similar Patterns in Codebase:
- **BlockRenderer**: Lines 245-338 (measurement ref callback pattern)
- **Block component**: `src/components/Block.jsx` (block rendering)
- **Scroll container**: Line 1392 `scrollContainerRef`

---

## Implementation Checklist

### Pre-Implementation:
- [ ] Create git branch: `git checkout -b feat/tanstack-virtual-migration`
- [ ] Backup current file: `cp src/components/ExpandedViewEnhanced.jsx src/components/ExpandedViewEnhanced.backup.jsx`
- [ ] Review this plan with user
- [ ] Ensure local development environment ready

### Phase 1 - Dependencies:
- [ ] Uninstall react-window: `npm uninstall react-window react-window-infinite-loader`
- [ ] Install @tanstack/react-virtual: `npm install @tanstack/react-virtual`
- [ ] Verify installation: `npm list @tanstack/react-virtual`
- [ ] Verify build succeeds: `npm run build`

### Phase 2 - Code Migration:
- [ ] Update import statement - replace react-window with TanStack (line 4)
- [ ] Delete `getItemSize` function (lines 213-225)
- [ ] Delete `setItemSize` function (lines 228-242)
- [ ] Add `useVirtualizer` hook configuration
- [ ] Add React 19 compiler workaround note (optional)
- [ ] Update BlockRenderer to accept ref as regular prop (React 19 style)
- [ ] Update BlockRenderer ref handling - pass ref directly
- [ ] Remove `onMeasure` prop from BlockRenderer
- [ ] Delete `VirtualRow` function (lines 341-373)
- [ ] Replace `<List>` component with manual rendering (lines 1643-1669)
- [ ] Remove unused state/refs (`listRef`, `itemHeights`)
- [ ] Remove `blockHeightCache` Map (line 30)
- [ ] Modify `getEstimatedHeight` to remove blockHeightCache usage (lines 38-42)
- [ ] Remove `listHeight` calculation (lines 376-378)
- [ ] Update debug logging
- [ ] Verify build succeeds: `npm run build`

### Phase 3 - Optimization:
- [ ] Enhance `getEstimatedHeight` function
- [ ] Test with various block types
- [ ] Adjust estimates based on testing

### Phase 4 - Cleanup:
- [ ] Remove unused CSS classes (if any)
- [ ] Reduce debug logging verbosity
- [ ] Clean up comments
- [ ] Run linter: `npm run lint`

### Testing:
- [ ] Test 1: Single scrollbar verification ⭐
- [ ] Test 2: Block overlap prevention ⭐
- [ ] Test 3: Virtualization performance ⭐
- [ ] Test 4: Smooth scrolling
- [ ] Test 5: Window resize behavior
- [ ] Test 6: Block operations
- [ ] Test 7: Height measurement
- [ ] Test 8: Edge cases
- [ ] Test 9: Mobile view
- [ ] Test 10: Existing features unchanged

### Performance Verification:
- [ ] Chrome DevTools > Performance (60fps check)
- [ ] Chrome DevTools > Memory (leak check)
- [ ] React DevTools > Profiler (render check)

### Finalization:
- [ ] Create commit: `git commit -m "feat: migrate to @tanstack/react-virtual"`
- [ ] Create pull request
- [ ] Document any issues found
- [ ] Get code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Monitor for issues
- [ ] Deploy to production

---

## Success Definition

This migration is **COMPLETE** and **SUCCESSFUL** when:

1. ✅ **Single Scrollbar**: Only one scrollbar visible (parent container)
2. ✅ **No Overlapping**: Blocks never render on top of each other
3. ✅ **Virtualization Active**: Console logs confirm 80%+ blocks not rendered
4. ✅ **Smooth Scrolling**: 60fps performance, no jank
5. ✅ **Automatic Measurement**: Heights update without manual intervention
6. ✅ **All Operations Work**: Add/delete/move/edit blocks function identically
7. ✅ **Zero Business Logic Changes**: No impact on state management or data flow
8. ✅ **Simpler Code**: Fewer lines, cleaner implementation
9. ✅ **Production Ready**: No console errors, stable performance
10. ✅ **User Confirmation**: "The scrollbar issue is fixed and blocks don't overlap"

### Verification Commands:

**Automated Checks**:
```bash
# 1. Verify build succeeds
npm run build

# 2. Verify linting passes
npm run lint

# 3. Verify react-window is completely removed
grep -c "react-window" src/components/ExpandedViewEnhanced.jsx
# Expected output: 0

# 4. Verify TanStack Virtual is imported
grep -c "@tanstack/react-virtual" src/components/ExpandedViewEnhanced.jsx
# Expected output: 1 (the import line)

# 5. Verify useVirtualizer is being used
grep -c "useVirtualizer" src/components/ExpandedViewEnhanced.jsx
# Expected output: 2+ (import + usage)

# 6. Verify old List component is removed
grep -c "VariableSizeList\|<List" src/components/ExpandedViewEnhanced.jsx
# Expected output: 0

# 7. Verify dependencies are updated
npm list react-window
# Expected output: (empty) or error "not found"

npm list @tanstack/react-virtual
# Expected output: Shows version 3.10.8+
```

**Manual Verification**:
```bash
# 1. Start development server
npm run dev

# 2. Open document with 30+ blocks
# 3. Check console for [VIRT-DEBUG-5] logs
# 4. Confirm only 6-10 blocks rendered in DOM
# 5. Verify single scrollbar visible (not two)
# 6. Test smooth scrolling performance
```

---

## Appendix: Code Diff Summary

### Lines Added: ~60
- useVirtualizer hook configuration
- Manual rendering with getVirtualItems().map()
- Enhanced estimateSize function
- TanStack-specific ref callbacks

### Lines Removed: ~80
- getItemSize function
- setItemSize function
- VirtualRow component
- List component JSX
- Manual height cache management
- resetAfterIndex calls

### Net Change: **-20 lines** (simpler implementation)

### Key Files Modified: **1**
- `src/components/ExpandedViewEnhanced.jsx`

### Key Files Unchanged: **Everything else**
- ✅ `src/components/Block.jsx`
- ✅ `src/components/blocks/*.jsx` (all block components)
- ✅ `src/utils/smartSync.js`
- ✅ `src/utils/blockSerializer.js`
- ✅ All business logic

---

**Last Updated**: 2025-11-06 (React 19 Corrected)
**Plan Version**: 2.2 (TanStack Virtual - React 19 Compatible)
**Replaces**: virtualization-scrollbar-fix-implementation.md (react-window + AutoSizer)
**Estimated Time**: 3-4 hours implementation + 2 hours testing
**Risk Level**: LOW (library swap, well-documented)
**Ready for Implementation**: YES ✅

---

## Plan Corrections (v2.2)

This version includes React 19 compatibility fixes:

### v2.2 Changes (React 19 Compatibility):

1. **CRITICAL: Removed forwardRef requirement** (Phase 2, Step 1 & 4)
   - React 19 allows `ref` as a regular prop - no `forwardRef` needed
   - Using `forwardRef` in React 19 causes referential instability
   - BlockRenderer accepts `ref` as a normal prop parameter
   - Simpler code, better performance with React 19

2. **Added React 19 compiler workaround** (Phase 2, Step 3)
   - TanStack Virtual + React 19 compiler may hoist `getVirtualItems()` calls
   - Added optional workaround using `useRef` wrapper (TanStack issue #743)
   - Only needed if experiencing 0 items issue
   - Try without workaround first, apply if needed

3. **Updated implementation checklist**
   - Removed "Add forwardRef to imports" task
   - Changed to "accept ref as regular prop (React 19 style)"
   - Added React 19 workaround note task

### v2.1 Changes (Previous corrections):

1. **Clarified getEstimatedHeight handling** (Phase 2, Step 7 & Phase 3)
   - Function should be **MODIFIED**, not removed
   - Remove only the `blockHeightCache` usage (lines 38-42)
   - Keep estimation logic for TanStack's `estimateSize` option
   - Phase 3 enhances the estimation logic further

2. **Fixed line number references**
   - Line 30: `blockHeightCache` Map declaration
   - Line 197: `listRef` ref
   - Line 198: `itemHeights` ref
   - Lines 38-42: blockHeightCache usage in getEstimatedHeight

3. **Added scrollContainerRef structure clarity** (Phase 2, Step 6)
   - Parent div at line 1392 stays unchanged
   - Only replacing the `<List>` component inside it

4. **Clarified VirtualizedGrid.css dependency** (Phase 4, Step 1)
   - CSS file should be kept (contains scrollbar styles)
   - Only remove `.virtual-list` class if unused

5. **Added automated verification commands** (Success Definition section)
   - Grep commands to verify complete migration
   - Dependency check commands
   - Build and lint verification

6. **Updated implementation checklist**
   - More detailed steps for Phase 2
   - Separated getEstimatedHeight modification from removal tasks
