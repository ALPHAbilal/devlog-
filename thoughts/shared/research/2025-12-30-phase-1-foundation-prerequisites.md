---
date: 2025-12-30T20:55:56+01:00
researcher: Claude
git_commit: 617e490
branch: refactor/phase-0-cleanup
repository: devlog-
topic: "Phase 1 Foundation Prerequisites Checklist"
tags: [research, phase-1, typescript, tanstack-query, vitest, prerequisites, vercel]
status: complete
last_updated: 2025-12-30
last_updated_by: Claude
last_updated_note: "Updated to reflect Vercel CI/CD workflow (no local npm install)"
---

# Research: Phase 1 Foundation Prerequisites Checklist

**Date**: 2025-12-30T20:55:56+01:00
**Researcher**: Claude
**Git Commit**: 617e490
**Branch**: refactor/phase-0-cleanup
**Repository**: devlog-

## Research Question

What needs to be correct to guarantee successful implementation of Phase 1 Foundation (TypeScript + Tooling)?

## Summary

This project uses **Vercel CI/CD** - no local npm install needed. You edit files, push to GitHub, and Vercel builds automatically.

To guarantee successful Phase 1 implementation, the following **files must be correct** before pushing.

---

## Deployment Workflow

```
Edit Files → git commit → git push → Vercel Builds → Check Build Logs
```

Vercel will:
1. Run `npm install` based on your `package.json`
2. Run `npm run build` (which is `vite build`)
3. Deploy if successful

---

## Comprehensive Checklist for Phase 1 Success

### A. BLOCKERS - Must Fix Before Starting

| # | Item | Current State | Required Action |
|---|------|---------------|-----------------|
| A1 | **Phase 0 Must Be Committed** | Files staged but NOT committed | `git commit` with Phase 0 message |
| A2 | **Push Phase 0 First** | Not pushed | Push Phase 0, verify Vercel builds successfully |

---

### B. ADDITIONAL ITEMS TO BE CORRECT

These are additional things that must be correct for Phase 1 to succeed:

#### B0. Critical Findings from Codebase Analysis

| Item | Current State | Impact | Action |
|------|---------------|--------|--------|
| **Existing .ts file** | `src/lib/supabase-optimizations.ts` exists | Already works with Vite | None needed - proves TS works |
| **.ts imported by .js** | `usePaginatedDashboard.js` imports from `.ts` file | Already working | None needed |
| **`@/` path alias** | In `vitest.config.js` but NOT in `vite.config.js` | Not used anywhere in codebase | Add to `vite.config.js` for consistency |
| **Test setup imports vitest** | `src/test/setup.js` imports `vitest` | Will error until vitest in package.json | Must add vitest to package.json |
| **Build doesn't typecheck** | `vite build` doesn't run `tsc` | Type errors won't block deploy | Optional: add `tsc &&` to build script |
| **Node version on Vercel** | Default is Node 18 | TypeScript 5.6 works best with Node 20 | Optional: set in Vercel settings |

#### B0.1 Path Alias Mismatch (Should Fix)

**Problem**: `vitest.config.js` has `@/` alias, but `vite.config.js` doesn't.

**Fix**: Add to `vite.config.js`:
```javascript
resolve: {
  alias: {
    '@': '/src',
  },
},
```

This ensures consistency when you start using `@/` imports.

#### B0.2 TanStack Query DevTools (Must Configure Correctly)

**Problem**: DevTools should NOT ship to production.

**Correct Setup** in `App.jsx`:
```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

DevTools automatically excludes itself from production builds.

#### B0.3 ESLint Boundaries Plugin (Must Configure After Install)

After adding `eslint-plugin-boundaries` to package.json, update `eslint.config.js`:

```javascript
import boundaries from 'eslint-plugin-boundaries';

export default [
  // ... existing config
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'components', pattern: 'src/components/*' },
        { type: 'hooks', pattern: 'src/hooks/*' },
        { type: 'utils', pattern: 'src/utils/*' },
        { type: 'contexts', pattern: 'src/contexts/*' },
        { type: 'pages', pattern: 'src/pages/*' },
      ],
    },
    rules: {
      'boundaries/element-types': ['warn', {
        default: 'allow',
        rules: [
          // Add rules as needed
        ],
      }],
    },
  },
];
```

#### B0.4 Dependency Cruiser Config (Must Create)

Create `.dependency-cruiser.js` in project root:

```javascript
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
```

---

### C. FILES TO MODIFY

#### C1. Edit `package.json` - Add Dependencies

Add these to your existing `package.json`. Vercel will install them automatically.

**Add to `devDependencies`:**

```json
{
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.14.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0",
    "dependency-cruiser": "^16.3.0",
    "eslint-plugin-boundaries": "^5.0.0"
  }
}
```

**Add to `dependencies`:**

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.52.0",
    "@tanstack/react-query-devtools": "^5.52.0"
  }
}
```

