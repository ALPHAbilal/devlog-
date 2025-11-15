-- Migration: Add Full Text Search for Documents and Blocks
-- Purpose: Enable server-side search across document titles, tags, and block content
-- This allows searching block content without loading blocks to the client

-- Create a function to search documents and their blocks using PostgreSQL Full Text Search
CREATE OR REPLACE FUNCTION search_documents_with_blocks(
  p_user_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB,
  project_id UUID,
  folder_id UUID,
  "position" INTEGER,
  is_template BOOLEAN,
  match_reason TEXT,
  match_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query_tsquery tsquery;
  v_search_term TEXT;
BEGIN
  -- Prepare search query for full-text search
  -- Convert user input to tsquery format
  v_search_term := trim(p_search_query);
  
  -- If search term is empty, return all documents
  IF v_search_term = '' OR v_search_term IS NULL THEN
    RETURN QUERY
    SELECT 
      d.id,
      d.title,
      d.tags,
      d.created_at,
      d.updated_at,
      d.metadata,
      d.project_id,
      d.folder_id,
      d."position",
      d.is_template,
      'all'::TEXT as match_reason,
      1.0::REAL as match_score
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
    ORDER BY d.updated_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    RETURN;
  END IF;

  -- Convert search term to tsquery (handles multiple words)
  -- Replace spaces with & for AND matching, wrap words in quotes
  v_search_term := regexp_replace(v_search_term, '\s+', ' & ', 'g');
  v_query_tsquery := plainto_tsquery('english', v_search_term);

  -- Search documents that match in title, tags, or block content
  RETURN QUERY
  WITH document_matches AS (
    -- Match in document title
    SELECT 
      d.id,
      d.title,
      d.tags,
      d.created_at,
      d.updated_at,
      d.metadata,
      d.project_id,
      d.folder_id,
      d."position",
      d.is_template,
      'title'::TEXT as match_reason,
      ts_rank(to_tsvector('english', coalesce(d.title, '')), v_query_tsquery) as match_score
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND (
        to_tsvector('english', coalesce(d.title, '')) @@ v_query_tsquery
        OR d.title ILIKE '%' || p_search_query || '%'
      )
    
    UNION
    
    -- Match in document tags
    SELECT 
      d.id,
      d.title,
      d.tags,
      d.created_at,
      d.updated_at,
      d.metadata,
      d.project_id,
      d.folder_id,
      d."position",
      d.is_template,
      'tags'::TEXT as match_reason,
      0.8::REAL as match_score
    FROM documents d
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND EXISTS (
        SELECT 1 
        FROM unnest(d.tags) AS tag
        WHERE tag ILIKE '%' || p_search_query || '%'
      )
    
    UNION
    
    -- Match in block content
    SELECT DISTINCT
      d.id,
      d.title,
      d.tags,
      d.created_at,
      d.updated_at,
      d.metadata,
      d.project_id,
      d.folder_id,
      d."position",
      d.is_template,
      'blocks'::TEXT as match_reason,
      ts_rank(
        to_tsvector('english', coalesce(string_agg(b.content, ' '), '')),
        v_query_tsquery
      ) as match_score
    FROM documents d
    INNER JOIN blocks b ON b.document_id = d.id
    WHERE d.user_id = p_user_id
      AND d.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND (
        to_tsvector('english', coalesce(b.content, '')) @@ v_query_tsquery
        OR b.content ILIKE '%' || p_search_query || '%'
      )
    GROUP BY d.id, d.title, d.tags, d.created_at, d.updated_at, 
             d.metadata, d.project_id, d.folder_id, d."position", d.is_template
  )
  SELECT DISTINCT ON (document_matches.id)
    document_matches.id,
    document_matches.title,
    document_matches.tags,
    document_matches.created_at,
    document_matches.updated_at,
    document_matches.metadata,
    document_matches.project_id,
    document_matches.folder_id,
    document_matches."position",
    document_matches.is_template,
    document_matches.match_reason,
    MAX(document_matches.match_score) OVER (PARTITION BY document_matches.id) as match_score
  FROM document_matches
  ORDER BY document_matches.id, document_matches.match_score DESC, document_matches.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create index for faster full-text search on blocks content
CREATE INDEX IF NOT EXISTS idx_blocks_content_fts 
ON blocks USING gin(to_tsvector('english', coalesce(content, '')))
WHERE deleted_at IS NULL;

-- Create index for faster full-text search on documents title
CREATE INDEX IF NOT EXISTS idx_documents_title_fts 
ON documents USING gin(to_tsvector('english', coalesce(title, '')))
WHERE deleted_at IS NULL;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_documents_with_blocks(UUID, TEXT, INTEGER, INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION search_documents_with_blocks IS 
'Search documents and their blocks using PostgreSQL Full Text Search. Searches across document titles, tags, and block content. Returns documents with match reason and score.';

