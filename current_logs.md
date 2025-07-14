# Supabase v2.46.2 infinite token refresh loop causing 429 errors and automatic logout

The infinite TOKEN_REFRESHED event loop in Supabase v2.46.2 is a documented issue affecting multiple users, with browser-specific behaviors and configuration complexities that can trigger continuous authentication attempts. Based on extensive research across GitHub issues, Stack Overflow discussions, and technical documentation, this problem stems from several interconnected factors including ignored configuration settings, race conditions in custom storage implementations, and PKCE flow conflicts.

## The core problem: autoRefreshToken configuration is not fully respected

The most significant finding is that `autoRefreshToken: false` doesn't completely disable token refresh behavior in Supabase v2. According to **GitHub Discussion #17788**, this configuration only prevents timer-based automatic refresh but still triggers refresh on session initialization and `getSession()` calls. When combined with custom storage implementations and PKCE flow, this creates a perfect storm for infinite refresh loops.

The issue manifests through a specific sequence: successful SIGNED_IN event → immediate TOKEN_REFRESHED events every few milliseconds → HTTP 429 rate limit errors after 50+ attempts → automatic SIGNED_OUT. This pattern indicates that the client is attempting to refresh an already-valid token repeatedly, likely due to session validation logic conflicts.

## Why Supabase v2.46.2 ignores autoRefreshToken settings

Research reveals that `autoRefreshToken: false` is only partially implemented in the Supabase client. The setting prevents scheduled timer-based refreshes but doesn't stop refresh attempts during:

- Initial client creation with `persistSession: true`
- Every `getSession()` call when tokens appear expired
- Session recovery from storage
- Auth state change callbacks containing async operations

**GitHub Issue #762** documents a critical deadlock bug where async Supabase calls within `onAuthStateChange` callbacks cause subsequent calls to hang. This creates symptoms similar to infinite loops, especially when TOKEN_REFRESHED events trigger database operations. The locking mechanism introduced to prevent refresh token reuse inadvertently creates deadlocks under certain conditions.

## Browser-specific authentication behaviors and extension interference

The browser-specific nature of this issue points to several potential causes:

**Storage Context Conflicts**: Browser extensions maintain separate localStorage namespaces that can interfere with Supabase's session management. Extensions using Chrome Identity API or monitoring tab events can disrupt OAuth flows and token handling.

**Race Conditions in Custom Storage**: Your custom localStorage wrapper with caching may introduce timing issues. Asynchronous storage operations can create race conditions during rapid token refresh cycles, especially when multiple browser tabs attempt simultaneous refresh.

**Production Environment Differences**: Vercel deployments introduce additional complexity through edge runtime limitations, environment variable handling, and cold start behaviors that differ from local development.

## PKCE flow and detectSessionInUrl interaction bugs

**GitHub Issue #931** confirms that `detectSessionInUrl: false` is ignored when using PKCE flow. The code logic shows:

```javascript
if (isPKCEFlow || (this.detectSessionInUrl && this._isImplicitGrantFlow())) {
  const { data, error } = await this._getSessionFromURL(isPKCEFlow)
}
```

This means PKCE always attempts to detect sessions from URLs, potentially causing unwanted session recovery attempts that trigger refresh loops.

## Custom storage implementation causing token refresh issues

Your custom storage wrapper with caching is a likely culprit. Common problematic patterns include:

- **Async/Sync Mismatch**: localStorage is synchronous, but custom wrappers often make it asynchronous
- **Write Conflicts**: Caching layers can cause stale token reads during rapid refresh cycles
- **Incomplete Implementation**: Missing error handling or race condition prevention

The storage key `'sb-zqcjipwiznesnbgbocnu-auth-token'` suggests a production Supabase instance. Multiple tabs or contexts accessing this key simultaneously can corrupt the authentication state.

## Solutions for completely disabling automatic token refresh

To completely disable automatic token refresh, implement this configuration:

```typescript
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false, // Critical: prevents session recovery
      detectSessionInUrl: false,
      flowType: 'pkce'
    }
  }
)
```

