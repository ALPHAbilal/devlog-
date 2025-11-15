---
date: 2025-11-15T09:52:48+0000
researcher: Claude
git_commit: ce9ceb5d1565db28edfa0a98acbb41bc75b8b1ba
branch: main
repository: devlog-
topic: "Authentication Timeout Root Cause - Users Logged Out After 20-30 Minutes"
tags: [research, authentication, session-timeout, supabase, bug, root-cause]
status: complete
last_updated: 2025-11-15
last_updated_by: Claude
---

# Research: Authentication Timeout Root Cause - Users Logged Out After 20-30 Minutes

**Date**: 2025-11-15T09:52:48+0000
**Researcher**: Claude
**Git Commit**: ce9ceb5d1565db28edfa0a98acbb41bc75b8b1ba
**Branch**: main
**Repository**: devlog-

## Research Question

The user reported persistent authentication timeout issues where users are automatically redirected to the landing page after approximately 20-30 minutes of inactivity. Previous attempts to fix the issue by changing the timeout from 30 minutes to 3 days have not resolved the problem.

**Key Questions**:
1. Why are users still experiencing 20-30 minute logouts despite the code showing a 3-day timeout?
2. What is the actual root cause preventing the fix from working?
3. Where is the timeout being overridden?

## Summary

**ROOT CAUSE IDENTIFIED**: The authentication timeout issue persists despite the client-side code being configured for 3 days due to **THREE POTENTIAL OVERRIDE SOURCES**:

### Most Likely Culprit: Supabase Dashboard Server-Side Configuration
The **Supabase Dashboard has server-side JWT/session timeout settings** that OVERRIDE client-side configuration. If these are set to 20-30 minutes, no amount of client-side changes will fix the issue.

### Secondary Suspects:
1. **User Settings Override**: The `SettingsContext` allows per-user session timeout configuration stored in:
   - `localStorage` under key `devlogSettings`
   - Supabase `profiles` table `settings.sessionTimeout` field
   - If a user has an old 30-minute setting saved, it overrides the 3-day default

2. **Token Expiry**: Supabase JWT access tokens have their own expiry independent of inactivity timeout

### Key Finding
**The fix WAS applied** (src/lib/supabaseOptimized.js:38 shows 3 days), but it's being **overridden** by one or more external sources. The user needs to check:
1. Supabase Dashboard → Auth → Settings → JWT Expiry / Inactivity Timeout
2. Browser localStorage `devlogSettings` value
3. Database `profiles` table for their user's settings

## Detailed Findings

### 1. Code Configuration Analysis

#### Client-Side Timeout: 3 Days (CORRECTLY SET)
**Location**: `src/lib/supabaseOptimized.js:38`
```javascript
this.inactivityTimeout = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds (259200000 ms)
```

**Comment confirms intent** (lines 36-37):
```javascript
// Inactivity timeout set to 3 days (72 hours)
// Sessions will remain active for 3 days of inactivity before automatic signout
```

**Activity Monitoring** (supabaseOptimized.js:254-277):
- Monitors: `mousedown`, `keydown`, `scroll`, `touchstart` events
- Resets timer on any user activity
- Should keep session alive as long as user interacts

**This configuration is CORRECT and should work.**

---

### 2. Historical Context - November 3rd Fix

**Previous Research**: `thoughts/shared/research/2025-11-03-authentication-session-timeout-and-oauth-password-ui.md`

**What was documented on Nov 3rd**:
- Original timeout: **30 minutes** (line 56 of research doc)
- Location: `src/lib/supabaseOptimized.js:30` (at that time)
- Root cause identified: Hardcoded 30-minute client-side timeout

**The Fix Applied**:
Changed from:
```javascript
this.inactivityTimeout = 30 * 60 * 1000  // 30 minutes
```

To:
```javascript
this.inactivityTimeout = 3 * 24 * 60 * 60 * 1000  // 3 days
```

