import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, ensureAuthenticated } from '@/shared/api';
import { useAuth } from '@/app/providers';
import { useToast } from './useToast';

// Cache folders across component unmounts
let foldersCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 30000; // 30 seconds

export function useFolders() {
  const [folders, setFolders] = useState(foldersCache || []);
  const [loading, setLoading] = useState(!foldersCache);
  const { user } = useAuth();
  const toast = useToast();
  const isMounted = useRef(true);
  const lastAuthErrorRef = useRef(null);
  const authRetryCountRef = useRef(0);

  // Load folders
  const loadFolders = useCallback(async (forceRefresh = false) => {
    // Early return if no user
    if (!user?.id) {
      setFolders([]);
      setLoading(false);
      foldersCache = null;
      lastFetchTime = null;
      return;
    }

    // Use cache if available and fresh
    if (!forceRefresh && foldersCache && lastFetchTime && 
        (Date.now() - lastFetchTime < CACHE_DURATION)) {
      setFolders(foldersCache);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Skip the ensureAuthenticated call if we already have a user
      // The RLS policies will handle authentication at the database level
      // This prevents the rate limiting issue
      console.log('Loading folders for user:', user.id);
      
      // Load folders with document counts for better performance insight
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          document_count:documents(count)
        `)
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) {
        console.error('Folders query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        
        // Handle 401 specifically - retry once with session refresh
        if (error.status === 401 || error.code === 'PGRST301') {
          console.log('Auth error on folders query, attempting session refresh...');
          
          // Try to refresh the session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Retry the query once
            const { data: retryData, error: retryError } = await supabase
              .from('folders')
              .select(`
                *,
                document_count:documents(count)
              `)
              .eq('user_id', user.id)
              .order('position', { ascending: true });
            
            if (!retryError) {
              data = retryData;
              error = null;
              console.log('Folders loaded successfully after session refresh');
            } else {
              console.error('Folders query failed after retry:', retryError);
              toast.error('Failed to load folders. Please refresh the page.');
              throw retryError;
            }
          } else {
            console.error('No session available for folders query');
            toast.error('Please sign in to access your folders.');
            throw error;
          }
        } else {
          // Non-auth errors
          throw error;
        }
      }
      
      // Handle successful data
      const foldersData = data || [];

      // Build tree structure
      const folderMap = new Map();
      const rootFolders = [];

      // First pass: create all folder objects with document count
      foldersData.forEach(folder => {
        // Extract document count from the aggregate
        const docCount = folder.document_count?.[0]?.count || 0;
        
        folderMap.set(folder.id, {
          ...folder,
          documentCount: docCount,
          children: []
        });
      });

      // Second pass: build hierarchy
      foldersData.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(folderMap.get(folder.id));
          }
        } else {
          rootFolders.push(folderMap.get(folder.id));
        }
      });
      
      console.log(`Loaded ${foldersData.length} folders (${rootFolders.length} root folders)`);

      // Update cache
      foldersCache = rootFolders;
      lastFetchTime = Date.now();
      
      if (isMounted.current) {
        setFolders(rootFolders);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      
      // Don't clear cache on error - keep using stale data if available
      if (foldersCache) {
        console.log('Using cached folders after error');
        setFolders(foldersCache);
      } else {
        setFolders([]);
        toast.error('Failed to load folders');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user?.id, toast]);

  // Create folder
  const createFolder = useCallback(async (name, parentId = null) => {
    if (!user?.id) {
      console.error('[useFolders] Cannot create folder - no authenticated user');
      toast.error('You must be signed in to create folders');
      return null;
    }

    try {
      // Get parent path if exists
      let path = name;
      if (parentId) {
        const { data, error } = await supabase
          .from('folders')
          .select('path')
          .eq('id', parentId)
          .single();

        if (error) {
          console.error('Failed to fetch parent folder:', error);
          toast.error('Parent folder not found');
          return null;
        }

        if (data) {
          path = `${data.path}/${name}`;
        }
      }

      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: user.id,
          name,
          parent_id: parentId,
          path,
          position: 0
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      const optimisticFolder = { ...data, children: [] };
      let updatedFolders;
      if (parentId) {
        // Add to parent's children
        const updateParent = (folders) => {
          return folders.map(folder => {
            if (folder.id === parentId) {
              return { ...folder, children: [...(folder.children || []), optimisticFolder] };
            }
            if (folder.children) {
              return { ...folder, children: updateParent(folder.children) };
            }
            return folder;
          });
        };
        setFolders(prev => {
          updatedFolders = updateParent(prev);
          return updatedFolders;
        });
      } else {
        setFolders(prev => {
          updatedFolders = [...prev, optimisticFolder];
          return updatedFolders;
        });
      }

      // Update cache with the actual new value
      foldersCache = updatedFolders;

      toast.success('Folder created');

      // DON'T refresh immediately - let optimistic update stand
      // The next natural refresh will sync with database
      // loadFolders(true); // REMOVED: Was overwriting optimistic update
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      
      // Handle specific database constraint errors
      if (error.code === '23505' || error.message?.includes('unique_folder_name_per_parent')) {
        toast.error('A folder with this name already exists at this level');
      } else {
        toast.error('Failed to create folder');
      }
      return null;
    }
  }, [user?.id, loadFolders, toast]);

  // Update folder
  const updateFolder = useCallback(async (folderId, updates) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistic update
      const updateFolderInTree = (folders) => {
        return folders.map(folder => {
          if (folder.id === folderId) {
            return { ...folder, ...updates };
          }
          if (folder.children) {
            return { ...folder, children: updateFolderInTree(folder.children) };
          }
          return folder;
        });
      };

      let updatedFolders;
      setFolders(prev => {
        updatedFolders = updateFolderInTree(prev);
        return updatedFolders;
      });
      foldersCache = updatedFolders;

      toast.success('Folder updated');

      // DON'T refresh immediately - let optimistic update stand
      // loadFolders(true); // REMOVED: Was overwriting optimistic update
    } catch (error) {
      console.error('Error updating folder:', error);
      
      // Handle specific database constraint errors
      if (error.code === '23505' || error.message?.includes('unique_folder_name_per_parent')) {
        toast.error('A folder with this name already exists at this level');
        throw error; // Re-throw so ProjectExplorer can handle it
      } else {
        toast.error('Failed to update folder');
      }
    }
  }, [user?.id, loadFolders, toast]);

  // Delete folder
  const deleteFolder = useCallback(async (folderId) => {
    try {
      // Check if folder has children
      const { data: children } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId);

      if (children && children.length > 0) {
        toast.error('Cannot delete folder with subfolders');
        return false;
      }

      // Check if folder has documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id')
        .eq('folder_id', folderId);

      if (documents && documents.length > 0) {
        toast.error('Cannot delete folder with documents');
        return false;
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Optimistic update
      const removeFolderFromTree = (folders) => {
        return folders.filter(folder => folder.id !== folderId)
          .map(folder => {
            if (folder.children) {
              return { ...folder, children: removeFolderFromTree(folder.children) };
            }
            return folder;
          });
      };

      let updatedFolders;
      setFolders(prev => {
        updatedFolders = removeFolderFromTree(prev);
        return updatedFolders;
      });
      foldersCache = updatedFolders;

      toast.success('Folder deleted');

      // DON'T refresh immediately - let optimistic update stand
      // loadFolders(true); // REMOVED: Was overwriting optimistic update
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
      return false;
    }
  }, [user?.id, loadFolders, toast]);

  // Move folder
  const moveFolder = useCallback(async (folderId, newParentId) => {
    try {
      // Prevent moving to self or descendants
      if (folderId === newParentId) {
        toast.error('Cannot move folder to itself');
        return false;
      }

      // TODO: Check for circular references

      const { error } = await supabase
        .from('folders')
        .update({
          parent_id: newParentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Folder moved');
      
      // Force refresh for move operations
      await loadFolders(true);
      return true;
    } catch (error) {
      console.error('Error moving folder:', error);
      toast.error('Failed to move folder');
      return false;
    }
  }, [user?.id, loadFolders, toast]);

  // Move document to folder
  const moveDocumentToFolder = useCallback(async (documentId, folderId) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          folder_id: folderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Document moved');
      return true;
    } catch (error) {
      console.error('Error moving document:', error);
      toast.error('Failed to move document');
      return false;
    }
  }, [user?.id, toast]);

  // Load folders when user is available
  useEffect(() => {
    isMounted.current = true;
    
    // Only load folders if user exists
    if (user?.id) {
      loadFolders();
    } else {
      // Clear folders when no user
      setFolders([]);
      setLoading(false);
      foldersCache = null;
      lastFetchTime = null;
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [user?.id]); // Only depend on user.id, not loadFolders

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    moveDocumentToFolder,
    refreshFolders: loadFolders
  };
}