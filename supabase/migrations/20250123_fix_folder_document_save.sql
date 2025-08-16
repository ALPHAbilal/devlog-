-- Fix for documents in deep folders not saving content
-- This creates an atomic save function that handles both document and blocks together
-- Date: 2025-01-23

-- Create a new function that saves document and blocks atomically
CREATE OR REPLACE FUNCTION public.save_document_with_blocks_atomic(
    p_document_id uuid,
    p_user_id uuid,
    p_title text,
    p_tags text[],
    p_folder_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb,
    p_is_template boolean DEFAULT false,
    p_position integer DEFAULT 0,
    p_blocks jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    v_auth_user_id uuid;
    v_document_exists boolean;
    v_saved_doc_id uuid;
    block_ids UUID[];
    block_types TEXT[];
    block_contents TEXT[];
    block_positions INTEGER[];
    block_metadatas JSONB[];
    block_languages TEXT[];
    block_file_paths TEXT[];
BEGIN
    -- Get authenticated user
    v_auth_user_id := auth.uid();
    
    -- Verify user authorization
    IF v_auth_user_id IS NULL OR v_auth_user_id != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: User mismatch';
    END IF;
    
    -- Check if document exists
    SELECT EXISTS(
        SELECT 1 FROM documents 
        WHERE id = p_document_id 
        AND user_id = v_auth_user_id
        AND deleted_at IS NULL
    ) INTO v_document_exists;
    
    -- Start transaction
    BEGIN
        IF v_document_exists THEN
            -- Update existing document
            UPDATE documents SET
                title = p_title,
                tags = p_tags,
                folder_id = p_folder_id,
                metadata = p_metadata,
                is_template = p_is_template,
                position = p_position,
                updated_at = NOW()
            WHERE id = p_document_id 
            AND user_id = v_auth_user_id
            AND deleted_at IS NULL
            RETURNING id INTO v_saved_doc_id;
        ELSE
            -- Verify folder exists if provided
            IF p_folder_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM folders 
                    WHERE id = p_folder_id 
                    AND user_id = v_auth_user_id
                ) THEN
                    RAISE EXCEPTION 'Folder not found or access denied';
                END IF;
            END IF;
            
            -- Insert new document
            INSERT INTO documents (
                id, user_id, title, tags, folder_id, metadata, 
                is_template, position, created_at, updated_at
            ) VALUES (
                p_document_id, v_auth_user_id, p_title, p_tags, p_folder_id, 
                p_metadata, p_is_template, p_position, NOW(), NOW()
            )
            RETURNING id INTO v_saved_doc_id;
        END IF;
        
        -- Now handle blocks if provided
        IF jsonb_array_length(p_blocks) > 0 THEN
            -- Extract arrays from JSONB for bulk operations
            SELECT 
                array_agg(COALESCE((b->>'id')::UUID, gen_random_uuid())),
                array_agg(b->>'type'),
                array_agg(COALESCE(b->>'content', '')),
                array_agg((b->>'position')::INTEGER),
                array_agg(COALESCE((b->'metadata')::JSONB, '{}'::JSONB)),
                array_agg(b->>'language'),
                array_agg(b->>'file_path')
            INTO 
                block_ids,
                block_types,
                block_contents,
                block_positions,
                block_metadatas,
                block_languages,
                block_file_paths
            FROM jsonb_array_elements(p_blocks) AS b;
            
            -- Delete existing blocks
            DELETE FROM blocks 
            WHERE document_id = v_saved_doc_id 
            AND deleted_at IS NULL;
            
            -- Insert all blocks at once
            INSERT INTO blocks (
                id, document_id, type, content, position,
                metadata, language, file_path, user_id,
                created_at, updated_at
            )
            SELECT 
                unnest(block_ids),
                v_saved_doc_id,
                unnest(block_types),
                unnest(block_contents),
                unnest(block_positions),
                unnest(block_metadatas),
                unnest(block_languages),
                unnest(block_file_paths),
                v_auth_user_id,
                NOW(),
                NOW();
        END IF;
        
        -- Return success with document data
        RETURN jsonb_build_object(
            'success', true,
            'document_id', v_saved_doc_id,
            'message', 'Document and blocks saved successfully'
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback will happen automatically
            RAISE;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_document_with_blocks_atomic TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.save_document_with_blocks_atomic IS 
'Atomically saves a document and its blocks in a single transaction, preventing race conditions when creating documents in folders';