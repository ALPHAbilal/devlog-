import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      // Privacy settings for Devlog
      unmask: [
        '.document-title',
        '.navigation-menu',
        '.block-content',
        '[data-safe-text="true"]'
      ],
      block: [
        '.user-email',
        '.api-key',
        '[data-sensitive="true"]'
      ],
    }),
  ],
  
  // Performance Monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/.*\.supabase\.co\/rest/,
    /^https:\/\/devlog\.design/
  ],
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Enhanced error filtering
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'Script error.',
    'Network Error',
    'ChunkLoadError',
    'Load failed',
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
  
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
  ],
  
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Filter browser extension errors
    if (event.exception?.values?.[0]?.stacktrace?.frames) {
      const frames = event.exception.values[0].stacktrace.frames;
      const hasOwnCode = frames.some(frame => 
        frame.filename?.includes(window.location.origin) ||
        frame.filename?.includes('devlog')
      );
      if (!hasOwnCode) return null;
    }
    
    // Add Devlog-specific context
    event.contexts = {
      ...event.contexts,
      devlog_app: {
        offline_mode: !navigator.onLine,
        document_count: parseInt(localStorage.getItem('devlog_document_count') || '0'),
        has_active_session: !!localStorage.getItem('sb-zqcjipwiznesnbgbocnu-auth-token'),
        browser_storage_available: 'localStorage' in window && 'indexedDB' in window,
      }
    };
    
    // Filter out known non-critical errors
    const error = hint.originalException || hint.syntheticException;
    if (error?.message) {
      // Filter out Supabase auth refresh errors
      if (error.message.includes('Auth session missing') && !navigator.onLine) {
        return null;
      }
      // Filter out expected offline errors
      if (!navigator.onLine && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed')
      )) {
        return null;
      }
    }
    
    return event;
  },
  
  // Only initialize in production or staging
  enabled: import.meta.env.PROD || import.meta.env.VITE_VERCEL_ENV === 'preview',
});