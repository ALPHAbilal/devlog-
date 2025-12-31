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

**The QueryClient is the "Brain"** - A single instance that manages ALL caching, refetching, and data sync across the entire application.

1. **ONE QueryClient instance** - Created once, shared via QueryClientProvider
2. **Query keys must be arrays** - `['documents', id]` not `'documents-' + id`
3. **Create key factories** - Centralized, type-safe key generation (see `src/api/queryKeys.ts`)
4. **Set sensible staleTime** - Don't over-fetch (5 min default for documents)
5. **gcTime > staleTime** - Garbage collection must exceed stale time
6. **DevTools in dev only** - Don't ship to production
7. **Invalidate after mutations** - Always call `queryClient.invalidateQueries()` after writes

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
2. **Install TanStack Query v5 - Set up the "Brain"**
   - Create centralized QueryClient instance (`src/api/queryClient.ts`)
   - Create query key factories (`src/api/queryKeys.ts`)
   - Wrap app with QueryClientProvider
   - Add DevTools for development
3. Install Vitest + React Testing Library
4. Install Dependency Cruiser + eslint-plugin-boundaries
5. Convert one file to .tsx as proof of concept
6. Convert existing test file to TypeScript (tests already exist and use Vitest!)

---

## Key Dependencies to Add

> **Note**: No local `npm install` needed. This project uses **Vercel CI/CD** - edit files, commit, push, and Vercel installs dependencies automatically during build.

