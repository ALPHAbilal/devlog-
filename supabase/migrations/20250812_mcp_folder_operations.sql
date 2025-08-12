-- MCP Folder Operations Functions
-- These functions enable folder management through the MCP API
-- Date: 2025-08-12

-- ============================================
-- 1. CREATE FOLDER
-- ============================================
CREATE OR REPLACE FUNCTION mcp_create_folder(
  p_api_key TEXT,
  p_name TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_color TEXT DEFAULT '#6B7280',
  p_icon TEXT DEFAULT 'folder'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_folder_id UUID;
  v_parent_path TEXT;
  v_position INTEGER;
BEGIN
  -- Validate API key and get user_id
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Check if parent folder exists and belongs to user
  IF p_parent_id IS NOT NULL THEN
    SELECT path INTO v_parent_path
    FROM folders
    WHERE id = p_parent_id AND user_id = v_user_id;
    
    IF v_parent_path IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Parent folder not found or access denied');
    END IF;
  END IF;
  
  -- Get next position
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_position
  FROM folders
  WHERE user_id = v_user_id 
    AND (parent_id = p_parent_id OR (parent_id IS NULL AND p_parent_id IS NULL));
  
  -- Create the folder
  INSERT INTO folders (user_id, parent_id, name, color, icon, position)
  VALUES (v_user_id, p_parent_id, p_name, p_color, p_icon, v_position)
  RETURNING id INTO v_folder_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'folder_id', v_folder_id,
    'message', 'Folder created successfully'
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'A folder with this name already exists in the parent folder');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 2. LIST FOLDERS
-- ============================================
CREATE OR REPLACE FUNCTION mcp_list_folders(
  p_api_key TEXT,
  p_parent_id UUID DEFAULT NULL,
  p_recursive BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_folders JSONB;
BEGIN
  -- Validate API key
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  IF p_recursive THEN
    -- Get all folders in hierarchy
    WITH RECURSIVE folder_tree AS (
      SELECT id, parent_id, name, color, icon, is_expanded, is_favorite, 
             position, created_at, updated_at, path, 0 as depth
      FROM folders
      WHERE user_id = v_user_id 
        AND (parent_id = p_parent_id OR (parent_id IS NULL AND p_parent_id IS NULL))
      
      UNION ALL
      
      SELECT f.id, f.parent_id, f.name, f.color, f.icon, f.is_expanded, 
             f.is_favorite, f.position, f.created_at, f.updated_at, f.path, 
             ft.depth + 1
      FROM folders f
      INNER JOIN folder_tree ft ON f.parent_id = ft.id
      WHERE f.user_id = v_user_id
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'parent_id', parent_id,
        'name', name,
        'color', color,
        'icon', icon,
        'is_expanded', is_expanded,
        'is_favorite', is_favorite,
        'position', position,
        'depth', depth,
        'path', path,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY depth, position, name
    ) INTO v_folders
    FROM folder_tree;
  ELSE
    -- Get only direct children
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'parent_id', parent_id,
        'name', name,
        'color', color,
        'icon', icon,
        'is_expanded', is_expanded,
        'is_favorite', is_favorite,
        'position', position,
        'path', path,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY position, name
    ) INTO v_folders
    FROM folders
    WHERE user_id = v_user_id 
      AND (parent_id = p_parent_id OR (parent_id IS NULL AND p_parent_id IS NULL));
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'folders', COALESCE(v_folders, '[]'::jsonb)
  );
END;
$$;

-- ============================================
-- 3. GET FOLDER CONTENTS
-- ============================================
CREATE OR REPLACE FUNCTION mcp_get_folder_contents(
  p_api_key TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_include_subfolders BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_folders JSONB;
  v_documents JSONB;
BEGIN
  -- Validate API key
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Check folder exists if specified
  IF p_folder_id IS NOT NULL THEN
    PERFORM 1 FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Folder not found or access denied');
    END IF;
  END IF;
  
  -- Get subfolders if requested
  IF p_include_subfolders THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'type', 'folder',
        'color', color,
        'icon', icon,
        'position', position,
        'created_at', created_at
      ) ORDER BY position, name
    ) INTO v_folders
    FROM folders
    WHERE user_id = v_user_id 
      AND (parent_id = p_folder_id OR (parent_id IS NULL AND p_folder_id IS NULL));
  END IF;
  
  -- Get documents in folder
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'type', 'document',
      'tags', tags,
      'position', position,
      'created_at', created_at,
      'updated_at', updated_at
    ) ORDER BY position, title
  ) INTO v_documents
  FROM documents
  WHERE user_id = v_user_id 
    AND deleted_at IS NULL
    AND (folder_id = p_folder_id OR (folder_id IS NULL AND p_folder_id IS NULL));
  
  RETURN jsonb_build_object(
    'success', true,
    'folder_id', p_folder_id,
    'folders', COALESCE(v_folders, '[]'::jsonb),
    'documents', COALESCE(v_documents, '[]'::jsonb),
    'total_folders', COALESCE(jsonb_array_length(v_folders), 0),
    'total_documents', COALESCE(jsonb_array_length(v_documents), 0)
  );
