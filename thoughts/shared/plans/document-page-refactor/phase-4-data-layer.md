# Phase 4: Data Layer (Repository Pattern)

> **Goal**: Create unified data layer using TanStack Query + Dexie, replacing 5+ overlapping caches.

**Status**: Phase 4 COMPLETE ✅ (2025-01-04)
- ✅ Phase 4.1: Dependencies + Schemas (dexie-react-hooks, Document.schema.ts, dexie-db.ts, sync-queue-manager.ts)
- ✅ Phase 4.2: Repositories (Document.repository.ts, Block.repository.ts)
- ✅ Phase 4.3: Query Hooks (use-document.ts, use-blocks-query.ts)
- ✅ Feature flags created (feature-flags.ts)
- ✅ Phase 4.4: Migration COMPLETE (2025-01-04)
  - ✅ Step 9: useBlocks exported from feature barrel
  - ✅ Step 10: API Compatibility layer added to useBlocks
  - ✅ Step 11: Feature flags ready for use
  - ✅ Step 12-13: DocumentEditor wired to use useBlocks() hook
  - ✅ Step 15: sessionCache has deprecation notices
  - ✅ ExpandedViewEnhanced.jsx DELETED (replaced by DocumentEditor.tsx)
  - ⏳ Step 14: Legacy file removal (use-optimized-loader.ts, use-paginated-loader.ts - deferred)
- ⏳ Phase 4.5: Verification (pending - manual testing)

## Current Architecture (Post-Migration)

```
┌─────────────────────────────────────────────────────────────┐
│                    DocumentEditor.tsx                        │
│                    (uses useBlocks hook)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    useBlocks() hook                          │
│  - useLiveQuery (Dexie) → instant local reactivity          │
│  - useQuery (TanStack) → background Supabase sync           │
│  - initialBlocks → seeds Dexie from entry.blocks            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  BlockRepository                             │
│  - getBlocks() → Dexie first, Supabase fallback             │
│  - updateBlock() → Dexie only (SmartSync handles Supabase)  │
│  - fetchBlocksFromServer() → deserialize Supabase data      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│    Dexie      │           │   Supabase    │
│  (Local DB)   │           │   (Remote)    │
│  Instant R/W  │           │   via         │
│  useLiveQuery │           │   SmartSync   │
└───────────────┘           └───────────────┘

NOTE: BlockRepository stores to Dexie for local reactivity.
SmartSync (via useBlockOperations) handles Supabase syncing.
This avoids double-syncing conflicts.
```

---

## Best Practices for This Phase

### Single Source of Truth Rules
1. **One cache, one truth** - TanStack Query is THE cache
2. **Components never access Supabase directly** - Always through repository
3. **Dexie is for offline, not caching** - Persistence, not performance
4. **Invalidate, don't update manually** - Let Query refetch
5. **Optimistic updates via Query** - Not manual setState

### Repository Pattern Rules
1. **Repository is async** - Always returns Promise
2. **Repository handles errors** - Components get clean data or error
3. **Repository is stateless** - No internal state, use Query cache
4. **Repository is testable** - Easy to mock for tests
5. **Repository abstracts source** - Components don't know Supabase vs Dexie

### Offline-First Rules
1. **Write to Dexie first** - Instant local persistence
2. **Queue for Supabase** - Background sync when online
3. **Handle conflicts** - Last-write-wins or merge strategy
4. **Show sync status** - User knows when synced
5. **Work fully offline** - No features require network

### TanStack Query Rules
1. **Queries for reads** - `useQuery` for fetching
2. **Mutations for writes** - `useMutation` for changes
3. **Invalidate after mutation** - Keep cache fresh
4. **Stale time = 5 min** - Documents don't change often
5. **Cache time = 30 min** - Keep data for back navigation

### Data Integrity Rules
1. **Validate on read** - Zod parse from Supabase
2. **Validate on write** - Zod parse before Supabase
3. **IDs are UUIDs** - Never sequential, always random
4. **Timestamps are ISO strings** - Consistent format
5. **Soft delete with deleted_at** - Never hard delete

### Migration Rules
1. **Replace one cache at a time** - Start with block hooks (use-paginated-loader, use-optimized-loader)
2. **Feature flag new data layer** - Toggle back if issues
3. **Monitor cache hit rate** - Should improve, not regress
4. **Test offline thoroughly** - Airplane mode testing
5. **sessionCache is deeply integrated** - Used in 6 files with 35+ method calls, migrate incrementally

---

## Objectives

1. Create `DocumentRepository` (abstracts Supabase + Dexie)
2. Create `BlockRepository` (abstracts block storage)
3. Replace sessionCache with TanStack Query
4. Replace optimizedBlockLoader with repository
5. Implement single cache coordinator
6. Offline-first with background sync

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│                                                          │
│   useDocument(id)      useBlocks(docId)                 │
└────────────┬─────────────────────┬──────────────────────┘
             │                     │
             ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Repository Layer                       │
│                                                          │
│   DocumentRepository         BlockRepository             │
│   - getDocument()           - getBlocks()               │
│   - saveDocument()          - updateBlock()             │
│   - deleteDocument()        - deleteBlock()             │
└────────────┬─────────────────────┬──────────────────────┘
             │                     │
     ┌───────┴───────┐     ┌──────┴──────┐
     ▼               ▼     ▼             ▼
