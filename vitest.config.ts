import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom',

    // Setup files (run before each test file)
    setupFiles: ['./src/test/setup.ts'],

    // Global test APIs (describe, it, expect)
    globals: true,

    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist'],

    // Coverage (optional, enable when needed)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/types/**'
      ]
    },

    // Performance
    pool: 'forks',
    isolate: true,

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000
  },

  // Path aliases (must match tsconfig.json)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types'),
      '@/api': resolve(__dirname, './src/api')
    }
  }
})