> **EXISTING SETUP DISCOVERED**: The codebase already has:
> - `@types/react` and `@types/react-dom` in devDependencies (TypeScript types for React)
> - Tests at `src/utils/__tests__/sanitization.test.js` that already import from `vitest` (partial Vitest setup exists)
> - This means less work is needed - we're extending an existing partial setup, not starting from scratch

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
  },
  "dependencies": {
    "@tanstack/react-query": "^5.52.0",
    "@tanstack/react-query-devtools": "^5.52.0"
  }
}
```

**Critical Version Notes:**
- `eslint-plugin-boundaries` **MUST** be `^5.0.0` (not v4.x) - ESLint 9.25.0 requires v5+ for flat config support
- `jsdom` is required for Vitest DOM testing
- `@types/react` and `@types/react-dom` already exist - no need to add them

---

## High-Level Steps

1. **TypeScript Setup**
   - Add tsconfig.json with strict mode
   - Configure Vite for TypeScript
   - Add path aliases

2. **TanStack Query Setup** (The "Brain")
   - Install packages: `@tanstack/react-query`, `@tanstack/react-query-devtools`
   - Create `src/api/queryClient.ts` - Single centralized QueryClient instance
   - Create `src/api/queryKeys.ts` - Type-safe query key factories
   - Update `src/main.jsx` - Wrap entire app with QueryClientProvider (enables globally)
   - Add DevTools component (development only)

3. **Vitest Setup**
   - Install and configure
   - Add test script to package.json
   - Create first test file

4. **Boundary Tools Setup**
   - Install Dependency Cruiser
   - Create .dependency-cruiser.js config
   - Add eslint-plugin-boundaries v5 rules (see eslint.config.js modifications below)

5. **Proof of Concept**
   - Convert `src/utils/sanitization.js` → `src/utils/sanitization.ts` (pure functions, no internal dependencies, has test coverage)
   - Convert `src/components/LogoMinimal.jsx` → `src/components/LogoMinimal.tsx` (simple presentational, one optional prop, no state, no hooks)
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
- [ ] TanStack Query DevTools visible in browser (bottom-right corner)
- [ ] DevTools shows QueryClient with correct default options:
  - staleTime: 300000 (5 minutes)
  - gcTime: 600000 (10 minutes)
  - networkMode: 'offlineFirst'
- [ ] Query key factories (`src/api/queryKeys.ts`) properly typed (no TypeScript errors)
- [ ] QueryClientProvider wraps entire app (verify in React DevTools)

---

## Estimated Duration

~1 week

---

## Depends On

- Phase 0 complete (dead code removed)

---

## Config Files

### tsconfig.json

TypeScript configuration with strict mode and path aliases:

```json
{
  "compilerOptions": {
    // Strict mode - no compromises
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,

    // Module settings (match Vite)
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // JSX for React 19
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    // Path aliases (match vite.config.js if aliases added)
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/contexts/*": ["src/contexts/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"]
    },

    // Output settings (Vite handles actual compilation)
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "vitest.config.ts", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Key decisions:**
- `noEmit: true` - Vite handles compilation, TypeScript only type-checks
- `verbatimModuleSyntax: true` - Enforces explicit `type` imports
- `noUncheckedIndexedAccess: true` - Catches array/object index access errors
- Path aliases match common project structure for clean imports

---

### vitest.config.ts

Test runner configuration:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom',

    // Setup files (run before each test file)
    setupFiles: ['./src/test/setup.ts'],

    // Global test APIs (describe, it, expect)
    globals: true,

    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist'],

    // Coverage (optional, enable when needed)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/types/**'
      ]
    },

    // Performance
    pool: 'forks',
    isolate: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000
  },

  // Path aliases (must match tsconfig.json)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types')
    }
  }
})
```

**Key decisions:**
- `globals: true` - Allows `describe`, `it`, `expect` without imports
- `environment: 'jsdom'` - DOM testing for React components
- `pool: 'forks'` - Better isolation than threads for React tests
- Path aliases duplicate tsconfig for Vitest resolution

---

### vite.config.js Modifications

**IMPORTANT**: The current `vite.config.js` has NO path aliases configured. Add the `resolve.alias` section to enable `@/` imports in the dev server:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      sourcemaps: {
        assets: ['./dist/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },

      release: {
        name: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        deploy: {
          env: process.env.VERCEL_ENV || 'development',
        },
      },
    }),
  ],

  build: {
    sourcemap: true,
    cssMinify: 'esbuild',
    target: 'es2022',
  },

  server: {
    host: '0.0.0.0',
    port: 5173
  },

  // ADD THIS SECTION - Path aliases (must match tsconfig.json)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types')
    }
  }
})
```

**Why this is needed:**
- Without this, `@/` imports will fail in the dev server even though TypeScript and Vitest know about them
- All three configs (tsconfig.json, vitest.config.ts, vite.config.js) must have matching aliases

---

### src/test/setup.ts

Test setup and helpers:

```typescript
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia (required for many UI libraries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver (used by virtualization libraries)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

// Suppress console errors in tests (optional - comment out for debugging)
// vi.spyOn(console, 'error').mockImplementation(() => {})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock })
```

**Key decisions:**
- `@testing-library/jest-dom/vitest` - Proper Vitest integration (not `/extend-expect`)
- Mocks for `matchMedia`, `ResizeObserver`, `IntersectionObserver` - Required for UI component testing
- Storage mocks - Prevents test pollution from localStorage usage

---

### src/utils/__tests__/sanitization.test.ts

> **NOTE**: Tests already exist at `src/utils/__tests__/sanitization.test.js` and already use Vitest imports! This means Vitest was partially configured previously. We just need to:
> 1. Rename the file from `.js` to `.ts`
> 2. Add type annotations as needed
> 3. Update imports to use `@/utils/sanitization` path alias

Converted test file demonstrating Vitest + TypeScript integration. Tests the converted `sanitization.ts` utility:

```typescript
import { describe, it, expect } from 'vitest'
import {
  sanitizeInput,
  sanitizeTitle,
  sanitizeTags
} from '@/utils/sanitization'

describe('sanitizeInput', () => {
  it('should return empty string for null/undefined input', () => {
    // Arrange
    const nullInput = null as unknown as string
    const undefinedInput = undefined as unknown as string

    // Act
    const nullResult = sanitizeInput(nullInput)
    const undefinedResult = sanitizeInput(undefinedInput)

    // Assert
    expect(nullResult).toBe('')
    expect(undefinedResult).toBe('')
  })

  it('should remove script tags from input', () => {
    // Arrange
    const maliciousInput = '<script>alert("xss")</script>Hello'

    // Act
    const result = sanitizeInput(maliciousInput, 'text')

    // Assert
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('Hello')
  })

  it('should remove javascript: URLs from input', () => {
    // Arrange
    const maliciousInput = '<a href="javascript:alert(1)">Click me</a>'

    // Act
    const result = sanitizeInput(maliciousInput, 'markdown')

    // Assert
    expect(result).not.toContain('javascript:')
  })
})

describe('sanitizeTitle', () => {
  it('should return empty string for empty input', () => {
    // Arrange
    const emptyTitle = ''

    // Act
    const result = sanitizeTitle(emptyTitle)

    // Assert
    expect(result).toBe('')
  })

  it('should strip all HTML from title and trim whitespace', () => {
    // Arrange
    const htmlTitle = '  <b>My Document</b>  '

    // Act
    const result = sanitizeTitle(htmlTitle)

    // Assert
    expect(result).toBe('My Document')
    expect(result).not.toContain('<b>')
    expect(result).not.toContain('</b>')
  })
})

describe('sanitizeTags', () => {
  it('should return empty array for non-array input', () => {
    // Arrange
    const notAnArray = 'single-tag' as unknown as string[]

    // Act
    const result = sanitizeTags(notAnArray)

    // Assert
    expect(result).toEqual([])
  })

  it('should filter out empty tags and tags over 50 characters', () => {
    // Arrange
    const tags = [
      'valid-tag',
      '',
      '   ',
      'a'.repeat(51), // Too long
      'another-valid'
    ]

    // Act
    const result = sanitizeTags(tags)

    // Assert
    expect(result).toHaveLength(2)
    expect(result).toContain('valid-tag')
    expect(result).toContain('another-valid')
  })

  it('should sanitize HTML from tags', () => {
    // Arrange
    const tags = ['<script>bad</script>tag', 'clean-tag']

    // Act
    const result = sanitizeTags(tags)

    // Assert
    expect(result[0]).not.toContain('<script>')
    expect(result[1]).toBe('clean-tag')
  })
})
```

**Key patterns demonstrated:**
- **Arrange-Act-Assert** structure in every test
- **One assertion focus** per test (related assertions grouped)
- **Descriptive test names** that explain expected behavior
- **Edge case coverage**: null, undefined, empty, malicious inputs
- **Type casting** for testing invalid inputs (`as unknown as Type`)

---

### .dependency-cruiser.js

Import boundary rules:

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // No circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    },

    // Components cannot import from pages
    {
      name: 'no-components-to-pages',
      severity: 'error',
      comment: 'Components should be reusable, not depend on specific pages',
      from: {
        path: '^src/components/'
      },
      to: {
        path: '^src/pages/'
      }
    },

    // Hooks cannot import components
    {
      name: 'no-hooks-to-components',
      severity: 'error',
      comment: 'Hooks should be pure logic, not import UI components',
      from: {
        path: '^src/hooks/'
      },
      to: {
        path: '^src/components/'
      }
    },

    // Utils cannot import anything except other utils and types
    {
      name: 'utils-isolation',
      severity: 'error',
      comment: 'Utils should be pure functions with no dependencies on app code',
      from: {
        path: '^src/utils/'
      },
      to: {
        path: '^src/(components|pages|hooks|contexts|services)/'
      }
    },

    // Services can only import utils and types
    {
      name: 'services-isolation',
      severity: 'error',
      comment: 'Services should not depend on React components or hooks',
      from: {
        path: '^src/services/'
      },
      to: {
        path: '^src/(components|pages|hooks|contexts)/'
      }
    },

    // No orphan files (files not imported by anything)
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'File is not imported by any other file - may be dead code',
      from: {
        orphan: true,
        pathNot: [
          '\\.test\\.(ts|tsx|js|jsx)$',
          '\\.spec\\.(ts|tsx|js|jsx)$',
          '^src/main\\.(ts|tsx|js|jsx)$',
          '^src/test/',
          'vite\\.config\\.',
          'vitest\\.config\\.',
          '\\.d\\.ts$'
        ]
      },
      to: {}
    },

    // No dev dependencies in production code
    {
      name: 'no-dev-deps-in-src',
      severity: 'error',
      comment: 'Production code should not import devDependencies',
      from: {
        path: '^src/',
        pathNot: [
          '\\.test\\.',
          '\\.spec\\.',
          '^src/test/'
        ]
      },
      to: {
        dependencyTypes: ['npm-dev']
      }
    },

    // Blocks cannot import other blocks directly
    {
      name: 'no-block-cross-imports',
      severity: 'warn',
      comment: 'Block components should not import each other directly',
      from: {
        path: '^src/components/blocks/[^/]+$'
      },
      to: {
        path: '^src/components/blocks/[^/]+$',
        pathNot: [
          // Allow shared utilities within blocks folder
          '^src/components/blocks/(index|shared|utils)'
        ]
      }
    }
  ],

  options: {
    doNotFollow: {
      path: 'node_modules'
    },

    tsPreCompilationDeps: true,

    tsConfig: {
      fileName: './tsconfig.json'
    },

    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },

    reporterOptions: {
      dot: {
        theme: {
          graph: { splines: 'ortho' }
        }
      }
    }
  }
}
```

**Key decisions:**
- **Layered architecture**: utils → services → hooks → components → pages
- **No circular deps**: Caught at build time
- **Orphan detection**: Warns about potentially dead code
- **Block isolation**: Prevents spaghetti between block components
- **Dev dependency guard**: Ensures test utilities don't leak into production

---

### eslint.config.js Modifications

Add eslint-plugin-boundaries v5 to enforce layer separation at lint time (instant IDE feedback):

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      // Define architectural layers
      'boundaries/elements': [
        { type: 'utils', mode: 'full', pattern: 'src/utils/**/*' },
        { type: 'services', mode: 'full', pattern: 'src/services/**/*' },
        { type: 'hooks', mode: 'full', pattern: 'src/hooks/**/*' },
        { type: 'contexts', mode: 'full', pattern: 'src/contexts/**/*' },
        { type: 'components', mode: 'full', pattern: 'src/components/**/*' },
        { type: 'pages', mode: 'full', pattern: 'src/pages/**/*' },
      ],
      // Only analyze src files
      'boundaries/include': ['src/**/*'],
      // Analyze import statements
      'boundaries/dependency-nodes': ['import', 'dynamic-import'],
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Boundary enforcement rules
      'boundaries/element-types': [
        'error',
        {
          // Whitelist approach: disallow all, then allow specific
          default: 'disallow',
          rules: [
            // Utils: can only import other utils (NO components, pages, hooks, contexts, services)
            {
              from: ['utils'],
              allow: ['utils'],
              message: 'Utils must be pure - cannot import from ${target.type}',
            },
            // Services: can only import utils (NO components, pages, hooks, contexts)
            {
              from: ['services'],
              allow: ['utils', 'services'],
              message: 'Services cannot import from ${target.type}',
            },
            // Hooks: can import utils, services, contexts (NO components, pages)
            {
              from: ['hooks'],
              allow: ['utils', 'services', 'hooks', 'contexts'],
              message: 'Hooks cannot import components - use composition instead',
            },
            // Contexts: can import utils, services, hooks (NO components, pages)
            {
              from: ['contexts'],
              allow: ['utils', 'services', 'hooks', 'contexts'],
              message: 'Contexts cannot import from ${target.type}',
            },
            // Components: can import utils, services, hooks, contexts, other components (NO pages)
            {
              from: ['components'],
              allow: ['utils', 'services', 'hooks', 'contexts', 'components'],
              message: 'Components cannot import from pages - pages compose components, not vice versa',
            },
            // Pages: can import anything (top of hierarchy)
            {
              from: ['pages'],
              allow: ['utils', 'services', 'hooks', 'contexts', 'components', 'pages'],
            },
          ],
        },
      ],
    },
  },
]
```

**Key boundary rules enforced:**
- **utils** → Can only import other utils (pure functions, no app dependencies)
- **services** → Can import utils, services (business logic layer)
- **hooks** → Can import utils, services, contexts (NO components)
- **contexts** → Can import utils, services, hooks (state management layer)
- **components** → Can import utils, services, hooks, contexts, components (NO pages)
- **pages** → Can import anything (composition root)

**Why this matters:**
- Violations show immediately in IDE (red squiggles)
- Prevents accidental circular dependencies
- Enforces one-way data flow: utils → services → hooks → components → pages
- Makes refactoring safer - clear boundaries

---

### src/api/queryClient.ts

The "Brain" of TanStack Query - one instance that manages all caching, refetching, and data sync:

```typescript
import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient - The centralized "brain" of all data fetching
 *
 * This single instance manages:
 * - Query caching across all components
 * - Background refetching coordination
 * - Garbage collection of stale data
 * - Retry logic for failed requests
 * - Data synchronization
 *
 * IMPORTANT: Create ONE instance, share via QueryClientProvider
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: 1000 * 60 * 5,     // 5 minutes - matches our document save debounce philosophy
      gcTime: 1000 * 60 * 10,       // 10 minutes - keep in cache after becoming inactive

      // Refetch behavior
      refetchOnWindowFocus: true,   // Sync when user returns to tab
      refetchOnReconnect: true,     // Sync when network reconnects
      refetchOnMount: true,         // Sync when component mounts

      // Retry logic (exponential backoff)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode
      networkMode: 'offlineFirst',  // Works with our IndexedDB fallback
    },
    mutations: {
      // Mutations retry once (they're already retried by storage layer)
      retry: 1,
      retryDelay: 1000,

      // Network mode for mutations
      networkMode: 'offlineFirst',
    },
  },
})

