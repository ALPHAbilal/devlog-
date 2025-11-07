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
index-3frpBIxs.js:26 Using optimized Supabase client
index-3frpBIxs.js:26 [VIRT-DEBUG-IMPORT] Virtuoso component imported: object
index-3frpBIxs.js:26 IndexedDB initialized successfully
index-3frpBIxs.js:26 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-3frpBIxs.js:26 [Supabase] Activity monitoring disabled - sessions use automatic token refresh
index-3frpBIxs.js:26 [Supabase] Auth event: INITIAL_SESSION
index-3frpBIxs.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-3frpBIxs.js:26 Using Supabase for storage
index-3frpBIxs.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ⚠️ Not ready to start polling: {hasDocumentId: true, managerReady: false, hasManagerRef: false}
index-3frpBIxs.js:26 SessionCache: Cached 5 blocks for document 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [BLOCKS-MEMO] Blocks array updated: 5 blocks
index-3frpBIxs.js:26 [BLOCKS-MEMO] Block reference stability: 0/5 blocks same
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ✅ SmartSync manager ready
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ✅ Starting status polling for document: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 SmartSync: IndexedDB initialized
index-3frpBIxs.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:36:59.600Z
index-3frpBIxs.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:36:59.601Z
index-3frpBIxs.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:36:59.603Z
index-3frpBIxs.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:36:59.678Z
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-3frpBIxs.js:26 ExpandedView: Initial load period complete, enabling saves
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 ExpandedView: Calling Smart Sync for new block: {id: '8056d59a-eb0b-4955-a84b-05ca945788e5', type: 'image', position: 5, created_at: 1762511827534}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize INPUT: {id: '8056d59a-eb0b-4955-a84b-05ca945788e5', type: 'image', hasContent: true, hasMessages: false, hasImages: false, …}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '8056d59a-eb0b-4955-a84b-05ca945788e5', type: 'image', position: 5, contentLength: 41, contentPreview: '{"images":[],"layout":"grid","columns":3}'}
index-3frpBIxs.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '8056d59a-eb0b-4955-a84b-05ca945788e5', action: 'CREATE', blockType: 'image', position: 5, contentLength: 41, …}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [BLOCKS-MEMO] Blocks array updated: 6 blocks
index-3frpBIxs.js:26 [BLOCKS-MEMO] Block reference stability: 5/6 blocks same
index-3frpBIxs.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:37:07.564Z
index-3frpBIxs.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:37:07.566Z
index-3frpBIxs.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:37:07.569Z
index-3frpBIxs.js:26 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:37:07.571Z
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-3frpBIxs.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-3frpBIxs.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:37:07.657Z
index-3frpBIxs.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-3frpBIxs.js:26 FileTreeBlock memo: PREVENTED
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', type: 'issue-tracker', position: 6, created_at: 1762511830979}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', type: 'issue-tracker', position: 6, contentLength: 28, contentPreview: '{"milestone":"","issues":[]}'}
index-3frpBIxs.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', action: 'CREATE', blockType: 'issue-tracker', position: 6, contentLength: 28, …}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [BLOCKS-MEMO] Blocks array updated: 7 blocks
index-3frpBIxs.js:26 [BLOCKS-MEMO] Block reference stability: 6/7 blocks same
index-3frpBIxs.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:37:11.000Z
index-3frpBIxs.js:26 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:37:11.002Z
index-3frpBIxs.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 2
index-3frpBIxs.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-3frpBIxs.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 ExpandedView: Calling Smart Sync for new block: {id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', type: 'heading', position: 7, created_at: 1762511835583}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize INPUT: {id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-3frpBIxs.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', type: 'heading', position: 7, contentLength: 0, contentPreview: ''}
index-3frpBIxs.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '3913b055-3a24-4b89-9e37-fd5fd26d003c', action: 'CREATE', blockType: 'heading', position: 7, contentLength: 0, …}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Block count: unknown
index-3frpBIxs.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-3frpBIxs.js:26 [BLOCKS-MEMO] Blocks array updated: 8 blocks
index-3frpBIxs.js:26 [BLOCKS-MEMO] Block reference stability: 7/8 blocks same
index-3frpBIxs.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:37:15.603Z
index-3frpBIxs.js:26 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T10:37:15.605Z
index-3frpBIxs.js:26 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T10:37:15.607Z
index-3frpBIxs.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
index-3frpBIxs.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-3frpBIxs.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511819556, online: true}
index-3frpBIxs.js:26 SmartSync: Syncing 3 changes
index-3frpBIxs.js:26 SmartSync: Changes being sent: (3) [{…}, {…}, {…}]
index-3frpBIxs.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-3frpBIxs.js:26 SmartSync: RPC response: {total: 3, errors: Array(0), success: true, processed: 3, timestamp: 1762511841627.374}
index-3frpBIxs.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 3,
  "errors": [],
  "success": true,
  "processed": 3,
  "timestamp": 1762511841627.374
}
index-3frpBIxs.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-3frpBIxs.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-3frpBIxs.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-3frpBIxs.js:26 [SYNC-DEBUG] Change 1: {action: 'CREATE', block_id: '8056d59a-eb0b-4955-a84b-05ca945788e5', block_type: 'image', position: 5, has_type: true, …}
index-3frpBIxs.js:26 [SYNC-DEBUG] Change 2: {action: 'CREATE', block_id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', block_type: 'issue-tracker', position: 6, has_type: true, …}
index-3frpBIxs.js:26 [SYNC-DEBUG] Change 3: {action: 'CREATE', block_id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', block_type: 'heading', position: 7, has_type: true, …}
index-3frpBIxs.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-3frpBIxs.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-3frpBIxs.js:26 [SYNC-DEBUG] Changes that were sent: (3) [{…}, {…}, {…}]
index-3frpBIxs.js:26 SmartSync: Successfully synced 3 changes
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511840910, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511840910, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511840910, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511840910, online: true}
index-3frpBIxs.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511840910, online: true}

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

