# Session Timeout Disabled

**Date**: 2025-11-03
**Change**: Disabled custom inactivity timeout in Supabase client

## What Changed

The custom 30-minute inactivity timeout has been **disabled** in `src/lib/supabaseOptimized.js`.

### Before
- Users were automatically logged out after 30 minutes of inactivity
- Inactivity was detected by monitoring DOM events (mouse, keyboard, scroll, touch)
- Switching to another window/app counted as "inactivity" → forced logout
- Configuration: `this.inactivityTimeout = 30 * 60 * 1000`

### After
- **No forced logout due to inactivity**
- Sessions persist indefinitely through Supabase's automatic token refresh
- Users stay signed in as long as tokens can be refreshed (default Supabase behavior)
- Configuration: `this.inactivityTimeout = 0` (disabled)

## Code Changes

### File: `src/lib/supabaseOptimized.js`

**Line 30-32** (Constructor):
```javascript
// Inactivity timeout disabled - rely on Supabase's automatic token refresh
// Sessions will remain active as long as tokens can be refreshed
this.inactivityTimeout = 0; // 0 = disabled (previously 30 minutes)
```

**Line 246-251** (Activity Monitoring):
```javascript
setupActivityMonitoring() {
  // Skip setup if inactivity timeout is disabled
  if (this.inactivityTimeout === 0) {
    console.log('[Supabase] Activity monitoring disabled - sessions use automatic token refresh');
    return;
  }
  // ... rest of setup code (won't run when timeout is 0)
}
```

**Line 10-24** (Updated class documentation):
- Added clear documentation about session management
- Explained that sessions persist through automatic token refresh
- Noted this is ideal for developer tools

**Line 313-320** (setInactivityTimeout method):
- Added JSDoc documentation
- Clarified default behavior (disabled)
- Noted when to enable (specific security requirements)

## Session Management Now

### How Sessions Work
1. **Login**: User authenticates (email/password or OAuth)
2. **Token Storage**: Access token (1 hour) + refresh token (indefinite)
3. **Auto-Refresh**: Supabase automatically refreshes tokens 5 minutes before expiry
4. **No Timeout**: Sessions stay active as long as tokens refresh successfully

### Still Active Security Features
✅ Automatic token refresh (keeps sessions secure)
✅ PKCE flow (prevents authorization code interception)
✅ Secure token storage with encryption
✅ Browser fingerprint validation
✅ Suspicious activity detection (rapid refreshes, failed attempts)
✅ Multi-tab race condition prevention

### What's Disabled
❌ Client-side inactivity timeout
❌ Activity monitoring (mouse/keyboard tracking)
❌ Forced logout after 30 minutes

## Benefits

1. **Better User Experience**
   - No unexpected logouts when switching apps
   - Users can leave tab open while working elsewhere
   - Ideal for developer workflows (IDE → browser → terminal → docs)

2. **Simpler Code**
   - Removed unnecessary DOM event listeners
   - No activity tracking overhead
   - Relies on battle-tested Supabase session management

3. **Still Secure**
   - Tokens still expire and refresh
   - Suspicious activity detection still active
   - Browser fingerprint validation still enforced

## Re-enabling Timeout (If Needed)

If you need to re-enable inactivity timeout for specific security requirements:

```javascript
import { setInactivityTimeout } from './lib/supabaseOptimized';

// Set 2-hour timeout
setInactivityTimeout(120);

// Or disable again
setInactivityTimeout(0);
```

Or modify the default in `src/lib/supabaseOptimized.js:32`:
```javascript
this.inactivityTimeout = 2 * 60 * 60 * 1000; // 2 hours
```

## Testing

To verify the change:
1. Sign in to the application
2. Switch to another app for 30+ minutes
3. Return to Devlog
4. ✅ You should still be signed in
5. ✅ No automatic logout

The session will automatically refresh tokens in the background.

## Related Documentation

- Research document: `thoughts/shared/research/2025-11-03-authentication-session-timeout-and-oauth-password-ui.md`
- Supabase docs: https://supabase.com/docs/guides/auth/sessions
- Code location: `src/lib/supabaseOptimized.js`
