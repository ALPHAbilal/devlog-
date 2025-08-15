# GitHub AI Expert - Critical Follow-up Request

Thank you for the excellent findings! I need the **most critical pieces** to fix our immediate issue.

## URGENT: Our Specific Problem
Our blocks have a `data` field but PostgreSQL table uses `metadata` column:
```javascript
// Frontend sends:
{ id: "xyz", type: "version-track", content: "", data: {version: 1} }

// But blocks table has:
metadata (jsonb) column, not data
```

## Critical Questions (Priority Order)

### 1. Field Mapping Solution
In the repos you found (konstantinmuenster/notion-clone, makenotion/notion-clone):
- Do they use `data` or `metadata` column in their blocks table?
- How do they map frontend fields to database columns?
- Show the EXACT mapping code from SaveManager to database

### 2. Working RPC Function
The `bulk_upsert_blocks` you showed - please provide the COMPLETE version that:
- Maps `data` field to `metadata` column
- Handles ALL block fields (type, content, position, metadata/data)
- Returns proper count (your example only had id, document_id, content)

Example fix needed:
```sql
-- Need this mapping:
SELECT 
  (value->>'id')::uuid,
  value->>'type',  -- was missing
  value->>'content',
  value->'data' as metadata,  -- KEY: map data to metadata column
  (value->>'position')::int  -- was missing
```

### 3. SaveManager Integration
From konstantinmuenster/notion-clone SaveManager:
- How does `saveBlocksBatch` prepare the blocks array?
- Does it rename fields before sending to RPC?
- Show the exact transformation code

### 4. Quick Yes/No Answers
- Do ANY of these repos handle data→metadata mapping? (Y/N)
- Do they ALL use simple INSERT ON CONFLICT? (Y/N)  
- Any use separate UPDATE vs INSERT detection? (Y/N)
- Best repo for our exact use case? (name only)

## What I Can Find Myself
Don't include:
- Full file contents (I'll browse repos)
- Architecture explanations
- Import statements
- Error handling code

## Most Important
**Give me the EXACT code snippet that maps frontend block fields to database columns**, whether it's in JavaScript or SQL. This is the #1 blocker.

If you found a repo that already solved the data→metadata mapping issue, just tell me which file/line to look at.

Thank you!