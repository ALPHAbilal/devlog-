/**
 * Batch Loading Hook for Folders and Documents
 * 
 * Features:
 * - Load entire folder tree with documents in one query
 * - Lazy loading for deep structures
 * - Intelligent caching
 * - Prefetching on hover
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/shared/api';
import { useAuth } from '@/app/providers';
import { useToast } from '@/shared/hooks';

// Cache management
const structureCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache
const PREFETCH_DELAY = 500; // 500ms hover delay for prefetch

/**
 * Load entire project structure efficiently
 */
export function useProjectStructure() {
  const [structure, setStructure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const prefetchTimers = useRef(new Map());

  /**
   * Build tree from flat structure
   */
  const buildTree = useCallback((folders, documents) => {
    const folderMap = new Map();
    const rootFolders = [];

    // Create folder objects with documents
    folders.forEach(folder => {
      const folderDocs = documents.filter(doc => doc.folder_id === folder.id);
      folderMap.set(folder.id, {
        ...folder,
        documents: folderDocs,
        documentCount: folderDocs.length,
        children: [],
        isLoaded: true
      });
    });

    // Build hierarchy
    folders.forEach(folder => {
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    // Add root documents (no folder)
    const rootDocuments = documents.filter(doc => !doc.folder_id);

    return {
      folders: rootFolders,
      rootDocuments,
      totalDocuments: documents.length,
      totalFolders: folders.length
    };
  }, []);

  /**
   * Load full structure in one efficient query
   */
  const loadFullStructure = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setStructure(null);
      return null;
    }

    // Check cache
    const cacheKey = `structure_${user.id}`;
    const cached = structureCache.get(cacheKey);
    
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log('Using cached project structure');
      setStructure(cached.data);
      return cached.data;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading full project structure...');

      // Load folders and documents in parallel for maximum efficiency
      const [foldersResponse, documentsResponse] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id)
          .order('position'),
        
        supabase
          .from('documents')
          .select('id, title, folder_id, created_at, updated_at, tags, is_favorite')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (foldersResponse.error) throw foldersResponse.error;
      if (documentsResponse.error) throw documentsResponse.error;

      const treeStructure = buildTree(
        foldersResponse.data || [],
        documentsResponse.data || []
      );

      // Update cache
      structureCache.set(cacheKey, {
        data: treeStructure,
        timestamp: Date.now()
      });

      setStructure(treeStructure);
      
      console.log(`Loaded ${treeStructure.totalFolders} folders and ${treeStructure.totalDocuments} documents`);
      
      return treeStructure;
    } catch (err) {
      console.error('Error loading project structure:', err);
      setError(err.message);
      toast.error('Failed to load project structure');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, buildTree, toast]);

  /**
   * Load specific folder contents (for lazy loading)
   */
  const loadFolderContents = useCallback(async (folderId) => {
    if (!user?.id || !folderId) return null;

    try {
      console.log(`Loading contents for folder ${folderId}...`);

      const [subFoldersResponse, documentsResponse] = await Promise.all([
        supabase
          .from('folders')
          .select('*')
          .eq('parent_id', folderId)
          .eq('user_id', user.id)
          .order('position'),
        
        supabase
          .from('documents')
          .select('id, title, folder_id, created_at, updated_at, tags')
          .eq('folder_id', folderId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (subFoldersResponse.error) throw subFoldersResponse.error;
      if (documentsResponse.error) throw documentsResponse.error;

      return {
        subFolders: subFoldersResponse.data || [],
        documents: documentsResponse.data || []
      };
    } catch (err) {
      console.error(`Error loading folder ${folderId} contents:`, err);
      return null;
    }
  }, [user?.id]);

  /**
   * Prefetch folder contents on hover
   */
  const prefetchFolder = useCallback(async (folderId) => {
    if (!folderId) return;

    // Clear existing timer for this folder
    const existingTimer = prefetchTimers.current.get(folderId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const cacheKey = `folder_${folderId}`;
      const cached = structureCache.get(cacheKey);
      
      // Only prefetch if not already cached
      if (!cached || (Date.now() - cached.timestamp > CACHE_TTL)) {
        console.log(`Prefetching folder ${folderId}...`);
        const contents = await loadFolderContents(folderId);
        
        if (contents) {
          structureCache.set(cacheKey, {
            data: contents,
            timestamp: Date.now()
          });
        }
      }
      
      prefetchTimers.current.delete(folderId);
    }, PREFETCH_DELAY);

    prefetchTimers.current.set(folderId, timer);
  }, [loadFolderContents]);

  /**
   * Cancel prefetch (on mouse leave)
   */
  const cancelPrefetch = useCallback((folderId) => {
    const timer = prefetchTimers.current.get(folderId);
    if (timer) {
      clearTimeout(timer);
      prefetchTimers.current.delete(folderId);
    }
  }, []);

  /**
   * Get cached folder contents
   */
  const getCachedFolder = useCallback((folderId) => {
    const cacheKey = `folder_${folderId}`;
    const cached = structureCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }
    
    return null;
  }, []);

  /**
   * Invalidate cache
   */
  const invalidateCache = useCallback(() => {
    structureCache.clear();
    console.log('Project structure cache invalidated');
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      prefetchTimers.current.forEach(timer => clearTimeout(timer));
      prefetchTimers.current.clear();
    };
  }, []);

  return {
    structure,
    loading,
    error,
    loadFullStructure,
    loadFolderContents,
    prefetchFolder,
    cancelPrefetch,
    getCachedFolder,
    invalidateCache,
    refresh: () => loadFullStructure(true)
  };
}

/**
 * Hook for paginated document loading
 */
export function usePaginatedDocuments(folderId = null) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const toast = useToast();

  const DOCS_PER_PAGE = 50;

  const loadDocuments = useCallback(async (pageNum = 0, append = false) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const from = pageNum * DOCS_PER_PAGE;
      const to = from + DOCS_PER_PAGE - 1;

      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .range(from, to)
        .order('created_at', { ascending: false });

      // Filter by folder if specified
      if (folderId !== null) {
        query = query.eq('folder_id', folderId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (append) {
        setDocuments(prev => [...prev, ...(data || [])]);
      } else {
        setDocuments(data || []);
      }

      setPage(pageNum);
      setHasMore((from + data.length) < count);
      
      console.log(`Loaded ${data.length} documents (page ${pageNum + 1})`);
    } catch (err) {
      console.error('Error loading documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [user?.id, folderId, toast]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadDocuments(page + 1, true);
    }
  }, [loading, hasMore, page, loadDocuments]);

  const refresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    loadDocuments(0, false);
  }, [loadDocuments]);

  // Load initial page on mount
  useEffect(() => {
    loadDocuments(0, false);
  }, [folderId]); // Reload when folder changes

  return {
    documents,
    loading,
    hasMore,
    loadMore,
    refresh,
    page,
    totalPages: Math.ceil(documents.length / DOCS_PER_PAGE)
  };
}