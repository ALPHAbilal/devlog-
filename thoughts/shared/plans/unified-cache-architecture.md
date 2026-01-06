# Unified Cache Architecture Design

> **Goal**: Drastically reduce network calls with intelligent local-first sync.

**Created**: 2025-01-04
**Updated**: 2025-01-05 (Added RxDB as Option C)
**Status**: RESEARCH PHASE - Evaluating RxDB

---

## The Core Problem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHAT WE'RE ACTUALLY SOLVING                               │
└─────────────────────────────────────────────────────────────────────────────┘

CURRENT PROBLEM:
  • App opens → 3+ Supabase calls (documents, folders, cache check)
  • Page refresh → Same 3+ calls again
  • Navigate around → More calls
  • Edit content → Individual calls per change
  • ~150+ network calls per session

GOAL:
  • App opens → Read from local DB (instant, 0 network)
  • Background → Smart delta sync (only changes)
  • Edits → Queue locally, batch sync
  • ~10-15 network calls per session (90% reduction)
```

---

## Architecture Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         THREE PATHS FORWARD                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┬─────────────────────┬─────────────────────┐
│   OPTION A (DIY)    │  OPTION B (PowerSync)│   OPTION C (RxDB)   │
│   Current Path      │  Supabase Native     │  ⭐ EVALUATING      │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ Dexie + TanStack    │ PowerSync Cloud     │ RxDB + Supabase     │
│ + Custom Sync       │ + SQLite            │ Plugin              │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ ✅ Full control     │ ✅ Built for Supa   │ ✅ No external svc  │
│ ✅ No dependencies  │ ✅ Auto sync        │ ✅ Built-in sync    │
│ ❌ Build everything │ ❌ Monthly cost     │ ✅ Reactive queries │
│ ❌ Bug-prone        │ ❌ Vendor lock-in   │ ✅ Conflict resolve │
│ ❌ 2-3 weeks work   │ ✅ 1 week setup     │ ⚠️ Learning curve  │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

---

## Option C: RxDB Deep Dive (Under Evaluation)

### What is RxDB?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RxDB OVERVIEW                                   │
│                    https://rxdb.info                                         │
└─────────────────────────────────────────────────────────────────────────────┘

RxDB = Reactive Database for JavaScript Applications

Key Features:
  ├── Offline-First: Data lives locally, syncs when online
  ├── Reactive: Queries auto-update when data changes (like useLiveQuery)
  ├── Multi-Tab: Automatic sync between browser tabs
  ├── Replication: Built-in sync plugins for various backends
  ├── Schema-Based: JSON Schema validation
  ├── Encryption: Optional client-side encryption
  └── Storage Agnostic: Dexie, IndexedDB, Memory, etc.

Why Consider RxDB?
  • Handles sync logic we'd otherwise build ourselves
  • Battle-tested in production apps
  • Active development & community
  • Works with Supabase via replication plugin
```

### RxDB Architecture for Devlog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RxDB TARGET ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              Dashboard.jsx
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │     useRxCollection()       │
                    │   (RxDB React Hooks)        │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │         RxDatabase          │
                    │        (devlog-db)          │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │    RxCollections      │  │
                    │  │  • documents          │  │
                    │  │  • folders            │  │
                    │  │  • blocks             │  │
                    │  └───────────────────────┘  │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │  Replication Plugin   │  │
                    │  │  (Supabase Sync)      │  │
                    │  │                       │  │
                    │  │  • Pull: GET changes  │  │
                    │  │  • Push: POST changes │  │
                    │  │  • Checkpoint tracking│  │
                    │  │  • Conflict handling  │  │
                    │  └───────────────────────┘  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐          ┌──────────────────┐
         │  Dexie Storage   │          │    Supabase      │
         │  (local data)    │          │  (remote sync)   │
         └──────────────────┘          └──────────────────┘


REPLACES:
  ❌ TanStack Query (caching)     → RxDB handles reactivity
  ❌ Custom sync logic            → RxDB Replication Plugin
  ❌ useLiveQuery (Dexie)         → RxDB reactive queries
  ❌ SyncQueueManager             → RxDB handles offline queue
  ❌ SmartSync                    → RxDB replication

KEEPS:
  ✅ Dexie (as RxDB storage adapter)
  ✅ Supabase (as backend)
  ✅ React hooks pattern
