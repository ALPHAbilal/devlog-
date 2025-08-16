# Testing Checklist for SaveCoordinator

## Pre-Testing Setup

- [ ] SaveCoordinator.js is integrated into the project
- [ ] Browser console is open to monitor logs
- [ ] Network tab is open to watch API calls
- [ ] Supabase dashboard is open to verify data

## 1. Debounce Testing (3-second delay)

### Test Steps:
1. Open a document with multiple blocks
2. Start typing in a text block continuously
3. Watch the network tab - NO requests should fire while typing
4. Stop typing and wait exactly 3 seconds
5. Verify a single batch save request fires after 3 seconds

### Expected Results:
- [ ] No saves during continuous typing
- [ ] Single save request 3 seconds after stopping
- [ ] Console shows "Processing queue: X mutations"
- [ ] Status changes from "idle" → "saving" → "saved"

### Edge Cases:
- [ ] Type, wait 2 seconds, type again - should reset timer
- [ ] Type in multiple blocks quickly - should batch together

## 2. Blur Save Testing (immediate save)

### Test Steps:
1. Click into a text block
2. Type some content
3. Click outside the block (blur event)
4. Watch network tab for immediate save

### Expected Results:
- [ ] Save fires immediately on blur (not debounced)
- [ ] Status shows "saving" immediately
- [ ] No 3-second wait
- [ ] Console shows "Save completed"

### Edge Cases:
- [ ] Blur without changes - should NOT save
- [ ] Blur to another block - should save first block

## 3. Queue/Batch Testing

### Test Steps:
1. Rapidly edit 5+ different blocks
2. Make changes to each within 3 seconds
3. Wait for autosave to trigger
4. Check network request payload

### Expected Results:
- [ ] Single API call with array of all changes
- [ ] All block IDs present in payload
- [ ] Blocks saved in correct order
- [ ] Console shows "Processing queue: 5 mutations"

### Edge Cases:
- [ ] Edit same block multiple times - should only save once with latest content
- [ ] Edit 500+ blocks - should split into multiple batches

## 4. Retry Logic Testing

### Test Steps:
1. Open browser DevTools
2. Go to Network tab → Throttling → Offline
3. Make edits to several blocks
4. Wait for save attempt (will fail)
5. Go back online
6. Watch retry attempts

### Expected Results:
- [ ] First save attempt fails
- [ ] Console shows "Retry attempt 1 after 100ms"
- [ ] Console shows "Retry attempt 2 after 110ms" (exponential backoff)
- [ ] Eventually succeeds when online
- [ ] Status shows "error" then "saving" then "saved"

### Edge Cases:
- [ ] Stay offline for all 3 retries - should show final error
- [ ] Go online during retry - should succeed on next attempt

## 5. Dirty Tracking Testing

### Test Steps:
1. Make a change to block A
2. Check `getSaveCoordinator().isDirty()` - should be true
3. Wait for save to complete
4. Check `getSaveCoordinator().isDirty()` - should be false
5. Make same change again (no actual change)

### Expected Results:
- [ ] isDirty() returns true when changes pending
- [ ] isDirty() returns false after save
- [ ] Duplicate changes are prevented
- [ ] dirtyBlocks Set contains only unique block IDs

## 6. Status Indicator Testing

### Test Steps:
1. Watch the save status indicator in UI
2. Make a change and observe status changes
3. Verify each state displays correctly

### Expected Results:
- [ ] Shows "Saving..." during save
- [ ] Shows "All changes saved" when complete
- [ ] Shows "Save failed - retrying..." on error
- [ ] Transitions are smooth and visible

## 7. Performance Testing

### Test Steps:
1. Create document with 100+ blocks
2. Select all and paste large text
3. Monitor browser performance tab
4. Check memory usage

### Expected Results:
- [ ] No browser freeze during batch save
- [ ] Memory usage stays reasonable
- [ ] Save completes within 5 seconds
- [ ] No duplicate API calls

## 8. Concurrent Edit Testing

### Test Steps:
1. Open same document in two tabs
2. Make edits in both tabs rapidly
3. Verify both tabs save correctly
4. Check final state in database

### Expected Results:
- [ ] Both tabs save their changes
- [ ] No save conflicts or errors
- [ ] Last write wins (expected behavior)
- [ ] No infinite save loops

## 9. Error Recovery Testing

### Test Steps:
1. Modify Supabase URL to invalid value temporarily
2. Make edits
3. Fix Supabase URL
4. Make another edit

### Expected Results:
- [ ] Failed saves are re-queued
- [ ] New saves work after fixing config
- [ ] No data loss
- [ ] Error status displays correctly

## 10. Memory Leak Testing

### Test Steps:
1. Open Chrome DevTools → Memory tab
2. Take heap snapshot
3. Edit blocks for 5 minutes continuously
4. Take another heap snapshot
5. Compare snapshots

### Expected Results:
- [ ] No significant memory growth
- [ ] Mutations array doesn't grow infinitely
- [ ] dirtyBlocks Set clears properly
- [ ] No detached DOM nodes

## Production Readiness Checklist

### Monitoring
- [ ] Add error tracking (Sentry)
- [ ] Add save success metrics
- [ ] Monitor retry rates
- [ ] Track average save time

### Configuration
- [ ] AUTOSAVE_DELAY appropriate for use case
- [ ] MAX_RETRIES not too aggressive
- [ ] BATCH_SIZE optimized for your data

### Error Handling
- [ ] User-friendly error messages
- [ ] Fallback to localStorage on failure
- [ ] Manual save button as backup
- [ ] Clear error recovery path

### Documentation
- [ ] Team knows how SaveCoordinator works
- [ ] Debugging guide created
- [ ] Common issues documented
- [ ] Rollback procedure defined

## Sign-off

- [ ] All basic tests pass
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] No memory leaks
- [ ] Error handling robust
- [ ] Ready for production

**Tested by**: _______________
**Date**: _______________
**Version**: _______________