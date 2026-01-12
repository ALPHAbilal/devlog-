# RxDB System Mapping - Complete Discovery

**Purpose**: Map the ENTIRE system before making any more fixes.
**Status**: ✅ FULLY RESOLVED
**Last Updated**: 2026-01-12

---

## Resolution Summary

**The Real Problem**: Supabase DOES have `file_path` and `language` columns. The issue was:
1. **Incomplete whitelist** - `rxdb-replication.ts` was stripping valid columns
2. **Case mismatch** - JS sends `filePath` (camelCase), Supabase expects `file_path` (snake_case)

**Fix Applied** in `src/shared/db/rxdb-replication.ts`:
1. Updated `SUPABASE_COLUMNS` whitelist to include `language`, `file_path`, `user_id`, `extracted_tags`
2. Added `FIELD_MAPPINGS` for camelCase → snake_case conversion on push
3. Added `REVERSE_FIELD_MAPPINGS` for snake_case → camelCase conversion on pull
4. Created `prepareForSupabase()` function (replaces old `stripExtraFields`)
5. Created `prepareFromSupabase()` function for pull handler

---

## SECTION 1: Supabase Schema (Source of Truth)

### 1.1 Blocks Table

**QUESTION**: What are the EXACT columns in Supabase `blocks` table?

**RESPONSE** (FROM SUPABASE MCP - VERIFIED):
```
- id: uuid (NOT NULL, default: uuid_generate_v4())
- document_id: uuid (NOT NULL)
- type: text (NOT NULL) - check constraint: text, code, heading, ai, table, filetree, todo, template, math, image, inline-image, issue-tracker
- content: text (NOT NULL)
- position: integer (NOT NULL)
- created_at: timestamp with time zone (NOT NULL, default: timezone('utc', now()))
- updated_at: timestamp with time zone (NOT NULL, default: timezone('utc', now()))
- metadata: jsonb (nullable, default: '{}')
- extracted_tags: text[] (nullable, default: '{}')
- language: text (nullable) <-- EXISTS IN SUPABASE!
- file_path: text (nullable) <-- EXISTS IN SUPABASE! (snake_case, NOT camelCase)
- version_of: uuid (nullable)
- search_vector: tsvector (nullable)
- user_id: uuid (nullable)
- deleted_at: timestamp with time zone (nullable)
- _modified: bigint (nullable, default: epoch * 1000)
- _deleted: boolean (nullable, default: false)
```

---

### 1.2 Documents Table

**QUESTION**: What are the EXACT columns in Supabase `documents` table?

**RESPONSE** (FROM SUPABASE MCP - VERIFIED):
```
- id: uuid (NOT NULL, default: uuid_generate_v4())
- user_id: uuid (NOT NULL)
- title: text (NOT NULL)
- created_at: timestamp with time zone (NOT NULL, default: timezone('utc', now()))
- updated_at: timestamp with time zone (NOT NULL, default: timezone('utc', now()))
- is_template: boolean (nullable, default: false)
- tags: text[] (nullable, default: '{}')
- metadata: jsonb (nullable, default: '{}')
- search_vector: tsvector (nullable)
- deleted_at: timestamp with time zone (nullable)
- project_id: uuid (nullable)
- is_project: boolean (nullable, default: false)
- folder_id: uuid (nullable)
- position: integer (nullable, default: 0)
- share_settings: jsonb (nullable, default: '{"type": "private", "enabled": false, ...}')
- is_favorite: boolean (nullable, default: false)
- _modified: bigint (nullable, default: epoch * 1000)
- _deleted: boolean (nullable, default: false)
```

---

### 1.3 Folders Table

**QUESTION**: What are the EXACT columns in Supabase `folders` table?

**RESPONSE** (FROM SUPABASE MCP - VERIFIED):
```
- id: uuid (NOT NULL, default: uuid_generate_v4())
- user_id: uuid (NOT NULL)
- parent_id: uuid (nullable)
- name: text (NOT NULL)
- color: text (nullable, default: '#6B7280')
- icon: text (nullable, default: 'folder')
- is_expanded: boolean (nullable, default: false)
- is_favorite: boolean (nullable, default: false)
- position: integer (NOT NULL, default: 0)
- created_at: timestamp with time zone (nullable, default: now())
- updated_at: timestamp with time zone (nullable, default: now())
- path: text (nullable)
- _modified: bigint (nullable, default: epoch * 1000)
- _deleted: boolean (nullable, default: false)
```

