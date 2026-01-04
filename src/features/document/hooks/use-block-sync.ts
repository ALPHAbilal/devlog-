/**
 * useBlockSync Hook
 *
 * Manages SmartSync integration for block persistence:
 * - SmartSync manager initialization
 * - Initial load tracking
 * - Force sync on unmount
 *
 * Part of Phase 5: Component Decomposition
 * Extracted from ExpandedViewEnhanced.jsx
 */

import { useEffect, useRef } from 'react';
import { getSmartSyncManager } from '@/features/block';

// SmartSyncManager type - using ReturnType to infer from function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SmartSyncManager = ReturnType<typeof getSmartSyncManager>;

// ============== Types ==============

export interface DocumentEntry {
  id: string | null;
  metadata?: {
    createdLocally?: boolean;
    [key: string]: unknown;
  };
  blocks?: unknown[];
  [key: string]: unknown;
}

export interface UseBlockSyncOptions {
  documentId: string | null;
  entry: DocumentEntry | null;
}

export interface UseBlockSyncReturn {
  // SmartSync manager ref
  smartSyncManagerRef: React.MutableRefObject<SmartSyncManager | null>;

  // Initial load tracking
  isInitialLoadRef: React.MutableRefObject<boolean>;
}

// ============== Hook Implementation ==============

export function useBlockSync({
  documentId,
  entry,
}: UseBlockSyncOptions): UseBlockSyncReturn {

  // Smart Sync manager reference (does NOT use state to avoid re-renders)
  // SyncStatusIndicator component handles status polling independently
  const smartSyncManagerRef = useRef<SmartSyncManager | null>(null);

  // Track initial load to prevent saves during load
  const isInitialLoadRef = useRef(true);

  // Initialize Smart Sync for this document
  // NOTE: Sync status polling moved to SyncStatusIndicator component
  // This prevents parent re-renders that caused block flickering
  useEffect(() => {
    // Guard against undefined entry or entry.id
    if (!documentId) {
      return;
    }

    // Get or create Smart Sync manager for this document
    const syncManager = getSmartSyncManager(documentId);
    smartSyncManagerRef.current = syncManager;
    console.log(`[MULTI-TAB] 📄 Document ${documentId.substring(0, 8)} opened in this tab`);

    // Load any snapshot for quick initialization
    if (syncManager) {
      syncManager.loadLatestSnapshot().then((snapshot: unknown) => {
        if (snapshot && isInitialLoadRef.current) {
          console.log('SmartSync: Loaded snapshot for quick init');
        }
      });
    }

    // CRITICAL: Force sync pending changes when component unmounts (tab switch, navigation, etc.)
    // Without this, the debounced sync (5s delay) never fires if user switches tabs quickly
    return () => {
      if (syncManager) {
        console.log(`[MULTI-TAB] 🚪 Document ${documentId.substring(0, 8)} unmounting - triggering force sync`);
        syncManager.forceSync().catch((error: Error) => {
          console.error('[MULTI-TAB] ❌ Force sync failed on unmount:', error);
        });
      }
    };
  }, [documentId]);

  // Mark initial load as complete after delay
  // Shorter delay for new documents, longer for existing ones
  useEffect(() => {
    if (!documentId) return;

    const isNewDocument = entry?.metadata?.createdLocally || entry?.blocks?.length === 0;
    const delay = isNewDocument ? 500 : 2000; // 0.5s for new docs, 2s for existing

    const timer = setTimeout(() => {
      console.log('ExpandedView: Initial load period complete, enabling saves');
      isInitialLoadRef.current = false;
    }, delay);

    return () => clearTimeout(timer);
  }, [documentId, entry?.metadata, entry?.blocks?.length]);

  return {
    smartSyncManagerRef,
    isInitialLoadRef,
  };
}
