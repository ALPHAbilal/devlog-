# Debugging Session: Virtualization Flickering - CRITICAL FIX APPLIED

## 🚨 CRITICAL DISCOVERY: The Spread Operator Trap

### What Went Wrong

**Previous "Fix" (INCORRECT)**:
```javascript
const newBlocks = [...prevBlocks];  // ❌ WRONG!
newBlocks[blockIndex] = updatedBlock;
```

**Why This Failed**:
The spread operator `[...prevBlocks]` creates a **shallow copy** that:
1. Creates a NEW array reference
2. **Copies all element references into the new array**
3. Even though objects are same, Virtuoso sees ALL elements as potentially changed
4. React.memo comparison fails: `prevProps.block !== nextProps.block` for ALL blocks
5. Result: ALL 42 blocks re-render, causing flickering and broken focus

**The Trap**: You'd think spreading preserves references, but it doesn't! Each array slot gets reassigned, breaking memo.

### The Correct Fix (APPLIED NOW)

**Files Fixed**:
- `src/hooks/useOptimizedBlockLoader.js:249-251`
- `src/hooks/usePaginatedBlockLoader.js:247-249`

**Correct Code**:
```javascript
// ✅ CORRECT - .map() with reference preservation
const newBlocks = prevBlocks.map((block, i) =>
  i === blockIndex ? updatedBlock : block
);
```

**Why This Works**:
1. `.map()` creates a new array
2. For each index, if `i === blockIndex`, return new block
3. Otherwise, return the **EXACT same block reference** from prevBlocks
4. Result: 41/42 blocks keep identical reference, only 1 changes
5. React.memo sees 41 blocks unchanged → skips re-render
6. No flickering, focus preserved, + buttons work

## Expected Test Results

### Console Logs You Should See

**When typing in TextBlock**:
```
[BLOCK-UPDATE-DEBUG] Changed keys: ['content'] for block: abc12345
[BLOCK-UPDATE] Changes detected, updating block: abc12345
[BLOCK-REF-STABILITY] 41/42 blocks kept same reference   ← 41/42, not 0/42!
[BLOCKS-MEMO] Blocks array updated: 42 blocks
[BLOCKS-MEMO] Block reference stability: 41/42 blocks same   ← KEY METRIC
```

### Behaviors That Should Be Fixed

1. ✅ **TextBlock Focus**: Click inside → type → click outside → focus clears immediately
2. ✅ **Hover + Buttons**: Hover between blocks → + button appears and works
3. ✅ **Big + Button**: Click → new block added without ANY flickering
4. ✅ **Typing Performance**: Smooth typing, no lag, no flickering

## Test Instructions

**Please restart dev server**:
```bash
npm run dev
```

**Then test these scenarios**:

### Test 1: Typing in TextBlock
1. Open a document with 10+ blocks
2. Click in any TextBlock
3. Type several characters
4. Watch console - should show `41/42 blocks kept same reference`
5. Click outside the TextBlock
6. Focus should clear immediately (no stuck focus)

### Test 2: Hover + Buttons
1. Hover between any two blocks
2. A small + button should appear
3. Click it
4. Block type selector should open
5. No flickering should occur

### Test 3: Big + Button
1. Scroll to bottom of document
2. Click the big + button
3. Block type selector opens
4. Add any block type
5. New block appears WITHOUT any flickering
6. Console shows `41/42 blocks kept same reference`

### Test 4: Rapid Typing
1. Click in TextBlock
2. Type very quickly (rapid keystrokes)
3. No flickering should occur
4. Focus should remain stable
5. Console should consistently show 41/42

## Technical Deep Dive

### Why .map() Is Better Than Spread

**Spread operator behavior**:
```javascript
const arr = [a, b, c];
const newArr = [...arr];  // Creates [a, b, c] but NEW array

// What actually happens:
newArr[0] = arr[0];  // Assignment breaks reference identity
newArr[1] = arr[1];  // Each slot gets reassigned
newArr[2] = arr[2];  // Even though objects same, slots are "new"
```

