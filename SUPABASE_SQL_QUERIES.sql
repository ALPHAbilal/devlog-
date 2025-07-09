-- ============================================
-- STEP 1: Create Atomic Save Function
-- ============================================
-- This function handles both delete and insert in a single transaction
-- ensuring data integrity and preventing data loss

CREATE OR REPLACE FUNCTION save_document_blocks(
  doc_id UUID, 
  blocks JSONB
)
RETURNS VOID AS $$
BEGIN
  -- First, delete existing blocks for this document
  -- Only deletes blocks that belong to the current user
  DELETE FROM blocks 
  WHERE document_id = doc_id 
    AND user_id = auth.uid();
  
  -- Then insert new blocks
  -- If blocks is empty array, no inserts happen (which is correct behavior)
  INSERT INTO blocks (id, document_id, user_id, type, content, position, metadata, created_at)
  SELECT 
    COALESCE((b->>'id')::UUID, gen_random_uuid()),  -- Use existing ID or generate new
    doc_id,
    auth.uid(),  -- Always use current user's ID
    b->>'type',
    b->>'content',
    (b->>'position')::INTEGER,
    COALESCE((b->>'metadata')::JSONB, '{}'::JSONB),  -- Default empty metadata if null
    NOW()
  FROM jsonb_array_elements(blocks) AS b;
  
  -- If any error occurs, the entire transaction is rolled back
  -- This prevents the data loss issue
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION save_document_blocks TO authenticated;

-- ============================================
-- STEP 2: Add Unique Constraint for Future UPSERT Support
-- ============================================
-- This allows us to use UPSERT in the future if needed
-- Check if constraint already exists before adding

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'blocks_document_position_unique'
  ) THEN
    ALTER TABLE blocks 
    ADD CONSTRAINT blocks_document_position_unique 
    UNIQUE (document_id, position);
  END IF;
END $$;

-- ============================================
-- STEP 3: Create Index for Better Performance
-- ============================================
-- This speeds up the DELETE operation in our function

CREATE INDEX IF NOT EXISTS idx_blocks_document_user 
ON blocks(document_id, user_id);

-- ============================================
-- STEP 4: Verify Function Works
-- ============================================
-- Test query to verify the function exists and has correct permissions

SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'save_document_blocks';

-- ============================================
-- OPTIONAL: Optimize RLS Policies (Run Later)
-- ============================================
-- These optimized policies improve performance by wrapping auth.uid() in SELECT

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can insert own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can update own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete own blocks" ON blocks;

-- Create optimized policies
CREATE POLICY "Users can select own blocks" ON blocks
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own blocks" ON blocks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own blocks" ON blocks
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own blocks" ON blocks
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- Verification Query - Run this to check everything is set up
-- ============================================
SELECT 
  'Function exists' as check_item,
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'save_document_blocks') as status
UNION ALL
SELECT 
  'Unique constraint exists',
  EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'blocks_document_position_unique')
UNION ALL
SELECT 
  'Index exists',
  EXISTS(SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blocks_document_user')
UNION ALL
SELECT 
  'RLS is enabled on blocks',
  EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'blocks' AND rowsecurity = true);