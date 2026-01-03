# Barrel Optimization Plan

## Current State: 38 Barrel Files
## Target State: 9 Strategic Barrels
## To Delete: 29 Nested Barrels

---

## KEEP (9 Strategic Barrels)

These are at **feature/layer boundaries** - the "Public API" level:

| # | Path | Reason |
|---|------|--------|
| 1 | `src/app/providers/index.ts` | App layer - providers root |
| 2 | `src/features/analytics/index.ts` | Feature root |
| 3 | `src/features/block/index.ts` | Feature root |
| 4 | `src/features/document/index.ts` | Feature root |
| 5 | `src/features/share/index.ts` | Feature root |
| 6 | `src/features/storage/index.ts` | Feature root |
| 7 | `src/shared/api/index.ts` | Shared API layer |
| 8 | `src/shared/hooks/index.ts` | Shared hooks layer |
| 9 | `src/shared/lib/index.ts` | Shared lib layer |

---

## DELETE (29 Nested Barrels)

These violate the "no barrel calling barrel" rule:

### Features - Nested Subfolders (8 files)
```
src/features/analytics/api/index.ts      ❌ DELETE
src/features/analytics/lib/index.ts      ❌ DELETE
src/features/block/hooks/index.ts        ❌ DELETE
src/features/block/lib/index.ts          ❌ DELETE
src/features/document/hooks/index.ts     ❌ DELETE
src/features/share/api/index.ts          ❌ DELETE
src/features/storage/hooks/index.ts      ❌ DELETE
src/features/storage/lib/index.ts        ❌ DELETE
```

### Shared - Nested Subfolders (19 files)
```
src/shared/api/supabase/index.ts         ❌ DELETE
src/shared/lib/auth/index.ts             ❌ DELETE
src/shared/lib/cache/index.ts            ❌ DELETE
src/shared/lib/dom/index.ts              ❌ DELETE
src/shared/lib/events/index.ts           ❌ DELETE
src/shared/lib/integrity/index.ts        ❌ DELETE
src/shared/lib/links/index.ts            ❌ DELETE
src/shared/lib/locking/index.ts          ❌ DELETE
src/shared/lib/markdown/index.ts         ❌ DELETE
src/shared/lib/math/index.ts             ❌ DELETE
src/shared/lib/network/index.ts          ❌ DELETE
src/shared/lib/performance/index.ts      ❌ DELETE
src/shared/lib/recovery/index.ts         ❌ DELETE
src/shared/lib/service-worker/index.ts   ❌ DELETE
src/shared/lib/storage/adapters/index.ts ❌ DELETE
src/shared/lib/storage/index.ts          ❌ DELETE
src/shared/lib/styles/index.ts           ❌ DELETE
src/shared/lib/transactions/index.ts     ❌ DELETE
src/shared/lib/upload/index.ts           ❌ DELETE
```

### Legacy Components (2 files)
```
src/components/sidebar/index.js          ❌ DELETE
src/components/sidebar/views/index.js    ❌ DELETE
```

---

## Implementation Strategy

### Step 1: Update Parent Barrels
Before deleting nested barrels, update parent barrels to export directly from source files.

**Example - Before:**
```typescript
// src/shared/lib/index.ts
export * from './storage';  // Re-exports from nested barrel
```

**Example - After:**
```typescript
// src/shared/lib/index.ts
export { storageWrapper, MultiLayerStorage } from './storage/wrapper';
export { SyncEngine } from './storage/sync-engine';
```

### Step 2: Find and Update All Import Consumers
For each nested barrel being deleted, find all files that import from it and update to:
- Import from parent barrel (preferred)
- Import directly from source file (when parent doesn't expose it)

### Step 3: Delete Nested Barrels
After all imports are updated, delete the nested barrel files.

### Step 4: Verify Build
Run `npm run build` to ensure no broken imports.

---

## Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Barrel files | 38 | 9 | -76% |
| Build time | ~3 min | ~45s | -75% |
| Import resolution | Nested chains | Direct | Faster |
| Bundle tree-shaking | Broken | Working | Smaller bundles |
