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

## ESLint Boundaries Configuration for FSD

This section provides the complete ESLint `eslint-plugin-boundaries` configuration for FSD enforcement. This complements the Dependency Cruiser configuration and provides real-time editor feedback.

### Current eslint.config.js Structure (BEFORE)

The existing `settings['boundaries/elements']` section (lines 27-35) needs to be replaced:

```javascript
// CURRENT (to be replaced)
'boundaries/elements': [
  { type: 'utils', mode: 'full', pattern: 'src/utils/**/*' },
  { type: 'services', mode: 'full', pattern: 'src/services/**/*' },
  { type: 'hooks', mode: 'full', pattern: 'src/hooks/**/*' },
  { type: 'contexts', mode: 'full', pattern: 'src/contexts/**/*' },
  { type: 'components', mode: 'full', pattern: 'src/components/**/*' },
  { type: 'pages', mode: 'full', pattern: 'src/pages/**/*' },
  { type: 'api', mode: 'full', pattern: 'src/api/**/*' },
],
```

### Updated FSD Layer Elements (AFTER)

Replace with these FSD-aligned layer definitions:

```javascript
// FSD Layer Elements - with capture groups for cross-slice isolation
'boundaries/elements': [
  // App layer (top) - no slices
  {
    type: 'app',
    mode: 'folder',
    pattern: 'src/app/**/*'
  },
  // Pages layer - with slice capture
  {
    type: 'pages',
    mode: 'folder',
    pattern: 'src/pages/*/**/*',
    capture: ['slice']
  },
  // Widgets layer - with slice capture
  {
    type: 'widgets',
    mode: 'folder',
    pattern: 'src/widgets/*/**/*',
    capture: ['slice']
  },
  // Features layer - with slice capture
  {
    type: 'features',
    mode: 'folder',
    pattern: 'src/features/*/**/*',
    capture: ['slice']
  },
  // Entities layer - with slice capture
  {
    type: 'entities',
    mode: 'folder',
    pattern: 'src/entities/*/**/*',
    capture: ['slice']
  },
  // Shared layer - split into segments
  {
    type: 'shared-ui',
    mode: 'folder',
    pattern: 'src/shared/ui/**/*'
  },
  {
    type: 'shared-lib',
    mode: 'folder',
    pattern: 'src/shared/lib/**/*'
  },
  {
    type: 'shared-api',
    mode: 'folder',
    pattern: 'src/shared/api/**/*'
  },
  {
    type: 'shared-hooks',
    mode: 'folder',
    pattern: 'src/shared/hooks/**/*'
  },
],
```

### Updated ESLint Rules (AFTER)

Replace the entire `boundaries/element-types` rule section (lines 51-100) with:

```javascript
rules: {
  ...js.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],

  // ============================================================
  // FSD LAYER HIERARCHY ENFORCEMENT
  // Rule 1: Layers can only import from layers BELOW
  // ============================================================
  'boundaries/element-types': [
    'error',
    {
      default: 'disallow',
      rules: [
        // App layer (top) - can import from all layers
        {
          from: ['app'],
          allow: ['app', 'pages', 'widgets', 'features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
        },
        // Pages layer - can import widgets, features, entities, shared
        {
          from: ['pages'],
          allow: ['widgets', 'features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
          message: 'Pages cannot import from app layer',
        },
        // Widgets layer - can import features, entities, shared
        {
          from: ['widgets'],
          allow: ['features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
          message: 'Widgets cannot import from pages or app layers',
        },
        // Features layer - can import entities, shared ONLY
        {
          from: ['features'],
          allow: ['entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
          message: 'Features can only import from entities and shared layers',
        },
        // Entities layer - can import shared ONLY
        {
          from: ['entities'],
          allow: ['shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
          message: 'Entities can only import from shared layer',
        },
        // Shared layers - can only import from other shared segments
        {
          from: ['shared-ui'],
          allow: ['shared-lib', 'shared-hooks'],
          message: 'shared/ui cannot import from layers above',
        },
        {
          from: ['shared-lib'],
          allow: ['shared-lib'],
          message: 'shared/lib can only import from itself (pure utilities)',
        },
        {
          from: ['shared-api'],
          allow: ['shared-lib'],
          message: 'shared/api can only import from shared/lib',
        },
        {
          from: ['shared-hooks'],
          allow: ['shared-lib', 'shared-api'],
          message: 'shared/hooks can only import from shared/lib and shared/api',
        },
      ],
    },
  ],

  // ============================================================
  // FSD CROSS-SLICE ISOLATION
  // Rule 2: Slices within same layer cannot import each other
  // Uses capture groups to detect same-slice vs cross-slice imports
  // ============================================================
  'boundaries/element-types': [
    'error',
    {
      default: 'disallow',
      rules: [
        // ... (layer hierarchy rules from above) ...

        // Cross-slice isolation for features
        {
          from: [['features', { slice: '${from.slice}' }]],
          disallow: [['features', { slice: '!${from.slice}' }]],
          message: 'Feature slice "${from.slice}" cannot import from other feature slices. Use shared layer or entities instead.',
        },
        // Cross-slice isolation for entities
        {
          from: [['entities', { slice: '${from.slice}' }]],
          disallow: [['entities', { slice: '!${from.slice}' }]],
          message: 'Entity slice "${from.slice}" cannot import from other entity slices. Extract to shared if needed.',
        },
        // Cross-slice isolation for widgets
        {
          from: [['widgets', { slice: '${from.slice}' }]],
          disallow: [['widgets', { slice: '!${from.slice}' }]],
          message: 'Widget slice "${from.slice}" cannot import from other widget slices.',
        },
        // Cross-slice isolation for pages
        {
          from: [['pages', { slice: '${from.slice}' }]],
          disallow: [['pages', { slice: '!${from.slice}' }]],
          message: 'Page slice "${from.slice}" cannot import from other page slices.',
        },
      ],
    },
  ],

  // ============================================================
  // FSD PUBLIC API ENFORCEMENT
  // Rule 3: Must import from index.ts (public API) only
  // ============================================================
  'boundaries/entry-point': [
    'error',
    {
      default: 'disallow',
      rules: [
        // External imports must use public API (index.ts)
        {
          target: ['features', 'entities', 'widgets', 'pages'],
          allow: 'index.(ts|tsx|js|jsx)',
          message: 'Must import from public API (index.ts), not internal path: ${dependency.internalPath}',
        },
        // Shared segments should also export via index
        {
          target: ['shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
          allow: '**/index.(ts|tsx|js|jsx)',
          message: 'Import from barrel file (index.ts) in shared layer',
        },
      ],
    },
  ],
},
```

### Complete Updated eslint.config.js