```

### RxDB Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          RxDB DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

WRITE FLOW (User edits document):
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   User Action ──► RxCollection.upsert() ──► Local Storage (instant)        │
│                          │                                                  │
│                          ▼                                                  │
│               Replication Plugin detects change                             │
│                          │                                                  │
│                          ▼                                                  │
│               Online? ──YES──► Push to Supabase (background)               │
│                  │                                                          │
│                  NO                                                         │
│                  │                                                          │
│                  ▼                                                          │
│               Queue locally, sync when online                               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

READ FLOW (User opens app):
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   App Opens ──► RxCollection.find() ──► Local Storage ──► UI (instant!)    │
│                          │                                                  │
│                          ▼                                                  │
│               Replication checks: "Any changes since last sync?"           │
│                          │                                                  │
│                    ┌─────┴─────┐                                           │
│                    │           │                                            │
│                   YES          NO                                           │
│                    │           │                                            │
│                    ▼           ▼                                            │
│            Pull changes    Do nothing                                       │
│            (delta only)    (0 network!)                                     │
│                    │                                                        │
│                    ▼                                                        │
│            Merge into local ──► UI auto-updates (reactive)                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### RxDB Schema Definition

```typescript
// src/shared/db/rxdb-schema.ts

import { RxJsonSchema } from 'rxdb';

export const documentSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string' },
    title: { type: 'string' },
    folder_id: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
    is_favorite: { type: 'boolean' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    deleted_at: { type: ['string', 'null'] },
  },
  required: ['id', 'user_id', 'title', 'created_at', 'updated_at'],
  indexes: ['user_id', 'folder_id', 'updated_at']
};

export const folderSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string' },
    name: { type: 'string' },
    parent_id: { type: ['string', 'null'] },
    position: { type: 'number' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: ['id', 'user_id', 'name', 'created_at', 'updated_at'],
  indexes: ['user_id', 'parent_id']
};

export const blockSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    document_id: { type: 'string' },
    type: { type: 'string' },
    content: { type: ['string', 'object'] },
    position: { type: 'number' },
    metadata: { type: 'object' },
    created_at: { type: ['string', 'number'] },
    updated_at: { type: ['string', 'number'] },
  },
  required: ['id', 'document_id', 'type', 'position'],
  indexes: ['document_id', 'position']
};
```

### RxDB + Supabase Replication

```typescript
// src/shared/db/rxdb-supabase-sync.ts

import { replicateRxCollection } from 'rxdb/plugins/replication';
import { supabase } from '@/shared/api/supabase';

export function setupSupabaseReplication(collection: RxCollection) {
  const replicationState = replicateRxCollection({
    collection,
    replicationIdentifier: `supabase-${collection.name}`,

    // PULL: Fetch changes from Supabase
    pull: {
      async handler(lastCheckpoint, batchSize) {
        const minTimestamp = lastCheckpoint?.updated_at || '1970-01-01';

        const { data, error } = await supabase
          .from(collection.name)
          .select('*')
          .gt('updated_at', minTimestamp)    // Delta sync!
          .order('updated_at', { ascending: true })
          .limit(batchSize);

        if (error) throw error;

        return {
          documents: data,
          checkpoint: data.length > 0
            ? { updated_at: data[data.length - 1].updated_at }
            : lastCheckpoint
        };
      },
      batchSize: 100,
      modifier: doc => doc,  // Transform if needed
    },

    // PUSH: Send changes to Supabase
    push: {
      async handler(changeRows) {
        for (const row of changeRows) {
          if (row.assumedMasterState) {
            // UPDATE
            await supabase
              .from(collection.name)
              .upsert(row.newDocumentState);
          } else if (row.newDocumentState._deleted) {
            // DELETE
            await supabase
              .from(collection.name)
              .delete()
              .eq('id', row.newDocumentState.id);
          } else {
            // INSERT
            await supabase
              .from(collection.name)
              .insert(row.newDocumentState);
          }
        }
        return [];
      },
      batchSize: 10,
    },

    // Retry on failure
    retryTime: 5000,
    autoStart: true,
  });

  return replicationState;
}
```

### RxDB React Hooks Usage

```typescript
// src/features/document/hooks/use-documents-rxdb.ts

import { useRxCollection, useRxQuery } from 'rxdb-hooks';

