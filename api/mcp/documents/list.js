import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const rateLimitStore = new Map();

function hashApiKey(apiKey) {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

function checkRateLimit(userId, limit = 100, windowMs = 60000) {
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

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header' 
    });
  }

  const apiKey = authHeader.substring(7);
  
  if (!apiKey || !apiKey.startsWith('jl_')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid API key format' 
    });
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
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid API key' 
      });
    }

    // Rate limiting
    if (!checkRateLimit(apiKeyRecord.user_id, 100)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      });
    }

    // Parse query parameters
    const { 
      limit = '50', 
      offset = '0',
      tags,
      search
    } = req.query;

    const limitNum = Math.min(parseInt(limit) || 50, 100);
    const offsetNum = parseInt(offset) || 0;

    // Build query
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', apiKeyRecord.user_id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    // Apply filters
    if (tags && typeof tags === 'string') {
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    if (search && typeof search === 'string') {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('Document list error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch documents',
        message: error.message 
      });
    }

    // Return paginated response
    res.status(200).json({
      documents: documents || [],
      pagination: {
        total: count || 0,
        limit: limitNum,
        offset: offsetNum,
        has_more: (count || 0) > offsetNum + limitNum
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching documents'
    });
  }
}