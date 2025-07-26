/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'hidden',
    'md:flex',
    'md:hidden',
    'md:block',
    // Touch target sizes
    'min-h-[44px]',
    'min-w-[44px]',
    'p-3',
    // Critical BlockControls classes
    '-left-2',
    'top-1',
    'absolute',
    'relative',
    'group',
    'block-wrapper',
    'block-controls',
    'block-controls-trigger',
    'inline-action-bar',
    'inline-action-button',
    'always-visible',
    'opacity-0',
    'opacity-30',
    'opacity-50',
    'opacity-60',
    'opacity-70',
    'opacity-80',
    'opacity-100',
    'pointer-events-none',
    'pointer-events-auto',
    'visible',
    'invisible',
    'scale-110',
    'active',
    'backdrop-blur-sm',
    'backdrop-blur',
    'group-hover:opacity-100',
    'group-hover:pointer-events-auto',
    'flex',
    'items-start',
    'gap-1',
    // Comprehensive pattern to preserve all negative utilities
    { 
      pattern: /^-?(left|right|top|bottom|translate-x|translate-y)-\d+$/,
      variants: ['hover', 'focus', 'group-hover']
    },
    // Additional negative positioning classes
    '-left-1', '-left-3', '-left-4',
    '-right-1', '-right-2', '-right-3', '-right-4',
    '-top-1', '-top-2', '-top-3', '-top-4',
    '-bottom-1', '-bottom-2', '-bottom-3', '-bottom-4',
    // Preserve transform classes
    'scale-95',
    'scale-100',
    'transform',
    'transition-all',
    'duration-200',
    'ease-out'
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
      // Fluid typography scale
      fontSize: {
        'xs-fluid': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'sm-fluid': 'clamp(0.875rem, 0.825rem + 0.25vw, 1rem)',
        'base-fluid': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        'lg-fluid': 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
        'xl-fluid': 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
        '2xl-fluid': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
        '3xl-fluid': 'clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)',
        '4xl-fluid': 'clamp(2.25rem, 1.95rem + 1.5vw, 3rem)',
      },
      // Fluid spacing scale
      spacing: {
        'fluid-xs': 'clamp(0.25rem, 0.2rem + 0.25vw, 0.5rem)',
        'fluid-sm': 'clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)',
        'fluid-md': 'clamp(1rem, 0.8rem + 1vw, 1.5rem)',
        'fluid-lg': 'clamp(1.5rem, 1.2rem + 1.5vw, 2rem)',
        'fluid-xl': 'clamp(2rem, 1.5rem + 2.5vw, 3rem)',
        'fluid-2xl': 'clamp(3rem, 2rem + 5vw, 5rem)',
        // Safe areas for mobile devices
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      screens: {
        // Base breakpoints
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        
        // Problematic ranges that need special attention
        'tablet-portrait': '768px',
        'tablet-landscape': '1024px',
        'small-laptop': '1280px',
        'ultra': '2560px',
        
        // Custom range queries for dead zones
        'tablet-range': {'min': '768px', 'max': '1023px'},
        'laptop-range': {'min': '1280px', 'max': '1439px'},
        'tablet-landscape-range': {'min': '1024px', 'max': '1194px'},
        
        // Container query sizes for component-level responsiveness
        '@container': true,
        '@xs': '20rem',
        '@sm': '24rem',
        '@md': '28rem',
        '@lg': '32rem',
        '@xl': '36rem',
        '@2xl': '42rem',
        '@3xl': '48rem',
        '@4xl': '56rem',
        '@5xl': '64rem',
      },
      colors: {
        'dark': '#050d1a',
        'dark-lighter': '#0f1f33',
        'dark-primary': '#0a1628',
        'dark-secondary': '#1e3a5f',
        'accent-green': '#10b981',
        'text-primary': '#e0e7ff',
        'text-secondary': '#94a3b8',
        // Blue-tinted dark surfaces for elevation
        'surface-0': '#0d1117', // Base
        'surface-1': '#161b22', // Slightly elevated
        'surface-2': '#1f2428', // More elevated
        'surface-3': '#2d333b', // Highest elevation
        // Version Track colors
        'vt-base': '#121212',
        'vt-surface': '#1E1E1E',
        'vt-glass': 'rgba(255, 255, 255, 0.05)',
        'vt-glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
      },
      // Touch-optimized minimum sizes
      minHeight: {
        'touch': '44px',
        'touch-small': '36px',
      },
      minWidth: {
        'touch': '44px',
        'touch-small': '36px',
      },
      // Modern viewport units
      height: {
        'screen-dvh': '100dvh',
        'screen-svh': '100svh',
        'screen-lvh': '100lvh',
      },
      width: {
        'screen-dvw': '100dvw',
        'screen-svw': '100svw',
        'screen-lvw': '100lvw',
      },
      animation: {
        'in': 'in 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-from-top-1': 'slide-in-from-top-1 0.2s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        // Mobile-specific animations
        'slide-up': 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-left': 'slide-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-right': 'slide-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-from-top-1': {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // Mobile slide animations
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      }
    },
  },
  plugins: [],
}