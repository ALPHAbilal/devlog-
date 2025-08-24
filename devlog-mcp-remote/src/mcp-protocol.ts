/**
 * Proper MCP Protocol Implementation
 * Compliant with MCP 2025-03-26 specification
 */

interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number | null;
}

interface MCPSession {
  id: string;
  userId: string;
  projectId: string;
  apiKey: string;
  createdAt: Date;
}

export class MCPProtocolServer {
  private sessions = new Map<string, MCPSession>();

  constructor(private env: any) {}

  /**
   * Main MCP endpoint handler - handles all JSON-RPC messages
   */
  async handleMCPRequest(request: Request): Promise<Response> {
    const corsHeaders = this.getCORSHeaders();

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Support both POST (primary) and GET (for SSE fallback)
    if (request.method === 'POST') {
      return this.handleJSONRPCRequest(request, corsHeaders);
    }

    if (request.method === 'GET') {
      return this.handleSSERequest(request, corsHeaders);
    }

    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  /**
   * Handle JSON-RPC 2.0 requests (primary transport)
   */
  private async handleJSONRPCRequest(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    try {
      // Parse JSON-RPC request
      const rpcRequest: JSONRPCRequest = await request.json();
      
      // Validate JSON-RPC format
      if (rpcRequest.jsonrpc !== '2.0' || !rpcRequest.method) {
        return this.createErrorResponse(null, -32600, 'Invalid Request', corsHeaders);
      }

      // Route based on method
      let response: JSONRPCResponse;
      let newSessionId: string | null = null;
      
      switch (rpcRequest.method) {
        case 'initialize':
          const initResult = await this.handleInitialize(rpcRequest, request);
          response = initResult.response;
          newSessionId = initResult.sessionId;
          break;
        case 'tools/list':
          response = await this.handleToolsList(rpcRequest, request);
          break;
        case 'tools/call':
          response = await this.handleToolsCall(rpcRequest, request);
          break;
        default:
          response = this.createError(rpcRequest.id, -32601, 'Method not found');
          break;
      }

      // Add session ID to headers
      const existingSessionId = this.getSessionFromRequest(request);
      const sessionIdToUse = newSessionId || existingSessionId;
      if (sessionIdToUse) {
        corsHeaders['Mcp-Session-Id'] = sessionIdToUse;
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('JSON-RPC request error:', error);
      return this.createErrorResponse(null, -32700, 'Parse error', corsHeaders);
    }
  }

  /**
   * Handle Server-Sent Events (SSE) fallback transport
   */
  private async handleSSERequest(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
    // Check if client accepts SSE
    const acceptHeader = request.headers.get('Accept');
    if (!acceptHeader?.includes('text/event-stream')) {
      return new Response('SSE transport not requested', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // For now, return not implemented - we'll focus on POST transport first
    return new Response('SSE transport not yet implemented', { 
      status: 501, 
      headers: corsHeaders 
    });
  }

  /**
   * Handle MCP initialization
   */
  private async handleInitialize(request: JSONRPCRequest, httpRequest: Request): Promise<{ response: JSONRPCResponse, sessionId: string }> {
    try {
      // Authenticate the request
      const auth = await this.authenticateRequest(httpRequest);
      if (!auth.valid) {
        return {
          response: this.createError(request.id, -32001, 'Authentication failed'),
          sessionId: ''
        };
      }

      // Create new session
      const sessionId = crypto.randomUUID();
      const session: MCPSession = {
        id: sessionId,
        userId: auth.userId!,
        projectId: auth.projectId!,
        apiKey: this.extractAPIKey(httpRequest),
        createdAt: new Date(),
      };

      this.sessions.set(sessionId, session);

      return {
        response: {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2025-03-26',
            capabilities: {
              tools: {},
              // Add other capabilities as needed
            },
            serverInfo: {
              name: 'Devlog MCP Server',
              version: '1.0.0',
            },
          },
        },
        sessionId
      };
    } catch (error) {
      return {
        response: this.createError(request.id, -32002, 'Initialization failed'),
        sessionId: ''
      };
    }
  }

  /**
   * Handle tools list request
   */
  private async handleToolsList(request: JSONRPCRequest, httpRequest: Request): Promise<JSONRPCResponse> {
    try {
      // Validate session
      const session = await this.validateSession(httpRequest);
      if (!session) {
        return this.createError(request.id, -32003, 'Invalid session');
      }

      const tools = [
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
        // Folder management tools
        {
          name: 'create_folder',
          description: 'Create a new folder or subfolder',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              parent_id: { type: 'string', description: 'Parent folder ID (optional for root folders)' },
              color: { type: 'string', description: 'Hex color code (default: #6B7280)' },
              icon: { type: 'string', description: 'Icon name (default: folder)' },
            },
            required: ['name'],
          },
        },
        {
          name: 'list_folders',
          description: 'List folders in the workspace',
          inputSchema: {
            type: 'object',
            properties: {
              parent_id: { type: 'string', description: 'Parent folder ID to list children (optional)' },
              recursive: { type: 'boolean', description: 'Get entire folder tree recursively' },
            },
          },
        },
        {
          name: 'get_folder_contents',
          description: 'Get folders and documents in a specific folder',
          inputSchema: {
            type: 'object',
            properties: {
              folder_id: { type: 'string', description: 'Folder ID (optional, null for root)' },
              include_subfolders: { type: 'boolean', description: 'Include subfolders in response' },
            },
          },
        },
        {
          name: 'move_document_to_folder',
          description: 'Move a document to a different folder',
          inputSchema: {
            type: 'object',
            properties: {
              document_id: { type: 'string', description: 'Document ID to move' },
              folder_id: { type: 'string', description: 'Target folder ID (optional, null for root)' },
              position: { type: 'number', description: 'Position in the folder (optional)' },
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
              folder_id: { type: 'string', description: 'Folder ID to delete' },
              recursive: { type: 'boolean', description: 'Delete all contents recursively' },
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
              folder_id: { type: 'string', description: 'Folder ID to update' },
              name: { type: 'string', description: 'New folder name' },
              color: { type: 'string', description: 'New hex color code' },
              icon: { type: 'string', description: 'New icon name' },
              is_favorite: { type: 'boolean', description: 'Mark as favorite' },
              parent_id: { type: 'string', description: 'Move to different parent folder' },
            },
            required: ['folder_id'],
          },
        },
      ];

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: { tools },
      };
    } catch (error) {
      return this.createError(request.id, -32004, 'Failed to list tools');
    }
  }

