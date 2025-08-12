import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import fetch from 'node-fetch';

class DevlogMCPBridge {
  constructor() {
    this.remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp.bilal-kosika.workers.dev';
    this.apiKey = process.env.DEVLOG_API_KEY;
    this.sessionId = null;
    this.localTransport = null;
    this.remoteClient = null;
  }

  async start() {
    console.error('Starting Devlog MCP Client...');
    
    try {
      // Create local transport for communication with AI assistant
      this.localTransport = new StdioClientTransport();
      
      // Connect to remote MCP server
      await this.connectToRemote();
      
      // Bridge messages between local and remote
      await this.bridgeMessages();
      
    } catch (error) {
      console.error('Failed to start MCP client:', error);
      process.exit(1);
    }
  }

  async connectToRemote() {
    // Create SSE connection to remote server
    const sseUrl = new URL('/sse', this.remoteUrl);
    
    // Initialize remote client
    this.remoteClient = new Client({
      name: 'devlog-mcp-client',
      version: '1.0.0',
    });

    // Create custom SSE transport with auth headers
    const transport = new SSEClientTransport(sseUrl, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    await this.remoteClient.connect(transport);
    
    // Get session ID from response
    this.sessionId = this.remoteClient.sessionId || crypto.randomUUID();
    
    console.error('Connected to remote MCP server');
  }

  async bridgeMessages() {
    // Handle incoming messages from AI assistant
    this.localTransport.onMessage = async (message) => {
      try {
        // Forward to remote server
        const response = await this.forwardToRemote(message);
        
        // Send response back to AI assistant
        await this.localTransport.send(response);
      } catch (error) {
        console.error('Error handling message:', error);
        await this.localTransport.send({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
          },
          id: message.id,
        });
      }
    };

    // Start listening
    await this.localTransport.start();
  }

  async forwardToRemote(message) {
    // Handle different message types
    switch (message.method) {
      case 'initialize':
        return this.handleInitialize(message);
      
      case 'tools/list':
        return this.handleToolsList(message);
      
      case 'tools/call':
        return this.handleToolCall(message);
      
      default:
        // Forward directly to remote
        return this.sendToRemote(message);
    }
  }

  async handleInitialize(message) {
    // Initialize with remote server
    const response = await this.sendToRemote(message);
    
    // Enhance response with local info
    return {
      ...response,
      result: {
        ...response.result,
        serverInfo: {
          name: 'devlog-mcp',
          version: '1.0.0',
          transport: 'remote',
          url: this.remoteUrl,
        },
      },
    };
  }

  async handleToolsList(message) {
    // Get tools from remote server
    return this.sendToRemote(message);
  }

  async handleToolCall(message) {
    // Execute tool on remote server
    return this.sendToRemote(message);
  }

  async sendToRemote(message) {
    const response = await fetch(new URL('/messages', this.remoteUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'MCP-Session-ID': this.sessionId,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Remote server error: ${response.status}`);
    }

    return response.json();
  }
}

// Start the bridge
const bridge = new DevlogMCPBridge();
bridge.start().catch(console.error);