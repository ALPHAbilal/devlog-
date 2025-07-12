# Comprehensive Solutions for Document Persistence in Supabase Note-Taking App

## Critical Issue: Documents disappearing after page reload

Your app faces a perfect storm of issues causing data loss: RPC parameter mismatches, missing soft delete filters, race conditions in auto-save, and lack of save confirmation. Here's how to fix each problem systematically.

## 1. Fix RPC Function Parameter Mismatch

The immediate issue is calling `get_documents_with_stats` with wrong parameters.

**Current Problem:**
```javascript
// WRONG - passing p_user_id instead of p_limit and p_offset
const { data, error } = await supabase
  .rpc('get_documents_with_stats', { p_user_id: userId });
```

**Solution:**
```javascript
// CORRECT - use proper parameters
const { data, error } = await supabase
  .rpc('get_documents_with_stats', { 
    p_limit: 100,
    p_offset: 0 
  });

// If you need user filtering, modify the RPC function or use a different approach
const { data, error } = await supabase
  .from('documents')
  .select('*, stats:document_stats(*)')
  .eq('user_id', userId)
  .is('deleted_at', null)
  .order('updated_at', { ascending: false });
```

## 2. Add Soft Delete Filter to Fallback Query

**Current Problem:** Fallback query doesn't filter `deleted_at IS NULL`, showing deleted documents.

**Solution:**
```javascript
// Add soft delete filter to all document queries
const fetchDocuments = async (userId) => {
  try {
    // Primary query with RPC
    const { data, error } = await supabase
      .rpc('get_documents_with_stats', { p_limit: 100, p_offset: 0 });
    
    if (error) throw error;
    return data;
  } catch (rpcError) {
    // Fallback query WITH soft delete filter
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)  // Critical: filter soft-deleted documents
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
```

## 3. Prevent Race Conditions in Auto-Save

The core issue: documents save asynchronously while UI updates immediately, causing data loss on reload.

### Solution A: Queued Mutations Pattern

```javascript
// Implement a save queue to prevent race conditions
class SaveQueue {
  constructor(supabase) {
    this.queue = [];
    this.processing = false;
    this.supabase = supabase;
  }

  async enqueue(document) {
    return new Promise((resolve, reject) => {
      this.queue.push({ document, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const { document, resolve, reject } = this.queue.shift();

    try {
      // Save to Supabase with retry logic
      const { data, error } = await this.supabase
        .from('documents')
        .upsert({
          ...document,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      resolve(data);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      this.process(); // Process next item
    }
  }
}
```

### Solution B: Optimistic Locking with Version Control

```javascript
// Prevent concurrent modifications with version tracking
const saveDocumentWithLock = async (document, expectedVersion) => {
  const { data, error } = await supabase
    .from('documents')
    .update({
      ...document,
      version: expectedVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', document.id)
    .eq('version', expectedVersion) // Only update if version matches
    .select()
    .single();

  if (error || !data) {
    throw new Error('Document was modified by another operation');
  }

  return data;
};
```

### Solution C: Write-Ahead Logging Pattern

```javascript
// Log operations before applying them
class DocumentWAL {
  constructor() {
    this.operations = [];
  }

  async logOperation(operation) {
    // 1. Add to local storage immediately
    const entry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      operation,
      status: 'pending'
    };
    
    this.operations.push(entry);
    await this.persistToIndexedDB(entry);
    
    // 2. Apply to UI immediately
    this.applyToUI(operation);
    
    // 3. Sync to Supabase asynchronously
    this.syncToSupabase(entry);
  }

  async syncToSupabase(entry) {
    try {
      const result = await this.executeOperation(entry.operation);
      entry.status = 'completed';
      await this.updateIndexedDB(entry);
    } catch (error) {
      entry.status = 'failed';
      entry.error = error;
      await this.scheduleRetry(entry);
    }
  }
}
```

## 4. Implement Save Status Confirmation

### Complete Save Status System

