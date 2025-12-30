# Phase 0: Dead Code Cleanup

> **Goal**: Remove 33 unused files to reduce confusion before refactoring.

---

## Overview

Before we can refactor effectively, we need to clean house. Dead code creates:
- Confusion about which file is "the real one"
- False positives in code search
- Maintenance burden
- Larger bundle sizes

This phase is **low risk, high reward** - pure deletion with verification.

---

## ⚠️ VERIFICATION STATUS (2025-12-29, Updated)

**All files below were verified by checking actual imports in the codebase using `grep`, NOT documentation.**

### Files INCORRECTLY in original plan (DO NOT DELETE):

| File | Reason | Verified In |
|------|--------|-------------|
| `OptimizedBlockSkeleton.jsx` | **ACTIVELY USED** | `ExpandedViewEnhanced.jsx:8,329,2148-2157` |
| `FloatingControlsTrigger.jsx` | **ACTIVELY USED** | `ExpandedViewEnhanced.jsx:18,1940` |
| `optimizedBlockLoader.js` | **ACTIVELY USED** | `EntryCard.jsx:2`, `EntryCardRedesigned.jsx:2`, `paginatedBlockLoader.js:2` |
| `paginatedBlockLoader.js` | **ACTIVELY USED** | `smartSync.js:18,641`, `usePaginatedBlockLoader.js` |
| `IssueTrackerBlock.jsx` | **ACTIVELY USED** | `OptimizedIssueTrackerBlock.jsx:5,37,153` (lazy loaded) |
| `GitGraphBranching.jsx` | **USED BY IssueTrackerBlock** | `IssueTrackerBlock.jsx:5,584` |

### Files requiring additional cleanup step:

| File | Issue | Action Required |
|------|-------|-----------------|
| `SupabaseAdapter.js` | Import exists but is unused | Remove import from `storageWrapper.js:2` BEFORE deleting |
| `TimelineBranch.jsx` | Import exists but usage is commented out | Remove import from `IssueTrackerBlock.jsx:4` BEFORE deleting |

---

## Current State

We have multiple implementations of the same functionality:

| Category | Active File | Dead Files to Delete |
|----------|-------------|---------------------|
| TextBlock | `TextBlock.jsx` | `TextBlockLegacy.jsx`, `TextBlockEnhanced.jsx` |
| AIBlock | `AIBlockRefined.jsx` | `AIBlock.jsx`, `AIBlockDebug.jsx` |
| Storage | `storageWrapper.js` | `storageWrapperFixed.js`, `eventAwareStorageWrapper.js` |
| Skeleton | `LazyBlockSkeleton.jsx` + `OptimizedBlockSkeleton.jsx` | `BlockSkeleton.jsx` |
| Auth | `AuthContextOptimized.jsx` | `AuthContext.jsx` |
| Supabase | `SupabaseAdapterOptimized.js` | `SupabaseAdapter.js` (after removing dead import) |
| IssueTracker | `OptimizedIssueTrackerBlock.jsx` + `IssueTrackerBlock.jsx` + `GitGraphBranching.jsx` | `TimelineBranch.jsx` (import exists but usage is commented out) |

---

## Files to Delete

### Block Components (`src/components/blocks/`)

```bash
# ✅ VERIFIED UNUSED - Unused TextBlock variants
src/components/blocks/TextBlockLegacy.jsx      # ~826 lines, no external imports found
src/components/blocks/TextBlockEnhanced.jsx    # ~280 lines, self-reference only

# ✅ VERIFIED UNUSED - Unused AIBlock variants
src/components/blocks/AIBlock.jsx              # Block.jsx imports AIBlockRefined instead (line 6)
src/components/blocks/AIBlockDebug.jsx         # No imports found

# ✅ VERIFIED UNUSED - Unused skeleton variant (ONLY BlockSkeleton, NOT OptimizedBlockSkeleton!)
src/components/blocks/BlockSkeleton.jsx        # Self-reference only, LazyBlockSkeleton used in Block.jsx

# ⚠️ DO NOT DELETE - OptimizedBlockSkeleton.jsx IS USED IN ExpandedViewEnhanced.jsx

# ✅ VERIFIED UNUSED - Unused block types
src/components/blocks/ResponsiveCodeBlock.jsx  # Self-reference only

# ✅ VERIFIED UNUSED - TimelineBranch (import exists but usage is COMMENTED OUT)
src/components/blocks/TimelineBranch.jsx       # Imported at IssueTrackerBlock.jsx:4 but usage at :351-367 is commented out
                                               # ACTION: Remove dead import from IssueTrackerBlock.jsx:4 BEFORE deleting!

# ⚠️ DO NOT DELETE - IssueTrackerBlock dependency chain (ACTIVELY USED):
# - IssueTrackerBlock.jsx is lazy-loaded by OptimizedIssueTrackerBlock.jsx:5,37,153
# - GitGraphBranching.jsx is imported by IssueTrackerBlock.jsx:5,584
```

### Storage Layer (`src/utils/storage/`)

```bash
# ✅ VERIFIED UNUSED
src/utils/storage/storageWrapperFixed.js       # No imports found
src/utils/storage/eventAwareStorageWrapper.js  # No imports found
src/utils/storage/useStorage.js                # Only referenced in USAGE_GUIDE.md (not code)

# ⚠️ REQUIRES CLEANUP FIRST - Remove dead import before deleting
src/utils/storage/SupabaseAdapter.js           # Imported but NEVER USED in storageWrapper.js:2
                                               # ACTION: Edit storageWrapper.js to remove line 2 first!
```

### Contexts (`src/contexts/`)

```bash
# ✅ VERIFIED UNUSED
src/contexts/AuthContext.jsx                   # Only imported by files also being deleted:
                                               # - useOptimizedStorage.js (being deleted)
                                               # - TextBlockEnhanced.jsx (being deleted)
src/contexts/SupabaseContext.jsx               # Self-reference only
```

### Hooks (`src/hooks/`)

```bash
# ✅ VERIFIED UNUSED - All self-reference only
src/hooks/use3DCard.js                         # Self-reference only
src/hooks/useHover.js                          # Self-reference only
src/hooks/useDatabaseUsage.js                  # Self-reference only (useSmartDatabaseUsage.js exists)
src/hooks/useOptimizedMouseTracking.js         # Self-reference only
src/hooks/useOptimizedStorage.js               # Self-reference only (imports dead AuthContext.jsx)
```

### Utilities (`src/utils/`)

```bash
# ✅ VERIFIED UNUSED
src/utils/blockStreamer.js                     # Self-reference only
src/utils/folderCache.js                       # Self-reference only
src/utils/documentSaveManager.js               # No imports found
src/utils/dataExport.js                        # No imports found
src/utils/domHelpers.js                        # No imports found

# ⚠️ DO NOT DELETE - ACTIVELY USED
# src/utils/paginatedBlockLoader.js            # USED IN: smartSync.js:18,641, usePaginatedBlockLoader.js
# src/utils/optimizedBlockLoader.js            # USED IN: EntryCard.jsx:2, EntryCardRedesigned.jsx:2
```

### Components (`src/components/`)

```bash
# ✅ VERIFIED UNUSED
src/components/ExpandedView.jsx                # No imports found (replaced by ExpandedViewEnhanced.jsx)
src/components/DocumentTOC.jsx                 # Self-reference only
src/components/VirtualizedGridOptimized.jsx    # Self-reference only (VirtualizedGrid.jsx is used instead)
src/components/VirtualizedExpandedView.jsx     # Self-reference only
src/components/AnimationPerformanceMonitor.jsx # Self-reference only (class in animationPerformance.js is different)
src/components/MobileOptimizedLayout.jsx       # Self-reference only
src/components/EnhancedInteractiveDemo.jsx     # Self-reference only

# ✅ VERIFIED UNUSED - Demo components (all self-reference only)
src/components/InteractiveDocumentDemo.jsx
src/components/InteractiveDocumentDemoOptimized.jsx
src/components/InteractiveDocumentDemoUnified.jsx

# ⚠️ DO NOT DELETE - ACTIVELY USED
# src/components/FloatingControlsTrigger.jsx   # USED IN: ExpandedViewEnhanced.jsx:18,1940
```

