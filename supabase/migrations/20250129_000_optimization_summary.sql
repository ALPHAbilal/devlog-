-- Supabase Performance Optimizations Summary
-- ==========================================
-- This file documents all optimizations implemented for better performance
-- Run migrations in order: 001 through 006

-- OPTIMIZATION 1: Soft Delete Implementation (001)
-- ------------------------------------------------
-- - Added deleted_at columns to documents and blocks tables
-- - Created soft delete functions for data recovery
-- - Updated RLS policies to exclude soft-deleted records by default
-- - Benefits: Data recovery, audit trails, faster deletes

-- OPTIMIZATION 2: Performance Indexes (002)
-- ----------------------------------------
-- - Added composite indexes for common query patterns
-- - Created partial indexes for active (non-deleted) records
-- - Added indexes on user_id, updated_at, created_at combinations
-- - Benefits: Faster queries, reduced table scans

-- OPTIMIZATION 3: Batch Operations (003)
-- -------------------------------------
-- - Created batch_insert_blocks for bulk inserts
-- - Created batch_update_blocks for bulk updates
-- - Optimized save_document_blocks_v2 using UNNEST
-- - Benefits: Reduced round trips, faster bulk operations

-- OPTIMIZATION 4: Document Versioning (004)
-- ----------------------------------------
-- - Created document_versions table for version control
-- - Added functions to create/restore versions
-- - Included version comparison functionality
-- - Benefits: Change tracking, easy rollbacks

-- OPTIMIZATION 5: RLS Policy Optimization (005)
-- --------------------------------------------
-- - Created user_document_ids() helper function
-- - Replaced EXISTS subqueries with IN clauses
-- - Created optimized views for common queries
-- - Benefits: Faster RLS checks, reduced query complexity

-- OPTIMIZATION 6: Performance Cache (006)
-- --------------------------------------
-- - Created document_cache table for statistics
-- - Added automatic cache updates via triggers
-- - Created functions for efficient document queries
-- - Benefits: Instant stats, reduced computation

-- USAGE EXAMPLES:
-- ==============

-- 1. Soft Delete a Document:
-- SELECT public.soft_delete_document('document-uuid');

-- 2. Batch Insert Blocks:
-- SELECT * FROM public.batch_insert_blocks('document-uuid', 
--   '[{"type": "text", "content": "Hello"}, {"type": "code", "content": "console.log()"}]'::jsonb
-- );

-- 3. Create Document Version:
-- SELECT public.create_document_version('document-uuid', 'Before major refactor');

-- 4. Get Documents with Stats:
-- SELECT * FROM public.get_documents_with_stats(
--   page_size := 20,
--   page_offset := 0,
--   sort_by := 'updated_at',
--   sort_desc := true
-- );

-- 5. Get User Statistics:
-- SELECT * FROM public.get_user_document_stats();

-- MONITORING QUERIES:
-- ==================

-- Check index usage:
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check cache hit ratio:
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;

-- Check slow queries (requires pg_stat_statements):
-- SELECT query, calls, total_time, mean_time
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat_statements%'
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- MAINTENANCE TASKS:
-- =================

-- 1. Rebuild stale caches (run periodically):
-- SELECT public.refresh_stale_caches(24);

-- 2. Vacuum and analyze tables (run weekly):
-- VACUUM ANALYZE public.documents;
-- VACUUM ANALYZE public.blocks;

-- 3. Reindex if needed (run monthly):
-- REINDEX TABLE public.documents;
-- REINDEX TABLE public.blocks;