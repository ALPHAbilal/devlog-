import { useState, useEffect, useCallback, useRef } from 'react';
import multiLayerStorage from '../utils/storage/MultiLayerStorage';
import syncEngine from '../utils/storage/SyncEngine';
import eventBus, { EVENT_TYPES } from '../utils/eventBus';
import { useAuth } from '../contexts/AuthContextOptimized';

/**
 * Hook for using the multi-layer storage system
 * 
 * Features:
 * - Automatic initialization
 * - Real-time updates via events
 * - Performance metrics
 * - Sync status
 */
export function useMultiLayerStorage() {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const initPromise = useRef(null);

  // Initialize storage layers
  useEffect(() => {
    if (!initPromise.current && user) {
      initPromise.current = initializeStorage();
    }
    
    async function initializeStorage() {
      try {
        await multiLayerStorage.init(user.id, true);
        await syncEngine.init();
        setIsInitialized(true);
        
        // Initial status update
        updateStatus();
      } catch (error) {
        console.error('Failed to initialize multi-layer storage:', error);
      }
    }
  }, [user]);

  // Subscribe to events
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribers = [];

    // Sync status updates
    unsubscribers.push(
      eventBus.on(EVENT_TYPES.SYNC_STARTED, updateStatus),
      eventBus.on(EVENT_TYPES.SYNC_COMPLETED, updateStatus),
      eventBus.on(EVENT_TYPES.SYNC_FAILED, updateStatus)
    );

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      updateMetrics();
    }, 5000); // Every 5 seconds

    return () => {
      unsubscribers.forEach(unsub => unsub());
      clearInterval(metricsInterval);
    };
  }, [isInitialized]);

  const updateStatus = useCallback(() => {
    setSyncStatus(syncEngine.getStatus());
  }, []);

  const updateMetrics = useCallback(() => {
    setMetrics({
      storage: multiLayerStorage.getMetrics(),
      sync: syncEngine.getStatus().metrics
    });
  }, []);

  // Storage operations
  const getDocument = useCallback(async (documentId) => {
    if (!isInitialized) throw new Error('Storage not initialized');
    return multiLayerStorage.getDocument(documentId);
  }, [isInitialized]);

  const getDocuments = useCallback(async () => {
    if (!isInitialized) throw new Error('Storage not initialized');
    return multiLayerStorage.getDocuments();
  }, [isInitialized]);

  const saveDocument = useCallback(async (document, blocks) => {
    if (!isInitialized) throw new Error('Storage not initialized');
    return multiLayerStorage.saveDocument(document, blocks);
  }, [isInitialized]);

  const updateBlock = useCallback(async (documentId, blockId, updates) => {
    if (!isInitialized) throw new Error('Storage not initialized');
    return multiLayerStorage.updateBlock(documentId, blockId, updates);
  }, [isInitialized]);

  const deleteDocument = useCallback(async (documentId) => {
    if (!isInitialized) throw new Error('Storage not initialized');
    
    // Remove from all layers
    multiLayerStorage.memoryCache.delete(documentId);
    await multiLayerStorage.indexedDB.deleteDocument(documentId);
    
    if (multiLayerStorage.supabase) {
      await multiLayerStorage.supabase.deleteDocument(documentId);
    }
    
    eventBus.emit(EVENT_TYPES.DOCUMENT_DELETED, { id: documentId });
    eventBus.emit(EVENT_TYPES.DATABASE_SIZE_CHANGED);
  }, [isInitialized]);

  const forceSync = useCallback(async () => {
    if (!isInitialized) throw new Error('Storage not initialized');
    return syncEngine.forceSync();
  }, [isInitialized]);

  const clearCache = useCallback(async () => {
    if (!isInitialized) return;
    multiLayerStorage.memoryCache.clear();
    updateMetrics();
  }, [isInitialized, updateMetrics]);

  return {
    isInitialized,
    syncStatus,
    metrics,
    
    // Storage operations
    getDocument,
    getDocuments,
    saveDocument,
    updateBlock,
    deleteDocument,
    
    // Utility functions
    forceSync,
    clearCache,
    updateStatus,
    updateMetrics
  };
}