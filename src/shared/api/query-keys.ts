/**
 * Query Key Factories
 *
 * Centralized, type-safe key generation for all queries.
 * Keys are hierarchical arrays enabling granular invalidation.
 *
 * Pattern: entity.scope.detail
 * Example: ['documents', 'list', { folderId: '123' }]
 */

// Document queries
export const documentKeys = {
  // All document-related queries
  all: ['documents'] as const,

  // Document lists (can be filtered)
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters?: { folderId?: string; search?: string }) =>
    [...documentKeys.lists(), filters] as const,

  // Single document details
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,

  // Document with blocks (for DocumentPage)
  withBlocks: (id: string) => [...documentKeys.detail(id), 'blocks'] as const,
}

// Block queries
export const blockKeys = {
  all: ['blocks'] as const,
  byDocument: (documentId: string) => [...blockKeys.all, 'document', documentId] as const,
  detail: (blockId: string) => [...blockKeys.all, 'detail', blockId] as const,
}

// Folder queries
export const folderKeys = {
  all: ['folders'] as const,
  lists: () => [...folderKeys.all, 'list'] as const,
  tree: () => [...folderKeys.all, 'tree'] as const,
  detail: (id: string) => [...folderKeys.all, 'detail', id] as const,
}

// User queries
export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  settings: () => [...userKeys.all, 'settings'] as const,
}

/**
 * Usage examples:
 *
 * // Fetch single document
 * useQuery({ queryKey: documentKeys.detail(docId), queryFn: ... })
 *
 * // Invalidate all documents after mutation
 * queryClient.invalidateQueries({ queryKey: documentKeys.all })
 *
 * // Invalidate specific document
 * queryClient.invalidateQueries({ queryKey: documentKeys.detail(docId) })
 *
 * // Invalidate document list but keep individual document caches
 * queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
 */