```javascript
// React hook for save status management
function useSaveStatus() {
  const [saveState, setSaveState] = useState({
    status: 'idle', // idle | pending | saving | saved | error
    lastSaved: null,
    error: null
  });
  
  const [pendingOps, setPendingOps] = useState(new Set());

  const trackOperation = useCallback((promise) => {
    const opId = Date.now();
    setPendingOps(prev => new Set([...prev, opId]));
    setSaveState(prev => ({ ...prev, status: 'saving' }));

    promise
      .then(() => {
        setSaveState({
          status: 'saved',
          lastSaved: new Date(),
          error: null
        });
      })
      .catch(error => {
        setSaveState({
          status: 'error',
          lastSaved: null,
          error: error.message
        });
      })
      .finally(() => {
        setPendingOps(prev => {
          const next = new Set(prev);
          next.delete(opId);
          return next;
        });
      });
  }, []);

  // Prevent page unload with pending operations
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingOps.size > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes!';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingOps.size]);

  return { saveState, trackOperation, hasPendingOps: pendingOps.size > 0 };
}
```

### Visual Save Status Component

```jsx
function SaveStatusIndicator({ saveState }) {
  const getStatusDisplay = () => {
    switch (saveState.status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Spinner className="w-4 h-4" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckIcon className="w-4 h-4" />
            <span className="text-sm">
              Saved {formatRelativeTime(saveState.lastSaved)}
            </span>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertIcon className="w-4 h-4" />
            <span className="text-sm">Save failed</span>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {getStatusDisplay()}
    </div>
  );
}
```

## 5. Complete Bulletproof Auto-Save Implementation

Here's a production-ready implementation combining all solutions:

```javascript
// Complete auto-save system with all fixes
class BulletproofAutoSave {
  constructor(supabase) {
    this.supabase = supabase;
    this.saveQueue = new SaveQueue(supabase);
    this.pendingChanges = new Map();
    this.saveTimeout = null;
  }

  // Debounced save with 1-second delay
  scheduleAutoSave(document) {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Store pending changes
    this.pendingChanges.set(document.id, document);

    // Schedule save
    this.saveTimeout = setTimeout(() => {
      this.executeSave();
    }, 1000);
  }

  async executeSave() {
    const documents = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();

    for (const doc of documents) {
      try {
        // Add to save queue
        await this.saveQueue.enqueue(doc);
      } catch (error) {
        console.error('Save failed:', error);
        // Re-add to pending for retry
        this.pendingChanges.set(doc.id, doc);
      }
    }
  }

  // Force save all pending changes (for beforeunload)
  async forceSaveAll() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.executeSave();
  }
}
```

## 6. Supabase RLS Best Practices

### Fix auth.uid() Consistency Issues

```sql
-- Robust RLS policies that handle edge cases
CREATE POLICY "users_can_read_own_documents" ON documents
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL 
  AND (SELECT auth.uid()) = user_id
  AND deleted_at IS NULL
);

CREATE POLICY "users_can_create_documents" ON documents
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
);

CREATE POLICY "users_can_update_own_documents" ON documents
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add index for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
```

### Prevent Service Role Infection

```javascript
// Use separate clients for different purposes
const createSupabaseClients = () => {
  // User client for auth operations
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Service client for admin operations (server-side only)
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      } 
    }
  );

  return { userClient, serviceClient };
};
```

## 7. Modern Alternative: Page Visibility API

Replace unreliable beforeunload with Page Visibility API:

```javascript
// More reliable than beforeunload, especially on mobile
function usePageVisibilitySave(saveFunction) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save immediately when page becomes hidden
        saveFunction();
        
        // Use sendBeacon for guaranteed delivery
        if (navigator.sendBeacon) {
          const data = JSON.stringify(getPendingChanges());
          navigator.sendBeacon('/api/save-documents', data);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveFunction]);
}
```

## 8. Implementation Checklist

### Immediate Fixes (Do First):
- [ ] Fix RPC function parameters
- [ ] Add soft delete filter to fallback queries
- [ ] Implement save status indicators
- [ ] Add beforeunload handler for pending saves

