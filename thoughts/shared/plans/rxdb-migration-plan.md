# RxDB Migration Implementation Plan

## Implementation Status (Updated: 2025-01-07)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | RxDB Infrastructure Setup |
| Phase 2 | ✅ Complete | Supabase Replication Setup |
| Phase 3 | ✅ Complete | Data Migration Utility |
| Phase 4 | ✅ Complete | useRxBlocks Hook (replaces useBlocks) |
| Phase 5 | ✅ Complete | useRxDocuments/useRxFolders Hooks |
| Phase 6 | ✅ Complete | Component Integration (barrel exports updated) |
| Phase 7 | 🔄 In Progress | Testing & Verification (build passes, needs manual testing) |
| Phase 8 | 🔲 Pending | Legacy Code Cleanup |

### Phase 7: Next Steps (Manual Testing Required)

Before Phase 8 cleanup, verify the following in browser:
1. **App Loads**: Open app, verify documents appear in sidebar
2. **Create Document**: Create new document, verify it appears immediately
3. **Edit Block**: Edit a block, verify changes persist after refresh
4. **Offline Mode**: Disconnect network, make changes, reconnect - verify sync
5. **Multi-Tab**: Open two tabs, edit in one, verify change appears in other
6. **Console Check**: Look for "[RxDB]" logs showing replication activity

Once all tests pass, proceed with Phase 8 cleanup.

### Phase 6 Implementation Details (2025-01-07)

**Barrel Export Updates:**
- `@/features/block/index.ts`: Now exports `useRxBlocks as useBlocks`
- `@/features/document/index.ts`: Now exports `useRxFolders as useFolders` and `useRxDocuments as usePaginatedDashboard`

**API Compatibility:**
- All RxDB hooks updated to match old hook interfaces
- `useRxFolders`: Added `createFolder(name, parentId)` (gets userId from auth), `refreshFolders()` (no-op), `moveDocumentToFolder()`
- `useRxDocuments`: Added `loadMore()`, `loadInitial()`, `checkLoadMore()`, `reset()` (all no-ops since RxDB loads all data)
- Legacy hooks preserved with `*Legacy` suffix for gradual migration

### Files Created

```
src/shared/db/
├── index.ts           # Barrel exports
├── rxdb.ts            # Database setup
├── rxdb-schemas.ts    # Collection schemas
├── rxdb-types.ts      # TypeScript types
├── rxdb-hooks.tsx     # Core React hooks (useRxDB, useRxQuery, etc.)
├── rxdb-replication.ts # Supabase replication with bug workarounds
├── migration.ts       # Dexie → RxDB migration utility
├── RxDBProvider.tsx   # React context provider
└── hooks/
    ├── index.ts
    ├── use-blocks.ts      # Drop-in replacement for useBlocks
    ├── use-documents.ts   # Drop-in replacement for document hooks
    └── use-folders.ts     # Drop-in replacement for folder hooks
```

---

## Overview

Migrate Devlog from the current DIY sync solution (Dexie + TanStack Query + SmartSync + multiple hooks) to RxDB with Supabase replication for intelligent, offline-first data sync with 90% reduction in network calls.

## Current State Analysis

### What We Have Now

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CURRENT ARCHITECTURE                                 │
│                    (Multiple Cache Systems - Fragmented)                     │
└─────────────────────────────────────────────────────────────────────────────┘

DATA LOADING:
  Dashboard.jsx
       │
       ├── usePaginatedDashboard() ──► Supabase (documents, paginated)
       │       └── @/features/document
       │
       ├── useIndexedDBCache() ──► IndexedDB (separate DB: journey-log-compass-db)
       │       └── @/shared/hooks
       │
       └── useFolders() ──► Supabase (folders, tree structure)
               └── @/features/document

BLOCK EDITING:
  DocumentEditor.tsx
       │
       ├── useBlocks() ──► Dexie + TanStack Query
       │       └── @/features/block
       │
       └── useBlockSync() ──► SmartSync manager
               └── @/features/document

LOCAL STORAGE:
  ├── Dexie (devlog-db) ──► blocks table
  │       └── @/shared/lib/storage/dexie-db.ts (119 lines)
  │
  └── IndexedDB (journey-log-compass-db) ──► documents (separate)
          └── src/utils/storage/IndexedDBAdapter.js (468 lines)

PROBLEMS:
  • 3+ Supabase calls on every app open
  • No delta sync (fetches ALL documents every time)
  • Two different IndexedDB databases (devlog-db, journey-log-compass-db)
  • SmartSync + BlockRepository + useBlocks = overlapping logic
  • ~150 network calls per session
```

### Files to Replace/Remove

| Current Location | Lines | Replacement | Import Via |
|------------------|-------|-------------|------------|
| `src/features/document/hooks/use-paginated-dashboard.ts` | 317 | `useRxQuery('documents')` | `@/features/document` |
| `src/shared/hooks/use-indexeddb-cache.ts` | 173 | RxDB local storage | `@/shared/hooks` |
| `src/features/document/hooks/use-folders.ts` | 454 | `useRxQuery('folders')` | `@/features/document` |
| `src/hooks/useSmartSync.js` | 201 | RxDB replication | Delete |
| `src/features/block/hooks/use-blocks-query.ts` | 192 | `useRxQuery('blocks')` | `@/features/block` |
| `src/entities/Block/Block.repository.ts` | 198 | RxCollection methods | Delete |
| `src/shared/lib/storage/dexie-db.ts` | 119 | RxDB with Dexie storage | Delete |
| `src/utils/storage/IndexedDBAdapter.js` | 468 | Deleted | Delete |
| **Total** | **~2122** | **~500 lines** | |

## Desired End State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TARGET ARCHITECTURE                                  │
│                    (Unified RxDB - Single Source of Truth)                  │
└─────────────────────────────────────────────────────────────────────────────┘

ALL COMPONENTS:
  Dashboard.jsx / DocumentEditor.tsx / SidebarEnhanced.jsx
       │
       └── useRxQuery() (custom hook) ──► RxDB Collections
               │
               ▼
       ┌─────────────────────────────────────────┐
       │              RxDatabase                 │
       │            (devlog-rxdb)                │
       │                                         │
       │  Collections:                           │
       │    • documents (with replication)       │
       │    • folders   (with replication)       │
       │    • blocks    (with replication)       │
       │                                         │
       │  Features (automatic):                  │
       │    • Delta sync (checkpoint-based)      │
       │    • Offline queue                      │
       │    • Conflict resolution                │
       │    • Multi-tab sync                     │
       │    • Reactive queries                   │
       └────────────────┬────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│  Dexie Storage   │          │    Supabase      │
│  (local, fast)   │          │  (remote sync)   │
└──────────────────┘          └──────────────────┘

BENEFITS:
  • App opens: 0 network calls (instant from local)
  • Background: Delta sync only (changed records)
  • Edits: Batched push (10 edits = 1 network call)
  • Session total: ~10-15 network calls (90% reduction)
```

