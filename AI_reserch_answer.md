# Supabase Data Loss on Code Changes - Comprehensive Analysis

Based on extensive research into your issue, this appears to be a **common development environment problem** with specific technical causes rather than a fundamental bug. The partial data loss you're experiencing - where document titles persist but blocks disappear after code changes and refresh - stems from the complex interaction between React's development behavior, Vite's Hot Module Replacement (HMR), and Supabase's authentication and caching mechanisms.

## Root Causes Analysis

### React 19 Strict Mode Double Effects

**React 19's Strict Mode intentionally double-invokes effects during development** to help identify side effects[1][2][3]. This behavior can cause authentication and data loading functions to execute twice, potentially creating race conditions with your Supabase session management[4][5]. Since you're using lazy loading for blocks, the double execution may interfere with the timing of authentication verification and subsequent data fetching.

### Vite HMR and Session State Invalidation

**Vite's Hot Module Replacement can inadvertently clear browser storage** or reset application state during code changes[6][7]. While Vite doesn't directly clear localStorage/sessionStorage, HMR can trigger component remounting that affects how your application manages cached authentication tokens and session state[8][9]. Your 5-second application cache and sessionStorage for blocks may be getting invalidated during the HMR process.

### Supabase Authentication Token Refresh Issues

**Authentication tokens can become stale or invalid after development refreshes**[10][11][12]. The research reveals that Supabase's JWT tokens can sometimes show role as "anon" even after successful authentication, particularly in development environments[11]. This suggests that your blocks aren't loading because the authentication context isn't properly restored after code changes, causing RLS policies to deny access.

### Lazy Loading and Cache Invalidation Timing

**The combination of lazy loading and development environment cache clearing creates a race condition**[13][14]. Your blocks load on-demand when opening documents, but after a code refresh, the authentication session may not be fully restored by the time the lazy loading attempt occurs, resulting in empty results even though the data exists in the database.

## Evidence-Based Solutions

### 1. Development-Specific Authentication Handling

Implement more robust session restoration for development:

```javascript
// Enhanced session management for development
const useDevAuth = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add longer timeout for development
    const restoreSession = async () => {
      try {
        // Multiple attempts to restore session
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts  setTimeout(resolve, 500));
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
};
```

### 2. Robust Block Loading with Retry Logic

Enhance your block loader to handle development environment quirks:

```javascript
const loadBlocksWithRetry = async (documentId, maxRetries = 3) => {
  for (let attempt = 0; attempt  setTimeout(resolve, 1000));
        continue;
      }

      const { data: blocks, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('document_id', documentId)
        .order('position');

      if (error) throw error;
      return blocks;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
};
```

### 3. Development Cache Strategy

Implement a development-aware caching strategy[15][16]:

```javascript
const DevCache = {
  set: (key, data, ttl = 5000) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    // Use a combination of memory and sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`dev_cache_${key}`, JSON.stringify(item));
      } catch (e) {
        console.warn('SessionStorage not available, using memory cache only');
      }
    }
    
    // Memory fallback
    if (!window.devCacheMemory) window.devCacheMemory = new Map();
    window.devCacheMemory.set(key, item);
  },

  get: (key) => {
    // Try memory first (survives some HMR scenarios)
    if (window.devCacheMemory?.has(key)) {
      const item = window.devCacheMemory.get(key);
      if (Date.now() - item.timestamp 
  ) : (
    
      
    
  )
);
```

## Expected Behavior vs. Bug Classification

**This is expected development behavior, not a production bug**[3][4]. The research confirms that development environments with React Strict Mode, HMR, and authentication systems commonly experience these types of state management issues. The fact that your data persists in the database and normal app usage works perfectly indicates that your core implementation is sound.

## Best Practices for Development

### 1. Implement Development-Specific Logging

