# Document Disappearance After Settings Navigation Investigation

## Overview

**Issue**: When navigating to Settings and back to Dashboard, documents in the sidebar are reduced to only those in open tabs. Folders remain intact.

**Environment**: Recent refactoring migrated from legacy Supabase+useState hooks to RxDB-based reactive hooks.

## Investigation Findings

### Architecture Understanding

**Data Flow**:
1. `DatabaseProvider` (RxDBProvider.tsx) - Initializes RxDB and manages Supabase replication
2. `useRxDocuments` (use-documents.ts) - Reactive RxDB subscription for documents
3. `useRxFolders` (use-folders.ts) - Reactive RxDB subscription for folders
4. Dashboard.jsx - Orchestrates state and passes data to sidebar
5. SidebarEnhanced.jsx → ExplorerView.jsx - Displays documents and folders

**Key State Variables in Dashboard.jsx**:
- `allDocuments` (useState) - All documents for sidebar display
- `paginatedDocuments` - From `usePaginatedDashboard` (actually `useRxDocuments`)
- `folders` - From `useFolders` (actually `useRxFolders`)
- `entries` - Combined folders+documents for display

**Document Loading Chain**:
```
1. Dashboard mounts
2. useEffect (line 924-950) runs:
   - Loads IndexedDB cache → setAllDocuments(cached)
   - Then loadInitial() (RxDB query) → paginatedDocuments updates
3. useEffect (line 787-835) syncs paginatedDocuments → allDocuments
4. useEffect (line 837-922) combines folders+documents → entries
```

### Root Cause Analysis

**The Problem**: When navigating away from Dashboard (to Settings) and back:

1. **Dashboard component unmounts** when navigating to `/settings`
2. **All React state is destroyed** including:
   - `allDocuments` resets to `[]`
   - `entries` resets to `[]`
3. **On remount**, the initialization runs again:
   - IndexedDB cache may only contain open tab documents (tab-based caching, see line 832-833)
   - RxDB subscription restarts, but takes time to emit data

**Why folders survive**:
- `useRxFolders` has no user_id filter in the selector (line 76-81 of use-folders.ts)
- The RxDB query `collection.find({ selector: { _deleted: { $ne: true } } })` returns all folders immediately
- Documents have `user_id: user.id` filter which requires auth context to be ready

**Why documents show only tab documents**:
- The IndexedDB cache (line 929-936) now uses "tab-based caching"
- Comment at line 832-833: "NOTE: We no longer overwrite IndexedDB cache with pagination data. Cache is now tab-based"
- On remount, only cached (open tab) documents load immediately
- RxDB subscription takes time to populate

### Key Code References

**Document subscription with user_id filter** (use-documents.ts:108-111):
```typescript
const selector: Record<string, unknown> = {
  user_id: user.id,
  _deleted: { $ne: true },
};
```

**Folder subscription WITHOUT user_id filter** (use-folders.ts:76-81):
```typescript
const query = collection.find({
  selector: {
    _deleted: { $ne: true },
  },
  sort: [{ position: 'asc' }],
});
```

**Tab-based cache note** (Dashboard.jsx:832-833):
```javascript
// NOTE: We no longer overwrite IndexedDB cache with pagination data
// Cache is now tab-based: documents cached when opened, removed when tab closed
```

## CONFIRMED ROOT CAUSE

**The bug is in `useRxDocuments` (use-documents.ts:99-102)**:

```typescript
if (!db || !collection || !enabled || !user?.id) {
  setIsLoading(false);
  setDocuments([]);  // <-- BUG: Clears documents when user not yet available
  return;
}
```

**Why folders work but documents don't**:
- `useRxFolders` (line 67-71): Checks `!db || !collection || !enabled` - NO user check
- `useRxDocuments` (line 99-103): Checks `!db || !collection || !enabled || !user?.id` - HAS user check

**Sequence on Dashboard remount**:
1. Dashboard component mounts
2. `useAuth()` returns `user: undefined` momentarily (auth context initializing)
3. `useRxDocuments` sees `!user?.id` → immediately sets `documents: []` and `isLoading: false`
4. Dashboard's sync effect sees `paginatedDocuments: []` → sets `allDocuments: []`
5. Only documents in IndexedDB cache (open tabs) survive
6. Auth context resolves, `user.id` becomes available
7. RxDB subscription starts, but `allDocuments` is already `[]`
8. Even though subscription eventually emits, the UI flash to empty already happened