**Add to `scripts`:**

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest --coverage",
    "depcruise": "depcruise src --config"
  }
}
```

**CRITICAL VERSION NOTES:**
- `eslint-plugin-boundaries` MUST be `^5.0.0` (not v4.x)
- Your ESLint is 9.25.0 which requires v5+ for flat config support
- v4.x will cause build errors on Vercel

#### C2. Create `tsconfig.json` (New File)

Create this file in project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Critical Settings Explained:**
| Setting | Value | Why |
|---------|-------|-----|
| `strict` | `true` | Phase 1 rule: strict from day one |
| `noEmit` | `true` | Vite handles compilation, TS only typechecks |
| `allowJs` | `true` | Allows .jsx files alongside .tsx during migration |
| `moduleResolution` | `"bundler"` | Required for Vite compatibility |

#### C3. Update `eslint.config.js` (After boundaries plugin added)

This can be done in a later commit after verifying base setup works.

#### C4. Create `.dependency-cruiser.js` (Optional - Later)

Can be added after base TypeScript setup is verified working.

#### C5. Update `vite.config.js` - Add Path Alias

Add `resolve.alias` to match `vitest.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      // ... existing sentry config
    }),
  ],

  // ADD THIS SECTION:
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  build: {
    // ... existing build config
  },

  server: {
    // ... existing server config
  }
})
```

---

### D. FILES ALREADY CORRECT (No Changes Needed)

| File | Status | Notes |
|------|--------|-------|
| `vite.config.js` | Needs alias fix | Add `@/` path alias (see C5) |
| `vitest.config.js` | Ready | Config exists, just needs dependencies in package.json |
| `src/test/setup.js` | Ready | 120 lines of mocks already configured |
| `eslint.config.js` | Ready | Will add boundaries plugin later |

---

### E. VERIFICATION - Check Vercel Build Logs

After each push, check Vercel dashboard for:

#### E1. Build Must Pass

| Check | Where to Look | Expected |
|-------|---------------|----------|
| `npm install` | Vercel build log | No dependency errors |
| `npm run build` | Vercel build log | Exit code 0 |
| Deployment | Vercel dashboard | Green checkmark |

#### E2. App Must Work

After successful deploy, check the preview URL:
- [ ] App loads correctly
- [ ] Can create a document
- [ ] Can add blocks (text, code, heading)
- [ ] Can edit and save
- [ ] No console errors

#### E3. TanStack Query DevTools (After Provider Added)

- [ ] DevTools icon visible in bottom-right corner (dev only)

---

### F. EXISTING CODE TO PRESERVE

These must NOT be broken - Vercel build will fail if they break:

| Component | File | Purpose |
|-----------|------|---------|
| Zustand Store | `src/hooks/useDocumentOrganization.js` | Dashboard selection |
| Dexie Database | `src/utils/smartSync.js` | SmartSync with 4 tables |
| Storage Wrapper | `src/utils/storage/storageWrapper.js` | Main storage interface |
| Test Setup | `src/test/setup.js` | Test mocks |

---

### G. PROOF OF CONCEPT

Phase 1 Success Criteria:
- [ ] Convert one utility to `.ts` (recommend: `src/utils/sanitization.js`)
- [ ] Convert one component to `.tsx` (recommend: `src/components/blocks/HeadingBlock.jsx`)
- [ ] Write one passing test
- [ ] Push → Vercel builds successfully

---

## Execution Order (Push-Based Workflow)

### Step 1: Complete Phase 0
```bash
git add -A
git commit -m "refactor(cleanup): remove 33 unused files + 2 dead imports"
git push
```
**Wait for Vercel** → Verify build passes

### Step 2: Add Foundation Dependencies
1. Edit `package.json` - add dependencies and scripts (see B1)
2. Create `tsconfig.json` (see B2)
```bash
git add -A
git commit -m "feat(phase-1): add TypeScript, TanStack Query, Vitest dependencies"
git push
```
**Wait for Vercel** → Verify build passes

### Step 3: Proof of Concept
1. Rename `src/utils/sanitization.js` → `src/utils/sanitization.ts`
2. Add types (or use `any` temporarily to verify build works)
```bash
git add -A
git commit -m "feat(phase-1): convert sanitization.js to TypeScript"
git push
```
**Wait for Vercel** → Verify build passes

### Step 4: Add TanStack Query Provider
1. Update `src/App.jsx` to wrap with `QueryClientProvider`
```bash
git add -A
git commit -m "feat(phase-1): add TanStack Query provider"
git push
```
**Wait for Vercel** → Verify build passes, check DevTools visible

### Step 5: Component Conversion
1. Rename `src/components/blocks/HeadingBlock.jsx` → `.tsx`
2. Add prop types
```bash
git add -A
git commit -m "feat(phase-1): convert HeadingBlock to TypeScript"
git push
```
**Wait for Vercel** → Verify build passes

### Step 6: Boundary Tools (Optional - Can Be Later)
1. Create `.dependency-cruiser.js`
2. Update `eslint.config.js` with boundaries plugin
```bash
git add -A
git commit -m "feat(phase-1): add dependency cruiser and eslint boundaries"
git push
```

---

## Current State Summary

| Category | Status | Notes |
|----------|--------|-------|
| Phase 0 Cleanup | Almost Complete | Files deleted, needs commit + push |
| TypeScript | Not in package.json | Add to devDependencies |
| TanStack Query | Not in package.json | Add to dependencies |
| Vitest | Config exists | Add vitest to devDependencies |
| Boundary Tools | Not in package.json | Add later after base setup works |
| Existing Zustand | Working | Will continue to work |
| Existing Dexie | Working | Will continue to work |

---

## Risk Mitigation

| Risk | Mitigation | Vercel Behavior |
|------|------------|-----------------|
| TypeScript breaks build | `allowJs: true` lets .jsx coexist | Build will show TS errors in log |
| Missing dependency | All versions tested compatible | npm install will fail with clear error |
| Import paths break | `paths` in tsconfig matches existing `@/` | Build error will show which import failed |
| Zustand/Dexie conflict | They're independent | No conflict expected |

---

## If Vercel Build Fails

1. **Check build log** for exact error message
2. **Common fixes:**
   - Missing dependency → Add to package.json
   - Type error → Fix the TypeScript error or use `any` temporarily
   - Import error → Check file paths
3. **Rollback option:** `git revert HEAD` then push

---

## Critical Compatibility Notes

### Why These Specific Versions

| Reason | Details |
|--------|---------|
| React 19 Native | All packages built for React 19.1.0 |
| ESLint 9 Ready | eslint-plugin-boundaries v5.0.0 uses flat config |
| Modern TypeScript | v5.6 with full Node 20 support |
| No Peer Conflicts | All versions tested together |

### Testing Stack Compatibility
```
vitest@^1.6.0
  ├─ jsdom@^24.0.0 ✓
  ├─ @testing-library/react@^14.2.0 ✓
  ├─ @testing-library/jest-dom@^6.4.0 ✓
  └─ React 19.1.0 ✓
```

### State Management
- `zustand@^4.5.0` (already in package.json) → **client state**
- `@tanstack/react-query@^5.52.0` (adding) → **server state**
- These work together without conflict

---

## Code References

- `vite.config.js:1-38` - Current Vite configuration
- `eslint.config.js:1-33` - Current ESLint flat config
- `vitest.config.js:1-29` - Existing Vitest config
- `src/test/setup.js:1-120` - Test setup with mocks
- `src/hooks/useDocumentOrganization.js:1-122` - Zustand store
- `src/utils/smartSync.js:48-61` - Dexie database schema
- `package.json:6-11` - Current scripts
- `package.json:12-68` - Current dependencies

---

## Related Research

- [Architecture Assessment](./2025-12-29-document-page-architecture-assessment.md)
- [Phase 0 Cleanup Plan](../plans/document-page-refactor/phase-0-cleanup.md)
- [Phase 1 Foundation Plan](../plans/document-page-refactor/phase-1-foundation.md)
- [Master Vision](../plans/document-page-refactor/00-MASTER-VISION.md)
- [Package Compatibility Research](../../../terminal.md) - Version matrix source

---

*Phase 1 of Document Page Architecture Refactor*