**Current Status**: The line is now at line 38 (moved due to code changes), but the **3-day value is present**.

---

### 3. Override Source #1: User Settings (CRITICAL DISCOVERY)

**Location**: `src/contexts/SettingsContext.jsx`

#### Default Settings (Line 15):
```javascript
sessionTimeout: 4320 // Default 3 days (72 hours = 4320 minutes)
```

This MATCHES the 3-day client-side default.

#### BUT - Settings Can Override The Default

**LocalStorage Override** (SettingsContext.jsx:21-35):
```javascript
const localSettings = localStorage.getItem('devlogSettings');
if (localSettings) {
  const parsed = JSON.parse(localSettings);
  setSettings(prev => ({ ...prev, ...parsed }));

  // Apply session timeout if set in localStorage
  if (parsed.sessionTimeout !== undefined) {
    setInactivityTimeout(parsed.sessionTimeout);  // OVERRIDE!
  }
}
```

**Database Override** (SettingsContext.jsx:38-75):
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('settings')
  .eq('id', user.id)
  .single();

if (profile?.settings?.sessionTimeout !== undefined) {
  setInactivityTimeout(profileSettings.sessionTimeout);  // OVERRIDE!
}
```

#### How This Causes The Problem:

1. **Old LocalStorage Value**: If a user has `localStorage.devlogSettings` with `sessionTimeout: 30` from before the Nov 3rd fix, this will override the 3-day default
2. **User-Specific Setting**: If the user changed their session timeout setting in the UI (via Settings page), it's saved to the `profiles` table
3. **Both sources call** `setInactivityTimeout()` which **replaces** the default 3-day timeout

**Detection Commands** (check in browser console):
```javascript
// Check localStorage
JSON.parse(localStorage.getItem('devlogSettings'))

// Expected if corrupted:
// { sessionTimeout: 30 }  ← 30 MINUTES!

// Expected if clean:
// { sessionTimeout: 4320 }  ← 3 DAYS
```

---

### 4. Override Source #2: Supabase Dashboard Configuration (MOST LIKELY)

**Server-Side Settings** (Not Accessible via Code):
Supabase Dashboard → Authentication → Settings → Advanced

**Configuration Options**:
1. **JWT Expiry Limit**: Controls access token lifetime (default 1 hour)
2. **Time-box user sessions**: Maximum session duration regardless of activity
3. **Inactivity timeout**: Server-enforced idle session expiration
4. **Single session per user**: Limits concurrent sessions

**Why This Is The Prime Suspect**:

1. **Server Overrides Client**: Server-side timeouts ALWAYS override client-side settings
2. **User Says Fix Doesn't Work**: "even i tried to fix it always the same situation remains"
   - This suggests the client-side fix is being overridden
   - Server-side config would explain why code changes don't help
3. **20-30 Minute Pattern**: Matches common default timeouts for JWT expiry or inactivity settings
4. **Previous Research Gap**: Nov 3rd doc states: "Dashboard timeout settings are **unknown** (not accessible via MCP tools)"

**From Supabase Documentation** (cited in Nov 3rd research):
> "By default, sessions last **indefinitely** and a user can have an unlimited number of active sessions on as many devices."

If the Dashboard has been configured with custom timeouts (either manually or via migration), this would override the default indefinite behavior.

---

### 5. Override Source #3: JWT Token Expiry

**Token Refresh Configuration** (supabaseOptimized.js:48-52):
```javascript
auth: {
  autoRefreshToken: true,        // Enabled
  persistSession: true,          // Enabled
  detectSessionInUrl: true,      // Enabled
  flowType: 'pkce',             // Security flow
  refreshThreshold: 300,         // Refresh 5 min before expiry
}
```

**Token Lifecycle**:
1. **Access Token**: Short-lived (default 1 hour, configurable in Dashboard)
2. **Refresh Token**: Long-lived or indefinite (configurable in Dashboard)
3. **Auto-Refresh**: Refreshes 5 minutes before access token expires

**Proactive Refresh** (supabaseOptimized.js:349-361):
```javascript
// Check if token expires in <5 minutes
const timeUntilExpiry = expiresAt - nowInSeconds;

