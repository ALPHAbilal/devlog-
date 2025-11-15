---
date: 2025-11-03T21:52:23+01:00
researcher: Claude
git_commit: f10a6132701240479d9259e3cc1f557ccd956947
branch: main
repository: devlog-
topic: "Authentication Session Timeout and OAuth Password Change UI Issues"
tags: [research, authentication, supabase, session-management, oauth, security]
status: complete
last_updated: 2025-11-03
last_updated_by: Claude
---

# Research: Authentication Session Timeout and OAuth Password Change UI Issues

**Date**: 2025-11-03T21:52:23+01:00
**Researcher**: Claude
**Git Commit**: f10a6132701240479d9259e3cc1f557ccd956947
**Branch**: main
**Repository**: devlog-

## Research Question

The user reported two authentication-related issues:
1. **Session timeout**: Users are automatically signed out after ~20 minutes of inactivity when switching to another window
2. **OAuth password change UI**: Google OAuth users still see password change options in settings, which shouldn't be shown since they don't have a password in Supabase

The research investigates:
- Current authentication implementation in the codebase
- Supabase session timeout configuration and best practices
- How to detect authentication providers and conditionally show UI
- Whether the codebase is using Supabase's session management features correctly

## Summary

**Root Causes Identified**:

1. **Session Timeout Issue**: The codebase has a **hardcoded 30-minute inactivity timeout** in `src/lib/supabaseOptimized.js:30` that automatically signs users out. This timeout is **NOT configured in Supabase Dashboard** but implemented as custom client-side logic. User activity resets the timer, but switching to another window/app stops activity detection, causing logout after 30 minutes.

2. **Password Change UI Issue**: The settings page (`src/pages/SettingsClaude.jsx`) **does NOT check the authentication provider** before showing password change forms. The UI is always displayed regardless of whether users authenticated via email/password or OAuth (Google/GitHub). Supabase provides `user.app_metadata.provider` for this purpose, but it's not being used in the settings page.

**Supabase Capabilities Confirmed**:
- ✅ Supabase supports configurable session timeouts via Dashboard → Auth Settings
- ✅ Supabase provides `user.app_metadata.provider` to detect authentication method
- ✅ Supabase auto-refresh tokens keep sessions alive by default (indefinite sessions)
- ✅ The codebase's custom 30-minute timeout **overrides** Supabase's default indefinite session behavior

## Detailed Findings

### 1. Session Timeout Implementation

#### Current Implementation (`src/lib/supabaseOptimized.js`)

**Hardcoded Timeout Configuration** (`supabaseOptimized.js:30`):
```javascript
this.inactivityTimeout = 30 * 60 * 1000  // 30 minutes in milliseconds
```

**Activity Monitoring Setup** (`supabaseOptimized.js:242-259`):
- Monitors DOM events: `mousedown`, `keydown`, `scroll`, `touchstart`
- Each activity resets the 30-minute countdown
- Listeners attached to `document` with `{ passive: true }`
- **Problem**: When user switches windows/apps, no events fire → timer continues → logout after 30 minutes

**Timeout Action** (`supabaseOptimized.js:289-293`):
```javascript
setTimeout(async () => {
  console.log('[Supabase] Session timeout due to inactivity');
  sessionMonitor.logActivity('session_timeout', { reason: 'inactivity' });
  await this.client.auth.signOut();  // Force sign out
}, this.inactivityTimeout)
```

**Activity Detection Limitation**:
- Events only fire when user interacts with the **current tab/window**
- Switching to email, Slack, or other apps = no activity detected
- User perception: "I was working, why did it log me out?"
- Reality: No DOM events in the browser tab for 30 minutes

#### Supabase's Default Behavior (Per Official Docs)

From Supabase documentation research:

> "By default, sessions last **indefinitely** and a user can have an unlimited number of active sessions on as many devices."

**Supabase Token Refresh System**:
- Access tokens: Short-lived (default 1 hour)
- Refresh tokens: Never expire (unless configured otherwise)
- `autoRefreshToken: true` keeps sessions alive automatically
- Refresh happens in background before token expires

