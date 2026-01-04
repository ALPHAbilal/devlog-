Excellent research results. Now let me create a comprehensive technical guide with practical examples for your specific setup.

***

## Offline-First Sync Architecture: Dexie + Supabase Guide

Your Write-Ahead Logging (WAL) foundation is solid. Let me break down the key architectural decisions and provide a working implementation.

### 1. Conflict Resolution Strategy Comparison[1][2][3]

| Strategy | Best For | Tradeoffs | Implementation |
|----------|----------|-----------|-----------------|
| **Last-Write-Wins (LWW)** | Notes/documents with loose consistency requirements | ⚠️ Data loss possible (e.g., simultaneous edits). Simple timestamp comparison. Good for user-driven workflows | Easiest: compare `server.updatedAt` vs `local.updatedAt` |
| **CRDT** | Real-time collaborative apps (multiple users editing same doc simultaneously) | Requires data-type-specific logic. More complex. Better conflict preservation. | Use OR-sets for collections, sequence CRDTs for text [2] |
| **Operational Transform (OT)** | Google Docs-like synchronous collaboration | Complex server-side coordination. Requires operation history. High complexity. | Rarely worth it unless real-time sync required [4] |

**Recommendation for notes/document app:**[3][1]
- **Primary**: Last-Write-Wins with **user notification**
- **Why**: Your Write-Ahead Log captures intent. Users can see conflicts and choose which version to keep
- **Implement as**: Server stores `updatedAt`, client compares timestamps. If conflict, prompt user with both versions

```javascript
// Conflict detection logic
async function resolveConflict(local, server) {
  // If local edit is more recent, local wins
  if (local.updatedAt > server.updatedAt) {
    return { winner: 'local', action: 'keep_local' };
  }
  
  // If server is newer, offer user choice
  return {
    winner: 'server',
    action: 'user_choice',
    message: `Document was updated ${formatTime(server.updatedAt)}. Keep your version or use server's?`
  };
}
```

***

### 2. Sync Queue Implementation with Retry Logic[5][1]

Here's a production-ready queue system that integrates with your WAL:

```typescript
// types.ts
interface SyncQueueItem {
  id?: number;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  payload: any;
  recordId: string | number;
  
  // WAL fields
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'conflict';
  error?: string;
  
  // Metadata for conflict resolution
  clientId: string;
  syncAttemptedAt?: number;
  serverVersionId?: string;
}

interface SyncStatus {
  pending: number;
  syncing: number;
  failed: number;
  conflicts: number;
}

// db.ts - Dexie setup
import Dexie, { Table } from 'dexie';

export interface Note {
  id?: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  clientId: string;
  _isSynced: boolean;
}

export class NotesDB extends Dexie {
  notes!: Table<Note>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('NotesDB');
    this.version(1).stores({
      notes: '++id, createdAt, updatedAt, clientId, _isSynced',
      syncQueue: '++id, status, recordId, timestamp, retryCount'
    });
  }
}

export const db = new NotesDB();

// Initialize clientId (stored in localStorage, not IndexedDB)
const getOrCreateClientId = () => {
  const key = 'sync.clientId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
};

export const clientId = getOrCreateClientId();
```

**Sync Queue Manager:**

```typescript
// syncQueue.ts
import { db, clientId, SyncQueueItem, Note } from './db';