┌─────────┐    ┌─────────┐    ┌─────────────┐
│TanStack │    │  Dexie  │    │  Supabase   │
│ Query   │    │ (Local) │    │  (Remote)   │
│(Cache)  │    │         │    │             │
└─────────┘    └─────────┘    └─────────────┘
```

---

## What Gets Replaced

| Current | Replaced By |
|---------|-------------|
| sessionCache | TanStack Query cache |
| optimizedBlockLoader cache | TanStack Query cache |
| MultiLayerStorage memoryCache | TanStack Query cache |
| usePaginatedBlockLoader | useBlocks() hook |
| useOptimizedBlockLoader | useBlocks() hook |
| useIndexedDBCache | Dexie reactive queries |

---

## Cache Migration Mapping

**Files using sessionCache that need migration:**

| File Path | Current Import/Usage | Replaced By | Action |
|-----------|---------------------|-------------|--------|
| `src/features/block/hooks/use-paginated-loader.ts` | sessionCache.getBlocks/cacheBlocks/updateBlocks | useBlocks() hook | Replace hook implementation |
| `src/features/block/hooks/use-optimized-loader.ts` | sessionCache.getBlocks/cacheBlocks/updateBlocks | useBlocks() hook | Replace hook implementation |
| `src/pages/Dashboard.jsx:31,457,572` | sessionCache.removeDocument/getAllDocuments | useDocuments() + repository | Update to repository pattern |
| `src/components/ExpandedViewEnhanced.jsx:12,109,933,2402,2487` | sessionCache.logPerformanceSummary/clearBlock/clearDocument | Repository + TanStack Query invalidation | Remove sessionCache dependency |
| `src/hooks/usePaginatedBlockLoader.js` | sessionCache (legacy JS) | Delete file | Remove - replaced by TS version |
| `src/hooks/useOptimizedBlockLoader.js` | sessionCache (legacy JS) | Delete file | Remove - replaced by TS version |

**Files using MultiLayerStorage:**

| File Path | Current Usage | Replaced By | Action |
|-----------|--------------|-------------|--------|
| `src/features/storage/hooks/use-multi-layer.ts` | MultiLayerStorage import | Repository pattern | Deprecate, use repository |
| `src/hooks/useMultiLayerStorage.js` | Legacy hook | Delete file | Remove |
| `src/utils/storage/SyncEngine.js` | Uses MultiLayerStorage | New SyncQueueManager | Replace sync logic |

---

## Prerequisites

Before starting execution:

1. **Create Document entity directory**:
   ```bash
   mkdir -p src/entities/Document
   ```
   Note: `src/entities/Block/` already exists with `index.ts`

2. **Verify TanStack Query is configured** (already done in Phase 1):
   - `src/shared/api/query-client.ts` ✓
   - `src/shared/api/query-keys.ts` ✓
   - QueryClientProvider in `src/main.jsx` ✓

---

## Execution Steps (Atomic)

### Phase 4.1: Foundation (Dependencies + Schemas)

**Step 1: Install Dexie**
```bash
npm install dexie dexie-react-hooks
```
- No code changes, just dependency

**Step 2: Create Document Schema**
- File: `src/entities/Document/Document.schema.ts`
- Uses Zod, follows pattern from `src/features/block/lib/schemas.ts`
- See [File Contents: Document.schema.ts](#file-documentschema.ts)

**Step 3: Create Dexie Database**
- File: `src/shared/lib/storage/dexie-db.ts`
- See [File Contents: dexie-db.ts](#file-dexie-dbts)

**Step 4: Create SyncQueueManager**
- File: `src/shared/lib/storage/sync-queue-manager.ts`
- Handles offline queue and background sync
- See [File Contents: sync-queue-manager.ts](#file-sync-queue-managerts)

### Phase 4.2: Repositories

**Step 5: Create Document Repository**
- File: `src/entities/Document/Document.repository.ts`
- Hybrid pattern: Dexie first, Supabase sync
- See [File Contents: Document.repository.ts](#file-documentrepositoryts)

**Step 6: Create Block Repository**
- File: `src/entities/Block/Block.repository.ts`
- Same hybrid pattern
- See [File Contents: Block.repository.ts](#file-blockrepositoryts)

### Phase 4.3: Query Hooks

**Step 7: Create useDocument Hook**
- File: `src/features/document/hooks/use-document.ts`
- Uses useLiveQuery + useQuery hybrid
- See [File Contents: use-document.ts](#file-use-documentts)

**Step 8: Create useBlocks Hook**
- File: `src/features/block/hooks/use-blocks-query.ts`
- See [File Contents: use-blocks-query.ts](#file-use-blocks-queryts)

### Phase 4.4: Migration

> **CRITICAL**: useBlocks() is missing APIs that usePaginatedBlockLoader provides.
> Before migration, update useBlocks() to include compatibility layer (see Step 9a).

---

#### Step 9: Export useBlocks from Feature Barrel

**File**: `src/features/block/index.ts`

**Add after line 8** (after usePaginatedBlockLoader export):
```typescript
export { useBlocks } from './hooks/use-blocks-query';
```

**Verification**: Import should work: `import { useBlocks } from '@/features/block';`

---

#### Step 10: Add API Compatibility to useBlocks

**CRITICAL Gap Analysis** (verified by reading both hooks):

| Property | usePaginatedBlockLoader | useBlocks | Action |
|----------|------------------------|-----------|--------|
| `loadMore` | ✅ | ❌ | Add (returns noop for now) |
| `hasMore` | ✅ | ❌ | Add (always false - no pagination) |
| `isLoadingMore` | ✅ | ❌ | Add (always false) |
| `removeBlock` | ✅ | ❌ `deleteBlock` | Add alias |
| `setBlocksDirectly` | ✅ | ❌ | Add (calls updateBlocks) |
| `checkLoadMore` | ✅ | ❌ | Add (noop function) |
| `progress` | ✅ | ❌ | Add (computed from blocks.length) |
| `totalCount` | ✅ | ❌ | Add (= blocks.length) |
| `currentPage` | ✅ | ❌ | Add (always 0) |

**File**: `src/features/block/hooks/use-blocks-query.ts`

**Add to return object (after line 125)**:
```typescript
return {
  blocks,
  isLoading,
  isSyncing,
  error: remoteQuery.error,

  // Single block operations
  updateBlock,
  createBlock,
  deleteBlock,

  // Bulk operations
  updateBlocks,

  // Mutation states
  isUpdating: updateBlockMutation.isPending || updateBlocksMutation.isPending,
  isCreating: createBlockMutation.isPending,
  isDeleting: deleteBlockMutation.isPending,

  // === COMPATIBILITY LAYER (for usePaginatedBlockLoader consumers) ===
  // Pagination (not applicable - all blocks loaded at once)
  loadMore: () => {}, // noop - no pagination
  hasMore: false,
  isLoadingMore: false,
  totalCount: blocks.length,
  currentPage: 0,
  checkLoadMore: () => {}, // noop - no infinite scroll

  // Aliases for API compatibility
  removeBlock: deleteBlock, // alias
  setBlocksDirectly: updateBlocks, // alias (updateBlocks handles bulk)

  // Progress tracking (computed)
  progress: {
    loaded: blocks.length,
    total: blocks.length,
    percentage: 100, // All blocks loaded
  },
};
```

**Note**: This compatibility layer allows gradual migration without breaking consumers.

---

#### Step 11: Feature Flag Integration Pattern

**File**: `src/shared/lib/feature-flags.ts` (already exists)

**Usage Pattern for Gradual Rollout**:

```typescript
// In any consumer (e.g., ExpandedViewEnhanced.jsx)
import { isNewDataLayerEnabled } from '@/shared/lib/feature-flags';
import { usePaginatedBlockLoader, useBlocks } from '@/features/block';

