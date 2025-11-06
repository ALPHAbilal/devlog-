---
date: 2025-11-05T22:00:00+00:00
researcher: Claude Code
git_commit: 1fdae5c9dedb2838802a986939aa9a674171ad7a
branch: main
repository: devlog-
topic: "Complete Block Data Flow Architecture - All Block Types"
tags: [research, architecture, data-flow, blocks, comprehensive]
status: complete
last_updated: 2025-11-05
last_updated_by: Claude Code
---

# Complete Block Data Flow Architecture

**Date**: 2025-11-05T22:00:00+00:00
**Researcher**: Claude Code
**Git Commit**: 1fdae5c9dedb2838802a986939aa9a674171ad7a
**Branch**: main
**Repository**: devlog-

## Executive Summary

This document provides a comprehensive map of the data flow for ALL block types in the Devlog application, from React component state through to database storage. It documents the complete architecture chain that was partially missing in the FileTree snapshot implementation plan.

### Key Finding

ALL block types follow the same 9-layer data flow architecture:

```
Block Component (React State)
    ↓
onUpdate Callback
    ↓
ExpandedViewEnhanced.updateBlock
    ↓
needsSave Conditional Check ← CRITICAL INTEGRATION POINT
    ↓
blockSerializer.serializeBlock
    ↓
SmartSync.handleChange
    ↓
IndexedDB (crash-proof cache)
    ↓
batch_sync_changes RPC
    ↓
Supabase PostgreSQL Database
```

## Block Type Inventory

### Active Block Types (10 Total)

1. **text** - Basic markdown text blocks
2. **heading** - Heading blocks (levels 1-3)
3. **code** - Code blocks with syntax highlighting
4. **ai** - AI conversation blocks
5. **image** - Image gallery blocks
6. **table** - Structured table blocks
7. **todo** - Todo list blocks
8. **issueTracker** (also 'issue-tracker') - Issue tracking blocks
9. **filetree** - File tree visualization blocks
10. **inlineImage** - Single inline image blocks

### Sources
- Block components: `src/components/blocks/*.jsx`
- Block renderer: `src/components/Block.jsx:35-56`
- Block serializer: `src/utils/blockSerializer.js:61-169`

## Complete Data Flow Architecture

### Layer 1: Block Component (React State)

Each block type manages its own state using React hooks (useState, useEffect).

**File Locations**:
- `src/components/blocks/TextBlock.jsx`
- `src/components/blocks/HeadingBlock.jsx`
- `src/components/blocks/CodeBlock.jsx`
- `src/components/blocks/AIBlockRefined.jsx`
- `src/components/blocks/ImageBlock.jsx`
- `src/components/blocks/TableBlock.jsx`
- `src/components/blocks/TodoBlock.jsx`
- `src/components/blocks/OptimizedIssueTrackerBlock.jsx`
- `src/components/blocks/FileTreeBlock.jsx`
- `src/components/blocks/InlineImageBlock.jsx`

**Block-Specific State**:

| Block Type | State Fields | Example |
|------------|-------------|---------|
| text | `content` (string) | `"# Hello World"` |
| heading | `content` (string), `level` (1-3) | `content: "Title", level: 1` |
| code | `content` (string), `language`, `filePath` | `content: "const x = 1", language: "javascript"` |
| ai | `messages` (array) | `[{role: "user", content: "..."}]` |
| image | `images` (array), `layout`, `columns` | `images: [{url: "...", caption: "..."}]` |
| table | `data` (object) | `{headers: [...], rows: [...], columnAlignments: [...]}` |
| todo | `data.todos` (array) | `{todos: [{text: "...", completed: false}]}` |
| issueTracker | `data` (object) | `{milestone: "v1.0", issues: [...]}` |
| filetree | `treeData` (array), `snapshots` (array), `currentSnapshotId` | `{treeData: [...], snapshots: [...]}` |
| inlineImage | `url`, `alt`, `caption`, `dimensions` | `{url: "...", alt: "...", caption: "..."}` |

### Layer 2: onUpdate Callback

When state changes, blocks call `onUpdate(block.id, updates)` passed as prop.

**Common Pattern** (all blocks):
```javascript
// Example from FileTreeBlock.jsx:424-428
onUpdate(block.id, {
  treeData: treeData,
  snapshots: updatedSnapshots,
  currentSnapshotId: newSnapshotId,
  metadata: metadataToSave
});

// Example from CodeBlock.jsx
onUpdate(block.id, {
  content: newContent,
  language: selectedLanguage,
  filePath: newFilePath
});

// Example from AIBlockRefined.jsx
onUpdate(block.id, {
  messages: updatedMessages
});
```

