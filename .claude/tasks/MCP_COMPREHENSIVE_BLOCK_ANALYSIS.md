# Comprehensive Block System Analysis for MCP Development

## Executive Summary

Devlog is a block-based documentation platform for developers with 11 distinct block types. The existing MCP implementation is basic and only supports 5 block types. This analysis provides deep insights into all block types, their data structures, and a plan for building a comprehensive MCP integration.

## Block System Architecture

### Core Block Structure

Every block in Devlog follows this base structure:

```javascript
{
  id: string,           // UUID
  type: string,         // Block type identifier
  content: string,      // Main content (meaning varies by type)
  position: number,     // Order in document
  document_id: string,  // Parent document UUID
  created_at: string,   // ISO timestamp
  updated_at: string,   // ISO timestamp
  deleted_at: null,     // Soft delete timestamp
  metadata: JSONB       // Type-specific data
}
```

### Complete Block Type Inventory

1. **text** - Markdown text with inline tags/images
2. **code** - Syntax-highlighted code with file paths
3. **ai** - AI conversation preservation
4. **heading** - Document structure (h1-h6)
5. **filetree** - Visual project structure
6. **table** - Dynamic tables with drag-and-drop
7. **todo** - Task lists with checkboxes
8. **image** - Multi-image galleries
9. **inline-image** - Images within text blocks
10. **version-track** - Version tracking for code evolution
11. **issue-tracker** - Issue/bug tracking system

## Detailed Block Type Analysis

### 1. Text Block
- **Purpose**: Rich text documentation with Markdown support
- **Content**: Markdown text
- **Metadata**: 
  ```javascript
  {
    tags: string[],     // Inline tags like #react #hooks
    links: string[],    // Extracted URLs
    mentions: string[]  // @mentions
  }
  ```
- **Special Features**: 
  - Inline tag extraction
  - Auto-linking
  - Markdown preview
  - Link to other documents

### 2. Code Block
- **Purpose**: Syntax-highlighted code snippets
- **Content**: Raw code text
- **Database Fields**:
  - `language`: Programming language
  - `file_path`: Associated file path
  - `version_of`: Parent version ID
- **Metadata**:
  ```javascript
  {
    language: string,
    filePath: string,
    versionOf: string,
    lineNumbers: boolean,
    highlightLines: number[],
    fileName: string
  }
  ```
- **Special Features**:
  - Syntax highlighting
  - Copy button
  - Version tracking
  - File association

### 3. AI Block
- **Purpose**: Preserve AI conversations with full context
- **Content**: Summary or title
- **Metadata**:
  ```javascript
  {
    messages: [{
      role: 'user' | 'assistant',
      content: string,
      timestamp: string,
      metadata: {
        model?: string,
        tokens?: number,
        cost?: number
      }
    }],
    context: string,
    summary: string,
    tags: string[],
    codeSnippets: [{
      language: string,
      code: string,
      description: string
    }]
  }
  ```
- **Special Features**:
  - Collapsible conversation view
  - Code extraction
  - Context preservation
  - Token/cost tracking

### 4. Heading Block
- **Purpose**: Document structure and navigation
- **Content**: Heading text
- **Metadata**:
  ```javascript
  {
    level: 1-6,        // h1 through h6
    anchor: string,    // URL anchor
    collapsed: boolean // For collapsible sections
  }
  ```
- **Special Features**:
  - Auto-generated anchors
  - Table of contents integration
  - Collapsible sections

### 5. FileTree Block
- **Purpose**: Visual project structure representation
- **Content**: Root folder name or description
- **Metadata**:
  ```javascript
  {
    treeData: {
      name: string,
      type: 'file' | 'folder',
      children?: TreeNode[],
      language?: string,
      size?: number,
      lastModified?: string
    },
    expandedPaths: string[],
    selectedPath: string,
    showHidden: boolean
  }
  ```
- **Special Features**:
  - Interactive tree view
  - File type icons
  - Expand/collapse state
  - Search within tree

