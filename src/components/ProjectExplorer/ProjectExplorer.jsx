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
import { useToast } from '../../hooks/useToast';
import { useFolders } from '../../hooks/useFolders';
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
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Droppable folder component
function DroppableFolder({ id, children, isActive }) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type: 'folder' }
  });
  
  return (
    <div 
      ref={setNodeRef}
      className={`
        ${isOver ? 'ring-2 ring-accent-green/50 bg-accent-green/10 rounded-md' : ''}
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
  isCollapsed = false
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set(['root']));
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [isRenaming, setIsRenaming] = useState(false);
  
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
    
    // Root folder structure
    const rootStructure = {
      id: 'root',
      name: 'FOLDERS',
      type: 'root',
      children: folders.map(addDocumentsToFolder),
      documents: documents.filter(doc => !doc.folder_id).map(doc => ({
        id: doc.id,
        name: doc.title || 'Untitled',
        type: 'document',
        data: doc
      }))
    };
    
    return rootStructure;
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
    
    if (item.type === 'folder' || item.type === 'root') {
      menuItems.push(
        { label: 'New Folder', icon: FolderPlus, onClick: () => createNewFolder(item.id) },
        { label: 'New File', icon: FilePlus, onClick: () => createNewDocument(item.id) },
        { divider: true }
      );
    }
    
    if (item.type !== 'root') {
      menuItems.push(
        { label: 'Rename', icon: Edit2, onClick: () => startRenaming(item) },
        { label: 'Delete', icon: Trash2, onClick: () => deleteItem(item, parentId), danger: true }
      );
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: menuItems
    });
  }, []);

  // Create new folder
  const createNewFolder = useCallback(async (parentId) => {
    const folderName = 'New Folder';
    const actualParentId = parentId === 'root' ? null : parentId;
    
    const newFolder = await createFolderInDB(folderName, actualParentId);
    if (newFolder) {
      setExpandedItems(prev => new Set([...prev, parentId]));
      setRenamingId(newFolder.id);
      setRenamingValue(folderName);
    }
  }, [createFolderInDB]);

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
    
    setIsRenaming(true);
    try {
      await updateFolder(renamingId, { name: renamingValue.trim() });
    } finally {
      setIsRenaming(false);
      setRenamingId(null);
      setSelectedItemId(null); // Clear selection after rename
    }
  }, [renamingId, renamingValue, updateFolder, isRenaming]);

  // Delete item
  const deleteItem = useCallback(async (item, parentId) => {
    if (item.type === 'folder') {
      await deleteFolderFromDB(item.id);
    }
    // For documents, we'll need to add a delete document function
  }, [deleteFolderFromDB]);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    
    // Find the item being dragged to get its name
    const findItem = (node, id) => {
      if (node.id === id) return node;
      if (node.documents) {
        const doc = node.documents.find(d => d.id === id);
        if (doc) return doc;
      }
      if (node.children) {
        for (const child of node.children) {
          const result = findItem(child, id);
          if (result) return result;
        }
      }
      return null;
    };
    
    const item = findItem(folderStructure, active.id);
    setDraggedItem(item);
  }, [folderStructure]);

  // Handle drag end
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedItem(null);
      return;
    }
    
    // Find the dragged item and target
    const findItem = (node, id) => {
      if (node.id === id) return node;
      if (node.documents) {
        const doc = node.documents.find(d => d.id === id);
        if (doc) return doc;
      }
      if (node.children) {
        for (const child of node.children) {
          const result = findItem(child, id);
          if (result) return result;
        }
      }
      return null;
    };
    
    const draggedItem = findItem(folderStructure, active.id);
    const targetItem = findItem(folderStructure, over.id);
    
    if (!draggedItem || !targetItem) {
      setDraggedItem(null);
      return;
    }
    
    // Handle document to folder drop
    if (draggedItem.type === 'document' && (targetItem.type === 'folder' || targetItem.type === 'root')) {
      const targetFolderId = targetItem.type === 'root' ? null : targetItem.id;
      await moveDocumentToFolder(draggedItem.id, targetFolderId);
      if (onDocumentMove) {
        onDocumentMove(draggedItem.id, targetFolderId);
      }
    }
    // Handle folder to folder drop
    else if (draggedItem.type === 'folder' && (targetItem.type === 'folder' || targetItem.type === 'root')) {
      const targetFolderId = targetItem.type === 'root' ? null : targetItem.id;
      await moveFolder(draggedItem.id, targetFolderId);
    }
    
    setDraggedItem(null);
  }, [folderStructure, moveDocumentToFolder, moveFolder, onDocumentMove]);
  
  // Create new document in folder
  const createNewDocument = useCallback((folderId) => {
    const actualFolderId = folderId === 'root' ? null : folderId;
    if (onDocumentSelect) {
      onDocumentSelect({ action: 'create', folderId: actualFolderId });
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
    const isRoot = item.type === 'root';
    
    const itemContent = (
      <div
        className={`
          group flex items-center justify-between py-1 px-2
          rounded-md transition-all duration-150
          ${isSelected ? 'bg-dark-secondary/40' : 'hover:bg-dark-secondary/20'}
          ${depth === 0 && !isRoot ? 'mt-0.5' : ''}
          ${isRenaming && isRenaming ? 'pointer-events-none' : 'cursor-pointer'}
        `}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
        onClick={() => {
          if (item.type === 'folder' || item.type === 'root') {
            toggleExpanded(item.id);
          } else if (item.type === 'document') {
            onDocumentSelect?.(item.data);
          }
          setSelectedItemId(item.id);
        }}
        onContextMenu={(e) => handleContextMenu(e, item, parentId)}
      >
        <div className="flex items-center gap-1 min-w-0">
          {/* Chevron for expandable items */}
          {(hasChildren || item.type === 'folder' || item.type === 'root') && (
            <ChevronRight 
              size={12} 
              className={`
                text-text-secondary/60 transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}
              `}
            />
          )}
          {!hasChildren && item.type !== 'folder' && item.type !== 'root' && (
            <div className="w-3" />
          )}
          
          {/* Icon */}
          {item.type === 'folder' || item.type === 'root' ? (
            isExpanded ? (
              <FolderOpen size={14} className="text-accent-green flex-shrink-0" />
            ) : (
              <Folder size={14} className="text-text-secondary flex-shrink-0" />
            )
          ) : (
            <FileText size={14} className="text-text-secondary flex-shrink-0" />
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
              className="flex-1 max-w-[200px] bg-dark-primary text-text-primary text-sm px-1 py-0 rounded
                       border border-accent-green/50 focus:outline-none focus:border-accent-green
                       focus:ring-0 focus:bg-dark-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <span className={`
              text-sm truncate flex-1
              ${isRoot ? 'font-semibold text-text-secondary/80 uppercase tracking-wider text-xs' : ''}
              ${isSelected ? 'text-text-primary' : 'text-text-secondary'}
              group-hover:text-text-primary
            `}>
              {item.name}
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        {!isRoot && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {(item.type === 'folder' || item.type === 'root') && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    createNewFolder(item.id);
                  }}
                  className="p-0.5 hover:bg-dark-secondary/40 rounded"
                  title="New folder"
                >
                  <FolderPlus size={12} className="text-text-secondary" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item, parentId);
                  }}
                  className="p-0.5 hover:bg-dark-secondary/40 rounded"
                  title="More options"
                >
                  <MoreVertical size={12} className="text-text-secondary" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );

    // Wrap the content based on type
    let wrappedContent;
    if (item.type === 'root' || item.type === 'folder') {
      // Folders are droppable
      wrappedContent = (
        <DroppableFolder id={item.id}>
          {item.type === 'root' ? (
            itemContent
          ) : (
            <DraggableItem 
              id={item.id} 
              type={item.type} 
              data={item}
              isRenaming={isRenaming}
            >
              {itemContent}
            </DraggableItem>
          )}
        </DroppableFolder>
      );
    } else {
      // Documents are just sortable
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
            {/* Render documents first */}
            {item.documents && item.documents.map(doc => renderTreeItem(doc, depth + 1, item.id))}
            {/* Then render subfolders */}
            {item.children && item.children.map(child => renderTreeItem(child, depth + 1, item.id))}
          </div>
        )}
      </div>
    );
  };

  // Removed flattened items - no longer needed for hierarchical drag and drop

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className={`bg-[#1e1e1e] rounded-lg ${height} flex flex-col ${className} border border-dark-secondary/30 overflow-hidden my-8`}>
        <div className="flex flex-col items-center py-4 gap-4">
          <Folder size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
          <FileText size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
          <Search size={20} className="text-text-secondary hover:text-accent-green cursor-pointer" />
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={containerRef}
        className={`bg-[#1e1e1e] rounded-lg ${height} flex flex-col ${className} border border-dark-secondary/30 overflow-hidden relative my-8`}
        style={{ isolation: 'isolate' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-dark-secondary/20">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-text-secondary/80 uppercase tracking-wider">
              Explorer
            </h3>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => createNewFolder('root')}
              className="p-1 hover:bg-dark-secondary/30 rounded transition-all"
              title="New folder"
            >
              <FolderPlus size={14} className="text-text-secondary" />
            </button>
            <button
              onClick={() => setExpandedItems(new Set(['root']))}
              className="p-1 hover:bg-dark-secondary/30 rounded transition-all"
              title="Collapse all"
            >
              <ChevronDown size={14} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-dark-secondary/20">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files..."
              className="w-full pl-7 pr-2 py-1 bg-dark-secondary/20 text-text-primary text-sm
                       rounded border border-dark-secondary/30 focus:border-accent-green/50
                       focus:outline-none placeholder-text-secondary/40"
            />
          </div>
        </div>

        {/* File tree */}
        <div 
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
          <div className="min-h-full">
            {renderTreeItem(folderStructure)}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggedItem ? (
            <div className="bg-dark-secondary/90 text-text-primary px-2 py-1 rounded shadow-lg flex items-center gap-2">
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