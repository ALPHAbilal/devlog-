import { useState, useEffect, useRef } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
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
  Link2,
  Github,
  Chrome,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import LogoMinimal from './LogoMinimal'
import '../styles/auth-responsive.css'

const AuthDesktop = () => {
  const [authView, setAuthView] = useState('sign_in')
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef(null)

  // Animated code snippets for background
  const codeSnippets = [
    { id: 1, text: 'const solution = await debug()', delay: 0, icon: Terminal },
    { id: 2, text: '[[Link]] your knowledge', delay: 0.3, icon: Link2 },
    { id: 3, text: 'git commit -m "fixed"', delay: 0.6, icon: GitBranch },
  ]

  const features = [
    { icon: Zap, text: 'Instant capture', color: 'blue' },
    { icon: Link2, text: 'Connected docs', color: 'purple' },
    { icon: Shield, text: 'Your data, safe', color: 'emerald' },
  ]

  // Mouse tracking for gradient effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="auth-page-wrapper">
      {/* Left Panel - Branding & Value Props */}
      <div className="auth-branding-panel">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 auth-gradient-orb bg-accent-green/20 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 auth-gradient-orb bg-blue-500/10 rounded-full filter blur-3xl" />

        {/* Content */}
        <div className="auth-desktop-content auth-content-fade-in">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 mb-4">
              <LogoMinimal size={32} />
              <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Devlog</h1>
            </div>

            {/* Tagline - single line */}
            <h2 className="text-2xl xl:text-3xl font-bold text-text-primary mb-3 leading-tight">
              Where code becomes <span className="text-accent-green font-extrabold">knowledge</span>
            </h2>

            <p className="text-base lg:text-lg text-text-secondary mb-6 max-w-md font-medium leading-relaxed">
              Join 7,000+ developers. Never lose a solution again.
            </p>

            {/* Animated Code Snippets */}
            <div className="space-y-2 mb-6 font-mono text-sm">
              {codeSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className="text-text-secondary/70 auth-slide-in"
                  style={{ animationDelay: `${snippet.delay}s` }}
                >
                  <span className="text-accent-green">$</span> {snippet.text}
                </div>
              ))}
            </div>

            {/* Feature List - Compact */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-text-secondary text-xs auth-slide-in"
                    style={{ animationDelay: `${1.5 + index * 0.1}s` }}
                  >
                    <div className="text-accent-green flex-shrink-0"><Icon size={18} /></div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                )
              })}
            </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper auth-scale-in">
          {/* Mobile Logo - shown only on small screens */}
          <div className="auth-mobile-branding">
            <div className="flex items-center justify-center gap-3 mb-2">
              <LogoMinimal size={40} />
              <h1 className="text-text-primary tracking-tight">Devlog</h1>
            </div>
            <p className="text-text-secondary text-center">
              Where code becomes knowledge
            </p>
          </div>
          
          {/* Minimal Form Header */}
          <div className="auth-form-header text-center">
            <h3 className="font-bold text-text-primary tracking-tight">
              {authView === 'sign_in' ? 'Welcome back' : 'Get started'}
            </h3>
          </div>

          {/* Auth Form Container */}
          <div className="backdrop-blur-xl rounded-xl border border-dark-secondary/50 shadow-2xl">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: 'clamp(0.875rem, 1vw, 1rem)',
                    padding: 'clamp(0.625rem, 0.8vw, 0.75rem) clamp(0.875rem, 1vw, 1rem)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  },
                  input: {
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 1vw, 1rem)',
                    padding: 'clamp(0.75rem, 0.9vw, 0.875rem) clamp(0.875rem, 1vw, 1rem)',
                    backgroundColor: 'rgba(10, 22, 40, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  },
                  label: {
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    marginBottom: '0.375rem',
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
                    fontWeight: '600',
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
              
              /* CSS Animations for removed motion elements */
              .auth-content-fade-in {
                animation: authFadeInUp 0.8s ease-out;
              }
              
              .auth-slide-in {
                animation: authSlideIn 0.5s ease-out both;
              }
              
              .auth-scale-in {
                animation: authScaleIn 0.5s ease-out;
              }
              
              @keyframes authFadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              
              @keyframes authSlideIn {
                from {
                  opacity: 0;
                  transform: translateX(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }
              
              @keyframes authScaleIn {
                from {
                  opacity: 0;
                  transform: scale(0.95);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>

            {/* Footer Links - Ultra compact */}
            <div className="auth-form-footer mt-4 pt-3 border-t border-dark-secondary/20 text-center">
              <p className="text-xs text-text-secondary/60">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-accent-green/80 hover:text-accent-green transition-colors">Terms</a>
                {' & '}
                <a href="/privacy" className="text-accent-green/80 hover:text-accent-green transition-colors">Privacy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthDesktop