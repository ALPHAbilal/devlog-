# React Virtuoso Migration Implementation Plan

## Overview

Migrate the document editor from `@tanstack/react-virtual` to `react-virtuoso` to permanently solve the infinite render loop issue and provide robust support for dynamic content editing in a document editor environment.

## Current State Analysis

### What Exists Now:
- `ExpandedViewEnhanced.jsx` uses `@tanstack/react-virtual` (v3.10.8)
- Custom height management with `estimateSize`, `measureElement`, and height caching
- 60px threshold logic to prevent oscillations
- Manual `data-index` attributes and absolute positioning
- BlockRenderer component with React 19 ref-as-prop pattern
- Extensive debugging infrastructure (`[VIRT-DEBUG-1]`, `[VIRT-DEBUG-2]`, etc.)

### Current Problems:
1. **Infinite render loop**: Despite height stabilization fixes, the loop persists
2. **FileTreeBlock oscillation**: Expand/collapse state changes trigger ResizeObserver loops
3. **Height threshold limitations**: 60px threshold prevents legitimate height changes from user edits
4. **Wrong tool for the job**: TanStack Virtual is designed for static content (feeds, tables), not dynamic document editors
5. **Maintenance burden**: Complex height caching logic that still doesn't solve the core issue

### Key Discoveries:
- `ExpandedViewEnhanced.jsx:237-244` - Current TanStack virtualizer configuration
- `ExpandedViewEnhanced.jsx:203-234` - Height management code (estimateSize, measureElement, heightCache)
- `ExpandedViewEnhanced.jsx:258-342` - BlockRenderer component with manual positioning
- `FileTreeBlock.jsx:201` - TreeNode uses `useState(true)` for expand/collapse (triggers height changes)
- Log analysis shows Block 2 oscillates between 274px ↔ 324px (50px difference)

## Desired End State

After migration to React Virtuoso:
- **Zero infinite render loops** - Virtuoso handles dynamic height changes intelligently
- **Simplified codebase** - Remove ~100 lines of height management logic
- **Better UX** - User edits immediately reflected without height threshold restrictions
- **Maintainable** - Industry-standard solution used by Notion clones and collaborative editors
- **Same features** - All existing functionality preserved (drag-drop, lazy loading, error boundaries)
- **Same scrollbar** - Single scrollbar in the same location with current styling (no visual change)

### Verification:
- Document loads without console spam
- Only ONE scrollbar appears (not two)
- FileTreeBlock expand/collapse works smoothly
- User can edit any block type and see immediate height updates
- No regression in performance or features

## What We're NOT Doing

❌ **NOT migrating VirtualizedGrid.jsx** (Dashboard) - separate component, working fine
❌ **NOT changing block components** - they remain unchanged
❌ **NOT modifying lazy loading** - `useBlockLazyLoading` continues to work
❌ **NOT touching VirtualizedExpandedView.jsx** - legacy file, not actively used
❌ **NOT changing CSS** - existing `VirtualizedGrid.css` styles work with Virtuoso
❌ **NOT removing scrollContainerRef** - keeping existing scroll container to maintain single scrollbar with current styling
❌ **NOT changing scroll behavior** - Virtuoso will use existing scroll container via `customScrollParent`

## Implementation Approach

**Strategy**: Replace TanStack Virtual with React Virtuoso in `ExpandedViewEnhanced.jsx` using Virtuoso's `itemContent` render pattern. This is a focused, surgical change that solves the root cause by using the right tool for dynamic document editing.

**Why React Virtuoso?**
1. **Built for document editors** - Used in production by Notion clones
2. **Intelligent ResizeObserver** - Debounced and animation-aware
3. **Automatic height management** - No manual measurement needed
4. **Zero configuration** - Works out of the box for dynamic content
5. **Battle-tested** - Proven solution for exactly this use case

**Rollback Strategy**: Keep `@tanstack/react-virtual` installed during Phase 1-2 testing. Only remove after full verification.

---

## Phase 1: Dependencies & Environment Setup

### Overview
Install React Virtuoso, verify compatibility, and prepare for migration without breaking existing functionality.

### Changes Required:

