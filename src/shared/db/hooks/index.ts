// src/shared/db/hooks/index.ts
/**
 * RxDB Hooks
 *
 * React hooks for RxDB collections.
 * Drop-in replacements for old Dexie + TanStack Query hooks.
 *
 * These hooks are designed to be API-compatible with the old hooks:
 * - useRxBlocks → replaces useBlocks from use-blocks-query.ts
 * - useRxDocuments → replaces usePaginatedDashboard from use-paginated-dashboard.ts
 * - useRxFolders → replaces useFolders from use-folders.ts
 */

export { useRxBlocks } from './use-blocks';
export { useRxDocuments, useRxDocument } from './use-documents';
export { useRxFolders } from './use-folders';
