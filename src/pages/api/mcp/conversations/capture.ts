import type { NextApiResponse } from 'next';
import { withApiAuth, AuthenticatedRequest, checkRateLimit } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CodeChange {
  file: string;
  before: string;
  after: string;
  description: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting (lower limit for conversation captures)
  if (!checkRateLimit(req.user!.id, 50)) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.'
    });
  }

  const { 
    document_id, 
    conversation, 
    context,
    code_changes,
    summary 
  } = req.body;

  // Validate input
  if (!document_id || typeof document_id !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'document_id is required and must be a string'
    });
  }

  if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
    return res.status(400).json({ 
      error: 'Invalid input',
      message: 'conversation is required and must be a non-empty array'
    });
  }

  // Validate conversation messages
  for (const msg of conversation) {
    if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Each conversation message must have a role of "user" or "assistant"'
      });
    }
    if (!msg.content || typeof msg.content !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid input',
        message: 'Each conversation message must have content as a string'
      });
    }
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
      .select('id, title')
      .eq('id', document_id)
      .eq('user_id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ 
        error: 'Document not found',
        message: 'The specified document does not exist or you do not have access to it'
      });
    }

    // Process the conversation
    const processedMessages = conversation.map((msg: ConversationMessage, index: number) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(Date.now() + index).toISOString() // Ensure unique timestamps
    }));

    // Generate summary if not provided
    const conversationSummary = summary || generateSummary(conversation);

    // Extract key insights
    const insights = extractInsights(conversation);

    // Prepare AI conversation metadata
    const aiMetadata = {
      conversation: {
        messages: processedMessages,
        context: context || null,
        summary: conversationSummary,
        codeChanges: code_changes || [],
        insights,
        message_count: conversation.length,
        user_message_count: conversation.filter(m => m.role === 'user').length,
        assistant_message_count: conversation.filter(m => m.role === 'assistant').length
      },
      created_via: 'mcp',
      captured_at: new Date().toISOString()
    };

    // Format display content
    const displayContent = formatConversationDisplay(conversation, conversationSummary);

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

    // Create AI conversation block
    const { data: block, error: blockError } = await supabase
      .from('blocks')
      .insert({
        document_id,
        type: 'ai_conversation',
        content: displayContent,
        metadata: aiMetadata,
        position
      })
      .select()
      .single();

    if (blockError) {
      console.error('AI conversation block creation error:', blockError);
      return res.status(500).json({ 
        error: 'Failed to create AI conversation block',
        message: blockError.message 
      });
    }

    // If there are code changes, create additional code blocks
    if (code_changes && Array.isArray(code_changes) && code_changes.length > 0) {
      let nextPosition = position + 1;
      
      for (const change of code_changes) {
        const codeContent = formatCodeChange(change);
        
        await supabase
          .from('blocks')
          .insert({
            document_id,
            type: 'code',
            content: codeContent,
            metadata: {
              language: detectLanguage(change.file),
              is_diff: true,
              file_path: change.file,
              created_via: 'mcp'
            },
            position: nextPosition++
          });
      }
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
      message_count: conversation.length,
      has_code_changes: !!(code_changes && code_changes.length > 0),
      summary: conversationSummary,
      message: `AI conversation with ${conversation.length} messages captured in "${doc.title}"`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while capturing the conversation'
    });
  }
}

// Helper functions
function generateSummary(conversation: ConversationMessage[]): string {
  if (conversation.length === 0) return '';
  
  const firstUserMsg = conversation.find(m => m.role === 'user');
  if (!firstUserMsg) return 'AI conversation';
  
  const preview = firstUserMsg.content.substring(0, 100);
  return preview.length < firstUserMsg.content.length 
    ? `${preview}...` 
    : preview;
}

function extractInsights(conversation: ConversationMessage[]) {
  const insights = {
    topics: [] as string[],
    questions_asked: 0,
    solutions_provided: 0,
    code_blocks: 0
  };

  conversation.forEach(msg => {
    if (msg.role === 'user' && msg.content.includes('?')) {
      insights.questions_asked++;
    }
    
    // Count code blocks
    const codeBlockMatches = msg.content.match(/```/g);
    if (codeBlockMatches) {
      insights.code_blocks += codeBlockMatches.length / 2;
    }
  });

  return insights;
}

function formatConversationDisplay(
  conversation: ConversationMessage[], 
  summary: string
): string {
  let display = `## AI Conversation Summary\n\n${summary}\n\n---\n\n`;
  
  conversation.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
    display += `### ${role}\n\n${msg.content}\n\n`;
    
    if (index < conversation.length - 1) {
      display += '---\n\n';
    }
  });
  
  return display;
}

function formatCodeChange(change: CodeChange): string {
  return `### File: ${change.file}

${change.description}

**Before:**
\`\`\`
${change.before}
\`\`\`

**After:**
\`\`\`
${change.after}
\`\`\``;
}

function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'swift': 'swift',
    'kt': 'kotlin',
    'sql': 'sql',
    'sh': 'bash',
    'yaml': 'yaml',
    'yml': 'yaml',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'md': 'markdown'
  };

  return languageMap[ext || ''] || 'plaintext';
}

export default withApiAuth(handler);