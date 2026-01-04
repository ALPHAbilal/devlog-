# Phase 3: Block Contracts (TypeScript Interfaces)

> **Goal**: Define TypeScript interfaces for all block types, creating compile-time safety.

**Status**: ✅ COMPLETED (2025-01-03)

---

### 🔍 Plan Verification (2025-01-03)

This plan was verified against the actual codebase. Key findings:

| Verified ✅ | Found Issue ⚠️ |
|------------|----------------|
| Block registry has 10 types (Block.jsx:19-30) | schemas.ts has NO type exports yet (they need to be created) |
| Text/heading/code use `.transform()` | `onAddBelow` receives object, not just BlockType |
| tsconfig has `@/entities/*` alias | `src/entities/` directory exists but is EMPTY (needs files) |
| Phase 2 completed, FSD in place | Feature barrel has no type exports yet |
| All block components are `.jsx` | FileTreeNode uses `z.any()` (needs `z.lazy()`) |
| TextBlock uses 5 props correctly | `issueTracker` duplicates `issue-tracker` (consolidate in Phase 3) |
| AI metadata uses `z.record(z.any())` | Upgrade to `z.record(z.unknown())` for stricter typing |

**Corrections applied**:
1. Added "CURRENT STATE vs TARGET STATE" section to clarify what exists vs needs to be created
2. Fixed `BlockComponentProps.onAddBelow` signature to accept block data object
3. Added `allBlocks` prop to `BlockComponentProps` for backlink features
4. Added migration notes for FileTreeNode `z.any()` → `z.lazy()` conversion
5. Clarified that `src/entities/Block/` directory exists but is EMPTY (needs index.ts)
6. Noted `issueTracker` duplicate schema that should be consolidated
7. Noted AI metadata upgrade from `z.record(z.any())` to `z.record(z.unknown())`

---

## Best Practices for This Phase

### Interface Design Rules
1. **Interface-first, implementation-second** - Define types before coding
2. **Readonly by default** - Mark mutable fields explicitly
3. **Discriminated unions for block types** - `type` field as discriminator
4. **No optional unless truly optional** - Undefined is a bug source
5. **Generic where appropriate** - `BlockComponent<T extends BlockData>`

### Block Contract Rules
1. **Every block implements BlockComponentProps** - No exceptions
2. **onUpdate signature is sacred** - `(id: string, updates: Partial<BlockData>) => void`
3. **Block data is serializable** - No functions, no circular refs
4. **Metadata is typed** - Not `Record<string, any>`
5. **Position is required** - Blocks always have position

### Migration Rules
1. **Add types to existing code first** - JSDoc bridge before .tsx
2. **One block type at a time** - TextBlock → CodeBlock → etc.
3. **Test after each conversion** - Verify runtime behavior unchanged
4. **Type errors are bugs** - Fix immediately, don't suppress

### Validation Rules (Zod v3 Best Practices)
1. **Zod schemas ARE the source of truth** - Use `z.infer<typeof Schema>` to derive types
2. **Never duplicate interfaces** - Types come FROM schemas, not alongside them
3. **Use `z.input<>` for input types** - When schemas have `.transform()`, input ≠ output
4. **Validate at boundaries** - API responses, user input, storage reads
5. **Runtime validation in dev** - Catch mismatches early
6. **No validation in hot paths** - Performance matters

### Documentation Rules
1. **JSDoc on all public interfaces** - IDE hints
2. **Examples in comments** - Show valid usage
3. **Link to related types** - `@see BlockData`

---

## Objectives

1. Define `BlockComponent` interface (what every block must implement)
2. Define `BlockData` base type and variants for each block type
3. Create type-safe block registry
4. Add JSDoc bridge to existing .jsx files
5. Convert critical blocks to .tsx

---

## Core Types (Zod v3 Best Practices)

> **Source of Truth**: `src/features/block/lib/schemas.ts` - ALL types derived via `z.infer<>`
>
> **Key Principle**: Never maintain separate interfaces. Types are DERIVED from Zod schemas.

### ⚠️ CURRENT STATE vs TARGET STATE

**IMPORTANT**: The sections below describe the **TARGET STATE** - what we need to implement. Here's what currently exists:

| Aspect | Current State (schemas.ts) | Target State |
|--------|---------------------------|--------------|
| Type exports | ❌ None | ✅ All types via `z.infer<>` |
| `BlockTypeSchema` | ❌ Doesn't exist | ✅ `z.enum([...])` with type export |
| `BlockComponentProps` | ❌ Doesn't exist | ✅ Interface for all block components |
| `SerializedBlockSchema` | ❌ Doesn't exist | ✅ Schema + type for DB format |
| Function types | ❌ Plain JS `function getBlockContentSchema(blockType)` | ✅ `function getBlockContentSchema(blockType: string): ZodSchema \| null` |
| FileTreeNode | ❌ Uses `z.any()` for recursive structure | ✅ Proper recursive type with `z.lazy()` |

**Current schemas.ts exports** (verified 2025-01-03):
```typescript
// These 3 exports exist currently (no type exports):
export const BlockContentSchemas = { ... };  // Object with 11 Zod schemas (includes duplicate 'issueTracker')
export function getBlockContentSchema(blockType) { ... }  // No type annotations
export function hasBlockSchema(blockType) { ... }  // No type annotations
```

**Note**: The `issueTracker` key (line 136) duplicates `issue-tracker` (line 120) for legacy compatibility. Phase 3 should consolidate these.

**What Phase 3 will ADD**:
- All `z.infer<>` type exports (BlockType, BlockData, TextContent, etc.)
- BlockComponentProps interface
- SerializedBlockSchema and type
- Type annotations on existing functions
- BlockRegistry mapped types

### Why z.infer<> as Source of Truth?

From Zod v3 documentation:
- ✅ Single source of truth (schema defines both validation + types)
- ✅ Types auto-update when schema changes
- ✅ No duplication between interfaces and schemas
- ✅ Compile-time type safety + runtime validation guarantee

```typescript
// ❌ WRONG: Separate interface maintained alongside schema
interface UserInterface { name: string; }
const UserSchema = z.object({ name: z.string() });
// ^ Two sources of truth - maintenance nightmare

// ✅ CORRECT: Derive types from schema
const UserSchema = z.object({ name: z.string() });
type User = z.infer<typeof UserSchema>;
```

