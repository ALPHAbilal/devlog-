# Devlog MCP: Sophisticated Block-Type-Aware Editing System

## Overview
Revolutionary **type-aware editing system** where each block type has custom, powerful capabilities for granular content manipulation. Version 2.0.0 brings surgical precision to block editing.

## The Problem It Solves
**Before**: To fix a typo in one cell of a table, you had to reconstruct the entire table structure.
**After**: `edit_table_cell(row: 5, column: 3, value: "Fixed!")` - Done!

## New Sophisticated Tools (v2.0.0)

### 1. 🎯 **smart_edit_block**
Universal intelligent content editor with powerful operations.

**Operations**:
- `replace` - Regex-based find and replace
- `replace_all` - Simple string replacement
- `append` - Add content at end
- `prepend` - Add content at beginning
- `insert_at` - Insert at specific position
- `delete_range` - Remove content between positions

**Example**:
```javascript
// Replace all occurrences of "brown fox" with "red fox"
{
  tool: "smart_edit_block",
  block_id: "abc-123",
  operation: "replace_all",
  params: {
    find: "brown fox",
    replace: "red fox"
  }
}
```

### 2. ✍️ **edit_text_block**
Specialized markdown and text formatting operations.

**Operations**:
- `format_bold` - Make text bold
- `format_italic` - Make text italic
- `add_link` - Convert text to link
- `add_tag` - Add hashtag
- `extract_tags` - Extract all tags to metadata
- `add_quote` - Add blockquote
- `add_list_item` - Add bullet point

**Example**:
```javascript
// Add a link to specific text
{
  tool: "edit_text_block",
  block_id: "text-456",
  operation: "add_link",
  params: {
    text: "Devlog documentation",
    url: "https://devlog.dev/docs"
  }
}
// Result: [Devlog documentation](https://devlog.dev/docs)
```

### 3. 💻 **edit_code_block**
Advanced code manipulation with syntax awareness.

**Operations**:
- `insert_line` - Add line at specific position
- `delete_line` - Remove specific line
- `replace_function` - Replace entire function
- `add_import` - Add import statement
- `rename_variable` - Rename all occurrences
- `add_comment` - Add comment at line
- `update_metadata` - Update language/file path

**Example**:
```javascript
// Add a comment before line 42
{
  tool: "edit_code_block",
  block_id: "code-789",
  operation: "add_comment",
  params: {
    line_number: 42,
    comment: "TODO: Optimize this loop"
  }
}

// Rename variable throughout code
{
  tool: "edit_code_block",
  block_id: "code-789",
  operation: "rename_variable",
  params: {
    old_name: "temp",
    new_name: "temperature"
  }
}
```

### 4. 📊 **edit_table_cell**
Direct cell-level table editing.

**Features**:
- Edit any cell by row/column index
- Preserves table structure
- No need to reconstruct entire table

**Example**:
```javascript
// Update cell at row 2, column 3
{
  tool: "edit_table_cell",
  block_id: "table-111",
  row: 2,
  column: 3,
  value: "Updated Value"
}
```

### 5. ✅ **toggle_todo_items**
Batch todo status management.

**Features**:
- Toggle multiple items at once
- Preserves other todo properties
- Automatic progress calculation

**Example**:
```javascript
// Mark multiple todos as done
{
  tool: "toggle_todo_items",
  block_id: "todo-222",
  todo_ids: ["task-1", "task-2", "task-3"]
}
```

### 6. 💬 **edit_ai_message**
Modify AI conversation messages.

**Features**:
- Edit message by index
- Preserves conversation structure
- Maintains role assignments

**Example**:
```javascript
// Edit the 3rd message in conversation
{
  tool: "edit_ai_message",
  block_id: "ai-333",
  index: 2,
  content: "Updated response with correct information"
}
```

### 7. 🔄 **transform_block_type**
Intelligently convert between block types.

**Transformations**:
- `text → code`: Preserves content, adds syntax
- `code → text`: Adds code fences
- `text → todo`: Each line becomes a task
- `todo → text`: Converts to checkbox list
- And more...

**Example**:
```javascript
// Convert text block to code block
{
  tool: "transform_block_type",
  block_id: "block-444",
  new_type: "code",
  options: {
    language: "javascript"
  }
}
```

## Block-Type-Specific Capabilities

### Text Blocks
```javascript
// Before: Manual markdown formatting
content = content.replace("important", "**important**");

// After: Smart formatting
edit_text_block({
  block_id: "text-123",
  operation: "format_bold",
  params: { text: "important" }
})
```

### Code Blocks
```javascript
// Before: Parse entire code, find line, reconstruct
const lines = code.split('\n');
lines[41] = '// TODO: Optimize\n' + lines[41];
code = lines.join('\n');

// After: Direct line operation
edit_code_block({
  block_id: "code-456",
  operation: "add_comment",
  params: {
    line_number: 42,
    comment: "TODO: Optimize"
  }
})
```

### Table Blocks
```javascript
// Before: Parse table, find cell, rebuild structure
const table = parseTable(content);
table.rows[2][3] = "New Value";
content = buildTable(table);

// After: Direct cell edit
edit_table_cell({
  block_id: "table-789",
  row: 2,
  column: 3,
  value: "New Value"
})
```

### Todo Blocks
```javascript
// Before: Parse todos, find items, update, rebuild
const todos = JSON.parse(metadata.todos);
todos.forEach(todo => {
  if (ids.includes(todo.id)) {
    todo.status = 'done';
  }
});

// After: Batch toggle
toggle_todo_items({
  block_id: "todo-000",
  todo_ids: ["id1", "id2", "id3"]
})
```