// Export for use in non-React contexts (services, utilities)
export default queryClient
```

**Key decisions:**
- `staleTime: 5 minutes` - Matches our debounced save philosophy; prevents over-fetching
- `gcTime: 10 minutes` - Keeps data cached 2x longer than stale time for better UX
- `networkMode: 'offlineFirst'` - Works with existing IndexedDB fallback pattern
- `retry: 3 with exponential backoff` - Resilient to temporary network issues
- Single export for both React (QueryClientProvider) and non-React (services) usage

---

### src/api/queryKeys.ts

Type-safe query key factories for consistent cache management:

```typescript
/**
 * Query Key Factories
 *
 * Centralized, type-safe key generation for all queries.
 * Keys are hierarchical arrays enabling granular invalidation.
 *
 * Pattern: entity.scope.detail
 * Example: ['documents', 'list', { folderId: '123' }]
 */

// Document queries
export const documentKeys = {
  // All document-related queries
  all: ['documents'] as const,

  // Document lists (can be filtered)
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: { folderId?: string; search?: string }) =>
    [...documentKeys.lists(), filters] as const,

  // Single document details
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,

  // Document with blocks (for DocumentPage)
  withBlocks: (id: string) => [...documentKeys.detail(id), 'blocks'] as const,
}

// Block queries
export const blockKeys = {
  all: ['blocks'] as const,
  byDocument: (documentId: string) => [...blockKeys.all, 'document', documentId] as const,
  detail: (blockId: string) => [...blockKeys.all, 'detail', blockId] as const,
}

