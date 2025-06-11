// IndexedDB Storage Adapter for Journey Log Compass
// This adapter provides a more robust storage solution with larger capacity
// while maintaining backwards compatibility with localStorage

class IndexedDBAdapter {
  constructor() {
    this.dbName = 'journey-log-compass-db';
    this.version = 1;
    this.db = null;
    this.isAvailable = false;
    this.initPromise = null;
  }

  // Initialize the database connection
  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._initializeDB();
    return this.initPromise;
  }

  async _initializeDB() {
    try {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not available, falling back to localStorage');
        this.isAvailable = false;
        return false;
      }

      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.dbName, this.version);

        request.onerror = () => {
          console.error('Failed to open IndexedDB:', request.error);
          this.isAvailable = false;
          resolve(false);
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isAvailable = true;
          console.log('IndexedDB initialized successfully');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('documents')) {
            const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
            // Create indexes for efficient querying
            documentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            documentStore.createIndex('createdAt', 'createdAt', { unique: false });
            documentStore.createIndex('title', 'title', { unique: false });
            // Multi-entry index for tags array
            documentStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          }

          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      this.isAvailable = false;
      return false;
    }
  }

  // Get all documents
  async getAllDocuments() {
    if (!this.isAvailable) {
      // Fallback to localStorage
      const saved = localStorage.getItem('journeyLoggerEntries');
      return saved ? JSON.parse(saved) : [];
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['documents'], 'readonly');
        const store = transaction.objectStore('documents');
        const request = store.getAll();

        request.onsuccess = () => {
          // Sort by updatedAt descending (newest first)
          const documents = request.result.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );
          resolve(documents);
        };

        request.onerror = () => {
          console.error('Error fetching documents:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getAllDocuments:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('journeyLoggerEntries');
      return saved ? JSON.parse(saved) : [];
    }
  }

  // Save a single document
  async saveDocument(document) {
    if (!this.isAvailable) {
      // Fallback: update in localStorage
      const entries = JSON.parse(localStorage.getItem('journeyLoggerEntries') || '[]');
      const index = entries.findIndex(e => e.id === document.id);
      if (index >= 0) {
        entries[index] = document;
      } else {
        entries.unshift(document);
      }
      localStorage.setItem('journeyLoggerEntries', JSON.stringify(entries));
      return document;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        const request = store.put(document);

        request.onsuccess = () => {
          resolve(document);
        };

        request.onerror = () => {
          console.error('Error saving document:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in saveDocument:', error);
      throw error;
    }
  }

  // Save all documents (batch operation)
  async saveAllDocuments(documents) {
    if (!this.isAvailable) {
      // Fallback to localStorage
      localStorage.setItem('journeyLoggerEntries', JSON.stringify(documents));
      return documents;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        
        // Clear existing documents
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => {
          // Add all documents
          documents.forEach(doc => store.add(doc));
        };

        transaction.oncomplete = () => {
          resolve(documents);
        };

        transaction.onerror = () => {
          console.error('Error saving documents:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error in saveAllDocuments:', error);
      // Fallback to localStorage
      localStorage.setItem('journeyLoggerEntries', JSON.stringify(documents));
      return documents;
    }
  }

  // Delete a document
  async deleteDocument(id) {
    if (!this.isAvailable) {
      // Fallback: update in localStorage
      const entries = JSON.parse(localStorage.getItem('journeyLoggerEntries') || '[]');
      const filtered = entries.filter(e => e.id !== id);
      localStorage.setItem('journeyLoggerEntries', JSON.stringify(filtered));
      return true;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['documents'], 'readwrite');
        const store = transaction.objectStore('documents');
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error deleting document:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in deleteDocument:', error);
      throw error;
    }
  }

  // Get settings
  async getSettings(key = 'devlogSettings') {
    if (!this.isAvailable) {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };

        request.onerror = () => {
          console.error('Error fetching settings:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getSettings:', error);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    }
  }

  // Save settings
  async saveSettings(key = 'devlogSettings', value) {
    if (!this.isAvailable) {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key, value });

        request.onsuccess = () => {
          resolve(value);
        };

        request.onerror = () => {
          console.error('Error saving settings:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in saveSettings:', error);
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    }
  }

  // Get storage estimate
  async getStorageEstimate() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          usageDetails: estimate.usageDetails || {}
        };
      } catch (error) {
        console.error('Error getting storage estimate:', error);
        return null;
      }
    }
    return null;
  }

  // Check if storage is persisted
  async isPersisted() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch (error) {
        console.error('Error checking persistence:', error);
        return false;
      }
    }
    return false;
  }

  // Request persistent storage
  async requestPersistence() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        if (granted) {
          console.log('Persistent storage granted');
        }
        return granted;
      } catch (error) {
        console.error('Error requesting persistence:', error);
        return false;
      }
    }
    return false;
  }

  // Migrate data from localStorage to IndexedDB
  async migrateFromLocalStorage() {
    try {
      // Check if migration is needed
      const migrationKey = 'indexeddb_migration_complete';
      const migrationComplete = localStorage.getItem(migrationKey);
      
      if (migrationComplete || !this.isAvailable) {
        return false;
      }

      // Get data from localStorage
      const entriesData = localStorage.getItem('journeyLoggerEntries');
      const settingsData = localStorage.getItem('devlogSettings');

      if (entriesData) {
        const entries = JSON.parse(entriesData);
        await this.saveAllDocuments(entries);
        console.log(`Migrated ${entries.length} documents to IndexedDB`);
      }

      if (settingsData) {
        await this.saveSettings('devlogSettings', JSON.parse(settingsData));
        console.log('Migrated settings to IndexedDB');
      }

      // Mark migration as complete
      localStorage.setItem(migrationKey, 'true');
      
      // Keep localStorage data as backup for now
      console.log('Migration to IndexedDB completed successfully');
      return true;
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  }

  // Clear all data (use with caution)
  async clearAllData() {
    if (!this.isAvailable) {
      localStorage.removeItem('journeyLoggerEntries');
      localStorage.removeItem('devlogSettings');
      return true;
    }

    try {
      await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['documents', 'settings', 'metadata'], 'readwrite');
        
        transaction.objectStore('documents').clear();
        transaction.objectStore('settings').clear();
        transaction.objectStore('metadata').clear();

        transaction.oncomplete = () => {
          console.log('All IndexedDB data cleared');
          resolve(true);
        };

        transaction.onerror = () => {
          console.error('Error clearing data:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error in clearAllData:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const storage = new IndexedDBAdapter();

// Auto-initialize and migrate on module load
(async () => {
  await storage.init();
  if (storage.isAvailable) {
    await storage.migrateFromLocalStorage();
    // Request persistent storage to prevent data eviction
    await storage.requestPersistence();
  }
})();

export default storage;