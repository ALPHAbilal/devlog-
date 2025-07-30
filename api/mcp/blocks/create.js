import { authenticateRequest, checkRateLimit } from '../../_utils/auth.js';

const VALID_BLOCK_TYPES = ['text', 'code', 'heading', 'list', 'checkbox', 'ai_conversation', 'diagram'];

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
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
  if (!checkRateLimit(user.id, 200)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  const { document_id, type, content, metadata } = req.body;

  // Validate input
  if (!document_id || typeof document_id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'document_id is required and must be a string'
    });
  }

  if (!type || !VALID_BLOCK_TYPES.includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: `Type must be one of: ${VALID_BLOCK_TYPES.join(', ')}`
    });
  }

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Content is required and must be a string'
    });
  }

  try {
    // Verify document ownership
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The specified document does not exist or you do not have access to it'
      });
    }

    // Get the current max position
    const { data: lastBlock } = await supabase
      .from('blocks')
      .select('position')
      .eq('document_id', document_id)
      .is('deleted_at', null)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const position = lastBlock ? lastBlock.position + 1 : 0;

    // Prepare block metadata
    const blockMetadata = {
      ...metadata,
      created_via: 'mcp',
      created_at: new Date().toISOString()
    };

    // Add type-specific metadata
    if (type === 'code' && !blockMetadata.language) {
      blockMetadata.language = 'plaintext';
    } else if (type === 'heading' && !blockMetadata.level) {
      blockMetadata.level = 2;
    } else if (type === 'checkbox' && blockMetadata.checked === undefined) {
      blockMetadata.checked = false;
    }

    // Create block
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .insert({
        document_id,
        type,
        content: content.trim(),
        metadata: blockMetadata,
        position
      })
      .select()
      .single();

    if (blockError) {
      console.error('Block creation error:', blockError);
      return res.status(500).json({ 
        error: 'Failed to create block',
        message: blockError.message 
      });
    }

    // Update document's updated_at timestamp
    await supabase
      .from('documents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', document_id);

    // Return success response
    res.status(201).json({
      id: block.id,
      document_id: block.document_id,
      type: block.type,
      position: block.position,
      created_at: block.created_at,
      message: `${type} block added to document "${doc.title}"`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the block'
    });
  }
}