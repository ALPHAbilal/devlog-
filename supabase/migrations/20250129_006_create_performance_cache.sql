-- Create performance cache tables and functions
-- These help reduce computation for frequently accessed data

-- Create a cache table for document metadata
CREATE TABLE IF NOT EXISTS public.document_cache (
  document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  block_count INTEGER DEFAULT 0,
  total_content_length INTEGER DEFAULT 0,
  last_block_update TIMESTAMP WITH TIME ZONE,
  tag_list TEXT[] DEFAULT '{}',
  link_count INTEGER DEFAULT 0,
  cache_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cache queries
CREATE INDEX idx_document_cache_updated_at 
ON public.document_cache(cache_updated_at);

-- Enable RLS
ALTER TABLE public.document_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy for cache (inherit from documents)
CREATE POLICY "Users can view cache for their documents" ON public.document_cache
  FOR SELECT USING (
    document_id IN (SELECT document_id FROM public.user_document_ids())
  );

-- Function to update document cache
CREATE OR REPLACE FUNCTION public.update_document_cache(doc_id UUID)
RETURNS VOID AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Gather statistics
  SELECT 
    COUNT(b.id) as block_count,
    COALESCE(SUM(LENGTH(b.content)), 0) as content_length,
    MAX(b.updated_at) as last_update,
    ARRAY_AGG(DISTINCT tag) as all_tags,
    COUNT(DISTINCT dl.target_document_id) as link_count
  INTO stats
  FROM public.documents d
  LEFT JOIN public.blocks b ON d.id = b.document_id AND b.deleted_at IS NULL
  LEFT JOIN LATERAL unnest(b.extracted_tags) tag ON true
  LEFT JOIN public.document_links dl ON d.id = dl.source_document_id
  WHERE d.id = doc_id
    AND d.deleted_at IS NULL
  GROUP BY d.id;
  
  -- Update or insert cache
  INSERT INTO public.document_cache (
    document_id,
    block_count,
    total_content_length,
    last_block_update,
    tag_list,
    link_count,
    cache_updated_at
  ) VALUES (
    doc_id,
    stats.block_count,
    stats.content_length,
    stats.last_update,
    COALESCE(stats.all_tags, '{}'),
    stats.link_count,
    NOW()
  )
  ON CONFLICT (document_id) DO UPDATE SET
    block_count = EXCLUDED.block_count,
    total_content_length = EXCLUDED.total_content_length,
    last_block_update = EXCLUDED.last_block_update,
    tag_list = EXCLUDED.tag_list,
    link_count = EXCLUDED.link_count,
    cache_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update cache on block changes
CREATE OR REPLACE FUNCTION public.trigger_update_document_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Update cache for the affected document
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_document_cache(OLD.document_id);
  ELSE
    PERFORM public.update_document_cache(NEW.document_id);
  END IF;
  
  RETURN NULL; -- This is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cache_on_block_change
  AFTER INSERT OR UPDATE OR DELETE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_document_cache();

-- Function to get paginated documents with cache
CREATE OR REPLACE FUNCTION public.get_documents_with_stats(
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0,
  sort_by TEXT DEFAULT 'updated_at',
  sort_desc BOOLEAN DEFAULT true,
  filter_template BOOLEAN DEFAULT NULL,
  filter_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_template BOOLEAN,
  tags TEXT[],
  metadata JSONB,
  block_count INTEGER,
  content_length INTEGER,
  link_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.created_at,
    d.updated_at,
    d.is_template,
    d.tags,
    d.metadata,
    COALESCE(c.block_count, 0),
    COALESCE(c.total_content_length, 0),
    COALESCE(c.link_count, 0)
  FROM public.documents d
  LEFT JOIN public.document_cache c ON d.id = c.document_id
  WHERE d.user_id = auth.uid()
    AND d.deleted_at IS NULL
    AND (filter_template IS NULL OR d.is_template = filter_template)
    AND (filter_tags IS NULL OR d.tags && filter_tags)
  ORDER BY
    CASE WHEN sort_by = 'updated_at' AND sort_desc THEN d.updated_at END DESC,
    CASE WHEN sort_by = 'updated_at' AND NOT sort_desc THEN d.updated_at END ASC,
    CASE WHEN sort_by = 'created_at' AND sort_desc THEN d.created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND NOT sort_desc THEN d.created_at END ASC,
    CASE WHEN sort_by = 'title' AND sort_desc THEN d.title END DESC,
    CASE WHEN sort_by = 'title' AND NOT sort_desc THEN d.title END ASC
  LIMIT page_size
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to rebuild all caches for a user
CREATE OR REPLACE FUNCTION public.rebuild_user_caches()
RETURNS INTEGER AS $$
DECLARE
  doc_count INTEGER := 0;
BEGIN
  -- Rebuild cache for all user documents
  FOR doc_count IN 
    SELECT COUNT(*)
    FROM public.documents
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL
  LOOP
    PERFORM public.update_document_cache(id)
    FROM public.documents
    WHERE user_id = auth.uid()
      AND deleted_at IS NULL;
  END LOOP;
  
  RETURN doc_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a periodic cache refresh (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.refresh_stale_caches(
  stale_hours INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  refreshed_count INTEGER;
BEGIN
  WITH stale_docs AS (
    SELECT d.id
    FROM public.documents d
    LEFT JOIN public.document_cache c ON d.id = c.document_id
    WHERE d.deleted_at IS NULL
      AND (
        c.document_id IS NULL -- No cache exists
        OR c.cache_updated_at < NOW() - INTERVAL '1 hour' * stale_hours
        OR d.updated_at > c.cache_updated_at -- Document updated after cache
      )
    LIMIT 100 -- Process in batches
  )
  SELECT COUNT(*)
  INTO refreshed_count
  FROM stale_docs
  WHERE public.update_document_cache(id) IS NOT NULL;
  
  RETURN refreshed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_document_cache TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_documents_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_user_caches TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_stale_caches TO service_role;

-- Add comments
COMMENT ON TABLE public.document_cache IS 'Performance cache for document statistics';
COMMENT ON FUNCTION public.update_document_cache IS 'Updates cached statistics for a document';
COMMENT ON FUNCTION public.get_documents_with_stats IS 'Efficiently retrieves documents with pre-computed statistics';
COMMENT ON FUNCTION public.rebuild_user_caches IS 'Rebuilds all caches for the current user';
COMMENT ON FUNCTION public.refresh_stale_caches IS 'Refreshes outdated caches (for cron jobs)';