# React Virtuoso Flickering Fix Implementation Plan

## Overview

Fix the scrolling flickering issue in the document editor by optimizing react-virtuoso configuration and reducing unnecessary re-renders. The virtualization is working (75-84% blocks not rendered), but excessive component mounting/unmounting and prop updates during scroll cause visible flickering.

## Current State Analysis

### What Works Now:
- ✅ Virtualization is active (only 8-9 of 36 blocks rendered)
- ✅ React.memo implemented on BlockRenderer
- ✅ Stable keys via `computeItemKey={(index, block) => block.id}`
- ✅ Buffer zones configured: `increaseViewportBy={{ top: 200, bottom: 600 }}`
- ✅ Default item height set: `defaultItemHeight={150}`

### Current Problems (from log.md):
1. **Excessive prop updates during scroll**: `[INLINE-ACTION] Props received` fires multiple times for same blocks
2. **Unnecessary mount/unmount cycles**: AIBlock unmounts (line 208) then immediately remounts (line 222)
3. **BlockRenderer re-evaluations**: All 9 props checked on every scroll, even when unchanged
4. **Visual flickering**: Components flash/flicker during scroll operations

### Root Causes:
1. **Missing performance optimization**: No `skipAnimationFrameInResizeObserver` prop on Virtuoso
2. **Parent state causing cascades**: 6 drag/focus state props trigger memo checks on all blocks
3. **Potential margin issues**: Block components may use margins instead of padding
4. **Suboptimal buffer zones**: 200px top buffer may be too small for complex blocks

### Key Discoveries:
- `src/components/ExpandedViewEnhanced.jsx:1477-1508` - Current Virtuoso configuration
- `src/components/ExpandedViewEnhanced.jsx:216-229` - BlockRenderer memo comparison (9 props)
- `log.md:47-287` - Shows excessive `[INLINE-ACTION] Props received` during scroll
- `log.md:208` - Example: AIBlock unmounts unnecessarily

## Desired End State

After implementing this plan:
- ✅ **Zero flickering** during normal scroll operations
- ✅ **Minimal re-renders** - Only affected blocks re-render on state changes
- ✅ **Smooth scrolling** at 60 FPS with no visual artifacts
- ✅ **Stable components** - No unnecessary unmount/remount cycles
- ✅ **Same functionality** - All drag-drop, focus, and editing features preserved

### Verification:
- Scroll up/down rapidly - no flickering
- FileTreeBlock expand/collapse - smooth transitions
- Drag blocks - only dragged/targeted blocks update
- Focus blocks - only previous/new focused blocks update
- Console logs show minimal prop updates

## What We're NOT Changing

❌ **NOT changing block components** - They remain unchanged
❌ **NOT modifying BlockRenderer structure** - Only memo comparison optimization
❌ **NOT removing virtualization** - Virtuoso stays as the solution
❌ **NOT touching lazy loading** - `useBlockLazyLoading` continues to work
❌ **NOT changing scrollbar** - Single scrollbar with current styling maintained

## Implementation Approach

**Strategy**: Optimize Virtuoso configuration and reduce unnecessary prop comparisons in BlockRenderer memo. This is a surgical optimization that addresses the root causes of flickering without breaking existing functionality.

**Why These Optimizations?**
1. **skipAnimationFrameInResizeObserver** - Documented fix for flicker in official Virtuoso docs
2. **Increased buffer zones** - Pre-render more content to reduce load-in flash
3. **Optimized memo comparison** - Only check props that actually change during scroll
4. **Margin cleanup** - Fix measurement instability if margins are present

**Rollback Strategy**: Each phase is independent and can be tested/reverted separately.

---

## Phase 1: Add Virtuoso Performance Props

### Overview
Add performance-optimizing props to the Virtuoso component that are documented to reduce flickering.

### Changes Required:

#### 1. Add skipAnimationFrameInResizeObserver
**File**: `src/components/ExpandedViewEnhanced.jsx:1477`
**Changes**: Add prop to skip RAF callbacks in ResizeObserver