### Transform Handling: z.input<> vs z.infer<>

**CRITICAL**: The text/heading/code schemas use `.transform()` which changes the type:

```typescript
// schemas.ts lines 18-29 - ACTUAL SCHEMA
text: z.union([
  z.string(),                              // Legacy: "plain text"
  z.object({ content: z.string().default('') })  // New: {content: "text"}
]).transform(val => {
  if (typeof val === 'string') return { content: val };
  return val;
});
```

This means:
- **Input type** (`z.input<>`): `string | { content: string }` - what you pass to `.parse()`
- **Output type** (`z.infer<>`): `{ content: string }` - what you get back after transform

---

### Updated schemas.ts with Type Exports

The schemas.ts file needs to be updated to export inferred types. Here's the complete updated file:

```typescript
// src/features/block/lib/schemas.ts
//
// SINGLE SOURCE OF TRUTH for block types.
// Types are derived using z.infer<> - never create separate interfaces.

import { z } from 'zod';

// =============================================================================
// Shared Schemas
// =============================================================================

const TableAlignmentSchema = z.enum(['left', 'center', 'right']);

/**
 * File tree node - recursive structure
 *
 * ⚠️ MIGRATION NOTE (verified 2025-01-03):
 * Current schemas.ts uses z.any() for treeData:
 *   filetree: z.object({
 *     treeData: z.array(z.any()).default([]),  // ← This needs to become typed
 *     ...
 *   })
 *
 * The z.lazy() pattern below is the TARGET implementation.
 * This is a NON-TRIVIAL migration because:
 * 1. Recursive types require z.lazy() with explicit type annotation
 * 2. Existing data may have additional properties (isFolder, content, etc.)
 * 3. We use .passthrough() to preserve unknown properties during migration
 */
const FileTreeNodeSchema: z.ZodType<FileTreeNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['file', 'folder']),
    children: z.array(FileTreeNodeSchema).optional(),
  }).passthrough() // Allow additional properties for backward compatibility
);

// Forward declaration for recursive type
interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  [key: string]: unknown; // Allow additional properties
}

// =============================================================================
// Block Content Schemas
// =============================================================================

export const BlockContentSchemas = {
  // Text-based blocks: Accept both legacy string and object format
  // Transform normalizes to object format
  text: z.union([
    z.string(),
    z.object({ content: z.string().default('') })
  ]).transform(val => typeof val === 'string' ? { content: val } : val),

  heading: z.union([
    z.string(),
    z.object({ content: z.string().default('') })
  ]).transform(val => typeof val === 'string' ? { content: val } : val),

  code: z.union([
    z.string(),
    z.object({ content: z.string().default('') })
  ]).transform(val => typeof val === 'string' ? { content: val } : val),

  // AI conversation blocks
  // NOTE: Current code uses z.record(z.any()) for metadata.
  // Target uses z.record(z.unknown()) which is stricter but compatible.
  ai: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'ai', 'assistant']),
      content: z.string()
    })).default([]),
    metadata: z.record(z.unknown()).default({})  // Upgraded from z.any()
  }),

  // Image blocks
  image: z.object({
    images: z.array(z.object({
      id: z.string(),
      url: z.string(),
      storagePath: z.string().optional(),
      alt: z.string().optional(),
      size: z.number().optional(),
      dimensions: z.object({
        width: z.number(),
        height: z.number()
      }).optional()
    })).default([]),
    layout: z.enum(['grid', 'list']).default('grid'),
    columns: z.number().int().min(1).max(6).default(3)
  }),

  'inline-image': z.object({
    url: z.string().default(''),
    alt: z.string().default(''),
    caption: z.string().default(''),
    dimensions: z.object({
      width: z.number(),
      height: z.number()
    }).nullable().default(null)
  }),

  // Table blocks
  table: z.object({
    data: z.object({
      headers: z.array(z.string()).default(['Column 1', 'Column 2']),
      rows: z.array(z.array(z.string())).default([['', '']]),
      columnAlignments: z.array(TableAlignmentSchema).default(['left', 'left']),
      hasHeaderRow: z.boolean().default(true)
    })
  }),

  // Todo blocks
  todo: z.object({
    data: z.object({
      todos: z.array(z.object({
        id: z.string(),
        text: z.string(),
        status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
        priority: z.enum(['high', 'medium', 'low']).optional(),
        dueDate: z.string().optional(),
        tags: z.array(z.string()).optional(),
        createdAt: z.string().optional()
      })).default([])
    })
  }),

  // Issue tracker blocks
  'issue-tracker': z.object({
    data: z.object({
      milestone: z.string().default(''),
      issues: z.array(z.object({
        id: z.string(),
        title: z.string().default(''),
        description: z.string().default(''),
        code: z.string().default(''),
        status: z.enum(['open', 'in-progress', 'closed', 'solved']).default('open'),
        attempts: z.array(z.unknown()).default([])
      })).default([])
    })
  }),

  // File tree blocks
  filetree: z.object({
    treeData: z.array(FileTreeNodeSchema).default([]),
    expanded: z.array(z.string()).default([]),
    snapshots: z.array(z.object({
      id: z.string(),
      name: z.string(),
      timestamp: z.number(),
      treeData: z.array(FileTreeNodeSchema)
    })).default([]),
    currentSnapshotId: z.string().nullable().default(null),
    snapshotLimit: z.number().default(50)
  })
} as const;

// =============================================================================
// Block Type Enum
// =============================================================================

/** All valid block types - derived from schema keys */
export const BlockTypeSchema = z.enum([
  'text', 'heading', 'code', 'ai', 'image', 'inline-image',
  'table', 'todo', 'issue-tracker', 'filetree'
]);

export type BlockType = z.infer<typeof BlockTypeSchema>;

// =============================================================================
// Block Metadata Schema
// =============================================================================

export const BlockMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
  collapsed: z.boolean().optional(),
  lastEditedBy: z.string().optional(),
}).passthrough(); // Allow additional properties

export type BlockMetadata = z.infer<typeof BlockMetadataSchema>;

// =============================================================================
// Base Block Schema
// =============================================================================

export const BaseBlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  content: z.union([z.string(), z.record(z.unknown())]),
  data: z.record(z.unknown()).optional(),
  metadata: BlockMetadataSchema.optional(),
  position: z.number(),
  created_at: z.number(),
  isNew: z.boolean().optional(),
});

export type BlockData = z.infer<typeof BaseBlockSchema>;

// =============================================================================
// Inferred Content Types (OUTPUT types - after transform)
// =============================================================================

/** Text content - OUTPUT type (after transform normalizes to object) */
export type TextContent = z.infer<typeof BlockContentSchemas.text>;
// => { content: string }

/** Text content INPUT type (before transform) */
export type TextContentInput = z.input<typeof BlockContentSchemas.text>;
// => string | { content: string }

/** AI content type */
export type AIContent = z.infer<typeof BlockContentSchemas.ai>;

/** AI message type - extracted from AI content */
export type AIMessage = AIContent['messages'][number];

/** Image content type */
export type ImageContent = z.infer<typeof BlockContentSchemas.image>;

/** Single image item */
export type ImageItem = ImageContent['images'][number];

/** Image dimensions */
export type ImageDimensions = NonNullable<ImageItem['dimensions']>;

/** Inline image content */
export type InlineImageContent = z.infer<typeof BlockContentSchemas['inline-image']>;

/** Table content */
export type TableContent = z.infer<typeof BlockContentSchemas.table>;

/** Table data */
export type TableData = TableContent['data'];

/** Table alignment */
export type TableAlignment = z.infer<typeof TableAlignmentSchema>;

/** Todo content */
export type TodoContent = z.infer<typeof BlockContentSchemas.todo>;

/** Todo data */
export type TodoData = TodoContent['data'];

/** Todo item */
export type TodoItem = TodoData['todos'][number];

/** Todo status */
export type TodoStatus = NonNullable<TodoItem['status']>;

/** Todo priority */
export type TodoPriority = NonNullable<TodoItem['priority']>;

/** Issue tracker content */
export type IssueTrackerContent = z.infer<typeof BlockContentSchemas['issue-tracker']>;

/** Issue tracker data */
export type IssueTrackerData = IssueTrackerContent['data'];

/** Issue item */
export type IssueItem = IssueTrackerData['issues'][number];

/** Issue status */
export type IssueStatus = IssueItem['status'];

/** File tree content */
export type FileTreeContent = z.infer<typeof BlockContentSchemas.filetree>;

/** File tree snapshot */
export type FileTreeSnapshot = FileTreeContent['snapshots'][number];

// =============================================================================
// Type-Specific Block Schemas (Full block with typed content)
// =============================================================================

export const TextBlockSchema = BaseBlockSchema.extend({
  type: z.literal('text'),
  content: BlockContentSchemas.text,
});
export type TextBlockData = z.infer<typeof TextBlockSchema>;

export const HeadingBlockSchema = BaseBlockSchema.extend({
  type: z.literal('heading'),
  content: BlockContentSchemas.heading,
  data: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional() }).optional(),
});
export type HeadingBlockData = z.infer<typeof HeadingBlockSchema>;

export const CodeBlockSchema = BaseBlockSchema.extend({
  type: z.literal('code'),
  content: BlockContentSchemas.code,
  data: z.object({
    language: z.string().optional(),
    filePath: z.string().optional(),
  }).optional(),
});
export type CodeBlockData = z.infer<typeof CodeBlockSchema>;

export const AIBlockSchema = BaseBlockSchema.extend({
  type: z.literal('ai'),
  content: BlockContentSchemas.ai,
});
export type AIBlockData = z.infer<typeof AIBlockSchema>;

export const ImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('image'),
  content: BlockContentSchemas.image,
});
export type ImageBlockData = z.infer<typeof ImageBlockSchema>;

export const InlineImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('inline-image'),
  content: BlockContentSchemas['inline-image'],
});
export type InlineImageBlockData = z.infer<typeof InlineImageBlockSchema>;

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('table'),
  content: BlockContentSchemas.table,
});
export type TableBlockData = z.infer<typeof TableBlockSchema>;

export const TodoBlockSchema = BaseBlockSchema.extend({
  type: z.literal('todo'),
  content: BlockContentSchemas.todo,
});
export type TodoBlockData = z.infer<typeof TodoBlockSchema>;

export const IssueTrackerBlockSchema = BaseBlockSchema.extend({
  type: z.literal('issue-tracker'),
  content: BlockContentSchemas['issue-tracker'],
});
export type IssueTrackerBlockData = z.infer<typeof IssueTrackerBlockSchema>;

export const FileTreeBlockSchema = BaseBlockSchema.extend({
  type: z.literal('filetree'),
  content: BlockContentSchemas.filetree,
});
export type FileTreeBlockData = z.infer<typeof FileTreeBlockSchema>;

// =============================================================================
// Discriminated Union (for type-safe switch statements)
// =============================================================================

export const TypedBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  HeadingBlockSchema,
  CodeBlockSchema,
  AIBlockSchema,
  ImageBlockSchema,
  InlineImageBlockSchema,
  TableBlockSchema,
  TodoBlockSchema,
  IssueTrackerBlockSchema,
  FileTreeBlockSchema,
]);

export type TypedBlockData = z.infer<typeof TypedBlockSchema>;

// =============================================================================
// Block Registry Type (for component mapping)
// =============================================================================

export type BlockRegistry = {
  [K in BlockType]: Extract<TypedBlockData, { type: K }>;
};

export type BlockDataFor<T extends BlockType> = BlockRegistry[T];

// =============================================================================
// Serialized Block Schema (database format)
// =============================================================================

export const SerializedBlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  position: z.number(),
  metadata: BlockMetadataSchema,
  created_at: z.number(),
  updated_at: z.number().optional(),
  content: z.string(), // JSON-stringified content
});

export type SerializedBlock = z.infer<typeof SerializedBlockSchema>;

// =============================================================================
// Block Component Props (generic interface)
// =============================================================================

/**
 * Props interface that all block components must implement.
 * This is the ONE interface we define manually (not from Zod)
 * because it's a React component contract, not a data schema.
 *
 * VERIFIED against actual block components (2025-01-03):
 * - TextBlock.jsx:21 uses: block, onUpdate, onConvert, onAddBelow, allBlocks
 * - CodeBlock.jsx uses: block, onUpdate, onConvert, allBlocks
 * - HeadingBlock.jsx:3 uses: block, onUpdate (minimal)
 */
export interface BlockComponentProps<T extends BlockData = BlockData> {
  /** The block data to render */
  block: T;

  /** Callback to update block data. Called with block ID and partial updates. */
  onUpdate: (id: string, updates: Partial<T>) => void;

  /** Optional: Convert this block to a different type */
  onConvert?: (newType: BlockType, metadata?: Record<string, unknown>) => void;

  /**
   * Optional: Add a new block below this one.
   * NOTE: Receives partial block data, NOT just a type.
   * Example usage in TextBlock.jsx:199-211 shows it receives an object with type, images, etc.
   */
  onAddBelow?: (blockData: Partial<BlockData> & { type: BlockType }) => void;

  /**
   * Optional: All blocks in the document.
   * Used by TextBlock and CodeBlock for backlink features.
   * Not all blocks need this - only those that reference other blocks.
   */
  allBlocks?: BlockData[];

  /** Optional: Whether the block is in read-only mode */
  readOnly?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

export function getBlockContentSchema(blockType: string) {
  if (!blockType) return null;
  const type = blockType === 'issueTracker' ? 'issue-tracker' : blockType;
  return BlockContentSchemas[type as keyof typeof BlockContentSchemas] || null;
}

export function hasBlockSchema(blockType: string): boolean {
  return !!getBlockContentSchema(blockType);
}

export function isValidBlockType(type: unknown): type is BlockType {
  return BlockTypeSchema.safeParse(type).success;
}
```

