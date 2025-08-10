# Devlog MCP Enhanced API Specification

## Overview

This specification defines the complete Model Context Protocol (MCP) API for Devlog, supporting all 11 block types with full metadata handling, advanced operations, and AI integration capabilities.

## API Endpoints Structure

### Base Configuration
```
Base URL: https://devlog.design/api/mcp
Protocol: MCP 2024-11-05
Authentication: Bearer token (API Key)
```

## Core MCP Tools

### 1. Document Management

#### create_document_advanced
Create a document with initial blocks and full metadata support.

```typescript
{
  name: 'create_document_advanced',
  description: 'Create a new document with optional initial blocks',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1 },
      tags: { 
        type: 'array', 
        items: { type: 'string' } 
      },
      folder_id: { type: 'string', format: 'uuid' },
      metadata: {
        type: 'object',
        properties: {
          isTemplate: { type: 'boolean' },
          preview: { type: 'string' },
          icon: { type: 'string' }
        }
      },
      blocks: {
        type: 'array',
        items: { $ref: '#/definitions/Block' }
      }
    },
    required: ['title']
  }
}
```

#### update_document
Update document metadata and properties.

```typescript
{
  name: 'update_document',
  description: 'Update document title, tags, or metadata',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      folder_id: { type: 'string', format: 'uuid' },
      metadata: { type: 'object' }
    },
    required: ['document_id']
  }
}
```

### 2. Block Operations

#### add_blocks_batch
Add multiple blocks with full type support.

```typescript
{
  name: 'add_blocks_batch',
  description: 'Add multiple blocks to a document',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      blocks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['text', 'code', 'ai', 'heading', 'filetree', 
                     'table', 'todo', 'image', 'inline-image', 
                     'version-track', 'issue-tracker']
            },
            content: { type: 'string' },
            position: { type: 'number' },
            metadata: { type: 'object' }
          },
          required: ['type', 'content']
        }
      }
    },
    required: ['document_id', 'blocks']
  }
}
```

#### update_block
Update a specific block's content or metadata.

```typescript
{
  name: 'update_block',
  description: 'Update block content, type, or metadata',
  inputSchema: {
    type: 'object',
    properties: {
      block_id: { type: 'string', format: 'uuid' },
      content: { type: 'string' },
      metadata: { type: 'object' },
      type: { type: 'string' }
    },
    required: ['block_id']
  }
}
```

### 3. AI-Specific Operations

#### capture_ai_conversation
Save a complete AI conversation with code extraction.

```typescript
{
  name: 'capture_ai_conversation',
  description: 'Capture AI conversation with full context',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      messages: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            role: { 
              type: 'string', 
              enum: ['user', 'assistant', 'system'] 
            },
            content: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            metadata: {
              type: 'object',
              properties: {
                model: { type: 'string' },
                tokens: { type: 'number' },
                cost: { type: 'number' }
              }
            }
          },
          required: ['role', 'content']
        }
      },
      context: { type: 'string' },
      summary: { type: 'string' },
      extracted_code: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string' },
            file_path: { type: 'string' }
          }
        }
      }
    },
    required: ['document_id', 'messages']
  }
}
```

### 4. Code Management

#### create_code_block
Create a code block with version tracking.

```typescript
{
  name: 'create_code_block',
  description: 'Create code block with syntax highlighting and versioning',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      code: { type: 'string' },
      language: { type: 'string' },
      file_path: { type: 'string' },
      version_of: { type: 'string', format: 'uuid' },
      metadata: {
        type: 'object',
        properties: {
          fileName: { type: 'string' },
          highlightLines: { 
            type: 'array', 
            items: { type: 'number' } 
          },
          showLineNumbers: { type: 'boolean' }
        }
      }
    },
    required: ['document_id', 'code', 'language']
  }
}
```

### 5. Table Operations

#### create_table_block
Create a dynamic table with headers and data.

```typescript
{
  name: 'create_table_block',
  description: 'Create a table block with dynamic data',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      caption: { type: 'string' },
      headers: {
        type: 'array',
        items: { type: 'string' }
      },
      rows: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      column_alignments: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['left', 'center', 'right']
        }
      }
    },
    required: ['document_id', 'headers', 'rows']
  }
}
```

### 6. Task Management

#### create_todo_block
Create a todo/task list block.

```typescript
{
  name: 'create_todo_block',
  description: 'Create a todo list with tasks',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            completed: { type: 'boolean', default: false },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high']
            },
            due_date: { type: 'string', format: 'date' },
            assignee: { type: 'string' }
          },
          required: ['text']
        }
      }
    },
    required: ['document_id', 'items']
  }
}
```

### 7. File Tree Operations

