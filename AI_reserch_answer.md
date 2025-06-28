# Supabase Data Deletion Issue - Expert Analysis and Solutions

## Root Cause Analysis

Your **delete-then-insert pattern is fundamentally flawed** when working with Supabase and RLS, creating multiple points of failure that explain your data loss symptoms. The core issue stems from several interconnected problems:

### 1. The Delete-Then-Insert Anti-Pattern

The current approach of deleting all blocks before inserting new ones is inherently dangerous because it creates a **destructive window** where data is permanently lost if anything goes wrong during the insert phase[1][2]. This pattern becomes especially problematic when:

- The `blocks` array is empty or undefined
- RLS policies prevent the insert operation after the delete succeeds
- Network issues occur between delete and insert operations
- Race conditions arise from rapid save operations

### 2. RLS Policy Complications

Your RLS policies create additional complexity with the delete-then-insert pattern. When using Supabase's delete operation with RLS enabled, **only rows visible through SELECT policies are deleted**[2]. This means:

- The delete operation might succeed but not delete the intended rows
- Subsequent inserts may fail if RLS policies are misconfigured
- `auth.uid()` returning NULL can cause both delete and insert operations to fail[3][4][5]

### 3. Cascade Delete Interactions

Your foreign key constraint `ON DELETE CASCADE` means that when documents are deleted, blocks are automatically removed. However, this doesn't interact well with your manual delete-then-insert pattern, potentially creating **timing issues** between the cascade operation and your explicit block deletion[6].

## Technical Issues Identified

### Auth Token Problems

The most critical issue is likely related to **JWT token handling**. Multiple sources indicate that `auth.uid()` returning NULL is a common problem that can cause both deletes and inserts to fail[3][4][5][7]. This happens when:

- The JWT token expires during the save operation
- The session is not properly maintained between operations
- The client loses authentication state during async operations

### Race Conditions in React

Your React application's async save operations are susceptible to **race conditions**[8][9] where:

- Multiple save operations execute simultaneously
- Component state updates occur before saves complete
- Optimistic updates mask underlying save failures

## Recommended Solutions

### 1. Implement UPSERT Strategy (Recommended)

Replace the delete-then-insert pattern with **Supabase's native UPSERT functionality**[10][11][12]:

```javascript
async saveDocument(document) {
  const { blocks, ...docData } = document;
  
  // 1. Save/update document metadata
  const { data: savedDoc, error: docError } = await supabase
    .from('documents')
    .upsert(docData)
    .select()
    .single();
  
  if (docError) throw docError;
  
  // 2. UPSERT blocks instead of delete-then-insert
  if (blocks && blocks.length > 0) {
    const blocksToSave = blocks.map((block, index) => ({
      ...this.transformBlockToDB(block, savedDoc.id, index),
      // Ensure we have a unique constraint for upsert
      document_id: savedDoc.id,
      position: index
    }));
    
    const { error: blocksError } = await supabase
      .from('blocks')
      .upsert(blocksToSave, {
        onConflict: 'document_id,position' // or use a composite unique constraint
      });
    
    if (blocksError) throw blocksError;
  }
}
```

**Benefits of UPSERT:**
- **Atomic operations** that either fully succeed or fail
- **No data loss window** during the operation
- **Better performance** compared to delete-then-insert[13]
- **Simpler error handling** and recovery

### 2. Use Database Functions for Complex Operations (Alternative)

For more complex scenarios, implement **security definer functions**[14][15][16] that handle the entire save operation within the database:

```sql
CREATE OR REPLACE FUNCTION save_document_with_blocks(
  doc_data JSONB,
  blocks_data JSONB[]
)
RETURNS TABLE(document_id UUID, blocks_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  saved_doc_id UUID;
BEGIN
  -- Upsert document
  INSERT INTO documents (id, user_id, title, tags, is_template, updated_at)
  VALUES (
    (doc_data->>'id')::UUID,
    auth.uid(),
    doc_data->>'title',
    ARRAY(SELECT jsonb_array_elements_text(doc_data->'tags')),
    (doc_data->>'is_template')::BOOLEAN,
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    tags = EXCLUDED.tags,
    is_template = EXCLUDED.is_template,
    updated_at = NOW()
  RETURNING id INTO saved_doc_id;
  
  -- Delete existing blocks for this document
  DELETE FROM blocks WHERE document_id = saved_doc_id;
  
  -- Insert new blocks
  INSERT INTO blocks (document_id, user_id, type, content, position, metadata)
  SELECT 
    saved_doc_id,
    auth.uid(),
    (block_data->>'type')::TEXT,
    block_data->>'content',
    (block_data->>'position')::INTEGER,
    block_data->'metadata'
  FROM unnest(blocks_data) AS block_data;
  
  RETURN QUERY SELECT saved_doc_id, array_length(blocks_data, 1);
END;
$$;
```