Here is the complete file to replace your existing `eslint.config.js`:

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
      // ============================================================
      // FSD LAYER DEFINITIONS
      // ============================================================
      'boundaries/elements': [
        // App layer (top) - no slices
        {
          type: 'app',
          mode: 'folder',
          pattern: 'src/app/**/*'
        },
        // Pages layer - with slice capture
        {
          type: 'pages',
          mode: 'folder',
          pattern: 'src/pages/*/**/*',
          capture: ['slice']
        },
        // Widgets layer - with slice capture
        {
          type: 'widgets',
          mode: 'folder',
          pattern: 'src/widgets/*/**/*',
          capture: ['slice']
        },
        // Features layer - with slice capture
        {
          type: 'features',
          mode: 'folder',
          pattern: 'src/features/*/**/*',
          capture: ['slice']
        },
        // Entities layer - with slice capture
        {
          type: 'entities',
          mode: 'folder',
          pattern: 'src/entities/*/**/*',
          capture: ['slice']
        },
        // Shared layer segments
        {
          type: 'shared-ui',
          mode: 'folder',
          pattern: 'src/shared/ui/**/*'
        },
        {
          type: 'shared-lib',
          mode: 'folder',
          pattern: 'src/shared/lib/**/*'
        },
        {
          type: 'shared-api',
          mode: 'folder',
          pattern: 'src/shared/api/**/*'
        },
        {
          type: 'shared-hooks',
          mode: 'folder',
          pattern: 'src/shared/hooks/**/*'
        },
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

      // ============================================================
      // FSD LAYER HIERARCHY ENFORCEMENT
      // Layers can ONLY import from layers BELOW in this hierarchy:
      //   app → pages → widgets → features → entities → shared
      // ============================================================
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // App layer (top) - can import from all layers
            {
              from: ['app'],
              allow: ['app', 'pages', 'widgets', 'features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
            },
            // Pages layer - can import widgets, features, entities, shared
            {
              from: ['pages'],
              allow: ['widgets', 'features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
              message: 'Pages cannot import from app layer',
            },
            // Widgets layer - can import features, entities, shared
            {
              from: ['widgets'],
              allow: ['features', 'entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
              message: 'Widgets cannot import from pages or app layers',
            },
            // Features layer - can import entities, shared ONLY
            {
              from: ['features'],
              allow: ['entities', 'shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
              message: 'Features can only import from entities and shared layers',
            },
            // Entities layer - can import shared ONLY
            {
              from: ['entities'],
              allow: ['shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
              message: 'Entities can only import from shared layer',
            },
            // Shared-ui - can import shared-lib, shared-hooks
            {
              from: ['shared-ui'],
              allow: ['shared-lib', 'shared-hooks'],
              message: 'shared/ui cannot import from layers above',
            },
            // Shared-lib - can only import from itself (pure utilities)
            {
              from: ['shared-lib'],
              allow: ['shared-lib'],
              message: 'shared/lib can only import from itself (pure utilities)',
            },
            // Shared-api - can import shared-lib
            {
              from: ['shared-api'],
              allow: ['shared-lib'],
              message: 'shared/api can only import from shared/lib',
            },
            // Shared-hooks - can import shared-lib, shared-api
            {
              from: ['shared-hooks'],
              allow: ['shared-lib', 'shared-api'],
              message: 'shared/hooks can only import from shared/lib and shared/api',
            },

            // ============================================================
            // CROSS-SLICE ISOLATION
            // Slices within same layer cannot import each other
            // ============================================================

            // Features: feature/auth cannot import from feature/dashboard
            {
              from: [['features', { slice: '${from.slice}' }]],
              disallow: [['features', { slice: '!${from.slice}' }]],
              message: 'Feature slice "${from.slice}" cannot import from other feature slices',
            },
            // Entities: entity/user cannot import from entity/document
            {
              from: [['entities', { slice: '${from.slice}' }]],
              disallow: [['entities', { slice: '!${from.slice}' }]],
              message: 'Entity slice "${from.slice}" cannot import from other entity slices',
            },
            // Widgets: widget/sidebar cannot import from widget/header
            {
              from: [['widgets', { slice: '${from.slice}' }]],
              disallow: [['widgets', { slice: '!${from.slice}' }]],
              message: 'Widget slice "${from.slice}" cannot import from other widget slices',
            },
            // Pages: page/dashboard cannot import from page/settings
            {
              from: [['pages', { slice: '${from.slice}' }]],
              disallow: [['pages', { slice: '!${from.slice}' }]],
              message: 'Page slice "${from.slice}" cannot import from other page slices',
            },
          ],
        },
      ],

      // ============================================================
      // PUBLIC API ENFORCEMENT
      // Must import from index.ts (barrel file) only
      // ============================================================
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            // External imports to sliced layers must use public API
            {
              target: ['features', 'entities', 'widgets', 'pages'],
              allow: 'index.(ts|tsx|js|jsx)',
              message: 'Import from public API (index.ts), not: ${dependency.internalPath}',
            },
            // Shared segments should use barrel files
            {
              target: ['shared-ui', 'shared-lib', 'shared-api', 'shared-hooks'],
              allow: '**/index.(ts|tsx|js|jsx)',
              message: 'Import from barrel file (index.ts) in shared layer',
            },
          ],
        },
      ],
    },
  },
]
```

### Configuration Summary Table

| Layer | Type | Can Import From | Cross-Slice |
|-------|------|-----------------|-------------|
| **app** | `app` | All layers | N/A (no slices) |
| **pages** | `pages` | widgets, features, entities, shared-* | ❌ Forbidden |
| **widgets** | `widgets` | features, entities, shared-* | ❌ Forbidden |
| **features** | `features` | entities, shared-* | ❌ Forbidden |
| **entities** | `entities` | shared-* only | ❌ Forbidden |
| **shared/ui** | `shared-ui` | shared-lib, shared-hooks | N/A |
| **shared/lib** | `shared-lib` | shared-lib only (self) | N/A |
| **shared/api** | `shared-api` | shared-lib | N/A |
| **shared/hooks** | `shared-hooks` | shared-lib, shared-api | N/A |

### Verification Commands

```bash
# Run ESLint to check FSD boundaries
npm run lint

# Debug element recognition (see which files map to which layers)
ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npm run lint

# Check specific rule violations
npm run lint -- --rule 'boundaries/element-types: error'
npm run lint -- --rule 'boundaries/entry-point: error'
```

### Examples of What Gets Caught

```typescript
// ❌ VIOLATION: Feature importing from another feature
// src/features/auth/hooks/useAuth.ts
import { useDashboard } from '@/features/dashboard';  // ERROR!

// ❌ VIOLATION: Entity importing from feature
// src/entities/user/model/types.ts
import { authConfig } from '@/features/auth';  // ERROR!

// ❌ VIOLATION: Importing internal path instead of public API
// src/pages/Dashboard/ui/DashboardPage.tsx
import { UserCard } from '@/entities/user/ui/UserCard';  // ERROR!

// ✅ CORRECT: Using public API
import { UserCard } from '@/entities/user';  // OK

// ✅ CORRECT: Feature importing from entity
import { User } from '@/entities/user';  // OK

// ✅ CORRECT: Everything importing from shared
import { cn } from '@/shared/lib';  // OK
import { Button } from '@/shared/ui';  // OK
```

---

## Dependency Cruiser Configuration

This is the complete `.dependency-cruiser.js` configuration that enforces FSD layer boundaries. This configuration should be applied **before** starting the file migration.

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ============================================================
    // CORE RULES (Preserved from original)
    // ============================================================

    // No circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true
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
          '^src/app/.*\\.css$',
          'vite\\.config\\.',
          'vitest\\.config\\.',
          '\\.d\\.ts$',
          // FSD barrel files
          'index\\.(ts|tsx|js|jsx)$'
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

    // ============================================================
    // FSD LAYER 1: SHARED (Bottom Layer - No Upward Dependencies)
    // Shared can ONLY import from itself (internal segments)
    // ============================================================
    {
      name: 'fsd-shared-not-to-entities',
      severity: 'error',
      comment: 'FSD: Shared layer cannot import from Entities layer',
      from: { path: '^src/shared/' },
      to: { path: '^src/entities/' }
    },
    {
      name: 'fsd-shared-not-to-features',
      severity: 'error',
      comment: 'FSD: Shared layer cannot import from Features layer',
      from: { path: '^src/shared/' },
      to: { path: '^src/features/' }
    },
    {
      name: 'fsd-shared-not-to-widgets',
      severity: 'error',
      comment: 'FSD: Shared layer cannot import from Widgets layer',
      from: { path: '^src/shared/' },
      to: { path: '^src/widgets/' }
    },
    {
      name: 'fsd-shared-not-to-pages',
      severity: 'error',
      comment: 'FSD: Shared layer cannot import from Pages layer',
      from: { path: '^src/shared/' },
      to: { path: '^src/pages/' }
    },
    {
      name: 'fsd-shared-not-to-app',
      severity: 'error',
      comment: 'FSD: Shared layer cannot import from App layer',
      from: { path: '^src/shared/' },
      to: { path: '^src/app/' }
    },

    // ============================================================
    // FSD LAYER 2: ENTITIES (Can only import from Shared)
    // ============================================================
    {
      name: 'fsd-entities-not-to-features',
      severity: 'error',
      comment: 'FSD: Entities layer cannot import from Features layer',
      from: { path: '^src/entities/' },
      to: { path: '^src/features/' }
    },
    {
      name: 'fsd-entities-not-to-widgets',
      severity: 'error',
      comment: 'FSD: Entities layer cannot import from Widgets layer',
      from: { path: '^src/entities/' },
      to: { path: '^src/widgets/' }
    },
    {
      name: 'fsd-entities-not-to-pages',
      severity: 'error',
      comment: 'FSD: Entities layer cannot import from Pages layer',
      from: { path: '^src/entities/' },
      to: { path: '^src/pages/' }
    },
    {
      name: 'fsd-entities-not-to-app',
      severity: 'error',
      comment: 'FSD: Entities layer cannot import from App layer',
      from: { path: '^src/entities/' },
      to: { path: '^src/app/' }
    },
    // Cross-slice isolation for entities
    {
      name: 'fsd-entities-cross-import',
      severity: 'error',
      comment: 'FSD: Entity slices cannot import from other entity slices (use @x notation for cross-references)',
      from: { path: '^src/entities/([^/]+)/' },
      to: {
        path: '^src/entities/([^/]+)/',
        pathNot: [
          // Allow imports from same slice
          '^src/entities/\\1/',
          // Allow @x cross-reference imports (legitimate cross-entity refs)
          '^src/entities/[^/]+/@x/'
        ]
      }
    },

    // ============================================================
    // FSD LAYER 3: FEATURES (Can import from Entities, Shared)
    // ============================================================
    {
      name: 'fsd-features-not-to-widgets',
      severity: 'error',
      comment: 'FSD: Features layer cannot import from Widgets layer',
      from: { path: '^src/features/' },
      to: { path: '^src/widgets/' }
    },
    {
      name: 'fsd-features-not-to-pages',
      severity: 'error',
      comment: 'FSD: Features layer cannot import from Pages layer',
      from: { path: '^src/features/' },
      to: { path: '^src/pages/' }
    },
    {
      name: 'fsd-features-not-to-app',
      severity: 'error',
      comment: 'FSD: Features layer cannot import from App layer',
      from: { path: '^src/features/' },
      to: { path: '^src/app/' }
    },
    // Cross-slice isolation for features
    {
      name: 'fsd-features-cross-import',
      severity: 'error',
      comment: 'FSD: Feature slices cannot import from other feature slices (slice isolation)',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: [
          // Allow imports from same slice
          '^src/features/\\1/',
          // Allow @x cross-reference imports if needed
          '^src/features/[^/]+/@x/'
        ]
      }
    },

    // ============================================================
    // FSD LAYER 4: WIDGETS (Can import from Features, Entities, Shared)
    // ============================================================
    {
      name: 'fsd-widgets-not-to-pages',
      severity: 'error',
      comment: 'FSD: Widgets layer cannot import from Pages layer',
      from: { path: '^src/widgets/' },
      to: { path: '^src/pages/' }
    },
    {
      name: 'fsd-widgets-not-to-app',
      severity: 'error',
      comment: 'FSD: Widgets layer cannot import from App layer',
      from: { path: '^src/widgets/' },
      to: { path: '^src/app/' }
    },
    // Cross-slice isolation for widgets
    {
      name: 'fsd-widgets-cross-import',
      severity: 'error',
      comment: 'FSD: Widget slices cannot import from other widget slices (slice isolation)',
      from: { path: '^src/widgets/([^/]+)/' },
      to: {
        path: '^src/widgets/([^/]+)/',
        pathNot: [
          // Allow imports from same slice
          '^src/widgets/\\1/',
          // Allow @x cross-reference imports if needed
          '^src/widgets/[^/]+/@x/'
        ]
      }
    },

    // ============================================================
    // FSD LAYER 5: PAGES (Can import from Widgets, Features, Entities, Shared)
    // ============================================================
    {
      name: 'fsd-pages-not-to-app',
      severity: 'error',
      comment: 'FSD: Pages layer cannot import from App layer',
      from: { path: '^src/pages/' },
      to: { path: '^src/app/' }
    },
    // Cross-slice isolation for pages
    {
      name: 'fsd-pages-cross-import',
      severity: 'error',
      comment: 'FSD: Page slices cannot import from other page slices (page isolation)',
      from: { path: '^src/pages/([^/]+)/' },
      to: {
        path: '^src/pages/([^/]+)/',
        pathNot: [
          // Allow imports from same slice
          '^src/pages/\\1/'
        ]
      }
    },

    // ============================================================
    // FSD LAYER 6: APP (Top Layer - Orchestrates everything)
    // App can import from all layers but should mainly coordinate
    // ============================================================
    // Note: App layer has no restrictions on imports (it's the entry point)
    // but it should NOT export business logic that other layers depend on

    // ============================================================
    // PUBLIC API ENFORCEMENT
    // Encourage using index.ts barrel files instead of deep imports
    // ============================================================
    {
      name: 'fsd-prefer-public-api',
      severity: 'warn',
      comment: 'FSD: Prefer importing from slice public API (index.ts) instead of internal files',
      from: {
        pathNot: [
          // Files within the same slice can import internals
          '^src/(entities|features|widgets|pages)/([^/]+)/'
        ]
      },
      to: {
        path: '^src/(entities|features|widgets|pages)/[^/]+/(ui|api|model|lib|config)/[^/]+\\.(ts|tsx|js|jsx)$'
      }
    },

    // ============================================================
    // BLOCK COMPONENTS ISOLATION (Preserved from original)
    // ============================================================
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

### Configuration Summary

| Layer | Can Import From | Cross-Slice Import |
|-------|----------------|-------------------|
| **App** (top) | All layers | N/A (no slices) |
| **Pages** | Widgets, Features, Entities, Shared | ❌ Forbidden |
| **Widgets** | Features, Entities, Shared | ❌ Forbidden |
| **Features** | Entities, Shared | ❌ Forbidden |
| **Entities** | Shared only | ❌ Forbidden (use `@x/` for cross-refs) |
| **Shared** (bottom) | Only itself | N/A (no slices) |

### Usage Commands

```bash
# Check for FSD violations
npx depcruise --config .dependency-cruiser.js src/

