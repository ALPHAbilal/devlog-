// Shared API Barrel File
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== Supabase Clients ==============
// From optimized-client.ts
export {
  supabase,
  optimizedSupabase,
  getSession,
  onAuthStateChange,
  deduplicateRequest,
  setInactivityTimeout,
  ensureAuthenticated,
  clearAuthIssues
} from './supabase/optimized-client';

// From rate-limited-client.ts
export { supabaseWithRateLimit } from './supabase/rate-limited-client';

// From optimizations.ts - Performance optimizations and batch operations
export {
  // Soft delete
  softDeleteDocument,
  restoreDocument,
  // Batch operations
  batchInsertBlocks,
  batchUpdateBlocks,
  saveDocumentBlocksOptimized,
  batchDeleteBlocks,
  // Document versioning
  createDocumentVersion,
  restoreDocumentVersion,
  getVersionDiff,
  // Optimized queries
  getDocumentsWithStats,
  getUserDocumentStats,
  // Cache management
  updateDocumentCache,
  rebuildUserCaches,
  // Real activity statistics
  getDocumentActivity,
  getUserActivityStats,
  getDocumentsWithRealActivity
} from './supabase/optimizations';

// ============== TanStack Query ==============
export { queryClient } from './query-client';

// ============== Query Keys ==============
export {
  documentKeys,
  blockKeys,
  folderKeys,
  userKeys
} from './query-keys';

// ============== Auth Utilities ==============
export {
  hashApiKey,
  withApiAuth,
  checkRateLimit
} from './auth';
