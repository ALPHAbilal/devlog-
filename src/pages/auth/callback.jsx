import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseOptimized'

export default function AuthCallback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Redirect to dashboard after successful sign-in
        navigate('/dashboard')
      } else if (event === 'SIGNED_OUT') {
        // Redirect to home if signed out
        navigate('/')
      }
    })
    
    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard')
      }
    })
  }, [navigate])
  
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-400">Authenticating...</p>
      </div>
    </div>
  )
}