/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
      }
    },
  },
  plugins: [],
}