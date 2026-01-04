 What's Missing

  | Missing Item                                     | Why It's Needed                                                                                                  | Priority | Source | Blocks   |       
  |--------------------------------------------------|------------------------------------------------------------------------------------------------------------------|----------|--------|----------|       
  | Exact modifications for ExpandedViewEnhanced.jsx | Plan says "Replace sessionCache usage with useBlocks()" but doesn't show before/after for 5 usage locations      | High     | 🔍     | ⛔ Gap 1 |       
  | useBlocks() export from feature barrel           | Plan doesn't mention adding export to src/features/block/index.ts                                                | High     | 🔍     | ⛔ Gap 2 |       
  | Dashboard.jsx exact modifications                | Plan says "Replace sessionCache.getAllDocuments with useDocuments()" but no before/after                         | High     | 🔍     | Gap 3    |       
  | useDocuments() hook definition                   | Plan shows useDocuments in use-document.ts but it uses Dexie directly - unclear if TanStack Query wrapper needed | Med      | 🔍     | Gap 4    |       
  | Feature flag integration pattern                 | Plan has feature flag file but doesn't show how to wrap consumers for gradual rollout                            | Med      | 🔍     | Gap 5    |       
  | Numbered execution order for Phase 4.4           | Steps 9-12 are vague ("Update first consumer", "Update Dashboard") - need atomic steps                           | High     | 🔍     | Gap 6    |       
  | sessionCache deprecation approach                | Step 12 says "Mark sessionCache as deprecated" but no specific code changes shown                                | Low      | 🔍     | Gap 7    |       
  | API compatibility bridge                         | useBlocks() returns different shape than usePaginatedBlockLoader - may need adapter                              | High     | 🔍     | ⛔ Gap 8 |       

  ---
  Instructions for AI

  Gap 1: ExpandedViewEnhanced.jsx exact modifications 🔍

  Instructions for AI:

  Read src/components/ExpandedViewEnhanced.jsx and analyze lines 12, 109, 933, 2402, and 2487 where sessionCache is used. For each usage location, document: (1) the current sessionCache method call, (2) the exact replacement using useBlocks() or TanStack Query invalidation, and (3) any surrounding code that needs updating. Add this as a subsection under "Step 9: Update First Consumer (ExpandedViewEnhanced)" with before/after code blocks for each location. Note that clearDocument and clearBlock calls should be replaced with TanStack Query queryClient.invalidateQueries(), while logPerformanceSummary can likely be removed or replaced with TanStack Query DevTools.

  Gap 2: useBlocks() export from feature barrel 🔍

  Instructions for AI:

  Add a new step before Step 9 (renumber as Step 9, making current steps 9-14 become 10-15). This new step should: (1) Read src/features/block/index.ts to understand current exports, (2) Add export for useBlocks from ./hooks/use-blocks-query, (3) Show the exact line to add. This is critical because consumers import from the barrel file, not the hook file directly.

  Gap 3: Dashboard.jsx exact modifications 🔍

  Instructions for AI:

  Read src/pages/Dashboard.jsx and analyze lines 31, 457, and 572 where sessionCache is used. For each location, document: (1) the current sessionCache method (removeDocument, getAllDocuments), (2) the exact replacement using documentRepository or useDocuments() hook, and (3) how to wire up the repository import. Add this as a subsection under "Step 10: Update Dashboard" with before/after code blocks. The getAllDocuments() usage may require understanding how documents are merged with Supabase data.

  Gap 4: useDocuments() hook completeness 🔍

  Instructions for AI:

  Read src/features/document/hooks/use-document.ts and verify the useDocuments() hook is complete for Dashboard.jsx needs. Check if: (1) it returns documents in the format Dashboard.jsx expects, (2) it handles the getAllDocuments() use case at line 572 where cached documents are merged with server data. If the current implementation is insufficient, document what changes are needed to make useDocuments() compatible with Dashboard.jsx requirements.

  Gap 5: Feature flag integration pattern 🔍

  Instructions for AI:

  Add a subsection to Phase 4.4 showing how to wrap consumers with the feature flag for gradual rollout. The pattern should be: (1) import isNewDataLayerEnabled from feature-flags, (2) conditionally use old hooks vs new useBlocks() hook, (3) provide example code showing the conditional pattern in ExpandedViewEnhanced.jsx. This allows toggling back to old behavior if issues arise.

  Gap 6: Numbered atomic execution order for Phase 4.4 🔍

  Instructions for AI:

  Replace the current Steps 9-12 with specific atomic steps. Break down each step into sub-steps with exact file paths and actions. For example, Step 9 "Update First Consumer (ExpandedViewEnhanced)" should become: 9a. Add useBlocks export to barrel, 9b. Import useBlocks in ExpandedViewEnhanced, 9c. Replace usePaginatedBlockLoader call, 9d. Replace sessionCache.clearDocument calls, etc. Each sub-step should be one atomic action that can be verified independently.

  Gap 7: sessionCache deprecation approach 🔍

  Instructions for AI:

  Add specifics to Step 12 about how to mark sessionCache as deprecated. Options include: (1) Add @deprecated JSDoc comment to session-cache.ts exports, (2) Add console.warn on first usage, (3) Add comment explaining migration path. Provide the exact code changes to make in src/shared/lib/storage/session-cache.ts.

  Gap 8: API compatibility bridge 🔍

  Instructions for AI:

  Read both src/features/block/hooks/use-paginated-loader.ts and src/features/block/hooks/use-blocks-query.ts to compare their return shapes. Document: (1) What usePaginatedBlockLoader returns (blocks, isLoading, loadMore, hasMore, etc.), (2) What useBlocks returns, (3) Any missing properties that consumers depend on. If there's a mismatch, add a note about creating an adapter hook or updating useBlocks to include missing properties like loadMore, hasMore, pagination state, etc.

  ---
  Gap Execution Order

  🔍 Fill with iterate_plan (in dependency order):

  | Step | Gap   | Name                               | Note                                   |
  |------|-------|------------------------------------|----------------------------------------|
  | ⛔ 1 | Gap 2 | useBlocks() export from barrel     | CRITICAL - blocks: Gap 1, 3, 5, 6, 8   |
  | ⛔ 2 | Gap 8 | API compatibility bridge           | CRITICAL - blocks: Gap 1, 3, 6         |
  | 3    | Gap 4 | useDocuments() hook completeness   | Depends on: understanding current impl |
  | 4    | Gap 1 | ExpandedViewEnhanced modifications | Depends on: Gap 2, 8                   |
  | 5    | Gap 3 | Dashboard.jsx modifications        | Depends on: Gap 2, 4                   |
  | 6    | Gap 5 | Feature flag integration pattern   | Depends on: Gap 1, 3                   |
  | 7    | Gap 6 | Numbered atomic execution order    | Depends on: Gap 1-5                    |
  | 8    | Gap 7 | sessionCache deprecation           | After all consumers migrated           |
