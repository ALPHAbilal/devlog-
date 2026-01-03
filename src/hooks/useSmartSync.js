/**
 * React hook for Smart Sync integration
 * Provides a simple interface to the Smart Sync Manager
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/shared/api';
import { createSmartSync } from '../utils/smartSync';

export function useSmartSync(documentId) {
  const syncManagerRef = useRef(null);
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    syncing: false,
    lastSync: Date.now(),
    online: navigator.onLine
  });

  // Initialize sync manager
  useEffect(() => {
    if (!supabase || !documentId) return;

    console.log(`Initializing SmartSync for document: ${documentId}`);
    
    // Create sync manager instance
    const syncManager = createSmartSync(supabase, documentId);
    syncManagerRef.current = syncManager;

    // Update status periodically
    const statusInterval = setInterval(() => {
      if (syncManagerRef.current) {
        setSyncStatus(syncManagerRef.current.getSyncStatus());
      }
    }, 1000);

    // Load any existing snapshot for quick initialization
    syncManager.loadLatestSnapshot().then(snapshot => {
      if (snapshot) {
        console.log('SmartSync: Loaded snapshot for quick init');
        // You can dispatch this to your state management here
        // dispatch({ type: 'LOAD_SNAPSHOT', payload: snapshot });
      }
    });

    // Cleanup
    return () => {
      clearInterval(statusInterval);
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy();
        syncManagerRef.current = null;
      }
    };
  }, [supabase, documentId]);

  // Update block content
  const updateBlock = useCallback(async (blockId, content) => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      // Handle the change through smart sync
      const change = await syncManagerRef.current.handleChange(
        blockId,
        content,
        'UPDATE'
      );

      // Update status
      setSyncStatus(syncManagerRef.current.getSyncStatus());

      return change;
    } catch (error) {
      console.error('SmartSync: Error updating block:', error);
      throw error;
    }
  }, []);

  // Create new block
  const createBlock = useCallback(async (blockId, content) => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      const change = await syncManagerRef.current.handleChange(
        blockId,
        content,
        'CREATE'
      );

      setSyncStatus(syncManagerRef.current.getSyncStatus());
      return change;
    } catch (error) {
      console.error('SmartSync: Error creating block:', error);
      throw error;
    }
  }, []);

  // Delete block
  const deleteBlock = useCallback(async (blockId) => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      const change = await syncManagerRef.current.handleChange(
        blockId,
        null,
        'DELETE'
      );

      setSyncStatus(syncManagerRef.current.getSyncStatus());
      return change;
    } catch (error) {
      console.error('SmartSync: Error deleting block:', error);
      throw error;
    }
  }, []);

  // Reorder blocks
  const reorderBlock = useCallback(async (blockId, position) => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      const change = await syncManagerRef.current.handleChange(
        blockId,
        position,
        'REORDER'
      );

      setSyncStatus(syncManagerRef.current.getSyncStatus());
      return change;
    } catch (error) {
      console.error('SmartSync: Error reordering block:', error);
      throw error;
    }
  }, []);

  // Force immediate sync (user-triggered)
  const forceSync = useCallback(async () => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      await syncManagerRef.current.forceSync();
      setSyncStatus(syncManagerRef.current.getSyncStatus());
    } catch (error) {
      console.error('SmartSync: Error forcing sync:', error);
      throw error;
    }
  }, []);

  // Create snapshot for recovery
  const createSnapshot = useCallback(async (blocks) => {
    if (!syncManagerRef.current) {
      console.error('SmartSync: Manager not initialized');
      return;
    }

    try {
      await syncManagerRef.current.createSnapshot(blocks);
      console.log('SmartSync: Snapshot created');
    } catch (error) {
      console.error('SmartSync: Error creating snapshot:', error);
    }
  }, []);

  return {
    // Actions
    updateBlock,
    createBlock,
    deleteBlock,
    reorderBlock,
    forceSync,
    createSnapshot,
    
    // Status
    syncStatus,
    
    // Computed properties
    hasUnsavedChanges: syncStatus.pending > 0,
    isSyncing: syncStatus.syncing,
    isOnline: syncStatus.online
  };
}

// Export a provider component for global access
export function SmartSyncProvider({ children, documentId }) {
  const smartSync = useSmartSync(documentId);
  
  // You can wrap this in a context if needed for global access
  return children;
}