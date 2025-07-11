-- Migration: Performance Optimizations for Devlog
-- Created: 2025-01-31
-- Phase: 2 - Performance
-- 
-- IMPORTANT: Run 20250131_003a_cleanup_duplicate_functions.sql FIRST!
-- 
-- This migration adds performance optimizations including:
-- 1. Optimized indexes for common queries
-- 2. Materialized views for dashboard stats
-- 3. Full-text search capabilities
-- 4. Query optimization functions

-- ============================================
-- PART 1: DROP UNUSED INDEXES (from previous analysis)
-- ============================================

-- Drop indexes that aren't being used effectively
DROP INDEX IF EXISTS idx_blocks_type;
DROP INDEX IF EXISTS idx_images_storage_path;
DROP INDEX IF EXISTS idx_settings_user_id;
DROP INDEX IF EXISTS idx_document_links_source_target;
DROP INDEX IF EXISTS idx_documents_deleted_at;
DROP INDEX IF EXISTS idx_blocks_deleted_at;

-- ============================================
-- PART 2: CREATE OPTIMIZED INDEXES
-- ============================================

-- Composite index for document listing with filters
CREATE INDEX IF NOT EXISTS idx_documents_user_updated_filtered 
ON documents(user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

-- Composite index for blocks by document and position
CREATE INDEX IF NOT EXISTS idx_blocks_document_position 
ON blocks(document_id, position) 
WHERE deleted_at IS NULL;

-- Index for tag searches (using GIN for array operations)
CREATE INDEX IF NOT EXISTS idx_documents_tags 
ON documents USING gin(tags) 
WHERE deleted_at IS NULL;

-- Index for quick block counts
CREATE INDEX IF NOT EXISTS idx_blocks_document_count 
ON blocks(document_id) 
WHERE deleted_at IS NULL;

-- ============================================
-- PART 3: FULL-TEXT SEARCH SETUP
-- ============================================

-- Add text search columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update document search vector
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
  RETURN NEW;
END;
$$;

-- Create trigger for document search vector
DROP TRIGGER IF EXISTS update_document_search_vector_trigger ON documents;
CREATE TRIGGER update_document_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, tags
ON documents
FOR EACH ROW
EXECUTE FUNCTION update_document_search_vector();

-- Create function to update block search vector
CREATE OR REPLACE FUNCTION update_block_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$;

-- Create trigger for block search vector
DROP TRIGGER IF EXISTS update_block_search_vector_trigger ON blocks;
CREATE TRIGGER update_block_search_vector_trigger
BEFORE INSERT OR UPDATE OF content
ON blocks
FOR EACH ROW
WHEN (NEW.type IN ('text', 'heading', 'todo'))
EXECUTE FUNCTION update_block_search_vector();

-- Create search indexes
CREATE INDEX IF NOT EXISTS idx_documents_search 
ON documents USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_blocks_search 
ON blocks USING gin(search_vector);

-- Update existing documents and blocks
UPDATE documents SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(tags, ' '), '')), 'B')
WHERE search_vector IS NULL;

UPDATE blocks SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE type IN ('text', 'heading', 'todo') AND search_vector IS NULL;

