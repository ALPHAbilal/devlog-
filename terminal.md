# Debugging Session: Virtualization Flickering on Block Addition

## 🎯 PHASE 1: PROBLEM DEFINITION & EVIDENCE COLLECTION - COMPLETE

### Issue Description
When clicking the "+" button between blocks or when a new block is added, all visible blocks flicker briefly as they re-render, despite virtualization being implemented.

### Precise Symptoms Documented
- **Observable**: All blocks on screen briefly flicker (unmount/remount visual effect)
- **Trigger 1**: Clicking "+" button between blocks to open AddBlockRow selector
- **Trigger 2**: When a new block is added to the document
- **Expected**: Only the affected area should update, other blocks should remain stable
- **Frequency**: 100% reproducible on both actions
- **Duration**: Short but noticeable flicker (<100ms)

### Environmental Context
- **Browser**: Chrome (from logs)
- **Framework**: React 19 with Virtuoso v4 for virtualization
- **Component**: ExpandedViewEnhanced.jsx
- **Virtualization**: React Virtuoso with customScrollParent
- **Block Count**: 40-42 blocks (from logs)

### Evidence from Console Logs

**Key Discovery from terminal.md logs:**

```
Lines 133-152: When clicking "+" to add table block
[VIRT-DEBUG-0] 📋 Document Loading Strategy
[BLOCKS-MEMO] Blocks array updated: 41 blocks
[BLOCKS-MEMO] Block reference stability: 0/41 blocks same ← SMOKING GUN!
💻 CodeBlock ... rendered
📌 HeadingBlock ... rendered
🌆 ImageBlock ... rendered
📁 FileTreeBlock ... rendered
```

**Pattern repeats when adding AI block (lines 207-226):**

```
[BLOCKS-MEMO] Blocks array updated: 42 blocks
[BLOCKS-MEMO] Block reference stability: 0/42 blocks same ← ALL blocks have NEW references!
💻 CodeBlock ... rendered
📌 HeadingBlock ... rendered
🌆 ImageBlock ... rendered
```

**ROOT CAUSE IDENTIFIED:**
When blocks array updates, ALL block objects get new references (`0/41 blocks same`, `0/42 blocks same`), which breaks React.memo on BlockRenderer and forces every visible block to re-render.

### Component Analysis (from codebase)

**File: src/components/ExpandedViewEnhanced.jsx**

**Lines 95-104**: Blocks memo shows the problem
```javascript
const blocks = useMemo(() => {
  const result = loadedBlocks || [];
  console.log(`[BLOCKS-MEMO] Blocks array updated: ${result.length} blocks`);
  if (prevBlocksRef.current) {
    const sameReferences = result.filter((block, i) => prevBlocksRef.current[i] === block).length;
    console.log(`[BLOCKS-MEMO] Block reference stability: ${sameReferences}/${result.length} blocks same`);
  }
  prevBlocksRef.current = result;
  return result;
}, [loadedBlocks]);
```

**Lines 139-250**: BlockRenderer has sophisticated React.memo
- Already optimized with detailed comparison function
- Checks block reference changes, index, focus, drag state, selector state
- BUT: If block reference changes, memo returns `false` (line 239)
- Memo is useless when ALL blocks get new references

**Lines 694-723**: renderBlockItem callback dependencies
```javascript
const renderBlockItem = useCallback((index, block) => {
  return (
    <BlockRenderer
      key={block.id}
      block={block}
      index={index}
      isMobileView={isMobileView}
      focusedBlockId={focusedBlockId}
      showBlockSelector={showBlockSelector}  ← Changes when "+" clicked
      selectorPosition={selectorPosition}      ← Changes when "+" clicked
      draggedBlockId={draggedBlockId}
      dropTargetId={dropTargetId}
      dropPosition={dropPosition}
    />
  );
}, [blocks.length, isMobileView, focusedBlockId, showBlockSelector, selectorPosition, draggedBlockId, dropTargetId, dropPosition]);
```

**The callback recreates when `showBlockSelector` or `selectorPosition` changes!**

---

## ✅ Phase 1 Complete - Ready for Phase 2

### Summary
1. ✅ Identified trigger: "+" button click and block addition
2. ✅ Found evidence: Console logs show `0/42 blocks same` (100% new references)
3. ✅ Analyzed components: ExpandedViewEnhanced.jsx with Virtuoso implementation
4. ✅ Understood architecture: Virtualized list with React.memo optimization

### Next: Phase 2 - Reproduction & Isolation
Will add targeted logging to determine:
1. Why do ALL block references change?
2. Where does blocks array get recreated?
3. Is it the loader hook or the addBlock function?
4. Can we preserve unchanged block references?

---

## ✅ ROOT CAUSE & SOLUTION

### Root Cause Analysis
1. **Primary Issue**: `renderBlockItem` callback dependencies included `showBlockSelector` and `selectorPosition`
   - When "+" clicked, these values changed
   - Callback recreated, Virtuoso re-rendered all visible blocks

