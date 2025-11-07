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
 Using optimized Supabase client
 [VIRT-DEBUG-IMPORT] Virtuoso component imported: object
 IndexedDB initialized successfully
 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [Supabase] Activity monitoring disabled - sessions use automatic token refresh
 [Supabase] Auth event: INITIAL_SESSION
 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 0, totalRootDocuments: 0, combinedTotal: 0}
 Loading folders for user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 Loading folders for user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [DEBUG-DASHBOARD] Waiting for documents to load: 0
 [DEBUG-INIT] Dashboard mounted, user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b paginatedDocs: 0
 [DEBUG-INIT] Triggering loadInitial()
 usePaginatedDashboard: loadInitial() CALLED {userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', loadingRef: false, pageSize: 50, orderBy: 'updated_at'}
 usePaginatedDashboard: Calling getDocumentsWithRealActivity with page 0
 [PAGINATION-SCROLL] ✅ Scroll listener attached to: {element: '.dashboard-scroll-container', hasMore: true, currentPage: 0, totalDocuments: 0}
 Loaded 89 folders (39 root folders)
 Loaded 89 folders (39 root folders)
 [DEBUG-DASHBOARD] Waiting for documents to load: 0
 usePaginatedDashboard: Got real activity documents: {documentCount: 50, sampleActivity: null, documentsWithActivity: 3, allDocumentIds: Array(50)}
 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 39, totalRootDocuments: 0, combinedTotal: 39}
 [PAGINATION-SCROLL] 🔌 Scroll listener detached
 [PAGINATION-SCROLL] ✅ Scroll listener attached to: {element: '.dashboard-scroll-container', hasMore: true, currentPage: 0, totalDocuments: 50}
 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 39, totalRootDocuments: 42, combinedTotal: 81}
 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
 [DEBUG-FOLDER] Folder "Azure": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:15:00.803Z
 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T10:15:42.785Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:34:43.643Z
 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-16T16:34:43.643Z
 [DEBUG-FOLDER] Folder "New Folder (5)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-27T21:28:30.123Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:15:55.163Z
 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T23:05:23.478Z
 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-28T11:22:51.739Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:05:49.218Z
 [DEBUG-FOLDER] Folder "New Folder (8)": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T05:05:49.218Z
 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:18:51.656Z
 [DEBUG-FOLDER] Folder "google": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T04:18:51.656Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 1 documents = 1 items, most recent: 2025-11-03T10:02:51.181Z
 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-21T14:15:13.552Z
 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-16T14:54:36.506Z
 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T12:10:37.944Z
 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-28T13:52:23.039Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-20T14:24:48.758Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:36:39.300Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:12:50.604Z
 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:00:46.063Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 3 subfolders + 0 documents = 3 items, most recent: 2025-07-20T17:00:46.063Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:10.232Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-20T17:01:31.529Z
 [DEBUG-FOLDER] Folder "new folder 4": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:53:22.558Z
 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T21:23:40.667Z
 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T07:15:16.472Z
 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-24T21:23:40.667Z
 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
 [DEBUG-FOLDER] Folder "problems": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-29T10:22:16.769Z
 [DEBUG-FOLDER] Folder "seo thing": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-29T20:15:18.803Z
 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-29T10:22:16.769Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-10-25T12:30:33.238Z
 [DEBUG-FOLDER] Folder "New Folder (6)": 1 subfolders + 0 documents = 1 items, most recent: 2025-10-25T12:30:33.238Z
 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:45:08.652Z
 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:45:08.652Z
 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 5 documents = 5 items, most recent: 2025-09-02T21:19:36.310Z
 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:58:39.132Z
 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T11:11:07.255Z
 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2025-08-26T06:25:45.292Z
 [DEBUG-DASHBOARD] Combined: 39 folders + 42 documents = 81 total items
 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
 🔎 BlockSerializer.deserialize INPUT: {id: 'a169854a-b83b-431d-ab96-393b0cd8ce8f', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 178, …}
 [DEBUG-DESERIALIZE] FileTree block.id: a169854a-b83b-431d-ab96-393b0cd8ce8f
 [DEBUG-DESERIALIZE] FileTree block.metadata: {last_sync: '2025-11-07T10:27:48.637491+00:00', snapshots: Array(0), snapshotLimit: 50, sync_timestamp: 1762511260682, currentSnapshotId: 'initial'}
 [DEBUG-DESERIALIZE] FileTree meta.snapshots: []
 [DEBUG-DESERIALIZE] FileTree meta.currentSnapshotId: initial
 [DEBUG-DESERIALIZE] FileTree deserialized.snapshots: []
 [DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId: initial
 [DEBUG-DESERIALIZE] FileTree: Creating initial snapshot (backward compatibility)
 🔎 BlockSerializer.deserialize INPUT: {id: 'e9a03bd4-cd82-4dcc-a6d9-24e4d67d4f8a', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 273, …}
 [DEBUG-DESERIALIZE] FileTree block.id: e9a03bd4-cd82-4dcc-a6d9-24e4d67d4f8a
 [DEBUG-DESERIALIZE] FileTree block.metadata: {last_sync: '2025-11-07T10:03:20.030685+00:00', snapshots: Array(1), snapshotLimit: 50, sync_timestamp: 1762509794147, currentSnapshotId: 'initial'}
 [DEBUG-DESERIALIZE] FileTree meta.snapshots: [{…}]
 [DEBUG-DESERIALIZE] FileTree meta.currentSnapshotId: initial
 [DEBUG-DESERIALIZE] FileTree deserialized.snapshots: [{…}]
 [DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId: initial
 🔎 BlockSerializer.deserialize INPUT: {id: '926eb65f-eaeb-45fc-b3f2-547258b2ed75', type: 'code', hasContent: true, contentType: 'string', contentLength: 8, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'f0ebbb96-416e-4086-8ff2-da5c86ed7a02', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 178, …}
 [DEBUG-DESERIALIZE] FileTree block.id: f0ebbb96-416e-4086-8ff2-da5c86ed7a02
 [DEBUG-DESERIALIZE] FileTree block.metadata: {last_sync: '2025-11-06T22:53:18.977465+00:00', snapshots: Array(5), snapshotLimit: 50, sync_timestamp: 1762469591067, currentSnapshotId: 'initial'}
 [DEBUG-DESERIALIZE] FileTree meta.snapshots: (5) [{…}, {…}, {…}, {…}, {…}]
 [DEBUG-DESERIALIZE] FileTree meta.currentSnapshotId: initial
 [DEBUG-DESERIALIZE] FileTree deserialized.snapshots: (5) [{…}, {…}, {…}, {…}, {…}]
 [DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId: initial
 🔎 BlockSerializer.deserialize INPUT: {id: '72565e8b-2103-4c19-a64c-a04e48dbc667', type: 'heading', hasContent: true, contentType: 'string', contentLength: 0, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '9d99749f-3eb6-42cc-9ac0-d14efadc3cd6', type: 'table', hasContent: true, contentType: 'string', contentLength: 96, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '77e804ac-be61-43db-be10-81962ab915f8', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 11822, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'ee6d5604-3d5c-452f-b093-af36aeef00f6', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: 'ee6d5604-3d5c-452f-b093-af36aeef00f6', messageCount: 0, hasMessages: true}
 🔎 BlockSerializer.deserialize INPUT: {id: 'd699315e-9f8f-4841-9d79-5b43c4a74c78', type: 'code', hasContent: true, contentType: 'string', contentLength: 1476, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'b457ab50-84f0-417a-a8ac-d26192c65b19', type: 'heading', hasContent: true, contentType: 'string', contentLength: 8, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '4f93f81e-6490-409d-8f26-504362a65b46', type: 'heading', hasContent: true, contentType: 'string', contentLength: 0, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '4c29205b-93cd-4db2-9675-cff1c7395db2', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 29, …}
 [DEBUG-DESERIALIZE] FileTree block.id: 4c29205b-93cd-4db2-9675-cff1c7395db2
 [DEBUG-DESERIALIZE] FileTree block.metadata: {last_sync: '2025-11-06T14:00:57.992505+00:00', snapshots: Array(0), snapshotLimit: 50, sync_timestamp: 1762437640887, currentSnapshotId: null}
 [DEBUG-DESERIALIZE] FileTree meta.snapshots: []
 [DEBUG-DESERIALIZE] FileTree meta.currentSnapshotId: null
 [DEBUG-DESERIALIZE] FileTree deserialized.snapshots: []
 [DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId: null
 🔎 BlockSerializer.deserialize INPUT: {id: '0a8f721d-6881-4737-96e7-b4755f0d88d8', type: 'ai', hasContent: true, contentType: 'string', contentLength: 135, …}
 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: '0a8f721d-6881-4737-96e7-b4755f0d88d8', messageCount: 1, hasMessages: true}
 🔎 BlockSerializer.deserialize INPUT: {id: 'b003954b-4c2b-4cd2-b6a9-79f1cfd1e936', type: 'image', hasContent: true, contentType: 'string', contentLength: 41, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '9475f731-854e-4257-b4d4-fb5f743a2b5f', type: 'code', hasContent: true, contentType: 'string', contentLength: 20, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'd73f2885-12a0-4a0c-afee-71c8aadb9b58', type: 'heading', hasContent: true, contentType: 'string', contentLength: 20, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '5e1463e9-2d6f-4f8e-bafe-8b84ef254379', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 126, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'f8b60b80-b732-471f-b962-8d18dcab5caf', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: 'f8b60b80-b732-471f-b962-8d18dcab5caf', messageCount: 0, hasMessages: true}
 🔎 BlockSerializer.deserialize INPUT: {id: '52dc7d70-d8de-4445-ae88-59fc6c7ec39e', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'f4002c15-f286-4e03-ad16-b4cc75119511', type: 'heading', hasContent: true, contentType: 'string', contentLength: 0, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'e74558c6-1134-435f-822f-70701ffe9a25', type: 'image', hasContent: true, contentType: 'string', contentLength: 41, …}
 🔎 BlockSerializer.deserialize INPUT: {id: 'f44c191a-143e-45f6-9f78-fefe19466254', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: 'f44c191a-143e-45f6-9f78-fefe19466254', messageCount: 0, hasMessages: true}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '99794a7b-4230-421c-a2c0-471e2bfa2063', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 126, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '734af997-fe40-4b51-9700-94298b6453ad', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'c58bac88-385f-403b-9ba9-6f46b2ffb91b', type: 'table', hasContent: true, contentType: 'string', contentLength: 181, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '295bb13f-8817-4a63-a410-7b001c3fe130', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
index-DKD2wc9W.js:26 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: '295bb13f-8817-4a63-a410-7b001c3fe130', messageCount: 0, hasMessages: true}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'ff032aa0-85b7-4753-82e3-84ebcfce0873', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 28, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '8b1af87d-acb1-4cda-891c-8ba889b840d9', type: 'image', hasContent: true, contentType: 'string', contentLength: 41, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '88439d1f-2765-4f1a-82f5-e2bb112afb96', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '46f28e79-b36f-4207-be22-9cfca6e269a6', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
index-DKD2wc9W.js:26 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: '46f28e79-b36f-4207-be22-9cfca6e269a6', messageCount: 0, hasMessages: true}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '789a8cb5-1dc2-407c-b859-e0dba0e2b1a6', type: 'image', hasContent: true, contentType: 'string', contentLength: 41, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'e6fd53a6-691f-4f6b-8ac1-6184e23e34ea', type: 'table', hasContent: true, contentType: 'string', contentLength: 181, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '39d4fc6d-d17c-480e-9cea-1eba1bc6e751', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 177, …}
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree block.id: 39d4fc6d-d17c-480e-9cea-1eba1bc6e751
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree block.metadata: {last_sync: '2025-11-06T21:27:20.853258+00:00', snapshots: Array(0), snapshotLimit: 50, sync_timestamp: 1762464434315, currentSnapshotId: 'initial'}
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree meta.snapshots: []
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree meta.currentSnapshotId: initial
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree deserialized.snapshots: []
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree deserialized.currentSnapshotId: initial
index-DKD2wc9W.js:26 [DEBUG-DESERIALIZE] FileTree: Creating initial snapshot (backward compatibility)
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'e40d28b8-c2f6-4dd4-bacb-e619efb86811', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 126, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '744782ea-0be3-42d9-a002-7eee420e5689', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '78fd164d-2d32-46a1-acdf-512641a8b461', type: 'heading', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '591e7bc8-d799-4d1d-a51b-b92715d28e6a', type: 'text', hasContent: true, contentType: 'string', contentLength: 53, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '8bcf8b0e-6739-4e59-91d2-39b5ad0157b3', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '5caa14c2-a604-4ac4-9a19-f45aace0eff8', type: 'heading', hasContent: true, contentType: 'string', contentLength: 3, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '93798d7e-d382-4dbc-a098-16b63cd83147', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'e1495e49-763c-46ca-98e3-a518e8ff6ef2', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
index-DKD2wc9W.js:26 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: 'e1495e49-763c-46ca-98e3-a518e8ff6ef2', messageCount: 0, hasMessages: true}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '5d90322e-f51d-45ec-b24b-28b8e56e9354', type: 'issue-tracker', hasContent: true, contentType: 'string', contentLength: 28, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '8468e740-5b39-4125-af26-3935232f3f9b', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '2e20c1e8-0c6e-4f4a-8dbc-01387e9aefab', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
index-DKD2wc9W.js:26 🔵 AI Block Load Debug (OptimizedBlockLoader): {blockId: '2e20c1e8-0c6e-4f4a-8dbc-01387e9aefab', messageCount: 0, hasMessages: true}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '403e0853-9033-41bb-ac48-c78ae3841b8d', type: 'table', hasContent: true, contentType: 'string', contentLength: 96, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '738b5a9c-c4ae-4764-a078-62f5e3103d35', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'cfaf9d7c-5b91-4f75-a6cc-dbef75e1c4cb', type: 'code', hasContent: true, contentType: 'string', contentLength: 0, …}
index-DKD2wc9W.js:26 [PAGINATION-SCROLL] 🔌 Scroll listener detached
index-DKD2wc9W.js:26 Using Supabase for storage
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ⚠️ Not ready to start polling: {hasDocumentId: true, managerReady: false, hasManagerRef: false}
index-DKD2wc9W.js:26 OptimizedBlockLoader: Loading blocks for document 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [BLOCKS-DEBUG] Attempting to load from blocks table
index-DKD2wc9W.js:26 [BLOCKS-DEBUG] Query: SELECT * FROM blocks WHERE document_id = 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 3 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 0/3 blocks same
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ✅ SmartSync manager ready
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ✅ Starting status polling for document: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 SmartSync: IndexedDB initialized
index-DKD2wc9W.js:26 OptimizedBlockLoader: Loaded 0 blocks for document 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [BLOCKS-DEBUG] No blocks found in blocks table for document: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 SessionCache: Cached 0 blocks for document 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 0/0 blocks same
index-DKD2wc9W.js:26 ExpandedView: Initial load period complete, enabling saves
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', type: 'code', position: 0, created_at: 1762511379149}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', type: 'code', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', type: 'code', position: 0, contentLength: 0, contentPreview: ''}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', action: 'CREATE', blockType: 'code', position: 0, contentLength: 0, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 1 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 0/1 blocks same
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:29:39.183Z
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: (3) ['language', 'filePath', 'isNew'] for block: f2f51dbd
index-DKD2wc9W.js:26 [BLOCK-UPDATE] Changes detected, updating block: f2f51dbd
index-DKD2wc9W.js:26 [BLOCK-REF-STABILITY] 0/1 blocks kept same reference
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'f2f51dbd...', updates: Array(4), needsSave: true, smartSyncExists: true}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', type: 'code', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', type: 'code', position: 0, contentLength: 0, contentPreview: ''}
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'f2f51dbd...', action: 'UPDATE', blockType: 'code', position: 0, contentLength: 0}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', action: 'UPDATE', blockType: 'code', position: 0, contentLength: 0, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 1 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 0/1 blocks same
index-DKD2wc9W.js:26 [BLOCK-MEMO] codeBlock f2f51dbd - PREVENTED
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 2
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', type: 'heading', position: 1, created_at: 1762511387027}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', type: 'heading', position: 1, contentLength: 0, contentPreview: ''}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'f21e9822-a556-4a33-97fd-8f67cd67732c', action: 'CREATE', blockType: 'heading', position: 1, contentLength: 0, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 2 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 1/2 blocks same
index-DKD2wc9W.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:29:47.045Z
index-DKD2wc9W.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:29:47.046Z
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['isNew'] for block: f21e9822
index-DKD2wc9W.js:26 [BLOCK-UPDATE] Changes detected, updating block: f21e9822
index-DKD2wc9W.js:26 [BLOCK-REF-STABILITY] 1/2 blocks kept same reference
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'f21e9822...', updates: Array(3), needsSave: true, smartSyncExists: true}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', type: 'heading', position: 1, contentLength: 0, contentPreview: ''}
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'f21e9822...', action: 'UPDATE', blockType: 'heading', position: 1, contentLength: 0}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'f21e9822-a556-4a33-97fd-8f67cd67732c', action: 'UPDATE', blockType: 'heading', position: 1, contentLength: 0, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 2 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 1/2 blocks same
index-DKD2wc9W.js:26 [BLOCK-MEMO] headingBlock f21e9822 - PREVENTED
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 4
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 4, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 ExpandedView: Calling Smart Sync for new block: {id: '0f399d33-7bd9-4410-99bc-8256cf56b055', type: 'filetree', position: 2, created_at: 1762511392351}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: '0f399d33-7bd9-4410-99bc-8256cf56b055', type: 'filetree', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 [DEBUG-SERIALIZE] FileTree block.snapshots: undefined
index-DKD2wc9W.js:26 [DEBUG-SERIALIZE] FileTree block.currentSnapshotId: undefined
index-DKD2wc9W.js:26 [DEBUG-SERIALIZE] FileTree block.metadata: undefined
index-DKD2wc9W.js:26 [DEBUG-SERIALIZE] FileTree serialized.metadata.snapshots: []
index-DKD2wc9W.js:26 [DEBUG-SERIALIZE] FileTree serialized.metadata.currentSnapshotId: null
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '0f399d33-7bd9-4410-99bc-8256cf56b055', type: 'filetree', position: 2, contentLength: 29, contentPreview: '{"treeData":[],"expanded":[]}'}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '0f399d33-7bd9-4410-99bc-8256cf56b055', action: 'CREATE', blockType: 'filetree', position: 2, contentLength: 29, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 3 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 2/3 blocks same
index-DKD2wc9W.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:29:52.370Z
index-DKD2wc9W.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:29:52.371Z
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 5
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:29:52.444Z
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', position: 3, created_at: 1762511395277}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', position: 3, contentLength: 28, contentPreview: '{"milestone":"","issues":[]}'}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', action: 'CREATE', blockType: 'issue-tracker', position: 3, contentLength: 28, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 4 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 3/4 blocks same
index-DKD2wc9W.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:29:55.298Z
index-DKD2wc9W.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:29:55.299Z
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 6
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:29:55.370Z
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 SmartSync: Syncing 6 changes
index-DKD2wc9W.js:26 SmartSync: Changes being sent: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
index-DKD2wc9W.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1762511372371, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 SmartSync: RPC response: {total: 6, errors: Array(0), success: true, processed: 6, timestamp: 1762511401318.292}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 6,
  "errors": [],
  "success": true,
  "processed": 6,
  "timestamp": 1762511401318.292
}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-DKD2wc9W.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 1: {action: 'CREATE', block_id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', block_type: 'code', position: 0, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 2: {action: 'UPDATE', block_id: 'f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9', block_type: 'code', position: 0, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 3: {action: 'CREATE', block_id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', block_type: 'heading', position: 1, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 4: {action: 'UPDATE', block_id: 'f21e9822-a556-4a33-97fd-8f67cd67732c', block_type: 'heading', position: 1, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 5: {action: 'CREATE', block_id: '0f399d33-7bd9-4410-99bc-8256cf56b055', block_type: 'filetree', position: 2, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 6: {action: 'CREATE', block_id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', block_type: 'issue-tracker', position: 3, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-DKD2wc9W.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-DKD2wc9W.js:26 [SYNC-DEBUG] Changes that were sent: (6) [{…}, {…}, {…}, {…}, {…}, {…}]
index-DKD2wc9W.js:26 SmartSync: Successfully synced 6 changes
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', type: 'heading', position: 4, created_at: 1762511402055}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-DKD2wc9W.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', type: 'heading', position: 4, contentLength: 0, contentPreview: ''}
index-DKD2wc9W.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', action: 'CREATE', blockType: 'heading', position: 4, contentLength: 0, …}
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Block count: unknown
index-DKD2wc9W.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Blocks array updated: 5 blocks
index-DKD2wc9W.js:26 [BLOCKS-MEMO] Block reference stability: 4/5 blocks same
index-DKD2wc9W.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T10:30:02.075Z
index-DKD2wc9W.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T10:30:02.077Z
index-DKD2wc9W.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T10:30:02.079Z
index-DKD2wc9W.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-DKD2wc9W.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-DKD2wc9W.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T10:30:02.157Z
index-DKD2wc9W.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-DKD2wc9W.js:26 FileTreeBlock memo: PREVENTED
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762511400546, online: true}
index-DKD2wc9W.js:26 SmartSync: Syncing 1 changes
index-DKD2wc9W.js:26 SmartSync: Changes being sent: [{…}]
index-DKD2wc9W.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-DKD2wc9W.js:26 SmartSync: RPC response: {total: 1, errors: Array(0), success: true, processed: 1, timestamp: 1762511408113.276}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 1,
  "errors": [],
  "success": true,
  "processed": 1,
  "timestamp": 1762511408113.276
}
index-DKD2wc9W.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-DKD2wc9W.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-DKD2wc9W.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-DKD2wc9W.js:26 [SYNC-DEBUG] Change 1: {action: 'CREATE', block_id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', block_type: 'heading', position: 4, has_type: true, …}
index-DKD2wc9W.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-DKD2wc9W.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-DKD2wc9W.js:26 [SYNC-DEBUG] Changes that were sent: [{…}]
index-DKD2wc9W.js:26 SmartSync: Successfully synced 1 changes
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}
index-DKD2wc9W.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762511407326, online: true}

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