function MyComponent({ documentId }) {
  // Feature flag determines which hook to use
  const useNewDataLayer = isNewDataLayerEnabled();

  // Both hooks have compatible return shapes after Step 10
  const blockLoader = useNewDataLayer
    ? useBlocks(documentId)
    : usePaginatedBlockLoader(documentId, entry);

  const { blocks, isLoading, updateBlock, updateBlocks } = blockLoader;

  // ... rest of component works unchanged
}
```

**Toggle Commands** (from browser console):
```javascript
// Enable new data layer
__enableNewDataLayer()  // Then refresh

// Disable (rollback)
__disableNewDataLayer() // Then refresh
```

---

#### Step 12: Update ExpandedViewEnhanced.jsx

**Verified sessionCache usage locations**:

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 12 | `import { sessionCache } from '@/shared/lib';` | Remove import |
| 109 | `sessionCache.logPerformanceSummary();` | Remove (use TanStack DevTools) |
| 933-934 | `window.sessionCache.clearBlock(entry.id, blockId);` | `queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(entry.id) });` |
| 2402 | `sessionCache.clearDocument(entry.id);` | `queryClient.invalidateQueries({ queryKey: documentKeys.detail(entry.id) });` |
| 2487 | `sessionCache.clearDocument(entry.id);` | `queryClient.invalidateQueries({ queryKey: documentKeys.detail(entry.id) });` |

**Atomic Steps**:

**12a. Add TanStack imports**:
```typescript
// Add at top of file
import { useQueryClient } from '@tanstack/react-query';
import { documentKeys, blockKeys } from '@/shared/api/query-keys';
```

**12b. Get queryClient in component**:
```typescript
// Inside ExpandedViewEnhanced function, near other hooks
const queryClient = useQueryClient();
```

**12c. Replace line 109** (logPerformanceSummary):
```typescript
// BEFORE (line 109):
sessionCache.logPerformanceSummary();

// AFTER:
// Removed - use TanStack Query DevTools for cache monitoring
console.log('[CACHE-TRACK] Cache stats available in TanStack Query DevTools');
```

**12d. Replace lines 933-934** (clearBlock):
```typescript
// BEFORE (lines 933-934):
if (window.sessionCache && entry?.id) {
  window.sessionCache.clearBlock(entry.id, blockId);
}

// AFTER:
if (entry?.id) {
  queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(entry.id) });
}
```

**12e. Replace lines 2402 and 2487** (clearDocument):
```typescript
// BEFORE:
sessionCache.clearDocument(entry.id);
console.log('Cleared from session cache');

// AFTER:
queryClient.invalidateQueries({ queryKey: documentKeys.detail(entry.id) });
queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
console.log('Cleared from TanStack Query cache');
```

**12f. Remove sessionCache import** (line 12):
```typescript
// BEFORE:
import { sessionCache } from '@/shared/lib';

// AFTER:
// Line deleted
```

**12g. Feature flag wrapper** (optional, for gradual rollout):
```typescript
// Replace block loader hook usage with feature flag pattern from Step 11
// This allows toggling between old and new data layer
```

---

#### Step 13: Update Dashboard.jsx

**Verified sessionCache usage locations**:

| Line | Current Code | Replacement |
|------|-------------|-------------|
| 31 | `import { sessionCache } from '@/shared/lib';` | Remove import |
| 456-457 | `sessionCache.removeDocument(tabId);` | `queryClient.invalidateQueries(...)` |
| 572 | `sessionCache.getAllDocuments()` | Use `useDocuments()` hook |

**Atomic Steps**:

**13a. Add TanStack imports**:
```typescript
// Add at top of file
import { useQueryClient } from '@tanstack/react-query';
import { documentKeys } from '@/shared/api/query-keys';
import { useDocuments } from '@/features/document/hooks/use-document';
```

**13b. Get queryClient and documents in component**:
```typescript
// Inside Dashboard function
const queryClient = useQueryClient();
const { documents: cachedDocuments } = useDocuments();
```

**13c. Replace lines 456-457** (removeDocument):
```typescript
// BEFORE:
sessionCache.removeDocument(tabId);
console.log(`[MULTI-TAB] 🗑️ Tab closed, cache cleared for document ${tabId?.substring(0, 8)}`);

// AFTER:
queryClient.invalidateQueries({ queryKey: documentKeys.detail(tabId) });
console.log(`[MULTI-TAB] 🗑️ Tab closed, TanStack cache cleared for document ${tabId?.substring(0, 8)}`);
```

**13d. Replace line 572** (getAllDocuments):
```typescript
// BEFORE:
const cachedDocs = sessionCache.getAllDocuments();
const cachedMap = new Map(cachedDocs.map(doc => [doc.id, doc]));

// AFTER:
// cachedDocuments comes from useDocuments() hook (see 13b)
const cachedMap = new Map(cachedDocuments.map(doc => [doc.id, doc]));
```

**13e. Remove sessionCache import** (line 31):
```typescript
// BEFORE:
import { sessionCache } from '@/shared/lib';