// Folder queries
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  tree: () => [...folderKeys.all, 'tree'] as const,
  detail: (id: string) => [...folderKeys.all, 'detail', id] as const,
}

// User queries
export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  settings: () => [...userKeys.all, 'settings'] as const,
}

/**
 * Usage examples:
 *
 * // Fetch single document
 * useQuery({ queryKey: documentKeys.detail(docId), queryFn: ... })
 *
 * // Invalidate all documents after mutation
 * queryClient.invalidateQueries({ queryKey: documentKeys.all })
 *
 * // Invalidate specific document
 * queryClient.invalidateQueries({ queryKey: documentKeys.detail(docId) })
 *
 * // Invalidate document list but keep individual document caches
 * queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
 */
```

**Key decisions:**
- Hierarchical keys enable granular invalidation (invalidate all vs one)
- `as const` provides TypeScript inference
- Separate factories per entity (documents, blocks, folders, user)
- Filter objects in list keys for different query variations

---

### Package.json Scripts to Add

Add these scripts to `package.json` under the `"scripts"` section:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "deps:check": "depcruise src --config"
  }
}
```

**Script purposes:**
- `typecheck` - TypeScript validation without emitting files (uses `tsconfig.json`)
- `test` - Vitest in watch mode (development)
- `test:run` - Single test run (CI/pre-commit)
- `deps:check` - Validate import boundaries with Dependency Cruiser

