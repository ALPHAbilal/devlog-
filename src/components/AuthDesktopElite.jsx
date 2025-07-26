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
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react'
import LogoMinimal from './LogoMinimal'

const AuthDesktopElite = () => {
  const [authView, setAuthView] = useState('sign_in')
  const [isLoading, setIsLoading] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)
  const [activeField, setActiveField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  
  const containerRef = useRef(null)
  const formRef = useRef(null)

  // Animated code snippets with enhanced styling
  const codeSnippets = [
    { id: 1, text: 'const solution = await debug()', delay: 0.2, icon: Terminal, color: 'blue' },
    { id: 2, text: '[[Link]] your knowledge', delay: 0.4, icon: Link2, color: 'purple' },
    { id: 3, text: 'git commit -m "solved"', delay: 0.6, icon: GitBranch, color: 'emerald' },
  ]

  const features = [
    { icon: Zap, text: 'Lightning fast', color: 'blue', description: 'Capture thoughts instantly' },
    { icon: Link2, text: 'Connected', color: 'purple', description: 'Link your knowledge' },
    { icon: Shield, text: 'Secure', color: 'emerald', description: 'Your data, protected' },
  ]

  // Stats for social proof
  const stats = [
    { value: '10K+', label: 'Developers' },
    { value: '1M+', label: 'Snippets saved' },
    { value: '99.9%', label: 'Uptime' },
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

  // Trigger animations on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-900 flex overflow-hidden relative auth-elite"
    >
      {/* Dynamic gradient background */}
      <div 
        className="absolute inset-0 opacity-30 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
        }}
      />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none noise-texture-auth" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle-auth particle-auth-1" />
        <div className="particle-auth particle-auth-2" />
        <div className="particle-auth particle-auth-3" />
        <div className="particle-auth particle-auth-4" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Left Panel - Premium Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient orbs with blur */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-[100px] animate-pulse-slow animation-delay-2000" />
        
        {/* Content container with glass effect */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <div className="max-w-xl">
            {/* Logo and title with premium animation */}
            <div className="flex items-center gap-3 mb-8 logo-container">
              <div className="logo-wrapper">
                <LogoMinimal size={40} />
                <div className="logo-glow" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Devlog
              </h1>
            </div>

            {/* Tagline with gradient text */}
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-gradient">
                Where code becomes knowledge
              </span>
            </h2>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              The intelligent documentation system that learns from your debugging journey.
            </p>

            {/* Animated code snippets with icons */}
            <div className="space-y-3 mb-10">
              {codeSnippets.map((snippet) => {
                const Icon = snippet.icon
                const colorClasses = {
                  blue: 'text-blue-400',
                  purple: 'text-purple-400',
                  emerald: 'text-emerald-400'
                }
                return (
                  <div
                    key={snippet.id}
                    className="code-snippet-elite"
                    style={{ animationDelay: `${snippet.delay}s` }}
                  >
                    <div className={`snippet-icon ${colorClasses[snippet.color]}`}>
                      <Icon size={16} />
                    </div>
                    <code className="text-sm text-slate-300">
                      <span className="text-slate-500">$</span> {snippet.text}
                      <span className="cursor-blink">|</span>
                    </code>
                  </div>
                )
              })}
            </div>

            {/* Feature grid with hover effects */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const bgClasses = {
                  blue: 'bg-blue-500/10 group-hover:bg-blue-500/20',
                  purple: 'bg-purple-500/10 group-hover:bg-purple-500/20',
                  emerald: 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
                }
                const textClasses = {
                  blue: 'text-blue-400',
                  purple: 'text-purple-400',
                  emerald: 'text-emerald-400'
                }
                return (
                  <div
                    key={index}
                    className="feature-card-elite group"
                    style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <div className={`feature-icon ${bgClasses[feature.color]}`}>
                      <Icon size={20} className={textClasses[feature.color]} />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{feature.text}</h3>
                    <p className="text-xs text-slate-400">{feature.description}</p>
                  </div>
                )
              })}
            </div>

            {/* Stats for social proof */}
            <div className="flex items-center gap-8 pt-8 border-t border-slate-800/50">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="stat-item-elite"
                  style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Elite Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8 xl:px-12">
        <div 
          ref={formRef}
          className="w-full max-w-md form-container-elite"
        >
          {/* Form header with animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl mb-4 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {authView === 'sign_in' ? 'Welcome back' : 'Create your account'}
            </h3>
            <p className="text-slate-400">
              {authView === 'sign_in' 
                ? 'Continue your documentation journey' 
                : 'Start documenting your code journey'}
            </p>
          </div>

          {/* Auth form container with glass morphism */}
          <div className="auth-form-elite backdrop-blur-xl bg-slate-800/30 rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    padding: '0.75rem',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    textTransform: 'none',
                    letterSpacing: '0.025em',
                  },
                  input: {
                    borderRadius: '0.75rem',
                    fontSize: '0.875rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  },
                  label: {
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  },
                  container: {
                    gap: '1rem',
                  },
                  divider: {
                    margin: '1.5rem 0',
                  },
                  anchor: {
                    fontSize: '0.875rem',
                    color: '#60a5fa',
                    textDecoration: 'none',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                  },
                  message: {
                    fontSize: '0.875rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: '#3b82f6',
                      brandAccent: '#2563eb',
                      brandButtonText: 'white',
                      defaultButtonBackground: 'rgba(51, 65, 85, 0.5)',
                      defaultButtonBackgroundHover: 'rgba(71, 85, 105, 0.8)',
                      defaultButtonBorder: 'rgba(100, 116, 139, 0.3)',
                      defaultButtonText: '#e2e8f0',
                      inputBackground: 'transparent',
                      inputBorder: 'rgba(100, 116, 139, 0.3)',
                      inputBorderHover: 'rgba(59, 130, 246, 0.5)',
                      inputBorderFocus: '#3b82f6',
                      inputText: '#f1f5f9',
                      inputLabelText: '#cbd5e1',
                      inputPlaceholder: '#64748b',
                      messageText: '#f87171',
                      messageTextDanger: '#f87171',
                      anchorTextColor: '#60a5fa',
                      anchorTextHoverColor: '#93bbfc',
                    },
                  },
                },
                className: {
                  button: 'elite-button group',
                  input: 'elite-input',
                  container: 'space-y-4',
                  label: 'elite-label',
                  message: 'elite-message',
                  anchor: 'elite-link',
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
                    email_label: 'Email address',
                    password_label: 'Password',
                    email_input_placeholder: 'you@example.com',
                    password_input_placeholder: '••••••••',
                    button_label: 'Sign in to your account',
                    loading_button_label: 'Signing you in...',
                    social_provider_text: 'Continue with {{provider}}',
                    link_text: "Don't have an account? Create one",
                  },
                  sign_up: {
                    email_label: 'Email address',
                    password_label: 'Create password',
                    email_input_placeholder: 'you@example.com',
                    password_input_placeholder: 'Create a strong password',
                    button_label: 'Create your account',
                    loading_button_label: 'Creating your account...',
                    social_provider_text: 'Sign up with {{provider}}',
                    link_text: 'Already have an account? Sign in',
                  },
                },
              }}
            />

            {/* Premium divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-slate-800/30 text-slate-400 uppercase tracking-wider">
                  Trusted by developers
                </span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 opacity-50">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield size={16} />
                <span>SOC2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Check size={16} />
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>

          {/* Footer with links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-blue-400 hover:text-blue-300 transition-colors">
                Terms of Service
              </a>
              {' and '}
              <a href="/privacy" className="text-blue-400 hover:text-blue-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Elite Auth Styles */
        .auth-elite {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Noise texture */
        .noise-texture-auth {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseAuth'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseAuth)' opacity='0.5'/%3E%3C/svg%3E");
        }

        /* Grid pattern */
        .bg-grid-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.4'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* Floating particles */
        .particle-auth {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          animation: floatAuth 30s infinite;
        }

        .particle-auth-1 {
          top: 10%;
          left: 5%;
          animation-duration: 35s;
        }

        .particle-auth-2 {
          top: 70%;
          right: 10%;
          animation-delay: 5s;
          animation-duration: 40s;
        }

        .particle-auth-3 {
          bottom: 20%;
          left: 15%;
          animation-delay: 10s;
          animation-duration: 45s;
        }

        .particle-auth-4 {
          top: 40%;
          right: 30%;
          animation-delay: 15s;
          animation-duration: 38s;
        }

        @keyframes floatAuth {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.4;
          }
          25% {
            transform: translate(100px, -150px) scale(1.5);
            opacity: 0.6;
          }
          50% {
            transform: translate(-150px, 100px) scale(0.8);
            opacity: 0.3;
          }
          75% {
            transform: translate(50px, 50px) scale(1.2);
            opacity: 0.5;
          }
        }

        /* Logo animations */
        .logo-container {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .logo-wrapper {
          position: relative;
        }

        .logo-glow {
          position: absolute;
          inset: -8px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(12px);
          animation: pulse 3s ease-in-out infinite;
        }

        /* Gradient text animation */
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }

        /* Code snippet animations */
        .code-snippet-elite {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: slideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          padding: 12px 16px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          border: 1px solid rgba(100, 116, 139, 0.2);
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }

        .code-snippet-elite:hover {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateX(4px);
        }

        .snippet-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .cursor-blink {
          animation: blink 1s infinite;
          opacity: 1;
          font-weight: 300;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        /* Feature cards */
        .feature-card-elite {
          padding: 20px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 16px;
          border: 1px solid rgba(100, 116, 139, 0.2);
          backdrop-filter: blur(8px);
          opacity: 0;
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .feature-card-elite:hover {
          transform: translateY(-4px);
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
        }

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        /* Stats animation */
        .stat-item-elite {
          opacity: 0;
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Form container */
        .form-container-elite {
          opacity: 0;
          animation: fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        .auth-form-elite {
          position: relative;
          overflow: hidden;
        }

        .auth-form-elite::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
          pointer-events: none;
        }

        /* Elite button styles */
        :global(.elite-button) {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        :global(.elite-button:hover) {
          transform: translateY(-1px) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
        }

        :global(.elite-button:active) {
          transform: translateY(0) !important;
        }

        :global(.elite-button::before) {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.6s;
        }

        :global(.elite-button:hover::before) {
          left: 100%;
        }

        /* Elite input styles */
        :global(.elite-input) {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        :global(.elite-input:focus) {
          background-color: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
          transform: translateY(-1px) !important;
        }

        /* Social button overrides */
        :global(.supabase-auth-ui_ui-button[title*="GitHub"]) {
          background: linear-gradient(135deg, #24292e 0%, #1a1e22 100%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        :global(.supabase-auth-ui_ui-button[title*="GitHub"]:hover) {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        :global(.supabase-auth-ui_ui-button[title*="Google"]) {
          background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%) !important;
          color: #1f2937 !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        :global(.supabase-auth-ui_ui-button[title*="Google"]:hover) {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15) !important;
          background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%) !important;
        }

        /* Primary button gradient */
        :global(.supabase-auth-ui_ui-button:not([title*="GitHub"]):not([title*="Google"])) {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          position: relative;
          overflow: hidden;
          border: none !important;
          box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.3) !important;
        }

        :global(.supabase-auth-ui_ui-button:not([title*="GitHub"]):not([title*="Google"]):hover) {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 24px -4px rgba(59, 130, 246, 0.4) !important;
        }

        /* Divider styling */
        :global(.supabase-auth-ui_ui-divider) {
          position: relative !important;
          margin: 2rem 0 !important;
        }

        :global(.supabase-auth-ui_ui-divider::before) {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.2), transparent);
        }

        :global(.supabase-auth-ui_ui-divider span) {
          background: rgba(30, 41, 59, 0.5) !important;
          padding: 0 1rem !important;
          position: relative !important;
          color: #64748b !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
        }

        /* Message styling */
        :global(.elite-message) {
          backdrop-filter: blur(12px) !important;
          animation: shake 0.5s ease-in-out !important;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        /* Link hover effect */
        :global(.elite-link:hover) {
          color: #93bbfc !important;
          text-decoration: underline !important;
        }

        /* Loading state */
        :global(.supabase-auth-ui_ui-button[disabled]) {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .animate-pulse-slow {
          animation: pulse 4s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .particle-auth {
            display: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .auth-form-elite {
            border: 2px solid white !important;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AuthDesktopElite