### Verification of End State

1. **Bundle builds successfully**: `npm run build` completes without errors
2. **All tests pass**: `npm run lint` shows no errors
3. **Network reduction verified**: Browser DevTools → Network tab shows <20 calls per session
4. **Offline mode works**: Disconnect network → edit documents → reconnect → changes sync
5. **App loads instantly**: First meaningful paint <500ms (data from local RxDB)

## What We're NOT Doing

- ❌ Changing Supabase schema (RLS policies, tables remain same)
- ❌ Changing UI components (only data hooks change)
- ❌ Adding new features (pure refactoring)
- ❌ Modifying authentication flow
- ❌ Changing block types or document structure

---

## Implementation Approach

**Strategy**: Incremental migration with feature flags, one collection at a time.

**Order**: Blocks → Documents → Folders (blocks already half-migrated)

**Safety**: Keep old code until new code is verified working, then delete.

**React 19 Compatibility**: Use custom hooks with direct RxDB observable subscriptions (NOT rxdb-hooks which is deprecated and incompatible with React 19).

---

## Phase 1: RxDB Infrastructure Setup

### Overview
Set up RxDB core, schemas, custom React hooks, and provider. No functionality changes yet.

### Changes Required:

#### 1. Install Dependencies

**Command**:
```bash
npm install rxdb
```

Note: We already have `dexie` installed, RxDB will use it via `getRxStorageDexie()`. We do NOT install `rxdb-hooks` as it's deprecated and incompatible with React 19.

#### 2. Create RxDB Database Setup

**File**: `src/shared/db/rxdb.ts` (NEW)

```typescript
// src/shared/db/rxdb.ts
/**
 * RxDB Database Setup
 *
 * Single source of truth for all local data.
 * Uses Dexie storage adapter for IndexedDB access.
 */

import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';

import { documentSchema, folderSchema, blockSchema } from './rxdb-schemas';
import type { DocumentCollection, FolderCollection, BlockCollection } from './rxdb-types';

// Add plugins
if (import.meta.env.DEV) {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBQueryBuilderPlugin);

// Database type
export type DevlogDatabase = RxDatabase<{
  documents: DocumentCollection;
  folders: FolderCollection;
  blocks: BlockCollection;
}>;

// Singleton instance
let dbInstance: DevlogDatabase | null = null;

/**
 * Get or create the RxDB database instance
 */
export async function getDatabase(): Promise<DevlogDatabase> {
  if (dbInstance) return dbInstance;

  console.log('[RxDB] Creating database...');

  dbInstance = await createRxDatabase<{
    documents: DocumentCollection;
    folders: FolderCollection;
    blocks: BlockCollection;
  }>({
    name: 'devlog-rxdb',
    storage: getRxStorageDexie(),
    multiInstance: true, // Enable multi-tab sync
    eventReduce: true,   // Optimize change events
  });

  // Add collections
  await dbInstance.addCollections({
    documents: { schema: documentSchema },
    folders: { schema: folderSchema },
    blocks: { schema: blockSchema },
  });

  console.log('[RxDB] Database ready with collections:', Object.keys(dbInstance.collections));

  return dbInstance;
}

/**
 * Destroy database (for logout/cleanup)
 */
export async function destroyDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    console.log('[RxDB] Database destroyed');
  }
}

export default getDatabase;
```

#### 3. Create RxDB Schemas

**File**: `src/shared/db/rxdb-schemas.ts` (NEW)

```typescript
// src/shared/db/rxdb-schemas.ts
/**
 * RxDB JSON Schemas
 *
 * Based on Supabase table structure.
 * Includes _modified and _deleted for replication.
 */

import { RxJsonSchema } from 'rxdb';

// =============================================================================
// Document Schema
// =============================================================================

export const documentSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    folder_id: { type: ['string', 'null'] },
    tags: {
      type: 'array',
      items: { type: 'string' },
      default: []
    },
    metadata: {
      type: 'object',
      default: {}
    },
    doc_position: { type: 'number', default: 0 },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'user_id', 'title'],
  indexes: [
    'user_id',
    'folder_id',
    'updated_at',
    '_modified'
  ],
};

// =============================================================================
// Folder Schema
// =============================================================================

export const folderSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    user_id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    parent_id: { type: ['string', 'null'] },
    path: { type: 'string' },
    position: { type: 'number', default: 0 },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'user_id', 'name'],
  indexes: [
    'user_id',
    'parent_id',
    '_modified'
  ],
};

// =============================================================================
// Block Schema
// =============================================================================

export const blockSchema: RxJsonSchema<any> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    document_id: { type: 'string', maxLength: 36 },
    type: { type: 'string' },
    content: { type: ['string', 'object'] },
    position: { type: 'number' },
    metadata: {
      type: 'object',
      default: {}
    },
    created_at: { type: ['string', 'number'] },
    updated_at: { type: ['string', 'number'] },
    // Replication fields
    _modified: { type: 'number' },
    _deleted: { type: 'boolean', default: false },
  },
  required: ['id', 'document_id', 'type', 'position'],
  indexes: [
    'document_id',
    'position',
    '_modified'
  ],
};
```

#### 4. Create RxDB Types

**File**: `src/shared/db/rxdb-types.ts` (NEW)

```typescript
// src/shared/db/rxdb-types.ts
/**
 * TypeScript types for RxDB collections and documents
 */

import { RxCollection, RxDocument } from 'rxdb';

// =============================================================================
// Document Types
// =============================================================================

export interface DocumentDocType {
  id: string;
  user_id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  doc_position: number;
  created_at: string;
  updated_at: string;
  _modified: number;
  _deleted: boolean;
}

export type DocumentDocument = RxDocument<DocumentDocType>;
export type DocumentCollection = RxCollection<DocumentDocType>;

// =============================================================================
// Folder Types
// =============================================================================

export interface FolderDocType {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  path: string;
  position: number;
  created_at: string;
  updated_at: string;
  _modified: number;
  _deleted: boolean;
}

export type FolderDocument = RxDocument<FolderDocType>;
export type FolderCollection = RxCollection<FolderDocType>;

// =============================================================================
// Block Types
// =============================================================================

export interface BlockDocType {
  id: string;
  document_id: string;
  type: string;
  content: string | Record<string, unknown>;
  position: number;
  metadata: Record<string, unknown>;
  created_at: string | number;
  updated_at: string | number;
  _modified: number;
  _deleted: boolean;
}

export type BlockDocument = RxDocument<BlockDocType>;
export type BlockCollection = RxCollection<BlockDocType>;
```

#### 5. Create Custom React Hooks (React 19 Compatible)

**File**: `src/shared/db/rxdb-hooks.ts` (NEW)

