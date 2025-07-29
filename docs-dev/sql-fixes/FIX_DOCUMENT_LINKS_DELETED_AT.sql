-- Fix the get_documents_with_stats function to remove the deleted_at check on document_links
-- The document_links table doesn't have a deleted_at column

-- First, let's update the existing function to remove the deleted_at check
CREATE OR REPLACE FUNCTION public.get_documents_with_stats(
    p_user_id uuid DEFAULT auth.uid(), 
    p_limit integer DEFAULT 50, 
    p_offset integer DEFAULT 0, 
    p_order_by text DEFAULT 'updated_at'::text, 
    p_order_dir text DEFAULT 'DESC'::text
)
RETURNS TABLE(
    id uuid, 
    title text, 
    tags text[], 
    is_template boolean, 
    created_at timestamp with time zone, 
    updated_at timestamp with time zone, 
    metadata jsonb, 
    block_count bigint, 
    total_content_length bigint, 
    preview text, 
    has_images boolean, 
    link_count bigint
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'auth'
AS $function$
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
         AND b.type = 'text'
       LIMIT 3)
    ) as preview,
    EXISTS(
      SELECT 1 FROM blocks b 
      WHERE b.document_id = d.id 
        AND b.type IN ('image', 'inline-image')
    ) as has_images,
    (SELECT COUNT(*) 
     FROM document_links dl 
     WHERE (dl.source_document_id = d.id OR dl.target_document_id = d.id)
     -- REMOVED: AND dl.deleted_at IS NULL (document_links doesn't have this column)
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
$function$;