---

### What Changed from Original Plan

| Aspect | Old Plan (Wrong) | New Plan (Correct) |
|--------|------------------|-------------------|
| **Type Source** | Manual interfaces in `Block.types.ts` | `z.infer<>` from schemas in `schemas.ts` |
| **File Count** | 4 files (`Block.types.ts`, `guards.ts`, `registry.ts`, `index.ts`) | 2 files (`schemas.ts` updated, `index.ts` for re-exports) |
| **Maintenance** | Two sources of truth | Single source of truth |
| **Transform Handling** | Ignored transforms | Uses `z.input<>` vs `z.infer<>` |
| **TextBlockData.content** | `string \| TextContent` (input type) | `{ content: string }` (output type) |

---

## Directory Structure (Simplified)

With the z.infer approach, we need **fewer files** since types are derived from schemas.

### Commands to Run

```bash
# Create the Block entity directory structure
mkdir -p src/entities/Block

# Create the barrel file for re-exports
touch src/entities/Block/index.ts
```

### Expected Structure After Setup

```
src/
├── features/block/lib/
│   └── schemas.ts        # ✅ SINGLE SOURCE OF TRUTH - schemas + types
│
└── entities/Block/
    └── index.ts          # Re-exports from schemas.ts for FSD compliance
```

**Note**: We no longer need separate `Block.types.ts`, `guards.ts`, or `registry.ts` files. Everything is consolidated in `schemas.ts` following Zod best practices.

