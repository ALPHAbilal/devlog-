-- Rate Limiting System for Devlog
-- Protects against abuse from Reddit traffic

-- Create or update rate limiting tables with proper structure
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  limit_per_minute INTEGER NOT NULL DEFAULT 60,
  limit_per_hour INTEGER NOT NULL DEFAULT 1000,
  limit_per_day INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure ip_rate_limit table has correct structure
CREATE TABLE IF NOT EXISTS public.ip_rate_limit (
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'global',
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (ip_address, endpoint)
);

-- Ensure user rate limit table exists
CREATE TABLE IF NOT EXISTS public.user_rate_limit (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL DEFAULT 'global',
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (user_id, endpoint)
);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address INET,
  p_user_id UUID DEFAULT NULL,
  p_endpoint TEXT DEFAULT 'global'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ip_limit_per_minute INTEGER := 20;  -- Anonymous users
  v_user_limit_per_minute INTEGER := 100;  -- Authenticated users
  v_ip_blocked_until TIMESTAMP WITH TIME ZONE;
  v_user_blocked_until TIMESTAMP WITH TIME ZONE;
  v_ip_count INTEGER;
  v_user_count INTEGER;
  v_current_time TIMESTAMP WITH TIME ZONE := NOW();
  v_minute_ago TIMESTAMP WITH TIME ZONE := NOW() - INTERVAL '1 minute';
BEGIN
  -- Check IP rate limit
  SELECT blocked_until, request_count INTO v_ip_blocked_until, v_ip_count
  FROM ip_rate_limit
  WHERE ip_address = p_ip_address 
    AND endpoint = p_endpoint
    AND (window_start > v_minute_ago OR blocked_until > v_current_time);

  -- If IP is blocked
  IF v_ip_blocked_until IS NOT NULL AND v_ip_blocked_until > v_current_time THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_blocked',
      'blocked_until', v_ip_blocked_until,
      'retry_after', EXTRACT(EPOCH FROM (v_ip_blocked_until - v_current_time))::INTEGER
    );
  END IF;

  -- Check user rate limit if authenticated
  IF p_user_id IS NOT NULL THEN
    SELECT blocked_until, request_count INTO v_user_blocked_until, v_user_count
    FROM user_rate_limit
    WHERE user_id = p_user_id 
      AND endpoint = p_endpoint
      AND (window_start > v_minute_ago OR blocked_until > v_current_time);

    -- If user is blocked
    IF v_user_blocked_until IS NOT NULL AND v_user_blocked_until > v_current_time THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'user_blocked',
        'blocked_until', v_user_blocked_until,
        'retry_after', EXTRACT(EPOCH FROM (v_user_blocked_until - v_current_time))::INTEGER
      );
    END IF;
  END IF;

  -- Update or insert IP rate limit
  INSERT INTO ip_rate_limit (ip_address, endpoint, request_count, window_start)
  VALUES (p_ip_address, p_endpoint, 1, v_current_time)
  ON CONFLICT (ip_address, endpoint) DO UPDATE
  SET 
    request_count = CASE 
      WHEN ip_rate_limit.window_start <= v_minute_ago THEN 1
      ELSE COALESCE(ip_rate_limit.request_count, 0) + 1
    END,
    window_start = CASE 
      WHEN ip_rate_limit.window_start <= v_minute_ago THEN v_current_time
      ELSE ip_rate_limit.window_start
    END,
    blocked_until = CASE 
      WHEN COALESCE(ip_rate_limit.request_count, 0) + 1 > v_ip_limit_per_minute 
      THEN v_current_time + INTERVAL '5 minutes'
      ELSE NULL
    END
  RETURNING request_count, blocked_until INTO v_ip_count, v_ip_blocked_until;

  -- Update or insert user rate limit if authenticated
  IF p_user_id IS NOT NULL THEN
    INSERT INTO user_rate_limit (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, v_current_time)
    ON CONFLICT (user_id, endpoint) DO UPDATE
    SET 
      request_count = CASE 
        WHEN user_rate_limit.window_start <= v_minute_ago THEN 1
        ELSE COALESCE(user_rate_limit.request_count, 0) + 1
      END,
      window_start = CASE 
        WHEN user_rate_limit.window_start <= v_minute_ago THEN v_current_time
        ELSE user_rate_limit.window_start
      END,
      blocked_until = CASE 
        WHEN COALESCE(user_rate_limit.request_count, 0) + 1 > v_user_limit_per_minute 
        THEN v_current_time + INTERVAL '5 minutes'
        ELSE NULL
      END
    RETURNING request_count, blocked_until INTO v_user_count, v_user_blocked_until;
  END IF;

  -- Check if limits exceeded
  IF v_ip_blocked_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'ip_rate_limit_exceeded',
      'blocked_until', v_ip_blocked_until,
      'retry_after', 300
    );
  END IF;

  IF p_user_id IS NOT NULL AND v_user_blocked_until IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'user_rate_limit_exceeded',
      'blocked_until', v_user_blocked_until,
      'retry_after', 300
    );
  END IF;

  -- Request allowed
  RETURN jsonb_build_object(
    'allowed', true,
    'ip_requests', v_ip_count,
    'user_requests', COALESCE(v_user_count, 0),
    'ip_limit', v_ip_limit_per_minute,
    'user_limit', v_user_limit_per_minute
  );
END;
$$;

-- Function to clean up old rate limit entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete IP entries older than 1 hour with no blocks
  DELETE FROM ip_rate_limit
  WHERE window_start < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW());

  -- Delete user entries older than 1 hour with no blocks
  DELETE FROM user_rate_limit
  WHERE window_start < NOW() - INTERVAL '1 hour'
    AND (blocked_until IS NULL OR blocked_until < NOW());

  -- Log cleanup
  INSERT INTO rate_limit_log (action, created_at)
  VALUES ('cleanup_completed', NOW());
END;
$$;

-- Create RLS policies for rate limit tables
ALTER TABLE ip_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only" ON ip_rate_limit
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON user_rate_limit
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_rate_limit(INET, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;

-- Insert default rate limits
INSERT INTO rate_limits (endpoint, limit_per_minute, limit_per_hour, limit_per_day)
VALUES 
  ('global', 60, 1000, 10000),
  ('auth', 10, 100, 500),
  ('documents', 100, 2000, 20000)
ON CONFLICT DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ip_rate_limit_lookup 
  ON ip_rate_limit(ip_address, endpoint, window_start DESC);
  
CREATE INDEX IF NOT EXISTS idx_user_rate_limit_lookup 
  ON user_rate_limit(user_id, endpoint, window_start DESC);