### Race Condition Prevention:
- [ ] Implement SaveQueue class
- [ ] Add optimistic locking with versions
- [ ] Use Page Visibility API as primary save trigger
- [ ] Add retry logic for failed saves

### RLS Policy Updates:
- [ ] Wrap auth.uid() in SELECT statements
- [ ] Add null checks for auth.uid()
- [ ] Create indexes on user_id and deleted_at
- [ ] Test policies with different auth states

### Save Confirmation UI:
- [ ] Add visual save status indicator
- [ ] Implement toast notifications for errors
- [ ] Show last saved timestamp
- [ ] Add loading states during save

### Testing Requirements:
- [ ] Test rapid document creation and reload
- [ ] Verify soft delete filtering works
- [ ] Test with slow network conditions
- [ ] Verify RLS policies with multiple users
- [ ] Test mobile browser behavior

## Summary

The document persistence issue stems from multiple interconnected problems. The key is implementing a multi-layered approach:

1. **Fix immediate bugs** (RPC parameters, soft delete filter)
2. **Prevent race conditions** with queued saves and proper state management
3. **Add visual feedback** so users know when saves are complete
4. **Use modern APIs** (Page Visibility) instead of unreliable beforeunload
5. **Implement proper RLS policies** that handle edge cases

This comprehensive solution ensures documents are never lost, even during rapid editing, page reloads, or network issues. The combination of client-side queuing, server-side validation, and visual feedback creates a bulletproof document persistence system.



--------------------------- second opiniong
### Key Points
- It seems likely that the issue of documents disappearing after a page reload is due to a combination of race conditions during save operations and incorrect RPC function calls, potentially compounded by offline sync issues with IndexedDB and Supabase.
- Research suggests fixing the RPC call by ensuring it uses only expected parameters and implementing robust offline support with IndexedDB can help, but the complexity of multi-layer storage requires careful handling.
- The evidence leans toward enhancing user feedback and ensuring immediate local storage to prevent data loss, though the exact implementation may vary based on specific app behavior.

### Understanding the Issue
Your note-taking app, built with React 19, Vite, and Supabase, faces a critical issue where newly created documents vanish after a page reload. This likely stems from asynchronous save operations not completing before the reload, combined with potential issues in how documents are fetched from Supabase, especially with the RPC function `get_documents_with_stats`. The multi-layer storage (memory cache, IndexedDB, Supabase) and features like auto-save (1-second intervals), offline support, and optimistic updates add complexity, making it crucial to ensure data persistence across all layers.

### Steps to Resolve
To address this, consider the following:
- **Fix the RPC Call:** Ensure the `get_documents_with_stats` function is called with only `p_limit` and `p_offset`, not `p_user_id`, as passing extra parameters causes it to fail and fall back to a potentially incorrect query. This should help fetch documents correctly after reload.
- **Enhance Offline Support:** Immediately save new documents to IndexedDB with a "synched" flag set to false. Upon reload, load from IndexedDB if not yet synced to Supabase, and implement a background sync process to update Supabase when online.
- **Improve User Feedback:** Add visual indicators like a "saving..." status to inform users, and use the `beforeunload` event to trigger saves, reducing the risk of data loss during reloads.
- **Ensure Fallback Query Correctness:** If the RPC fails, ensure the fallback query filters for `deleted_at IS NULL` to avoid including soft-deleted documents, maintaining data integrity.

By implementing these steps, you can create a more robust document persistence system that minimizes data loss and enhances reliability, especially during critical moments like document creation and page reloads.

---

### Survey Note: Detailed Analysis and Recommendations for Document Persistence in Supabase-Based Note-Taking App

#### Introduction
This report addresses a critical issue in a devlog note-taking application where newly created documents disappear after a page reload, impacting user experience and data reliability. The technical stack includes React 19 with Vite, Supabase (PostgreSQL) with Row Level Security (RLS), and a multi-layer storage architecture (memory cache, IndexedDB, Supabase). Key features like auto-save (1-second intervals), offline support, and optimistic updates suggest a complex system where race conditions and sync issues are likely culprits. This analysis, conducted on July 11, 2025, aims to provide a comprehensive solution to ensure bulletproof document persistence, addressing race conditions, providing clear feedback, and ensuring reliability across page reloads.