**File Location**: Each block component calls its `onUpdate` prop when state changes.

### Layer 3: ExpandedViewEnhanced.updateBlock

The parent component receives all onUpdate calls and processes them.

**File Location**: `src/components/ExpandedViewEnhanced.jsx:445-555`

**Function Signature**:
```javascript
const updateBlock = useCallback((blockId, updates) => {
  // ... validation and processing
}, [blocks]);
```

**Processing Steps**:
1. **Validation** (lines 447-450): Check blockId and updates are valid
2. **Debug Logging** (lines 452-463): Log AI block updates for debugging
3. **State Update** (lines 473-475): Call `updateSingleBlock` with startTransition
4. **Save Decision** (lines 477-492): Evaluate needsSave condition
5. **Block Transformation** (lines 496-522): Merge updates with current block
6. **Serialization** (line 537): Call `serializeBlock(updatedBlock)`
7. **SmartSync Trigger** (lines 540-553): Call `handleChange` with normalized data

### Layer 4: needsSave Conditional Check

**CRITICAL INTEGRATION POINT**: This determines if the update triggers a database save.

**File Location**: `src/components/ExpandedViewEnhanced.jsx:478-492`

**Complete Logic**:
```javascript
const needsSave = updates.content !== undefined ||           // text, heading, code
                 updates.data !== undefined ||               // table, todo, issueTracker
                 updates.metadata !== undefined ||           // all blocks
                 updates.tags !== undefined ||               // text blocks
                 updates.messages !== undefined ||           // ai blocks
                 updates.treeData !== undefined ||           // filetree blocks
                 updates.snapshots !== undefined ||          // filetree snapshots
                 updates.currentSnapshotId !== undefined ||  // filetree snapshot ID
                 updates.images !== undefined ||             // image blocks
                 updates.items !== undefined ||              // todo blocks
                 updates.url !== undefined ||                // inlineImage blocks
                 updates.dimensions !== undefined ||         // inlineImage blocks
                 updates.language !== undefined ||           // code blocks
                 updates.filePath !== undefined ||           // code blocks
                 updates.level !== undefined;                // heading blocks
```

**Block Type Mapping**:

| Block Type | Triggers needsSave When... |
|------------|---------------------------|
| text | `content` or `tags` updated |
| heading | `content` or `level` updated |
| code | `content`, `language`, or `filePath` updated |
| ai | `messages` updated |
| image | `images` updated |
| table | `data` updated |
| todo | `data` or `items` updated |
| issueTracker | `data` updated |
| filetree | `treeData`, `snapshots`, or `currentSnapshotId` updated |
| inlineImage | `url` or `dimensions` updated |
| **ALL** | `metadata` updated (universal) |

**Gap Identified**: If a new field is added to ANY block type, this list MUST be updated, or saves won't trigger. This was the root cause of the FileTree snapshot persistence bug.

### Layer 5: blockSerializer.serializeBlock

Normalizes all block-specific fields into a unified database structure.

**File Location**: `src/utils/blockSerializer.js:33-181`

**Function Signature**:
```javascript
export function serializeBlock(block) {
  // Returns: { id, type, position, content, metadata, created_at, updated_at }
}
```

**Block-Specific Serialization**:

#### Text, Heading, Code Blocks (lines 62-67)
```javascript
case 'text':
case 'heading':
case 'code':
  serialized.content = block.content || '';
  break;
```
**Database**: `content` field stores raw string.

#### AI Blocks (lines 69-75)
```javascript
case 'ai':
  serialized.content = JSON.stringify({
    messages: block.messages || [],
    metadata: block.metadata || {}
  });
  break;
```
**Database**: `content` field stores JSON string with messages array.

#### Image Blocks (lines 77-84)
```javascript
case 'image':
  serialized.content = JSON.stringify({
    images: block.images || [],
    layout: block.layout || 'grid',
    columns: block.columns || 3
  });
  break;
```
**Database**: `content` field stores JSON string with images array and layout settings.

#### Table Blocks (lines 86-95)
```javascript
case 'table':
  serialized.content = JSON.stringify({
    data: block.data || {
      headers: ['Column 1', 'Column 2'],
      rows: [['', '']],
      columnAlignments: ['left', 'left']
    }
  });
  break;
```
**Database**: `content` field stores JSON string with structured table data.

#### Todo Blocks (lines 97-103)
```javascript
case 'todo':
  serialized.content = JSON.stringify({
    data: block.data || { todos: [] }
  });
  break;
```
**Database**: `content` field stores JSON string with todos array.

