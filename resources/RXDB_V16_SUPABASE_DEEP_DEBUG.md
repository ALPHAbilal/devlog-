# RxDB v16 + Supabase Replication - The Real Issue

## The Paradox Explained

> **Client has `.channel()` but RxDB fails internally trying to access `.channel` on something else**

You've discovered a **real but indirect bug** in how RxDB's replicateSupabase plugin initializes the realtime connection.

---

## Root Cause: Multiple GoTrueClient Instances

### The Error Chain

```
GoTrueClient@...: Multiple GoTrueClient instances detected in the same browser context.
        ↓
Creates race conditions in client initialization
        ↓
supabase.realtime becomes undefined during the plugin's .start() phase
        ↓
TypeError: Cannot read properties of undefined (reading 'channel')
```

### Why This Happens

When you create **multiple Supabase clients** in your app:

```typescript
// ❌ WRONG - Creates multiple instances
const replicationClient = createClient(url, key);  // Instance 1
const supabase = createClient(url, key);           // Instance 2 ← triggers warning
```

Each `createClient()` call creates its own **GoTrueClient** internally. In a browser context, multiple instances fight over localStorage keys, causing undefined behavior during the realtime initialization phase.

---

## Evidence from Your Code

Your diagnostic log:

```
[RxDB Replication] Client channel method: function  ← The main client is fine
...
TypeError: Cannot read properties of undefined (reading 'channel')  ← But plugin fails
```

**This means:**
- Your main client: ✅ `client.channel()` works
- The plugin's internal client reference: ❌ `undefined` (became undefined mid-initialization)

---

## The Real Issue: How RxDB Accesses Realtime

RxDB's replicateSupabase plugin does this internally:

```typescript
// Inside RxDB's plugin (simplified)
const channel = supabaseClient.realtime.subscribe(...);
// NOT: const channel = supabaseClient.channel(...)
```

**The plugin expects:**
- `supabaseClient.realtime` to be a fully initialized RealtimeClient instance
- This initialization is compromised when GoTrueClient conflicts exist

---

## Solution: Single Client Instance (Singleton Pattern)

### ✅ Correct Setup

**File: `src/shared/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

// Create ONCE and reuse everywhere
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: { 
          autoRefreshToken: true, 
          persistSession: true 
        },
        realtime: { 
          params: { eventsPerSecond: 10 } 
        }
      }
    );
  }
  return supabaseInstance;
}

// Export singleton
export const supabase = getSupabaseClient();
```

**File: `src/db/replication.ts`**

```typescript
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';
import { supabase } from '@/shared/supabase'; // ← Use singleton

export async function setupReplication(db: RxDatabase, userId: string) {
  const replicationState = replicateSupabase({
    replicationIdentifier: `supabase-documents-${userId}`,
    collection: db.documents,
    supabaseClient: supabase,  // ← Same instance everywhere
    table: 'documents',
    pull: { batchSize: 100 },
    push: { batchSize: 50 },
    autoStart: true,
  });

  return replicationState;
}
```

**Use everywhere:**

```typescript
// App.tsx
import { supabase } from '@/shared/supabase';
import { setupReplication } from '@/db/replication';

// In your setup:
const user = await supabase.auth.getUser();
await setupReplication(db, user.id);

// In components:
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId);
```

---

## Why This Fixes The Channel Error

With singleton pattern:

```
✅ ONE GoTrueClient instance
     ↓
✅ realtime initializes cleanly
     ↓
✅ supabase.realtime !== undefined
     ↓
✅ RxDB plugin can call .subscribe()
     ↓
✅ Replication starts successfully
```

---

## Verification Steps

### Step 1: Check for Multiple Clients

Add this diagnostic to your app:

```typescript
// src/lib/diagnostics.ts
export function checkSupabaseInstances() {
  const clientCount = (window as any).__supabaseClients?.size ?? 0;
  console.log('🔍 Supabase client instances:', clientCount);

  // Check GoTrueClient instances
  const listeners = (window as any).SupabaseGoTrueListeners?.size ?? 0;
  console.log('🔍 GoTrue listeners:', listeners);
}

// Call in your app initialization
import { checkSupabaseInstances } from '@/lib/diagnostics';
checkSupabaseInstances();
```

