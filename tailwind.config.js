/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#0a1628',
        'dark-secondary': '#1e3a5f',
        'accent-green': '#10b981',
        'text-primary': '#e0e7ff',
        'text-secondary': '#94a3b8',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
      }
    },
  },
  plugins: [],
}