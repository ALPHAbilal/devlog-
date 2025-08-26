# MCP Filetree Block Fix - 2025-08-26

## Problem
Filetree blocks created via MCP were appearing empty in the DevLog UI, even though text and code blocks worked fine.

## Root Cause Analysis
1. **Data Structure Mismatch**: FileTreeBlock component expects `treeData` as an **array**, but MCP clients often send it as a **single object** (tree root)
2. **Multiple Data Formats**: Block data can come in various formats:
   - `block.content` as object with `treeData` property ✅ (works)
   - `block.treeData` as direct property ❌ (was failing)
   - `block.data.treeData` ❌ (was failing)
   - `block.content` as JSON string ❌ (was failing)

## Solution Implemented

### 1. Enhanced `serializeBlockContent()` function in `/workspace/devlog-/devlog-mcp-remote/src/tools.ts`

```typescript
case 'filetree':
case 'file-tree':
  // Extract treeData from various possible locations
  let treeData = null;
  let expanded = null;
  
  // Priority order for finding data:
  // 1. content object with treeData
  // 2. Direct treeData property  
  // 3. data.treeData
  // 4. JSON string in content
  
  // ALWAYS convert single object to array
  if (treeData && typeof treeData === 'object' && !Array.isArray(treeData)) {
    treeData = [treeData];  // Wrap in array
  }
  
  return JSON.stringify({
    treeData: treeData,
    expanded: expanded
  });
```

### 2. Database Function Fix
Updated `mcp_update_document` to handle different JSON types properly:
- Arrays: Process with `json_array_elements`
- Objects: Convert to single-element array
- Strings: Convert to text blocks
- NULL: Skip processing

## Working Format
MCP clients should send filetree blocks like this:
```json
{
  "type": "filetree",
  "content": {
    "treeData": [  // Array format
      {
        "name": "root",
        "type": "folder",
        "children": [...]
      }
    ],
    "expanded": {
      "root": true
    }
  }
}
```

Or with single root (will be converted to array):
```json
{
  "type": "filetree",
  "content": {
    "treeData": {  // Object format (converted to array)
      "name": "root",
      "type": "folder",
      "children": [...]
    },
    "expanded": {}
  }
}
```

## Testing Results
- ✅ Text blocks: Working
- ✅ Code blocks: Working  
- ✅ Filetree with array treeData: Working
- ✅ Filetree with object treeData (converted): Working
- ✅ Table blocks: Working
- ✅ Issue tracker blocks: Working
- ✅ Version track blocks: Working

## Deployment
Deployed to Cloudflare Workers:
- Version: 6eae0053-370a-40cd-97c8-a43c275439e6
- URL: https://devlog-mcp.bilal-kosika.workers.dev

## Key Learnings
1. **Always validate data structure assumptions** - FileTreeBlock expects arrays, not objects
2. **Handle multiple input formats** - MCP clients may send data differently
3. **Test with actual database queries** - UI issues often stem from data storage problems
4. **Object-to-array conversion is critical** - Many tree structures have single root as object

## Related Files
- `/workspace/devlog-/devlog-mcp-remote/src/tools.ts` - MCP serialization logic
- `/workspace/devlog-/src/components/blocks/FileTreeBlock.jsx` - UI component expecting array format
- Database function: `mcp_update_document` - Handles JSON type checking
- Database function: `mcp_add_block` - Stores block content

## Future Improvements
Consider implementing the MCP Intelligence Enhancement Plan to make these conversions automatic and self-healing.