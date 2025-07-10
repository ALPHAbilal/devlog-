import { useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { autoSaveManager } from '../utils/autoSaveManager';
import { globalAutoSaveManager } from '../utils/globalAutoSave';

/**
 * Hook to handle periodic auto-saves
 * This hook integrates with the autoSaveManager to periodically check
 * and save any documents with unsaved changes
 */
export function useAutoSave() {
  const { settings } = useSettings();

  useEffect(() => {
    // Use the global auto-save manager
    globalAutoSaveManager.updateInterval(settings.autoSaveInterval || 1);

    // Cleanup function
    return () => {
      // Don't stop on cleanup as it's global
    };
  }, [settings.autoSaveInterval]);

  // Return the global manager for consistency
  return {
    performAutoSave: () => globalAutoSaveManager.performAutoSave(),
    autoSaveManager: globalAutoSaveManager
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
      saveNow: (docId) => autoSave.autoSaveManager.saveNow(docId)
    };
    
    // Make it available globally in multiple ways to catch different references
    window.__devlog_performAutoSave = autoSave.performAutoSave;
    window.__devlog_autoSaveManager = autoSave.autoSaveManager;
    window.__devlog_autoSaveWrapper = autoSaveWrapper;
    
    // Also try to patch any existing objects that might be referenced
    if (window.Xt) {
      window.Xt.getUnsavedDocuments = () => autoSave.autoSaveManager.getUnsavedDocuments();
      window.Xt.performAutoSave = autoSave.performAutoSave;
    }
    
    return () => {
      delete window.__devlog_performAutoSave;
      delete window.__devlog_autoSaveManager;
      delete window.__devlog_autoSaveWrapper;
    };
  }, [autoSave]);
  
  return autoSave;
}