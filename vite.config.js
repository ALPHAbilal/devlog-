import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      sourcemaps: {
        assets: ['./dist/**'],
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
      
      release: {
        name: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
        deploy: {
          env: process.env.VERCEL_ENV || 'development',
        },
      },
    }),
  ],
  
  build: {
    sourcemap: true, // Enable source maps for Sentry
    cssMinify: 'esbuild', // Use esbuild for CSS minification (more reliable than lightningcss)
    target: 'es2022', // Prevent ES2023 compatibility issues
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173
  },

  // Path aliases (must match tsconfig.json)
  // FSD-first paths for new code, legacy paths for migration compatibility
  resolve: {
    alias: {
      // Primary alias
      '@': resolve(__dirname, './src'),

      // FSD Layer aliases (new structure)
      '@/shared': resolve(__dirname, './src/shared'),
      '@/app': resolve(__dirname, './src/app'),
      '@/features': resolve(__dirname, './src/features'),
      '@/entities': resolve(__dirname, './src/entities'),
      '@/widgets': resolve(__dirname, './src/widgets'),

      // Legacy aliases (for migration compatibility - remove after FSD complete)
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