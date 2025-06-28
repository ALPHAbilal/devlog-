# Supabase Data Deletion Issue - Expert Analysis Request

## Context
I'm building a document management application called Journey Log Compass using React 19, Supabase, and Row Level Security (RLS). The app allows users to create documents with blocks (similar to Notion). We're experiencing a critical issue where document data gets deleted instead of saved.

## Technical Stack
- **Frontend**: React 19 with hooks
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage Pattern**: Documents table + Blocks table (one-to-many relationship)

## Database Schema
```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  tags TEXT[],
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Blocks table
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT,
  content TEXT,
  position INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ
);

-- RLS is enabled on both tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
```

## The Save Logic Issue

### Current Implementation (SupabaseAdapter.js - saveDocument method):
```javascript
async saveDocument(document) {
  const { blocks, ...docData } = document;
  
  // 1. Save/update document metadata
  // ... (works fine)
  
  // 2. DELETE ALL EXISTING BLOCKS
  const { error: deleteError } = await supabase
    .from('blocks')
    .delete()
    .eq('document_id', savedDoc.id);
  
  // 3. Insert new blocks
  if (blocks && blocks.length > 0) {
    const blocksToSave = blocks.map((block, index) => 
      this.transformBlockToDB(block, savedDoc.id, index)
    );
    
    const { error: blocksError } = await supabase
      .from('blocks')
      .insert(blocksToSave);
  }
}
```

## The Problem
When saving a document, we:
1. Delete ALL existing blocks for that document
2. Then re-insert the blocks from the current state

This "delete-then-insert" pattern causes data loss when:
- The blocks array is empty or undefined
- The component hasn't loaded the blocks yet
- There's a race condition between loading and saving

## Previous Fix Attempt
We implemented individual document saves instead of batch saves, but the core issue remains: the destructive delete-then-insert pattern.

## Current Symptoms
- Changes appear to save (console logs confirm)
- After page reload, documents are empty
- SQL queries show only 1 block exists for 4 documents
- The save operation deletes blocks but doesn't re-insert them

## RLS Policies (Potential Factor?)
```sql
-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Blocks policies (similar pattern)
```

## Questions for Investigation

1. **Is the delete-then-insert pattern appropriate for Supabase with RLS?**
   - Should we use UPSERT instead?
   - Are there RLS implications we're missing?

2. **Are there Supabase-specific best practices we should follow?**
   - Transaction support?
   - Batch operations?
   - RLS and CASCADE deletes interaction?

3. **Could the issue be related to:**
   - JWT token expiration during save?
   - RLS policies blocking the insert after delete?
   - Timing issues with Supabase's response?

4. **Better approaches:**
   - Should we diff blocks and only update changed ones?
   - Use Supabase's UPSERT with conflict resolution?
   - Implement soft deletes instead of hard deletes?

## Code Context
- Full SupabaseAdapter.js: `/mnt/c/Users/MYC/Desktop/journey-log-compass/src/utils/storage/SupabaseAdapter.js`
- The app uses optimistic updates (UI updates before save completes)
- We have a 5-second cache for performance

## What We Need
Please analyze this implementation and suggest:
1. Why the delete-then-insert pattern might be failing with Supabase RLS
2. Best practices for updating related records in Supabase
3. A more robust save strategy that prevents data loss
4. Any Supabase-specific gotchas we should be aware of

## Additional Context from Supabase Docs
Based on the documentation provided, I noticed:
- RLS policies use `auth.uid()` which should be wrapped in SELECT for optimization
- CASCADE deletes are set up on the foreign key
- Supabase recommends using `security definer` functions for complex operations

Please provide a detailed analysis and recommended solution that ensures data integrity while maintaining good performance with Supabase and RLS.