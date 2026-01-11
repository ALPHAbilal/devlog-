// src/shared/db/hooks/use-documents.ts
/**
 * useRxDocuments Hook
 *
 * RxDB-based documents hook.
 * Real-time reactive document queries with automatic Supabase sync.
 *
 * API Compatibility: Matches the old usePaginatedDashboard interface from
 * use-paginated-dashboard.ts to allow transparent swap in Dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRxDB, useRxCollection } from '../rxdb-hooks.tsx';
import type { DocumentDocType } from '../rxdb-types';
import type { RxDocument } from 'rxdb';
import { useAuth } from '@/app/providers';

interface Document {
  id: string;
  title: string;
  folder_id: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  doc_position: number;
  created_at: string;
  updated_at: string;
  // Additional fields for usePaginatedDashboard compatibility
  createdAt?: string;
  updatedAt?: string;
  position?: number;
  blockCount?: number;
  lastEdited?: string;
  editCount7d?: number;
  editCount30d?: number;
  recentActivity?: unknown[];
}

interface UseRxDocumentsOptions {
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  enableInfiniteScroll?: boolean;
  preloadNextPage?: boolean;
  folderId?: string | null;
  enabled?: boolean;
}

// Convert RxDB doc to Document format (matching usePaginatedDashboard output)
function toDocument(doc: DocumentDocType): Document {
  return {
    id: doc.id,
    title: doc.title,
    folder_id: doc.folder_id,
    tags: doc.tags,
    metadata: doc.metadata,
    doc_position: doc.doc_position,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    // Aliases for usePaginatedDashboard compatibility
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    position: doc.doc_position,
    blockCount: 0, // Not stored in RxDB, computed on demand
    lastEdited: doc.updated_at,
    editCount7d: 0,
    editCount30d: 0,
    recentActivity: [],
  };
}

export function useRxDocuments(options: UseRxDocumentsOptions = {}) {
  const {
    pageSize: _pageSize = 50, // Unused but kept for API compatibility
    orderBy = 'updated_at',
    ascending = false,
    enableInfiniteScroll: _enableInfiniteScroll = true, // Unused - RxDB loads all
    preloadNextPage: _preloadNextPage = true, // Unused - RxDB loads all
    folderId,
    enabled = true,
  } = options;

  const db = useRxDB();
  const collection = useRxCollection<DocumentDocType>('documents');
  const { user } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // For usePaginatedDashboard API compatibility
  const [currentPage, setCurrentPage] = useState(0);

  // Subscribe to documents
  useEffect(() => {
    if (!db || !collection || !enabled || !user?.id) {
      setIsLoading(false);
      setDocuments([]);
      return;
    }

    setIsLoading(true);

    // Build selector
    const selector: Record<string, unknown> = {
      user_id: user.id,
      _deleted: { $ne: true },
    };

    // Filter by folder if specified
    if (folderId !== undefined) {
      selector.folder_id = folderId === null ? { $eq: null } : folderId;
    }

    // Build sort based on orderBy
    const sortField = orderBy === 'created_at' ? 'created_at' : 'updated_at';
    const sortDirection = ascending ? 'asc' : 'desc';

    const query = collection.find({
      selector,
      sort: [{ [sortField]: sortDirection }],
    });

    const subscription = query.$.subscribe({
      next: (docs: RxDocument<DocumentDocType>[]) => {
        setDocuments(docs.map(doc => toDocument(doc.toJSON())));
        setIsLoading(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsLoading(false);
        console.error('[useRxDocuments] Error:', err);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collection, user?.id, folderId, enabled, orderBy, ascending]);

  // Total count
  const totalCount = documents.length;

  // Progress tracking (usePaginatedDashboard compatibility)
  const progress = useMemo(() => ({
    loaded: documents.length,
    total: totalCount,
    percentage: totalCount > 0 ? (documents.length / totalCount) * 100 : 100,
  }), [documents.length, totalCount]);

  // With RxDB, all documents are loaded instantly - no pagination needed
  // These are provided for API compatibility
  const hasMore = false;
  const isLoadingMore = false;

  // loadMore - no-op with RxDB (all data loaded)
  // Returns Promise for API compatibility with usePaginatedDashboard
  const loadMore = useCallback((): Promise<void> => {
    // RxDB loads all data instantly - no pagination needed
    console.log('[useRxDocuments] loadMore called - RxDB loads all data instantly');
    return Promise.resolve();
  }, []);

  // loadInitial - no-op with RxDB (data is reactive)
  // Returns Promise for API compatibility with usePaginatedDashboard
  const loadInitial = useCallback((): Promise<void> => {
    // RxDB queries are reactive - no manual load needed
    console.log('[useRxDocuments] loadInitial called - RxDB is reactive');
    return Promise.resolve();
  }, []);

  // checkLoadMore - no-op with RxDB
  const checkLoadMore = useCallback((_scrollElement: HTMLElement | null) => {
    // RxDB loads all data instantly - no infinite scroll needed
  }, []);

  // reset - no-op with RxDB (data is reactive)
  // Returns Promise for API compatibility with usePaginatedDashboard
  const reset = useCallback((): Promise<void> => {
    setCurrentPage(0);
    console.log('[useRxDocuments] reset called - RxDB is reactive');
    return Promise.resolve();
  }, []);

  // Create document
  const createDocument = useCallback(async (
    title: string,
    folderId: string | null = null
  ): Promise<string> => {
    if (!collection || !user?.id) throw new Error('Database not ready');

    const now = Date.now();
    const nowStr = new Date(now).toISOString();
    const id = crypto.randomUUID();

    const newDoc: DocumentDocType = {
      id,
      user_id: user.id,
      title,
      folder_id: folderId,
      tags: [],
      metadata: {},
      doc_position: 0,
      created_at: nowStr,
      updated_at: nowStr,
      _modified: now,
      _deleted: false,
    };

    await collection.insert(newDoc);
    return id;
  }, [collection, user?.id]);

  // Update document
  const updateDocument = useCallback(async (
    id: string,
    updates: Partial<Document>
  ) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) {
      console.warn(`[useRxDocuments] Document ${id} not found`);
      return;
    }

    const now = Date.now();
    await doc.patch({
      ...updates,
      updated_at: new Date(now).toISOString(),
      _modified: now,
    } as Partial<DocumentDocType>);
  }, [collection]);

  // Delete document (soft delete)
  const deleteDocument = useCallback(async (id: string) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) return;

    await doc.patch({
      _deleted: true,
      _modified: Date.now(),
    });
  }, [collection]);

  // Move document to folder
  const moveDocument = useCallback(async (
    id: string,
    targetFolderId: string | null
  ) => {
    await updateDocument(id, { folder_id: targetFolderId });
  }, [updateDocument]);

  // documentsWithSkeletons - for loading states
  const documentsWithSkeletons = useMemo(() => {
    if (isLoading && documents.length === 0) {
      // Show skeleton placeholders while loading
      return Array(10).fill({ id: 'skeleton', type: 'skeleton' });
    }
    return documents;
  }, [documents, isLoading]);

  return {
    // Data - matches usePaginatedDashboard interface
    documents,
    documentsWithSkeletons,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    progress,
    currentPage,
    totalCount,

    // Pagination methods (no-ops for RxDB)
    loadMore,
    loadInitial,
    checkLoadMore,
    reset,

    // CRUD operations
    createDocument,
    updateDocument,
    deleteDocument,
    moveDocument,
  };
}

// Single document hook
export function useRxDocument(documentId: string | null) {
  const db = useRxDB();
  const collection = useRxCollection<DocumentDocType>('documents');

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !collection || !documentId) {
      setDocument(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const subscription = collection.findOne(documentId).$.subscribe({
      next: (doc: RxDocument<DocumentDocType> | null) => {
        setDocument(doc && !doc.get('_deleted') ? toDocument(doc.toJSON()) : null);
        setIsLoading(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collection, documentId]);

  return { document, isLoading, error };
}
