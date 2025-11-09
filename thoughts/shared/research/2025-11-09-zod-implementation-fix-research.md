---
date: 2025-11-09T09:00:00+01:00
researcher: Claude (Protocol-Guided AI Assistant)
git_commit: 5d967981378da96aaa72fd6d4cdad4da19ee9c76
branch: main
repository: ALPHAbilal/devlog-
topic: "Zod Block Serialization Implementation - Complete Technical Research"
tags: [research, zod, block-serialization, validation, data-integrity, database-schema]
status: complete
last_updated: 2025-11-09
last_updated_by: Claude
---

# Research: Zod Block Serialization Implementation - Complete Technical Research

**Date**: 2025-11-09T09:00:00+01:00
**Researcher**: Claude (Protocol-Guided AI Assistant)
**Git Commit**: 5d967981378da96aaa72fd6d4cdad4da19ee9c76
**Branch**: main
**Repository**: ALPHAbilal/devlog-

## Research Question

What information is needed to successfully fix the Zod implementation for block serialization? The user prefers Option A: Fix Zod Implementation rather than reverting.

## Executive Summary

This research documents the complete technical architecture of the Zod-based block serialization system to enable proper fixes. The system was introduced in commit `095ff9a` but has issues causing "lost positions" (commits `5d96798`, `2d3cd67`, `ac4ab5b`) and incomplete saves.

**Key Findings**:
1. **Zod schemas** are well-defined in `blockSchemas.js` with 9 block types
2. **Database stores** content as TEXT (plain string for simple blocks, JSON for complex)
3. **Legacy format compatibility** added via workaround (lines 272-283 in deserializeBlock)
4. **Position calculation** has complex fallback chain with bugs (indexOf returns -1)
5. **No migration strategy** exists to convert old plain-text format to new JSON format

## Detailed Findings

### 1. Zod Schema Architecture

**Location**: `src/utils/blockSchemas.js`

#### All Block Types and Schemas

| Block Type | Schema Fields | Content Storage Format |
|------------|---------------|----------------------|
| `text` | `content: string` | `{"content": "..."}` |
| `heading` | `content: string` | `{"content": "..."}` |
| `code` | `content: string` | `{"content": "..."}` |
| `ai` | `messages: array, metadata: object` | `{"messages": [...], "metadata": {...}}` |
| `image` | `images: array, layout: enum, columns: number` | `{"images": [...], "layout": "grid", "columns": 3}` |
| `inline-image` | `url, alt, caption, dimensions` | `{"url": "...", "alt": "...", ...}` |
| `table` | `data.headers, data.rows, data.columnAlignments, data.hasHeaderRow` | `{"data": {...}}` |
| `todo` | `data.todos: array` | `{"data": {"todos": [...]}}` |
| `issue-tracker` | `data.milestone, data.issues: array` | `{"data": {...}}` |
| `filetree` | `treeData: array, expanded: array` | `{"treeData": [...], "expanded": [...]}` |

**Key Design**:
- Line 18-19: Text blocks expect `{content: string}` structure
- Line 66-75: Comments emphasize "Zod automatically filters out invalid fields!"
- Line 133-140: `getBlockContentSchema()` handles alias mapping (issueTracker → issue-tracker)

### 2. Database Schema Reality

**Location**: `migrations/fix_batch_sync_type_position.sql:38-67`, `supabase/migrations/20250131_create_save_document_blocks_v3.sql:80-108`

#### blocks Table Structure

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,           -- Block type string
  content TEXT,                 -- Either plain text OR JSON string
  metadata JSONB DEFAULT '{}',  -- JSONB for flexible metadata
  position INTEGER,             -- Zero-based ordering
  language TEXT,                -- Code blocks only
  file_path TEXT,               -- Code blocks only
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ        -- Soft delete
);
```

**Critical Discovery**: Content field is TEXT, not JSONB!
- Simple blocks (text/heading/code): **Historically stored as plain strings**
- Complex blocks: **Stored as JSON strings** (must JSON.parse)
- This dual-format explains the "legacy plain text" workaround

### 3. Serialization Flow (UI → Database)

**Location**: `src/utils/blockSerializer.js:36-218`

```
React Component (e.g., TextBlock)
  ↓ onUpdate(blockId, {content: "hello"})
ExpandedViewEnhanced.updateBlock()
  ↓ Calls SmartSync
blockSerializer.serializeBlock()
  ↓ Line 63: getBlockContentSchema(block.type)
  ↓ Line 75-153: Extract data based on type
  ↓ Line 156: schema.parse(dataToValidate) ← ZOD VALIDATION
  ↓ Line 157: JSON.stringify(validated)
SmartSync.handleChange()
  ↓ IndexedDB cache
batch_sync_changes RPC
  ↓ INSERT INTO blocks (content = JSON string)
