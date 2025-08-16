-- Create API keys table for MCP authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_preview TEXT NOT NULL, -- First 8 and last 4 chars for display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Indexes
    CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys (for soft delete)
CREATE POLICY "Users can update own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update last_used_at
CREATE OR REPLACE FUNCTION update_api_key_last_used(p_key_hash TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE api_keys
    SET last_used_at = NOW()
    WHERE key_hash = p_key_hash
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;