---

## Implementation Steps

### Step 1: Create Backup Branch

```bash
git checkout -b refactor/phase-0-cleanup
git push -u origin refactor/phase-0-cleanup
```

### Step 2: Verify Files Are Unused

Before deleting, verify each file is not imported anywhere:

```bash
# For each file, run:
grep -r "TextBlockLegacy" src/ --include="*.js" --include="*.jsx"
grep -r "TextBlockEnhanced" src/ --include="*.js" --include="*.jsx"
# ... repeat for each file
```

**Important**: If any file IS imported, do NOT delete it. Update this plan.

### Step 3: Remove Dead Imports

**CRITICAL**: Before deleting files with stale imports, remove the unused imports first:

```bash
# In src/utils/storage/storageWrapper.js, REMOVE line 2:
# import { SupabaseAdapter } from './SupabaseAdapter';
# (This import is never used - only SupabaseAdapterOptimized is instantiated at line 162)

# In src/components/blocks/IssueTrackerBlock.jsx, REMOVE line 4:
# import TimelineBranch, { VerticalConnector } from './TimelineBranch';
# (This import exists but usage at lines 351-367 is COMMENTED OUT)
```

### Step 4: Delete Block Components (7 files)

```bash
rm src/components/blocks/TextBlockLegacy.jsx
rm src/components/blocks/TextBlockEnhanced.jsx
rm src/components/blocks/AIBlock.jsx
rm src/components/blocks/AIBlockDebug.jsx
rm src/components/blocks/BlockSkeleton.jsx
rm src/components/blocks/ResponsiveCodeBlock.jsx
rm src/components/blocks/TimelineBranch.jsx      # Safe to delete AFTER removing import in step 3!

# ⚠️ DO NOT DELETE - These are ACTIVELY USED:
# - OptimizedBlockSkeleton.jsx (used by ExpandedViewEnhanced.jsx)
# - IssueTrackerBlock.jsx (lazy-loaded by OptimizedIssueTrackerBlock.jsx)
# - GitGraphBranching.jsx (used by IssueTrackerBlock.jsx)
```

### Step 5: Delete Storage Files (4 files)

```bash
rm src/utils/storage/storageWrapperFixed.js
rm src/utils/storage/eventAwareStorageWrapper.js
rm src/utils/storage/SupabaseAdapter.js        # Safe to delete AFTER step 3!
rm src/utils/storage/useStorage.js
```

### Step 6: Delete Contexts (2 files)

```bash
rm src/contexts/AuthContext.jsx
rm src/contexts/SupabaseContext.jsx
```

### Step 7: Delete Unused Hooks (5 files)

```bash
rm src/hooks/use3DCard.js
rm src/hooks/useHover.js
rm src/hooks/useDatabaseUsage.js
rm src/hooks/useOptimizedMouseTracking.js
rm src/hooks/useOptimizedStorage.js
```

### Step 8: Delete Unused Utilities (5 files, NOT 7!)

```bash
rm src/utils/blockStreamer.js
rm src/utils/folderCache.js
rm src/utils/documentSaveManager.js
rm src/utils/dataExport.js
rm src/utils/domHelpers.js
# ⚠️ DO NOT DELETE paginatedBlockLoader.js - used by smartSync.js!
# ⚠️ DO NOT DELETE optimizedBlockLoader.js - used by EntryCard.jsx!
```

