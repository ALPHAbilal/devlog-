  ---
  Instructions for AI

  Gap 1: Hook File Specifications 🔍

  Instructions for AI:

  Generate detailed specifications for each hook to be extracted from ExpandedViewEnhanced.jsx. For each hook in the decomposition map (useDocumentState, useBlockOperations, useDragDrop, useBlockSync, useBacklinks), provide: (1) exact file path following FSD convention src/features/document/hooks/use-{name}.ts, (2) complete TypeScript interface for return type, (3) line ranges from ExpandedViewEnhanced.jsx to extract (use the codebase-analyzer results showing updateBlock is lines 546-871, deleteBlock is 873-954, etc.), (4) dependencies to inject as parameters, (5) a skeleton implementation template. Follow the hook pattern from src/features/block/hooks/use-blocks-query.ts for return type format (object with data, loading states, actions). Each hook specification should be ~20-30 lines of documentation.

  Gap 2: Component File Specifications 🔍

  Instructions for AI:

  Generate detailed specifications for each component to be extracted (DocumentHeader, BlockList, BlockSelector, DocumentActions, and new ones identified: TitleEditor, TagManager, BacklinksSection, DeleteConfirmation, ViewModeToggle). For each component provide: (1) exact file path in a new src/components/ExpandedViewEnhanced/components/ directory structure, (2) complete Props TypeScript interface, (3) line ranges from ExpandedViewEnhanced.jsx to extract, (4) JSX template showing structure, (5) any state that moves with the component vs stays in parent. Reference the codebase-analyzer results which identified TitleEditor (~40 lines), TagManager (~95 lines), BacklinksSection (~32 lines), DeleteConfirmation (~85 lines), ViewModeToggle (~40 lines), HeaderControls (~80 lines), BlockListView (~120 lines), LinesView (~50 lines).

  Gap 3: ExpandedViewEnhanced.jsx Modification Steps 🔍

  Instructions for AI:

  Create a step-by-step modification log for ExpandedViewEnhanced.jsx showing how it transforms from 2,570 lines to ~200 lines. Each step should show: (1) what lines to remove, (2) what import to add, (3) what to replace the removed code with (hook call or component). Use the "one extraction per commit" rule from the plan. Start with hooks (they have no UI dependencies) then components. Calculate expected line count after each extraction step to verify progress toward <200 line target. Include git commit message format for each step.

  Gap 4: Barrel File and Import Updates 🔍

  Instructions for AI:

  List all barrel files and imports that need updating after extractions. Use codebase-locator to find all files that import from ExpandedViewEnhanced.jsx (check src/pages/DocumentPage.jsx at minimum). For each extracted hook, add to src/features/document/hooks/index.ts or create src/features/document/index.ts if needed. Document the exact export lines to add. Document any path alias updates needed. Follow the barrel file patterns found in src/features/block/index.ts.

  Gap 5: Orchestrator (DocumentEditor.tsx) Specification 🔍

  Instructions for AI:

  Generate the complete specification for the final DocumentEditor.tsx orchestrator component. This is what ExpandedViewEnhanced.jsx becomes after all extractions. Show: (1) all imports from extracted hooks and components, (2) the ~200 lines of orchestration code that wires everything together, (3) how state flows between hooks and components, (4) the JSX composition pattern. Reference how the current component receives entry, allEntries, onNavigateBack, isMobileView as props.

  Gap 6: Numbered Execution Order 🔍

  Instructions for AI:

  Replace the "High-Level Steps" (6 items) with a numbered execution order of ~15-20 atomic steps. Each step format: "Step N: Extract {thing} - Expected: {file created}, Lines remaining: {count}, Verify: {command}". Order should follow the "hooks before components" and "leaf before root" rules. Start with simplest extractions (useBacklinks ~30 lines) before complex ones (useBlockOperations ~800 lines). Include dependency order (e.g., BlockListView depends on useBlockOperations being extracted first). Each step gets one commit.

  Gap 7: Verification Commands 🔍

  Instructions for AI:

  Convert the Success Criteria into runnable verification commands. For "No file >400 lines": provide find or wc -l command to check. For "All tests pass": identify if document/editor tests exist or need creation (check src/**/*.test.ts). For "Build succeeds": npm run build. For "TypeScript compiles": npm run typecheck or npx tsc --noEmit. For "Dependency Cruiser passes": provide the .dependency-cruiser.js command. For manual verification, provide a testing script or checklist with specific actions.

  ---
  Gap Execution Order

  📚 Research First (before iterate_plan):

  None - all gaps are solvable via codebase analysis

  🔍 Fill with iterate_plan (in dependency order):

  | Step | Gap   | Name                                   | Note                                         |
  |------|-------|----------------------------------------|----------------------------------------------|
  | ⛔ 1 | Gap 1 | Hook File Specifications               | CRITICAL - defines all hooks to extract      |
  | ⛔ 2 | Gap 2 | Component File Specifications          | CRITICAL - defines all components to extract |
  | ⛔ 3 | Gap 6 | Numbered Execution Order               | CRITICAL - defines order of all steps        |
  | 4    | Gap 3 | ExpandedViewEnhanced.jsx Modifications | Depends on: Gap 1, Gap 2, Gap 6              |
  | 5    | Gap 4 | Barrel File Updates                    | Depends on: Gap 1, Gap 2                     |
  | 6    | Gap 5 | Orchestrator Specification             | Depends on: Gap 1, Gap 2                     |
  | 7    | Gap 7 | Verification Commands                  | Can be done anytime                          |

  ---

● Summary

  Phase 5 is an OVERVIEW document, not an executable plan. It has:
  - ✅ Best practices and rules
  - ✅ High-level objectives
  - ✅ Decomposition preview
  - ❌ No concrete file specifications
  - ❌ No TypeScript interfaces
  - ❌ No numbered execution steps
  - ❌ No before/after code

  7 gaps need to be filled before this plan is executable:

  1. Hook specifications (paths, interfaces, line ranges)
  2. Component specifications (paths, Props interfaces, templates)
  3. ExpandedViewEnhanced modification log
  4. Barrel file/import updates
  5. Orchestrator final specification
  6. Numbered execution order (15-20 atomic steps)
  7. Verification commands
