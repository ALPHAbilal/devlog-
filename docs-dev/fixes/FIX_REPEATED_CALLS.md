# Fix for Repeated API Calls Issue

## Problem
The application is making repeated calls in this pattern:
- `user` (check user session)
- `token?grant_type=refresh_token` (refresh token)
- `get_documents_with_stats` (load documents)

This creates unnecessary load on the Supabase backend.

## Root Causes

### 1. Multiple Components Checking Auth State
When multiple components or hooks check authentication state simultaneously, they can trigger multiple refresh attempts.

### 2. Dashboard Reloading on Auth Changes
The Dashboard component reloads entries whenever auth state changes, which happens during token refresh.

### 3. Background Monitoring Tools
- **SystemHealthMonitor**: Updates every 5 seconds
- **DatabaseUsage Hook**: Refreshes every 30 seconds
- **Auto-save Manager**: Configurable interval (set to 1 second in logs)

## Solutions

### 1. Prevent Dashboard Reload on TOKEN_REFRESHED
The Dashboard should not reload entries when only a token refresh occurs:

```javascript
// In Dashboard.jsx, add a more specific dependency
useEffect(() => {
  // Only load entries on initial mount or user change
  // Not on TOKEN_REFRESHED events
  loadEntries();
}, [user?.id]); // Only reload if user ID changes, not on token refresh
```

### 2. Disable Frequent Background Updates
Check if these components are active:
- SystemHealthMonitor (5-second updates)
- Database usage monitoring (30-second updates)

### 3. Increase Auto-save Interval
The logs show auto-save running every 1 second. Increase this:

```javascript
// Change from 1 second to 30 seconds or more
useGlobalAutoSave(30); // 30 seconds instead of 1
```

### 4. Add Request Deduplication
The Supabase client already has deduplication, but ensure it's working:

```javascript
// In supabaseOptimized.js
async getDocuments() {
  // Use deduplication key based on user ID
  return this.deduplicateRequest(`documents-${user.id}`, async () => {
    return await this.client.rpc('get_documents_with_stats');
  });
}
```

## Quick Fixes to Try

### 1. Emergency Stop Background Tasks
In browser console:
```javascript
// Stop all intervals
const highestId = window.setTimeout(() => {}, 0);
for (let i = 0; i < highestId; i++) {
  window.clearTimeout(i);
  window.clearInterval(i);
}
```

### 2. Check Active Intervals
```javascript
// See what's running
console.log('Auto-save interval:', window.__globalAutoSaveManager?.intervalMs);
```

### 3. Disable Background Features Temporarily
```javascript
// Disable auto-save
window.__globalAutoSaveManager?.stop();

// Set flag to prevent health monitoring
localStorage.setItem('DISABLE_HEALTH_MONITOR', 'true');
```

## Long-term Solution

1. **Implement proper auth state management** that doesn't trigger data reloads on token refresh
2. **Consolidate background tasks** into a single interval manager
3. **Add circuit breakers** for all API calls, not just auth
4. **Implement exponential backoff** for failed requests

## Debugging Steps

1. Open browser DevTools Network tab
2. Look for the initiator of repeated calls
3. Check the call stack to identify which component triggers them
4. Add console.trace() in the following places:
   - Before `get_documents_with_stats` calls
   - In auth state change handlers
   - In useEffect hooks that load data

## Immediate Action Items

1. **Increase auto-save interval** from 1 second to at least 30 seconds
2. **Add user ID dependency** to Dashboard data loading effect
3. **Check if SystemHealthMonitor is active** and disable if not needed
4. **Implement request deduplication** for document fetching