// AFTER:
// Line deleted
```

---

#### Step 14: Remove Legacy Files

After migration is verified working:

```bash
# Delete legacy JS hooks (TS versions in features/block/ replace them)
rm src/hooks/usePaginatedBlockLoader.js
rm src/hooks/useOptimizedBlockLoader.js
rm src/hooks/useMultiLayerStorage.js
```

**Note**: Only delete after feature flag has been enabled and tested in production for 1 week.

---

#### Step 15: Deprecate sessionCache

**File**: `src/shared/lib/storage/session-cache.ts`

**Add at top of file (after imports)**:
```typescript
/**
 * @deprecated Use TanStack Query + Dexie instead.
 *
 * Migration guide:
 * - getBlocks() → useBlocks() from '@/features/block'
 * - getAllDocuments() → useDocuments() from '@/features/document/hooks/use-document'
 * - clearDocument() → queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) })
 * - clearBlock() → queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(docId) })
 *
 * This file will be removed after all consumers are migrated.
 */

// Log deprecation warning on first use
let hasLoggedDeprecation = false;
function logDeprecationWarning(method: string) {
  if (!hasLoggedDeprecation) {
    console.warn(
      `[DEPRECATED] sessionCache.${method}() is deprecated. ` +
      `Use TanStack Query + Dexie. See session-cache.ts for migration guide.`
    );
    hasLoggedDeprecation = true;
  }
}
```

**Add to each method** (e.g., getBlocks, getAllDocuments):
```typescript
getBlocks(documentId: string) {
  logDeprecationWarning('getBlocks');
  // ... existing code
}
```

### Phase 4.5: Verification

**Step 16: Offline Testing**
- Chrome DevTools → Network → Offline
- Verify create/edit/sync flow

**Step 17: Performance Verification**
- TanStack Query DevTools cache hit rate
- Compare with pre-migration baseline

---

## File Contents

### File: Document.schema.ts

```typescript
// src/entities/Document/Document.schema.ts
/**
 * Document Schema using Zod
 *
 * Derived from Supabase 'documents' table structure.
 * See: src/shared/lib/storage/adapters/supabase.ts:72-94
 */

import { z } from 'zod';

// =============================================================================
// Document Metadata Schema
// =============================================================================

export const DocumentMetadataSchema = z.object({
  preview: z.string().optional(),
  syncStatus: z.enum(['synced', 'pending', 'error']).optional(),
  savedAt: z.string().optional(),
}).passthrough(); // Allow additional properties

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

// =============================================================================
// Document Schema
// =============================================================================

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().default('Untitled'),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  metadata: DocumentMetadataSchema.optional(),
  is_template: z.boolean().default(false),
  project_id: z.string().uuid().nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  position: z.number().optional(),
  user_id: z.string().uuid().optional(),
});

export type DocumentData = z.infer<typeof DocumentSchema>;

// =============================================================================
// App-facing Document (transformed from DB)
// =============================================================================

export const AppDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  preview: z.string().default('Click to view document...'),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  isTemplate: z.boolean(),
  projectId: z.string().uuid().nullable().optional(),
  folder_id: z.string().uuid().nullable().optional(),
  position: z.number().optional(),
  metadata: DocumentMetadataSchema.optional(),
});

export type AppDocument = z.infer<typeof AppDocumentSchema>;

// =============================================================================
// Folder Schema
// =============================================================================

export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parent_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  position: z.number().optional(),
});

export type FolderData = z.infer<typeof FolderSchema>;

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform Supabase document to app format
 */
export function toAppDocument(doc: DocumentData): AppDocument {
  return {
    id: doc.id,
    title: doc.title,
    preview: doc.metadata?.preview || 'Click to view document...',
    createdAt: doc.created_at || new Date().toISOString(),
    updatedAt: doc.updated_at || new Date().toISOString(),
    tags: doc.tags || [],
    isTemplate: doc.is_template || false,
    projectId: doc.project_id,
    folder_id: doc.folder_id,
    position: doc.position,
    metadata: doc.metadata || {},
  };
}

/**
 * Transform app document to Supabase format
 */
export function toDbDocument(doc: AppDocument, userId: string): DocumentData {
  return {
    id: doc.id,
    title: doc.title,
    tags: doc.tags,
    created_at: doc.createdAt,
    updated_at: new Date().toISOString(),
    metadata: {
      ...doc.metadata,
      preview: doc.preview,
    },
    is_template: doc.isTemplate,
    project_id: doc.projectId || null,
    folder_id: doc.folder_id || null,
    position: doc.position,
    user_id: userId,
  };
}
```

### File: dexie-db.ts

```typescript
// src/shared/lib/storage/dexie-db.ts
/**
 * Dexie v4 Database for Offline-First Storage
 *
 * Uses EntityTable for type-safe tables.
 * Mirrors Supabase schema for seamless sync.
 */

import Dexie, { type EntityTable } from 'dexie';
import type { DocumentData } from '@/entities/Document/Document.schema';
import type { BlockData } from '@/features/block/lib/schemas';

// =============================================================================
// Sync Queue Types
// =============================================================================

export interface SyncQueueItem {
  id: string;
  recordType: 'document' | 'block';
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  createdAt: number;
  lastAttempt: number | null;
  error: string | null;
}

// =============================================================================
// Extended Types with Sync Metadata
// =============================================================================

export interface LocalDocument extends DocumentData {
  _isSynced: boolean;
  _localUpdatedAt: number;
  _serverUpdatedAt: string | null;
}

export interface LocalBlock extends BlockData {
  document_id: string;
  _isSynced: boolean;
  _localUpdatedAt: number;
}

// =============================================================================
// Database Definition
// =============================================================================

export class DevlogDatabase extends Dexie {
  documents!: EntityTable<LocalDocument, 'id'>;
  blocks!: EntityTable<LocalBlock, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('devlog-db');