END;
$$;

-- ============================================
-- 4. MOVE DOCUMENT TO FOLDER
-- ============================================
CREATE OR REPLACE FUNCTION mcp_move_document(
  p_api_key TEXT,
  p_document_id UUID,
  p_folder_id UUID DEFAULT NULL,
  p_position INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_position INTEGER;
BEGIN
  -- Validate API key
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Check document exists and belongs to user
  PERFORM 1 FROM documents 
  WHERE id = p_document_id AND user_id = v_user_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Document not found or access denied');
  END IF;
  
  -- Check folder exists if specified
  IF p_folder_id IS NOT NULL THEN
    PERFORM 1 FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Folder not found or access denied');
    END IF;
  END IF;
  
  -- Calculate position if not provided
  IF p_position IS NULL THEN
    SELECT COALESCE(MAX(position), -1) + 1 INTO v_new_position
    FROM documents
    WHERE user_id = v_user_id 
      AND deleted_at IS NULL
      AND (folder_id = p_folder_id OR (folder_id IS NULL AND p_folder_id IS NULL));
  ELSE
    v_new_position := p_position;
  END IF;
  
  -- Update document
  UPDATE documents
  SET folder_id = p_folder_id,
      position = v_new_position,
      updated_at = NOW()
  WHERE id = p_document_id AND user_id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Document moved successfully',
    'document_id', p_document_id,
    'folder_id', p_folder_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 5. DELETE FOLDER
-- ============================================
CREATE OR REPLACE FUNCTION mcp_delete_folder(
  p_api_key TEXT,
  p_folder_id UUID,
  p_recursive BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_child_count INTEGER;
  v_doc_count INTEGER;
BEGIN
  -- Validate API key
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Check folder exists and belongs to user
  PERFORM 1 FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folder not found or access denied');
  END IF;
  
  -- Check for child folders
  SELECT COUNT(*) INTO v_child_count
  FROM folders
  WHERE parent_id = p_folder_id AND user_id = v_user_id;
  
  -- Check for documents
  SELECT COUNT(*) INTO v_doc_count
  FROM documents
  WHERE folder_id = p_folder_id AND user_id = v_user_id AND deleted_at IS NULL;
  
  IF (v_child_count > 0 OR v_doc_count > 0) AND NOT p_recursive THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', format('Folder is not empty. Contains %s folders and %s documents. Use recursive=true to delete all contents.', 
                      v_child_count, v_doc_count)
    );
  END IF;
  
  IF p_recursive THEN
    -- Move all documents to root (or delete them based on your preference)
    UPDATE documents
    SET folder_id = NULL,
        updated_at = NOW()
    WHERE folder_id = p_folder_id AND user_id = v_user_id;
    
    -- Delete folder (cascade will handle child folders)
    DELETE FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
  ELSE
    -- Delete empty folder
    DELETE FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Folder deleted successfully',
    'deleted_folder_id', p_folder_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 6. UPDATE FOLDER
-- ============================================
CREATE OR REPLACE FUNCTION mcp_update_folder(
  p_api_key TEXT,
  p_folder_id UUID,
  p_name TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_is_favorite BOOLEAN DEFAULT NULL,
  p_parent_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Validate API key
  SELECT user_id INTO v_user_id
  FROM api_keys
  WHERE key = p_api_key AND (expires_at IS NULL OR expires_at > NOW());
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired API key');
  END IF;
  
  -- Check folder exists and belongs to user
  PERFORM 1 FROM folders WHERE id = p_folder_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folder not found or access denied');
  END IF;
  
  -- Update folder with provided fields
  UPDATE folders
  SET 
    name = COALESCE(p_name, name),
    color = COALESCE(p_color, color),
    icon = COALESCE(p_icon, icon),
    is_favorite = COALESCE(p_is_favorite, is_favorite),
    parent_id = CASE 
      WHEN p_parent_id IS NOT NULL THEN p_parent_id 
      ELSE parent_id 
    END,
    updated_at = NOW()
  WHERE id = p_folder_id AND user_id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Folder updated successfully',
    'folder_id', p_folder_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'A folder with this name already exists in the parent folder');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION mcp_create_folder TO authenticated;
GRANT EXECUTE ON FUNCTION mcp_list_folders TO authenticated;
GRANT EXECUTE ON FUNCTION mcp_get_folder_contents TO authenticated;
GRANT EXECUTE ON FUNCTION mcp_move_document TO authenticated;
GRANT EXECUTE ON FUNCTION mcp_delete_folder TO authenticated;
GRANT EXECUTE ON FUNCTION mcp_update_folder TO authenticated;