**Configuration Options** (via Dashboard → Auth → Settings → Advanced):
1. **Time-box user sessions**: Maximum session duration (e.g., 24 hours)
2. **Inactivity timeout**: Idle session expiration (e.g., 30 minutes)
3. **Single session per user**: Only keep most recent session

**Current Codebase Status**:
- ✅ `autoRefreshToken: true` is enabled (`supabaseOptimized.js:40`)
- ✅ `persistSession: true` is enabled (`supabaseOptimized.js:41`)
- ❌ Dashboard timeout settings are **unknown** (not accessible via MCP tools)
- ⚠️ Custom 30-minute client-side timeout **overrides** Supabase defaults

#### Token Refresh Configuration

**Client Configuration** (`supabaseOptimized.js:38-44`):
```javascript
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,        // ✅ Automatic background refresh
    persistSession: true,          // ✅ Save session to localStorage
    detectSessionInUrl: true,      // ✅ Handle OAuth callbacks
    flowType: 'pkce',              // ✅ PKCE security flow
    refreshThreshold: 300,         // Refresh 5 min before expiry
  }
})
```

**Proactive Refresh Logic** (`supabaseOptimized.js:316-346`):
- `getSession()` checks if token expires in <5 minutes
- Automatically calls `refreshSession()` if needed
- Prevents token expiration during user session

**Token Refresh Events** (`supabaseOptimized.js:201-221`):
- `TOKEN_REFRESHED` event fires when tokens are renewed
- Resets the inactivity timer on each refresh
- Rate-limited to max 1 refresh per 5 seconds

### 2. Authentication Provider Detection

#### Available Provider Information

**User Object Structure**:
```javascript
const { data: { user } } = await supabase.auth.getUser()

// For OAuth users (Google, GitHub, etc.):
user.app_metadata.provider    // "google" | "github" | etc.
user.app_metadata.providers   // ["google"] or ["google", "email"]

// For email/password users:
user.app_metadata.provider    // undefined (or not set)
// Defaults to 'email' in the codebase
```

**Current Detection Pattern** (`src/App.jsx:79`):
```javascript
// Used for analytics tracking
const provider = user.app_metadata?.provider || 'email'
trackEvent('login', { method: provider });
```

This shows the codebase **already knows how to detect providers** but doesn't use it in the settings page.

#### getUserIdentities API (More Comprehensive)

Supabase provides a dedicated API for checking all authentication methods:

```javascript
const { data: identities } = await supabase.auth.getUserIdentities()

// Check if user has password authentication
const hasPassword = identities.identities.some(
  identity => identity.provider === 'email'
)

// Check if user has Google OAuth
const hasGoogle = identities.identities.some(
  identity => identity.provider === 'google'
)
```

**Benefits of getUserIdentities**:
- Supports multiple linked identities (user can have both email + Google)
- More reliable than just checking `app_metadata.provider`
- Handles identity linking scenarios

### 3. Settings Page Password Change UI

#### Current Implementation (`src/pages/SettingsClaude.jsx`)

**Password Change Form** (`SettingsClaude.jsx:491-529`):
```jsx
<SettingGroup title="Security">
  {isMobile ? (
    <button onClick={() => setShowPasswordSheet(true)}>
      <Lock size={20} />
      <span>Change Password</span>
    </button>
  ) : (
    <form onSubmit={handlePasswordChange} className="password-form">
      {/* Password input fields - ALWAYS SHOWN */}
      <input type="password" value={passwordForm.new} ... />
      <input type="password" value={passwordForm.confirm} ... />
      <Button type="submit">Update Password</Button>
    </form>
  )}
</SettingGroup>
```

**Problem**: No conditional rendering based on authentication provider.