    this.version(1).stores({
      // Documents: indexed by id, folder_id, and sync status
      documents: 'id, folder_id, updated_at, _isSynced, _localUpdatedAt',

      // Blocks: indexed by id, document_id (for querying all blocks in a doc), position
      blocks: 'id, document_id, position, _isSynced',

      // Sync Queue: for offline operations waiting to sync
      syncQueue: 'id, status, recordType, recordId, createdAt',
    });
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

export const db = new DevlogDatabase();

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get all unsynced documents
 */
export async function getUnsyncedDocuments(): Promise<LocalDocument[]> {
  return db.documents.where('_isSynced').equals(0).toArray();
}

/**
 * Get all pending sync queue items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('status').equals('pending').toArray();
}

/**
 * Mark document as synced
 */
export async function markDocumentSynced(
  documentId: string,
  serverUpdatedAt: string
): Promise<void> {
  await db.documents.update(documentId, {
    _isSynced: true,
    _serverUpdatedAt: serverUpdatedAt,
  });
}

/**
 * Clear all local data (for logout)
 */
export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', [db.documents, db.blocks, db.syncQueue], async () => {
    await db.documents.clear();
    await db.blocks.clear();
    await db.syncQueue.clear();
  });
}

export default db;
```

### File: sync-queue-manager.ts

```typescript
// src/shared/lib/storage/sync-queue-manager.ts
/**
 * Sync Queue Manager
 *
 * Handles offline queue and background sync to Supabase.
 * Uses Dexie syncQueue table for persistence.
 */

import { db, type SyncQueueItem } from './dexie-db';
import { optimizedSupabase } from '@/shared/api';

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type RecordType = 'document' | 'block';

interface SyncQueueManagerOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  batchSize?: number;
}

export class SyncQueueManager {
  private isProcessing = false;
  private maxRetries: number;
  private retryDelayMs: number;
  private batchSize: number;
  private onlineHandler: () => void;

  constructor(options: SyncQueueManagerOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.batchSize = options.batchSize ?? 10;

    // Listen for online events
    this.onlineHandler = () => this.processQueue();
    window.addEventListener('online', this.onlineHandler);
  }

  /**
   * Add operation to sync queue
   */
  async enqueue(
    recordType: RecordType,
    recordId: string,
    operation: SyncOperation,
    data: Record<string, unknown>
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      recordType,
      recordId,
      operation,
      data,
      status: 'pending',
      retryCount: 0,
      createdAt: Date.now(),
      lastAttempt: null,
      error: null,
    };

    await db.syncQueue.add(item);

    // Try to process immediately if online
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  /**
   * Process pending sync queue items
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    this.isProcessing = true;

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .limit(this.batchSize)
        .toArray();

      for (const item of pendingItems) {
        await this.processItem(item);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process single sync queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    // Mark as syncing
    await db.syncQueue.update(item.id, {
      status: 'syncing',
      lastAttempt: Date.now(),
    });

    try {
      const supabase = optimizedSupabase.getClient();
      const table = item.recordType === 'document' ? 'documents' : 'blocks';

      switch (item.operation) {
        case 'CREATE':
        case 'UPDATE':
          await supabase.from(table).upsert(item.data);
          break;
        case 'DELETE':
          await supabase
            .from(table)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.recordId);
          break;
      }

      // Success - remove from queue
      await db.syncQueue.delete(item.id);

      // Mark local record as synced
      if (item.recordType === 'document') {
        await db.documents.update(item.recordId, {
          _isSynced: true,
          _serverUpdatedAt: new Date().toISOString(),
        });
      } else {
        await db.blocks.update(item.recordId, { _isSynced: true });
      }
    } catch (error) {
      const retryCount = item.retryCount + 1;

      if (retryCount >= this.maxRetries) {
        // Max retries reached - mark as failed
        await db.syncQueue.update(item.id, {
          status: 'failed',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } else {
        // Retry later
        await db.syncQueue.update(item.id, {
          status: 'pending',
          retryCount,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Schedule retry with exponential backoff
        setTimeout(() => this.processQueue(), this.retryDelayMs * Math.pow(2, retryCount));
      }
    }
  }

  /**
   * Get sync status summary
   */
  async getStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
  }> {
    const [pending, syncing, failed] = await Promise.all([
      db.syncQueue.where('status').equals('pending').count(),
      db.syncQueue.where('status').equals('syncing').count(),
      db.syncQueue.where('status').equals('failed').count(),
    ]);

    return { pending, syncing, failed };
  }

  /**
   * Retry failed items
   */
  async retryFailed(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0 });

    this.processQueue();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    window.removeEventListener('online', this.onlineHandler);
  }
}

// Singleton instance
export const syncQueueManager = new SyncQueueManager();
export default syncQueueManager;
```

### File: Document.repository.ts

```typescript
// src/entities/Document/Document.repository.ts
/**
 * Document Repository
 *
 * Hybrid offline-first pattern:
 * 1. Write to Dexie immediately (instant local persistence)
 * 2. Queue for Supabase sync (background when online)
 * 3. Read from Dexie first, sync from Supabase
 */

import { db, type LocalDocument } from '@/shared/lib/storage/dexie-db';
import { syncQueueManager } from '@/shared/lib/storage/sync-queue-manager';
import { optimizedSupabase } from '@/shared/api';
import {
  DocumentSchema,
  AppDocumentSchema,
  toAppDocument,
  toDbDocument,
  type DocumentData,
  type AppDocument
} from './Document.schema';