---

### File Modifications Summary

| File | What It Does |
|------|--------------|
| `src/main.jsx` | Wrap the entire app with `QueryClientProvider` so every component can use TanStack Query hooks |
| `src/api/queryClient.ts` | Create the single QueryClient instance (the "brain") with default options |
| `src/api/queryKeys.ts` | Define type-safe query key factories for cache management |
| `vite.config.js` | Add path aliases (`@/`) so imports work in dev server |
| `vitest.config.ts` | Add path aliases (`@/`) so imports work in tests |
| `src/utils/__tests__/sanitization.test.js` → `.ts` | Convert existing test file to TypeScript |

This enables **TanStack Query globally + DevTools in development**.

---

### src/main.jsx Modifications

Update entry point to wrap entire app with QueryClientProvider:

```typescript
import "./instrument"; // Import Sentry first for early initialization
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './api/queryClient'
import './index.css'
import './styles/hero-knowledge-constellation.css'
import App from './App.jsx'
import { getAnalytics } from './services/analytics/AnalyticsService'

// ... analytics initialization (unchanged) ...

const container = document.getElementById('root');
const root = createRoot(container, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <StrictMode>
    {/* QueryClientProvider at root - enables TanStack Query for ALL components */}
    <QueryClientProvider client={queryClient}>
      <App />
      {/* DevTools only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  </StrictMode>,
)
```

