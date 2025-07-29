# Supabase v2.46.2 Infinite Token Refresh Loop Fix

## Problem Summary

Users were experiencing an authentication issue where they would sign in successfully but immediately get signed out due to an infinite TOKEN_REFRESHED loop. This caused:
- Rapid TOKEN_REFRESHED events (50+ per second)
- HTTP 429 (Too Many Requests) errors
- Automatic logout after ~50 attempts
- Only occurred on some computers, not others

## Root Cause

The issue stems from Supabase v2.46.2 where `autoRefreshToken: false` doesn't fully disable token refresh. The setting only prevents timer-based refreshes but still triggers refresh on:
- Initial client creation with `persistSession: true`
- Every `getSession()` call
- Session recovery from storage
- Auth state change callbacks

## Why Initial Attempts Failed

### 1. Wrong Storage Key
**Attempted**: Used `'journey-log-auth'` as storage key
**Problem**: Supabase expects `'sb-[project-ref]-auth-token'` format
**Result**: Session couldn't be found, triggering recovery attempts

### 2. Disabling autoRefreshToken Alone
**Attempted**: Set `autoRefreshToken: false`
**Problem**: Supabase still refreshes tokens on session initialization
**Result**: Loop continued

### 3. Disabling persistSession
**Attempted**: Set `persistSession: false` to stop automatic session recovery
**Problem**: This broke normal authentication flow - users couldn't sign in at all
**Result**: Made the problem worse

### 4. Custom Storage with Caching
**Attempted**: Implemented custom storage with caching layer
**Problem**: Introduced race conditions during rapid refresh cycles
**Result**: Corrupted session state

## The Working Solution

The fix that worked combines multiple strategies:

### 1. Rate Limiting for TOKEN_REFRESHED Events
```javascript
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds

if (event === 'TOKEN_REFRESHED') {
  const now = Date.now();
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    console.warn('[Supabase] Ignoring rapid token refresh attempt');
    return;
  }
  lastRefreshTime = now;
}
```

### 2. Circuit Breaker Pattern
```javascript
const attempts = this.refreshAttempts.get(sessionId) || 0;
if (attempts > 10) {
  console.error('[Supabase] Too many refresh attempts, circuit breaker activated');
  this.client.auth.signOut();
  return;
}
this.refreshAttempts.set(sessionId, attempts + 1);
setTimeout(() => this.refreshAttempts.delete(sessionId), 300000); // Reset after 5 min
```

### 3. Proper Configuration
```javascript
auth: {
  autoRefreshToken: false,  // Disable automatic refresh
  persistSession: true,     // Keep session persistence
  detectSessionInUrl: true, // Required for OAuth flow
  flowType: 'pkce'
}
```

### 4. Simple Synchronous Storage
```javascript
storage: {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Storage getItem error:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage setItem error:', e);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage removeItem error:', e);
    }
  }
}
```

### 5. Request Deduplication
```javascript
async getSession() {
  const key = 'getSession';
  return this.deduplicateRequest(key, async () => {
    try {
      const result = await this.getClient().auth.getSession();
      return result;
    } catch (error) {
      console.error('[Supabase] getSession error:', error);
      return { data: { session: null }, error };
    }
  });
}
```

## Why This Solution Works

1. **Rate Limiting**: Prevents TOKEN_REFRESHED events from firing more than once every 5 seconds, breaking the rapid-fire loop

2. **Circuit Breaker**: After 10 failed attempts, automatically signs out the user to break the cycle completely

3. **Keep persistSession**: Maintains normal authentication flow while controlling refresh behavior

4. **Error Handling**: Prevents storage errors from triggering refresh attempts

5. **Deduplication**: Prevents concurrent getSession calls from triggering multiple refreshes

## Emergency Controls

If the issue recurs, users can:

1. **Disable refresh via localStorage**:
```javascript
localStorage.setItem('SUPABASE_DISABLE_REFRESH', 'true');
```

2. **Clear all auth issues**:
```javascript
import { clearAuthIssues } from './lib/supabaseOptimized';
clearAuthIssues(); // Clears storage, caches, and signs out
```

## Key Learnings

1. **Don't disable core features**: Setting `persistSession: false` breaks more than it fixes
2. **Rate limit at the source**: Control event frequency rather than disabling features
3. **Implement circuit breakers**: Prevent infinite loops with automatic recovery
4. **Keep storage simple**: Complex caching can introduce race conditions
5. **Add emergency overrides**: Always have a way to disable problematic behavior

## Files Modified

1. `/src/lib/supabaseOptimized.js` - Main Supabase configuration and rate limiting
2. `/src/contexts/AuthContextOptimized.jsx` - Debounced TOKEN_REFRESHED handling

## Testing Checklist

- [ ] Users can sign in successfully
- [ ] No TOKEN_REFRESHED spam in console
- [ ] Sessions persist across page refreshes
- [ ] No 429 errors after sign in
- [ ] Circuit breaker activates after 10 attempts
- [ ] Emergency override works via localStorage