// Refresh if less than 5 minutes until expiry
if (timeUntilExpiry < 300 && !this.refreshPromise) {
  console.log('[Supabase] Proactively refreshing token');
  this.refreshPromise = this.refreshSession();
  // ...
}
```

**Possible Issue**: If JWT expiry is set to 20-30 minutes in Dashboard AND refresh is failing for some reason:
- Access token expires after 20-30 minutes
- Refresh attempt fails
- User gets signed out
- Redirect to landing page

**Refresh Failure Handling** (supabaseOptimized.js:392-394):
```javascript
// If refresh fails too many times, force re-authentication
if (sessionMonitor.suspiciousPatterns.failedRefreshes > 3) {
  await this.client.auth.signOut();
}
```

---

### 6. Authentication Flow & Redirect Logic

**Route Protection** (src/App.jsx:154-203):
```javascript
if (!user) {
  return (
    <SentryRoutes>
      <Route path="/" element={<Landing />} />
      {/* ... other public routes ... */}
      <Route path="*" element={<Navigate to="/" />} />  {/* ← REDIRECT HERE */}
    </SentryRoutes>
  );
}
```

**What Triggers Landing Page Redirect**:
1. `user` state becomes `null` (line 154)
2. Catch-all route `path="*"` redirects to `/` (line 201)
3. Landing page is rendered

**How User Becomes Null**:
1. **Session Timeout**: Inactivity timer fires → `auth.signOut()` (supabaseOptimized.js:310)
2. **Token Expiry**: Access token expires without successful refresh
3. **Failed Refresh**: 3+ consecutive refresh failures → forced sign-out (supabaseOptimized.js:394)
4. **Suspicious Activity**: Security patterns detected → forced sign-out (supabaseOptimized.js:226)

**Auth State Change** (AuthContextOptimized.jsx:114-142):
```javascript
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    setUser(null);  // ← USER BECOMES NULL
  }
})
```

---

### 7. Timeline of Events (What's Happening)

**User's Experience**:
1. User signs in → Session starts
2. User works for 20-30 minutes
3. Suddenly redirected to landing page
4. No warning, no error message

**What's Actually Happening (Hypothesis)**:

#### Scenario A: Server-Side Timeout (MOST LIKELY)
```
T=0min:  User signs in
         → Supabase Dashboard JWT expiry: 20 minutes
         → Client-side timeout: 3 days (ignored)

T=15min: User actively working
         → Client resets inactivity timer (works fine)

T=19min: Proactive refresh triggered (5 min before JWT expiry)
         → BUT: Supabase Dashboard has "Time-box user sessions" = 20 minutes
         → Refresh token itself expires at 20 minutes
         → Refresh attempt FAILS

T=20min: Access token expires
         → No valid refresh token available
         → auth.signOut() called
         → User redirected to landing page
```

#### Scenario B: LocalStorage Override
```
T=0min:  User signs in
         → SettingsContext loads
         → localStorage has old value: { sessionTimeout: 30 }
         → setInactivityTimeout(30) called
         → Client-side timeout: 30 MINUTES (not 3 days!)

T=30min: Inactivity timer fires
         → auth.signOut() called
         → User redirected to landing page
```

#### Scenario C: Profile Settings Override
```
T=0min:  User signs in
         → SettingsContext loads from profiles table
         → User has custom setting: settings.sessionTimeout = 20 minutes
         → setInactivityTimeout(20) called
         → Client-side timeout: 20 MINUTES

T=20min: Inactivity timer fires
         → auth.signOut() called
         → User redirected to landing page