**Why main.jsx instead of App.jsx?**
- Wrapping at `main.jsx` ensures QueryClient is available before ANY component renders
- DevTools are siblings to App, not children - cleaner separation
- StrictMode wraps everything including QueryClientProvider - proper React 19 integration

---

### App.jsx Changes (Minimal)

App.jsx requires NO changes for QueryClientProvider - it's handled in main.jsx.

The existing provider hierarchy in App.jsx remains unchanged:
```
ErrorBoundary → BrowserRouter → AuthProvider → SettingsProvider → ...
```

All components inside App.jsx automatically have access to TanStack Query hooks because QueryClientProvider wraps `<App />` in main.jsx.

---

## Proof of Concept Files

### Utility PoC: `src/utils/sanitization.js` → `src/utils/sanitization.ts`

**Why this file:**
- **Pure functions**: All exports (`sanitizeInput`, `sanitizeTitle`, `sanitizeTags`, `sanitizeBlock`, `sanitizeDocument`, `sanitizeSearchQuery`, `createSafeElement`, `sanitizeURL`) are pure functions with predictable inputs/outputs
- **No internal dependencies**: Only imports `isomorphic-dompurify` (external npm package) - no imports from components, hooks, contexts, or services
- **Existing test coverage**: Tests exist at `src/utils/__tests__/sanitization.test.js` - can verify TypeScript conversion doesn't break functionality
- **Clear type signatures**: Functions have JSDoc comments describing parameters and return types - easy to convert to TypeScript types