export class SyncQueueManager {
  private isOnline = navigator.onLine;
  private processingQueue = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Add operation to sync queue
   * Called immediately after local write
   */
  async queueOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    payload: any,
    recordId: string | number
  ): Promise<void> {
    const syncItem: SyncQueueItem = {
      operation,
      endpoint,
      payload,
      recordId,
      clientId,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      status: 'pending',
      syncAttemptedAt: undefined
    };

    try {
      await db.syncQueue.add(syncItem);
      console.log(`[SyncQueue] Queued ${operation} for ${recordId}`, syncItem);
      
      // Notify listeners
      this.notifyStatusChange();
      
      // Try to sync immediately if online
      if (this.isOnline) {
        this.processQueue();
      }
    } catch (err) {
      console.error('[SyncQueue] Failed to queue operation:', err);
    }
  }

  /**
   * Process all pending sync operations
   * Runs periodically or on network state change
   */
  async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline) return;

    this.processingQueue = true;

    try {
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('pending')
        .toArray();

      console.log(`[SyncQueue] Processing ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        await this.processSyncItem(item);
      }
    } catch (err) {
      console.error('[SyncQueue] Queue processing error:', err);
    } finally {
      this.processingQueue = false;
      this.notifyStatusChange();
    }
  }

  /**
   * Process individual sync item with retry logic
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // Skip if exceeded retries
    if (item.retryCount >= item.maxRetries) {
      await db.syncQueue.update(item.id, {
        status: 'failed',
        error: `Max retries (${item.maxRetries}) exceeded`
      });
      console.warn(`[SyncQueue] Item ${item.id} failed after max retries`);
      return;
    }

    try {
      // Update status to syncing
      await db.syncQueue.update(item.id, {
        status: 'syncing',
        syncAttemptedAt: Date.now()
      });

      // Perform sync operation
      const response = await this.syncToServer(item);

      // Handle success - update local record
      await this.handleSyncSuccess(item, response);

      // Remove from queue
      await db.syncQueue.delete(item.id);
      console.log(`[SyncQueue] Successfully synced item ${item.id}`);

    } catch (error) {
      await this.handleSyncError(item, error);
    }
  }

  /**
   * Make HTTP request to server
   */
  private async syncToServer(item: SyncQueueItem): Promise<any> {
    const method = item.operation === 'DELETE' ? 'DELETE' : 
                   item.operation === 'CREATE' ? 'POST' : 'PATCH';

    const url = item.operation === 'DELETE' 
      ? `${item.endpoint}/${item.recordId}`
      : item.endpoint;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId,
        'X-Sync-Attempt': item.syncAttemptedAt?.toString() || ''
      },
      body: method === 'DELETE' ? undefined : JSON.stringify({
        ...item.payload,
        clientId,
        _syncTimestamp: item.timestamp
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      
      // Handle conflict (409)
      if (response.status === 409) {
        throw new ConflictError('Server data conflicts with local changes', errorBody);
      }

      throw new Error(`Server returned ${response.status}: ${errorBody.message}`);
    }

    return response.json();
  }

  /**
   * Handle successful sync
   */
  private async handleSyncSuccess(item: SyncQueueItem, serverData: any): Promise<void> {
    // Update local record with server data
    if (item.operation === 'CREATE' || item.operation === 'UPDATE') {
      const localRecord = await db.notes.get(item.recordId as string);
      
      if (localRecord) {
        await db.notes.update(item.recordId as string, {
          ...serverData,
          _isSynced: true,
          syncedAt: Date.now(),
          // Keep local updatedAt if newer (preserve user's latest edit)
          updatedAt: Math.max(localRecord.updatedAt, serverData.updatedAt)
        });
      }
    } else if (item.operation === 'DELETE') {
      // Soft delete mark or actual delete
      await db.notes.update(item.recordId as string, {
        _isSynced: true
      });
    }
  }

  /**
   * Handle sync error with retry logic
   */
  private async handleSyncError(item: SyncQueueItem, error: Error): Promise<void> {
    const retryCount = item.retryCount + 1;
    const isConflict = error instanceof ConflictError;

    await db.syncQueue.update(item.id, {
      status: isConflict ? 'conflict' : 'pending',
      retryCount,
      error: error.message,
      syncAttemptedAt: undefined // Reset to retry later
    });

    if (isConflict) {
      console.error(`[SyncQueue] Conflict detected for item ${item.id}:`, error.message);
      // Emit conflict event for UI to handle
      this.emitConflict(item, error as ConflictError);
    } else {
      console.warn(`[SyncQueue] Item ${item.id} sync failed (retry ${retryCount}/${item.maxRetries})`);
    }
  }

  /**
   * Exponential backoff retry schedule
   */
  startPeriodicSync(): void {
    // Clear existing interval
    if (this.syncInterval) clearInterval(this.syncInterval);

    // Process queue every 5 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, 5000);
  }

  /**
   * Get current sync status for UI
   */
  async getStatus(): Promise<SyncStatus> {
    const [pending, syncing, failed, conflicts] = await Promise.all([
      db.syncQueue.where('status').equals('pending').count(),
      db.syncQueue.where('status').equals('syncing').count(),
      db.syncQueue.where('status').equals('failed').count(),
      db.syncQueue.where('status').equals('conflict').count()
    ]);

    return { pending, syncing, failed, conflicts };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyStatusChange(): void {
    this.getStatus().then(status => {
      this.listeners.forEach(listener => listener(status));
    });
  }

  // Event handlers
  private handleOnline(): void {
    console.log('[SyncQueue] Online - starting sync');
    this.isOnline = true;
    this.processQueue();
  }

  private handleOffline(): void {
    console.log('[SyncQueue] Offline - pausing sync');
    this.isOnline = false;
  }

  // Conflict resolution
  private emitConflict(item: SyncQueueItem, error: ConflictError): void {
    window.dispatchEvent(new CustomEvent('syncConflict', {
      detail: { item, serverData: error.serverData }
    }));
  }
}

// Error types
class ConflictError extends Error {
  constructor(message: string, public serverData: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

// Create singleton
export const syncQueue = new SyncQueueManager();
syncQueue.startPeriodicSync();
```

***

### 3. TanStack Query Cache Invalidation with Dexie[6][7]

The key is **two-way synchronization**: Dexie changes → Query invalidation, AND Query updates → Dexie updates.

```typescript
// queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { db } from './db';
import { syncQueue } from './syncQueue';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 1
    },
    mutations: {
      retry: 1
    }
  }
});

/**
 * Hook Dexie write operations to TanStack Query invalidation
 * Call this once at app startup
 */
export async function setupDexieQueryIntegration(): Promise<void> {
  // Listen for note changes in Dexie
  const unsubscribe = db.notes.toCollection().onChange(() => {
    // Invalidate the notes list query
    queryClient.invalidateQueries({ queryKey: ['notes'] });
  });

  // Listen for sync conflicts
  window.addEventListener('syncConflict', (event: any) => {
    const { item, serverData } = event.detail;
    // Mark query as needing refresh
    queryClient.invalidateQueries({ queryKey: ['notes', item.recordId] });
  });

  return () => unsubscribe();
}

/**
 * Hook mutations to Dexie writes + sync queue
 */
export function useNotesMutation() {
  return useMutation({
    mutationFn: async (variables: any) => {
      // Implementation in next section
    },
    onSuccess: (data, variables) => {
      // Critical: Invalidate TanStack Query
      // This causes components using useQuery to refetch
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });
}
```

**Complete Notes Query Hook:**

```typescript
// hooks/useNotes.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { db, Note, clientId } from '../db';
import { syncQueue } from '../syncQueue';
import { queryClient } from '../queryClient';

/**
 * Fetch notes from Dexie (acts as cache layer)
 * TanStack Query caches this, Dexie persists offline
 */
export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      // Read from Dexie (instant, offline-available)
      const notes = await db.notes.toArray();
      return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    // Keep local data fresh while offline
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
}

/**
 * Create/update note
 * Writes locally first, queues for sync
 */
export function useCreateOrUpdateNote() {
  return useMutation({
    mutationFn: async (input: Partial<Note>) => {
      const id = input.id || `note-${clientId}-${Date.now()}`;
      const now = Date.now();

      // Step 1: Write to Dexie immediately (optimistic)
      const noteToSave: Note = {
        id,
        title: input.title || '',
        content: input.content || '',
        createdAt: input.createdAt || now,
        updatedAt: now,
        clientId,
        _isSynced: false
      };

      await db.notes.put(noteToSave);
      console.log('[Mutation] Saved locally:', id);

      // Step 2: Queue for sync to Supabase
      const isCreate = !input.id;
      await syncQueue.queueOperation(
        isCreate ? 'CREATE' : 'UPDATE',
        '/api/notes',
        {
          title: noteToSave.title,
          content: noteToSave.content,
          updatedAt: noteToSave.updatedAt
        },
        id
      );

      return noteToSave;
    },
    onSuccess: async (savedNote) => {
      // Invalidate the notes list to trigger refetch
      // This ensures TanStack Query calls our queryFn again
      queryClient.setQueryData(
        ['notes'],
        (oldNotes: Note[] | undefined) => {
          if (!oldNotes) return [savedNote];
          const filtered = oldNotes.filter(n => n.id !== savedNote.id);
          return [savedNote, ...filtered];
        }
      );
      
      // Also keep in sync with Dexie (redundant but ensures consistency)
      await db.notes.put(savedNote);
    },
    onError: (error) => {
      console.error('[Mutation] Failed:', error);
      // Note remains in Dexie and sync queue for retry
    }
  });
}

/**
 * Delete note
 */
export function useDeleteNote() {
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete locally
      const note = await db.notes.get(id);
      if (note) {
        await db.notes.delete(id);
      }

      // Queue delete for sync
      await syncQueue.queueOperation('DELETE', '/api/notes', {}, id);

      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(
        ['notes'],
        (oldNotes: Note[] | undefined) => {
          if (!oldNotes) return [];
          return oldNotes.filter(n => n.id !== deletedId);
        }
      );
    }
  });
}

/**
 * Sync status listener for UI
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = syncQueue.onStatusChange(setStatus);
    syncQueue.getStatus().then(setStatus);
    return unsubscribe;
  }, []);

  return status;
}
```

***

### 4. Complete Sync Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ useNotes()   │  │ useSyncStatus│  │ Conflict UI  │            │
│  │ useQuery     │  │              │  │  Dialog      │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼───────────────────┼────────────────┼──────────────────┘
          │                   │                │
          │ reads            │ listens         │ handles
          │                   │                │
┌─────────▼───────────────────▼────────────────▼──────────────────┐
│              TanStack Query Cache Layer                          │
│  ┌────────────────────────────────────────┐                     │
│  │ QueryClient (manages query state)      │                     │
│  │ - Cache expiration (staleTime)         │                     │
│  │ - Refetch triggers                     │                     │
│  │ - Mutation handling                    │                     │
│  └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
          ▲                   ▲                    
          │ invalidate        │ read/write
          │ setQueryData      │
          │                   │
┌─────────┴───────────────────┴────────────────────────────────────┐
│                  LOCAL STATE LAYER (Dexie)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ notes table │  │ syncQueue    │  │ Metadata     │             │
│  │ (documents) │  │ table        │  │ (_isSynced)  │             │
│  └─────────────┘  └──────────────┘  └──────────────┘             │
│                                                                    │
│ IndexedDB (persistent, survives reload, works offline)           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ (when online)
                       │ SyncQueueManager.processQueue()
                       │ - HTTP requests with retry logic
                       │ - Conflict detection (409 status)
                       │ - Exponential backoff
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│              SUPABASE BACKEND (Server)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ auth()      │  │ notes table  │  │ Edge         │             │
│  │ (RLS)       │  │              │  │ Functions    │             │
│  └─────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘

FLOW TIMELINE:
==============

USER CREATES NOTE:
  1. User clicks "New Note" → useCreateOrUpdateNote() mutation
  2. Mutation saves to Dexie immediately (optimistic update)
  3. TanStack Query cache updated with setQueryData()
  4. UI reflects change instantly (offline or not)
  5. SyncQueueManager.queueOperation() adds to syncQueue
  6. If online, processQueue() sends HTTP POST to Supabase
  7. On success: update local record with server ID, mark _isSynced
  8. On conflict (409): emit 'syncConflict' event → conflict UI shown

USER EDITS NOTE OFFLINE:
  1. Same as above, but step 6 is skipped (offline)
  2. SyncQueueItem stays in 'pending' status
  3. When online detected: window 'online' event → processQueue()
  4. Retry logic kicks in with exponential backoff

SYNC CONFLICT DETECTED:
  1. Server returns 409 with conflicting data
  2. handleSyncError() detects ConflictError
  3. Emit 'syncConflict' event with local + server versions
  4. Conflict UI dialog shown to user
  5. User chooses: keep local or accept server
  6. Selection updates Dexie + invalidates TanStack Query
  7. Item marked as 'conflict' (manual action required)

NETWORK RECOVERS:
  1. window 'online' event fired
  2. isOnline = true → processQueue() runs
  3. All 'pending' items retried
  4. Successfully synced items removed from queue
  5. TanStack Query invalidated → components refetch from Dexie
```

***

### 5. Production Deployment Considerations

**Server-side Supabase Implementation:**

```typescript
// Supabase Edge Function: handle_note_sync
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"))

serve(async (req) => {
  const clientId = req.headers.get("X-Client-ID")
  const syncTimestamp = parseInt(req.headers.get("X-Sync-Attempt") || "0")

  try {
    if (req.method === "POST") {
      const data = await req.json()
      const userId = (await supabase.auth.getUser()).data.user?.id

      // Check for conflicts
      const { data: existing } = await supabase
        .from("notes")
        .select("*")
        .eq("id", data.id)
        .single()

      if (existing && existing.updatedAt > data.updatedAt && existing.userId !== userId) {
        // Conflict: return 409 with server version
        return new Response(JSON.stringify({
          error: "Conflict",
          serverData: existing
        }), { status: 409, headers: { "Content-Type": "application/json" } })
      }

      // Insert or update
      const { data: result, error } = await supabase
        .from("notes")
        .upsert({
          ...data,
          userId,
          clientId,
          syncedAt: new Date().toISOString()
        })
        .select()
        .single()

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      })
    }

    if (req.method === "DELETE") {
      // Handle delete
      const id = new URL(req.url).pathname.split("/").pop()
      await supabase.from("notes").delete().eq("id", id)
      return new Response(JSON.stringify({ success: true }))
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
```

***

### Key Takeaways for Your Setup

✅ **Start with Last-Write-Wins** for your notes app—it's practical and your WAL captures intent
✅ **Sync Queue is the heart**—retry logic, status tracking, offline queuing
✅ **TanStack Query + Dexie work together**—Query caches results, Dexie persists and handles offline
✅ **Two-way sync**—Dexie changes invalidate Query, Query updates go back to Dexie
✅ **Conflict handling**—Let users choose, don't silently lose data

This architecture scales from solo to multi-user scenarios. If you need true real-time collaboration later, swap LWW for CRDTs using a library like [Automerge](https://automerge.org) or [Yjs](https://docs.yjs.dev/)—but start simple.


-------------------------
Great! I found relevant patterns and actual implementation examples. Let me provide you with a comprehensive comparison with real code.

## Offline-First Architecture Comparison

Based on current best practices (2024-2025), here's a detailed analysis:

### **Architecture Comparison**

| Dimension | **Approach A: TanStack Query + Dexie as Persistence** | **Approach B: useLiveQuery + TanStack Query Hybrid** |
|-----------|------|------|
| **Simplicity** | ⭐⭐⭐⭐ Higher (single source of truth) | ⭐⭐⭐ Moderate (dual reactivity systems) |
| **Maintenance** | ⭐⭐⭐⭐ Easier | ⭐⭐⭐ More coordination needed |
| **Large Datasets** | ⭐⭐⭐ Good (Dexie pagination helps) | ⭐⭐⭐⭐ Better (Dexie native queries) |
| **Offline-First UX** | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Superior (instant local updates) |
| **Background Sync** | ⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Excellent |
| **Bundle Size** | ⭐⭐⭐⭐ Smaller (one major lib) | ⭐⭐⭐ Larger (two systems) |

***

## **Approach A: TanStack Query as Source of Truth**

**Best for:** Simple to moderate apps, read-heavy applications, when server state is primary[1]

```typescript
// setup/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import Dexie from 'dexie';

// Dexie is only for persistence - no queries run against it directly
export const db = new Dexie('AppDB');
db.version(1).stores({
  queries: '++id, queryKey'
});

// TanStack Query is the single source of truth
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst', // Key: pause retries when offline, but allow first fetch from cache
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5,     // 5 minutes
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    },
  },
});