#### create_filetree_block
Create a visual file tree representation.

```typescript
{
  name: 'create_filetree_block',
  description: 'Create a file tree visualization',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      root_name: { type: 'string' },
      tree_data: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { 
            type: 'string', 
            enum: ['file', 'folder'] 
          },
          children: { type: 'array' },
          language: { type: 'string' },
          size: { type: 'number' }
        }
      },
      expanded_paths: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['document_id', 'tree_data']
  }
}
```

### 8. Image Management

#### add_image_gallery
Create an image gallery block.

```typescript
{
  name: 'add_image_gallery',
  description: 'Add multiple images as a gallery',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      caption: { type: 'string' },
      images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri' },
            caption: { type: 'string' },
            alt: { type: 'string' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          required: ['url', 'alt']
        }
      },
      layout: {
        type: 'string',
        enum: ['grid', 'carousel', 'masonry']
      }
    },
    required: ['document_id', 'images']
  }
}
```

### 9. Version Tracking

#### create_version_track
Track code evolution over time.

```typescript
{
  name: 'create_version_track',
  description: 'Create version tracking for code blocks',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      description: { type: 'string' },
      versions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            code_block_id: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            diff: {
              type: 'object',
              properties: {
                added: { type: 'number' },
                removed: { type: 'number' },
                changes: { type: 'string' }
              }
            }
          }
        }
      }
    },
    required: ['document_id']
  }
}
```

### 10. Issue Tracking

#### create_issue_tracker
Create an issue tracking block.

```typescript
{
  name: 'create_issue_tracker',
  description: 'Create issue tracking block',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: {
              type: 'string',
              enum: ['open', 'in-progress', 'resolved', 'closed']
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical']
            },
            labels: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['title', 'status']
        }
      }
    },
    required: ['document_id']
  }
}
```

### 11. Search and Discovery

#### search_blocks
Advanced search across all blocks.

```typescript
{
  name: 'search_blocks',
  description: 'Search blocks with filters',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      block_types: {
        type: 'array',
        items: { type: 'string' }
      },
      tags: {
        type: 'array',
        items: { type: 'string' }
      },
      date_range: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date' },
          end: { type: 'string', format: 'date' }
        }
      },
      limit: { type: 'number', default: 50 },
      offset: { type: 'number', default: 0 }
    },
    required: ['query']
  }
}
```

### 12. Bulk Operations

#### import_document
Import documents from various formats.

```typescript
{
  name: 'import_document',
  description: 'Import document from Markdown, JSON, or HTML',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['markdown', 'json', 'html', 'notion']
      },
      data: { type: 'string' },
      folder_id: { type: 'string', format: 'uuid' },
      tags: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['format', 'data']
  }
}
```

#### export_document
Export document in various formats.

```typescript
{
  name: 'export_document',
  description: 'Export document to different formats',
  inputSchema: {
    type: 'object',
    properties: {
      document_id: { type: 'string', format: 'uuid' },
      format: {
        type: 'string',
        enum: ['markdown', 'json', 'html', 'pdf']
      },
      include_metadata: { type: 'boolean', default: true }
    },
    required: ['document_id', 'format']
  }
}
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data specific to the operation
  },
  "metadata": {
    "timestamp": "2025-08-10T12:00:00Z",
    "request_id": "uuid",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error context
    }
  },
  "metadata": {
    "timestamp": "2025-08-10T12:00:00Z",
    "request_id": "uuid"
  }
}
```

## Rate Limiting

- Default: 100 requests per minute
- Bulk operations: 10 requests per minute
- Search operations: 50 requests per minute
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## WebSocket Support (Future)

```javascript
// Real-time document updates
ws://devlog.design/api/mcp/realtime

// Events
- document.updated
- block.added
- block.updated
- block.deleted
- collaborator.joined
- collaborator.left
```

## Implementation Notes

1. **Type Safety**: All block types must validate their metadata structure
2. **Atomicity**: Multi-block operations should be atomic
3. **Permissions**: Check user permissions for all operations
4. **Caching**: Implement client-side caching for read operations
5. **Compression**: Support gzip for large payloads
6. **Versioning**: API versioning via headers

## Migration from Current MCP

1. Map old block types to new schema:
   - `list` → `text` with bullet points
   - `checkbox` → `todo` with items
   - `ai_conversation` → `ai` with messages

2. Enhance metadata handling:
   - Support nested objects
   - Validate type-specific fields
   - Preserve unknown fields

3. Add missing operations:
   - Bulk block creation
   - Document organization
   - Advanced search
   - Import/export

This enhanced MCP API provides complete support for all Devlog features while maintaining backward compatibility and enabling future extensions.