**Conversion approach:**
1. Rename file to `.ts`
2. Add explicit type annotations to function parameters and return types
3. Create types for `SanitizeConfig`, `Block`, `Document` based on existing JSDoc
4. Run `npm run typecheck` to verify
5. Run existing tests to ensure behavior unchanged

**Example type additions:**
```typescript
type SanitizeType = 'text' | 'markdown' | 'code' | 'strict';

interface SanitizeConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOW_DATA_ATTR: boolean;
  // ... other DOMPurify options
}

export function sanitizeInput(input: string, type: SanitizeType = 'text'): string {
  // ... existing implementation
}
```

---

### Component PoC: `src/components/LogoMinimal.jsx` → `src/components/LogoMinimal.tsx`

**Why this file:**
- **Simple presentational**: Renders SVG with no business logic
- **One optional prop**: `size` with default value 32 - minimal typing required
- **No state**: No `useState` calls
- **No hooks**: No `useEffect`, `useContext`, or custom hooks
- **No imports**: No dependencies on other project files
- **Lowest risk**: If TypeScript conversion breaks something, it's trivially fixable

**Conversion approach:**
1. Rename file to `.tsx`
2. Add prop interface
3. Add return type annotation
4. Verify with `npm run typecheck`

**Target TypeScript code:**
```typescript
interface LogoMinimalProps {
  size?: number;
}

export default function LogoMinimal({ size = 32 }: LogoMinimalProps): JSX.Element {
  const scale = size / 32;

  return (
    // ... existing JSX unchanged
  );
}

// Also type the other exports
interface LogoIconProps {
  size?: number;
}

export function LogoIcon({ size = 32 }: LogoIconProps): JSX.Element {
  // ...
}

interface LogoWithTextProps {
  size?: number;
}

export function LogoWithText({ size = 32 }: LogoWithTextProps): JSX.Element {
  // ...
}

interface LogoAnimatedProps {
  size?: number;
}

export function LogoAnimated({ size = 48 }: LogoAnimatedProps): JSX.Element {
  // ...
}
```

---

## Step-by-Step Execution Order

Execute these steps in exact sequence. Each step depends on the previous one completing successfully.

### 1. Edit package.json with Dependencies

**File:** `package.json`

