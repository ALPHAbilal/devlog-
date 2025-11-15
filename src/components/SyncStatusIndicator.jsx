import { useState, useEffect, useRef } from 'react';

/**
 * Isolated sync status indicator that subscribes directly to SmartSync
 * Updates without causing parent component re-renders
 *
 * This component solves the block flickering issue by extracting the
 * frequently-updating sync status state (updates every 1 second) into
 * its own component. This prevents the parent ExpandedViewEnhanced from
 * re-rendering every second, which was causing all visible blocks to flicker.
 */
export default function SyncStatusIndicator({ documentId, syncManagerRef }) {
  // Local state - isolated from parent
  const [syncStatus, setSyncStatus] = useState({
    pending: 0,
    syncing: false,
    online: navigator.onLine
  });

  const intervalRef = useRef(null);

  // Track if manager is ready - this state change will trigger effect re-run
  const [managerReady, setManagerReady] = useState(false);

  // Check if manager is ready
  useEffect(() => {
    if (syncManagerRef?.current) {
      console.log('[SYNC-STATUS-POLL] ✅ SmartSync manager ready');
      setManagerReady(true);
    } else {
      console.log('[SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...');
    }
  }, [syncManagerRef?.current]); // Watch the actual ref value

  useEffect(() => {
    if (!documentId || !managerReady || !syncManagerRef?.current) {
      console.log('[SYNC-STATUS-POLL] ⚠️ Not ready to start polling:', {
        hasDocumentId: !!documentId,
        managerReady,
        hasManagerRef: !!syncManagerRef?.current
      });
      return;
    }

    console.log('[SYNC-STATUS-POLL] ✅ Starting status polling for document:', documentId);

    // Poll sync status - updates only this component
    intervalRef.current = setInterval(() => {
      if (syncManagerRef.current) {
        const status = syncManagerRef.current.getSyncStatus();
        setSyncStatus(prevStatus => {
          // Only update if values actually changed
          if (!prevStatus ||
              prevStatus.pending !== status.pending ||
              prevStatus.syncing !== status.syncing ||
              prevStatus.online !== status.online) {
            console.log('[SYNC-STATUS-POLL] 🔄 Status changed, updating UI:', {
              from: prevStatus,
              to: status
            });
            return status;
          }
          console.log('[SYNC-STATUS-POLL] ➡️ Status unchanged:', status);
          return prevStatus;
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        console.log('[SYNC-STATUS-POLL] 🛑 Stopping status polling');
        clearInterval(intervalRef.current);
      }
    };
  }, [documentId, managerReady]); // Depend on managerReady state instead of ref

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-dark-secondary/30
                    transition-all duration-200">
      {!syncStatus.online ? (
        <span className="text-xs text-yellow-400 flex items-center gap-1
                         transition-opacity duration-200 animate-in fade-in">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Offline
        </span>
      ) : syncStatus.syncing ? (
        <span className="text-xs text-blue-400 flex items-center gap-1
                         transition-opacity duration-200 animate-in fade-in">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          Syncing
        </span>
      ) : syncStatus.pending > 0 ? (
        <span className="text-xs text-amber-400 flex items-center gap-1
                         transition-opacity duration-200 animate-in fade-in">
          <span className="w-2 h-2 bg-amber-400 rounded-full" />
          {syncStatus.pending} pending
        </span>
      ) : (
        <span className="text-xs text-green-400 flex items-center gap-1
                         transition-opacity duration-200 animate-in fade-in">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          Saved
        </span>
      )}
    </div>
  );
}