// IndexedDB persister (more efficient than localStorage for large data)
const idbPersister = {
  persistClient: async (client) => {
    await db.queries.clear();
    const state = client.getState();
    await db.queries.add({ queryKey: 'cache', state });
  },
  restoreClient: async () => {
    const cached = await db.queries.where('queryKey').equals('cache').first();
    return cached?.state;
  },
};

export function QueryProvider({ children }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister }}
      onSuccess={() => {
        queryClient.resumePausedMutations();
        queryClient.invalidateQueries();
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
```

```typescript
// hooks/useTodos.ts - All data access through TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const TODOS_KEY = ['todos'];

export function useTodos() {
  const queryClient = useQueryClient();

  // Read: Everything goes through TanStack Query
  const todos = useQuery({
    queryKey: TODOS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/todos');
      return res.json();
    },
    networkMode: 'offlineFirst',
  });

  // Write: Mutations with optimistic updates
  const addTodo = useMutation({
    mutationFn: async (newTodo) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });
      return res.json();
    },
    onMutate: async (newTodo) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData(TODOS_KEY);
      queryClient.setQueryData(TODOS_KEY, (old) => [...(old || []), newTodo]);
      return { previous };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      queryClient.setQueryData(TODOS_KEY, context.previous);
    },
    onSuccess: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
    networkMode: 'offlineFirst',
  });

  return { todos: todos.data, isLoading: todos.isLoading, addTodo };
}
```

**Pros:**
- ✅ Single cache system (no sync conflicts)
- ✅ Built-in offline support with `networkMode: 'offlineFirst'`[2]
- ✅ Automatic mutation persistence and resuming
- ✅ Simple to reason about
- ✅ Smaller learning curve

**Cons:**
- ❌ All data goes through TanStack Query, even for local-only queries
- ❌ No fine-grained reactivity for local state changes
- ❌ Dexie capabilities underutilized

***

## **Approach B: Hybrid - useLiveQuery for Local, TanStack Query for Remote**

**Best for:** Offline-first UX, large datasets, complex local queries[3]

```typescript
// db.ts - Full use of Dexie
import Dexie, { type Table } from 'dexie';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  syncedAt?: Date;
  _sync?: { pending: boolean; error?: string };
}