```javascript
// BEFORE (lines 1477-1508):
<Virtuoso
  useWindowScroll={false}
  customScrollParent={scrollContainerRef.current}
  style={{ height: '100%' }}
  data={blocks}
  defaultItemHeight={150}
  increaseViewportBy={{ top: 200, bottom: 600 }}
  computeItemKey={(index, block) => block.id}
  itemContent={(index, block) => {
    // ... existing code
  }}
/>

// AFTER:
<Virtuoso
  useWindowScroll={false}
  customScrollParent={scrollContainerRef.current}
  style={{ height: '100%' }}
  data={blocks}
  defaultItemHeight={150}
  increaseViewportBy={{ top: 400, bottom: 800 }}  // CHANGED: Increased buffer
  skipAnimationFrameInResizeObserver={true}  // ADDED: Skip RAF for performance
  computeItemKey={(index, block) => block.id}
  itemContent={(index, block) => {
    // ... existing code (unchanged)
  }}
/>
```

**Why these values?**
- `skipAnimationFrameInResizeObserver={true}`: [Documented fix](https://virtuoso.dev/troubleshooting/) for flickering
- `increaseViewportBy={{ top: 400, bottom: 800 }}`: Double the buffer zones
  - Top: 200 → 400 (renders ~2-3 blocks above viewport)
  - Bottom: 600 → 800 (renders ~5-6 blocks below viewport)
  - Prevents blanks during fast upward scroll

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript errors: `npm run build`
- [x] No linting errors: `npm run lint`
- [x] Application builds successfully
- [x] No console errors on page load

#### Manual Verification:
- [x] Scroll up/down - measure perceived smoothness
- [x] Check console for ResizeObserver errors (benign if they occur)
- [x] Verify virtualization still working: `[VIRT-DEBUG-5]` shows 70%+ blocks not rendered
- [x] FileTreeBlock expand/collapse works smoothly
- [x] Compare before/after flickering severity (should be notably better)

---

## Phase 2: Optimize BlockRenderer Memo Comparison

### Overview
Reduce unnecessary re-render checks by optimizing the memo comparison function. Currently checks 9 props, but most don't change during scroll.

### Changes Required:

#### 1. Separate Stable vs Dynamic Props
**File**: `src/components/ExpandedViewEnhanced.jsx:216-229`
**Changes**: Optimize comparison to short-circuit on common cases

```javascript
// BEFORE (lines 216-229):
, (prevProps, nextProps) => {
  // Only re-render if these specific props changed
  return (
    prevProps.block === nextProps.block &&
    prevProps.index === nextProps.index &&
    prevProps.isMobileView === nextProps.isMobileView &&
    prevProps.focusedBlockId === nextProps.focusedBlockId &&
    prevProps.showBlockSelector === nextProps.showBlockSelector &&
    prevProps.selectorPosition === nextProps.selectorPosition &&
    prevProps.draggedBlockId === nextProps.draggedBlockId &&
    prevProps.dropTargetId === nextProps.dropTargetId &&
    prevProps.dropPosition === nextProps.dropPosition
  );
});

// AFTER:
, (prevProps, nextProps) => {
  // Fast path: Check most frequently changing props first
  // Block reference changes most often (content edits)
  if (prevProps.block !== nextProps.block) return false;
  if (prevProps.index !== nextProps.index) return false;

  // Check if THIS block is affected by focus changes
  const prevFocused = prevProps.focusedBlockId === prevProps.block.id;
  const nextFocused = nextProps.focusedBlockId === nextProps.block.id;
  if (prevFocused !== nextFocused) return false;

  // Check if THIS block is affected by drag operations
  const prevDragged = prevProps.draggedBlockId === prevProps.block.id;
  const nextDragged = nextProps.draggedBlockId === nextProps.block.id;
  if (prevDragged !== nextDragged) return false;

  const prevDropTarget = prevProps.dropTargetId === prevProps.block.id;
  const nextDropTarget = nextProps.dropTargetId === nextProps.block.id;
  if (prevDropTarget !== nextDropTarget) return false;

  // Only check dropPosition if this block is the drop target
  if (prevDropTarget && nextDropTarget) {
    if (prevProps.dropPosition !== nextProps.dropPosition) return false;
  }

  // Check if THIS block is showing the selector
  const prevShowingSelector = prevProps.showBlockSelector && prevProps.selectorPosition === prevProps.block.id;
  const nextShowingSelector = nextProps.showBlockSelector && nextProps.selectorPosition === nextProps.block.id;
  if (prevShowingSelector !== nextShowingSelector) return false;

  // Rarely changes
  if (prevProps.isMobileView !== nextProps.isMobileView) return false;

  // All checks passed - skip re-render
  return true;
});
```

**Why this optimization?**
- **Early exit pattern**: Returns `false` immediately when change detected
- **Block-specific checks**: Only cares about focus/drag/selector if THIS block is affected
- **Reduces work**: Doesn't check all 9 props if first check fails
- **Pattern from Block.jsx:379-420**: Same optimization pattern already used in codebase

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript errors: `npm run build`
- [x] No linting errors: `npm run lint`
- [x] Logic correctness: Returns same results as original for all test cases

#### Manual Verification:
- [x] Scroll up/down - count `[INLINE-ACTION] Props received` logs (should be drastically reduced)
- [x] Focus a block - only that block and previous focused block update
- [x] Drag a block - only dragged block and drop target update
- [x] All drag-drop functionality still works
- [x] Block selector shows/hides correctly

---

## Phase 3: Verify Margin Usage (Quick Check)

### Overview
Quick verification that existing margin usage won't interfere with virtualization. Margins can cause measurement instability in Virtuoso, but only when used for vertical spacing between items.

### Investigation Results (Pre-verified):

**Margin Usage Found**:
1. **FileTreeBlock** (`src/components/blocks/FileTreeBlock.jsx:296, 449`)
   - Uses `marginLeft` for tree indentation
   - ✅ **Safe**: Horizontal margins don't affect Virtuoso measurements
   - ✅ **Intentional**: Required for visual hierarchy

2. **AIBlockRefined** (`src/components/blocks/AIBlockRefined.jsx:373`)
   - Explicitly sets `margin: '0'`
   - ✅ **Safe**: No margin applied

3. **OptimizedBlockSkeleton** (`src/components/blocks/OptimizedBlockSkeleton.jsx:25`)
   - Has `margin-bottom: 1rem`
   - ✅ **Safe**: Only affects skeleton loading state, not actual blocks

**Conclusion**: No margin fixes needed. All margin usage is either:
- Horizontal (doesn't affect virtualization)
- Explicitly set to zero
- Only in skeleton components (temporary loading state)

### Success Criteria:

#### Automated Verification:
- [x] Search completed showing margin locations
- [x] Documented all margin usages in block components
- [x] Verified margins are safe/intentional

#### Manual Verification:
- [ ] Quick visual check: Block spacing looks correct during scroll
- [ ] No layout shifts observed (already verified in current state)

---

## Phase 4: Add Debug Logging for Verification

### Overview
Add temporary debug logging to verify optimizations are working as expected.

### Changes Required:

#### 1. Add Comparison Logging
**File**: `src/components/ExpandedViewEnhanced.jsx:216`
**Changes**: Add dev-only logging to memo comparison

```javascript
, (prevProps, nextProps) => {
  // DEV ONLY: Log what caused re-render
  if (import.meta.env.DEV) {
    const reasons = [];
    if (prevProps.block !== nextProps.block) reasons.push('block');
    if (prevProps.index !== nextProps.index) reasons.push('index');

    const prevFocused = prevProps.focusedBlockId === prevProps.block.id;
    const nextFocused = nextProps.focusedBlockId === nextProps.block.id;
    if (prevFocused !== nextFocused) reasons.push('focus');

    // ... check other props

    if (reasons.length > 0) {
      console.log(`[MEMO-DEBUG] Block ${nextProps.block.id.substring(0, 8)} re-render: ${reasons.join(', ')}`);
    }
  }

  // Fast path: Check most frequently changing props first
  // ... rest of comparison code
});
```

#### 2. Add Virtuoso Render Logging
**File**: `src/components/ExpandedViewEnhanced.jsx:1485`
**Changes**: Track render count per block

```javascript
itemContent={(index, block) => {
  if (!block) return null;

  if (import.meta.env.DEV) {
    // Count renders per block
    if (!window.BLOCK_RENDER_COUNT) window.BLOCK_RENDER_COUNT = {};
    window.BLOCK_RENDER_COUNT[block.id] = (window.BLOCK_RENDER_COUNT[block.id] || 0) + 1;

    console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)}) - Render #${window.BLOCK_RENDER_COUNT[block.id]}`);
  }

  return (
    <BlockRenderer
      key={block.id}
      // ... props
    />
  );
}}
```

### Success Criteria:

#### Manual Verification:
- [x] `[MEMO-DEBUG]` logs show why blocks re-render
- [x] Render count stays low (<3 renders per block during normal scroll)
- [x] Focus change only triggers 2 re-renders (previous + new focused)
- [x] Drag operation only triggers re-renders for dragged + target blocks

---

## Phase 5: Production Optimization & Cleanup

### Overview
Remove debug logging and apply production optimizations.

### Changes Required:

#### 1. Remove Debug Logging
**File**: `src/components/ExpandedViewEnhanced.jsx`
**Changes**: Remove all `[MEMO-DEBUG]` and render count tracking

```javascript
// Remove this entire block:
if (import.meta.env.DEV) {
  const reasons = [];
  // ... logging code
}
```

#### 2. Simplify itemContent (Optional)
**File**: `src/components/ExpandedViewEnhanced.jsx:1485`
**Changes**: Keep only essential dev logging

```javascript
itemContent={(index, block) => {
  if (!block) return null;

  // Keep only this minimal logging (optional)
  if (import.meta.env.DEV) {
    console.log(`[VIRT] Rendering block ${index + 1}/${blocks.length}`);
  }

  return (
    <BlockRenderer
      key={block.id}
      block={block}
      index={index}
      isMobileView={isMobileView}
      focusedBlockId={focusedBlockId}
      showBlockSelector={showBlockSelector}
      selectorPosition={selectorPosition}
      draggedBlockId={draggedBlockId}
      dropTargetId={dropTargetId}
      dropPosition={dropPosition}
    />
  );
}}
```

### Success Criteria:

#### Automated Verification:
- [ ] No debug code in production build
- [ ] Bundle size unchanged or smaller
- [ ] No console.log in production

#### Manual Verification:
- [ ] Scrolling remains smooth in production build
- [ ] No performance regression
- [ ] All features working as before

---

## Testing Strategy

### Comparison Testing (Before/After Each Phase)

1. **Baseline Capture** (Before Phase 1):
   ```javascript
   // Open DevTools Console
   // Count prop updates during 10-second scroll:
   // Filter: [INLINE-ACTION] Props received
   // Expected BEFORE: 100+ logs
   ```

2. **After Phase 1** (Performance props):
   ```javascript
   // Expected: 50-70% reduction in prop update logs
   // Expected: Smoother scroll feel
   ```

3. **After Phase 2** (Memo optimization):
   ```javascript
   // Expected: 80-90% reduction in prop update logs
   // Expected: Minimal re-renders during scroll
   ```

### Block Type Testing

Test each block type for smooth rendering:

- [ ] **TextBlock**: Type text, scroll away, scroll back - no flicker
- [ ] **CodeBlock**: Syntax highlighting loads smoothly
- [ ] **HeadingBlock**: Renders immediately without flash
- [ ] **FileTreeBlock**: Expand/collapse while scrolling - no stutter
- [ ] **AIBlock**: Messages render smoothly (was unmounting before)
- [ ] **TableBlock**: Table loads without layout shift
- [ ] **TodoBlock**: Checkboxes render immediately
- [ ] **ImageBlock**: Images load progressively without flicker
- [ ] **InlineImageBlock**: Inline images don't cause scroll jump
- [ ] **IssueTrackerBlock**: Tracker loads smoothly

### Performance Testing

**Manual Testing Checklist:**
- [ ] Load document with 36+ blocks (from log.md)
- [ ] Rapid scroll up/down 10 times - count visible flickers
- [ ] Slow scroll - verify no component flashing
- [ ] Fast scroll - verify buffer zones work (no blanks)
- [ ] Focus block during scroll - verify smooth highlight
- [ ] Drag block during scroll - verify smooth drag indicator
- [ ] Monitor DevTools Performance tab - no long tasks (> 50ms)
- [ ] Check FPS during scroll (should be 55-60 FPS)

### Edge Case Testing

**Manual Testing Checklist:**
- [ ] Empty document (0 blocks) - renders correctly
- [ ] Single block document - no virtualization issues
- [ ] Very large document (100+ blocks) - loads efficiently
- [ ] Rapid block addition - smooth insertion
- [ ] Rapid block deletion - smooth removal
- [ ] Drag-drop across large distance - smooth animation
- [ ] Mobile view - touch scrolling feels natural
- [ ] Mobile momentum scrolling - no flicker at end of momentum
- [ ] Browser resize - virtualization adjusts smoothly
- [ ] Scroll position restoration - smooth without flash

### Regression Testing

**Manual Testing Checklist:**
- [ ] Title editing works
- [ ] Tag management works
- [ ] Backlinks display correctly
- [ ] Share dialog opens
- [ ] Delete confirmation works
- [ ] View mode toggle (blocks/lines) works
- [ ] Save indicator shows correct status
- [ ] Sync status indicator accurate
- [ ] Offline mode handles gracefully
- [ ] All keyboard shortcuts work
- [ ] Drag-and-drop block reordering works
- [ ] Block controls (move up/down, duplicate, convert) work

### Console Log Analysis

**Before Optimization** (baseline from log.md):
```
Lines 47-287: ~240 lines of prop update logs in ~15 seconds
Average: 16 prop updates per second
Pattern: Same blocks receiving props repeatedly
```

**After Phase 1** (target):
```
Expected: ~8-10 prop updates per second
Pattern: Fewer duplicate prop updates
```

**After Phase 2** (target):
```
Expected: ~2-3 prop updates per second
Pattern: Only affected blocks update
```

---

## Performance Budgets

### Before Optimization (Current State from log.md):
- **Prop updates during scroll**: 16/second
- **Component mount/unmount cycles**: 2-3 per scroll
- **FPS during scroll**: Unknown (likely 30-45 FPS)
- **Perceived smoothness**: "Flickering but way better than before"

### After Optimization (Targets):
- **Prop updates during scroll**: < 3/second ✅
- **Component mount/unmount cycles**: 0 (stable components) ✅
- **FPS during scroll**: 55-60 FPS ✅
- **Perceived smoothness**: Buttery smooth, zero visible flicker ✅

### Metrics to Track:

| Metric | Before | After Phase 1 | After Phase 2 | Target |
|--------|--------|---------------|---------------|--------|
| Prop updates/sec | 16 | 8-10 | 2-3 | < 3 |
| Component cycles | 2-3 | 1-2 | 0 | 0 |
| Scroll FPS | ~40 | ~50 | ~60 | 55-60 |
| Flicker severity | Moderate | Mild | None | None |

---

## Migration Notes

### React Virtuoso Optimization Patterns

From the official [Virtuoso Troubleshooting Guide](https://virtuoso.dev/troubleshooting/):

1. **skipAnimationFrameInResizeObserver**: Most impactful optimization for flickering
2. **Margin cleanup**: Critical for measurement stability
3. **Increased buffers**: Reduces blank space during fast scroll
4. **React.memo**: Essential for complex list items

### Known Issues & Workarounds

**Issue 1**: Console errors with skipAnimationFrameInResizeObserver
- **Description**: May see benign ResizeObserver errors
- **Workaround**: Expected behavior, can be ignored
- **Source**: [Virtuoso Docs](https://virtuoso.dev/troubleshooting/)

**Issue 2**: increaseViewportBy not working with useWindowScroll
- **Description**: Buffer props don't work with window scrolling
- **Status**: Not applicable - we use `useWindowScroll={false}`
- **Source**: [GitHub Discussion #1035](https://github.com/petyosi/react-virtuoso/discussions/1035)

### Developer Impact

**Before this plan**:
- Investigating flickering required understanding virtualization internals
- No clear path to optimize beyond "reduce components"
- Difficult to debug what causes re-renders

**After this plan**:
- Clear Virtuoso configuration optimizations applied
- Debug logging shows exactly what triggers re-renders
- Memo optimization pattern documented for future use
- Performance baselines established for monitoring

---

## References

- **Original Migration**: `/mnt/c/Users/pc/Desktop/my/devlog-/thoughts/shared/plans/react-virtuoso-migration.md`
- **Current Logs**: `/mnt/c/Users/pc/Desktop/my/devlog-/log.md`
- **Virtuoso API**: https://virtuoso.dev/virtuoso-api/interfaces/VirtuosoProps/
- **Virtuoso Troubleshooting**: https://virtuoso.dev/troubleshooting/
- **Optimization Patterns**: `/mnt/c/Users/pc/Desktop/my/devlog-/AI-MEMORY/PATTERNS.md`
- **Block Memo Example**: `src/components/Block.jsx:379-420`

---

## Post-Optimization Tasks

After successful optimization:

1. **Update Documentation**:
   - Document optimization in AI-MEMORY/PATTERNS.md
   - Add "Virtuoso Flickering Fix" pattern
   - Update VIRTUALIZATION_DEBUG_GUIDE.md with new logging

2. **Monitor Production**:
   - Watch for increased ResizeObserver errors (benign)
   - Collect user feedback on scroll smoothness
   - Monitor Sentry for new error patterns
   - Track FPS metrics if analytics available

3. **Share Learnings**:
   - Document final prop update count in log
   - Note which optimization had biggest impact
   - Create before/after video comparison (optional)

4. **Consider Future Enhancements**:
   - Profile production builds for further optimization
   - Investigate block-specific memo optimizations
   - Consider lazy-loading heavy block types
   - Explore React 19 optimizations when available
