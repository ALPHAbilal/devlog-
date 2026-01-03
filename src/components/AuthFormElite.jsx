import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Github, Mail, Lock, Check, X, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/api'

const AuthFormElite = ({ authView, onViewChange, onAuth, isLoading, error, successMessage }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [focusedField, setFocusedField] = useState(null)
  const [magneticHover, setMagneticHover] = useState({ x: 0, y: 0 })
  const formRef = useRef(null)

  // Password strength indicator
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    
    setPasswordStrength(strength)
  }, [password])

  // Email validation
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      setEmailError('')
    } else if (!emailRegex.test(value)) {
      setEmailError('Invalid email format')
    } else {
      setEmailError('')
    }
  }

  // Magnetic button effect
  const handleMouseMove = (e, buttonRef) => {
    if (!buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    
    const distance = Math.sqrt(x * x + y * y)
    const maxDistance = 100
    
    if (distance < maxDistance) {
      const force = (maxDistance - distance) / maxDistance
      setMagneticHover({ x: x * force * 0.3, y: y * force * 0.3 })
    }
  }

  const handleMouseLeave = () => {
    setMagneticHover({ x: 0, y: 0 })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password || emailError) return
    
    await onAuth(authView, { email, password })
  }

  // Handle OAuth providers
  const handleOAuth = async (provider) => {
    await onAuth('provider', { provider })
  }

  const primaryButtonRef = useRef(null)

  return (
    <div className="auth-form-elite" ref={formRef}>
      {/* Glass morphism layers */}
      <div className="auth-form-glass-layer-1" />
      <div className="auth-form-glass-layer-2" />
      <div className="auth-form-glass-layer-3" />

      <div className="auth-form-content">
        {/* Header */}
        <div className="auth-form-header">
          <h2>{authView === 'sign_in' ? 'Welcome back' : 'Start your journey'}</h2>
          <p>{authView === 'sign_in' 
            ? 'Sign in to access your developer knowledge base' 
            : 'Create an account to never lose a solution again'}</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="auth-message auth-message-success">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}
        
        {error && (
          <div className="auth-message auth-message-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="auth-oauth-buttons">
          <button 
            type="button"
            className="auth-oauth-button auth-github"
            onClick={() => handleOAuth('github')}
            disabled={isLoading}
          >
            <Github size={20} />
            <span>Continue with GitHub</span>
          </button>
          
          <button 
            type="button"
            className="auth-oauth-button auth-google"
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form-fields">
          {/* Email Field */}
          <div className={`auth-field-group ${focusedField === 'email' ? 'focused' : ''} ${emailError ? 'error' : ''}`}>
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  validateEmail(e.target.value)
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
              />
              {email && !emailError && (
                <Check size={18} className="auth-input-status auth-input-valid" />
              )}
              {emailError && (
                <X size={18} className="auth-input-status auth-input-error" />
              )}
            </div>
            {emailError && <span className="auth-field-error">{emailError}</span>}
          </div>

          {/* Password Field */}
          <div className={`auth-field-group ${focusedField === 'password' ? 'focused' : ''}`}>
            <label htmlFor="password">
              {authView === 'sign_up' ? 'Create password' : 'Password'}
            </label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder={authView === 'sign_up' ? 'Min 8 characters' : '••••••••'}
                disabled={isLoading}
                autoComplete={authView === 'sign_up' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password strength indicator for sign up */}
            {authView === 'sign_up' && password && (
              <div className="auth-password-strength">
                <div className="auth-password-strength-bars">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`auth-password-strength-bar ${
                        passwordStrength >= level ? `strength-${passwordStrength}` : ''
                      }`}
                    />
                  ))}
                </div>
                <span className="auth-password-strength-text">
                  {passwordStrength === 0 && 'Too weak'}
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            ref={primaryButtonRef}
            type="submit"
            className="auth-submit-button"
            disabled={isLoading || !email || !password || emailError}
            onMouseMove={(e) => handleMouseMove(e, primaryButtonRef)}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `translate(${magneticHover.x}px, ${magneticHover.y}px)`,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="auth-button-spinner" />
                <span>{authView === 'sign_in' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{authView === 'sign_in' ? 'Sign in' : 'Create account'}</span>
            )}
            <div className="auth-button-ripple" />
          </button>
        </form>

        {/* Footer */}
        <div className="auth-form-footer">
          <p>
            {authView === 'sign_in' ? (
              <>
                Don't have an account?{' '}
                <button type="button" onClick={() => onViewChange('sign_up')}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => onViewChange('sign_in')}>
                  Sign in
                </button>
              </>
            )}
          </p>
          
          <p className="auth-terms">
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>
            {' & '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthFormElite