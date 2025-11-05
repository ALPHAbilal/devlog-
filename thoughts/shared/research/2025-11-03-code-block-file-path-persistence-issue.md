---
date: 2025-11-03T22:59:15+01:00
researcher: Claude Code
git_commit: f83567524863027224e86db3b7f3f661eaf8b0c8
branch: main
repository: devlog-
topic: "Code Block File Path Not Persisting After Reload"
tags: [research, codebase, code-block, smart-sync, file-path, bug-analysis]
status: complete
last_updated: 2025-11-03
last_updated_by: Claude Code
---

# Research: Code Block File Path Not Persisting After Reload

**Date**: 2025-11-03T22:59:15+01:00
**Researcher**: Claude Code
**Git Commit**: f83567524863027224e86db3b7f3f661eaf8b0c8
**Branch**: main
**Repository**: devlog-

## Research Question
Why do file paths in code snippets not persist after reloading the page?

## Summary
The issue is a **critical data loss bug** in the SmartSync batch save system. While the CodeBlock component properly implements file path storage and the database has dedicated columns for `file_path` and `language`, the **`batch_sync_changes` RPC function does not save these fields**. The blockSerializer also omits file paths and language from serialization. This creates a scenario where:

1. ✅ Full document saves (via `save_document_blocks_v3`) **DO persist** file paths
2. ❌ SmartSync incremental saves (via `batch_sync_changes`) **DO NOT persist** file paths
3. ❌ The blockSerializer does not include file paths in serialization

Since most saves use SmartSync for performance, file paths are lost on reload.

## Detailed Findings

### 1. CodeBlock Component (WORKING CORRECTLY)

**File**: `src/components/blocks/CodeBlock.jsx`

The component has a sophisticated file path implementation:

#### State Management
- Stores file path in local state: `useState(block.filePath || '')` (line 9)
- Syncs with props via useEffect (lines 19-23)
- Expects `block.filePath` and `block.language` as **top-level properties**

#### Save Operation (line 167-171)
```javascript
const handleSave = () => {
  onUpdate(block.id, { content: code, language, filePath, isNew: undefined });
  setIsEditing(false);
  setIsFullscreen(false);
};
```

The component passes `filePath` and `language` as top-level fields to the parent update handler.

#### Autocomplete System (lines 76-165)
- Aggregates file paths from:
  1. Other code blocks in the current document
  2. File tree blocks (recursive extraction)
  3. All documents in localStorage history
- Four-tier relevance sorting:
  1. Exact matches
  2. Path starts-with matches
  3. Filename starts-with matches
  4. Alphabetical fallback

#### UI Display
- **Edit mode**: Input field with autocomplete dropdown (lines 258-297)
- **View mode**: Green badge above code block (lines 459-465)
- **Memoization**: Includes `filePath` in comparison to prevent unnecessary re-renders (line 617)

**Conclusion**: Component is well-implemented and expects persistence to work.

---

### 2. Block Serializer (MISSING FILE PATH)

**File**: `src/utils/blockSerializer.js`

#### Serialization Logic (lines 45-51)
```javascript
case 'code':
  // These blocks already use 'content' field
  serialized.content = block.content || '';
  break;
```

**Critical Issue**: The serializer only stores the `content` field for code blocks. It does **NOT** include:
- `language` field
- `filePath` field
- Any code-specific metadata

#### Base Structure (lines 35-42)
Every serialized block includes:
```javascript
{
  id: block.id,
  type: block.type,
  position: block.position,
  metadata: block.metadata || {},
  created_at: block.created_at,
  updated_at: block.updated_at
}
```

But for code blocks, only `content` is added. The `metadata` field exists but the serializer doesn't move `language` or `filePath` into it.

#### Deserialization Logic (lines 187-197)
```javascript
case 'code':
  // These blocks use content directly
  deserialized.content = block.content || '';
  // No restoration of language or filePath
  break;
```

**Pattern Comparison**: Heading blocks use metadata correctly:
```javascript
// Heading deserialization (lines 194-196)
if (block.type === 'heading' && block.metadata?.level) {
  deserialized.level = block.metadata.level;
}
```

This shows the pattern that code blocks should follow but don't.

#### Other Block Types
- **AI blocks**: Serialize messages as JSON in `content` (lines 53-59)
- **Image blocks**: Serialize images array as JSON in `content` (lines 61-68)
- **Table blocks**: Serialize table data as JSON in `content` (lines 71-78)

Code blocks are treated as "simple" blocks like text, but they need structured data like AI/Image blocks.

**Conclusion**: Serializer is the first point of data loss - file paths never make it into the serialized structure.

---

### 3. SmartSync Batch Save (INCOMPLETE SCHEMA)

**File**: `migrations/batch_sync_changes.sql`

#### Current Implementation (fix_batch_sync_type_position.sql)
The `batch_sync_changes` function was fixed to include `type` and `position` fields (lines 44-72):

```sql
INSERT INTO blocks (
  id,
  document_id,
  type,        -- ADDED: Block type
  content,
  position,    -- ADDED: Position
  metadata,
  updated_at
)
VALUES (
  (v_change->>'block_id')::UUID,
  p_document_id,
  v_change->>'block_type',  -- Extract from JSONB
  v_change->>'content',
  COALESCE((v_change->>'position')::INT, 0),
  jsonb_build_object(...),
  to_timestamp(...)
)
```

**Critical Missing Fields**:
- ❌ No `language` column insert
- ❌ No `file_path` column insert

#### Comparison with Full Document Save

**File**: `supabase/migrations/20250131_create_save_document_blocks_v3.sql`

The `save_document_blocks_v3` function (full document save) **DOES include** these fields (lines 80-108):

```sql
INSERT INTO blocks (
  id,
  document_id,
  user_id,
  type,
  content,
  metadata,
  position,
  language,      -- ✅ PRESENT
  file_path,     -- ✅ PRESENT
  created_at,
  updated_at
)
SELECT
  COALESCE((block->>'id')::uuid, gen_random_uuid()),
  p_document_id,
  p_user_id,
  block->>'type',
  COALESCE(block->>'content', ''),
  CASE WHEN block->'metadata' IS NOT NULL THEN block->'metadata' ELSE '{}'::jsonb END,
  (block->>'position')::integer,
  block->>'language',      -- ✅ Extracts language
  block->>'file_path',     -- ✅ Extracts file_path
  NOW(),
  NOW()
FROM jsonb_array_elements(p_blocks) AS block;
```

**Conclusion**: The database schema supports `language` and `file_path` columns, but SmartSync doesn't use them.

---

### 4. Database Schema (CORRECT STRUCTURE)

**Files**:
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql`
- `migrations/batch_sync_changes.sql`

#### Blocks Table Columns
From the `save_document_blocks_v3` function, the blocks table has:

- `id` (UUID)
- `document_id` (UUID)
- `user_id` (UUID)
- `type` (TEXT) - Block type (text, code, ai, etc.)
- `content` (TEXT) - Main content field
- `metadata` (JSONB) - Generic metadata object
- `position` (INTEGER) - Block order
- **`language` (TEXT)** - Programming language for code blocks
- **`file_path` (TEXT)** - File path for code blocks
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Naming Convention**:
- **JavaScript/Application**: `filePath` (camelCase)
- **Database**: `file_path` (snake_case)
- **JSONB extraction**: `block->>'file_path'` (snake_case)

**Conclusion**: Database schema is correct with dedicated columns for code-specific fields.

---

### 5. Save Flow Analysis

**File**: `src/components/ExpandedViewEnhanced.jsx`

#### Update Block Flow (lines 447-562)

1. **User edits block** → `updateBlock()` called
2. **Local state update** (line 475-477) → Immediate UI update
3. **Change detection** (line 480-492) → Checks if save needed
4. **Block merge** (line 497-522) → Merges updates with existing block
5. **Serialization** (line 537) → Calls `serializeBlock()` (❌ loses file path here)
6. **SmartSync dispatch** (line 540-546) → Sends to SmartSync with 5 parameters:
   - `blockId`
   - `serializedBlock.content` (no file path inside)
   - `'UPDATE'`
   - `updatedBlock.type`
   - `updatedBlock.position`

#### SmartSync Handling (smartSync.js:213-268)

Creates change object:
```javascript
{
  blockId: "uuid",
  content: "serialized content",  // No file path
  action: "UPDATE",
  blockType: "code",
  position: 3,
  documentId: "doc-uuid",
  timestamp: 1234567890,
  synced: false
}
```

#### RPC Call (smartSync.js:336-347)

```javascript
supabase.rpc('batch_sync_changes', {
  p_document_id: documentId,
  p_changes: batch.map(change => ({
    block_id: change.blockId,
    content: change.content,      // No file path
    action: change.action,
    block_type: change.blockType,  // Present
    position: change.position,     // Present
    timestamp: change.timestamp
  }))
})
```

**What's missing**: The SmartSync system never extracts or sends:
- `language` field
- `file_path` field

Even though the component provides them to `onUpdate()`, they're lost during serialization.

---

## Data Flow Diagram

### Current Broken Flow

```
1. User types file path in CodeBlock
   ↓