This approach provides **true transactional safety** with automatic rollback if any step fails[17][18][19].

### 3. Implement Proper Error Handling and Race Condition Prevention

Add **comprehensive error handling** and **race condition protection**:

```javascript
class SupabaseAdapter {
  constructor() {
    this.saveQueue = new Map(); // Prevent concurrent saves per document
  }
  
  async saveDocument(document) {
    const documentId = document.id;
    
    // Prevent concurrent saves for the same document
    if (this.saveQueue.has(documentId)) {
      await this.saveQueue.get(documentId);
    }
    
    const savePromise = this._performSave(document);
    this.saveQueue.set(documentId, savePromise);
    
    try {
      const result = await savePromise;
      return result;
    } finally {
      this.saveQueue.delete(documentId);
    }
  }
  
  async _performSave(document) {
    // Verify authentication before saving
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication required for save operation');
    }
    
    // Implement your UPSERT logic here
    // ... (UPSERT code from above)
  }
}
```

### 4. Optimize RLS Policies

Ensure your RLS policies are **properly optimized** and don't cause performance issues[1][20]:

```sql
-- Optimized policies using (SELECT auth.uid()) for performance
CREATE POLICY "Users can manage own blocks" ON blocks
  FOR ALL USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Ensure you have policies for all required operations
CREATE POLICY "Users can select own blocks" ON blocks
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own blocks" ON blocks
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own blocks" ON blocks
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own blocks" ON blocks
  FOR DELETE USING ((SELECT auth.uid()) = user_id);
```

## Best Practices for Supabase with RLS

### 1. Authentication Management
- **Always verify authentication** before critical operations[5][7]
- **Handle JWT token expiration** gracefully
- **Use consistent session management** across your application

### 2. Database Design
- **Implement proper unique constraints** for UPSERT operations[21]
- **Use database-level defaults** for timestamps and IDs
- **Consider soft deletes** for critical data instead of hard deletes

### 3. Performance Optimization
- **Batch operations** when possible using arrays[22][23]
- **Use database functions** for complex multi-table operations[15][17]
- **Implement proper caching strategies** to reduce save frequency

## Migration Strategy

To migrate from your current implementation:

1. **Add unique constraints** to the blocks table for UPSERT support
2. **Implement the UPSERT approach** in a new save method
3. **Test thoroughly** with your existing data
4. **Gradually migrate** components to use the new save method
5. **Monitor for race conditions** and authentication issues

The **UPSERT approach is strongly recommended** as it eliminates the fundamental data loss risks of the delete-then-insert pattern while providing better performance and simpler error handling. Combined with proper authentication management and race condition prevention, this solution will resolve your data deletion issues and provide a more robust document management system.

