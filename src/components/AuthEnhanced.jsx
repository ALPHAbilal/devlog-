import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react'
import DevlogLogo from './DevlogLogo'

const AuthEnhanced = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  // Password strength indicator
  const getPasswordStrength = (pass) => {
    if (!pass) return 0
    let strength = 0
    if (pass.length >= 8) strength++
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++
    if (pass.match(/[0-9]/)) strength++
    if (pass.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-primary via-dark to-dark-primary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-green/5 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-50" />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-96 h-96 bg-accent-green/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {/* Logo and branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-8"
          >
            <div className="mb-4">
              <DevlogLogo size="lg" animated={true} />
            </div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2 tracking-tight">
              Welcome to Devlog
            </h1>
            <p className="text-gray-400 text-lg">
              Your premium development journey awaits
            </p>
          </motion.div>

          {/* Enhanced glassmorphic card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glassmorphism glassmorphism-darker rounded-2xl p-8 shadow-2xl border border-gray-800/50 backdrop-blur-xl"
          >
            {/* Security indicator */}
            <div className="flex items-center gap-2 mb-6 text-gray-400">
              <Shield className="w-4 h-4 text-accent-green" />
              <span className="text-sm">Secure 256-bit encryption</span>
            </div>

            {/* Custom Auth UI override */}
            <div className="auth-enhanced-wrapper">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  style: {
                    button: {
                      borderRadius: '0.75rem',
                      fontWeight: '600',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      transform: 'translateY(0)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                    },
                    input: {
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      padding: '0.875rem 1rem',
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    },
                    label: {
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#e5e7eb',
                    },
                    container: {
                      gap: '1.5rem',
                    },
                    divider: {
                      margin: '2rem 0',
                      opacity: '0.1',
                    },
                    socialAuth: {
                      gap: '0.75rem',
                    },
                  },
                  variables: {
                    default: {
                      colors: {
                        brand: '#10b981',
                        brandAccent: '#059669',
                        brandButtonText: 'white',
                        defaultButtonBackground: 'rgba(31, 41, 55, 0.8)',
                        defaultButtonBackgroundHover: 'rgba(55, 65, 81, 0.8)',
                        defaultButtonBorder: 'rgba(75, 85, 99, 0.3)',
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
                      space: {
                        spaceSmall: '0.5rem',
                        spaceMedium: '1rem',
                        spaceLarge: '1.5rem',
                        inputPadding: '0.875rem 1rem',
                        buttonPadding: '0.875rem 1.5rem',
                      },
                      fonts: {
                        bodyFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                        buttonFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                        inputFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                        labelFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                      },
                      fontSizes: {
                        baseBodySize: '1rem',
                        baseInputSize: '1rem',
                        baseLabelSize: '0.875rem',
                        baseButtonSize: '1rem',
                      },
                      borderWidths: {
                        buttonBorderWidth: '1px',
                        inputBorderWidth: '1px',
                      },
                      radii: {
                        borderRadiusButton: '0.75rem',
                        buttonBorderRadius: '0.75rem',
                        inputBorderRadius: '0.75rem',
                      },
                    },
                  },
                  className: {
                    container: 'auth-container-enhanced',
                    button: 'auth-button-enhanced hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
                    input: 'auth-input-enhanced',
                    label: 'auth-label-enhanced',
                    message: 'auth-message-enhanced',
                    socialAuthButton: 'social-auth-enhanced',
                  },
                }}
                theme="dark"
                providers={['google', 'github']}
                redirectTo={getURL() + 'auth/callback'}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email Address',
                      password_label: 'Password',
                      email_input_placeholder: 'your@email.com',
                      password_input_placeholder: 'Enter your password',
                      button_label: 'Sign In',
                      loading_button_label: 'Signing in...',
                      social_provider_text: 'Continue with {{provider}}',
                      link_text: "Don't have an account? Sign up",
                    },
                    sign_up: {
                      email_label: 'Email Address',
                      password_label: 'Create Password',
                      email_input_placeholder: 'your@email.com',
                      password_input_placeholder: 'Create a strong password',
                      button_label: 'Create Account',
                      loading_button_label: 'Creating account...',
                      social_provider_text: 'Sign up with {{provider}}',
                      link_text: 'Already have an account? Sign in',
                    },
                  },
                }}
                onPasswordChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Password strength indicator (shown during sign up) */}
            {password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Password strength</span>
                  <span className="text-xs text-gray-400">
                    {passwordStrength === 0 && 'Weak'}
                    {passwordStrength === 1 && 'Fair'}
                    {passwordStrength === 2 && 'Good'}
                    {passwordStrength === 3 && 'Strong'}
                    {passwordStrength === 4 && 'Very Strong'}
                  </span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      passwordStrength === 0 ? 'bg-red-500' :
                      passwordStrength === 1 ? 'bg-orange-500' :
                      passwordStrength === 2 ? 'bg-yellow-500' :
                      passwordStrength === 3 ? 'bg-green-500' :
                      'bg-accent-green'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Trust indicators */}
            <div className="mt-8 pt-6 border-t border-gray-800/50">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>SSL Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>GDPR Compliant</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center text-sm text-gray-500"
          >
            <div className="flex items-center justify-center gap-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-300 transition-colors">Help</a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-button) {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          font-weight: 600;
          letter-spacing: 0.025em;
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-button)::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-button:hover)::before {
          left: 100%;
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-button[color="default"]) {
          background: rgba(31, 41, 55, 0.8);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(75, 85, 99, 0.3);
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-button[color="default"]:hover) {
          background: rgba(55, 65, 81, 0.8);
          border-color: rgba(75, 85, 99, 0.5);
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-input) {
          background: rgba(31, 41, 55, 0.5);
          backdrop-filter: blur(8px);
        }

        .auth-enhanced-wrapper :global(.supabase-auth-ui_ui-input:focus) {
          background: rgba(31, 41, 55, 0.8);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .social-auth-enhanced {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .social-auth-enhanced:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default AuthEnhanced