```javascript
const devLog = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] ${message}`, data);
  }
};
```

### 2. Use Supabase Local Development

Consider setting up **local Supabase development**[17][18] to eliminate network-related authentication issues:

```bash
supabase start
# Your app connects to localhost:54321 instead of remote Supabase
```

### 3. Enhanced Error Boundaries

Implement error boundaries that can gracefully handle authentication state issues during development.

## Community Validation

The research reveals that **multiple developers face similar issues** with Supabase + React + Vite combinations[19][12][20]. The Supabase community discussions show this is a recognized development environment challenge rather than a unique problem with your implementation.

Your issue represents a confluence of development-time behaviors that don't occur in production. The solutions above address the timing and state management issues that cause blocks to appear missing after code changes, while preserving the robustness of your production application.

[1] https://github.com/supabase/realtime-js/issues/169
[2] https://www.reddit.com/r/reactjs/comments/1cidg60/react_double_useeffect_call_in_strictmode_server/
[3] https://stackoverflow.com/questions/61254372/my-react-component-is-rendering-twice-because-of-strict-mode
[4] https://www.lukinotes.com/2022/04/double-invoking-in-react-strict-mode.html
[5] https://stackoverflow.com/questions/71992547/reactjs-class-component-mounting-twice
[6] https://stackoverflow.com/questions/72222728/why-is-localstorage-getting-cleared-whenever-i-refresh-the-page
[7] https://www.reddit.com/r/reactjs/comments/1l7osqr/those_of_you_using_vite_to_bundle_your/
[8] https://github.com/vitejs/vite/discussions/3143
[9] https://remslabs.com/blog/resolving-vite-cache-issues-with-dependency-changes-in-a-react-project
[10] https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
[11] https://www.reddit.com/r/Supabase/comments/1h9nfx8/supabase_client_jwt_token_not_able_to_retrieve_if/
[12] https://stackoverflow.com/questions/75058178/supabase-onauthstatechange-with-react-useeffect-lost-session-on-page-refresh
[13] https://community.flutterflow.io/discussions/post/seamless-chat---realtime-supabase-infinite-loading-scroll-to-bottom-qgTtDnCQ2Y1FZY9
[14] https://www.reddit.com/r/Supabase/comments/1ksdaym/some_queries_just_never_load/
[15] https://www.reddit.com/r/Supabase/comments/1hwz0jn/caching_middleware_for_supabase/
[16] https://app.studyraid.com/en/read/8395/231626/caching-strategies-in-supabase
[17] https://dev.to/sreejinsreenivasan/supabase-a-guide-to-setting-up-your-local-environment-4cgf
[18] https://supabase.com/docs/guides/deployment
[19] https://www.reddit.com/r/Supabase/comments/1kggwkv/persistent_supabase_connectivitytimeout_issues_in/
[20] https://github.com/supabase/supabase-js/issues/1434
[21] https://github.com/orgs/supabase/discussions/27578
[22] https://github.com/supabase/cli/issues/184
[23] https://supabase.com/docs/guides/platform/backups
[24] https://www.reddit.com/r/Supabase/comments/1ewj120/how_to_refresh_data_after_modification/
[25] https://dev.to/supabase/safeguarding-data-integrity-with-pg-safeupdate-in-postgresql-and-supabase-2bgd?comments_sort=latest
[26] https://supabase.com/blog/restore-to-a-new-project
[27] https://stackoverflow.com/questions/76755864/supabase-not-storing-session-data-in-localstorage-correctly
[28] https://github.com/apollographql/apollo-client/issues/9903
[29] https://stackoverflow.com/questions/49055172/react-component-mounting-twice
[30] https://www.reddit.com/r/Supabase/comments/16ihf13/getting_session_error_when_updating_users_details/
[31] https://github.com/microsoft/playwright/issues/9164
[32] https://www.reddit.com/r/reactjs/comments/1451w0x/clear_local_storage_when_the_user_leaves_the_page/
[33] https://www.w3schools.com/jsref/met_storage_clear.asp
[34] https://stackoverflow.com/questions/44279582/how-to-clear-the-sessionstorage-on-browser-refresh-but-this-should-not-clear-o
[35] https://web3auth.io/community/t/how-to-clear-the-localstorage-when-session-expires/4978
[36] https://app.studyraid.com/en/read/12382/399847/clearing-all-data-with-clear
[37] https://github.com/supabase/supabase/issues/10553
[38] https://www.reddit.com/r/Supabase/comments/1fyxdgl/database_row_disappearing/
[39] https://github.com/orgs/supabase/discussions/34773
[40] https://authjs.dev/guides/refresh-token-rotation
[41] https://stackoverflow.com/questions/76510378/supabase-session-null-undefined-even-after-successful-authentication
[42] https://stackoverflow.com/questions/78601890/why-is-supabase-not-returning-any-data-when-i-still-have-rows-of-data-in-my-tabl
[43] https://fusionauth.io/community/forum/topic/568/refresh-tokens-going-stale
[44] https://stackoverflow.com/questions/79593726/supabase-returning-empty-object-when-trying-to-insert-data-in-table-and-not-addi
[45] https://github.com/radix-ui/primitives/issues/3295
[46] https://www.reddit.com/r/reactnative/comments/1kp799a/supabase_broken_after_update/
[47] https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
[48] https://stackoverflow.com/questions/74846884/supabase-to-react-data-fetch-error-supabaseurl-is-required
[49] https://www.permit.io/blog/supabase-authentication-and-authorization-in-nextjs-implementation-guide
[50] https://app.studyraid.com/en/read/8395/231591/managing-user-sessions
[51] https://app.studyraid.com/en/read/8395/231628/using-supabase-with-react
[52] https://github.com/being-devahmad/SupaAuth
[53] https://app.studyraid.com/en/read/12469/403016/user-session-security-best-practices
[54] https://supabase.com/blog/fetching-and-caching-supabase-data-in-next-js-server-components
[55] https://www.linkedin.com/posts/bradmca_caching-strategies-in-supabase-comprehensive-activity-7268561918594891776-SlQp
[56] https://stackoverflow.com/questions/79453323/does-caching-works-in-supabase-nextjs15
[57] https://www.intel.com/content/www/us/en/developer/articles/technical/cache-blocking-techniques.html
[58] https://chat2db.ai/resources/blog/optimizing-supabase-performance-with-caching-strategies
[59] https://documentation.concretecms.org/9-x/user-guide/running-website/keeping-sites-fast
[60] https://supabase.com/docs/guides/database/inspect
[61] https://supabase.com/docs/guides/telemetry/logs
[62] https://www.youtube.com/watch?v=Ai2BjHV36Ng
[63] https://github.com/supabase/cli/issues/1055
[64] https://app.studyraid.com/en/read/8395/231635/monitoring-and-maintaining-deployed-supabase-applications
[65] https://www.cybertec-postgresql.com/en/prewarming-postgresql-i-o-caches/
[66] https://docs.gitlab.com/development/data_retention_policies/
[67] https://www.youtube.com/watch?v=811SiwHyTdM
[68] https://app.studyraid.com/en/read/8395/231627/monitoring-and-improving-overall-performance
[69] https://www.enterprisedb.com/blog/hibernating-and-restoring-postgres-buffer-cache?lang=en
[70] https://www.developer.com/guides/properly-building-persistent-programs/
[71] https://legacy.reactjs.org/docs/strict-mode.html
[72] https://developer.atlassian.com/cloud/oauth/getting-started/refresh-tokens/

-------------------------

### Key Points
- Research suggests that partial data loss during development is likely due to React 18's strict mode, causing components to mount twice and potentially interfering with data fetching.
- It seems likely that the issue is related to useEffect running twice, leading to race conditions or inconsistent state in data fetching, especially for blocks loaded on-demand.
- The evidence leans toward improper handling of sessionStorage caching or authentication timing, exacerbated by development tools like Vite HMR, though this is not confirmed without code review.

### Understanding the Issue
The problem occurs when making code changes and refreshing the application during development, leading to partial data loss where document titles and counts are preserved, but blocks inside documents are lost. This is specific to development and does not happen in normal usage, suggesting an interaction between development tools and React's strict mode.

### Possible Causes
- **React 18 Strict Mode:** Strict mode causes components to mount, unmount, and remount, which can lead to useEffect hooks running twice. This might cause double data fetches, potentially leading to race conditions or state inconsistencies, especially for on-demand block loading.
- **Vite HMR and Session Handling:** It seems likely that Vite's Hot Module Replacement (HMR) or full page reloads might affect sessionStorage or authentication, though research suggests localStorage and sessionStorage typically persist across refreshes.
- **Supabase RLS and Authentication:** There could be timing issues where data fetching occurs before authentication is fully restored, potentially failing Row Level Security (RLS) policies, though documents still load, suggesting partial success.

### Recommended Actions
- Ensure useEffect hooks for data fetching include cleanup functions, such as using AbortController, to handle double mounting in strict mode.
- Verify sessionStorage caching logic to ensure blocks are correctly retrieved after refresh, checking for any unintended clears or key mismatches.
- Consider temporarily disabling strict mode in development to confirm the issue, though this is not a long-term solution.
- Explore using data fetching libraries like React Query ([Using Supabase with React Query](https://makerkit.dev/blog/saas/supabase-react-query)) for better caching and deduplication, especially in strict mode environments.

---

### Survey Note: Detailed Analysis of Supabase Data Loss on Code Changes

This survey note provides a comprehensive analysis of the reported issue of partial data loss in a React/Supabase application during development, focusing on code changes and refreshes. The investigation covers technical context, potential causes, and best practices, drawing from extensive research into React, Supabase, and Vite interactions.

#### Technical Context and Symptoms
The application stack includes React 19 with Vite dev server, Supabase (PostgreSQL with RLS enabled), and Supabase Auth with JWT tokens, using Hot Module Replacement (HMR) in development. The database structure separates documents and blocks, with blocks loaded on-demand via lazy loading, cached for 5 seconds, and stored in sessionStorage.

Symptoms include:
- Document titles and counts are preserved after refresh.
- Blocks inside documents are lost, appearing empty, despite existing in the database (verified via SQL queries).
- This issue occurs only during development (code changes + refresh), not in normal usage.

#### Research Findings

##### 1. React 18 Strict Mode and Double Mounting
Research suggests that React 18's strict mode, enabled by default in development, causes components to mount, unmount, and remount to detect issues with effects and state ([Strict Mode – React](https://legacy.reactjs.org/docs/strict-mode.html)). This leads to useEffect hooks running twice on mount, which can cause problems for data fetching if not handled properly. For instance, a useEffect fetching blocks on document open might trigger two fetches, potentially leading to race conditions or state inconsistencies ([React 18 Strict Mode and data fetching](https://github.com/reduxjs/redux-toolkit/issues/2441)).

To mitigate, developers should ensure effects are idempotent and include cleanup functions, such as using AbortController to cancel ongoing requests. For example:

```javascript
useEffect(() => {
  const controller = new AbortController();
  const signal = controller.signal;

  fetchBlocks({ signal }).then(data => {
    // set state
  }).catch(error => {
    if (error.name !== 'AbortError') {
      // handle error
    }
  });

  return () => {
    controller.abort();
  };
}, [documentId]);
```

This approach ensures that if the component is unmounted during strict mode's double mount, the first fetch is cancelled, preventing interference with the second.

##### 2. Vite HMR and Session Handling
Vite's HMR typically updates modules without full page reloads, but full reloads can occur in cases like circular dependencies ([HMR API | Vite](https://vite.dev/guide/api-hmr)). Research indicates that localStorage and sessionStorage generally persist across refreshes, but there are reports of localStorage being cleared in Vite, though not specifically for sessionStorage ([LocalStorage on Vite gets cleared on every refresh](https://github.com/vitejs/vite/issues/14825)). Given the user's use of sessionStorage for block caching, it's possible that development-specific behaviors (e.g., HMR-induced reloads) might affect cache persistence, though this is not confirmed without code review.

##### 3. Supabase RLS and Authentication Timing
Supabase Auth uses JWT tokens, typically stored in localStorage, and handles session restoration asynchronously ([Use Supabase Auth with React | Supabase Docs](https://supabase.com/docs/guides/auth/quickstarts/react)). If data fetching occurs before the session is fully restored, RLS policies might fail, though the user's ability to fetch documents suggests partial success. Research into Supabase issues revealed problems with realtime subscriptions in strict mode due to double mounting ([When used with react strict mode, the realtime database does not subscribe properly](https://github.com/supabase/realtime-js/issues/169)), suggesting potential similar issues with data fetching, though not directly documented.

##### 4. SessionStorage and Caching
The application uses a 5-second cache and sessionStorage for blocks, which should persist across refreshes in the same tab. However, if the application clears sessionStorage on load or uses keys based on state that changes between mounts, cached data might be inaccessible. Research did not find specific Vite behaviors clearing sessionStorage, but double mounting in strict mode could lead to cache access issues if not handled correctly.

##### 5. Common Patterns and Solutions
Best practices for preserving state during development include:
- Using data fetching libraries like React Query for caching and deduplication, which handle strict mode better ([How to use Supabase with React Query](https://makerkit.dev/blog/saas/supabase-react-query)).
- Ensuring effects are resilient to multiple executions, with proper cleanup.
- Logging fetch calls and responses to debug timing issues, especially in strict mode.

#### Detailed Analysis Table

| **Aspect**               | **Findings**                                                                 | **Implications**                                      |
|--------------------------|-----------------------------------------------------------------------------|------------------------------------------------------|
| React Strict Mode        | Causes double mounting, leading to useEffect running twice in development.  | Potential race conditions in data fetching, especially for blocks. |
| Vite HMR                | May trigger full reloads, potentially affecting sessionStorage, though not confirmed. | Possible cache loss, needs verification.             |
| Supabase Auth            | Session restoration is asynchronous; timing issues possible with RLS.       | Data fetches before session restoration may fail, though documents load. |
| SessionStorage Caching   | Should persist across refreshes, but double mounting might affect access.   | Verify cache logic for key consistency and clearing. |
| Data Fetching Libraries  | React Query offers robust caching and deduplication, suitable for strict mode. | Could resolve issues, but introduces additional dependency. |

#### Recommendations
Given the research, the most likely cause is React 18 strict mode's double mounting affecting data fetching, particularly for blocks loaded on-demand. To address:
1. Implement cleanup in useEffect for data fetches, using AbortController to handle double mounting.
2. Verify sessionStorage caching logic, ensuring keys are consistent and no unintended clears occur.
3. Consider using React Query for better handling of caching and fetches, especially in strict mode environments.
4. Temporarily disable strict mode to confirm the issue, though maintain it for long-term development benefits.

This approach should mitigate the partial data loss, ensuring a smoother development experience while maintaining production reliability.

#### Key Citations
- [Strict Mode React Legacy Documentation](https://legacy.reactjs.org/docs/strict-mode.html)
- [React 18 Strict Mode and Data Fetching Issue](https://github.com/reduxjs/redux-toolkit/issues/2441)
- [LocalStorage on Vite Gets Cleared Issue](https://github.com/vitejs/vite/issues/14825)
- [Use Supabase Auth with React Documentation](https://supabase.com/docs/guides/auth/quickstarts/react)
- [HMR API Vite Documentation](https://vite.dev/guide/api-hmr)
- [When Used with React Strict Mode Realtime Issue](https://github.com/supabase/realtime-js/issues/169)
- [Using Supabase with React Query Blog](https://makerkit.dev/blog/saas/supabase-react-query)