# Generate dependency graph
npx depcruise --config .dependency-cruiser.js --output-type dot src/ | dot -T svg > dependencies.svg

# Fail CI on violations
npx depcruise --config .dependency-cruiser.js --output-type err src/
```

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

### Complete File Migration Mapping

This section contains the complete mapping of all files to their FSD destinations.

---

## Group 1: `src/shared/api/` (Supabase & API Layer)

All Supabase-related code and API clients go here.

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/lib/supabase.js` | `src/shared/api/supabase/client.ts` | Main Supabase client initialization |
| `src/lib/supabaseOptimized.js` | `src/shared/api/supabase/optimized-client.ts` | Optimized Supabase client |
| `src/lib/supabaseWithRateLimit.js` | `src/shared/api/supabase/rate-limited-client.ts` | Rate-limited Supabase client |
| `src/lib/supabase-optimizations.ts` | `src/shared/api/supabase/optimizations.ts` | Supabase performance optimizations |
| `src/lib/api-auth.js` | `src/shared/api/auth.ts` | API authentication utilities |
| `src/api/queryClient.ts` | `src/shared/api/query-client.ts` | TanStack Query client configuration |
| `src/api/queryKeys.ts` | `src/shared/api/query-keys.ts` | TanStack Query key definitions |

**SQL Files (keep with API layer):**
| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/lib/sql/create_api_keys_table.sql` | `src/shared/api/sql/create_api_keys_table.sql` | SQL migration for API keys |
| `src/lib/sql/decrement_block_positions.sql` | `src/shared/api/sql/decrement_block_positions.sql` | SQL function for block positions |

**Files to DELETE (legacy/backup):**
| Current Path | Action | Reason |
|-------------|--------|--------|
| `src/lib/supabase.old.js` | DELETE | Old backup file, not used |

**Barrel file: `src/shared/api/index.ts`**
```typescript
// Supabase clients
export { supabase } from './supabase/client';
export { supabaseOptimized } from './supabase/optimized-client';
export { supabaseWithRateLimit } from './supabase/rate-limited-client';

// Query setup
export { queryClient } from './query-client';
export * from './query-keys';

// Auth
export * from './auth';
```

---

## Group 2: `src/shared/lib/` (Pure Utilities)

Generic utilities with no business logic.

### Core Utilities

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/LRUCache.js` | `src/shared/lib/cache/lru-cache.ts` | Generic cache implementation |
| `src/utils/cn.js` | `src/shared/lib/styles/cn.ts` | Classnames utility |
| `src/utils/eventBus.js` | `src/shared/lib/events/event-bus.ts` | Event-driven communication |
| `src/utils/rateLimiter.js` | `src/shared/lib/rate-limiter.ts` | Rate limiting utility |
| `src/utils/sanitization.ts` | `src/shared/lib/sanitization.ts` | Input sanitization |
| `src/utils/performance.js` | `src/shared/lib/performance/utils.ts` | Throttle, debounce utilities |
| `src/utils/performanceUtils.js` | `src/shared/lib/performance/helpers.ts` | Additional performance utilities |
| `src/utils/monitoring.js` | `src/shared/lib/performance/monitoring.ts` | Performance monitoring |
| `src/utils/performanceMonitor.js` | `src/shared/lib/performance/monitor.ts` | Performance monitor implementation |
| `src/utils/animationPerformance.js` | `src/shared/lib/performance/animation.ts` | Animation performance tracking |
| `src/utils/mobilePerformance.js` | `src/shared/lib/performance/mobile.ts` | Mobile performance utilities |
| `src/utils/responsive.js` | `src/shared/lib/responsive.ts` | Responsive design utilities |
| `src/utils/animations.js` | `src/shared/lib/animations.ts` | Animation utility functions |

### Storage Utilities

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/storage/storageWrapper.js` | `src/shared/lib/storage/wrapper.ts` | Main storage interface |
| `src/utils/storage/MultiLayerStorage.js` | `src/shared/lib/storage/multi-layer.ts` | Storage layer coordination |
| `src/utils/storage/IndexedDBAdapter.js` | `src/shared/lib/storage/adapters/indexeddb.ts` | IndexedDB adapter |
| `src/utils/storage/CompressedStorageAdapter.js` | `src/shared/lib/storage/adapters/compressed.ts` | Compression adapter |
| `src/utils/storage/SupabaseAdapterOptimized.js` | `src/shared/lib/storage/adapters/supabase.ts` | Supabase storage adapter |
| `src/utils/storage/SyncEngine.js` | `src/shared/lib/storage/sync-engine.ts` | Sync coordination |
| `src/utils/storage/LRUCache.js` | `src/shared/lib/storage/lru-cache.ts` | Storage-specific LRU cache |
| `src/utils/secureStorage.js` | `src/shared/lib/storage/secure.ts` | Secure storage utilities |
| `src/utils/sessionCache.js` | `src/shared/lib/storage/session-cache.ts` | Session-level caching |

### Integrity & Recovery

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/integrity/DataIntegrityManager.js` | `src/shared/lib/integrity/data-integrity.ts` | SHA-256 checksums, corruption repair |
| `src/utils/locking/LockManager.js` | `src/shared/lib/locking/lock-manager.ts` | Multi-tab lock manager |
| `src/utils/network/CircuitBreaker.js` | `src/shared/lib/network/circuit-breaker.ts` | Circuit breaker pattern |
| `src/utils/recovery/RecoveryManager.js` | `src/shared/lib/recovery/recovery-manager.ts` | Crash recovery |
| `src/utils/transactions/TransactionManager.js` | `src/shared/lib/transactions/transaction-manager.ts` | ACID-like transactions |

### Service Worker

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/serviceWorker.js` | `src/shared/lib/service-worker/register.ts` | SW registration |
| `src/utils/serviceWorkerRegistration.js` | `src/shared/lib/service-worker/registration.ts` | SW registration utilities |

### Markdown & Parsing

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/markdownConverter.js` | `src/shared/lib/markdown/converter.ts` | Markdown conversion |
| `src/utils/parseMarkdown.jsx` | `src/shared/lib/markdown/parser.tsx` | Markdown parsing with React |
| `src/utils/patchQuerySelector.js` | `src/shared/lib/dom/patch-query-selector.ts` | DOM querySelector patch |

### Auth Utilities

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/auth.js` | `src/shared/lib/auth/utils.ts` | Auth utility functions |
| `src/utils/clearAuthStorage.js` | `src/shared/lib/auth/clear-storage.ts` | Auth storage cleanup |

### Misc Utilities

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/utils/timelineMath.js` | `src/shared/lib/math/timeline.ts` | Timeline calculations |
| `src/utils/extractLinks.js` | `src/shared/lib/links/extract.ts` | Document link extraction |
| `src/utils/imageUploader.js` | `src/shared/lib/upload/image.ts` | Image upload utilities |
| `src/utils/setupImageStorage.js` | `src/shared/lib/upload/setup-storage.ts` | Image storage setup |

