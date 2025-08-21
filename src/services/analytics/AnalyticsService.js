/**
 * Google Analytics 4 Service
 * Singleton pattern for centralized analytics management
 * Handles initialization, event tracking, and user properties
 */

import { loadGtagScript } from './script-loader';
import { ConsentManager } from './consent';

class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    this.debugMode = import.meta.env.VITE_GA4_DEBUG_MODE === 'true';
    this.eventQueue = [];
    this.consentManager = new ConsentManager();
    this.userId = null;
  }

  /**
   * Initialize Google Analytics
   * Called once on app startup
   */
  async initialize() {
    // Skip if already initialized or no measurement ID
    if (this.initialized || !this.measurementId) {
      if (!this.measurementId && this.debugMode) {
        console.log('[GA4] No measurement ID configured, analytics disabled');
      }
      return;
    }

    try {
      // Check consent before loading
      const hasConsent = await this.consentManager.hasAnalyticsConsent();
      
      if (!hasConsent && this.consentManager.requiresConsent()) {
        if (this.debugMode) {
          console.log('[GA4] Waiting for user consent');
        }
        return;
      }

      // Load gtag script
      await loadGtagScript(this.measurementId);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { window.dataLayer.push(arguments); };
      
      window.gtag('js', new Date());
      
      // Configure with measurement ID
      const config = {
        send_page_view: false, // We'll manually track page views for SPA
        debug_mode: this.debugMode,
      };

      // Add user ID if available
      if (this.userId) {
        config.user_id = this.userId;
      }

      window.gtag('config', this.measurementId, config);

      // Set consent state
      this.updateConsentState();

      this.initialized = true;

      if (this.debugMode) {
        console.log('[GA4] Analytics initialized successfully');
      }

      // Process any queued events
      this.processEventQueue();

    } catch (error) {
      console.error('[GA4] Failed to initialize analytics:', error);
    }
  }

  /**
   * Update consent state in gtag
   */
  updateConsentState() {
    if (!window.gtag) return;

    const consent = this.consentManager.getConsentState();
    
    window.gtag('consent', 'update', {
      'analytics_storage': consent.analytics ? 'granted' : 'denied',
      'ad_storage': 'denied', // We don't use ads
      'functionality_storage': 'granted',
      'personalization_storage': 'granted',
      'security_storage': 'granted'
    });
  }

  /**
   * Track a page view
   * @param {string} path - The page path
   * @param {string} title - The page title
   */
  trackPageView(path, title) {
    if (!this.initialized) {
      this.eventQueue.push({ type: 'page_view', path, title });
      return;
    }

    if (!window.gtag) return;

    if (this.debugMode) {
      console.log('[GA4] Page view:', path);
    }

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.origin + path
    });
  }

  /**
   * Track a custom event
   * @param {string} eventName - The event name (max 40 chars)
   * @param {object} parameters - Event parameters
   */
  trackEvent(eventName, parameters = {}) {
    if (!this.initialized) {
      this.eventQueue.push({ type: 'event', eventName, parameters });
      return;
    }

    if (!window.gtag) return;

    // Validate event name
    if (eventName.length > 40) {
      console.warn(`[GA4] Event name "${eventName}" exceeds 40 character limit`);
    }

    if (this.debugMode) {
      console.log('[GA4] Event:', eventName, parameters);
    }

    // Add user ID if available
    if (this.userId && !parameters.user_id) {
      parameters.user_id = this.userId;
    }

    window.gtag('event', eventName, parameters);
  }

  /**
   * Set the user ID for tracking
   * @param {string} userId - The user ID (use Supabase UUID)
   */
  setUserId(userId) {
    this.userId = userId;
    
    if (this.initialized && window.gtag) {
      window.gtag('config', this.measurementId, {
        user_id: userId
      });

      if (this.debugMode) {
        console.log('[GA4] User ID set:', userId);
      }
    }
  }

  /**
   * Set user properties
   * @param {object} properties - User properties to set
   */
  setUserProperties(properties) {
    if (!this.initialized || !window.gtag) return;

    if (this.debugMode) {
      console.log('[GA4] User properties:', properties);
    }

    window.gtag('set', 'user_properties', properties);
  }

  /**
   * Track an error
   * @param {Error} error - The error object
   * @param {object} context - Additional context
   */
  trackError(error, context = {}) {
    this.trackEvent('exception', {
      description: error.message || 'Unknown error',
      fatal: context.fatal || false,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace length
      ...context
    });
  }

  /**
   * Track timing (performance metrics)
   * @param {string} category - Timing category
   * @param {string} name - Timing variable name
   * @param {number} value - Time in milliseconds
   */
  trackTiming(category, name, value) {
    this.trackEvent('timing_complete', {
      event_category: category,
      name: name,
      value: Math.round(value)
    });
  }

  /**
   * Process queued events after initialization
   */
  processEventQueue() {
    while (this.eventQueue.length > 0) {
      const item = this.eventQueue.shift();
      
      if (item.type === 'page_view') {
        this.trackPageView(item.path, item.title);
      } else if (item.type === 'event') {
        this.trackEvent(item.eventName, item.parameters);
      }
    }
  }

  /**
   * Handle consent update
   * @param {boolean} granted - Whether analytics consent is granted
   */
  onConsentUpdate(granted) {
    this.consentManager.setAnalyticsConsent(granted);
    this.updateConsentState();

    if (granted && !this.initialized) {
      // Initialize if consent is now granted
      this.initialize();
    }

    if (this.debugMode) {
      console.log('[GA4] Consent updated:', granted ? 'granted' : 'denied');
    }
  }

  /**
   * Check if analytics is enabled and initialized
   */
  isEnabled() {
    return this.initialized && this.measurementId;
  }
}

// Create singleton instance
let instance = null;

export function getAnalytics() {
  if (!instance) {
    instance = new AnalyticsService();
  }
  return instance;
}

// Export default instance
export default getAnalytics();