# Document Page Architecture Refactor - Master Vision

> **Mission**: Transform devlog from "Distributed Monolith" to a clean, professional, bug-resistant architecture.

---

## The Vision

### Before (Current State)
```
ExpandedViewEnhanced.jsx (2,570 lines)
    ↓
10 Block Types (no shared interface)
    ↓
5+ Overlapping Caches (race conditions)
    ↓
15+ Dead Files (confusion)
    ↓
State in 5 Places (bugs)
```

### After (Target State)
```
Feature-Sliced Design
    ↓
TypeScript Contracts (compile-time safety)
    ↓
TanStack Query + Dexie (single cache coordinator)
    ↓
Repository Pattern (abstracted data layer)
    ↓
Decomposed Components (<400 lines each)
```

---

## Core Principles

1. **Single Source of Truth** - One place owns each piece of data
2. **Explicit Contracts** - TypeScript interfaces enforce boundaries
3. **Enforced Boundaries** - Tooling prevents violations, not discipline
4. **Strangler Fig** - Build new alongside old, swap incrementally
5. **Test-First** - Characterization tests before refactoring

---

## Tech Stack (Target)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Architecture | Feature-Sliced Design | Layer boundaries |
| Types | TypeScript (strict) | Compile-time contracts |
| Server State | TanStack Query v5 | Supabase caching, deduplication |
| Client State | Zustand | UI state only |
| Local DB | Dexie.js | IndexedDB with reactive queries |
| Sync | Repository Pattern | Abstract Supabase ↔ Dexie |
| Boundaries | Dependency Cruiser | CI enforcement |
| Testing | Vitest + RTL | Fast, Vite-native |

---

## Phase Overview

| Phase | Name | Status | Plan File | Duration |
|-------|------|--------|-----------|----------|
| 0 | Dead Code Cleanup | ⬜ Not Started | [phase-0-cleanup.md](./phase-0-cleanup.md) | 1-2 days |
| 1 | Foundation (TS + Tools) | ⬜ Not Started | [phase-1-foundation.md](./phase-1-foundation.md) | 1 week |
| 2 | FSD Architecture | ⬜ Not Started | [phase-2-fsd-architecture.md](./phase-2-fsd-architecture.md) | 1 week |
| 3 | Block Contracts | ⬜ Not Started | [phase-3-block-contracts.md](./phase-3-block-contracts.md) | 1 week |
| 4 | Data Layer (Repository) | ⬜ Not Started | [phase-4-data-layer.md](./phase-4-data-layer.md) | 2 weeks |
| 5 | Component Decomposition | ⬜ Not Started | [phase-5-decomposition.md](./phase-5-decomposition.md) | 2-3 weeks |
| 6 | Strangler Fig Migration | ⬜ Not Started | [phase-6-migration.md](./phase-6-migration.md) | 1 week |

**Status Legend**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | 🔴 Blocked

---

## Progress Tracker

### Phase 0: Dead Code Cleanup
- [ ] Delete unused TextBlock variants
- [ ] Delete unused AIBlock variants
- [ ] Delete unused storage wrappers
- [ ] Delete unused skeleton components
- [ ] Delete unused auth context
- [ ] Delete other legacy files
- [ ] Verify build still works
- [ ] Commit with detailed message

### Phase 1: Foundation
- [ ] Add TypeScript configuration
- [ ] Install TanStack Query
- [ ] Install Vitest + RTL
- [ ] Install Dependency Cruiser
- [ ] Install eslint-plugin-boundaries
- [ ] Convert one file to .tsx as proof
- [ ] First passing test

### Phase 2: FSD Architecture
- [ ] Create FSD folder structure
- [ ] Move shared/ utilities
- [ ] Create app/ layer
- [ ] Set up boundary rules
- [ ] Verify Dependency Cruiser passes

### Phase 3: Block Contracts
- [ ] Define BlockComponent interface
- [ ] Define BlockData types
- [ ] Define all block-specific types
- [ ] Create type-safe block registry
- [ ] Add JSDoc to existing blocks (bridge)

### Phase 4: Data Layer
- [ ] Create entities/Document types
- [ ] Create entities/Block types
- [ ] Create DocumentRepository
- [ ] Create BlockRepository
- [ ] Replace sessionCache with TanStack Query
- [ ] Replace optimizedBlockLoader with repository
- [ ] Unified cache coordinator

### Phase 5: Decomposition
- [ ] Extract useDocumentState hook
- [ ] Extract useBlockOperations hook
- [ ] Extract useDragDrop hook
- [ ] Create DocumentEditor component
- [ ] Create BlockList component
- [ ] Create BlockSelector component
- [ ] Create DocumentHeader component
- [ ] Each component < 400 lines

### Phase 6: Migration
- [ ] Create feature flag for new editor
- [ ] Wire new components alongside old
- [ ] Test with flag enabled
- [ ] Gradual cutover to users
- [ ] Remove old ExpandedViewEnhanced
- [ ] Remove old Dashboard code
- [ ] Final cleanup

---

## Success Metrics

| Metric | Before | Target | Current |
|--------|--------|--------|---------|
| Largest file (lines) | 2,570 | < 400 | - |
| Dead files | 15+ | 0 | - |
| Cache layers | 5+ | 1 (TanStack Query) | - |
| TypeScript coverage | 0% | 100% | - |
| Test coverage | 0% | > 70% | - |
| Circular dependencies | ? | 0 | - |
| Build time | ? | < 10s | - |

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| TypeScript approach | Full migration (.jsx → .tsx) | Compile-time safety everywhere |
| Migration strategy | Strangler Fig | Safe, reversible, incremental |
| Architecture | Feature-Sliced Design | Enforced boundaries by tooling |
| Server state | TanStack Query | Replaces 5 overlapping caches |
| Local DB wrapper | Dexie (already installed) | Reactive queries, simpler API |
| Client state | Zustand (already installed) | UI state only, small stores |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Strangler Fig pattern, feature flags |
| TypeScript migration complexity | Incremental, start with new code |
| Test coverage gaps | Write characterization tests first |
| Scope creep | Each phase has clear boundaries |
| Performance regression | Measure before/after each phase |

---

## References

- [Architecture Assessment](../research/2025-12-29-document-page-architecture-assessment.md)
- [resources.md](../../../resources.md) - Framework recommendations
- [AI-MEMORY/DECISIONS.md](../../../AI-MEMORY/DECISIONS.md) - Historical context
- [AI-MEMORY/PATTERNS.md](../../../AI-MEMORY/PATTERNS.md) - Known issues

---

## Changelog

| Date | Phase | Change |
|------|-------|--------|
| 2025-12-29 | Planning | Created master vision document |
| 2025-12-29 | Planning | Created all phase files (0-6) |
| 2025-12-29 | Planning | Added best practices to all phases |

---

*Last Updated: 2025-12-29*
