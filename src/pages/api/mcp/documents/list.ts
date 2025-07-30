import type { NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest, checkRateLimit } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (!checkRateLimit(req.user!.id, 100)) {
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

  const limitNum = Math.min(parseInt(limit as string) || 50, 100);
  const offsetNum = parseInt(offset as string) || 0;

  try {
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
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

export default withApiAuth(handler);