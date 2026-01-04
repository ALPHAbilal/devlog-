// Document feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { default as useDocumentOrganization } from './hooks/use-organization';
export { useFolders } from './hooks/use-folders';
export { usePaginatedDashboard } from './hooks/use-paginated-dashboard';

// Phase 5: Component Decomposition hooks
export { useDocumentState } from './hooks/use-document-state';
export type { UseDocumentStateOptions, UseDocumentStateReturn, DocumentEntry, BacklinkEntry } from './hooks/use-document-state';

export { useTagOperations } from './hooks/use-tag-operations';
export type { UseTagOperationsOptions, UseTagOperationsReturn } from './hooks/use-tag-operations';

export { useBlockSync } from './hooks/use-block-sync';
export type { UseBlockSyncOptions, UseBlockSyncReturn, SmartSyncManager } from './hooks/use-block-sync';

export { useBlockMove } from './hooks/use-block-move';
export type { UseBlockMoveOptions, UseBlockMoveReturn } from './hooks/use-block-move';

export { useDragDrop } from './hooks/use-drag-drop';
export type { UseDragDropOptions, UseDragDropReturn } from './hooks/use-drag-drop';

export { useBlockOperations } from './hooks/use-block-operations';
export type { UseBlockOperationsOptions, UseBlockOperationsReturn, BlockType, BlockData } from './hooks/use-block-operations';
