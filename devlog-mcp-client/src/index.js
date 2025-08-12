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
              version: '1.0.7'
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