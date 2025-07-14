-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#10b981',
  document_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project support to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_project BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_project ON documents(user_id, project_id);

-- Enable RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update document count in projects
CREATE OR REPLACE FUNCTION update_project_document_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.project_id IS NOT NULL THEN
    UPDATE projects 
    SET document_count = document_count + 1,
        updated_at = NOW()
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' AND OLD.project_id IS NOT NULL THEN
    UPDATE projects 
    SET document_count = document_count - 1,
        updated_at = NOW()
    WHERE id = OLD.project_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle moving document between projects
    IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
      IF OLD.project_id IS NOT NULL THEN
        UPDATE projects 
        SET document_count = document_count - 1,
            updated_at = NOW()
        WHERE id = OLD.project_id;
      END IF;
      IF NEW.project_id IS NOT NULL THEN
        UPDATE projects 
        SET document_count = document_count + 1,
            updated_at = NOW()
        WHERE id = NEW.project_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document count
CREATE TRIGGER update_project_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_project_document_count();

-- Function to get projects with stats
CREATE OR REPLACE FUNCTION get_projects_with_stats(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  icon TEXT,
  color TEXT,
  document_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_document_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.icon,
    p.color,
    p.document_count,
    p.created_at,
    p.updated_at,
    MAX(d.updated_at) as last_document_date
  FROM projects p
  LEFT JOIN documents d ON d.project_id = p.id
  WHERE p.user_id = p_user_id
  GROUP BY p.id, p.title, p.description, p.icon, p.color, p.document_count, p.created_at, p.updated_at
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Update existing get_documents_with_stats to include project info
CREATE OR REPLACE FUNCTION get_documents_with_stats(
  p_user_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  preview text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  block_count bigint,
  last_block_type text,
  has_code boolean,
  has_ai boolean,
  total_length integer,
  version integer,
  project_id uuid,
  project_title text,
  project_color text,
  project_icon text
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH doc_stats AS (
    SELECT 
      d.id,
      d.title,
      d.preview,
      d.tags,
      d.created_at,
      d.updated_at,
      d.version,
      d.project_id,
      COUNT(b.id) as block_count,
      MAX(b.type) FILTER (WHERE b.created_at = (SELECT MAX(created_at) FROM blocks WHERE document_id = d.id)) as last_block_type,
      BOOL_OR(b.type = 'code') as has_code,
      BOOL_OR(b.type = 'ai_conversation') as has_ai,
      COALESCE(SUM(LENGTH(b.content)), 0)::integer as total_length
    FROM documents d
    LEFT JOIN blocks b ON b.document_id = d.id
    WHERE d.user_id = p_user_id
    GROUP BY d.id, d.title, d.preview, d.tags, d.created_at, d.updated_at, d.version, d.project_id
  )
  SELECT 
    ds.*,
    p.title as project_title,
    p.color as project_color,
    p.icon as project_icon
  FROM doc_stats ds
  LEFT JOIN projects p ON p.id = ds.project_id
  ORDER BY ds.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$function$;