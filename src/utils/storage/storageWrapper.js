import { supabase } from '../../lib/supabaseOptimized';
import { SupabaseAdapter } from './SupabaseAdapter';
import { SupabaseAdapterOptimized } from './SupabaseAdapterOptimized';
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
      // MILESTONE 4: Redirect blocks to Smart Sync if available
      // BUT skip for new documents that don't exist in the database yet
      const isNewDocument = document.metadata?.isNewDocument || false;
      
      if (document.blocks && window.__smartSyncManagers && !isNewDocument) {
        const smartSyncManager = window.__smartSyncManagers.get(document.id);
        if (smartSyncManager) {
          console.log('StorageWrapper: Redirecting blocks to Smart Sync');
          
          // Process each block through Smart Sync
          for (const block of document.blocks) {
            await smartSyncManager.handleChange(
              block.id,
              JSON.stringify(block),
              'UPDATE'
            );
          }
          
          // Save only metadata through traditional path (remove blocks)
          const { blocks, ...documentWithoutBlocks } = document;
          return await adapter.saveDocument(documentWithoutBlocks);
        }
      }
      
      // For new documents or when Smart Sync not available, save normally
      // This ensures the document gets created in the database first
      return await adapter.saveDocument(document);
    },
    // Expose invalidateCache method
    invalidateCache() {
      if (adapter.invalidateCache) {
        adapter.invalidateCache();
      }
    },
    // Expose the underlying adapter for direct access if needed
    supabaseAdapter: adapter,
    // Project management methods
    async getProjects() {
      return await adapter.getProjects();
    },
    async createProject(projectData) {
      return await adapter.createProject(projectData);
    },
    async updateProject(projectId, updates) {
      return await adapter.updateProject(projectId, updates);
    },
    async deleteProject(projectId) {
      return await adapter.deleteProject(projectId);
    },
    async assignDocumentToProject(documentId, projectId) {
      return await adapter.assignDocumentToProject(documentId, projectId);
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
      const supabaseAdapter = new SupabaseAdapterOptimized();
      supabaseAdapter.userId = session.user.id; // Set userId directly

      // Try to initialize (SupabaseAdapterOptimized doesn't require init)
      try {
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

/**
 * Load documents with pagination support
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page index (0-based)
 * @param {number} options.limit - Items per page (default: 50)
 * @param {string} options.orderBy - Column to sort by (default: 'updated_at')
 * @param {boolean} options.ascending - Sort direction (default: false)
 * @returns {Promise<{documents, totalCount, page, pageSize, hasMore}>}
 */
export async function loadDocumentsPaginated(options = {}) {
  const storageAdapter = await init();

  // Check if adapter supports pagination (Supabase)
  if (storageAdapter.supabaseAdapter && storageAdapter.supabaseAdapter.loadAllDocuments) {
    const userId = storageAdapter.supabaseAdapter.userId;
    return storageAdapter.supabaseAdapter.loadAllDocuments(userId, options);
  }

  // Fallback for IndexedDB (no pagination support)
  const allDocs = await storageAdapter.loadEntries();
  const page = options.page || 0;
  const limit = options.limit || 50;
  const start = page * limit;
  const end = start + limit;

  return {
    documents: allDocs.slice(start, end),
    totalCount: allDocs.length,
    page,
    pageSize: limit,
    hasMore: end < allDocs.length
  };
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

/**
 * Search documents using full-text search (server-side)
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of documents with match_reason and match_score
 */
export async function searchDocuments(userId, query, options = {}) {
  const storageAdapter = await init();

  // If using Supabase adapter with searchDocuments support
  if (storageAdapter.supabaseAdapter && storageAdapter.supabaseAdapter.searchDocuments) {
    return await storageAdapter.supabaseAdapter.searchDocuments(userId, query, options);
  }

  // Fallback to client-side search for IndexedDB or older adapters
  const allEntries = await storageAdapter.loadEntries();
  const lowerQuery = query.toLowerCase();
  const filtered = allEntries.filter(entry =>
    entry.title?.toLowerCase().includes(lowerQuery) ||
    entry.content?.toLowerCase().includes(lowerQuery)
  );

  // Add mock match_reason and match_score for compatibility
  return filtered.map(doc => ({
    ...doc,
    match_reason: 'title',
    match_score: 1.0
  }));
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
  searchDocuments,
  getAdapter,
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
  },
  // Project management methods
  async getProjects() {
    if (!adapter) await init();
    if (!adapter.getProjects) {
      console.warn('Projects not supported with current storage adapter');
      return [];
    }
    return await adapter.getProjects();
  },
  async createProject(projectData) {
    if (!adapter) await init();
    if (!adapter.createProject) {
      throw new Error('Projects not supported with current storage adapter');
    }
    return await adapter.createProject(projectData);
  },
  async updateProject(projectId, updates) {
    if (!adapter) await init();
    if (!adapter.updateProject) {
      throw new Error('Projects not supported with current storage adapter');
    }
    return await adapter.updateProject(projectId, updates);
  },
  async deleteProject(projectId) {
    if (!adapter) await init();
    if (!adapter.deleteProject) {
      throw new Error('Projects not supported with current storage adapter');
    }
    return await adapter.deleteProject(projectId);
  },
  async assignDocumentToProject(documentId, projectId) {
    if (!adapter) await init();
    if (!adapter.assignDocumentToProject) {
      throw new Error('Projects not supported with current storage adapter');
    }
    return await adapter.assignDocumentToProject(documentId, projectId);
  },
  async updateDocument(documentId, updates) {
    if (!adapter) await init();
    
    // If only updating project_id, use the optimized method
    if (updates.project_id !== undefined && Object.keys(updates).length === 1) {
      return await storageWrapper.assignDocumentToProject(documentId, updates.project_id);
    }
    
    // If adapter has direct updateDocument method, use it
    if (adapter.supabaseAdapter && adapter.supabaseAdapter.updateDocument) {
      return await adapter.supabaseAdapter.updateDocument(documentId, updates);
    }
    
    // Otherwise, load the document, update it, and save
    const docs = await adapter.loadEntries();
    const doc = docs.find(d => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    const updatedDoc = { ...doc, ...updates, updatedAt: new Date().toISOString() };
    return await storageWrapper.saveDocument(updatedDoc);
  },
  
  // Folder management methods
  async getFolderTree() {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      console.warn('Folders not supported with current storage adapter');
      return [];
    }
    
    const { data, error } = await supabase.rpc('get_folder_tree', {
      p_user_id: adapter.supabaseAdapter.userId
    });
    
    if (error) throw error;
    return data || [];
  },
  
  async createFolder(folderData) {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      throw new Error('Folders not supported with current storage adapter');
    }
    
    // Ensure parent_id is explicitly null (not undefined) for root folders
    const folderToCreate = {
      user_id: adapter.supabaseAdapter.userId,
      name: folderData.name || 'New Folder',
      parent_id: folderData.parent_id === undefined ? null : folderData.parent_id,
      color: folderData.color || '#6B7280',
      icon: folderData.icon || 'folder',
      position: folderData.position || 0
    };
    
    const { data, error } = await supabase
      .from('folders')
      .insert([folderToCreate])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async updateFolder(folderId, updates) {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      throw new Error('Folders not supported with current storage adapter');
    }
    
    const { data, error } = await supabase
      .from('folders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', folderId)
      .eq('user_id', adapter.supabaseAdapter.userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  async deleteFolder(folderId) {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      throw new Error('Folders not supported with current storage adapter');
    }
    
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)
      .eq('user_id', adapter.supabaseAdapter.userId);
    
    if (error) throw error;
    return true;
  },
  
  async moveFolder(folderId, newParentId, newPosition) {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      throw new Error('Folders not supported with current storage adapter');
    }
    
    const { data, error } = await supabase.rpc('move_folder', {
      p_folder_id: folderId,
      p_new_parent_id: newParentId,
      p_new_position: newPosition
    });
    
    if (error) throw error;
    return data;
  },
  
  async getDocumentsInFolder(folderId, recursive = false) {
    if (!adapter) await init();
    if (!adapter.supabaseAdapter) {
      throw new Error('Folders not supported with current storage adapter');
    }
    
    const { data, error } = await supabase.rpc('get_documents_in_folder', {
      p_folder_id: folderId,
      p_recursive: recursive
    });
    
    if (error) throw error;
    return data || [];
  },
  
  async createDocument(documentData) {
    if (!adapter) await init();
    
    const newDoc = {
      id: crypto.randomUUID(),
      title: documentData.title || 'Untitled',
      preview: '',
      tags: documentData.tags || [],
      folder_id: documentData.folder_id || null,
      position: documentData.position || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (adapter.supabaseAdapter) {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          id: newDoc.id,
          title: newDoc.title,
          tags: newDoc.tags,
          folder_id: newDoc.folder_id,
          position: newDoc.position,
          created_at: newDoc.createdAt,
          updated_at: newDoc.updatedAt,
          user_id: adapter.supabaseAdapter.userId,
          metadata: {
            preview: ''
          }
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
    
    // Fallback for IndexedDB
    await storageWrapper.saveDocument(newDoc);
    return newDoc;
  },
  
  async getDocument(documentId) {
    if (!adapter) await init();
    
    if (adapter.getDocument) {
      return await adapter.getDocument(documentId);
    }
    
    // Fallback: find in all documents
    const docs = await adapter.loadEntries();
    const doc = docs.find(d => d.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found`);
    }
    return doc;
  },
  
  async getBlocks(documentId) {
    if (!adapter) await init();
    
    if (adapter.supabaseAdapter && adapter.supabaseAdapter.getBlocks) {
      return await adapter.supabaseAdapter.getBlocks(documentId);
    }
    
    // Fallback for IndexedDB - blocks are stored within documents
    const doc = await storageWrapper.getDocument(documentId);
    return doc.blocks || [];
  },
  
  async duplicateDocument(documentId, targetFolderId) {
    if (!adapter) await init();
    
    const originalDoc = await storageWrapper.getDocument(documentId);
    const blocks = await storageWrapper.getBlocks(documentId);
    
    const newDoc = await storageWrapper.createDocument({
      title: `${originalDoc.title} (Copy)`,
      tags: originalDoc.tags,
      folder_id: targetFolderId || originalDoc.folder_id
    });
    
    // Copy blocks if using Supabase
    if (adapter.supabaseAdapter && blocks.length > 0) {
      const newBlocks = blocks.map(block => ({
        ...block,
        id: crypto.randomUUID(),
        document_id: newDoc.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('blocks')
        .insert(newBlocks);
      
      if (error) throw error;
    }
    
    return newDoc;
  },
  
  async deleteDocument(documentId) {
    return await deleteEntry(documentId);
  },
  
  async getDocuments(limit = 1000, offset = 0) {
    if (!adapter) await init();
    
    if (adapter.supabaseAdapter) {
      // Use the optimized getDocuments method
      return await adapter.supabaseAdapter.getDocuments(limit, offset);
    }
    
    // Fallback for IndexedDB
    const allDocs = await adapter.loadEntries();
    return allDocs.slice(offset, offset + limit);
  }
};

// Auth state changes are now handled centrally in AuthContext
// Storage reset is triggered via event bus when needed

// Default export for backward compatibility
export default storageWrapper;