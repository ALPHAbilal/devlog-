import { useCallback } from 'react';

export function useKeyboardNav({
  selectedId,
  setSelectedId,
  treeData,
  toggleFolder,
  onDocumentSelect,
  onDelete,
  onRename
}) {
  // Flatten tree for navigation
  const flattenTree = useCallback((items, parentId = null, level = 0) => {
    const result = [];
    
    items.forEach(item => {
      result.push({
        ...item,
        parentId,
        level
      });
      
      if (item.children && item.children.length > 0) {
        result.push(...flattenTree(item.children, item.id, level + 1));
      }
    });
    
    return result;
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    const flatItems = flattenTree(treeData);
    const currentIndex = flatItems.findIndex(item => item.id === selectedId);
    
    if (currentIndex === -1 && flatItems.length > 0) {
      // If nothing selected, select first item
      setSelectedId(flatItems[0].id);
      return;
    }
    
    const currentItem = flatItems[currentIndex];
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevItem = flatItems[currentIndex - 1];
          setSelectedId(prevItem.id);
          
          // Scroll into view
          const element = document.querySelector(`[data-node-id="${prevItem.id}"]`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < flatItems.length - 1) {
          const nextItem = flatItems[currentIndex + 1];
          setSelectedId(nextItem.id);
          
          // Scroll into view
          const element = document.querySelector(`[data-node-id="${nextItem.id}"]`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        if (currentItem?.type === 'folder' && currentItem.children?.length > 0) {
          // Collapse folder
          toggleFolder(currentItem.id);
        } else if (currentItem?.parentId) {
          // Navigate to parent
          const parent = flatItems.find(item => item.id === currentItem.parentId);
          if (parent) {
            setSelectedId(parent.id);
            const element = document.querySelector(`[data-node-id="${parent.id}"]`);
            element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        if (currentItem?.type === 'folder') {
          if (currentItem.children?.length > 0) {
            // Expand folder
            toggleFolder(currentItem.id);
          }
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (currentItem?.type === 'document') {
          onDocumentSelect?.(currentItem.id);
        } else if (currentItem?.type === 'folder') {
          toggleFolder(currentItem.id);
        }
        break;
        
      case 'Delete':
        e.preventDefault();
        if (currentItem) {
          onDelete?.(currentItem.id);
        }
        break;
        
      case 'F2':
        e.preventDefault();
        if (currentItem) {
          onRename?.(currentItem.id);
        }
        break;
        
      case ' ': // Space
        e.preventDefault();
        if (currentItem?.type === 'folder') {
          toggleFolder(currentItem.id);
        }
        break;
        
      case 'Home':
        e.preventDefault();
        if (flatItems.length > 0) {
          setSelectedId(flatItems[0].id);
          const element = document.querySelector(`[data-node-id="${flatItems[0].id}"]`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
        
      case 'End':
        e.preventDefault();
        if (flatItems.length > 0) {
          const lastItem = flatItems[flatItems.length - 1];
          setSelectedId(lastItem.id);
          const element = document.querySelector(`[data-node-id="${lastItem.id}"]`);
          element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        break;
    }
  }, [selectedId, setSelectedId, treeData, toggleFolder, onDocumentSelect, onDelete, onRename, flattenTree]);
  
  return {
    handleKeyDown
  };
}