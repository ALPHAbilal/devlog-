-- Add soft delete columns to documents and blocks tables
-- This allows for data recovery and audit trails

-- Add deleted_at column to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to blocks table
ALTER TABLE public.blocks 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at 
ON public.documents(deleted_at) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at 
ON public.blocks(deleted_at) 
WHERE deleted_at IS NULL;

-- Update RLS policies to exclude soft-deleted records by default
-- Documents policies
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own non-deleted documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- For soft delete, we update instead of actually deleting
CREATE POLICY "Users can soft delete their own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Blocks policies
DROP POLICY IF EXISTS "Users can view blocks of their documents" ON public.blocks;
CREATE POLICY "Users can view non-deleted blocks of their documents" ON public.blocks
  FOR SELECT USING (
    deleted_at IS NULL AND
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = blocks.document_id 
      AND documents.user_id = auth.uid()
      AND documents.deleted_at IS NULL
    )
  );

-- Function to perform soft delete on documents (and cascade to blocks)
CREATE OR REPLACE FUNCTION public.soft_delete_document(doc_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Update document
  UPDATE public.documents 
  SET deleted_at = NOW()
  WHERE id = doc_id 
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
    
  -- Cascade to blocks
  UPDATE public.blocks
  SET deleted_at = NOW()
  WHERE document_id = doc_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore soft-deleted documents
CREATE OR REPLACE FUNCTION public.restore_document(doc_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Restore document
  UPDATE public.documents 
  SET deleted_at = NULL
  WHERE id = doc_id 
    AND user_id = auth.uid()
    AND deleted_at IS NOT NULL;
    
  -- Restore blocks
  UPDATE public.blocks
  SET deleted_at = NULL
  WHERE document_id = doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.soft_delete_document TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_document TO authenticated;

-- Add comments
COMMENT ON COLUMN public.documents.deleted_at IS 'Timestamp when the document was soft deleted';
COMMENT ON COLUMN public.blocks.deleted_at IS 'Timestamp when the block was soft deleted';
COMMENT ON FUNCTION public.soft_delete_document IS 'Soft deletes a document and all its blocks';
COMMENT ON FUNCTION public.restore_document IS 'Restores a soft-deleted document and all its blocks';