**Password Update Handler** (`SettingsClaude.jsx:228-248`):
```javascript
const handlePasswordChange = async (e) => {
  e.preventDefault();
  if (passwordForm.new !== passwordForm.confirm) {
    setMessage({ type: 'error', text: 'Passwords do not match' });
    return;
  }

  setIsLoading(true);
  try {
    // This will fail or be ignored for OAuth users
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new
    });
    if (error) throw error;

    setPasswordForm({ new: '', confirm: '' });
    setShowPasswordSheet(false);
  } catch (error) {
    setMessage({ type: 'error', text: error.message });
  } finally {
    setIsLoading(false);
  }
};
```

**What Happens for OAuth Users**:
- Form is visible and submittable
- `updateUser({ password })` call likely fails or is ignored by Supabase
- User sees error message
- Confusing UX: "Why can't I change my password?"

#### Recommended Pattern (Not Currently Implemented)

**Option 1: Hide password change for OAuth users**
```jsx
const isEmailPasswordUser = !user?.app_metadata?.provider;

<SettingGroup title="Security">
  {isEmailPasswordUser && (
    <form onSubmit={handlePasswordChange}>
      {/* Password change form */}
    </form>
  )}
</SettingGroup>
```

**Option 2: Use getUserIdentities for accuracy**
```jsx
const [hasPassword, setHasPassword] = useState(false);

useEffect(() => {
  async function checkAuthMethods() {
    const { data } = await supabase.auth.getUserIdentities();
    const emailIdentity = data.identities.find(
      identity => identity.provider === 'email'
    );
    setHasPassword(!!emailIdentity);
  }
  checkAuthMethods();
}, []);

// Then in JSX:
{hasPassword && <form onSubmit={handlePasswordChange}>...</form>}
```

**Option 3: Show different UI for OAuth users**
```jsx
{user?.app_metadata?.provider ? (
  <div className="oauth-info">
    <p>You're signed in with {user.app_metadata.provider}</p>
    <p>Password management is handled by {user.app_metadata.provider}</p>
  </div>
) : (
  <form onSubmit={handlePasswordChange}>
    {/* Password change form */}
  </form>
)}
```

### 4. Supabase Session Management Best Practices

Based on official documentation research:

#### Default Recommendations

✅ **Use Default Settings for Most Apps**:
- JWT expiration: 1 hour (default)
- Session duration: Indefinite (default)
- Auto-refresh: Enabled

❌ **Don't Override Unless Necessary**:
- Most apps don't need custom inactivity timeouts
- Supabase handles token refresh automatically
- Client-side timeout can cause unexpected logouts

#### When to Use Inactivity Timeout

**Good Use Cases**:
- Banking/financial applications
- Medical records systems
- Admin dashboards with sensitive data
- Compliance requirements (PCI-DSS, HIPAA, etc.)

**Poor Use Cases**:
- Regular SaaS applications
- Developer tools (like Devlog)
- Content creation platforms
- Productivity apps

**Reasoning**: Developer tools often have users switching between IDE, browser, terminal, documentation. A 30-minute inactivity timeout creates friction and frustration.

#### Session Refresh Best Practices

**1. Listen to TOKEN_REFRESHED Events**:
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Session refreshed successfully')
    // Token automatically updated in storage
  }
})
```

**2. Store Access Token in Memory** (Performance):
```javascript
let accessToken = null;

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
    accessToken = session.access_token;  // Cache in memory
  }
})