2. Component calls: onUpdate(blockId, { content, language, filePath })
   ↓
3. ExpandedViewEnhanced.updateBlock() receives updates
   ↓
4. Block merged: { ...existingBlock, ...updates }
   ↓
5. serializeBlock() called
   ❌ FILE PATH LOST HERE - only 'content' serialized
   ↓
6. SmartSync.handleChange(blockId, content, 'UPDATE', type, position)
   ❌ No language or filePath parameters
   ↓
7. IndexedDB stores: { blockId, content, action, blockType, position }
   ❌ File path not in change object
   ↓
8. RPC call to batch_sync_changes
   ❌ JSONB doesn't include file_path or language
   ↓
9. Database INSERT: type, content, position, metadata
   ❌ language and file_path columns NOT updated
   ↓
10. Reload: Block loaded without file path
```

### Working Flow (Full Document Save)

```
1. Full document save triggered
   ↓
2. save_document_blocks_v3 called with all blocks
   ↓
3. RPC extracts: block->>'file_path' and block->>'language'
   ✅ Inserts into dedicated columns
   ↓
4. Reload: File path present
```

---

## Root Cause Analysis

### Why File Paths Don't Persist

1. **Serializer excludes file path** (blockSerializer.js:45-51)
   - Only serializes `content` for code blocks
   - Treats code blocks as "simple" like text blocks
   - Should serialize language/filePath into metadata or content

2. **SmartSync doesn't send file path** (smartSync.js:336-347)
   - RPC call only sends: `block_id`, `content`, `action`, `block_type`, `position`
   - Missing: `language` and `file_path` fields
   - Even if serializer included them, SmartSync wouldn't send them

3. **batch_sync_changes doesn't save file path** (migrations/fix_batch_sync_type_position.sql:44-72)
   - INSERT statement only includes: `type`, `content`, `position`, `metadata`
   - Missing: `language` and `file_path` columns
   - Database has the columns, but the function doesn't use them

### Why Full Document Saves Work

The `save_document_blocks_v3` function explicitly extracts and inserts `language` and `file_path`:

```sql
language,
file_path,
...
block->>'language',
block->>'file_path'
```

This works because:
1. It expects the JSONB to contain snake_case `file_path` and `language`
2. It inserts them into dedicated columns
3. No reliance on serializer or SmartSync

---

## Code References

### Component Layer
- `src/components/blocks/CodeBlock.jsx:9` - File path state initialization
- `src/components/blocks/CodeBlock.jsx:167-171` - Save handler with filePath
- `src/components/blocks/CodeBlock.jsx:459-465` - File path display badge
- `src/components/blocks/CodeBlock.jsx:617` - Memoization includes filePath

### Serialization Layer
- `src/utils/blockSerializer.js:45-51` - Code block serialization (❌ missing filePath)
- `src/utils/blockSerializer.js:187-197` - Code block deserialization (❌ missing filePath)

### Save Layer
- `src/components/ExpandedViewEnhanced.jsx:447` - updateBlock entry point
- `src/components/ExpandedViewEnhanced.jsx:537` - serializeBlock call
- `src/components/ExpandedViewEnhanced.jsx:540-546` - SmartSync dispatch

### SmartSync Layer
- `src/utils/smartSync.js:213-268` - handleChange function
- `src/utils/smartSync.js:336-347` - RPC call to batch_sync_changes

### Database Layer
- `migrations/batch_sync_changes.sql:44-72` - INSERT without language/file_path (❌ BROKEN)
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql:80-108` - INSERT with language/file_path (✅ WORKS)

