/**
 * Feature flags for safe rollout of performance improvements
 */

// Default feature flags configuration
const DEFAULT_FLAGS = {
  // Canvas animation optimizations
  canvasIntersectionObserver: true,
  canvasMemoryCleanup: true,
  
  // Block-level optimizations  
  blockLazyLoading: true,
  heavyBlockSkeleton: true,
  blockMemoryManagement: true,
  
  // Virtualization improvements
  improvedVirtualization: true,
  virtualRowOptimization: true,
  
  // Performance monitoring
  performanceMonitoring: process.env.NODE_ENV === 'development',
  performanceDebugging: false,
  
  // Progressive loading
  progressiveContentLoading: true,
  skeletonPlaceholders: true,
  
  // Memory optimizations
  automaticMemoryCleanup: true,
  memoryUsageTracking: process.env.NODE_ENV === 'development',
  
  // Experimental features (disabled by default)
  experimentalPreloading: false,
  experimentalCaching: false,
  aggressiveLazyLoading: false
};

// Environment-specific overrides
const ENVIRONMENT_OVERRIDES = {
  development: {
    performanceMonitoring: true,
    performanceDebugging: true,
    memoryUsageTracking: true
  },
  production: {
    performanceMonitoring: false,
    performanceDebugging: false,
    memoryUsageTracking: false
  },
  test: {
    // All optimizations disabled for consistent testing
    canvasIntersectionObserver: false,
    blockLazyLoading: false,
    performanceMonitoring: false
  }
};

// User preferences (can be overridden via localStorage)
const USER_PREFERENCES_KEY = 'devlog_performance_flags';

class FeatureFlagManager {
  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadEnvironmentOverrides();
    this.loadUserPreferences();
  }

  loadEnvironmentOverrides() {
    const env = process.env.NODE_ENV || 'development';
    if (ENVIRONMENT_OVERRIDES[env]) {
      Object.assign(this.flags, ENVIRONMENT_OVERRIDES[env]);
    }
  }

  loadUserPreferences() {
    try {
      const stored = localStorage.getItem(USER_PREFERENCES_KEY);
      if (stored) {
        const userFlags = JSON.parse(stored);
        Object.assign(this.flags, userFlags);
      }
    } catch (error) {
      console.warn('Failed to load user feature flags:', error);
    }
  }

  saveUserPreferences() {
    try {
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.warn('Failed to save user feature flags:', error);
    }
  }

  isEnabled(flagName) {
    // Check URL parameters for quick overrides (development only)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFlag = urlParams.get(`flag_${flagName}`);
      if (urlFlag !== null) {
        return urlFlag === 'true' || urlFlag === '1';
      }
    }

    return Boolean(this.flags[flagName]);
  }

  setFlag(flagName, value) {
    this.flags[flagName] = Boolean(value);
    this.saveUserPreferences();
  }

  getAllFlags() {
    return { ...this.flags };
  }

  resetToDefaults() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadEnvironmentOverrides();
    this.saveUserPreferences();
  }

  // Batch enable/disable related flags
  enablePerformanceMode() {
    const performanceFlags = [
      'canvasIntersectionObserver',
      'canvasMemoryCleanup', 
      'blockLazyLoading',
      'heavyBlockSkeleton',
      'blockMemoryManagement',
      'improvedVirtualization',
      'virtualRowOptimization',
      'progressiveContentLoading',
      'automaticMemoryCleanup'
    ];

    performanceFlags.forEach(flag => {
      this.flags[flag] = true;
    });
    this.saveUserPreferences();
  }

  disablePerformanceMode() {
    const performanceFlags = [
      'canvasIntersectionObserver',
      'canvasMemoryCleanup',
      'blockLazyLoading', 
      'heavyBlockSkeleton',
      'blockMemoryManagement',
      'improvedVirtualization',
      'virtualRowOptimization',
      'progressiveContentLoading',
      'automaticMemoryCleanup'
    ];

    performanceFlags.forEach(flag => {
      this.flags[flag] = false;
    });
    this.saveUserPreferences();
  }
}

// Create global instance
const featureFlags = new FeatureFlagManager();

// Export convenience functions
export const isEnabled = (flagName) => featureFlags.isEnabled(flagName);
export const setFlag = (flagName, value) => featureFlags.setFlag(flagName, value);
export const getAllFlags = () => featureFlags.getAllFlags();
export const resetToDefaults = () => featureFlags.resetToDefaults();
export const enablePerformanceMode = () => featureFlags.enablePerformanceMode();
export const disablePerformanceMode = () => featureFlags.disablePerformanceMode();

// Export manager for advanced usage
export { featureFlags };

// Development helper for debugging flags
if (process.env.NODE_ENV === 'development') {
  window.devlogFlags = {
    isEnabled,
    setFlag,
    getAllFlags,
    resetToDefaults,
    enablePerformanceMode,
    disablePerformanceMode,
    manager: featureFlags
  };
  
  console.log('🚩 Feature flags available at window.devlogFlags');
  console.log('Current flags:', getAllFlags());
}

export default featureFlags;