### 6. Table Block
- **Purpose**: Dynamic data tables
- **Content**: Table caption or description
- **Metadata** (uses `data` property):
  ```javascript
  {
    headers: string[],
    rows: string[][],
    columnAlignments: ('left' | 'center' | 'right')[],
    sortColumn: number,
    sortDirection: 'asc' | 'desc',
    columnWidths: number[]
  }
  ```
- **Special Features**:
  - Drag-and-drop rows/columns
  - Sortable columns
  - Cell editing
  - Export to CSV

### 7. Todo Block
- **Purpose**: Task tracking and checklists
- **Content**: Todo list title
- **Metadata** (uses `data` property):
  ```javascript
  {
    items: [{
      id: string,
      text: string,
      completed: boolean,
      createdAt: string,
      completedAt?: string,
      priority?: 'low' | 'medium' | 'high',
      dueDate?: string,
      assignee?: string
    }],
    showCompleted: boolean,
    sortBy: 'creation' | 'priority' | 'dueDate'
  }
  ```
- **Special Features**:
  - Check/uncheck items
  - Progress tracking
  - Priority levels
  - Due dates

### 8. Image Block
- **Purpose**: Image galleries with multiple images
- **Content**: Gallery caption
- **Metadata**:
  ```javascript
  {
    images: [{
      id: string,
      url: string,
      thumbnailUrl?: string,
      caption: string,
      alt: string,
      width: number,
      height: number,
      size: number
    }],
    layout: 'grid' | 'carousel' | 'masonry',
    columns: number
  }
  ```
- **Special Features**:
  - Multiple image support
  - Lightbox view
  - Captions
  - Responsive layouts

### 9. Inline Image Block
- **Purpose**: Single images within text flow
- **Content**: Image URL
- **Metadata**:
  ```javascript
  {
    alt: string,
    caption: string,
    alignment: 'left' | 'center' | 'right',
    width: number | 'auto',
    link?: string
  }
  ```

### 10. Version Track Block
- **Purpose**: Track code evolution over time
- **Content**: Version description
- **Metadata** (uses `data` property):
  ```javascript
  {
    versions: [{
      id: string,
      timestamp: string,
      description: string,
      codeBlockId: string,
      diff?: {
        added: number,
        removed: number,
        changes: string
      }
    }],
    currentVersion: string,
    showDiff: boolean
  }
  ```

### 11. Issue Tracker Block
- **Purpose**: Bug and issue tracking
- **Content**: Tracker title
- **Metadata** (uses `data` property):
  ```javascript
  {
    issues: [{
      id: string,
      title: string,
      description: string,
      status: 'open' | 'in-progress' | 'resolved' | 'closed',
      priority: 'low' | 'medium' | 'high' | 'critical',
      assignee?: string,
      labels: string[],
      createdAt: string,
      updatedAt: string,
      resolvedAt?: string
    }],
    filter: {
      status?: string,
      priority?: string,
      assignee?: string
    }
  }
  ```

## Storage and Persistence

### Database Schema
- **documents** table: Metadata, title, tags, user_id
- **blocks** table: Content, type, metadata (JSONB), position
- **Soft deletes**: Via `deleted_at` timestamp
- **Atomic saves**: Via PostgreSQL function `save_document_blocks_v3`

### Transform Functions
The system uses two critical transform functions:

1. **extractBlockData()**: Prepares block for database storage
   - Separates core fields from metadata
   - Handles type-specific data structures
   - Preserves backward compatibility

2. **transformBlockFromDB()**: Reconstructs block from database
   - Restores type-specific properties
   - Handles `data` property for certain blocks
   - Maintains data integrity

## Current MCP Limitations

The existing MCP implementation only supports:
- text, code, heading, list, checkbox (not actual block types)
- No support for: ai, filetree, table, todo, image, inline-image, version-track, issue-tracker
- Limited metadata handling
- No bulk operations
- No document organization (folders)
- No sharing capabilities

