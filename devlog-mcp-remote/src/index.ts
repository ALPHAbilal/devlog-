import { MCPSession, Env } from './durable-objects/MCPSession';
import { handleSSEConnection, handleHTTPRequest } from './transport';
import { authenticateRequest } from './auth';
import { DevlogMCPServer } from './mcp-server';

// Export Durable Object class
export { MCPSession };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS headers for browser-based clients
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Session-ID',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Authenticate the request
      const auth = await authenticateRequest(request, env);
      if (!auth.valid) {
        return new Response(JSON.stringify({ error: auth.error }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Route handling
      switch (url.pathname) {
        case '/health':
          return new Response('OK', { headers: corsHeaders });

        case '/sse':
          // Server-Sent Events endpoint for MCP
          return handleSSEConnection(request, env, auth.userId, auth.projectId);

        case '/messages':
          // HTTP POST endpoint for MCP messages
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
          }
          return handleHTTPRequest(request, env, auth.userId, auth.projectId);

        case '/api/info':
          // API information endpoint
          return new Response(JSON.stringify({
            name: 'devlog-mcp',
            version: '1.0.0',
            protocol: 'mcp-2024-11-05',
            transports: ['sse', 'http'],
            capabilities: {
              tools: true,
              resources: false,
              prompts: false,
            },
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

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