Note that setting `persistSession: false` is crucial - this prevents the client from attempting to recover and refresh sessions from storage on initialization.

## Manual token management strategies

Implement a custom token manager that gives you complete control:

```typescript
class TokenManager {
  private refreshTimeout: NodeJS.Timeout | null = null
  private isRefreshing = false
  
  async manualRefresh(client: SupabaseClient) {
    if (this.isRefreshing) return
    
    this.isRefreshing = true
    try {
      const { data, error } = await client.auth.refreshSession()
      if (!error && data.session) {
        this.scheduleNextRefresh(data.session.expires_at)
      }
    } finally {
      this.isRefreshing = false
    }
  }
  
  private scheduleNextRefresh(expiresAt?: string) {
    if (!expiresAt) return
    
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now()
    const refreshTime = msUntilExpiry - 60000 // 1 minute before expiry
    
    if (refreshTime > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.manualRefresh(supabase)
      }, refreshTime)
    }
  }
}
```

## Storage key conflicts and session validation fixes

To prevent storage conflicts:

1. **Implement storage locks** to prevent concurrent access
2. **Use session versioning** to detect stale tokens
3. **Add browser tab coordination** using BroadcastChannel API
4. **Validate sessions without triggering refresh**:

```typescript
async function validateSessionWithoutRefresh() {
  const stored = localStorage.getItem('sb-zqcjipwiznesnbgbocnu-auth-token')
  if (!stored) return null
  
  const { session } = JSON.parse(stored)
  const expiresAt = new Date(session.expires_at).getTime()
  const isValid = expiresAt > Date.now()
  
  return isValid ? session : null
}
```

## Rate limiting patterns and 429 error prevention

Supabase enforces a rate limit of **1800 requests per hour** for token refresh endpoints, with a burst allowance of 30 requests. To handle 429 errors:

```typescript
async function refreshWithBackoff(attempt = 0): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data.session
  } catch (error: any) {
    if (error.status === 429 && attempt < 5) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 60000)
      await new Promise(resolve => setTimeout(resolve, delay))
      return refreshWithBackoff(attempt + 1)
    }
    throw error
  }
}
```

## Immediate fixes for your specific setup

For your React 19 + Vite production environment on Vercel:

1. **Disable all automatic refresh mechanisms**:
```typescript
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})
```

2. **Implement synchronous storage** to eliminate race conditions:
```typescript
const storage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key)
}
```

3. **Add auth event debouncing**:
```typescript
let authChangeTimeout: NodeJS.Timeout
supabase.auth.onAuthStateChange((event, session) => {
  clearTimeout(authChangeTimeout)
  authChangeTimeout = setTimeout(() => {
    if (event === 'TOKEN_REFRESHED') {
      // Handle refresh with debounce
    }
  }, 100)
})
```

4. **Monitor and prevent refresh loops**:
```typescript
const refreshAttempts = new Map<string, number>()

function preventRefreshLoop(sessionId: string): boolean {
  const attempts = refreshAttempts.get(sessionId) || 0
  if (attempts > 3) {
    console.error('Refresh loop detected')
    return false
  }
  refreshAttempts.set(sessionId, attempts + 1)
  setTimeout(() => refreshAttempts.delete(sessionId), 60000)
  return true
}
```

## Long-term recommendations

**Version Migration**: Consider upgrading beyond v2.46.2 once you've stabilized the current implementation. Later versions include improvements to the auth flow, though core issues with `autoRefreshToken` persist.

**Architecture Changes**: For production applications experiencing these issues, consider:
- Server-side session management with HTTP-only cookies
- Proxy authentication through your backend
- Implementing a custom auth provider that wraps Supabase

**Monitoring**: Implement comprehensive logging for auth events to detect patterns:
- Track TOKEN_REFRESHED frequency
- Monitor 429 error rates
- Alert on refresh loops exceeding thresholds

The Supabase team has acknowledged several of these issues but hasn't provided comprehensive fixes in v2.46.2. The combination of workarounds presented here should resolve the infinite refresh loop while maintaining secure authentication in your production environment.