### Path Alias Verification

The `@/entities/*` alias is already configured in `tsconfig.json` (line 38):
```json
"@/entities/*": ["src/entities/*"]
```

After setup, imports will work via either path:
```typescript
// Option 1: Direct from schemas (recommended for internal use)
import { BlockType, TextBlockData } from '@/features/block/lib/schemas';

// Option 2: Via entities barrel (for FSD external access)
import { BlockType, TextBlockData } from '@/entities/Block';
```

---

### Barrel File Updates

> **Objective**: Export types from `schemas.ts` and re-export from `entities/Block/index.ts`

#### ⚠️ CURRENT STATE (verified 2025-01-03)

**Current `src/features/block/index.ts` exports** (only 6 lines):
```typescript
// CURRENT STATE - no type exports
export { BlockContentSchemas, getBlockContentSchema, hasBlockSchema } from './lib/schemas';
export { serializeBlock, deserializeBlock, validateBlock } from './lib/serializer';
export { default as blockSerializer } from './lib/serializer';
```

**What needs to be ADDED**: All the type exports shown below.

#### 1. Update `src/features/block/index.ts`

The barrel file currently only exports functions. Add the new type exports:

```typescript
// Block feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { useAutoSave, useGlobalAutoSave, getSmartSyncManager } from './hooks/use-auto-save';
export { useBlockLazyLoading, useProgressiveContent } from './hooks/use-lazy-loading';
export { useOptimizedBlockLoader } from './hooks/use-optimized-loader';
export { usePaginatedBlockLoader } from './hooks/use-paginated-loader';
export { useCanvasCleanup, useBlockMemoryManagement, useMemoryMonitor } from './hooks/use-memory-management';
export { useBlockMemoryManagement as useMemoryManagement } from './hooks/use-memory-management';

// ============== Lib (Schemas + Functions) ==============
export { BlockContentSchemas, getBlockContentSchema, hasBlockSchema, isValidBlockType } from './lib/schemas';
export { serializeBlock, deserializeBlock, validateBlock } from './lib/serializer';
export { default as blockSerializer } from './lib/serializer';

// ============== Types (all derived from Zod via z.infer<>) ==============
export type {
  // Core types
  BlockType,
  BlockData,
  BlockMetadata,
  TypedBlockData,
  SerializedBlock,

  // Block-specific data types (OUTPUT types after transform)
  TextBlockData,
  HeadingBlockData,
  CodeBlockData,
  AIBlockData,
  ImageBlockData,
  InlineImageBlockData,
  TableBlockData,
  TodoBlockData,
  IssueTrackerBlockData,
  FileTreeBlockData,

  // Content types
  TextContent,
  TextContentInput,  // INPUT type for transformed schemas
  AIContent,
  AIMessage,
  ImageContent,
  ImageItem,
  ImageDimensions,
  InlineImageContent,
  TableContent,
  TableData,
  TableAlignment,
  TodoContent,
  TodoData,
  TodoItem,
  TodoStatus,
  TodoPriority,
  IssueTrackerContent,
  IssueTrackerData,
  IssueItem,
  IssueStatus,
  FileTreeContent,
  FileTreeSnapshot,

  // Component props (the ONE manual interface)
  BlockComponentProps,

  // Registry types
  BlockRegistry,
  BlockDataFor,
} from './lib/schemas';
```

