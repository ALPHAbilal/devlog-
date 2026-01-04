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

// REMOVED: rate-limited-client.ts was mutating the shared supabase object
// and breaking the query builder chain (.eq is not a function error)
// See: https://github.com/... for details
// export { supabaseWithRateLimit } from './supabase/rate-limited-client';

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
