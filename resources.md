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


-------------------------------------------
-------------------------------------------
-------------------------------------------


Perfect! Now I have comprehensive research on the patterns and frameworks. Let me compile this into a practical guide tailored to your specific tech stack.

## Refactoring "Distributed Monolith" React 19 Codebases: A Practical Framework

Based on your situation, here's a structured mental model combining proven architectural patterns with your specific tech stack (React 19, Vite, Tailwind, Supabase, IndexedDB):

***

### **1. Diagnosis: Understanding "Distributed Monolith Syndrome"**

Your codebase suffers from a specific disease: *no architectural boundaries*. Files are scattered, state is everywhere, and dependencies flow randomly. This is different from a traditional monolith (centralized) or a proper modular system (decentralized with boundaries).

**Common symptoms in your stack:**
- Large components mixing UI + data fetching + business logic
- State duplicated across IndexedDB, React state, and Supabase
- Custom hooks scattered without clear ownership
- No clear feature boundaries (features use code from everywhere)
- Refactoring one area breaks 3 others
- Hard to test because everything depends on everything

***

### **2. The Mental Model: Feature-Sliced Design (FSD)**

The **most effective framework** for your situation is **Feature-Sliced Design**  — it's specifically designed to fix distributed monoliths in React.[1][2]

**Core principle:** Organize by *business features*, not by technical layers.

#### **FSD Hierarchy (top to bottom):**

```
app/               → Application-level setup, routing, global providers
├── layout
├── providers
└── router

pages/             → Route components (feature pages)
├── TasksPage
├── SettingsPage
└── DashboardPage

widgets/           → Reusable UI compounds (no business logic)
├── TaskCard
├── Header
└── Sidebar

features/          → User interactions (the heart of your app)
├── AddTask/
│   ├── AddTask.tsx
│   ├── hooks/
│   ├── types/
│   └── index.ts (public API)
├── FilterTasks/
└── DeleteTask/

entities/          → Business domain models (non-interactive)
├── Task/
│   ├── Task.types.ts
│   ├── Task.api.ts
│   ├── Task.db.ts (IndexedDB)
│   └── index.ts
└── User/

shared/            → Utilities (no business logic)
├── hooks/
├── utils/
├── ui-components/
└── constants/
```

**The Critical Rule:** *Each layer can ONLY depend on layers BELOW it.* Pages use Features, Features use Entities, Entities use Shared. Never upward.

[Source]

***

### **3. Strangler Fig Pattern: Incremental Refactoring**

You don't need to rewrite everything at once. Use the **Strangler Fig Pattern**  to gradually replace parts:[3][4]

1. **Identify a domain** (e.g., "Task Management")
2. **Build it cleanly** in FSD structure alongside existing code
3. **Intercept calls** to old code → route to new code (via a wrapper/hook)
4. **Keep both running** temporarily, monitoring for issues
5. **Remove old code** once confident
6. **Repeat** for next domain

**Example: Refactoring Task Management**

```javascript
// OLD (scattered, messy)
export function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  
  // 10 useEffects mixed with IndexedDB and Supabase calls
  // 200 lines of JSX
  // Everything inline
}

// NEW (FSD structure)
features/AddTask/
  ├── AddTask.tsx (UI component)
  ├── hooks/
  │   ├── useAddTask.ts (handles Supabase + IndexedDB sync)
  │   └── useAddTaskForm.ts (form logic)
  ├── types/
  │   └── AddTask.types.ts
  └── index.ts (exports only AddTask component + hook)

entities/Task/
  ├── Task.types.ts (interfaces)
  ├── Task.repository.ts (Supabase + IndexedDB logic)
  ├── Task.sync.ts (keeping both in sync)
  └── index.ts

// Wrapper that routes old code → new code
const useAddTaskLegacy = (onSuccess) => {
  const { addTask } = useAddTask(); // NEW code
  
  return (task) => {
    addTask(task).then(onSuccess);
  };
};
```

***

### **4. State Management Strategy: The Right Tool for Each Job**

Your stack has 3 state layers. Here's how to organize them:

#### **Layer 1: UI State (Component-level)**
Use **React hooks** (useState, useReducer) — no external library needed.

```javascript
// ✅ Good: Local form state
function AddTaskForm() {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ...
}
```