**Files to DELETE (legacy/backup/unused):**
| Current Path | Action | Reason |
|-------------|--------|--------|
| `src/utils/blockSchemas.backup.js` | DELETE | Backup file |
| `src/utils/blockSerializer.backup.js` | DELETE | Backup file |
| `src/utils/optimizedBlockLoader.js` | DELETE | Legacy, unused per CLAUDE.md |
| `src/utils/paginatedBlockLoader.js` | DELETE | Legacy, unused per CLAUDE.md |
| `src/utils/debugHelpers.js` | DELETE | Only used in debug console |

**Barrel file: `src/shared/lib/index.ts`**
```typescript
// Cache
export { LRUCache } from './cache/lru-cache';

// Styles
export { cn } from './styles/cn';

// Events
export { eventBus } from './events/event-bus';

// Performance
export * from './performance/utils';
export * from './performance/monitoring';

// Storage
export { storageWrapper } from './storage/wrapper';
export { MultiLayerStorage } from './storage/multi-layer';
export { SyncEngine } from './storage/sync-engine';

// Integrity & Recovery
export { DataIntegrityManager } from './integrity/data-integrity';
export { LockManager } from './locking/lock-manager';
export { CircuitBreaker } from './network/circuit-breaker';
export { RecoveryManager } from './recovery/recovery-manager';
export { TransactionManager } from './transactions/transaction-manager';

// Utilities
export { sanitize } from './sanitization';
export { rateLimiter } from './rate-limiter';
export { responsive } from './responsive';

// Markdown
export { markdownConverter } from './markdown/converter';
export { parseMarkdown } from './markdown/parser';

// Auth utilities
export * from './auth/utils';

// Upload
export { imageUploader } from './upload/image';

// Links
export { extractLinks } from './links/extract';
```

---

## Group 3: `src/shared/hooks/` (Generic Hooks)

Hooks with no business logic - pure utilities.

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/hooks/useIntersectionObserver.js` | `src/shared/hooks/use-intersection-observer.ts` | Generic intersection observer |
| `src/hooks/useResponsive.js` | `src/shared/hooks/use-responsive.ts` | Responsive design hook |
| `src/hooks/usePerformance.js` | `src/shared/hooks/use-performance.ts` | Performance monitoring |
| `src/hooks/useScrollAnimation.js` | `src/shared/hooks/use-scroll-animation.ts` | Scroll animations |
| `src/hooks/useToast.jsx` | `src/shared/hooks/use-toast.tsx` | Toast notifications |
| `src/hooks/useTouchGestures.js` | `src/shared/hooks/use-touch-gestures.ts` | Touch gesture handling |
| `src/hooks/useSwipeNavigation.js` | `src/shared/hooks/use-swipe-navigation.ts` | Swipe navigation |
| `src/hooks/useViewportAwarePosition.js` | `src/shared/hooks/use-viewport-aware-position.ts` | Viewport positioning |
| `src/hooks/useIndexedDBCache.js` | `src/shared/hooks/use-indexeddb-cache.ts` | IndexedDB caching |
| `src/hooks/useAnalytics.js` | `src/shared/hooks/use-analytics.ts` | Analytics tracking |

**Barrel file: `src/shared/hooks/index.ts`**
```typescript
export { useIntersectionObserver } from './use-intersection-observer';
export { useResponsive } from './use-responsive';
export { usePerformance } from './use-performance';
export { useScrollAnimation } from './use-scroll-animation';
export { useToast } from './use-toast';
export { useTouchGestures } from './use-touch-gestures';
export { useSwipeNavigation } from './use-swipe-navigation';
export { useViewportAwarePosition } from './use-viewport-aware-position';
export { useIndexedDBCache } from './use-indexeddb-cache';
export { useAnalytics } from './use-analytics';
```

---

## Group 4: `src/app/providers/` (React Contexts)

All React context providers live at the app layer.

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/contexts/AuthContextOptimized.jsx` | `src/app/providers/auth-provider.tsx` | Authentication provider |
| `src/contexts/SettingsContext.jsx` | `src/app/providers/settings-provider.tsx` | User settings provider |
| `src/contexts/SidebarContext.jsx` | `src/app/providers/sidebar-provider.tsx` | Sidebar state provider |
| `src/contexts/DemoModeContext.jsx` | `src/app/providers/demo-mode-provider.tsx` | Demo mode provider |
| `src/contexts/TabContext.jsx` | `src/app/providers/tab-provider.tsx` | Tab state provider |

**Barrel file: `src/app/providers/index.ts`**
```typescript
// Auth
export { AuthProvider, useAuth } from './auth-provider';

// Settings
export { SettingsProvider, useSettings } from './settings-provider';

// UI State
export { SidebarProvider, useSidebar } from './sidebar-provider';
export { TabProvider, useTab } from './tab-provider';

// Demo
export { DemoModeProvider, useDemoMode } from './demo-mode-provider';
```

---

## Group 5: `src/app/styles/` (Global Styles)

All global CSS files move to the app layer.

**Main Entry Stylesheet:**
| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/index.css` | `src/app/styles/index.css` | Main application stylesheet (must update import in main.jsx) |

**Global Styles:**
| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/styles/animations.css` | `src/app/styles/animations.css` | Global animations |
| `src/styles/glassmorphism.css` | `src/app/styles/glassmorphism.css` | Glass effect styles |
| `src/styles/typography.css` | `src/app/styles/typography.css` | Typography styles |
| `src/styles/mobile-optimizations.css` | `src/app/styles/mobile-optimizations.css` | Mobile optimizations |
| `src/styles/fluid-grids.css` | `src/app/styles/fluid-grids.css` | Grid layouts |
| `src/styles/gradient-transitions.css` | `src/app/styles/gradient-transitions.css` | Gradient effects |
| `src/styles/unified-gradients.css` | `src/app/styles/unified-gradients.css` | Gradient definitions |
| `src/styles/section-transitions.css` | `src/app/styles/section-transitions.css` | Section transitions |
| `src/styles/tiptap.css` | `src/app/styles/tiptap.css` | TipTap editor styles |

### Auth-Specific Styles (to be moved with auth feature later)

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/styles/auth-elite.css` | `src/app/styles/auth/elite.css` | Auth elite styles |
| `src/styles/auth-animations-elite.css` | `src/app/styles/auth/animations-elite.css` | Auth animations |
| `src/styles/auth-particles.css` | `src/app/styles/auth/particles.css` | Auth particle effects |
| `src/styles/auth-redesign.css` | `src/app/styles/auth/redesign.css` | Auth redesign |
| `src/styles/auth-responsive.css` | `src/app/styles/auth/responsive.css` | Auth responsive |
| `src/styles/auth-debug.css` | `src/app/styles/auth/debug.css` | Auth debug styles |

### Page-Specific Styles

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/styles/legal-pages.css` | `src/app/styles/pages/legal.css` | Legal page styles |
| `src/styles/settings-claude.css` | `src/app/styles/pages/settings.css` | Settings styles |
| `src/styles/pricing-fallback.css` | `src/app/styles/pages/pricing.css` | Pricing styles |
| `src/styles/dashboard-design-tokens.css` | `src/app/styles/pages/dashboard-tokens.css` | Dashboard tokens |
| `src/styles/demo.css` | `src/app/styles/pages/demo.css` | Demo styles |

### Hero/Landing Styles

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/styles/hero-background-animation.css` | `src/app/styles/landing/hero-background.css` | Hero background |
| `src/styles/hero-knowledge-constellation.css` | `src/app/styles/landing/knowledge-constellation.css` | Knowledge constellation |
| `src/styles/hero-premium.css` | `src/app/styles/landing/hero-premium.css` | Premium hero |
| `src/styles/hero-quantum-field.css` | `src/app/styles/landing/quantum-field.css` | Quantum field |
| `src/styles/problem-cards.css` | `src/app/styles/landing/problem-cards.css` | Problem section |
| `src/styles/video-showcase.css` | `src/app/styles/landing/video-showcase.css` | Video showcase |
| `src/styles/core-features.css` | `src/app/styles/landing/core-features.css` | Core features |

### Component Styles

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/styles/block-controls.css` | `src/app/styles/components/block-controls.css` | Block controls |
| `src/styles/inline-action-bar.css` | `src/app/styles/components/inline-action-bar.css` | Inline action bar |
| `src/styles/project-explorer-v2.css` | `src/app/styles/components/project-explorer.css` | Project explorer |
| `src/styles/MemoryErosion.css` | `src/app/styles/components/memory-erosion.css` | Memory erosion effect |
| `src/styles/MemoryErosionEnhanced.css` | `src/app/styles/components/memory-erosion-enhanced.css` | Enhanced effect |
| `src/styles/MemoryErosionShowcase.css` | `src/app/styles/components/memory-erosion-showcase.css` | Showcase styles |

---

## Group 6: `src/features/` (Feature-Specific Code)

Business logic hooks and services that belong to specific features.

