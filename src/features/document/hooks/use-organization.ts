import { create } from 'zustand';
import { storageWrapper } from '@/shared/lib';

const useDocumentOrganization = create((set, get) => ({
  // Selection state
  selectedDocuments: new Set(),
  lastSelectedId: null,
  
  // Drag state
  isDragging: false,
  draggedDocuments: [],
  draggedOverProjectId: null,
  
  // Selection methods
  toggleSelection: (docId) => {
    set(state => {
      const newSelection = new Set(state.selectedDocuments);
      if (newSelection.has(docId)) {
        newSelection.delete(docId);
      } else {
        newSelection.add(docId);
      }
      return { 
        selectedDocuments: newSelection,
        lastSelectedId: docId 
      };
    });
  },
  
  selectRange: (fromId, toId, allDocuments) => {
    const fromIndex = allDocuments.findIndex(doc => doc.id === fromId);
    const toIndex = allDocuments.findIndex(doc => doc.id === toId);
    
    if (fromIndex === -1 || toIndex === -1) return;
    
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    
    const rangeIds = allDocuments
      .slice(start, end + 1)
      .map(doc => doc.id);
    
    set({ 
      selectedDocuments: new Set(rangeIds),
      lastSelectedId: toId 
    });
  },
  
  selectAll: (documents) => {
    set({ 
      selectedDocuments: new Set(documents.map(doc => doc.id)),
      lastSelectedId: documents[documents.length - 1]?.id || null
    });
  },
  
  clearSelection: () => {
    set({ 
      selectedDocuments: new Set(),
      lastSelectedId: null 
    });
  },
  
  // Drag methods
  startDrag: (documents) => {
    set({ 
      isDragging: true,
      draggedDocuments: documents 
    });
  },
  
  endDrag: () => {
    set({ 
      isDragging: false,
      draggedDocuments: [],
      draggedOverProjectId: null
    });
  },
  
  setDraggedOver: (projectId) => {
    set({ draggedOverProjectId: projectId });
  },
  
  // Move operations
  moveDocuments: async (docIds, targetProjectId, onSuccess, onError) => {
    try {
      // Convert Set to Array if needed
      const documentIds = Array.isArray(docIds) ? docIds : Array.from(docIds);
      
      // Update all documents with new project_id
      const updatePromises = documentIds.map(docId => 
        storageWrapper.updateDocument(docId, { project_id: targetProjectId })
      );
      
      await Promise.all(updatePromises);
      
      // Clear selection after successful move
      get().clearSelection();
      
      if (onSuccess) {
        onSuccess(documentIds.length);
      }
    } catch (error) {
      console.error('Failed to move documents:', error);
      if (onError) {
        onError(error);
      }
    }
  },
  
  // Move with undo support
  moveWithUndo: async (docIds, fromProjectId, toProjectId, onSuccess) => {
    const undoMove = async () => {
      await get().moveDocuments(docIds, fromProjectId);
    };
    
    await get().moveDocuments(docIds, toProjectId, (count) => {
      if (onSuccess) {
        onSuccess(count, undoMove);
      }
    });
  }
}));

export default useDocumentOrganization;