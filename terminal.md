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
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 11 blocks
 [BLOCKS-MEMO] Block reference stability: 10/11 blocks same
 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:43:30.717Z
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:43:30.719Z
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:30.721Z
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 🎯 IssueTrackerBlock initialization: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 625a6b17
 [BLOCK-UPDATE] Changes detected, updating block: 625a6b17
 [BLOCK-REF-STABILITY] 10/11 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 11 blocks
 [BLOCKS-MEMO] Block reference stability: 10/11 blocks same
 [BLOCK-MEMO] headingBlock 625a6b17 - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 4
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 ExpandedView: Calling Smart Sync for new block: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 12 blocks
 [BLOCKS-MEMO] Block reference stability: 11/12 blocks same
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:43:35.165Z
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:35.167Z
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 5
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:43:35.257Z
 🎯 IssueTrackerBlock initialization: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 SmartSync: Syncing 5 changes
 SmartSync: Changes being sent: Array(5)
 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 SmartSync: RPC response: Object
 [SYNC-DEBUG] Full RPC Response: {
  "total": 5,
  "errors": [],
  "success": true,
  "processed": 5,
  "timestamp": 1762512221191.536
}
 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
 [SYNC-DEBUG] Change 1: Object
 [SYNC-DEBUG] Change 2: Object
 [SYNC-DEBUG] Change 3: Object
 [SYNC-DEBUG] Change 4: Object
 [SYNC-DEBUG] Change 5: Object
 [SYNC-DEBUG] === END CRITICAL FIELDS ===
 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
 [SYNC-DEBUG] Changes that were sent: Array(5)
 SmartSync: Successfully synced 5 changes
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 ExpandedView: Calling Smart Sync for new block: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:40.861Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:43:40.863Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:40.886Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:43:40.889Z
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:43:40.982Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 SmartSync: Syncing 1 changes
 SmartSync: Changes being sent: Array(1)
 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 SmartSync: RPC response: Object
 [SYNC-DEBUG] Full RPC Response: {
  "total": 1,
  "errors": [],
  "success": true,
  "processed": 1,
  "timestamp": 1762512226922.853
}
 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
 [SYNC-DEBUG] Change 1: Object
 [SYNC-DEBUG] === END CRITICAL FIELDS ===
 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
 [SYNC-DEBUG] Changes that were sent: Array(1)
 SmartSync: Successfully synced 1 changes
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:48.489Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:43:48.492Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:43:48.586Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:43:59.483Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:43:59.484Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:43:59.576Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.671Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.671Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.687Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.687Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.703Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.703Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.719Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.719Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.781Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.781Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:00.793Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:00.793Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:00.878Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.629Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.629Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.644Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.644Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.657Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.658Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.673Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.674Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.746Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.746Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:01.758Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:01.759Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:01.842Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.438Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.438Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.453Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.454Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.469Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.469Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.485Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.485Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.548Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.549Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:02.562Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:02.563Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:02.641Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.350Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.350Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.370Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.370Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.387Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.387Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.406Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.407Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.458Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.458Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:03.470Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:03.470Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:03.559Z
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:04.240Z
 🎯 IssueTrackerBlock initialization: Object
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:04.314Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:44:04.713Z
 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:44:04.974Z
 🎯 IssueTrackerBlock initialization: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:44:05.781Z
 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:44:05.781Z
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:05.802Z
 🎯 IssueTrackerBlock initialization: Object
 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:44:05.859Z
 FileTreeBlock memo: PREVENTED
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 FileTreeBlock memo: PREVENTED
 FileTreeBlock memo: PREVENTED
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:06.682Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:06.966Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:07.049Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.560Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.560Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.576Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.576Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.589Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.589Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.604Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.604Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:08.680Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.694Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.695Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:08.705Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:08.706Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:08.774Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:09.395Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:09.395Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:09.412Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:09.413Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:09.431Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:09.431Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:09.449Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:09.449Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:09.525Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.034Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.035Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.049Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.050Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.063Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.064Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.078Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.078Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.142Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.143Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:10.156Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:10.157Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:10.241Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(4) for block: c7e37789
 [BLOCK-UPDATE] Changes detected, updating block: c7e37789
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:11.710Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:11.711Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:11.726Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:11.726Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:11.741Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:11.741Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:11.756Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:11.756Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] textBlock c7e37789 - Props changed: content
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:11.825Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:11.825Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:11.908Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:13.471Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:13.471Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:13.541Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 SmartSync: Syncing 1 changes
 SmartSync: Changes being sent: Array(1)
 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: c7e37789
 [BLOCK-UPDATE] Changes detected, updating block: c7e37789
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:16.962Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:16.963Z
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] textBlock c7e37789 - Props changed: content
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
 [SYNC-SCHEDULE] ⏰ Max interval reached (30s), calling throttledSync
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 SmartSync: RPC response: Object
 [SYNC-DEBUG] Full RPC Response: {
  "total": 1,
  "errors": [],
  "success": true,
  "processed": 1,
  "timestamp": 1762512257802.241
}
 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
 [SYNC-DEBUG] Change 1: Object
 [SYNC-DEBUG] === END CRITICAL FIELDS ===
 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
 [SYNC-DEBUG] Changes that were sent: Array(1)
 SmartSync: Successfully synced 1 changes
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:17.041Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:18.903Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:18.903Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:18.974Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:19.802Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:19.802Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:19.874Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:20.640Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:20.640Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:20.708Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 SmartSync: Syncing 1 changes
 SmartSync: Changes being sent: Array(1)
 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 SmartSync: RPC response: Object
 [SYNC-DEBUG] Full RPC Response: {
  "total": 1,
  "errors": [],
  "success": true,
  "processed": 1,
  "timestamp": 1762512263029.575
}
 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
 [SYNC-DEBUG] Change 1: Object
 [SYNC-DEBUG] === END CRITICAL FIELDS ===
 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
 [SYNC-DEBUG] Changes that were sent: Array(1)
 SmartSync: Successfully synced 1 changes
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:22.290Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:22.290Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:22.363Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:23.455Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:23.456Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:23.524Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🎯 IssueTrackerBlock initialization: Object
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:25.231Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T10:44:26.643Z
 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T10:44:26.643Z
 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T10:44:26.725Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:28.976Z
 🎯 IssueTrackerBlock initialization: Object
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:29.043Z
 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:44:29.114Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🟢 AI Block: Adding message Object
 🟣 AI Block Update: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 88942c3d
 [BLOCK-UPDATE] Changes detected, updating block: 88942c3d
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] aiBlock 88942c3d - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🟢 AI Block: Adding message Object
 🟣 AI Block Update: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 88942c3d
 [BLOCK-UPDATE] Changes detected, updating block: 88942c3d
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] aiBlock 88942c3d - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 2
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🟢 AI Block: Adding message Object
 🟣 AI Block Update: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 88942c3d
 [BLOCK-UPDATE] Changes detected, updating block: 88942c3d
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] aiBlock 88942c3d - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🟢 AI Block: Adding message Object
 🟣 AI Block Update: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 88942c3d
 [BLOCK-UPDATE] Changes detected, updating block: 88942c3d
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] aiBlock 88942c3d - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 4
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:44:46.864Z
 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:44:47.263Z
 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:44:47.330Z
 🎯 IssueTrackerBlock initialization: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 🎯 IssueTrackerBlock initialization: Object
 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:44:48.434Z
 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:44:48.435Z
 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:44:48.483Z
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 FileTreeBlock memo: PREVENTED
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(5) for block: 0f399d33
 [BLOCK-UPDATE] Changes detected, updating block: 0f399d33
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 [DEBUG-SERIALIZE] FileTree block.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree block.currentSnapshotId: initial
 [DEBUG-SERIALIZE] FileTree block.metadata: Object
 [DEBUG-SERIALIZE] FileTree serialized.metadata.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree serialized.metadata.currentSnapshotId: initial
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] filetreeBlock 0f399d33 - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 5
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 0f399d33
 [BLOCK-UPDATE] Changes detected, updating block: 0f399d33
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 [DEBUG-SERIALIZE] FileTree block.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree block.currentSnapshotId: initial
 [DEBUG-SERIALIZE] FileTree block.metadata: Object
 [DEBUG-SERIALIZE] FileTree serialized.metadata.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree serialized.metadata.currentSnapshotId: initial
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] filetreeBlock 0f399d33 - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 6
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [BLOCK-UPDATE-DEBUG] Changed keys: Array(1) for block: 0f399d33
 [BLOCK-UPDATE] Changes detected, updating block: 0f399d33
 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
 🔍 BlockSerializer.serialize INPUT: Object
 [DEBUG-SERIALIZE] FileTree block.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree block.currentSnapshotId: initial
 [DEBUG-SERIALIZE] FileTree block.metadata: Object
 [DEBUG-SERIALIZE] FileTree serialized.metadata.snapshots: Array(0)
 [DEBUG-SERIALIZE] FileTree serialized.metadata.currentSnapshotId: initial
 🔍 BlockSerializer.serialize OUTPUT: Object
 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
 🚀 SmartSync.handleChange INPUT: Object
 [VIRT-DEBUG-0] 📋 Document Loading Strategy
 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
 [VIRT-DEBUG-0] Block count: unknown
 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
 [BLOCKS-MEMO] Blocks array updated: 13 blocks
 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
 [BLOCK-MEMO] filetreeBlock 0f399d33 - PREVENTED
 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 7
 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
 [SYNC-STATUS-GET] 📊 Status requested: Object
 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 FileTreeBlock memo: PREVENTED
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 SmartSync: Syncing 7 changes
index-CSSoVVPE.js:26 SmartSync: Changes being sent: Array(7)
index-CSSoVVPE.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
index-CSSoVVPE.js:26 SmartSync: RPC response: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 7,
  "errors": [],
  "success": true,
  "processed": 7,
  "timestamp": 1762512297794.865
}
index-CSSoVVPE.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-CSSoVVPE.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-CSSoVVPE.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 1: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 2: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 3: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 4: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 5: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 6: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 7: Object
index-CSSoVVPE.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-CSSoVVPE.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-CSSoVVPE.js:26 [SYNC-DEBUG] Changes that were sent: Array(7)
index-CSSoVVPE.js:26 SmartSync: Successfully synced 7 changes
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 FileTreeBlock memo: PREVENTED
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 FileTreeBlock memo: PREVENTED
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: Array(3) for block: f2f51dbd
index-CSSoVVPE.js:26 [BLOCK-UPDATE] Changes detected, updating block: f2f51dbd
index-CSSoVVPE.js:26 [BLOCK-REF-STABILITY] 12/13 blocks kept same reference
index-CSSoVVPE.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: Object
index-CSSoVVPE.js:26 🔍 BlockSerializer.serialize INPUT: Object
index-CSSoVVPE.js:26 🔍 BlockSerializer.serialize OUTPUT: Object
index-CSSoVVPE.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: Object
index-CSSoVVPE.js:26 🚀 SmartSync.handleChange INPUT: Object
index-CSSoVVPE.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-CSSoVVPE.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-CSSoVVPE.js:26 [VIRT-DEBUG-0] Block count: unknown
index-CSSoVVPE.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-CSSoVVPE.js:26 [BLOCKS-MEMO] Blocks array updated: 13 blocks
index-CSSoVVPE.js:26 [BLOCKS-MEMO] Block reference stability: 12/13 blocks same
index-CSSoVVPE.js:26 [BLOCK-MEMO] codeBlock f2f51dbd - Props changed: content
index-CSSoVVPE.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-CSSoVVPE.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-CSSoVVPE.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: Object
index-CSSoVVPE.js:26 FileTreeBlock memo: PREVENTED
index-CSSoVVPE.js:26 FileTreeBlock memo: PREVENTED
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: Object
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: Object
index-CSSoVVPE.js:993 Uncaught TypeError: Failed to execute 'contains' on 'Node': parameter 1 is not of type 'Node'.
    at onMouseLeave (index-CSSoVVPE.js:993:2527)
    at mC (index-CSSoVVPE.js:106:118385)
    at index-CSSoVVPE.js:106:123691
    at Ho (index-CSSoVVPE.js:106:9041)
    at eb (index-CSSoVVPE.js:106:119630)
    at hb (index-CSSoVVPE.js:107:26867)
    at NB (index-CSSoVVPE.js:107:26782)
    at HTMLDivElement.r (index-CSSoVVPE.js:26:9336)
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762512297129, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762512297129, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762512297129, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762512297129, online: true}
index-CSSoVVPE.js:26 SmartSync: Syncing 1 changes
index-CSSoVVPE.js:26 SmartSync: Changes being sent: [{…}]
index-CSSoVVPE.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-CSSoVVPE.js:26 SmartSync: RPC response: {total: 1, errors: Array(0), success: true, processed: 1, timestamp: 1762512310107.5}
index-CSSoVVPE.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 1,
  "errors": [],
  "success": true,
  "processed": 1,
  "timestamp": 1762512310107.5
}
index-CSSoVVPE.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-CSSoVVPE.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-CSSoVVPE.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-CSSoVVPE.js:26 [SYNC-DEBUG] Change 1: {action: 'UPDATE', block_id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', block_type: 'code', position: 0, has_type: true, …}
index-CSSoVVPE.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-CSSoVVPE.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-CSSoVVPE.js:26 [SYNC-DEBUG] Changes that were sent: [{…}]
index-CSSoVVPE.js:26 SmartSync: Successfully synced 1 changes
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}
index-CSSoVVPE.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762512309315, online: true}


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

