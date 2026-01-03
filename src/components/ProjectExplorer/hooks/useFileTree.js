import { useState, useEffect, useCallback, useRef } from 'react';
import { storageWrapper } from '@/shared/lib';
import { useToast } from '@/shared/hooks';

export function useFileTree() {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const { showToast } = useToast();
  const refreshTimer = useRef(null);
  
  // Load tree data
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load folders and documents in parallel
      const [folders, documents] = await Promise.all([
        storageWrapper.getFolderTree(),
        storageWrapper.getDocuments()
      ]);
      
      // Build tree structure
      const folderMap = new Map();
      const rootItems = [];
      
      // Process folders
      folders.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          type: 'folder',
          children: []
        });
      });
      
      // Build folder hierarchy
      folders.forEach(folder => {
        const node = folderMap.get(folder.id);
        if (folder.parent_id) {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootItems.push(node);
        }
      });
      
      // Add documents to folders
      documents.forEach(doc => {
        const docNode = {
          ...doc,
          type: 'document',
          name: doc.title
        };
        
        if (doc.folder_id) {
          const folder = folderMap.get(doc.folder_id);
          if (folder) {
            folder.children.push(docNode);
          }
        } else {
          // Root level documents
          rootItems.push(docNode);
        }
      });
      
      // Sort items
      const sortItems = (items) => {
        return items.sort((a, b) => {
          // Folders first
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          
          // Then by position
          if (a.position !== b.position) {
            return (a.position || 0) - (b.position || 0);
          }
          
          // Then by name
          return (a.name || a.title || '').localeCompare(b.name || b.title || '');
        });
      };
      
      // Recursively sort all levels
      const sortTree = (items) => {
        const sorted = sortItems(items);
        sorted.forEach(item => {
          if (item.children) {
            item.children = sortTree(item.children);
          }
        });
        return sorted;
      };
      
      setTreeData(sortTree(rootItems));
      
      // Restore expanded state from localStorage
      const savedExpanded = localStorage.getItem('project-explorer-expanded');
      if (savedExpanded) {
        setExpandedFolders(new Set(JSON.parse(savedExpanded)));
      }
    } catch (error) {
      console.error('Failed to load tree data:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);
  
  // Initial load
  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);
  
  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('project-explorer-expanded', JSON.stringify([...expandedFolders]));
  }, [expandedFolders]);
  
  // Toggle folder expansion
  const toggleFolder = useCallback((folderId) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);
  
  // Create folder
  const createFolder = useCallback(async (parentId) => {
    try {
      const newFolder = await storageWrapper.createFolder({
        name: 'New Folder',
        parent_id: parentId || null  // Ensure null instead of undefined
      });
      
      showToast('Folder created', 'success');
      
      // Expand parent folder
      if (parentId) {
        setExpandedFolders(prev => new Set([...prev, parentId]));
      }
      
      // Refresh tree
      await loadTreeData();
      
      return newFolder;
    } catch (error) {
      console.error('Failed to create folder:', error);
      showToast(`Failed to create folder: ${error.message}`, 'error');
    }
  }, [loadTreeData, showToast]);
  
  // Create document
  const createDocument = useCallback(async (folderId) => {
    try {
      const newDoc = await storageWrapper.createDocument({
        title: 'Untitled',
        folder_id: folderId
      });
      
      showToast('Document created', 'success');
      
      // Expand parent folder
      if (folderId) {
        setExpandedFolders(prev => new Set([...prev, folderId]));
      }
      
      // Refresh tree
      await loadTreeData();
      
      return newDoc;
    } catch (error) {
      console.error('Failed to create document:', error);
      showToast('Failed to create document', 'error');
    }
  }, [loadTreeData, showToast]);
  
  // Rename item
  const renameItem = useCallback(async (itemId, newName) => {
    try {
      // Find the item in the tree
      const findItem = (items) => {
        for (const item of items) {
          if (item.id === itemId) return item;
          if (item.children) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const item = findItem(treeData);
      if (!item) return;
      
      if (item.type === 'folder') {
        await storageWrapper.updateFolder(itemId, { name: newName });
      } else {
        await storageWrapper.updateDocument(itemId, { title: newName });
      }
      
      showToast('Renamed successfully', 'success');
      
      // Debounced refresh
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = setTimeout(() => {
        loadTreeData();
      }, 500);
    } catch (error) {
      console.error('Failed to rename:', error);
      showToast('Failed to rename', 'error');
    }
  }, [treeData, loadTreeData, showToast]);
  
  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    try {
      // Find the item in the tree
      const findItem = (items) => {
        for (const item of items) {
          if (item.id === itemId) return item;
          if (item.children) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const item = findItem(treeData);
      if (!item) return;
      
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${item.name || item.title}"?${
          item.type === 'folder' ? ' This will also delete all contents.' : ''
        }`
      );
      
      if (!confirmDelete) return;
      
      if (item.type === 'folder') {
        await storageWrapper.deleteFolder(itemId);
      } else {
        await storageWrapper.deleteDocument(itemId);
      }
      
      showToast('Deleted successfully', 'success');
      await loadTreeData();
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('Failed to delete', 'error');
    }
  }, [treeData, loadTreeData, showToast]);
  
  // Move item
  const moveItem = useCallback(async (itemId, targetId, position = 'inside') => {
    try {
      // Find the item in the tree
      const findItem = (items) => {
        for (const item of items) {
          if (item.id === itemId) return item;
          if (item.children) {
            const found = findItem(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const item = findItem(treeData);
      const target = findItem(treeData);
      
      if (!item || !target) return;
      
      // Prevent moving folder into itself
      if (item.type === 'folder' && position === 'inside') {
        const isDescendant = (parentId, childId) => {
          const checkDescendant = (items) => {
            for (const node of items) {
              if (node.id === parentId) {
                return node.children?.some(child => 
                  child.id === childId || checkDescendant([child])
                );
              }
              if (node.children && checkDescendant(node.children)) {
                return true;
              }
            }
            return false;
          };
          return checkDescendant(treeData);
        };
        
        if (itemId === targetId || isDescendant(itemId, targetId)) {
          showToast('Cannot move folder into itself', 'error');
          return;
        }
      }
      
      if (item.type === 'folder') {
        await storageWrapper.moveFolder(itemId, target.type === 'folder' ? targetId : null);
      } else {
        await storageWrapper.updateDocument(itemId, { 
          folder_id: target.type === 'folder' ? targetId : null 
        });
      }
      
      showToast('Moved successfully', 'success');
      await loadTreeData();
    } catch (error) {
      console.error('Failed to move item:', error);
      showToast('Failed to move item', 'error');
    }
  }, [treeData, loadTreeData, showToast]);
  
  // Toggle favorite
  const toggleFavorite = useCallback(async (folderId) => {
    try {
      const folder = treeData.find(item => item.id === folderId);
      if (!folder || folder.type !== 'folder') return;
      
      await storageWrapper.updateFolder(folderId, { 
        is_favorite: !folder.is_favorite 
      });
      
      showToast(
        folder.is_favorite ? 'Removed from favorites' : 'Added to favorites', 
        'success'
      );
      
      await loadTreeData();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showToast('Failed to update favorite', 'error');
    }
  }, [treeData, loadTreeData, showToast]);
  
  return {
    treeData,
    loading,
    expandedFolders,
    toggleFolder,
    createFolder,
    createDocument,
    renameItem,
    deleteItem,
    moveItem,
    toggleFavorite,
    refreshTree: loadTreeData
  };
}