interface ListDocumentsOptions {
  folderId?: string | null;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export class DocumentRepository {
  /**
   * Get single document by ID
   * Returns from Dexie (local-first), syncs from Supabase in background
   */
  async getDocument(id: string): Promise<AppDocument | null> {
    // Try Dexie first
    const localDoc = await db.documents.get(id);

    if (localDoc) {
      // Trigger background sync if needed
      if (!localDoc._isSynced && navigator.onLine) {
        this.syncFromServer(id);
      }
      return toAppDocument(localDoc);
    }

    // Not in Dexie, fetch from Supabase
    if (navigator.onLine) {
      const serverDoc = await this.fetchFromServer(id);
      if (serverDoc) {
        // Store in Dexie for offline access
        await this.saveToLocal(serverDoc, true);
        return toAppDocument(serverDoc);
      }
    }

    return null;
  }

  /**
   * Save document (create or update)
   * Writes to Dexie immediately, queues for Supabase sync
   */
  async saveDocument(doc: AppDocument, userId: string): Promise<AppDocument> {
    const dbDoc = toDbDocument(doc, userId);

    // Validate with Zod
    const validated = DocumentSchema.parse(dbDoc);

    // Write to Dexie immediately
    const localDoc: LocalDocument = {
      ...validated,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
      _serverUpdatedAt: null,
    };

    await db.documents.put(localDoc);

    // Queue for Supabase sync
    await syncQueueManager.enqueue(
      'document',
      validated.id,
      'UPDATE', // upsert behavior
      validated as Record<string, unknown>
    );

    return toAppDocument(localDoc);
  }

  /**
   * Delete document (soft delete)
   */
  async deleteDocument(id: string): Promise<void> {
    // Update in Dexie
    await db.documents.update(id, {
      deleted_at: new Date().toISOString(),
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    });

    // Queue for Supabase sync
    await syncQueueManager.enqueue('document', id, 'DELETE', { id });
  }

  /**
   * List documents with optional filters
   */
  async listDocuments(options: ListDocumentsOptions = {}): Promise<AppDocument[]> {
    const { folderId, includeDeleted = false, limit = 50, offset = 0 } = options;

    let query = db.documents.orderBy('_localUpdatedAt').reverse();

    if (!includeDeleted) {
      query = query.filter(doc => !doc.deleted_at);
    }

    if (folderId !== undefined) {
      query = query.filter(doc => doc.folder_id === folderId);
    }

    const docs = await query.offset(offset).limit(limit).toArray();
    return docs.map(toAppDocument);
  }

  /**
   * Sync document from Supabase server
   */
  private async syncFromServer(id: string): Promise<void> {
    try {
      const serverDoc = await this.fetchFromServer(id);
      if (serverDoc) {
        await this.saveToLocal(serverDoc, true);
      }
    } catch (error) {
      console.error('Error syncing document from server:', error);
    }
  }

  /**
   * Fetch document from Supabase
   */
  private async fetchFromServer(id: string): Promise<DocumentData | null> {
    const supabase = optimizedSupabase.getClient();
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return DocumentSchema.parse(data);
  }

  /**
   * Save document to Dexie
   */
  private async saveToLocal(doc: DocumentData, isSynced: boolean): Promise<void> {
    const localDoc: LocalDocument = {
      ...doc,
      _isSynced: isSynced,
      _localUpdatedAt: Date.now(),
      _serverUpdatedAt: isSynced ? doc.updated_at || null : null,
    };
    await db.documents.put(localDoc);
  }
}

// Singleton instance
export const documentRepository = new DocumentRepository();
export default documentRepository;
```

### File: Block.repository.ts

```typescript
// src/entities/Block/Block.repository.ts
/**
 * Block Repository
 *
 * Same hybrid pattern as DocumentRepository:
 * Dexie first, Supabase sync in background.
 */

import { db, type LocalBlock } from '@/shared/lib/storage/dexie-db';
import { syncQueueManager } from '@/shared/lib/storage/sync-queue-manager';
import { optimizedSupabase } from '@/shared/api';
import { BaseBlockSchema, type BlockData } from '@/features/block/lib/schemas';

export class BlockRepository {
  /**
   * Get all blocks for a document
   */
  async getBlocks(documentId: string): Promise<BlockData[]> {
    // Try Dexie first
    const localBlocks = await db.blocks
      .where('document_id')
      .equals(documentId)
      .sortBy('position');

    if (localBlocks.length > 0) {
      // Trigger background sync if any blocks unsynced
      const hasUnsynced = localBlocks.some(b => !b._isSynced);
      if (hasUnsynced && navigator.onLine) {
        this.syncBlocksFromServer(documentId);
      }
      return localBlocks.map(this.toBlockData);
    }

    // Not in Dexie, fetch from Supabase
    if (navigator.onLine) {
      const serverBlocks = await this.fetchBlocksFromServer(documentId);
      if (serverBlocks.length > 0) {
        await this.saveBlocksToLocal(documentId, serverBlocks, true);
        return serverBlocks;
      }
    }

    return [];
  }

