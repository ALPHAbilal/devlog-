Perfect! Now I have all the authoritative information. Let me create a comprehensive response with the exact configuration you need.

## FSD Architecture & Dependency-Cruiser Configuration

Based on the official [feature-sliced.design](https://feature-sliced.design/docs/reference/layers) documentation, here are your answers:

### 1. The 6 FSD Layers (Top to Bottom)[1]

| Layer | Purpose | Slices? | Imports From |
|-------|---------|---------|--------------|
| **App** | Global routing, themes, providers, framework setup | No (segments only) | Shared only; all segments can import each other |
| **Pages** | Page-level UI, URL-switched screens | Yes | Widgets, Features, Entities, Shared |
| **Widgets** | Large, reusable, self-contained UI blocks | Yes | Features, Entities, Shared |
| **Features** | Main user interactions & business logic | Yes | Entities, Shared |
| **Entities** | Business domain models (User, Post, Product) | Yes | Shared only (via public API / @x notation for cross-entity refs) |
| **Shared** | UI kit, libraries, API client, config, types | No (segments only) | Nothing (foundation layer) |

**Note:** The documentation mentions 7 layers including "Processes" (deprecated), so the **current active count is 6**.[1]

***

### 2. Can Slices Within the Same Layer Import Each Other?[1]

**NO** — with one important exception:

> **Import Rule on Layers:** "A module (file) in a slice can only import other slices when they are located on layers strictly below."[1]

This means `~/features/auth` **cannot** import from `~/features/checkout` (same layer).

**Exception:** **App and Shared layers are exceptions** — they don't have slices, only segments. Segments in these layers **can import each other freely**.[1]

**Legitimate Cross-Slice Imports:** For entities that must reference each other (e.g., User owns Orders), use the **`@x` notation** as a public API marker:[1]

```typescript
// entities/order/model/order.ts
export interface Order {
  userId: string;
}

// entities/order/index.ts (public API)
export type { Order } from "./model/order.ts";

// entities/user/model/user.ts
import type { Order } from "entities/order/@x/user";

export interface User {
  id: string;
  orders: Order[];
}

// entities/user/index.ts (public API)
export type { User } from "./model/user.ts";
```

***

### 3. Complete Dependency-Cruiser Config for FSD Enforcement

Here's a **production-ready** `dependency-cruiser.js` configuration that enforces the full FSD hierarchy:

```javascript
// dependency-cruiser.js - FSD Layer Boundary Enforcement

module.exports = {
  forbidden: [
    // ============================================================
    // 1. SHARED LAYER - No outbound dependencies
    // ============================================================
    {
      name: "shared-not-to-app",
      comment:
        "Shared layer cannot depend on App layer (bidirectional isolation)",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/app/" },
    },
    {
      name: "shared-not-to-entities",
      comment: "Shared layer cannot depend on Entities layer",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/entities/" },
    },
    {
      name: "shared-not-to-features",
      comment: "Shared layer cannot depend on Features layer",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/features/" },
    },
    {
      name: "shared-not-to-widgets",
      comment: "Shared layer cannot depend on Widgets layer",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/widgets/" },
    },
    {
      name: "shared-not-to-pages",
      comment: "Shared layer cannot depend on Pages layer",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/pages/" },
    },

    // ============================================================
    // 2. ENTITIES LAYER - Cannot import from higher layers
    // ============================================================
    {
      name: "entities-not-to-features",
      comment: "Entities cannot depend on Features layer",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/features/" },
    },
    {
      name: "entities-not-to-widgets",
      comment: "Entities cannot depend on Widgets layer",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/widgets/" },
    },
    {
      name: "entities-not-to-pages",
      comment: "Entities cannot depend on Pages layer",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/pages/" },
    },
    {
      name: "entities-not-to-app",
      comment: "Entities cannot depend on App layer",
      severity: "error",
      from: { path: "^src/entities/" },
      to: { path: "^src/app/" },
    },
    {
      name: "entities-not-to-entities",
      comment:
        "Entities cannot import from other entity slices (use @x notation for cross-references)",
      severity: "error",
      from: { path: "^src/entities/([^/]+)/" },
      to: {
        path: "^src/entities/",
        pathNot: "^src/entities/$1/|^src/entities/([^/]+)/@x/",
      },
    },

    // ============================================================
    // 3. FEATURES LAYER - Cannot import from Features or higher
    // ============================================================
    {
      name: "features-not-to-features",
      comment:
        "Features cannot import from other feature slices (slice isolation)",
      severity: "error",
      from: { path: "^src/features/([^/]+)/" },
      to: {
        path: "^src/features/",
        pathNot: "^src/features/$1/|^src/features/([^/]+)/@x/",
      },
    },
    {
      name: "features-not-to-widgets",
      comment: "Features cannot depend on Widgets layer",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/widgets/" },
    },
    {
      name: "features-not-to-pages",
      comment: "Features cannot depend on Pages layer",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/pages/" },
    },
    {
      name: "features-not-to-app",
      comment: "Features cannot depend on App layer",
      severity: "error",
      from: { path: "^src/features/" },
      to: { path: "^src/app/" },
    },

    // ============================================================
    // 4. WIDGETS LAYER - Cannot import from Widgets, Pages, or App
    // ============================================================
    {
      name: "widgets-not-to-widgets",
      comment: "Widgets cannot import from other widget slices (slice isolation)",
      severity: "error",
      from: { path: "^src/widgets/([^/]+)/" },
      to: {
        path: "^src/widgets/",
        pathNot: "^src/widgets/$1/|^src/widgets/([^/]+)/@x/",
      },
    },
    {
      name: "widgets-not-to-pages",
      comment: "Widgets cannot depend on Pages layer",
      severity: "error",
      from: { path: "^src/widgets/" },
      to: { path: "^src/pages/" },
    },
    {
      name: "widgets-not-to-app",
      comment: "Widgets cannot depend on App layer",
      severity: "error",
      from: { path: "^src/widgets/" },
      to: { path: "^src/app/" },
    },

    // ============================================================
    // 5. PAGES LAYER - Cannot import from Pages or App
    // ============================================================
    {
      name: "pages-not-to-pages",
      comment: "Pages cannot import from other page slices (page isolation)",
      severity: "error",
      from: { path: "^src/pages/([^/]+)/" },
      to: {
        path: "^src/pages/",
        pathNot: "^src/pages/$1/",
      },
    },
    {
      name: "pages-not-to-app",
      comment: "Pages cannot depend on App layer",
      severity: "error",
      from: { path: "^src/pages/" },
      to: { path: "^src/app/" },
    },

    // ============================================================
    // 6. APP LAYER - Cannot import from anywhere
    // ============================================================
    {
      name: "app-not-circular",
      comment:
        "App layer is the entry point and should not import business logic layers (only coordinate them)",
      severity: "warn",
      from: { path: "^src/app/" },
      to: {
        path: "^src/(entities|features|widgets|pages|shared)/([^/]+)/",
        pathNot: "^src/shared/",
      },
    },

    // ============================================================
    // 7. PUBLIC API ENFORCEMENT
    // ============================================================
    {
      name: "direct-slice-imports-forbidden",
      comment:
        "Avoid importing internal files; use the slice's public API (index.ts) instead",
      severity: "warn",
      from: {},
      to: {
        path: "^src/(entities|features|widgets|pages)/[^/]+/(?!index\\.ts|@x/)[^/]+/[^/]+\\.(ts|tsx|js|jsx)$",
        pathNot:
          "^src/(entities|features|widgets|pages)/[^/]+/(ui|api|model|lib|config)/",
      },
    },

    // ============================================================
    // 8. CIRCULAR DEPENDENCY PREVENTION
    // ============================================================
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],

  // Optional: Allowed rules (inverse whitelist approach)
  allowed: [
    {
      from: { path: "^src/app/" },
      to: { path: "^src/shared/" },
    },
    {
      from: { path: "^src/pages/" },
      to: { path: "^src/(widgets|features|entities|shared)/" },
    },
    {
      from: { path: "^src/widgets/" },
      to: { path: "^src/(features|entities|shared)/" },
    },
    {
      from: { path: "^src/features/" },
      to: { path: "^src/(entities|shared)/" },
    },
    {
      from: { path: "^src/entities/" },
      to: { path: "^src/shared/" },
    },
    {
      from: { path: "^src/shared/" },
      to: { path: "^src/shared/" },
    },
  ],

  options: {
    doNotFollow: "node_modules",
    exclude: "(node_modules|dist|build|\\.(test|spec)\\.(ts|tsx|js|jsx)$)",
    maxDepth: Infinity,
    reporterOptions: {
      dot: { collapsePattern: "^(node_modules|src/shared)" },
    },
  },
};
```

***

### Key Configuration Highlights

| Rule | Enforcement | Exception |
|------|-------------|-----------|
| **Slice Isolation** | `entities-not-to-entities`, `features-not-to-features`, etc. | Use `@x` notation for legitimate cross-references |
| **Layer Direction** | All upward dependencies forbidden | Strictly one-way downward |
| **App Layer** | No business logic imports | Only coordinates shared & pages |
| **Shared Layer** | No outbound dependencies | Internal segments can cross-import |
| **Public API** | Direct imports to slice internals warned | Always use `slice/index.ts` |

***

### Usage

```bash
# Check violations
npx depcruise --config dependency-cruiser.js src/

# Generate graph
npx depcruise --config dependency-cruiser.js --output-type dot src/ | dot -T svg > dependencies.svg

# In CI/CD
npx depcruise --config dependency-cruiser.js --exit-code fail src/
```

This configuration enforces **true FSD isolation** while allowing legitimate cross-references via the `@x` notation pattern.[2][3][1]
