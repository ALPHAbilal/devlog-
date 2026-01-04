/**
 * Auto-save hook using Smart Sync
 * Maintains backward compatibility while using the new Smart Sync system
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/app/providers';
import { createSmartSync } from '@/features/storage';
import { supabase } from '@/shared/api';

// Global reference for Smart Sync managers
const smartSyncManagers = new Map();

/**
 * Hook to handle auto-saves using Smart Sync
 * This hook maintains the same interface as before but uses Smart Sync internally
 */
export function useAutoSave() {
  const { settings } = useSettings();
  const managerRef = useRef(null);

  // Get or create a smart sync manager for the document
  const getSmartSyncManager = useCallback((documentId) => {
    if (!documentId) return null;
    
    if (!smartSyncManagers.has(documentId)) {
      const manager = createSmartSync(supabase, documentId);
      smartSyncManagers.set(documentId, manager);
    }
    
    return smartSyncManagers.get(documentId);
  }, []);

  // Clean up old managers periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Remove managers for documents that haven't been accessed in 30 minutes
      const now = Date.now();
      for (const [docId, manager] of smartSyncManagers.entries()) {
        if (manager.lastActivity && now - manager.lastActivity > 30 * 60 * 1000) {
          manager.destroy();
          smartSyncManagers.delete(docId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Create a compatibility wrapper that mimics the old autoSaveManager interface
  const autoSaveManager = {
    // Queue a save (now uses Smart Sync)
    queueSave: async (documentId, updates, saveFunction) => {
      const manager = getSmartSyncManager(documentId);
      if (!manager) return;
      
      // Extract blocks from updates if present
      if (updates.blocks) {
        for (const block of updates.blocks) {
          await manager.handleChange(block.id, block.content || block, 'UPDATE');
        }
      }
    },
    
    // Save immediately
    saveNow: async (documentId) => {
      const manager = getSmartSyncManager(documentId);
      if (manager) {
        await manager.forceSync();
      }
    },
    
    // Save all pending changes
    saveAll: async () => {
      const promises = [];
      for (const manager of smartSyncManagers.values()) {
        promises.push(manager.forceSync());
      }
      await Promise.allSettled(promises);
    },
    
    // Check for unsaved changes
    hasUnsavedChanges: () => {
      for (const manager of smartSyncManagers.values()) {
        const status = manager.getSyncStatus();
        if (status.pending > 0) return true;
      }
      return false;
    },
    
    // Get list of documents with unsaved changes
    getUnsavedDocuments: () => {
      const unsaved = [];
      for (const [docId, manager] of smartSyncManagers.entries()) {
        const status = manager.getSyncStatus();
        if (status.pending > 0) {
          unsaved.push(docId);
        }
      }
      return unsaved;
    },
    
    // New method: get sync status for a specific document
    getSyncStatus: (documentId) => {
      const manager = getSmartSyncManager(documentId);
      return manager ? manager.getSyncStatus() : null;
    },
    
    // Backward compatibility: recover from backup (uses Smart Sync snapshots)
    recoverFromBackup: async (documentId) => {
      const manager = getSmartSyncManager(documentId);
      if (manager) {
        const snapshot = await manager.loadLatestSnapshot();
        if (snapshot) {
          return {
            documentId,
            data: { blocks: snapshot },
            timestamp: Date.now()
          };
        }
      }
      return null;
    }
  };

  // Store reference for global access
  managerRef.current = autoSaveManager;

  // Return the same interface as before
  return {
    performAutoSave: async () => {
      await autoSaveManager.saveAll();
    },
    autoSaveManager
  };
}

// Global auto-save hook that can be used at the app level
export function useGlobalAutoSave() {
  const autoSave = useAutoSave();
  
  // Set up global reference for other parts of the app
  useEffect(() => {
    // Create a wrapper object that matches what the production build expects
    const autoSaveWrapper = {
      performAutoSave: autoSave.performAutoSave,
      getUnsavedDocuments: () => autoSave.autoSaveManager.getUnsavedDocuments(),
      hasUnsavedChanges: () => autoSave.autoSaveManager.hasUnsavedChanges(),
      saveAll: () => autoSave.autoSaveManager.saveAll(),
      queueSave: (docId, updates, saveFunc) => autoSave.autoSaveManager.queueSave(docId, updates, saveFunc),
      saveNow: (docId) => autoSave.autoSaveManager.saveNow(docId),
      getSyncStatus: (docId) => autoSave.autoSaveManager.getSyncStatus(docId)
    };
    
    // Make it available globally in multiple ways to catch different references
    window.__devlog_performAutoSave = autoSave.performAutoSave;
    window.__devlog_autoSaveManager = autoSave.autoSaveManager;
    window.__devlog_autoSaveWrapper = autoSaveWrapper;
    window.__smartSyncManagers = smartSyncManagers;
    
    // Also try to patch any existing objects that might be referenced
    if (window.Xt) {
      window.Xt.getUnsavedDocuments = () => autoSave.autoSaveManager.getUnsavedDocuments();
      window.Xt.performAutoSave = autoSave.performAutoSave;
    }
    
    // Compatibility with old global references
    if (typeof window.autoSaveManager === 'undefined') {
      window.autoSaveManager = autoSave.autoSaveManager;
    }
    
    return () => {
      delete window.__devlog_performAutoSave;
      delete window.__devlog_autoSaveManager;
      delete window.__devlog_autoSaveWrapper;
      delete window.__smartSyncManagers;
      if (window.autoSaveManager === autoSave.autoSaveManager) {
        delete window.autoSaveManager;
      }
    };
  }, [autoSave]);
  
  return autoSave;
}

// Export a function to get Smart Sync manager directly (for components that need it)
export function getSmartSyncManager(documentId) {
  if (!documentId) return null;
  
  if (!smartSyncManagers.has(documentId)) {
    const manager = createSmartSync(supabase, documentId);
    smartSyncManagers.set(documentId, manager);
  }
  
  return smartSyncManagers.get(documentId);
}