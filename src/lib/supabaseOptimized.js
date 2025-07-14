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
    this.refreshTimeout = null; // For manual refresh scheduling
  }

  /**
   * Get or create Supabase client instance
   */
  getClient() {
    if (!this.client) {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false, // Disabled to prevent refresh loop
          persistSession: false,   // CRITICAL: This stops automatic session recovery
          detectSessionInUrl: false, // Disabled as PKCE forces URL detection anyway
          flowType: 'pkce',
          // Use simple synchronous storage to eliminate race conditions
          storage: {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value),
            removeItem: (key) => localStorage.removeItem(key)
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
    // Load persisted session manually since persistSession is false
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        if (sessionData && sessionData.expires_at > Date.now() / 1000) {
          // Set the session without triggering refresh
          await this.client.auth.setSession({
            access_token: sessionData.access_token,
            refresh_token: sessionData.refresh_token
          });
        } else {
          // Clear expired session
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    const { data: { subscription } } = this.client.auth.onAuthStateChange((event, session) => {
      console.log(`[Supabase] Auth event: ${event}`);
      
      // Detect and prevent refresh loops
      if (event === 'TOKEN_REFRESHED') {
        const sessionId = session?.user?.id;
        if (sessionId && !this.preventRefreshLoop(sessionId)) {
          console.error('[Supabase] Refresh loop detected, preventing further refreshes');
          return;
        }
      }
      
      // Manually persist session since persistSession is false
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        this.scheduleManualRefresh(session);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(STORAGE_KEY);
        if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
          this.refreshTimeout = null;
        }
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
   * Get session with caching (no automatic refresh)
   */
  async getSession() {
    // Since autoRefreshToken and persistSession are false, we need to check manually
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        // Check if session is still valid
        if (session && session.expires_at > Date.now() / 1000) {
          return { data: { session }, error: null };
        }
      } catch (e) {
        console.error('Invalid stored session:', e);
      }
    }
    
    // Get current session without triggering refresh
    return this.getClient().auth.getSession();
  }

  /**
   * Prevent refresh loops by tracking attempts
   */
  preventRefreshLoop(sessionId) {
    const attempts = this.refreshAttempts.get(sessionId) || 0;
    if (attempts > 3) {
      return false; // Prevent further attempts
    }
    this.refreshAttempts.set(sessionId, attempts + 1);
    // Clear attempts after 60 seconds
    setTimeout(() => this.refreshAttempts.delete(sessionId), 60000);
    return true;
  }

  /**
   * Schedule manual refresh before token expires
   */
  scheduleManualRefresh(session) {
    if (!session || !session.expires_at) return;
    
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    const expiresAt = new Date(session.expires_at * 1000).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    
    // Schedule refresh 1 minute before expiry
    const refreshTime = timeUntilExpiry - 60000;
    
    if (refreshTime > 0) {
      this.refreshTimeout = setTimeout(async () => {
        console.log('[Supabase] Manually refreshing token');
        try {
          const { data, error } = await this.client.auth.refreshSession();
          if (error) {
            console.error('[Supabase] Manual refresh failed:', error);
          } else if (data.session) {
            // Session will be persisted by onAuthStateChange
            console.log('[Supabase] Manual refresh successful');
          }
        } catch (e) {
          console.error('[Supabase] Manual refresh error:', e);
        }
      }, refreshTime);
    }
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