// Use cached token instead of calling getSession() repeatedly
```

**3. Server-Side Validation**:
```javascript
// Always validate tokens server-side
const { data: { user } } = await supabase.auth.getUser()  // Validates with server
// NOT: await supabase.auth.getSession()  // Only reads localStorage
```

#### Preventing Unwanted Timeouts

**Option 1: Remove Custom Timeout** (Recommended for Devlog):
```javascript
// In supabaseOptimized.js, set to 0 to disable
this.inactivityTimeout = 0  // Disabled
```

**Option 2: Increase Timeout Duration**:
```javascript
// 2 hours instead of 30 minutes
this.inactivityTimeout = 2 * 60 * 60 * 1000
```

**Option 3: Use Supabase Dashboard Settings**:
- Configure timeout in Dashboard → Auth → Settings
- Remove client-side timeout code
- Let Supabase handle timeout enforcement
- Benefit: Centralized configuration, no code changes needed

**Option 4: Make Timeout Configurable**:
```javascript
// Allow users to set their preference
const timeout = userSettings.sessionTimeout || 0;  // Default: disabled
optimizedSupabase.setInactivityTimeout(timeout);
```

### 5. OAuth Authentication Flow

#### Current OAuth Implementation

**Sign In with Google** (`src/utils/auth.js:32-34`):
```javascript
export const signInWithGoogle = async () => {
  return signInWithProvider('google');
};
```

**Generic Provider Sign In** (`auth.js:19-29`):
```javascript
const signInWithProvider = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL() + 'auth/callback',
    },
  });
  if (error) throw error;
  return data;
};
```

**OAuth Callback Handler** (`src/pages/auth/callback.jsx`):
- Handles redirect from OAuth provider
- Supabase automatically extracts tokens from URL
- `detectSessionInUrl: true` enables this (configured in `supabaseOptimized.js:42`)

**Provider Metadata Storage**:
- Supabase automatically sets `user.app_metadata.provider = 'google'` for Google OAuth
- Also sets `user.app_metadata.providers = ['google']`
- No manual metadata updates needed

### 6. Security Implementations

#### Secure Token Storage (`src/utils/secureStorage.js`)

**Token Obfuscation** (`secureStorage.js:7-19`):
```javascript
// Tokens are reversed and base64 encoded
const obfuscate = (str) => btoa(str.split('').reverse().join(''))
const deobfuscate = (str) => atob(str).split('').reverse().join('')
```

**Browser Fingerprinting** (`secureStorage.js:22-36`):
- Creates unique fingerprint from browser characteristics
- Validates fingerprint on token retrieval
- Prevents token theft across devices

**Storage Wrapper** (`secureStorage.js:44-83`):
```javascript
setItem(key, value) {
  localStorage.setItem('ss_' + key, JSON.stringify({
    v: obfuscate(value),      // Obfuscated token
    f: this.fingerprint,      // Browser fingerprint
    t: Date.now()             // Timestamp
  }))
}

getItem(key) {
  const item = JSON.parse(localStorage.getItem('ss_' + key))

  // Validate fingerprint
  if (item.f !== this.fingerprint) {
    this.removeItem(key)
    return null
  }

  // Check max age (7 days)
  if (Date.now() - item.t > 7 * 24 * 60 * 60 * 1000) {
    this.removeItem(key)
    return null
  }

  return deobfuscate(item.v)
}
```

**Session Monitoring** (`secureStorage.js:111-183`):
- Tracks authentication events (sign in, refresh, timeout)
- Detects suspicious patterns:
  - Rapid refreshes (>5 per minute)
  - Failed refresh attempts (>3)
  - Browser fingerprint changes
- Force signs out on suspicious activity

## Code References

### Session Timeout Configuration
- `src/lib/supabaseOptimized.js:30` - Hardcoded 30-minute timeout
- `src/lib/supabaseOptimized.js:242-259` - Activity monitoring setup
- `src/lib/supabaseOptimized.js:281-294` - Timer reset logic
- `src/lib/supabaseOptimized.js:289-293` - Timeout action (sign out)

### Authentication Context
- `src/contexts/AuthContextOptimized.jsx:69-149` - Session initialization
- `src/contexts/AuthContextOptimized.jsx:114-142` - Auth state change subscription
- `src/contexts/AuthContextOptimized.jsx:13-30` - Sign in with email/password
- `src/contexts/AuthContextOptimized.jsx:51-66` - Sign out implementation

### Settings Page
- `src/pages/SettingsClaude.jsx:180` - useAuth() hook
- `src/pages/SettingsClaude.jsx:228-248` - Password change handler
- `src/pages/SettingsClaude.jsx:491-529` - Password change form (desktop)
- `src/pages/SettingsClaude.jsx:774-825` - Password change bottom sheet (mobile)

### Provider Detection Examples
- `src/App.jsx:79` - Analytics tracking with provider detection
- `src/utils/auth.js:19-39` - OAuth sign-in implementation

### Token Management
- `src/lib/supabaseOptimized.js:38-44` - Client auth configuration
- `src/lib/supabaseOptimized.js:316-346` - Proactive refresh logic
- `src/lib/supabaseOptimized.js:351-374` - Manual refresh implementation
- `src/lib/supabaseOptimized.js:201-221` - TOKEN_REFRESHED event handling

### Security
- `src/utils/secureStorage.js:7-19` - Token obfuscation
- `src/utils/secureStorage.js:22-36` - Browser fingerprinting
- `src/utils/secureStorage.js:44-83` - Secure storage wrapper
- `src/utils/secureStorage.js:137-163` - Suspicious pattern detection

## Architecture Documentation

### Current Authentication Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Activity Events                      │
│        (mousedown, keydown, scroll, touchstart)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │  Activity Event Handler      │
          │  (supabaseOptimized.js:245)  │
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   resetInactivityTimer()     │
          │   - Clear existing timer     │
          │   - Create new 30min timeout │
          └──────────────┬───────────────┘
                         │
                         │ (30 min passes)
                         ▼
          ┌──────────────────────────────┐
          │   Timeout Callback Fires     │
          │   - Log session_timeout      │
          │   - Force signOut()          │
          └──────────────┬───────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   SIGNED_OUT Event           │
          │   - Stop timer               │
          │   - Clear storage            │
          │   - Reset monitoring         │
          └──────────────────────────────┘
```

