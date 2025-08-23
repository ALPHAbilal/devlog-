# MCP Folder Operations Guide

## Overview
Devlog MCP now supports complete folder management capabilities, allowing AI assistants and applications to organize documents into hierarchical folder structures.

## Available Operations

### 1. Create Folder
Create new folders or subfolders in the workspace.

```javascript
mcp__devlog__create_folder({
  name: "Project Alpha",           // Required: Folder name
  parent_id: "uuid-here",          // Optional: Parent folder ID (null for root)
  color: "#3B82F6",               // Optional: Hex color (default: #6B7280)
  icon: "folder"                  // Optional: Icon name (default: folder)
})
```

**Response**: Returns folder ID of created folder

### 2. List Folders
List folders in the workspace with optional recursion.

```javascript
mcp__devlog__list_folders({
  parent_id: "uuid-here",         // Optional: List children of specific folder
  recursive: true                 // Optional: Get entire folder tree
})
```

**Response**: Array of folder objects with hierarchy information

### 3. Get Folder Contents
Get both folders and documents within a specific folder.

```javascript
mcp__devlog__get_folder_contents({
  folder_id: "uuid-here",         // Optional: Folder ID (null for root)
  include_subfolders: true        // Optional: Include subfolders in response
})
```

**Response**: Object containing:
- `folders`: Array of subfolder objects
- `documents`: Array of document objects
- `total_folders`: Count of subfolders
- `total_documents`: Count of documents

### 4. Move Document to Folder
Organize documents by moving them between folders.

```javascript
mcp__devlog__move_document_to_folder({
  document_id: "doc-uuid",        // Required: Document to move
  folder_id: "folder-uuid",       // Optional: Target folder (null for root)
  position: 0                     // Optional: Position in folder
})
```

**Response**: Confirmation of successful move

### 5. Delete Folder
Remove folders with optional recursive deletion.

```javascript
mcp__devlog__delete_folder({
  folder_id: "uuid-here",         // Required: Folder to delete
  recursive: false                // Optional: Delete all contents
})
```

**Response**: Confirmation of deletion

### 6. Update Folder
Modify folder properties including name, color, icon, and parent.

```javascript
mcp__devlog__update_folder({
  folder_id: "uuid-here",         // Required: Folder to update
  name: "New Name",               // Optional: New folder name
  color: "#EF4444",              // Optional: New color
  icon: "star",                  // Optional: New icon
  is_favorite: true,             // Optional: Mark as favorite
  parent_id: "new-parent-uuid"   // Optional: Move to different parent
})
```

**Response**: Confirmation of update

## Usage Examples

### Example 1: Creating a Project Structure
```javascript
// Create main project folder
const project = await mcp__devlog__create_folder({
  name: "My SaaS Project",
  color: "#8B5CF6",
  icon: "rocket"
});

// Create subfolders
await mcp__devlog__create_folder({
  name: "Documentation",
  parent_id: project.folder_id,
  icon: "book"
});

await mcp__devlog__create_folder({
  name: "Meeting Notes",
  parent_id: project.folder_id,
  icon: "calendar"
});

await mcp__devlog__create_folder({
  name: "Code Snippets",
  parent_id: project.folder_id,
  icon: "code"
});
```

### Example 2: Organizing Existing Documents
```javascript
// List all documents
const documents = await mcp__devlog__search_documents({ query: "" });

// Get or create target folder
const devFolder = await mcp__devlog__create_folder({
  name: "Development",
  icon: "code"
});

// Move development-related documents
for (const doc of documents) {
  if (doc.title.includes("API") || doc.title.includes("Code")) {
    await mcp__devlog__move_document_to_folder({
      document_id: doc.id,
      folder_id: devFolder.folder_id
    });
  }
}
```

### Example 3: Viewing Folder Structure
```javascript
// Get complete folder tree
const folders = await mcp__devlog__list_folders({
  recursive: true
});

// Display hierarchy
function displayTree(folders, parentId = null, indent = 0) {
  const children = folders.filter(f => f.parent_id === parentId);
  
  for (const folder of children) {
    console.log('  '.repeat(indent) + '📁 ' + folder.name);
    displayTree(folders, folder.id, indent + 1);
  }
}

displayTree(folders.folders);
```

## Database Schema

### Folders Table
- `id`: UUID primary key
- `user_id`: Owner of the folder
- `parent_id`: Parent folder (null for root folders)
- `name`: Folder name
- `color`: Hex color code
- `icon`: Icon identifier
- `is_expanded`: UI state
- `is_favorite`: Marked as favorite
- `position`: Sort order
- `path`: Materialized path for hierarchy
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Documents Table Extension
- `folder_id`: Foreign key to folders table (null for root documents)

## Authentication
All folder operations require API key authentication. The API key must be passed with each request and is validated against the `api_keys` table.

## Performance Considerations
- Folder operations use PostgreSQL functions for consistency
- Row Level Security (RLS) is bypassed for MCP operations
- Recursive operations are optimized using CTEs
- Path materialization enables fast hierarchy queries

## Error Handling
Common errors and their meanings:
- `Invalid or expired API key`: API key not found or expired
- `Parent folder not found`: Specified parent_id doesn't exist
- `Folder not empty`: Attempting to delete non-empty folder without recursive flag
- `Unique violation`: Folder with same name exists in parent

## Best Practices
1. **Organize by Project**: Create top-level folders for major projects
2. **Use Colors**: Assign meaningful colors to distinguish folder types
3. **Shallow Hierarchies**: Avoid deeply nested folders (max 3-4 levels)
4. **Consistent Naming**: Use clear, descriptive folder names
5. **Regular Cleanup**: Delete empty or obsolete folders periodically

## Testing
A test script is available at `/test-scripts/test-folder-operations.js`:

```bash
# Set your API key
export DEVLOG_API_KEY="your-api-key-here"

# Run tests
node test-scripts/test-folder-operations.js
```

The test script validates all 6 folder operations and provides detailed output.

## Migration Notes
- Existing documents without folders remain in root
- Folders support was added 2025-08-12
- 51+ folders already exist in production
- All operations are backward compatible