export function useDocuments() {
  const collection = useRxCollection('documents');

  // Reactive query - auto-updates when data changes!
  const { result: documents, isFetching } = useRxQuery(
    collection?.find({
      selector: { deleted_at: null },
      sort: [{ updated_at: 'desc' }]
    })
  );

  const createDocument = async (doc: Partial<Document>) => {
    await collection?.insert({
      id: crypto.randomUUID(),
      ...doc,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    // No need to invalidate cache - RxDB reactivity handles it!
    // No need to call Supabase - Replication plugin handles it!
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    const doc = await collection?.findOne(id).exec();
    await doc?.patch({
      ...updates,
      updated_at: new Date().toISOString(),
    });
  };

  const deleteDocument = async (id: string) => {
    const doc = await collection?.findOne(id).exec();
    await doc?.patch({ deleted_at: new Date().toISOString() });
  };

  return {
    documents: documents || [],
    isLoading: isFetching,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
```

### What RxDB Gives Us For Free

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RxDB BUILT-IN FEATURES                                  │
│                  (Things we'd otherwise build ourselves)                     │
└─────────────────────────────────────────────────────────────────────────────┘

1. DELTA SYNC
   ├── Tracks checkpoint (last sync timestamp)
   ├── Only fetches records changed since checkpoint
   └── Reduces network calls by ~90%

2. OFFLINE QUEUE
   ├── Changes stored locally when offline
   ├── Auto-syncs when connection restored
   └── No data loss

3. CONFLICT RESOLUTION
   ├── Detects concurrent edits
   ├── Configurable strategies (last-write-wins, merge, etc.)
   └── Custom conflict handlers

4. REACTIVE QUERIES
   ├── UI auto-updates when data changes
   ├── No manual cache invalidation
   └── Like useLiveQuery but more powerful

5. MULTI-TAB SYNC
   ├── Changes in one tab appear in others
   ├── Uses BroadcastChannel API
   └── No extra code needed

6. COMPRESSION
   ├── Optional data compression
   ├── Reduces storage size
   └── Transparent to application

7. ENCRYPTION
   ├── Client-side encryption
   ├── Data encrypted at rest
   └── Useful for sensitive data

8. MIGRATION
   ├── Schema versioning
   ├── Automatic data migration
   └── Handles schema changes gracefully
```

---

## Comparison: DIY vs RxDB

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FEATURE COMPARISON                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────┬───────────────────┐
│ Feature                 │ DIY (Current)     │ RxDB              │
├─────────────────────────┼───────────────────┼───────────────────┤
│ Delta Sync              │ Build ourselves   │ ✅ Built-in       │
│ Offline Queue           │ Build ourselves   │ ✅ Built-in       │
│ Conflict Resolution     │ Build ourselves   │ ✅ Built-in       │
│ Reactive Queries        │ useLiveQuery      │ ✅ Better API     │
│ Multi-Tab Sync          │ Build ourselves   │ ✅ Built-in       │
│ Schema Validation       │ Zod (manual)      │ ✅ JSON Schema    │
│ Data Migration          │ Build ourselves   │ ✅ Built-in       │
├─────────────────────────┼───────────────────┼───────────────────┤
│ Bundle Size             │ ~50kb             │ ~150kb            │
│ Learning Curve          │ Low (familiar)    │ Medium            │
│ Control                 │ Full              │ High              │
│ Community               │ N/A               │ Active            │
│ Documentation           │ Our own           │ Extensive         │
├─────────────────────────┼───────────────────┼───────────────────┤
│ Time to Implement       │ 2-3 weeks         │ 1 week            │
│ Maintenance Burden      │ High              │ Low               │
│ Bug Risk                │ High              │ Lower             │
└─────────────────────────┴───────────────────┴───────────────────┘
```

---

## Network Call Reduction (The Real Goal)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NETWORK OPTIMIZATION COMPARISON                           │
└─────────────────────────────────────────────────────────────────────────────┘

CURRENT STATE (Wasteful):
┌────────────────────────────────────────────────────────────────────────────┐
│ Action               │ Network Calls │ Notes                               │
├──────────────────────┼───────────────┼─────────────────────────────────────┤
│ App opens            │ 3+            │ docs + folders + cache check        │
│ Page refresh         │ 3+            │ Same calls again                    │
│ Navigate to doc      │ 1-2           │ Fetch doc + blocks                  │
│ Edit 10 blocks       │ 10            │ One call per edit                   │
│ Create document      │ 1             │ Insert call                         │
│ Switch tabs          │ 0-3           │ Depends on cache                    │
├──────────────────────┼───────────────┼─────────────────────────────────────┤
│ TYPICAL SESSION      │ ~150          │ Wasteful!                           │
└────────────────────────────────────────────────────────────────────────────┘

WITH RxDB:
┌────────────────────────────────────────────────────────────────────────────┐
│ Action               │ Network Calls │ Notes                               │
├──────────────────────┼───────────────┼─────────────────────────────────────┤
│ App opens            │ 0-1           │ Local first, delta sync if stale    │
│ Page refresh         │ 0             │ Read from local                     │
│ Navigate to doc      │ 0             │ Already in local DB                 │
│ Edit 10 blocks       │ 1             │ Batched push                        │
│ Create document      │ 0             │ Local + queue for sync              │
│ Switch tabs          │ 0             │ All local                           │
│ Background sync      │ 1-3           │ Periodic delta sync                 │
├──────────────────────┼───────────────┼─────────────────────────────────────┤
│ TYPICAL SESSION      │ ~10-15        │ 90% reduction!                      │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## RxDB Migration Path

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RxDB MIGRATION PHASES                                │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 0: Research & Prototype (CURRENT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] Read RxDB documentation thoroughly
  [ ] Build small prototype with Supabase
  [ ] Test replication with real data
  [ ] Evaluate bundle size impact
  [ ] Check React integration (rxdb-hooks)

PHASE 1: Setup RxDB Infrastructure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] Install dependencies:
      - rxdb
      - rxdb-hooks (React integration)
      - rxdb-plugin-dexie (storage)

  [ ] Create RxDB database setup:
      - src/shared/db/rxdb.ts
      - src/shared/db/rxdb-schema.ts
      - src/shared/db/rxdb-supabase-sync.ts

  [ ] Create RxDB provider for React

PHASE 2: Migrate Blocks (Already using Dexie)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] Convert BlockRepository to use RxCollection
  [ ] Replace useBlocks with RxDB hooks
  [ ] Replace SmartSync with RxDB replication
  [ ] Test thoroughly

PHASE 3: Migrate Documents & Folders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] Add documents collection
  [ ] Add folders collection
  [ ] Setup replication for both
  [ ] Update Dashboard.jsx to use RxDB
  [ ] Remove old hooks (usePaginatedDashboard, etc.)

PHASE 4: Cleanup
━━━━━━━━━━━━━━━━
  [ ] Remove TanStack Query (no longer needed)
  [ ] Remove old Dexie setup
  [ ] Remove custom sync code
  [ ] Update documentation
```

---

## RxDB Package Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RxDB PACKAGES TO INSTALL                             │
└─────────────────────────────────────────────────────────────────────────────┘

Core:
  npm install rxdb

React Hooks:
  npm install rxdb-hooks

Storage (use Dexie, which we already have):
  npm install rxdb-plugin-dexie

Replication (for Supabase sync):
  Built into rxdb core

Optional:
  npm install rxdb-plugin-dev-mode    # Dev warnings
  npm install rxdb-plugin-encryption  # Client-side encryption

Bundle Impact:
  ┌────────────────────────────────────────┐
  │ Package           │ Size (gzip)        │
  ├───────────────────┼────────────────────┤
  │ rxdb core         │ ~50kb              │
  │ rxdb-hooks        │ ~5kb               │
  │ dexie plugin      │ ~10kb              │
  │ replication       │ ~15kb              │
  ├───────────────────┼────────────────────┤
  │ TOTAL             │ ~80kb              │
  └────────────────────────────────────────┘

  Note: We can remove TanStack Query (~30kb) and custom sync code,
        so net increase is ~50kb for much more functionality.
```

---

## Research Links

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESEARCH RESOURCES                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Official Documentation:
  • RxDB Docs: https://rxdb.info/
  • React Integration: https://rxdb.info/react-database.html
  • Replication: https://rxdb.info/replication.html
  • Supabase Example: https://rxdb.info/replication-http.html

GitHub:
  • RxDB Repo: https://github.com/pubkey/rxdb
  • rxdb-hooks: https://github.com/cvara/rxdb-hooks
  • Examples: https://github.com/pubkey/rxdb/tree/master/examples

Community:
  • Discord: https://rxdb.info/chat
  • Stack Overflow: rxdb tag

Similar Implementations:
  • RxDB + Supabase: Search GitHub for examples
  • Offline-first patterns: Local-first software community
```

---

## Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECISION CRITERIA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Before committing to RxDB, validate:

┌─────────────────────────────────────┬──────────┬────────────────────────────┐
│ Criterion                           │ Weight   │ Status                     │
├─────────────────────────────────────┼──────────┼────────────────────────────┤
│ Works with Supabase                 │ CRITICAL │ [ ] Verify in prototype    │
│ React hooks available               │ HIGH     │ [✓] rxdb-hooks exists      │
│ Can use Dexie as storage            │ HIGH     │ [✓] Plugin available       │
│ Bundle size acceptable (<100kb)     │ MEDIUM   │ [✓] ~80kb                  │
│ Active maintenance                  │ HIGH     │ [✓] Regular releases       │
│ Good documentation                  │ MEDIUM   │ [✓] Extensive docs         │
│ TypeScript support                  │ HIGH     │ [✓] First-class            │
│ Handles our data model              │ CRITICAL │ [ ] Test with real schema  │
│ Performance acceptable              │ HIGH     │ [ ] Benchmark needed       │
└─────────────────────────────────────┴──────────┴────────────────────────────┘

NEXT STEP: Build prototype to validate CRITICAL items
```

---

## Current Application Layout (Reference)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEVLOG APPLICATION LAYOUT                            │
│                     (Tab-Based, No Dashboard Cards)                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ [Green Accent Line]                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Tab Bar] ─ [Doc 1] ─ [Doc 2] ─ [+]                          (TabBar.jsx)   │
├──────────────┬──────────────────────────────────────────────────────────────┤
│   Activity   │                                                               │
│     Bar      │             Main Content Area                                │
│  ┌────────┐  │                                                               │
│  │ Search │  │   ┌──────────────────────────────────────────────────────┐   │
│  │Explorer│  │   │        DocumentEditor (active tab)                   │   │
│  │ Recent │  │   │              OR                                      │   │
│  │Favorite│  │   │        EmptyState (no tabs open)                     │   │
│  │ Inbox  │  │   │                                                      │   │
│  └────────┘  │   │   - HeaderControls                                   │   │
│              │   │   - BlockListView                                    │   │
│  ┌────────┐  │   │   - TagManager                                       │   │
│  │Explorer│  │   │   - BacklinksSection                                 │   │
│  │ View   │  │   │                                                      │   │
│  │        │  │   └──────────────────────────────────────────────────────┘   │
│  │Folders │  │                                                               │
│  │ ├─Doc1 │  │                                                               │
│  │ └─Doc2 │  │                                                               │
│  │        │  │                                                               │
│  │ Doc3   │  │                                                               │
│  │ Doc4   │  │                                                               │
│  └────────┘  │                                                               │
│              │                                                               │
│  [Settings]  │                                                               │
└──────────────┴──────────────────────────────────────────────────────────────┘

COMPONENTS:
  Dashboard.jsx          = Main container, loads data, manages state
  SidebarEnhanced.jsx    = Sidebar container with ActivityBar
  ExplorerView.jsx       = Tree view of folders/documents
  DocumentEditor.tsx     = Document editing (uses useBlocks)
  TabBar.jsx             = Tab management
  EmptyState.jsx         = Shown when no document open
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SUMMARY                                         │
└─────────────────────────────────────────────────────────────────────────────┘

CURRENT STATUS: Evaluating RxDB as Option C

PRIMARY GOAL: Reduce network calls by ~90%

WHY RxDB:
  • Built-in sync with delta/checkpoint tracking
  • Offline-first with automatic queue
  • Conflict resolution handled
  • No external service dependency
  • Active development, good docs

NEXT STEPS:
  1. Deep research on RxDB documentation
  2. Build small prototype with Supabase
  3. Validate data model compatibility
  4. Benchmark performance
  5. Make final decision

ALTERNATIVE IF RxDB DOESN'T FIT:
  • Fall back to DIY approach (Option A)
  • Or evaluate PowerSync (Option B) if budget allows
```

---

*Architecture Design - Evaluating RxDB for Intelligent Sync*
*Last Updated: 2025-01-05*