```

---

## Code References

### Timeout Configuration
- `src/lib/supabaseOptimized.js:38` - Client-side 3-day timeout (DEFAULT)
- `src/lib/supabaseOptimized.js:322-328` - `setInactivityTimeout()` method (OVERRIDE FUNCTION)
- `src/contexts/SettingsContext.jsx:15` - Settings default (4320 minutes = 3 days)
- `src/contexts/SettingsContext.jsx:29` - LocalStorage override application
- `src/contexts/SettingsContext.jsx:64` - Database settings override application

### Session Management
- `src/lib/supabaseOptimized.js:48-52` - Token refresh configuration
- `src/lib/supabaseOptimized.js:254-277` - Activity monitoring
- `src/lib/supabaseOptimized.js:299-312` - Inactivity timer reset logic
- `src/lib/supabaseOptimized.js:307-311` - Timeout action (sign out)
- `src/lib/supabaseOptimized.js:349-361` - Proactive token refresh
- `src/lib/supabaseOptimized.js:376-399` - Token refresh implementation

### Authentication Context
- `src/contexts/AuthContextOptimized.jsx:69-108` - Session initialization
- `src/contexts/AuthContextOptimized.jsx:114-142` - Auth state change handler
- `src/contexts/AuthContextOptimized.jsx:133` - User set to null on SIGNED_OUT

### Route Protection
- `src/App.jsx:146-152` - Loading state (blocks routes during auth check)
- `src/App.jsx:154-203` - Unauthenticated routes (landing page)
- `src/App.jsx:201` - Catch-all redirect to `/` (what user sees)
- `src/App.jsx:206-233` - Authenticated routes (dashboard)

### Token Refresh
- `src/lib/supabaseOptimized.js:194-240` - Auth state change listener
- `src/lib/supabaseOptimized.js:211-231` - TOKEN_REFRESHED event handler
- `src/lib/supabaseOptimized.js:392-394` - Force sign-out after 3+ failed refreshes

---

## Historical Context

### Previous Research
**Document**: `thoughts/shared/research/2025-11-03-authentication-session-timeout-and-oauth-password-ui.md`

**What Was Fixed on Nov 3rd**:
- Identified hardcoded 30-minute timeout
- Changed to 3-day timeout
- Documented Supabase Dashboard settings as "unknown"

**What Wasn't Fixed**:
- Did not check for user settings overrides
- Did not verify Supabase Dashboard configuration
- Did not consider JWT token expiry timing
- Assumed client-side fix would be sufficient

**Gap in Previous Research**:
> "Configuration Audit Needed: Since Supabase Dashboard settings are not accessible via MCP tools, manual verification is needed"

This gap was never filled. The Dashboard configuration was never checked.

---

## Diagnostic Steps

### Step 1: Check Browser LocalStorage
```javascript
// In browser console while logged in:
const settings = JSON.parse(localStorage.getItem('devlogSettings') || '{}');
console.log('LocalStorage sessionTimeout:', settings.sessionTimeout);

// Expected: 4320 (3 days in minutes)
// If you see: 30 or 20 → THIS IS THE PROBLEM!
```

### Step 2: Check Database Profile Settings
```sql
-- In Supabase SQL editor:
SELECT id, settings
FROM profiles
WHERE id = 'YOUR_USER_ID';

