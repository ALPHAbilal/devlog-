-- Create a simplified get_documents_with_stats function that matches what the app expects
CREATE OR REPLACE FUNCTION public.get_documents_with_stats(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
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
  preview TEXT
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
    COALESCE(dc.block_count, 0) as block_count,
    COALESCE(d.metadata->>'preview', 'Click to view document...') as preview
  FROM public.documents d
  LEFT JOIN public.document_cache dc ON d.id = dc.document_id
  WHERE d.user_id = p_user_id
    AND d.deleted_at IS NULL
  ORDER BY d.updated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_documents_with_stats(UUID, INTEGER) TO authenticated;