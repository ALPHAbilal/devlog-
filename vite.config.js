import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

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
    cssCodeSplit: false, // Prevent hover rules from being split into separate chunks
    cssMinify: 'lightningcss', // Use lightningcss for safer CSS minification
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})