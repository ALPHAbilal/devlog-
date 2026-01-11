-- Migration: Add RxDB Replication Columns
-- Required for RxDB Supabase Plugin (v16.19.0+)
--
-- The official RxDB Supabase plugin requires:
-- 1. _modified (BIGINT) - Unix timestamp in milliseconds for checkpoint-based sync
-- 2. _deleted (BOOLEAN) - Soft delete flag for sync conflict resolution
--
-- Date: 2026-01-11

-- =============================================================================
-- DOCUMENTS TABLE
-- =============================================================================

-- Add _modified column (BIGINT - Unix timestamp in milliseconds)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS _modified BIGINT;

-- Add _deleted column (soft delete flag)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

-- Populate _modified from updated_at for existing rows
UPDATE documents
SET _modified = EXTRACT(EPOCH FROM COALESCE(updated_at, created_at, NOW())) * 1000
WHERE _modified IS NULL;

-- Set NOT NULL after populating
ALTER TABLE documents
ALTER COLUMN _modified SET NOT NULL,
ALTER COLUMN _modified SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

-- Create index for efficient replication queries
CREATE INDEX IF NOT EXISTS idx_documents_modified ON documents(_modified);
CREATE INDEX IF NOT EXISTS idx_documents_deleted ON documents(_deleted) WHERE _deleted = TRUE;

-- =============================================================================
-- FOLDERS TABLE
-- =============================================================================

-- Add _modified column
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS _modified BIGINT;

-- Add _deleted column
ALTER TABLE folders
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

-- Populate _modified from updated_at
UPDATE folders
SET _modified = EXTRACT(EPOCH FROM COALESCE(updated_at, created_at, NOW())) * 1000
WHERE _modified IS NULL;

-- Set NOT NULL after populating
ALTER TABLE folders
ALTER COLUMN _modified SET NOT NULL,
ALTER COLUMN _modified SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_folders_modified ON folders(_modified);
CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(_deleted) WHERE _deleted = TRUE;

-- =============================================================================
-- BLOCKS TABLE
-- =============================================================================

-- Add _modified column
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS _modified BIGINT;

-- Add _deleted column
ALTER TABLE blocks
ADD COLUMN IF NOT EXISTS _deleted BOOLEAN DEFAULT FALSE;

-- Populate _modified from updated_at
UPDATE blocks
SET _modified = EXTRACT(EPOCH FROM COALESCE(updated_at, created_at, NOW())) * 1000
WHERE _modified IS NULL;

-- Set NOT NULL after populating
ALTER TABLE blocks
ALTER COLUMN _modified SET NOT NULL,
ALTER COLUMN _modified SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blocks_modified ON blocks(_modified);
CREATE INDEX IF NOT EXISTS idx_blocks_deleted ON blocks(_deleted) WHERE _deleted = TRUE;

-- =============================================================================
-- AUTO-UPDATE TRIGGERS
-- =============================================================================

-- Function to auto-update _modified on any row change
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Set _modified to current Unix timestamp in milliseconds
  NEW._modified := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for documents
DROP TRIGGER IF EXISTS trg_documents_modified ON documents;
CREATE TRIGGER trg_documents_modified
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- Trigger for folders
DROP TRIGGER IF EXISTS trg_folders_modified ON folders;
CREATE TRIGGER trg_folders_modified
BEFORE INSERT OR UPDATE ON folders
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- Trigger for blocks
DROP TRIGGER IF EXISTS trg_blocks_modified ON blocks;
CREATE TRIGGER trg_blocks_modified
BEFORE INSERT OR UPDATE ON blocks
FOR EACH ROW
EXECUTE FUNCTION update_modified_timestamp();

-- =============================================================================
-- RLS POLICIES (ensure replication can query by _modified)
-- =============================================================================

-- Documents: Allow querying with _modified filter
DROP POLICY IF EXISTS "Users can view own documents by modified" ON documents;
CREATE POLICY "Users can view own documents by modified" ON documents
  FOR SELECT USING (auth.uid() = user_id);

-- Folders: Allow querying with _modified filter
DROP POLICY IF EXISTS "Users can view own folders by modified" ON folders;
CREATE POLICY "Users can view own folders by modified" ON folders
  FOR SELECT USING (auth.uid() = user_id);

-- Blocks: Need to verify access through document ownership
-- (existing policies should work, but ensure they cover _modified queries)

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = '_modified'
  ) THEN
    RAISE EXCEPTION 'Failed to add _modified column to documents table';
  END IF;

  -- Check folders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'folders' AND column_name = '_modified'
  ) THEN
    RAISE EXCEPTION 'Failed to add _modified column to folders table';
  END IF;

  -- Check blocks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blocks' AND column_name = '_modified'
  ) THEN
    RAISE EXCEPTION 'Failed to add _modified column to blocks table';
  END IF;

  RAISE NOTICE 'RxDB replication columns added successfully!';
END $$;
