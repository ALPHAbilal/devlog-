import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
import { motion } from 'framer-motion'
import { 
  Code2, 
  Sparkles, 
  Shield, 
  Zap, 
  GitBranch,
  Terminal,
  FileCode,
  Braces,
  Database,
  Link2
} from 'lucide-react'
import LogoMinimal from './LogoMinimal'

const AuthDesktop = () => {
  const [authView, setAuthView] = useState('sign_in')
  const [isLoading, setIsLoading] = useState(false)

  // Animated code snippets for background - reduced
  const codeSnippets = [
    { id: 1, text: 'const solution = await debug()', delay: 0 },
    { id: 2, text: '[[Link]] your knowledge', delay: 0.5 },
  ]

  const features = [
    { icon: <Zap size={16} />, text: 'Instant capture' },
    { icon: <Link2 size={16} />, text: 'Connected docs' },
    { icon: <Shield size={16} />, text: 'Your data, safe' },
  ]

  return (
    <div className="h-screen bg-dark-primary flex overflow-hidden">
      {/* Left Panel - Branding & Value Props */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-accent-green/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-8 xl:px-12 w-full h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-h-full flex flex-col justify-center"
          >
            {/* Logo & Title */}
            <div className="flex items-center gap-2 mb-3">
              <LogoMinimal size={32} />
              <h1 className="text-2xl font-bold text-text-primary">Devlog</h1>
            </div>

            {/* Tagline - single line */}
            <h2 className="text-xl xl:text-2xl font-semibold text-text-primary mb-2">
              Where code becomes <span className="text-accent-green">knowledge</span>
            </h2>

            <p className="text-sm text-text-secondary mb-4 max-w-sm">
              Join 7,000+ developers. Never lose a solution again.
            </p>

            {/* Animated Code Snippets */}
            <div className="space-y-1.5 mb-4 font-mono text-xs">
              {codeSnippets.map((snippet) => (
                <motion.div
                  key={snippet.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: snippet.delay, duration: 0.5 }}
                  className="text-text-secondary/70"
                >
                  <span className="text-accent-green">$</span> {snippet.text}
                </motion.div>
              ))}
            </div>

            {/* Feature List - Compact */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-2 text-text-secondary text-xs"
                >
                  <div className="text-accent-green flex-shrink-0">{feature.icon}</div>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-6 xl:px-8 h-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Minimal Form Header */}
          <div className="text-center mb-3">
            <h3 className="text-lg font-semibold text-text-primary">
              {authView === 'sign_in' ? 'Welcome back' : 'Get started'}
            </h3>
          </div>

          {/* Auth Form Container */}
          <div className="backdrop-blur-xl rounded-xl p-4 border border-dark-secondary/50 shadow-2xl">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    padding: '0.625rem',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  },
                  input: {
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: 'rgba(10, 22, 40, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  },
                  label: {
                    fontSize: '0.813rem',
                    fontWeight: '500',
                    marginBottom: '0.25rem',
                    color: '#e5e7eb',
                  },
                  container: {
                    gap: '0.75rem',
                  },
                  divider: {
                    margin: '0.75rem 0',
                  },
                  anchor: {
                    fontSize: '0.875rem',
                    color: '#10b981',
                    textDecoration: 'none',
                    fontWeight: '500',
                  },
                },
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
                className: {
                  button: 'group relative overflow-hidden',
                  input: 'transition-all duration-200',
                  container: 'space-y-4',
                  label: 'block text-sm',
                  message: 'text-sm rounded-lg p-3',
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

            {/* Additional UI Enhancements */}
            <style jsx global>{`
              /* Social Provider Button Enhancements */
              .supabase-auth-ui_ui-button[title*="GitHub"] {
                background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                position: relative;
                overflow: hidden;
              }
              
              .supabase-auth-ui_ui-button[title*="GitHub"]:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              }
              
              .supabase-auth-ui_ui-button[title*="Google"] {
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
                color: #3c4043 !important;
                border: 1px solid #dadce0 !important;
                position: relative;
                overflow: hidden;
              }
              
              .supabase-auth-ui_ui-button[title*="Google"]:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                background: linear-gradient(135deg, #f8f9fa 0%, #e8eaed 100%) !important;
              }
              
              /* Primary Button Enhancement */
              .supabase-auth-ui_ui-button:not([title*="GitHub"]):not([title*="Google"]) {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
                position: relative;
                overflow: hidden;
              }
              
              .supabase-auth-ui_ui-button:not([title*="GitHub"]):not([title*="Google"]):hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
              }
              
              /* Add subtle shine effect on hover */
              .supabase-auth-ui_ui-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
                transition: left 0.5s;
              }
              
              .supabase-auth-ui_ui-button:hover::before {
                left: 100%;
              }
              
              /* Input Focus Glow */
              .supabase-auth-ui_ui-input:focus {
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
              }
              
              /* Divider Enhancement */
              .supabase-auth-ui_ui-divider {
                position: relative;
                text-align: center;
                margin: 0.75rem 0 !important;
              }
              
              .supabase-auth-ui_ui-divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(to right, transparent, rgba(156, 163, 175, 0.2), transparent);
              }
              
              .supabase-auth-ui_ui-divider span {
                background: #0a1628;
                padding: 0 1rem;
                position: relative;
                color: #6b7280;
                font-size: 0.875rem;
                font-weight: 500;
              }
              
              /* Loading State */
              .supabase-auth-ui_ui-button[disabled] {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none !important;
              }
              
              /* Error Message Styling */
              .supabase-auth-ui_ui-message {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #f87171;
                backdrop-filter: blur(8px);
              }
            `}</style>

            {/* Footer Links - Ultra compact */}
            <div className="mt-4 pt-3 border-t border-dark-secondary/20 text-center text-xs text-text-secondary/60">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-accent-green/80 hover:text-accent-green">Terms</a>
                {' & '}
                <a href="/privacy" className="text-accent-green/80 hover:text-accent-green">Privacy</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AuthDesktop