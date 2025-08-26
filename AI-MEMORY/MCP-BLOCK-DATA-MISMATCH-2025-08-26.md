# MCP Block Data Structure Mismatch Discovery
**Date**: 2025-08-26
**Discovered By**: Following rules.md Protocol (Rule 1: Container Check, Rule 19: Effect Chain Mapping)

## THE ISSUE
MCP creates blocks that appear empty in Devlog UI despite having content.

## EFFECT CHAIN TRACED
```
MCP Create Block → Supabase Store → Devlog Fetch → Block Component Render → Empty Display
       ↓                 ↓                ↓                  ↓                    ↓
   Sends only        Stores as-is    Gets raw data    Expects different    Shows empty
   content field                                      data structure
```

## EXACT CODE LOCATIONS FOUND

### 1. MCP SENDS (Wrong Structure)
**File**: `/workspace/devlog-/devlog-mcp-remote/src/tools.ts`
**Lines**: 88-95
```javascript
body: JSON.stringify({
  p_api_key: apiKey,
  p_document_id: documentId,
  p_type: block.type,
  p_content: block.content || '',  // ← ONLY SENDS CONTENT
  p_metadata: block.metadata || {},
  p_position: absoluteIndex
})
```

### 2. DEVLOG EXPECTS (Different Structure)

#### TableBlock
**File**: `/workspace/devlog-/src/components/blocks/TableBlock.jsx`
**Line**: 44
```javascript
const [tableData, setTableData] = useState(() => {
  const data = block.data || defaultData;  // ← EXPECTS block.data
  // Expects: {headers: [], rows: [], columnAlignments: [], hasHeaderRow: true}
```

#### VersionTrackBlock  
**File**: `/workspace/devlog-/src/components/blocks/VersionTrackBlock.jsx`
**Line**: 260
```javascript
if (block.data?.repository) {  // ← EXPECTS block.data.repository
```

#### IssueTrackerBlock
**File**: `/workspace/devlog-/src/components/blocks/OptimizedIssueTrackerBlock.jsx`
**Line**: 43
```javascript
const issues = block.issues || [];  // ← EXPECTS block.issues array
```

#### TodoBlock
**File**: `/workspace/devlog-/src/components/blocks/TodoBlock.jsx`
**Line**: 22
```javascript
const [todos, setTodos] = useState(block.data?.todos || []);  // ← EXPECTS block.data.todos
```

## THE MISMATCH SUMMARY

| Block Type | MCP Sends | Devlog Expects | Result |
|------------|-----------|----------------|--------|
| table | `content: "table text"` | `data: {headers, rows, columnAlignments}` | Empty table |
| version-track | `content: "version text"` | `data: {repository: {...}}` | Empty tracker |
| issue-tracker | `content: "issues text"` | `issues: [{...}, {...}]` | No issues shown |
| todo | `content: "todo text"` | `data: {todos: [...]}` | No todos shown |
| ai | `content: "conversation"` | `messages: [{...}, {...}]` | No conversation |

## ROOT CAUSE
MCP stores everything in the `content` field as plain text, but Devlog components expect structured JSON data in specific fields (`data`, `issues`, `messages`, etc.).

## PROOF FROM GET_DOCUMENT
When MCP retrieves the document, it returns (line 175):
```javascript
text: JSON.stringify({ document: result.document, blocks: result.blocks }, null, 2)
```

The blocks have this structure:
```json
{
  "id": "...",
  "type": "table",
  "content": "| Block Type | Status | Description |...",  // Plain markdown
  "metadata": {},
  "position": 11
}
```

But TableBlock expects:
```json
{
  "id": "...",
  "type": "table",
  "data": {
    "headers": ["Block Type", "Status", "Description"],
    "rows": [["Text", "✓", "Basic text content"], ...],
    "columnAlignments": ["left", "left", "left"],
    "hasHeaderRow": true
  }
}
```

## WHY THIS HAPPENS
1. MCP was designed to store simple text content
2. Devlog evolved to support rich, structured block types
3. The data transformation layer is missing

## VERIFICATION STEPS
1. Create document via MCP with table block
2. Check Supabase database - see `content` field has markdown
3. Open in Devlog UI - see empty table
4. Manually update database to use `data` field with proper structure
5. Refresh Devlog - see table renders correctly

**Saved**: This discovery explains ALL empty block issues and provides exact fix locations.