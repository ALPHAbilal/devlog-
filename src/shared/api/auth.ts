import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Hash API key for secure storage
 */
export function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Middleware to validate API keys
 */
export function withApiAuth(handler) {
  return async (req, res) => {
    // Get API key from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header' 
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!apiKey || (!apiKey.startsWith('jl_') && !apiKey.startsWith('dvlg_sk_'))) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid API key format' 
      });
    }

    try {
      // Hash the provided API key
      const keyHash = hashApiKey(apiKey);
      
      // Create Supabase admin client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Look up the API key
      const { data: apiKeyRecord, error } = await supabase
        .from('api_keys')
        .select('user_id, is_active')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error || !apiKeyRecord) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid API key' 
        });
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', apiKeyRecord.user_id)
        .single();

      if (userError || !user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User not found' 
        });
      }

      // Update last_used_at
      supabase.rpc('update_api_key_last_used', { p_key_hash: keyHash })
        .then(() => {})
        .catch(err => console.error('Failed to update last_used_at:', err));

      // Attach user to request
      req.user = user;

      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Authentication failed' 
      });
    }
  };
}

/**
 * Simple in-memory rate limiting
 */
const rateLimitStore = new Map();

export function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const userKey = `rate_limit:${userId}`;
  
  const userData = rateLimitStore.get(userKey) || { count: 0, resetAt: now + windowMs };
  
  // Reset if window has passed
  if (now > userData.resetAt) {
    userData.count = 0;
    userData.resetAt = now + windowMs;
  }
  
  // Check if limit exceeded
  if (userData.count >= limit) {
    return false;
  }
  
  // Increment counter
  userData.count++;
  rateLimitStore.set(userKey, userData);
  
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt + 60000) { // Remove entries older than 1 minute past reset
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Clean every 5 minutes