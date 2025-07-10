import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextOptimized';

export function useDatabaseUsage() {
  const { user } = useAuth();
  const [databaseSize, setDatabaseSize] = useState('0 MB');
  const [storageLimit, setStorageLimit] = useState('500 MB');
  const [usagePercentage, setUsagePercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUsage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get database size
        const { data: sizeData, error: sizeError } = await supabase.rpc('get_database_size');
        
        if (sizeError) {
          // If the function doesn't exist, use a simpler query
          const { data: dbSize, error: dbError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true });
          
          if (dbError) throw dbError;
          
          // Estimate size based on document count (rough estimate)
          const estimatedSizeMB = ((dbSize || 0) * 0.1).toFixed(2);
          setDatabaseSize(`${estimatedSizeMB} MB`);
        } else {
          setDatabaseSize(sizeData || '0 MB');
        }

        // Try to detect user's plan
        // For now, we'll check if user has any payment methods to determine if they're on Pro
        const { data: userData } = await supabase.auth.getUser();
        
        // Default to Free plan limits
        let limit = 500; // MB
        
        // Check if user has custom metadata indicating plan
        if (userData?.user?.user_metadata?.plan === 'pro') {
          limit = 8192; // 8 GB in MB
        }
        
        setStorageLimit(limit >= 1024 ? `${(limit / 1024).toFixed(1)} GB` : `${limit} MB`);
        
        // Calculate percentage
        const sizeInMB = parseFloat(databaseSize) || 0;
        const percentage = Math.round((sizeInMB / limit) * 100);
        setUsagePercentage(percentage);
        
      } catch (err) {
        console.error('Error fetching database usage:', err);
        setError('Unable to fetch database usage');
        
        // Set defaults on error
        setDatabaseSize('-- MB');
        setStorageLimit('-- MB');
        setUsagePercentage(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsage();
    
    // Refresh every 30 seconds if the component is still mounted
    const interval = setInterval(fetchUsage, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return {
    databaseSize,
    storageLimit,
    usagePercentage,
    isLoading,
    error
  };
}