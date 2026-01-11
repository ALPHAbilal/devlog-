// src/shared/db/hooks/use-folders.ts
/**
 * useRxFolders Hook
 *
 * RxDB-based folders hook.
 * Real-time reactive folder queries with automatic Supabase sync.
 *
 * API Compatibility: Matches the old useFolders interface from use-folders.ts
 * to allow transparent swap in Dashboard and ProjectExplorer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRxDB, useRxCollection } from '../rxdb-hooks.tsx';
import type { FolderDocType, DocumentDocType } from '../rxdb-types';
import type { RxDocument } from 'rxdb';
import { useAuth } from '@/app/providers';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  position: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
  documentCount?: number;
}

interface UseRxFoldersOptions {
  parentId?: string | null;
  enabled?: boolean;
}

// Convert RxDB doc to Folder format with children array
function toFolder(doc: FolderDocType): Folder {
  return {
    id: doc.id,
    name: doc.name,
    parent_id: doc.parent_id,
    path: doc.path,
    position: doc.position,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    children: [], // Will be populated by tree building
    documentCount: 0, // Will be populated by document counting
  };
}

export function useRxFolders(options: UseRxFoldersOptions = {}) {
  const { parentId, enabled = true } = options;
  const db = useRxDB();
  const collection = useRxCollection<FolderDocType>('folders');
  const documentsCollection = useRxCollection<DocumentDocType>('documents');
  const { user } = useAuth();

  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to folders
  useEffect(() => {
    if (!db || !collection || !enabled) {
      setIsLoading(false);
      setAllFolders([]);
      return;
    }

    setIsLoading(true);

    // Build selector - get all folders, we'll build tree in memory
    const query = collection.find({
      selector: {
        _deleted: { $ne: true },
      },
      sort: [{ position: 'asc' }],
    });

    const subscription = query.$.subscribe({
      next: (docs: RxDocument<FolderDocType>[]) => {
        const folders = docs.map(doc => toFolder(doc.toJSON()));
        setAllFolders(folders);
        setIsLoading(false);
        setError(null);
      },
      error: (err: Error) => {
        setError(err);
        setIsLoading(false);
        console.error('[useRxFolders] Error:', err);
      },
    });

    return () => subscription.unsubscribe();
  }, [db, collection, parentId, enabled]);

  // Build tree structure - matches old useFolders output format
  const folders = useMemo(() => {
    // First pass: create folder map with children arrays
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // Create all folder objects
    allFolders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        documentCount: 0,
      });
    });

    // Build hierarchy
    allFolders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id)!;

      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children!.push(folderWithChildren);
        } else {
          // Orphaned folder, treat as root
          rootFolders.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }, [allFolders]);

  // Create folder - API matches old useFolders: createFolder(name, parentId)
  const createFolder = useCallback(async (
    name: string,
    parentId: string | null = null
  ): Promise<Folder | null> => {
    if (!collection || !user?.id) {
      console.error('[useRxFolders] Cannot create folder - no database or user');
      return null;
    }

    try {
      const now = Date.now();
      const nowStr = new Date(now).toISOString();
      const id = crypto.randomUUID();

      // Build path
      let path = name;
      if (parentId) {
        const parent = await collection.findOne(parentId).exec();
        if (parent) {
          path = `${parent.get('path')}/${name}`;
        }
      }

      const newFolder: FolderDocType = {
        id,
        user_id: user.id,
        name,
        parent_id: parentId,
        path,
        position: allFolders.length,
        created_at: nowStr,
        updated_at: nowStr,
        _modified: now,
        _deleted: false,
      };

      await collection.insert(newFolder);

      // Return folder in the format expected by consumers
      return {
        id,
        name,
        parent_id: parentId,
        path,
        position: allFolders.length,
        created_at: nowStr,
        updated_at: nowStr,
        children: [],
      };
    } catch (err) {
      console.error('[useRxFolders] Error creating folder:', err);
      return null;
    }
  }, [collection, user?.id, allFolders.length]);

  // Update folder
  const updateFolder = useCallback(async (
    id: string,
    updates: Partial<Folder>
  ) => {
    if (!collection) return;

    const doc = await collection.findOne(id).exec();
    if (!doc) {
      console.warn(`[useRxFolders] Folder ${id} not found`);
      return;
    }

    const now = Date.now();
    await doc.patch({
      ...updates,
      updated_at: new Date(now).toISOString(),
      _modified: now,
    } as Partial<FolderDocType>);
  }, [collection]);

  // Delete folder (soft delete)
  const deleteFolder = useCallback(async (id: string): Promise<boolean> => {
    if (!collection) return false;

    try {
      const doc = await collection.findOne(id).exec();
      if (!doc) return false;

      await doc.patch({
        _deleted: true,
        _modified: Date.now(),
      });

      return true;
    } catch (err) {
      console.error('[useRxFolders] Error deleting folder:', err);
      return false;
    }
  }, [collection]);

  // Move folder
  const moveFolder = useCallback(async (
    id: string,
    targetParentId: string | null
  ): Promise<boolean> => {
    if (!collection) return false;

    try {
      const doc = await collection.findOne(id).exec();
      if (!doc) return false;

      // Build new path
      let newPath = `/${doc.get('name')}`;
      if (targetParentId) {
        const parent = await collection.findOne(targetParentId).exec();
        if (parent) {
          newPath = `${parent.get('path')}/${doc.get('name')}`;
        }
      }

      await updateFolder(id, {
        parent_id: targetParentId,
        path: newPath,
      });

      return true;
    } catch (err) {
      console.error('[useRxFolders] Error moving folder:', err);
      return false;
    }
  }, [collection, updateFolder]);

  // Move document to folder - matches old useFolders interface
  const moveDocumentToFolder = useCallback(async (
    documentId: string,
    folderId: string | null
  ): Promise<boolean> => {
    if (!documentsCollection) return false;

    try {
      const doc = await documentsCollection.findOne(documentId).exec();
      if (!doc) return false;

      const now = Date.now();
      await doc.patch({
        folder_id: folderId,
        updated_at: new Date(now).toISOString(),
        _modified: now,
      });

      return true;
    } catch (err) {
      console.error('[useRxFolders] Error moving document:', err);
      return false;
    }
  }, [documentsCollection]);

  // refreshFolders - no-op with RxDB (data is reactive)
  // Returns Promise for API compatibility with old useFolders
  const refreshFolders = useCallback((): Promise<void> => {
    // RxDB queries are reactive - no manual refresh needed
    // This is a no-op for API compatibility
    console.log('[useRxFolders] refreshFolders called - RxDB is reactive, no manual refresh needed');
    return Promise.resolve();
  }, []);

  // Build folder tree from flat list (for consumers that need Map format)
  const folderTree = useMemo(() => {
    const map = new Map<string | null, Folder[]>();

    allFolders.forEach(folder => {
      const parentKey = folder.parent_id;
      if (!map.has(parentKey)) {
        map.set(parentKey, []);
      }
      map.get(parentKey)!.push(folder);
    });

    return map;
  }, [allFolders]);

  return {
    // Data - matches old useFolders interface
    folders,
    folderTree,
    loading: isLoading, // Alias for old interface
    isLoading,
    error,

    // Operations - matches old useFolders interface
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
    moveDocumentToFolder,
    refreshFolders,
  };
}
