/**
 * Google Analytics Script Loader
 * Handles async loading of gtag.js script
 */

/**
 * Load the Google Analytics gtag.js script
 * @param {string} measurementId - GA4 Measurement ID
 * @returns {Promise<void>}
 */
export async function loadGtagScript(measurementId) {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (window.gtag) {
      resolve();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag"]`);
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and append script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    
    script.addEventListener('load', () => {
      resolve();
    });
    
    script.addEventListener('error', () => {
      reject(new Error('Failed to load Google Analytics script'));
    });

    // Add script to document head
    document.head.appendChild(script);
  });
}

/**
 * Check if gtag is loaded
 * @returns {boolean}
 */
export function isGtagLoaded() {
  return typeof window.gtag === 'function';
}