---

## SECTION 2: Schema Mismatch Analysis - THE REAL ISSUE

### 2.1 RxDB Whitelist vs Supabase Reality

**CRITICAL DISCOVERY**: The `SUPABASE_COLUMNS` whitelist in `rxdb-replication.ts` (lines 94-107) is **INCOMPLETE**!

**Current Whitelist (rxdb-replication.ts:103-106)**:
```typescript
blocks: [
  'id', 'document_id', 'type', 'content', 'position', 'metadata',
  'created_at', 'updated_at', '_modified', '_deleted'
]
```

**Missing columns that EXIST in Supabase**:
| Column | In Supabase | In Whitelist | Impact |
|--------|-------------|--------------|--------|
| language | ✅ YES | ❌ NO | Stripped before push, LOST |
| file_path | ✅ YES | ❌ NO | Stripped before push, LOST |
| extracted_tags | ✅ YES | ❌ NO | Stripped before push, LOST |
| user_id | ✅ YES | ❌ NO | Stripped before push, LOST |
| version_of | ✅ YES | ❌ NO | Stripped before push, LOST |

### 2.2 Case Mismatch Issue

**CodeBlock.jsx uses**: `filePath` (camelCase)
**Supabase column is**: `file_path` (snake_case)

Even if we add `file_path` to the whitelist, the JS code sends `filePath` which gets stripped!

**Fix needed**: Either:
1. Convert camelCase to snake_case in push handler, OR
2. Update CodeBlock.jsx to use `file_path` instead of `filePath`

---

## SECTION 3: Data Flow Tracing

### 3.1 UPDATE Block Flow (VERIFIED)

```
User types in CodeBlock
        ↓
CodeBlock.jsx line 190:
  onUpdate(block.id, { content: code, language, filePath, isNew: undefined })
        ↓
useRxBlocks.updateBlock() - src/shared/db/hooks/use-blocks.ts line 111:
  await doc.patch({ ...updates, updated_at: Date.now(), _modified: Date.now() });
        ↓
RxDB stores: { id, type, content, filePath, language, ... }
        ↓
Push handler: stripExtraFields() (rxdb-replication.ts:113-127)
        ↓
stripExtraFields removes:
  - filePath (NOT in whitelist - LOST!)
  - language (NOT in whitelist - LOST!)
  - isNew (NOT in whitelist - correctly stripped)
        ↓
Supabase receives ONLY: { id, document_id, type, content, position, metadata, ... }
        ↓
RESULT: language and file_path columns stay NULL in Supabase!
```

### 3.2 Root Cause (CONFIRMED)

The error `filePath column not found` was misleading. The REAL issue:

1. **NOT a missing column** - Supabase HAS `file_path` and `language` columns
2. **Whitelist is incomplete** - `stripExtraFields()` removes valid columns
3. **Case mismatch** - JS uses `filePath`, Supabase uses `file_path`

---

## SECTION 4: RxDB Schema vs Supabase Comparison

### 4.1 Current RxDB Block Schema (rxdb-schemas.ts:86-112)

```typescript
properties: {
  id, document_id, type, content, position, metadata,
  created_at, updated_at, _modified, _deleted
}
```

### 4.2 Supabase Has More Columns

| Column | RxDB Schema | Supabase | Status |
|--------|-------------|----------|--------|
| id | ✅ | ✅ | OK |
| document_id | ✅ | ✅ | OK |
| type | ✅ | ✅ | OK |
| content | ✅ | ✅ | OK |
| position | ✅ | ✅ | OK |
| metadata | ✅ | ✅ | OK |
| created_at | ✅ | ✅ | OK |
| updated_at | ✅ | ✅ | OK |
| _modified | ✅ | ✅ | OK |
| _deleted | ✅ | ✅ | OK |
| **language** | ❌ | ✅ | MISMATCH |
| **file_path** | ❌ | ✅ | MISMATCH |
| **user_id** | ❌ | ✅ | MISMATCH |
| **extracted_tags** | ❌ | ✅ | MISMATCH |