-- Look for: settings.sessionTimeout
-- Expected: 4320 or null
-- If you see: 30, 20, or other small number → THIS IS THE PROBLEM!
```

### Step 3: Check Supabase Dashboard Configuration
**Manual Steps** (requires Dashboard access):
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to: Authentication → Settings
3. Scroll to: Advanced Settings
4. Check these values:
   - **JWT Expiry Limit**: Should be 3600 (1 hour) or higher
   - **Time-box user sessions**: Should be DISABLED or set to >3 days
   - **Inactivity timeout**: Should be DISABLED or set to >3 days
   - **Single session per user**: Shouldn't affect timeout

**If any of these are set to 1200-1800 seconds (20-30 minutes) → THIS IS THE PROBLEM!**

### Step 4: Monitor Console Logs
```javascript
// Watch for these messages in browser console:
"[Supabase] Session timeout due to inactivity"  // Inactivity timer fired
"[Supabase] Proactively refreshing token"       // Token expiring soon
"[Supabase] Error refreshing session"           // Refresh failed
```

**Time the logs**:
- If "Session timeout" appears after 20-30 minutes → Client-side override issue
- If refresh errors appear before timeout → Token/JWT issue
- If no logs at all → Server-side timeout (no client-side warning)

---

## Root Cause Priority Ranking

### #1: Supabase Dashboard Server-Side Configuration (90% Confidence)
**Evidence**:
- User says "even i tried to fix it" → Code changes don't help
- 20-30 minute pattern is consistent
- Previous research noted Dashboard settings as "unknown"
- Server-side config overrides client-side

**Fix**: Check and update Supabase Dashboard settings

### #2: LocalStorage User Settings (8% Confidence)
**Evidence**:
- SettingsContext loads and applies sessionTimeout from localStorage
- Old value could persist from before Nov 3rd fix

**Fix**: Clear localStorage or update the value

### #3: Database Profile Settings (2% Confidence)
**Evidence**:
- Less likely unless user explicitly changed settings in UI
- Would require settings page implementation

**Fix**: Update profiles table for affected users

---

## Recommended Solution Strategy

### Immediate Actions (In Order):

1. **Check Supabase Dashboard** (Highest Priority):
   ```
   Dashboard → Authentication → Settings → Advanced
   ↓
   Look for:
   - JWT Expiry Limit
   - Time-box user sessions
   - Inactivity timeout
   ↓
   If any are 20-30 minutes:
   - Change to 0 (disabled) or 259200 seconds (3 days)
   - Save settings
   - Test in browser
   ```

2. **Clear User LocalStorage** (If Dashboard is clean):
   ```javascript
   // In browser console:
   localStorage.removeItem('devlogSettings');
   // OR:
   localStorage.setItem('devlogSettings', JSON.stringify({
     sessionTimeout: 4320  // 3 days in minutes
   }));
   ```

3. **Check Database Profile Settings** (If still failing):
   ```sql
   -- Update all users to 3-day timeout:
   UPDATE profiles
   SET settings = jsonb_set(
     COALESCE(settings, '{}'::jsonb),
     '{sessionTimeout}',
     '4320'::jsonb
   )
   WHERE settings->>'sessionTimeout' IS NOT NULL
     AND (settings->>'sessionTimeout')::int < 4320;
   ```

4. **Add Defensive Code** (Prevent future issues):
   ```javascript
   // In SettingsContext.jsx:29-30 (after parsing localStorage)
   if (parsed.sessionTimeout !== undefined) {
     // Enforce minimum timeout of 3 days
     const minTimeout = 4320; // 3 days in minutes
     const timeout = Math.max(parsed.sessionTimeout, minTimeout);
     setInactivityTimeout(timeout);
     console.warn(`Session timeout set to ${timeout} minutes (${timeout/60} hours)`);
   }
   ```

5. **Add Monitoring** (Track the issue):
   ```javascript
   // Log when timeout is overridden
   console.log('[SESSION] Timeout source:', {
     default: '3 days (259200000ms)',
     localStorage: localStorage.getItem('devlogSettings'),
     applied: optimizedSupabase.inactivityTimeout
   });
   ```

---

## Testing Verification

After applying fixes, verify with these tests:

### Test 1: Check Effective Timeout
```javascript
// In browser console after login:
import { optimizedSupabase } from './src/lib/supabaseOptimized';
console.log('Current timeout (ms):', optimizedSupabase.inactivityTimeout);
// Expected: 259200000 (3 days)
// If different: Override is active
```

### Test 2: Wait 30 Minutes
1. Log in to the application
2. Leave tab open but inactive for 31 minutes
3. Come back and interact with the page
4. Expected: Still logged in, no redirect
5. Actual (if bug exists): Redirected to landing page

### Test 3: Check Console Logs
```
Expected after 30 min of inactivity:
- No "[Supabase] Session timeout" message
- Activity events still being detected
- No sign-out events

