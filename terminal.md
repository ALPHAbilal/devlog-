# Debugging Session: Save Status Not Updating

## Round 1: Wide Net Discovery - Testing Instructions

I've added logging to track the complete save flow. Please follow these steps:

### Test Procedure

1. **Refresh the page** to get the new logging code
2. **Open DevTools Console** (F12)
3. **Open a document** with blocks
4. **Edit a text block** - type some new text
5. **Click outside the block** to blur/save it
6. **Watch the console** for 10 seconds

### What I'm Looking For

The logs will have these prefixes:
- `[SYNC-CHANGE-RECEIVED]` - Block edit triggered save
- `[SYNC-QUEUE-ADD]` - Change added to queue
- `[SYNC-SCHEDULE]` - Sync timing decision
- `[SYNC-STATUS-POLL]` - What getSyncStatus returns (every 1 second)
- `[SYNC-EXECUTE]` - When sync actually runs

### Expected Flow

When you edit a block, you should see:
```
[SYNC-CHANGE-RECEIVED] blockId=xyz... action=UPDATE
[SYNC-QUEUE-ADD] queue size now: 1
[SYNC-SCHEDULE] scheduled via: debouncedSync (5 seconds)
[SYNC-STATUS-POLL] {pending: 1, syncing: false, online: true}
... (repeats every 1 second for ~5 seconds)
[SYNC-EXECUTE] syncing 1 changes to Supabase
[SYNC-STATUS-POLL] {pending: 0, syncing: false, online: true}
```

### Paste Fresh Console Output Below

```
[Waiting for your console logs...]
```