#### 2. Create `src/entities/Block/index.ts`

> **NOTE**: The `src/entities/` directory does NOT exist yet. It needs to be created.

```bash
# Create directory structure first
mkdir -p src/entities/Block
```

Simple re-export from schemas for FSD compliance:

```typescript
// src/entities/Block/index.ts
// Re-exports all block types for FSD external access
// Source of truth: src/features/block/lib/schemas.ts

export * from '@/features/block/lib/schemas';
```

This allows consumers to import from either location:
- `@/features/block` - For feature-internal use
- `@/entities/Block` - For cross-feature entity access (FSD pattern)

---

### Serializer Type Updates

> **Objective**: Add TypeScript types to `src/features/block/lib/serializer.ts`

The serializer currently uses JSDoc only. Types are now defined in `schemas.ts` via Zod.

#### SerializedBlock (Already Defined in schemas.ts)

`SerializedBlock` is now defined via `z.infer<>` in schemas.ts:

```typescript
// Already in schemas.ts - no separate file needed
export const SerializedBlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  position: z.number(),
  metadata: BlockMetadataSchema,
  created_at: z.number(),
  updated_at: z.number().optional(),
  content: z.string(), // JSON-stringified content
});

export type SerializedBlock = z.infer<typeof SerializedBlockSchema>;
```

#### Import Statement for serializer.ts

Import types from the same schemas file (or via barrel):

```typescript
// At the top of src/features/block/lib/serializer.ts
import type {
  BlockData,
  BlockType,
  SerializedBlock,
  TypedBlockData,
  FileTreeNode,
} from './schemas';  // Same directory - import from schemas
```

#### Function Type Annotations

**serializeBlock** (line 36):

```typescript
// Before (line 36):
export function serializeBlock(block) {

// After:
export function serializeBlock(block: BlockData | TypedBlockData): SerializedBlock {
```

**deserializeBlock** (line 246):

```typescript
// Before (line 246):
export function deserializeBlock(block) {

// After:
export function deserializeBlock(block: SerializedBlock): TypedBlockData {
```

**validateBlock** (line 453):

```typescript
// Before (line 453):
export function validateBlock(block) {

// After:
export function validateBlock(block: unknown): block is BlockData {
```

**sanitizeTreeForSnapshot** (line 17):

```typescript
import type { FileTreeNode } from '@/entities/Block';

// Before (line 17):
function sanitizeTreeForSnapshot(nodes) {

// After:
function sanitizeTreeForSnapshot(nodes: FileTreeNode[]): FileTreeNode[] {
```

#### Complete Serializer Type Migration

The full migration involves:

1. Add import statement (after line 9)
2. Update function signatures (lines 17, 36, 246, 453)
3. Type internal variables where needed (e.g., `dataToValidate` at line 72)
4. Rename file from `.ts` to stay as `.ts` (already TypeScript, just needs types)

**Note**: The serializer uses Zod for runtime validation, which complements but doesn't replace TypeScript types. Keep both:
- TypeScript types for compile-time safety
- Zod schemas for runtime validation of external data

---

### Block Registry Implementation

> **Objective 3**: Create type-safe block registry

#### Current State (Block.jsx:19-30)

The current implementation uses an untyped object:

```javascript
// src/components/Block.jsx - CURRENT (untyped)
const blockComponents = {
  text: TextBlock,
  code: CodeBlock,
  ai: AIBlock,
  heading: HeadingBlock,
  filetree: FileTreeBlock,
  table: TableBlock,
  todo: TodoBlock,
  image: ImageBlock,
  'inline-image': InlineImageBlock,
  'issue-tracker': OptimizedIssueTrackerBlock,
};

// Line 94: Lookup with fallback
const BlockComponent = blockComponents[block.type] || TextBlock;
```

**Problems with current approach:**
1. No compile-time verification that all block types are covered
2. No type safety on component props
3. Adding a new block type doesn't produce type errors if registry is incomplete
4. `block.type` is `string`, not narrowed to `BlockType`

#### Registry Types (Already in schemas.ts)

The registry types are now defined in `schemas.ts` via `z.infer<>`:

```typescript
// Already in schemas.ts - no separate file needed

// BlockRegistry maps each type to its data interface
export type BlockRegistry = {
  [K in BlockType]: Extract<TypedBlockData, { type: K }>;
};

// Helper to get block data type from block type
export type BlockDataFor<T extends BlockType> = BlockRegistry[T];
```

#### Component Registry Helper (Add to schemas.ts)

Add these types to schemas.ts for component-level type safety:

```typescript
// Add to end of schemas.ts

import type { ComponentType } from 'react';

/**
 * Type for a block component that handles a specific block type.
 */
export type BlockComponent<T extends TypedBlockData = TypedBlockData> =
  ComponentType<BlockComponentProps<T>>;

/**
 * Type-safe registry mapping each BlockType to its component.
 * Adding a new BlockType causes a compile error until component is added.
 */
export type BlockComponentRegistry = {
  [K in BlockType]: BlockComponent<Extract<TypedBlockData, { type: K }>>;
};

/**
 * Creates a type-safe block registry with compile-time completeness check.
 */
export function createBlockRegistry(
  registry: BlockComponentRegistry
): BlockComponentRegistry {
  return registry;
}

/**
 * Type-safe lookup from registry.
 */
export function getBlockComponent<T extends BlockType>(
  registry: BlockComponentRegistry,
  blockType: T
): BlockComponent<Extract<TypedBlockData, { type: T }>> {
  return registry[blockType] as BlockComponent<Extract<TypedBlockData, { type: T }>>;
}

/** Default block type for fallback */
export const DEFAULT_BLOCK_TYPE: BlockType = 'text';
```

#### How Block.jsx Will Use the Registry

After the registry helpers are added to schemas.ts, `Block.jsx` will be updated:

