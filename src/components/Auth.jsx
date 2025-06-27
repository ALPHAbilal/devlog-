import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabaseOptimized'

export default function AuthComponent() {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-200 mb-2">Welcome to Devlog</h1>
          <p className="text-gray-400">Sign in to continue your journey</p>
        </div>
        
        <div className="bg-dark-secondary rounded-lg p-6 shadow-lg">
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
                    defaultButtonBackground: '#1e3a5f',
                    defaultButtonBackgroundHover: '#2a4872',
                    defaultButtonBorder: '#1e3a5f',
                    defaultButtonText: 'white',
                    inputBackground: '#0a1628',
                    inputBorder: '#1e3a5f',
                    inputBorderHover: '#10b981',
                    inputBorderFocus: '#10b981',
                    inputText: 'white',
                    inputLabelText: '#9ca3af',
                    inputPlaceholder: '#6b7280',
                    messageText: '#ef4444',
                    messageTextDanger: '#ef4444',
                    anchorTextColor: '#10b981',
                    anchorTextHoverColor: '#059669',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    inputPadding: '10px 12px',
                    buttonPadding: '10px 16px',
                  },
                  fonts: {
                    bodyFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                    buttonFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                    inputFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                    labelFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system`,
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '13px',
                    baseButtonSize: '14px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '6px',
                    buttonBorderRadius: '6px',
                    inputBorderRadius: '6px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                label: 'text-gray-300 mb-1 block',
                button: 'transition-all duration-200',
                input: 'transition-all duration-200',
              },
            }}
            theme="dark"
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>
      </div>
    </div>
  )
}