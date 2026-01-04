// src/shared/lib/feature-flags.ts
/**
 * Feature Flags for Gradual Rollout
 *
 * Toggle via localStorage for controlled rollout of new data layer.
 */

/**
 * Check if new data layer is enabled
 */
export function isNewDataLayerEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('USE_NEW_DATA_LAYER') === 'true';
}

/**
 * Enable new data layer
 */
export function enableNewDataLayer(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('USE_NEW_DATA_LAYER', 'true');
  console.log('[FEATURE-FLAG] New data layer enabled. Refresh to apply.');
}

/**
 * Disable new data layer (rollback)
 */
export function disableNewDataLayer(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('USE_NEW_DATA_LAYER');
  console.log('[FEATURE-FLAG] New data layer disabled. Refresh to apply.');
}

// Expose globally for debugging
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__enableNewDataLayer = enableNewDataLayer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__disableNewDataLayer = disableNewDataLayer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__isNewDataLayerEnabled = isNewDataLayerEnabled;
}
