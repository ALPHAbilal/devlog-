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
      const unsavedDocuments = this.getUnsavedDocuments();
      
      if (unsavedDocuments.length === 0) {
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
  // Create a wrapper that has all the methods the production code might expect
  const wrapper = {
    performAutoSave: () => globalAutoSaveManager.performAutoSave(),
    getUnsavedDocuments: () => globalAutoSaveManager.getUnsavedDocuments(),
    hasUnsavedChanges: () => globalAutoSaveManager.hasUnsavedChanges(),
    saveAll: () => globalAutoSaveManager.saveAll(),
    queueSave: (docId, updates, saveFunc) => globalAutoSaveManager.queueSave(docId, updates, saveFunc),
    saveNow: (docId) => globalAutoSaveManager.saveNow(docId),
    start: (interval) => globalAutoSaveManager.start(interval),
    stop: () => globalAutoSaveManager.stop()
  };

  // Try to patch any global objects that might exist
  window.__globalAutoSaveManager = globalAutoSaveManager;
  window.__autoSaveWrapper = wrapper;
  
  // Also create a placeholder for any minified references
  window.Xt = window.Xt || {};
  Object.assign(window.Xt, wrapper);
  
  // Add to any other potential global namespaces
  window.H_ = window.H_ || {};
  Object.assign(window.H_, wrapper);
}