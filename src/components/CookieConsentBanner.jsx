/**
 * Cookie Consent Banner Component
 * GDPR-compliant consent UI for analytics tracking
 */

import React, { useState, useEffect } from 'react';
import { getAnalytics } from '@/features/analytics';
import { ConsentManager } from '@/features/analytics';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const consentManager = new ConsentManager();
  const analytics = getAnalytics();

  useEffect(() => {
    // Check if we need to show the consent banner
    const checkConsent = () => {
      // Don't show if consent has already been decided
      if (consentManager.hasAnalyticsConsent() !== false && 
          consentManager.getConsentState().analytics !== null) {
        return;
      }

      // Don't show if not required (non-EU users)
      if (!consentManager.requiresConsent()) {
        // Auto-accept for non-EU users
        consentManager.setAnalyticsConsent(true);
        analytics.onConsentUpdate(true);
        return;
      }

      // Don't show if already shown in this session
      if (consentManager.hasShownConsent()) {
        return;
      }

      // Show banner after a short delay
      setTimeout(() => {
        setShowBanner(true);
        consentManager.markConsentShown();
      }, 2000);
    };

    checkConsent();
  }, []);

  const handleAccept = async () => {
    setIsProcessing(true);
    consentManager.setAnalyticsConsent(true);
    analytics.onConsentUpdate(true);
    setShowBanner(false);
    setIsProcessing(false);
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    consentManager.setAnalyticsConsent(false);
    analytics.onConsentUpdate(false);
    setShowBanner(false);
    setIsProcessing(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Cookie Consent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We use cookies to analyze site usage and improve your experience. 
              We don't use advertising cookies or share your data with third parties. 
              Your privacy is important to us.
            </p>
          </div>
          
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decline analytics cookies"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Accept analytics cookies"
            >
              Accept
            </button>
          </div>
        </div>
        
        <div className="mt-3">
          <a
            href="/privacy"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more in our Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}