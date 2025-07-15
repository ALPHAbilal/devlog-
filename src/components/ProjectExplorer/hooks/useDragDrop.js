import { useState, useCallback } from 'react';

export function useDragDrop({ onMove, showToast }) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [dropPosition, setDropPosition] = useState('inside');
  
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setDraggedItem(active.data.current?.node);
  }, []);
  
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }
    
    const draggedNode = active.data.current?.node;
    const targetNode = over.data.current?.node;
    
    if (draggedNode && targetNode) {
      // Determine drop position based on event
      let position = 'inside';
      
      // If target is a folder, we can drop inside
      if (targetNode.type === 'folder') {
        position = 'inside';
      } else {
        // For documents, determine if we're dropping before or after
        const rect = event.over?.rect;
        const y = event.activatorEvent?.clientY;
        
        if (rect && y) {
          const relativeY = y - rect.top;
          position = relativeY < rect.height / 2 ? 'before' : 'after';
        }
      }
      
      onMove(draggedNode.id, targetNode.id, position);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  }, [onMove]);
  
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    
    if (!over) {
      setDragOverItem(null);
      return;
    }
    
    const targetNode = over.data.current?.node;
    setDragOverItem(targetNode);
    
    // Determine drop position for visual feedback
    if (targetNode?.type === 'folder') {
      setDropPosition('inside');
    } else {
      const rect = event.over?.rect;
      const y = event.activatorEvent?.clientY;
      
      if (rect && y) {
        const relativeY = y - rect.top;
        setDropPosition(relativeY < rect.height / 2 ? 'before' : 'after');
      }
    }
  }, []);
  
  const handleDrop = useCallback((event) => {
    // Additional drop logic if needed
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // You can add additional validation here
    const draggedNode = active.data.current?.node;
    const targetNode = over.data.current?.node;
    
    // Prevent dropping a folder into its own descendants
    if (draggedNode?.type === 'folder' && targetNode) {
      // This check would need access to the tree structure
      // For now, we'll let the moveItem function handle this validation
    }
  }, []);
  
  return {
    draggedItem,
    dragOverItem,
    dropPosition,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  };
}