Add all dependencies to the existing `dependencies` and `devDependencies` sections, plus add the new scripts:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "deps:check": "depcruise src --config"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@types/node": "^20.14.0",
    "vitest": "^1.6.0",
    "@testing-library/react": "^14.2.0",
    "@testing-library/jest-dom": "^6.4.0",
    "jsdom": "^24.0.0",
    "dependency-cruiser": "^16.3.0",
    "eslint-plugin-boundaries": "^5.0.0"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.52.0",
    "@tanstack/react-query-devtools": "^5.52.0"
  }
}
```

**Verification:** File saved, no JSON syntax errors.

---

### 2. Create tsconfig.json

**File:** `tsconfig.json` (new file at project root)

Create the TypeScript configuration file with strict mode enabled. Use the exact content from the "tsconfig.json" section above.

**Verification:** File exists at project root.

---

### 3. Create vitest.config.ts and Test Setup

**Files:**
- `vitest.config.ts` (new file at project root)
- `src/test/setup.ts` (new file)

Create both files using the exact content from their respective sections above.

**Verification:** Both files exist.

---

### 3a. Update vite.config.js with Path Aliases

**File:** `vite.config.js`

**IMPORTANT**: Add path aliases to match tsconfig.json. Without this, `@/` imports will fail in the dev server.

Add the following to the existing vite.config.js:
1. Add `import { resolve } from 'path'` at the top
2. Add the `resolve.alias` section (see "vite.config.js Modifications" section above)

**Verification:** Dev server starts without import errors.

---

### 4. Create queryClient.ts

**File:** `src/api/queryClient.ts` (new file)

Create the directory `src/api/` if it doesn't exist, then create the QueryClient file using the exact content from the "src/api/queryClient.ts" section above.

**Verification:** File exists at `src/api/queryClient.ts`.

---

### 5. Modify main.jsx

**File:** `src/main.jsx`

Add the TanStack Query imports and wrap the app with `QueryClientProvider`. Use the exact modifications from the "src/main.jsx Modifications" section above.

**Verification:** File contains `QueryClientProvider` wrapping `<App />`.

---

### 6. Convert sanitization.js to .ts

**Files:**
- Delete: `src/utils/sanitization.js`
- Create: `src/utils/sanitization.ts`

Convert the file by:
1. Renaming `.js` to `.ts`
2. Adding explicit type annotations to all function parameters and return types
3. Creating type interfaces for `SanitizeType`, `SanitizeConfig`, `Block`, `Document`

**Verification:** `npm run typecheck` passes (may show errors in other files, but `sanitization.ts` should be clean).

---

### 7. Convert Existing Test File to TypeScript

**File:** `src/utils/__tests__/sanitization.test.js` → `src/utils/__tests__/sanitization.test.ts`

> **NOTE**: Tests already exist and already use Vitest imports! We're converting, not creating.

Convert the existing test file by:
1. Renaming `.js` to `.ts`
2. Updating imports to use path aliases: `import { ... } from '@/utils/sanitization'`
3. Adding type annotations where needed (e.g., `as unknown as string` for null/undefined test cases)

**Verification:** `npm run test:run` passes.

---

### 8. Convert LogoMinimal.jsx to .tsx

**Files:**
- Delete: `src/components/LogoMinimal.jsx`
- Create: `src/components/LogoMinimal.tsx`

Convert the file by:
1. Renaming `.jsx` to `.tsx`
2. Adding prop interfaces for all exported components (`LogoMinimalProps`, `LogoIconProps`, `LogoWithTextProps`, `LogoAnimatedProps`)
3. Adding return type annotations (`: JSX.Element`)

Use the target TypeScript code from the "Component PoC" section above.

**Verification:** `npm run typecheck` passes.

---

### 9. Create .dependency-cruiser.js

**File:** `.dependency-cruiser.js` (new file at project root)

Create the Dependency Cruiser configuration file using the exact content from the ".dependency-cruiser.js" section above.

**Verification:** File exists at project root.

---

### 10. Update eslint.config.js

**File:** `eslint.config.js`

Update the ESLint configuration to add `eslint-plugin-boundaries` v5 rules. Use the exact content from the "eslint.config.js Modifications" section above.

**Verification:** `npm run lint` passes (may show boundary warnings, but no config errors).

---

### 11. Run All Verification Commands

Execute these commands in sequence:

```bash
# 1. TypeScript validation
npm run typecheck

# 2. Run tests
npm run test:run

# 3. Check import boundaries
npm run deps:check

# 4. Run linter
npm run lint

# 5. Build the project
npm run build
```

**Verification:** All commands pass with exit code 0.

---

### 12. Commit and Push to Trigger Vercel Build

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: Phase 1 Foundation - TypeScript + TanStack Query + Vitest + Boundaries

- Add TypeScript with strict mode (tsconfig.json)
- Add path aliases to vite.config.js, vitest.config.ts
- Install and configure TanStack Query v5 (queryClient.ts, queryKeys.ts)
- Set up Vitest with React Testing Library (vitest.config.ts, setup.ts)
- Add Dependency Cruiser and eslint-plugin-boundaries v5
- Convert sanitization.js to TypeScript as PoC
- Convert existing sanitization.test.js to TypeScript
- Convert LogoMinimal.jsx to TypeScript as PoC
- Add npm scripts: typecheck, test, test:run, deps:check"

# Push to remote (triggers Vercel build)
git push
```

**Verification:**
- Vercel build succeeds (check Vercel dashboard)
- Dev server starts without errors (`npm run dev`)
- App functions normally in browser
- TanStack Query DevTools visible (bottom-right corner in dev)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 1 of Document Page Architecture Refactor*
