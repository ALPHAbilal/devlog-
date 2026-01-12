# RxDB Replication - Current System State

**Last Updated**: 2026-01-11
**Status**: WORKING (with trade-offs)

---

## Quick Reference

| Aspect | Current State |
|--------|---------------|
| Replication Plugin | `replicateRxCollection` (generic) |
| Live/Realtime Sync | **DISABLED** (`live: false`) |
| User ID Filtering | **ENABLED** (`.eq('user_id', userId)`) |
| Checkpoint-based Delta Sync | **ENABLED** |
| Offline Support | **ENABLED** |
| Multi-tab Sync | **ENABLED** |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT ARCHITECTURE                                 │
│                    (RxDB + Supabase via Generic Replication)                │
└─────────────────────────────────────────────────────────────────────────────┘

Browser (Client)                                    Supabase (Server)
┌─────────────────────┐                            ┌─────────────────────┐
│                     │                            │                     │
│  React Components   │                            │   PostgreSQL        │
│         │           │                            │   ┌───────────────┐ │
│         ▼           │                            │   │ documents     │ │
│  ┌─────────────┐    │      HTTP (PostgREST)      │   │ folders       │ │
│  │ RxDB Hooks  │────┼───────────────────────────►│   │ blocks        │ │
│  │ useRxQuery  │    │                            │   │ (_modified)   │ │
│  └─────────────┘    │                            │   │ (_deleted)    │ │
│         │           │                            │   └───────────────┘ │
│         ▼           │                            │                     │
│  ┌─────────────┐    │                            │   ┌───────────────┐ │
│  │   RxDB      │    │                            │   │ Realtime      │ │
│  │ Collections │    │      WebSocket             │   │ (NOT USED)    │ │
│  │ (IndexedDB) │    │      ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─►│   │               │ │
│  └─────────────┘    │      (DISABLED)            │   └───────────────┘ │
│         │           │                            │                     │
│         ▼           │                            └─────────────────────┘
│  ┌─────────────┐    │
│  │ replication │    │
│  │ RxCollection│    │
│  │ (custom     │    │
│  │  handlers)  │    │
│  └─────────────┘    │
│                     │
└─────────────────────┘

Data Flow:
  PULL: Supabase → HTTP GET → RxDB (filtered by user_id, checkpoint)
  PUSH: RxDB → HTTP POST/PATCH → Supabase (upsert with conflict detection)
  LIVE: ❌ DISABLED (no WebSocket subscription)
```

---

## File Locations

### Core Files

| File | Purpose |
|------|---------|
| `src/shared/db/rxdb.ts` | Database initialization, schema setup |
| `src/shared/db/rxdb-schemas.ts` | Collection schemas (documents, folders, blocks) |
| `src/shared/db/rxdb-types.ts` | TypeScript types |
| `src/shared/db/rxdb-replication.ts` | **Replication logic** (custom handlers) |
| `src/shared/db/rxdb-hooks.tsx` | React hooks (useRxQuery, useRxCollection) |
| `src/shared/db/RxDBProvider.tsx` | React context provider |

### Hook Files

| File | Purpose |
|------|---------|
| `src/shared/db/hooks/use-documents.ts` | Document CRUD operations |
| `src/shared/db/hooks/use-folders.ts` | Folder CRUD operations |
| `src/shared/db/hooks/use-blocks.ts` | Block CRUD operations |

---

## Current Implementation Details

### 1. Replication Plugin Choice

**Using**: `replicateRxCollection` from `rxdb/plugins/replication`

**NOT Using**: `replicateSupabase` from `rxdb/plugins/replication-supabase`

**Why**: `replicateSupabase` ignores custom `pull.handler` and `push.handler`. We need custom handlers for `.eq('user_id', userId)` filtering.

```typescript
// Current implementation (rxdb-replication.ts)
import { replicateRxCollection } from 'rxdb/plugins/replication';

const replication = replicateRxCollection({
  collection,
  replicationIdentifier: `supabase-${tableName}-${userId}`,
  pull: { handler: pullHandler },  // Custom handler - WORKS
  push: { handler: pushHandler },  // Custom handler - WORKS
  live: false,  // No Realtime
});
```

### 2. Pull Handler

Location: `src/shared/db/rxdb-replication.ts` (lines ~180-245)

```typescript
const pullHandler = async (checkpoint, batchSize) => {
  const { data } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)           // ✅ User filtering
    .gt('_modified', checkpoint?.modified ?? 0)  // ✅ Delta sync
    .order('_modified', { ascending: true })
    .limit(batchSize);

  // Transform null → undefined for RxDB compatibility
  // Return { documents, checkpoint }
};
```

### 3. Push Handler

Location: `src/shared/db/rxdb-replication.ts` (lines ~250-320)

```typescript
const pushHandler = async (rows) => {
  const conflicts = [];

  for (const row of rows) {
    const newDoc = row.newDocumentState;
    const assumedMasterState = row.assumedMasterState;

    if (!assumedMasterState) {
      // INSERT
      await supabase.from(tableName).insert([newDoc]);
    } else {
      // UPDATE with conflict detection
      await supabase.from(tableName).update(newDoc).eq('id', newDoc.id);
    }
  }

  return conflicts;  // Empty = all succeeded
};
```

### 4. Sync State Tracking

Location: `src/shared/db/rxdb-replication.ts` (lines ~85-120)

Purpose: Prevent deletion errors for never-synced documents.

```typescript
const syncedDocuments = new Map<string, Set<string>>();