#### **Layer 2: Feature State (Custom Hooks)**
Use **custom hooks** for feature-specific logic. This is where Zustand is sometimes overkill.

```javascript
// hooks/useAddTask.ts
export function useAddTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const addTask = useCallback(async (task) => {
    setLoading(true);
    try {
      // 1. Save to Supabase
      const { data, error: dbError } = await supabase
        .from('tasks')
        .insert([task]);
      
      if (dbError) throw dbError;
      
      // 2. Sync to IndexedDB
      await taskDb.add(data[0]);
      
      return data[0];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { addTask, loading, error };
}
```

#### **Layer 3: Application State (Zustand or Context)**
Use **Zustand** for cross-feature state (user, settings, global notifications). It's **lighter than Redux** and requires less boilerplate.[5]

```javascript
// stores/useUserStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/react';

export const useUserStore = create(
  subscribeWithSelector((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
  }))
);

// In a component
function TasksPage() {
  const user = useUserStore((state) => state.user); // Only re-renders if user changes
  // ...
}
```

**Rule of thumb:**[5]
- **Context API**: Simple, local state (avoid for frequently changing data)
- **Custom Hooks**: Feature-specific, reusable logic
- **Zustand**: App-wide state (user, theme, notifications)
- **Never Redux** unless you have >50 interconnected features

***

### **5. Supabase + IndexedDB Synchronization Pattern**

This is critical for your stack. Here's the architecture:

```
┌─────────────────────────────────────────────┐
│          React Component                     │
└────────────┬────────────────────────────────┘
             │ useTaskRepository()
             ↓
┌─────────────────────────────────────────────┐
│         Task Repository                      │
│  (Abstraction layer - single source of truth)│
│                                              │
│  • Handles sync logic                        │
│  • Resolves conflicts                        │
│  • Caches data                               │
└────────┬──────────────────────────────────┬──┘
         │                                  │
         ↓                                  ↓
    ┌─────────┐                      ┌──────────────┐
    │ Supabase│                      │ IndexedDB    │
    │(Remote) │                      │(Local Cache) │
    └─────────┘                      └──────────────┘
```

```typescript
// entities/Task/Task.repository.ts
import { useCallback, useEffect, useState } from 'react';

export function useTaskRepository() {
  const [tasks, setTasks] = useState([]);
  const [syncing, setSyncing] = useState(false);
  
  // Fetch from Supabase, fill local IndexedDB
  const syncFromRemote = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');
      
      if (error) throw error;
      
      // Update local cache
      await db.tasks.bulkPut(data);
      setTasks(data);
    } catch (error) {
      console.error('Sync failed:', error);
      // Fallback to IndexedDB
      const cached = await db.tasks.toArray();
      setTasks(cached);
    } finally {
      setSyncing(false);
    }
  }, []);
  
  // Push local changes to Supabase
  const pushLocal = useCallback(async (task) => {
    // Optimistic update
    setTasks(prev => [...prev, task]);
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task]);
      
      if (error) throw error;
      
      // Update with server response (includes IDs, timestamps)
      await db.tasks.put(data[0]);
      setTasks(prev => 
        prev.map(t => t.id === task.id ? data[0] : t)
      );
    } catch (error) {
      console.error('Push failed:', error);
      // Keep in IndexedDB, mark as pending sync
      task._pending = true;
      await db.tasks.put(task);
    }
  }, []);
  
  // Auto-sync on mount
  useEffect(() => {
    syncFromRemote();
  }, []);
  
  return { tasks, syncing, syncFromRemote, pushLocal };
}
```

**Key principle:**[6]
- IndexedDB = primary state source (works offline)
- Supabase = sync target (eventual consistency)
- Never store large nested objects — break into normalized records
- Always write incremental changes, not entire state tree

***

### **6. Incremental Refactoring Checklist**

This is the **practical roadmap**. Do it in this order:

#### **Phase 1: Foundation (Week 1-2)**
- [ ] Set up FSD folder structure
- [ ] Create `entities/` layer with types (Task.types.ts)
- [ ] Create `shared/` with reusable utils and hooks
- [ ] Choose state management: **Zustand** for app-wide state
- [ ] Define public APIs (index.ts files) — these are your boundaries