  /**
   * Update single block
   */
  async updateBlock(id: string, updates: Partial<BlockData>): Promise<BlockData | null> {
    const existing = await db.blocks.get(id);
    if (!existing) return null;

    const updated: LocalBlock = {
      ...existing,
      ...updates,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(updated);

    // Queue for sync
    await syncQueueManager.enqueue(
      'block',
      id,
      'UPDATE',
      this.toBlockData(updated) as Record<string, unknown>
    );

    return this.toBlockData(updated);
  }

  /**
   * Create new block
   */
  async createBlock(documentId: string, block: BlockData): Promise<BlockData> {
    const localBlock: LocalBlock = {
      ...block,
      document_id: documentId,
      _isSynced: false,
      _localUpdatedAt: Date.now(),
    };

    await db.blocks.put(localBlock);

    await syncQueueManager.enqueue(
      'block',
      block.id,
      'CREATE',
      { ...block, document_id: documentId } as Record<string, unknown>
    );

    return block;
  }

  /**
   * Delete block
   */
  async deleteBlock(id: string): Promise<void> {
    await db.blocks.delete(id);
    await syncQueueManager.enqueue('block', id, 'DELETE', { id });
  }

  /**
   * Bulk update blocks (for reordering, etc.)
   */
  async updateBlocks(documentId: string, blocks: BlockData[]): Promise<void> {
    await db.transaction('rw', db.blocks, async () => {
      for (const block of blocks) {
        const localBlock: LocalBlock = {
          ...block,
          document_id: documentId,
          _isSynced: false,
          _localUpdatedAt: Date.now(),
        };
        await db.blocks.put(localBlock);
      }
    });

    // Queue sync for each block
    for (const block of blocks) {
      await syncQueueManager.enqueue(
        'block',
        block.id,
        'UPDATE',
        { ...block, document_id: documentId } as Record<string, unknown>
      );
    }
  }

  /**
   * Sync blocks from server
   */
  private async syncBlocksFromServer(documentId: string): Promise<void> {
    try {
      const serverBlocks = await this.fetchBlocksFromServer(documentId);
      if (serverBlocks.length > 0) {
        await this.saveBlocksToLocal(documentId, serverBlocks, true);
      }
    } catch (error) {
      console.error('Error syncing blocks from server:', error);
    }
  }

  /**
   * Fetch blocks from Supabase
   */
  private async fetchBlocksFromServer(documentId: string): Promise<BlockData[]> {
    const supabase = optimizedSupabase.getClient();
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('document_id', documentId)
      .order('position', { ascending: true });

    if (error || !data) return [];
    return data.map(block => BaseBlockSchema.parse(block));
  }

  /**
   * Save blocks to Dexie
   */
  private async saveBlocksToLocal(
    documentId: string,
    blocks: BlockData[],
    isSynced: boolean
  ): Promise<void> {
    await db.transaction('rw', db.blocks, async () => {
      for (const block of blocks) {
        const localBlock: LocalBlock = {
          ...block,
          document_id: documentId,
          _isSynced: isSynced,
          _localUpdatedAt: Date.now(),
        };
        await db.blocks.put(localBlock);
      }
    });
  }

  /**
   * Convert LocalBlock to BlockData (strip sync metadata)
   */
  private toBlockData(localBlock: LocalBlock): BlockData {
    const { document_id, _isSynced, _localUpdatedAt, ...blockData } = localBlock;
    return blockData as BlockData;
  }
}

// Singleton instance
export const blockRepository = new BlockRepository();
export default blockRepository;
```

### File: use-document.ts

```typescript
// src/features/document/hooks/use-document.ts
/**
 * useDocument Hook
 *
 * Hybrid pattern: Dexie useLiveQuery for instant local + TanStack Query for remote sync.
 * Returns local data immediately, syncs from Supabase in background.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/storage/dexie-db';
import { documentRepository } from '@/entities/Document/Document.repository';
import { toAppDocument, type AppDocument } from '@/entities/Document/Document.schema';
import { documentKeys } from '@/shared/api/query-keys';
import { useAuth } from '@/app/providers';

interface UseDocumentOptions {
  enabled?: boolean;
}

export function useDocument(documentId: string | undefined, options: UseDocumentOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Local-first: Dexie live query for instant reactivity
  const localDocument = useLiveQuery(
    () => documentId ? db.documents.get(documentId) : undefined,
    [documentId],
    undefined
  );

  // Remote sync: TanStack Query for Supabase
  const remoteQuery = useQuery({
    queryKey: documentKeys.detail(documentId!),
    queryFn: () => documentRepository.getDocument(documentId!),
    enabled: enabled && !!documentId && navigator.onLine,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (doc: AppDocument) => documentRepository.saveDocument(doc, user?.id || ''),
    onSuccess: (savedDoc) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(savedDoc.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentRepository.deleteDocument(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });

  // Combine local + remote: prefer local, show remote when local unavailable
  const document = localDocument
    ? toAppDocument(localDocument)
    : remoteQuery.data;

  const isLoading = !localDocument && remoteQuery.isLoading;
  const isSyncing = localDocument && !localDocument._isSynced;

  return {
    document,
    isLoading,
    isSyncing,
    error: remoteQuery.error,

    // Mutations
    save: saveMutation.mutate,
    saveAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * useDocuments Hook - List documents
 */
export function useDocuments(options: { folderId?: string | null } = {}) {
  const { folderId } = options;

  // Local-first: Dexie live query
  const localDocuments = useLiveQuery(
    async () => {
      let query = db.documents
        .orderBy('_localUpdatedAt')
        .reverse()
        .filter(doc => !doc.deleted_at);

      if (folderId !== undefined) {
        query = query.filter(doc => doc.folder_id === folderId);
      }

      return query.toArray();
    },
    [folderId],
    []
  );

  // Transform to app format
  const documents = (localDocuments || []).map(toAppDocument);

  return {
    documents,
    isLoading: localDocuments === undefined,
  };
}
```

### File: use-blocks-query.ts

```typescript
// src/features/block/hooks/use-blocks-query.ts
/**
 * useBlocks Hook
 *
 * Hybrid pattern: Dexie useLiveQuery + TanStack Query.
 * Replaces sessionCache, useOptimizedBlockLoader, usePaginatedBlockLoader.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/storage/dexie-db';
import { blockRepository } from '@/entities/Block/Block.repository';
import { blockKeys } from '@/shared/api/query-keys';
import type { BlockData } from '@/features/block/lib/schemas';

interface UseBlocksOptions {
  enabled?: boolean;
}

export function useBlocks(documentId: string | undefined, options: UseBlocksOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  // Local-first: Dexie live query for instant reactivity
  const localBlocks = useLiveQuery(
    () => documentId
      ? db.blocks
          .where('document_id')
          .equals(documentId)
          .sortBy('position')
      : [],
    [documentId],
    []
  );

  // Remote sync: TanStack Query for Supabase (background)
  const remoteQuery = useQuery({
    queryKey: blockKeys.byDocument(documentId!),
    queryFn: () => blockRepository.getBlocks(documentId!),
    enabled: enabled && !!documentId && navigator.onLine,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Update single block
  const updateBlockMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BlockData> }) =>
      blockRepository.updateBlock(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Create block
  const createBlockMutation = useMutation({
    mutationFn: (block: BlockData) =>
      blockRepository.createBlock(documentId!, block),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Delete block
  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => blockRepository.deleteBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Bulk update (for reordering)
  const updateBlocksMutation = useMutation({
    mutationFn: (blocks: BlockData[]) =>
      blockRepository.updateBlocks(documentId!, blocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.byDocument(documentId!) });
    },
  });

  // Strip sync metadata from local blocks
  const blocks: BlockData[] = (localBlocks || []).map(block => {
    const { document_id, _isSynced, _localUpdatedAt, ...blockData } = block;
    return blockData as BlockData;
  });

  const isLoading = localBlocks === undefined && remoteQuery.isLoading;
  const isSyncing = (localBlocks || []).some(b => !b._isSynced);

  // Callback wrappers for easier use
  const updateBlock = useCallback((id: string, updates: Partial<BlockData>) => {
    updateBlockMutation.mutate({ id, updates });
  }, [updateBlockMutation]);

  const createBlock = useCallback((block: BlockData) => {
    createBlockMutation.mutate(block);
  }, [createBlockMutation]);

  const deleteBlock = useCallback((id: string) => {
    deleteBlockMutation.mutate(id);
  }, [deleteBlockMutation]);

  const updateBlocks = useCallback((newBlocks: BlockData[]) => {
    updateBlocksMutation.mutate(newBlocks);
  }, [updateBlocksMutation]);

  return {
    blocks,
    isLoading,
    isSyncing,
    error: remoteQuery.error,

    // Single block operations
    updateBlock,
    createBlock,
    deleteBlock,

    // Bulk operations
    updateBlocks,

    // Mutation states
    isUpdating: updateBlockMutation.isPending || updateBlocksMutation.isPending,
    isCreating: createBlockMutation.isPending,
    isDeleting: deleteBlockMutation.isPending,

    // === COMPATIBILITY LAYER (for usePaginatedBlockLoader consumers) ===
    // Pagination (not applicable - all blocks loaded at once via Dexie)
    loadMore: () => {}, // noop - no pagination needed
    hasMore: false,
    isLoadingMore: false,
    totalCount: blocks.length,
    currentPage: 0,
    checkLoadMore: () => {}, // noop - no infinite scroll

    // Aliases for API compatibility
    removeBlock: deleteBlock, // alias for usePaginatedBlockLoader.removeBlock
    setBlocksDirectly: updateBlocks, // alias for usePaginatedBlockLoader.setBlocksDirectly

    // Progress tracking (computed)
    progress: {
      loaded: blocks.length,
      total: blocks.length,
      percentage: 100, // All blocks loaded instantly from Dexie
    },
  };
}
```

---

## Feature Flag

```typescript
// src/shared/lib/feature-flags.ts

/**
 * Check if new data layer is enabled
 * Toggle via localStorage for gradual rollout
 */
export function isNewDataLayerEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('USE_NEW_DATA_LAYER') === 'true';
}

/**
 * Enable new data layer
 */
export function enableNewDataLayer(): void {
  localStorage.setItem('USE_NEW_DATA_LAYER', 'true');
  console.log('[FEATURE-FLAG] New data layer enabled. Refresh to apply.');
}

/**
 * Disable new data layer (rollback)
 */
export function disableNewDataLayer(): void {
  localStorage.removeItem('USE_NEW_DATA_LAYER');
  console.log('[FEATURE-FLAG] New data layer disabled. Refresh to apply.');
}

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__enableNewDataLayer = enableNewDataLayer;
  (window as any).__disableNewDataLayer = disableNewDataLayer;
}
```

**Migration Strategy**: Start with block loader hooks (most isolated usage)
- `use-paginated-loader.ts` and `use-optimized-loader.ts` are the primary sessionCache consumers
- Wrap with feature flag check first
- If enabled, use new `useBlocks()` hook
- If disabled, use existing sessionCache-based hooks
- After block hooks work, migrate Dashboard and ExpandedViewEnhanced

---

## Verification Procedures

### Test Files

| Test File | Tests |
|-----------|-------|
| `src/entities/Document/__tests__/Document.repository.test.ts` | Repository CRUD, offline queue |
| `src/entities/Block/__tests__/Block.repository.test.ts` | Block repository, bulk updates |
| `src/shared/lib/storage/__tests__/dexie-db.test.ts` | Dexie schema, queries |
| `src/shared/lib/storage/__tests__/sync-queue-manager.test.ts` | Sync queue, retry logic |
| `src/features/block/hooks/__tests__/use-blocks-query.test.ts` | Hook behavior, mutations |

### Offline Testing Checklist

1. **Create Document Offline**
   - Chrome DevTools → Network → Offline
   - Create new document
   - Verify in Dexie (Application → IndexedDB → devlog-db → documents)
   - Check syncQueue has pending item

2. **Come Online → Verify Sync**
   - Enable network
   - Check syncQueue is empty
   - Verify document appears in Supabase (use Supabase dashboard)
   - Confirm `_isSynced: true` in Dexie

3. **Edit Same Doc in Two Tabs**
   - Open document in two browser tabs
   - Edit in Tab 1, wait for sync
   - Verify Tab 2 receives update (useLiveQuery reactive)
   - Edit in Tab 2
   - Verify both tabs show same content

4. **Conflict Resolution**
   - Go offline in Tab 1
   - Edit document in Tab 1
   - Edit same document in Tab 2 (online)
   - Come online in Tab 1
   - Verify last-write-wins applied correctly

### Cache Monitoring

TanStack Query DevTools is already installed in `main.jsx`. Use it to monitor:

1. **Cache Hit Rate**: Should see high hit rate for document/block queries
2. **Stale Queries**: Queries should go stale after 5 minutes
3. **Background Refetch**: Queries refetch when window gains focus
4. **Mutation Tracking**: See pending mutations and their status

To access: Click the floating TanStack logo in development mode.

---

## Success Criteria

### Automated
- [ ] `npm install dexie dexie-react-hooks` completes without errors
- [ ] `npm run build` passes with all new files
- [ ] `npm run lint` passes
- [ ] `npm run test` passes all new tests
- [ ] No TypeScript errors in new files
- [ ] No references to sessionCache in migrated components

### Manual
- [ ] Create document while offline → appears in Dexie
- [ ] Come online → document syncs to Supabase
- [ ] Edit document → changes persist across refresh
- [ ] TanStack Query DevTools shows cache hits
- [ ] No stale data visible after edits
- [ ] Performance same or better than before (measure with DevTools)
- [ ] Feature flag rollback works (disable → old behavior restored)

---

## Estimated Duration

~2 weeks

---

## Depends On

- Phase 3 complete (Block types defined)

---

*Phase 4 of Document Page Architecture Refactor*
