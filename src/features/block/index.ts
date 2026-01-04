// Block feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { useAutoSave, useGlobalAutoSave, getSmartSyncManager } from './hooks/use-auto-save';
export { useBlockLazyLoading, useProgressiveContent } from './hooks/use-lazy-loading';
export { useOptimizedBlockLoader } from './hooks/use-optimized-loader';
export { usePaginatedBlockLoader } from './hooks/use-paginated-loader';
export { useBlocks } from './hooks/use-blocks-query';
export { useCanvasCleanup, useBlockMemoryManagement, useMemoryMonitor } from './hooks/use-memory-management';
// Alias for backward compatibility
export { useBlockMemoryManagement as useMemoryManagement } from './hooks/use-memory-management';

// ============== Lib (Schemas + Functions) ==============
export {
  BlockContentSchemas,
  getBlockContentSchema,
  hasBlockSchema,
  isValidBlockType,
  createBlockRegistry,
  getBlockComponent,
  DEFAULT_BLOCK_TYPE,
  // Zod Schemas (for runtime validation)
  BlockTypeSchema,
  BlockMetadataSchema,
  BaseBlockSchema,
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
  TypedBlockSchema,
  SerializedBlockSchema,
} from './lib/schemas';

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

  // Block-specific data types
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

  // Content types (OUTPUT types after transform)
  TextContent,
  TextContentInput,
  HeadingContent,
  HeadingContentInput,
  CodeContent,
  CodeContentInput,
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
  FileTreeNode,

  // Component props (the ONE manual interface)
  BlockComponentProps,

  // Registry types
  BlockRegistry,
  BlockDataFor,
  BlockComponent,
  BlockComponentRegistry,
} from './lib/schemas';
