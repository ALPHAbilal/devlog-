-- Create document versions table for version control
-- This allows tracking changes and reverting to previous versions

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  snapshot JSONB NOT NULL, -- Full document state including blocks
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  change_summary TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(document_id, version_number)
);

-- Create indexes for version queries
CREATE INDEX idx_document_versions_document_id 
ON public.document_versions(document_id, version_number DESC);

CREATE INDEX idx_document_versions_created_at 
ON public.document_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document versions
CREATE POLICY "Users can view versions of their documents" ON public.document_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_versions.document_id 
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of their documents" ON public.document_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents 
      WHERE documents.id = document_versions.document_id 
      AND documents.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Function to create a document version
CREATE OR REPLACE FUNCTION public.create_document_version(
  doc_id UUID,
  summary TEXT DEFAULT NULL
)
RETURNS public.document_versions AS $$
DECLARE
  doc_record RECORD;
  blocks_array JSONB;
  new_version_number INTEGER;
  new_version public.document_versions;
BEGIN
  -- Get document data
  SELECT * INTO doc_record
  FROM public.documents
  WHERE id = doc_id 
    AND user_id = auth.uid()
    AND deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- Get all blocks for the document
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', b.id,
      'type', b.type,
      'content', b.content,
      'position', b.position,
      'metadata', b.metadata,
      'language', b.language,
      'file_path', b.file_path,
      'extracted_tags', b.extracted_tags
    ) ORDER BY b.position
  ) INTO blocks_array
  FROM public.blocks b
  WHERE b.document_id = doc_id
    AND b.deleted_at IS NULL;
  
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO new_version_number
  FROM public.document_versions
  WHERE document_id = doc_id;
  
  -- Create version snapshot
  INSERT INTO public.document_versions (
    document_id,
    version_number,
    title,
    snapshot,
    created_by,
    change_summary,
    metadata
  ) VALUES (
    doc_id,
    new_version_number,
    doc_record.title,
    jsonb_build_object(
      'title', doc_record.title,
      'tags', doc_record.tags,
      'is_template', doc_record.is_template,
      'metadata', doc_record.metadata,
      'blocks', COALESCE(blocks_array, '[]'::JSONB)
    ),
    auth.uid(),
    summary,
    jsonb_build_object(
      'blocks_count', COALESCE(jsonb_array_length(blocks_array), 0),
      'created_from_updated_at', doc_record.updated_at
    )
  ) RETURNING * INTO new_version;
  
  RETURN new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore a document version
CREATE OR REPLACE FUNCTION public.restore_document_version(
  version_id UUID
)
RETURNS VOID AS $$
DECLARE
  version_record RECORD;
  doc_snapshot JSONB;
  blocks_snapshot JSONB;
BEGIN
  -- Get version data
  SELECT v.*, d.user_id
  INTO version_record
  FROM public.document_versions v
  JOIN public.documents d ON v.document_id = d.id
  WHERE v.id = version_id
    AND d.user_id = auth.uid()
    AND d.deleted_at IS NULL;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found or access denied';
  END IF;
  
  doc_snapshot := version_record.snapshot;
  blocks_snapshot := doc_snapshot->'blocks';
  
  -- Update document
  UPDATE public.documents
  SET 
    title = doc_snapshot->>'title',
    tags = (doc_snapshot->'tags')::TEXT[],
    is_template = (doc_snapshot->>'is_template')::BOOLEAN,
    metadata = COALESCE(doc_snapshot->'metadata', '{}'),
    updated_at = NOW()
  WHERE id = version_record.document_id;
  
  -- Delete existing blocks
  DELETE FROM public.blocks
  WHERE document_id = version_record.document_id
    AND deleted_at IS NULL;
  
  -- Restore blocks
  INSERT INTO public.blocks (
    id,
    document_id,
    type,
    content,
    position,
    metadata,
    language,
    file_path,
    extracted_tags
  )
  SELECT 
    COALESCE((b->>'id')::UUID, gen_random_uuid()),
    version_record.document_id,
    b->>'type',
    b->>'content',
    (b->>'position')::INTEGER,
    COALESCE((b->'metadata')::JSONB, '{}'),
    b->>'language',
    b->>'file_path',
    COALESCE((b->'extracted_tags')::TEXT[], ARRAY[]::TEXT[])
  FROM jsonb_array_elements(blocks_snapshot) AS b;
  
  -- Create a new version to track the restoration
  PERFORM public.create_document_version(
    version_record.document_id,
    format('Restored from version %s', version_record.version_number)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get version diff
CREATE OR REPLACE FUNCTION public.get_version_diff(
  version1_id UUID,
  version2_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v1 RECORD;
  v2 RECORD;
  diff JSONB;
BEGIN
  -- Get both versions
  SELECT * INTO v1
  FROM public.document_versions v
  JOIN public.documents d ON v.document_id = d.id
  WHERE v.id = version1_id
    AND d.user_id = auth.uid();
    
  SELECT * INTO v2
  FROM public.document_versions v
  JOIN public.documents d ON v.document_id = d.id
  WHERE v.id = version2_id
    AND d.user_id = auth.uid();
    
  IF v1 IS NULL OR v2 IS NULL OR v1.document_id != v2.document_id THEN
    RAISE EXCEPTION 'Invalid versions for comparison';
  END IF;
  
  -- Create diff object
  diff := jsonb_build_object(
    'version1', jsonb_build_object(
      'id', v1.id,
      'version_number', v1.version_number,
      'created_at', v1.created_at,
      'title', v1.snapshot->>'title'
    ),
    'version2', jsonb_build_object(
      'id', v2.id,
      'version_number', v2.version_number,
      'created_at', v2.created_at,
      'title', v2.snapshot->>'title'
    ),
    'title_changed', (v1.snapshot->>'title') != (v2.snapshot->>'title'),
    'blocks_count_v1', jsonb_array_length(v1.snapshot->'blocks'),
    'blocks_count_v2', jsonb_array_length(v2.snapshot->'blocks')
  );
  
  RETURN diff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_document_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_document_version TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_version_diff TO authenticated;

-- Add comments
COMMENT ON TABLE public.document_versions IS 'Stores versioned snapshots of documents and their blocks';
COMMENT ON FUNCTION public.create_document_version IS 'Creates a new version snapshot of a document';
COMMENT ON FUNCTION public.restore_document_version IS 'Restores a document to a previous version';
COMMENT ON FUNCTION public.get_version_diff IS 'Compares two versions of a document';