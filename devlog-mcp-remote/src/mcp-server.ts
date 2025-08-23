import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SupabaseClient } from './supabase-client';
import { createSemanticSnapshot } from './semantic-snapshot';

export class DevlogMCPServer {
  private server: Server;
  private supabase: SupabaseClient;
  private userId: string;
  private projectId: string;
  private env: any;

  constructor(env: any, userId: string, projectId: string) {
    this.env = env;
    this.userId = userId;
    this.projectId = projectId;
    this.supabase = new SupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, userId);

    this.server = new Server(
      {
        name: 'devlog-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: false,
          prompts: false,
        },
      }
    );

    this.setupHandlers();
  }

  async initialize(): Promise<void> {
    // Any initialization logic
  }

  private setupHandlers(): void {
    // Tools list handler
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'create_document',
            description: 'Create a new Devlog document',
            inputSchema: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Document title' },
                content: { type: 'string', description: 'Initial content' },
                tags: { type: 'array', items: { type: 'string' } },
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
                document_id: { type: 'string' },
                type: {
                  type: 'string',
                  enum: ['text', 'code', 'heading', 'ai', 'filetree', 'table', 'todo', 'image', 'inline-image', 'version-track', 'issue-tracker'],
                },
                content: { type: 'string' },
                metadata: { type: 'object' },
              },
              required: ['document_id', 'type', 'content'],
            },
          },
          {
            name: 'get_document',
            description: 'Get a document with optional semantic snapshot',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'string' },
                semantic_mode: { type: 'boolean', description: 'Return AI-optimized snapshot' },
              },
              required: ['document_id'],
            },
          },
          {
            name: 'list_documents',
            description: 'List documents with filtering',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', default: 50 },
                tags: { type: 'array', items: { type: 'string' } },
                search: { type: 'string' },
              },
            },
          },
          {
            name: 'analyze_filetree',
            description: 'Analyze project structure from filetree blocks',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'string' },
              },
              required: ['document_id'],
            },
          },
          {
            name: 'manage_todos',
            description: 'Manage todo items',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'string' },
                operation: { type: 'string', enum: ['list', 'complete', 'add', 'remove'] },
                todo_text: { type: 'string' },
              },
              required: ['document_id', 'operation'],
            },
          },
          {
            name: 'capture_conversation',
            description: 'Capture AI conversation to a document',
            inputSchema: {
              type: 'object',
              properties: {
                document_id: { type: 'string' },
                conversation: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', enum: ['user', 'assistant'] },
                      content: { type: 'string' },
                    },
                  },
                },
                context: { type: 'string' },
                summary: { type: 'string' },
              },
              required: ['document_id', 'conversation'],
            },
          },
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
        ],
      };
    });

    // Tool execution handler
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_document':
            return await this.handleCreateDocument(args);
          case 'add_block':
            return await this.handleAddBlock(args);
          case 'get_document':
            return await this.handleGetDocument(args);
          case 'list_documents':
            return await this.handleListDocuments(args);
          case 'analyze_filetree':
            return await this.handleAnalyzeFiletree(args);
          case 'manage_todos':
            return await this.handleManageTodos(args);
          case 'capture_conversation':
            return await this.handleCaptureConversation(args);
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
      } catch (error: any) {
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

  async handleRequest(request: any): Promise<any> {
    // This will be called by the transport layer
    return this.server.handleRequest(request);
  }

  private async handleCreateDocument(args: any): Promise<any> {
    const result = await this.supabase.createDocument(args);
    return {
      content: [
        {
          type: 'text',
          text: `Created document "${result.title}" successfully!\nID: ${result.id}`,
        },
      ],
    };
  }

  private async handleAddBlock(args: any): Promise<any> {
    const result = await this.supabase.addBlock(args);
    return {
      content: [
        {
          type: 'text',
          text: `Added ${args.type} block to document`,
        },
      ],
    };
  }

  private async handleGetDocument(args: any): Promise<any> {
    const cacheKey = `doc:${args.document_id}:${args.semantic_mode ? 'semantic' : 'full'}`;
    
    // Try cache first
    const cached = await this.env.CACHE.get(cacheKey);
    if (cached) {
      return {
        content: [
          {
            type: 'text',
            text: cached,
          },
        ],
      };
    }

    const result = await this.supabase.getDocument(args.document_id);
    
    let responseText: string;
    if (args.semantic_mode) {
      const snapshot = createSemanticSnapshot(result);
      responseText = JSON.stringify(snapshot, null, 2);
    } else {
      const blocks = result.blocks.map((block: any) => 
        `[${block.type}] ${block.content.substring(0, 100)}${block.content.length > 100 ? '...' : ''}`
      ).join('\n');
      responseText = `Document: ${result.document.title}\nTags: ${result.document.tags.join(', ')}\n\nBlocks:\n${blocks}`;
    }

    // Cache the result
    await this.env.CACHE.put(cacheKey, responseText, {
      expirationTtl: 300, // 5 minutes
    });

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  private async handleListDocuments(args: any): Promise<any> {
    const result = await this.supabase.listDocuments(args);
    const docs = result.documents.map((doc: any) => 
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

  private async handleAnalyzeFiletree(args: any): Promise<any> {
    const result = await this.supabase.getDocument(args.document_id);
    const filetreeBlocks = result.blocks.filter((b: any) => b.type === 'filetree');
    
    if (filetreeBlocks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No filetree blocks found in this document.',
        }],
      };
    }
    
    const analysis = filetreeBlocks.map((block: any) => {
      const structure = block.metadata?.structure;
      return {
        blockId: block.id,
        rootPath: structure?.name || 'unknown',
        totalFiles: this.countFiles(structure),
        selectedFile: block.metadata?.selectedFile,
        depth: this.calculateDepth(structure),
      };
    });
    
    return {
      content: [{
        type: 'text',
        text: `Filetree Analysis:\n${JSON.stringify(analysis, null, 2)}`,
      }],
    };
  }

  private async handleManageTodos(args: any): Promise<any> {
    const result = await this.supabase.getDocument(args.document_id);
    const todoBlocks = result.blocks.filter((b: any) => b.type === 'todo');
    
    if (todoBlocks.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No todo blocks found in this document.',
        }],
      };
    }
    
    switch (args.operation) {
      case 'list':
        const todos = todoBlocks.flatMap((block: any) => 
          (block.metadata?.items || []).map((item: any) => ({
            blockId: block.id,
            text: item.text,
            completed: item.completed,
          }))
        );
        return {
          content: [{
            type: 'text',
            text: `Todos:\n${todos.map((t: any) => 
              `${t.completed ? '✓' : '○'} ${t.text}`
            ).join('\n')}`,
          }],
        };
      
      default:
        return {
          content: [{
            type: 'text',
            text: `Operation '${args.operation}' not yet implemented for todos.`,
          }],
        };
    }
  }

  private async handleCaptureConversation(args: any): Promise<any> {
    // Create an AI block with the conversation
    const aiBlock = {
      document_id: args.document_id,
      type: 'ai',
      content: args.summary || 'AI Conversation',
      metadata: {
        messages: args.conversation,
        context: args.context,
        model: 'claude',
      },
    };

    await this.supabase.addBlock(aiBlock);

    return {
      content: [
        {
          type: 'text',
          text: `Captured conversation with ${args.conversation.length} messages`,
        },
      ],
    };
  }

  private countFiles(structure: any): number {
    if (!structure) return 0;
    let count = structure.type === 'file' ? 1 : 0;
    if (structure.children) {
      count += structure.children.reduce((sum: number, child: any) => sum + this.countFiles(child), 0);
    }
    return count;
  }

  private calculateDepth(structure: any, currentDepth = 0): number {
    if (!structure || !structure.children || structure.children.length === 0) {
      return currentDepth;
    }
    return Math.max(...structure.children.map((child: any) => 
      this.calculateDepth(child, currentDepth + 1)
    ));
  }

  // Folder operation handlers
  private async handleCreateFolder(args: any): Promise<any> {
    // Import executeToolCommand to handle the actual API call
    const { executeToolCommand } = await import('./tools');
    
    // Get API key from the request context (this would need to be passed in)
    // For now, we'll delegate to the tools.ts implementation
    const results = await executeToolCommand(
      'create_folder',
      args,
      this.env,
      this.userId,
      this.projectId,
      // API key should be passed through the request context
      (this as any).apiKey
    );
    
    return {
      content: results,
    };
  }

  private async handleListFolders(args: any): Promise<any> {
    const result = await this.supabase.listFolders(args);
    
    if (!result.folders || result.folders.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No folders found.',
          },
        ],
      };
    }

    const formatFolder = (folder: any, indent: number = 0): string => {
      const prefix = '  '.repeat(indent) + (indent > 0 ? '└─ ' : '');
      return `${prefix}📁 ${folder.name} (${folder.id.substring(0, 8)}...)`;
    };

    let output = 'Folder Structure:\n';
    if (args.recursive) {
      // Build tree structure
      const folderMap = new Map(result.folders.map((f: any) => [f.id, f]));
      const rootFolders = result.folders.filter((f: any) => !f.parent_id);
      
      const renderTree = (folderId: string, depth: number = 0): string => {
        const folder = folderMap.get(folderId);
        if (!folder) return '';
        
        let text = formatFolder(folder, depth) + '\n';
        const children = result.folders.filter((f: any) => f.parent_id === folderId);
        children.forEach((child: any) => {
          text += renderTree(child.id, depth + 1);
        });
        return text;
      };

      rootFolders.forEach((folder: any) => {
        output += renderTree(folder.id);
      });
    } else {
      result.folders.forEach((folder: any) => {
        output += formatFolder(folder) + '\n';
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  private async handleGetFolderContents(args: any): Promise<any> {
    const result = await this.supabase.getFolderContents(args);
    
    let output = args.folder_id ? `Contents of folder ${args.folder_id}:\n` : 'Root folder contents:\n';
    output += '\n';

    if (result.folders && result.folders.length > 0) {
      output += 'Subfolders:\n';
      result.folders.forEach((folder: any) => {
        output += `  📁 ${folder.name}\n`;
      });
      output += '\n';
    }

    if (result.documents && result.documents.length > 0) {
      output += 'Documents:\n';
      result.documents.forEach((doc: any) => {
        output += `  📄 ${doc.title}`;
        if (doc.tags && doc.tags.length > 0) {
          output += ` [${doc.tags.join(', ')}]`;
        }
        output += '\n';
      });
    }

    output += `\nTotal: ${result.total_folders || 0} folders, ${result.total_documents || 0} documents`;

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  private async handleMoveDocumentToFolder(args: any): Promise<any> {
    const result = await this.supabase.moveDocumentToFolder(args);
    
    const folderText = args.folder_id ? `folder ${args.folder_id}` : 'root folder';
    return {
      content: [
        {
          type: 'text',
          text: `Successfully moved document ${args.document_id} to ${folderText}`,
        },
      ],
    };
  }

  private async handleDeleteFolder(args: any): Promise<any> {
    const result = await this.supabase.deleteFolder(args);
    return {
      content: [
        {
          type: 'text',
          text: `Successfully deleted folder ${args.folder_id}`,
        },
      ],
    };
  }

  private async handleUpdateFolder(args: any): Promise<any> {
    const result = await this.supabase.updateFolder(args);
    
    const updates = [];
    if (args.name) updates.push(`name: "${args.name}"`);
    if (args.color) updates.push(`color: ${args.color}`);
    if (args.icon) updates.push(`icon: ${args.icon}`);
    if (args.is_favorite !== undefined) updates.push(`favorite: ${args.is_favorite}`);
    if (args.parent_id !== undefined) updates.push(`moved to parent: ${args.parent_id || 'root'}`);

    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated folder ${args.folder_id}\nChanges: ${updates.join(', ')}`,
        },
      ],
    };
  }
}