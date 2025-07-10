import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  }

  /**
   * Get or create Supabase client instance
   */
  getClient() {
    if (!this.client) {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce', // Enhanced security for OAuth
          storage: {
            getItem: (key) => {
              // Use a simple cache to reduce localStorage access
              if (key === 'journey-log-auth' && this.sessionCache && 
                  Date.now() - this.sessionCacheTime < 1000) {
                return this.sessionCache;
              }
              const value = localStorage.getItem(key);
              if (key === 'journey-log-auth') {
                this.sessionCache = value;
                this.sessionCacheTime = Date.now();
              }
              return value;
            },
            setItem: (key, value) => {
              localStorage.setItem(key, value);
              if (key === 'journey-log-auth') {
                this.sessionCache = value;
                this.sessionCacheTime = Date.now();
              }
            },
            removeItem: (key) => {
              localStorage.removeItem(key);
              if (key === 'journey-log-auth') {
                this.sessionCache = null;
                this.sessionCacheTime = 0;
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
    const { data: { subscription } } = this.client.auth.onAuthStateChange((event, session) => {
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
    // Return cached session if valid
    if (this.sessionCache && this.sessionCacheTime && 
        Date.now() - this.sessionCacheTime < this.sessionCacheDuration) {
      try {
        const cached = JSON.parse(this.sessionCache);
        if (cached && cached.expires_at * 1000 > Date.now()) {
          return { data: { session: cached }, error: null };
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch new session
    const result = await this.getClient().auth.getSession();
    if (result.data.session) {
      this.sessionCache = JSON.stringify(result.data.session);
      this.sessionCacheTime = Date.now();
    }
    return result;
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