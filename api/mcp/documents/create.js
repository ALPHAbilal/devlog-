import { authenticateRequest, checkRateLimit } from '../../_utils/auth.js';

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
  if (!checkRateLimit(user.id, 100)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  // Parse request body
  const { title, content, tags, metadata } = req.body;

  // Validate input
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Title is required and must be a string'
    });
  }

  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Tags must be an array of strings'
    });
  }

  try {
    // Create document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: title.trim(),
        tags: tags || [],
        metadata: {
          ...metadata,
          created_via: 'mcp',
          mcp_version: '1.0.0',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (docError) {
      console.error('Document creation error:', docError);
      return res.status(500).json({ 
        error: 'Failed to create document',
        message: docError.message 
      });
    }

    // Create initial block if content provided
    if (content && typeof content === 'string' && content.trim().length > 0) {
      await supabase
        .from('blocks')
        .insert({
          document_id: document.id,
          type: 'text',
          content: content.trim(),
          position: 0,
          metadata: {}
        });
    }

    // Return success response
    res.status(201).json({
      id: document.id,
      title: document.title,
      tags: document.tags,
      url: `https://devlog.design/document/${document.id}`,
      created_at: document.created_at,
      message: 'Document created successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while creating the document'
    });
  }
}