#### Problem Analysis
The issue manifests as follows: users create a document, it appears in the UI, but disappears after a page reload. Several factors contribute to this:

1. **RPC Function Parameter Mismatch:**
   - The `get_documents_with_stats` RPC function expects `p_limit` and `p_offset` but is called with an additional `p_user_id`, causing it to fail and fall back to a regular query. This mismatch likely disrupts document fetching, especially if the fallback query is not correctly configured.

2. **Missing Soft Delete Filter:**
   - The fallback query does not filter for `deleted_at IS NULL`, potentially returning soft-deleted documents. While this may not directly cause the disappearance of new documents, it could affect data integrity and retrieval accuracy.

3. **Race Condition in Save Operation:**
   - Document saves are asynchronous, using `setTimeout` and `requestIdleCallback`, with a 1-second auto-save interval. If a page reload occurs before the save completes, data may be lost, as the document might not yet be persisted to Supabase.

4. **No Save Confirmation:**
   - Lack of visual feedback means users might reload the page before auto-save completes, exacerbating data loss risks. Current workarounds like `flushSync`, defensive wrappers, and `beforeunload` handlers have been attempted but may not fully resolve the issue.

5. **Offline and Sync Issues:**
   - The multi-layer storage (Memory → IndexedDB → Supabase) suggests an offline-first approach, but if documents are not immediately saved to IndexedDB or fail to sync to Supabase, they may not persist across reloads, especially in online scenarios where Supabase is prioritized for loading.

#### Detailed Investigation
To address the user's questions and research areas, the following insights were gathered:

