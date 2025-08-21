import "./instrument"; // Import Sentry first for early initialization
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './styles/hero-knowledge-constellation.css'
import App from './App.jsx'
import { getAnalytics } from './services/analytics/AnalyticsService'

// Smart Sync is now initialized through useAutoSave hook

// Initialize Google Analytics early (non-blocking)
const analytics = getAnalytics();
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => analytics.initialize(), { timeout: 3000 });
} else {
  setTimeout(() => analytics.initialize(), 1500);
}

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
