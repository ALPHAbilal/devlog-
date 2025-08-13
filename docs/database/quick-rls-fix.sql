-- QUICK FIX: Allow your specific user to create documents
-- Run this in Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Simple policy for your user
CREATE POLICY "Bilal can do everything with documents" ON documents
    FOR ALL USING (
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    )
    WITH CHECK (
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    );

CREATE POLICY "Bilal can do everything with blocks" ON blocks
    FOR ALL USING (
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    )
    WITH CHECK (
        user_id = '8eac28e6-0127-40d1-ba55-c10cbe52a32b'
    );

-- This will immediately allow your MCP to work!