#### IssueTracker Blocks (lines 105-115)
```javascript
case 'issueTracker':
case 'issue-tracker':
  serialized.content = JSON.stringify(
    block.data || {
      milestone: '',
      issues: []
    }
  );
  break;
```
**Database**: `content` field stores JSON string with milestone and issues.

#### FileTree Blocks (lines 117-153)
```javascript
case 'filetree':
  // Content field: current tree structure
  serialized.content = JSON.stringify({
    treeData: block.treeData || [],
    expanded: block.expanded || []
  });

  // Metadata field: snapshot history
  serialized.metadata = {
    ...(block.metadata || {}),  // Preserve existing fields
    snapshots: (block.snapshots || []).map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      label: snapshot.label,
      tree: sanitizeTreeForSnapshot(snapshot.tree),
      changes: snapshot.changes,
      comment: snapshot.comment
    })),
    currentSnapshotId: block.currentSnapshotId || null,
    snapshotLimit: block.snapshotLimit || 50
  };
  break;
```
**Database**:
- `content` field stores current tree structure
- `metadata` JSONB field stores snapshot history

#### InlineImage Blocks (lines 155-162)
```javascript
case 'inlineImage':
  serialized.content = JSON.stringify({
    url: block.url || '',
    alt: block.alt || '',
    caption: block.caption || ''
  });
  break;
```
**Database**: `content` field stores JSON string with image URL and captions.

**Serialization Output Format** (all blocks):
```javascript
{
  id: UUID,
  type: string,          // 'text', 'heading', 'code', 'ai', etc.
  position: number,      // Position in document
  content: string,       // Normalized content (string or JSON string)
  metadata: object,      // JSONB metadata (snapshots, sync tracking, etc.)
  created_at: timestamp,
  updated_at: timestamp
}
```

### Layer 6: SmartSync.handleChange

Orchestrates the data flow from React to database with crash-proof caching.

**File Location**: `src/utils/smartSync.js:213-270`

**Function Signature**:
```javascript
async handleChange(blockId, content, action = 'UPDATE', blockType = null, position = null, metadata = null)
```

**Called From**: `src/components/ExpandedViewEnhanced.jsx:540-546`
```javascript
smartSyncManagerRef.current.handleChange(
  blockId,
  serializedBlock.content,  // Normalized content field
  'UPDATE',
  updatedBlock.type,        // Block type (text, heading, etc.)
  updatedBlock.position,    // Position in document
  serializedBlock.metadata  // JSONB metadata (snapshots, etc.)
)
```

**Processing Steps**:

1. **Create Change Object** (lines 228-238):
```javascript
const change = {
  blockId,
  content,            // Normalized from serializer
  action,             // UPDATE, CREATE, DELETE
  blockType,          // Block type identifier
  position,           // Document position
  metadata,           // JSONB metadata
  documentId: this.documentId,
  timestamp: Date.now(),
  synced: false
};
```

2. **Write to IndexedDB** (lines 240-256): Crash-proof cache layer
3. **Add to Batch Queue** (line 259): Prepare for efficient batch sync
4. **Schedule Smart Sync** (line 262): Intelligent sync timing

**All Block Types**: Use identical SmartSync flow, only `content` and `metadata` differ.

### Layer 7: IndexedDB (Crash-Proof Cache)

**Purpose**: Offline-first storage with instant write confirmation.

**Database**: Browser IndexedDB database named `devlog-sync`

**Tables**:
- `changes`: Unsynchronized changes queue
- `blocks`: Current block states (mirror of Supabase)

**Write Pattern** (lines 242-256):
```javascript
// Add to changes queue
const changeId = await this.db.changes.add(change);

// Update blocks mirror
if (action === 'UPDATE' || action === 'CREATE') {
  await this.db.blocks.put({
    id: blockId,
    documentId: this.documentId,
    content: content,
    updated_at: Date.now(),
    synced: false
  });
}
```

**All Block Types**: Identical IndexedDB flow, content structure varies.

### Layer 8: batch_sync_changes RPC

PostgreSQL function that processes batch updates from SmartSync.

**File Location**: `migrations/fix_batch_sync_metadata.sql`

**Function Signature**:
```sql
CREATE OR REPLACE FUNCTION batch_sync_changes(
  p_document_id UUID,
  p_changes JSONB
) RETURNS JSONB
```

