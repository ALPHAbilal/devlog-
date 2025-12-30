# Phase 2: FSD Architecture (Folder Structure)

> **Goal**: Implement Feature-Sliced Design folder structure with enforced boundaries.

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### FSD Layer Rules
1. **Layers can ONLY import DOWN** - Never up, never sideways between features
2. **Public API via index.ts** - Every slice exports only what's needed
3. **No cross-slice imports in features/** - Features are isolated
4. **Shared has NO business logic** - Pure utilities only
5. **Entities are data + types** - No UI, no side effects

### Migration Rules
1. **Move files, don't rewrite** - Pure relocation first
2. **Update imports immediately** - Don't leave broken imports
3. **One layer at a time** - Complete shared/ before entities/
4. **Test after each move** - `npm run build` after every batch
5. **Commit after each layer** - Small, reversible commits

### Boundary Enforcement Rules
1. **Configure Dependency Cruiser first** - Before moving files
2. **Violations = build failure** - No exceptions
3. **Document allowed exceptions** - If truly needed, document why
4. **Run check before commit** - Pre-commit hook

### Naming Conventions
1. **Folders are kebab-case** - `add-block/` not `AddBlock/`
2. **Components are PascalCase** - `AddBlock.tsx`
3. **Hooks start with use** - `useAddBlock.ts`
4. **Types in .types.ts** - `Block.types.ts`
5. **Index.ts is public API** - Only exports, no logic

---

## Objectives

1. Create FSD folder structure
2. Move shared utilities to `shared/` layer
3. Create `app/` layer for providers and routing
4. Configure boundary rules in tooling
5. Verify Dependency Cruiser enforces layers

---

## Target Structure

```
src/
├── app/                    # Layer 1: App setup
│   ├── providers/          # React providers
│   ├── router/             # Routing setup
│   └── styles/             # Global styles
│
├── pages/                  # Layer 2: Route pages
│   ├── Dashboard/
│   ├── Landing/
│   └── Settings/
│
├── widgets/                # Layer 3: Compound UI
│   ├── Sidebar/
│   ├── Header/
│   └── DocumentEditor/     # (Future: decomposed ExpandedView)
│
├── features/               # Layer 4: User interactions
│   ├── AddBlock/
│   ├── DeleteDocument/
│   └── SyncStatus/
│
├── entities/               # Layer 5: Business objects
│   ├── Document/
│   ├── Block/
│   └── User/
│
└── shared/                 # Layer 6: Utilities
    ├── api/                # Supabase client
    ├── db/                 # Dexie setup
    ├── hooks/              # Generic hooks
    ├── lib/                # Utilities
    └── ui/                 # UI components (shadcn style)
```

---

## FSD Rules

1. **Layers can only import from layers BELOW**
   - `app/` → can import from all layers
   - `pages/` → can import widgets, features, entities, shared
   - `widgets/` → can import features, entities, shared
   - `features/` → can import entities, shared
   - `entities/` → can import shared only
   - `shared/` → can only import from shared

2. **Each slice has public API via index.ts**
   - Only export what's needed
   - Hide implementation details

---

## High-Level Steps

1. Create folder structure
2. Move `src/utils/` → `src/shared/lib/`
3. Move `src/hooks/` → `src/shared/hooks/`
4. Move `src/contexts/` → `src/app/providers/`
5. Create boundary rules
6. Verify with Dependency Cruiser

---

## Success Criteria

### Automated
- [ ] Dependency Cruiser shows no violations
- [ ] ESLint boundaries plugin passes
- [ ] Build still works
- [ ] All imports resolve correctly

### Manual
- [ ] Folder structure matches FSD spec
- [ ] Each layer has clear purpose
- [ ] No cross-layer violations

---

## Estimated Duration

~1 week

---

## Depends On

- Phase 1 complete (TypeScript + tooling ready)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 2 of Document Page Architecture Refactor*
