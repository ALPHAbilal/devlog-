import type { NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest, checkRateLimit } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (!checkRateLimit(req.user!.id, 100)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

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
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: req.user!.id,
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
      const { error: blockError } = await supabase
        .from('blocks')
        .insert({
          document_id: document.id,
          type: 'text',
          content: content.trim(),
          position: 0,
          metadata: {}
        });

      if (blockError) {
        console.error('Initial block creation error:', blockError);
        // Don't fail the whole request if block creation fails
      }
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

export default withApiAuth(handler);