-- ============================================
-- PART 4: OPTIMIZED SEARCH FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION search_documents_optimized(
  p_query TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  preview TEXT,
  tags TEXT[],
  score REAL,
  updated_at TIMESTAMPTZ,
  block_count BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public, auth
AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  -- Convert query to tsquery
  v_tsquery := plainto_tsquery('english', p_query);
  
  RETURN QUERY
  WITH ranked_docs AS (
    SELECT 
      d.id,
      d.title,
      d.tags,
      d.updated_at,
      ts_rank(d.search_vector, v_tsquery) as doc_rank,
      COALESCE(dc.block_count, 0) as block_count
    FROM documents d
    LEFT JOIN document_cache dc ON d.id = dc.document_id
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND d.search_vector @@ v_tsquery
      AND (p_tags IS NULL OR d.tags && p_tags)
  ),
  block_matches AS (
    SELECT 
      b.document_id,
      MAX(ts_rank(b.search_vector, v_tsquery)) as max_block_rank,
      string_agg(
        CASE 
          WHEN b.search_vector @@ v_tsquery 
          THEN substring(b.content, 1, 200) 
          ELSE NULL 
        END, ' ' 
        ORDER BY ts_rank(b.search_vector, v_tsquery) DESC
      ) FILTER (WHERE b.search_vector @@ v_tsquery) as matching_content
    FROM blocks b
    WHERE b.deleted_at IS NULL
      AND b.search_vector @@ v_tsquery
      AND b.document_id IN (SELECT id FROM ranked_docs)
    GROUP BY b.document_id
  )
  SELECT 
    rd.id,
    rd.title,
    COALESCE(bm.matching_content, substring(
      (SELECT string_agg(content, ' ' ORDER BY position) 
       FROM blocks 
       WHERE document_id = rd.id 
         AND deleted_at IS NULL 
       LIMIT 3), 1, 200
    )) as preview,
    rd.tags,
    GREATEST(rd.doc_rank, COALESCE(bm.max_block_rank, 0))::REAL as score,
    rd.updated_at,
    rd.block_count
  FROM ranked_docs rd
  LEFT JOIN block_matches bm ON rd.id = bm.document_id
  ORDER BY score DESC, rd.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_documents_optimized TO authenticated;

-- ============================================
-- PART 5: MATERIALIZED VIEW FOR DASHBOARD STATS
-- ============================================

-- Note: Cleanup script should have already dropped this

-- Create materialized view for fast dashboard loading
CREATE MATERIALIZED VIEW user_dashboard_stats AS
WITH user_tags AS (
  SELECT 
    d.user_id,
    UNNEST(d.tags) as tag
  FROM documents d
  WHERE d.deleted_at IS NULL
)
SELECT 
  u.id as user_id,
  COUNT(DISTINCT d.id) FILTER (WHERE d.deleted_at IS NULL) as document_count,
  COUNT(DISTINCT b.id) FILTER (WHERE b.deleted_at IS NULL) as block_count,
  COUNT(DISTINCT d.id) FILTER (WHERE d.is_template = true AND d.deleted_at IS NULL) as template_count,
  (SELECT COUNT(DISTINCT tag) FROM user_tags ut WHERE ut.user_id = u.id) as unique_tags,
  MAX(d.updated_at) FILTER (WHERE d.deleted_at IS NULL) as last_activity,
  COALESCE(SUM(LENGTH(b.content)) FILTER (WHERE b.deleted_at IS NULL), 0) as total_content_size,
  COUNT(DISTINCT dl.id) as total_links,
  COUNT(DISTINCT i.id) as total_images
FROM auth.users u
LEFT JOIN documents d ON u.id = d.user_id
LEFT JOIN blocks b ON d.id = b.document_id
LEFT JOIN document_links dl ON (d.id = dl.source_document_id OR d.id = dl.target_document_id)
LEFT JOIN images i ON u.id = i.user_id
GROUP BY u.id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_user_dashboard_stats_user_id 
ON user_dashboard_stats(user_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_user_dashboard_stats(p_user_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- If specific user provided, we'd need a more complex approach
  -- For now, refresh all
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
END;
$$;

-- Grant permissions
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_dashboard_stats TO authenticated;

-- ============================================
-- PART 6: OPTIMIZED DOCUMENT LOADING
-- ============================================

-- Function to get documents with all related data in one query
CREATE OR REPLACE FUNCTION get_documents_with_stats(
  p_user_id UUID DEFAULT auth.uid(),
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_order_by TEXT DEFAULT 'updated_at',
  p_order_dir TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  tags TEXT[],
  is_template BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB,
  block_count BIGINT,
  total_content_length BIGINT,
  preview TEXT,
  has_images BOOLEAN,
  link_count BIGINT
)
LANGUAGE plpgsql
STABLE
SET search_path = public, auth
AS $$
BEGIN
  -- Validate order parameters
  IF p_order_by NOT IN ('created_at', 'updated_at', 'title') THEN
    p_order_by := 'updated_at';
  END IF;
  
  IF p_order_dir NOT IN ('ASC', 'DESC') THEN
    p_order_dir := 'DESC';
  END IF;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.tags,
    d.is_template,
    d.created_at,
    d.updated_at,
    d.metadata,
    COALESCE(dc.block_count, 0),
    COALESCE(dc.total_content_length, 0),
    COALESCE(
      d.metadata->>'preview',
      (SELECT substring(string_agg(b.content, ' ' ORDER BY b.position), 1, 200)
       FROM blocks b 
       WHERE b.document_id = d.id 
         AND b.deleted_at IS NULL
         AND b.type = 'text'
       LIMIT 3)
    ) as preview,
    EXISTS(
      SELECT 1 FROM blocks b 
      WHERE b.document_id = d.id 
        AND b.type IN ('image', 'inline-image')
        AND b.deleted_at IS NULL
    ) as has_images,
    (SELECT COUNT(*) 
     FROM document_links dl 
     WHERE (dl.source_document_id = d.id OR dl.target_document_id = d.id)
       AND dl.deleted_at IS NULL
    ) as link_count
  FROM documents d
  LEFT JOIN document_cache dc ON d.id = dc.document_id
  WHERE d.user_id = p_user_id
    AND d.deleted_at IS NULL
  ORDER BY 
    CASE 
      WHEN p_order_by = 'created_at' AND p_order_dir = 'DESC' THEN d.created_at 
    END DESC,
    CASE 
      WHEN p_order_by = 'created_at' AND p_order_dir = 'ASC' THEN d.created_at 
    END ASC,
    CASE 
      WHEN p_order_by = 'updated_at' AND p_order_dir = 'DESC' THEN d.updated_at 
    END DESC,
    CASE 
      WHEN p_order_by = 'updated_at' AND p_order_dir = 'ASC' THEN d.updated_at 
    END ASC,
    CASE 
      WHEN p_order_by = 'title' AND p_order_dir = 'DESC' THEN d.title 
    END DESC,
    CASE 
      WHEN p_order_by = 'title' AND p_order_dir = 'ASC' THEN d.title 
    END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_documents_with_stats TO authenticated;

-- ============================================
-- PART 7: BATCH OPERATIONS FOR PERFORMANCE
-- ============================================

-- Function to load multiple documents' blocks in one query
CREATE OR REPLACE FUNCTION get_blocks_for_documents(
  p_document_ids UUID[],
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  document_id UUID,
  blocks JSONB
)
LANGUAGE plpgsql
STABLE
SET search_path = public, auth
AS $$
BEGIN
  -- Verify user owns all documents
  IF EXISTS (
    SELECT 1 FROM documents 
    WHERE id = ANY(p_document_ids) 
      AND user_id != p_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied to one or more documents';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.document_id,
    jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'type', b.type,
        'content', b.content,
        'position', b.position,
        'metadata', b.metadata,
        'language', b.language,
        'file_path', b.file_path,
        'created_at', b.created_at,
        'updated_at', b.updated_at
      ) ORDER BY b.position
    ) as blocks
  FROM blocks b
  WHERE b.document_id = ANY(p_document_ids)
    AND b.deleted_at IS NULL
  GROUP BY b.document_id;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_blocks_for_documents TO authenticated;

-- ============================================
-- PART 8: AUTO-REFRESH MATERIALIZED VIEWS
-- ============================================

-- Function to auto-refresh stats after changes
CREATE OR REPLACE FUNCTION trigger_refresh_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Schedule async refresh (in production, use pg_cron or external job)
  -- For now, just mark as needing refresh
  INSERT INTO pending_refreshes (view_name, requested_at)
  VALUES ('user_dashboard_stats', NOW())
  ON CONFLICT (view_name) DO UPDATE
  SET requested_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Table to track pending refreshes
CREATE TABLE IF NOT EXISTS pending_refreshes (
  view_name TEXT PRIMARY KEY,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Triggers to mark stats as stale
CREATE TRIGGER refresh_stats_on_document_change
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_stats();

CREATE TRIGGER refresh_stats_on_block_change
AFTER INSERT OR UPDATE OR DELETE ON blocks
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_stats();

-- ============================================
-- PART 9: PERFORMANCE MONITORING
-- ============================================

-- Table to track slow queries
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_name TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analysis
CREATE INDEX idx_query_performance_time 
ON query_performance_log(query_name, execution_time_ms DESC);

-- Function to log slow queries
CREATE OR REPLACE FUNCTION log_query_performance(
  p_query_name TEXT,
  p_start_time TIMESTAMPTZ,
  p_parameters JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_time_ms NUMERIC;
BEGIN
  v_execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - p_start_time));
  
  -- Only log queries slower than 100ms
  IF v_execution_time_ms > 100 THEN
    INSERT INTO query_performance_log (query_name, execution_time_ms, user_id, parameters)
    VALUES (p_query_name, v_execution_time_ms, auth.uid(), p_parameters);
  END IF;
END;
$$;

-- ============================================
-- PART 10: CLEANUP AND VERIFICATION
-- ============================================

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW user_dashboard_stats;

-- Analyze tables to update statistics
ANALYZE documents;
ANALYZE blocks;
ANALYZE document_cache;

-- Verification
DO $$
DECLARE
  v_index_count INTEGER;
  v_search_ready BOOLEAN;
BEGIN
  -- Count new indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_documents_user_updated_filtered',
      'idx_blocks_document_position',
      'idx_documents_tags',
      'idx_documents_search',
      'idx_blocks_search'
    );
    
  -- Check if search vectors are populated
  SELECT EXISTS(
    SELECT 1 FROM documents WHERE search_vector IS NOT NULL LIMIT 1
  ) INTO v_search_ready;
  
  RAISE NOTICE '';
  RAISE NOTICE '========== PERFORMANCE OPTIMIZATION RESULTS ==========';
  RAISE NOTICE 'New indexes created: %', v_index_count;
  RAISE NOTICE 'Full-text search ready: %', CASE WHEN v_search_ready THEN 'YES' ELSE 'NO' END;
  RAISE NOTICE 'Dashboard stats view: CREATED';
  RAISE NOTICE 'Optimized search function: READY';
  RAISE NOTICE '====================================================';
END $$;