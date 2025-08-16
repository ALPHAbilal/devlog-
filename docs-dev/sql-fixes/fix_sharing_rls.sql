-- Create a function to fetch shared document content that bypasses RLS
CREATE OR REPLACE FUNCTION get_shared_document_content(
  p_share_code TEXT,
  p_document_id UUID
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB,
  user_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Return document data for valid shares
  RETURN QUERY
  SELECT 
    d.id,
    d.title,
    d.tags,
    d.created_at,
    d.updated_at,
    d.metadata,
    d.user_id
  FROM documents d
  INNER JOIN document_shares ds ON ds.document_id = d.id
  WHERE ds.share_code = p_share_code
  AND ds.document_id = p_document_id
  AND ds.is_active = true
  AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
  AND d.deleted_at IS NULL
  LIMIT 1;
END;
$$;

-- Create a function to fetch shared document blocks that bypasses RLS
CREATE OR REPLACE FUNCTION get_shared_document_blocks(
  p_document_id UUID,
  p_share_code TEXT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  type TEXT,
  content TEXT,
  metadata JSONB,
  position INT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the share is valid first
  IF NOT EXISTS (
    SELECT 1 FROM document_shares
    WHERE share_code = p_share_code
    AND document_id = p_document_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) THEN
    RETURN;
  END IF;

  -- Return blocks for the document
  RETURN QUERY
  SELECT 
    b.id,
    b.document_id,
    b.type,
    b.content,
    b.metadata,
    b.position,
    b.parent_id,
    b.created_at,
    b.updated_at
  FROM blocks b
  WHERE b.document_id = p_document_id
  AND b.deleted_at IS NULL
  ORDER BY b.position;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_shared_document_content TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_document_blocks TO anon, authenticated;

-- Alternative: Update the RLS policy to allow viewing shared documents
-- This is a more comprehensive solution but requires careful testing
DROP POLICY IF EXISTS "Users can view their own non-deleted documents" ON documents;

CREATE POLICY "Users can view own and shared documents"
ON documents
FOR SELECT
TO public
USING (
  -- User owns the document
  (user_id = auth.uid() AND deleted_at IS NULL)
  OR
  -- Document is shared via a valid share link
  EXISTS (
    SELECT 1 FROM document_shares ds
    WHERE ds.document_id = documents.id
    AND ds.is_active = true
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    -- For authenticated users, check if they have access to this share
    AND (
      -- Public shares are accessible to everyone
      ds.share_type = 'link'
      -- User-specific shares require matching user
      OR (ds.share_type = 'user' AND EXISTS (
        SELECT 1 FROM document_share_users dsu
        WHERE dsu.share_id = ds.id
        AND dsu.user_id = auth.uid()
      ))
    )
  )
);

-- Similar policy for blocks
DROP POLICY IF EXISTS "Users can view blocks for their documents" ON blocks;

CREATE POLICY "Users can view blocks for owned and shared documents"
ON blocks
FOR SELECT
TO public
USING (
  -- User owns the document
  document_id IN (
    SELECT id FROM documents
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL
  )
  OR
  -- Document is shared
  document_id IN (
    SELECT ds.document_id FROM document_shares ds
    WHERE ds.is_active = true
    AND (ds.expires_at IS NULL OR ds.expires_at > NOW())
    AND (
      ds.share_type = 'link'
      OR (ds.share_type = 'user' AND EXISTS (
        SELECT 1 FROM document_share_users dsu
        WHERE dsu.share_id = ds.id
        AND dsu.user_id = auth.uid()
      ))
    )
  )
);