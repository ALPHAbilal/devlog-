import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'
import { getURL } from '../utils/auth'
import { Eye, EyeOff } from 'lucide-react'

const AuthEnhanced = () => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-100 mb-2">
              Devlog
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-400">
              Sign in to continue
            </p>
          </div>

          <div
            className="bg-dark-secondary rounded-lg p-4 sm:p-6 md:p-8 border border-gray-800/50 shadow-lg"
          >

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
                      minHeight: '44px', // Ensure touch-friendly size
                    },
                    input: {
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      padding: '0.875rem 1rem',
                      backgroundColor: 'rgba(31, 41, 55, 0.5)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      minHeight: '44px', // Ensure touch-friendly size
                    },
                    label: {
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                      color: '#e5e7eb',
                    },
                    container: {
                      gap: '1rem',
                    },
                    divider: {
                      margin: '1.25rem 0',
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
                        spaceSmall: '0.375rem',
                        spaceMedium: '0.75rem',
                        spaceLarge: '1rem',
                        inputPadding: '0.75rem 1rem',
                        buttonPadding: '0.75rem 1.25rem',
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
                    button: 'auth-button-enhanced',
                    input: 'auth-input-enhanced',
                    label: 'auth-label-enhanced',
                    message: 'auth-message-enhanced',
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
              />
            </div>


          </div>

        </div>
    </div>
  )
}

export default AuthEnhanced