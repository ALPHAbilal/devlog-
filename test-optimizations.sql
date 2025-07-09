-- Test script for Supabase optimizations
-- Run this after applying all migrations to verify everything works

-- Test 1: Soft Delete
-- ===================
DO $$
DECLARE
  test_doc_id UUID;
  test_user_id UUID;
BEGIN
  -- Get a test document (replace with actual document ID)
  SELECT id, user_id INTO test_doc_id, test_user_id
  FROM public.documents
  WHERE deleted_at IS NULL
  LIMIT 1;
  
  IF test_doc_id IS NOT NULL THEN
    RAISE NOTICE 'Testing soft delete on document %', test_doc_id;
    
    -- Test soft delete
    PERFORM public.soft_delete_document(test_doc_id);
    
    -- Verify document is soft deleted
    IF EXISTS (SELECT 1 FROM public.documents WHERE id = test_doc_id AND deleted_at IS NOT NULL) THEN
      RAISE NOTICE '✓ Soft delete successful';
    ELSE
      RAISE WARNING '✗ Soft delete failed';
    END IF;
    
    -- Test restore
    PERFORM public.restore_document(test_doc_id);
    
    -- Verify document is restored
    IF EXISTS (SELECT 1 FROM public.documents WHERE id = test_doc_id AND deleted_at IS NULL) THEN
      RAISE NOTICE '✓ Restore successful';
    ELSE
      RAISE WARNING '✗ Restore failed';
    END IF;
  END IF;
END $$;

-- Test 2: Batch Operations
-- ========================
DO $$
DECLARE
  test_doc_id UUID;
  batch_result RECORD;
BEGIN
  SELECT id INTO test_doc_id
  FROM public.documents
  WHERE deleted_at IS NULL
  LIMIT 1;
  
  IF test_doc_id IS NOT NULL THEN
    RAISE NOTICE 'Testing batch operations on document %', test_doc_id;
    
    -- Test batch insert
    FOR batch_result IN 
      SELECT * FROM public.batch_insert_blocks(
        test_doc_id,
        '[
          {"type": "text", "content": "Test block 1", "position": 0},
          {"type": "code", "content": "console.log(\"test\");", "position": 1, "language": "javascript"}
        ]'::jsonb
      )
    LOOP
      IF batch_result.success THEN
        RAISE NOTICE '✓ Inserted block at position %', batch_result.position;
      ELSE
        RAISE WARNING '✗ Failed to insert block: %', batch_result.error;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Test 3: Document Versioning
-- ===========================
DO $$
DECLARE
  test_doc_id UUID;
  version_record RECORD;
BEGIN
  SELECT id INTO test_doc_id
  FROM public.documents
  WHERE deleted_at IS NULL
  LIMIT 1;
  
  IF test_doc_id IS NOT NULL THEN
    RAISE NOTICE 'Testing document versioning for %', test_doc_id;
    
    -- Create a version
    SELECT * INTO version_record
    FROM public.create_document_version(test_doc_id, 'Test version');
    
    IF version_record.id IS NOT NULL THEN
      RAISE NOTICE '✓ Created version % with number %', version_record.id, version_record.version_number;
    ELSE
      RAISE WARNING '✗ Failed to create version';
    END IF;
  END IF;
END $$;

-- Test 4: Performance Functions
-- =============================
DO $$
DECLARE
  stats_record RECORD;
  doc_count INTEGER;
BEGIN
  RAISE NOTICE 'Testing performance functions';
  
  -- Test user document stats
  SELECT * INTO stats_record
  FROM public.get_user_document_stats();
  
  RAISE NOTICE '✓ User stats: % documents, % blocks, % templates', 
    stats_record.total_documents, 
    stats_record.total_blocks, 
    stats_record.total_templates;
  
  -- Test paginated documents with stats
  SELECT COUNT(*) INTO doc_count
  FROM public.get_documents_with_stats(
    page_size := 10,
    page_offset := 0,
    sort_by := 'updated_at',
    sort_desc := true
  );
  
  RAISE NOTICE '✓ Retrieved % documents with stats', doc_count;
END $$;

-- Test 5: Cache Operations
-- ========================
DO $$
DECLARE
  test_doc_id UUID;
  cache_count INTEGER;
BEGIN
  SELECT id INTO test_doc_id
  FROM public.documents
  WHERE deleted_at IS NULL
  LIMIT 1;
  
  IF test_doc_id IS NOT NULL THEN
    RAISE NOTICE 'Testing cache operations';
    
    -- Update cache for one document
    PERFORM public.update_document_cache(test_doc_id);
    
    -- Check if cache was created
    SELECT COUNT(*) INTO cache_count
    FROM public.document_cache
    WHERE document_id = test_doc_id;
    
    IF cache_count > 0 THEN
      RAISE NOTICE '✓ Document cache updated successfully';
    ELSE
      RAISE WARNING '✗ Failed to update document cache';
    END IF;
  END IF;
END $$;

-- Performance Verification Queries
-- ================================

-- Check index usage
SELECT 
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Summary
SELECT 
  'Optimization Test Complete' as status,
  NOW() as tested_at;