---

## 🔧 ADDITIONAL FIX APPLIED (After User Report)

### Issue Found
The `addBlock` and `handleInlineBlockAdd` functions were spreading ALL blocks after insertion:
```javascript
// This created NEW objects for every block after insertion
for (let i = index + 2; i < updatedBlocks.length; i++) {
  updatedBlocks[i] = { ...updatedBlocks[i], position: i };  // ← Always spreads!
}
```

### Fix Applied  
**Files Modified**:
- `src/components/ExpandedViewEnhanced.jsx:983-990` (addBlock function)
- `src/components/ExpandedViewEnhanced.jsx:1109-1116` (handleInlineBlockAdd function)

Now only spreads blocks that ACTUALLY need position updates:
```javascript
for (let i = index + 2; i < updatedBlocks.length; i++) {
  if (updatedBlocks[i].position !== i) {
    updatedBlocks[i] = { ...updatedBlocks[i], position: i };
  }
  // else: position already correct, reuse same reference
}
```

### Expected Improvement
- **Before**: Adding 1 block created new references for ~40 blocks
- **After**: Adding 1 block creates new reference for ONLY 1 block (the new one)
- **Console**: Should now show `40/41 blocks same` instead of `0/41 blocks same`

### About the "+" Button Between Blocks
The hover-based "+" buttons (BlockDivider/InlineActionBar) use the same `addBlock` function, so this fix applies to all methods of adding blocks:
- Hover "+" buttons between blocks
- Big "+" button at bottom
- Inline block addition from TextBlock

