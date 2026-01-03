import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { eventBus, EVENT_TYPES } from '@/shared/lib';
import { useSmartDatabaseUsage } from '@/features/storage';

/**
 * Realtime Connection Indicator
 * Shows connection status and recent sync activity
 */
export default function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(false);
  const [syncActivity, setSyncActivity] = useState(null);
  const [recentChanges, setRecentChanges] = useState([]);
  const { refresh: refreshUsage } = useSmartDatabaseUsage();

  useEffect(() => {
    // Subscribe to realtime connection events
    const unsubConnect = eventBus.on(EVENT_TYPES.REALTIME_CONNECTED, () => {
      setIsConnected(true);
      addActivity('Connected to realtime');
    });

    const unsubDisconnect = eventBus.on(EVENT_TYPES.REALTIME_DISCONNECTED, () => {
      setIsConnected(false);
      addActivity('Disconnected from realtime');
    });

    // Subscribe to sync events
    const unsubSyncStart = eventBus.on(EVENT_TYPES.SYNC_STARTED, (data) => {
      setSyncActivity({ type: 'syncing', data });
    });

    const unsubSyncComplete = eventBus.on(EVENT_TYPES.SYNC_COMPLETED, (data) => {
      setSyncActivity({ type: 'synced', data });
      setTimeout(() => setSyncActivity(null), 2000);
    });

    const unsubSyncFailed = eventBus.on(EVENT_TYPES.SYNC_FAILED, (data) => {
      setSyncActivity({ type: 'failed', data });
      addActivity(`Sync failed: ${data.error?.message || 'Unknown error'}`);
    });

    // Subscribe to data change events
    const unsubDocCreated = eventBus.on(EVENT_TYPES.DOCUMENT_CREATED, (doc) => {
      addActivity(`Document created: ${doc.title}`);
      refreshUsage();
    });

    const unsubDocUpdated = eventBus.on(EVENT_TYPES.DOCUMENT_UPDATED, (data) => {
      addActivity(`Document updated: ${data.new?.title || data.old?.title}`);
    });

    const unsubDocDeleted = eventBus.on(EVENT_TYPES.DOCUMENT_DELETED, (doc) => {
      addActivity(`Document deleted: ${doc.title || 'Untitled'}`);
      refreshUsage();
    });

    const unsubBlockUpdated = eventBus.on(EVENT_TYPES.BLOCK_UPDATED, () => {
      addActivity('Block updated');
    });

    // Subscribe to database size changes
    const unsubDbSize = eventBus.on(EVENT_TYPES.DATABASE_SIZE_CHANGED, () => {
      addActivity('Database size changed');
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubSyncStart();
      unsubSyncComplete();
      unsubSyncFailed();
      unsubDocCreated();
      unsubDocUpdated();
      unsubDocDeleted();
      unsubBlockUpdated();
      unsubDbSize();
    };
  }, [refreshUsage]);

  const addActivity = (message) => {
    const activity = {
      id: Date.now(),
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setRecentChanges(prev => {
      const updated = [activity, ...prev].slice(0, 5);
      return updated;
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      setRecentChanges(prev => prev.filter(a => a.id !== activity.id));
    }, 10000);
  };

  return (
    <div className="realtime-indicator">
      <div className="connection-status">
        {isConnected ? (
          <Wifi size={16} className="status-icon connected" />
        ) : (
          <WifiOff size={16} className="status-icon disconnected" />
        )}
        <span className="status-text">
          {isConnected ? 'Connected' : 'Offline'}
        </span>
        {syncActivity && (
          <div className="sync-status">
            <RefreshCw 
              size={14} 
              className={`sync-icon ${syncActivity.type === 'syncing' ? 'spinning' : ''}`}
            />
            <span className="sync-text">
              {syncActivity.type === 'syncing' ? 'Syncing...' : 
               syncActivity.type === 'synced' ? 'Synced' : 'Failed'}
            </span>
          </div>
        )}
      </div>
      
      {recentChanges.length > 0 && (
        <div className="activity-feed">
          {recentChanges.map(activity => (
            <div key={activity.id} className="activity-item">
              <span className="activity-time">{activity.timestamp}</span>
              <span className="activity-message">{activity.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}