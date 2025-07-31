#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ApiClient } from './api-client.js';

class JourneyLogMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'journey-log-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiClient = null;
    this.setupHandlers();
  }

  setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler('initialize', async (request) => {
      const apiKey = process.env.JOURNEY_LOG_API_KEY;
      if (!apiKey) {
        throw new Error('JOURNEY_LOG_API_KEY environment variable is required');
      }

      this.apiClient = new ApiClient(apiKey);
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'journey-log-mcp',
          version: '1.0.0',
        },
      };
    });

    // Tools list handler
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'create_document',
            description: 'Create a new Journey Log document',
            inputSchema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Document title',
                },
                content: {
                  type: 'string',
                  description: 'Initial content (optional)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for categorization',
                },
              },
              required: ['title'],
            },
          },
          {
            name: 'add_block',
            description: 'Add a block to an existing document',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID',
                },
                type: {
                  type: 'string',
                  enum: ['text', 'code', 'heading', 'list', 'checkbox', 'ai_conversation'],
                  description: 'Block type',
                },
                content: {
                  type: 'string',
                  description: 'Block content',
                },
                metadata: {
                  type: 'object',
                  description: 'Additional metadata (e.g., language for code blocks)',
                },
              },
              required: ['document_id', 'type', 'content'],
            },
          },
          {
            name: 'capture_conversation',
            description: 'Capture AI conversation to a document',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID',
                },
                conversation: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', enum: ['user', 'assistant'] },
                      content: { type: 'string' },
                    },
                    required: ['role', 'content'],
                  },
                  description: 'Conversation messages',
                },
                context: {
                  type: 'string',
                  description: 'Optional context about the conversation',
                },
                summary: {
                  type: 'string',
                  description: 'Optional summary of the conversation',
                },
              },
              required: ['document_id', 'conversation'],
            },
          },
          {
            name: 'list_documents',
            description: 'List your Journey Log documents',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of documents to return (default: 50)',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Filter by tags',
                },
                search: {
                  type: 'string',
                  description: 'Search in document titles',
                },
              },
            },
          },
          {
            name: 'get_document',
            description: 'Get a specific document with its blocks',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID',
                },
              },
              required: ['document_id'],
            },
          },
        ],
      };
    });

    // Tool execution handler
    this.server.setRequestHandler('tools/call', async (request) => {
      if (!this.apiClient) {
        throw new Error('API client not initialized. Please set JOURNEY_LOG_API_KEY.');
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_document':
            return await this.handleCreateDocument(args);
          case 'add_block':
            return await this.handleAddBlock(args);
          case 'capture_conversation':
            return await this.handleCaptureConversation(args);
          case 'list_documents':
            return await this.handleListDocuments(args);
          case 'get_document':
            return await this.handleGetDocument(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async handleCreateDocument(args) {
    const result = await this.apiClient.createDocument(args);
    return {
      content: [
        {
          type: 'text',
          text: `Created document "${result.title}" successfully!\nURL: ${result.url}\nID: ${result.id}`,
        },
      ],
    };
  }

  async handleAddBlock(args) {
    const result = await this.apiClient.addBlock(args);
    return {
      content: [
        {
          type: 'text',
          text: result.message || `Added ${args.type} block to document`,
        },
      ],
    };
  }

  async handleCaptureConversation(args) {
    const result = await this.apiClient.captureConversation(args);
    return {
      content: [
        {
          type: 'text',
          text: result.message || `Captured conversation with ${args.conversation.length} messages`,
        },
      ],
    };
  }

  async handleListDocuments(args) {
    const result = await this.apiClient.listDocuments(args);
    const docs = result.documents.map(doc => 
      `• ${doc.title} (${doc.tags.join(', ')}) - Created: ${new Date(doc.created_at).toLocaleDateString()}`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${result.pagination.total} documents:\n${docs}`,
        },
      ],
    };
  }

  async handleGetDocument(args) {
    const result = await this.apiClient.getDocument(args.document_id);
    const blocks = result.blocks.map(block => 
      `[${block.type}] ${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `Document: ${result.document.title}\nTags: ${result.document.tags.join(', ')}\n\nBlocks:\n${blocks}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Journey Log MCP Server started');
  }
}

// Run the server
const server = new JourneyLogMCPServer();
server.run().catch(console.error);