-- Create API keys table for MCP authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  key_hash text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create activity logs table for tracking MCP usage
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user metadata table for storing session data
CREATE TABLE IF NOT EXISTS user_metadata (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Create indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_user_metadata_user_id ON user_metadata(user_id);

-- RLS Policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true); -- Will be restricted by service key

-- RLS Policies for user_metadata
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own metadata"
  ON user_metadata FOR ALL
  USING (auth.uid() = user_id);

-- Function to validate API key (for server-side use)
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash text)
RETURNS TABLE(user_id uuid, is_valid boolean) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.user_id,
    (ak.is_active AND (ak.expires_at IS NULL OR ak.expires_at > now()))::boolean as is_valid
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash
  LIMIT 1;
  
  -- Update last used timestamp
  IF FOUND THEN
    UPDATE api_keys 
    SET last_used_at = now()
    WHERE key_hash = p_key_hash;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_api_key(text) TO anon, authenticated;