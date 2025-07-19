import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseOptimized'
import { clearCorruptedAuthStorage } from '../utils/clearAuthStorage'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trialStatus, setTrialStatus] = useState(null)

  // Step 1: Only handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Check trial status when user logs in
        if (session?.user?.id) {
          await checkTrialStatus(session.user.id)
        } else {
          setTrialStatus(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Step 2: Separate effect for initial session check with timeout
  useEffect(() => {
    let isMounted = true

    const getInitialSession = async () => {
      try {
        // Clear any corrupted localStorage first
        clearCorruptedAuthStorage()

        // Set a timeout for getSession
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])

        if (isMounted) {
          if (error) {
            console.error('Session error:', error)
          } else {
            setSession(session)
            setUser(session?.user ?? null)
            
            // Check trial status for initial session
            if (session?.user?.id) {
              await checkTrialStatus(session.user.id)
            }
          }
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Auth initialization failed:', error)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    return () => {
      isMounted = false
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setTrialStatus(null)
    }
    return { error }
  }

  const checkTrialStatus = async (userId) => {
    if (!userId) {
      setTrialStatus(null)
      return null
    }
    
    try {
      const { data, error } = await supabase
        .rpc('check_trial_status', { p_user_id: userId })
      
      if (error) {
        console.error('Error checking trial status:', error)
        return null
      }
      
      setTrialStatus(data)
      return data
    } catch (err) {
      console.error('Failed to check trial status:', err)
      return null
    }
  }

  const value = {
    user,
    session,
    loading,
    trialStatus,
    signIn,
    signUp,
    signOut,
    checkTrialStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}