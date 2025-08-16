-- Add nested folder support to devlog
-- This migration transforms the flat project structure into a VSCode-style nested folder hierarchy

-- First, let's create the folders table for organizing documents
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280', -- Default gray color
  icon TEXT DEFAULT 'folder', -- Can be 'folder', 'folder-open', etc.
  is_expanded BOOLEAN DEFAULT false, -- Track expansion state per user
  is_favorite BOOLEAN DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0, -- For ordering within parent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique names within the same parent folder for the same user
  CONSTRAINT unique_folder_name_per_parent UNIQUE (user_id, parent_id, name)
);

-- Add folder support to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0; -- For ordering within folder

-- Create a materialized path column for efficient hierarchy queries
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS path TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_path ON folders(path);
CREATE INDEX IF NOT EXISTS idx_folders_user_parent ON folders(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_folder ON documents(user_id, folder_id);

-- Enable RLS for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update folder paths when hierarchy changes
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path = '/' || NEW.id::TEXT || '/';
  ELSE
    SELECT path INTO parent_path FROM folders WHERE id = NEW.parent_id;
    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent folder not found';
    END IF;
    NEW.path = parent_path || NEW.id::TEXT || '/';
  END IF;
  
  -- If updating, also update all children paths
  IF TG_OP = 'UPDATE' AND OLD.path IS DISTINCT FROM NEW.path THEN
    UPDATE folders 
    SET path = REPLACE(path, OLD.path, NEW.path)
    WHERE path LIKE OLD.path || '%' AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to maintain folder paths
CREATE TRIGGER maintain_folder_path
BEFORE INSERT OR UPDATE OF parent_id ON folders
FOR EACH ROW
EXECUTE FUNCTION update_folder_path();

-- Function to prevent circular references in folder hierarchy
CREATE OR REPLACE FUNCTION check_folder_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  current_parent UUID;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if trying to set self as parent
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'A folder cannot be its own parent';
  END IF;
  
  -- Check for circular reference
  current_parent := NEW.parent_id;
  WHILE current_parent IS NOT NULL LOOP
    IF current_parent = NEW.id THEN
      RAISE EXCEPTION 'Circular reference detected in folder hierarchy';
    END IF;
    SELECT parent_id INTO current_parent FROM folders WHERE id = current_parent;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular references
CREATE TRIGGER check_folder_hierarchy_trigger
BEFORE INSERT OR UPDATE OF parent_id ON folders
FOR EACH ROW
EXECUTE FUNCTION check_folder_hierarchy();

-- Function to get folder tree for a user
CREATE OR REPLACE FUNCTION get_folder_tree(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  name TEXT,
  color TEXT,
  icon TEXT,
  is_expanded BOOLEAN,
  is_favorite BOOLEAN,
  position INTEGER,
  path TEXT,
  level INTEGER,
  document_count BIGINT,
  total_size BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE folder_tree AS (
    -- Root level folders
    SELECT 
      f.id,
      f.parent_id,
      f.name,
      f.color,
      f.icon,
      f.is_expanded,
      f.is_favorite,
      f.position,
      f.path,
      0 as level
    FROM folders f
    WHERE f.user_id = p_user_id AND f.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive part: child folders
    SELECT 
      f.id,
      f.parent_id,
      f.name,
      f.color,
      f.icon,
      f.is_expanded,
      f.is_favorite,
      f.position,
      f.path,
      ft.level + 1
    FROM folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
    WHERE f.user_id = p_user_id
  ),
  folder_stats AS (
    SELECT 
      f.id,
      COUNT(DISTINCT d.id) as document_count,
      COALESCE(SUM(LENGTH(b.content)), 0) as total_size
    FROM folder_tree f
    LEFT JOIN documents d ON d.folder_id = f.id
    LEFT JOIN blocks b ON b.document_id = d.id
    GROUP BY f.id
  )
  SELECT 
    ft.*,
    fs.document_count,
    fs.total_size,
    f.created_at,
    f.updated_at
  FROM folder_tree ft
  JOIN folders f ON f.id = ft.id
  LEFT JOIN folder_stats fs ON fs.id = ft.id
  ORDER BY ft.level, ft.position, ft.name;
END;
$$ LANGUAGE plpgsql;

-- Function to move folder (with circular reference check)
CREATE OR REPLACE FUNCTION move_folder(
  p_folder_id UUID,
  p_new_parent_id UUID,
  p_new_position INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id of the folder
  SELECT user_id INTO v_user_id FROM folders WHERE id = p_folder_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Folder not found';
  END IF;
  
  -- Check permissions
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Update the folder
  UPDATE folders 
  SET 
    parent_id = p_new_parent_id,
    position = COALESCE(p_new_position, position),
    updated_at = NOW()
  WHERE id = p_folder_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get documents in folder (including subfolders)
CREATE OR REPLACE FUNCTION get_documents_in_folder(
  p_folder_id UUID,
  p_recursive BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title TEXT,
  preview TEXT,
  tags TEXT[],
  folder_id UUID,
  folder_name TEXT,
  folder_path TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  block_count BIGINT,
  has_code BOOLEAN,
  has_ai BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH target_folders AS (
    SELECT id, name, path 
    FROM folders 
    WHERE CASE 
      WHEN p_recursive THEN 
        path LIKE (SELECT path FROM folders WHERE id = p_folder_id) || '%'
      ELSE 
        id = p_folder_id 
    END
  )
  SELECT 
    d.id,
    d.title,
    d.preview,
    d.tags,
    d.folder_id,
    f.name as folder_name,
    f.path as folder_path,
    d.position,
    d.created_at,
    d.updated_at,
    COUNT(b.id) as block_count,
    BOOL_OR(b.type = 'code') as has_code,
    BOOL_OR(b.type = 'ai_conversation') as has_ai
  FROM documents d
  JOIN target_folders f ON d.folder_id = f.id
  LEFT JOIN blocks b ON b.document_id = d.id
  WHERE d.user_id = auth.uid()
  GROUP BY d.id, d.title, d.preview, d.tags, d.folder_id, f.name, f.path, d.position, d.created_at, d.updated_at
  ORDER BY d.position, d.title
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Migration: Convert existing projects to root-level folders
INSERT INTO folders (user_id, name, color, icon, is_favorite, position, created_at, updated_at)
SELECT 
  user_id,
  title as name,
  color,
  icon,
  false as is_favorite, -- Can be updated based on your logic
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as position,
  created_at,
  updated_at
FROM projects
ON CONFLICT (user_id, parent_id, name) DO NOTHING;

-- Update documents to reference the new folders
UPDATE documents d
SET folder_id = f.id
FROM projects p
JOIN folders f ON f.user_id = p.user_id AND f.name = p.title AND f.parent_id IS NULL
WHERE d.project_id = p.id;

-- Add trigger to update folder timestamps when documents change
CREATE OR REPLACE FUNCTION update_folder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.folder_id IS NOT NULL THEN
      UPDATE folders 
      SET updated_at = NOW()
      WHERE id = NEW.folder_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.folder_id IS NOT NULL THEN
      UPDATE folders 
      SET updated_at = NOW()
      WHERE id = OLD.folder_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_folder_timestamp_on_document_change
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_folder_timestamp();