**.map() behavior**:
```javascript
const arr = [a, b, c];
const newArr = arr.map((item, i) => 
  i === 1 ? newB : item  // Explicitly return same reference
);

// What actually happens:
newArr[0] = item;  // Returns EXACT same 'a' reference
newArr[1] = newB;  // Only this is new
newArr[2] = item;  // Returns EXACT same 'c' reference
```

### React.memo Comparison

**With spread operator** (broken):
```javascript
// React.memo checks:
prevProps.block === nextProps.block  // false for ALL blocks!
// Even though objects are same, array slots were reassigned
```

**With .map()** (working):
```javascript
// React.memo checks:
prevProps.block === nextProps.block  // true for 41/42 blocks!
// Objects have IDENTICAL reference from prevBlocks
```

## Root Cause Analysis

**5 Whys**:
1. **Why** do all blocks flicker?
   → Because all blocks re-render

2. **Why** do all blocks re-render?
   → Because React.memo comparison fails for all blocks

3. **Why** does React.memo comparison fail?
   → Because block references are different between renders

4. **Why** are block references different?
   → Because spread operator `[...prevBlocks]` breaks reference identity

5. **Why** does spread break reference identity?
   → Because spreading creates new array with reassigned slots, even though objects are same

**ROOT CAUSE**: Spread operator creates new array with reassigned element references, breaking React's reference equality checks in memo.

## Prevention

**Pattern to Remember**:
- ❌ **NEVER** use `[...array]; newArray[i] = item` for React state with memo
- ✅ **ALWAYS** use `.map((item, i) => i === targetIndex ? newItem : item)`
- ✅ Explicitly preserve unchanged references with `.map()`

**Added to AI-MEMORY/PATTERNS.md** for future reference.

---

## Please Test and Report Results

After restarting dev server, test all 4 scenarios above and paste console output here.

**What to look for**:
- `[BLOCK-REF-STABILITY] 41/42 blocks kept same reference` ← Should see this!
- No flickering when typing or adding blocks
- Focus clears properly when clicking outside
- + buttons work correctly

If you still see `0/42`, paste the full console output and we'll investigate further.


