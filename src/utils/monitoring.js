/**
 * Application Monitoring Setup
 * 
 * Configures Sentry for error tracking and performance monitoring
 * in production environments.
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initialize Sentry monitoring
 * Should be called early in the application lifecycle
 */
export function initMonitoring() {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      integrations: [
        new BrowserTracing({
          // Set sampling to control performance overhead
          tracingOrigins: ['localhost', /^\//],
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || 0.1, // 10% of transactions
      
      // Environment
      environment: import.meta.env.MODE,
      
      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      
      // Session Replay (if enabled in Sentry plan)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Data scrubbing
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.error('Sentry Event (dev mode):', event, hint);
          return null;
        }
        
        // Filter out known non-critical errors
        const error = hint.originalException;
        
        // Ignore network errors that are expected
        if (error?.message?.includes('Failed to fetch')) {
          return null;
        }
        
        // Ignore ResizeObserver errors (common and harmless)
        if (error?.message?.includes('ResizeObserver loop')) {
          return null;
        }
        
        return event;
      },
      
      // Breadcrumb filtering
      beforeBreadcrumb(breadcrumb, hint) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }
        
        // Don't capture XHR/fetch to Supabase auth endpoints
        if (
          breadcrumb.category === 'fetch' &&
          breadcrumb.data?.url?.includes('/auth/v1/')
        ) {
          return null;
        }
        
        return breadcrumb;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'extension://',
        'chrome-extension://',
        'moz-extension://',
        
        // Facebook related
        'fb_xd_fragment',
        
        // Other plugins
        '__gCrWeb',
        'Non-Error promise rejection captured',
        
        // Network errors
        'Network request failed',
        'NetworkError',
        
        // Safari specific
        'Non-Error promise rejection captured with value: Object Not Found Matching Id',
      ],
      
      // Don't capture certain transactions
      ignoreTransactions: [
        // Health checks
        '/health',
        '/api/health',
        
        // Static assets
        /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
      ],
    });
  }
}

/**
 * Log an error with context
 * @param {Error} error - The error to log
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
  console.error(error);
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        component: context.component || 'unknown',
      },
    });
  }
}

/**
 * Log a message with level
 * @param {string} message - The message to log
 * @param {string} level - The level (info, warning, error)
 * @param {Object} context - Additional context
 */
export function logMessage(message, level = 'info', context = {}) {
  const logFn = console[level] || console.log;
  logFn(message, context);
  
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  }
}

/**
 * Track a custom event
 * @param {string} name - Event name
 * @param {Object} data - Event data
 */
export function trackEvent(name, data = {}) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message: name,
      category: 'custom',
      level: 'info',
      data,
    });
  }
}

/**
 * Start a performance transaction
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Transaction object
 */
export function startTransaction(name, op = 'custom') {
  if (import.meta.env.PROD) {
    return Sentry.startTransaction({ name, op });
  }
  
  // Return mock transaction in development
  return {
    setData: () => {},
    setStatus: () => {},
    finish: () => {},
  };
}

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {Object} tags - Additional tags
 */
export function logPerformance(metric, value, tags = {}) {
  if (import.meta.env.DEV) {
    console.log(`Performance: ${metric}`, value, tags);
  }
  
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: metric,
      level: 'info',
      data: { value, ...tags },
    });
  }
}

/**
 * Set user context for error tracking
 * @param {Object} user - User object
 */
export function setUserContext(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add custom context to errors
 * @param {string} key - Context key
 * @param {Object} context - Context data
 */
export function setContext(key, context) {
  Sentry.setContext(key, context);
}

/**
 * Create an error boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for performance monitoring
 */
export const Profiler = Sentry.Profiler;

/**
 * withProfiler HOC for component performance monitoring
 */
export const withProfiler = Sentry.withProfiler;

/**
 * withSentryRouting HOC for route change tracking
 */
export const withSentryRouting = Sentry.withSentryRouting;