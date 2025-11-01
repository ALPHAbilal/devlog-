-- Fix the malformed TODO block
-- Run this in Supabase SQL Editor

-- First, let's see what the current content looks like
SELECT id, type, content, metadata
FROM blocks
WHERE id = '1ca473e8-0b7c-4b26-94cf-0c393b643134';

-- Option 1: Delete the malformed block (safest)
-- DELETE FROM blocks WHERE id = '1ca473e8-0b7c-4b26-94cf-0c393b643134';

-- Option 2: Fix the content to be valid JSON (if you want to keep it)
-- UPDATE blocks
-- SET content = '[]'
-- WHERE id = '1ca473e8-0b7c-4b26-94cf-0c393b643134';