**Called From**: `src/utils/smartSync.js:338-350`
```javascript
const { data, error } = await this.supabase
  .rpc('batch_sync_changes', {
    p_document_id: this.documentId,
    p_changes: batch.map(change => ({
      block_id: change.blockId,
      content: change.content,        // Serialized content
      action: change.action,          // UPDATE, CREATE, DELETE
      block_type: change.blockType,   // Block type
      position: change.position,      // Position
      metadata: change.metadata,      // JSONB metadata
      timestamp: change.timestamp
    }))
  });
```

**Processing Logic**:

1. **Loop Through Changes** (line 20):
```sql
FOR v_change IN SELECT * FROM jsonb_array_elements(p_changes)
```

2. **Parse Client Metadata** (lines 27-35):
```sql
v_client_metadata := CASE
  WHEN v_change->>'metadata' IS NOT NULL
  THEN (v_change->>'metadata')::JSONB
  ELSE '{}'::JSONB
END;
```

3. **Handle Action Types**:

**UPDATE/CREATE** (lines 25-62):
```sql
INSERT INTO blocks (
  id,
  document_id,
  content,
  metadata,
  updated_at
)
VALUES (
  (v_change->>'block_id')::UUID,
  p_document_id,
  v_change->>'content',
  -- CRITICAL: Merge client metadata with sync tracking
  v_client_metadata || jsonb_build_object(
    'last_sync', now(),
    'sync_timestamp', (v_change->>'timestamp')::BIGINT
  ),
  to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
)
ON CONFLICT (id) DO UPDATE
SET
  content = EXCLUDED.content,
  metadata = EXCLUDED.metadata,
  updated_at = EXCLUDED.updated_at
WHERE blocks.updated_at < EXCLUDED.updated_at;
```

**DELETE** (lines 64-68):
```sql
DELETE FROM blocks
WHERE id = (v_change->>'block_id')::UUID
  AND document_id = p_document_id;
```

**REORDER** (lines 70-81):
```sql
UPDATE blocks
SET
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{position}',
    to_jsonb((v_change->>'position')::INT)
  ),
  updated_at = to_timestamp((v_change->>'timestamp')::BIGINT / 1000)
WHERE id = (v_change->>'block_id')::UUID;
```

**All Block Types**: Use identical RPC flow, database interprets `content` based on `type` field.

### Layer 9: Supabase PostgreSQL Database

**Database Schema**:

**blocks table**:
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  type TEXT NOT NULL,           -- 'text', 'heading', 'code', 'ai', etc.
  content TEXT,                 -- Serialized content (string or JSON)
  metadata JSONB DEFAULT '{}',  -- JSONB metadata (snapshots, sync tracking)
  position INTEGER,             -- Position in document
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  user_id UUID REFERENCES auth.users(id)
);
```

**Storage Format by Block Type**:

| Block Type | content Field | metadata Field |
|------------|--------------|----------------|
| text | Raw markdown string | `{tags: [...], last_sync: ...}` |
| heading | Raw heading text | `{level: 1-3, last_sync: ...}` |
| code | Raw code string | `{language: "js", filePath: "...", last_sync: ...}` |
| ai | JSON: `{messages: [...], metadata: {...}}` | `{last_sync: ...}` |
| image | JSON: `{images: [...], layout: "grid", columns: 3}` | `{last_sync: ...}` |
| table | JSON: `{data: {headers: [...], rows: [...]}}` | `{last_sync: ...}` |
| todo | JSON: `{data: {todos: [...]}}` | `{last_sync: ...}` |
| issueTracker | JSON: `{milestone: "...", issues: [...]}` | `{last_sync: ...}` |
| filetree | JSON: `{treeData: [...], expanded: [...]}` | `{snapshots: [...], currentSnapshotId: "...", last_sync: ...}` |
| inlineImage | JSON: `{url: "...", alt: "...", caption: "..."}` | `{last_sync: ...}` |

**All metadata fields** include:
- `last_sync`: Timestamp of last sync
- `sync_timestamp`: Client-side timestamp
- Block-specific fields (e.g., snapshots for filetree)

## Reverse Flow: Database → React

### Deserialization Process

**File Location**: `src/utils/blockSerializer.js:190-481`

**Function**: `deserializeBlock(block)`

**Processing Steps**:

1. **Create Base Structure** (lines 212-219):
```javascript
const deserialized = {
  id: block.id,
  type: block.type,
  position: block.position || 0,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
};
```

2. **Parse Content by Type** (lines 223-469):

**Text, Heading, Code** (lines 224-233):
```javascript
case 'text':
case 'heading':
case 'code':
  deserialized.content = block.content || '';
  if (block.type === 'heading' && block.metadata?.level) {
    deserialized.level = block.metadata.level;
  }
  break;
