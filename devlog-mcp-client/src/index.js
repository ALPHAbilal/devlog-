#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

class DevlogMCPBridge {
  constructor() {
    this.remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp-production.bilal-kosika.workers.dev';
    this.apiKey = process.env.DEVLOG_API_KEY;
    this.debug = process.env.DEVLOG_DEBUG === 'true';
    this.sessionId = null;
    
    // Debug: Log environment state at initialization
    if (this.debug) {
      console.error('[INDEX DEBUG] MCP Bridge initialized with:', {
        remoteUrl: this.remoteUrl,
        apiKey: this.apiKey ? 'PROVIDED' : 'MISSING',
        debug: this.debug
      });
    }
    
    if (!this.apiKey) {
      console.error('Error: DEVLOG_API_KEY environment variable is required');
      console.error('Please set it in your Claude Desktop or VS Code configuration');
      process.exit(1);
    }
    
    // Create the local MCP server that Claude will connect to
    this.server = new Server(
      {
        name: 'devlog-mcp',
        version: '1.0.2',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.setupHandlers();
  }

  /**
   * Initialize MCP session with the remote server
   */
  async initializeMCPSession() {
    try {
      this.log('Initializing MCP session with remote server...');
      this.log(`Using URL: ${this.remoteUrl}/mcp`);
      this.log(`API Key status: ${this.apiKey ? 'PROVIDED' : 'MISSING'}`);
      
      const response = await fetch(`${this.remoteUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',  // Updated to latest version
            capabilities: {},
            clientInfo: {
              name: 'devlog-mcp-client',
              version: '2.0.0'
            }
          },
          id: 1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Response status: ${response.status}`);
        this.log(`Response body: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Extract session ID from headers
      this.sessionId = response.headers.get('Mcp-Session-Id');
      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP initialization failed: ${result.error.message}`);
      }

      this.log('MCP session initialized successfully');
      this.log('Session ID:', this.sessionId);
      this.log('Server info:', result.result.serverInfo);
      
    } catch (error) {
      console.error('Failed to initialize MCP session:', error.message);
      throw error;
    }
  }

  log(...args) {
    if (this.debug) {
      console.error('[DEBUG]', ...args);
    }
  }

  setupHandlers() {
    // Handle tool listing requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.log('Handling tools/list request');
      
      try {
        const response = await this.callMCPMethod('tools/list', {});
        return { tools: response.result.tools || [] };
      } catch (error) {
        this.log('Error fetching tools:', error.message);
        // Return default tools if remote fails
        return {
          tools: [
            {
              name: 'create_document',
              description: 'Create a new Devlog document',
              inputSchema: {
                type: 'object',
                properties: {
                  title: { 
                    type: 'string', 
                    description: 'Document title' 
                  },
                  folder_id: {
                    type: 'string',
                    description: 'Folder ID to create document in (optional, null for root)'
                  },
                  blocks: { 
                    type: 'array', 
                    description: 'Content blocks',
                    items: {
                      type: 'object',
                      properties: {
                        type: { 
                          type: 'string',
                          enum: ['text', 'code', 'heading', 'ai', 'todo', 'filetree', 'table', 'image', 'inline-image']
                        },
                        content: { type: 'string' },
                        metadata: { type: 'object' }
                      },
                      required: ['type', 'content']
                    }
                  },
                  tags: {
                    type: 'array',
                    description: 'Document tags',
                    items: { type: 'string' }
                  },
                },
                required: ['title'],
              },
            },
            {
              name: 'get_document',
              description: 'Get a specific Devlog document by ID',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { 
                    type: 'string', 
                    description: 'Document ID' 
                  },
                  semantic: { 
                    type: 'boolean', 
                    description: 'Return semantic snapshot (reduces data by ~90%)',
                    default: false
                  },
                },
                required: ['id'],
              },
            },
            {
              name: 'search_documents',
              description: 'Search through Devlog documents',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { 
                    type: 'string', 
                    description: 'Search query' 
                  },
                  limit: { 
                    type: 'number', 
                    description: 'Max results', 
                    default: 10 
                  },
                },
                required: ['query'],
              },
            },
            {
              name: 'update_document',
              description: 'Update an existing Devlog document',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { 
                    type: 'string', 
                    description: 'Document ID' 
                  },
                  title: { 
                    type: 'string', 
                    description: 'New title (optional)' 
                  },
                  blocks: { 
                    type: 'array', 
                    description: 'Updated blocks (optional)' 
                  },
                },
                required: ['id'],
              },
            },
            {
              name: 'delete_document',
              description: 'Delete a Devlog document',
              inputSchema: {
                type: 'object',
                properties: {
                  id: { 
                    type: 'string', 
                    description: 'Document ID to delete' 
                  },
                },
                required: ['id'],
              },
            },
            // Folder Management Tools
            {
              name: 'create_folder',
              description: 'Create a new folder to organize documents',
              inputSchema: {
                type: 'object',
                properties: {
                  name: { 
                    type: 'string', 
                    description: 'Folder name' 
                  },
                  parent_id: { 
                    type: 'string', 
                    description: 'Parent folder ID (optional, null for root)' 
                  },
                  color: { 
                    type: 'string', 
                    description: 'Folder color (hex code, default: #6B7280)' 
                  },
                  icon: { 
                    type: 'string', 
                    description: 'Folder icon (default: folder)' 
                  },
                },
                required: ['name'],
              },
            },
            {
              name: 'list_folders',
              description: 'List all folders in the workspace',
              inputSchema: {
                type: 'object',
                properties: {
                  parent_id: { 
                    type: 'string', 
                    description: 'Parent folder ID (null for root)' 
                  },
                  recursive: { 
                    type: 'boolean', 
                    description: 'Include all subfolders recursively',
                    default: false
                  },
                },
              },
            },
            {
              name: 'get_folder_contents',
              description: 'Get contents of a folder (subfolders and documents)',
              inputSchema: {
                type: 'object',
                properties: {
                  folder_id: { 
                    type: 'string', 
                    description: 'Folder ID (null for root)' 
                  },
                  include_subfolders: { 
                    type: 'boolean', 
                    description: 'Include subfolders in response',
                    default: true
                  },
                },
              },
            },
            {
              name: 'move_document_to_folder',
              description: 'Move a document to a different folder',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { 
                    type: 'string', 
                    description: 'Document ID to move' 
                  },
                  folder_id: { 
                    type: 'string', 
                    description: 'Target folder ID (null for root)' 
                  },
                  position: { 
                    type: 'number', 
                    description: 'Position within folder (optional)' 
                  },
                },
                required: ['document_id'],
              },
            },
            {
              name: 'delete_folder',
              description: 'Delete a folder',
              inputSchema: {
                type: 'object',
                properties: {
                  folder_id: { 
                    type: 'string', 
                    description: 'Folder ID to delete' 
                  },
                  recursive: { 
                    type: 'boolean', 
                    description: 'Delete folder even if it contains items',
                    default: false
                  },
                },
                required: ['folder_id'],
              },
            },
            {
              name: 'update_folder',
              description: 'Update folder properties',
              inputSchema: {
                type: 'object',
                properties: {
                  folder_id: { 
                    type: 'string', 
                    description: 'Folder ID to update' 
                  },
                  name: { 
                    type: 'string', 
                    description: 'New folder name' 
                  },
                  color: { 
                    type: 'string', 
                    description: 'New color (hex code)' 
                  },
                  icon: { 
                    type: 'string', 
                    description: 'New icon' 
                  },
                  is_favorite: { 
                    type: 'boolean', 
                    description: 'Mark as favorite' 
                  },
                  parent_id: { 
                    type: 'string', 
                    description: 'Move to different parent' 
                  },
                },
                required: ['folder_id'],
              },
            },
            // Advanced block management tools
            {
              name: 'search_blocks',
              description: 'Search for blocks within a document by content or type',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document to search in' },
                  query: { type: 'string', description: 'Search query for block content' },
                  block_type: { type: 'string', description: 'Filter by block type (optional)' },
                  limit: { type: 'number', description: 'Maximum results to return', default: 10 },
                  offset: { type: 'number', description: 'Number of results to skip', default: 0 }
                },
                required: ['document_id'],
              },
            },
            {
              name: 'get_blocks_range',
              description: 'Get a specific range of blocks from a document by position',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  start_position: { type: 'number', description: 'Starting position (0-based)' },
                  end_position: { type: 'number', description: 'Ending position (inclusive)' }
                },
                required: ['document_id', 'start_position', 'end_position'],
              },
            },
            {
              name: 'insert_blocks_at',
              description: 'Insert new blocks at a specific position in a document',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  position: { type: 'number', description: 'Position to insert blocks at' },
                  blocks: {
                    type: 'array',
                    description: 'Array of blocks to insert',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        content: { type: 'string' },
                        metadata: { type: 'object' }
                      },
                      required: ['type', 'content']
                    }
                  }
                },
                required: ['document_id', 'position', 'blocks'],
              },
            },
            {
              name: 'update_specific_blocks',
              description: 'Update specific blocks by their IDs without replacing all blocks',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  updates: {
                    type: 'array',
                    description: 'Array of block updates',
                    items: {
                      type: 'object',
                      properties: {
                        block_id: { type: 'string', description: 'ID of the block to update' },
                        type: { type: 'string', description: 'New block type (optional)' },
                        content: { type: 'string', description: 'New content (optional)' },
                        metadata: { type: 'object', description: 'New metadata (optional)' }
                      },
                      required: ['block_id']
                    }
                  }
                },
                required: ['document_id', 'updates'],
              },
            },
            {
              name: 'delete_blocks',
              description: 'Delete specific blocks from a document',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  block_ids: {
                    type: 'array',
                    description: 'Array of block IDs to delete',
                    items: { type: 'string' }
                  }
                },
                required: ['document_id', 'block_ids'],
              },
            },
            {
              name: 'move_blocks',
              description: 'Move blocks to a different position within a document',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  block_ids: {
                    type: 'array',
                    description: 'Array of block IDs to move',
                    items: { type: 'string' }
                  },
                  target_position: { type: 'number', description: 'Target position to move blocks to' }
                },
                required: ['document_id', 'block_ids', 'target_position'],
              },
            },
            {
              name: 'duplicate_blocks',
              description: 'Duplicate blocks within a document',
              inputSchema: {
                type: 'object',
                properties: {
                  document_id: { type: 'string', description: 'ID of the document' },
                  block_ids: {
                    type: 'array',
                    description: 'Array of block IDs to duplicate',
                    items: { type: 'string' }
                  },
                  target_position: { type: 'number', description: 'Position to insert duplicates (optional, defaults to end)' }
                },
                required: ['document_id', 'block_ids'],
              },
            },
            // Sophisticated block-type-aware editing tools
            {
              name: 'smart_edit_block',
              description: 'Intelligent content editing with operations like replace, append, prepend, insert_at',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the block to edit' },
                  operation: { 
                    type: 'string', 
                    enum: ['replace', 'replace_all', 'append', 'prepend', 'insert_at', 'delete_range'],
                    description: 'Editing operation to perform' 
                  },
                  params: {
                    type: 'object',
                    description: 'Operation-specific parameters',
                    properties: {
                      find: { type: 'string', description: 'Text to find (for replace operations)' },
                      replace: { type: 'string', description: 'Replacement text' },
                      text: { type: 'string', description: 'Text to insert' },
                      position: { type: 'number', description: 'Position for insert_at' },
                      start: { type: 'number', description: 'Start position for delete_range' },
                      end: { type: 'number', description: 'End position for delete_range' },
                      flags: { type: 'string', description: 'Regex flags (default: g)' }
                    }
                  }
                },
                required: ['block_id', 'operation'],
              },
            },
            {
              name: 'edit_text_block',
              description: 'Specialized text/markdown block editing with formatting operations',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the text block' },
                  operation: { 
                    type: 'string', 
                    enum: ['format_bold', 'format_italic', 'add_link', 'add_tag', 'extract_tags', 'add_quote', 'add_list_item'],
                    description: 'Text formatting operation' 
                  },
                  params: {
                    type: 'object',
                    description: 'Operation parameters',
                    properties: {
                      text: { type: 'string' },
                      url: { type: 'string' },
                      tag: { type: 'string' },
                      quote: { type: 'string' },
                      item: { type: 'string' }
                    }
                  }
                },
                required: ['block_id', 'operation'],
              },
            },
            {
              name: 'edit_code_block',
              description: 'Advanced code block editing with syntax-aware operations',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the code block' },
                  operation: { 
                    type: 'string', 
                    enum: ['insert_line', 'delete_line', 'replace_function', 'add_import', 'rename_variable', 'add_comment', 'update_metadata'],
                    description: 'Code editing operation' 
                  },
                  params: {
                    type: 'object',
                    description: 'Operation parameters',
                    properties: {
                      line_number: { type: 'number' },
                      text: { type: 'string' },
                      function_name: { type: 'string' },
                      new_implementation: { type: 'string' },
                      import_statement: { type: 'string' },
                      old_name: { type: 'string' },
                      new_name: { type: 'string' },
                      comment: { type: 'string' },
                      language: { type: 'string' },
                      filePath: { type: 'string' }
                    }
                  }
                },
                required: ['block_id', 'operation'],
              },
            },
            {
              name: 'edit_table_cell',
              description: 'Edit a specific cell in a table block',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the table block' },
                  row: { type: 'number', description: 'Row index (0-based)' },
                  column: { type: 'number', description: 'Column index (0-based)' },
                  value: { type: 'string', description: 'New cell value' }
                },
                required: ['block_id', 'row', 'column', 'value'],
              },
            },
            {
              name: 'toggle_todo_items',
              description: 'Toggle completion status of todo items',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the todo block' },
                  todo_ids: {
                    type: 'array',
                    description: 'Array of todo item IDs to toggle',
                    items: { type: 'string' }
                  }
                },
                required: ['block_id', 'todo_ids'],
              },
            },
            {
              name: 'edit_ai_message',
              description: 'Edit a message in an AI conversation block',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the AI block' },
                  index: { type: 'number', description: 'Message index to edit' },
                  content: { type: 'string', description: 'New message content' }
                },
                required: ['block_id', 'index', 'content'],
              },
            },
            {
              name: 'transform_block_type',
              description: 'Transform a block from one type to another intelligently',
              inputSchema: {
                type: 'object',
                properties: {
                  block_id: { type: 'string', description: 'ID of the block to transform' },
                  new_type: { 
                    type: 'string',
                    enum: ['text', 'code', 'table', 'todo', 'ai', 'heading', 'filetree'],
                    description: 'Target block type' 
                  },
                  options: {
                    type: 'object',
                    description: 'Transformation options',
                    properties: {
                      language: { type: 'string', description: 'Language for code blocks' }
                    }
                  }
                },
                required: ['block_id', 'new_type'],
              },
            },
          ],
        };
      }
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`Handling tool call: ${name}`, args);
      
      try {
        const response = await this.callMCPMethod('tools/call', {
          name: name,
          arguments: args,
        });
        
        if (response.error) {
          throw new Error(response.error.message || response.error);
        }
        
        return {
          content: response.result.content || [{
            type: 'text',
            text: JSON.stringify(response, null, 2),
          }],
        };
      } catch (error) {
        this.log('Tool execution error:', error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`,
          }],
          isError: true,
        };
      }
    });
  }

  async start() {
    try {
      this.log('Starting Devlog MCP Bridge...');
      
      // Initialize MCP session
      await this.initializeMCPSession();
      
      // Use stdio transport to communicate with Claude
      const transport = new StdioServerTransport();
      
      // Handle transport errors properly
      transport.onerror = (error) => {
        console.error('Transport error:', error);
      };
      
      await this.server.connect(transport);
      
      console.error('✓ Devlog MCP Bridge connected successfully');
      console.error(`✓ Remote URL: ${this.remoteUrl}`);
      console.error(`✓ Debug mode: ${this.debug ? 'enabled' : 'disabled'}`);
      console.error(`✓ Session ID: ${this.sessionId || 'Not established'}`);
      
      // Keep the process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('Failed to start MCP bridge:', error);
      process.exit(1);
    }
  }

  /**
   * Call MCP method using proper JSON-RPC 2.0 protocol
   */
  async callMCPMethod(method, params) {
    this.log(`Calling MCP method: ${method}`);
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }
    
    const response = await fetch(`${this.remoteUrl}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now()
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Remote server error (${response.status}): ${text}`);
    }

    return response.json();
  }

  /**
   * Legacy REST API call (kept for backward compatibility)
   */
  async callRemote(endpoint, data) {
    const url = new URL(endpoint, this.remoteUrl);
    this.log(`Calling remote: ${url}`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Remote server error (${response.status}): ${text}`);
    }

    return response.json();
  }
}

// Export for testing
export default DevlogMCPBridge;

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const bridge = new DevlogMCPBridge();
  bridge.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}