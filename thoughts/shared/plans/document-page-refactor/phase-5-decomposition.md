# Phase 5: Component Decomposition

> **Goal**: Break ExpandedViewEnhanced.jsx (2,570 lines) into focused components (<400 lines each).

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### Extraction Order Rules
1. **Hooks before components** - Extract logic first, then UI
2. **Leaf before root** - Extract dependencies before dependents
3. **One extraction per commit** - Atomic, reversible changes
4. **Test after each extraction** - Never batch extractions without testing
5. **No behavior changes during extraction** - Pure relocation only

### Hook Extraction Rules
1. **Single responsibility** - Each hook does ONE thing
2. **Return object, not array** - `{ title, setTitle }` not `[title, setTitle]`
3. **Prefix with use** - `useDocumentState` not `documentState`
4. **No UI in hooks** - Hooks return data, components render
5. **Dependency injection** - Pass dependencies as params, don't import

### Component Extraction Rules
1. **Props interface first** - Define types before extracting
2. **Minimal props** - Only pass what's needed
3. **No prop drilling** - Use composition or context if >2 levels
4. **Children over config** - Prefer `<Slot>` patterns over prop objects
5. **Default exports for components** - Named exports for hooks

### Size Guidelines
1. **<400 lines per file** - Hard limit
2. **<200 lines ideal** - Soft target
3. **<10 props per component** - Refactor if exceeding
4. **<5 hooks per component** - Extract to custom hook if exceeding
5. **<3 levels of nesting** - Flatten with early returns

### Testing During Extraction
1. **Snapshot before extraction** - Know what you're preserving
2. **Manual test after each extraction** - Don't rely only on type checking
3. **Verify no behavior change** - Same inputs → same outputs
4. **Test edge cases explicitly** - They're easy to lose during extraction
5. **Integration test at end** - Full flow after all extractions

### Dependency Management
1. **No circular imports** - Use dependency injection
2. **Imports flow down** - Orchestrator imports hooks, not reverse
3. **Check import graph** - Run `depcruise` after each extraction
4. **Shared code goes to shared/** - Not duplicated in features/

---

## Objectives

1. Extract custom hooks from ExpandedViewEnhanced
2. Extract sub-components
3. Create feature slices for block operations
4. Ensure each file is <400 lines
5. Maintain all existing functionality

---

## Decomposition Map (Preview)

```
ExpandedViewEnhanced.jsx (2,570 lines)
    │
    ├── Extract Hooks:
    │   ├── useDocumentState.ts      # title, tags, stableEntry
    │   ├── useBlockOperations.ts    # CRUD operations
    │   ├── useDragDrop.ts           # DnD state machine
    │   ├── useBlockSync.ts          # Smart Sync integration
    │   └── useBacklinks.ts          # Backlink calculation
    │
    ├── Extract Components:
    │   ├── DocumentHeader.tsx       # Title, tags, metadata
    │   ├── BlockList.tsx            # Virtuoso list rendering
    │   ├── BlockSelector.tsx        # Add block UI
    │   └── DocumentActions.tsx      # Delete, share, etc.
    │
    └── Orchestrator:
        └── DocumentEditor.tsx       # Composes everything (~200 lines)
```

---

## Target File Sizes

| Component | Current | Target |
|-----------|---------|--------|
| DocumentEditor (orchestrator) | 2,570 | <200 |
| useDocumentState | - | <100 |
| useBlockOperations | - | <200 |
| useDragDrop | - | <150 |
| useBlockSync | - | <100 |
| DocumentHeader | - | <150 |
| BlockList | - | <200 |
| BlockSelector | - | <150 |

---

## High-Level Steps

1. Identify extraction boundaries in ExpandedViewEnhanced
2. Extract hooks one at a time (test after each)
3. Extract components one at a time (test after each)
4. Create orchestrator component
5. Wire up in FSD features/ layer
6. Verify all functionality preserved

---

## Success Criteria

### Automated
- [ ] No file >400 lines
- [ ] All tests pass
- [ ] Build succeeds
- [ ] TypeScript compiles
- [ ] Dependency Cruiser passes

### Manual
- [ ] All block operations work (add, edit, delete, move)
- [ ] Drag and drop works
- [ ] Auto-save works
- [ ] No visual regressions
- [ ] Performance same or better

---

## Estimated Duration

~2-3 weeks

---

## Depends On

- Phase 4 complete (Repository pattern for data access)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 5 of Document Page Architecture Refactor*
