import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedSupabase, onAuthStateChange, getSession } from '@/shared/api';
import { performanceMonitor } from '@/shared/lib';

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

  const signUp = useCallback(async (email, password) => {
    const timerId = performanceMonitor.startTimer('auth:signUp');
    try {
      setError(null);
      const { data, error } = await optimizedSupabase.getClient().auth.signUp({
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
      try {
        // Add a small delay to ensure Supabase client is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get initial session with caching
        const { data: { session }, error } = await getSession();
        
        if (mounted) {
          if (error) {
            console.error('Session error:', error);
            setError(error.message);
            // Try to refresh if we have a session error
            if (error.message.includes('refresh_token') || error.message.includes('expired')) {
              console.log('[AuthContext] Attempting to refresh expired session...');
              const { data: refreshData, error: refreshError } = await optimizedSupabase.refreshSession();
              if (!refreshError && refreshData?.session) {
                setUser(refreshData.session.user);
                setError(null);
              }
            }
          } else {
            setUser(session?.user ?? null);
          }
          setLoading(false);
          performanceMonitor.endTimer(timerId, true);
        }
      } catch (err) {
        if (mounted) {
          console.error('Auth initialization error:', err);
          setError(err.message);
          setLoading(false);
          performanceMonitor.endTimer(timerId, false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes with debouncing for TOKEN_REFRESHED
    let authChangeTimeout;
    const unsubscribe = onAuthStateChange((event, session) => {
      if (mounted) {
        console.log('[AuthContext] Auth state change received:', event, {
          mounted,
          hasSession: !!session,
          userId: session?.user?.id
        });
        
        // Debounce TOKEN_REFRESHED events to prevent UI flicker
        if (event === 'TOKEN_REFRESHED') {
          clearTimeout(authChangeTimeout);
          authChangeTimeout = setTimeout(() => {
            if (mounted) {
              setUser(session?.user ?? null);
              setError(null);
            }
          }, 100);
        } else {
          // Handle other events immediately
          setUser(session?.user ?? null);
          setError(null);
          
          // Clear error on successful auth events
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setError(null);
          }
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(authChangeTimeout);
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