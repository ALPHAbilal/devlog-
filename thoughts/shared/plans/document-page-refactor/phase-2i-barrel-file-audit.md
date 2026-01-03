# Phase 2i: FSD Barrel File Export Audit & Fix

> **Goal**: Fix all incomplete barrel files (index.ts) that are missing exports, causing build failures.

**Status**: ✅ COMPLETED (2025-01-03)

> **See also**: `phase-2-COMPLETED.md` for full Phase 2 summary including barrel optimization results.

---

## Problem Statement

The Phase 2 FSD migration (Phases A-H) moved files to new locations, but:
- Barrel files (index.ts) only re-export ~30% of what files actually export
- Every build reveals another missing export
- Build takes ~1.5 minutes per attempt
- There are dozens of missing exports to fix
- **⚠️ Some barrel files export functions that don't exist in source files!**

This plan systematically audits all barrel files, fixes bugs, and adds all missing exports.

---

## What We're NOT Doing

- NOT moving files (already done in Phase 2)
- NOT creating new hooks/utilities
- NOT fixing consumers that import from wrong locations (that's Phase 2j)

---

## Current State Analysis

### Barrel Files That Need Fixes

| Barrel File | Issue |
|-------------|-------|
| `src/shared/hooks/index.ts` | Missing 5 exports |
| `src/app/providers/index.ts` | ⚠️ BUG: exports non-existent `useTab` (should be `useTabContext`) |
| `src/features/block/hooks/index.ts` | Missing 2 exports |
| `src/features/storage/lib/index.ts` | Missing 1 export |
| `src/features/storage/hooks/index.ts` | ⚠️ BUG: exports non-existent `useBatchLoader` (replace with real hooks) |
| `src/features/analytics/index.ts` | Missing 2 re-exports |

---

## Phase 1: src/shared/hooks/index.ts

### Current Exports
```typescript
export { useIntersectionObserver } from './use-intersection-observer';
export { useResponsive } from './use-responsive';
export { usePerformance } from './use-performance';
export { useScrollAnimation } from './use-scroll-animation';
export { useToast, ToastProvider, toast } from './use-toast';
export { useTouchGestures } from './use-touch-gestures';
export { useSwipeNavigation } from './use-swipe-navigation';
export { useViewportAwarePosition } from './use-viewport-aware-position';
export { useIndexedDBCache } from './use-indexeddb-cache';
export { useAnalytics } from './use-analytics';
```

### Missing Exports (5)

| Export | Source File | Consumers |
|--------|-------------|-----------|
| `useComponentResponsive` | `use-responsive.ts:163` | `ResponsiveDashboardGrid.jsx:4` |
| `useSwipe` | `use-touch-gestures.ts:278` | `ResponsiveLayout.jsx:7` |
| `usePullToRefresh` | `use-touch-gestures.ts:221` | `Dashboard.jsx:25` |
| `useDocumentAnalytics` | `use-analytics.ts:103` | ⚠️ Consumers import from `@/features/analytics` - see Phase 6 |
| `usePerformanceTracking` | `use-analytics.ts:139` | ⚠️ Consumers import from `@/features/analytics` - see Phase 6 |

### Fix Required

**File**: `src/shared/hooks/index.ts`

Replace:
```typescript
export { useResponsive } from './use-responsive';
```

With:
```typescript
export { useResponsive, useComponentResponsive } from './use-responsive';
```

Replace:
```typescript
export { useTouchGestures } from './use-touch-gestures';
```

With:
```typescript
export { useTouchGestures, useSwipe, usePullToRefresh } from './use-touch-gestures';
```

Replace:
```typescript
export { useAnalytics } from './use-analytics';
```

With:
```typescript
export { useAnalytics, useDocumentAnalytics, usePerformanceTracking } from './use-analytics';
```

### Success Criteria
```bash
# After fix, this should return 0:
grep -c "useComponentResponsive.*not exported" npm-build-output.log
grep -c "useSwipe.*not exported" npm-build-output.log
```

---

## Phase 2: src/app/providers/index.ts

### Current Exports
```typescript
export { AuthProviderOptimized, useAuth } from './auth-provider';
export { SettingsProvider, useSettings } from './settings-provider';
export { SidebarProvider, useSidebar } from './sidebar-provider';
export { TabProvider, useTab } from './tab-provider';
export { DemoModeProvider, useDemoMode } from './demo-mode-provider';
```

### ⚠️ BUG: Barrel Exports Non-Existent `useTab`

The barrel file exports `useTab`, but `tab-provider.tsx` only exports:
- `useTabContext` (line 7)
- `TabProvider` (line 15)

**There is NO `useTab` export in the source file!**

### Fix Required

**File**: `src/app/providers/index.ts`

Replace:
```typescript
export { TabProvider, useTab } from './tab-provider';
```

With:
```typescript
export { TabProvider, useTabContext } from './tab-provider';
```

> **Note**: Consumers that import `useTab` will need to be updated to use `useTabContext` instead (Phase 2j).

---

## Phase 3: src/features/block/hooks/index.ts

### Current Exports
```typescript
export { useAutoSave } from './use-auto-save';
export { useBlockLazyLoading } from './use-lazy-loading';
export { useOptimizedBlockLoader } from './use-optimized-loader';
export { usePaginatedBlockLoader } from './use-paginated-loader';
export { useMemoryManagement } from './use-memory-management';
```

### Missing Exports (2)

| Export | Source File | Consumers |
|--------|-------------|-----------|
| `getSmartSyncManager` | `use-auto-save.ts:187` | `ExpandedViewEnhanced.jsx:12` |
| `useGlobalAutoSave` | `use-auto-save.ts:139` | `App.jsx:8` |

### Fix Required

**File**: `src/features/block/hooks/index.ts`

Replace:
```typescript
export { useAutoSave } from './use-auto-save';
```

With:
```typescript
export { useAutoSave, useGlobalAutoSave, getSmartSyncManager } from './use-auto-save';
```

---

## Phase 4: src/features/storage/lib/index.ts

### Current Exports
```typescript
export { SmartSync } from './smart-sync';
export { RealtimeManager } from './realtime-manager';
export { realtimeSync } from './realtime-sync';
export { exportData, exportToJSON, exportToCSV } from './data-export';
```

### Missing Exports (1)

| Export | Source File | Consumers |
|--------|-------------|-----------|
| `createSmartSync` | `smart-sync.ts:871` | `use-smart-sync.ts:8`, `use-auto-save.ts:8` |

### Fix Required

**File**: `src/features/storage/lib/index.ts`

Replace:
```typescript
export { SmartSync } from './smart-sync';
```

With:
```typescript
export { SmartSync, createSmartSync } from './smart-sync';
```

---

## Phase 5: src/features/storage/hooks/index.ts

### Current Exports
```typescript
export { useMultiLayerStorage } from './use-multi-layer';
export { useSmartDatabaseUsage } from './use-database-usage';
export { useSmartSync } from './use-smart-sync';
export { useBatchLoader } from './use-batch-loader';
```

### ⚠️ BUG: Barrel Exports Non-Existent `useBatchLoader`

The barrel file exports `useBatchLoader`, but `use-batch-loader.ts` only exports:
- `useProjectStructure` (line 24)
- `usePaginatedDocuments` (line 275)

**There is NO `useBatchLoader` export in the source file!**

### Fix Required

**File**: `src/features/storage/hooks/index.ts`

Replace:
```typescript
export { useBatchLoader } from './use-batch-loader';
```

With:
```typescript
export { useProjectStructure, usePaginatedDocuments } from './use-batch-loader';
```

> **Note**: Any consumers importing `useBatchLoader` will need to be updated to use the correct hook names (Phase 2j).

---

## Phase 6: src/features/analytics/index.ts

### Current Exports
```typescript
// Analytics feature barrel file
export * from './api';
export * from './lib';
// Re-export useAnalytics hook from shared for convenience
export { useAnalytics } from '@/shared/hooks';
```

### Missing Exports (2)

| Export | Source File | Consumers |
|--------|-------------|-----------|
| `useDocumentAnalytics` | `@/shared/hooks/use-analytics.ts:103` | `ExpandedViewEnhanced.jsx:22`, `Dashboard.jsx:35`, `DocumentPage.jsx:20` |
| `usePerformanceTracking` | `@/shared/hooks/use-analytics.ts:139` | (available for future use) |

### Fix Required

**File**: `src/features/analytics/index.ts`

Replace:
```typescript
export { useAnalytics } from '@/shared/hooks';
```

With:
```typescript
export { useAnalytics, useDocumentAnalytics, usePerformanceTracking } from '@/shared/hooks';
```

---

## Execution Sequence

### Step 1: Fix src/shared/hooks/index.ts
```bash
# Apply the 3 replacements described in Phase 1
# Then verify:
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 2: Fix src/app/providers/index.ts
```bash
# Apply the 1 replacement described in Phase 2
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 3: Fix src/features/block/hooks/index.ts
```bash
# Apply the 1 replacement described in Phase 3
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 4: Fix src/features/storage/lib/index.ts
```bash
# Apply the 1 replacement described in Phase 4
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 5: Fix src/features/storage/hooks/index.ts
```bash
# Apply the 1 replacement described in Phase 5
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 6: Fix src/features/analytics/index.ts
```bash
# Apply the 1 replacement described in Phase 6
npm run build 2>&1 | grep -i "not exported" | head -5
```

### Step 7: Final Verification
```bash
npm run build
# Should complete without "not exported" errors
```

---

## Phase 2j: Fix Wrong Import Locations (Separate Plan)

After barrel files are fixed, there are still imports pointing to wrong barrel files.

### Wrong Barrel Imports

| Consumer | Current Import | Should Be |
|----------|----------------|-----------|
| `Block.jsx:2` | `@/shared/hooks` → `useBlockLazyLoading` | `@/features/block` |
| `ExpandedViewEnhanced.jsx:10-11` | `@/shared/hooks` → `useOptimizedBlockLoader`, `usePaginatedBlockLoader` | `@/features/block` |
| `ProjectExplorerV2.jsx:16` | `@/shared/hooks` → `useFolders` | `@/features/document` |
| `ProjectExplorerV2.jsx:17` | `@/shared/hooks` → `useProjectStructure` | `@/features/storage` |
| `ProjectExplorerRedesigned.jsx:3` | `@/shared/hooks` → `useFolders` | `@/features/document` |
| `ProjectExplorer.jsx:30` | `@/shared/hooks` → `useFolders` | `@/features/document` |
| `ProjectExplorer.jsx:31` | `@/shared/hooks` → `useProjectStructure` | `@/features/storage` |
| `RealtimeIndicator.jsx:4` | `@/shared/hooks` → `useSmartDatabaseUsage` | `@/features/storage` |

### ⚠️ Bug-Related Renames Required

These imports reference hooks that were incorrectly named in barrel files:

| Consumer | Current Import | Rename To |
|----------|----------------|-----------|
| Any file using `useTab` | `useTab` from `@/app/providers` | `useTabContext` |
| Any file using `useBatchLoader` | `useBatchLoader` from `@/features/storage` | `useProjectStructure` or `usePaginatedDocuments` |

These require a separate fix pass after barrel exports are complete.

---

## Success Criteria

### Automated Verification
- [x] `npm run build` completes without "not exported" errors
- [x] All 10 new exports are available from their barrel files
- [x] 2 barrel file bugs are fixed (`useTab` → `useTabContext`, `useBatchLoader` removed)

### Manual Verification
- [x] Import autocomplete in IDE shows new exports
- [x] No TypeScript errors related to missing exports

---

## Post-Completion: Barrel Optimization

After fixing exports, a full barrel optimization was performed:
- **Reduced barrel files**: 38 → 10
- **Eliminated nested chains**: All exports now point directly to source files
- **Build time improvement**: 6+ min → 1m 46s

See `phase-2-COMPLETED.md` for complete details.

---

## Summary Statistics

| Phase | Barrel File | Action |
|-------|-------------|--------|
| 1 | `src/shared/hooks/index.ts` | Add 5 exports |
| 2 | `src/app/providers/index.ts` | ⚠️ FIX: rename `useTab` → `useTabContext` (bug) |
| 3 | `src/features/block/hooks/index.ts` | Add 2 exports |
| 4 | `src/features/storage/lib/index.ts` | Add 1 export |
| 5 | `src/features/storage/hooks/index.ts` | ⚠️ FIX: replace non-existent `useBatchLoader` with 2 real exports |
| 6 | `src/features/analytics/index.ts` | Add 2 re-exports |
| **Total** | 6 barrel files | **10 new exports + 2 bug fixes** |

---

*Phase 2i of Document Page Architecture Refactor*
*Companion to Phase 2 FSD Architecture Plan*