2. **Secondary Issue**: ALL block objects got new references on every update
   - `useOptimizedBlockLoader.updateBlocks()` line 133-136
   - `usePaginatedBlockLoader.updateBlocks()` line 150
   - Both used `.map()` with spread operator, creating NEW objects for ALL blocks
   - Console logs confirmed: `0/42 blocks same` = 100% new references
   - BlockRenderer.memo couldn't skip rendering with different block references

### Solution Implemented

#### Fix 1: Remove selector state from renderBlockItem dependencies
**File**: `src/components/ExpandedViewEnhanced.jsx:697-725`

Removed `showBlockSelector` and `selectorPosition` from dependency array. BlockRenderer.memo still receives these props and handles changes surgically (only affected block re-renders).

#### Fix 2: Preserve block object references in loader hooks
**File**: `src/hooks/useOptimizedBlockLoader.js:130-174`
**File**: `src/hooks/usePaginatedBlockLoader.js:148-182`

Updated `updateBlocks` functions to:
- Compare previous and new blocks by ID
- Check if content, type, metadata, position are unchanged
- Reuse exact same block object reference for unchanged blocks
- Only create new objects for actually modified blocks

**Impact**: When clicking "+", only 1 block (the new one) should have a new reference. All other 41 blocks keep same references, so BlockRenderer.memo skips them.

---

## 🧪 TESTING INSTRUCTIONS

### Pre-Test Setup
1. **Rebuild**: `npm run dev` to load the fixed code
2. **Open DevTools Console** (F12)
3. **Clear console** (Ctrl+L or Cmd+K)
4. **Navigate to a document** with 30+ blocks

### Test 1: Click "+" Button Between Blocks
**Steps**:
1. Clear console
2. Scroll to middle of document (so 8-10 blocks visible)
3. Click the "+" button between ANY two blocks
4. Watch for block render logs

**Expected Output**:
```
[BLOCKS-MEMO] Block reference stability: 40/40 blocks same ← ALL unchanged!
[MEMO-DEBUG] Block XXXXXXXX re-render: selector ← Only the block with selector
```

**PASS Criteria**:
- ✅ Only 1-2 blocks re-render (the one showing AddBlockRow)
- ✅ NO flicker visible on other blocks
- ✅ `Block reference stability: X/X blocks same` (100%)

**FAIL Criteria**:
- ❌ All blocks re-render
- ❌ Visible flicker
- ❌ `0/40 blocks same` or low percentage

### Test 2: Add a New Block
**Steps**:
1. Clear console
2. Click "+" between blocks
3. Select a block type (e.g., "text")
4. Watch for render logs and flicker

**Expected Output**:
```
[BLOCKS-MEMO] Blocks array updated: 41 blocks
[BLOCKS-MEMO] Block reference stability: 40/41 blocks same ← Only new block changed!
[VIRT-DEBUG-1] Rendering block 15/41 ... ← Only new block + adjacent
```

**PASS Criteria**:
- ✅ Block reference stability: `40/41 blocks same` (only +1 is new)
- ✅ Only 2-3 blocks render (new block + possibly adjacent for repositioning)
- ✅ NO flicker on existing blocks

**FAIL Criteria**:
- ❌ `0/41 blocks same` (all new references)
- ❌ All blocks flicker
- ❌ More than 5 blocks render

### Test 3: Multiple Block Additions
**Steps**:
1. Clear console
2. Add 3 different blocks quickly (table, code, heading)
3. Check console logs for each addition

**Expected Output** (for each addition):
```
[BLOCKS-MEMO] Block reference stability: N/(N+1) blocks same
```
Where N increases each time (40/41, 41/42, 42/43).

**PASS Criteria**:
- ✅ Each addition shows high reference stability (>95%)
- ✅ No visible flicker during rapid additions
- ✅ Only newly added blocks render

### Test 4: Edit Existing Block
**Steps**:
1. Clear console
2. Click in a TextBlock and type some text
3. Wait for auto-save (5 seconds)
4. Check console logs

**Expected Output**:
```
[BLOCKS-MEMO] Block reference stability: 40/41 blocks same ← Only edited block changed
[VIRT-DEBUG-1] Rendering block 5/41 ... ← Only edited block
```

**PASS Criteria**:
- ✅ Only 1 block changes reference (the edited one)
- ✅ Only edited block re-renders
- ✅ NO flicker on other blocks

---

## 📝 PASTE YOUR TEST RESULTS BELOW

### Test 1 Result (Click "+" Button):
```
[Paste console output here]
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**:

---

### Test 2 Result (Add New Block):
```
[Paste console output here]
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**:

---

### Test 3 Result (Multiple Additions):
```
[Paste console output here]
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**:

---

### Test 4 Result (Edit Block):
```
[Paste console output here]
```

**Status**: [ ] PASS / [ ] FAIL
**Notes**:

---

## Overall Test Result
- [ ] ALL TESTS PASS - Flickering issue resolved ✅
- [ ] SOME TESTS FAIL - Further investigation needed 🔍
- [ ] ALL TESTS FAIL - Solution needs revision ❌
