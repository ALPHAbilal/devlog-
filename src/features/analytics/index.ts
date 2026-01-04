// Analytics feature barrel file
// OPTIMIZED: Direct exports from source files (no nested barrel chains)

// ============== API ==============
export { getAnalytics } from './api/service';
export { default as analytics } from './api/service';
// Alias for backward compatibility
export { getAnalytics as AnalyticsService } from './api/service';

// ============== Lib ==============
export { ConsentManager } from './lib/consent';
export { loadGtagScript, isGtagLoaded } from './lib/script-loader';
// Alias exports for backward compatibility
export { loadGtagScript as loadAnalyticsScript } from './lib/script-loader';

// Create consent manager instance and convenience functions
import { ConsentManager as CM } from './lib/consent';
const consentManager = new CM();
export const analyticsConsent = consentManager;
export const hasConsent = () => consentManager.hasConsent();
export const setConsent = (value: boolean) => consentManager.setConsent(value);

// Re-export useAnalytics hook from shared for convenience
export { useAnalytics, useDocumentAnalytics, usePerformanceTracking } from '@/shared/hooks';
