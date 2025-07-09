// React hook for using the storage adapter
import { useState, useEffect, useCallback } from 'react';
import storage from './IndexedDBAdapter';

export function useStorage() {
  const [isReady, setIsReady] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    // Initialize storage
    const initStorage = async () => {
      try {
        await storage.init();
        setIsReady(true);
        
        // Get initial storage info
        const info = await storage.getStorageEstimate();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        setIsReady(true); // Still mark as ready to use fallback
      }
    };

    initStorage();
  }, []);

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    const info = await storage.getStorageEstimate();
    setStorageInfo(info);
    return info;
  }, []);

  // Get all documents
  const getAllDocuments = useCallback(async () => {
    return await storage.getAllDocuments();
  }, []);

  // Save a single document
  const saveDocument = useCallback(async (document) => {
    const result = await storage.saveDocument(document);
    await updateStorageInfo(); // Update storage info after save
    return result;
  }, [updateStorageInfo]);

  // Save all documents
  const saveAllDocuments = useCallback(async (documents) => {
    const result = await storage.saveAllDocuments(documents);
    await updateStorageInfo(); // Update storage info after save
    return result;
  }, [updateStorageInfo]);

  // Delete a document
  const deleteDocument = useCallback(async (id) => {
    const result = await storage.deleteDocument(id);
    await updateStorageInfo(); // Update storage info after delete
    return result;
  }, [updateStorageInfo]);

  // Get settings
  const getSettings = useCallback(async (key = 'devlogSettings') => {
    return await storage.getSettings(key);
  }, []);

  // Save settings
  const saveSettings = useCallback(async (key = 'devlogSettings', value) => {
    if (typeof key === 'object' && value === undefined) {
      // Allow calling with just the value for default key
      value = key;
      key = 'devlogSettings';
    }
    return await storage.saveSettings(key, value);
  }, []);

  // Calculate storage percentage
  const getStoragePercentage = useCallback(() => {
    if (!storageInfo || !storageInfo.quota) return 0;
    return (storageInfo.usage / storageInfo.quota) * 100;
  }, [storageInfo]);

  // Format bytes to human readable
  const formatBytes = useCallback((bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  return {
    isReady,
    storageInfo,
    updateStorageInfo,
    getAllDocuments,
    saveDocument,
    saveAllDocuments,
    deleteDocument,
    getSettings,
    saveSettings,
    getStoragePercentage,
    formatBytes,
    // Direct access to storage instance for advanced usage
    storage
  };
}