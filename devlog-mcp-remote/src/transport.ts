import { DevlogMCPServer } from './mcp-server';
import { checkRateLimit } from './auth';

export async function handleSSEConnection(
  request: Request,
  env: any,
  userId: string,
  projectId: string
): Promise<Response> {
  // Check rate limit
  const rateLimit = await checkRateLimit(env, userId, 'pro'); // Get tier from auth
  if (!rateLimit.allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Create a new session ID
  const sessionId = crypto.randomUUID();
  
  // Get or create Durable Object for this session
  const id = env.SESSION.idFromName(sessionId);
  const session = env.SESSION.get(id);

  // Forward the SSE connection to the Durable Object
  return session.fetch(new Request('https://internal/sse', {
    method: 'GET',
    headers: {
      'MCP-Session-ID': sessionId,
      'User-ID': userId,
      'Project-ID': projectId,
    },
  }));
}

export async function handleHTTPRequest(
  request: Request,
  env: any,
  userId: string,
  projectId: string
): Promise<Response> {
  const sessionId = request.headers.get('MCP-Session-ID');
  
  if (!sessionId) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Missing MCP-Session-ID header',
      },
      id: null,
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(env, userId, 'pro');
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Rate limit exceeded',
      },
      id: null,
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the Durable Object for this session
  const id = env.SESSION.idFromName(sessionId);
  const session = env.SESSION.get(id);

  // Forward the request to the Durable Object
  const body = await request.text();
  return session.fetch(new Request('https://internal/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'MCP-Session-ID': sessionId,
      'User-ID': userId,
      'Project-ID': projectId,
    },
    body,
  }));
}