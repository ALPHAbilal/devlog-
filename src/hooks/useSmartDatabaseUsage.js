import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextOptimized';
import eventBus, { EVENT_TYPES } from '../utils/eventBus';

// Cache for database size with 5-minute TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {
  data: null,
  timestamp: 0,
  
  get() {
    if (this.data && Date.now() - this.timestamp < CACHE_TTL) {
      return this.data;
    }
    return null;
  },
  
  set(data) {
    this.data = data;
    this.timestamp = Date.now();
  }
};

export function useSmartDatabaseUsage() {
  const { user } = useAuth();
  const [databaseSize, setDatabaseSize] = useState('0 MB');
  const [storageLimit, setStorageLimit] = useState('500 MB');
  const [usagePercentage, setUsagePercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataBreakdown, setDataBreakdown] = useState(null);
  
  // Track if this is the initial load
  const isInitialLoad = useRef(true);
  const isMounted = useRef(true);

  const fetchUsage = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Check cache first
    if (!forceRefresh && !isInitialLoad.current) {
      const cached = cache.get();
      if (cached) {
        setDatabaseSize(cached.databaseSize);
        setStorageLimit(cached.storageLimit);
        setUsagePercentage(cached.usagePercentage);
        setDataBreakdown(cached.dataBreakdown);
        return;
      }
    }
    
    // Only show loading on initial load, not on updates
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      // Get user-specific data size - pass user ID explicitly
      const { data: userData, error: userError } = await supabase.rpc('get_user_data_size', {
        p_user_id: user.id
      });
      
      if (!userError && userData && userData.length > 0) {
        const result = userData[0];
        
        // Also get the total database size for accurate percentage
        const { data: dbSizeData } = await supabase.rpc('get_database_size');
        let totalDbSizeBytes = result.total_size_bytes || 0;
        let displaySize = result.total_size_pretty || '0 bytes';
        
        if (dbSizeData && dbSizeData.length > 0) {
          // Use the larger of user data or total database size
          totalDbSizeBytes = Math.max(totalDbSizeBytes, dbSizeData[0].size_bytes || 0);
          // Update display to show total database size if it's larger
          if (dbSizeData[0].size_bytes > result.total_size_bytes) {
            displaySize = dbSizeData[0].size_pretty || result.total_size_pretty;
          }
        }
        
        // Get the size in MB for percentage calculation
        const sizeInMB = totalDbSizeBytes / (1024 * 1024);
        
        // Try to detect user's plan
        const { data: authData } = await supabase.auth.getUser();
        
        // Default to Free plan limits
        let limit = 500; // MB
        
        // Check if user has custom metadata indicating plan
        if (authData?.user?.user_metadata?.plan === 'pro') {
          limit = 8192; // 8 GB in MB
        }
        
        const limitDisplay = limit >= 1024 ? `${(limit / 1024).toFixed(1)} GB` : `${limit} MB`;
        
        // Calculate percentage using the total database size
        const percentage = Math.round((sizeInMB / limit) * 100);
        
        // Cache the results
        const cacheData = {
          databaseSize: displaySize,
          storageLimit: limitDisplay,
          usagePercentage: Math.min(percentage, 100),
          dataBreakdown: {
            documents: {
              count: result.documents_count,
              size: result.documents_size_bytes
            },
            blocks: {
              count: result.blocks_count,
              size: result.blocks_size_bytes
            },
            images: {
              count: result.images_count,
              size: result.images_size_bytes
            }
          }
        };
        
        cache.set(cacheData);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          // Use smooth updates to prevent flickering
          setDatabaseSize(cacheData.databaseSize);
          setStorageLimit(cacheData.storageLimit);
          setUsagePercentage(cacheData.usagePercentage);
          setDataBreakdown(cacheData.dataBreakdown);
        }
      } else {
        // Fallback to general database size
        const { data: sizeData, error: sizeError } = await supabase.rpc('get_database_size');
        
        if (!sizeError && sizeData && sizeData.length > 0 && isMounted.current) {
          const displaySize = sizeData[0].size_pretty || '0 MB';
          const sizeInBytes = sizeData[0].size_bytes || 0;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          
          const limit = 500; // MB
          const percentage = Math.round((sizeInMB / limit) * 100);
          
          setDatabaseSize(displaySize);
          setStorageLimit(`${limit} MB`);
          setUsagePercentage(Math.min(percentage, 100));
        }
      }
      
    } catch (err) {
      console.error('Error fetching database usage:', err);
      if (isMounted.current) {
        setError('Unable to fetch database usage');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchUsage();
    
    // Subscribe to database size change events
    const unsubscribeDbChange = eventBus.on(EVENT_TYPES.DATABASE_SIZE_CHANGED, () => {
      // Debounce database size changes
      if (cache.updateTimeout) {
        clearTimeout(cache.updateTimeout);
      }
      
      cache.updateTimeout = setTimeout(() => {
        console.log('Database size changed, refreshing...');
        fetchUsage(true);
      }, 1000); // Wait 1 second to batch multiple changes
    });
    
    // Subscribe to storage sync events
    const unsubscribeSync = eventBus.on(EVENT_TYPES.STORAGE_SYNCED, () => {
      fetchUsage(true);
    });
    
    // Set up storage event listener for cross-tab updates
    const handleStorageChange = (e) => {
      if (e.key === 'databaseUsageUpdate') {
        fetchUsage(true); // Force refresh on storage event
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up visibility change listener
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - cache.timestamp > CACHE_TTL) {
        fetchUsage(true); // Refresh if cache is stale and tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted.current = false;
      unsubscribeDbChange();
      unsubscribeSync();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (cache.updateTimeout) {
        clearTimeout(cache.updateTimeout);
      }
    };
  }, [user, fetchUsage]);
  
  // Provide a manual refresh function
  const refresh = useCallback(() => {
    return fetchUsage(true);
  }, [fetchUsage]);

  return {
    databaseSize,
    storageLimit,
    usagePercentage,
    isLoading,
    error,
    dataBreakdown,
    refresh
  };
}