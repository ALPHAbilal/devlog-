# RxDB + Supabase Migration Guide
## React 19 Compatibility, Known Bugs & Data Migration Strategies

**Last Updated:** January 2025 | **Applies to:** RxDB 14.x, RxDB 15.0+ | **React:** 18.x & 19.x

---

## Table of Contents

1. [Part 1: rxdb-hooks React 19 Compatibility Issues](#part-1-rxdb-hooks-react-19-compatibility-issues)
2. [Part 2: replicateSupabase Plugin Known Bugs](#part-2-replicatesupbase-plugin-known-bugs)
3. [Part 3: Migrating IndexedDB Data to RxDB](#part-3-migrating-indexeddb-data-to-rxdb)

---

# Part 1: rxdb-hooks React 19 Compatibility Issues

## Current Status

| Aspect | Status | Details |
|--------|--------|---------|
| **rxdb-hooks Latest Version** | v5.0.2 (deprecated) | Last published a year ago; no active maintenance |
| **React 19 Support** | ❌ Not officially supported | Package hasn't been updated for React 19 |
| **React 18 Support** | ✅ Works | Compatible with React 18.x |
| **Recommendation** | ⚠️ Consider alternatives | Use manual hooks or maintained alternatives |

## Known Issues with React 19

### Issue 1: Old React Context API

**Problem:** rxdb-hooks uses the legacy React Context API that hasn't been optimized for React 19's new `use()` hook and Server Components.

```javascript
// OLD: rxdb-hooks approach (legacy Context)
import { Provider, useRxData } from 'rxdb-hooks';

export function App() {
  return (
    <Provider db={db}>
      <YourComponents />
    </Provider>
  );
}
```

**Impact:**
- Missing TypeScript support for React 19's new hooks
- No support for Server Component integration
- Manual child component re-renders not optimized

### Issue 2: Observable Subscription Management

**Problem:** rxdb-hooks doesn't leverage React 19's improved Suspense and async rendering.

```javascript
// The hooks create subscriptions using old Suspense patterns
// React 19's native Promise support isn't utilized
const { result, isFetching } = useRxData('documents', (col) => 
  col.find().where('status').equals('active')
);
```

**Impact:**
- Can't use React 19's `use()` hook for Promise unwrapping
- No native Suspense boundary integration
- Manual loading state management required

### Issue 3: TypeScript Support for React 19 Hooks

**Problem:** When upgrading to React 19, TypeScript definitions are incomplete:

```typescript
// ❌ TypeScript Error in React 19
import React from 'react';

const MyComponent: React.FC = () => {
  // React 19 new hooks types not recognized
  const promise = useRxData('collection', (col) => col.find());
};
```

**Solution:** Add React 19 type definitions:

```bash
npm install --save-exact react@19 react-dom@19 @types/react@19 @types/react-dom@19
```

Create `src/react-19.d.ts`:

```typescript
/// <reference types="react" />

declare namespace React {
  // Augment React types for rxdb-hooks in React 19 context
  function use<T>(promise: Promise<T> | null): T;
}
```

---

## Migration Strategies from rxdb-hooks

### Strategy 1: Switch to Direct RxDB Subscriptions (Recommended)

Replace rxdb-hooks with custom hooks using RxDB's observable API directly.

**Before (rxdb-hooks):**
```jsx
import { useRxData } from 'rxdb-hooks';

export function DocumentList() {
  const { result: documents, isFetching } = useRxData(
    'documents',
    (col) => col.find().where('status').equals('published')
  );

  return (
    <div>
      {isFetching && <p>Loading...</p>}
      {documents?.map(doc => <div key={doc.id}>{doc.title}</div>)}
    </div>
  );
}
```

**After (Custom Hooks):**
```jsx
import { useEffect, useState, useCallback } from 'react';
import { useRxDB } from 'rxdb-hooks'; // Still need Provider

// Custom hook replacing useRxData
function useRxQuery(collectionName, queryConstructor) {
  const db = useRxDB();
  const [result, setResult] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db) {
      setIsFetching(true);
      return;
    }

    const collection = db[collectionName];
    if (!collection) {
      setError(new Error(`Collection ${collectionName} not found`));
      setIsFetching(false);
      return;
    }

    // Build query if constructor provided
    const query = queryConstructor ? queryConstructor(collection) : collection.find();

    // Subscribe to query changes
    const subscription = query.$.subscribe({
      next: (docs) => {
        setResult(docs);
        setIsFetching(false);
      },
      error: (err) => {
        setError(err);
        setIsFetching(false);
      },
    });

    // Cleanup
    return () => subscription.unsubscribe();
  }, [db, collectionName, queryConstructor]);

  return { result, isFetching, error };
}

// Usage with React 19
export function DocumentList() {
  const { result: documents, isFetching } = useRxQuery(
    'documents',
    (col) => col.find({
      selector: { status: 'published' },
      sort: [{ createdAt: 'desc' }],
    })
  );

  return (
    <div>
      {isFetching && <p>Loading...</p>}
      {documents?.map(doc => <div key={doc.id}>{doc.title}</div>)}
    </div>
  );
}
```

**Advantages:**
- ✅ Works perfectly with React 19
- ✅ Full control over observable subscriptions
- ✅ Cleaner TypeScript types
- ✅ No dependency on unmaintained library

**Disadvantages:**
- ❌ Need to implement pagination yourself
- ❌ More boilerplate code for complex queries

### Strategy 2: Use React 19's `use()` Hook with RxDB Observables

React 19's `use()` hook can unwrap Promises AND Observables (converted to Promises).

**Implementation:**
```jsx
import { use, Suspense } from 'react';

// Convert RxDB observable to Promise for React 19's use()
function observableToPromise(observable) {
  return new Promise((resolve, reject) => {
    let lastValue;
    const subscription = observable.subscribe({
      next: (value) => { lastValue = value; },
      error: (err) => reject(err),
      complete: () => resolve(lastValue),
    });
    
    // Handle ongoing updates
    return subscription;
  });
}

function DocumentListComponent({ db }) {
  const query = db.documents.find({
    selector: { status: 'published' },
    sort: [{ createdAt: 'desc' }],
  });

  // Use React 19's use() hook
  const documents = use(observableToPromise(query.$));

  return (
    <div>
      {documents?.map(doc => (
        <div key={doc.id}>{doc.title}</div>
      ))}
    </div>
  );
}

// Wrap in Suspense for loading state
export function DocumentList({ db }) {
  return (
    <Suspense fallback={<p>Loading documents...</p>}>
      <DocumentListComponent db={db} />
    </Suspense>
  );
}
```

**Advantages:**
- ✅ Native React 19 integration
- ✅ Automatic Suspense support
- ✅ Cleaner code without manual state management

**Disadvantages:**
- ❌ Requires converting observables to promises (complexity)
- ❌ Loses real-time reactivity (promise resolves once)
- ❌ Not ideal for live-updating collections

### Strategy 3: Use TanStack Query v5+ (Query Integration Pattern)

TanStack Query (React Query) is actively maintained and works with React 19.

**Implementation:**
```jsx
import { useQuery } from '@tanstack/react-query';

// Custom hook using TanStack Query
function useRxDocuments(collectionName, selector = {}) {
  return useQuery({
    queryKey: [collectionName, selector],
    queryFn: async () => {
      // This won't give you real-time updates
      // Better for one-time queries
      const db = useRxDB(); // Would need to handle outside hook
      return db[collectionName]
        .find({ selector })
        .exec();
    },
  });
}
```

⚠️ **Note:** TanStack Query isn't ideal for RxDB because it doesn't leverage RxDB's real-time reactive nature. Better for complementary data fetching.

### Strategy 4: Migrate to SignalDB (Modern Alternative)

[SignalDB](https://www.signaldb.io/) is a newer reactive database built for React.

```jsx
import { Collection } from 'signaldb';
import { useDocument } from 'signaldb/react';

// Modern alternative to RxDB + rxdb-hooks
const documents = new Collection({
  name: 'documents',
});

export function DocumentList() {
  const docs = useDocument(documents, {}, { reactive: true });

  return (
    <div>
      {docs.map(doc => (
        <div key={doc._id}>{doc.title}</div>
      ))}
    </div>
  );
}
```

**Advantages:**
- ✅ Built for React 19 from the ground up
- ✅ Native signal-based reactivity
- ✅ Smaller bundle size

**Disadvantages:**
- ❌ Less mature than RxDB
- ❌ Smaller ecosystem
- ❌ Would require complete data migration

---

## Recommended Approach for React 19

**For new projects:** Use **Strategy 1** (Custom Hooks) or migrate to **SignalDB**

**For existing projects:**
1. Keep rxdb-hooks for React 18 compatibility if possible
2. Upgrade to React 19 gradually
3. Replace rxdb-hooks hooks one component at a time with custom hooks
4. No need to change RxDB core - it works perfectly with React 19

---

# Part 2: replicateSupabase Plugin Known Bugs

## Critical Bugs (as of January 2025)

### Bug #1: `push.modifier` Not Applied During Push (CRITICAL)

**Status:** Open Issue [#7513](https://github.com/pubkey/rxdb/issues/7513)

**Description:** The `push.modifier` function is never called when pushing documents to Supabase, even though `pull.modifier` works correctly.

**Impact:** 
- Documents with `_modified` field get pushed with that field intact
- Supabase can't properly track modification timestamps
- Replication checkpoint tracking breaks after push

**Symptoms:**
```javascript
// You define a push.modifier to remove _modified
const replicationState = await replicateSupabase({
  collection: db.documents,
  push: {
    batchSize: 50,
    modifier: (doc) => {
      // This is NEVER called - bug!
      delete doc._modified;
      return doc;
    },
  },
});

// Result: _modified field is pushed to Supabase, causing conflicts
```

**Workaround:**

Create a pre-push hook that manually strips `_modified`:

```javascript
// Before starting replication, clean _modified fields
const stripModified = await db.documents.find().exec();
for (const doc of stripModified) {
  // _modified will be re-added on next sync
  if (doc._modified) {
    await doc.remove();
    await db.documents.insert({
      ...doc.toJSON(),
      // Don't include _modified
    });
  }
}

// Now start replication
const replicationState = await replicateSupabase({...});
```

**Expected Fix:** RxDB team should implement push.modifier execution in the replication handler.

---

### Bug #2: Deletion Push Fails When Doc Doesn't Exist on Server (CRITICAL)

**Status:** Open Issue [#7612](https://github.com/pubkey/rxdb/issues/7612)

**Description:** When pushing a deletion (_deleted: true) for a document that was never synced to the server, the replication plugin throws a "doc not found" error instead of silently succeeding.

**Impact:**
- Offline users who create and delete docs before sync will get sync errors
- Users can't recover from sync failures without manual intervention
- Replication state becomes corrupted

**Symptoms:**
```
Error: Document with id 'xyz' not found on server
at SupabaseReplicaHandler.push()
```

**Scenario that triggers this:**
1. User is offline
2. Creates document (local only, not synced)
3. Deletes document (sets _deleted: true)
4. Goes online
5. Replication tries to push deletion for non-existent server doc → ERROR

**Workaround:**

Filter out deletions of non-synced documents before they reach Supabase:

```javascript
// Check if document was ever synced
async function isSyncedDocument(doc, replicationState) {
  const assumedMaster = replicationState.assumedMasterState$.getValue();
  return assumedMaster && assumedMaster[doc.id];
}

// Use a custom replication handler
const replicationState = await replicateSupabase({
  collection: db.documents,
  push: {
    batchSize: 50,
    modifier: async (doc) => {
      // Don't push deletions of never-synced docs
      if (doc._deleted === true) {
        const wasSynced = await isSyncedDocument(doc, replicationState);
        if (!wasSynced) {
          return null; // Skip this document
        }
      }
      return doc;
    },
  },
  // ... rest of config
});
```

**Better Workaround:**

Keep track of synced documents in a separate collection:

```javascript
// Schema for tracking sync state
const syncStateSchema = {
  version: 1,
  primaryKey: 'documentId',
  type: 'object',
  properties: {
    documentId: { type: 'string' },
    isSynced: { type: 'boolean' },
    lastSyncTime: { type: 'number' },
  },
  required: ['documentId'],
  additionalProperties: false,
};

// Before pushing, check sync state
const canPushDeletion = async (doc) => {
  const syncState = await db.syncStates.findByIds([doc.id]).exec();
  return syncState.length > 0 && syncState[0].isSynced;
};
```

**Expected Fix:** Supabase replication should gracefully handle deletions of non-existent documents (HTTP 404 = success).

---

### Bug #3: RLS Filtering Breaks Replication on Initial Pull

**Status:** Known limitation (not a bug, but affects replication)

**Description:** If your RLS policies are too restrictive, the initial pull might return 0 documents even though data exists, because the Supabase anon key might not have permission.

**Symptoms:**
```
Replication started but no documents were pulled
RLS policies silently filtering everything
```

**Diagnosis:**
```javascript
// Test RLS policies before starting replication
const testQuery = await supabase
  .from('documents')
  .select('id')
  .limit(1);

if (testQuery.error?.code === 'PGRST116') {
  console.error('RLS denying access:', testQuery.error);
}
```

**Fix:** Verify RLS policies:

```sql
-- ✅ Correct: User can read their own documents
CREATE POLICY "select_own_documents"
ON documents FOR SELECT
USING (user_id = auth.uid());

-- ❌ Wrong: Empty USING clause denies all
CREATE POLICY "broken_select"
ON documents FOR SELECT
USING (false);
```

**Workaround:**
```javascript
// Use service role key for initial data pull (server-side only)
const serverSupabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Server-only key
);

// Pull data on server, then sync to client database
```

---

### Bug #4: Realtime Subscription Doesn't Catch All Changes

**Status:** Supabase Realtime limitation (not RxDB bug)

**Description:** Supabase Realtime uses logical replication slots which can be dropped if unused for >30 days. Changes during that time are missed.

**Impact:**
- Long-dormant offline users miss critical updates
- No error indication - just silent data staleness

**Workaround:**

Implement periodic full resync:

```javascript
// Force full re-sync every 7 days
const RESYNC_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

const replicationState = await replicateSupabase({...});

setInterval(() => {
  console.log('Force full resync to catch missed changes');
  replicationState.reSync();
}, RESYNC_INTERVAL);
```

---

## Workaround Summary Table

| Bug | Severity | Workaround |
|-----|----------|-----------|
| push.modifier not called | HIGH | Strip _modified before sync manually |
| Deletion fails for unsynced docs | HIGH | Filter deletions of non-synced docs |
| RLS filtering breaks pull | MEDIUM | Test RLS policies before sync |
| Realtime subscription drops | MEDIUM | Implement periodic full resync |

---

# Part 3: Migrating IndexedDB Data to RxDB

## Migration Scenarios

### Scenario A: Migrate from Raw IndexedDB to RxDB

You have existing IndexedDB data from a legacy application.

### Scenario B: Migrate from Dexie.js to RxDB

You use Dexie.js (wrapper around IndexedDB) and want to use RxDB.

### Scenario C: Migrate from RxDB 14 to RxDB 15+ (Storage Migration)

You want to upgrade RxDB versions while keeping data.

---

## Strategy 1: Dexie → RxDB Direct Migration (Recommended)

This is the cleanest approach if you're migrating from Dexie.

**Step 1: Export Data from Dexie**

```javascript
import Dexie from 'dexie';

// Old Dexie database
const oldDB = new Dexie('oldAppDB');
oldDB.version(1).stores({
  documents: 'id, folder_id, createdAt',
  folders: 'id, parentId',
});

// Export all data
async function exportDexieData() {
  const documents = await oldDB.documents.toArray();
  const folders = await oldDB.folders.toArray();
  
  return {
    documents,
    folders,
    exportDate: new Date().toISOString(),
  };
}
```

**Step 2: Transform for RxDB Schema**

```javascript
function transformDocumentsForRxDB(dexieDocuments) {
  return dexieDocuments.map(doc => ({
    ...doc,
    // Map Dexie fields to RxDB fields
    _modified: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
    _deleted: false,
    // Add any new required fields
    user_id: doc.user_id || getCurrentUserId(),
  }));
}

function transformFoldersForRxDB(dexieFolders) {
  return dexieFolders.map(folder => ({
    ...folder,
    _modified: folder.updatedAt ? new Date(folder.updatedAt).getTime() : Date.now(),
    _deleted: false,
    user_id: folder.user_id || getCurrentUserId(),
  }));
}
```

**Step 3: Create RxDB Instance and Insert Data**

```javascript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

async function migrateToRxDB() {
  try {
    // 1. Export old data
    const exportedData = await exportDexieData();
    console.log('Exported from Dexie:', exportedData);

    // 2. Create RxDB database
    const rxdb = await createRxDatabase({
      name: 'newAppDB',
      storage: getRxStorageDexie(),
    });

    // 3. Add collections with schemas
    await rxdb.addCollections({
      documents: {
        schema: documentSchema,
      },
      folders: {
        schema: folderSchema,
      },
    });

    // 4. Transform and insert data
    const transformedDocs = transformDocumentsForRxDB(exportedData.documents);
    const transformedFolders = transformFoldersForRxDB(exportedData.folders);

    // Bulk insert
    await rxdb.documents.bulkInsert(transformedDocs);
    await rxdb.folders.bulkInsert(transformedFolders);

    console.log(`✅ Migrated ${transformedDocs.length} documents`);
    console.log(`✅ Migrated ${transformedFolders.length} folders`);

    return rxdb;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
```

**Step 4: Verify Data Integrity**

```javascript
async function verifyMigration(oldDB, newDB) {
  const oldDocCount = await oldDB.documents.count();
  const newDocCount = await newDB.documents.count();

  if (oldDocCount !== newDocCount) {
    console.error(`❌ Document count mismatch: ${oldDocCount} vs ${newDocCount}`);
    return false;
  }

  // Spot check a few documents
  const sampleOldDoc = await oldDB.documents.limit(1).toArray();
  const sampleNewDoc = await newDB.documents
    .findByIds([sampleOldDoc[0].id])
    .exec();

  if (!sampleNewDoc.length) {
    console.error('❌ Sample document not found in RxDB');
    return false;
  }

  console.log('✅ Migration verified successfully');
  return true;
}
```

---

## Strategy 2: RxDB Storage Migration Plugin (Version Upgrades)

For upgrading between RxDB major versions (14 → 15+).

**Step 1: Install Both Versions**

```bash
# Keep both RxDB versions during migration
npm install rxdb@14 # Old version
npm install rxdb@latest # New version
```

**Step 2: Use Storage Migration Plugin**

```javascript
import { createRxDatabase } from 'rxdb/dist/types';
import { getRxStorageDexie as getRxStorageDexieOld } from 'rxdb/dist/plugins/storage-dexie'; // v14
import { getRxStorageDexie as getRxStorageDexieNew } from 'rxdb'; // v15
import { migrateStorage } from 'rxdb/dist/plugins/migration-storage';

async function migrateRxDBVersion() {
  // 1. Create old database with v14 storage
  const oldDB = await createRxDatabase({
    name: 'appDB',
    storage: getRxStorageDexieOld(),
  });

  // Add collections from v14
  await oldDB.addCollections({
    documents: { schema: documentSchemaV14 },
  });

  // 2. Create new database with v15 storage
  const newDB = await createRxDatabase({
    name: 'appDB_v15',
    storage: getRxStorageDexieNew(),
  });

  // Add collections from v15 (with updated schema if needed)
  await newDB.addCollections({
    documents: { schema: documentSchemaV15 },
  });

  // 3. Migrate storage
  await migrateStorage({
    database: oldDB,
    targetDatabase: newDB,
    batchSize: 100,
  });

  console.log('✅ Storage migration complete');
  return newDB;
}
```

**Step 3: Clean Up Old Data**

```javascript
async function cleanupOldDatabase() {
  // After verifying migration worked
  const oldDbIndexed = indexedDB.databases()
    .find(db => db.name === 'appDB');
  
  if (oldDbIndexed) {
    indexedDB.deleteDatabase('appDB');
    console.log('✅ Deleted old database');
  }
}
```

---

## Strategy 3: Incremental Migration During Runtime

For seamless migration without data loss:

```javascript
import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

class MigrationManager {
  constructor() {
    this.migrating = false;
    this.migrationProgress = 0;
  }

  async startBackgroundMigration(dexieDB, rxdbName) {
    this.migrating = true;

    try {
      // 1. Create new RxDB
      const rxdb = await createRxDatabase({
        name: rxdbName,
        storage: getRxStorageDexie(),
      });

      await rxdb.addCollections({
        documents: { schema: documentSchema },
        folders: { schema: folderSchema },
      });

      // 2. Migrate in batches to avoid blocking
      const batchSize = 100;
      const collections = ['documents', 'folders'];

      for (const collName of collections) {
        const allDocs = await dexieDB[collName].toArray();
        const totalDocs = allDocs.length;

        for (let i = 0; i < totalDocs; i += batchSize) {
          const batch = allDocs.slice(i, i + batchSize);
          const transformed = this.transformBatch(collName, batch);
          
          await rxdb[collName].bulkInsert(transformed, {
            skipIfExists: true, // Skip duplicates
          });

          // Update progress
          this.migrationProgress = ((i + batchSize) / totalDocs) * 100;
          console.log(`Migrating ${collName}: ${this.migrationProgress.toFixed(1)}%`);

          // Yield to browser to prevent freezing
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      this.migrating = false;
      console.log('✅ Background migration complete');
      return rxdb;
    } catch (error) {
      this.migrating = false;
      console.error('Migration failed:', error);
      throw error;
    }
  }

  transformBatch(collectionName, batch) {
    return batch.map(doc => ({
      ...doc,
      _modified: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
      _deleted: false,
      user_id: doc.user_id || getCurrentUserId(),
    }));
  }
}

// Usage in React
function MigrationProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const manager = new MigrationManager();
    
    const interval = setInterval(() => {
      setProgress(manager.migrationProgress);
    }, 100);

    manager.startBackgroundMigration(dexieDB, 'newRxDB');

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Migration Progress: {progress.toFixed(0)}%</p>
      <progress value={progress} max={100} />
    </div>
  );
}
```

---

## Critical Considerations

### ⚠️ Data Type Conversions

**Issue:** IndexedDB stores dates as strings or timestamps, RxDB expects specific formats.

```javascript
// ❌ Wrong
const doc = {
  createdAt: 'Wed Jan 05 2025 14:30:00 GMT',
};

// ✅ Correct
const doc = {
  createdAt: new Date('2025-01-05').getTime(), // milliseconds
};
```

**Solution:**
```javascript
function normalizeDataTypes(doc) {
  return {
    ...doc,
    createdAt: typeof doc.createdAt === 'string' 
      ? new Date(doc.createdAt).getTime() 
      : doc.createdAt,
    updatedAt: typeof doc.updatedAt === 'string' 
      ? new Date(doc.updatedAt).getTime() 
      : doc.updatedAt,
    // Convert boolean strings to actual booleans
    isPublic: doc.isPublic === 'true' ? true : doc.isPublic,
  };
}
```

### ⚠️ Primary Key Changes

**Issue:** IndexedDB primary keys might be different from RxDB requirements.

```javascript
// IndexedDB might allow composite keys
// RxDB requires single string primary key

// ❌ Won't work in RxDB
const oldSchema = {
  keyPath: ['userId', 'documentId'],
};

// ✅ RxDB requires
const newSchema = {
  primaryKey: 'id', // must be string
};

// Solution: Generate new primary keys
function migrateWithNewKeys(oldDocs) {
  return oldDocs.map(doc => ({
    id: `${doc.userId}-${doc.documentId}`, // Composite key as string
    userId: doc.userId,
    documentId: doc.documentId,
    ...doc,
  }));
}
```

### ⚠️ Lost Sync State

**Critical:** RxDB 15+ now preserves replication state during migration!

```javascript
// RxDB 15+: Replication state is preserved
await migrateStorage({
  database: oldDB,
  targetDatabase: newDB,
});

// The assumedMasterState and checkpoint are carried over
// So clients don't re-sync everything from scratch

// This was NOT true in RxDB <15
// Upgrading from RxDB 14 to 15 will have better migration
```

---

## Pre-Migration Checklist

- [ ] **Backup IndexedDB data** - Export to JSON before migration
- [ ] **Test on staging** - Run migration in non-production first
- [ ] **Verify schema compatibility** - All fields map correctly
- [ ] **Check data types** - Dates, booleans, nulls are correct
- [ ] **Validate foreign keys** - Folder references still work
- [ ] **Test replication** - If migrating to Supabase sync
- [ ] **Measure performance** - Ensure bulk inserts don't timeout
- [ ] **Plan user communication** - Inform users of migration
- [ ] **Implement rollback** - Keep old database accessible during transition
- [ ] **Monitor errors** - Log failures for post-migration debugging

---

## Post-Migration Validation

```javascript
async function validateMigration(oldDB, newDB, collections) {
  const validation = {
    success: true,
    errors: [],
    warnings: [],
  };

  for (const collName of collections) {
    try {
      const oldCount = await oldDB[collName].count();
      const newCount = await newDB[collName].count();

      if (oldCount !== newCount) {
        validation.success = false;
        validation.errors.push(
          `${collName}: Count mismatch (old: ${oldCount}, new: ${newCount})`
        );
      }

      // Sample validation
      const sampleOld = await oldDB[collName].limit(5).toArray();
      for (const oldDoc of sampleOld) {
        const newDocs = await newDB[collName]
          .find({ selector: { id: oldDoc.id } })
          .exec();

        if (newDocs.length === 0) {
          validation.warnings.push(
            `${collName}: Document ${oldDoc.id} missing in new DB`
          );
        } else {
          // Check field integrity
          const newDoc = newDocs[0].toJSON();
          const mismatchedFields = Object.keys(oldDoc)
            .filter(key => oldDoc[key] !== newDoc[key] && key !== '_modified' && key !== '_deleted');
          
          if (mismatchedFields.length > 0) {
            validation.warnings.push(
              `${collName}: Document ${oldDoc.id} has field differences: ${mismatchedFields.join(', ')}`
            );
          }
        }
      }
    } catch (error) {
      validation.success = false;
      validation.errors.push(`${collName}: Validation failed - ${error.message}`);
    }
  }

  return validation;
}

// Usage
const result = await validateMigration(oldDB, newDB, ['documents', 'folders']);
console.log(JSON.stringify(result, null, 2));
```

---

## Troubleshooting Migration Issues

### Issue: "QuotaExceededError" During Migration

**Cause:** IndexedDB quota exceeded during bulk insert.

**Solution:**
```javascript
// Reduce batch size or migrate in smaller chunks
const BATCH_SIZE = 50; // Reduce from 100

for (let i = 0; i < documents.length; i += BATCH_SIZE) {
  const batch = documents.slice(i, i + BATCH_SIZE);
  await rxdb.documents.bulkInsert(batch);
  
  // Clear memory
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### Issue: "Primary Key Conflict" During Migration

**Cause:** Documents with same IDs already exist in RxDB.

**Solution:**
```javascript
// Use upsert instead of insert
await rxdb.documents.bulkUpsert(transformedDocs);

// Or skip existing documents
await rxdb.documents.bulkInsert(transformedDocs, {
  skipIfExists: true,
});
```

### Issue: Data Appears But Won't Sync to Supabase

**Cause:** `_modified` timestamp is in future or `_deleted` flag missing.

**Solution:**
```javascript
async function fixSyncState() {
  const allDocs = await rxdb.documents.find().exec();
  
  for (const doc of allDocs) {
    const updated = doc.toJSON();
    updated._modified = Math.min(
      updated._modified, 
      Date.now()  // Can't be in future
    );
    updated._deleted = updated._deleted === true;
    
    await doc.incrementalUpsert(updated);
  }
}
```

---

## Summary

| Aspect | Best Practice |
|--------|---|
| **Dexie → RxDB** | Use Strategy 1 (Direct Export/Import) |
| **RxDB 14 → 15+** | Use Storage Migration Plugin |
| **Batch Size** | 50-100 documents per batch |
| **Data Validation** | Always verify counts + spot check |
| **Backup** | Export IndexedDB to JSON before migration |
| **Testing** | Run on staging first |
| **Replication** | Test Supabase sync after migration |

---

## References

- [RxDB Migration Storage Docs](https://rxdb.info/migration-storage.html)
- [RxDB Supabase Replication Docs](https://rxdb.info/replication-supabase.html)
- [RxDB GitHub Issues - Replication Bugs](https://github.com/pubkey/rxdb/issues)
- [React 19 Hooks Documentation](https://react.dev/reference/react)

---

**Document Version:** 1.0  
**Last Updated:** January 6, 2025  
**Applicable Versions:** RxDB 14.x-15.x, React 18.x-19.x  
**Author:** AI Assistant
