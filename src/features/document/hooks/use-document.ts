// src/features/document/hooks/use-document.ts
/**
 * useDocument Hook
 *
 * Hybrid pattern: Dexie useLiveQuery for instant local + TanStack Query for remote sync.
 * Returns local data immediately, syncs from Supabase in background.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/storage/dexie-db';
import { documentRepository } from '@/entities/Document/Document.repository';
import { toAppDocument, type AppDocument } from '@/entities/Document/Document.schema';
import { documentKeys } from '@/shared/api/query-keys';
import { useAuth } from '@/app/providers';

interface UseDocumentOptions {
  enabled?: boolean;
}

export function useDocument(documentId: string | undefined, options: UseDocumentOptions = {}) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Local-first: Dexie live query for instant reactivity
  const localDocument = useLiveQuery(
    () => documentId ? db.documents.get(documentId) : undefined,
    [documentId],
    undefined
  );

  // Remote sync: TanStack Query for Supabase
  const remoteQuery = useQuery({
    queryKey: documentKeys.detail(documentId!),
    queryFn: () => documentRepository.getDocument(documentId!),
    enabled: enabled && !!documentId && (typeof navigator !== 'undefined' ? navigator.onLine : true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (doc: AppDocument) => documentRepository.saveDocument(doc, user?.id || ''),
    onSuccess: (savedDoc) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(savedDoc.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentRepository.deleteDocument(id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });

  // Combine local + remote: prefer local, show remote when local unavailable
  const document = localDocument
    ? toAppDocument(localDocument)
    : remoteQuery.data;

  const isLoading = !localDocument && remoteQuery.isLoading;
  const isSyncing = localDocument && !localDocument._isSynced;

  return {
    document,
    isLoading,
    isSyncing,
    error: remoteQuery.error,

    // Mutations
    save: saveMutation.mutate,
    saveAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,

    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * useDocuments Hook - List documents
 */
export function useDocuments(options: { folderId?: string | null } = {}) {
  const { folderId } = options;

  // Local-first: Dexie live query
  const localDocuments = useLiveQuery(
    async () => {
      let query = db.documents
        .orderBy('_localUpdatedAt')
        .reverse()
        .filter(doc => !doc.deleted_at);

      if (folderId !== undefined) {
        query = query.filter(doc => doc.folder_id === folderId);
      }

      return query.toArray();
    },
    [folderId],
    []
  );

  // Transform to app format
  const documents = (localDocuments || []).map(toAppDocument);

  return {
    documents,
    isLoading: localDocuments === undefined,
  };
}