  /**
   * Handle tool execution
   */
  private async handleToolsCall(request: JSONRPCRequest, httpRequest: Request): Promise<JSONRPCResponse> {
    try {
      // Validate session
      const session = await this.validateSession(httpRequest);
      if (!session) {
        return this.createError(request.id, -32003, 'Invalid session');
      }

      const { name, arguments: args } = request.params;
      
      // Import and execute tool
      const { executeToolCommand } = await import('./tools');
      const result = await executeToolCommand(
        name, 
        args, 
        this.env, 
        session.userId, 
        session.projectId, 
        session.apiKey
      );

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: result,
        },
      };
    } catch (error) {
      console.error('Tool execution error:', error);
      return this.createError(request.id, -32005, `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate request using existing auth logic
   */
  private async authenticateRequest(request: Request) {
    const { authenticateRequest } = await import('./auth');
    return authenticateRequest(request, this.env);
  }

  /**
   * Validate session and return session data
   * For serverless environments, we'll validate based on authentication rather than stored sessions
   */
  private async validateSession(request: Request): Promise<MCPSession | null> {
    const sessionId = this.getSessionFromRequest(request);
    if (!sessionId) {
      return null;
    }

    // For serverless, validate by re-authenticating the request
    // This is stateless and doesn't rely on server memory
    const auth = await this.authenticateRequest(request);
    if (!auth.valid) {
      return null;
    }

    // Return a virtual session based on the authentication
    return {
      id: sessionId,
      userId: auth.userId!,
      projectId: auth.projectId!,
      apiKey: this.extractAPIKey(request),
      createdAt: new Date(), // Not used in stateless mode
    };
  }

  /**
   * Extract session ID from request headers
   */
  private getSessionFromRequest(request: Request): string | null {
    return request.headers.get('Mcp-Session-Id');
  }

  /**
   * Extract API key from request headers
   */
  private extractAPIKey(request: Request): string {
    const authHeader = request.headers.get('Authorization') || '';
    return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  }

  /**
   * Create JSON-RPC error response
   */
  private createError(id: string | number | null, code: number, message: string): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
  }

  /**
   * Create error HTTP response
   */
  private createErrorResponse(id: string | number | null, code: number, message: string, headers: Record<string, string>): Response {
    return new Response(JSON.stringify(this.createError(id, code, message)), {
      status: 200, // JSON-RPC errors are still HTTP 200
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get CORS headers
   */
  private getCORSHeaders(): Record<string, string> {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Accept',
    };
  }
}