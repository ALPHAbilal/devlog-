import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
  };
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void>;

/**
 * Hash API key for secure storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Middleware to validate API keys
 */
export function withApiAuth(handler: ApiHandler) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Missing API key',
          message: 'Include Authorization header with Bearer token'
        });
      }
      
      const apiKey = authHeader.slice(7);
      
      // Create admin client with service key
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      // Hash the API key to compare with stored hash
      const keyHash = hashApiKey(apiKey);
      
      // Validate API key
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select(`
          user_id,
          is_active,
          last_used_at,
          users!inner(id, email)
        `)
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();
        
      if (error || !keyData) {
        return res.status(401).json({ 
          error: 'Invalid API key',
          message: 'The provided API key is invalid or inactive'
        });
      }
      
      // Update last used timestamp (non-blocking)
      supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', keyHash)
        .then(() => {})
        .catch(console.error);
      
      // Log API activity (non-blocking)
      supabase
        .from('activity_logs')
        .insert({
          user_id: keyData.user_id,
          action: `api_call:${req.method}:${req.url}`,
          metadata: {
            endpoint: req.url,
            method: req.method,
            user_agent: req.headers['user-agent']
          }
        })
        .then(() => {})
        .catch(console.error);
      
      // Attach user to request
      req.user = {
        id: keyData.users.id,
        email: keyData.users.email
      };
      
      // Call the actual handler
      return handler(req, res);
    } catch (error) {
      console.error('API Auth Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      });
    }
  };
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  userId: string, 
  limit: number = 100, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  return true;
}