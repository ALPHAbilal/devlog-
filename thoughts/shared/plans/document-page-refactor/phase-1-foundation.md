# Phase 1: Foundation (TypeScript + Tooling)

> **Goal**: Set up TypeScript, TanStack Query, Vitest, and boundary enforcement tools.

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### TypeScript Migration Rules
1. **Strict mode from day one** - Never start with loose config then tighten
2. **No `any` allowed** - Use `unknown` if type is truly unknown
3. **Convert leaf files first** - Utilities before components
4. **Don't convert and refactor simultaneously** - TypeScript first, then improve
5. **Keep .jsx working** - TypeScript should compile alongside JavaScript

### TanStack Query Rules
1. **Query keys must be arrays** - `['documents', id]` not `'documents-' + id`
2. **Create key factories** - Centralized, type-safe key generation
3. **Set sensible staleTime** - Don't over-fetch (5 min default for documents)
4. **DevTools in dev only** - Don't ship to production

### Testing Rules
1. **Test behavior, not implementation** - "user can add block" not "setBlocks called"
2. **One assertion per test** - Clear failure messages
3. **Arrange-Act-Assert pattern** - Consistent structure
4. **Mock boundaries, not internals** - Mock Supabase, not your hooks

### Tooling Rules
1. **Dependency Cruiser in CI** - Fail build on violations
2. **ESLint boundaries in IDE** - Instant feedback while coding
3. **Pre-commit hooks** - Catch issues before commit

---

## Objectives

1. Add TypeScript with strict mode
2. Install TanStack Query v5
3. Install Vitest + React Testing Library
4. Install Dependency Cruiser + eslint-plugin-boundaries
5. Convert one file to .tsx as proof of concept
6. Write first passing test

---

## Key Dependencies to Add

```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "dependency-cruiser": "^16.x",
    "eslint-plugin-boundaries": "^4.x"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-query-devtools": "^5.x"
  }
}
```

---

## High-Level Steps

1. **TypeScript Setup**
   - Add tsconfig.json with strict mode
   - Configure Vite for TypeScript
   - Add path aliases

2. **TanStack Query Setup**
   - Install package
   - Create QueryClient
   - Wrap app in QueryClientProvider

3. **Vitest Setup**
   - Install and configure
   - Add test script to package.json
   - Create first test file

4. **Boundary Tools Setup**
   - Install Dependency Cruiser
   - Create .dependency-cruiser.js config
   - Add eslint-plugin-boundaries rules

5. **Proof of Concept**
   - Convert one simple utility to .ts
   - Convert one simple component to .tsx
   - Write one test
   - Verify everything works together

---

## Success Criteria

### Automated
- [ ] `npm run typecheck` passes
- [ ] `npm run test` runs and passes
- [ ] `npm run build` works with TypeScript
- [ ] `npx depcruise src --config` runs without errors

### Manual
- [ ] Dev server starts without errors
- [ ] App functions normally
- [ ] TanStack Query DevTools visible in browser

---

## Estimated Duration

~1 week

---

## Depends On

- Phase 0 complete (dead code removed)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 1 of Document Page Architecture Refactor*