#### **Phase 2: Repository Layer (Week 2-3)**
- [ ] Build `entities/Task/Task.repository.ts` with Supabase + IndexedDB logic
- [ ] Test offline/online sync thoroughly
- [ ] Implement error handling and conflict resolution
- [ ] Write tests (this is critical)

#### **Phase 3: Features (Week 3-4)**
- [ ] Extract one feature (e.g., `features/AddTask/`)
- [ ] Use custom hooks (`useAddTask`) to encapsulate logic
- [ ] Keep component logic minimal — mostly UI
- [ ] Use the Strangler Fig: create wrapper that routes old → new code

#### **Phase 4: Pages (Week 4-5)**
- [ ] Refactor page components
- [ ] Compose features and entities
- [ ] Remove old code as features prove stable
- [ ] Monitor performance — measure before/after

#### **Phase 5: Widgets & Shared (Week 5+)**
- [ ] Extract reusable UI components
- [ ] Build a component library if needed
- [ ] Keep shared code truly reusable (no business logic)

***

### **7. Testing Strategy (Non-Negotiable)**

 emphasizes: **Get tests in place FIRST.**[7]

```typescript
// entities/Task/Task.repository.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTaskRepository } from './Task.repository';

describe('Task Repository', () => {
  it('should sync from Supabase to IndexedDB', async () => {
    const { result } = renderHook(() => useTaskRepository());
    
    act(() => {
      // Mock Supabase response
    });
    
    // Verify IndexedDB was updated
    // Verify setTasks was called
  });
});
```

**Why:** Tests give you confidence to refactor aggressively.

***

### **8. Tools to Accelerate Refactoring**

Given your focus on **technical implementation**, these tools help:

1. **GitHub Copilot** — generates scaffolding code, tests, types
2. **VS Code + ESLint** — detect unused code and violations of FSD rules
3. **Vitest** — fast unit testing (integrates with Vite)
4. **Dexie.js** — simpler IndexedDB wrapper (consider switching from raw IndexedDB)
5. **TypeScript strict mode** — catch dependencies violations at compile time

***

### **9. Measuring Success**

Track these metrics to know it's working:

| Metric | Current | Target |
|--------|---------|--------|
| Largest file (lines) | ? | <400 |
| Cyclomatic complexity per function | ? | <10 |
| Test coverage | ? | >70% |
| Build time | ? | <5s |
| Time to add a feature | ? | <2 days |
| Number of files touched per feature | ? | <10 |

***

### **10. Common Pitfalls to Avoid**

❌ **Don't:** Start with big refactors everywhere at once  
✅ **Do:** Pick one domain (e.g., Task Management) and go deep

❌ **Don't:** Use Zustand for every state change  
✅ **Do:** Use hooks + local state first, Zustand only for app-wide state

❌ **Don't:** Store entire state trees in IndexedDB  
✅ **Do:** Break into normalized records, write only what changed[6]

❌ **Don't:** Skip testing because "we'll add it later"  
✅ **Do:** Write tests as you refactor — they protect against regressions

❌ **Don't:** Mix business logic in components  
✅ **Do:** Move to custom hooks (features/) or entities/

***

### **Quick Start Template**

Here's a minimal FSD structure to start with:

```
src/
├── app/
│   ├── providers.tsx          # React providers
│   ├── router.tsx             # Routing setup
│   └── App.tsx                # Entry
├── pages/
│   └── TasksPage.tsx
├── features/
│   ├── AddTask/
│   │   ├── AddTask.tsx
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   └── FilterTasks/
├── entities/
│   └── Task/
│       ├── Task.types.ts
│       ├── Task.repository.ts
│       └── index.ts
├── shared/
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   └── useDebounce.ts
│   ├── utils/
│   ├── db/
│   │   └── indexeddb.ts
│   └── api/
│       └── supabase.ts
└── styles/
    └── tailwind.css
```

This gives you clear boundaries without over-engineering.

***

**Bottom line:** Feature-Sliced Design + Strangler Fig Pattern + Zustand is your winning combination. Start with diagnosis (which files have the most dependencies?), pick a domain, build it right, swap it in using the Strangler Fig, remove old code, repeat. Your codebase will transform from "distributed monolith" to "scalable modular system" in 4-6 weeks if you're disciplined.[8][1]
