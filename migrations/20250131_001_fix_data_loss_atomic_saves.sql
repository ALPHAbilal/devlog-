-- Migration: Fix Data Loss Bug with Atomic Save Operations
-- Created: 2025-01-31
-- Priority: CRITICAL
-- 
-- This migration addresses the critical data loss bug in save_document_blocks
-- by implementing atomic transactions and adding safety checks.

-- Step 1: Create improved save function with atomic transactions
CREATE OR REPLACE FUNCTION save_document_blocks_atomic(
  p_document_id UUID,
  p_blocks JSONB,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
  v_existing_count INTEGER;
BEGIN
  -- Get user ID (use parameter or current auth user)
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Verify document ownership
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
      AND user_id = v_user_id 
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;

  -- Start atomic transaction
  BEGIN
    -- Count existing blocks for validation
    SELECT COUNT(*) INTO v_existing_count
    FROM blocks 
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    -- CRITICAL: Prevent accidental data loss
    -- If empty array is passed and document has existing blocks, preserve them
    IF jsonb_array_length(p_blocks) = 0 AND v_existing_count > 0 THEN
      RAISE WARNING 'Attempted to save empty blocks array for document % with % existing blocks. Preserving existing data.', 
        p_document_id, v_existing_count;
      
      -- Return existing blocks instead of deleting them
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'type', type,
          'content', content,
          'position', position,
          'metadata', metadata,
          'language', language,
          'file_path', file_path
        ) ORDER BY position
      ) INTO v_result
      FROM blocks
      WHERE document_id = p_document_id 
        AND deleted_at IS NULL;
      
      RETURN COALESCE(v_result, '[]'::JSONB);
    END IF;

    -- Soft delete existing blocks (preserves data for recovery)
    UPDATE blocks 
    SET 
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    -- Insert new blocks if any
    IF jsonb_array_length(p_blocks) > 0 THEN
      INSERT INTO blocks (
        id, 
        document_id, 
        type, 
        content, 
        position,
        metadata, 
        language, 
        file_path, 
        user_id,
        created_at,
        updated_at
      )
      SELECT 
        COALESCE((block->>'id')::UUID, gen_random_uuid()),
        p_document_id,
        block->>'type',
        COALESCE(block->>'content', ''),
        (block->>'position')::INTEGER,
        COALESCE((block->'metadata')::JSONB, '{}'::JSONB),
        block->>'language',
        block->>'file_path',
        v_user_id,
        NOW(),
        NOW()
      FROM jsonb_array_elements(p_blocks) AS block;
    END IF;

    -- Update document timestamp
    UPDATE documents 
    SET updated_at = NOW() 
    WHERE id = p_document_id;

    -- Update document cache if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_cache') THEN
      PERFORM update_document_cache(p_document_id);
    END IF;

    -- Return saved blocks
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'type', type,
        'content', content,
        'position', position,
        'metadata', metadata,
        'language', language,
        'file_path', file_path,
        'created_at', created_at,
        'updated_at', updated_at
      ) ORDER BY position
    ) INTO v_result
    FROM blocks
    WHERE document_id = p_document_id 
      AND deleted_at IS NULL;

    RETURN COALESCE(v_result, '[]'::JSONB);

  EXCEPTION
    WHEN OTHERS THEN
      -- Transaction will rollback automatically
      RAISE;
  END;
END;
$$;

-- Step 2: Grant execute permissions
GRANT EXECUTE ON FUNCTION save_document_blocks_atomic TO authenticated;

-- Step 3: Create wrapper for backward compatibility
CREATE OR REPLACE FUNCTION save_document_blocks_safe(doc_id UUID, blocks JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM save_document_blocks_atomic(doc_id, blocks);
END;
$$;

GRANT EXECUTE ON FUNCTION save_document_blocks_safe TO authenticated;

-- Step 4: Rename old function (keep for rollback)
ALTER FUNCTION save_document_blocks(UUID, JSONB) RENAME TO save_document_blocks_old;

-- Step 5: Create new function that routes to atomic version
CREATE OR REPLACE FUNCTION save_document_blocks(doc_id UUID, blocks JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  PERFORM save_document_blocks_atomic(doc_id, blocks);
END;
$$;

GRANT EXECUTE ON FUNCTION save_document_blocks TO authenticated;

-- Step 6: Create rate limiting infrastructure
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_action_time 
ON rate_limit_log(user_id, action, created_at DESC);

-- Step 7: Create rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count recent actions
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Log this action
  INSERT INTO rate_limit_log (user_id, action, created_at)
  VALUES (p_user_id, p_action, NOW());
  
  RETURN TRUE;
END;
$$;

-- Step 8: Add rate limiting to save function
CREATE OR REPLACE FUNCTION save_document_blocks_with_rate_limit(
  p_document_id UUID,
  p_blocks JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_can_proceed BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  -- Check rate limit (30 saves per minute)
  v_can_proceed := check_rate_limit(v_user_id, 'save_blocks', 30, 1);
  
  IF NOT v_can_proceed THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  -- Proceed with save
  RETURN save_document_blocks_atomic(p_document_id, p_blocks, v_user_id);
END;
$$;

-- Step 9: Create cleanup job for rate limit logs
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limit_log
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- Step 10: Create recovery function for accidentally deleted blocks
CREATE OR REPLACE FUNCTION recover_deleted_blocks(
  p_document_id UUID,
  p_deleted_after TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 hour'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID;
  v_recovered_count INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Verify document ownership
  IF NOT EXISTS (
    SELECT 1 FROM documents 
    WHERE id = p_document_id 
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Document not found or access denied';
  END IF;
  
  -- Recover recently deleted blocks
  UPDATE blocks
  SET deleted_at = NULL
  WHERE document_id = p_document_id
    AND deleted_at >= p_deleted_after
    AND user_id = v_user_id;
    
  GET DIAGNOSTICS v_recovered_count = ROW_COUNT;
  
  RETURN v_recovered_count;
END;
$$;

GRANT EXECUTE ON FUNCTION recover_deleted_blocks TO authenticated;

-- Verification Query: Check if functions were created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'save_document_blocks_atomic'
  ) THEN
    RAISE NOTICE 'SUCCESS: Atomic save function created';
  ELSE
    RAISE EXCEPTION 'FAILED: Atomic save function not created';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'rate_limit_log'
  ) THEN
    RAISE NOTICE 'SUCCESS: Rate limiting table created';
  ELSE
    RAISE EXCEPTION 'FAILED: Rate limiting table not created';
  END IF;
END $$;

-- Rollback Script (save this separately)
-- DROP FUNCTION IF EXISTS save_document_blocks_atomic CASCADE;
-- DROP FUNCTION IF EXISTS save_document_blocks_safe CASCADE;
-- DROP FUNCTION IF EXISTS save_document_blocks CASCADE;
-- ALTER FUNCTION save_document_blocks_old RENAME TO save_document_blocks;
-- DROP FUNCTION IF EXISTS save_document_blocks_with_rate_limit CASCADE;
-- DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
-- DROP FUNCTION IF EXISTS cleanup_rate_limit_log CASCADE;
-- DROP FUNCTION IF EXISTS recover_deleted_blocks CASCADE;
-- DROP TABLE IF EXISTS rate_limit_log CASCADE;