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
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
