// Document feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Hooks ==============
export { default as useDocumentOrganization } from './hooks/use-organization';

// RxDB Migration: useFolders now uses RxDB instead of Supabase + useState
// This provides real-time reactivity via RxDB subscriptions with automatic Supabase sync
export { useRxFolders as useFolders } from '@/shared/db';
// Keep old hook available for gradual migration (will be removed in Phase 8)
export { useFolders as useFoldersLegacy } from './hooks/use-folders';

// RxDB Migration: usePaginatedDashboard now uses RxDB for documents
// Local-first with automatic Supabase replication
export { useRxDocuments as usePaginatedDashboard } from '@/shared/db';
// Keep old hook available for gradual migration (will be removed in Phase 8)
export { usePaginatedDashboard as usePaginatedDashboardLegacy } from './hooks/use-paginated-dashboard';

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
