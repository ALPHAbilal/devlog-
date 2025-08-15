# Find Existing Autosave Solutions - Expert Search Request

## Mission
Find **existing, production-ready code** that we can adapt or use directly for implementing a robust autosave system for a block-based editor (like Notion) with React and Supabase. We need actual code, not tutorials or concepts.

## What We're Building
A document editor where:
- Documents contain multiple blocks (text, code, images, etc.)
- Each block can be edited independently
- Changes auto-save without save buttons
- Multiple users might edit simultaneously
- Similar to: Notion, Obsidian, Craft, Coda

## Search Targets

### 1. GitHub Repositories
Search for:
- `"supabase" "autosave" "react" extension:js extension:jsx extension:ts`
- `"block editor" "supabase" "save"`
- `"notion clone" "supabase"`
- `"draft-js" OR "slate-js" OR "lexical" "supabase" "autosave"`
- `"collaborative editing" "supabase"`
- `"document editor" "react" "postgresql" "autosave"`

Look specifically in:
- `/src/hooks/` folders for `useAutosave`, `useAutoSave`, `useSave`
- `/src/utils/` for `SaveManager`, `SaveCoordinator`, `AutoSave`
- `/src/services/` for save-related services

### 2. NPM Packages
Search npm for:
- `react-autosave-hook`
- `use-autosave`
- `supabase-autosave`
- `react-supabase-sync`
- `@supabase/realtime` examples
- Block editor libraries with built-in save: `@blocknote/core`, `novel`, `lexical`

### 3. Open Source Projects to Check

**Notion Clones:**
- `notion-clone` repositories on GitHub
- `makenotion/notion-clone`
- `konstantinmuenster/notion-clone`
- Any with 100+ stars using Supabase

**Note-Taking Apps:**
- `outline/outline` - Self-hosted wiki (check their autosave)
- `toeverything/AFFiNE` - Notion alternative
- `AppFlowy-IO/AppFlowy` - Open source Notion
- `logseq/logseq` - Note-taking app

**Collaborative Editors:**
- `atlassian/prosemirror` examples
- `facebook/lexical` examples with Supabase
- `ianstormtaylor/slate` autosave examples

### 4. Specific Code Patterns to Find

**Database Functions (PostgreSQL/Supabase):**
```sql
-- Search for functions named:
save_blocks_batch
upsert_blocks
atomic_save_blocks
save_document_blocks
bulk_upsert_blocks
```

**React Hooks:**
```javascript
// Look for hooks like:
useAutosave()
useAutoSaveDocument()
useDebouncedSave()
useSaveQueue()
useOptimisticSave()
```

**Save Coordinators/Managers:**
```javascript
// Classes or utilities:
class SaveQueue
class SaveCoordinator
class AutoSaveManager
class DocumentSyncManager
```

### 5. CodeSandbox/StackBlitz Examples
Search for:
- "supabase autosave" on CodeSandbox
- "react document editor" on StackBlitz
- "collaborative editor postgresql"

### 6. Supabase Official Resources
Check:
- Supabase GitHub org for example apps
- Supabase Discord (search history for "autosave", "batch save", "upsert blocks")
- Supabase Reddit community
- `supabase/examples` repository

### 7. Production Apps Using Similar Stack
Research how these handle autosave:
- **Linear** (uses PostgreSQL)
- **Notion** (check their network tab patterns)
- **Coda**
- **Airtable**
- **Monday.com**

## Specific Requirements

### Must Have:
- Handles 50-200 blocks per document
- Debounced saves (1-2 second delay)
- Conflict resolution for concurrent edits
- Retry logic for failed saves
- Prevents duplicate saves
- TypeScript support preferred

### Database Pattern Needed:
- Batch upsert of blocks
- Atomic operations (all or nothing)
- Efficient UPDATE vs INSERT detection
- Returns actual saved count

## Output Format

Please provide:

### 1. Direct Code Links
```
Repository: [owner/repo]
File: src/hooks/useAutosave.js
Lines: 45-200
URL: https://github.com/...
Why it's good: [reason]
```

### 2. Copy-Paste Ready Code
```javascript
// Full working implementation
// With all imports and dependencies
```

### 3. NPM Package Commands
```bash
npm install [package-name]
# Usage example
```

### 4. Database Functions
```sql
-- Complete PostgreSQL/Supabase function
-- Ready to execute
```

## Priority Order

1. **First Priority**: Find working SaveCoordinator/Queue implementations
2. **Second Priority**: Find working RPC/database functions for batch saves
3. **Third Priority**: Find React hooks for autosave with Supabase
4. **Fourth Priority**: Find full Notion-clone repos we can learn from

## What NOT to Include
- Theoretical tutorials without code
- Simple single-record save examples
- Firebase/MongoDB examples (we need PostgreSQL/Supabase)
- Overly complex CRDT implementations
- Real-time collaboration frameworks (unless simple)

## Search Tips
- Look for repos with recent commits (2023-2025)
- Check star count and issues (active = good)
- Look at closed Pull Requests for save-related improvements
- Search commit messages for "fix autosave", "improve save", "batch save"
- Check package.json for dependencies that hint at save functionality

Please find **actual, working code** that we can adapt immediately, not architectural discussions or patterns. We need something that's been battle-tested in production.