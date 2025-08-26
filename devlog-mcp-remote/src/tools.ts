import { createSemanticSnapshot } from './semantic-snapshot';

interface ToolResult {
  type: 'text';
  text: string;
}

// Helper function to properly serialize block content based on type
function serializeBlockContent(block: any): string {
  // Simple blocks use content directly
  if (['text', 'heading', 'code'].includes(block.type)) {
    return block.content || '';
  }
  
  // Complex blocks need JSON serialization with proper structure
  switch (block.type) {
    case 'table':
      // Table blocks need data wrapped in a data object
      return JSON.stringify({
        data: block.data || {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [['', '', '']],
          columnAlignments: ['left', 'left', 'left'],
          hasHeaderRow: true
        }
      });
      
    case 'issue-tracker':
    case 'issueTracker':
      // Issue tracker stores milestone and issues directly
      return JSON.stringify({
        milestone: block.milestone || block.data?.milestone || '',
        issues: block.issues || block.data?.issues || []
      });
      
    case 'version-track':
    case 'versionTrack':
      // Version track wraps data in a data object
      return JSON.stringify({
        data: block.data || {
          repository: null,
          commits: [],
          branches: []
        }
      });
      
    case 'filetree':
    case 'file-tree':
      // File tree stores tree structure
      return JSON.stringify({
        treeData: block.treeData || block.data?.treeData || [],
        expanded: block.expanded || block.data?.expanded || []
      });
      
    case 'todo':
      // Todo blocks store todos array in data
      return JSON.stringify({
        data: {
          todos: block.todos || block.data?.todos || []
        }
      });
      
    case 'ai':
    case 'ai_conversation':
      // AI conversation blocks store messages
      return JSON.stringify({
        messages: block.messages || block.data?.messages || []
      });
      
    case 'image':
      // Image blocks store images array
      return JSON.stringify({
        images: block.images || block.data?.images || [],
        layout: block.layout || 'grid',
        columns: block.columns || 3
      });
      
    case 'inlineImage':
      // Inline images store URL and metadata
      return JSON.stringify({
        url: block.url || block.data?.url || '',
        alt: block.alt || block.data?.alt || '',
        caption: block.caption || block.data?.caption || ''
      });
      
    default:
      // For unknown types, preserve content as-is
      return block.content || '';
  }
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
        // Batch blocks to avoid Cloudflare subrequest limit
        if (blocks.length > 0) {
          const BATCH_SIZE = 20; // Process blocks in batches of 20
          const batches = [];
          
          // Create batches
          for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
            batches.push(blocks.slice(i, i + BATCH_SIZE));
          }
          
          // Process each batch
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchPromises = [];
            
            // Create promises for all blocks in this batch
            for (let blockIndex = 0; blockIndex < batch.length; blockIndex++) {
              const block = batch[blockIndex];
              const absoluteIndex = batchIndex * BATCH_SIZE + blockIndex;
              
              const blockPromise = fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_add_block`, {
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
                  p_content: serializeBlockContent(block),
                  p_metadata: block.metadata || {},
                  p_position: absoluteIndex
                })
              });
              
              batchPromises.push(blockPromise);
            }
            
            // Wait for all blocks in this batch to complete
            const batchResponses = await Promise.all(batchPromises);
            
            // Check all responses
            for (const blockResponse of batchResponses) {
              if (!blockResponse.ok) {
                const error = await blockResponse.text();
                throw new Error(`Failed to add block: ${error}`);
              }
              
              const blockResult = await blockResponse.json();
              if (!blockResult.success) {
                throw new Error(`Failed to add block: ${blockResult.error || 'Unknown error'}`);
              }
            }
            
            // Small delay between batches to avoid rate limiting
            if (batchIndex < batches.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
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
        
        // Parse blocks if it's a JSON string
        let parsedBlocks = blocks;
        if (typeof blocks === 'string') {
          try {
            parsedBlocks = JSON.parse(blocks);
          } catch (e) {
            // If it's not valid JSON, treat it as null
            parsedBlocks = null;
          }
        }
        
        // Update document metadata (title, tags) without blocks to avoid the database function bug
        const metadataResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_update_document`, {
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
            p_blocks: null  // Always set to null to avoid the database function bug
          })
        });

        if (!metadataResponse.ok) {
          const error = await metadataResponse.text();
          throw new Error(`Failed to update document metadata: ${error}`);
        }

        const metadataResult = await metadataResponse.json();
        
        if (!metadataResult.success) {
          throw new Error(`Failed to update document metadata: ${metadataResult.error || 'Update failed'}`);
        }

        // If blocks are provided, handle them separately
        if (parsedBlocks && Array.isArray(parsedBlocks)) {
          // First, get existing blocks to delete them
          const getDocResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_get_document`, {
            method: 'POST',
            headers: {
              'apikey': env.SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              p_api_key: apiKey,
              p_document_id: documentId,
              p_semantic: false
            })
          });

          if (getDocResponse.ok) {
            const docResult = await getDocResponse.json();
            if (docResult.success && docResult.blocks) {
              // Delete existing blocks one by one using the delete_blocks function if available
              const blockIds = docResult.blocks.map((block: any) => block.id);
              if (blockIds.length > 0) {
                const deleteResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_delete_blocks`, {
                  method: 'POST',
                  headers: {
                    'apikey': env.SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                  },
                  body: JSON.stringify({
                    p_api_key: apiKey,
                    p_document_id: documentId,
                    p_block_ids: blockIds
                  })
                });
                // Don't fail if deletion doesn't work - just continue with adding new blocks
              }
            }
          }
          
          // Add new blocks
          for (let index = 0; index < parsedBlocks.length; index++) {
            const block = parsedBlocks[index];
            
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
                p_content: serializeBlockContent(block),
                p_metadata: block.metadata || {},
                p_position: index
              })
            });

            if (!blockResponse.ok) {
              const error = await blockResponse.text();
              throw new Error(`Failed to add block at position ${index}: ${error}`);
            }
            
            const blockResult = await blockResponse.json();
            if (!blockResult.success) {
              throw new Error(`Failed to add block at position ${index}: ${blockResult.error || 'Unknown error'}`);
            }
          }
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

      // ============================================
      // FOLDER MANAGEMENT TOOLS
      // ============================================
      
      case 'create_folder': {
        const { name, parent_id = null, color = '#6B7280', icon = 'folder' } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for folder creation');
        }
        
        if (!name) {
          throw new Error('Folder name is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_create_folder`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_name: name,
            p_parent_id: parent_id,
            p_color: color,
            p_icon: icon
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create folder: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to create folder: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: `Folder "${name}" created successfully with ID: ${result.folder_id}`,
        }];
      }

      case 'list_folders': {
        const { parent_id = null, recursive = false } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for listing folders');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_list_folders`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_parent_id: parent_id,
            p_recursive: recursive
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to list folders: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to list folders: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result.folders, null, 2),
        }];
      }

      case 'get_folder_contents': {
        const { folder_id = null, include_subfolders = true } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for getting folder contents');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_get_folder_contents`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_folder_id: folder_id,
            p_include_subfolders: include_subfolders
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get folder contents: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to get folder contents: ${result.error || 'Unknown error'}`);
        }

        const output = {
          folder_id: result.folder_id || 'root',
          total_folders: result.total_folders,
          total_documents: result.total_documents,
          folders: result.folders,
          documents: result.documents
        };

        return [{
          type: 'text',
          text: JSON.stringify(output, null, 2),
        }];
      }

      case 'move_document_to_folder':
      case 'move_document': {
        const { document_id, folder_id = null, position = null } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for moving documents');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_move_document`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_folder_id: folder_id,
            p_position: position
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to move document: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to move document: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Document moved successfully',
        }];
      }

      case 'delete_folder': {
        const { folder_id, recursive = false } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for deleting folders');
        }
        
        if (!folder_id) {
          throw new Error('Folder ID is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_delete_folder`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_folder_id: folder_id,
            p_recursive: recursive
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to delete folder: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to delete folder: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Folder deleted successfully',
        }];
      }

      case 'update_folder': {
        const { folder_id, name, color, icon, is_favorite, parent_id } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for updating folders');
        }
        
        if (!folder_id) {
          throw new Error('Folder ID is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_update_folder`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_folder_id: folder_id,
            p_name: name,
            p_color: color,
            p_icon: icon,
            p_is_favorite: is_favorite,
            p_parent_id: parent_id
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update folder: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to update folder: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Folder updated successfully',
        }];
      }

      // ============================================
      // ADVANCED BLOCK MANAGEMENT TOOLS
      // ============================================
      
      case 'search_blocks': {
        const { document_id, query, block_type = null, limit = 10, offset = 0 } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for searching blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_search_blocks`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_search_query: query || '',  // Fixed: use p_search_query instead of p_query
            p_block_type: block_type,
            p_limit: limit,
            p_offset: offset
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to search blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to search blocks: ${result.error || 'Unknown error'}`);
        }

        // Return blocks array directly for test compatibility
        return [{
          type: 'text',
          text: JSON.stringify(result.blocks || [], null, 2),
        }];
      }

      case 'get_blocks_range': {
        const { document_id, start_position, end_position } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for getting block range');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (start_position === undefined || end_position === undefined) {
          throw new Error('Start and end positions are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_get_blocks_range`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_start_position: start_position,
            p_end_position: end_position
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to get block range: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to get block range: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }];
      }

      case 'insert_blocks_at': {
        const { document_id, position, blocks } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for inserting blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (position === undefined) {
          throw new Error('Position is required');
        }
        
        if (!blocks || !Array.isArray(blocks)) {
          throw new Error('Blocks array is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_insert_blocks_at`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_position: position,
            p_blocks: blocks,  // Pass as JSON array directly, not stringified
            p_shift_mode: 'after'  // Default shift mode
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to insert blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to insert blocks: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || `Inserted ${blocks.length} blocks at position ${position}`,
        }];
      }

      case 'update_specific_blocks': {
        // Support both 'updates' and 'blocks' parameter names for backward compatibility
        const { document_id, updates, blocks } = args;
        const blockUpdates = updates || blocks;
        
        if (!apiKey) {
          throw new Error('API key is required for updating blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (!blockUpdates || !Array.isArray(blockUpdates)) {
          throw new Error('Updates array is required (pass as either "updates" or "blocks")');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_update_specific_blocks`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_updates: blockUpdates  // Pass as JSON array directly, not stringified
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to update blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to update blocks: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Blocks updated successfully',
        }];
      }

      case 'delete_blocks': {
        const { document_id, block_ids } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for deleting blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (!block_ids || !Array.isArray(block_ids)) {
          throw new Error('Block IDs array is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_delete_blocks`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_block_ids: block_ids
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to delete blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to delete blocks: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Blocks deleted successfully',
        }];
      }

      case 'move_blocks': {
        const { document_id, block_ids, target_position } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for moving blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (!block_ids || !Array.isArray(block_ids)) {
          throw new Error('Block IDs array is required');
        }
        
        if (target_position === undefined) {
          throw new Error('Target position is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_move_blocks`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_block_ids: block_ids,
            p_target_position: target_position
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to move blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to move blocks: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: result.message || 'Blocks moved successfully',
        }];
      }

      // ============================================
      // SOPHISTICATED BLOCK-TYPE-AWARE EDITING
      // ============================================
      
      case 'smart_edit_block': {
        const { block_id, operation, params } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for smart block editing');
        }
        
        if (!block_id) {
          throw new Error('Block ID is required');
        }
        
        if (!operation) {
          throw new Error('Operation is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_smart_edit_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: operation,
            p_params: params || {}
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to edit block: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to edit block: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }];
      }

      case 'edit_text_block': {
        const { block_id, operation, params } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for text block editing');
        }
        
        if (!block_id || !operation) {
          throw new Error('Block ID and operation are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_edit_text_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: operation,
            p_params: params || {}
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to edit text block: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to edit text block: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }];
      }

      case 'edit_code_block': {
        const { block_id, operation, params } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for code block editing');
        }
        
        if (!block_id || !operation) {
          throw new Error('Block ID and operation are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_edit_code_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: operation,
            p_params: params || {}
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to edit code block: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to edit code block: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }];
      }

      case 'edit_table_cell': {
        const { block_id, row, column, value } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for table editing');
        }
        
        if (!block_id) {
          throw new Error('Block ID is required');
        }
        
        if (row === undefined || column === undefined) {
          throw new Error('Row and column are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_edit_table_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: 'update_cell',
            p_params: { row, column, value }
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to edit table cell: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to edit table cell: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: `Cell updated at row ${row}, column ${column}`,
        }];
      }

      case 'toggle_todo_items': {
        const { block_id, todo_ids } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for todo operations');
        }
        
        if (!block_id || !todo_ids) {
          throw new Error('Block ID and todo IDs are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_edit_todo_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: 'bulk_update_status',
            p_params: { 
              todo_ids: todo_ids,
              status: 'done'
            }
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to toggle todos: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to toggle todos: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }];
      }

      case 'edit_ai_message': {
        const { block_id, index, content } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for AI block editing');
        }
        
        if (!block_id || index === undefined) {
          throw new Error('Block ID and message index are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_edit_ai_block`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_operation: 'edit_message',
            p_params: { index, content }
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to edit AI message: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to edit AI message: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: `Message ${index} updated successfully`,
        }];
      }

      case 'transform_block_type': {
        const { block_id, new_type, options = {} } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for block transformation');
        }
        
        if (!block_id || !new_type) {
          throw new Error('Block ID and new type are required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_transform_block_type`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_block_id: block_id,
            p_new_type: new_type,
            p_options: options
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to transform block: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to transform block: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: `Block transformed from ${result.old_type} to ${result.new_type}`,
        }];
      }

      case 'duplicate_blocks': {
        const { document_id, block_ids, target_position = null } = args;
        
        if (!apiKey) {
          throw new Error('API key is required for duplicating blocks');
        }
        
        if (!document_id) {
          throw new Error('Document ID is required');
        }
        
        if (!block_ids || !Array.isArray(block_ids)) {
          throw new Error('Block IDs array is required');
        }
        
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mcp_duplicate_blocks`, {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            p_api_key: apiKey,
            p_document_id: document_id,
            p_block_ids: block_ids,
            p_target_position: target_position
          })
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to duplicate blocks: ${error}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(`Failed to duplicate blocks: ${result.error || 'Unknown error'}`);
        }

        return [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
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