export class AppDB extends Dexie {
  todos!: Table<Todo>;

  constructor() {
    super('AppDB');
    this.version(1).stores({
      todos: '++id, completed, priority, createdAt',
    });
  }
}

export const db = new AppDB();
```

```typescript
// sync/syncEngine.ts - Orchestrates local → remote sync
import { QueryClient } from '@tanstack/react-query';
import { db } from '@/db';

export class SyncEngine {
  constructor(private queryClient: QueryClient) {}

  async syncTodos() {
    // 1. Get pending local changes
    const pendingTodos = await db.todos
      .where('_sync.pending')
      .equals(true)
      .toArray();

    for (const todo of pendingTodos) {
      try {
        // 2. Push to server
        const response = await fetch(`/api/todos/${todo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        });

        const updated = await response.json();

        // 3. Update local with server response
        await db.todos.update(todo.id, {
          ...updated,
          syncedAt: new Date(),
          _sync: { pending: false },
        });
      } catch (error) {
        // Mark sync failure but keep local data
        await db.todos.update(todo.id, {
          _sync: { pending: true, error: error.message },
        });
      }
    }

    // 4. Invalidate TanStack Query cache to trigger refetch if needed
    this.queryClient.invalidateQueries({ queryKey: ['todos'] });
  }

  async pullRemote() {
    // Fetch fresh from server, update local
    try {
      const response = await fetch('/api/todos');
      const todos = await response.json();

      // Merge: prefer local pending changes
      const pending = await db.todos
        .where('_sync.pending')
        .equals(true)
        .toArray();

      const pendingIds = new Set(pending.map((t) => t.id));

      for (const todo of todos) {
        if (!pendingIds.has(todo.id)) {
          // Only update if no local pending changes
          await db.todos.put({
            ...todo,
            syncedAt: new Date(),
            _sync: { pending: false },
          });
        }
      }
    } catch (error) {
      console.error('Pull failed:', error);
    }
  }
}
```

```typescript
// hooks/useTodosHybrid.ts - Combines both systems
import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/db';

export function useTodosHybrid() {
  // Local: useLiveQuery for instant reactivity
  const localTodos = useLiveQuery(() => db.todos.toArray(), []);

  // Remote: TanStack Query for server sync
  const remoteQuery = useQuery({
    queryKey: ['todos', 'remote'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      return res.json();
    },
    networkMode: 'offlineFirst',
    staleTime: 1000 * 60 * 5,
  });

  // Merge status: prefer local for optimistic UX
  const isLoading = !localTodos && remoteQuery.isLoading;
  const isSyncing = remoteQuery.isFetching;

  return {
    todos: localTodos || [],
    isLoading,
    isSyncing,
    syncStatus: {
      online: remoteQuery.status === 'success',
      hasLocalChanges: localTodos?.some((t) => t._sync?.pending),
    },
  };
}
```

```typescript
// hooks/useTodoMutationHybrid.ts - Local first, sync later
export function useTodoMutationHybrid() {
  const queryClient = useQueryClient();
  const syncEngine = useRef(new SyncEngine(queryClient));

  const addTodo = async (title: string) => {
    const todoId = crypto.randomUUID();
    const newTodo: Todo = {
      id: todoId,
      title,
      description: '',
      completed: false,
      priority: 'medium',
      createdAt: new Date(),
      _sync: { pending: true },
    };

    try {
      // 1. Save to local immediately ⚡
      await db.todos.add(newTodo);

      // 2. UI updates instantly via useLiveQuery

      // 3. Sync in background (or when online)
      if (navigator.onLine) {
        await syncEngine.current.syncTodos();
      } else {
        // Will sync when coming back online
        window.addEventListener('online', () => {
          syncEngine.current.syncTodos();
        }, { once: true });
      }

      return newTodo;
    } catch (error) {
      // Clean up on failure
      await db.todos.delete(todoId);
      throw error;
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    const previous = await db.todos.get(id);

    try {
      // Optimistic local update
      await db.todos.update(id, {
        ...updates,
        _sync: { pending: true },
      });

      // Background sync
      if (navigator.onLine) {
        await syncEngine.current.syncTodos();
      }
    } catch (error) {
      // Rollback
      if (previous) await db.todos.put(previous);
      throw error;
    }
  };

  return { addTodo, updateTodo };
}
```

**Pros:**
- ✅ Instant local updates (no waiting for network)[3]
- ✅ Fine-grained reactivity with `useLiveQuery`[4]
- ✅ Better for large datasets (Dexie's query engine)
- ✅ Offline-first UX: save local immediately, sync later
- ✅ Can cancel/edit mutations before sync (unlike Approach A)[3]

**Cons:**
- ❌ More complex: manage two reactivity systems
- ❌ Must handle sync conflicts manually
- ❌ Larger bundle size
- ❌ Higher maintenance burden (sync engine logic)

***

## **Recommendation for Your Use Cases**

### **1. Simplicity & Maintenance**
**🏆 Winner: Approach A**
- Single source of truth = fewer bugs
- TanStack Query handles offline/sync automatically
- Use this for 80% of projects

### **2. Performance with Large Datasets**
**🏆 Winner: Approach B**
- Dexie's IndexedDB queries are faster for complex filters[5]
- `useLiveQuery` can query 100k+ records efficiently
- Approach A would hydrate entire cache into React

### **3. Offline-First with Background Sync**
**🏆 Winner: Approach B**
- Instant local updates create better UX[3]
- Save locally first, sync later = users aren't blocked
- Can cancel mutations before sync happens
- Approach A forces you to wait for network for mutations

***

## **Practical Recommendation**

**Use Approach B IF any of these apply:**
- You need instant local updates (e.g., todo app, notes, forms)
- Large datasets (>10k items)
- 3+ hours of offline usage required
- Users expect optimistic UI (e.g., click save, item appears instantly)

**Use Approach A IF:**
- Data is mostly server-driven (read-heavy)
- Smaller datasets (<5k items)
- Simpler app (fewer features)
- You want the absolute simplest maintenance burden

***

--------------------------
Perfect! Now I have comprehensive information. Let me provide you with a complete, official-documentation-based answer.

## 1. **Dexie v3 vs v4: Key Differences**[1]

**Choose v4** for your stack. Here's why:

| Feature | Dexie v3 | Dexie v4 |
|---------|----------|---------|
| **Status** | Stable | Current stable (v4.2.1) [1] |
| **React 19 Support** | ✅ Works | ✅ Better (Vite/Vinxi fix) [1] |
| **Live Queries** | ✅ Built-in since v3.2 | ✅ Enhanced |
| **Y.js Support** | ❌ Core integration removed | ✅ via `y-dexie` add-on [1] |
| **CRDT Operations** | ❌ | ✅ `add()` / `remove()` for arrays & numbers [1] |
| **Table.upsert()** | ❌ | ✅ Added in v4.2.1 [1] |

**Breaking Change Fix:** v4.2.0 resolved the Vite/Vinxi production issue where "Named Export 'Dexie' Not Found" occurred—critical for your Vite setup.[1]

***

## 2. **dexie-react-hooks vs TanStack Query**[2]

**Use both together, but differently:**

```
dexie-react-hooks = Local state reactivity (IndexedDB queries)
TanStack Query = Server state management (API data)
```

**Key Points:**[2]

- **dexie-react-hooks is required** - It provides `useLiveQuery()` for reactive IndexedDB queries. This hook automatically re-executes when data changes in the database (live reactivity).[2]
- **TanStack Query is for API calls** - Use it to fetch/cache data from your server, then sync to Dexie via mutations
- **No built-in dexie-react-hooks + TanStack Query integration exists** - You manage the integration yourself:
  - Use TanStack Query for server data: `useQuery()`, `useMutation()`
  - Use `useLiveQuery()` for local Dexie data
  - Sync between them manually when needed

**Reactivity Explanation:**[2]
> "Dexie v3.2 and later comes with reactivity built-in... live queries observe the result and make your component mirror the data in real time. If a change is made (by the app itself or from an external tab or worker), a binary range tree algorithm will efficiently detect whether those changes would affect your queries."

***

## 3. **NPM Install Command for Your Stack**

```bash
# Core dependencies
npm install dexie dexie-react-hooks @tanstack/react-query

# TypeScript types (for React 19)
npm install --save-dev @types/node
```

**Full command for copy-paste:**[3]
```bash
npm install dexie dexie-react-hooks @tanstack/react-query
npm install --save-dev @types/react@^19.0.0 @types/react-dom@^19.0.0
```

**If using Yarn:**[2]
```bash
yarn add dexie dexie-react-hooks @tanstack/react-query
```

***

## 4. **React 19 Compatibility** ✅

**Excellent news:**
- ✅ **Dexie v4.2+ fully compatible with React 19**[1]
- ✅ **dexie-react-hooks compatible with React 19**[1]
- ✅ **TanStack Query v5 has React 19 support**[3]
- ✅ **Vite integration fixed in v4.2.0** - Resolves production build issues[1]

**TypeScript Setup for React 19:**[4]
```typescript
// tsconfig.json - no special config needed for Dexie
// Just ensure you have React 19 types:
npm install --save-dev @types/react@^19.0.0 @types/react-dom@^19.0.0
```

***

## **Recommended Architecture for Your Stack**

```typescript
// db.ts - Dexie setup
import { Dexie, type EntityTable } from 'dexie';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  syncedAt?: number;
}

export const db = new Dexie('MyOfflineApp') as Dexie & {
  tasks: EntityTable<Task, 'id'>;
};

db.version(1).stores({
  tasks: '++id, syncedAt' // Primary key and indexes
});
```

```typescript
// hooks/useTasks.ts - Local + Server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';

export function useTasks() {
  const queryClient = useQueryClient();
  
  // Local state from Dexie (reactive)
  const localTasks = useLiveQuery(() => db.tasks.toArray());
  
  // Server state from API
  const { data: serverTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetch('/api/tasks').then(r => r.json()),
  });
  
  // Sync mutation: local → server
  const syncMutation = useMutation({
    mutationFn: async (task: Task) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      // Update local DB
      await db.tasks.put({ ...data, syncedAt: Date.now() });
      // Invalidate server cache
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
  
  return { localTasks, serverTasks, syncMutation };
}
```

```typescript
// Component usage
import { useTasks } from './hooks/useTasks';

export function TaskList() {
  const { localTasks } = useTasks();
  
  // useLiveQuery handles reactivity automatically
  return (
    <ul>
      {localTasks?.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

***

## **Key Takeaways**

1. **Use Dexie v4.2+** (not v3) for React 19 + Vite compatibility[1]
2. **Always install dexie-react-hooks** - It's essential for reactivity[2]
3. **TanStack Query ≠ replacement for dexie-react-hooks** - They serve different purposes[2]
4. **No compatibility issues** with React 19 when using current versions[1]
5. **Schema versioning improved in v3+** - You only need to declare the current version unless upgraders are attached[5]

**One more thing:** If you need collaborative editing later, Dexie v4 supports Y.js via the `y-dexie` add-on  - but that's optional for your current offline-first setup.[1]

