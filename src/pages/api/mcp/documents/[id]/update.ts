import type { NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest, checkRateLimit } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  if (!checkRateLimit(req.user!.id, 100)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  const { id } = req.query;
  const { title, tags, metadata } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Document ID is required'
    });
  }

  // Validate at least one field to update
  if (!title && !tags && !metadata) {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'At least one field (title, tags, or metadata) must be provided to update'
    });
  }

  // Validate types if provided
  if (title && typeof title !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Title must be a string'
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

    // Verify document ownership
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, metadata')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The specified document does not exist or you do not have access to it'
      });
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (title) {
      updateData.title = title.trim();
    }

    if (tags) {
      updateData.tags = tags;
    }

    if (metadata) {
      // Merge with existing metadata
      updateData.metadata = {
        ...doc.metadata,
        ...metadata,
        last_updated_via: 'mcp',
        last_updated_at: new Date().toISOString()
      };
    }

    // Update document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Document update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update document',
        message: updateError.message 
      });
    }

    // Return success response
    res.status(200).json({
      id: updatedDoc.id,
      title: updatedDoc.title,
      tags: updatedDoc.tags,
      updated_at: updatedDoc.updated_at,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while updating the document'
    });
  }
}

export default withApiAuth(handler);