import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseOptimized'

export default function AuthCallback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // Only check current session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard')
      } else {
        navigate('/')
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