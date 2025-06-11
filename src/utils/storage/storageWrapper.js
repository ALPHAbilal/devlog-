// Storage wrapper that provides a migration path from localStorage to IndexedDB
// This allows gradual adoption without breaking existing functionality

import storage from './CompressedStorageAdapter';

// Storage wrapper that mimics localStorage API but uses IndexedDB when possible
export const storageWrapper = {
  // Flag to track if we should use IndexedDB
  useIndexedDB: true,
  
  // Initialize the wrapper
  async init() {
    try {
      const initialized = await storage.init();
      this.useIndexedDB = initialized && storage.isAvailable;
      
      if (this.useIndexedDB) {
        console.log('Using IndexedDB for storage');
        // Attempt migration if not already done
        await storage.migrateFromLocalStorage();
      } else {
        console.log('Using localStorage as fallback');
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
      this.useIndexedDB = false;
    }
  },

  // Get entries - compatible with existing localStorage calls
  async getEntries() {
    if (this.useIndexedDB) {
      try {
        const documents = await storage.getAllDocuments();
        // Also update localStorage as backup
        localStorage.setItem('journeyLoggerEntries', JSON.stringify(documents));
        return documents;
      } catch (error) {
        console.error('IndexedDB read error, falling back to localStorage:', error);
        this.useIndexedDB = false;
      }
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('journeyLoggerEntries');
    return saved ? JSON.parse(saved) : [];
  },

  // Save entries - compatible with existing localStorage calls
  async saveEntries(entries) {
    // Always save to localStorage as backup
    localStorage.setItem('journeyLoggerEntries', JSON.stringify(entries));
    
    if (this.useIndexedDB) {
      try {
        await storage.saveAllDocuments(entries);
        return entries;
      } catch (error) {
        console.error('IndexedDB write error:', error);
        // localStorage already updated, so just return
        return entries;
      }
    }
    
    return entries;
  },

  // Get settings
  async getSettings() {
    if (this.useIndexedDB) {
      try {
        const settings = await storage.getSettings('devlogSettings');
        if (settings) {
          // Update localStorage backup
          localStorage.setItem('devlogSettings', JSON.stringify(settings));
        }
        return settings;
      } catch (error) {
        console.error('IndexedDB settings read error:', error);
      }
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem('devlogSettings');
    return saved ? JSON.parse(saved) : null;
  },

  // Save settings
  async saveSettings(settings) {
    // Always save to localStorage as backup
    localStorage.setItem('devlogSettings', JSON.stringify(settings));
    
    if (this.useIndexedDB) {
      try {
        await storage.saveSettings('devlogSettings', settings);
        return settings;
      } catch (error) {
        console.error('IndexedDB settings write error:', error);
        return settings;
      }
    }
    
    return settings;
  },

  // Get storage info
  async getStorageInfo() {
    if (this.useIndexedDB) {
      return await storage.getStorageEstimate();
    }
    
    // Estimate localStorage usage
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    return {
      usage: totalSize * 2, // UTF-16 uses 2 bytes per character
      quota: 10 * 1024 * 1024, // Assume 10MB limit for localStorage
      usageDetails: { localStorage: totalSize * 2 }
    };
  },

  // Check if we're using IndexedDB
  isUsingIndexedDB() {
    return this.useIndexedDB && storage.isAvailable;
  }
};

// Auto-initialize on import
storageWrapper.init().catch(console.error);

export default storageWrapper;