### Step 9: Delete Unused Components (10 files, NOT 8!)

```bash
rm src/components/ExpandedView.jsx
rm src/components/DocumentTOC.jsx
# ⚠️ DO NOT DELETE FloatingControlsTrigger.jsx - used by ExpandedViewEnhanced.jsx!
rm src/components/VirtualizedGridOptimized.jsx
rm src/components/VirtualizedExpandedView.jsx
rm src/components/AnimationPerformanceMonitor.jsx
rm src/components/MobileOptimizedLayout.jsx
rm src/components/EnhancedInteractiveDemo.jsx
rm src/components/InteractiveDocumentDemo.jsx
rm src/components/InteractiveDocumentDemoOptimized.jsx
rm src/components/InteractiveDocumentDemoUnified.jsx
```

### Step 10: Verify Build

```bash
npm run build
npm run lint
npm run dev  # Quick manual test
```

### Step 11: Commit

```bash
git add -A
git commit -m "refactor(cleanup): remove 33 unused files + 2 dead imports

Dead code removed:
- 7 unused block components (TextBlockLegacy, TextBlockEnhanced, AIBlock, AIBlockDebug,
  BlockSkeleton, ResponsiveCodeBlock, TimelineBranch)
- 4 unused storage files (storageWrapperFixed, eventAwareStorageWrapper, SupabaseAdapter, useStorage)
- 2 unused contexts (AuthContext, SupabaseContext)
- 5 unused hooks (use3DCard, useHover, useDatabaseUsage, useOptimizedMouseTracking, useOptimizedStorage)
- 5 unused utilities (blockStreamer, folderCache, documentSaveManager, dataExport, domHelpers)
- 10 unused components (ExpandedView, DocumentTOC, VirtualizedGridOptimized,
  VirtualizedExpandedView, AnimationPerformanceMonitor, MobileOptimizedLayout,
  EnhancedInteractiveDemo, InteractiveDocumentDemo, InteractiveDocumentDemoOptimized,
  InteractiveDocumentDemoUnified)

Dead imports removed:
- SupabaseAdapter import in storageWrapper.js:2 (never used)
- TimelineBranch import in IssueTrackerBlock.jsx:4 (usage was commented out)

KEPT (verified as actively used):
- OptimizedBlockSkeleton.jsx (used in ExpandedViewEnhanced.jsx)
- FloatingControlsTrigger.jsx (used in ExpandedViewEnhanced.jsx)
- paginatedBlockLoader.js (used in smartSync.js)
- optimizedBlockLoader.js (used in EntryCard.jsx)
- IssueTrackerBlock.jsx (lazy-loaded by OptimizedIssueTrackerBlock.jsx)
- GitGraphBranching.jsx (used by IssueTrackerBlock.jsx)

Part of document page architecture refactor Phase 0.
See: thoughts/shared/plans/document-page-refactor/
"
```

---

## Success Criteria

### Automated Verification
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes
- [ ] `npm run dev` starts successfully
- [ ] No import errors in console

### Manual Verification
- [ ] App loads correctly
- [ ] Can create a document
- [ ] Can add blocks (text, code, heading)
- [ ] Can edit and save
- [ ] No console errors related to missing imports

---

## Rollback Plan

If anything breaks:

```bash
git checkout main
git branch -D refactor/phase-0-cleanup
```

---

## Files to Keep (Do NOT Delete)

These files are actively used (verified 2025-12-29, updated with grep verification):

