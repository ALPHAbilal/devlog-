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
    this.remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp.bilal-kosika.workers.dev';
    this.apiKey = process.env.DEVLOG_API_KEY;
    this.debug = process.env.DEVLOG_DEBUG === 'true';
    
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
        const response = await this.callRemote('/api/tools', {});
        return { tools: response.tools || [] };
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
          ],
        };
      }
    });

    // Handle tool execution requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.log(`Handling tool call: ${name}`, args);
      
      try {
        const response = await this.callRemote('/api/execute', {
          tool: name,
          arguments: args,
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        return {
          content: response.result || [{
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
      
      // Keep the process alive
      process.stdin.resume();
      
    } catch (error) {
      console.error('Failed to start MCP bridge:', error);
      process.exit(1);
    }
  }

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