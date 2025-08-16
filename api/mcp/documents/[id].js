import { authenticateRequest, checkRateLimit } from '../../_utils/auth.js';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate request
  const { user, supabase, error: authError } = await authenticateRequest(req);
  
  if (authError) {
    return res.status(authError.status).json({ 
      error: 'Unauthorized',
      message: authError.message 
    });
  }

  // Rate limiting
  if (!checkRateLimit(user.id, 100)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Document ID is required'
    });
  }

  try {
    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (docError || !document) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The specified document does not exist or you do not have access to it'
      });
    }

    // Get blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('document_id', id)
      .is('deleted_at', null)
      .order('position', { ascending: true });

    if (blocksError) {
      console.error('Blocks fetch error:', blocksError);
      // Don't fail if blocks can't be fetched
      return res.status(200).json({
        document,
        blocks: []
      });
    }

    // Return document with blocks
    res.status(200).json({
      document,
      blocks: blocks || []
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while fetching the document'
    });
  }
}