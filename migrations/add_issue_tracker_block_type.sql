-- Migration to add issue-tracker block type
-- Date: January 2025

-- First, drop the existing constraint
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_type_check;

-- Add the new constraint including issue-tracker
ALTER TABLE blocks ADD CONSTRAINT blocks_type_check 
CHECK (type = ANY (ARRAY[
  'text', 
  'code', 
  'heading', 
  'ai', 
  'table', 
  'filetree', 
  'todo', 
  'image', 
  'inline-image', 
  'version-track',
  'issue-tracker'  -- New block type for tracking problems and solutions
]));

-- Verify the constraint was added successfully
-- SELECT conname, consrc 
-- FROM pg_constraint 
-- WHERE conname = 'blocks_type_check';