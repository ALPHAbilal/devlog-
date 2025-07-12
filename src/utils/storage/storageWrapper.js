import { supabase } from '../../lib/supabase';
import { SupabaseAdapter } from './SupabaseAdapter';
import IndexedDBAdapter from './IndexedDBAdapter';

/**
 * Fixed Storage Wrapper with better error handling
 */
let adapter = null;
let isInitialized = false;
let initPromise = null;

// Create a wrapper for IndexedDBAdapter to match the expected interface
function createIndexedDBWrapper() {
  return {
    async init() {
      return await IndexedDBAdapter.init();
    },
    async loadEntries() {
      return await IndexedDBAdapter.getAllDocuments();
    },
    async saveEntries(entries) {
      return await IndexedDBAdapter.saveAllDocuments(entries);
    },
    async deleteEntry(id) {
      return await IndexedDBAdapter.deleteDocument(id);
    },
    async searchEntries(query) {
      const allEntries = await IndexedDBAdapter.getAllDocuments();
      const lowerQuery = query.toLowerCase();
      return allEntries.filter(entry => 
        entry.title?.toLowerCase().includes(lowerQuery) ||
        entry.content?.toLowerCase().includes(lowerQuery)
      );
    },
    async saveDocument(document) {
      // For IndexedDB, we need to save the single document
      const allDocs = await IndexedDBAdapter.getAllDocuments();
      const updatedDocs = allDocs.map(doc => 
        doc.id === document.id ? document : doc
      );
      // If document doesn't exist, add it
      if (!allDocs.find(doc => doc.id === document.id)) {
        updatedDocs.push(document);
      }
      return await IndexedDBAdapter.saveAllDocuments(updatedDocs);
    }
  };
}

// Create a wrapper for SupabaseAdapter to match the expected interface
function createSupabaseWrapper(adapter) {
  return {
    async init() {
      return await adapter.init();
    },
    async loadEntries() {
      return await adapter.getDocuments();
    },
    async saveEntries(entries) {
      return await adapter.updateAllDocuments(entries);
    },
    async deleteEntry(id) {
      return await adapter.deleteDocument(id);
    },
    async searchEntries(query) {
      // SupabaseAdapter doesn't have built-in search, so we'll do it client-side
      const allEntries = await adapter.getDocuments();
      const lowerQuery = query.toLowerCase();
      return allEntries.filter(entry => 
        entry.title?.toLowerCase().includes(lowerQuery) ||
        entry.content?.toLowerCase().includes(lowerQuery)
      );
    },
    // Add getDocument method for loading single document with blocks
    async getDocument(documentId) {
      return await adapter.getDocument(documentId);
    },
    // Add saveDocument method for saving single document
    async saveDocument(document) {
      return await adapter.saveDocument(document);
    },
    // Expose invalidateCache method
    invalidateCache() {
      if (adapter.invalidateCache) {
        adapter.invalidateCache();
      }
    },
    // Expose the underlying adapter for direct access if needed
    supabaseAdapter: adapter
  };
}

async function init() {
  if (initPromise) return initPromise;
  if (isInitialized) return adapter;

  initPromise = doInit();
  const result = await initPromise;
  initPromise = null;
  return result;
}

async function doInit() {
  try {
    // Check for session without making network request
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Auth session error:', error);
      // Fall back to IndexedDB on auth errors
      console.log('Using IndexedDB for storage (auth error)');
      adapter = createIndexedDBWrapper();
      isInitialized = true;
      return adapter;
    }
    
    if (session && session.user) {
      console.log('Using Supabase for storage');
      const supabaseAdapter = new SupabaseAdapter();
      
      // Try to initialize with userId to avoid extra auth call
      try {
        await supabaseAdapter.init(session.user.id);
        adapter = createSupabaseWrapper(supabaseAdapter);
      } catch (initError) {
        console.warn('Supabase adapter init failed, falling back to IndexedDB:', initError);
        adapter = createIndexedDBWrapper();
      }
    } else {
      console.log('No session, using IndexedDB for storage');
      adapter = createIndexedDBWrapper();
    }
    
    isInitialized = true;
    return adapter;
  } catch (error) {
    console.error('Storage initialization error:', error);
    // Always fall back to IndexedDB on errors
    adapter = createIndexedDBWrapper();
    isInitialized = true;
    return adapter;
  }
}

// Export storage functions
export async function loadEntries() {
  const storageAdapter = await init();
  return storageAdapter.loadEntries();
}

export async function saveEntries(entries) {
  const storageAdapter = await init();
  return storageAdapter.saveEntries(entries);
}

export async function saveDocument(document) {
  const storageAdapter = await init();
  
  // Use the new safe save method if available
  if (storageAdapter.saveDocumentSafe) {
    return storageAdapter.saveDocumentSafe(document);
  } else if (storageAdapter.saveDocument) {
    return storageAdapter.saveDocument(document);
  }
  
  // Fallback for adapters without saveDocument
  throw new Error('Current storage adapter does not support single document saves');
}

export async function deleteEntry(id) {
  try {
    console.log(`StorageWrapper: Deleting entry ${id}`);
    const storageAdapter = await init();
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Delete operation timed out after 10 seconds')), 10000)
    );
    
    const deletePromise = storageAdapter.deleteEntry(id);
    
    const result = await Promise.race([deletePromise, timeoutPromise]);
    console.log(`StorageWrapper: Successfully deleted entry ${id}`);
    return result;
  } catch (error) {
    console.error(`StorageWrapper: Error deleting entry ${id}:`, error);
    throw error;
  }
}

export async function searchEntries(query) {
  const storageAdapter = await init();
  if (storageAdapter.searchEntries) {
    return storageAdapter.searchEntries(query);
  }
  // Fallback search for adapters without search method
  const allEntries = await storageAdapter.loadEntries();
  const lowerQuery = query.toLowerCase();
  return allEntries.filter(entry => 
    entry.title?.toLowerCase().includes(lowerQuery) ||
    entry.content?.toLowerCase().includes(lowerQuery)
  );
}

// Reset function for logout
export function reset() {
  adapter = null;
  isInitialized = false;
  initPromise = null;
}

// Get the current adapter (useful for accessing adapter-specific methods)
export async function getAdapter() {
  await init();
  return adapter;
}

// Re-export the init function for components that need it
export { init };

// Storage wrapper for backward compatibility
export const storageWrapper = {
  init,
  reset,
  loadEntries,
  saveEntries,
  saveDocument,
  deleteEntry,
  searchEntries,
  // Backward compatibility aliases
  getEntries: loadEntries,
  deleteDocument: deleteEntry,
  async getStorageInfo() {
    // Return mock storage info
    return {
      usage: 0,
      quota: 5 * 1024 * 1024 * 1024, // 5GB
      percentUsed: 0
    };
  },
  async clearLocalCache() {
    try {
      // Clear IndexedDB
      await IndexedDBAdapter.clear();
      
      // Clear localStorage items related to devlog
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('devlog') || key.startsWith('journeyLogger'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      return true;
    } catch (error) {
      console.error('Error clearing local cache:', error);
      throw error;
    }
  },
  get isSupabase() {
    // Check if we're using the Supabase wrapper
    return adapter && adapter.loadEntries && adapter.loadEntries.toString().includes('getDocuments');
  }
};

// Auth state changes are now handled centrally in AuthContext
// Storage reset is triggered via event bus when needed

// Default export for backward compatibility
export default storageWrapper;