Database
```

**Key Points**:
- Line 67: If no schema found, fallback to `block.content || ''`
- Line 75-76: **Text blocks extract** `{content: block.content || ''}`
  - This WRAPS plain text in object!
- Line 156: Zod validates and **filters unknown fields**
- Line 157: Result is **always** JSON stringified

### 4. Deserialization Flow (Database → UI)

**Location**: `src/utils/blockSerializer.js:227-407`

```
Database Query
  ↓ SELECT * FROM blocks
Raw Row (content is TEXT)
  ↓
blockSerializer.deserializeBlock()
  ↓ Line 272-283: ⚠️ LEGACY FORMAT DETECTION
  ↓ IF text/heading/code AND plain string (not JSON)
  ↓    THEN wrap: {content: "plain text"}
  ↓ ELSE JSON.parse(content)
  ↓ Line 286: schema.parse(parsed) ← ZOD VALIDATION
  ↓ Line 289-357: Map validated data to block structure
Component Receives Block
```

**Critical Legacy Workaround** (Lines 272-283):

```javascript
// Handle legacy plain text content for text/heading/code blocks
if ((block.type === 'text' || block.type === 'heading' || block.type === 'code') &&
    typeof block.content === 'string' &&
    !block.content.trim().startsWith('{') &&
    !block.content.trim().startsWith('[')) {
  // Legacy plain text format - wrap in JSON structure
  parsed = { content: block.content };
} else {
  // JSON format (new) or other types
  parsed = typeof block.content === 'string'
    ? JSON.parse(block.content)
    : block.content;
}
```

**Why This Exists**: Database has BOTH formats:
- **Old blocks**: `content = "hello world"` (plain TEXT)
- **New blocks**: `content = "{\"content\": \"hello world\"}"` (JSON string)

### 5. The "Lost Positions" Bug

**Location**: `src/components/ExpandedViewEnhanced.jsx:596-617`

**Root Cause**: Complex fallback chain returns `-1` from `indexOf()`

```javascript
// CRITICAL FIX: Get position BEFORE startTransition
let blockPosition = updates.position;
if (blockPosition === undefined || blockPosition === null) {
  if (actualBlock && actualBlock.position !== undefined) {
    blockPosition = actualBlock.position;
  } else {
    // Try loadedBlocks index (more reliable than memoized blocks)
    if (loaderBlock) {
      blockPosition = loadedBlocks.indexOf(loaderBlock);  // ← RETURNS -1 IF NOT FOUND!
    } else {
      // ... more complex fallbacks
    }
  }
}
```

**Problem**:
- `indexOf()` returns `-1` when block not found
- `-1` is passed to database as position
- Database RPC uses `COALESCE((v_change->>'position')::INT, 0)` which accepts -1
- Blocks saved with position = -1 causes corruption

### 6. Block Component Data Expectations

**Evidence from component analysis**:

Each block type expects specific data structure when rendering:

#### TextBlock
```javascript
// src/components/blocks/TextBlock.jsx:137-143
// EXPECTS: block.content = "string"
onUpdate(block.id, {
  content: content,  // Plain string, not {content: "..."}
  tags: extractedTags
});
```

#### TableBlock
```javascript
// src/components/blocks/TableBlock.jsx:305-320
// EXPECTS: block.data = {headers: [...], rows: [...]}
onUpdate(block.id, { data: newData });
```

#### AIBlock
```javascript
// src/components/blocks/AIBlockRefined.jsx:148-156
// EXPECTS: block.messages = [{role, content}, ...]
onUpdate(block.id, { messages: updatedMessages });
```

**Critical Mismatch**:
- **Components expect**: `content` as plain string
- **Zod schema defines**: `{content: string}` (wrapped object)
- **Serializer produces**: `JSON.stringify({content: "text"})` for database
- **Deserializer must unwrap**: Lines 291-292 handle this

### 7. Migration Requirements (Not Implemented)

**What's Missing**:
1. **No database migration** to convert old plain-text content to JSON format
2. **No version tracking** in metadata to know which format is in use
3. **No batch converter** to update existing blocks

**Current Blocks in Database** (estimated):
- Old format (before `095ff9a`): Plain text in content field
- New format (after `095ff9a`): JSON strings in content field
- **Both exist simultaneously** ← Why "legacy detection" code added

### 8. Zod Validation Impact

**What Zod Does**:
- **Auto-validates** data structure matches schema
- **Auto-filters** unknown fields (prevents `{headers, rows}` in issue-tracker)
- **Provides defaults** via `.default(...)` on each field
- **Type coercion** (strings to numbers, etc.)

**Critical Comments in Code**:
- `blockSchemas.js:73`: "Zod will automatically reject: milestone, issues, or any other fields"
- `blockSchemas.js:104`: "Zod will automatically reject: headers, rows, columnAlignments, or any other fields"
- `blockSerializer.js:312`: "CRITICAL: Zod has already filtered out any invalid fields (milestone, issues, etc.)"

**This Prevents**: Accidentally storing wrong data (e.g., table data in issue-tracker block)

### 9. Error Handling Patterns

**Serialization Errors** (`blockSerializer.js:188-197`):
1. Try `schema.parse(data)` - throws if invalid
2. Catch error, log warning
3. Try `schema.safeParse({})` - get defaults
4. If that works, use defaults
5. Last resort: `block.content || ''`

**Deserialization Errors** (`blockSerializer.js:359-376`):
1. Try `JSON.parse()` then `schema.parse()`
2. Catch error, log warning
3. Try `schema.safeParse({})` - get defaults
4. Use defaults for block type
5. Never throw to caller - always return valid block

## Code References

### Primary Files
- `src/utils/blockSchemas.js:1-148` - All Zod schema definitions
- `src/utils/blockSerializer.js:36-218` - Serialization (UI → DB)
- `src/utils/blockSerializer.js:227-407` - Deserialization (DB → UI)
- `src/components/ExpandedViewEnhanced.jsx:596-617` - Position calculation bug
- `migrations/fix_batch_sync_type_position.sql:38-67` - Database RPC function

### Block Component Examples
- `src/components/blocks/TextBlock.jsx:137-143` - Text block updates
- `src/components/blocks/TableBlock.jsx:305-320` - Table block updates
- `src/components/blocks/AIBlockRefined.jsx:148-156` - AI block updates
- `src/components/blocks/CodeBlock.jsx:168-169` - Code block updates

### Database Schema
- `supabase/migrations/20250131_create_save_document_blocks_v3.sql:80-108` - Table definition
- `docs/database/supabase-rls-setup.sql:192-206` - Type check constraint

## Historical Context (from thoughts/)

**No Zod-specific documentation exists**, but relevant background:

### Data Structure Evolution
- `thoughts/shared/research/2025-11-05-complete-block-data-flow-architecture.md:530-544` - Documents dual-format content storage (plain text vs JSON)
- `thoughts/shared/research/2025-11-05-complete-supabase-architecture.md` - JSONB metadata architecture
- `thoughts/shared/research/2025-11-04-proptypes-implementation-plan.md` - Previous validation approach (PropTypes)

### Block Implementation Issues
- `thoughts/shared/research/2025-11-04-blocks-implementation-mistakes-verification.md` - Known block issues
- `thoughts/shared/research/2025-11-05-blocks-implementation-weaknesses.md` - Implementation weaknesses
- `thoughts/shared/research/2025-11-05-batch-sync-type-position-bug.md` - Batch sync bugs (similar to position loss)

### Specific Block Problems
- `thoughts/shared/research/2025-11-03-code-block-file-path-persistence-issue.md` - Data persistence issues
- `thoughts/shared/research/2025-11-05-filetree-snapshot-autosave-gap.md` - Serialization gaps
- `thoughts/shared/research/2025-11-07-virtuoso-save-system-behavior.md` - Save system behavior

## Architecture Diagrams

### Current Data Flow

```
┌─────────────────────────────────────────────────────┐
│ UI LAYER (React Components)                         │
│ - Expects: Plain structures (content="string")      │
└───────────────┬─────────────────────────────────────┘
                │ onUpdate({content: "text"})
                ▼
