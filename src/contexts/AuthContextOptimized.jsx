import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedSupabase, onAuthStateChange, getSession } from '../lib/supabaseOptimized';
import { performanceMonitor } from '../utils/performanceMonitor';

const AuthContext = createContext({});

export function AuthProviderOptimized({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Memoize auth functions to prevent re-renders
  const signIn = useCallback(async (email, password) => {
    const timerId = performanceMonitor.startTimer('auth:signIn');
    try {
      setError(null);
      const { data, error } = await optimizedSupabase.getClient().auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      performanceMonitor.endTimer(timerId, true);
      return { data, error: null };
    } catch (err) {
      performanceMonitor.endTimer(timerId, false);
      setError(err.message);
      return { data: null, error: err };
    }
  }, []);

  const signUp = useCallback(async (email, password, metadata = {}) => {
    const timerId = performanceMonitor.startTimer('auth:signUp');
    try {
      setError(null);
      const { data, error } = await optimizedSupabase.getClient().auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      performanceMonitor.endTimer(timerId, true);
      return { data, error: null };
    } catch (err) {
      performanceMonitor.endTimer(timerId, false);
      setError(err.message);
      return { data: null, error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    const timerId = performanceMonitor.startTimer('auth:signOut');
    try {
      const { error } = await optimizedSupabase.getClient().auth.signOut();
      if (error) throw error;
      
      // Clear all caches
      optimizedSupabase.sessionCache = null;
      optimizedSupabase.sessionCacheTime = 0;
      
      performanceMonitor.endTimer(timerId, true);
    } catch (err) {
      performanceMonitor.endTimer(timerId, false);
      console.error('Sign out error:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    const timerId = performanceMonitor.startTimer('auth:initialize');

    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth');
      try {
        // Get initial session with caching
        const { data: { session }, error } = await getSession();
        console.log('[AuthContext] Initial session check:', {
          hasSession: !!session,
          hasError: !!error,
          error: error?.message
        });
        
        if (mounted) {
          if (error) {
            console.error('[AuthContext] Session error:', error);
            setError(error.message);
          } else {
            console.log('[AuthContext] Setting user:', session?.user?.id);
            setUser(session?.user ?? null);
          }
          setLoading(false);
          performanceMonitor.endTimer(timerId, true);
        }
      } catch (err) {
        if (mounted) {
          console.error('[AuthContext] Auth initialization error:', err);
          setError(err.message);
          setLoading(false);
          performanceMonitor.endTimer(timerId, false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state change received:', event, {
        mounted,
        hasSession: !!session,
        userId: session?.user?.id
      });
      if (mounted) {
        setUser(session?.user ?? null);
        setError(null);
        
        // Clear error on successful auth events
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          setError(null);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    supabase: optimizedSupabase.getClient()
  }), [user, loading, error, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook with performance monitoring
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}