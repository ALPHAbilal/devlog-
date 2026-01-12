# RxDB + Supabase Replication Debugging Journey

**Date**: 2026-01-11
**Status**: RESOLVED
**Duration**: ~2 hours of debugging

---

## The Problem

After refactoring the caching system to use RxDB with Supabase replication, documents weren't loading. The dashboard showed 0 documents despite having 392 documents, 100 folders, and 2519 blocks in Supabase.

---

## Error Timeline

### Error 1: `Cannot read properties of undefined (reading 'then')`

**Symptom**: App crashed on load with `.then()` error in Dashboard.

**Cause**: `useRxDocuments` hook methods (`loadInitial()`, `loadMore()`, `reset()`) returned `void` instead of `Promise`.

**Fix**: Added `return Promise.resolve()` to all methods.

**Files Changed**:
- `src/shared/db/hooks/use-documents.ts`
- `src/shared/db/hooks/use-folders.ts`

**Status**: FIXED

---

### Error 2: `406 Not Acceptable - PGRST116`

**Symptom**: Profiles query failed with "JSON object requested, multiple (or no) rows returned".

**Cause**: `.single()` expects exactly 1 row, but user had no profile yet.

**Fix**: Changed `.single()` to `.maybeSingle()`.

**Files Changed**:
- `src/app/providers/settings-provider.tsx`

**Status**: FIXED

---

### Error 3: `Cannot read properties of undefined (reading 'channel')`

**Symptom**: Replication started but immediately errored with 'channel' undefined.

**Cause**: RxDB's `replicateSupabase` plugin with `live: true` tried to use Supabase Realtime channels, but had issues with Realtime initialization.

**Temporary Fix**: Set `live: false` to disable Realtime and isolate the issue.

**Status**: BYPASSED (live mode disabled)

---

### Error 4: `Cannot read properties of undefined (reading 'from')` (RC_PULL)

**Symptom**: Replication showed "Active" then immediately threw RC_PULL error.

**Stack Trace**:
```
TypeError: Cannot read properties of undefined (reading 'from')
at Object.handler (index.js:832:22833)
at Object.masterChangesSince (index.js:832:17141)
```

**Investigation**:
1. Added debug logging - `supabase` client existed and had `.from()` method
2. Custom handler log `[RxDB Replication] documents: Pull starting` **NEVER appeared**
3. Stack trace showed `Object.handler` - the INTERNAL plugin handler, not our custom one

**Root Cause Discovery** (via expert research):

The `replicateSupabase` plugin from `rxdb/plugins/replication-supabase`:
1. **IGNORES** custom `pull.handler` and `push.handler` options
2. Only supports `pull.modifier` and `push.modifier` (data transformation, not custom logic)
3. Uses its own internal handler that requires `tableName` parameter
4. We never passed `tableName` to the config, so internal handler called `supabase.from(undefined)`

**Status**: ROOT CAUSE FOUND

---

## What We Tried (Didn't Work)

### Attempt 1: Arrow Functions for Closure Capture

**Theory**: The internal handler loses `supabaseClient` reference. Arrow functions would capture `supabase` in closure.

**Implementation**:
```typescript
const pullHandler = async (checkpoint, batchSize) => {
  // supabase captured in closure
  const { data } = await supabase.from(tableName).select('*');
  return { documents: data, checkpoint };
};

replicateSupabase({
  pull: { handler: pullHandler },  // <-- IGNORED!
});
```

**Result**: FAILED - Handler was never called. `replicateSupabase` ignores custom handlers entirely.

---

### Attempt 2: Add `tableName` to Config

**Theory**: The internal handler needs `tableName` to call `supabase.from(tableName)`.

**Problem**: Even with `tableName`, we couldn't add `.eq('user_id', userId)` filter because the internal handler controls the query.

**Result**: NOT ATTEMPTED - Wouldn't solve the user_id filter requirement.

---

## What Worked: Solution 2 - `replicateRxCollection`

**Decision**: Switch from `replicateSupabase` to `replicateRxCollection` (generic replication).

**Why**:
- `replicateRxCollection` **ACTUALLY CALLS** custom handlers
- Full control over the SQL query (can add `.eq('user_id', userId)`)
- Custom checkpoint logic

