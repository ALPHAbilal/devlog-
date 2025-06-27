import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseAdapter } from '../utils/storage/SupabaseAdapterOptimized';

/**
 * Optimized storage hook with:
 * - Pagination
 * - Infinite scroll support
 * - Search debouncing
 * - Optimistic updates
 * - Error recovery
 */
export function useOptimizedStorage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState(null);
  
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  /**
   * Load documents with pagination
   */
  const loadDocuments = useCallback(async (page = 0, append = false) => {
    if (!user || loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const result = await supabaseAdapter.loadAllDocuments(user.id, {
        page,
        limit: 50,
        orderBy: 'updated_at',
        ascending: false
      });

      setDocuments(prev => append ? [...prev, ...result.documents] : result.documents);
      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  /**
   * Load more documents (for infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadDocuments(currentPage + 1, true);
    }
  }, [currentPage, hasMore, loading, loadDocuments]);

  /**
   * Search documents with debouncing
   */
  const searchDocuments = useCallback((query) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If empty query, reload all documents
    if (!query.trim()) {
      loadDocuments(0);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const results = await supabaseAdapter.searchDocuments(user.id, query);
        setDocuments(results);
        setHasMore(false); // Search results don't paginate
        setTotalCount(results.length);
      } catch (err) {
        console.error('Error searching documents:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [user, loadDocuments]);

  /**
   * Create document with optimistic update
   */
  const createDocument = useCallback(async (documentData) => {
    if (!user) return null;

    const newDoc = {
      id: crypto.randomUUID(),
      ...documentData,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistic update
    setDocuments(prev => [newDoc, ...prev]);
    setTotalCount(prev => prev + 1);

    try {
      await supabaseAdapter.saveDocument(newDoc);
      return newDoc;
    } catch (err) {
      // Rollback on error
      setDocuments(prev => prev.filter(doc => doc.id !== newDoc.id));
      setTotalCount(prev => prev - 1);
      console.error('Error creating document:', err);
      throw err;
    }
  }, [user]);

  /**
   * Update document with optimistic update
   */
  const updateDocument = useCallback(async (documentId, updates) => {
    // Find current document
    const currentDoc = documents.find(doc => doc.id === documentId);
    if (!currentDoc) return;

    const updatedDoc = {
      ...currentDoc,
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Optimistic update
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? updatedDoc : doc
    ));

    try {
      await supabaseAdapter.saveDocument(updatedDoc);
      
      // If blocks were updated, save them separately
      if (updates.blocks) {
        await supabaseAdapter.saveBlocks(documentId, updates.blocks);
      }
    } catch (err) {
      // Rollback on error
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? currentDoc : doc
      ));
      console.error('Error updating document:', err);
      throw err;
    }
  }, [documents]);

  /**
   * Delete document with optimistic update
   */
  const deleteDocument = useCallback(async (documentId) => {
    // Find document to delete
    const docToDelete = documents.find(doc => doc.id === documentId);
    if (!docToDelete) return;

    // Optimistic update
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setTotalCount(prev => prev - 1);

    try {
      await supabaseAdapter.saveDocument({
        ...docToDelete,
        deleted_at: new Date().toISOString()
      });
    } catch (err) {
      // Rollback on error
      setDocuments(prev => [...prev, docToDelete].sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      ));
      setTotalCount(prev => prev + 1);
      console.error('Error deleting document:', err);
      throw err;
    }
  }, [documents]);

  /**
   * Load user statistics
   */
  const loadStats = useCallback(async () => {
    if (!user) return;

    try {
      const userStats = await supabaseAdapter.getUserStats(user.id);
      setStats(userStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [user]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(() => {
    supabaseAdapter.clearCache();
    loadDocuments(0);
    loadStats();
  }, [loadDocuments, loadStats]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadDocuments(0);
      loadStats();
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    documents,
    loading,
    error,
    hasMore,
    totalCount,
    stats,
    loadMore,
    searchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    refresh
  };
}