[1] https://supabase.com/docs/guides/database/postgres/row-level-security
[2] https://supabase.com/docs/reference/javascript/delete
[3] https://www.reddit.com/r/Supabase/comments/1komon8/need_clarity_on_external_jwt_provider_support/
[4] https://www.reddit.com/r/Supabase/comments/1iwxbf9/authuid_returning_null/
[5] https://github.com/orgs/supabase/discussions/6592
[6] https://dorsetrigs.org.uk/post/supabase-linked-tables-foreign-key-violation
[7] https://github.com/orgs/supabase/discussions/27193
[8] https://www.reddit.com/r/reactjs/comments/op67d8/react_patterns_for_async_race_conditions/
[9] https://learnersbucket.com/examples/interview/handle-race-condition-in-react/
[10] https://dev.to/mwoollen/supabase-upsert-1ebc
[11] https://velog.io/@kim9567/Supabase-Upsert
[12] https://app.studyraid.com/en/read/12469/403024/handling-upsert-operations
[13] https://dba.stackexchange.com/questions/246990/postgres-upsert-performance-considerations-millions-of-rows-hour
[14] https://blog.entrostat.com/supabase-rls-functions/
[15] https://supabase.com/docs/guides/database/functions
[16] https://thelinuxcode.com/postgres-security-definer/
[17] https://www.reddit.com/r/Supabase/comments/1hz9l0p/how_to_handle_transactions_and_rollbacks_in/
[18] https://stackoverflow.com/questions/77052193/transactions-in-supabase
[19] https://github.com/supabase/supabase-dart/issues/60
[20] https://procodebase.com/article/mastering-row-level-security-and-policies-in-supabase
[21] https://stackoverflow.com/questions/75247517/supabase-upsert-multiple-onconflict-constraints
[22] https://bootstrapped.app/guide/how-to-perform-batch-operations-in-supabase
[23] https://github.com/orgs/supabase/discussions/11349
[24] https://github.com/supabase/realtime/issues/1114
[25] https://stackoverflow.com/questions/78770969/how-can-i-fix-this-rls-policy-issue-with-supabase-on-insert
[26] https://www.reddit.com/r/Supabase/comments/12zfn6p/supabase_error_new_row_violates_rowlevel_security/
[27] https://dev.to/asheeshh/mastering-supabase-rls-row-level-security-as-a-beginner-5175
[28] https://prosperasoft.com/blog/database/how-to-manage-row-level-security-policies-effectively-in-supabase/
[29] https://github.com/orgs/supabase/discussions/526
[30] https://community.weweb.io/t/bulk-update-supabase/15224
[31] https://bootstrapped.app/guide/how-to-perform-transactional-operations-in-supabase
[32] https://app.studyraid.com/en/read/12469/403023/deleting-records
[33] https://bootstrapped.app/guide/how-to-handle-distributed-transactions-in-supabase
[34] https://supabase.com/docs/guides/troubleshooting/do-i-need-to-expose-security-definer-functions-in-row-level-security-policies-iI0uOw
[35] https://www.reddit.com/r/Supabase/comments/1aw1jqo/docs_confusing_me_about_security_definer_functions/
[36] https://stackoverflow.com/questions/69261986/possible-to-restrict-postgresql-security-definer-function-to-rls-use
[37] https://stackoverflow.com/questions/78203777/supabase-is-it-possible-to-return-data-from-multiple-tables-no-reference-or-f
[38] https://dev.to/wagenrace/combining-multiple-tables-in-supabase-212o
[39] https://dba.stackexchange.com/questions/8028/whats-better-for-large-changes-to-a-table-delete-and-insert-every-time-or-upd
[40] https://community.weweb.io/t/supabase-auth-auth-uid-doesnt-work-but-user-id-does/4246
[41] https://libreddit.in.projectsegfau.lt/r/Supabase/comments/1iwxbf9/authuid_returning_null/
[42] https://github.com/supabase-community/supabase-csharp/discussions/115
[43] https://linuxhint.com/security-definer-functions-postgresql/
[44] https://github.com/orgs/supabase/discussions/1548
[45] https://github.com/orgs/supabase/discussions/3563
[46] https://stackoverflow.com/questions/77219866/issue-with-row-level-security-in-supabase
----------------------
### Key Points
- It seems likely that the "delete-then-insert" pattern is causing data loss, especially when blocks are empty or not loaded, due to race conditions and lack of transaction safety.
- Research suggests using UPSERT or transactions for updating related records in Supabase with RLS to ensure data integrity and prevent loss.
- The evidence leans toward implementing a PostgreSQL function for atomic operations, which could improve performance and reliability.

---

### Direct Answer

#### Overview
Your document management application, Journey Log Compass, is experiencing data loss issues when saving documents, likely due to the current "delete-then-insert" pattern for blocks. This approach can fail if blocks are empty, not loaded, or if there are race conditions. Here's a simple breakdown to address your concerns and suggest a robust solution.

#### Why the Current Pattern Might Fail
- **Data Loss Risk**: Deleting all blocks first and then inserting new ones can lead to loss if the insertion fails or if the blocks array is empty, leaving no blocks behind.
- **Race Conditions**: If the save operation happens before blocks are fully loaded, it might delete existing data without re-inserting, causing empty documents after reload.
- **RLS and Transactions**: Row Level Security (RLS) might block operations if user IDs don't match, and without transactions, partial failures can occur, leading to inconsistent states.

