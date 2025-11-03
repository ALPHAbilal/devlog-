# OAuth Password Change UI Fix

**Date**: 2025-11-03
**Change**: Conditional password change UI based on authentication provider

## What Changed

The settings page now detects the user's authentication method and **conditionally shows or hides** the password change UI.

### Before
- ❌ Password change form shown to ALL users (email/password AND OAuth)
- ❌ Google/GitHub users could attempt password changes (would fail)
- ❌ Confusing UX: "Why can't I change my password?"

### After
- ✅ Password change shown ONLY for email/password users
- ✅ OAuth users see their authentication provider info instead
- ✅ Clear messaging: "Your password is managed by {provider}"

## Code Changes

### File: `src/pages/SettingsClaude.jsx`

**Lines 196-201** (Provider Detection):
```javascript
// Authentication provider detection
// user.app_metadata.provider is set by Supabase for OAuth users (google, github, etc.)
// For email/password users, it's undefined or 'email'
const authProvider = user?.app_metadata?.provider;
const isOAuthUser = authProvider && authProvider !== 'email';
const isEmailPasswordUser = !authProvider || authProvider === 'email';
```

**Lines 498-554** (Conditional Rendering - Desktop):
```javascript
<SettingGroup title="Security">
  {isEmailPasswordUser ? (
    // Show password change for email/password users
    isMobile ? (
      <button className="password-trigger-btn" onClick={() => setShowPasswordSheet(true)}>
        <Lock size={20} />
        <span>Change Password</span>
      </button>
    ) : (
      <form onSubmit={handlePasswordChange} className="password-form">
        {/* Password change form */}
      </form>
    )
  ) : (
    // Show OAuth provider info for OAuth users
    <div className="oauth-auth-info">
      <div className="setting-item">
        <div className="setting-content">
          <label className="setting-label">Authentication Method</label>
          <p className="setting-value" style={{ textTransform: 'capitalize' }}>
            {authProvider} OAuth
          </p>
          <p className="setting-description">
            Your password is managed by {authProvider}. Sign in to your {authProvider} account to change your password.
          </p>
        </div>
      </div>
    </div>
  )}
</SettingGroup>
```

**Line 799** (Mobile Bottom Sheet):
```javascript
// Only render for email/password users
{isMobile && isEmailPasswordUser && (
  <MobileBottomSheet isOpen={showPasswordSheet} title="Change Password">
    {/* Password change form */}
  </MobileBottomSheet>
)}
```

## How It Works

### Authentication Provider Detection

Supabase automatically sets `user.app_metadata.provider` based on how the user authenticated:

| Authentication Method | `app_metadata.provider` Value |
|-----------------------|-------------------------------|
| Email/Password        | `undefined` or `'email'`     |
| Google OAuth          | `'google'`                   |
| GitHub OAuth          | `'github'`                   |
| Facebook OAuth        | `'facebook'`                 |
| Twitter OAuth         | `'twitter'`                  |

### UI Logic

```javascript
const isEmailPasswordUser = !authProvider || authProvider === 'email';
const isOAuthUser = authProvider && authProvider !== 'email';

// Password change UI shown when:
isEmailPasswordUser === true  // User signed up with email/password

// OAuth info shown when:
isOAuthUser === true  // User signed in with Google, GitHub, etc.
```

## User Experience

### For Email/Password Users
1. Sign in with email and password
2. Go to Settings → Account → Security
3. ✅ See "Change Password" form
4. Enter new password + confirmation
5. Click "Update Password"
6. ✅ Password updated successfully

### For OAuth Users (Google, GitHub, etc.)
1. Sign in with Google/GitHub
2. Go to Settings → Account → Security
3. ✅ See "Authentication Method: Google OAuth"
4. ✅ See message: "Your password is managed by google. Sign in to your google account to change your password."
5. ❌ No password change form (correctly hidden)

## Benefits

1. **Prevents Confusion**
   - OAuth users no longer see unusable password fields
   - Clear explanation of how their authentication works

2. **Better UX**
   - Appropriate UI for each authentication method
   - No failed password change attempts

3. **Maintains Security**
   - Password change still works perfectly for email/password users
   - OAuth users directed to their provider for password management

4. **Clean Code**
   - Simple provider detection using Supabase metadata
   - No additional API calls needed
   - Works on both desktop and mobile

## Testing

### Test Email/Password User
1. Create account with email and password
2. Go to Settings → Security
3. ✅ Verify "Change Password" form is visible
4. Change password to confirm it works
5. ✅ Verify password update succeeds

### Test Google OAuth User
1. Sign in with Google
2. Go to Settings → Security
3. ✅ Verify NO password change form
4. ✅ Verify "Authentication Method: Google OAuth" message
5. ✅ Verify explanation text about Google password management

### Test GitHub OAuth User
1. Sign in with GitHub
2. Go to Settings → Security
3. ✅ Verify NO password change form
4. ✅ Verify "Authentication Method: Github OAuth" message
5. ✅ Verify explanation text about GitHub password management

### Test Mobile
1. Test above scenarios on mobile device
2. ✅ Verify email/password users can tap "Change Password" button
3. ✅ Verify bottom sheet appears with password form
4. ✅ Verify OAuth users don't see password button

## Edge Cases Handled

### User Links Multiple Providers
If a user signs up with Google but later links email/password:
- Currently shows OAuth info (first provider used)
- Future enhancement: Could detect multiple auth methods using `getUserIdentities()` API

### Provider Value Capitalization
- Uses `textTransform: 'capitalize'` for display
- "google" → "Google"
- "github" → "Github"

### Missing Provider Data
- Falls back to email/password UI if `app_metadata.provider` is undefined
- Safe default behavior

## Related Documentation

- Research document: `thoughts/shared/research/2025-11-03-authentication-session-timeout-and-oauth-password-ui.md`
- Session timeout fix: `INACTIVITY_TIMEOUT_DISABLED.md`
- Supabase docs: https://supabase.com/docs/guides/auth/users
- Code location: `src/pages/SettingsClaude.jsx:196-554, 799-850`

## Future Enhancements

### Multiple Authentication Methods
Use `getUserIdentities()` API for more robust detection:

```javascript
useEffect(() => {
  async function checkAuthMethods() {
    const { data } = await supabase.auth.getUserIdentities();

    const hasPassword = data.identities.some(i => i.provider === 'email');
    const oauthProviders = data.identities
      .filter(i => i.provider !== 'email')
      .map(i => i.provider);

    setAuthMethods({ hasPassword, oauthProviders });
  }
  checkAuthMethods();
}, []);
```

This would allow:
- Showing password change if user has email auth (even if they also have Google)
- Listing all linked OAuth providers
- Account linking functionality

### Password Strength Validation
Add client-side password strength checks:
- Minimum length (8+ characters)
- Contains uppercase, lowercase, numbers
- Visual strength indicator

### Success Toast
Show confirmation when password is changed:
```javascript
toast.success('Password updated successfully');
```