```

**AI Blocks** (lines 235-262):
```javascript
case 'ai':
  const parsed = JSON.parse(block.content);
  deserialized.messages = parsed.messages || [];
  // Handle legacy format with metadata.messages
  break;
```

**Image Blocks** (lines 264-276):
```javascript
case 'image':
  const parsed = JSON.parse(block.content);
  deserialized.images = parsed.images || [];
  deserialized.layout = parsed.layout || 'grid';
  deserialized.columns = parsed.columns || 3;
  break;
```

**Table Blocks** (lines 278-323):
```javascript
case 'table':
  const parsed = JSON.parse(block.content);
  deserialized.data = parsed.data || {
    headers: ['Column 1', 'Column 2'],
    rows: [['', '']],
    columnAlignments: ['left', 'left']
  };
  // Handle legacy markdown format
  break;
```

**Todo Blocks** (lines 325-335):
```javascript
case 'todo':
  const parsed = JSON.parse(block.content);
  deserialized.data = parsed.data || { todos: [] };
  break;
```

**IssueTracker Blocks** (lines 337-376):
```javascript
case 'issueTracker':
case 'issue-tracker':
  const parsed = JSON.parse(block.content);
  // Handle both old format (nested data.data) and new format
  deserialized.data = parsed.data || parsed || { milestone: '', issues: [] };
  break;
```

**FileTree Blocks** (lines 378-440):
```javascript
case 'filetree':
  // Parse content for tree structure
  const parsed = JSON.parse(block.content);
  deserialized.treeData = parsed.treeData || [];
  deserialized.expanded = parsed.expanded || {};

  // Parse metadata for snapshots
  const meta = block.metadata || {};
  deserialized.snapshots = meta.snapshots || [];
  deserialized.currentSnapshotId = meta.currentSnapshotId || null;
  deserialized.snapshotLimit = meta.snapshotLimit || 50;
  break;
```

**InlineImage Blocks** (lines 442-455):
```javascript
case 'inlineImage':
  const parsed = JSON.parse(block.content);
  deserialized.url = parsed.url || '';
  deserialized.alt = parsed.alt || '';
  deserialized.caption = parsed.caption || '';
  break;
```

## Critical Integration Points

### 1. needsSave Check in ExpandedViewEnhanced

**Location**: `src/components/ExpandedViewEnhanced.jsx:478-492`

**Purpose**: Determines which updates trigger database saves.

**Requirements**: MUST include all block-specific fields that need persistence.

**Common Mistake**: Adding new fields to a block without updating this check.

**Impact**: Data created but never saved to database.

**Solution**: When adding ANY new persistent field to ANY block type, add it to this conditional.

### 2. blockSerializer Field Mapping

**Location**: `src/utils/blockSerializer.js:33-481`

**Purpose**: Normalizes React state to database format and vice versa.

**Requirements**:
- Serialize: Convert block-specific fields to `content` and `metadata` JSONB
- Deserialize: Restore block-specific fields from `content` and `metadata`

**Common Mistake**: Forgetting to update both serialize AND deserialize functions.

**Impact**: Data saves but doesn't load correctly (or vice versa).

**Solution**: Always update both functions in parallel.

### 3. SmartSync Metadata Passing

**Location**: `src/utils/smartSync.js:213-350`

**Purpose**: Passes JSONB metadata through to RPC function.

**Requirements**:
- handleChange signature includes metadata parameter
- RPC payload includes metadata field

**Common Mistake**: Omitting metadata parameter in function call.

**Impact**: Metadata created but lost in transit to database.

**Solution**: Ensure all call sites pass `serializedBlock.metadata`.

### 4. batch_sync_changes Metadata Preservation

**Location**: `migrations/fix_batch_sync_metadata.sql:27-60`

**Purpose**: Preserves client metadata while adding sync tracking.

**Requirements**:
- Parse client metadata from change object
- Merge with sync tracking fields using `||` operator

**Common Mistake**: Creating new metadata object instead of merging.

**Impact**: Client metadata completely discarded.

**Solution**: Always use merge pattern: `v_client_metadata || jsonb_build_object(...)`

## Block Type Comparison Matrix

### Save Path (React → Database)

| Layer | text | heading | code | ai | image | table | todo | issueTracker | filetree | inlineImage |
|-------|------|---------|------|----|----|-------|------|-------------|----------|-------------|
| **Component State** | `content` | `content`, `level` | `content`, `language`, `filePath` | `messages` | `images`, `layout`, `columns` | `data` | `data.todos` | `data` | `treeData`, `snapshots`, `currentSnapshotId` | `url`, `alt`, `caption`, `dimensions` |
| **onUpdate Call** | `{content}` | `{content, level}` | `{content, language, filePath}` | `{messages}` | `{images, layout, columns}` | `{data}` | `{data}` | `{data}` | `{treeData, snapshots, currentSnapshotId}` | `{url, dimensions}` |
| **needsSave Triggers** | `content`, `tags` | `content`, `level` | `content`, `language`, `filePath` | `messages` | `images` | `data` | `data`, `items` | `data` | `treeData`, `snapshots`, `currentSnapshotId` | `url`, `dimensions` |
| **Serialization** | `content: string` | `content: string` | `content: string` | `content: JSON` | `content: JSON` | `content: JSON` | `content: JSON` | `content: JSON` | `content: JSON`, `metadata: JSONB` | `content: JSON` |
| **SmartSync** | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` | `{content, metadata}` |
| **Database Storage** | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT`, `metadata: JSONB` | `content: TEXT` |

### Load Path (Database → React)

| Layer | text | heading | code | ai | image | table | todo | issueTracker | filetree | inlineImage |
|-------|------|---------|------|----|----|-------|------|-------------|----------|-------------|
| **Database Read** | `content: TEXT` | `content: TEXT`, `metadata.level` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT` | `content: TEXT`, `metadata: JSONB` | `content: TEXT` |
| **Deserialization** | `content: string` | `content: string`, `level: number` | `content: string` | `messages: array` | `images: array`, `layout: string` | `data: object` | `data.todos: array` | `data: object` | `treeData: array`, `snapshots: array` | `url: string`, `alt: string` |
| **Block Component** | `content` | `content`, `level` | `content`, `language`, `filePath` | `messages` | `images`, `layout`, `columns` | `data` | `data.todos` | `data` | `treeData`, `snapshots`, `currentSnapshotId` | `url`, `alt`, `caption` |