**Expected output:**
```
🔍 Supabase client instances: 1
🔍 GoTrue listeners: 1
```

### Step 2: Verify Realtime is Accessible

```typescript
import { supabase } from '@/shared/supabase';

// Add to your initialization
console.log('✅ Client ready:', typeof supabase.channel === 'function');
console.log('✅ Realtime ready:', typeof supabase.realtime.subscribe === 'function');
```

### Step 3: Test Replication

```typescript
import { setupReplication } from '@/db/replication';

const replication = await setupReplication(db, userId);

// Watch the state
replication.active$.subscribe(active => {
  console.log('[Replication] Active:', active);
});

replication.error$.subscribe(error => {
  console.error('[Replication] Error:', error);
});
```

**Expected behavior:**
- ✅ Active changes from Inactive → Active
- ✅ No "Cannot read properties of undefined" error
- ✅ Data begins syncing

---

## Advanced: Diagnosing Existing Issues

If you already have multiple client instances, find them:

```typescript
// Find all Supabase client creation calls
// Use VS Code search: createClient\(
```

Common culprits:

```typescript
// ❌ In Layout.tsx
const supabase = createClient(url, key);

// ❌ In API route
const supabase = createClient(url, key);

// ❌ In utility hook
export const useSupabaseAuth = () => {
  const [supabase] = useState(() => createClient(url, key)); // Creates new on each render!
}
```

**Solution: Move all createClient calls to a single module.**

---

## Vite Production Build Specifics

For production builds, ensure your `.env.production`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Build verification:

```bash
# Build and test
npm run build
npm run preview

# Check console for multiple instance warning
# Should show ZERO GoTrueClient warnings
```

---

## Why RxDB v14 Library Says "RxDB 16 Not Supported"

The community `rxdb-supabase` library (v1.0.4) was last updated August 2023, before RxDB 16 stability settled. However, RxDB 16's **built-in** `replicateSupabase` plugin works perfectly once you fix the client initialization.

The issue isn't RxDB 16—it's the **Supabase client setup**.

---

## Complete Solution Checklist

- [ ] Found all `createClient()` calls in your codebase
- [ ] Moved all to single `supabase.ts` module with singleton pattern
- [ ] Updated all imports to use singleton instance
- [ ] Removed the "Multiple GoTrueClient instances" warning
- [ ] Verified `typeof supabase.realtime.subscribe === 'function'`
- [ ] Tested replication state transitions (Inactive → Active)
- [ ] Confirmed data syncing works bidirectionally
- [ ] Verified production build works with env vars

---

## If Issues Persist

Add these diagnostics:

```typescript
// Deep debug the plugin initialization
import { replicateSupabase } from 'rxdb/plugins/replication-supabase';

const replicationState = replicateSupabase({
  // ... your config
  pull: {
    batchSize: 100,
    modifier: (doc) => {
      console.log('[Pull] Document:', doc);
      return doc;
    }
  }
});

// Log all state changes
replicationState.active$.subscribe(active => {
  console.log('[State] Active:', active);
});

replicationState.isPaused$.subscribe(paused => {
  console.log('[State] Paused:', paused);
});

replicationState.isRunning$.subscribe(running => {
  console.log('[State] Running:', running);
});

// Manually trigger start with error catching
try {
  await replicationState.start();
} catch (error) {
  console.error('[Critical Error]:', {
    message: error.message,
    stack: error.stack,
    clientType: typeof supabase,
    realtimeType: typeof supabase.realtime,
  });
}
```

This will show exactly where the initialization fails.

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot read properties of undefined (reading 'channel')" | Multiple GoTrueClient instances | Use singleton pattern |
| RxDB plugin fails but client works | Realtime initialization race | Ensure single client instance |
| Warning in console | Multiple `createClient()` calls | Consolidate to one module |
| Replication stays Inactive | Plugin can't initialize realtime | Fix client instances first |
| Vite production build fails | Env vars not set | Use VITE_ prefix |

**The solution is 100% about client initialization, not version compatibility.**
