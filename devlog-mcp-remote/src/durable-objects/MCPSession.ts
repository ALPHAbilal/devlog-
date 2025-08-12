import { DurableObject } from "cloudflare:workers";
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { DevlogMCPServer } from '../mcp-server';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SESSION: DurableObjectNamespace<MCPSession>;
  CACHE: KVNamespace;
}

export class MCPSession extends DurableObject {
  private server?: DevlogMCPServer;
  private connections: Map<string, WritableStreamDefaultWriter> = new Map();
  private userId?: string;
  private projectId?: string;
  private heartbeatIntervals: Map<string, Timer> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = request.headers.get('MCP-Session-ID') || crypto.randomUUID();
    const userId = request.headers.get('User-ID');
    const projectId = request.headers.get('Project-ID');

    if (userId && projectId) {
      this.userId = userId;
      this.projectId = projectId;
    }

    // Initialize SQLite tables on first use
    await this.initializeStorage();

    switch (url.pathname) {
      case '/sse':
        return this.handleSSEConnection(sessionId);
      case '/message':
        return this.handleMessage(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  // RPC method for handling SSE connections (2025 pattern)
  async handleSSEConnection(sessionId: string): Promise<Response> {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    
    this.connections.set(sessionId, writer);
    
    // Send initial connection event
    await this.sendSSEEvent(writer, {
      event: "connected",
      data: { sessionId, timestamp: Date.now() }
    });

    // Set up heartbeat to prevent 100-second timeout
    const heartbeatInterval = setInterval(async () => {
      if (this.connections.has(sessionId)) {
        try {
          await this.sendSSEEvent(writer, {
            event: "heartbeat",
            data: "keep-alive"
          });
        } catch (error) {
          // Connection closed, clean up
          clearInterval(heartbeatInterval);
          this.connections.delete(sessionId);
          this.heartbeatIntervals.delete(sessionId);
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 60000); // Every 60 seconds

    this.heartbeatIntervals.set(sessionId, heartbeatInterval as any);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Prevent Cloudflare buffering
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // RPC method for tool execution
  async executeTool(toolName: string, args: any): Promise<any> {
    // Store execution in SQLite
    await this.ctx.storage.sql
      .exec(`INSERT INTO tool_executions (name, args, result, timestamp) VALUES (?, ?, ?, ?)`)
      .bind(toolName, JSON.stringify(args), 'pending', Date.now())
      .run();
    
    // Initialize MCP server if needed
    if (!this.server && this.userId && this.projectId) {
      this.server = new DevlogMCPServer(this.env, this.userId, this.projectId);
      await this.server.initialize();
    }

    // Execute tool through MCP server
    const result = await this.server?.handleRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      },
      id: crypto.randomUUID()
    });

    // Update execution result
    await this.ctx.storage.sql
      .exec(`UPDATE tool_executions SET result = ? WHERE name = ? AND timestamp = (SELECT MAX(timestamp) FROM tool_executions WHERE name = ?)`)
      .bind(JSON.stringify(result), toolName, toolName)
      .run();
    
    return result;
  }

  private async initializeStorage() {
    // Create SQLite tables for session storage
    await this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        project_id TEXT,
        data TEXT,
        updated_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS tool_executions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        args TEXT,
        result TEXT,
        timestamp INTEGER
      );
    `);
  }


  private async handleMessage(request: Request): Response {
    if (!this.server) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Session not initialized',
        },
        id: null,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const body = await request.json();
      const response = await this.server.handleRequest(body);

      // If this is a notification, broadcast to all SSE connections
      if (response.notification) {
        await this.broadcastNotification(response.notification);
      }

      return new Response(JSON.stringify(response.result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'Internal error',
        },
        id: null,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  private async sendSSEEvent(writer: WritableStreamDefaultWriter, event: any) {
    const encoder = new TextEncoder();
    const data = event.event 
      ? `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`
      : `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  }

  private async broadcastNotification(notification: any): Promise<void> {
    // Send to all connected clients
    for (const [sessionId, writer] of this.connections) {
      try {
        await this.sendSSEEvent(writer, notification);
      } catch (error) {
        // Remove failed connections
        this.connections.delete(sessionId);
        // Clear heartbeat interval
        const interval = this.heartbeatIntervals.get(sessionId);
        if (interval) {
          clearInterval(interval);
          this.heartbeatIntervals.delete(sessionId);
        }
      }
    }
  }
}