# Escaping the Distributed Monolith: A React Refactoring Guide

Your React 19 + Vite + Tailwind codebase—with its 2500+ line files and state scattered across Supabase and IndexedDB—is exhibiting classic "distributed monolith" symptoms: high coupling, implicit dependencies, and no clear contracts. The solution combines **Feature-Sliced Design** for architectural boundaries, **TanStack Query + Zustand** for hybrid state management, and **incremental strangler fig refactoring** with proper tooling to visualize dependencies before you cut them. Start with characterization tests, extract logic into custom hooks, then progressively enforce boundaries using Dependency Cruiser.

---

## Feature-Sliced Design offers the strictest boundary enforcement

For a codebase suffering from implicit dependencies, **Feature-Sliced Design (FSD)** provides the most rigorous architectural framework available in 2024-2025. Unlike Bulletproof React's flexible guidelines, FSD enforces a strict **seven-layer hierarchy** where modules can only import from layers strictly below them—eliminating circular dependencies by design.

The core structure organizes code into **App → Pages → Widgets → Features → Entities → Shared** layers. Each layer contains "slices" partitioned by business domain (user, product, cart), and slices are further divided into segments: `ui/`, `model/`, `api/`, and `lib/`. The critical rule: **features cannot import from sibling features**, forcing all cross-cutting concerns through the shared layer or explicit interfaces.

```
src/
├── app/           # Routing, providers, global styles
├── pages/         # Full page components
├── widgets/       # Self-contained UI blocks (header, sidebar)
├── features/      # User interactions (auth, cart-actions)
│   └── auth/
│       ├── ui/    # Components
│       ├── model/ # State, business logic
│       ├── api/   # Supabase calls
│       └── index.ts  # Public API
├── entities/      # Business objects (user, product)
└── shared/        # Reusable utilities, UI kit
```

FSD comes with **Steiger**, a dedicated architectural linter that catches violations automatically. For incremental adoption, start by creating the App and Shared layers, then progressively migrate existing components—even with violations—before tightening rules. Bulletproof React is easier to adopt initially but lacks enforcement tooling, making it prone to degradation without strong team discipline.

---

## Separate server state from client state with TanStack Query and Zustand

The fundamental insight for managing Supabase (cloud) + IndexedDB (local) state is that **server state and client state are categorically different** and require different tools. Server state is persisted remotely, requires async fetching, and can change without your knowledge. Client state is synchronous and entirely under your control.

**TanStack Query** (React Query) should manage all Supabase interactions—it handles caching, deduplication, background refetching, and optimistic updates. Create query key factories for type-safe cache management:

```typescript
const todoKeys = {
  all: ['todos'] as const,
  list: (filters: Filters) => [...todoKeys.all, 'list', filters] as const,
  detail: (id: string) => [...todoKeys.all, 'detail', id] as const,
}
```

**Zustand** handles client-only state: UI preferences, filter selections, modal states, navigation. Keep stores small and focused per feature rather than creating a single global store.

For **IndexedDB integration**, use **Dexie.js** with its `useLiveQuery` hook for reactive queries that automatically update when data changes—even across browser tabs. For Supabase ↔ IndexedDB **sync**, consider **PowerSync** (plug-and-play sync via Postgres WAL) or **RxDB** (two-way replication with conflict resolution). Both require soft deletes and timestamp fields on your Supabase tables.

The architectural principle: create a **Data Access Layer** that abstracts whether data comes from Supabase or IndexedDB. Components should never know the data source—they only interact with typed repository interfaces.

---

## The strangler fig pattern enables safe incremental refactoring

For a 2500+ line file, attempting a rewrite is riskier than incremental extraction. The **Strangler Fig Pattern**, successfully applied by Shopify to refactor their 3000+ line "God object," provides a proven seven-step process:

1. **Define new interfaces** for the functionality being extracted
2. **Redirect calls incrementally** from old to new code
3. **Create new data structures** if needed
4. **Implement dual writes** to both old and new systems
5. **Backfill existing data**
6. **Switch reads** to the new system
7. **Remove legacy code** only after verification

Before any extraction, establish **characterization tests**—tests that capture the *actual* behavior of code, not what it *should* do. Use React Testing Library for component behavior and Chromatic + Storybook for visual regression testing. The rule: **test from the outside, then refactor from the inside**.