**Trade-off**: No automatic Supabase Realtime (must implement manually if needed).

### Final Implementation

**Import Change**:
```typescript
// Before (broken)
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';

// After (works)
import { replicateRxCollection } from 'rxdb/plugins/replication';
```

**Pull Handler** (same as before, now actually called):
```typescript
const pullHandler = async (checkpoint, batchSize) => {
  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)  // <-- We need this filter!
    .gt('_modified', checkpoint?.modified ?? 0)
    .order('_modified', { ascending: true })
    .limit(batchSize);

  return {
    documents: data || [],
    checkpoint: data?.length > 0
      ? { modified: data[data.length - 1]._modified }
      : checkpoint,
  };
};
```

**Push Handler** (updated for `replicateRxCollection` format):
```typescript
const pushHandler = async (rows) => {
  const conflicts = [];

  for (const row of rows) {
    const newDoc = row.newDocumentState;
    const assumedMasterState = row.assumedMasterState; // null = INSERT

    if (!assumedMasterState) {
      // INSERT
      const { error } = await supabase.from(tableName).insert([newDoc]);
      if (error?.code === '23505') conflicts.push(newDoc);
    } else {
      // UPDATE
      const { data } = await supabase
        .from(tableName)
        .update(newDoc)
        .eq('id', newDoc.id)
        .select();

      if (!data?.length) conflicts.push(newDoc);
    }
  }

  return conflicts; // Empty = all succeeded
};
```

**Replication Config**:
```typescript
const replication = replicateRxCollection({
  collection,
  replicationIdentifier: `supabase-${tableName}-${userId}`,
  pull: { batchSize, handler: pullHandler },
  push: { batchSize: 50, handler: pushHandler },
  live: false,
  retryTime: 5000,
  autoStart: true,
});
```

---

## Key Lessons Learned

### 1. `replicateSupabase` vs `replicateRxCollection`

| Feature | replicateSupabase | replicateRxCollection |
|---------|-------------------|----------------------|
| Custom `handler` | IGNORED | CALLED |
| Custom `modifier` | Supported | N/A (use handler) |
| User ID filter | NOT POSSIBLE | Full control |
| Realtime sync | Automatic | Manual |
| Checkpoint logic | Fixed | Customizable |

### 2. When to Use Which

**Use `replicateSupabase`** when:
- Simple sync without custom filters
- Don't need user-specific filtering
- Want automatic Realtime updates
- Only need data transformation (modifier)

**Use `replicateRxCollection`** when:
- Need `.eq('user_id', userId)` or other filters
- Need custom checkpoint logic
- Need full control over sync behavior
- Can live without automatic Realtime

### 3. Debugging Tips

1. **Check if custom handler is called**: Add a log at the start of your handler. If it never appears, the plugin is ignoring it.

2. **Check stack trace source**: `Object.handler` = internal plugin handler. Your function name = your handler.

3. **Verify supabase client**: Log `typeof supabase?.from` to confirm client is accessible.

4. **Read the docs carefully**: `modifier` ≠ `handler`. They have different purposes.

---

## Files Modified

| File | Change |
|------|--------|
| `src/shared/db/rxdb-replication.ts` | Switched to `replicateRxCollection`, updated handlers |
| `src/shared/db/hooks/use-documents.ts` | Added `return Promise.resolve()` |
| `src/shared/db/hooks/use-folders.ts` | Added `return Promise.resolve()` |
| `src/app/providers/settings-provider.tsx` | Changed `.single()` to `.maybeSingle()` |

---

## Verification

After fix, logs show:
```
[RxDB Replication] Using replicateRxCollection (custom handlers)
[RxDB Replication] documents: Pull starting { checkpoint: null, batchSize: 100 }
[RxDB Replication] documents: Pulled 0 docs  (already synced)
[DatabaseProvider] Replication health check: {documents: 101, folders: 100, replications: 3}
```

**Key Success Indicator**: `Pull starting` log appears - custom handler IS being called!

---

## References

- [RxDB Replication Documentation](https://rxdb.info/replication.html)
- [RxDB Supabase Plugin](https://rxdb.info/replication-supabase.html)
- [GitHub Issue #7513](https://github.com/pubkey/rxdb/issues/7513) - Known bugs in v16.21.1
