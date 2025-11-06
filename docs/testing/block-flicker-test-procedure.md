# Block Flickering Performance Test

## Setup
1. Open browser DevTools console
2. Navigate to a document with 50+ blocks
3. Clear console
4. Run: `window.BLOCK_RENDER_COUNTS = {}`

## Test Procedure

### Test 1: Typing Test
1. Click in any TextBlock
2. Type continuously for 10 seconds
3. Stop typing
4. Wait 5 seconds for sync to complete
5. Check console for `[PERF]` logs
6. Count total renders per block

**Expected Result**:
- Edited block: 10+ renders (one per keystroke)
- Other blocks: 0-2 renders maximum
- **BEFORE FIX**: All visible blocks render 10+ times
- **AFTER FIX**: Only edited block renders

### Test 2: Rapid Editing Test
1. Create 3 new blocks quickly
2. Edit each one briefly
3. Delete one block
4. Drag-drop a block
5. Check console logs

**Expected Result**:
- Only directly manipulated blocks re-render
- Blocks not being edited: 0 renders
- **BEFORE FIX**: All blocks flicker on every action
- **AFTER FIX**: Surgical updates only

### Test 3: Sync Indicator Test
1. Type in a block
2. Watch sync indicator change: Saved → Pending → Syncing → Saved
3. Check if other blocks flicker during indicator updates

**Expected Result**:
- Sync indicator updates smoothly every 1 second
- NO blocks re-render when indicator changes
- **BEFORE FIX**: All blocks flicker every second
- **AFTER FIX**: Zero block re-renders from indicator

## Success Metrics

**PASS Criteria**:
- Edited block: 1 render per content change ✓
- Unedited blocks: 0-1 renders during entire test ✓
- Sync indicator: Updates independently without causing re-renders ✓
- No visible flicker during typing ✓

**FAIL Criteria**:
- Any unedited block renders more than twice
- Visible flicker during typing
- Sync indicator doesn't update or updates incorrectly
