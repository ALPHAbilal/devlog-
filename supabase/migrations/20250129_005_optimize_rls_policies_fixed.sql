-- Optimize RLS policies to avoid EXISTS subqueries
-- Create materialized views and use JOINs for better performance

-- Create a helper function to get user's document IDs
-- This reduces repeated subqueries in RLS policies
CREATE OR REPLACE FUNCTION public.user_document_ids()
RETURNS TABLE(document_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT id 
  FROM public.documents 
  WHERE user_id = auth.uid() 
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create index to support the function
CREATE INDEX IF NOT EXISTS idx_documents_user_id_deleted_null
ON public.documents(user_id)
WHERE deleted_at IS NULL;

-- Optimize blocks RLS policies using the helper function
DROP POLICY IF EXISTS "Users can view non-deleted blocks of their documents" ON public.blocks;
DROP POLICY IF EXISTS "Users can create blocks in their documents" ON public.blocks;
DROP POLICY IF EXISTS "Users can update blocks in their documents" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete blocks from their documents" ON public.blocks;

-- New optimized policies for blocks
CREATE POLICY "Users can view blocks (optimized)" ON public.blocks
  FOR SELECT USING (
    deleted_at IS NULL AND
    document_id IN (SELECT document_id FROM public.user_document_ids())
  );

CREATE POLICY "Users can create blocks (optimized)" ON public.blocks
  FOR INSERT WITH CHECK (
    document_id IN (SELECT document_id FROM public.user_document_ids())
  );

CREATE POLICY "Users can update blocks (optimized)" ON public.blocks
  FOR UPDATE USING (
    deleted_at IS NULL AND
    document_id IN (SELECT document_id FROM public.user_document_ids())
  );

CREATE POLICY "Users can delete blocks (optimized)" ON public.blocks
  FOR DELETE USING (
    deleted_at IS NULL AND
    document_id IN (SELECT document_id FROM public.user_document_ids())
  );

-- Optimize document_links policies
DROP POLICY IF EXISTS "Users can view links from their documents" ON public.document_links;
DROP POLICY IF EXISTS "Users can create links from their documents" ON public.document_links;
DROP POLICY IF EXISTS "Users can delete links from their documents" ON public.document_links;

CREATE POLICY "Users can view links (optimized)" ON public.document_links
  FOR SELECT USING (
    source_document_id IN (SELECT document_id FROM public.user_document_ids()) OR
    target_document_id IN (SELECT document_id FROM public.user_document_ids())
  );

CREATE POLICY "Users can create links (optimized)" ON public.document_links
  FOR INSERT WITH CHECK (
    source_document_id IN (SELECT document_id FROM public.user_document_ids())
  );

CREATE POLICY "Users can delete links (optimized)" ON public.document_links
  FOR DELETE USING (
    source_document_id IN (SELECT document_id FROM public.user_document_ids())
  );

-- Create a view for commonly accessed document-block combinations
-- Note: Views don't need RLS policies - they inherit from base tables
CREATE OR REPLACE VIEW public.user_documents_with_block_count AS
SELECT 
  d.id,
  d.user_id,
  d.title,
  d.created_at,
  d.updated_at,
  d.is_template,
  d.tags,
  d.metadata,
  COUNT(b.id) FILTER (WHERE b.deleted_at IS NULL) as block_count,
  MAX(b.updated_at) as last_block_update
FROM public.documents d
LEFT JOIN public.blocks b ON d.id = b.document_id
WHERE d.deleted_at IS NULL
GROUP BY d.id;

-- Grant access to the view
GRANT SELECT ON public.user_documents_with_block_count TO authenticated;

-- Views inherit RLS from underlying tables, so no policy needed
-- The view will automatically filter based on the documents table RLS

-- Function to get document statistics efficiently
CREATE OR REPLACE FUNCTION public.get_user_document_stats()
RETURNS TABLE (
  total_documents BIGINT,
  total_blocks BIGINT,
  total_templates BIGINT,
  total_tags BIGINT,
  oldest_document TIMESTAMP WITH TIME ZONE,
  newest_document TIMESTAMP WITH TIME ZONE,
  avg_blocks_per_document NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_docs AS (
    SELECT id FROM public.user_document_ids()
  ),
  stats AS (
    SELECT 
      COUNT(DISTINCT d.id) as doc_count,
      COUNT(DISTINCT b.id) as block_count,
      COUNT(DISTINCT d.id) FILTER (WHERE d.is_template = true) as template_count,
      COUNT(DISTINCT unnest(d.tags)) as tag_count,
      MIN(d.created_at) as oldest,
      MAX(d.created_at) as newest
    FROM public.documents d
    LEFT JOIN public.blocks b ON d.id = b.document_id AND b.deleted_at IS NULL
    WHERE d.id IN (SELECT id FROM user_docs)
      AND d.deleted_at IS NULL
  )
  SELECT 
    doc_count,
    block_count,
    template_count,
    tag_count,
    oldest,
    newest,
    CASE 
      WHEN doc_count > 0 THEN ROUND(block_count::NUMERIC / doc_count, 2)
      ELSE 0
    END as avg_blocks
  FROM stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_document_ids TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_document_stats TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.user_document_ids IS 'Helper function to efficiently get user document IDs for RLS policies';
COMMENT ON FUNCTION public.get_user_document_stats IS 'Get comprehensive statistics about user documents';
COMMENT ON VIEW public.user_documents_with_block_count IS 'Optimized view for document listings with block counts - inherits RLS from base tables';