---

## Related Research

This issue is related to the SmartSync incremental save system. See:
- SmartSync architecture documentation (if available)
- Block serialization patterns research (if available)
- Database schema evolution (migration history)

---

## Key Patterns Observed

### 1. Two Save Paths
- **Full document save**: `save_document_blocks_v3` - Used less frequently, works correctly
- **Incremental save**: `batch_sync_changes` - Used for all edits, missing fields

### 2. Serialization Strategy
- **Simple blocks** (text, heading, code): String content only
- **Complex blocks** (ai, image, table): JSON-encoded content with multiple fields
- **Metadata approach**: Used by heading blocks for `level` property

### 3. Column Strategy
- **Dedicated columns**: `language`, `file_path`, `type`, `position`
- **Generic column**: `content` (overloaded for both text and JSON)
- **Flexible storage**: `metadata` JSONB for block-specific data

### 4. Naming Convention
- **Application layer**: camelCase (`filePath`, `blockType`)
- **Database layer**: snake_case (`file_path`, `block_type`)
- **Automatic conversion**: Supabase client handles mapping

---

## Architecture Documentation

### Storage Architecture
The application uses a three-layer storage system:
1. **Memory cache** - Instant UI updates
2. **IndexedDB** - Crash recovery and offline support
3. **Supabase** - Cloud persistence

### Block Persistence Flow
1. Component updates trigger `onUpdate` callback
2. Parent component merges updates and serializes
3. SmartSync batches changes and writes to IndexedDB
4. Debounced sync sends batches to Supabase via RPC
5. RPC function updates database in single transaction

### Serialization Patterns
- **Type-specific serialization**: Each block type has custom logic
- **Content overloading**: Simple text vs complex JSON in same column
- **Metadata storage**: JSONB for flexible additional data
- **Dedicated columns**: Frequently accessed fields get own columns

---

## Configuration

### SmartSync Timing
- Batch size: 50 changes per RPC call
- Min sync interval: 5 seconds
- Max sync interval: 30 seconds
- Idle threshold: 2 seconds before sync

### Block Table Schema
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  position INTEGER,
  language TEXT,      -- Code block language
  file_path TEXT,     -- Code block file path
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Historical Context

### Migration History
1. **Initial batch_sync_changes** (batch_sync_changes.sql)
   - Only saved: `id`, `document_id`, `content`, `metadata`, `updated_at`
   - Missing: `type`, `position`, `language`, `file_path`

2. **Type/Position Fix** (fix_batch_sync_type_position.sql)
   - Added: `type` and `position` fields
   - Still missing: `language` and `file_path`
   - Comment: "CRITICAL: Without type field, blocks cannot be deserialized!"

3. **Full Document Save** (save_document_blocks_v3)
   - Complete implementation with all fields
   - Used for initial document creation and full saves
   - Not used for incremental edits

### Evolution of Block System
- Originally: Simple text-only blocks
- Added: Block types with specialized rendering
- Added: Code blocks with syntax highlighting
- Added: File path feature for code blocks
- Issue: SmartSync not updated to handle new fields

---

## Summary

The file path persistence issue is caused by **three sequential points of data loss**:

1. **blockSerializer.js** - Doesn't serialize `language` or `filePath` for code blocks
2. **smartSync.js** - Doesn't extract or send `language` or `file_path` to RPC
3. **batch_sync_changes.sql** - Doesn't insert into `language` or `file_path` columns

The database schema is correct with dedicated columns. The CodeBlock component is correctly implemented. The `save_document_blocks_v3` function works correctly. But the SmartSync incremental save path (used for 99% of saves) is incomplete.

The fix requires changes at all three layers:
1. Serialize language/filePath in blockSerializer
2. Extract and send language/file_path in SmartSync
3. Update batch_sync_changes to insert into those columns

This is a critical data loss bug affecting any code block with a file path, as file paths are lost on every save/reload cycle when using SmartSync (which is the default save mechanism for all edits).
