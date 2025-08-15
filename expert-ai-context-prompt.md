# Expert Help Request: React Supabase Autosave Architecture Issue

## Current Situation
We have a React 19 + Vite application using Supabase for backend. We're experiencing critical save failures after implementing a new SaveCoordinator architecture. The system is trying to save blocks but returning 0 saved count, causing infinite retry loops.

## Technical Stack
- React 19 (with new features like useOptimistic)
- Vite bundler
- Supabase (PostgreSQL with RPC functions)
- Real-time document editing with blocks (similar to Notion)

## Database Schema

### blocks table
```sql
- id (uuid, primary key)
- document_id (uuid, foreign key)
- type (text) - block type like 'text', 'code', 'version-track'
- content (text) - main text content
- metadata (jsonb) - stores additional JSON data
- position (integer)
- created_at (timestamp)
- updated_at (timestamp)
- user_id (uuid)
```

### documents table
```sql
- id (uuid, primary key)
- title (text)
- user_id (uuid)
- created_at (timestamp)
- updated_at (timestamp)
```

## Current Implementation

### SaveCoordinator Pattern (Singleton)
```javascript
class SaveCoordinator {
  // Queue-based save system
  enqueueChange(documentId, blockId, changes, metadata)
  processQueue() // Debounced, groups saves by document
  saveDocument(documentId, blocks) // Calls RPC function
}
```

### Current RPC Function (NOT WORKING)
```sql
CREATE OR REPLACE FUNCTION atomic_save_blocks(
  p_document_id UUID,
  p_blocks JSONB
) RETURNS JSONB
-- Function tries to upsert blocks but returns saved_count: 0
```

## The Problem

### What's Happening:
1. User edits a block (e.g., version-track block with ID: 217360cc-4b3c-4bb5-959a-6e74195c4fd4)
2. SaveCoordinator queues the change
3. After debounce, it calls atomic_save_blocks RPC
4. RPC returns `{success: true, saved_count: 0, total_blocks: 1}`
5. SaveCoordinator sees 0 saved, throws error
6. Retries 3 times, then saves to localStorage

### Error Logs:
```
SaveCoordinator: Saving 1 blocks for document 2841e61d-358b-48c8-99c4-a4e63d791ff0
SaveCoordinator: Partial save - saved 0/1 blocks
SaveCoordinator: Failed to save document Error: Failed to save 1 blocks
SaveCoordinator: Max retries reached, abandoning save
SaveCoordinator: Saved backup to localStorage
```

### Root Cause Analysis:
The mismatch appears to be between:
- Frontend sends blocks with `data` field: `{id: "...", type: "version-track", data: {...}}`
- Database expects `metadata` column for JSON data
- RPC function may not be mapping fields correctly

## What We Need

### Requirements:
1. **Atomic batch save** - All blocks save or none (prevent partial saves)
2. **Conflict resolution** - Handle concurrent edits gracefully
3. **Change detection** - Only save actual changes, not initialization
4. **Performance** - Handle documents with 100+ blocks efficiently
5. **Reliability** - Retry logic, network failure handling
6. **Real-time sync** - Multiple tabs/users editing same document

### Questions for the Expert:

1. **Best Practice Pattern**: What's the industry-standard way to implement autosave for a block-based editor (like Notion) using Supabase in 2024/2025?

2. **RPC Function Design**: How should the atomic_save_blocks function be structured to handle:
   - Field mapping (data → metadata)
   - ON CONFLICT resolution
   - Return proper affected row count
   - Handle both INSERT and UPDATE cases

3. **Frontend Architecture**: Should we:
   - Use Supabase's built-in `.upsert()` with batch operations?
   - Stick with RPC for atomic guarantees?
   - Implement optimistic updates with React 19's useOptimistic?
   - Use Supabase Realtime for sync?

4. **Change Detection**: Best way to detect and prevent:
   - Initialization saves (when component mounts)
   - Duplicate saves (same data)
   - Race conditions (multiple save paths)

5. **Error Recovery**: How to handle:
   - Network failures gracefully
   - Partial save failures
   - Conflict resolution
   - Offline mode

## Code Context

### Current SaveCoordinator.saveDocument method:
```javascript
async saveDocument(documentId, blocks) {
  const blocksData = blocks.map(({ blockId, changes }) => ({
    id: blockId,
    ...changes  // This spreads fields like 'data', 'type', 'content'
  }));
  
  const { data, error } = await this.supabase
    .rpc('atomic_save_blocks', {
      p_document_id: documentId,
      p_blocks: blocksData
    });
    
  if (data && !data.success) {
    throw new Error(`Failed to save ${data.error_count} blocks`);
  }
}
```

### Example block being saved:
```json
{
  "id": "217360cc-4b3c-4bb5-959a-6e74195c4fd4",
  "type": "version-track",
  "content": "",
  "data": {
    "version": 1,
    "title": "Version 1.0"
  }
}
```

## Specific Help Needed

Please provide:
1. **Working RPC function** that properly handles the field mapping and returns correct saved count
2. **Best practice frontend pattern** for autosave with Supabase
3. **Example code** showing proper implementation
4. **Alternative approach** if our SaveCoordinator pattern is fundamentally flawed

## Additional Context
- We previously had race conditions with multiple save paths
- The SaveCoordinator was meant to be single source of truth (like Notion uses)
- We need to maintain good UX with no save buttons
- Document can have 20-200 blocks typically
- Using React 19's latest features is preferred

Please provide production-ready, battle-tested solutions rather than theoretical approaches. We need something that works reliably at scale.