import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Code,
  MessageSquare,
  Hash,
  Table,
  Image,
  ListTodo,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  X,
  Plus,
  FolderPlus,
  FilePlus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import SearchBar from './SearchBar';
import ContextMenu from './ContextMenu';
import { useToast } from '@/shared/hooks';
import { useFolders } from '@/features/document';
import { useProjectStructure } from '@/features/storage';
import '../VirtualizedGrid.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
  rectIntersection,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Droppable folder component
function DroppableFolder({ id, children, isActive }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: id,
    data: { type: 'folder' }
  });
  
  // Determine if this folder can accept the dragged item
  const canDrop = active && active.id !== id;
  
  return (
    <div 
      ref={setNodeRef}
      className={`
        ${isOver && canDrop ? 'ring-2 ring-accent-green/50 bg-accent-green/10 rounded-md' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
}

// Draggable item component for documents and folders
function DraggableItem({ id, type, data, children, isRenaming }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ 
    id,
    data: { type, data }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...(!isRenaming ? listeners : {})}
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

export default function ProjectExplorer({ 
  onDocumentSelect,
  selectedDocumentId,
  className = '',
  height = 'h-full',
  projects = [],
  documents = [],
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onToggleFavorite,
  totalDocuments = 0,
  uncategorizedCount = 0,
  onDocumentMove,
  onDocumentDelete,
  isCollapsed = false,
  onToggleCollapse
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const scrollContainerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  
  // Use the folders hook
  const { 
    folders, 
    loading: foldersLoading, 
    createFolder: createFolderInDB,
    updateFolder,
    deleteFolder: deleteFolderFromDB,
    moveFolder,
    moveDocumentToFolder
  } = useFolders();
  
  // Use batch loader for prefetching
  const {
    prefetchFolder,
    cancelPrefetch
  } = useProjectStructure();
  
  // Auto-expand folders to show the selected document and scroll to it
  useEffect(() => {
    if (!selectedDocumentId || !documents.length) return;
    
    // Find the selected document
    const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) return;
    
    // Set the selected item to the document
    setSelectedItemId(selectedDocumentId);
    
    // If document is in a folder, expand the path to it
    if (selectedDoc.folder_id) {
      // Build path to document by traversing up the folder tree
      const getFolderPath = (folderId, path = []) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return path;
        
        path.unshift(folder.id);
        if (folder.parent_id) {
          return getFolderPath(folder.parent_id, path);
        }
        return path;
      };
      
      const folderPath = getFolderPath(selectedDoc.folder_id);
      
      // Expand all folders in the path
      if (folderPath.length > 0) {
        setExpandedItems(prev => {
          const newExpanded = new Set(prev);
          folderPath.forEach(folderId => newExpanded.add(folderId));
          return newExpanded;
        });
      }
    } else {
      // Document is at root level, no folders to expand
    }
    
    // Scroll to the document after folders have expanded
    setTimeout(() => {
      if (!scrollContainerRef.current) return;
      
      const documentElement = scrollContainerRef.current.querySelector(
        `[data-document-id="${selectedDocumentId}"]`
      );
      
      if (documentElement) {
        // Check if element is already visible
        const container = scrollContainerRef.current;
        const elementRect = documentElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const isVisible = 
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom;
        
        // Only scroll if not already visible
        if (!isVisible) {
          documentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }
    }, 400); // Wait for folder expansion animations
  }, [selectedDocumentId, documents, folders]);
  
  // Build folder structure with documents
  const folderStructure = useMemo(() => {
    // Helper to add documents to folders
    const addDocumentsToFolder = (folder) => {
      const folderDocuments = documents.filter(doc => doc.folder_id === folder.id);
      return {
        ...folder,
        type: 'folder',
        documents: folderDocuments.map(doc => ({
          id: doc.id,
          name: doc.title || 'Untitled',
          type: 'document',
          data: doc
        })),
        children: folder.children ? folder.children.map(addDocumentsToFolder) : []
      };
    };
    
    // Get root level folders (those without parent_id)
    // Filter out any folder named "FOLDERS" to fix the UI bug
    const rootFolders = folders
      .filter(folder => !folder.parent_id && folder.name !== 'FOLDERS')
      .map(addDocumentsToFolder);
    
    // Get root level documents (those without folder_id)
    const rootDocuments = documents.filter(doc => !doc.folder_id).map(doc => ({
      id: doc.id,
      name: doc.title || 'Untitled',
      type: 'document',
      data: doc
    }));
    
    // Combine and sort root items (folders first, then documents)
    const rootItems = [...rootFolders, ...rootDocuments].sort((a, b) => {
      // Folders come before documents
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      // Then sort by name
      return (a.name || '').localeCompare(b.name || '');
    });
    
    return rootItems;
  }, [folders, documents]);
  
  const containerRef = useRef(null);
  const { showToast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Toggle item expansion
  const toggleExpanded = useCallback((itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Handle context menu
  const handleContextMenu = useCallback((e, item, parentId = null) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItems = [];
    
    if (item.type === 'folder') {
      menuItems.push(
        { label: 'New Folder', icon: FolderPlus, onClick: () => createNewFolder(item.id) },
        { label: 'New File', icon: FilePlus, onClick: () => createNewDocument(item.id) },
        { divider: true }
      );
    }
    
    menuItems.push(
      { label: 'Rename', icon: Edit2, onClick: () => startRenaming(item) },
      { label: 'Delete', icon: Trash2, onClick: () => deleteItem(item, parentId), danger: true }
    );

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: menuItems
    });
  }, []);

  // Create new folder
  const createNewFolder = useCallback(async (parentId) => {
    const actualParentId = parentId;
    
    // Get all folders at the same level
    const getSiblingFolders = (folders, targetParentId) => {
      // First, flatten the folder tree to get all folders
      const flattenFolders = (folderList, accumulator = []) => {
        for (const folder of folderList) {
          accumulator.push(folder);
          if (folder.children && folder.children.length > 0) {
            flattenFolders(folder.children, accumulator);
          }
        }
        return accumulator;
      };
      
      const allFolders = flattenFolders(folders);
      
      // Now filter to get only siblings (folders with the same parent_id)
      return allFolders.filter(f => f.parent_id === targetParentId);
    };
    
    const siblings = getSiblingFolders(folders, actualParentId);
    
    // Generate unique folder name
    let baseName = 'New Folder';
    let folderName = baseName;
    let counter = 2;
    
    while (siblings.some(folder => folder.name === folderName)) {
      folderName = `${baseName} (${counter})`;
      counter++;
    }
    
    const newFolder = await createFolderInDB(folderName, actualParentId);
    if (newFolder) {
      if (parentId) {
        setExpandedItems(prev => new Set([...prev, parentId]));
      }
      setRenamingId(newFolder.id);
      setRenamingValue(folderName);
    }
  }, [createFolderInDB, folders]);

  // Start renaming
  const startRenaming = useCallback((item) => {
    setRenamingId(item.id);
    setRenamingValue(item.name);
  }, []);

  // Complete renaming
  const completeRenaming = useCallback(async () => {
    if (!renamingId || !renamingValue.trim() || isRenaming) {
      setRenamingId(null);
      return;
    }
    
    // Find the item being renamed and get its siblings
    const findItemAndSiblings = (items, targetId, parent = null) => {
      for (const item of items) {
        if (item.id === targetId) {
          // For root level items
          if (!parent) {
            // Use the folderStructure items as siblings (already filtered and processed)
            return { item, siblings: items, isDocument: item.type === 'document' };
          }
          // For items inside folders
          const siblings = [
            ...(parent.children || []),
            ...(parent.documents || [])
          ];
          return { item, siblings, isDocument: item.type === 'document' };
        }
        
        // Search in children folders
        if (item.children) {
          const result = findItemAndSiblings(item.children, targetId, item);
          if (result) return result;
        }
        
        // Search in documents
        if (item.documents) {
          for (const doc of item.documents) {
            if (doc.id === targetId) {
              const siblings = [
                ...(item.children || []),
                ...(item.documents || [])
              ];
              return { item: doc, siblings, isDocument: true };
            }
          }
        }
      }
      return null;
    };
    
    const result = findItemAndSiblings(folderStructure, renamingId);
    if (result) {
      const { item, siblings, isDocument } = result;
      
      // Check for duplicate names among siblings of the same type
      const isDuplicate = siblings.some(sibling => 
        sibling.id !== renamingId && 
        sibling.name === renamingValue.trim() &&
        sibling.type === item.type
      );
      
      if (isDuplicate) {
        showToast('A folder with this name already exists at this level', 'error');
        setRenamingValue(item.name); // Restore original name
        return;
      }
    }
    
    setIsRenaming(true);
    try {
      await updateFolder(renamingId, { name: renamingValue.trim() });
    } catch (error) {
      // Handle database constraint error
      if (error.message?.includes('unique_folder_name_per_parent')) {
        showToast('A folder with this name already exists at this level', 'error');
      }
    } finally {
      setIsRenaming(false);
      setRenamingId(null);
      setSelectedItemId(null); // Clear selection after rename
    }
  }, [renamingId, renamingValue, updateFolder, isRenaming, folderStructure, showToast]);

  // Delete item
  const deleteItem = useCallback(async (item, parentId) => {
    if (item.type === 'folder') {
      await deleteFolderFromDB(item.id);
    } else if (item.type === 'document' && onDocumentDelete) {
      // Delete the document
      await onDocumentDelete(item.data || item);
    }
  }, [deleteFolderFromDB, onDocumentDelete]);

  // Helper function to find an item in the folder structure
  const findItemInStructure = useCallback((items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.documents) {
        const doc = item.documents.find(d => d.id === id);
        if (doc) return doc;
      }
      if (item.children) {
        const result = findItemInStructure(item.children, id);
        if (result) return result;
      }
    }
    return null;
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    
    const item = findItemInStructure(folderStructure, active.id);
    setDraggedItem(item);
  }, [folderStructure, findItemInStructure]);

  // Handle drag over - for auto-expanding folders
  const handleDragOver = useCallback((event) => {
    const { over, active } = event;
    
    if (!over || !active) {
      // Clear any pending hover timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setDragOverFolderId(null);
      return;
    }
    
    // Check if we're over a different folder than before
    if (over.id !== dragOverFolderId) {
      // Clear previous timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      
      setDragOverFolderId(over.id);
      
      // Find the item being hovered over
      const targetItem = findItemInStructure(folderStructure, over.id);
      
      // If it's a folder and not already expanded, set timer to expand
      if (targetItem && targetItem.type === 'folder' && !expandedItems.has(over.id)) {
        hoverTimerRef.current = setTimeout(() => {
          setExpandedItems(prev => new Set([...prev, over.id]));
          hoverTimerRef.current = null;
        }, 700); // 700ms delay before auto-expanding
      }
    }
  }, [dragOverFolderId, folderStructure, expandedItems, findItemInStructure]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event) => {
    // Clear hover timer and state
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setDragOverFolderId(null);
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedItem(null);
      return;
    }
    
    // Find the dragged item
    const draggedItem = findItemInStructure(folderStructure, active.id);
    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }
    
    // Handle drop on root
    if (over.id === 'root') {
      if (draggedItem.type === 'document') {
        await moveDocumentToFolder(draggedItem.id, null);
        if (onDocumentMove) {
          onDocumentMove(draggedItem.id, null);
        }
      } else if (draggedItem.type === 'folder') {
        await moveFolder(draggedItem.id, null);
      }
    } else {
      // Find target item
      const targetItem = findItemInStructure(folderStructure, over.id);
      if (!targetItem) {
        setDraggedItem(null);
        return;
      }
      
      // Handle document to folder drop
      if (draggedItem.type === 'document' && targetItem.type === 'folder') {
        await moveDocumentToFolder(draggedItem.id, targetItem.id);
        if (onDocumentMove) {
          onDocumentMove(draggedItem.id, targetItem.id);
        }
      }
      // Handle folder to folder drop
      else if (draggedItem.type === 'folder' && targetItem.type === 'folder') {
        await moveFolder(draggedItem.id, targetItem.id);
      }
    }
    
    setDraggedItem(null);
  }, [folderStructure, moveDocumentToFolder, moveFolder, onDocumentMove]);
  
  // Create new document in folder
  const createNewDocument = useCallback((folderId) => {
    if (onDocumentSelect) {
      onDocumentSelect({ action: 'create', folderId: folderId });
    }
  }, [onDocumentSelect]);

  // Get icon for document
  const getDocumentIcon = (doc) => {
    if (!doc.blocks || doc.blocks.length === 0) return FileText;
    
    const blockTypes = doc.blocks.map(b => b.type);
    
    if (blockTypes.includes('code')) return Code;
    if (blockTypes.includes('ai_conversation')) return MessageSquare;
    if (blockTypes.includes('table')) return Table;
    if (blockTypes.includes('image')) return Image;
    if (blockTypes.includes('todo')) return ListTodo;
    
    return FileText;
  };

  // Render tree item
  const renderTreeItem = (item, depth = 0, parentId = null) => {
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedItemId === item.id;
    const isRenaming = renamingId === item.id;
    const hasChildren = (item.children && item.children.length > 0) || (item.documents && item.documents.length > 0);
    const isActiveDocument = item.type === 'document' && item.id === selectedDocumentId;
    
    const itemContent = (
      <div
        data-document-id={item.type === 'document' ? item.id : undefined}
        className={`
          group flex items-center justify-between py-1 px-2
          rounded-md transition-colors duration-200
          ${isActiveDocument 
            ? 'bg-accent-green/20 border-l-2 border-accent-green shadow-sm' 
            : isSelected 
              ? 'bg-surface-1/50' 
              : 'hover:bg-surface-1/30'}
          ${depth === 0 ? 'mt-0.5' : ''}
          ${isRenaming && isRenaming ? 'pointer-events-none' : 'cursor-pointer'}
          ${isActiveDocument ? 'ml-[-2px]' : ''}
        `}
        style={{ 
          paddingLeft: `${(depth * 16) + 8}px`,
          willChange: isActiveDocument ? 'background-color, border-color' : 'auto',
          contain: 'layout style paint'
        }}
        onClick={() => {
          if (item.type === 'folder') {
            toggleExpanded(item.id);
          } else if (item.type === 'document') {
            onDocumentSelect?.(item.data);
          }
          setSelectedItemId(item.id);
        }}
        onMouseEnter={() => {
          // Prefetch folder contents on hover for better UX
          if (item.type === 'folder' && !expandedItems.has(item.id)) {
            prefetchFolder(item.id);
          }
        }}
        onMouseLeave={() => {
          // Cancel prefetch if mouse leaves quickly
          if (item.type === 'folder') {
            cancelPrefetch(item.id);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, item, parentId)}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Chevron for expandable items */}
          {(hasChildren || item.type === 'folder') && (
            <ChevronRight 
              size={12} 
              className={`
                text-text-secondary/60 transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}
              `}
            />
          )}
          {!hasChildren && item.type !== 'folder' && (
            <div className="w-3" />
          )}
          
          {/* Icon */}
          {item.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen size={14} className="text-accent-green flex-shrink-0" />
            ) : (
              <Folder size={14} className="text-text-secondary flex-shrink-0" />
            )
          ) : (
            <FileText size={14} className={`${isActiveDocument ? 'text-accent-green' : 'text-text-secondary'} flex-shrink-0`} />
          )}
          
          {/* Name */}
          {isRenaming ? (
            <input
              type="text"
              value={renamingValue}
              onChange={(e) => setRenamingValue(e.target.value)}
              onBlur={completeRenaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter') completeRenaming();
                if (e.key === 'Escape') {
                  setRenamingId(null);
                  setRenamingValue('');
                }
              }}
              className="w-32 bg-dark-primary text-text-primary text-sm px-1 py-0 rounded
                       border border-accent-green/50 focus:outline-none focus:border-accent-green
                       focus:ring-0 focus:bg-dark-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`
                text-sm truncate block min-w-0
                ${isActiveDocument ? 'text-accent-green font-medium' : isSelected ? 'text-text-primary' : 'text-text-secondary'}
                ${!isActiveDocument ? 'group-hover:text-text-primary' : ''}
              `}
              title={item.name}>
                {item.name}
              </span>
              {/* Document count for folders */}
              {item.type === 'folder' && item.documentCount !== undefined && item.documentCount > 0 && (
                <span className="text-xs text-text-secondary/60 bg-surface-1/30 px-1.5 py-0.5 rounded-md">
                  {item.documentCount}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.type === 'folder' && (
            <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewFolder(item.id);
                  }}
                  className="p-0.5 hover:bg-surface-1/50 rounded-lg transition-colors duration-200"
                  title="New folder"
                >
                  <FolderPlus size={12} className="text-text-secondary" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item, parentId);
                  }}
                  className="p-0.5 hover:bg-surface-1/50 rounded-lg transition-colors duration-200"
                  title="More options"
                >
                  <MoreVertical size={12} className="text-text-secondary" />
                </button>
              </>
            )}
          </div>
      </div>
    );

    // Wrap the content based on type
    let wrappedContent;
    if (item.type === 'folder') {
      // Folders are droppable
      wrappedContent = (
        <DroppableFolder id={item.id}>
          <DraggableItem 
            id={item.id} 
            type={item.type} 
            data={item}
            isRenaming={isRenaming}
          >
            {itemContent}
          </DraggableItem>
        </DroppableFolder>
      );
    } else {
      // Documents are just draggable
      wrappedContent = (
        <DraggableItem 
          id={item.id} 
          type={item.type} 
          data={item}
          isRenaming={isRenaming}
        >
          {itemContent}
        </DraggableItem>
      );
    }

    return (
      <div key={item.id}>
        {wrappedContent}
        
        {/* Render children */}
        {isExpanded && hasChildren && (
          <div>
            {/* Render subfolders first */}
            {item.children && item.children.map(child => renderTreeItem(child, depth + 1, item.id))}
            {/* Then render documents */}
            {item.documents && item.documents.map(doc => renderTreeItem(doc, depth + 1, item.id))}
          </div>
        )}
      </div>
    );
  };

  // Removed flattened items - no longer needed for hierarchical drag and drop

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className={`bg-gradient-to-br from-dark-primary to-dark-lighter h-full flex flex-col ${className} ml-2 mr-2 rounded-2xl shadow-2xl overflow-hidden w-[80px] max-w-[80px]`}>
        <div className="px-4 py-3">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 hover:bg-surface-1/50 rounded-xl transition-all duration-200 hover:scale-105 group"
            title="Expand sidebar (Ctrl+B)"
          >
            <ChevronRight size={20} className="text-text-secondary mx-auto" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={containerRef}
        className={`bg-gradient-to-br from-dark-primary to-dark-lighter h-full flex flex-col ${className} overflow-hidden relative shadow-2xl w-full max-w-[280px]`}
        style={{ isolation: 'isolate' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-1/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="p-2 hover:bg-surface-1/50 rounded-xl transition-all duration-200 hover:scale-105 group"
              title="Collapse sidebar (Ctrl+B)"
            >
              <ChevronLeft size={20} className="text-text-secondary group-hover:text-text-primary" />
            </button>
            <h3 className="text-xs font-semibold text-text-secondary/80 uppercase tracking-wider">
              Explorer
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => createNewDocument(null)}
              className="p-1 hover:bg-surface-1/50 rounded-lg transition-all duration-200 hover:scale-105"
              title="New document"
            >
              <FilePlus size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={() => createNewFolder(null)}
              className="p-1 hover:bg-surface-1/50 rounded-lg transition-all duration-200 hover:scale-105"
              title="New folder"
            >
              <FolderPlus size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={() => setExpandedItems(new Set())}
              className="p-1 hover:bg-surface-1/50 rounded-lg transition-all duration-200 hover:scale-105"
              title="Collapse all"
            >
              <ChevronDown size={14} className="text-text-secondary" />
            </button>
          </div>
        </div>


        {/* File tree */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin min-h-0"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y'
          }}
          onWheel={(e) => {
            const container = e.currentTarget;
            const canScroll = container.scrollHeight > container.clientHeight;
            const atTop = container.scrollTop === 0;
            const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight;
            
            // Only stop propagation if we can handle the scroll
            if (canScroll && !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) {
              e.stopPropagation();
            }
          }}
        >
          {/* Root droppable area */}
          <DroppableFolder id="root">
            <div 
              className="min-h-full"
              onContextMenu={(e) => {
                // Only trigger if clicking on empty space, not on items
                if (e.target === e.currentTarget || e.target.closest('.min-h-full') === e.currentTarget) {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    items: [
                      { label: 'New Document', icon: FilePlus, onClick: () => createNewDocument(null) },
                      { label: 'New Folder', icon: FolderPlus, onClick: () => createNewFolder(null) }
                    ]
                  });
                }
              }}
            >
              {folderStructure.map(item => renderTreeItem(item))}
            </div>
          </DroppableFolder>
        </div>

        {/* Drag overlay */}
        <DragOverlay
          modifiers={[snapCenterToCursor]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {draggedItem ? (
            <div className="bg-gradient-to-br from-dark-primary to-dark-lighter text-text-primary px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-accent-green/20">
              {draggedItem.type === 'folder' ? (
                <Folder size={14} className="text-accent-green" />
              ) : (
                <FileText size={14} className="text-text-secondary" />
              )}
              <span className="text-sm">{draggedItem.name || 'Moving...'}</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </DndContext>
  );
}