### Block Feature Hooks → `src/features/block/`

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/hooks/useAutoSave.js` | `src/features/block/hooks/use-auto-save.ts` | Block auto-save logic |
| `src/hooks/useBlockLazyLoading.js` | `src/features/block/hooks/use-lazy-loading.ts` | Block lazy loading |
| `src/hooks/useOptimizedBlockLoader.js` | `src/features/block/hooks/use-optimized-loader.ts` | Block loading optimization |
| `src/hooks/usePaginatedBlockLoader.js` | `src/features/block/hooks/use-paginated-loader.ts` | Paginated block loading |
| `src/hooks/useMemoryManagement.js` | `src/features/block/hooks/use-memory-management.ts` | Block memory management |
| `src/utils/blockSchemas.js` | `src/features/block/lib/schemas.ts` | Block schema definitions |
| `src/utils/blockSerializer.js` | `src/features/block/lib/serializer.ts` | Block serialization |

**Barrel file: `src/features/block/index.ts`**
```typescript
// Hooks
export { useAutoSave } from './hooks/use-auto-save';
export { useBlockLazyLoading } from './hooks/use-lazy-loading';
export { useOptimizedBlockLoader } from './hooks/use-optimized-loader';
export { usePaginatedBlockLoader } from './hooks/use-paginated-loader';
export { useMemoryManagement } from './hooks/use-memory-management';

// Lib
export * from './lib/schemas';
export { blockSerializer } from './lib/serializer';
```

### Document Feature Hooks → `src/features/document/`

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/hooks/useDocumentOrganization.js` | `src/features/document/hooks/use-organization.ts` | Document organization |
| `src/hooks/useFolders.js` | `src/features/document/hooks/use-folders.ts` | Folder management |
| `src/hooks/usePaginatedDashboard.js` | `src/features/document/hooks/use-paginated-dashboard.ts` | Dashboard pagination |

**Barrel file: `src/features/document/index.ts`**
```typescript
export { useDocumentOrganization } from './hooks/use-organization';
export { useFolders } from './hooks/use-folders';
export { usePaginatedDashboard } from './hooks/use-paginated-dashboard';
```

### Storage Feature Hooks → `src/features/storage/`

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/hooks/useMultiLayerStorage.js` | `src/features/storage/hooks/use-multi-layer.ts` | Multi-layer storage hook |
| `src/hooks/useSmartDatabaseUsage.js` | `src/features/storage/hooks/use-database-usage.ts` | Database usage tracking |
| `src/hooks/useSmartSync.js` | `src/features/storage/hooks/use-smart-sync.ts` | Smart sync hook |
| `src/hooks/useBatchLoader.js` | `src/features/storage/hooks/use-batch-loader.ts` | Batch loading |
| `src/utils/smartSync.js` | `src/features/storage/lib/smart-sync.ts` | Smart sync logic |
| `src/utils/realtimeManager.js` | `src/features/storage/lib/realtime-manager.ts` | Realtime subscriptions |
| `src/utils/realtimeSync.js` | `src/features/storage/lib/realtime-sync.ts` | Realtime sync logic |
| `src/utils/supabaseDataExport.js` | `src/features/storage/lib/data-export.ts` | Data export |

**Barrel file: `src/features/storage/index.ts`**
```typescript
// Hooks
export { useMultiLayerStorage } from './hooks/use-multi-layer';
export { useSmartDatabaseUsage } from './hooks/use-database-usage';
export { useSmartSync } from './hooks/use-smart-sync';
export { useBatchLoader } from './hooks/use-batch-loader';

// Lib
export { SmartSync } from './lib/smart-sync';
export { RealtimeManager } from './lib/realtime-manager';
export { realtimeSync } from './lib/realtime-sync';
export { exportData } from './lib/data-export';
```

### Share Feature → `src/features/share/`

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/services/shareService.js` | `src/features/share/api/share-service.ts` | Document sharing service |
| `src/services/sophisticatedShareService.js` | `src/features/share/api/sophisticated-share.ts` | Advanced sharing |

**Barrel file: `src/features/share/index.ts`**
```typescript
export { shareService } from './api/share-service';
export { sophisticatedShareService } from './api/sophisticated-share';
```

