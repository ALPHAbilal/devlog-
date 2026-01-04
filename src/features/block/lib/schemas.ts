/**
 * Block Type Schemas using Zod
 *
 * SINGLE SOURCE OF TRUTH for block types.
 * Types are derived using z.infer<> - never create separate interfaces.
 *
 * @module schemas
 */

import { z } from 'zod';
import type { ComponentType } from 'react';

// =============================================================================
// Shared Schemas
// =============================================================================

const TableAlignmentSchema = z.enum(['left', 'center', 'right']);

/**
 * File tree node - recursive structure
 *
 * Matches actual usage in FileTreeBlock.jsx:
 * - id, name: required identifiers
 * - isFolder: distinguishes folders from files
 * - children: nested nodes (folders only)
 * - content: file content (files only)
 * - type: computed field used by serializer
 *
 * Note: We define the type manually because z.lazy() has TypeScript
 * inference limitations with recursive types and required fields.
 * The schema validates at runtime; the type provides compile-time safety.
 */
export interface FileTreeNode {
  id: string;
  name: string;
  isFolder?: boolean;
  children?: FileTreeNode[];
  content?: string;
  type?: 'file' | 'folder';
}

// Base schema without recursion for type inference
const baseFileTreeNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  isFolder: z.boolean().optional(),
  content: z.string().optional(),
  type: z.enum(['file', 'folder']).optional(),
});

// Recursive schema - uses type assertion because z.lazy() can't infer recursive types
const FileTreeNodeSchema: z.ZodType<FileTreeNode> = baseFileTreeNodeSchema.extend({
  children: z.lazy(() => z.array(FileTreeNodeSchema).optional()),
}) as z.ZodType<FileTreeNode>;

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
  // Uses z.record(z.unknown()) for stricter typing than z.any()
  ai: z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'ai', 'assistant']),
      content: z.string()
    })).default([]),
    metadata: z.record(z.unknown()).default({})
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

  // Issue tracker blocks - consolidated (removed duplicate 'issueTracker')
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
      name: z.string().optional(),
      label: z.string().optional(),
      timestamp: z.number(),
      treeData: z.array(FileTreeNodeSchema).optional(),
      tree: z.array(FileTreeNodeSchema).optional(),
      // CRITICAL: These fields were missing - comments were being stripped by Zod
      comment: z.string().optional(),
      changes: z.string().optional()
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
  language: z.string().optional(),
  filePath: z.string().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
}).passthrough(); // Allow additional properties

export type BlockMetadata = z.infer<typeof BlockMetadataSchema>;

// =============================================================================
// Base Block Schema
// =============================================================================

export const BaseBlockSchema = z.object({
  id: z.string(),
  type: BlockTypeSchema,
  content: z.union([z.string(), z.record(z.unknown())]).optional(),
  data: z.record(z.unknown()).optional(),
  metadata: BlockMetadataSchema.optional(),
  position: z.number(),
  // Accept both number (timestamp) and string (ISO date) - Supabase returns strings
  created_at: z.union([z.number(), z.string()]),
  updated_at: z.union([z.number(), z.string()]).optional(),
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

/** Heading content - OUTPUT type */
export type HeadingContent = z.infer<typeof BlockContentSchemas.heading>;

/** Heading content INPUT type */
export type HeadingContentInput = z.input<typeof BlockContentSchemas.heading>;

/** Code content - OUTPUT type */
export type CodeContent = z.infer<typeof BlockContentSchemas.code>;

/** Code content INPUT type */
export type CodeContentInput = z.input<typeof BlockContentSchemas.code>;

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
  content: z.union([z.string(), z.object({ content: z.string() })]).optional(),
});
export type TextBlockData = z.infer<typeof TextBlockSchema>;

export const HeadingBlockSchema = BaseBlockSchema.extend({
  type: z.literal('heading'),
  content: z.union([z.string(), z.object({ content: z.string() })]).optional(),
  data: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional() }).optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});
export type HeadingBlockData = z.infer<typeof HeadingBlockSchema>;