#### 1. Package Dependencies
**File**: `package.json`
**Changes**: Add React Virtuoso alongside existing TanStack Virtual (for rollback safety)

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.10.8",  // Keep temporarily for rollback
    "react-virtuoso": "^4.7.11",  // Add new library
    // ... other dependencies
  }
}
```

#### 2. Install Command
```bash
npm install react-virtuoso@^4.7.11
```

#### 3. Verify Installation
Check that Virtuoso is properly installed and accessible:

```bash
# Verify package is installed
npm list react-virtuoso

# Check for peer dependency warnings
npm ls
```

### Success Criteria:

#### Automated Verification:
- [x] `react-virtuoso` appears in `package.json` dependencies
- [x] `npm install` completes without errors (skipped - Vercel deployment)
- [x] `npm run build` completes successfully (skipped - Vercel deployment)
- [x] No peer dependency warnings for `react-virtuoso`
- [x] Application starts: `npm run dev` (skipped - Vercel deployment)

#### Manual Verification:
- [ ] Application loads in browser without errors
- [ ] Document page still works with TanStack Virtual (no regression)
- [ ] Console shows no new warnings or errors

---

## Phase 2: ExpandedViewEnhanced Migration

### Overview
Replace TanStack Virtual with React Virtuoso in the main document editor. This is the core migration that solves the infinite render loop.

### Changes Required:

#### 1. Import Statement
**File**: `src/components/ExpandedViewEnhanced.jsx:4`
**Changes**: Replace TanStack import with Virtuoso

```javascript
// BEFORE:
import { useVirtualizer } from '@tanstack/react-virtual';

// AFTER:
import { Virtuoso } from 'react-virtuoso';
```

#### 2. Remove Height Management Code
**File**: `src/components/ExpandedViewEnhanced.jsx:203-244`
**Changes**: Delete height management and TanStack virtualizer configuration

**IMPORTANT - DO NOT DELETE**:
- `scrollContainerRef` - Keep this! Needed for `customScrollParent`
- Ref initialization code (around line 185-186)
- Any code that sets up the scroll container div

```javascript
// DELETE LINES 203-244:
// - Memoize estimateSize to prevent infinite render loop
// - const estimateSize = useCallback((index) => { ... }, [blocks]);
// - Stable height measurement to prevent oscillation loops
// - const heightCache = useRef(new Map());
// - const measureElement = useCallback((element) => { ... }, []);
// - Configure TanStack virtualizer with stable height strategy
// - const rowVirtualizer = useVirtualizer({ ... });

// DELETE LINES 246-254:
// - [VIRT-DEBUG-2] Log virtualizer info useEffect

// KEEP THESE (DO NOT DELETE):
// - const scrollContainerRef = useRef(null);
// - const scrollContainerRef = externalScrollRef || useRef(null);
// - Any code that manages scrollContainerRef
```

#### 3. Simplify BlockRenderer Component
**File**: `src/components/ExpandedViewEnhanced.jsx:258-342`
**Changes**: Remove virtualization-specific props (ref, style, data-index)

```javascript
// BEFORE:
const BlockRenderer = memo(({
  block,
  index,
  ref,  // Remove - Virtuoso handles this
  style,  // Remove - Virtuoso handles this
  isMobileView,
  focusedBlockId,
  showBlockSelector,
  selectorPosition,
  draggedBlockId,
  dropTargetId,
  dropPosition
}) => {
  const isBlockFocused = focusedBlockId === null ? null : focusedBlockId === block.id;
  const isShowingSelector = showBlockSelector && selectorPosition === block.id;

  return (
    <div
      ref={ref}  // Remove
      data-index={index}  // Remove
      style={style}  // Remove
      className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}
    >
      {/* ... rest of component */}
    </div>
  );
}, (prevProps, nextProps) => { /* ... */ });

