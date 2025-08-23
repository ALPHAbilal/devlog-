#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ApiClient } from './api-client.js';

class JourneyLogMCPServer {
  constructor() {
    const apiKey = process.env.JOURNEY_LOG_API_KEY;
    if (!apiKey) {
      throw new Error('JOURNEY_LOG_API_KEY environment variable is required');
    }
    
    this.apiClient = new ApiClient(apiKey);
    
    this.server = new Server(
      {
        name: 'journey-log-mcp',
        version: '1.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Tools list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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
                  enum: ['text', 'code', 'heading', 'ai', 'filetree', 'table', 'todo', 'image', 'inline-image', 'version-track', 'issue-tracker'],
                  description: 'Block type (all 11 types supported)',
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
                semantic_mode: {
                  type: 'boolean',
                  description: 'Return AI-optimized semantic snapshot (90% smaller)',
                },
              },
              required: ['document_id'],
            },
          },
          {
            name: 'analyze_filetree',
            description: 'Analyze project structure from filetree blocks',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID containing filetree blocks',
                },
              },
              required: ['document_id'],
            },
          },
          {
            name: 'manage_todos',
            description: 'Manage todo items within todo blocks',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID',
                },
                operation: {
                  type: 'string',
                  enum: ['list', 'complete', 'add', 'remove'],
                  description: 'Todo operation',
                },
                todo_text: {
                  type: 'string',
                  description: 'Todo item text (for add/complete/remove)',
                },
              },
              required: ['document_id', 'operation'],
            },
          },
          {
            name: 'track_versions',
            description: 'Track code versions and compare changes',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID',
                },
                version1: {
                  type: 'string',
                  description: 'First version identifier',
                },
                version2: {
                  type: 'string',
                  description: 'Second version identifier (optional)',
                },
              },
              required: ['document_id'],
            },
          },
          {
            name: 'create_folder',
            description: 'Create a new folder or subfolder',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Folder name',
                },
                parent_id: {
                  type: 'string',
                  description: 'Parent folder ID (optional for root folders)',
                },
                color: {
                  type: 'string',
                  description: 'Hex color code (default: #6B7280)',
                },
                icon: {
                  type: 'string',
                  description: 'Icon name (default: folder)',
                },
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
                parent_id: {
                  type: 'string',
                  description: 'Filter by parent folder ID',
                },
                include_documents: {
                  type: 'boolean',
                  description: 'Include document count for each folder',
                },
              },
            },
          },
          {
            name: 'get_folder_contents',
            description: 'Get documents in a specific folder',
            inputSchema: {
              type: 'object',
              properties: {
                folder_id: {
                  type: 'string',
                  description: 'Folder ID',
                },
                include_subfolders: {
                  type: 'boolean',
                  description: 'Include contents of subfolders',
                },
              },
              required: ['folder_id'],
            },
          },
          {
            name: 'move_document_to_folder',
            description: 'Move a document to a folder',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: {
                  type: 'string',
                  description: 'Document ID to move',
                },
                folder_id: {
                  type: 'string',
                  description: 'Target folder ID (null for root)',
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
                  description: 'Folder ID to delete',
                },
                recursive: {
                  type: 'boolean',
                  description: 'Delete all contents recursively',
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
                  description: 'Folder ID to update',
                },
                name: {
                  type: 'string',
                  description: 'New folder name',
                },
                color: {
                  type: 'string',
                  description: 'New hex color code',
                },
                icon: {
                  type: 'string',
                  description: 'New icon name',
                },
                is_favorite: {
                  type: 'boolean',
                  description: 'Mark as favorite',
                },
                parent_id: {
                  type: 'string',
                  description: 'Move to different parent folder',
                },
              },
              required: ['folder_id'],
            },
          },
        ],
      };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
          case 'analyze_filetree':
            return await this.handleAnalyzeFiletree(args);
          case 'manage_todos':
            return await this.handleManageTodos(args);
          case 'track_versions':
            return await this.handleTrackVersions(args);
          case 'create_folder':
            return await this.handleCreateFolder(args);
          case 'list_folders':
            return await this.handleListFolders(args);
          case 'get_folder_contents':
            return await this.handleGetFolderContents(args);
          case 'move_document_to_folder':
            return await this.handleMoveDocumentToFolder(args);
          case 'delete_folder':
            return await this.handleDeleteFolder(args);
          case 'update_folder':
            return await this.handleUpdateFolder(args);
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
    
    if (args.semantic_mode) {
      // Create semantic snapshot for AI optimization
      const snapshot = this.createSemanticSnapshot(result);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(snapshot, null, 2),
          },
        ],
      };
    }
    
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

  createSemanticSnapshot(documentData) {
    const { document, blocks } = documentData;
    
    // Extract structure
    const structure = {
      headings: blocks.filter(b => b.type === 'heading').map(h => ({
        level: h.metadata?.level || 1,
        text: h.content,
        id: h.id
      })),
      blockTypes: blocks.reduce((acc, b) => {
        acc[b.type] = (acc[b.type] || 0) + 1;
        return acc;
      }, {}),
      totalBlocks: blocks.length,
      lastModified: document.updated_at
    };
    
    // Extract key content
    const keyContent = {
      codeBlocks: blocks.filter(b => b.type === 'code').slice(0, 5).map(b => ({
        language: b.metadata?.language || 'plaintext',
        filename: b.metadata?.filename,
        preview: b.content.substring(0, 200) + '...'
      })),
      aiConversations: blocks.filter(b => b.type === 'ai').map(b => ({
        model: b.metadata?.model || 'unknown',
        messageCount: b.metadata?.messages?.length || 0
      })),
      todos: blocks.filter(b => b.type === 'todo').map(b => ({
        total: b.metadata?.items?.length || 0,
        completed: b.metadata?.items?.filter(i => i.completed).length || 0
      })),
      filetrees: blocks.filter(b => b.type === 'filetree').map(b => ({
        rootPath: b.metadata?.structure?.name || 'unknown',
        fileCount: this.countFiles(b.metadata?.structure)
      }))
    };
    
    return {
      document: {
        id: document.id,
        title: document.title,
        tags: document.tags,
        created: document.created_at,
        updated: document.updated_at
      },
      structure,
      keyContent,
      summary: {
        totalBlocks: blocks.length,
        hasCode: blocks.some(b => b.type === 'code'),
        hasAI: blocks.some(b => b.type === 'ai'),
        hasTodos: blocks.some(b => b.type === 'todo'),
        complexity: this.calculateComplexity(blocks)
      }
    };
  }

  countFiles(structure) {
    if (!structure) return 0;
    let count = structure.type === 'file' ? 1 : 0;
    if (structure.children) {
      count += structure.children.reduce((sum, child) => sum + this.countFiles(child), 0);
    }
    return count;
  }

  calculateComplexity(blocks) {
    const weights = {
      text: 1,
      heading: 1,
      code: 3,
      ai: 4,
      filetree: 2,
      table: 2,
      todo: 2,
      image: 1,
      'inline-image': 1,
      'version-track': 3,
      'issue-tracker': 3
    };
    
    const score = blocks.reduce((sum, block) => sum + (weights[block.type] || 1), 0);
    return Math.min(score / blocks.length, 5); // Normalize to 1-5 scale
  }

  async handleAnalyzeFiletree(args) {
    const result = await this.apiClient.getDocument(args.document_id);
    const filetreeBlocks = result.blocks.filter(b => b.type === 'filetree');
    
    if (filetreeBlocks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No filetree blocks found in this document.'
        }]
      };
    }
    
    const analysis = filetreeBlocks.map(block => {
      const structure = block.metadata?.structure;
      return {
        blockId: block.id,
        rootPath: structure?.name || 'unknown',
        totalFiles: this.countFiles(structure),
        selectedFile: block.metadata?.selectedFile,
        depth: this.calculateDepth(structure)
      };
    });
    
    return {
      content: [{
        type: 'text',
        text: `Filetree Analysis:\n${JSON.stringify(analysis, null, 2)}`
      }]
    };
  }

  calculateDepth(structure, currentDepth = 0) {
    if (!structure || !structure.children || structure.children.length === 0) {
      return currentDepth;
    }
    return Math.max(...structure.children.map(child => 
      this.calculateDepth(child, currentDepth + 1)
    ));
  }

  async handleManageTodos(args) {
    const result = await this.apiClient.getDocument(args.document_id);
    const todoBlocks = result.blocks.filter(b => b.type === 'todo');
    
    if (todoBlocks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No todo blocks found in this document.'
        }]
      };
    }
    
    switch (args.operation) {
      case 'list':
        const todos = todoBlocks.flatMap(block => 
          (block.metadata?.items || []).map(item => ({
            blockId: block.id,
            text: item.text,
            completed: item.completed
          }))
        );
        return {
          content: [{
            type: 'text',
            text: `Todos:\n${todos.map(t => 
              `${t.completed ? '✓' : '○'} ${t.text}`
            ).join('\n')}`
          }]
        };
      
      default:
        return {
          content: [{
            type: 'text',
            text: `Operation '${args.operation}' not yet implemented for todos.`
          }]
        };
    }
  }

  async handleTrackVersions(args) {
    const result = await this.apiClient.getDocument(args.document_id);
    const versionBlocks = result.blocks.filter(b => b.type === 'version-track');
    
    if (versionBlocks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No version tracking blocks found in this document.'
        }]
      };
    }
    
    const versions = versionBlocks.map(block => ({
      blockId: block.id,
      versions: block.metadata?.versions || [],
      currentVersion: block.metadata?.current
    }));
    
    return {
      content: [{
        type: 'text',
        text: `Version Tracking:\n${JSON.stringify(versions, null, 2)}`
      }]
    };
  }

  async handleCreateFolder(args) {
    const result = await this.apiClient.createFolder(args);
    return {
      content: [{
        type: 'text',
        text: `Created folder "${result.name}" successfully!\nID: ${result.id}`
      }]
    };
  }

  async handleListFolders(args) {
    const folders = await this.apiClient.listFolders(args);
    return {
      content: [{
        type: 'text',
        text: `Found ${folders.length} folders:\n${folders.map(f => 
          `- ${f.name} (${f.id})${f.parent_id ? ' [subfolder]' : ''}`
        ).join('\n')}`
      }]
    };
  }

  async handleGetFolderContents(args) {
    const contents = await this.apiClient.getFolderContents(args);
    return {
      content: [{
        type: 'text',
        text: `Folder contents (${contents.documents?.length || 0} documents, ${contents.subfolders?.length || 0} subfolders):\n` +
          `Documents:\n${(contents.documents || []).map(d => `- ${d.title}`).join('\n')}\n` +
          `Subfolders:\n${(contents.subfolders || []).map(f => `- ${f.name}`).join('\n')}`
      }]
    };
  }

  async handleMoveDocumentToFolder(args) {
    const result = await this.apiClient.moveDocumentToFolder(args);
    return {
      content: [{
        type: 'text',
        text: `Moved document to ${args.folder_id ? 'folder' : 'root'} successfully!`
      }]
    };
  }

  async handleDeleteFolder(args) {
    const result = await this.apiClient.deleteFolder(args);
    return {
      content: [{
        type: 'text',
        text: `Deleted folder successfully!`
      }]
    };
  }

  async handleUpdateFolder(args) {
    const result = await this.apiClient.updateFolder(args);
    return {
      content: [{
        type: 'text',
        text: `Updated folder successfully!`
      }]
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