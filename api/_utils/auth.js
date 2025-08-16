import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Simple rate limiting store
const rateLimitStore = new Map();

export function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

export function checkRateLimit(userId, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const userKey = `rate_limit:${userId}`;
  
  const userData = rateLimitStore.get(userKey) || { count: 0, resetAt: now + windowMs };
  
  if (now > userData.resetAt) {
    userData.count = 0;
    userData.resetAt = now + windowMs;
  }
  
  if (userData.count >= limit) {
    return false;
  }
  
  userData.count++;
  rateLimitStore.set(userKey, userData);
  
  return true;
}

export async function authenticateRequest(req) {
  // Get API key from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      error: { 
        status: 401,
        message: 'Missing or invalid Authorization header' 
      }
    };
  }

  const apiKey = authHeader.substring(7);
  
  if (!apiKey || !apiKey.startsWith('jl_')) {
    return { 
      error: { 
        status: 401,
        message: 'Invalid API key format' 
      }
    };
  }

  try {
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Hash and validate API key
    const keyHash = hashApiKey(apiKey);
    
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyRecord) {
      return { 
        error: { 
          status: 401,
          message: 'Invalid API key' 
        }
      };
    }

    // Update last_used_at asynchronously
    supabase.rpc('update_api_key_last_used', { p_key_hash: keyHash })
      .then(() => {})
      .catch(err => console.error('Failed to update last_used_at:', err));

    return { 
      user: { id: apiKeyRecord.user_id },
      supabase 
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { 
      error: { 
        status: 500,
        message: 'Authentication failed' 
      }
    };
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt + 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);