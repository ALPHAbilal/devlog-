import { useState, useEffect, useCallback, useRef } from 'react';
import IndexedDBAdapter from '../utils/storage/IndexedDBAdapter';

/**
 * Hook for managing IndexedDB as a fast cache layer
 * Provides instant document access while background syncing with Supabase
 *
 * Performance: ~5-20ms reads vs 200-500ms Supabase
 * Purpose: Preserve document content across navigation events
 */
export function useIndexedDBCache() {
  const [cachedDocuments, setCachedDocuments] = useState([]);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState({}); // { docId: 'synced' | 'pending' | 'conflict' }
  const syncInProgress = useRef(false);

  // Load documents from IndexedDB on mount (FAST - ~5-20ms)
  const loadFromCache = useCallback(async () => {
    const startTime = performance.now();
    try {
      await IndexedDBAdapter.init();
      const docs = await IndexedDBAdapter.getAllDocuments();
      const loadTime = Math.round(performance.now() - startTime);
      console.log('[CACHE-LOAD]', {
        docCount: docs?.length || 0,
        loadTime_ms: loadTime,
        docIds: docs?.slice(0, 5).map(d => d.id?.substring(0, 8))
      });
      setCachedDocuments(docs || []);
      setIsCacheLoaded(true);
      return docs || [];
    } catch (error) {
      console.error('[IndexedDBCache] Failed to load from cache:', error);
      setIsCacheLoaded(true); // Mark as loaded even on error to prevent blocking
      return [];
    }
  }, []);

  // Update cache with fresh data from Supabase
  const updateCache = useCallback(async (freshDocuments) => {
    if (syncInProgress.current) {
      console.log('[IndexedDBCache] Sync already in progress, skipping');
      return;
    }
    syncInProgress.current = true;

    try {
      const startTime = performance.now();

      // Compare with cached documents for conflict detection
      const conflicts = [];
      for (const fresh of freshDocuments) {
        const cached = cachedDocuments.find(d => d.id === fresh.id);

        if (cached && cached.metadata?.syncStatus === 'pending') {
          // Local has unsaved changes
          const localTime = new Date(cached.updated_at || cached.updatedAt || 0);
          const serverTime = new Date(fresh.updated_at || fresh.updatedAt || 0);

          if (serverTime > localTime) {
            conflicts.push({ local: cached, server: fresh });
          }
        }
      }

      if (conflicts.length > 0) {
        console.warn('[IndexedDBCache] Conflicts detected:', conflicts.length);
        // For now: Server wins (future: could show conflict UI)
      }

      // Save all documents to IndexedDB
      await IndexedDBAdapter.saveAllDocuments(freshDocuments);
      setCachedDocuments(freshDocuments);
      setLastSyncTime(Date.now());

      // Update sync status for all documents
      const newSyncStatus = {};
      freshDocuments.forEach(doc => {
        newSyncStatus[doc.id] = 'synced';
      });
      setSyncStatus(newSyncStatus);

      const syncTime = Math.round(performance.now() - startTime);
      console.log(`[IndexedDBCache] Cache updated with ${freshDocuments.length} documents in ${syncTime}ms`);
    } catch (error) {
      console.error('[IndexedDBCache] Failed to update cache:', error);
    } finally {
      syncInProgress.current = false;
    }
  }, [cachedDocuments]);

  // Update single document in cache
  const updateDocumentInCache = useCallback(async (document, fromSupabase = false) => {
    try {
      console.log('[CACHE-ADD]', { id: document.id?.substring(0, 8), title: document.title, fromSupabase });
      await IndexedDBAdapter.saveDocument(document);
      setCachedDocuments(prev => {
        const exists = prev.some(d => d.id === document.id);
        if (exists) {
          return prev.map(d => d.id === document.id ? document : d);
        }
        return [document, ...prev];
      });

      // Update sync status
      setSyncStatus(prev => ({
        ...prev,
        [document.id]: fromSupabase ? 'synced' : 'pending'
      }));

      console.log(`[IndexedDBCache] Document ${document.id?.substring(0, 8)} ${fromSupabase ? 'synced from server' : 'saved locally'}`);
    } catch (error) {
      console.error('[IndexedDBCache] Failed to update document:', error);
    }
  }, []);

  // Remove document from cache
  const removeFromCache = useCallback(async (documentId) => {
    try {
      await IndexedDBAdapter.deleteDocument(documentId);
      setCachedDocuments(prev => prev.filter(d => d.id !== documentId));

      // Remove from sync status
      setSyncStatus(prev => {
        const { [documentId]: removed, ...rest } = prev;
        return rest;
      });

      console.log(`[IndexedDBCache] Document ${documentId} removed from cache`);
    } catch (error) {
      console.error('[IndexedDBCache] Failed to remove document:', error);
    }
  }, []);

  // Get single document by ID (instant - from state)
  const getDocument = useCallback((documentId) => {
    const found = cachedDocuments.find(d => d.id === documentId);
    console.log('[CACHE-GET]', {
      lookingFor: documentId?.substring(0, 8),
      cacheSize: cachedDocuments.length,
      found: !!found,
      cachedIds: cachedDocuments.slice(0, 5).map(d => d.id?.substring(0, 8))
    });
    return found || null;
  }, [cachedDocuments]);

  // Get sync status for a document
  const getDocumentSyncStatus = useCallback((documentId) => {
    return syncStatus[documentId] || 'unknown';
  }, [syncStatus]);

  // Check if any documents have pending changes
  const hasPendingChanges = useCallback(() => {
    return Object.values(syncStatus).some(status => status === 'pending');
  }, [syncStatus]);

  return {
    cachedDocuments,
    isCacheLoaded,
    lastSyncTime,
    syncStatus,
    loadFromCache,
    updateCache,
    updateDocumentInCache,
    removeFromCache,
    getDocument,
    getDocumentSyncStatus,
    hasPendingChanges
  };
}

export default useIndexedDBCache;
