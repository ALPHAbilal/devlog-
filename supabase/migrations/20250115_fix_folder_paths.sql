-- Fix folder paths for existing folders
-- This migration ensures all folders have proper paths set

-- First, update the trigger to handle NULL parent_id correctly
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    -- For root folders, path is just /id/
    NEW.path = '/' || NEW.id::TEXT || '/';
  ELSE
    -- For child folders, get parent path
    SELECT path INTO parent_path FROM folders WHERE id = NEW.parent_id;
    IF parent_path IS NULL THEN
      -- If parent doesn't have a path yet, set it first
      UPDATE folders SET path = '/' || id::TEXT || '/' WHERE id = NEW.parent_id AND path IS NULL;
      SELECT path INTO parent_path FROM folders WHERE id = NEW.parent_id;
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

-- Now update all existing folders to have proper paths
-- Start with root folders (no parent_id)
UPDATE folders 
SET path = '/' || id::TEXT || '/'
WHERE parent_id IS NULL AND path IS NULL;

-- Then update child folders level by level
-- Level 1 children
UPDATE folders f1
SET path = f2.path || f1.id::TEXT || '/'
FROM folders f2
WHERE f1.parent_id = f2.id 
  AND f1.path IS NULL
  AND f2.path IS NOT NULL;

-- Level 2 children
UPDATE folders f1
SET path = f2.path || f1.id::TEXT || '/'
FROM folders f2
WHERE f1.parent_id = f2.id 
  AND f1.path IS NULL
  AND f2.path IS NOT NULL;

-- Level 3 children (repeat as needed for deeper nesting)
UPDATE folders f1
SET path = f2.path || f1.id::TEXT || '/'
FROM folders f2
WHERE f1.parent_id = f2.id 
  AND f1.path IS NULL
  AND f2.path IS NOT NULL;

-- Verify all folders now have paths
DO $$
DECLARE
  folders_without_paths INTEGER;
BEGIN
  SELECT COUNT(*) INTO folders_without_paths FROM folders WHERE path IS NULL;
  IF folders_without_paths > 0 THEN
    RAISE WARNING 'There are still % folders without paths', folders_without_paths;
  END IF;
END $$;