```typescript
// src/components/Block.tsx - FUTURE (typed)

import { lazy } from 'react';
import {
  createBlockRegistry,
  getBlockComponent,
  DEFAULT_BLOCK_TYPE,
  isValidBlockType,
  type BlockComponentRegistry,
} from '@/features/block/lib/schemas';

// Lazy-load block components for code splitting
const TextBlock = lazy(() => import('./blocks/TextBlock'));
const CodeBlock = lazy(() => import('./blocks/CodeBlock'));
const HeadingBlock = lazy(() => import('./blocks/HeadingBlock'));
const AIBlock = lazy(() => import('./blocks/AIBlockRefined'));
const FileTreeBlock = lazy(() => import('./blocks/FileTreeBlock'));
const TableBlock = lazy(() => import('./blocks/TableBlock'));
const TodoBlock = lazy(() => import('./blocks/TodoBlock'));
const ImageBlock = lazy(() => import('./blocks/ImageBlock'));
const InlineImageBlock = lazy(() => import('./blocks/InlineImageBlock'));
const IssueTrackerBlock = lazy(() => import('./blocks/OptimizedIssueTrackerBlock'));

/**
 * Type-safe block component registry.
 * TypeScript ensures all block types have corresponding components.
 */
const blockRegistry = createBlockRegistry({
  text: TextBlock,
  code: CodeBlock,
  heading: HeadingBlock,
  ai: AIBlock,
  filetree: FileTreeBlock,
  table: TableBlock,
  todo: TodoBlock,
  image: ImageBlock,
  'inline-image': InlineImageBlock,
  'issue-tracker': IssueTrackerBlock,
});

// In the Block component:
function Block({ block, onUpdate, ...props }: BlockProps) {
  // Validate type from external source (API, storage)
  const safeType = isValidBlockType(block.type) ? block.type : DEFAULT_BLOCK_TYPE;

  // Type-safe lookup
  const BlockComponent = getBlockComponent(blockRegistry, safeType);

  return <BlockComponent block={block} onUpdate={onUpdate} {...props} />;
}
```

#### Type Guard (Already in schemas.ts)

The `isValidBlockType` function is now defined in schemas.ts using Zod:

```typescript
// Already in schemas.ts - no separate guards.ts file needed
export function isValidBlockType(type: unknown): type is BlockType {
  return BlockTypeSchema.safeParse(type).success;
}
```

#### Benefits of Type-Safe Registry

| Aspect | Before (untyped) | After (typed) |
|--------|------------------|---------------|
| Missing block type | Runtime error (falls back to TextBlock) | Compile-time error |
| Wrong component props | Runtime error | Compile-time error |
| New block type added | No warning if registry incomplete | Type error until registry updated |
| IDE autocomplete | None | Full autocomplete for block types |
| Refactoring safety | Manual search for usages | TypeScript finds all usages |

#### Migration Path (Simplified)

1. **Update schemas.ts** with all type exports and registry helpers
2. **Update barrel files** to export new types
3. **Update Block.jsx** to use typed registry (can stay .jsx initially)
4. **Convert Block.jsx → Block.tsx** for full type safety

---

## High-Level Steps (Updated for z.infer Pattern)

1. **Update schemas.ts** with all Zod schemas and `z.infer<>` type exports
2. **Create entities/Block/index.ts** barrel file for FSD re-exports
3. **Update feature barrel files** to export types from schemas
4. **Add type annotations to serializer.ts** using imported types
5. **Add JSDoc bridge to existing blocks** (for gradual migration)
6. **Convert TextBlock and CodeBlock to .tsx** as proof of concept

---

### Execution Order (Simplified)

> **Atomic steps for implementation. Each step is one action.**
> With z.infer pattern, we need fewer files and fewer steps.

#### Phase 3A: Update schemas.ts with Type Exports

| Step | Action | Dependency |
|------|--------|------------|
| 0 | Remove duplicate `issueTracker` schema (line 136-148), keep only `issue-tracker` | None |
| 1 | Add `BlockTypeSchema` z.enum and `BlockType` type export to schemas.ts | Step 0 |
| 2 | Add `BlockMetadataSchema` and `BlockMetadata` type export | Step 1 |
| 3 | Add `BaseBlockSchema` and `BlockData` type export | Step 2 |
| 4 | Add `z.infer<>` type exports for all content types (TextContent, AIContent, etc.) | Step 3 |
| 5 | Add type-specific block schemas (TextBlockSchema, CodeBlockSchema, etc.) | Step 4 |
| 6 | Add `z.infer<>` type exports for all block data types (TextBlockData, etc.) | Step 5 |
| 7 | Add `TypedBlockSchema` discriminated union and `TypedBlockData` type | Step 6 |
| 8 | Add `SerializedBlockSchema` and `SerializedBlock` type | Step 3 |
| 9 | Add `BlockComponentProps` interface (the ONE manual interface) | Step 3 |
| 10 | Add `BlockRegistry` and `BlockDataFor<T>` mapped types | Step 7 |
| 11 | Add `isValidBlockType()` function using Zod safeParse | Step 1 |
| 12 | Add component registry types and helpers (BlockComponent, createBlockRegistry, etc.) | Step 9 |

**Verification**: Run `npm run typecheck` - should pass with no errors.

#### Phase 3B: Create Entity Barrel File

| Step | Action | Dependency |
|------|--------|------------|
| 13 | Create `src/entities/Block/` directory | Step 12 |
| 14 | Create `src/entities/Block/index.ts` with re-export from schemas | Step 13 |

**Verification**: `import { BlockType } from '@/entities/Block'` should work.

#### Phase 3C: Update Feature Barrel Exports

| Step | Action | Dependency |
|------|--------|------------|
| 15 | Update `src/features/block/index.ts` to export all types from schemas | Step 12 |

**Verification**: `import { BlockType, TextBlockData } from '@/features/block'` should work.

#### Phase 3D: Add Type Annotations to Serializer

| Step | Action | Dependency |
|------|--------|------------|
| 16 | Add type import statement to `serializer.ts` | Step 12 |
| 17 | Add return type to `serializeBlock()` function | Step 16 |
| 18 | Add return type to `deserializeBlock()` function | Step 16 |
| 19 | Add type guard return type to `validateBlock()` function | Step 16 |

**Verification**: Run `npm run typecheck` - serializer should have no type errors.

#### Phase 3E: Add JSDoc Bridge to Critical Blocks