**Please restart dev server (`npm run dev`) and re-run the tests!**

---

## 🔧 CRITICAL FIX #2 - Block Reference Preservation (After Test Failure)

### Root Cause Found
The loader hook fixes had TWO major bugs:

**Bug 1: Double setState**
```javascript
// ❌ BAD - Called setBlocks TWICE, second call overwrites first!
setBlocks(prevBlocks => { /* logic */ return result; });
setBlocks(finalBlocks => { /* update cache */ return finalBlocks; });
```

**Bug 2: Object Reference Comparison**
```javascript
// ❌ BAD - metadata comparison always fails (comparing object references)
if (prevBlock.metadata === newBlock.metadata) { ... }
```

### Fixes Applied
**Files Modified**:
- `src/hooks/useOptimizedBlockLoader.js:130-188`
- `src/hooks/usePaginatedBlockLoader.js:148-189`

**Fix 1**: Single setState with cache updates inside
**Fix 2**: Only compare primitive values (content, type, position)

```javascript
// ✅ GOOD - Single setState, cache updates inside
setBlocks(prevBlocks => {
  const result = newBlocks.map((newBlock, index) => {
    const prevBlock = prevBlocks.find(b => b.id === newBlock.id);
    
    if (prevBlock) {
      // Compare only primitive values
      const contentSame = prevBlock.content === newBlock.content;
      const typeSame = prevBlock.type === newBlock.type;
      const positionSame = prevBlock.position === index;
      
      // If unchanged, reuse exact reference
      if (contentSame && typeSame && positionSame) {
        return prevBlock; // ← PRESERVE REFERENCE!
      }
    }
    
    return { ...newBlock, position: index }; // New or changed
  });
  
  // Update caches before returning
  sessionCache.updateBlocks(documentId, result);
  return result;
});
```

### Expected Results NOW
Console should show:
- **Initial load**: `Block reference stability: 0/5 blocks same` (first time, expected)
- **After clicking "+"**: `Block reference stability: 5/5 blocks same` (all preserved!)
- **After adding block**: `Block reference stability: 5/6 blocks same` (only new block changes)

**Please restart dev server and test again!** This should finally fix the flickering.

---

## About the BlockDivider "+" Buttons

The hover "+" buttons between blocks (BlockDivider component) should work the same as the big "+" button. Both use the same `addBlock` function.

If the hover buttons still don't appear, that's a separate UI issue (CSS/visibility), but the flickering should be fixed now.

