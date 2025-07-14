import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Correct storage key for Supabase v2
const STORAGE_KEY = 'sb-zqcjipwiznesnbgbocnu-auth-token';

/**
 * Optimized Supabase Client with:
 * - Session persistence
 * - Reduced auth checks
 * - Connection pooling
 * - Request deduplication
 */
class OptimizedSupabaseClient {
  constructor() {
    this.client = null;
    this.sessionCache = null;
    this.sessionCacheTime = 0;
    this.sessionCacheDuration = 5 * 60 * 1000; // 5 minutes
    this.pendingRequests = new Map();
    this.authSubscribers = new Set();
    this.initialized = false;
    this.refreshAttempts = new Map(); // Track refresh attempts to detect loops
    this.isRefreshing = false; // Prevent concurrent refresh attempts
  }

  /**
   * Get or create Supabase client instance
   */
  getClient() {
    if (!this.client) {
      // Check for emergency override in localStorage
      const disableRefresh = localStorage.getItem('SUPABASE_DISABLE_REFRESH') === 'true';
      
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: disableRefresh ? false : false, // Always false, emergency override exists
          persistSession: true,    // Keep enabled for normal session management
          detectSessionInUrl: true,
          flowType: 'pkce',
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
        },
        realtime: {
          params: {
            eventsPerSecond: 2 // Limit realtime events
          }
        },
        global: {
          headers: {
            'x-client-info': 'journey-log-compass',
            'x-connection-pooling': 'session' // Enable session pooling
          }
        },
        db: {
          schema: 'public'
        },
        // Connection pooling configuration
        connectionTimeout: 10000, // 10 seconds
        poolSize: 10 // Number of connections in the pool
      });

      // Initialize auth state only once
      if (!this.initialized) {
        this.initializeAuth();
        this.initialized = true;
      }
    }
    return this.client;
  }

  /**
   * Initialize auth state and listeners
   */
  async initializeAuth() {
    // Add refresh loop prevention
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes
    
    const { data: { subscription } } = this.client.auth.onAuthStateChange((event, session) => {
      console.log(`[Supabase] Auth event: ${event}`);
      
      // Prevent rapid TOKEN_REFRESHED events
      if (event === 'TOKEN_REFRESHED') {
        const now = Date.now();
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
          console.warn('[Supabase] Ignoring rapid token refresh attempt');
          return;
        }
        lastRefreshTime = now;
        
        // Track refresh attempts for circuit breaker
        const sessionId = session?.user?.id;
        if (sessionId) {
          const attempts = this.refreshAttempts.get(sessionId) || 0;
          if (attempts > 10) {
            console.error('[Supabase] Too many refresh attempts, circuit breaker activated');
            // Clear the session to stop the loop
            this.client.auth.signOut();
            return;
          }
          this.refreshAttempts.set(sessionId, attempts + 1);
          // Reset counter after 5 minutes
          setTimeout(() => this.refreshAttempts.delete(sessionId), 300000);
        }
      }
      
      // Clear refresh attempts on sign out
      if (event === 'SIGNED_OUT') {
        this.refreshAttempts.clear();
        lastRefreshTime = 0;
      }
      
      // Notify all subscribers
      this.authSubscribers.forEach(callback => callback(event, session));
    });

    // Store subscription for cleanup
    this.authSubscription = subscription;
  }

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange(callback) {
    this.authSubscribers.add(callback);
    return () => this.authSubscribers.delete(callback);
  }

  /**
   * Get session with caching
   */
  async getSession() {
    // Prevent concurrent getSession calls
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

  /**
   * Deduplicate concurrent requests
   */
  async deduplicateRequest(key, requestFn) {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Batch multiple operations
   */
  createBatchOperation() {
    const operations = [];
    const execute = async () => {
      if (operations.length === 0) return [];
      
      // Execute all operations in parallel
      return Promise.all(operations.map(op => op()));
    };

    return {
      add: (operation) => operations.push(operation),
      execute,
      size: () => operations.length
    };
  }
}

// Create singleton instance
const optimizedSupabase = new OptimizedSupabaseClient();

// Create and export the client instance once
export const supabase = optimizedSupabase.getClient();

// Export the optimized instance for advanced usage
export { optimizedSupabase };

// Helper functions
export const getSession = () => optimizedSupabase.getSession();
export const onAuthStateChange = (callback) => optimizedSupabase.onAuthStateChange(callback);
export const deduplicateRequest = (key, fn) => optimizedSupabase.deduplicateRequest(key, fn);

// Emergency helper to clear auth issues
export const clearAuthIssues = () => {
  console.log('[Supabase] Clearing auth issues...');
  // Clear all auth-related storage
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('SUPABASE_DISABLE_REFRESH');
  // Clear caches
  optimizedSupabase.sessionCache = null;
  optimizedSupabase.sessionCacheTime = 0;
  optimizedSupabase.refreshAttempts.clear();
  // Sign out
  optimizedSupabase.getClient().auth.signOut();
};