```
# Block Components (KEEP - verified imports)
TextBlock.jsx              # Active - main text block
TipTapEditor.jsx           # Used by TextBlock
CodeBlock.jsx              # Active - code block
AIBlockRefined.jsx         # Active (imported as AIBlock in Block.jsx:6)
HeadingBlock.jsx           # Active
FileTreeBlock.jsx          # Active
TableBlock.jsx             # Active
TodoBlock.jsx              # Active
ImageBlock.jsx             # Active
InlineImageBlock.jsx       # Active
OptimizedIssueTrackerBlock.jsx  # Active (Block.jsx:13)
IssueTrackerBlock.jsx      # Active (lazy-loaded by OptimizedIssueTrackerBlock.jsx:5,37,153) ⚠️ Was incorrectly in delete list!
GitGraphBranching.jsx      # Active (imported by IssueTrackerBlock.jsx:5,584) ⚠️ Was incorrectly in delete list!
# TimelineBranch.jsx       # ❌ NOW DELETABLE - import exists but usage is COMMENTED OUT (see Step 3)
LazyBlockSkeleton.jsx      # Active (Block.jsx:3)
OptimizedBlockSkeleton.jsx # Active (ExpandedViewEnhanced.jsx:8) ⚠️ Was incorrectly in delete list!

# Storage (KEEP - verified imports)
storageWrapper.js          # Active - main storage interface
MultiLayerStorage.js       # Active
SupabaseAdapterOptimized.js  # Active (storageWrapper.js:3, instantiated at :162)
IndexedDBAdapter.js        # Active
SyncEngine.js              # Active
CompressedStorageAdapter.js  # Active
LRUCache.js                # Active

# Utilities (KEEP - verified imports) ⚠️ Were incorrectly in delete list!
paginatedBlockLoader.js    # Active (smartSync.js:18, usePaginatedBlockLoader.js)
optimizedBlockLoader.js    # Active (EntryCard.jsx:2, EntryCardRedesigned.jsx:2)

# Components (KEEP - verified imports) ⚠️ Was incorrectly in delete list!
FloatingControlsTrigger.jsx  # Active (ExpandedViewEnhanced.jsx:18)

# Contexts (KEEP - verified imports)
AuthContextOptimized.jsx   # Active
TabContext.jsx             # Active
SidebarContext.jsx         # Active
SettingsContext.jsx        # Active
DemoModeContext.jsx        # Active
```

---

## Estimated Time

| Task | Duration |
|------|----------|
| Verify imports | 30 min |
| Delete files | 15 min |
| Test build | 15 min |
| Manual testing | 30 min |
| Commit & document | 15 min |
| **Total** | **~2 hours** |

---

## Notes

- This phase is purely subtractive - no new code
- Low risk because we're only removing unused files
- Creates cleaner starting point for Phase 1
- Reduces grep/search noise significantly

---

## Checklist

- [ ] Create backup branch
- [x] Verify each file is unused (grep) ✅ **DONE 2025-12-29, Re-verified with code search**
- [ ] Remove dead import from storageWrapper.js (line 2 - SupabaseAdapter)
- [ ] Remove dead import from IssueTrackerBlock.jsx (line 4 - TimelineBranch) ⚠️ **NEW**
- [ ] Delete block components (7 files - TextBlockLegacy, TextBlockEnhanced, AIBlock, AIBlockDebug, BlockSkeleton, ResponsiveCodeBlock, TimelineBranch)
- [ ] Delete storage files (4 files)
- [ ] Delete contexts (2 files)
- [ ] Delete hooks (5 files)
- [ ] Delete utilities (5 files)
- [ ] Delete components (10 files)
- [ ] Run build
- [ ] Run lint
- [ ] Manual test
- [ ] Commit with detailed message
- [ ] Update master vision progress tracker

**Total files to delete: 33 (was 35, then 32, now 33 after TimelineBranch discovery)**
**Dead imports to remove: 2** (SupabaseAdapter in storageWrapper.js, TimelineBranch in IssueTrackerBlock.jsx)
**Files saved from incorrect deletion: 6** (OptimizedBlockSkeleton, FloatingControlsTrigger, paginatedBlockLoader, optimizedBlockLoader, IssueTrackerBlock, GitGraphBranching)

---

*Phase 0 of Document Page Architecture Refactor*
