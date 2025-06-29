-- Fix soft_delete_document function with correct syntax and parameter name
DROP FUNCTION IF EXISTS public.soft_delete_document(UUID);

CREATE OR REPLACE FUNCTION public.soft_delete_document(
  p_document_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_row_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Soft delete the document if owned by user
  UPDATE public.documents
  SET deleted_at = NOW()
  WHERE id = p_document_id
    AND user_id = v_user_id
    AND deleted_at IS NULL;
    
  -- Get the number of affected rows
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  
  -- Also soft delete all blocks if document was deleted
  IF v_row_count > 0 THEN
    UPDATE public.blocks
    SET deleted_at = NOW()
    WHERE document_id = p_document_id
      AND deleted_at IS NULL;
      
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.soft_delete_document(UUID) TO authenticated;