the full console :
index-8BhA2GNT.js:26 Using optimized Supabase client
index-8BhA2GNT.js:26 [VIRT-DEBUG-IMPORT] Virtuoso component imported: object
index-8BhA2GNT.js:26 IndexedDB initialized successfully
index-8BhA2GNT.js:26 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-8BhA2GNT.js:26 [Supabase] Activity monitoring disabled - sessions use automatic token refresh
index-8BhA2GNT.js:26 [Supabase] Auth event: INITIAL_SESSION
index-8BhA2GNT.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-8BhA2GNT.js:26 Using Supabase for storage
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-8BhA2GNT.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ⚠️ Not ready to start polling: {hasDocumentId: true, managerReady: false, hasManagerRef: false}
index-8BhA2GNT.js:26 SessionCache: Cached 19 blocks for document 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 0/19 blocks same
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ✅ SmartSync manager ready
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ✅ Starting status polling for document: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 SmartSync: IndexedDB initialized
index-8BhA2GNT.js:26 💻 CodeBlock f2f51dbd-8d59-49bf-a1ae-cc81688b0cc9 rendered at 2025-11-07T11:25:02.579Z
index-8BhA2GNT.js:26 📌 HeadingBlock f21e9822-a556-4a33-97fd-8f67cd67732c rendered at 2025-11-07T11:25:02.581Z
index-8BhA2GNT.js:26 📌 HeadingBlock c2b04e51-94bf-4642-85f6-f563bc8b3e52 rendered at 2025-11-07T11:25:02.583Z
index-8BhA2GNT.js:26 🌆 ImageBlock 8056d59a-eb0b-4955-a84b-05ca945788e5 rendered at 2025-11-07T11:25:02.585Z
index-8BhA2GNT.js:26 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T11:25:02.587Z
index-8BhA2GNT.js:26 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T11:25:02.590Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 ExpandedView: Initial load period complete, enabling saves
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['data'] for block: e6050e22
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: e6050e22
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'e6050e22...', updates: Array(1), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', position: 3, contentLength: 126, contentPreview: '{"milestone":"","issues":[{"id":"issue-1762514704558","title":"","description":"","code":"","status"'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'e6050e22...', action: 'UPDATE', blockType: 'issue-tracker', position: 3, contentLength: 126}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', action: 'UPDATE', blockType: 'issue-tracker', position: 3, contentLength: 126, …}
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] issue-trackerBlock e6050e22 - Props changed: data
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['data'] for block: e6050e22
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: e6050e22
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'e6050e22...', updates: Array(1), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', type: 'issue-tracker', position: 3, contentLength: 225, contentPreview: '{"milestone":"","issues":[{"id":"issue-1762514704558","title":"","description":"","code":"","status"'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'e6050e22...', action: 'UPDATE', blockType: 'issue-tracker', position: 3, contentLength: 225}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', action: 'UPDATE', blockType: 'issue-tracker', position: 3, contentLength: 225, …}
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'e6050e22-f989-4a99-b8e4-08a869bcb376', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] issue-trackerBlock e6050e22 - Props changed: data
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 2
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 📌 HeadingBlock 3913b055-3a24-4b89-9e37-fd5fd26d003c rendered at 2025-11-07T11:25:06.582Z
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:106 [Violation] 'click' handler took 564ms
[Violation] Forced reflow while executing JavaScript took 562ms
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: (2) ['content', 'level'] for block: c2b04e51
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: c2b04e51
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'c2b04e51...', updates: Array(3), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', type: 'heading', position: 4, contentLength: 4, contentPreview: 'ssds'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'c2b04e51...', action: 'UPDATE', blockType: 'heading', position: 4, contentLength: 4}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', action: 'UPDATE', blockType: 'heading', position: 4, contentLength: 4, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] headingBlock c2b04e51 - Props changed: content
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 📌 HeadingBlock 625a6b17-29d0-4344-88c1-4a3d31bcf39f rendered at 2025-11-07T11:25:12.994Z
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['data'] for block: b3ad1337
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: b3ad1337
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'b3ad1337...', updates: Array(1), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', type: 'issue-tracker', position: 6, contentLength: 126, contentPreview: '{"milestone":"","issues":[{"id":"issue-1762514713835","title":"","description":"","code":"","status"'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'b3ad1337...', action: 'UPDATE', blockType: 'issue-tracker', position: 6, contentLength: 126}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', action: 'UPDATE', blockType: 'issue-tracker', position: 6, contentLength: 126, …}
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] issue-trackerBlock b3ad1337 - Props changed: data
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 4
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 📝 TextBlock c7e37789-94e2-44b5-8322-d38a384c0f3a rendered at 2025-11-07T11:25:14.918Z
index-8BhA2GNT.js:26 🌆 ImageBlock 74c06498-619d-4603-9a28-82dddd036498 rendered at 2025-11-07T11:25:14.989Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'beed1bab-b6be-4a92-9acf-d196564e475d', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 4, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 4, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: (2) ['content', 'level'] for block: 3913b055
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: 3913b055
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: '3913b055...', updates: Array(3), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', type: 'heading', position: 7, contentLength: 2, contentPreview: 'sd'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: '3913b055...', action: 'UPDATE', blockType: 'heading', position: 7, contentLength: 2}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '3913b055-3a24-4b89-9e37-fd5fd26d003c', action: 'UPDATE', blockType: 'heading', position: 7, contentLength: 2, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] headingBlock 3913b055 - Props changed: content
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 5
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['data'] for block: b5aad7c4
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: b5aad7c4
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'b5aad7c4...', updates: Array(1), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', type: 'table', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', type: 'table', position: 8, contentLength: 170, contentPreview: '{"data":{"headers":["Column 1","Column 2","Column 3"],"rows":[["","",""],["","",""],["","",""],["","'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'b5aad7c4...', action: 'UPDATE', blockType: 'table', position: 8, contentLength: 170}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', action: 'UPDATE', blockType: 'table', position: 8, contentLength: 170, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCK-MEMO] tableBlock b5aad7c4 - Props changed: data
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 6
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 🌆 ImageBlock 74c06498-619d-4603-9a28-82dddd036498 rendered at 2025-11-07T11:25:22.815Z
index-8BhA2GNT.js:26 🤖 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 rendered at 2025-11-07T11:25:22.892Z
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 6, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 📁 FileTreeBlock 0f399d33-7bd9-4410-99bc-8256cf56b055 rendered at 2025-11-07T11:25:23.951Z
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['data'] for block: b5aad7c4
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: b5aad7c4
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 18/19 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: 'b5aad7c4...', updates: Array(1), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', type: 'table', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', type: 'table', position: 8, contentLength: 200, contentPreview: '{"data":{"headers":["Column 1","Column 2","Column 3","Column 4"],"rows":[["","","",""],["","","",""]'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: 'b5aad7c4...', action: 'UPDATE', blockType: 'table', position: 8, contentLength: 200}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', action: 'UPDATE', blockType: 'table', position: 8, contentLength: 200, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 19 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 18/19 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] tableBlock b5aad7c4 - Props changed: data
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 7
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 📝 TextBlock 16821353-2e82-48c1-a3dd-d61f0c0ea77d rendered at 2025-11-07T11:25:25.279Z
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:25.352Z
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:25.902Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: '1dd8b9f2-9ae6-4ce1-a3a3-7c0eb351ac76', hasData: false, milestone: undefined, issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 🔚 AIBlock 88942c3d-61a9-4b28-8019-6288f1ac8127 unmounted
index-8BhA2GNT.js:26 📁 FileTreeBlock 1f158182-1532-4d71-a8ea-89f3aff03e6d rendered at 2025-11-07T11:25:26.330Z
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 7, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: '0d685294-2b98-4cdb-a9ac-43030be52ff7', type: 'table', position: 19, created_at: 1762514728487}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '0d685294-2b98-4cdb-a9ac-43030be52ff7', type: 'table', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '0d685294-2b98-4cdb-a9ac-43030be52ff7', type: 'table', position: 19, contentLength: 96, contentPreview: '{"data":{"headers":["Column 1","Column 2"],"rows":[["",""]],"columnAlignments":["left","left"]}}'}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '0d685294-2b98-4cdb-a9ac-43030be52ff7', action: 'CREATE', blockType: 'table', position: 19, contentLength: 96, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 20 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 8/20 blocks same
index-8BhA2GNT.js:26 📝 TextBlock 16821353-2e82-48c1-a3dd-d61f0c0ea77d rendered at 2025-11-07T11:25:28.509Z
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:28.510Z
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:28.512Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 8
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 📁 FileTreeBlock 1f158182-1532-4d71-a8ea-89f3aff03e6d rendered at 2025-11-07T11:25:28.596Z
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 8, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 8, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 8, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: '1ba95133-2086-4f49-8f47-727c7f557896', type: 'heading', position: 20, created_at: 1762514731020}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '1ba95133-2086-4f49-8f47-727c7f557896', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '1ba95133-2086-4f49-8f47-727c7f557896', type: 'heading', position: 20, contentLength: 0, contentPreview: ''}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '1ba95133-2086-4f49-8f47-727c7f557896', action: 'CREATE', blockType: 'heading', position: 20, contentLength: 0, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 21 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 20/21 blocks same
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:31.044Z
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:31.047Z
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:31.050Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 9
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 📁 FileTreeBlock 1f158182-1532-4d71-a8ea-89f3aff03e6d rendered at 2025-11-07T11:25:31.146Z
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 9, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: ['isNew'] for block: 1ba95133
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: 1ba95133
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 20/21 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: '1ba95133...', updates: Array(3), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '1ba95133-2086-4f49-8f47-727c7f557896', type: 'heading', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '1ba95133-2086-4f49-8f47-727c7f557896', type: 'heading', position: 20, contentLength: 0, contentPreview: ''}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: '1ba95133...', action: 'UPDATE', blockType: 'heading', position: 20, contentLength: 0}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '1ba95133-2086-4f49-8f47-727c7f557896', action: 'UPDATE', blockType: 'heading', position: 20, contentLength: 0, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 21 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 20/21 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] headingBlock 1ba95133 - PREVENTED
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 10
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 10, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 10, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 10, syncing: false, lastSync: 1762514702441, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', type: 'code', position: 21, created_at: 1762514733527}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', type: 'code', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', type: 'code', position: 21, contentLength: 0, contentPreview: ''}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', action: 'CREATE', blockType: 'code', position: 21, contentLength: 0, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 22 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 21/22 blocks same
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:33.551Z
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:33.553Z
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:33.555Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:33.556Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 11
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏰ Max interval reached (30s), calling throttledSync
index-8BhA2GNT.js:26 SmartSync: Syncing 11 changes
index-8BhA2GNT.js:26 SmartSync: Changes being sent: (11) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
index-8BhA2GNT.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-8BhA2GNT.js:26 📁 FileTreeBlock 1f158182-1532-4d71-a8ea-89f3aff03e6d rendered at 2025-11-07T11:25:33.663Z
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 SmartSync: RPC response: {total: 11, errors: Array(0), success: true, processed: 11, timestamp: 1762514734635.783}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 11,
  "errors": [],
  "success": true,
  "processed": 11,
  "timestamp": 1762514734635.783
}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-8BhA2GNT.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 1: {action: 'UPDATE', block_id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', block_type: 'issue-tracker', position: 3, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 2: {action: 'UPDATE', block_id: 'e6050e22-f989-4a99-b8e4-08a869bcb376', block_type: 'issue-tracker', position: 3, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 3: {action: 'UPDATE', block_id: 'c2b04e51-94bf-4642-85f6-f563bc8b3e52', block_type: 'heading', position: 4, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 4: {action: 'UPDATE', block_id: 'b3ad1337-a73a-42e3-a744-41fc2871ca1a', block_type: 'issue-tracker', position: 6, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 5: {action: 'UPDATE', block_id: '3913b055-3a24-4b89-9e37-fd5fd26d003c', block_type: 'heading', position: 7, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 6: {action: 'UPDATE', block_id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', block_type: 'table', position: 8, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 7: {action: 'UPDATE', block_id: 'b5aad7c4-7b1b-44e6-bd74-1a393588e411', block_type: 'table', position: 8, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 8: {action: 'CREATE', block_id: '0d685294-2b98-4cdb-a9ac-43030be52ff7', block_type: 'table', position: 19, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 9: {action: 'CREATE', block_id: '1ba95133-2086-4f49-8f47-727c7f557896', block_type: 'heading', position: 20, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 10: {action: 'UPDATE', block_id: '1ba95133-2086-4f49-8f47-727c7f557896', block_type: 'heading', position: 20, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 11: {action: 'CREATE', block_id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', block_type: 'code', position: 21, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-8BhA2GNT.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-8BhA2GNT.js:26 [SYNC-DEBUG] Changes that were sent: (11) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
index-8BhA2GNT.js:26 SmartSync: Successfully synced 11 changes
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 FileTreeBlock memo: PREVENTED
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: (3) ['language', 'filePath', 'isNew'] for block: 4c1c186b
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: 4c1c186b
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 21/22 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: '4c1c186b...', updates: Array(4), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', type: 'code', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', type: 'code', position: 21, contentLength: 0, contentPreview: ''}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: '4c1c186b...', action: 'UPDATE', blockType: 'code', position: 21, contentLength: 0}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', action: 'UPDATE', blockType: 'code', position: 21, contentLength: 0, …}
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:35.211Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 22 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 21/22 blocks same
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 1
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 [BLOCK-MEMO] codeBlock 4c1c186b - PREVENTED
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 1, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 1, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: 'a8e4acb2-6a65-4536-807b-f87f37927a21', type: 'issue-tracker', position: 22, created_at: 1762514736513}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: 'a8e4acb2-6a65-4536-807b-f87f37927a21', type: 'issue-tracker', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: 'a8e4acb2-6a65-4536-807b-f87f37927a21', type: 'issue-tracker', position: 22, contentLength: 28, contentPreview: '{"milestone":"","issues":[]}'}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', action: 'CREATE', blockType: 'issue-tracker', position: 22, contentLength: 28, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 23 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 22/23 blocks same
index-8BhA2GNT.js:26 🌆 ImageBlock 4a04a464-c27c-4d10-8453-21337c77deec rendered at 2025-11-07T11:25:36.535Z
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:36.536Z
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:36.538Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:36.539Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 2
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 2, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 2, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: '3a0547f7-708b-4cd6-a021-f06d7d30a279', type: 'table', position: 23, created_at: 1762514739705}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '3a0547f7-708b-4cd6-a021-f06d7d30a279', type: 'table', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '3a0547f7-708b-4cd6-a021-f06d7d30a279', type: 'table', position: 23, contentLength: 96, contentPreview: '{"data":{"headers":["Column 1","Column 2"],"rows":[["",""]],"columnAlignments":["left","left"]}}'}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '3a0547f7-708b-4cd6-a021-f06d7d30a279', action: 'CREATE', blockType: 'table', position: 23, contentLength: 96, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 24 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 23/24 blocks same
index-8BhA2GNT.js:26 📝 TextBlock f0528337-549f-4c42-ad9c-271d64fd0bf6 rendered at 2025-11-07T11:25:39.730Z
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:39.732Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:39.733Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 3
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 3, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 ExpandedView: Calling Smart Sync for new block: {id: '2aa205e7-ed97-415b-a345-c7616dcff936', type: 'text', position: 24, created_at: 1762514744613}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '2aa205e7-ed97-415b-a345-c7616dcff936', type: 'text', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '2aa205e7-ed97-415b-a345-c7616dcff936', type: 'text', position: 24, contentLength: 0, contentPreview: ''}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '2aa205e7-ed97-415b-a345-c7616dcff936', action: 'CREATE', blockType: 'text', position: 24, contentLength: 0, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 25 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 24/25 blocks same
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:44.635Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:44.636Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:44.638Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:44.681Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:44.684Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:44.686Z
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 4
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [BLOCK-UPDATE-DEBUG] Changed keys: (4) ['content', 'tags', 'isNew', 'metadata'] for block: 2aa205e7
index-8BhA2GNT.js:26 [BLOCK-UPDATE] Changes detected, updating block: 2aa205e7
index-8BhA2GNT.js:26 [BLOCK-REF-STABILITY] 24/25 blocks kept same reference
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 📥 Block update received: {blockId: '2aa205e7...', updates: Array(4), needsSave: true, smartSyncExists: true}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize INPUT: {id: '2aa205e7-ed97-415b-a345-c7616dcff936', type: 'text', hasContent: true, hasMessages: false, hasImages: false, …}
index-8BhA2GNT.js:26 🔍 BlockSerializer.serialize OUTPUT: {id: '2aa205e7-ed97-415b-a345-c7616dcff936', type: 'text', position: 24, contentLength: 3, contentPreview: 'sds'}
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] 🚀 Calling SmartSync.handleChange with: {blockId: '2aa205e7...', action: 'UPDATE', blockType: 'text', position: 24, contentLength: 3}
index-8BhA2GNT.js:26 🚀 SmartSync.handleChange INPUT: {blockId: '2aa205e7-ed97-415b-a345-c7616dcff936', action: 'UPDATE', blockType: 'text', position: 24, contentLength: 3, …}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.288Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.289Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.291Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.321Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.323Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.325Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.358Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.360Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.368Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.408Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.410Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.412Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
[Violation] Forced reflow while executing JavaScript took 44ms
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.458Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.460Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.463Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:46.497Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:46.500Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:46.503Z
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 4, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 4, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Blocks array updated: 25 blocks
index-8BhA2GNT.js:26 [BLOCKS-MEMO] Block reference stability: 24/25 blocks same
index-8BhA2GNT.js:26 [BLOCK-MEMO] textBlock 2aa205e7 - Props changed: content
index-8BhA2GNT.js:26 [SYNC-QUEUE-ADD] ✅ Change added to queue, size now: 5
index-8BhA2GNT.js:26 [SYNC-SCHEDULE] ⏳ Have changes, calling debouncedSync (5s debounce)
index-8BhA2GNT.js:26 [SYNC-CHANGE-RECEIVED] ✅ handleChange completed successfully
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:48.225Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:48.226Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:48.228Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:49.508Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:49.510Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:49.512Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 5, syncing: false, lastSync: 1762514733955, online: true}
index-8BhA2GNT.js:26 SmartSync: Syncing 5 changes
index-8BhA2GNT.js:26 SmartSync: Changes being sent: (5) [{…}, {…}, {…}, {…}, {…}]
index-8BhA2GNT.js:26 SmartSync: Current user ID: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-8BhA2GNT.js:26 SmartSync: RPC response: {total: 5, errors: Array(0), success: true, processed: 5, timestamp: 1762514752630.825}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Full RPC Response: {
  "total": 5,
  "errors": [],
  "success": true,
  "processed": 5,
  "timestamp": 1762514752630.825
}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Blocks should now be in database for document: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [SYNC-DEBUG] === CRITICAL FIELDS SENT TO RPC ===
index-8BhA2GNT.js:26 [SYNC-DEBUG] RPC Function needs block_type and position to save properly!
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 1: {action: 'UPDATE', block_id: '4c1c186b-9349-4fda-bad8-0f56e7ddea13', block_type: 'code', position: 21, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 2: {action: 'CREATE', block_id: 'a8e4acb2-6a65-4536-807b-f87f37927a21', block_type: 'issue-tracker', position: 22, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 3: {action: 'CREATE', block_id: '3a0547f7-708b-4cd6-a021-f06d7d30a279', block_type: 'table', position: 23, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 4: {action: 'CREATE', block_id: '2aa205e7-ed97-415b-a345-c7616dcff936', block_type: 'text', position: 24, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] Change 5: {action: 'UPDATE', block_id: '2aa205e7-ed97-415b-a345-c7616dcff936', block_type: 'text', position: 24, has_type: true, …}
index-8BhA2GNT.js:26 [SYNC-DEBUG] === END CRITICAL FIELDS ===
index-8BhA2GNT.js:26 [SYNC-DEBUG] NOTE: If block_type or position is missing, blocks will not persist!
index-8BhA2GNT.js:26 [SYNC-DEBUG] Changes that were sent: (5) [{…}, {…}, {…}, {…}, {…}]
index-8BhA2GNT.js:26 SmartSync: Successfully synced 5 changes
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] 📋 Document Loading Strategy
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Document ID: 91183c04-4294-4967-a85c-45618b98e044
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Block count: unknown
index-8BhA2GNT.js:26 [VIRT-DEBUG-0] Using: OPTIMIZED loader (<50 blocks)
index-8BhA2GNT.js:26 📌 HeadingBlock 1ba95133-2086-4f49-8f47-727c7f557896 rendered at 2025-11-07T11:25:52.970Z
index-8BhA2GNT.js:26 💻 CodeBlock 4c1c186b-9349-4fda-bad8-0f56e7ddea13 rendered at 2025-11-07T11:25:52.971Z
index-8BhA2GNT.js:26 📝 TextBlock 2aa205e7-ed97-415b-a345-c7616dcff936 rendered at 2025-11-07T11:25:52.974Z
index-8BhA2GNT.js:26 🎯 IssueTrackerBlock initialization: {blockId: 'a8e4acb2-6a65-4536-807b-f87f37927a21', hasData: true, milestone: '', issuesCount: 0, rawBlock: {…}}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}
index-8BhA2GNT.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1762514751836, online: true}