**Why folders survive**:
1. `useRxFolders` doesn't wait for `user.id`
2. Replication already filtered data by user, so all data in RxDB belongs to current user
3. Folder query executes immediately and emits data

**Additional factor - IndexedDB cache**:
The cache was changed to "tab-based" (Dashboard.jsx:832-833), so only open tab documents are cached. This means:
1. On remount, cache loads only tab documents
2. RxDB documents are temporarily `[]`
3. Only tab documents show in sidebar

## Verification Steps

1. Add console logs to trace the initialization sequence:
   ```javascript
   console.log('[MOUNT-DEBUG] Dashboard mounted');
   console.log('[MOUNT-DEBUG] user.id:', user?.id);
   console.log('[MOUNT-DEBUG] paginatedDocuments:', paginatedDocuments?.length);
   console.log('[MOUNT-DEBUG] folders:', folders?.length);
   ```

2. Check if `useRxDocuments` waits for auth:
   - Look at the `enabled` check and `user?.id` dependency

3. Verify IndexedDB cache contents after navigation

## Implementation Plan

### Fix Strategy: Don't clear documents when auth is pending

The fix is simple - modify `useRxDocuments` to NOT clear documents when `user.id` is unavailable. Instead:
1. Keep `isLoading: true` while waiting for auth
2. Don't overwrite existing documents with empty array
3. Let the subscription populate data once auth is ready

### Phase 1: Fix useRxDocuments hook

**File**: `src/shared/db/hooks/use-documents.ts`

**Change**: Lines 99-103

**Before**:
```typescript
if (!db || !collection || !enabled || !user?.id) {
  setIsLoading(false);
  setDocuments([]);
  return;
}
```

**After**:
```typescript
if (!db || !collection || !enabled) {
  setIsLoading(false);
  return;
}

// Wait for user auth - don't clear documents, just stay in loading state
if (!user?.id) {
  // Keep isLoading true while waiting for auth
  // Don't clear documents - preserve previous state
  return;
}
```

### Phase 2: Verify folders hook is consistent

**File**: `src/shared/db/hooks/use-folders.ts`

The folders hook should also avoid clearing folders when conditions aren't met. Current implementation (line 67-71) also has a similar issue:

```typescript
if (!db || !collection || !enabled) {
  setIsLoading(false);
  setAllFolders([]);  // <-- Should NOT clear
  return;
}
```

**After**:
```typescript
if (!db || !collection || !enabled) {
  setIsLoading(false);
  return;  // Don't clear folders
}
```

### Phase 3: Dashboard sync effect protection

**File**: `src/pages/Dashboard.jsx`

The sync effect (line 787-835) should NOT overwrite `allDocuments` with empty array. Add a guard:

**Change**: Lines 789-791

**Before**:
```javascript
if (paginatedDocuments && paginatedDocuments.length > 0) {
  // Merge: Preserve locally-created documents with their blocks
  setAllDocuments(prev => {
```

**After**:
```javascript
// Only sync when we have actual data - don't overwrite with empty
// This prevents race condition when user.id is temporarily unavailable
if (paginatedDocuments && paginatedDocuments.length > 0) {
  // Merge: Preserve locally-created documents with their blocks
  setAllDocuments(prev => {
```

This is already guarded, but let's add explicit logging to track the issue.

### Success Criteria

#### Automated Verification:
- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors: `npm run typecheck`
- [ ] Lint passes: `npm run lint`

#### Manual Verification:
- [ ] Open Dashboard with multiple documents showing in sidebar
- [ ] Navigate to Settings page
- [ ] Navigate back to Dashboard
- [ ] All documents still visible in sidebar (not just tab documents)
- [ ] Folders still visible (regression check)
- [ ] Create new document - appears immediately
- [ ] Console shows no RxDB errors

### Implementation Order

1. Fix `useRxDocuments` (main fix)
2. Fix `useRxFolders` (consistency fix)
3. Add logging to verify fix
4. Remove logging after verification

### Rollback Plan

If issues arise, the changes are isolated to:
- `src/shared/db/hooks/use-documents.ts` (remove the guard change)
- `src/shared/db/hooks/use-folders.ts` (remove the guard change)
