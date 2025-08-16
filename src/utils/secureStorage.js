/**
 * Secure Storage Wrapper for Sensitive Data
 * Provides additional security layers for storing auth tokens
 */

// Simple obfuscation for token storage (not encryption, but better than plain text)
const obfuscate = (str) => {
  if (!str) return str;
  return btoa(str.split('').reverse().join(''));
};

const deobfuscate = (str) => {
  if (!str) return str;
  try {
    return atob(str).split('').reverse().join('');
  } catch {
    return null;
  }
};

// Generate a unique browser fingerprint for additional validation
const getBrowserFingerprint = () => {
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency,
    nav.platform
  ].join('|');
  
  return btoa(fingerprint);
};

class SecureStorage {
  constructor() {
    this.prefix = 'ss_';
    this.fingerprint = getBrowserFingerprint();
  }

  setItem(key, value) {
    try {
      const data = {
        v: obfuscate(value),
        f: this.fingerprint,
        t: Date.now()
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(data));
    } catch (e) {
      console.error('SecureStorage setItem error:', e);
    }
  }

  getItem(key) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const data = JSON.parse(item);
      
      // Validate fingerprint (helps detect token theft)
      if (data.f !== this.fingerprint) {
        console.warn('Browser fingerprint mismatch - possible token theft');
        this.removeItem(key);
        return null;
      }

      // Check if data is too old (optional expiry)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - data.t > maxAge) {
        this.removeItem(key);
        return null;
      }

      return deobfuscate(data.v);
    } catch (e) {
      console.error('SecureStorage getItem error:', e);
      return null;
    }
  }

  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.error('SecureStorage removeItem error:', e);
    }
  }

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error('SecureStorage clear error:', e);
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

// Session monitor to detect suspicious activity
export class SessionMonitor {
  constructor() {
    this.activityLog = [];
    this.suspiciousPatterns = {
      rapidRequests: 0,
      failedRefreshes: 0,
      fingerprintChanges: 0
    };
  }

  logActivity(type, details) {
    this.activityLog.push({
      type,
      details,
      timestamp: Date.now()
    });

    // Keep only last 100 activities
    if (this.activityLog.length > 100) {
      this.activityLog.shift();
    }

    // Check for suspicious patterns
    this.analyzeSuspiciousActivity(type);
  }

  analyzeSuspiciousActivity(type) {
    const recentActivities = this.activityLog.filter(
      log => Date.now() - log.timestamp < 60000 // Last minute
    );

    // Check for rapid requests (possible token abuse)
    if (type === 'token_refresh') {
      const refreshCount = recentActivities.filter(
        log => log.type === 'token_refresh'
      ).length;
      
      if (refreshCount > 5) {
        this.suspiciousPatterns.rapidRequests++;
        return 'suspicious_rapid_refresh';
      }
    }

    // Check for failed refreshes
    if (type === 'refresh_failed') {
      this.suspiciousPatterns.failedRefreshes++;
      if (this.suspiciousPatterns.failedRefreshes > 3) {
        return 'suspicious_failed_refreshes';
      }
    }

    return null;
  }

  isSuspicious() {
    return (
      this.suspiciousPatterns.rapidRequests > 2 ||
      this.suspiciousPatterns.failedRefreshes > 3 ||
      this.suspiciousPatterns.fingerprintChanges > 0
    );
  }

  reset() {
    this.activityLog = [];
    this.suspiciousPatterns = {
      rapidRequests: 0,
      failedRefreshes: 0,
      fingerprintChanges: 0
    };
  }
}

export const sessionMonitor = new SessionMonitor();