#### Best Practices for Supabase with RLS
- **Use Transactions**: Implement a PostgreSQL function to handle both deletion and insertion in a single transaction, ensuring either both succeed or both fail, preventing data loss. For example, use `supabase.rpc` to call a function that wraps these operations.
- **Consider UPSERT**: Instead of deleting all blocks, use UPSERT to update existing blocks and insert new ones, preserving data unless explicitly removed. This requires tracking block IDs.
- **Batch Operations**: For performance, batch updates can help, but ensure they are wrapped in transactions to maintain consistency.

#### Recommended Save Strategy
- Create a PostgreSQL function, like `save_document_blocks`, that deletes existing blocks and inserts new ones atomically. For instance:
  ```sql
  CREATE OR REPLACE FUNCTION save_document_blocks(doc_id UUID, blocks JSONB)
  RETURNS VOID AS $$
  BEGIN
    DELETE FROM blocks WHERE document_id = doc_id;
    INSERT INTO blocks (id, document_id, user_id, type, content, position, metadata, created_at)
    SELECT COALESCE((b->>'id')::UUID, gen_random_uuid()), doc_id, auth.uid(), b->>'type', b->>'content', (b->>'position')::INTEGER, (b->>'metadata')::JSONB, NOW()
    FROM jsonb_array_elements(blocks) AS b;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Call this function from your JavaScript code using `supabase.rpc`, ensuring atomic operations and better error handling.

#### Supabase-Specific Gotchas
- Ensure `user_id` is correctly set in blocks to comply with RLS policies, as mismatches can block insertions.
- Watch for JWT token expiration, though Supabase typically handles refreshes; ensure saves complete within token validity.
- Be aware that CASCADE deletes on the foreign key won't affect this scenario, as you're deleting blocks directly.

This approach should prevent data loss, improve reliability, and maintain performance, especially with frequent saves.

---

### Survey Note: Detailed Analysis and Recommendations

#### Introduction
This analysis addresses the data deletion issue in your Journey Log Compass application, built with React 19, Supabase, and Row Level Security (RLS). The application manages documents and blocks in a one-to-many relationship, and the current save logic, which deletes all blocks before re-inserting, is causing data loss. This note provides a comprehensive examination of the problem, potential causes, and a recommended solution, ensuring data integrity and performance with Supabase and RLS.

#### Problem Analysis
The current implementation in `SupabaseAdapter.js` follows a "delete-then-insert" pattern for saving document blocks:
- First, it deletes all existing blocks for the document using `.delete().eq('document_id', savedDoc.id)`.
- Then, it inserts new blocks if the `blocks` array is non-empty, mapping them via `transformBlockToDB`.

This approach has several risks:
- **Data Loss Scenarios**: If the `blocks` array is empty or undefined (e.g., due to race conditions where blocks haven't loaded yet), the deletion occurs, but no insertion happens, leaving the document empty. This aligns with symptoms like documents appearing empty after reload and SQL queries showing only one block for multiple documents.
- **Race Conditions**: Multiple save operations or concurrent UI updates (e.g., optimistic updates with a 5-second cache) can lead to inconsistent states, where one save deletes blocks before another can insert, resulting in data loss.
- **Error Handling**: The code captures `blocksError` during insertion, but without explicit error handling shown, failures might go unnoticed, exacerbating data loss.

#### RLS and Supabase Considerations
RLS is enabled on both `documents` and `blocks` tables, with policies likely ensuring operations are restricted to the authenticated user's data (e.g., `auth.uid() = user_id`). The schema includes:
- `documents` table with `user_id` referencing `auth.users`.
- `blocks` table with `document_id` (ON DELETE CASCADE) and `user_id`, ensuring blocks are tied to both documents and users.

Potential RLS-related issues include:
- Insertions failing if `user_id` in blocks doesn't match `auth.uid()`, though the code likely sets this via `transformBlockToDB`.
- Deletions succeeding but insertions being blocked, leading to the observed empty state.

However, given the policies (e.g., "Users can insert own documents" with `WITH CHECK (auth.uid() = user_id)`), and assuming `user_id` is correctly set, RLS shouldn't be the primary issue. The CASCADE delete on `document_id` is irrelevant here, as we're deleting blocks directly, not documents.

#### Investigating Potential Causes
1. **Empty Blocks Array**: If `blocks` is empty during save (e.g., component not loaded), deletion happens without re-insertion, causing loss. This is likely a timing issue, as mentioned in symptoms.
2. **Insertion Failures**: Errors during `.insert(blocksToSave)` might not be handled, leading to silent failures post-deletion. This could be due to invalid data, RLS violations, or network issues.
3. **JWT Token Expiration**: While Supabase handles token refresh, if a save operation spans token expiration, it might fail, though this is less likely given typical session durations.
4. **Concurrent Operations**: Multiple saves (e.g., rapid UI updates) could interfere, with one delete overwriting another's insert, leading to data loss.

#### Best Practices for Supabase with RLS
Supabase documentation ([Supabase Best Practices](https://supabase.com/docs/guides/best-practices)) recommends:
- Using transactions for related operations to ensure atomicity, especially with RLS.
- Leveraging PostgreSQL functions for complex operations, marked as `SECURITY DEFINER` for privilege elevation, though RLS still applies.
- Optimizing RLS policies with `SELECT auth.uid()` for better performance, as noted in user context.

For updating related records (documents and blocks):
- **Transactions**: Ensure deletion and insertion are atomic to prevent partial failures. This can be achieved via PostgreSQL functions called with `supabase.rpc`.
- **Batch Operations**: For performance, batch updates are fine, but wrap them in transactions to maintain consistency.
- **UPSERT**: Instead of delete-then-insert, use `.upsert()` to update existing blocks and insert new ones, preserving data unless explicitly removed. This requires block IDs to be tracked.

#### Recommended Solution: Atomic Save Strategy
To address data loss and improve reliability, implement a PostgreSQL function for atomic operations:
- Create a function `save_document_blocks` that deletes existing blocks and inserts new ones in a single transaction:
  ```sql
  CREATE OR REPLACE FUNCTION save_document_blocks(doc_id UUID, blocks JSONB)
  RETURNS VOID AS $$
  BEGIN
    DELETE FROM blocks WHERE document_id = doc_id;
    INSERT INTO blocks (id, document_id, user_id, type, content, position, metadata, created_at)
    SELECT 
      COALESCE((b->>'id')::UUID, gen_random_uuid()),
      doc_id,
      auth.uid(),
      b->>'type',
      b->>'content',
      (b->>'position')::INTEGER,
      (b->>'metadata')::JSONB,
      NOW()
    FROM jsonb_array_elements(blocks) AS b;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Call this function from JavaScript:
  ```javascript
  const blocksToSave = blocks.map((block, index) => ({
    id: block.id || null,
    type: block.type,
    content: block.content,
    position: index,
    metadata: block.metadata
  }));
  const { error } = await supabase.rpc('save_document_blocks', {
    doc_id: savedDoc.id,
    blocks: blocksToSave
  });
  if (error) {
    console.error('Save failed:', error);
    // Handle error, e.g., notify user
  }
  ```
