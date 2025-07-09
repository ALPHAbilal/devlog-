-- Create additional indexes for better query performance
-- Focus on columns frequently used in WHERE clauses and JOINs

-- User-based queries optimization
CREATE INDEX IF NOT EXISTS idx_documents_user_id_updated_at 
ON public.documents(user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_user_id_created_at 
ON public.documents(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Template queries optimization
CREATE INDEX IF NOT EXISTS idx_documents_is_template 
ON public.documents(is_template) 
WHERE deleted_at IS NULL AND is_template = true;

-- Blocks optimization for document queries
CREATE INDEX IF NOT EXISTS idx_blocks_document_id_position_active 
ON public.blocks(document_id, position) 
WHERE deleted_at IS NULL;

-- Type-based block queries
CREATE INDEX IF NOT EXISTS idx_blocks_type 
ON public.blocks(type) 
WHERE deleted_at IS NULL;

-- Combined index for blocks RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_blocks_document_id_deleted 
ON public.blocks(document_id) 
WHERE deleted_at IS NULL;

-- Settings table optimization
CREATE INDEX IF NOT EXISTS idx_settings_user_id 
ON public.settings(user_id);

-- Images table optimization (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_images_created_at 
ON public.images(created_at DESC);

-- Document links optimization for graph queries
CREATE INDEX IF NOT EXISTS idx_document_links_source_target 
ON public.document_links(source_document_id, target_document_id);

-- Full text search optimization with partial indexes
DROP INDEX IF EXISTS idx_documents_search;
CREATE INDEX idx_documents_search_active 
ON public.documents USING GIN(search_vector) 
WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_blocks_search;
CREATE INDEX idx_blocks_search_active 
ON public.blocks USING GIN(search_vector) 
WHERE deleted_at IS NULL;

-- Analyze tables to update statistics
ANALYZE public.documents;
ANALYZE public.blocks;
ANALYZE public.settings;
ANALYZE public.images;
ANALYZE public.document_links;

-- Add comment
COMMENT ON INDEX idx_documents_user_id_updated_at IS 'Optimizes user document list queries sorted by update time';
COMMENT ON INDEX idx_blocks_document_id_position_active IS 'Optimizes block retrieval for active documents';