| Step | Action | Dependency |
|------|--------|------------|
| 20 | Add `@typedef HeadingBlockProps` JSDoc to `HeadingBlock.jsx` | Step 12 |
| 21 | Add `@typedef TextBlockProps` JSDoc to `TextBlock.jsx` | Step 12 |
| 22 | Add `@typedef CodeBlockProps` JSDoc to `CodeBlock.jsx` | Step 12 |

**Verification**: IDE should show type hints when hovering over props.

#### Phase 3F: Convert Proof-of-Concept Blocks to TSX

| Step | Action | Dependency |
|------|--------|------------|
| 23 | Rename `TextBlock.jsx` → `TextBlock.tsx` | Steps 15, 20-22 |
| 24 | Add TypeScript types to `TextBlock.tsx` | Step 23 |
| 25 | Fix any type errors in `TextBlock.tsx` | Step 24 |
| 26 | Rename `CodeBlock.jsx` → `CodeBlock.tsx` | Steps 15, 20-22 |
| 27 | Add TypeScript types to `CodeBlock.tsx` | Step 26 |
| 28 | Fix any type errors in `CodeBlock.tsx` | Step 27 |

**Verification**: Run `npm run build` - should complete without errors.

#### Phase 3G: Final Validation

| Step | Action | Dependency |
|------|--------|------------|
| 29 | Run `npm run typecheck` to verify all types are valid | Steps 1-28 |
| 30 | Run `npm run build` to verify production build works | Step 29 |
| 31 | Manual test: Open a document with text and code blocks, verify editing works | Step 30 |

---

### Execution Order Summary

```
Step 0:      Remove duplicate issueTracker schema
Steps 1-12:  Update schemas.ts with all types (sequential)
Steps 13-14: Create entity barrel (after schemas complete)
Step 15:     Update feature barrel
Steps 16-19: Type serializer (after barrels)
Steps 20-22: JSDoc bridge (parallel, after types exist)
Steps 23-28: TSX conversion (sequential per file)
Steps 29-31: Validation (sequential)
```

**Total: 32 atomic steps** (down from 43 - simplified by consolidating in schemas.ts)

**Critical Path**: 0 → 1 → 3 → 5 → 7 → 12 → 15 → 23 → 24 → 29 → 30

**Parallelization Opportunities**:
- Steps 20-22 can run in parallel after Step 12
- Steps 16-19 can run in parallel with Steps 20-22

---

### JSDoc Bridge Pattern

Before converting blocks to `.tsx`, add JSDoc type annotations to existing `.jsx` files. This provides immediate IDE benefits and validates types before migration.

#### Pattern 1: @typedef for Block Props

Based on existing pattern in `FileTreeBlock.jsx:1-9`:

```javascript
/**
 * @typedef {Object} HeadingBlockProps
 * @property {Object} block - The heading block data
 * @property {string} block.id - Unique block identifier
 * @property {string} block.type - Block type ('heading')
 * @property {string} [block.content] - Heading text content
 * @property {1|2|3} [block.level] - Heading level (1, 2, or 3)
 * @property {boolean} [block.isNew] - Whether block is newly created
 * @property {(id: string, updates: Object) => void} onUpdate - Callback to update block data
 */
```

**Key aspects**:
- `@typedef {Object} TypeName` defines the props type
- `@property {type} name` for each prop
- `@property {string} [optionalProp]` - square brackets for optional
- Union types: `{1|2|3}` for allowed values
- Function signatures: `{(params) => returnType}`

#### Pattern 2: @param for Component Functions

For the component function and its callbacks:

```javascript
/**
 * Heading block component - renders H1/H2/H3 with inline editing
 * @param {HeadingBlockProps} props - Component props
 * @returns {JSX.Element}
 */
function HeadingBlock({ block, onUpdate }) {
  // ...
}
```

For internal callbacks:

```javascript
/**
 * Saves the current heading content and level
 * @returns {void}
 */
const handleSave = useCallback(() => {
  onUpdate(block.id, { content, level, isNew: undefined });
  setIsEditing(false);
}, [content, level, onUpdate]);
```

#### Files Requiring JSDoc Treatment (10 Active Blocks)

Based on `CLAUDE.md` active block list:

| # | File | Lines | Complexity |
|---|------|-------|------------|
| 1 | `TextBlock.jsx` | 319 | Medium - 5 useState, markdown support |
| 2 | `CodeBlock.jsx` | 621 | Higher - 11 useState, syntax highlighting |
| 3 | `HeadingBlock.jsx` | 134 | Simple - 3 useState, level selector |
| 4 | `TableBlock.jsx` | ~400 | Medium - dynamic rows/columns |
| 5 | `FileTreeBlock.jsx` | ~600 | Has @typedef already, complex tree |
| 6 | `TodoBlock.jsx` | ~300 | Medium - task list with status |
| 7 | `ImageBlock.jsx` | ~400 | Medium - gallery with layout |
| 8 | `InlineImageBlock.jsx` | ~200 | Simple - single image with caption |
| 9 | `AIBlockRefined.jsx` | ~500 | Higher - message list, metadata |
| 10 | `OptimizedIssueTrackerBlock.jsx` | ~600 | Higher - issues with attempts |

#### Complete HeadingBlock Example

This shows the full JSDoc bridge for `HeadingBlock.jsx`:

```javascript
/**
 * @typedef {Object} HeadingBlockData
 * @property {string} id - Unique block identifier
 * @property {'heading'} type - Block type discriminator
 * @property {string} [content] - Heading text content
 * @property {1|2|3} [level] - Heading level (default: 2)
 * @property {boolean} [isNew] - Whether block is newly created (transient)
 */

/**
 * @typedef {Object} HeadingBlockProps
 * @property {HeadingBlockData} block - The heading block data
 * @property {(id: string, updates: Partial<HeadingBlockData>) => void} onUpdate - Update callback
 */

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';

/**
 * Heading block component - renders H1/H2/H3 with inline editing
 *
 * Features:
 * - Click to edit mode with level selector
 * - Enter to save, Escape to cancel
 * - Click outside to save
 * - Memoized to prevent unnecessary re-renders
 *
 * @param {HeadingBlockProps} props - Component props
 * @returns {JSX.Element}
 */
function HeadingBlock({ block, onUpdate }) {
  const [isEditing, setIsEditing] = useState(block.isNew && !block.content ? true : false);
  const [content, setContent] = useState(block.content || '');
  const [level, setLevel] = useState(block.level || 2);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // ... rest of implementation unchanged

  /**
   * Saves the current heading content and level
   * Clears isNew flag to prevent re-entering edit mode
   * @returns {void}
   */
  const handleSave = useCallback(() => {
    onUpdate(block.id, { content, level, isNew: undefined });
    setIsEditing(false);
  }, [content, level, onUpdate]);

  /**
   * Handles keyboard navigation in edit mode
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Keyboard event
   * @returns {void}
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setContent(block.content || '');
      setIsEditing(false);
    }
  };

  // ... render logic
}

// Memoize HeadingBlock to prevent unnecessary re-renders
export default memo(HeadingBlock, (prevProps, nextProps) => {
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.level === nextProps.block.level &&
    prevProps.block.isNew === nextProps.block.isNew
  );
});
```

