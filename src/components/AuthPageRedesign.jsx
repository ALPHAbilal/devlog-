import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
import { useNavigate } from 'react-router-dom'
import LogoMinimal from './LogoMinimal'
import AuthFormRedesign from './AuthFormRedesign'
import '../styles/auth-redesign.css'

const AuthPageRedesign = () => {
  const [authView, setAuthView] = useState('sign_in')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const navigate = useNavigate()

  // COPY EXACT LOGIC from AuthElite.jsx:160-170
  const handleViewChange = useCallback((newView) => {
    if (newView !== authView) {
      setAuthView(newView)
      setError(null)
      setSuccessMessage(null)
    }
  }, [authView])

  // COPY EXACT LOGIC from AuthElite.jsx:173-215
  const handleAuth = async (type, credentials) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      let result
      if (type === 'sign_in') {
        result = await supabase.auth.signInWithPassword(credentials)
      } else if (type === 'sign_up') {
        result = await supabase.auth.signUp({
          ...credentials,
          options: {
            emailRedirectTo: getURL() + 'auth/callback',
          }
        })
      } else if (type === 'provider') {
        result = await supabase.auth.signInWithOAuth({
          provider: credentials.provider,
          options: {
            redirectTo: getURL() + 'auth/callback',
          }
        })
        return // OAuth redirects, no need to handle response
      }

      if (result.error) {
        throw result.error
      }

      if (type === 'sign_up') {
        setSuccessMessage('🎉 Check your email to confirm your account!')
      } else {
        setSuccessMessage('✨ Welcome back! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page-redesign">
      {/* Logo - Top Left */}
      <div className="auth-logo">
        <LogoMinimal />
        <span className="auth-logo-text">DevLog</span>
      </div>

      {/* Centered Form Container */}
      <div className="auth-form-container">
        <AuthFormRedesign
          authView={authView}
          onViewChange={handleViewChange}
          onAuth={handleAuth}
          isLoading={isLoading}
          error={error}
          successMessage={successMessage}
        />
      </div>

      {/* Privacy Policy Link - Bottom Center */}
      <a href="/privacy" className="auth-privacy-link">Privacy Policy</a>
    </div>
  )
}

export default AuthPageRedesign
