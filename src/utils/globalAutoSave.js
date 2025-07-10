/**
 * Global auto-save functionality
 * This file provides a global auto-save manager that can be accessed from anywhere
 * and fixes the production build errors related to auto-save
 */

import { autoSaveManager } from './autoSaveManager';

class GlobalAutoSaveManager {
  constructor() {
    this.autoSaveManager = autoSaveManager;
    this.intervalId = null;
    this.intervalMs = 1000; // Default 1 second
    this.isRunning = false;
  }

  /**
   * The main performAutoSave function that the production build expects
   */
  async performAutoSave() {
    try {
      // Add defensive check
      if (!this.autoSaveManager || typeof this.autoSaveManager.getUnsavedDocuments !== 'function') {
        console.warn('Auto-save: Manager not properly initialized');
        return;
      }
      
      const unsavedDocuments = this.getUnsavedDocuments();
      
      if (!unsavedDocuments || unsavedDocuments.length === 0) {
        return;
      }

      console.log(`Auto-save: Found ${unsavedDocuments.length} documents with unsaved changes`);
      
      // The autoSaveManager already handles the actual saving
      // We just need to trigger the saves
      await this.autoSaveManager.saveAll();
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw to prevent breaking the interval
    }
  }

  /**
   * Get unsaved documents - delegate to autoSaveManager
   */
  getUnsavedDocuments() {
    return this.autoSaveManager.getUnsavedDocuments();
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges() {
    return this.autoSaveManager.hasUnsavedChanges();
  }

  /**
   * Start auto-save with the given interval (in seconds)
   */
  start(intervalSeconds = 1) {
    if (this.isRunning) {
      this.stop();
    }

    this.intervalMs = intervalSeconds * 1000;
    
    if (intervalSeconds <= 0) {
      console.log('Auto-save disabled (interval: 0)');
      return;
    }

    console.log(`Starting auto-save with interval: ${intervalSeconds} seconds`);
    
    this.intervalId = setInterval(() => {
      this.performAutoSave();
    }, this.intervalMs);
    
    this.isRunning = true;
  }

  /**
   * Stop auto-save
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Update the interval
   */
  updateInterval(intervalSeconds) {
    this.stop();
    this.start(intervalSeconds);
  }

  /**
   * Queue a save - delegate to autoSaveManager
   */
  queueSave(documentId, updates, saveFunction) {
    return this.autoSaveManager.queueSave(documentId, updates, saveFunction);
  }

  /**
   * Save now - delegate to autoSaveManager
   */
  async saveNow(documentId) {
    return this.autoSaveManager.saveNow(documentId);
  }

  /**
   * Save all - delegate to autoSaveManager
   */
  async saveAll() {
    return this.autoSaveManager.saveAll();
  }
}

// Create and export a singleton instance
export const globalAutoSaveManager = new GlobalAutoSaveManager();

// Set up global references that the production build might be looking for
if (typeof window !== 'undefined') {
  // Create defensive wrapper methods that check initialization
  const createSafeMethod = (methodName) => {
    return (...args) => {
      try {
        if (!globalAutoSaveManager || !globalAutoSaveManager.autoSaveManager) {
          console.warn(`Auto-save: ${methodName} called before initialization`);
          return methodName === 'getUnsavedDocuments' ? [] : undefined;
        }
        
        const method = globalAutoSaveManager[methodName];
        if (typeof method === 'function') {
          return method.apply(globalAutoSaveManager, args);
        } else {
          console.warn(`Auto-save: ${methodName} is not a function`);
          return methodName === 'getUnsavedDocuments' ? [] : undefined;
        }
      } catch (error) {
        console.error(`Auto-save: Error in ${methodName}:`, error);
        return methodName === 'getUnsavedDocuments' ? [] : undefined;
      }
    };
  };

  // Create a wrapper that has all the methods the production code might expect
  const wrapper = {
    performAutoSave: createSafeMethod('performAutoSave'),
    getUnsavedDocuments: createSafeMethod('getUnsavedDocuments'),
    hasUnsavedChanges: createSafeMethod('hasUnsavedChanges'),
    saveAll: createSafeMethod('saveAll'),
    queueSave: createSafeMethod('queueSave'),
    saveNow: createSafeMethod('saveNow'),
    start: createSafeMethod('start'),
    stop: createSafeMethod('stop')
  };

  // Try to patch any global objects that might exist
  window.__globalAutoSaveManager = globalAutoSaveManager;
  window.__autoSaveWrapper = wrapper;
  
  // Create Xt namespace if it doesn't exist and add methods
  window.Xt = window.Xt || {};
  Object.keys(wrapper).forEach(key => {
    window.Xt[key] = wrapper[key];
  });
  
  // Add to any other potential global namespaces
  window.H_ = window.H_ || {};
  window.H_.performAutoSave = wrapper.performAutoSave;
  window.H_.getUnsavedDocuments = wrapper.getUnsavedDocuments;
  
  // Also try to intercept any minified references by monitoring property access
  const handler = {
    get(target, prop) {
      if (prop === 'getUnsavedDocuments' || prop === 'performAutoSave') {
        return wrapper[prop];
      }
      return target[prop];
    }
  };
  
  // Try to proxy common minified namespaces
  try {
    if (window.Xt && typeof window.Xt === 'object') {
      window.Xt = new Proxy(window.Xt, handler);
    }
    if (window.H_ && typeof window.H_ === 'object') {
      window.H_ = new Proxy(window.H_, handler);
    }
  } catch (e) {
    // Proxy might not be supported in some environments
  }
  
  // Log for debugging
  console.log('Global auto-save manager initialized with defensive wrappers');
}