## Enhanced MCP Requirements

### 1. Full Block Type Support
- All 11 block types with complete metadata
- Type-specific validation
- Rich data structures

### 2. Advanced Operations
```javascript
// Document operations
- createDocumentWithBlocks(document, blocks[])
- updateDocument(id, updates)
- deleteDocument(id)
- duplicateDocument(id)
- shareDocument(id, permissions)

// Block operations  
- addBlocks(documentId, blocks[])
- updateBlock(blockId, updates)
- deleteBlock(blockId)
- moveBlock(blockId, newPosition)
- convertBlockType(blockId, newType)

// Bulk operations
- importDocument(format, data)
- exportDocument(id, format)
- batchUpdate(operations[])

// Organization
- createFolder(name, parentId)
- moveToFolder(documentId, folderId)
- getTags()
- searchDocuments(query)
```

### 3. Real-time Features
- Document collaboration
- Change notifications
- Conflict resolution
- Auto-save status

### 4. AI Integration Features
- Smart block suggestions
- Content summarization
- Code explanation
- Documentation generation

## Implementation Plan

### Phase 1: Core Enhancement (Week 1)
1. Update MCP server to support all 11 block types
2. Implement complete metadata handling
3. Add validation for each block type
4. Create comprehensive test suite

### Phase 2: Advanced Features (Week 2)
1. Bulk operations
2. Document organization (folders)
3. Search and filtering
4. Import/export capabilities

### Phase 3: AI Features (Week 3)
1. Smart suggestions
2. Content generation
3. Code analysis
4. Documentation automation

### Phase 4: Real-time & Collaboration (Week 4)
1. WebSocket support
2. Collaborative editing
3. Change notifications
4. Conflict resolution

## Technical Considerations

### 1. Type Safety
```typescript
interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata: BlockMetadata[BlockType];
}

type BlockMetadata = {
  text: TextMetadata;
  code: CodeMetadata;
  ai: AIMetadata;
  // ... etc
}
```

### 2. Validation Schema
- Use JSON Schema for each block type
- Validate metadata structure
- Ensure data integrity

### 3. Performance
- Batch operations for bulk updates
- Efficient metadata queries
- Caching strategy
- Pagination for large documents

### 4. Security
- API key validation
- Rate limiting
- Input sanitization
- Permission checks

## MCP Tool Definitions

### Essential Tools for Complete Integration

```javascript
// Document Management
{
  name: 'create_document',
  description: 'Create a new document with initial blocks',
  inputSchema: {
    title: string,
    tags: string[],
    folder_id?: string,
    blocks?: Block[]
  }
}

// Block Operations
{
  name: 'add_blocks',
  description: 'Add multiple blocks to a document',
  inputSchema: {
    document_id: string,
    blocks: [{
      type: BlockType,
      content: string,
      metadata: object,
      position?: number
    }]
  }
}

// AI Block Specific
{
  name: 'save_ai_conversation',
  description: 'Save an AI conversation as a block',
  inputSchema: {
    document_id: string,
    messages: Message[],
    context?: string,
    summary?: string,
    extracted_code?: CodeSnippet[]
  }
}

// Search and Discovery
{
  name: 'search_blocks',
  description: 'Search across all blocks',
  inputSchema: {
    query: string,
    block_types?: BlockType[],
    tags?: string[],
    date_range?: DateRange
  }
}
```

## Conclusion

The Devlog block system is sophisticated and requires a comprehensive MCP implementation to fully leverage its capabilities. The current MCP is a minimal prototype that needs significant enhancement to support all block types and advanced features. This analysis provides the foundation for building a production-ready MCP that can handle all aspects of the Devlog platform.

## Next Steps

1. Review this analysis with the team
2. Prioritize features for MVP
3. Set up development environment
4. Begin Phase 1 implementation
5. Create API documentation
6. Develop client libraries