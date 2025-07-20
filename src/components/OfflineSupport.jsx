import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../hooks/useResponsive';

/**
 * OfflineSupport Component
 * Provides offline indicators, sync status, and offline functionality
 */
export default function OfflineSupport({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { isMobile } = useResponsive();
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineToast(false);
      // Trigger sync when coming back online
      syncPendingData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineToast(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check for pending sync items
  useEffect(() => {
    const checkPendingSync = async () => {
      if ('sync' in self.registration) {
        const tags = await self.registration.sync.getTags();
        setPendingSync(tags.length);
      }
    };
    
    checkPendingSync();
    const interval = setInterval(checkPendingSync, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Sync pending data
  const syncPendingData = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      // Register background sync
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-data');
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, [isOnline]);
  
  // Manual sync trigger
  const handleManualSync = () => {
    if (isOnline) {
      syncPendingData();
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  };
  
  return (
    <>
      {children}
      
      {/* Offline Indicator Toast */}
      <AnimatePresence>
        {showOfflineToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 ${isMobile ? 'left-4 right-4' : 'left-1/2 -translate-x-1/2'} 
                       z-50 pointer-events-none`}
          >
            <div className="bg-dark-secondary border border-red-500/50 rounded-lg shadow-lg 
                            p-4 flex items-center gap-3">
              <WifiOff className="text-red-500" size={20} />
              <div className="flex-1">
                <p className="text-text-primary font-medium">You're offline</p>
                <p className="text-text-secondary text-sm">
                  Changes will sync when connection is restored
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Persistent Status Bar (Mobile) */}
      {isMobile && !isOnline && (
        <div className="fixed bottom-16 left-0 right-0 bg-dark-secondary/95 backdrop-blur-sm 
                        border-t border-dark-secondary z-40">
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="text-red-500" />
              <span className="text-sm text-text-secondary">Offline mode</span>
              {pendingSync > 0 && (
                <span className="text-xs bg-dark-primary px-2 py-0.5 rounded-full">
                  {pendingSync} pending
                </span>
              )}
            </div>
            <button
              onClick={handleManualSync}
              disabled={!isOnline}
              className="text-text-secondary p-1"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Offline Indicator Component
export function OfflineIndicator({ className = '' }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <WifiOff size={16} className="text-red-500" />
      <span className="text-text-secondary">Offline</span>
    </div>
  );
}

// Sync Status Component
export function SyncStatus({ 
  lastSync, 
  pendingChanges = 0, 
  onSync,
  className = '' 
}) {
  const [isOnline] = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };
  
  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff size={16} className="text-red-500" />;
    if (isSyncing) return <RefreshCw size={16} className="animate-spin text-accent-green" />;
    if (pendingChanges > 0) return <Cloud size={16} className="text-yellow-500" />;
    return <Cloud size={16} className="text-green-500" />;
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    if (lastSync) {
      const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
      if (minutes < 1) return 'Just synced';
      if (minutes < 60) return `${minutes}m ago`;
      return `${Math.floor(minutes / 60)}h ago`;
    }
    return 'Synced';
  };
  
  return (
    <button
      onClick={handleSync}
      disabled={!isOnline || isSyncing || pendingChanges === 0}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm 
                 bg-dark-secondary hover:bg-dark-secondary/80 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {getStatusIcon()}
      <span className="text-text-secondary">{getStatusText()}</span>
    </button>
  );
}

// Hook for online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return [isOnline, setIsOnline];
}

// Hook for offline queue management
export function useOfflineQueue(key = 'offline-queue') {
  const [queue, setQueue] = useState([]);
  const [isOnline] = useOnlineStatus();
  
  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem(key);
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue));
    }
  }, [key]);
  
  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(queue));
  }, [queue, key]);
  
  const addToQueue = useCallback((item) => {
    setQueue(prev => [...prev, { ...item, id: Date.now(), timestamp: new Date() }]);
  }, []);
  
  const removeFromQueue = useCallback((id) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  const processQueue = useCallback(async (processor) => {
    if (!isOnline || queue.length === 0) return;
    
    const results = [];
    for (const item of queue) {
      try {
        const result = await processor(item);
        results.push({ item, result, success: true });
        removeFromQueue(item.id);
      } catch (error) {
        results.push({ item, error, success: false });
      }
    }
    
    return results;
  }, [isOnline, queue, removeFromQueue]);
  
  return {
    queue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
    queueSize: queue.length,
  };
}

// Offline-ready data fetcher
export function useOfflineData(key, fetcher, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useOnlineStatus();
  const { cacheTime = 5 * 60 * 1000 } = options; // 5 minutes default
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cached = localStorage.getItem(`cache-${key}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < cacheTime || !isOnline) {
          setData(cachedData);
          setIsLoading(false);
          
          // If online and cache is stale, fetch in background
          if (isOnline && age >= cacheTime) {
            fetcher().then(freshData => {
              setData(freshData);
              localStorage.setItem(`cache-${key}`, JSON.stringify({
                data: freshData,
                timestamp: Date.now(),
              }));
            }).catch(() => {
              // Silently fail, we have cached data
            });
          }
          return;
        }
      }
      
      // Fetch fresh data if online
      if (isOnline) {
        try {
          const freshData = await fetcher();
          setData(freshData);
          
          // Cache the data
          localStorage.setItem(`cache-${key}`, JSON.stringify({
            data: freshData,
            timestamp: Date.now(),
          }));
        } catch (err) {
          setError(err);
          // Use cached data if available
          if (cached) {
            const { data: cachedData } = JSON.parse(cached);
            setData(cachedData);
          }
        }
      } else {
        setError(new Error('No cached data available offline'));
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [key, isOnline, cacheTime]);
  
  const refresh = useCallback(async () => {
    if (!isOnline) return;
    
    setIsLoading(true);
    try {
      const freshData = await fetcher();
      setData(freshData);
      localStorage.setItem(`cache-${key}`, JSON.stringify({
        data: freshData,
        timestamp: Date.now(),
      }));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [key, isOnline, fetcher]);
  
  return { data, error, isLoading, isOnline, refresh };
}

// Example Offline Page Component
export function OfflinePage() {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <WifiOff size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            You're Offline
          </h1>
          <p className="text-text-secondary">
            Some features may be limited while offline. Your changes will sync 
            automatically when you're back online.
          </p>
        </div>
        
        <div className="space-y-4 text-left bg-dark-secondary rounded-lg p-6">
          <h2 className="font-semibold text-text-primary mb-3">
            What you can do offline:
          </h2>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>View and edit cached documents</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Create new documents (will sync later)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Access recently viewed content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500 mt-0.5">!</span>
              <span>Search is limited to cached content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">✗</span>
              <span>Cannot access cloud-only features</span>
            </li>
          </ul>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-accent-green text-dark-primary rounded-lg 
                     hover:bg-accent-green/80 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}