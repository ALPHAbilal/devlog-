import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContextOptimized';
import { useToast } from './useToast';

export function useFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  // Load folders
  const loadFolders = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;

      // Build tree structure
      const folderMap = new Map();
      const rootFolders = [];

      // First pass: create all folder objects
      data.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          children: []
        });
      });

      // Second pass: build hierarchy
      data.forEach(folder => {
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(folderMap.get(folder.id));
          }
        } else {
          rootFolders.push(folderMap.get(folder.id));
        }
      });

      setFolders(rootFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Create folder
  const createFolder = useCallback(async (name, parentId = null) => {
    if (!user?.id) return null;

    try {
      // Get parent path if exists
      let path = name;
      if (parentId) {
        const parent = await supabase
          .from('folders')
          .select('path')
          .eq('id', parentId)
          .single();
        
        if (parent.data) {
          path = `${parent.data.path}/${name}`;
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

      await loadFolders();
      toast.success('Folder created');
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
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

      await loadFolders();
      toast.success('Folder updated');
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
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

      await loadFolders();
      toast.success('Folder deleted');
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

      await loadFolders();
      toast.success('Folder moved');
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

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

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