1. **Supabase RLS Edge Cases:**
   - Research suggests no widespread issues with RLS filtering out newly created records, but misconfigurations (e.g., incorrect `auth.uid()` usage) could cause visibility issues. Ensure RLS policies for insert and select operations correctly reference `auth.uid()` and user_id, as seen in [Supabase Documentation on Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

2. **IndexedDB to Supabase Sync Patterns:**
   - Best practices involve storing unsynched documents in IndexedDB with a "synched" flag, loading from IndexedDB upon reload if not synced, and syncing to Supabase in the background. A Reddit discussion on PWAs with Supabase highlights using IndexedDB for offline storage, storing backend IDs (`apiId`) for sync determination, and handling conflicts with CRDTs or frameworks like Verdant ([Reddit: Building a PWA with Supabase](https://www.reddit.com/r/PWA/comments/16h1vmp/building_a_pwa_with_supabase/)).

3. **Optimistic Update Patterns with Supabase:**
   - Optimistic updates involve updating the UI immediately and rolling back if the server rejects changes. A guide on implementing live data updates with Supabase recommends maintaining version control and conflict resolution strategies, such as "last write wins" ([StudyRaid: Implementing Live Data Updates](https://app.studyraid.com/en/read/8395/231601/implementing-live-data-updates)). However, Supabase lacks native optimistic update support, as noted in a GitHub discussion ([GitHub: Optimistic Updates Discussion](https://github.com/orgs/supabase/discussions/1753)), suggesting reliance on client-side implementations.

4. **Auto-Save Interval and Conflicts:**
   - A 1-second auto-save interval may be aggressive, potentially causing conflicts if multiple saves overlap. Research suggests extending to 2-5 seconds or implementing debouncing to reduce conflicts, but this must balance user experience and data loss risks.

5. **Transaction Handling in Multi-Layer Storage:**
   - Ensuring atomic transactions across memory, IndexedDB, and Supabase is challenging. Libraries like rxdb-supabase provide replication logic for two-way sync, allowing custom conflict resolution ([GitHub: rxdb-supabase](https://github.com/marceljuenemann/rxdb-supabase)), but manual implementation may require careful state management and error handling.

6. **Auth.uid() Consistency:**
   - No known issues with `auth.uid()` returning different values between requests were found, but ensure session management is robust to prevent authentication token expiration affecting RLS policies.

#### Current Workarounds and Their Limitations
The team has attempted:
- Using `flushSync` for immediate UI updates, which may help but doesn't address asynchronous save completion.
- Implementing defensive wrappers in auto-save, potentially mitigating race conditions but not ensuring persistence.
- Adding `beforeunload` handlers to save pending changes, which may not trigger in time for fast reloads or be blocked by browsers.

These workarounds suggest partial solutions but highlight the need for a more integrated approach to offline support and sync.

#### Recommended Solution
To achieve a bulletproof document persistence system that never loses user data, handles race conditions gracefully, provides clear feedback, and works reliably with page reloads, implement the following:

1. **Fix RPC Function Call:**
   - Call `get_documents_with_stats` with only `p_limit` and `p_offset`, ensuring it uses `auth.uid()` internally for user filtering. This resolves the parameter mismatch issue, as seen in [Restack: Supabase RPC Guide](https://www.restack.io/docs/supabase-knowledge-supabase-rpc-guide).

2. **Ensure Fallback Query Correctness:**
   - If the RPC fails, ensure the fallback query includes `WHERE deleted_at IS NULL` to exclude soft-deleted documents, maintaining data integrity.

3. **Implement Robust Offline Support:**
   - Store newly created documents in IndexedDB immediately with a "synched" flag set to false. Upon reload, load from IndexedDB if not synced, displaying these documents to users. Implement a background sync process to save to Supabase when online, updating the "synched" flag or removing from IndexedDB upon success. This approach aligns with offline-first patterns discussed in [PowerSync Blog](https://www.powersync.com/blog/bringing-offline-first-to-supabase).

4. **Enhance User Feedback and Race Condition Prevention:**
   - Add visual indicators (e.g., "saving..." status) to inform users of save progress. Use the `beforeunload` event to trigger immediate saves, though acknowledge browser restrictions may limit effectiveness. Consider debouncing auto-save to 2-5 seconds to reduce conflicts, balancing user experience and data loss risks.

#### Implementation Details
- **Storage Flow:** Memory → Immediate IndexedDB save → Background sync to Supabase. Ensure IndexedDB operations are atomic using transactions to prevent partial saves.
- **Sync Process:** Loop through unsynched IndexedDB documents, send to Supabase, and update local state. Handle conflicts with "last write wins" or merge strategies, depending on app requirements.
- **User Feedback:** Use React state to show save status, updating UI based on IndexedDB and Supabase sync status. Consider toast notifications for sync completion or errors.

#### Tables: Summary of Issues and Solutions

| **Issue**                          | **Cause**                                      | **Recommended Solution**                                      |
|------------------------------------|-----------------------------------------------|-------------------------------------------------------------|
| Documents disappear after reload   | Race condition, RPC parameter mismatch        | Fix RPC call, ensure IndexedDB immediate save, sync to Supabase |
| RPC function fails                 | Passing `p_user_id` unexpectedly              | Call with only `p_limit`, `p_offset`, use `auth.uid()` internally |
| Soft delete filter missing         | Fallback query includes deleted documents     | Ensure fallback query filters `deleted_at IS NULL`          |
| No save confirmation               | Lack of visual feedback, user reloads early   | Add "saving..." indicator, use `beforeunload` for saves     |
| Potential sync issues              | IndexedDB not prioritized on reload           | Load from IndexedDB first, sync to Supabase in background   |

#### Conclusion
By addressing the RPC call, enhancing offline support with IndexedDB, and improving user feedback, you can create a reliable document persistence system. This approach ensures data is never lost, handles race conditions gracefully, and provides clear save status, meeting the expected solution requirements. Further testing, especially in offline scenarios, is recommended to validate the implementation, leveraging resources like [Supabase Community Discussions](https://github.com/orgs/supabase/discussions) for additional insights.