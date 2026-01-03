// Block feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { useAutoSave, useGlobalAutoSave, getSmartSyncManager } from './hooks/use-auto-save';
export { useBlockLazyLoading, useProgressiveContent } from './hooks/use-lazy-loading';
export { useOptimizedBlockLoader } from './hooks/use-optimized-loader';
export { usePaginatedBlockLoader } from './hooks/use-paginated-loader';
export { useCanvasCleanup, useBlockMemoryManagement, useMemoryMonitor } from './hooks/use-memory-management';
// Alias for backward compatibility
export { useBlockMemoryManagement as useMemoryManagement } from './hooks/use-memory-management';

// ============== Lib ==============
export { BlockContentSchemas, getBlockContentSchema, hasBlockSchema } from './lib/schemas';
export { serializeBlock, deserializeBlock, validateBlock } from './lib/serializer';
export { default as blockSerializer } from './lib/serializer';