### Supabase Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Supabase Auto-Refresh System                    │
└─────────────────────────────────────────────────────────────┘
                         │
       ┌─────────────────┴─────────────────┐
       │                                   │
       ▼                                   ▼
┌─────────────────┐            ┌─────────────────────┐
│  Access Token   │            │   Refresh Token     │
│  (1 hour TTL)   │            │   (Never expires)   │
└────────┬────────┘            └──────────┬──────────┘
         │                                │
         │ (55 min passed)                │
         ▼                                │
  ┌─────────────────┐                    │
  │ Check expiry    │                    │
  │ <5 min left?    │                    │
  └────────┬────────┘                    │
           │ Yes                         │
           ▼                             │
  ┌─────────────────┐                   │
  │ refreshSession()│◄──────────────────┘
  │ Uses refresh    │
  │ token           │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ TOKEN_REFRESHED │
  │ Event           │
  └────────┬────────┘
           │
           ├──► Reset inactivity timer
           ├──► Update session cache
           └──► Notify auth subscribers
```

### Multi-Layer Storage Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Auth Token Storage Layers                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Layer 1: Supabase Auth Storage                              │
│  - Key: 'sb-zqcjipwiznesnbgbocnu-auth-token'                │
│  - Managed by Supabase client                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Layer 2: Custom Storage Adapter                             │
│  - Intercepts setItem/getItem/removeItem                     │
│  - Routes to secureStorage for auth token                    │
│  - Routes to localStorage for other data                     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Layer 3: Secure Storage                                     │
│  - Obfuscates token (reverse + base64)                       │
│  - Adds browser fingerprint                                  │
│  - Adds timestamp                                            │
│  - Validates on retrieval                                    │
│  - Key prefix: 'ss_auth_token'                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Layer 4: Browser localStorage                               │
│  - Final storage destination                                 │
│  - Format: { v: "encoded", f: "fingerprint", t: timestamp }  │
└──────────────────────────────────────────────────────────────┘
```

## Historical Context (from thoughts/)

No previous research documents found specifically on authentication session management or OAuth password UI issues. This is the first comprehensive documentation of these authentication patterns.

## Related Research

This research creates a foundation for:
- Future authentication feature implementations
- Security audit procedures
- User experience improvements for authentication flows

## Recommendations

### For Session Timeout Issue

