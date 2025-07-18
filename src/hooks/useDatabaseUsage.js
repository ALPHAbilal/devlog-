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
  const [dataBreakdown, setDataBreakdown] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUsage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get user-specific data size - pass user ID explicitly
        const { data: userData, error: userError } = await supabase.rpc('get_user_data_size', {
          p_user_id: user.id
        });
        
        if (!userError && userData && userData.length > 0) {
          const result = userData[0];
          setDatabaseSize(result.total_size_pretty || '0 bytes');
          
          // Set data breakdown for the Settings page
          setDataBreakdown({
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
          });
          
          // Also get the total database size for accurate percentage
          const { data: dbSizeData } = await supabase.rpc('get_database_size');
          let totalDbSizeBytes = result.total_size_bytes || 0;
          
          if (dbSizeData && dbSizeData.length > 0) {
            // Use the larger of user data or total database size
            totalDbSizeBytes = Math.max(totalDbSizeBytes, dbSizeData[0].size_bytes || 0);
            // Update display to show total database size if it's larger
            if (dbSizeData[0].size_bytes > result.total_size_bytes) {
              setDatabaseSize(dbSizeData[0].size_pretty || result.total_size_pretty);
            }
          }
          
          // Get the size in MB for percentage calculation
          const sizeInMB = totalDbSizeBytes / (1024 * 1024);
          
          // Try to detect user's plan
          const { data: authData } = await supabase.auth.getUser();
          
          // Default to Free plan limits
          let limit = 500; // MB
          
          // Check user's subscription tier from profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .single();
          
          if (profile?.subscription_tier === 'pro') {
            limit = 8192; // 8 GB in MB
          }
          
          setStorageLimit(limit >= 1024 ? `${(limit / 1024).toFixed(1)} GB` : `${limit} MB`);
          
          // Calculate percentage using the total database size
          const percentage = Math.round((sizeInMB / limit) * 100);
          setUsagePercentage(Math.min(percentage, 100)); // Cap at 100%
        } else {
          // Fallback to general database size
          const { data: sizeData, error: sizeError } = await supabase.rpc('get_database_size');
          
          if (!sizeError && sizeData && sizeData.length > 0) {
            setDatabaseSize(sizeData[0].size_pretty || '0 MB');
            
            // Calculate percentage from the database size
            const sizeInBytes = sizeData[0].size_bytes || 0;
            const sizeInMB = sizeInBytes / (1024 * 1024);
            
            // Default to Free plan limits
            let limit = 500; // MB
            setStorageLimit(`${limit} MB`);
            
            const percentage = Math.round((sizeInMB / limit) * 100);
            setUsagePercentage(Math.min(percentage, 100));
          } else {
            // Final fallback - estimate based on document count
            const { count } = await supabase
              .from('documents')
              .select('*', { count: 'exact', head: true });
            
            // Rough estimate: 100KB per document
            const estimatedSizeMB = ((count || 0) * 0.1).toFixed(2);
            setDatabaseSize(`~${estimatedSizeMB} MB`);
            setUsagePercentage(Math.round((parseFloat(estimatedSizeMB) / 500) * 100));
          }
        }
        
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
    error,
    dataBreakdown
  };
}