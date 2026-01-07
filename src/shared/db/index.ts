// src/shared/db/index.ts
/**
 * RxDB Database Module
 *
 * Single source of truth for all local data with Supabase replication.
 */

// Database instance
export { getDatabase, destroyDatabase, type DevlogDatabase } from './rxdb';

// Schemas
export { documentSchema, folderSchema, blockSchema } from './rxdb-schemas';

// Types
export type {
  DocumentDocType,
  DocumentDocument,
  DocumentCollection,
  FolderDocType,
  FolderDocument,
  FolderCollection,
  BlockDocType,
  BlockDocument,
  BlockCollection,
} from './rxdb-types';

// Core React hooks (low-level RxDB access)
export {
  RxDBProvider,
  useRxDB,
  useRxQuery,
  useRxCollection,
  useRxDocument as useRxDocumentBase, // Renamed to avoid collision
} from './rxdb-hooks.tsx';

// Provider component
export { DatabaseProvider } from './RxDBProvider';

// Replication utilities
export {
  startAllReplications,
  stopAllReplications,
  resyncAll,
  clearSyncState,
} from './rxdb-replication';

// Migration utilities
export {
  runMigration,
  isMigrationNeeded,
  cleanupOldDatabases,
} from './migration';

// Feature hooks (RxDB-based replacements for old hooks)
export { useRxBlocks } from './hooks/use-blocks';
export { useRxDocuments, useRxDocument } from './hooks/use-documents';
export { useRxFolders } from './hooks/use-folders';