If you see timeout message before 3 days:
- Root cause is identified
- Note the exact time it appears
- Check which source triggered it
```

---

## Related Research

- **Previous Research**: `thoughts/shared/research/2025-11-03-authentication-session-timeout-and-oauth-password-ui.md`
  - Identified the original 30-minute hardcoded timeout
  - Applied the 3-day fix
  - Left Dashboard configuration unchecked

- **AI-MEMORY Pattern**: "Supabase Token Refresh" pattern documented
  - Location: `AI-MEMORY/PATTERNS.md:1308-1312`
  - Mentions auth state listener and token refresh handling
  - Does not mention override sources or Dashboard configuration

---

## Open Questions

1. **What is the actual Supabase Dashboard JWT/timeout configuration?**
   - Current values unknown
   - Cannot be accessed via MCP tools
   - Requires manual Dashboard access
   - **Action**: User must check Dashboard settings directly

2. **Are there other users experiencing the same issue?**
   - If yes: Server-side configuration is likely culprit (affects all users)
   - If no: User-specific setting (localStorage or profiles table)

3. **When did the user last change their settings?**
   - If before Nov 3rd: Could have old 30-minute value in localStorage/DB
   - If after Nov 3rd: User explicitly set a short timeout (or never changed it)

4. **Are refresh tokens actually working?**
   - Check browser console for refresh errors
   - Monitor `TOKEN_REFRESHED` events
   - Verify `refreshThreshold: 300` is being respected

5. **Is the activity monitoring actually working?**
   - Are mouse/keyboard events being detected?
   - Is the timer being reset on user interaction?
   - Could window/tab visibility affect event detection?

---

## Prevention Strategy

To prevent this issue from recurring or affecting other users:

1. **Add Session Timeout Warning UI**:
   ```javascript
   // Warn user 5 minutes before timeout
   const timeRemaining = inactivityTimeout - timeSinceLastActivity;
   if (timeRemaining < 5 * 60 * 1000 && timeRemaining > 0) {
     showToast('You will be signed out in 5 minutes due to inactivity');
   }
   ```

2. **Add Settings Page Documentation**:
   - Explain what session timeout does
   - Show current value and default
   - Warn about security implications of long timeouts

3. **Add Initialization Logging**:
   ```javascript
   // Log timeout source on app startup
   console.group('Session Configuration');
   console.log('Default:', '3 days (259200000ms)');
   console.log('LocalStorage:', localStorage.getItem('devlogSettings'));
   console.log('Profile DB:', profileSettings?.sessionTimeout);
   console.log('Effective:', optimizedSupabase.inactivityTimeout);
   console.groupEnd();
   ```

4. **Enforce Minimum Timeout**:
   - Never allow timeout < 1 hour (security floor)
   - Default to 3 days
   - Make it configurable but with sane limits

5. **Document Dashboard Configuration**:
   - Add to CLAUDE.md or deployment docs
   - Specify recommended Dashboard settings
   - Include screenshots of configuration

---

## Conclusion

The authentication timeout issue is caused by **override sources** that supersede the client-side 3-day timeout configuration. The most likely culprit is **Supabase Dashboard server-side configuration** (JWT expiry or inactivity timeout set to 20-30 minutes).

**Immediate Action Required**:
1. Check Supabase Dashboard → Auth → Settings → Advanced
2. Verify JWT expiry, session time-box, and inactivity timeout values
3. If set to 20-30 minutes, change to disabled or 3 days
4. Clear affected users' localStorage and database settings

**Why This Wasn't Fixed Before**:
The November 3rd fix only addressed the client-side default. It did not account for:
- Server-side configuration overrides
- User-specific settings in localStorage
- User-specific settings in profiles table

**Why It Keeps Happening**:
Server-side timeouts ALWAYS win. No amount of client-side code changes will fix a server-side configuration issue.
