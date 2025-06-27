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
    }
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

export async function deleteEntry(id) {
  const storageAdapter = await init();
  return storageAdapter.deleteEntry(id);
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

// Re-export the init function for components that need it
export { init };

// Storage wrapper for backward compatibility
export const storageWrapper = {
  init,
  reset,
  loadEntries,
  saveEntries,
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
  get isSupabase() {
    // Check if we're using the Supabase wrapper
    return adapter && adapter.loadEntries && adapter.loadEntries.toString().includes('getDocuments');
  }
};

// Re-init when auth state changes
let lastAuthEvent = null;
supabase.auth.onAuthStateChange((event) => {
  console.log('Storage wrapper: Auth state changed:', event);
  // Only reset on SIGNED_OUT or if switching users
  if (event === 'SIGNED_OUT' || (event === 'SIGNED_IN' && lastAuthEvent === 'SIGNED_OUT')) {
    console.log('Storage wrapper: Resetting due to auth change');
    reset();
  }
  lastAuthEvent = event;
});

// Default export for backward compatibility
export default storageWrapper;