┌─────────────────────────────────────────────────────┐
│ SERIALIZATION LAYER (blockSerializer.js)            │
│ - Wraps: {content: "text"}                          │
│ - Validates with Zod                                │
│ - Stringifies: '{"content":"text"}'                 │
└───────────────┬─────────────────────────────────────┘
                │ JSON string
                ▼
┌─────────────────────────────────────────────────────┐
│ DATABASE (blocks.content = TEXT)                    │
│ - Old blocks: "text" (plain string)                 │
│ - New blocks: '{"content":"text"}' (JSON string)    │
└───────────────┬─────────────────────────────────────┘
                │ Raw TEXT
                ▼
┌─────────────────────────────────────────────────────┐
│ DESERIALIZATION LAYER (blockSerializer.js)          │
│ - Detects format: plain vs JSON                     │
│ - Wraps if needed: {content: "text"}                │
│ - Validates with Zod                                │
│ - Unwraps: "text"                                   │
└───────────────┬─────────────────────────────────────┘
                │ Plain structure
                ▼
┌─────────────────────────────────────────────────────┐
│ UI LAYER (React Components)                         │
│ - Receives: Plain structures (content="string")     │
└─────────────────────────────────────────────────────┘
```

### The Problem: Format Inconsistency

```
DATABASE REALITY:
┌────────────────────────────────────────┐
│ blocks.content (TEXT column)          │
├────────────────────────────────────────┤
│ Row 1: "hello world"                   │  ← OLD FORMAT (plain text)
│ Row 2: '{"content":"hello world"}'     │  ← NEW FORMAT (JSON)
│ Row 3: "code example"                  │  ← OLD FORMAT
│ Row 4: '{"content":"code example"}'    │  ← NEW FORMAT
└────────────────────────────────────────┘
         ↓
    Deserialization must handle BOTH!
