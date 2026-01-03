/**
 * Google Analytics 4 Service
 * Singleton pattern for centralized analytics management
 * Handles initialization, event tracking, and user properties
 */

import { loadGtagScript } from '../lib/script-loader';
import { ConsentManager } from '../lib/consent';

class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;
    this.debugMode = import.meta.env.VITE_GA4_DEBUG_MODE === 'true';
    this.eventQueue = [];
    this.consentManager = new ConsentManager();
    // Restore user ID from localStorage if it exists
    this.userId = localStorage.getItem('ga_user_id') || null;
    this.clientId = this.getOrCreateClientId();
    this.sessionId = this.getOrCreateSessionId();
    this.lastPageView = { path: null, timestamp: 0 };
    this.pageViewThrottle = 1000; // 1 second throttle for duplicate page views
  }

  /**
   * Get or create a persistent client ID
   */
  getOrCreateClientId() {
    const storedId = localStorage.getItem('ga_client_id');
    if (storedId) {
      return storedId;
    }
    
    // Generate a new client ID (UUID v4 format)
    const newId = 'client_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('ga_client_id', newId);
    return newId;
  }

  /**
   * Get or create a session ID (expires after 30 minutes of inactivity)
   */
  getOrCreateSessionId() {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    const stored = sessionStorage.getItem('ga_session');
    if (stored) {
      const session = JSON.parse(stored);
      if (now - session.lastActivity < SESSION_TIMEOUT) {
        session.lastActivity = now;
        sessionStorage.setItem('ga_session', JSON.stringify(session));
        return session.id;
      }
    }
    
    // Create new session
    const newSession = {
      id: 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      startTime: now,
      lastActivity: now
    };
    sessionStorage.setItem('ga_session', JSON.stringify(newSession));
    return newSession.id;
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
        client_id: this.clientId, // Use persistent client ID
        session_id: this.sessionId
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
   * Track a page view with deduplication
   * @param {string} path - The page path
   * @param {string} title - The page title
   */
  trackPageView(path, title) {
    const now = Date.now();
    
    // Throttle duplicate page views for the same path
    if (this.lastPageView.path === path && 
        (now - this.lastPageView.timestamp) < this.pageViewThrottle) {
      if (this.debugMode) {
        console.log('[GA4] Skipping duplicate page view (throttled):', path);
      }
      return;
    }
    
    // Update last page view tracking
    this.lastPageView = { path, timestamp: now };
    
    if (!this.initialized) {
      this.eventQueue.push({ type: 'page_view', path, title });
      return;
    }

    if (!window.gtag) return;

    if (this.debugMode) {
      console.log('[GA4] Page view tracked:', {
        path,
        title: title || document.title,
        client_id: this.clientId,
        session_id: this.sessionId,
        user_id: this.userId
      });
    }

    // Update session activity
    this.sessionId = this.getOrCreateSessionId();

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.origin + path,
      client_id: this.clientId,
      session_id: this.sessionId
    });
  }

  /**
   * Track a document view (separate from page views)
   * @param {string} documentId - The document ID
   * @param {string} documentTitle - The document title
   */
  trackDocumentView(documentId, documentTitle) {
    if (this.debugMode) {
      console.log('[GA4] Document view:', {
        document_id: documentId,
        document_title: documentTitle,
        client_id: this.clientId,
        session_id: this.sessionId
      });
    }

    this.trackEvent('document_view', {
      document_id: documentId,
      document_title: documentTitle,
      view_type: 'full'
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

    // Update session activity
    this.sessionId = this.getOrCreateSessionId();

    // Add tracking IDs to parameters
    const enrichedParams = {
      ...parameters,
      client_id: this.clientId,
      session_id: this.sessionId
    };

    // Add user ID if available
    if (this.userId && !enrichedParams.user_id) {
      enrichedParams.user_id = this.userId;
    }

    if (this.debugMode) {
      console.log('[GA4] Event tracked:', {
        event: eventName,
        parameters: enrichedParams,
        timestamp: new Date().toISOString()
      });
    }

    window.gtag('event', eventName, enrichedParams);
  }

  /**
   * Set the user ID for tracking
   * @param {string} userId - The user ID (use Supabase UUID)
   */
  setUserId(userId) {
    this.userId = userId;
    
    // Store user ID persistently
    if (userId) {
      localStorage.setItem('ga_user_id', userId);
    } else {
      localStorage.removeItem('ga_user_id');
    }
    
    if (this.initialized && window.gtag) {
      window.gtag('config', this.measurementId, {
        user_id: userId,
        client_id: this.clientId
      });

      if (this.debugMode) {
        console.log('[GA4] User ID set:', {
          user_id: userId,
          client_id: this.clientId,
          session_id: this.sessionId
        });
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