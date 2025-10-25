import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  FolderPlus,
  FilePlus
} from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import { useProjectStructure } from '../../hooks/useBatchLoader';
import { useToast } from '../../hooks/useToast';
import ContextMenu from './ContextMenu';
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
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import '../../styles/project-explorer-v2.css';

// Droppable folder component
function DroppableFolder({ id, children, isActive }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: id,
    data: { type: 'folder' }
  });

  const canDrop = active && active.id !== id;

  return (
    <div
      ref={setNodeRef}
      className={`
        ${isOver && canDrop ? 'sidebar-v2-drop-active' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
}

// Draggable item component
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

export default function ProjectExplorerV2({
  onDocumentSelect,
  selectedDocumentId,
  documents = [],
  onDocumentMove,
  onDocumentDelete,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  height = 'h-full'
}) {
  // State management
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  const scrollContainerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const { showToast } = useToast();

  // Use folders hook
  const {
    folders,
    loading: foldersLoading,
    createFolder: createFolderInDB,
    updateFolder,
    deleteFolder: deleteFolderFromDB,
    moveFolder,
    moveDocumentToFolder
  } = useFolders();

  // Use project structure for prefetching
  const {
    prefetchFolder,
    cancelPrefetch
  } = useProjectStructure();

  // DnD sensors
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

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('devlog_favorites');
    if (saved) {
      try {
        setFavoriteIds(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((favorites) => {
    localStorage.setItem('devlog_favorites', JSON.stringify([...favorites]));
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((itemId) => {
    setFavoriteIds(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // Build folder structure with documents
  const folderStructure = useMemo(() => {
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

    const rootFolders = folders
      .filter(folder => !folder.parent_id && folder.name !== 'FOLDERS')
      .map(addDocumentsToFolder);

    const rootDocuments = documents.filter(doc => !doc.folder_id).map(doc => ({
      id: doc.id,
      name: doc.title || 'Untitled',
      type: 'document',
      data: doc
    }));

    return [...rootFolders, ...rootDocuments].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [folders, documents]);

  // Get favorite items
  const favoriteItems = useMemo(() => {
    const favoriteFolders = folders.filter(f => favoriteIds.has(f.id)).map(folder => ({
      ...folder,
      type: 'folder',
      name: folder.name
    }));
    const favoriteDocuments = documents.filter(d => favoriteIds.has(d.id)).map(doc => ({
      ...doc,
      type: 'document',
      name: doc.title || 'Untitled'
    }));
    return [...favoriteFolders, ...favoriteDocuments];
  }, [folders, documents, favoriteIds]);

  // Toggle folder expansion
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

    const isFavorite = favoriteIds.has(item.id);
    const menuItems = [];

    // Add favorite toggle
    menuItems.push({
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      icon: Star,
      onClick: () => toggleFavorite(item.id),
      className: isFavorite ? 'text-yellow-400' : ''
    });

    menuItems.push({ divider: true });

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
  }, [favoriteIds, toggleFavorite]);

  // Create new folder
  const createNewFolder = useCallback(async (parentId) => {
    const siblings = folders.filter(f => f.parent_id === parentId);
    let baseName = 'New Folder';
    let folderName = baseName;
    let counter = 2;

    while (siblings.some(folder => folder.name === folderName)) {
      folderName = `${baseName} (${counter})`;
      counter++;
    }

    const newFolder = await createFolderInDB(folderName, parentId);
    if (newFolder) {
      if (parentId) {
        setExpandedItems(prev => new Set([...prev, parentId]));
      }
      setRenamingId(newFolder.id);
      setRenamingValue(folderName);
    }
  }, [createFolderInDB, folders]);

  // Create new document
  const createNewDocument = useCallback((folderId) => {
    if (onDocumentSelect) {
      onDocumentSelect({ action: 'create', folderId: folderId });
    }
  }, [onDocumentSelect]);

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
    } catch (error) {
      if (error.message?.includes('unique_folder_name_per_parent')) {
        showToast('A folder with this name already exists at this level', 'error');
      }
    } finally {
      setIsRenaming(false);
      setRenamingId(null);
      setSelectedItemId(null);
    }
  }, [renamingId, renamingValue, updateFolder, isRenaming, showToast]);

  // Delete item
  const deleteItem = useCallback(async (item, parentId) => {
    if (item.type === 'folder') {
      await deleteFolderFromDB(item.id);
    } else if (item.type === 'document' && onDocumentDelete) {
      await onDocumentDelete(item.data || item);
    }
  }, [deleteFolderFromDB, onDocumentDelete]);

  // Find item in structure
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

  // Handle drag events
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const item = findItemInStructure(folderStructure, active.id);
    setDraggedItem(item);
  }, [folderStructure, findItemInStructure]);

  const handleDragOver = useCallback((event) => {
    const { over, active } = event;

    if (!over || !active) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setDragOverFolderId(null);
      return;
    }

    if (over.id !== dragOverFolderId) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      setDragOverFolderId(over.id);

      const targetItem = findItemInStructure(folderStructure, over.id);

      if (targetItem && targetItem.type === 'folder' && !expandedItems.has(over.id)) {
        hoverTimerRef.current = setTimeout(() => {
          setExpandedItems(prev => new Set([...prev, over.id]));
          hoverTimerRef.current = null;
        }, 700);
      }
    }
  }, [dragOverFolderId, folderStructure, expandedItems, findItemInStructure]);

  const handleDragEnd = useCallback(async (event) => {
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

    const draggedItem = findItemInStructure(folderStructure, active.id);
    if (!draggedItem) {
      setDraggedItem(null);
      return;
    }

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
      const targetItem = findItemInStructure(folderStructure, over.id);
      if (!targetItem) {
        setDraggedItem(null);
        return;
      }

      if (draggedItem.type === 'document' && targetItem.type === 'folder') {
        await moveDocumentToFolder(draggedItem.id, targetItem.id);
        if (onDocumentMove) {
          onDocumentMove(draggedItem.id, targetItem.id);
        }
      } else if (draggedItem.type === 'folder' && targetItem.type === 'folder') {
        await moveFolder(draggedItem.id, targetItem.id);
      }
    }

    setDraggedItem(null);
  }, [folderStructure, moveDocumentToFolder, moveFolder, onDocumentMove, findItemInStructure]);

  // Render favorite item
  const renderFavoriteItem = (item) => {
    const isActiveDocument = item.type === 'document' && item.id === selectedDocumentId;

    return (
      <div
        key={item.id}
        className={`sidebar-v2-item ${isActiveDocument ? 'active' : ''}`}
        onClick={() => {
          if (item.type === 'document') {
            onDocumentSelect?.(item.data || item);
          }
          setSelectedItemId(item.id);
        }}
        onContextMenu={(e) => handleContextMenu(e, item)}
      >
        <div className="sidebar-v2-item-icon">
          {item.type === 'folder' ? (
            <Folder size={14} className="text-amber-400" />
          ) : (
            <FileText size={14} className={isActiveDocument ? 'text-accent-green' : ''} />
          )}
        </div>
        <span className="sidebar-v2-item-text">{item.name}</span>
        <Star size={12} className="text-amber-400" />
      </div>
    );
  };

  // Render tree item
  const renderTreeItem = (item, depth = 0, parentId = null) => {
    const isExpanded = expandedItems.has(item.id);
    const isSelected = selectedItemId === item.id;
    const isRenaming = renamingId === item.id;
    const hasChildren = (item.children && item.children.length > 0) || (item.documents && item.documents.length > 0);
    const isActiveDocument = item.type === 'document' && item.id === selectedDocumentId;
    const isFavorite = favoriteIds.has(item.id);
    const documentCount = item.documents ? item.documents.length : 0;

    const itemContent = (
      <div
        data-document-id={item.type === 'document' ? item.id : undefined}
        className={`sidebar-v2-item ${isActiveDocument ? 'active' : ''} ${isSelected && !isActiveDocument ? 'selected' : ''}`}
        style={{ paddingLeft: `${(depth * 16) + 12}px` }}
        onClick={() => {
          if (item.type === 'folder') {
            toggleExpanded(item.id);
          } else if (item.type === 'document') {
            onDocumentSelect?.(item.data);
          }
          setSelectedItemId(item.id);
        }}
        onMouseEnter={() => {
          if (item.type === 'folder' && !expandedItems.has(item.id)) {
            prefetchFolder(item.id);
          }
        }}
        onMouseLeave={() => {
          if (item.type === 'folder') {
            cancelPrefetch(item.id);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, item, parentId)}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {(hasChildren || item.type === 'folder') && (
            <ChevronRight
              size={12}
              className={`sidebar-v2-chevron ${isExpanded ? 'expanded' : ''}`}
            />
          )}
          {!hasChildren && item.type !== 'folder' && (
            <div className="w-3" />
          )}

          <div className="sidebar-v2-item-icon">
            {item.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen size={14} className="text-accent-green" />
              ) : (
                <Folder size={14} />
              )
            ) : (
              <FileText size={14} className={isActiveDocument ? 'text-accent-green' : ''} />
            )}
          </div>

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
              className="sidebar-v2-rename-input"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <>
              <span className="sidebar-v2-item-text" title={item.name}>
                {item.name}
              </span>
              {isFavorite && <Star size={10} className="text-amber-400 ml-auto" />}
              {item.type === 'folder' && documentCount > 0 && (
                <span className="sidebar-v2-item-count">{documentCount}</span>
              )}
            </>
          )}
        </div>

        <div className="sidebar-v2-item-actions">
          {item.type === 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                createNewFolder(item.id);
              }}
              className="sidebar-v2-action-btn"
              title="New folder"
            >
              <FolderPlus size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, item, parentId);
            }}
            className="sidebar-v2-action-btn"
            title="More options"
          >
            <MoreVertical size={12} />
          </button>
        </div>
      </div>
    );

    let wrappedContent;
    if (item.type === 'folder') {
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
        {isExpanded && hasChildren && (
          <div className="sidebar-v2-children expanded">
            {item.children && item.children.map(child => renderTreeItem(child, depth + 1, item.id))}
            {item.documents && item.documents.map(doc => renderTreeItem(doc, depth + 1, item.id))}
          </div>
        )}
      </div>
    );
  };

  // Render loading skeleton
  const FolderSkeleton = () => (
    <div className="sidebar-v2-skeleton">
      <div className="sidebar-v2-skeleton-item">
        <div className="skeleton-icon" />
        <div className="skeleton-text" />
      </div>
    </div>
  );

  // Collapsed view
  if (isCollapsed) {
    return (
      <div className="sidebar-v2-container sidebar-v2-collapsed">
        <div className="sidebar-v2-header-collapsed">
          <button
            onClick={onToggleCollapse}
            className="sidebar-v2-toggle-btn"
            title="Expand sidebar (Ctrl+B)"
          >
            <ChevronRight size={20} />
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
      <div className={`sidebar-v2-container ${className}`}>
        {/* Header */}
        <div className="sidebar-v2-header">
          <button
            onClick={onToggleCollapse}
            className="sidebar-v2-toggle-btn"
            title="Collapse sidebar (Ctrl+B)"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="sidebar-v2-title">Explorer</h3>
          <div className="sidebar-v2-header-actions">
            <button
              onClick={() => createNewDocument(null)}
              className="sidebar-v2-action-btn"
              title="New document"
            >
              <FilePlus size={14} />
            </button>
            <button
              onClick={() => createNewFolder(null)}
              className="sidebar-v2-action-btn"
              title="New folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <div className="sidebar-v2-section">
            <div className="sidebar-v2-section-header">
              <span>Favorites</span>
            </div>
            <div className="sidebar-v2-items">
              {favoriteItems.map(item => renderFavoriteItem(item))}
            </div>
          </div>
        )}

        {/* All Folders Section */}
        <div className="sidebar-v2-section">
          <div className="sidebar-v2-section-header">
            <span>All Folders</span>
          </div>
          <div
            ref={scrollContainerRef}
            className="sidebar-v2-scroll-container"
            onWheel={(e) => {
              const container = e.currentTarget;
              const canScroll = container.scrollHeight > container.clientHeight;
              const atTop = container.scrollTop === 0;
              const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight;

              if (canScroll && !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) {
                e.stopPropagation();
              }
            }}
          >
            <DroppableFolder id="root">
              <div className="sidebar-v2-items">
                {foldersLoading ? (
                  <>
                    <FolderSkeleton />
                    <FolderSkeleton />
                    <FolderSkeleton />
                  </>
                ) : (
                  folderStructure.map(item => renderTreeItem(item))
                )}
              </div>
            </DroppableFolder>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {draggedItem ? (
            <div className="sidebar-v2-drag-preview">
              {draggedItem.type === 'folder' ? (
                <Folder size={14} />
              ) : (
                <FileText size={14} />
              )}
              <span>{draggedItem.name || 'Moving...'}</span>
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
    </DndContext>
  );
}