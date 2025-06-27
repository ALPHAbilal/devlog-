import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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

  // Step 1: Only handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
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
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}