### Analytics Feature → `src/features/analytics/`

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/services/analytics/AnalyticsService.js` | `src/features/analytics/api/service.ts` | Analytics service |
| `src/services/analytics/consent.js` | `src/features/analytics/lib/consent.ts` | Consent management |
| `src/services/analytics/script-loader.js` | `src/features/analytics/lib/script-loader.ts` | Script loading |

**Barrel file: `src/features/analytics/index.ts`**
```typescript
export { AnalyticsService } from './api/service';
export { analyticsConsent } from './lib/consent';
export { loadAnalyticsScript } from './lib/script-loader';
```

---

## Group 7: `src/test/` (Test Configuration)

Test setup stays at root level but organized.

| Current Path | New Path | Reason |
|-------------|----------|--------|
| `src/test/setup.ts` | `src/test/setup.ts` | Keep as-is (already correct) |
| `src/test/setup.js` | DELETE | Duplicate, prefer .ts version |
| `src/utils/__tests__/LRUCache.test.js` | `src/shared/lib/cache/__tests__/lru-cache.test.ts` | Co-locate with source |
| `src/utils/__tests__/sanitization.test.ts` | `src/shared/lib/__tests__/sanitization.test.ts` | Co-locate with source |

---

## Summary: All Barrel Files Needed

| Barrel File Path | Purpose |
|-----------------|---------|
| `src/shared/api/index.ts` | Export all API clients (Supabase, Query) |
| `src/shared/api/supabase/index.ts` | Export Supabase clients |
| `src/shared/lib/index.ts` | Export all utilities |
| `src/shared/lib/storage/index.ts` | Export storage utilities |
| `src/shared/lib/storage/adapters/index.ts` | Export storage adapters |
| `src/shared/lib/performance/index.ts` | Export performance utilities |
| `src/shared/lib/markdown/index.ts` | Export markdown utilities |
| `src/shared/lib/auth/index.ts` | Export auth utilities |
| `src/shared/hooks/index.ts` | Export all shared hooks |
| `src/app/providers/index.ts` | Export all providers |
| `src/features/block/index.ts` | Export block feature |
| `src/features/document/index.ts` | Export document feature |
| `src/features/storage/index.ts` | Export storage feature |
| `src/features/share/index.ts` | Export share feature |
| `src/features/analytics/index.ts` | Export analytics feature |

---

## Migration Statistics

| Source Directory | Total Files | Destination Layer | Files to Delete |
|-----------------|-------------|-------------------|-----------------|
| `src/utils/` | 51 | `src/shared/lib/` + `src/features/*/lib/` | 5 |
| `src/hooks/` | 22 | `src/shared/hooks/` + `src/features/*/hooks/` | 0 |
| `src/contexts/` | 5 | `src/app/providers/` | 0 |
| `src/lib/` | 8 | `src/shared/api/` (includes 2 SQL files) | 1 |
| `src/services/` | 5 | `src/features/*/api/` | 0 |
| `src/styles/` | 33 | `src/app/styles/` | 0 |
| `src/index.css` | 1 | `src/app/styles/` | 0 |
| `src/api/` | 2 | `src/shared/api/` | 0 |
| `src/test/` | 2 | Keep + co-locate tests | 1 |
| **Total** | **129** | - | **7** |

---

## Import Path Updates

This section documents all import path changes required for the FSD migration with exact search-and-replace patterns.

### Import Path Mapping Table

#### Storage Files (`src/utils/storage/` → `src/shared/lib/storage/`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `../utils/storage/storageWrapper` | `@/shared/lib/storage` | 6 |
| `../storage/storageWrapper` | `@/shared/lib/storage` | 1 |
| `../../../utils/storage/storageWrapper` | `@/shared/lib/storage` | 1 |
| `./utils/storage/storageWrapper` | `@/shared/lib/storage` | 1 |
| `../utils/storage/MultiLayerStorage` | `@/shared/lib/storage` | 1 |
| `./MultiLayerStorage` | `./multi-layer` | 1 (internal) |
| `../utils/storage/IndexedDBAdapter` | `@/shared/lib/storage/adapters` | 2 |
| `./IndexedDBAdapter` | `./adapters/indexeddb` | 4 (internal) |
| `./SupabaseAdapterOptimized` | `./adapters/supabase` | 2 (internal) |
| `../utils/storage/SyncEngine` | `@/shared/lib/storage` | 1 |
| `./LRUCache` | `./lru-cache` | 1 (internal) |
| `./storage/LRUCache` | `@/shared/lib/storage` | 1 |

#### Event Bus (`src/utils/eventBus.js` → `src/shared/lib/events/event-bus.ts`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `../eventBus` | `@/shared/lib/events` | 7 |
| `../utils/eventBus` | `@/shared/lib/events` | 6 |
| `./eventBus` | `@/shared/lib/events` | 1 |

#### CN Utility (`src/utils/cn.js` → `src/shared/lib/styles/cn.ts`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `../../utils/cn` | `@/shared/lib/styles` | 7 |
| `../utils/cn` | `@/shared/lib/styles` | 1 |

#### Performance Utils (`src/utils/performance.js` → `src/shared/lib/performance/utils.ts`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `./utils/performance` | `@/shared/lib/performance` | 1 |
| `../utils/performance` | `@/shared/lib/performance` | 4 |

#### Monitoring (`src/utils/monitoring.js` → `src/shared/lib/performance/monitoring.ts`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `./utils/monitoring` | `@/shared/lib/performance` | 1 |
| `../utils/monitoring` | `@/shared/lib/performance` | 2 |

#### Sanitization (`src/utils/sanitization.ts` → `src/shared/lib/sanitization.ts`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `@/utils/sanitization` | `@/shared/lib/sanitization` | 1 |

#### Supabase Clients (`src/lib/` → `src/shared/api/supabase/`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `../lib/supabase` | `@/shared/api/supabase` | 9 |
| `../../lib/supabase` | `@/shared/api/supabase` | 1 |
| `./lib/supabaseOptimized` | `@/shared/api/supabase` | 1 |
| `../lib/supabaseOptimized` | `@/shared/api/supabase` | 15 |
| `../../lib/supabaseOptimized` | `@/shared/api/supabase` | 2 |
| `../lib/supabase-optimizations` | `@/shared/api/supabase` | 1 |

#### TanStack Query (`src/api/` → `src/shared/api/`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `./api/queryClient` | `@/shared/api` | 1 |

#### Hooks (`src/hooks/` → `src/shared/hooks/`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `./hooks/useToast` | `@/shared/hooks` | 1 |
| `../hooks/useToast` | `@/shared/hooks` | 10 |
| `../../hooks/useToast` | `@/shared/hooks` | 3 |
| `../../../hooks/useToast` | `@/shared/hooks` | 1 |
| `../hooks/useResponsive` | `@/shared/hooks` | 15 |

#### Contexts (`src/contexts/` → `src/app/providers/`)

| Old Import Path | New Import Path | Files Affected |
|----------------|-----------------|----------------|
| `./contexts/AuthContextOptimized` | `@/app/providers` | 1 |
| `../contexts/AuthContextOptimized` | `@/app/providers` | 11 |
| `../../contexts/AuthContextOptimized` | `@/app/providers` | 4 |
| `./contexts/SettingsContext` | `@/app/providers` | 1 |
| `../contexts/SettingsContext` | `@/app/providers` | 2 |
| `./contexts/SidebarContext` | `@/app/providers` | 1 |
| `../contexts/SidebarContext` | `@/shared/hooks` | 1 |

---

### Update Commands

#### Prerequisites
Ensure path alias `@/` is configured in `vite.config.js` and `tsconfig.json`:

```javascript
// vite.config.js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

#### Batch Update Commands (Run in Order)

**Step 1: Storage Imports**
```bash
# From project root - update external storage imports
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/storage\/storageWrapper['\"]|from '@/shared/lib/storage'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/\.\.\/utils\/storage\/storageWrapper['\"]|from '@/shared/lib/storage'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/storage\/storageWrapper['\"]|from '@/shared/lib/storage'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/storage\/MultiLayerStorage['\"]|from '@/shared/lib/storage'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/storage\/SyncEngine['\"]|from '@/shared/lib/storage'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/storage\/IndexedDBAdapter['\"]|from '@/shared/lib/storage/adapters'|g" {} +
```

**Step 2: Event Bus Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/eventBus['\"]|from '@/shared/lib/events'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/eventBus['\"]|from '@/shared/lib/events'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/eventBus['\"]|from '@/shared/lib/events'|g" {} +
```

**Step 3: CN Utility Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/utils\/cn['\"]|from '@/shared/lib/styles'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/cn['\"]|from '@/shared/lib/styles'|g" {} +
```

**Step 4: Performance/Monitoring Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/utils\/performance['\"]|from '@/shared/lib/performance'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/performance['\"]|from '@/shared/lib/performance'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/utils\/monitoring['\"]|from '@/shared/lib/performance'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/utils\/monitoring['\"]|from '@/shared/lib/performance'|g" {} +
```

**Step 5: Supabase Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/lib\/supabase['\"]|from '@/shared/api/supabase'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/lib\/supabase['\"]|from '@/shared/api/supabase'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/lib\/supabaseOptimized['\"]|from '@/shared/api/supabase'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/lib\/supabaseOptimized['\"]|from '@/shared/api/supabase'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/lib\/supabaseOptimized['\"]|from '@/shared/api/supabase'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/lib\/supabase-optimizations['\"]|from '@/shared/api/supabase'|g" {} +
```

**Step 6: TanStack Query Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/api\/queryClient['\"]|from '@/shared/api'|g" {} +
```

**Step 7: Hook Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/hooks\/useToast['\"]|from '@/shared/hooks'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/hooks\/useToast['\"]|from '@/shared/hooks'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/hooks\/useToast['\"]|from '@/shared/hooks'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/\.\.\/hooks\/useToast['\"]|from '@/shared/hooks'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/hooks\/useResponsive['\"]|from '@/shared/hooks'|g" {} +
```

**Step 8: Context/Provider Imports**
```bash
find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/contexts\/AuthContextOptimized['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/contexts\/AuthContextOptimized['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/\.\.\/contexts\/AuthContextOptimized['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/contexts\/SettingsContext['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/contexts\/SettingsContext['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\/contexts\/SidebarContext['\"]|from '@/app/providers'|g" {} +

find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i "s|from ['\"]\.\.\/contexts\/SidebarContext['\"]|from '@/app/providers'|g" {} +
```

---

### Manual Update Instructions

For complex imports with multiple named exports, manual updates are recommended:

#### 1. Supabase Client Consolidation

Files importing multiple exports from `supabaseOptimized.js` need manual review:

```typescript
// Before (src/contexts/AuthContextOptimized.jsx)
import { optimizedSupabase, onAuthStateChange, getSession } from '../lib/supabaseOptimized';

// After
import { optimizedSupabase, onAuthStateChange, getSession } from '@/shared/api/supabase';
```

#### 2. Storage Wrapper Named Exports

Files using named exports need barrel file alignment:

```typescript
// Before (src/pages/Dashboard.jsx)
import storageWrapper, { deleteEntry } from '../utils/storage/storageWrapper';

// After
import { storageWrapper, deleteEntry } from '@/shared/lib/storage';
```

#### 3. Event Bus with EVENT_TYPES

All eventBus imports include EVENT_TYPES constant:

```typescript
// Before
import eventBus, { EVENT_TYPES } from '../utils/eventBus';

// After
import { eventBus, EVENT_TYPES } from '@/shared/lib/events';
```

---

### Internal Import Updates (Within Moved Directories)

After moving files, internal imports within `src/shared/lib/storage/` need updating:

```typescript
// src/shared/lib/storage/sync-engine.ts
// Before:
import multiLayerStorage from './MultiLayerStorage';
import IndexedDBAdapter from './IndexedDBAdapter';
import eventBus, { EVENT_TYPES } from '../eventBus';

// After:
import { multiLayerStorage } from './multi-layer';
import { IndexedDBAdapter } from './adapters/indexeddb';
import { eventBus, EVENT_TYPES } from '../events';
```

---

### Verification Commands

After running all updates:

```bash
# Check for any remaining old import patterns
grep -r "from ['\"].*\/utils\/storage" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
grep -r "from ['\"].*\/lib\/supabase" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
grep -r "from ['\"].*\/contexts\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"

# Build to verify all imports resolve
npm run build

# Run TypeScript check
npx tsc --noEmit
```

---

### Summary Statistics

| Category | Old Pattern Count | Files Affected |
|----------|------------------|----------------|
| Storage imports | 22 | 9 unique files |
| Event bus imports | 14 | 14 unique files |
| CN utility imports | 8 | 8 unique files |
| Performance/monitoring | 8 | 6 unique files |
| Supabase imports | 30 | 21 unique files |
| Query client imports | 1 | 1 unique file |
| Hook imports | 30 | 21 unique files |
| Context imports | 21 | 17 unique files |
| **TOTAL** | **~134** | **~60 unique files** |

---

---

## Execution Sequence

This section provides the complete numbered execution sequence for the FSD migration. Each step is atomic and can be verified independently.

### Prerequisites (Before Starting)

**P1.** Ensure `@/` path alias is configured:
```bash
# Verify vite.config.js has:
# resolve: { alias: { '@': path.resolve(__dirname, './src') } }
grep -A2 "alias:" vite.config.js
```

**P2.** Ensure `tsconfig.json` has path mapping:
```bash
# Verify tsconfig.json has:
# "paths": { "@/*": ["src/*"] }
grep -A1 '"paths"' tsconfig.json
```

**P3.** Create all destination directories:
```bash
mkdir -p src/shared/{api/{supabase,sql},lib/{cache,styles,events,performance,storage/adapters,integrity,locking,network,recovery,transactions,service-worker,markdown,auth,math,links,upload,dom},hooks}
mkdir -p src/app/{providers,styles/{auth,pages,landing,components},router}
mkdir -p src/features/{block/{hooks,lib},document/hooks,storage/{hooks,lib},share/api,analytics/{api,lib}}
mkdir -p src/test
```

---

### Phase A: Shared Layer - API (Steps 1-9)

**BATCH A1: Supabase Clients**

1. Move `src/lib/supabase.js` → `src/shared/api/supabase/client.ts`
2. Move `src/lib/supabaseOptimized.js` → `src/shared/api/supabase/optimized-client.ts`
3. Move `src/lib/supabaseWithRateLimit.js` → `src/shared/api/supabase/rate-limited-client.ts`
4. Move `src/lib/supabase-optimizations.ts` → `src/shared/api/supabase/optimizations.ts`
5. Move `src/lib/api-auth.js` → `src/shared/api/auth.ts`
6. Delete `src/lib/supabase.old.js` (legacy backup)

**BATCH A2: TanStack Query**

7. Move `src/api/queryClient.ts` → `src/shared/api/query-client.ts`
8. Move `src/api/queryKeys.ts` → `src/shared/api/query-keys.ts`

**BATCH A3: Create Barrel Files**

9. Create `src/shared/api/supabase/index.ts` with exports
10. Create `src/shared/api/index.ts` with exports

**✓ CHECKPOINT A: Verify API Layer**
```bash
npm run build
grep -r "from ['\"].*\/lib\/supabase" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches (all imports updated)
```

---

### Phase B: Shared Layer - Core Utilities (Steps 11-26)

**BATCH B1: Cache & Styles**

11. Move `src/utils/LRUCache.js` → `src/shared/lib/cache/lru-cache.ts`
12. Move `src/utils/cn.js` → `src/shared/lib/styles/cn.ts`
13. Create `src/shared/lib/cache/index.ts`
14. Create `src/shared/lib/styles/index.ts`

**BATCH B2: Events**

15. Move `src/utils/eventBus.js` → `src/shared/lib/events/event-bus.ts`
16. Create `src/shared/lib/events/index.ts`

**BATCH B3: Performance**

17. Move `src/utils/performance.js` → `src/shared/lib/performance/utils.ts`
18. Move `src/utils/performanceUtils.js` → `src/shared/lib/performance/helpers.ts`
19. Move `src/utils/monitoring.js` → `src/shared/lib/performance/monitoring.ts`
20. Move `src/utils/performanceMonitor.js` → `src/shared/lib/performance/monitor.ts`
21. Move `src/utils/animationPerformance.js` → `src/shared/lib/performance/animation.ts`
22. Move `src/utils/mobilePerformance.js` → `src/shared/lib/performance/mobile.ts`
23. Create `src/shared/lib/performance/index.ts`

**BATCH B4: Core Utils**

24. Move `src/utils/rateLimiter.js` → `src/shared/lib/rate-limiter.ts`
25. Move `src/utils/sanitization.ts` → `src/shared/lib/sanitization.ts`
26. Move `src/utils/responsive.js` → `src/shared/lib/responsive.ts`
27. Move `src/utils/animations.js` → `src/shared/lib/animations.ts`

**✓ CHECKPOINT B: Verify Core Utilities**
```bash
npm run build
npm run lint
grep -r "from ['\"].*\/utils\/eventBus" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches
```

---

### Phase C: Shared Layer - Storage (Steps 28-41)

**BATCH C1: Storage Core**

28. Move `src/utils/storage/storageWrapper.js` → `src/shared/lib/storage/wrapper.ts`
29. Move `src/utils/storage/MultiLayerStorage.js` → `src/shared/lib/storage/multi-layer.ts`
30. Move `src/utils/storage/SyncEngine.js` → `src/shared/lib/storage/sync-engine.ts`
31. Move `src/utils/storage/LRUCache.js` → `src/shared/lib/storage/lru-cache.ts`

**BATCH C2: Storage Adapters**

32. Move `src/utils/storage/IndexedDBAdapter.js` → `src/shared/lib/storage/adapters/indexeddb.ts`
33. Move `src/utils/storage/CompressedStorageAdapter.js` → `src/shared/lib/storage/adapters/compressed.ts`
34. Move `src/utils/storage/SupabaseAdapterOptimized.js` → `src/shared/lib/storage/adapters/supabase.ts`
35. Create `src/shared/lib/storage/adapters/index.ts`

**BATCH C3: Storage Utils**

36. Move `src/utils/secureStorage.js` → `src/shared/lib/storage/secure.ts`
37. Move `src/utils/sessionCache.js` → `src/shared/lib/storage/session-cache.ts`
38. Create `src/shared/lib/storage/index.ts`

**BATCH C4: Integrity & Recovery**

39. Move `src/utils/integrity/DataIntegrityManager.js` → `src/shared/lib/integrity/data-integrity.ts`
40. Move `src/utils/locking/LockManager.js` → `src/shared/lib/locking/lock-manager.ts`
41. Move `src/utils/network/CircuitBreaker.js` → `src/shared/lib/network/circuit-breaker.ts`
42. Move `src/utils/recovery/RecoveryManager.js` → `src/shared/lib/recovery/recovery-manager.ts`
43. Move `src/utils/transactions/TransactionManager.js` → `src/shared/lib/transactions/transaction-manager.ts`
44. Create barrel files for each subdirectory

**✓ CHECKPOINT C: Verify Storage Layer**
```bash
npm run build
grep -r "from ['\"].*\/utils\/storage" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches
```

---

### Phase D: Shared Layer - Remaining Utils (Steps 45-62)

**BATCH D1: Service Worker**

45. Move `src/utils/serviceWorker.js` → `src/shared/lib/service-worker/register.ts`
46. Move `src/utils/serviceWorkerRegistration.js` → `src/shared/lib/service-worker/registration.ts`
47. Create `src/shared/lib/service-worker/index.ts`

**BATCH D2: Markdown**

48. Move `src/utils/markdownConverter.js` → `src/shared/lib/markdown/converter.ts`
49. Move `src/utils/parseMarkdown.jsx` → `src/shared/lib/markdown/parser.tsx`
50. Create `src/shared/lib/markdown/index.ts`

**BATCH D3: Auth Utils**

51. Move `src/utils/auth.js` → `src/shared/lib/auth/utils.ts`
52. Move `src/utils/clearAuthStorage.js` → `src/shared/lib/auth/clear-storage.ts`
53. Create `src/shared/lib/auth/index.ts`

**BATCH D4: Misc Utils**

54. Move `src/utils/patchQuerySelector.js` → `src/shared/lib/dom/patch-query-selector.ts`
55. Move `src/utils/timelineMath.js` → `src/shared/lib/math/timeline.ts`
56. Move `src/utils/extractLinks.js` → `src/shared/lib/links/extract.ts`
57. Move `src/utils/imageUploader.js` → `src/shared/lib/upload/image.ts`
58. Move `src/utils/setupImageStorage.js` → `src/shared/lib/upload/setup-storage.ts`

**BATCH D5: Delete Legacy Files**

59. Delete `src/utils/blockSchemas.backup.js`
60. Delete `src/utils/blockSerializer.backup.js`
61. Delete `src/utils/optimizedBlockLoader.js`
62. Delete `src/utils/paginatedBlockLoader.js`
63. Delete `src/utils/debugHelpers.js`

**BATCH D6: Create Main Barrel**

64. Create `src/shared/lib/index.ts` (main barrel file)

**✓ CHECKPOINT D: Verify All Shared Lib**
```bash
npm run build
npm run lint
# All imports should now use @/shared/lib/...
```

---

### Phase E: Shared Layer - Hooks (Steps 65-76)

**BATCH E1: Move Generic Hooks**

65. Move `src/hooks/useIntersectionObserver.js` → `src/shared/hooks/use-intersection-observer.ts`
66. Move `src/hooks/useResponsive.js` → `src/shared/hooks/use-responsive.ts`
67. Move `src/hooks/usePerformance.js` → `src/shared/hooks/use-performance.ts`
68. Move `src/hooks/useScrollAnimation.js` → `src/shared/hooks/use-scroll-animation.ts`
69. Move `src/hooks/useToast.jsx` → `src/shared/hooks/use-toast.tsx`
70. Move `src/hooks/useTouchGestures.js` → `src/shared/hooks/use-touch-gestures.ts`
71. Move `src/hooks/useSwipeNavigation.js` → `src/shared/hooks/use-swipe-navigation.ts`
72. Move `src/hooks/useViewportAwarePosition.js` → `src/shared/hooks/use-viewport-aware-position.ts`
73. Move `src/hooks/useIndexedDBCache.js` → `src/shared/hooks/use-indexeddb-cache.ts`
74. Move `src/hooks/useAnalytics.js` → `src/shared/hooks/use-analytics.ts`

**BATCH E2: Create Barrel**

75. Create `src/shared/hooks/index.ts`

**✓ CHECKPOINT E: Verify Shared Hooks**
```bash
npm run build
grep -r "from ['\"].*\/hooks\/useToast" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
grep -r "from ['\"].*\/hooks\/useResponsive" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches for each
```

---

### Phase F: App Layer - Providers (Steps 76-82)

**BATCH F1: Move Contexts**

76. Move `src/contexts/AuthContextOptimized.jsx` → `src/app/providers/auth-provider.tsx`
77. Move `src/contexts/SettingsContext.jsx` → `src/app/providers/settings-provider.tsx`
78. Move `src/contexts/SidebarContext.jsx` → `src/app/providers/sidebar-provider.tsx`
79. Move `src/contexts/DemoModeContext.jsx` → `src/app/providers/demo-mode-provider.tsx`
80. Move `src/contexts/TabContext.jsx` → `src/app/providers/tab-provider.tsx`

**BATCH F2: Create Barrel**

81. Create `src/app/providers/index.ts`

**✓ CHECKPOINT F: Verify App Providers**
```bash
npm run build
grep -r "from ['\"].*\/contexts\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches
```

---

### Phase G: App Layer - Styles (Steps 82-114)

**BATCH G1: Global Styles**

82. Move `src/styles/animations.css` → `src/app/styles/animations.css`
83. Move `src/styles/glassmorphism.css` → `src/app/styles/glassmorphism.css`
84. Move `src/styles/typography.css` → `src/app/styles/typography.css`
85. Move `src/styles/mobile-optimizations.css` → `src/app/styles/mobile-optimizations.css`
86. Move `src/styles/fluid-grids.css` → `src/app/styles/fluid-grids.css`
87. Move `src/styles/gradient-transitions.css` → `src/app/styles/gradient-transitions.css`
88. Move `src/styles/unified-gradients.css` → `src/app/styles/unified-gradients.css`
89. Move `src/styles/section-transitions.css` → `src/app/styles/section-transitions.css`
90. Move `src/styles/tiptap.css` → `src/app/styles/tiptap.css`

**BATCH G2: Auth Styles**

91. Move `src/styles/auth-elite.css` → `src/app/styles/auth/elite.css`
92. Move `src/styles/auth-animations-elite.css` → `src/app/styles/auth/animations-elite.css`
93. Move `src/styles/auth-particles.css` → `src/app/styles/auth/particles.css`
94. Move `src/styles/auth-redesign.css` → `src/app/styles/auth/redesign.css`
95. Move `src/styles/auth-responsive.css` → `src/app/styles/auth/responsive.css`
96. Move `src/styles/auth-debug.css` → `src/app/styles/auth/debug.css`

**BATCH G3: Page Styles**

97. Move `src/styles/legal-pages.css` → `src/app/styles/pages/legal.css`
98. Move `src/styles/settings-claude.css` → `src/app/styles/pages/settings.css`
99. Move `src/styles/pricing-fallback.css` → `src/app/styles/pages/pricing.css`
100. Move `src/styles/dashboard-design-tokens.css` → `src/app/styles/pages/dashboard-tokens.css`
101. Move `src/styles/demo.css` → `src/app/styles/pages/demo.css`

**BATCH G4: Landing Styles**

102. Move `src/styles/hero-background-animation.css` → `src/app/styles/landing/hero-background.css`
103. Move `src/styles/hero-knowledge-constellation.css` → `src/app/styles/landing/knowledge-constellation.css`
104. Move `src/styles/hero-premium.css` → `src/app/styles/landing/hero-premium.css`
105. Move `src/styles/hero-quantum-field.css` → `src/app/styles/landing/quantum-field.css`
106. Move `src/styles/problem-cards.css` → `src/app/styles/landing/problem-cards.css`
107. Move `src/styles/video-showcase.css` → `src/app/styles/landing/video-showcase.css`
108. Move `src/styles/core-features.css` → `src/app/styles/landing/core-features.css`

**BATCH G5: Component Styles**

109. Move `src/styles/block-controls.css` → `src/app/styles/components/block-controls.css`
110. Move `src/styles/inline-action-bar.css` → `src/app/styles/components/inline-action-bar.css`
111. Move `src/styles/project-explorer-v2.css` → `src/app/styles/components/project-explorer.css`
112. Move `src/styles/MemoryErosion.css` → `src/app/styles/components/memory-erosion.css`
113. Move `src/styles/MemoryErosionEnhanced.css` → `src/app/styles/components/memory-erosion-enhanced.css`
114. Move `src/styles/MemoryErosionShowcase.css` → `src/app/styles/components/memory-erosion-showcase.css`

**✓ CHECKPOINT G: Verify App Styles**
```bash
npm run build
# Check CSS imports still resolve
ls -la src/app/styles/
```

---

### Phase H: Features Layer (Steps 115-145)

**BATCH H1: Block Feature**

115. Move `src/hooks/useAutoSave.js` → `src/features/block/hooks/use-auto-save.ts`
116. Move `src/hooks/useBlockLazyLoading.js` → `src/features/block/hooks/use-lazy-loading.ts`
117. Move `src/hooks/useOptimizedBlockLoader.js` → `src/features/block/hooks/use-optimized-loader.ts`
118. Move `src/hooks/usePaginatedBlockLoader.js` → `src/features/block/hooks/use-paginated-loader.ts`
119. Move `src/hooks/useMemoryManagement.js` → `src/features/block/hooks/use-memory-management.ts`
120. Move `src/utils/blockSchemas.js` → `src/features/block/lib/schemas.ts`
121. Move `src/utils/blockSerializer.js` → `src/features/block/lib/serializer.ts`
122. Create `src/features/block/hooks/index.ts`
123. Create `src/features/block/lib/index.ts`
124. Create `src/features/block/index.ts`

**BATCH H2: Document Feature**

125. Move `src/hooks/useDocumentOrganization.js` → `src/features/document/hooks/use-organization.ts`
126. Move `src/hooks/useFolders.js` → `src/features/document/hooks/use-folders.ts`
127. Move `src/hooks/usePaginatedDashboard.js` → `src/features/document/hooks/use-paginated-dashboard.ts`
128. Create `src/features/document/hooks/index.ts`
129. Create `src/features/document/index.ts`

**BATCH H3: Storage Feature**

130. Move `src/hooks/useMultiLayerStorage.js` → `src/features/storage/hooks/use-multi-layer.ts`
131. Move `src/hooks/useSmartDatabaseUsage.js` → `src/features/storage/hooks/use-database-usage.ts`
132. Move `src/hooks/useSmartSync.js` → `src/features/storage/hooks/use-smart-sync.ts`
133. Move `src/hooks/useBatchLoader.js` → `src/features/storage/hooks/use-batch-loader.ts`
134. Move `src/utils/smartSync.js` → `src/features/storage/lib/smart-sync.ts`
135. Move `src/utils/realtimeManager.js` → `src/features/storage/lib/realtime-manager.ts`
136. Move `src/utils/realtimeSync.js` → `src/features/storage/lib/realtime-sync.ts`
137. Move `src/utils/supabaseDataExport.js` → `src/features/storage/lib/data-export.ts`
138. Create `src/features/storage/hooks/index.ts`
139. Create `src/features/storage/lib/index.ts`
140. Create `src/features/storage/index.ts`

**BATCH H4: Share Feature**

141. Move `src/services/shareService.js` → `src/features/share/api/share-service.ts`
142. Move `src/services/sophisticatedShareService.js` → `src/features/share/api/sophisticated-share.ts`
143. Create `src/features/share/api/index.ts`
144. Create `src/features/share/index.ts`

**BATCH H5: Analytics Feature**

145. Move `src/services/analytics/AnalyticsService.js` → `src/features/analytics/api/service.ts`
146. Move `src/services/analytics/consent.js` → `src/features/analytics/lib/consent.ts`
147. Move `src/services/analytics/script-loader.js` → `src/features/analytics/lib/script-loader.ts`
148. Create `src/features/analytics/api/index.ts`
149. Create `src/features/analytics/lib/index.ts`
150. Create `src/features/analytics/index.ts`

**✓ CHECKPOINT H: Verify Features Layer**
```bash
npm run build
npm run lint
```

---

### Phase I: Test Files (Steps 151-154)

151. Move `src/utils/__tests__/LRUCache.test.js` → `src/shared/lib/cache/__tests__/lru-cache.test.ts`
152. Move `src/utils/__tests__/sanitization.test.ts` → `src/shared/lib/__tests__/sanitization.test.ts`
153. Delete `src/test/setup.js` (duplicate, keep .ts version)
154. Update test configuration if needed

**✓ CHECKPOINT I: Verify Tests**
```bash
npm run test
```

---

### Phase J: Import Updates (Steps 155-162)

**BATCH J1: Run Automated Import Updates**

155. Run storage import updates (sed commands from plan)
156. Run event bus import updates
157. Run CN utility import updates
158. Run performance/monitoring import updates
159. Run Supabase import updates
160. Run hook import updates
161. Run context/provider import updates

**BATCH J2: Manual Import Fixes**

162. Fix any remaining complex imports manually (multi-export patterns)

**✓ CHECKPOINT J: Final Verification**
```bash
npm run build
npm run lint
npm run test
npx tsc --noEmit

# Final import pattern check
grep -r "from ['\"]\.\.\/utils\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
grep -r "from ['\"]\.\.\/hooks\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
grep -r "from ['\"]\.\.\/contexts\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
grep -r "from ['\"]\.\.\/lib\/" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0 matches for all
```

---

### Phase K: Cleanup (Steps 163-166)

163. Remove empty `src/utils/` directory
164. Remove empty `src/hooks/` directory
165. Remove empty `src/contexts/` directory
166. Remove empty `src/lib/` directory
167. Remove empty `src/services/` directory
168. Remove empty `src/styles/` directory
169. Update `src/main.jsx` with new import paths
170. Update `src/App.jsx` with new import paths

**✓ FINAL CHECKPOINT: Complete Migration**
```bash
npm run build
npm run lint
npm run test
npm run dev
# Manual verification: Open app in browser, test core functionality
```

---

### Commit Strategy

After each phase completion, create a commit:

```bash
# After Phase A
git add -A && git commit -m "feat(fsd): migrate API layer to src/shared/api/"

# After Phase B
git add -A && git commit -m "feat(fsd): migrate core utilities to src/shared/lib/"

# After Phase C
git add -A && git commit -m "feat(fsd): migrate storage layer to src/shared/lib/storage/"

# After Phase D
git add -A && git commit -m "feat(fsd): migrate remaining utils to src/shared/lib/"

# After Phase E
git add -A && git commit -m "feat(fsd): migrate shared hooks to src/shared/hooks/"

# After Phase F
git add -A && git commit -m "feat(fsd): migrate contexts to src/app/providers/"

# After Phase G
git add -A && git commit -m "feat(fsd): migrate styles to src/app/styles/"

# After Phase H
git add -A && git commit -m "feat(fsd): migrate business logic to src/features/"

# After Phase I-K
git add -A && git commit -m "feat(fsd): complete FSD migration, cleanup old directories"
```

---

### Total Step Count

| Phase | Steps | Description |
|-------|-------|-------------|
| Prerequisites | P1-P3 | Setup path aliases and directories |
| Phase A | 1-10 | Shared API layer |
| Phase B | 11-27 | Core utilities |
| Phase C | 28-44 | Storage layer |
| Phase D | 45-64 | Remaining utils |
| Phase E | 65-75 | Shared hooks |
| Phase F | 76-81 | App providers |
| Phase G | 82-114 | App styles |
| Phase H | 115-150 | Features layer |
| Phase I | 151-154 | Test files |
| Phase J | 155-162 | Import updates |
| Phase K | 163-170 | Cleanup |
| **Total** | **170 steps** | Complete FSD migration |

---

*Phase 2 of Document Page Architecture Refactor*