- This ensures atomicity: if insertion fails, the deletion is rolled back, preventing data loss. It also improves performance by reducing round-trips and handles RLS by setting `user_id = auth.uid()`.

#### Alternative Approaches
- **Diff-Based Updates**: Compute differences (new, updated, deleted blocks) and perform targeted operations. This is more complex but efficient for large datasets:
  - Insert new blocks (no ID).
  - Update existing blocks (match by ID).
  - Delete removed blocks (not in current array).
- **Soft Deletes**: Instead of hard deletes, mark blocks as deleted with a flag, allowing recovery. This requires schema changes (e.g., `is_deleted BOOLEAN`) and RLS updates.
- **Versioning**: Add a version column to documents, ensuring saves apply to the latest version, preventing race conditions. This adds complexity but enhances consistency.

#### Performance and Scalability
- The proposed function is efficient for small to medium block counts, as it's a single database call. For large datasets, consider indexing `document_id` on the `blocks` table for faster deletes.
- Batch operations via the function handle multiple blocks in one go, reducing network overhead compared to individual inserts.

#### Supabase-Specific Gotchas
- Ensure `pgcrypto` extension is enabled for `gen_random_uuid()`, which is typically the case in Supabase.
- Monitor JWT token validity; while Supabase handles refreshes, ensure save operations complete within session limits (e.g., 60 minutes default).
- RLS policies must allow the operations; verify `user_id` matches `auth.uid()` in all cases, especially for insertions.

#### Conclusion
The "delete-then-insert" pattern is likely failing due to race conditions, empty blocks, and lack of transaction safety. Implementing a PostgreSQL function for atomic saves, as outlined, ensures data integrity, leverages Supabase's transaction support, and aligns with best practices for RLS. For future scalability, consider diff-based updates or versioning, depending on your application's needs. This solution should resolve the data loss issue while maintaining performance, as of June 28, 2025.