## Data Flow Diagrams

### Universal Block Save Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Block Component (React State)                            │
│    - User types/clicks/interacts                            │
│    - useState updates local state                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. onUpdate Callback                                         │
│    - Component calls: onUpdate(block.id, {field: value})    │
│    - All blocks use same pattern                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ExpandedViewEnhanced.updateBlock                         │
│    - Validates blockId and updates                          │
│    - Calls updateSingleBlock (React state)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. needsSave Conditional Check ⚠️ CRITICAL                  │
│    - IF updates.field in allowList THEN proceed             │
│    - ELSE skip save (data lost!)                            │
│    - MUST update for new fields                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. blockSerializer.serializeBlock                           │
│    - Normalizes block fields → {content, metadata}          │
│    - Different logic per block type                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SmartSync.handleChange                                   │
│    - Receives: (blockId, content, action, type, pos, meta)  │
│    - Creates change object with all fields                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. IndexedDB Write (Crash-Proof Cache)                      │
│    - Immediate write to browser storage                     │
│    - Returns success before network call                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. batch_sync_changes RPC ⚠️ CRITICAL                       │
│    - Receives: {block_id, content, action, type, pos, meta} │
│    - MUST parse and preserve metadata                       │
│    - MUST merge, not replace                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Supabase PostgreSQL Database                             │
│    - Stores: content (TEXT), metadata (JSONB)               │
│    - Final persistence layer                                │
└─────────────────────────────────────────────────────────────┘
```

### FileTree Snapshot Specific Flow

```
┌─────────────────────────────────────────────────────────────┐
│ FileTreeBlock Component                                      │
│  - treeData: Array (current tree structure)                 │
│  - snapshots: Array (historical snapshots)                  │
│  - currentSnapshotId: String (active snapshot ID)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ createSnapshot() clicked
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ onUpdate(block.id, {                                         │
│   treeData: currentTree,                                     │
│   snapshots: [...oldSnapshots, newSnapshot],                │
│   currentSnapshotId: newSnapshotId,                         │
│   metadata: {...}                                            │
│ })                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ ExpandedViewEnhanced.updateBlock                            │
│  - needsSave check includes:                                │
│    ✅ updates.treeData !== undefined                        │
│    ✅ updates.snapshots !== undefined                       │
│    ✅ updates.currentSnapshotId !== undefined               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ blockSerializer.serializeBlock (filetree case)              │
│                                                              │
│  content = JSON.stringify({                                 │
│    treeData: block.treeData,                                │
│    expanded: block.expanded                                 │
│  })                                                          │
│                                                              │
│  metadata = {                                                │
│    ...(block.metadata || {}),                               │
│    snapshots: block.snapshots.map(sanitize),                │
│    currentSnapshotId: block.currentSnapshotId,              │
│    snapshotLimit: 50                                         │
│  }                                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ SmartSync.handleChange(                                      │
│   blockId,                                                   │
│   serializedBlock.content,  // JSON: {treeData, expanded}   │
│   'UPDATE',                                                  │
│   'filetree',                                                │
│   position,                                                  │
│   serializedBlock.metadata  // {snapshots, currentSnapshotId}│
│ )                                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ batch_sync_changes RPC                                       │
│                                                              │
│  v_client_metadata := (v_change->>'metadata')::JSONB        │
│  // Parses: {snapshots: [...], currentSnapshotId: "..."}    │
│                                                              │
│  INSERT INTO blocks (metadata) VALUES (                     │
│    v_client_metadata || jsonb_build_object(                 │
│      'last_sync', now(),                                     │
│      'sync_timestamp', timestamp                             │
│    )                                                         │
│  )                                                           │
│  // Result: {snapshots: [...], currentSnapshotId: "...",    │
│  //          last_sync: "...", sync_timestamp: 123}         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Database                                            │
│  blocks table:                                               │
│    - content: {"treeData": [...], "expanded": [...]}        │
│    - metadata: {"snapshots": [...],                         │
│                 "currentSnapshotId": "...",                 │
│                 "snapshotLimit": 50,                        │
│                 "last_sync": "...",                         │
│                 "sync_timestamp": 123}                      │
└─────────────────────────────────────────────────────────────┘
```

## Lessons Learned from FileTree Snapshot Bug

### What Went Wrong

The FileTree snapshot implementation plan documented:
1. ✅ FileTreeBlock component state management
2. ✅ Snapshot creation/restore/delete functions
3. ✅ blockSerializer serialization logic
4. ✅ Database schema (JSONB metadata support)

But COMPLETELY OMITTED:
1. ❌ needsSave check in ExpandedViewEnhanced
2. ❌ SmartSync metadata parameter
3. ❌ batch_sync_changes metadata parsing

### Why This Happened

The plan analyzed:
- Block component in isolation
- Serialization layer in isolation
- Database schema in isolation

But FAILED to trace the complete integration chain from component → database.

### Prevention Checklist

When adding ANY new persistent field to ANY block type:

- [ ] 1. Update block component to manage state
- [ ] 2. Update block component to call onUpdate with new field
- [ ] 3. **Update needsSave check in ExpandedViewEnhanced.jsx** ← Often forgotten
- [ ] 4. Update blockSerializer.serializeBlock for new field
- [ ] 5. Update blockSerializer.deserializeBlock for new field
- [ ] 6. Verify SmartSync.handleChange signature includes field
- [ ] 7. Verify SmartSync RPC payload includes field
- [ ] 8. Verify batch_sync_changes RPC parses field
- [ ] 9. Test complete save/load cycle
- [ ] 10. Query database directly to verify persistence

### Universal Pattern Template

```javascript
// 1. Component State
const [newField, setNewField] = useState(initialValue);