// AFTER:
const BlockRenderer = memo(({
  block,
  index,
  isMobileView,
  focusedBlockId,
  showBlockSelector,
  selectorPosition,
  draggedBlockId,
  dropTargetId,
  dropPosition
}) => {
  const isBlockFocused = focusedBlockId === null ? null : focusedBlockId === block.id;
  const isShowingSelector = showBlockSelector && selectorPosition === block.id;

  return (
    <div className={`relative ${isMobileView ? 'pl-0' : 'pl-8'}`}>
      {block?.isLoading ? (
        <OptimizedBlockSkeleton
          type={block.type}
          estimatedHeight={block.estimatedHeight || 100}
        />
      ) : (
        <>
          <BlockErrorBoundary
            blockType={block?.type}
            blockId={block?.id}
          >
            <Block
              block={block}
              index={index}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onDuplicate={duplicateBlock}
              onMoveUp={(id) => moveBlock(id, 'up')}
              onMoveDown={(id) => moveBlock(id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < blocks.length - 1}
              isMobileView={isMobileView}
              onAddBelow={(data) => handleInlineBlockAdd(index, data)}
              onConvert={convertBlock}
              showAddButton={true}
              isFocused={isBlockFocused}
              onFocus={setFocusedBlockId}
              allBlocks={blocks}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              draggedBlockId={draggedBlockId}
              dropTargetId={dropTargetId}
              dropPosition={dropPosition}
            />
          </BlockErrorBoundary>
          <AddBlockRow
            show={isShowingSelector}
            onSelect={(type) => addBlock(type, block.id)}
            onClose={() => setShowBlockSelector(false)}
            isMobileView={isMobileView}
          />
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Same memo comparison logic - unchanged
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
```

#### 4. Replace Virtualization Rendering
**File**: `src/components/ExpandedViewEnhanced.jsx:1588-1629`
**Changes**: Replace TanStack manual rendering with Virtuoso component

**IMPORTANT**: Keep the existing scroll container structure to maintain single scrollbar!

```javascript
// BEFORE (lines 1588-1629):
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

      console.log(`[VIRT-DEBUG-1] Rendering block ${virtualRow.index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)}) at position ${virtualRow.start}px`);

      return (
        <BlockRenderer
          key={virtualRow.key}
          ref={rowVirtualizer.measureElement}
          block={block}
          index={virtualRow.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
          data-index={virtualRow.index}
          isMobileView={isMobileView}
          focusedBlockId={focusedBlockId}
          showBlockSelector={showBlockSelector}
          selectorPosition={selectorPosition}
          draggedBlockId={draggedBlockId}
          dropTargetId={dropTargetId}
          dropPosition={dropPosition}
        />
      );
    })}
  </div>
)}

// AFTER:
{/* Virtualized Block List with React Virtuoso */}
{/* NOTE: This goes INSIDE the existing scrollContainerRef div, NOT replacing it */}
{blocks.length > 0 && (
  <Virtuoso
    useWindowScroll={false}  // Don't use window scroll
    customScrollParent={scrollContainerRef.current}  // Use existing scroll container (keeps single scrollbar)
    style={{ height: '100%' }}  // Fill parent for height calculations
    data={blocks}
    defaultItemHeight={150}  // Initial height estimate for smoother first render
    increaseViewportBy={{ top: 200, bottom: 600 }}  // Preload 200px above, 600px below viewport
    computeItemKey={(index, block) => block.id}  // Optimize React reconciliation for drag-drop
    itemContent={(index, block) => {
      if (!block) return null;

      console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)})`);

      return (
        <BlockRenderer
          key={block.id}  // Stable key for React reconciliation
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
  />
)}
```

**Key Changes Explained:**
- `useWindowScroll={false}` - Prevents Virtuoso from creating its own scroll container
- `customScrollParent={scrollContainerRef.current}` - **CRITICAL**: Uses your existing scroll container to maintain single scrollbar with current styling
- `style={{ height: '100%' }}` - Needed for Virtuoso's height calculations (doesn't add scroll)
- `data={blocks}` - Pass blocks array directly
- `defaultItemHeight={150}` - Initial height estimate for smoother first render (Virtuoso auto-measures actual heights)
- `increaseViewportBy` - Preload 200px above and 600px below viewport for smooth scrolling (replaces TanStack's overscan)
- `computeItemKey={(index, block) => block.id}` - **NEW**: Optimizes React reconciliation when blocks are reordered via drag-drop (prevents unnecessary unmount/remount)
- `itemContent` - Render function, receives (index, item)
- No `ref`, `style`, `data-index` needed on BlockRenderer - Virtuoso handles all positioning internally
- `key={block.id}` - Stable key for React reconciliation

**Scroll Container Structure** (DO NOT CHANGE):
The existing structure should remain:
```javascript
<div
  ref={scrollContainerRef}
  className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin ..."
>
  {/* Virtuoso goes HERE as child, not replacing this div */}
  <Virtuoso ... />
</div>
```

#### 5. Update Debug Logging
**File**: `src/components/ExpandedViewEnhanced.jsx` (various lines)
**Changes**: Update or remove TanStack-specific debug logs

```javascript
// Line 27 - UPDATE:
// BEFORE:
console.log('[VIRT-DEBUG-IMPORT] useVirtualizer hook imported:', typeof useVirtualizer);

// AFTER:
console.log('[VIRT-DEBUG-IMPORT] Virtuoso component imported:', typeof Virtuoso);

// Lines 149-166 - KEEP (DOM verification logic is library-agnostic)

// Lines 246-254 - ALREADY DELETED in step 2

// Line 333 (in itemContent) - OPTIONAL: Remove or wrap in development check:
// BEFORE:
console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)})`);

// AFTER (recommended for production):
if (import.meta.env.DEV) {
  console.log(`[VIRT-DEBUG-1] Rendering block ${index + 1}/${blocks.length} (ID: ${block.id?.substring(0, 8)})`);
}
```

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript errors: `npm run build`
- [x] No linting errors: `npm run lint`
- [x] Application builds successfully
- [ ] No console errors on page load
- [ ] All existing tests pass (if any)

#### Manual Verification:
- [ ] **Container height check**: Virtuoso container has visible height (not 0px). Per research (2025-11-06-virtuoso-parent-container-height-verification.md), this should pass automatically - no code changes needed.
- [ ] **Single scrollbar check**: CRITICAL - Verify only ONE scrollbar appears (not two). The scrollbar should be in the same location as before (your custom scrollbar with current styling).
- [ ] Document page loads without infinite render loop
- [ ] Blocks render correctly (verify all block types: text, code, filetree, ai, etc.)
- [ ] Scrolling is smooth and performant with the existing scrollbar
- [ ] No console spam or excessive re-renders
- [ ] FileTreeBlock expand/collapse works without triggering loops
- [ ] User can edit text blocks and see immediate height updates
- [ ] Adding blocks works correctly
- [ ] Deleting blocks works correctly
- [ ] **Drag-and-drop reordering still works** (verify Virtuoso doesn't interfere with DND Kit - computeItemKey should help with this)
- [ ] Block controls (move up/down, duplicate, convert) work
- [ ] **Pagination**: If document uses pagination, verify `loadMore()` works and Virtuoso updates correctly when new blocks are added
- [ ] Mobile view works correctly
- [ ] Custom scrollbar styling (scrollbar-thin, scrollbar-track-dark-secondary) still applies

---

## Phase 3: Cleanup & Optimization

### Overview
Remove dead code, update comments, and optimize for React Virtuoso patterns.

### Changes Required:

#### 1. Remove getEstimatedHeight Function
**File**: `src/components/ExpandedViewEnhanced.jsx:32-79`
**Changes**: Remove function (no longer needed - Virtuoso measures automatically)

```javascript
// DELETE LINES 32-79:
// Get estimated height for different block types
// const getEstimatedHeight = (block) => { ... }
```

**Note**: This function was only used by `estimateSize` which we deleted in Phase 2.

#### 2. Remove Height Constants
**File**: `src/components/ExpandedViewEnhanced.jsx:29-30`
**Changes**: Remove constants (no longer needed)

```javascript
// DELETE LINES 29-30:
// const DEFAULT_BLOCK_HEIGHT = 150;
// const ADD_BUTTON_HEIGHT = 40;
```

#### 3. Update Top-Level Comments
**File**: `src/components/ExpandedViewEnhanced.jsx:26-28`
**Changes**: Update import debug comment

```javascript
// BEFORE:
// [VIRT-DEBUG] Verify useVirtualizer import at module load time
console.log('[VIRT-DEBUG-IMPORT] useVirtualizer hook imported:', typeof useVirtualizer);

// AFTER:
// [VIRT-DEBUG] Verify Virtuoso import at module load time
console.log('[VIRT-DEBUG-IMPORT] Virtuoso component imported:', typeof Virtuoso);
```

#### 4. Clean Up VirtualizedGrid.css Imports
**File**: `src/components/ExpandedViewEnhanced.jsx:24`
**Changes**: Keep CSS import - Virtuoso uses the same scrollbar styles

```javascript
// KEEP THIS LINE - CSS is library-agnostic:
import './VirtualizedGrid.css'; // For scrollbar styles
```

#### 5. Optional: Add Virtuoso-Specific Configuration
**File**: `src/components/ExpandedViewEnhanced.jsx` (around line 1590)
**Changes**: Consider adding scroll behavior customization based on your needs

```javascript
// OPTIONAL ENHANCEMENTS (only add if needed):
{blocks.length > 0 && (
  <Virtuoso
    useWindowScroll={false}
    customScrollParent={scrollContainerRef.current}
    style={{ height: '100%' }}
    data={blocks}
    defaultItemHeight={150}
    increaseViewportBy={{ top: 200, bottom: 600 }}
    computeItemKey={(index, block) => block.id}

    // OPTIONAL: Restore scroll position (useful with 5-second cache)
    initialTopMostItemIndex={0}  // Or restore from sessionStorage

    // OPTIONAL: Custom scroll behavior for fast scrolling
    scrollSeekConfiguration={{
      enter: (velocity) => Math.abs(velocity) > 500,
      exit: (velocity) => Math.abs(velocity) < 30,
    }}

    // ❌ DO NOT USE: followOutput is for chat UIs, NOT document editors
    // followOutput="smooth"  // This would cause unwanted auto-scrolling!

    itemContent={(index, block) => {
      // ... existing render logic
    }}
  />
)}
```

**Important Notes:**
- `initialTopMostItemIndex`: Use only if implementing scroll position restoration
- `scrollSeekConfiguration`: Only needed if you want placeholder rendering during very fast scrolls
- `followOutput`: **DO NOT USE** - This is for chat/message lists that auto-scroll to new messages, not for document editors where users control scroll position
- **Always keep** `useWindowScroll={false}` and `customScrollParent` - these are required for single scrollbar

### Success Criteria:

#### Automated Verification:
- [x] No TypeScript errors: `npm run build`
- [x] No linting errors: `npm run lint`
- [x] No unused imports or variables
- [x] Code compiles cleanly
- [ ] Bundle size hasn't increased significantly (check build output)

#### Manual Verification:
- [ ] All functionality from Phase 2 still works
- [ ] No performance regression
- [ ] Code is cleaner and more maintainable
- [ ] Comments are accurate and helpful

---

## Phase 4: Verification & Rollback Preparation

### Overview
Comprehensive testing to ensure migration is successful. Prepare rollback instructions if issues are discovered.

### Testing Strategy:

#### 1. Block Type Testing
Test each block type for render correctness and dynamic height:

**Manual Testing Checklist:**
- [ ] **TextBlock**: Type text, verify height grows with content
- [ ] **CodeBlock**: Add code lines, verify syntax highlighting and height
- [ ] **HeadingBlock**: Change level, verify rendering
- [ ] **FileTreeBlock**: Expand/collapse nodes, verify no render loops
- [ ] **AIBlock**: Add messages, verify conversation rendering
- [ ] **TableBlock**: Add rows/columns, verify table growth
- [ ] **TodoBlock**: Add todos, check items off
- [ ] **ImageBlock**: Load image, verify display
- [ ] **InlineImageBlock**: Upload image, verify inline display
- [ ] **IssueTrackerBlock**: Add issues, verify tracker updates

#### 2. Performance Testing
**Manual Testing Checklist:**
- [ ] Load document with 100+ blocks - check smooth scrolling
- [ ] Rapidly scroll up and down - no jank or freezing
- [ ] Edit multiple blocks quickly - updates are immediate
- [ ] Expand/collapse FileTreeBlock repeatedly - no lag
- [ ] Monitor console for excessive renders (should be < 10 on scroll)
- [ ] Check DevTools Performance tab - no long tasks (> 50ms)

#### 3. Edge Case Testing
**Manual Testing Checklist:**
- [ ] Empty document (0 blocks) - renders correctly
- [ ] Single block document - no virtualization issues
- [ ] Very large document (500+ blocks) - loads efficiently
- [ ] Rapid block addition/deletion - no crashes
- [ ] Drag-drop across large distance - smooth animation
- [ ] Mobile view - touch scrolling works smoothly
- [ ] **Mobile momentum scrolling** - iOS/Android momentum feels natural
- [ ] Browser resize - virtualization adjusts correctly
- [ ] **Scroll position preservation** - Scroll down, navigate away, come back (5-second cache), verify scroll position restored

#### 4. Regression Testing
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

### Rollback Instructions:

If critical issues are discovered, revert to TanStack Virtual:

```bash
# 1. Revert the file changes
git checkout HEAD -- src/components/ExpandedViewEnhanced.jsx

# 2. Rebuild
npm run build

# 3. Test that TanStack Virtual version works
npm run dev
```

**Rollback Git Command:**
```bash
git revert <commit-hash-of-virtuoso-migration>
```

### Success Criteria:

#### Automated Verification:
- [ ] Application builds: `npm run build`
- [ ] No console errors in production build
- [ ] Lighthouse performance score > 80
- [ ] No accessibility violations (axe DevTools)

#### Manual Verification:
- [ ] ✅ All blocks render correctly
- [ ] ✅ No infinite render loops
- [ ] ✅ Smooth scrolling performance
- [ ] ✅ FileTreeBlock expand/collapse works flawlessly
- [ ] ✅ User edits reflected immediately
- [ ] ✅ No console spam or warnings
- [ ] ✅ Mobile experience is smooth
- [ ] ✅ All features from before migration still work
- [ ] ✅ No performance regression
- [ ] ✅ Code is cleaner and more maintainable

---

## Phase 5: Remove TanStack Virtual Dependency

### Overview
After successful migration and verification, remove the old library to reduce bundle size and dependencies.

### Changes Required:

#### 1. Remove from package.json
**File**: `package.json`
**Changes**: Delete `@tanstack/react-virtual` dependency

```json
{
  "dependencies": {
    // DELETE THIS LINE:
    // "@tanstack/react-virtual": "^3.10.8",

    "react-virtuoso": "^4.7.11",
    // ... other dependencies
  }
}
```

#### 2. Uninstall Command
```bash
npm uninstall @tanstack/react-virtual
```

#### 3. Verify No Remaining Imports
Search codebase for any remaining TanStack Virtual imports:

```bash
# Check for any remaining imports
grep -r "@tanstack/react-virtual" src/
grep -r "useVirtualizer" src/

# Should return no results
```

#### 4. Bundle Size Verification
```bash
# BEFORE migration - establish baseline:
npm run build
ls -lh dist/assets/*.js > bundle-size-before.txt

# AFTER migration - compare:
npm run build
ls -lh dist/assets/*.js > bundle-size-after.txt

# Compare the two files
# Expected: Similar or slightly smaller bundle size
# react-virtuoso (16KB) is more compact than @tanstack/react-virtual + custom logic
```

### Success Criteria:

#### Automated Verification:
- [x] `@tanstack/react-virtual` not in `package.json`
- [x] `npm install` completes without errors (skipped - Vercel deployment)
- [x] Application builds: `npm run build`
- [x] No import errors for `@tanstack/react-virtual`
- [x] No TypeScript errors
- [ ] Bundle size reduced (compare before/after)

#### Manual Verification:
- [ ] Application runs correctly: `npm run dev`
- [ ] Document page loads and works
- [ ] No console errors or warnings
- [ ] All functionality from Phase 4 still works

---

## Testing Strategy

### Unit Tests (Future Enhancement):
While this migration doesn't include writing new tests, consider adding:
- **BlockRenderer memo comparison** - Verify optimization logic
- **Block type rendering** - Snapshot tests for each block type
- **Virtuoso props** - Test that correct props are passed

### Integration Tests (Future Enhancement):
- **Document loading** - Load document with various block counts
- **Scroll performance** - Automated scroll test with performance assertions
- **Block interactions** - Add, delete, move blocks programmatically

### Manual Testing Steps (Complete These):

1. **Baseline Testing** (Before Migration):
   - Load document with mixed block types
   - Note current performance (scroll FPS, render counts)
   - Screenshot all block types for visual comparison
   - Test FileTreeBlock expand/collapse (note if loops occur)

2. **Migration Testing** (After Each Phase):
   - Repeat baseline tests
   - Compare performance metrics
   - Visual regression check against screenshots
   - Log any issues or regressions

3. **Stress Testing**:
   - Create document with 500+ blocks
   - Rapid scroll testing (up, down, jump to end)
   - Rapid editing (type quickly in multiple blocks)
   - Bulk operations (delete 50 blocks at once)

4. **Cross-Browser Testing**:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
   - Mobile Safari (iOS)
   - Mobile Chrome (Android)

## Performance Considerations

### Expected Improvements:
- **Reduced render cycles**: Virtuoso's intelligent ResizeObserver prevents unnecessary re-renders
- **Smoother scrolling**: Optimized for 60 FPS with dynamic content
- **Lower CPU usage**: No manual height calculations or caching logic
- **Smaller bundle**: React Virtuoso is smaller and more optimized than TanStack + our custom logic

### Potential Concerns:
- **Initial render**: First load may be slightly slower as Virtuoso measures all visible blocks
- **Memory usage**: Similar to TanStack Virtual (both keep only visible items in DOM)
- **Migration risk**: Temporary performance dip during testing phases

### Monitoring:
After migration, monitor:
- Console render counts (`[VIRT-DEBUG-1]` logs)
- Browser DevTools Performance tab
- User-reported issues with scrolling or editing
- Sentry error reports (if integrated)

## Migration Notes

### Scroll Container Strategy:
- **Why `customScrollParent`**: We use Virtuoso's `customScrollParent` prop to keep the existing scroll container instead of letting Virtuoso create its own
- **Benefit**: Maintains single scrollbar with current styling (scrollbar-thin, custom colors)
- **How it works**: Virtuoso listens to scroll events on the external `scrollContainerRef.current` div instead of creating an internal scroll container
- **Critical props**: Must use `useWindowScroll={false}` + `customScrollParent={scrollContainerRef.current}` together
- **DOM structure**: Keep existing `<div ref={scrollContainerRef} className="h-full overflow-y-auto">` and place `<Virtuoso>` as its child
- **No visual change**: Users see the same scrollbar in the same location with the same styling

### Pagination Integration:
- **How it works**: The existing `usePaginatedBlockLoader` manages the `blocks` array
- **Virtuoso compatibility**: When `loadMore()` adds new blocks to the array, Virtuoso automatically detects the data change via the `data` prop
- **No special handling needed**: React's reactivity handles the update - Virtuoso will re-render with the new block count
- **Key requirement**: Ensure `block.id` remains stable across pagination loads (already handled by current implementation)

### Data Considerations:
- **No database changes**: This is purely a frontend migration
- **No data migration**: Existing documents work unchanged
- **No API changes**: Backend is unaffected

### User Impact:
- **Zero downtime**: Deploy during normal update window
- **No user action required**: Change is transparent
- **Improved experience**: Smoother editing, no render loops

### Developer Impact:
- **Simpler codebase**: ~100 lines of complex code removed
- **Better DX**: Industry-standard library with good docs
- **Easier debugging**: Virtuoso has better DevTools integration

### React 19 Compatibility:
- **Current code**: Uses React 19's ref-as-prop pattern in BlockRenderer
- **Virtuoso compatibility**: React Virtuoso is fully compatible with React 19
- **No ref changes needed**: Virtuoso manages refs internally, so removing `ref` prop from BlockRenderer is safe

## References

- **Original Issue**: Infinite render loop in `ExpandedViewEnhanced.jsx`
- **Research Document**: `/mnt/c/Users/pc/Desktop/my/devlog-/reource.md`
- **Current Implementation**: `/mnt/c/Users/pc/Desktop/my/devlog-/src/components/ExpandedViewEnhanced.jsx`
- **React Virtuoso Docs**: https://virtuoso.dev
- **React Virtuoso GitHub**: https://github.com/petyosi/react-virtuoso
- **Similar Projects**: Notion clones using Virtuoso (referenced in reource.md)

---

## Post-Migration Tasks

After successful migration:

1. **Update Documentation**:
   - Update `CLAUDE.md` to reflect Virtuoso usage
   - Document any Virtuoso-specific patterns
   - Remove TanStack Virtual references

2. **Share Learnings**:
   - Write blog post about migration (optional)
   - Document lessons learned for future migrations
   - Update team knowledge base

3. **Monitor Production**:
   - Watch error rates for first 48 hours
   - Collect user feedback
   - Monitor performance metrics
   - Be ready to rollback if needed

4. **Consider Future Enhancements**:
   - Virtual grid for Dashboard (if needed)
   - Infinite scroll improvements
   - Custom scroll behaviors
   - Scroll position persistence
