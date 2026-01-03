/**
 * React Hook for Google Analytics
 * Provides easy access to analytics tracking in components
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalytics } from '@/features/analytics';

/**
 * Hook to initialize and use analytics
 */
export function useAnalytics() {
  const analytics = getAnalytics();
  const location = useLocation();
  const previousPath = useRef(null);
  const initRef = useRef(false);

  // Initialize analytics once
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      
      // Use requestIdleCallback for non-blocking initialization
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          analytics.initialize();
        }, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          analytics.initialize();
        }, 1000);
      }
    }
  }, [analytics]);

  // Track page views on route change (but not document views)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Skip if path hasn't changed
    if (currentPath === previousPath.current) {
      return;
    }

    // Skip document paths - they should be tracked as document_view events instead
    const isDocumentPath = /^\/dashboard\/[a-f0-9-]{36}/.test(currentPath);
    
    // Skip the first render (initial page load)
    if (previousPath.current === null) {
      previousPath.current = currentPath;
      // Track initial page view after a short delay (unless it's a document)
      if (!isDocumentPath) {
        setTimeout(() => {
          analytics.trackPageView(currentPath);
        }, 100);
      }
      return;
    }

    // Track subsequent page views (but not document views)
    previousPath.current = currentPath;
    if (!isDocumentPath) {
      analytics.trackPageView(currentPath);
    }
  }, [location, analytics]);

  // Memoized tracking functions
  const trackEvent = useCallback((eventName, parameters) => {
    analytics.trackEvent(eventName, parameters);
  }, [analytics]);

  const trackError = useCallback((error, context) => {
    analytics.trackError(error, context);
  }, [analytics]);

  const trackTiming = useCallback((category, name, value) => {
    analytics.trackTiming(category, name, value);
  }, [analytics]);

  const setUserId = useCallback((userId) => {
    analytics.setUserId(userId);
  }, [analytics]);

  const setUserProperties = useCallback((properties) => {
    analytics.setUserProperties(properties);
  }, [analytics]);

  return {
    trackEvent,
    trackError,
    trackTiming,
    setUserId,
    setUserProperties,
    isEnabled: analytics.isEnabled()
  };
}

/**
 * Hook for tracking document-specific events
 */
export function useDocumentAnalytics() {
  const { trackEvent, trackTiming } = useAnalytics();
  const startTimeRef = useRef({});

  const trackDocumentEvent = useCallback((action, documentId, metadata = {}) => {
    trackEvent(`document_${action}`, {
      document_id: documentId,
      ...metadata
    });
  }, [trackEvent]);

  const startDocumentTimer = useCallback((action, documentId) => {
    startTimeRef.current[`${action}_${documentId}`] = performance.now();
  }, []);

  const endDocumentTimer = useCallback((action, documentId) => {
    const key = `${action}_${documentId}`;
    const startTime = startTimeRef.current[key];
    
    if (startTime) {
      const duration = performance.now() - startTime;
      trackTiming('document', action, duration);
      delete startTimeRef.current[key];
    }
  }, [trackTiming]);

  return {
    trackDocumentEvent,
    startDocumentTimer,
    endDocumentTimer
  };
}

/**
 * Hook for tracking performance metrics
 */
export function usePerformanceTracking() {
  const { trackTiming, trackEvent } = useAnalytics();
  const metricsRef = useRef({});

  useEffect(() => {
    // Use modern Performance Observer API
    if (!('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          trackTiming('web_vitals', 'LCP', Math.round(lastEntry.startTime));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            trackTiming('web_vitals', 'FID', Math.round(fid));
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Track Navigation Timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            trackTiming('performance', 'page_load', Math.round(entry.loadEventEnd));
            trackTiming('performance', 'dom_ready', Math.round(entry.domContentLoadedEventEnd));
            trackTiming('performance', 'response_time', Math.round(entry.responseEnd - entry.fetchStart));
          }
        });
      });
      navObserver.observe({ type: 'navigation', buffered: true });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        navObserver.disconnect();
      };
    } catch (error) {
      console.error('[GA4] Performance tracking error:', error);
    }
  }, [trackTiming]);

  const trackComponentPerformance = useCallback((componentName, renderTime) => {
    if (renderTime > 100) {
      // Only track slow renders
      trackEvent('slow_component_render', {
        component: componentName,
        render_time: Math.round(renderTime)
      });
    }
  }, [trackEvent]);

  return {
    trackComponentPerformance
  };
}