// 2. onUpdate Call
onUpdate(block.id, { newField: updatedValue });

// 3. needsSave Check (ExpandedViewEnhanced.jsx:478-492)
const needsSave = /* ... */ ||
                 updates.newField !== undefined; // ← ADD THIS

// 4. Serialization (blockSerializer.js)
// Serialize:
serialized.content = JSON.stringify({
  newField: block.newField,
  // ... other fields
});

// Deserialize:
const parsed = JSON.parse(block.content);
deserialized.newField = parsed.newField || defaultValue;

// 5. SmartSync (already passes metadata, no changes needed if using metadata)

// 6. RPC (already preserves metadata, no changes needed)

// 7. Test
// - Create/update block with newField
// - Check browser DevTools Network tab for RPC call
// - Query database: SELECT content, metadata FROM blocks WHERE id = '...'
// - Reload page and verify newField persists
```

## Architecture Strengths

### Universal Data Flow

**Every block type** follows the same 9-layer architecture. This provides:

1. **Consistency**: Developers know exactly where to look for any block type
2. **Debuggability**: Same debugging approach for all blocks
3. **Maintainability**: Changes to architecture affect all blocks uniformly
4. **Reliability**: Well-tested flow reduces block-specific bugs

### Separation of Concerns

Each layer has a single responsibility:

1. **Component**: UI and user interaction
2. **onUpdate**: Event notification
3. **updateBlock**: State management
4. **needsSave**: Save decision logic
5. **serializeBlock**: Data normalization
6. **handleChange**: Sync orchestration
7. **IndexedDB**: Crash-proof caching
8. **RPC**: Database transaction
9. **PostgreSQL**: Persistent storage

### Crash-Proof Design

Data flows through 3 persistence layers:

1. **React State**: Instant UI updates
2. **IndexedDB**: Survives page refresh/crashes
3. **Supabase**: Cloud backup and sync

Loss of any single layer doesn't lose user data.

## Architecture Weaknesses

### Integration Point Fragility

**Problem**: Adding new fields requires updating multiple disconnected files.

**Example**: FileTree snapshots required changes in:
- FileTreeBlock.jsx
- ExpandedViewEnhanced.jsx (needsSave)
- blockSerializer.js (serialize + deserialize)
- (and originally, batch_sync_changes.sql)

**Risk**: Easy to miss one integration point, causing silent data loss.

**Mitigation**: This document + prevention checklist.

### No Compile-Time Type Safety

**Problem**: TypeScript not enforced across all files.

**Example**: If blockSerializer expects `{treeData}` but component sends `{tree}`, error only appears at runtime.

**Risk**: Typos and refactoring errors not caught until user encounters bug.

**Mitigation**: Add TypeScript + strict type checking.

### Metadata vs Content Ambiguity

**Problem**: Not obvious which fields go in `content` vs `metadata`.

**Current Pattern**:
- `content`: Core block data (what user creates)
- `metadata`: Ancillary data (snapshots, sync tracking, UI state)

**FileTree Confusion**:
- `treeData` in content (core user data)
- `snapshots` in metadata (historical data)
- `expanded` in content (UI state) ← Inconsistent

**Mitigation**: Document clear guidelines for field placement.

### Manual Serialization Logic

**Problem**: Each block type has custom serialize/deserialize code.

**Risk**: Forgetting to update one direction (serialize but not deserialize).

**Example**: FileTree serialization has ~30 lines, deserialization has ~60 lines. Easy to update one and forget the other.

**Mitigation**: Generate serialization code from schema definitions.

## Recommendations

### Immediate (Prevent Future Bugs)

1. **Add TypeScript**: Enforce type safety across data flow
2. **Create Integration Tests**: Test complete save/load cycle for each block type
3. **Add Validation**: Verify serialized data matches expected schema
4. **Document Metadata Rules**: Clear guidelines for content vs metadata

### Short-Term (Improve Developer Experience)

1. **Auto-Generate Serializers**: Define schema, generate serialize/deserialize code
2. **Build Block Type Linter**: Verify all integration points when adding fields
3. **Add needsSave Auto-Detection**: Infer from blockSerializer instead of manual list
4. **Create Block Type Wizard**: CLI tool to scaffold new block types correctly

### Long-Term (Architectural Improvement)

1. **Unify Metadata Pattern**: All ancillary data in metadata, all core data in content
2. **Schema-Driven Architecture**: Single source of truth for block structure
3. **Observability**: Add traces showing data flow through all 9 layers
4. **Automated Testing**: Generate tests from block schemas

## File Reference Index

### Components
- `src/components/ExpandedViewEnhanced.jsx:445-555` - updateBlock function
- `src/components/ExpandedViewEnhanced.jsx:478-492` - needsSave check
- `src/components/Block.jsx:35-56` - Block type rendering
- `src/components/blocks/*.jsx` - Individual block components

### Utilities
- `src/utils/blockSerializer.js:33-181` - serializeBlock function
- `src/utils/blockSerializer.js:190-481` - deserializeBlock function
- `src/utils/smartSync.js:213-270` - handleChange function
- `src/utils/smartSync.js:309-359` - executeBatchSync function

### Database
- `migrations/fix_batch_sync_metadata.sql` - RPC function with metadata preservation
- `migrations/batch_sync_changes.sql` - Original RPC function (metadata bug)

### Research
- `thoughts/shared/research/2025-11-05-filetree-snapshot-autosave-gap.md` - Implementation plan gap analysis
- `thoughts/shared/plans/filetree-snapshot-feature-implementation.md` - Original plan (incomplete)

## Conclusion

This document maps the complete data flow for ALL block types in the Devlog application. The architecture is consistent, crash-proof, and well-separated, but has integration point fragility that caused the FileTree snapshot bug.

**Key Takeaway**: When adding new fields to ANY block type, ALL 9 layers of the data flow must be updated, especially the often-forgotten needsSave check.

**Future Work**: Implement schema-driven architecture to reduce manual integration points and prevent similar bugs.

---

**Last Updated**: 2025-11-05
**Author**: Claude Code
**Verified Against Codebase**: Yes (all file references validated)
**Completeness**: Covers all 10 active block types through all 9 data flow layers
