-- Fix get_documents_with_stats function to remove document_links deleted_at check
-- The document_links table doesn't have a deleted_at column

CREATE OR REPLACE FUNCTION public.get_documents_with_stats(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    title text,
    tags text[],
    created_at timestamptz,
    updated_at timestamptz,
    block_count bigint,
    last_block_update timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.tags,
        d.created_at,
        d.updated_at,
        COALESCE(c.block_count, 0) as block_count,
        c.last_block_update
    FROM documents d
    LEFT JOIN document_cache c ON c.document_id = d.id
    WHERE d.user_id = auth.uid()
    AND d.deleted_at IS NULL
    ORDER BY d.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;