---

## 🔍 NEW DEBUGGING ROUND: Remaining Issues

### Issue 1: Hover + Buttons Don't Work
**Status**: 🔍 Investigating

**Debug logs added**:
- `[ADD-BELOW-DEBUG]` in handleAddBelowBlock
- `[INLINE-ADD-DEBUG]` in handleInlineBlockAdd

**Test instructions**:
1. Restart dev server: `npm run dev`
2. Hover between two blocks
3. Click the + button
4. Watch console for these logs
5. Paste the console output here

### Issue 2: TextBlock Focus/Blur Problem
**Status**: 🔍 Need more details

**Symptom reported**: "when i try to click on it write and come back into the blur state"

**Need clarification**:
- What exactly happens? Does focus get stuck? Does it lose focus immediately?
- What are the exact steps to reproduce?
- Does this happen every time or intermittently?

**Please describe the TextBlock issue in detail**:
1. Click inside a TextBlock - what happens?
2. Type some text - does it work?
3. Click outside - what happens?
4. Try to click back in - what happens?

**Also paste any console errors related to TextBlock here**.

---

## 📋 Current Status

✅ **FIXED**: Flickering when adding blocks via big + button
🔍 **INVESTIGATING**: Hover + buttons between blocks
🔍 **INVESTIGATING**: TextBlock focus/blur behavior