## Real-World Scenarios

### Scenario 1: Fix Code Typo
**Task**: Fix variable name typo in 500-line code block

**Before**:
1. Load entire code block
2. Find/replace all occurrences
3. Hope you don't break syntax
4. Replace entire block

**After**:
```javascript
edit_code_block({
  block_id: "code-abc",
  operation: "rename_variable",
  params: {
    old_name: "calcualte",
    new_name: "calculate"
  }
})
```

### Scenario 2: Update Meeting Notes
**Task**: Bold important action items in text

**Before**:
1. Parse markdown
2. Find text
3. Add ** markers
4. Validate markdown
5. Save entire content

**After**:
```javascript
edit_text_block({
  block_id: "notes-def",
  operation: "format_bold",
  params: { text: "Action: Follow up with client" }
})
```

### Scenario 3: Update Project Status
**Task**: Update status in row 15 of project table

**Before**:
1. Parse table structure
2. Navigate to row 15
3. Find status column
4. Update value
5. Rebuild table
6. Save everything

**After**:
```javascript
edit_table_cell({
  block_id: "project-table",
  row: 15,
  column: 2,
  value: "Completed"
})
```

## Advanced Operations

### Smart Content Replacement
```javascript
// Replace with regex patterns
smart_edit_block({
  block_id: "any-block",
  operation: "replace",
  params: {
    find: "\\b(\\w+)@example\\.com\\b",
    replace: "$1@company.com",
    flags: "gi"
  }
})
```

### Code Refactoring
```javascript
// Replace entire function implementation
edit_code_block({
  block_id: "code-123",
  operation: "replace_function",
  params: {
    function_name: "calculateTotal",
    new_implementation: `function calculateTotal(items) {
      return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }`
  }
})
```

### Dynamic Table Operations
```javascript
// Add new column (future enhancement)
edit_table_block({
  block_id: "table-456",
  operation: "add_column",
  params: {
    header: "Status",
    position: 3
  }
})

// Sort by column
edit_table_block({
  block_id: "table-456",
  operation: "sort_by_column",
  params: {
    column: 2,
    order: "asc"
  }
})
```

## Type Transformation Magic

### Text to Code
```javascript
transform_block_type({
  block_id: "text-block",
  new_type: "code",
  options: { language: "python" }
})
// Preserves content, adds syntax highlighting
```

### Todo to Text
```javascript
transform_block_type({
  block_id: "todo-block",
  new_type: "text"
})
// Converts to markdown checklist:
// - [x] Completed task
// - [ ] Pending task
```

### Code to Text
```javascript
transform_block_type({
  block_id: "code-block",
  new_type: "text"
})
// Wraps in markdown code fence:
// ```javascript
// [original code]
// ```
```

## SQL Functions Architecture

Each block type has its own specialized SQL function:

1. **mcp_smart_edit_block** - Base intelligent editor
2. **mcp_edit_text_block** - Markdown operations
3. **mcp_edit_code_block** - Code manipulation
4. **mcp_edit_table_block** - Table operations
5. **mcp_edit_todo_block** - Task management
6. **mcp_edit_ai_block** - Conversation editing
7. **mcp_transform_block_type** - Type conversion

All functions:
- Validate API keys
- Check ownership
- Preserve metadata
- Handle errors gracefully
- Return operation results

## Version Summary

**Version**: 1.2.0 → 2.0.0 (Major release!)
**Previous Tools**: 18
**New Tools**: 25 (Added 7 sophisticated editing tools)
**Capability**: Type-aware, granular block editing

## Benefits

### For Users
- ✅ Fix typos without fear
- ✅ Edit tables cell-by-cell
- ✅ Refactor code intelligently
- ✅ Transform content between types
- ✅ Batch operations on todos

### For AI Assistants
- ✅ Surgical precision in edits
- ✅ Type-safe operations
- ✅ No more full block replacements
- ✅ Context-aware editing
- ✅ Smart content transformation

## Testing Examples

### Test Text Formatting
```javascript
// Create text block
create_document({
  title: "Test Text",
  blocks: [{
    type: "text",
    content: "This is important information"
  }]
})

// Make "important" bold
edit_text_block({
  block_id: "[block-id]",
  operation: "format_bold",
  params: { text: "important" }
})
```

### Test Code Editing
```javascript
// Add comment to line 5
edit_code_block({
  block_id: "[code-block-id]",
  operation: "add_comment",
  params: {
    line_number: 5,
    comment: "This function needs optimization"
  }
})
```

### Test Table Cell
```javascript
// Update specific cell
edit_table_cell({
  block_id: "[table-block-id]",
  row: 1,
  column: 2,
  value: "New Status"
})
```

## Deployment Steps

1. **Deploy SQL Functions**
```bash
# Execute the SQL file in Supabase
psql -f sql/smart_block_editing.sql
```

2. **Deploy Remote Server**
```bash
cd devlog-mcp-remote
npm run deploy
```

3. **Publish Client**
```bash
cd devlog-mcp-client
npm publish  # v2.0.0
```

4. **Users Update**
```bash
npm update devlog-mcp
claude mcp reconnect
```

## Conclusion

This sophisticated block editing system transforms Devlog MCP from a simple document editor to a **powerful, type-aware content manipulation platform**. Each block type now has its own specialized capabilities, making editing precise, safe, and intelligent.

**The future of content editing is here - and it's block-type-aware!** 🚀