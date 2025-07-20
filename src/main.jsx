import "./instrument"; // Import Sentry first for early initialization
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// Initialize global auto-save manager immediately
import './utils/globalAutoSave'

const container = document.getElementById('root');
const root = createRoot(container, {
  // React 19 Error Hooks Integration with Sentry
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error('Uncaught error in Devlog:', error, errorInfo.componentStack);
  }),
  
  onCaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Caught error in Devlog:', error, errorInfo.componentStack);
  }),
  
  onRecoverableError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Recoverable error in Devlog:', error, errorInfo.componentStack);
  }),
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