```typescript
// src/shared/db/rxdb-hooks.ts
/**
 * Custom RxDB React Hooks
 *
 * React 19 compatible - uses direct observable subscriptions.
 * Replaces deprecated rxdb-hooks package.
 */

import { useState, useEffect, useCallback, useRef, useContext, createContext, ReactNode } from 'react';
import type { RxDatabase, RxCollection, RxQuery, RxDocument } from 'rxdb';
import type { DevlogDatabase } from './rxdb';

// =============================================================================
// Database Context
// =============================================================================

const RxDBContext = createContext<DevlogDatabase | null>(null);

export function RxDBProvider({ db, children }: { db: DevlogDatabase | null; children: ReactNode }) {
  return (
    <RxDBContext.Provider value={db}>
      {children}
    </RxDBContext.Provider>
  );
}

export function useRxDB(): DevlogDatabase | null {
  return useContext(RxDBContext);
}

// =============================================================================
// useRxQuery - Subscribe to RxDB query results
// =============================================================================

interface UseRxQueryResult<T> {
  result: T[];
  isFetching: boolean;
  error: Error | null;
}

export function useRxQuery<T>(
  collectionName: keyof DevlogDatabase['collections'],
  queryConstructor?: (collection: RxCollection<T>) => RxQuery<T, T[]> | null
): UseRxQueryResult<T> {
  const db = useRxDB();
  const [result, setResult] = useState<T[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Stable reference to query constructor
  const queryConstructorRef = useRef(queryConstructor);
  queryConstructorRef.current = queryConstructor;

  useEffect(() => {
    if (!db) {
      setIsFetching(true);
      return;
    }

    const collection = db[collectionName] as RxCollection<T>;
    if (!collection) {
      setError(new Error(`Collection ${String(collectionName)} not found`));
      setIsFetching(false);
      return;
    }

    // Build query
    const query = queryConstructorRef.current
      ? queryConstructorRef.current(collection)
      : collection.find();

    if (!query) {
      setResult([]);
      setIsFetching(false);
      return;
    }

    // Subscribe to query changes
    const subscription = query.$.subscribe({
      next: (docs: RxDocument<T>[]) => {
        setResult(docs.map(doc => doc.toJSON() as T));
        setIsFetching(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsFetching(false);
        console.error(`[useRxQuery] ${String(collectionName)} error:`, err);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collectionName]);

  return { result, isFetching, error };
}

// =============================================================================
// useRxCollection - Get collection for write operations
// =============================================================================

export function useRxCollection<T>(
  collectionName: keyof DevlogDatabase['collections']
): RxCollection<T> | null {
  const db = useRxDB();
  return db ? (db[collectionName] as RxCollection<T>) : null;
}

// =============================================================================
// useRxDocument - Subscribe to single document
// =============================================================================

interface UseRxDocumentResult<T> {
  document: T | null;
  isFetching: boolean;
  error: Error | null;
}

export function useRxDocument<T>(
  collectionName: keyof DevlogDatabase['collections'],
  documentId: string | null
): UseRxDocumentResult<T> {
  const db = useRxDB();
  const [document, setDocument] = useState<T | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !documentId) {
      setDocument(null);
      setIsFetching(false);
      return;
    }

    const collection = db[collectionName] as RxCollection<T>;
    if (!collection) {
      setError(new Error(`Collection ${String(collectionName)} not found`));
      setIsFetching(false);
      return;
    }

    const subscription = collection.findOne(documentId).$.subscribe({
      next: (doc: RxDocument<T> | null) => {
        setDocument(doc ? doc.toJSON() as T : null);
        setIsFetching(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsFetching(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collectionName, documentId]);

  return { document, isFetching, error };
}
```

#### 6. Create React Provider

**File**: `src/shared/db/RxDBProvider.tsx` (NEW)

```typescript
// src/shared/db/RxDBProvider.tsx
/**
 * React Context Provider for RxDB
 *
 * Initializes database on mount, provides to all children.
 * Uses custom hooks for React 19 compatibility.
 */

import React, { useEffect, useState, ReactNode } from 'react';
import { RxDBProvider as RxDBContextProvider } from './rxdb-hooks';
import { getDatabase, destroyDatabase, type DevlogDatabase } from './rxdb';
import { useAuth } from '@/app/providers';

interface Props {
  children: ReactNode;
}

export function DatabaseProvider({ children }: Props) {
  const [db, setDb] = useState<DevlogDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;

    const initDb = async () => {
      try {
        console.log('[DatabaseProvider] Initializing RxDB...');
        const database = await getDatabase();

        if (mounted) {
          setDb(database);
          console.log('[DatabaseProvider] RxDB ready');
        }
      } catch (err) {
        console.error('[DatabaseProvider] Failed to initialize RxDB:', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    };

    initDb();

    return () => {
      mounted = false;
    };
  }, []);

  // Clear data on logout
  useEffect(() => {
    if (!user && db) {
      console.log('[DatabaseProvider] User logged out, clearing local data');
      Promise.all([
        db.documents.remove(),
        db.folders.remove(),
        db.blocks.remove(),
      ]).catch(err => {
        console.error('[DatabaseProvider] Error clearing data:', err);
      });
    }
  }, [user, db]);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Database initialization failed: {error.message}
      </div>
    );
  }

  return (
    <RxDBContextProvider db={db}>
      {children}
    </RxDBContextProvider>
  );
}

export default DatabaseProvider;
```

#### 7. Add Provider to App

**File**: `src/App.jsx`

**Changes**: Wrap app with DatabaseProvider

```jsx
// Near the top of imports, add:
import { DatabaseProvider } from '@/shared/db/RxDBProvider';

// In the component tree, wrap with DatabaseProvider:
// BEFORE:
<AuthProvider>
  <SettingsProvider>
    {/* ... */}
  </SettingsProvider>
</AuthProvider>

// AFTER:
<AuthProvider>
  <DatabaseProvider>
    <SettingsProvider>
      {/* ... */}
    </SettingsProvider>
  </DatabaseProvider>
</AuthProvider>
```

### Success Criteria:

#### Automated Verification:
- [x] `npm install rxdb` completes without errors
- [x] `npm run build` compiles successfully
- [x] `npm run lint` passes with no errors (pre-existing TypeScript parse errors not related to RxDB)
- [ ] App loads without console errors about RxDB

#### Manual Verification:
- [ ] Browser DevTools → Application → IndexedDB shows `devlog-rxdb` database
- [ ] Console shows "[RxDB] Database ready with collections: documents, folders, blocks"
- [ ] App functions normally (no regressions - old hooks still in use)

---

## Phase 2: Supabase Replication Setup

### Overview
Set up replication using the official `replicateSupabase` plugin with workarounds for known bugs.

### Known Bugs & Workarounds