---

## SECTION 5: Required Fixes

### 5.1 Fix #1: Update Whitelist (HIGH PRIORITY)

**File**: `src/shared/db/rxdb-replication.ts` line 103-106

**Current**:
```typescript
blocks: [
  'id', 'document_id', 'type', 'content', 'position', 'metadata',
  'created_at', 'updated_at', '_modified', '_deleted'
],
```

**Should be**:
```typescript
blocks: [
  'id', 'document_id', 'user_id', 'type', 'content', 'position', 'metadata',
  'language', 'file_path', 'extracted_tags', 'version_of',
  'created_at', 'updated_at', '_modified', '_deleted'
],
```

### 5.2 Fix #2: Handle camelCase to snake_case Conversion

**Option A**: Add conversion in push handler (recommended)
```typescript
// In stripExtraFields or pushHandler
const fieldMapping = {
  filePath: 'file_path',
  // add more as needed
};
```

**Option B**: Update CodeBlock.jsx to use snake_case
```typescript
// Less ideal - changes frontend code conventions
onUpdate(block.id, { content: code, language, file_path: filePath });
```

### 5.3 Fix #3: Update RxDB Schema (Optional)

If we want RxDB to know about these fields (for queries/indexes):

**File**: `src/shared/db/rxdb-schemas.ts`

Add to blockSchema.properties:
```typescript
language: { type: 'string', default: '' },
file_path: { type: 'string', default: '' },
user_id: { type: 'string', maxLength: 36, default: '' },
extracted_tags: { type: 'array', items: { type: 'string' }, default: [] },
```

---

## SECTION 6: Block Types and Special Fields

### 6.1 Verified Block Types (from Supabase check constraint)

Valid types: `text`, `code`, `heading`, `ai`, `table`, `filetree`, `todo`, `template`, `math`, `image`, `inline-image`, `issue-tracker`

### 6.2 Special Fields by Block Type

| Block Type | JS Field | Supabase Column | Status |
|------------|----------|-----------------|--------|
| code | filePath | file_path | NEEDS MAPPING |
| code | language | language | IN SUPABASE, needs whitelist |
| code | isNew | - | Should be stripped (OK) |
| heading | level | metadata.level | OK if in metadata |
| heading | isNew | - | Should be stripped (OK) |
| image | url, alt | metadata.url, metadata.alt | Check if working |
| all | content | content | OK |

---

## SECTION 7: Implementation Plan

### Order of Fixes

1. **Update whitelist** in rxdb-replication.ts to include `language`, `file_path`, `user_id`, `extracted_tags`
2. **Add camelCase → snake_case mapping** for `filePath` → `file_path`
3. **Test code blocks** - create/update with filePath and language
4. **Verify** other block types work correctly
5. **(Optional)** Update RxDB schema to include new fields

### Test Checklist

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Create code block with filePath | file_path populated in Supabase |
| 2 | Create code block with language | language populated in Supabase |
| 3 | Edit existing code block | Both fields updated in Supabase |
| 4 | Refresh page, check values | Values persist and show correctly |
| 5 | Create heading block with level | level in metadata or separate |
| 6 | Create image block | url/alt persisted correctly |

---

## SECTION 8: Summary

### Root Cause (CONFIRMED)

The `PGRST204` / `filePath column not found` error was **NOT because Supabase lacks the column**. It's because:

1. **Supabase HAS** `file_path` and `language` columns
2. **RxDB whitelist** strips them before sending
3. **camelCase/snake_case** mismatch (`filePath` vs `file_path`)

### The Fix is Simple

1. Add missing columns to `SUPABASE_COLUMNS.blocks` whitelist
2. Add field name mapping (`filePath` → `file_path`)
3. That's it!

---

## Research Method

This document was populated using:
- **Supabase MCP** tools: `list_tables`, `execute_sql` for actual schema
- **Codebase search**: `rxdb-replication.ts`, `use-blocks.ts`, `CodeBlock.jsx`
- No guessing or relying on old documentation

**Data retrieved**: 2026-01-12