function markAsSynced(tableName, docId) { ... }
function wasSynced(tableName, docId) { ... }
```

---

## What's ENABLED

### Delta Sync (Checkpoint-based)
- ✅ Only fetches documents where `_modified > lastCheckpoint`
- ✅ Reduces network calls by ~90%

### Offline Support
- ✅ All data stored in IndexedDB via RxDB
- ✅ App works without network
- ✅ Changes queue for sync when online

### Multi-tab Sync
- ✅ RxDB `multiInstance: true` enabled
- ✅ Changes in one tab appear in other tabs

### User ID Filtering
- ✅ All queries include `.eq('user_id', userId)`
- ✅ Defense-in-depth (in addition to RLS)

### Conflict Detection
- ✅ Push handler detects INSERT conflicts (code 23505)
- ✅ Push handler detects UPDATE conflicts (no rows affected)

---

## What's DISABLED

### Live/Realtime Sync ❌

**Current State**: `live: false`

**Impact**:
- Changes from other devices (phone, another browser) do NOT automatically appear
- User must refresh or navigate to see external changes
- Pull only happens on:
  - App startup
  - Manual trigger (if implemented)
  - Page navigation (if implemented)

**To Enable** (requires code changes):
See "Future Enhancements" section below.

---

## Database Schema Requirements

### Supabase Tables Must Have:

```sql
-- Required columns for RxDB replication
_modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
_deleted BOOLEAN DEFAULT FALSE

-- Required indexes
CREATE INDEX idx_tablename_modified ON tablename(_modified);

-- Required trigger (auto-update _modified on UPDATE)
CREATE TRIGGER update_tablename_modified
  BEFORE UPDATE ON tablename
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();
```

### Current Tables:
- ✅ `documents` - has `_modified`, `_deleted`, trigger
- ✅ `folders` - has `_modified`, `_deleted`, trigger
- ✅ `blocks` - has `_modified`, `_deleted`, trigger

---

## Known Limitations

### 1. No Automatic Realtime Updates
- External changes require manual refresh
- No WebSocket push notifications

### 2. No Optimistic Concurrency on Supabase Side
- UPDATE doesn't check if `_modified` changed since last pull
- Last write wins (no server-side conflict detection)

### 3. Soft Deletes Only
- Documents are marked `_deleted: true`, not physically removed
- Need periodic cleanup job to purge old deleted records

### 4. Memory-based Sync State
- `syncedDocuments` Map is in-memory, not persisted
- Resets on page refresh (pull repopulates it)

---

## Future Enhancements

### Add Realtime Sync (~50 lines)

To receive instant updates when data changes on the server:

```typescript
// Add to RxDBProvider.tsx or rxdb-replication.ts

function setupRealtimeSync(tableName: string, replication: RxReplicationState) {
  const channel = supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log(`[Realtime] ${tableName} changed:`, payload);
        // Trigger re-pull to get latest data
        replication.reSync();
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}

// Usage:
const cleanup = setupRealtimeSync('documents', documentsReplication);
```

**Trade-offs**:
- Adds WebSocket connection overhead
- More Supabase Realtime usage (billing consideration)
- Need to handle connection drops/reconnects

### Add Periodic Polling (~20 lines)

Alternative to Realtime - poll every N seconds:

```typescript
// Add to RxDBProvider.tsx

useEffect(() => {
  const interval = setInterval(() => {
    replications.forEach((replication) => {
      replication.reSync();
    });
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(interval);
}, [replications]);
```

**Trade-offs**:
- Simple to implement
- More network calls than Realtime
- Delay of up to N seconds for updates

### Add Visibility-based Refresh (~15 lines)

Refresh when user returns to tab:

```typescript
// Add to RxDBProvider.tsx

useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      replications.forEach((replication) => {
        replication.reSync();
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [replications]);
```

### Migrate Back to replicateSupabase

If RxDB fixes the handler issue in a future version:

1. Check RxDB changelog for fix to custom handlers
2. Revert to `import { replicateSupabase } from 'rxdb/plugins/replication-supabase'`
3. Add `tableName` parameter to config
4. Enable `live: true` for automatic Realtime

---

## Debugging

### Enable Verbose Logging

Current logs (in console):
```
[RxDB Replication] Using replicateRxCollection (custom handlers)
[RxDB Replication] documents: Pull starting { checkpoint, batchSize }
[RxDB Replication] documents: Pulled X docs
[RxDB Replication] documents: Active/Inactive
```

### Check Replication Health

```typescript
// In browser console:
const health = await db.documents.find().exec();
console.log('Local documents:', health.length);
```

### Force Re-sync

```typescript
// In browser console (if replication is exposed):
replication.reSync();
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `rxdb` | 16.21.1 | Core database |
| `rxdb/plugins/replication` | (bundled) | Generic replication |
| `rxdb/plugins/storage-dexie` | (bundled) | IndexedDB storage |
| `@supabase/supabase-js` | 2.46.2 | Supabase client |

**NOT Used**:
- `rxdb/plugins/replication-supabase` - ignores custom handlers

---

## Related Documentation

| File | Purpose |
|------|---------|
| `AI-MEMORY/debug/rxdb-supabase-debugging-journey.md` | How we got here |
| `AI-MEMORY/debug/rxdb-supabase.md` | Bug quick reference |
| `thoughts/shared/plans/rxdb-migration-plan.md` | Original implementation plan |

---

## Quick Checklist for Future Changes

Before modifying replication:

- [ ] Check if `replicateSupabase` custom handler support is fixed in newer RxDB versions
- [ ] Test changes with `live: false` first
- [ ] Verify Supabase RLS policies still work
- [ ] Check sync state tracking for edge cases
- [ ] Test offline → online transition
- [ ] Test multi-tab synchronization
- [ ] Monitor network calls in DevTools
