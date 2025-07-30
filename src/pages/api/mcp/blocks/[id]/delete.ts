import type { NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest, checkRateLimit } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow DELETE
  if (req.method !== 'DELETE') {
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

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'Block ID is required'
    });
  }

  try {
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get block with document info to verify ownership
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .select(`
        id,
        document_id,
        position,
        documents!inner (
          id,
          user_id,
          title
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (blockError || !block) {
      return res.status(404).json({ 
        error: 'Block not found',
        message: 'The specified block does not exist'
      });
    }

    // Verify ownership through document
    if (block.documents.user_id !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You do not have permission to delete this block'
      });
    }

    // Soft delete the block
    const { error: deleteError } = await supabase
      .from('blocks')
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Block deletion error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete block',
        message: deleteError.message 
      });
    }

    // Update positions of subsequent blocks
    const { error: positionError } = await supabase.rpc(
      'decrement_block_positions',
      {
        p_document_id: block.document_id,
        p_deleted_position: block.position
      }
    );

    if (positionError) {
      console.error('Position update error:', positionError);
      // Don't fail the whole operation if position update fails
    }

    // Update document's updated_at timestamp
    await supabase
      .from('documents')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', block.document_id);

    // Return success response
    res.status(200).json({
      id: block.id,
      document_id: block.document_id,
      message: `Block deleted from document "${block.documents.title}"`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while deleting the block'
    });
  }
}

export default withApiAuth(handler);