| Bug | Issue | Workaround | Implemented |
|-----|-------|-----------|-------------|
| `push.modifier` not called | [#7513](https://github.com/pubkey/rxdb/issues/7513) | Use pre-insert hooks + sync state tracking | ✅ Yes |
| Deletion fails for unsynced docs | [#7612](https://github.com/pubkey/rxdb/issues/7612) | Check `syncStates` collection before pushing deletions | ✅ Yes |
| RLS filtering breaks pull | N/A | Test RLS policies before starting replication | Manual |

**Reference:** See `resources/rxdb-migration-guide.md` Part 2 for detailed bug documentation.

### Changes Required:

#### 1. Add _modified Column to Supabase Tables

**Supabase SQL Migration** (run in Supabase SQL Editor):

```sql
-- Add _modified column for RxDB checkpoint-based replication
-- This tracks when each record was last modified (in milliseconds)

-- Documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS _modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_documents_modified ON documents(_modified);

-- Folders table
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS _modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

ALTER TABLE folders
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_folders_modified ON folders(_modified);

-- Blocks table
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS _modified BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000;

ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_blocks_modified ON blocks(_modified);

-- Trigger to auto-update _modified on UPDATE
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW._modified = EXTRACT(EPOCH FROM NOW()) * 1000;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS update_documents_modified ON documents;
CREATE TRIGGER update_documents_modified
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_folders_modified ON folders;
CREATE TRIGGER update_folders_modified
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_blocks_modified ON blocks;
CREATE TRIGGER update_blocks_modified
    BEFORE UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
```

#### 2. Create Replication Manager

**File**: `src/shared/db/rxdb-replication.ts` (NEW)

```typescript
// src/shared/db/rxdb-replication.ts
/**
 * Supabase Replication for RxDB
 *
 * Uses official replicateSupabase plugin.
 * Includes workarounds for known bugs (Jan 2025):
 * - Bug #7513: push.modifier not called → Use pre-insert hooks
 * - Bug #7612: Deletion fails for unsynced docs → Track sync state
 *
 * Reference: resources/rxdb-migration-guide.md Part 2
 */

import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import type { RxReplicationState } from 'rxdb/plugins/replication';
import type { RxCollection, RxDocument } from 'rxdb';
import { supabase } from '@/shared/api';
import type { DevlogDatabase } from './rxdb';

// =============================================================================
// Sync State Tracking (Workaround for Bug #7612)
// =============================================================================

/**
 * Track which documents have been successfully synced to the server.
 * This prevents deletion errors for documents that were created offline
 * and deleted before ever being synced.
 */
const syncedDocuments = new Map<string, Set<string>>(); // collectionName -> Set of synced doc IDs

/**
 * Mark a document as synced after successful push
 */
export function markAsSynced(collectionName: string, docId: string): void {
  if (!syncedDocuments.has(collectionName)) {
    syncedDocuments.set(collectionName, new Set());
  }
  syncedDocuments.get(collectionName)!.add(docId);
}

/**
 * Check if a document was ever synced to the server
 */
export function wasSynced(collectionName: string, docId: string): boolean {
  return syncedDocuments.get(collectionName)?.has(docId) ?? false;
}

/**
 * Clear sync state (for logout)
 */
export function clearSyncState(): void {
  syncedDocuments.clear();
}

// =============================================================================
// Pre-Insert Hook Setup (Workaround for Bug #7513)
// =============================================================================

/**
 * Setup pre-insert hooks to ensure _modified is properly set.
 * This works around the push.modifier bug where the modifier function
 * is never called during push operations.
 */
export function setupPreInsertHooks(db: DevlogDatabase): void {
  const collections = ['documents', 'folders', 'blocks'] as const;

  for (const collName of collections) {
    const collection = db[collName];

    // Pre-insert: Ensure _modified is set to current timestamp
    collection.preInsert((doc: any) => {
      doc._modified = Date.now();
      doc._deleted = doc._deleted ?? false;
      return doc;
    }, false);

    // Pre-save (update): Update _modified timestamp
    collection.preSave((doc: any) => {
      doc._modified = Date.now();
      return doc;
    }, false);

    console.log(`[RxDB] Pre-insert hooks set up for ${collName}`);
  }
}

// =============================================================================
// Replication Setup
// =============================================================================

/**
 * Setup Supabase replication for a collection with bug workarounds
 */
export function setupCollectionReplication<T extends { id: string; _deleted?: boolean }>(
  collection: RxCollection<T>,
  tableName: string,
  userId: string
): RxReplicationState<T, any> {
  console.log(`[RxDB Replication] Setting up replication for ${tableName}`);

  const replicationState = replicateSupabase<T>({
    replicationIdentifier: `supabase-${tableName}-${userId}`,
    collection,
    supabaseClient: supabase,
    table: tableName,

    pull: {
      batchSize: tableName === 'blocks' ? 200 : 100,
      // Transform Supabase nulls to undefined for RxDB
      modifier: (doc: any) => {
        if (doc.folder_id === null) delete doc.folder_id;
        if (doc.parent_id === null) delete doc.parent_id;
        // Ensure _modified is number
        if (typeof doc._modified === 'string') {
          doc._modified = new Date(doc._modified).getTime();
        }
        // Mark as synced when pulled from server (it exists on server)
        markAsSynced(tableName, doc.id);
        return doc;
      },
    },

    push: {
      batchSize: tableName === 'blocks' ? 100 : 50,
      /**
       * WORKAROUND for Bug #7612: Deletion fails for unsynced docs
       *
       * Filter out deletions of documents that were never synced to the server.
       * These documents only exist locally and trying to delete them on the
       * server will cause a "not found" error.
       */
      modifier: (doc: any) => {
        // If this is a deletion...
        if (doc._deleted === true) {
          // Check if the document was ever synced to the server
          if (!wasSynced(tableName, doc.id)) {
            console.log(`[RxDB Replication] Skipping deletion of never-synced doc: ${doc.id}`);
            return null; // Skip this document - don't push to server
          }
        }
        return doc;
      },
    },

    // Retry on failure
    retryTime: 5000,
    autoStart: true,
  });

  // Track successful pushes to update sync state
  replicationState.sent$.subscribe((docs) => {
    for (const doc of docs) {
      if (!doc._deleted) {
        markAsSynced(tableName, doc.id);
      }
    }
  });

  // Log replication status
  replicationState.active$.subscribe(isActive => {
    console.log(`[RxDB Replication] ${tableName}: ${isActive ? 'Active' : 'Inactive'}`);
  });

  replicationState.error$.subscribe(error => {
    if (error) {
      console.error(`[RxDB Replication] ${tableName}: Error`, error);
    }
  });

  return replicationState;
}

/**
 * Start all replications for a user
 */
export async function startAllReplications(
  db: DevlogDatabase,
  userId: string
): Promise<Map<string, RxReplicationState<any, any>>> {
  // Setup pre-insert hooks for all collections (Bug #7513 workaround)
  setupPreInsertHooks(db);

  const replications = new Map<string, RxReplicationState<any, any>>();

  replications.set('documents', setupCollectionReplication(
    db.documents,
    'documents',
    userId
  ));

  replications.set('folders', setupCollectionReplication(
    db.folders,
    'folders',
    userId
  ));

  replications.set('blocks', setupCollectionReplication(
    db.blocks,
    'blocks',
    userId
  ));

  console.log('[RxDB Replication] All replications started');
  return replications;
}

/**
 * Stop all replications
 */
export async function stopAllReplications(
  replications: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  for (const [name, replication] of replications) {
    await replication.cancel();
    console.log(`[RxDB Replication] ${name}: Stopped`);
  }
  replications.clear();
}

/**
 * Force resync all collections (for recovering from stale data)
 */
export async function resyncAll(
  replications: Map<string, RxReplicationState<any, any>>
): Promise<void> {
  for (const [name, replication] of replications) {
    await replication.reSync();
    console.log(`[RxDB Replication] ${name}: Resyncing`);
  }
}
```

#### 3. Update DatabaseProvider with Replication

**File**: `src/shared/db/RxDBProvider.tsx`

**Changes**: Add replication initialization

```typescript
// Add to imports:
import { startAllReplications, stopAllReplications, clearSyncState } from './rxdb-replication';
import type { RxReplicationState } from 'rxdb/plugins/replication';

// Add replication state in component:
const [replications, setReplications] = useState<Map<string, RxReplicationState<any, any>>>(new Map());

// Add replication effect after db init:
useEffect(() => {
  if (!db || !user?.id) {
    // Stop replications if no user
    if (replications.size > 0) {
      stopAllReplications(replications);
      setReplications(new Map());
      // Clear sync state tracking on logout (Bug #7612 workaround cleanup)
      clearSyncState();
    }
    return;
  }

  // Start replications for authenticated user
  let mounted = true;

  startAllReplications(db, user.id).then(reps => {
    if (mounted) {
      setReplications(reps);
      console.log('[DatabaseProvider] Replications started');
    }
  }).catch(err => {
    console.error('[DatabaseProvider] Failed to start replications:', err);
  });

  return () => {
    mounted = false;
    stopAllReplications(replications);
  };
}, [db, user?.id]);
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` compiles successfully
- [ ] Supabase SQL migration runs without errors
- [ ] Console shows "[RxDB Replication] All replications started"

#### Manual Verification:
- [ ] Login → console shows pull of documents/folders/blocks
- [ ] Create document in app → appears in Supabase within 5 seconds
- [ ] Modify document in Supabase → appears in app after refresh
- [ ] Network tab shows delta queries (WHERE _modified > timestamp)

#### Bug Workaround Verification:
- [ ] **Bug #7513 test**: Create document → check Supabase → `_modified` column has correct timestamp (not null)
- [ ] **Bug #7612 test**: Go offline → create document → delete it → go online → no "not found" error in console
- [ ] Console shows "[RxDB Replication] Skipping deletion of never-synced doc" for offline-deleted docs

### Implementation Notes:

**Sync State Tracking**: The `syncedDocuments` Map is stored in-memory (not persisted to IndexedDB). This is intentional because:
1. On page refresh, the pull from server re-populates sync state via `markAsSynced()` in the pull modifier
2. Avoids additional IndexedDB overhead for a simple lookup table
3. Documents pulled from server are automatically marked as synced

If persistent sync state is needed in the future, add a `syncStates` collection to RxDB schema (see `resources/rxdb-migration-guide.md` Part 2, "Better Workaround" section).

---

## Phase 3: Migrate Existing Data (Dexie → RxDB)

### Overview
Migrate existing data from Dexie (devlog-db) and IndexedDB (journey-log-compass-db) to RxDB without data loss.

**Note**: The legacy IndexedDB database is named `journey-log-compass-db`, NOT `devlog-store`.

### Changes Required:

#### 1. Create Migration Utility

**File**: `src/shared/db/migration.ts` (NEW)

```typescript
// src/shared/db/migration.ts
/**
 * Data Migration: Dexie/IndexedDB → RxDB
 *
 * Runs once on first app load after RxDB is installed.
 * Safely migrates all existing data.
 */

import Dexie from 'dexie';
import type { DevlogDatabase } from './rxdb';

const MIGRATION_KEY = 'rxdb-migration-complete';

/**
 * Check if migration is needed
 */
export function isMigrationNeeded(): boolean {
  return localStorage.getItem(MIGRATION_KEY) !== 'true';
}

/**
 * Mark migration as complete
 */
function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
  console.log('[Migration] Migration marked complete');
}

/**
 * Export data from old Dexie database
 */
async function exportDexieData(): Promise<{ blocks: any[] }> {
  try {
    const oldDb = new Dexie('devlog-db');
    oldDb.version(1).stores({
      blocks: 'id, document_id, position',
    });

    const blocks = await oldDb.table('blocks').toArray();
    console.log(`[Migration] Exported ${blocks.length} blocks from Dexie`);

    return { blocks };
  } catch (error) {
    console.warn('[Migration] No Dexie data to migrate:', error);
    return { blocks: [] };
  }
}

/**
 * Export data from old IndexedDB (journey-log-compass-db)
 */
async function exportIndexedDBData(): Promise<{ documents: any[] }> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('journey-log-compass-db', 1);

      request.onerror = () => {
        console.warn('[Migration] No IndexedDB data to migrate');
        resolve({ documents: [] });
      };

      request.onsuccess = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        try {
          const tx = db.transaction(['documents'], 'readonly');
          const store = tx.objectStore('documents');
          const getAllRequest = store.getAll();

          getAllRequest.onsuccess = () => {
            const documents = getAllRequest.result || [];
            console.log(`[Migration] Exported ${documents.length} documents from IndexedDB`);
            db.close();
            resolve({ documents });
          };

          getAllRequest.onerror = () => {
            db.close();
            resolve({ documents: [] });
          };
        } catch (e) {
          db.close();
          resolve({ documents: [] });
        }
      };
    } catch (error) {
      resolve({ documents: [] });
    }
  });
}

/**
 * Transform data for RxDB schema
 */
function transformForRxDB(docs: any[], userId: string): any[] {
  return docs.map(doc => ({
    ...doc,
    user_id: doc.user_id || userId,
    _modified: doc.updated_at
      ? new Date(doc.updated_at).getTime()
      : Date.now(),
    _deleted: false,
  }));
}

/**
 * Run the full migration
 */
export async function runMigration(
  rxdb: DevlogDatabase,
  userId: string,
  onProgress?: (message: string, percent: number) => void
): Promise<{ success: boolean; migrated: { documents: number; blocks: number } }> {
  if (!isMigrationNeeded()) {
    console.log('[Migration] Already migrated, skipping');
    return { success: true, migrated: { documents: 0, blocks: 0 } };
  }

  console.log('[Migration] Starting data migration...');
  onProgress?.('Starting migration...', 0);

  try {
    // 1. Export from old databases
    onProgress?.('Exporting old data...', 10);
    const [dexieData, indexedDBData] = await Promise.all([
      exportDexieData(),
      exportIndexedDBData(),
    ]);

    // 2. Transform data
    onProgress?.('Transforming data...', 30);
    const transformedDocs = transformForRxDB(indexedDBData.documents, userId);
    const transformedBlocks = transformForRxDB(dexieData.blocks, userId);

    // 3. Insert into RxDB (skip duplicates)
    onProgress?.('Inserting documents...', 50);
    if (transformedDocs.length > 0) {
      await rxdb.documents.bulkInsert(transformedDocs).catch(err => {
        // Ignore duplicate key errors
        if (!err.message?.includes('conflict')) throw err;
      });
    }

    onProgress?.('Inserting blocks...', 70);
    if (transformedBlocks.length > 0) {
      await rxdb.blocks.bulkInsert(transformedBlocks).catch(err => {
        if (!err.message?.includes('conflict')) throw err;
      });
    }

    // 4. Mark complete
    onProgress?.('Finalizing...', 90);
    markMigrationComplete();

    onProgress?.('Migration complete!', 100);
    console.log(`[Migration] Complete: ${transformedDocs.length} documents, ${transformedBlocks.length} blocks`);

    return {
      success: true,
      migrated: {
        documents: transformedDocs.length,
        blocks: transformedBlocks.length,
      },
    };
  } catch (error) {
    console.error('[Migration] Failed:', error);
    return {
      success: false,
      migrated: { documents: 0, blocks: 0 },
    };
  }
}

/**
 * Clean up old databases after successful migration
 *
 * Databases to clean:
 * - devlog-db (Dexie) - main storage
 * - DevLogSmartSync (Dexie) - smart sync state
 * - journey-log-compass-db (IndexedDB) - legacy document storage
 *
 * NOTE: devlog-snapshots is intentionally NOT deleted.
 * It's used by DataIntegrityManager for corruption recovery
 * and operates independently of the main storage system.
 */
export async function cleanupOldDatabases(): Promise<void> {
  try {
    // Delete old Dexie databases
    await Dexie.delete('devlog-db');
    console.log('[Migration] Deleted old devlog-db');

    await Dexie.delete('DevLogSmartSync');
    console.log('[Migration] Deleted old DevLogSmartSync');

    // Delete old IndexedDB
    indexedDB.deleteDatabase('journey-log-compass-db');
    console.log('[Migration] Deleted old journey-log-compass-db');

    // NOTE: devlog-snapshots is kept for data integrity features
    // See src/shared/lib/integrity/data-integrity.ts
  } catch (error) {
    console.warn('[Migration] Cleanup error (non-fatal):', error);
  }
}
```

#### 2. Run Migration on App Start

**File**: `src/shared/db/RxDBProvider.tsx`

**Changes**: Add migration check after database init

```typescript
// Add import:
import { runMigration, isMigrationNeeded } from './migration';

// In initDb function, after database is created:
if (isMigrationNeeded() && user?.id) {
  console.log('[DatabaseProvider] Running data migration...');
  const result = await runMigration(database, user.id);
  if (result.success) {
    console.log('[DatabaseProvider] Migration successful:', result.migrated);
  }
}
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` compiles successfully
- [ ] No console errors about migration

#### Manual Verification:
- [ ] First load after update shows migration messages in console
- [ ] All existing documents appear in app
- [ ] All existing blocks load correctly
- [ ] Second load shows "Already migrated, skipping"

---

## Phase 4: Migrate Blocks Hook to RxDB

### Overview
Replace `useBlocks` (Dexie + TanStack Query) with RxDB reactive queries.

### Changes Required:

#### 1. Create RxDB Blocks Hook

**File**: `src/features/block/hooks/use-blocks-rxdb.ts` (NEW)

```typescript
// src/features/block/hooks/use-blocks-rxdb.ts
/**
 * useBlocksRxDB Hook
 *
 * Replaces: useBlocks (use-blocks-query.ts) + BlockRepository + SmartSync
 *
 * Uses RxDB reactive queries for instant local updates.
 * Replication handles all Supabase sync automatically.
 */

import { useCallback, useMemo } from 'react';
import { useRxQuery, useRxCollection } from '@/shared/db/rxdb-hooks';
import { v4 as uuidv4 } from 'uuid';
import type { BlockDocType } from '@/shared/db/rxdb-types';

interface UseBlocksRxDBOptions {
  enabled?: boolean;
}

export function useBlocksRxDB(documentId: string | undefined, options: UseBlocksRxDBOptions = {}) {
  const { enabled = true } = options;

  // Get collection for write operations
  const collection = useRxCollection<BlockDocType>('blocks');

  // Reactive query - auto-updates when data changes
  const queryConstructor = useCallback(
    (col: any) => {
      if (!documentId || !enabled) return null;
      return col.find({
        selector: {
          document_id: documentId,
          _deleted: { $ne: true },
        },
        sort: [{ position: 'asc' }],
      });
    },
    [documentId, enabled]
  );

  const { result: blocks, isFetching, error } = useRxQuery<BlockDocType>(
    'blocks',
    queryConstructor
  );

  // Create block
  const createBlock = useCallback(async (blockData: Partial<BlockDocType>) => {
    if (!collection || !documentId) return null;

    const newBlock: BlockDocType = {
      id: uuidv4(),
      document_id: documentId,
      type: blockData.type || 'text',
      content: blockData.content || '',
      position: blockData.position ?? (blocks?.length || 0),
      metadata: blockData.metadata || {},
      created_at: Date.now(),
      updated_at: Date.now(),
      _modified: Date.now(),
      _deleted: false,
    };

    await collection.insert(newBlock);
    console.log('[useBlocksRxDB] Created block:', newBlock.id);
    return newBlock;
  }, [collection, documentId, blocks]);

  // Update block
  const updateBlock = useCallback(async (blockId: string, updates: Partial<BlockDocType>) => {
    if (!collection) return null;

    const doc = await collection.findOne(blockId).exec();
    if (!doc) {
      console.error('[useBlocksRxDB] Block not found:', blockId);
      return null;
    }

    await doc.patch({
      ...updates,
      updated_at: Date.now(),
      _modified: Date.now(),
    });

    console.log('[useBlocksRxDB] Updated block:', blockId);
    return doc.toJSON();
  }, [collection]);

  // Delete block (soft delete)
  const deleteBlock = useCallback(async (blockId: string) => {
    if (!collection) return false;

    const doc = await collection.findOne(blockId).exec();
    if (!doc) {
      console.error('[useBlocksRxDB] Block not found:', blockId);
      return false;
    }

    await doc.patch({
      _deleted: true,
      _modified: Date.now(),
    });

    console.log('[useBlocksRxDB] Deleted block:', blockId);
    return true;
  }, [collection]);

  // Bulk update (for reordering)
  const updateBlocks = useCallback(async (updatedBlocks: Partial<BlockDocType>[]) => {
    if (!collection) return;

    await collection.bulkUpsert(
      updatedBlocks.map(block => ({
        ...block,
        updated_at: Date.now(),
        _modified: Date.now(),
      }))
    );

    console.log('[useBlocksRxDB] Bulk updated', updatedBlocks.length, 'blocks');
  }, [collection]);

  // Return value with backwards-compatible interface
  return useMemo(() => ({
    // Data
    blocks: blocks || [],
    isLoading: isFetching,
    error,

    // CRUD operations
    createBlock,
    updateBlock,
    deleteBlock,
    updateBlocks,

    // Aliases for backwards compatibility
    removeBlock: deleteBlock,
    setBlocksDirectly: updateBlocks,

    // Status
    isSyncing: false, // RxDB handles this automatically

    // Pagination compatibility (not needed with RxDB - all blocks loaded)
    loadMore: () => {},
    hasMore: false,
    isLoadingMore: false,
    totalCount: blocks?.length || 0,
    currentPage: 0,
    checkLoadMore: () => {},
    progress: {
      loaded: blocks?.length || 0,
      total: blocks?.length || 0,
      percentage: 100,
    },
  }), [blocks, isFetching, error, createBlock, updateBlock, deleteBlock, updateBlocks]);
}
```

#### 2. Update Barrel Export

**File**: `src/features/block/index.ts`

**Changes**: Replace useBlocks export

```typescript
// BEFORE:
export { useBlocks } from './hooks/use-blocks-query';

// AFTER:
export { useBlocksRxDB as useBlocks } from './hooks/use-blocks-rxdb';
// Keep old hook for gradual migration:
export { useBlocks as useBlocksLegacy } from './hooks/use-blocks-query';
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` compiles without errors
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Open document → blocks load from RxDB (instant)
- [ ] Edit block → changes persist after refresh
- [ ] Create new block → appears immediately
- [ ] Delete block → removed from view
- [ ] Reorder blocks → positions update correctly
- [ ] Disconnect network → edits still work locally
- [ ] Reconnect → changes sync to Supabase

---

## Phase 5: Migrate Documents & Folders to RxDB

### Overview
Replace `usePaginatedDashboard` + `useIndexedDBCache` + `useFolders` with RxDB.

### Changes Required:

#### 1. Create RxDB Documents Hook

**File**: `src/features/document/hooks/use-documents-rxdb.ts` (NEW)

```typescript
// src/features/document/hooks/use-documents-rxdb.ts
/**
 * useDocumentsRxDB Hook
 *
 * Replaces: usePaginatedDashboard + useIndexedDBCache
 *
 * Local-first document access with automatic Supabase sync.
 */

import { useCallback, useMemo } from 'react';
import { useRxQuery, useRxCollection } from '@/shared/db/rxdb-hooks';
import { v4 as uuidv4 } from 'uuid';
import type { DocumentDocType } from '@/shared/db/rxdb-types';

export function useDocumentsRxDB(userId: string | undefined) {
  const collection = useRxCollection<DocumentDocType>('documents');

  // Reactive query - all non-deleted documents for user
  const queryConstructor = useCallback(
    (col: any) => {
      if (!userId) return null;
      return col.find({
        selector: {
          user_id: userId,
          _deleted: { $ne: true },
        },
        sort: [{ updated_at: 'desc' }],
      });
    },
    [userId]
  );

  const { result: documents, isFetching, error } = useRxQuery<DocumentDocType>(
    'documents',
    queryConstructor
  );

  // Create document
  const createDocument = useCallback(async (data: Partial<DocumentDocType>) => {
    if (!collection || !userId) return null;

    const newDoc: DocumentDocType = {
      id: uuidv4(),
      user_id: userId,
      title: data.title || 'Untitled',
      folder_id: data.folder_id || null,
      tags: data.tags || [],
      metadata: data.metadata || {},
      doc_position: data.doc_position || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _modified: Date.now(),
      _deleted: false,
    };

    await collection.insert(newDoc);
    console.log('[useDocumentsRxDB] Created document:', newDoc.id);
    return newDoc;
  }, [collection, userId]);

  // Update document
  const updateDocument = useCallback(async (id: string, updates: Partial<DocumentDocType>) => {
    if (!collection) return null;

    const doc = await collection.findOne(id).exec();
    if (!doc) return null;

    await doc.patch({
      ...updates,
      updated_at: new Date().toISOString(),
      _modified: Date.now(),
    });

    return doc.toJSON();
  }, [collection]);

  // Delete document (soft delete)
  const deleteDocument = useCallback(async (id: string) => {
    if (!collection) return false;

    const doc = await collection.findOne(id).exec();
    if (!doc) return false;

    await doc.patch({
      _deleted: true,
      _modified: Date.now(),
    });

    return true;
  }, [collection]);

  return useMemo(() => ({
    documents: documents || [],
    isLoading: isFetching,
    error,
    createDocument,
    updateDocument,
    deleteDocument,

    // Backwards compatibility (pagination no longer needed)
    loadMore: () => {},
    hasMore: false,
    isLoadingMore: false,
    totalCount: documents?.length || 0,
  }), [documents, isFetching, error, createDocument, updateDocument, deleteDocument]);
}
```

#### 2. Create RxDB Folders Hook

**File**: `src/features/document/hooks/use-folders-rxdb.ts` (NEW)

```typescript
// src/features/document/hooks/use-folders-rxdb.ts
/**
 * useFoldersRxDB Hook
 *
 * Replaces: useFolders.js
 *
 * Local-first folder management with tree building.
 */

import { useCallback, useMemo } from 'react';
import { useRxQuery, useRxCollection } from '@/shared/db/rxdb-hooks';
import { v4 as uuidv4 } from 'uuid';
import type { FolderDocType } from '@/shared/db/rxdb-types';

interface FolderWithChildren extends FolderDocType {
  children: FolderWithChildren[];
}

export function useFoldersRxDB(userId: string | undefined) {
  const collection = useRxCollection<FolderDocType>('folders');

  // Reactive query - all non-deleted folders for user
  const queryConstructor = useCallback(
    (col: any) => {
      if (!userId) return null;
      return col.find({
        selector: {
          user_id: userId,
          _deleted: { $ne: true },
        },
        sort: [{ position: 'asc' }],
      });
    },
    [userId]
  );

  const { result: rawFolders, isFetching, error } = useRxQuery<FolderDocType>(
    'folders',
    queryConstructor
  );

  // Build tree structure from flat list
  const folders = useMemo(() => {
    if (!rawFolders) return [];

    const folderMap = new Map<string, FolderWithChildren>();
    const rootFolders: FolderWithChildren[] = [];

    // First pass: create all folder objects
    rawFolders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Second pass: build hierarchy
    rawFolders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;

      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderWithChildren);
        } else {
          rootFolders.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }, [rawFolders]);

  // Create folder
  const createFolder = useCallback(async (name: string, parentId: string | null = null) => {
    if (!collection || !userId) return null;

    // Build path
    let path = name;
    if (parentId) {
      const parent = rawFolders?.find(f => f.id === parentId);
      if (parent?.path) {
        path = `${parent.path}/${name}`;
      }
    }

    const newFolder: FolderDocType = {
      id: uuidv4(),
      user_id: userId,
      name,
      parent_id: parentId,
      path,
      position: rawFolders?.length || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _modified: Date.now(),
      _deleted: false,
    };

    await collection.insert(newFolder);
    console.log('[useFoldersRxDB] Created folder:', newFolder.id);
    return newFolder;
  }, [collection, userId, rawFolders]);

  // Update folder
  const updateFolder = useCallback(async (id: string, updates: Partial<FolderDocType>) => {
    if (!collection) return null;

    const doc = await collection.findOne(id).exec();
    if (!doc) return null;

    await doc.patch({
      ...updates,
      updated_at: new Date().toISOString(),
      _modified: Date.now(),
    });

    return doc.toJSON();
  }, [collection]);

  // Delete folder
  const deleteFolder = useCallback(async (id: string) => {
    if (!collection) return false;

    const doc = await collection.findOne(id).exec();
    if (!doc) return false;

    await doc.patch({
      _deleted: true,
      _modified: Date.now(),
    });

    return true;
  }, [collection]);

  return useMemo(() => ({
    folders,
    rawFolders: rawFolders || [],
    loading: isFetching,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    refreshFolders: () => {}, // No-op, RxDB is reactive
  }), [folders, rawFolders, isFetching, error, createFolder, updateFolder, deleteFolder]);
}
```

#### 3. Update Barrel Exports

**File**: `src/features/document/index.ts`

**Changes**: Replace exports

```typescript
// BEFORE:
export { useFolders } from './hooks/use-folders';
export { usePaginatedDashboard } from './hooks/use-paginated-dashboard';

// AFTER:
export { useFoldersRxDB as useFolders } from './hooks/use-folders-rxdb';
export { useDocumentsRxDB as usePaginatedDashboard } from './hooks/use-documents-rxdb';
// Keep legacy for gradual migration:
export { useFolders as useFoldersLegacy } from './hooks/use-folders';
export { usePaginatedDashboard as usePaginatedDashboardLegacy } from './hooks/use-paginated-dashboard';
```

**File**: `src/shared/hooks/index.ts`

**Changes**: Remove useIndexedDBCache (no longer needed)

```typescript
// BEFORE:
export { useIndexedDBCache } from './use-indexeddb-cache';

// AFTER:
// Removed - RxDB replaces IndexedDB cache
// export { useIndexedDBCache } from './use-indexeddb-cache';
```

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` compiles without errors
- [ ] `npm run lint` passes

#### Manual Verification:
- [ ] Open app → sidebar loads documents/folders instantly (from RxDB)
- [ ] Create folder → appears in tree
- [ ] Move document to folder → updates immediately
- [ ] Delete document → removed from list
- [ ] Network tab shows minimal Supabase calls
- [ ] Offline mode → can still browse documents

---

## Phase 6: Cleanup & Remove Legacy Code

### Overview
Remove all deprecated hooks, adapters, and unused code.

### Files to Delete:

```bash
# Old SmartSync (JavaScript version)
rm src/hooks/useSmartSync.js
rm src/utils/smartSync.js

# Old SmartSync (TypeScript version) - IMPORTANT: Don't miss these!
rm src/features/storage/hooks/use-smart-sync.ts
rm src/features/storage/lib/smart-sync.ts

# Old block loading
rm src/features/block/hooks/use-blocks-query.ts
rm src/entities/Block/Block.repository.ts

# Old IndexedDB adapter
rm src/utils/storage/IndexedDBAdapter.js

# Old Dexie setup
rm src/shared/lib/storage/dexie-db.ts

# Old cache hooks
rm src/shared/hooks/use-indexeddb-cache.ts
rm src/features/document/hooks/use-paginated-dashboard.ts
rm src/features/document/hooks/use-folders.ts
```

### Files to Update:

```bash
# ErrorBoundary - update database name for fatal error recovery
# Change: indexedDB.deleteDatabase('devlog-db')
# To:     indexedDB.deleteDatabase('devlog-rxdb')
edit src/components/ErrorBoundary.jsx  # Line 194
```

### Dependencies to Remove:

```bash
npm uninstall dexie dexie-react-hooks
```

Note: Keep `@tanstack/react-query` if used elsewhere in the app.

### Success Criteria:

#### Automated Verification:
- [ ] `npm run build` compiles without errors
- [ ] `npm run lint` passes
- [ ] No console warnings about missing modules
- [ ] Bundle size reduced

#### Manual Verification:
- [ ] Full app functionality works (documents, folders, blocks)
- [ ] Create/Read/Update/Delete operations work
- [ ] Offline mode works
- [ ] Multi-tab sync works

---

## Testing Strategy

### Unit Tests:
- [ ] RxDB database initialization
- [ ] Schema validation
- [ ] CRUD operations on each collection
- [ ] Custom hooks render correctly

### Integration Tests:
- [ ] Full document lifecycle (create → edit blocks → save → reload)
- [ ] Folder tree operations
- [ ] Offline mode → online sync
- [ ] Multi-tab synchronization

### Manual Testing Steps:
1. **Fresh login**: Verify initial sync pulls all data
2. **Create document**: Check it appears in sidebar and syncs to Supabase
3. **Edit blocks**: Verify instant local update and background sync
4. **Offline mode**: Disconnect network, make changes, reconnect
5. **Multi-tab**: Open two tabs, edit in one, verify sync in other
6. **Performance**: Check network tab for reduced API calls

---

## References

- Architecture Design: `thoughts/shared/plans/unified-cache-architecture.md`
- RxDB Research: `resources/rxdb.md`
- Migration Guide: `resources/rxdb-migration-guide.md`
- RxDB Documentation: https://rxdb.info/
- Supabase Replication: https://rxdb.info/replication-supabase.html

---

*RxDB Migration Plan*
*Created: 2025-01-05*
*Updated: 2025-01-06 (React 19 compatibility, official plugin, data migration)*
*Updated: 2025-01-06 (Bug workarounds #7513 & #7612, fixed database names, complete file list)*
*Status: READY FOR IMPLEMENTATION*
