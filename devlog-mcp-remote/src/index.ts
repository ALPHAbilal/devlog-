import { MCPSession, Env } from './durable-objects/MCPSession';
import { handleSSEConnection, handleHTTPRequest } from './transport';
import { authenticateRequest } from './auth';
import { DevlogMCPServer } from './mcp-server';
import { MCPProtocolServer } from './mcp-protocol';

// Export Durable Object class
export { MCPSession };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Initialize MCP Protocol Server
    const mcpServer = new MCPProtocolServer(env);
    
    // CORS headers for browser-based clients
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Session-ID, Mcp-Session-Id, Accept',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      switch (url.pathname) {
        case '/mcp':
          // Proper MCP Protocol endpoint
          return mcpServer.handleMCPRequest(request);
          
        // Legacy REST endpoints for backward compatibility and testing
        case '/health':
          return new Response('OK', { headers: corsHeaders });

        case '/api/info':
          // API information endpoint
          return new Response(JSON.stringify({
            name: 'devlog-mcp',
            version: '1.0.0',
            protocol: 'mcp-2024-11-05',
            transports: ['http'],
            capabilities: {
              tools: true,
              resources: false,
              prompts: false,
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case '/api/tools':
          // Legacy REST endpoint - require authentication
          const authTools = await authenticateRequest(request, env);
          if (!authTools.valid) {
            return new Response(JSON.stringify({ error: authTools.error }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Return available tools
          if (request.method !== 'GET' && request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
          }
          
          const tools = {
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
                            enum: ['text', 'code', 'heading', 'ai', 'todo', 'filetree', 'table', 'image', 'inline-image', 'template', 'math', 'version-track', 'issue-tracker']
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
          
          return new Response(JSON.stringify(tools), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        case '/api/execute':
          // Legacy REST endpoint - require authentication
          const authExecute = await authenticateRequest(request, env);
          if (!authExecute.valid) {
            return new Response(JSON.stringify({ error: authExecute.error }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Execute a tool
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
          }
          
          try {
            const body = await request.json() as { tool: string; arguments: any };
            const { tool, arguments: args } = body;
            
            // Import and use the tool executor
            const { executeToolCommand } = await import('./tools');
            // Extract API key from Authorization header
            const authHeader = request.headers.get('Authorization') || '';
            const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
            const result = await executeToolCommand(tool, args, env, authExecute.userId!, authExecute.projectId!, apiKey);
            
            return new Response(JSON.stringify({ result }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } catch (error) {
            console.error('Tool execution error:', error);
            return new Response(JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Tool execution failed' 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

        // Legacy endpoints - keeping for backward compatibility  
        case '/sse':
        case '/messages':
          // These endpoints require authentication
          const authLegacy = await authenticateRequest(request, env);
          if (!authLegacy.valid) {
            return new Response(JSON.stringify({ error: authLegacy.error }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (url.pathname === '/sse') {
            // Server-Sent Events endpoint for MCP
            return handleSSEConnection(request, env, authLegacy.userId!, authLegacy.projectId!);
          } else {
            // HTTP POST endpoint for MCP messages
            if (request.method !== 'POST') {
              return new Response('Method not allowed', { status: 405, headers: corsHeaders });
            }
            return handleHTTPRequest(request, env, authLegacy.userId!, authLegacy.projectId!);
          }

        default:
          return new Response('Not found', { status: 404, headers: corsHeaders });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
} satisfies ExportedHandler<Env>;