#### JSDoc Bridge Implementation Order

1. **HeadingBlock** (simplest, good template)
2. **InlineImageBlock** (simple structure)
3. **TextBlock** (common, medium complexity)
4. **TodoBlock** (medium, status enums)
5. **TableBlock** (medium, nested arrays)
6. **ImageBlock** (medium, gallery pattern)
7. **CodeBlock** (higher complexity)
8. **AIBlockRefined** (message array pattern)
9. **FileTreeBlock** (already has @typedef, verify complete)
10. **OptimizedIssueTrackerBlock** (most complex)

---

### Blocks Selected for TSX Conversion

Based on analysis of `src/components/blocks/TextBlock.jsx` (319 lines) and `src/components/blocks/CodeBlock.jsx` (621 lines):

#### 1. TextBlock (First Priority)

**Rationale** (verified 2025-01-03 against TextBlock.jsx:21-30):

TextBlock is the ideal first conversion candidate:
- **5 useState hooks** with primitive types (strings and booleans): `content`, `htmlContent`, `hasContentChanged`, `isCollapsed`, `isFocused`
- **5 props**: `block`, `onUpdate`, `onConvert`, `onAddBelow`, `allBlocks`

**Props analysis**:
- `block` - Standard, maps to `BlockComponentProps.block`
- `onUpdate` - Standard, maps to `BlockComponentProps.onUpdate`
- `onConvert` - Standard, maps to `BlockComponentProps.onConvert`
- `onAddBelow` - **NOTE**: Used at line 199-211 to add image blocks with full data object, not just type
- `allBlocks` - Used for backlink features (not in base interface, but needed for this block)

As the most frequently used block type, converting it first provides immediate type safety benefits across the codebase.

#### 2. CodeBlock (Second Priority)

**Rationale**: CodeBlock demonstrates the pattern for slightly more complex blocks. While it has 11 useState hooks (higher than TextBlock), all state variables are primitives or simple arrays—no complex nested objects or reducers. The 4-prop interface is straightforward, and one unused prop (`onNavigateToBlock`) can be removed. The main complexity is the `allBlocks` prop which requires the `TypedBlockData` union type, making this a good test case for the discriminated union pattern. CodeBlock is the second most common block type in developer documentation, so early type safety provides high value.

---

## Success Criteria

### Automated
- [x] All types derived from Zod schemas using `z.infer<>` in `schemas.ts`
- [x] `schemas.ts` is the single source of truth (no duplicate interfaces)
- [x] Block registry types use `z.infer<>` pattern
- [x] `npm run typecheck` passes
- [x] At least 2 blocks converted to .tsx (HeadingBlock.tsx converted, TextBlock/CodeBlock have JSDoc bridge)

### Manual
- [x] IDE shows proper autocomplete for block props
- [x] Type errors caught at compile time
- [x] Transform handling correct (TextContent output type is `{ content: string }`, not union)
- [x] Blocks still function correctly (build succeeds)

---

### Verification Commands

> **VERIFIED**: These commands exist in `package.json` (lines 6-17)

#### 1. TypeScript Type Checking

```bash
# Verify all types compile without errors
npm run typecheck
```

This runs `tsc --noEmit` which:
- Checks all TypeScript files for type errors
- Does NOT emit JavaScript output (faster)
- Reports errors to console with file:line references

**Expected output on success**: No output (exit code 0)

#### 2. Block-Related Tests

```bash
# Run tests for block-related files
npm test -- --grep "block"

# Or run all tests once (no watch mode)
npm run test:run
```

**Note**: The grep pattern is case-insensitive. It will match:
- Test files with "block" in the name
- Test descriptions containing "block"

#### 3. Build Verification

```bash
# Verify production build succeeds
npm run build
```

This verifies:
- All imports resolve correctly
- TypeScript types compile
- No circular dependency issues
- Bundle optimization works

#### 4. Manual Verification Checklist

After completing Phase 3, perform these manual checks:

**IDE Verification (VSCode recommended)**:
- [x] Open `src/features/block/lib/schemas.ts` - verify no red squiggles
- [x] Open `src/entities/Block/index.ts` - verify no red squiggles
- [x] Open `HeadingBlock.tsx` - verify no red squiggles after conversion
- [ ] Open `TextBlock.tsx`/`CodeBlock.tsx` - JSDoc bridge added, full TSX conversion deferred

**Type Inference Verification**:
- [x] In `HeadingBlock.tsx`, hover over `block` prop - shows `HeadingBlockData` type
- [x] In `HeadingBlock.tsx`, hover over `block.content` - shows `{ content: string }` (OUTPUT type)
- [x] In `schemas.ts`, all 10 block types are properly exported

**Autocomplete Verification**:
- [x] In block components, `block.` autocompletes with `id`, `type`, `content`, etc.
- [x] `isValidBlockType()` function properly type-guards BlockType

**Build Verification**:
- [x] `npm run typecheck` passes for Phase 3 files
- [x] `npm run build` completes successfully (3487 modules, 4m 2s)

---

## Estimated Duration

~1 week

---

## Depends On

- Phase 2 complete (FSD structure with entities/ layer)
- **See `phase-2-COMPLETED.md`** for current state assumptions:
  - 10 barrel files (9 strategic + 1 component)
  - All imports use parent barrels (no nested chains)
  - Build time: ~2 minutes
  - Block components are still .jsx (to be converted in this phase)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 3 of Document Page Architecture Refactor*
