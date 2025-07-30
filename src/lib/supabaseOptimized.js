import { createClient } from '@supabase/supabase-js';
import { secureStorage, sessionMonitor } from '../utils/secureStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Correct storage key for Supabase v2
const STORAGE_KEY = 'sb-zqcjipwiznesnbgbocnu-auth-token';

/**
 * Optimized Supabase Client with:
 * - Secure token storage
 * - Session monitoring
 * - Smart refresh handling
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
    this.refreshPromise = null; // Track ongoing refresh
    this.lastRefreshTime = 0;
    this.sessionTimeout = null;
    this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes default
  }

  /**
   * Get or create Supabase client instance
   */
  getClient() {
    if (!this.client) {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,     // Enable auto-refresh for security
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          refreshThreshold: 300,      // Refresh 5 minutes before expiry
          // Custom storage adapter using secure storage
          storage: {
            getItem: (key) => {
              try {
                sessionMonitor.logActivity('storage_access', { action: 'get', key });
                
                // Use secure storage for auth token
                if (key === STORAGE_KEY) {
                  return secureStorage.getItem('auth_token');
                }
                return localStorage.getItem(key);
              } catch (e) {
                console.error('Storage getItem error:', e);
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                sessionMonitor.logActivity('storage_access', { action: 'set', key });
                
                // Use secure storage for auth token
                if (key === STORAGE_KEY) {
                  secureStorage.setItem('auth_token', value);
                } else {
                  localStorage.setItem(key, value);
                }
              } catch (e) {
                console.error('Storage setItem error:', e);
              }
            },
            removeItem: (key) => {
              try {
                sessionMonitor.logActivity('storage_access', { action: 'remove', key });
                
                // Use secure storage for auth token
                if (key === STORAGE_KEY) {
                  secureStorage.removeItem('auth_token');
                } else {
                  localStorage.removeItem(key);
                }
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
            'x-connection-pooling': 'session',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          }
        },
        db: {
          schema: 'public'
        },
        // Connection pooling configuration
        connectionTimeout: 10000, // 10 seconds
        poolSize: 50 // Increased for Reddit traffic surge
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
    // First, try to restore existing session
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (session) {
        console.log('[Supabase] Restored existing session:', session.user.id);
      } else if (error) {
        console.error('[Supabase] Error restoring session:', error);
      }
    } catch (err) {
      console.error('[Supabase] Failed to restore session:', err);
    }
    
    const { data: { subscription } } = this.client.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Supabase] Auth event: ${event}`);
      sessionMonitor.logActivity('auth_event', { event, hasSession: !!session });
      
      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          this.startInactivityTimer();
          sessionMonitor.reset();
          break;
          
        case 'SIGNED_OUT':
          this.stopInactivityTimer();
          sessionMonitor.reset();
          secureStorage.clear();
          break;
          
        case 'TOKEN_REFRESHED':
          // Implement smart refresh handling
          const now = Date.now();
          if (now - this.lastRefreshTime < 5000) {
            console.warn('[Supabase] Ignoring rapid token refresh');
            return;
          }
          this.lastRefreshTime = now;
          
          sessionMonitor.logActivity('token_refresh', { timestamp: now });
          
          // Check for suspicious activity
          const suspiciousActivity = sessionMonitor.isSuspicious();
          if (suspiciousActivity) {
            console.error('[Supabase] Suspicious activity detected, forcing re-authentication');
            await this.client.auth.signOut();
            return;
          }
          
          this.resetInactivityTimer();
          break;
          
        case 'USER_UPDATED':
          this.resetInactivityTimer();
          break;
      }
      
      // Notify all subscribers
      this.authSubscribers.forEach(callback => callback(event, session));
    });

    // Store subscription for cleanup
    this.authSubscription = subscription;
    
    // Set up activity monitoring
    this.setupActivityMonitoring();
  }

  /**
   * Set up activity monitoring for session timeout
   */
  setupActivityMonitoring() {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      this.resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Clean up on window unload
    window.addEventListener('beforeunload', () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    });
  }

  /**
   * Start inactivity timer
   */
  startInactivityTimer() {
    this.resetInactivityTimer();
  }

  /**
   * Stop inactivity timer
   */
  stopInactivityTimer() {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Reset inactivity timer
   */
  resetInactivityTimer() {
    this.stopInactivityTimer();
    
    // Don't set timeout if it's disabled (0 means never timeout)
    if (this.inactivityTimeout === 0) {
      return;
    }
    
    this.sessionTimeout = setTimeout(async () => {
      console.log('[Supabase] Session timeout due to inactivity');
      sessionMonitor.logActivity('session_timeout', { reason: 'inactivity' });
      await this.client.auth.signOut();
    }, this.inactivityTimeout);
  }

  /**
   * Set custom inactivity timeout
   */
  setInactivityTimeout(minutes) {
    // 0 means never timeout
    this.inactivityTimeout = minutes === 0 ? 0 : minutes * 60 * 1000;
    this.resetInactivityTimer();
  }

  /**
   * Subscribe to auth changes
   */
  onAuthStateChange(callback) {
    this.authSubscribers.add(callback);
    return () => this.authSubscribers.delete(callback);
  }

  /**
   * Get session with secure caching and refresh
   */
  async getSession() {
    // Prevent concurrent getSession calls
    const key = 'getSession';
    return this.deduplicateRequest(key, async () => {
      try {
        const result = await this.getClient().auth.getSession();
        
        // Check if refresh is needed
        if (result.data.session) {
          const expiresAt = result.data.session.expires_at;
          const nowInSeconds = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - nowInSeconds;
          
          // Refresh if less than 5 minutes until expiry
          if (timeUntilExpiry < 300 && !this.refreshPromise) {
            console.log('[Supabase] Proactively refreshing token');
            this.refreshPromise = this.refreshSession();
            const refreshResult = await this.refreshPromise;
            this.refreshPromise = null;
            return refreshResult || result;
          }
        }
        
        return result;
      } catch (error) {
        console.error('[Supabase] getSession error:', error);
        sessionMonitor.logActivity('session_error', { error: error.message });
        return { data: { session: null }, error };
      }
    });
  }

  /**
   * Refresh session with error handling
   */
  async refreshSession() {
    try {
      sessionMonitor.logActivity('refresh_attempt', { timestamp: Date.now() });
      
      const { data, error } = await this.getClient().auth.refreshSession();
      
      if (error) {
        sessionMonitor.logActivity('refresh_failed', { error: error.message });
        throw error;
      }
      
      sessionMonitor.logActivity('refresh_success', { timestamp: Date.now() });
      return { data, error: null };
    } catch (error) {
      console.error('[Supabase] Refresh session error:', error);
      
      // If refresh fails too many times, force re-authentication
      if (sessionMonitor.suspiciousPatterns.failedRefreshes > 3) {
        await this.client.auth.signOut();
      }
      
      return { data: { session: null }, error };
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
   * Create batch operation helper
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
export const setInactivityTimeout = (minutes) => optimizedSupabase.setInactivityTimeout(minutes);

// Track last auth check to prevent rapid retries
let lastAuthCheckTime = 0;
const MIN_AUTH_CHECK_INTERVAL = 1000; // 1 second minimum between checks

// Helper to ensure authenticated session before operations
export const ensureAuthenticated = async () => {
  // Rate limit auth checks
  const now = Date.now();
  if (now - lastAuthCheckTime < MIN_AUTH_CHECK_INTERVAL) {
    throw new Error('Authentication check rate limited');
  }
  lastAuthCheckTime = now;
  
  const { data: { session }, error } = await getSession();
  
  if (error) {
    console.error('[Supabase] Auth check error:', error);
    throw new Error('Authentication error: ' + error.message);
  }
  
  if (!session) {
    console.error('[Supabase] No active session');
    throw new Error('No active session. Please sign in again.');
  }
  
  // Check if session is about to expire (within 5 minutes)
  const expiresAt = session.expires_at;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - nowInSeconds;
  
  if (timeUntilExpiry < 300) {
    console.log('[Supabase] Session expiring soon, refreshing...');
    const { error: refreshError } = await optimizedSupabase.refreshSession();
    if (refreshError) {
      throw new Error('Failed to refresh session: ' + refreshError.message);
    }
  }
  
  return session;
};

// Emergency helper to clear auth issues
export const clearAuthIssues = () => {
  console.log('[Supabase] Clearing auth issues...');
  // Clear all auth-related storage
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('SUPABASE_DISABLE_REFRESH');
  secureStorage.clear();
  // Clear caches
  optimizedSupabase.sessionCache = null;
  optimizedSupabase.sessionCacheTime = 0;
  sessionMonitor.reset();
  // Sign out
  optimizedSupabase.getClient().auth.signOut();
};