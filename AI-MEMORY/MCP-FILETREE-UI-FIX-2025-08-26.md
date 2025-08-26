# MCP Filetree UI Display Fix - 2025-08-26

## Problem
Filetree blocks created via MCP were appearing empty in the DevLog UI, even after fixing the MCP server serialization.

## Root Cause
The database stored filetree blocks in a direct tree format:
```json
{
  "name": "AI-MEMORY",
  "type": "folder", 
  "children": [...]
}
```

But `blockSerializer.js` expected a wrapped format:
```json
{
  "treeData": [...],
  "expanded": {}
}
```

## Solution Implemented

### Frontend Fix in `/workspace/devlog-/src/utils/blockSerializer.js`

Modified the `deserializeBlock` function for filetree case (lines 315-344):

```javascript
case 'filetree':
  if (block.content) {
    const parsed = typeof block.content === 'string' 
      ? JSON.parse(block.content) 
      : block.content;
    
    // Handle both formats:
    if (parsed.treeData !== undefined) {
      // Proper format with treeData property ✅
      deserialized.treeData = parsed.treeData || [];
      deserialized.expanded = parsed.expanded || {};
    } else if (parsed.name && parsed.type) {
      // Direct tree object - wrap it in an array ✅
      deserialized.treeData = [parsed];
      deserialized.expanded = {};
    }
  }
```

## Key Features

### 1. Backward Compatible
- Reads both old (direct) and new (wrapped) formats
- No database migration needed
- Existing blocks display correctly

### 2. Preserves File Content
- File nodes with `content` property are preserved
- The fix wraps the entire object, keeping all properties:
  ```javascript
  // Before: {name: "file.js", type: "file", content: "code here"}
  // After:  [{name: "file.js", type: "file", content: "code here"}]
  ```

### 3. Self-Healing Database
- On read: Converts malformed blocks for UI display
- On save: Writes back in proper format
- Database gradually cleans itself up

## Testing Confirmed
✅ "AI-memory bilal 101" document now displays filetree correctly
✅ File content is preserved and editable
✅ No data loss or database corruption
✅ Both old and new formats work

## Related Files
- `/workspace/devlog-/src/utils/blockSerializer.js` - Frontend deserialization fix
- `/workspace/devlog-/devlog-mcp-remote/src/tools.ts` - MCP serialization fix (already deployed)
- `/workspace/devlog-/src/components/blocks/FileTreeBlock.jsx` - UI component that expects array format

## Deployment Status
- Frontend fix: Applied locally, needs deployment
- MCP fix: Already deployed (version: 6eae0053-370a-40cd-97c8-a43c275439e6)

## Lessons Learned
1. **Always check the deserializer** when UI shows empty blocks
2. **Support multiple formats** for backward compatibility
3. **Self-healing patterns** prevent need for migrations
4. **Preserve all properties** when transforming data structures