export const CodeBlockSchema = BaseBlockSchema.extend({
  type: z.literal('code'),
  content: z.union([z.string(), z.object({ content: z.string() })]).optional(),
  data: z.object({
    language: z.string().optional(),
    filePath: z.string().optional(),
  }).optional(),
  language: z.string().optional(),
  filePath: z.string().optional(),
});
export type CodeBlockData = z.infer<typeof CodeBlockSchema>;

export const AIBlockSchema = BaseBlockSchema.extend({
  type: z.literal('ai'),
  messages: z.array(z.object({
    role: z.enum(['user', 'ai', 'assistant']),
    content: z.string()
  })).optional(),
});
export type AIBlockData = z.infer<typeof AIBlockSchema>;

export const ImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('image'),
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
  })).optional(),
  layout: z.enum(['grid', 'list']).optional(),
  columns: z.number().optional(),
});
export type ImageBlockData = z.infer<typeof ImageBlockSchema>;

export const InlineImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal('inline-image'),
  url: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }).nullable().optional(),
});
export type InlineImageBlockData = z.infer<typeof InlineImageBlockSchema>;

export const TableBlockSchema = BaseBlockSchema.extend({
  type: z.literal('table'),
  data: z.object({
    headers: z.array(z.string()).optional(),
    rows: z.array(z.array(z.string())).optional(),
    columnAlignments: z.array(TableAlignmentSchema).optional(),
    hasHeaderRow: z.boolean().optional()
  }).optional(),
});
export type TableBlockData = z.infer<typeof TableBlockSchema>;

export const TodoBlockSchema = BaseBlockSchema.extend({
  type: z.literal('todo'),
  data: z.object({
    todos: z.array(z.object({
      id: z.string(),
      text: z.string(),
      status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
      priority: z.enum(['high', 'medium', 'low']).optional(),
      dueDate: z.string().optional(),
      tags: z.array(z.string()).optional(),
      createdAt: z.string().optional()
    })).optional()
  }).optional(),
});
export type TodoBlockData = z.infer<typeof TodoBlockSchema>;

export const IssueTrackerBlockSchema = BaseBlockSchema.extend({
  type: z.literal('issue-tracker'),
  data: z.object({
    milestone: z.string().optional(),
    issues: z.array(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      code: z.string().optional(),
      status: z.enum(['open', 'in-progress', 'closed', 'solved']).optional(),
      attempts: z.array(z.unknown()).optional()
    })).optional()
  }).optional(),
});
export type IssueTrackerBlockData = z.infer<typeof IssueTrackerBlockSchema>;

export const FileTreeBlockSchema = BaseBlockSchema.extend({
  type: z.literal('filetree'),
  treeData: z.array(FileTreeNodeSchema).optional(),
  expanded: z.array(z.string()).optional(),
  snapshots: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    label: z.string().optional(),
    timestamp: z.number(),
    treeData: z.array(FileTreeNodeSchema).optional(),
    tree: z.array(FileTreeNodeSchema).optional()
  })).optional(),
  currentSnapshotId: z.string().nullable().optional(),
  snapshotLimit: z.number().optional(),
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
  metadata: BlockMetadataSchema.optional(),
  // Accept both number (timestamp) and string (ISO date) - Supabase returns strings
  created_at: z.union([z.number(), z.string()]),
  updated_at: z.union([z.number(), z.string()]).optional(),
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
// Component Registry Types
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get content schema for a block type (handles aliases)
 */
export function getBlockContentSchema(blockType: string): z.ZodTypeAny | null {
  if (!blockType) return null;
  // Handle legacy alias
  const type = blockType === 'issueTracker' ? 'issue-tracker' : blockType;
  return BlockContentSchemas[type as keyof typeof BlockContentSchemas] || null;
}

/**
 * Check if a block type has a schema
 */
export function hasBlockSchema(blockType: string): boolean {
  return !!getBlockContentSchema(blockType);
}

/**
 * Type guard to check if a value is a valid BlockType
 */
export function isValidBlockType(type: unknown): type is BlockType {
  return BlockTypeSchema.safeParse(type).success;
}
