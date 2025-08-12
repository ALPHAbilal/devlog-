import { createSemanticSnapshot } from './semantic-snapshot';

interface ToolResult {
  type: 'text';
  text: string;
}

// All MCP operations now use dedicated Supabase functions
// This ensures consistent authentication and bypasses RLS issues

export async function executeToolCommand(
  toolName: string,
  args: any,
  env: any,
  userId: string,
  projectId: string,
  apiKey?: string
): Promise<ToolResult[]> {
  // All operations now use MCP functions for consistency

  try {
    switch (toolName) {
      case 'create_document': {
        const { title, blocks = [] } = args;
        
        // Use the API key passed from the request
        if (!apiKey) {
          throw new Error('API key is required for document creation');
        }
        
        // Use the mcp_create_document function that bypasses RLS
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_create_document`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_title: title,
            p_tags: args.tags || [],
            p_folder_id: args.folder_id || null
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create document: ${error}`);
        }

        const createResult = await response.json();
        
        if (!createResult.success) {
          throw new Error(`Failed to create document: ${createResult.error || 'Unknown error'}`);
        }
        
        const documentId = createResult.document_id;

        // Add blocks if provided using mcp_add_block function
        if (blocks.length > 0) {
          for (let index = 0; index < blocks.length; index++) {
            const block = blocks[index];
            
            const blockResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_add_block`, {
              method: 'POST',
              headers: {
                'apikey': env.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                p_api_key: apiKey,
                p_document_id: documentId,
                p_type: block.type,
                p_content: block.content || '',
                p_metadata: block.metadata || {},
                p_position: index
              })
            });

            if (!blockResponse.ok) {
              const error = await blockResponse.text();
              throw new Error(`Failed to add block: ${error}`);
            }
            
            const blockResult = await blockResponse.json();
            if (!blockResult.success) {
              throw new Error(`Failed to add block: ${blockResult.error || 'Unknown error'}`);
            }
          }
        }

        return [{
          type: 'text',
          text: `Document created successfully with ID: ${documentId}`,
        }];
      }

      case 'get_document': {
        const { id: documentId, semantic = false } = args;
        
        // Use the API key passed from the request
        if (!apiKey) {
          throw new Error('API key is required for document retrieval');
        }
        
        // Use the mcp_get_document function that bypasses RLS
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_get_document`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: documentId,
            p_semantic: semantic
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get document: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to get document: ${result.error || 'Document not found'}`);
        }
        
        // Return semantic snapshot if requested
        if (semantic) {
          const snapshot = createSemanticSnapshot({ document: result.document, blocks: result.blocks });
          return [{
            type: 'text',
            text: JSON.stringify(snapshot, null, 2),
          }];
        }

        return [{
          type: 'text',
          text: JSON.stringify({ document: result.document, blocks: result.blocks }, null, 2),
        }];
      }

      case 'search_documents': {
        const { query = '', limit = 10 } = args;
        
        // Use the API key passed from the request
        if (!apiKey) {
          throw new Error('API key is required for document search');
        }
        
        // Use the mcp_search_documents function that bypasses RLS
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_search_documents`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_query: query,
            p_limit: limit
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to search documents: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to search documents: ${result.error || 'Search failed'}`);
        }
        
        const documents = result.documents || [];
        
        if (documents.length === 0) {
          return [{
            type: 'text',
            text: 'No documents found matching your search.',
          }];
        }

        const results = documents.map((doc: any) => 
          `- ${doc.title} (ID: ${doc.id}, Updated: ${new Date(doc.updated_at).toLocaleDateString()})`
        ).join('\n');

        return [{
          type: 'text',
          text: `Found ${documents.length} documents (total: ${result.count}):\n${results}`,
        }];
      }

      case 'update_document': {
        const { id: documentId, title, blocks, tags } = args;
        
        // Use the API key passed from the request
        if (!apiKey) {
          throw new Error('API key is required for document update');
        }
        
        // Use the mcp_update_document function that bypasses RLS
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_update_document`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: documentId,
            p_title: title || null,
            p_tags: tags || null,
            p_blocks: blocks ? JSON.stringify(blocks) : null
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update document: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to update document: ${result.error || 'Update failed'}`);
        }

        return [{
          type: 'text',
          text: `Document ${documentId} updated successfully`,
        }];
      }

      case 'delete_document': {
        const { id: documentId, hard_delete = false } = args;
        
        // Use the API key passed from the request
        if (!apiKey) {
          throw new Error('API key is required for document deletion');
        }
        
        // Use the mcp_delete_document function that bypasses RLS
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_delete_document`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: documentId,
            p_hard_delete: hard_delete || false
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to delete document: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to delete document: ${result.error || 'Delete failed'}`);
        }

        return [{
          type: 'text',
          text: result.message || `Document ${documentId} deleted successfully`,
        }];
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    throw error;
  }
}