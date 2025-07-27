import { useState, useRef } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
import { Terminal, Link2, GitBranch, Zap, Shield } from 'lucide-react'
import LogoMinimal from './LogoMinimal'
import AuthDebugConsole from './debug/AuthDebugConsole'
import '../styles/auth-responsive.css'

const AuthDesktop = () => {
  const [authView, setAuthView] = useState('sign_in')
  
  // Refs for debug console
  const authPageRef = useRef(null)
  const brandingPanelRef = useRef(null)
  const formPanelRef = useRef(null)
  const formContainerRef = useRef(null)

  const codeSnippets = [
    { id: 1, text: 'const solution = await debug()', delay: 0 },
    { id: 2, text: '[[Link]] your knowledge', delay: 0.3 },
    { id: 3, text: 'git commit -m "fixed"', delay: 0.6 },
  ]

  const features = [
    { icon: Zap, text: 'Instant capture' },
    { icon: Link2, text: 'Connected docs' },
    { icon: Shield, text: 'Your data, safe' },
  ]

  return (
    <>
      <div className="auth-page-wrapper" ref={authPageRef}>
        {/* Branding Panel */}
        <div className="auth-branding-panel" ref={brandingPanelRef}>
        <div className="auth-pattern-bg"></div>
        <div className="auth-gradient-orb auth-gradient-orb-1"></div>
        <div className="auth-gradient-orb auth-gradient-orb-2"></div>
        
        <div className="auth-branding-content">
          <div className="auth-logo-group">
            <LogoMinimal size={32} />
            <h1 className="auth-logo-text">Devlog</h1>
          </div>

          <h2 className="auth-tagline">
            Where code becomes <span className="auth-tagline-accent">knowledge</span>
          </h2>

          <p className="auth-subtitle">
            Join 7,000+ developers. Never lose a solution again.
          </p>

          <div className="auth-code-snippets">
            {codeSnippets.map((snippet) => (
              <div
                key={snippet.id}
                className="auth-code-line"
                style={{ animationDelay: `${snippet.delay}s` }}
              >
                <span className="auth-code-prompt">$</span> {snippet.text}
              </div>
            ))}
          </div>

          <div className="auth-features">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="auth-feature-item"
                  style={{ animationDelay: `${1.5 + index * 0.1}s` }}
                >
                  <Icon className="auth-feature-icon" size={18} />
                  <span className="auth-feature-text">{feature.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Auth Form Panel */}
      <div className="auth-form-panel" ref={formPanelRef}>
        <div className="auth-form-container" ref={formContainerRef}>
          {/* Mobile Branding */}
          <div className="auth-mobile-branding">
            <div className="auth-logo-group">
              <LogoMinimal size={40} />
              <h1 className="auth-logo-text">Devlog</h1>
            </div>
            <p className="auth-mobile-tagline">
              Where code becomes knowledge
            </p>
          </div>
          
          {/* Form Header */}
          <div className="auth-form-header">
            <h3>{authView === 'sign_in' ? 'Welcome back' : 'Get started'}</h3>
          </div>

          {/* Supabase Auth Form */}
          <div className="auth-form-wrapper">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#10b981',
                      brandAccent: '#059669',
                      brandButtonText: 'white',
                      defaultButtonBackground: 'rgba(31, 41, 55, 0.8)',
                      defaultButtonBackgroundHover: 'rgba(55, 65, 81, 0.9)',
                      defaultButtonBorder: 'transparent',
                      defaultButtonText: '#e5e7eb',
                      inputBackground: 'transparent',
                      inputBorder: 'rgba(75, 85, 99, 0.3)',
                      inputBorderHover: 'rgba(16, 185, 129, 0.5)',
                      inputBorderFocus: '#10b981',
                      inputText: '#f3f4f6',
                      inputLabelText: '#e5e7eb',
                      inputPlaceholder: '#9ca3af',
                      messageText: '#ef4444',
                      messageTextDanger: '#ef4444',
                      anchorTextColor: '#10b981',
                      anchorTextHoverColor: '#059669',
                    },
                  },
                },
              }}
              view={authView}
              theme="dark"
              providers={['github', 'google']}
              redirectTo={getURL() + 'auth/callback'}
              onlyThirdPartyProviders={false}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                    email_input_placeholder: 'you@example.com',
                    password_input_placeholder: '••••••••',
                    button_label: 'Sign in',
                    loading_button_label: 'Signing in...',
                    social_provider_text: 'Continue with {{provider}}',
                    link_text: "Don't have an account? Sign up",
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Create password',
                    email_input_placeholder: 'you@example.com',
                    password_input_placeholder: 'Create a secure password',
                    button_label: 'Create account',
                    loading_button_label: 'Creating account...',
                    social_provider_text: 'Sign up with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                  },
                },
              }}
            />

            {/* Footer */}
            <div className="auth-form-footer">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms">Terms</a>
                {' & '}
                <a href="/privacy">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
      
      {/* Debug Console */}
      <AuthDebugConsole 
        authPageRef={authPageRef}
        brandingPanelRef={brandingPanelRef}
        formPanelRef={formPanelRef}
        formContainerRef={formContainerRef}
      />
    </>
  )
}

export default AuthDesktop