**Option 1: Disable Custom Timeout** (Recommended for Devlog)
- Remove or set `this.inactivityTimeout = 0` in `supabaseOptimized.js:30`
- Rely on Supabase's default indefinite sessions
- Let users stay signed in as long as their tokens are valid
- Reasoning: Developer tools benefit from persistent sessions

**Option 2: Increase Timeout Duration**
- Change to 2-4 hours: `this.inactivityTimeout = 2 * 60 * 60 * 1000`
- Reduces logout frequency while maintaining some security
- Better matches user workflow patterns

**Option 3: Make Timeout Configurable**
- Add user setting for session timeout preference
- Options: Disabled, 1 hour, 2 hours, 4 hours, 8 hours
- Store in user settings/preferences
- Power users can disable, security-conscious users can enable

**Option 4: Improve Activity Detection**
- Use Visibility API to detect tab switching
- Pause timer when tab is not visible
- Resume timer when user returns
- Only count true inactivity (tab visible but no interaction)

**Option 5: Use Supabase Dashboard Settings**
- Configure timeout in Supabase Dashboard → Auth → Settings
- Remove client-side timeout implementation
- Benefit: Server-side enforcement, consistent across clients
- Note: Requires Supabase Dashboard access to configure

### For Password Change UI Issue

**Option 1: Conditional Rendering Based on Provider** (Simplest)
```jsx
const isEmailPasswordUser = !user?.app_metadata?.provider;

<SettingGroup title="Security">
  {isEmailPasswordUser ? (
    <form onSubmit={handlePasswordChange}>
      {/* Password change form */}
    </form>
  ) : (
    <div className="oauth-info">
      <p>Password managed by {user.app_metadata.provider}</p>
    </div>
  )}
</SettingGroup>
```

**Option 2: Use getUserIdentities API** (Most Accurate)
```jsx
const [authMethods, setAuthMethods] = useState({ email: false, oauth: [] });

useEffect(() => {
  async function loadAuthMethods() {
    const { data } = await supabase.auth.getUserIdentities();
    const methods = {
      email: data.identities.some(i => i.provider === 'email'),
      oauth: data.identities
        .filter(i => i.provider !== 'email')
        .map(i => i.provider)
    };
    setAuthMethods(methods);
  }
  loadAuthMethods();
}, []);

// In JSX:
{authMethods.email && <form onSubmit={handlePasswordChange}>...</form>}
{authMethods.oauth.length > 0 && (
  <div>Signed in with: {authMethods.oauth.join(', ')}</div>
)}
```

**Option 3: Show Account Linking Options**
- Allow users to link multiple auth methods
- Show all linked identities
- Allow adding password to OAuth accounts
- Allow linking Google to email accounts

### Configuration Audit Needed

Since Supabase Dashboard settings are not accessible via MCP tools, manual verification is needed:

**Check in Supabase Dashboard**:
1. Navigate to: Dashboard → Authentication → Settings → Advanced
2. Verify current settings:
   - JWT Expiry Limit: Should be 1 hour (3600 seconds)
   - Time-box user sessions: Check if set
   - Inactivity timeout: Check if set
   - Single session per user: Check if enabled
3. Document current values
4. Decide whether to use Dashboard settings or client-side timeout

## Open Questions

1. **Supabase Dashboard Configuration**: What are the current session timeout settings in the Supabase Dashboard? (Not accessible via MCP tools)

2. **User Preference**: Should session timeout be a user-configurable setting, or should it be fixed for all users?

3. **Multi-Tab Coordination**: How should the app handle session timeouts when multiple tabs are open? Should activity in one tab reset the timer for all tabs?

4. **Session Timeout Warnings**: Should users receive a warning before being automatically signed out? (e.g., "You'll be signed out in 5 minutes due to inactivity")

5. **Identity Linking Strategy**: Should the app support linking multiple authentication methods (email + Google + GitHub) to the same account?

6. **Password Change for Linked Accounts**: If a user signs up with Google but later adds email/password authentication, should the password change UI appear?

7. **Session Recovery**: Should the app attempt to restore the user's work state after a timeout-induced logout?
