/**
 * Consent Manager for GDPR Compliance
 * Handles user consent for analytics tracking
 */

const CONSENT_KEY = 'devlog_analytics_consent';
const CONSENT_SHOWN_KEY = 'devlog_consent_shown';

export class ConsentManager {
  constructor() {
    this.consentState = this.loadConsentState();
  }

  /**
   * Load consent state from localStorage
   */
  loadConsentState() {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load consent state:', error);
    }

    return {
      analytics: null, // null = not decided, true = granted, false = denied
      timestamp: null
    };
  }

  /**
   * Save consent state to localStorage
   */
  saveConsentState() {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(this.consentState));
    } catch (error) {
      console.error('Failed to save consent state:', error);
    }
  }

  /**
   * Check if user has granted analytics consent
   */
  hasAnalyticsConsent() {
    // If user hasn't decided yet, check if we need to ask
    if (this.consentState.analytics === null) {
      // For non-EU users, we can default to granted (check can be enhanced)
      if (!this.requiresConsent()) {
        this.setAnalyticsConsent(true);
        return true;
      }
      return false;
    }
    
    return this.consentState.analytics === true;
  }

  /**
   * Set analytics consent
   * @param {boolean} granted - Whether consent is granted
   */
  setAnalyticsConsent(granted) {
    this.consentState.analytics = granted;
    this.consentState.timestamp = new Date().toISOString();
    this.saveConsentState();
  }

  /**
   * Check if consent has been shown to user
   */
  hasShownConsent() {
    try {
      return localStorage.getItem(CONSENT_SHOWN_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark consent banner as shown
   */
  markConsentShown() {
    try {
      localStorage.setItem(CONSENT_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark consent as shown:', error);
    }
  }

  /**
   * Check if user requires consent (EU users)
   * This is a simplified check - in production, use a proper geo-location service
   */
  requiresConsent() {
    // Check timezone as a simple heuristic for EU users
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const euTimezones = [
      'Europe/', 'Africa/Ceuta', 'Africa/Melilla', 
      'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores'
    ];
    
    const isEU = euTimezones.some(tz => timezone.startsWith(tz));
    
    // Also check language for additional heuristic
    const language = navigator.language || navigator.userLanguage;
    const euLanguages = [
      'de', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'sv', 'da', 'fi', 
      'no', 'el', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 
      'lv', 'lt', 'mt', 'ga', 'cy'
    ];
    const hasEULanguage = euLanguages.some(lang => language.startsWith(lang));
    
    return isEU || hasEULanguage;
  }

  /**
   * Get current consent state
   */
  getConsentState() {
    return { ...this.consentState };
  }

  /**
   * Reset consent (for testing or user request)
   */
  resetConsent() {
    this.consentState = {
      analytics: null,
      timestamp: null
    };
    try {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_SHOWN_KEY);
    } catch (error) {
      console.error('Failed to reset consent:', error);
    }
  }
}