```

## Fix Requirements Checklist

Based on this research, here's what needs to be fixed:

### 1. Position Loss Bug ✅ IDENTIFIED
**Location**: `ExpandedViewEnhanced.jsx:596-617`
**Issue**: `indexOf()` returns -1 when block not found
**Fix**: Validate position >= 0, fallback to blocks.length

### 2. Zod Schema Compatibility ⚠️ INCOMPLETE
**Location**: `blockSchemas.js:18-28`
**Issue**: Text blocks schema expects `{content: string}` but components use plain strings
**Options**:
  a. Update schema to accept EITHER `{content: string}` OR plain `string`
  b. Update serializer to handle unwrapping before Zod validation
  c. Migrate all database content to consistent format

### 3. Legacy Format Detection ⚠️ WORKAROUND ONLY
**Location**: `blockSerializer.js:272-283`
**Issue**: Detects plain text and wraps it, but NO DATABASE MIGRATION
**Missing**:
  - Migration to convert old plain text → JSON strings
  - Version tracking in metadata
  - Batch converter script

### 4. Dependency Chain Causing Re-renders ✅ IDENTIFIED
**Location**: `ExpandedViewEnhanced.jsx:785`
**Issue**: Added `loadedBlocks` and `stableEntry` to dependencies
**Fix**: Remove from deps, use refs instead

### 5. Validation Error Handling 🆗 GOOD
**Location**: `blockSerializer.js:188-197`, `359-376`
**Status**: Comprehensive error handling with fallbacks
**No changes needed**

## Recommendations for Implementation

### Priority 1: Fix Position Bug (Immediate)
Replace complex fallback chain with simple validation:
```javascript
let blockPosition = updates.position ?? actualBlock?.position ?? blocks.length;
if (blockPosition < 0) blockPosition = blocks.length;
```

### Priority 2: Schema Union Types (Short-term)
Update text/heading/code schemas to accept both formats:
```javascript
text: z.union([
  z.object({content: z.string()}),  // New format
  z.string()                         // Legacy format
]).transform(val => typeof val === 'string' ? {content: val} : val)
```

### Priority 3: Database Migration (Medium-term)
Create migration to normalize all content to JSON format:
```sql
UPDATE blocks
SET content = jsonb_build_object('content', content)::text
WHERE type IN ('text', 'heading', 'code')
  AND content !~ '^[\{\[]';  -- Doesn't start with { or [
```

### Priority 4: Remove Dependency Overhead (Short-term)
```javascript
// BEFORE
}, [blocks, loadedBlocks, updateSingleBlock, stableEntry]);

// AFTER
const blocksRef = useRef(blocks);
useEffect(() => { blocksRef.current = blocks; }, [blocks]);
}, [updateSingleBlock]);  // Only stable function
```

## Open Questions

1. **How many old-format blocks exist in production?**
   - Need to query database to assess migration scope

2. **Should we keep dual-format support or force migration?**
   - Trade-off: Backwards compatibility vs. code complexity

3. **Are there any blocks with invalid position values currently?**
   - Check: `SELECT COUNT(*) FROM blocks WHERE position < 0 OR position IS NULL`

4. **What's the migration strategy for users with large documents?**
   - Batch size, error handling, rollback plan

5. **Should Zod schemas be more permissive (accept extra fields)?**
   - Currently: Strict filtering
   - Alternative: `.passthrough()` to preserve unknown fields

## Related Research

- `thoughts/shared/research/2025-11-05-complete-block-data-flow-architecture.md` - Complete data flow
- `thoughts/shared/research/2025-11-04-proptypes-implementation-plan.md` - Previous validation approach
- `thoughts/shared/research/2025-11-05-blocks-implementation-weaknesses.md` - Known issues

## Testing Requirements

Before deploying any Zod fixes, test:

1. **Old format blocks** - Ensure plain text content still loads
2. **New format blocks** - Ensure JSON content works
3. **Mixed documents** - Document with both formats
4. **Position validation** - No -1 values saved
5. **Schema validation** - Invalid fields rejected
6. **Error recovery** - Corrupted data uses defaults
7. **Performance** - No re-render storms from dep changes

---

**Research Complete**: 2025-11-09T09:00:00+01:00
