-- Function to decrement block positions after deletion
-- This should be created in Supabase SQL editor

CREATE OR REPLACE FUNCTION decrement_block_positions(
  p_document_id UUID,
  p_deleted_position INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE blocks
  SET position = position - 1
  WHERE document_id = p_document_id
    AND position > p_deleted_position
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;