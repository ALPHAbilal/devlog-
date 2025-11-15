# 🐛 Authentication Timeout Debug Guide

## What We Added

Strategic logging has been added at **18 critical points** in the authentication flow to track exactly what's causing the 20-30 minute logout issue.

## How to Use This Guide

1. **Log in** to your application
2. **Open Browser Console** (F12 → Console tab)
3. **Watch for debug logs** with prefix `[DEBUG-TIMEOUT-X]`
4. **Look for the patterns** described below

---

## 📊 Debug Log Reference

### Initialization Phase (On App Load)

**[DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized**
```javascript
{
  defaultTimeout_ms: 259200000,
  defaultTimeout_hours: 72,
  defaultTimeout_days: 3,
  timestamp: "2025-11-15T..."
}
```
✅ **What to check**: `defaultTimeout_days` should be **3** (not 0.02 = 30 minutes)

---

### Settings Override Phase

**[DEBUG-TIMEOUT-14] ⚙️ Settings from LOCALSTORAGE**
```javascript
{
  source: 'localStorage.devlogSettings',
  sessionTimeout_minutes: 4320,  // ← CHECK THIS!
  sessionTimeout_hours: 72,
  allSettings: {...}
}
```
❌ **Problem if you see**: `sessionTimeout_minutes: 30` (30 minutes!)
✅ **Expected**: `sessionTimeout_minutes: 4320` (3 days)

**[DEBUG-TIMEOUT-15] ℹ️ No localStorage settings found**
- This is fine - means using defaults

**[DEBUG-TIMEOUT-16] 💾 Settings from DATABASE**
```javascript
{
  source: 'profiles.settings',
  userId: "...",
  sessionTimeout_minutes: 4320,  // ← CHECK THIS!
  sessionTimeout_hours: 72
}
```
❌ **Problem if you see**: `sessionTimeout_minutes: 30` or `20`
✅ **Expected**: `sessionTimeout_minutes: 4320` (3 days)

**[DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN**
```javascript
{
  oldTimeout_hours: 72,
  newTimeout_minutes: 30,  // ← THIS IS THE PROBLEM!
  newTimeout_hours: 0.5,
  source: 'setInactivityTimeout() call',
  stackTrace: "..."  // Shows which code called it
}
```
🚨 **CRITICAL**: If you see this with `newTimeout_hours < 1`, you found the bug!
- Check the `stackTrace` to see where the override came from
- Most likely: `SettingsContext.jsx` loading old localStorage/database value

---

### Activity Monitoring Phase

**[DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED**
```javascript
{
  events: ['mousedown', 'keydown', 'scroll', 'touchstart'],
  timeout_hours: 72
}
```
✅ **What to check**: `timeout_hours` should be **72** (3 days)

**[DEBUG-TIMEOUT-7] 🖱️ User activity detected**
- Logs every 60 seconds when you interact
- Shows timer is resetting properly
- If you DON'T see this when clicking/typing → Activity monitoring broken

**[DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET**
```javascript
{
  timeout_hours: 72,
  willExpireAt: "2025-11-18T..."  // 3 days from now
}
```
✅ **What to check**: `willExpireAt` should be **3 days** in the future

---

### Token Refresh Phase

**[DEBUG-TIMEOUT-8] 🔑 JWT Token status**
```javascript
{
  expiresAt: "2025-11-15T11:00:00Z",
  timeUntilExpiry_minutes: 55,
  refreshThreshold_seconds: 300,
  willRefreshSoon: false
}
```
✅ **What to check**: `timeUntilExpiry_minutes` should be reasonable (> 5 minutes)
❌ **Problem if**: Token expires in < 5 minutes constantly

**[DEBUG-TIMEOUT-10] 🔄 Token refresh STARTED**
**[DEBUG-TIMEOUT-12] ✅ Token refresh SUCCESS**
- Shows automatic token refresh is working
- Should happen every ~55 minutes (before 1-hour token expires)

**[DEBUG-TIMEOUT-11] ❌ Token refresh FAILED**
```javascript
{
  error: "...",
  errorCode: "...",
  failedRefreshCount: 1,
  willForceSignOut: false
}
```
🚨 **CRITICAL**: If you see `willForceSignOut: true` → Refresh token is invalid/expired
- This suggests **Supabase Dashboard** has a short refresh token expiry

**[DEBUG-TIMEOUT-13] 🚨 FORCED SIGN-OUT after multiple refresh failures**
- This means 3+ refresh attempts failed
- **ROOT CAUSE**: Supabase Dashboard refresh token expiry is too short

---

### Timeout Trigger Phase

**[DEBUG-TIMEOUT-5] 🚨 TIMEOUT TRIGGERED - Signing out user**
```javascript
{
  timeout_hours: 0.5,  // ← CHECK THIS!
  triggeredAt: "2025-11-15T10:30:00Z",
  reason: 'inactivity'
}
```
🚨 **CRITICAL**: This is the smoking gun!
- Check `timeout_hours` - if it's 0.5 (30 min) or 0.33 (20 min), you found the bug
- Check timestamp to see exactly when timeout occurred

---

## 🔍 Diagnostic Scenarios

### Scenario A: localStorage Override (Most Common)

**What you'll see in console**:
```
[DEBUG-TIMEOUT-1] defaultTimeout_days: 3  ✅
[DEBUG-TIMEOUT-14] sessionTimeout_minutes: 30  ❌ PROBLEM!
[DEBUG-TIMEOUT-2] newTimeout_hours: 0.5  ❌ PROBLEM!
... (30 minutes later)
[DEBUG-TIMEOUT-5] TIMEOUT TRIGGERED, timeout_hours: 0.5  ❌
```

**Fix**:
```javascript
// In browser console:
localStorage.removeItem('devlogSettings');
// Refresh the page
```

---

### Scenario B: Database Profile Override

**What you'll see in console**:
```
[DEBUG-TIMEOUT-1] defaultTimeout_days: 3  ✅
[DEBUG-TIMEOUT-15] No localStorage settings found  ✅
[DEBUG-TIMEOUT-16] sessionTimeout_minutes: 20  ❌ PROBLEM!
[DEBUG-TIMEOUT-2] newTimeout_hours: 0.33  ❌ PROBLEM!
... (20 minutes later)
[DEBUG-TIMEOUT-5] TIMEOUT TRIGGERED, timeout_hours: 0.33  ❌
```

**Fix**: Run this SQL in Supabase:
```sql
UPDATE profiles
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb),
  '{sessionTimeout}',
  '4320'::jsonb  -- 3 days in minutes
)
WHERE id = 'YOUR_USER_ID';
```

---

### Scenario C: Server-Side JWT/Refresh Token Expiry

**What you'll see in console**:
```
[DEBUG-TIMEOUT-1] defaultTimeout_days: 3  ✅
[DEBUG-TIMEOUT-15] No localStorage settings found  ✅
[DEBUG-TIMEOUT-18] No database settings found  ✅
... (every ~55 minutes)
[DEBUG-TIMEOUT-10] Token refresh STARTED
[DEBUG-TIMEOUT-11] Token refresh FAILED, errorCode: "..."  ❌
[DEBUG-TIMEOUT-11] failedRefreshCount: 3
[DEBUG-TIMEOUT-13] FORCED SIGN-OUT after multiple refresh failures  ❌
```

**Fix**: Check Supabase Dashboard
1. Go to: Dashboard → Authentication → Settings → Advanced
2. Check these settings:
   - JWT Expiry Limit: Should be ≥ 3600 (1 hour)
   - Time-box user sessions: Should be DISABLED or ≥ 259200 (3 days)
   - Refresh token expiry: Should be DISABLED or very long

---

### Scenario D: Everything Looks Good But Still Logs Out

**What you'll see in console**:
```
[DEBUG-TIMEOUT-1] defaultTimeout_days: 3  ✅
[DEBUG-TIMEOUT-15] No localStorage settings  ✅
[DEBUG-TIMEOUT-18] No database settings  ✅
[DEBUG-TIMEOUT-6] Activity monitoring ENABLED, timeout_hours: 72  ✅
[DEBUG-TIMEOUT-7] User activity detected (many times)  ✅
[DEBUG-TIMEOUT-12] Token refresh SUCCESS (multiple times)  ✅
... (still logs out after 20-30 min)  ❌
```

**Possible causes**:
1. **Server-side inactivity timeout** in Supabase Dashboard
2. **Network/firewall** dropping long-lived connections
3. **Browser** clearing session storage

**Next steps**:
- Manually check Supabase Dashboard settings
- Test in incognito mode (rules out extensions)
- Test on different network
- Check browser console for non-DEBUG errors

---

## 📋 Quick Checklist

After login, verify these logs appear:

- [ ] `[DEBUG-TIMEOUT-1]` shows `defaultTimeout_days: 3`
- [ ] `[DEBUG-TIMEOUT-6]` shows `timeout_hours: 72`
- [ ] `[DEBUG-TIMEOUT-7]` appears when you click/type
- [ ] `[DEBUG-TIMEOUT-8]` shows reasonable token expiry
- [ ] No `[DEBUG-TIMEOUT-2]` with `newTimeout_hours < 1`
- [ ] No `[DEBUG-TIMEOUT-11]` refresh failures
- [ ] No `[DEBUG-TIMEOUT-5]` timeout triggered (wait 30+ min to verify)

---

## 🎯 What to Report Back

**Copy and share these logs** from your browser console:

1. **All `[DEBUG-TIMEOUT-1]` through `[DEBUG-TIMEOUT-18]` logs** from initial page load
2. **Any logs with ❌ or 🚨 symbols**
3. **The exact time** you were logged out
4. **The `[DEBUG-TIMEOUT-5]` log** if timeout triggered

**Format**:
```
Logged in at: 10:00 AM
Logged out at: 10:30 AM (30 minutes later)

Console logs:
[DEBUG-TIMEOUT-1] defaultTimeout_days: 3
[DEBUG-TIMEOUT-14] sessionTimeout_minutes: 30  ← FOUND THE BUG!
[DEBUG-TIMEOUT-2] newTimeout_hours: 0.5
... (30 min later)
[DEBUG-TIMEOUT-5] TIMEOUT TRIGGERED, timeout_hours: 0.5
```

---

## 🔧 Emergency Fixes

### Fix 1: Clear All Settings (Nuclear Option)
```javascript
// In browser console:
localStorage.clear();
// Refresh page and log in again
```

### Fix 2: Force 3-Day Timeout
```javascript
// In browser console after login:
localStorage.setItem('devlogSettings', JSON.stringify({
  sessionTimeout: 4320  // 3 days in minutes
}));
// Refresh page
```

### Fix 3: Disable Timeout Entirely (Temporary Test)
```javascript
// In browser console:
import { setInactivityTimeout } from './src/lib/supabaseOptimized';
setInactivityTimeout(0);  // 0 = disabled
console.log('Timeout disabled - session will last indefinitely');
```

---

## 📖 Next Steps

1. **Log in and collect debug logs**
2. **Wait 30+ minutes** to see if timeout triggers
3. **Share the logs** (especially any with `newTimeout_hours < 1`)
4. Based on logs, we'll identify exact root cause and apply permanent fix
