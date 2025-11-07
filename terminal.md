# Debugging Session: Virtualization Flickering on Block Addition

## 🎯 Current Status: Test 4 - Array Reference Fix Applied

### Latest Fix (2025-11-07)

**Problem Identified**:
Even though we preserved individual block references, using `.map()` created a NEW array reference every time, causing Virtuoso to re-render all items.

**Root Cause**:
```javascript
// ❌ BAD - Creates new array reference even when blocks unchanged
const newBlocks = prevBlocks.map(block =>
  block.id === blockId ? { ...block, ...updates } : block
);
```

**Solution Applied**:
```javascript
// ✅ GOOD - Direct mutation preserves all unchanged block references
const newBlocks = [...prevBlocks];
newBlocks[blockIndex] = updatedBlock;
```

**Files Modified**:
- `src/hooks/useOptimizedBlockLoader.js:190-258` (updateBlock function)
- `src/hooks/usePaginatedBlockLoader.js:191-259` (updateBlock function)

**Key Changes**:
1. Changed from `.map()` to direct array index mutation
2. Only creates new array when something actually changed
3. Preserves ALL unchanged block references (should show 41/42 instead of 0/42)

### Expected Test Results

**When Typing in TextBlock**:
```
[BLOCK-UPDATE-DEBUG] Changed keys: ['content'] for block: abc12345
[BLOCK-UPDATE] Changes detected, updating block: abc12345
[BLOCK-REF-STABILITY] 41/42 blocks kept same reference   ← Should be 41/42
[BLOCKS-MEMO] Block reference stability: 41/42 blocks same   ← KEY METRIC
```

**Symptoms That Should Be Fixed**:
1. ✅ No flickering when typing (focus/blur should work)
2. ✅ No flickering when clicking "+" buttons between blocks
3. ✅ No flickering when adding new blocks
4. ✅ "+" buttons between blocks should work correctly

### Test Instructions

1. **Open a document** with multiple blocks (10+ blocks recommended)

2. **Test Typing**:
   - Click in a TextBlock and type
   - Watch console for `[BLOCKS-MEMO] Block reference stability: X/Y blocks same`
   - Should show 41/42 (only the typed block changes)
   - Focus should NOT be lost while typing

3. **Test "+" Buttons**:
   - Hover between blocks to see "+" button
   - Click it - should open block type selector
   - Watch console for reference stability
   - Other blocks should NOT flicker

4. **Test Adding Blocks**:
   - Add a new block using any method
   - Watch console for reference stability
   - Should show 41/42 (all existing blocks preserved)
   - No flickering should occur

### Console Logs Reference

**Good Behavior** (What We Want to See):
```
[BLOCK-UPDATE] Changes detected, updating block: abc12345
[BLOCK-REF-STABILITY] 41/42 blocks kept same reference
[BLOCKS-MEMO] Blocks array updated: 42 blocks
[BLOCKS-MEMO] Block reference stability: 41/42 blocks same
```

**Bad Behavior** (What We Had Before):
```
[BLOCK-REF-STABILITY] 0/42 blocks kept same reference
[BLOCKS-MEMO] Block reference stability: 0/42 blocks same
```

---

## 🚀 Next Steps

**After Testing**:
1. If flickering is fixed → Mark as complete, document solution
2. If still flickering → Check if `loadedBlocks` itself is getting new reference
3. If "+" buttons don't work → Separate UI issue (CSS/event handlers)

**Please restart dev server and test!**

```bash
npm run dev
```

Then open a document and follow the test instructions above.