The recommended extraction order for large components:

- **Extract custom hooks first**: Pull out state + effects that belong together
- **Create domain models**: Move business logic into pure TypeScript classes
- **Extract sub-components**: Break out self-contained rendering logic
- **Restructure folders last**: Only after internal structure improves

Use **feature flags** (LaunchDarkly, Unleash, or simple Context-based toggles) to toggle between old and new implementations, enabling gradual rollout and instant rollback.

---

## Dependency Cruiser reveals coupling before you cut it

Before refactoring, you need to **see** the dependency graph. **Dependency Cruiser** is the most comprehensive tool for React/TypeScript/Vite projects, offering both visualization and rule-based validation.

```bash
# Generate folder-level dependency graph
npx depcruise src --include-only "^src" --output-type ddot | dot -T svg > folder-deps.svg

# Check for circular dependencies
npx madge --circular --extensions ts,tsx ./src

# Find unused code
npx madge --orphans --extensions ts,tsx ./src/index.tsx
```

Configure Dependency Cruiser rules to enforce architectural boundaries:

```javascript
module.exports = {
  forbidden: [
    { name: 'no-circular', from: {}, to: { circular: true } },
    { 
      name: 'feature-isolation',
      comment: 'Features cannot import from other features',
      from: { path: '^src/features/([^/]+)' },
      to: { path: '^src/features/(?!$1)' }
    }
  ]
}
```

Add **eslint-plugin-boundaries** for real-time IDE feedback during development, and integrate Madge's circular dependency check into your pre-commit hooks. For bundle analysis, use **rollup-plugin-visualizer** configured in vite.config.ts with the treemap template.

The metrics to monitor: **afferent coupling** (modules depending on this module), **efferent coupling** (modules this depends on), and **circular dependency count**. Any circular dependencies indicate architectural problems.

---

## Mental models that prevent distributed monolith syndrome

The distributed monolith anti-pattern emerges when you split code into modules that remain tightly coupled—they can't be deployed, tested, or modified independently. Warning signs: shared global Redux stores across "independent" features, changes in one module requiring coordinated changes elsewhere, and "shared" folders that become dumping grounds for everything.

**Colocation first**: Kent C. Dodds' principle states that code should live as close to where it's used as possible. Start with `useState` in the component; only lift when siblings need it. Only these belong in global state: authenticated user data, theme preferences, and locale settings. Modal open/closed status does not need Redux.

**Bounded context thinking**: Group features by business capability, not technical type. If the same term means different things in different parts of your app (e.g., "user" in auth vs. "user" in social), those are likely different contexts requiring separate modules with explicit interfaces between them.

**The coupling/cohesion mantra**: High cohesion within modules (everything serves a single purpose), low coupling between modules (changes don't ripple). Test in isolation—if a component requires mocking half the application, coupling is too high.

**The "4+ models" heuristic**: Once you have roughly four or more domain entities, introduce bounded contexts. Before that, simpler organization suffices.

**Dan Abramov's pragmatic advice**: "Move files around until it feels right." Don't pre-optimize. Address architectural problems as they become painful. Your first organization won't be perfect—expect iteration.

---

## Conclusion: A prioritized action plan

The path forward requires disciplined incremental improvement, not heroic rewrites. Begin by running Dependency Cruiser and Madge to generate a dependency graph—you can't fix what you can't see. Add characterization tests to your largest files before touching them. Extract custom hooks first; they're the lowest-risk extraction with highest impact on separating concerns.

Adopt Feature-Sliced Design's layer structure incrementally: start with `shared/` and `features/`, enforce boundaries with ESLint plugins, then tighten rules over time. For your hybrid state problem, introduce TanStack Query for all Supabase calls immediately—it provides caching and deduplication even before you reorganize. Move IndexedDB access behind repository interfaces that can evolve independently.

The mental shift matters most: **boundaries must be explicit and enforced by tooling**, not just team discipline. Every import violation caught by Steiger or Dependency Cruiser is a future coupling problem prevented. The goal isn't perfect architecture—it's sustainable architecture that degrades gracefully and can be improved incrementally.