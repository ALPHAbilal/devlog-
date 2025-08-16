# Document Sharing Issue - Expert AI Research Prompt

## Problem Summary
We have a document sharing feature in a Supabase-based application (DevLog) that's failing with "Document not found or has been deleted" error when users try to access shared documents via public share links.

## Technical Context

### Application Overview
- **DevLog**: A developer documentation tool built with React + Supabase
- **Core Feature**: Users can create documents with blocks of content
- **Sharing Feature**: Users can share documents via unique share codes (e.g., `/shared/ABC123`)

### Database Schema

#### Key Tables:
1. **documents** - Stores user documents
   - id (UUID)
   - user_id (UUID) - owner of the document
   - title, tags, metadata, etc.
   - deleted_at (soft delete)

2. **blocks** - Stores document content blocks
   - id (UUID)
   - document_id (UUID)
   - content, type, position, etc.

3. **document_shares** - Stores share configurations
   - id (UUID)
   - document_id (UUID)
   - share_code (TEXT) - unique code like "ABC123"
   - share_type ('link', 'user', 'public')
   - permissions (ARRAY) - ['view', 'comment', 'edit']
   - is_active (BOOLEAN)
   - expires_at (TIMESTAMPTZ)

### Current Issue

#### What Works:
1. Creating shares successfully generates share records in `document_shares` table
2. Share validation (`checkShareAccess`) correctly identifies valid shares
3. Share URLs are generated correctly

#### What Fails:
When accessing a shared document:
1. `checkShareAccess` succeeds and returns `has_access: true`
2. But `getSharedDocument` fails when trying to fetch the actual document content
3. Error: "Document not found or has been deleted"

### Root Cause Analysis
The issue is caused by Row Level Security (RLS) policies:

**Current RLS on documents table:**
```sql
-- Only allows users to see their OWN documents
CREATE POLICY "Users can view their own non-deleted documents"
ON documents FOR SELECT
USING (user_id = auth.uid() AND deleted_at IS NULL);
```

This means:
- User A creates a document
- User A shares it with User B (or publicly)
- When User B (or anonymous user) tries to view it, RLS blocks access
- Even though the share is valid, the document query returns empty

### Current Code Flow
```javascript
// shareService.js - getSharedDocument method
1. checkShareAccess(shareCode) // ✓ Works - validates share
2. supabase.from('documents').select().eq('id', documentId) // ✗ Fails - RLS blocks
3. supabase.from('blocks').select().eq('document_id', documentId) // ✗ Fails - RLS blocks
```

## Requirements for Solution

### Must Have:
1. **Security**: Only allow document access through valid shares
2. **Performance**: Solution should be efficient for large-scale use
3. **Compatibility**: Work with existing share validation logic
4. **Anonymous Access**: Support viewing shared documents without login
5. **Permissions**: Respect share permissions (view-only, edit, etc.)

### Nice to Have:
1. Clean, maintainable code
2. Minimal database changes
3. Good error messages for debugging

## Possible Solution Approaches

### Option 1: RLS Policy Update
Update RLS to allow viewing documents that have valid shares

### Option 2: SECURITY DEFINER Functions
Create PostgreSQL functions that bypass RLS for shared document access

### Option 3: Service Role Key
Use Supabase service role (bypasses RLS) for shared document queries

### Option 4: Proxy Table/View
Create a view or proxy table specifically for shared document access

## Question for AI Expert
Given this context and the constraints of Supabase's architecture, what's the best approach to implement secure document sharing that:
1. Maintains security (no unauthorized access)
2. Works for both authenticated and anonymous users
3. Is performant and scalable
4. Follows Supabase best practices

Please provide:
1. Recommended approach with rationale
2. Example implementation code
3. Any security considerations
4. Performance implications

## Additional Context
- We're using Supabase's JavaScript client library
- The app is client-side only (no backend server)
- We need to support password-protected shares
- Share analytics (view tracking) is implemented via `share_access_logs` table