# Fix Duplicate Auth Event Handlers

## Issue Found:
Multiple `onAuthStateChange` listeners are creating the duplicate "Auth event: SIGNED_IN" logs in your console.

## Locations:
1. **AuthContextOptimized.jsx** - Main auth handler ✓
2. **storageWrapper.js** - Duplicate handler 
3. **storageWrapperFixed.js** - Another duplicate
4. **auth/callback.jsx** - OAuth callback handler (needed)

## Files to Fix:

### 1. `/src/utils/storage/storageWrapper.js` (Line 259)
Remove the auth listener - it's already handled by AuthContext:
```javascript
// DELETE THIS ENTIRE BLOCK (lines 257-267):
// Re-init when auth state changes
let lastAuthEvent = null;
supabase.auth.onAuthStateChange((event) => {
  console.log('Storage wrapper: Auth state changed:', event);
  // Only reset on SIGNED_OUT or if switching users
  if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && lastAuthEvent === 'SIGNED_OUT')) {
    console.log('Storage wrapper: Resetting due to auth change');
    reset();
  }
  lastAuthEvent = event;
});
```

### 2. `/src/utils/storage/storageWrapperFixed.js` (Line 187)
Remove the duplicate auth listener:
```javascript
// DELETE THIS ENTIRE BLOCK (lines 186-196):
// Re-init when auth state changes
let lastAuthEvent = null;
supabase.auth.onAuthStateChange((event) => {
  console.log('Storage wrapper: Auth state changed:', event);
  // Only reset on SIGNED_OUT or if switching users
  if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && lastAuthEvent === 'SIGNED_OUT')) {
    console.log('Storage wrapper: Resetting due to auth change');
    reset();
  }
  lastAuthEvent = event;
});
```

### 3. Keep These:
- **AuthContextOptimized.jsx** - This should be the ONLY central auth handler
- **auth/callback.jsx** - Needed for OAuth flow

## Alternative Solution:
Instead of deleting, you could use the event bus to listen for auth changes:

```javascript
// In storageWrapper.js, replace the auth listener with:
import eventBus, { EVENT_TYPES } from '../eventBus';

// Listen for auth changes via event bus
eventBus.on(EVENT_TYPES.AUTH_STATE_CHANGED, (event) => {
  if (event === 'SIGNED_OUT') {
    reset();
  }
});
```

## Result:
This will reduce the "Auth event: SIGNED_IN" logs from 8+ occurrences to just 1.