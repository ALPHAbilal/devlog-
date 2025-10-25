import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useFolders } from '../../hooks/useFolders';
import { useProjectStructure } from '../../hooks/useBatchLoader';
import { useToast } from '../../hooks/useToast';
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
function DroppableFolder({ id, children }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: id,
    data: { type: 'folder' }
  });

  const canDrop = active && active.id !== id;

  return (
    <div
      ref={setNodeRef}
      className={`
        ${isOver && canDrop ? 'ring-1 ring-emerald-400/50 bg-emerald-400/5 rounded-lg' : ''}
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

// Recursive folder tree item component
function FolderTreeItem({
  item,
  isExpanded,
  onToggle,
  expandedFolders,
  depth = 0,
  isFavorite = false,
  onContextMenu,
  onRename,
  selectedDocumentId,
  onDocumentSelect,
  prefetchFolder,
  cancelPrefetch
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isFile = item.type === 'file' || item.type === 'document';
  const isActiveDocument = isFile && item.id === selectedDocumentId;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className="relative">
      {/* Tree guide lines */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent"
          style={{ left: `${(depth - 1) * 16 + 20}px` }}
        />
      )}

      <div
        className={`
          flex items-center gap-2 py-1.5 px-2 text-sm transition-all duration-200 group relative
          ${isFile ? 'text-white/60 hover:text-white/90' : 'text-white/70 hover:text-white/95'}
          ${!isFile ? 'cursor-pointer hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent rounded-lg' : 'cursor-pointer hover:bg-white/[0.03] rounded-lg'}
          ${isActiveDocument ? 'bg-emerald-400/10 text-emerald-400' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          if (!isFile) {
            onToggle(item.id);
          } else if (onDocumentSelect) {
            onDocumentSelect(item.data || item);
          }
        }}
        onMouseEnter={() => {
          if (!isFile && !expandedFolders.has(item.id) && prefetchFolder) {
            prefetchFolder(item.id);
          }
        }}
        onMouseLeave={() => {
          if (!isFile && cancelPrefetch) {
            cancelPrefetch(item.id);
          }
        }}
        onContextMenu={(e) => onContextMenu(e, item)}
      >
        {/* Chevron for folders with children */}
        {!isFile && hasChildren && (
          <ChevronRight
            className={`
              w-3.5 h-3.5 text-white/40 transition-all duration-300 flex-shrink-0
              ${isExpanded ? 'rotate-90 text-emerald-400/80' : 'group-hover:text-white/60'}
            `}
          />
        )}

        {/* Spacer for folders without children or files */}
        {(isFile || (!hasChildren && !isFile)) && (
          <div className="w-3.5 h-3.5 flex-shrink-0" />
        )}

        {/* Icon */}
        {isFile ? (
          <FileText className={`w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 ${
            isActiveDocument ? 'text-emerald-400' : 'text-white/30 group-hover:text-emerald-400/90'
          }`} />
        ) : isExpanded ? (
          <FolderOpen className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-all duration-200 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
        ) : (
          <Folder className={`
            w-4 h-4 flex-shrink-0 transition-all duration-200
            ${isFavorite
              ? 'text-amber-400/90 group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.2)]'
              : 'text-blue-400/80 group-hover:text-blue-300 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.2)]'
            }
          `} />
        )}

        {/* Name */}
        <span className={`
          flex-1 truncate transition-all duration-200 text-[13px]
          ${isFile ? 'group-hover:translate-x-0.5' : ''}
        `}>
          {item.name || item.title || 'Untitled'}
        </span>

        {/* Count badge */}
        {item.count !== undefined && item.count > 0 && (
          <span className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md group-hover:bg-emerald-500/10 group-hover:text-emerald-400/90 transition-all duration-200 flex-shrink-0 border border-white/5">
            {item.count}
          </span>
        )}

        {/* Three-dot menu */}
        <div className="relative">
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-all duration-200 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-white/40 hover:text-white/80" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 top-full mt-1 bg-[#1a2942]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl w-48 py-1 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              {!isFile && (
                <>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      // Create new folder
                      if (onContextMenu) {
                        onContextMenu({ preventDefault: () => {}, stopPropagation: () => {} }, { ...item, action: 'newFolder' });
                      }
                    }}
                  >
                    <FolderPlus className="w-4 h-4 text-blue-400" />
                    <span>New Folder</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 w-full text-left transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      // Create new document
                      if (onContextMenu) {
                        onContextMenu({ preventDefault: () => {}, stopPropagation: () => {} }, { ...item, action: 'newFile' });
                      }
                    }}
                  >
                    <FilePlus className="w-4 h-4 text-emerald-400" />
                    <span>New Document</span>
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                </>
              )}
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 w-full text-left transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  // Delete item
                  if (onContextMenu) {
                    onContextMenu({ preventDefault: () => {}, stopPropagation: () => {} }, { ...item, action: 'delete' });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Hover indicator line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-full group-hover:h-4 transition-all duration-200 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </div>

      {/* Render children recursively */}
      {!isFile && isExpanded && hasChildren && (
        <div className="overflow-hidden animate-in slide-in-from-top-1 duration-200">
          <div className="space-y-0.5 py-0.5">
            {item.children.map((child, index) => (
              <FolderTreeItem
                key={child.id}
                item={child}
                isExpanded={expandedFolders.has(child.id)}
                onToggle={onToggle}
                expandedFolders={expandedFolders}
                depth={depth + 1}
                isFavorite={false}
                onContextMenu={onContextMenu}
                onRename={onRename}
                selectedDocumentId={selectedDocumentId}
                onDocumentSelect={onDocumentSelect}
                prefetchFolder={prefetchFolder}
                cancelPrefetch={cancelPrefetch}
              />
            ))}
          </div>
        </div>
      )}
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
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [explorerExpanded, setExplorerExpanded] = useState(true);

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

  // Auto-expand folders for selected document
  useEffect(() => {
    if (!selectedDocumentId || !documents.length) return;

    const selectedDoc = documents.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) return;

    setSelectedItemId(selectedDocumentId);

    if (selectedDoc.folder_id) {
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

      if (folderPath.length > 0) {
        setExpandedItems(prev => {
          const newExpanded = new Set(prev);
          folderPath.forEach(folderId => newExpanded.add(folderId));
          return newExpanded;
        });
      }
    }
  }, [selectedDocumentId, documents, folders]);

  // Build folder structure with documents
  const folderStructure = useMemo(() => {
    const addDocumentsToFolder = (folder) => {
      const folderDocuments = documents.filter(doc => doc.folder_id === folder.id);
      return {
        ...folder,
        type: 'folder',
        name: folder.name,
        documents: folderDocuments.map(doc => ({
          id: doc.id,
          name: doc.title || 'Untitled',
          title: doc.title || 'Untitled',
          type: 'document',
          data: doc
        })),
        children: folder.children ? folder.children.map(addDocumentsToFolder) : [],
        count: folderDocuments.length
      };
    };

    const rootFolders = folders
      .filter(folder => !folder.parent_id && folder.name !== 'FOLDERS')
      .map(addDocumentsToFolder);

    const rootDocuments = documents.filter(doc => !doc.folder_id).map(doc => ({
      id: doc.id,
      name: doc.title || 'Untitled',
      title: doc.title || 'Untitled',
      type: 'document',
      data: doc
    }));

    // Combine folders with their documents as children
    const foldersWithDocs = rootFolders.map(folder => ({
      ...folder,
      children: [...(folder.children || []), ...(folder.documents || [])]
    }));

    return [...foldersWithDocs, ...rootDocuments].sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [folders, documents]);

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
  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.action === 'newFolder') {
      createNewFolder(item.id);
    } else if (item.action === 'newFile') {
      createNewDocument(item.id);
    } else if (item.action === 'delete') {
      deleteItem(item);
    }
    // Context menu actions handled via the dropdown menu in the UI
  }, []);

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

  // Delete item
  const deleteItem = useCallback(async (item) => {
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
      return;
    }

    const targetItem = findItemInStructure(folderStructure, over.id);

    if (targetItem && targetItem.type === 'folder' && !expandedItems.has(over.id)) {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(() => {
        setExpandedItems(prev => new Set([...prev, over.id]));
        hoverTimerRef.current = null;
      }, 700);
    }
  }, [folderStructure, expandedItems, findItemInStructure]);

  const handleDragEnd = useCallback(async (event) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

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

  // Collapsed sidebar
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "db-glass db-bento-container",
          "w-db-sidebar-collapsed h-full",
          "border-db-glass-border",
          "transition-all duration-300 ease-in-out",
          "m-4 rounded-db-xl flex flex-col relative overflow-hidden"
        )}
        style={{
          background: 'var(--db-glass-bg)',
          backdropFilter: 'blur(var(--db-glass-blur))',
        }}
      >
        <div className="px-2 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "w-full h-11 p-0",
              "text-db-text-secondary hover:text-db-emerald",
              "hover:bg-db-emerald/10",
              "transition-all duration-200",
              "rounded-db-md relative group",
              "flex items-center justify-center"
            )}
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-db-emerald rounded-full group-hover:h-8 transition-all duration-200" />
          </button>
        </div>

        <div className="h-px bg-white/10 mx-4 mb-2" />

        <div className="flex-1 mt-1 flex flex-col">
          <div className="px-2 space-y-1">
            {folderStructure.slice(0, 6).map((folder) => folder.type === 'folder' && (
              <div
                key={folder.id}
                className={cn(
                  "flex items-center justify-center p-3",
                  "text-db-text-secondary hover:text-db-emerald",
                  "hover:bg-db-emerald/10",
                  "rounded-db-md cursor-pointer",
                  "transition-all duration-200 group relative"
                )}
                title={folder.name}
              >
                <Folder className="w-5 h-5" />
                {folder.count > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-db-emerald text-white text-[10px] rounded-full flex items-center justify-center px-1 shadow-lg">
                    {folder.count}
                  </div>
                )}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-db-emerald rounded-full group-hover:h-8 transition-all duration-200" />
              </div>
            ))}
          </div>

          {folderStructure.filter(f => f.type === 'folder').length > 6 && (
            <div className="px-2 mt-2 flex items-center justify-center p-2 text-db-text-muted text-xs">
              +{folderStructure.filter(f => f.type === 'folder').length - 6}
            </div>
          )}
        </div>

        <div className="h-3 flex-shrink-0" />
      </div>
    );
  }

  // Expanded sidebar
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "db-glass db-bento-container",
          "w-db-sidebar-expanded h-full",
          "border-db-glass-border",
          "transition-all duration-300 ease-in-out",
          "m-4 rounded-db-xl flex flex-col relative overflow-hidden"
        )}
        style={{
          background: 'var(--db-glass-bg)',
          backdropFilter: 'blur(var(--db-glass-blur))',
        }}
      >
        {/* Collapse Button */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className={cn(
              "w-full h-10 px-3",
              "text-db-text-secondary hover:text-db-text-primary",
              "hover:bg-db-emerald/10",
              "transition-all duration-200",
              "rounded-db-md",
              "flex items-center justify-center gap-2"
            )}
          >
            <PanelLeftClose className="w-4 h-4" />
            <span className="text-xs">Collapse</span>
          </button>
        </div>

        <div className="h-px bg-white/10 mx-4 mb-3" />

        {/* All Folders Section */}
        <div className="flex-1 px-4 min-h-0 flex flex-col pb-4">
          <button
            onClick={() => setExplorerExpanded(!explorerExpanded)}
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "text-db-text-secondary hover:text-db-text-primary",
              "text-xs transition-colors w-full group",
              "rounded-db-sm hover:bg-db-emerald/5 flex-shrink-0"
            )}
          >
            {explorerExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 transition-transform" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 transition-transform" />
            )}
            <span className="uppercase tracking-wider">All Folders</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-db-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                {folderStructure.filter(f => f.type === 'folder').length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  createNewFolder(null);
                }}
                className={cn(
                  "opacity-0 group-hover:opacity-100",
                  "hover:bg-db-emerald/20 rounded p-1",
                  "transition-all duration-200 hover:scale-110"
                )}
                title="New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5 text-db-emerald hover:text-db-emerald-light" />
              </button>
            </div>
          </button>

          {explorerExpanded && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-2 sidebar-scroll">
              <DroppableFolder id="root">
                <div className="space-y-0.5 pr-2 pb-4">
                  {foldersLoading ? (
                    <>
                      <div className="h-8 bg-white/5 rounded animate-pulse" />
                      <div className="h-8 bg-white/5 rounded animate-pulse" />
                      <div className="h-8 bg-white/5 rounded animate-pulse" />
                    </>
                  ) : (
                    folderStructure.map((item) => (
                      <DraggableItem
                        key={item.id}
                        id={item.id}
                        type={item.type}
                        data={item}
                        isRenaming={renamingId === item.id}
                      >
                        <FolderTreeItem
                          item={item}
                          isExpanded={expandedItems.has(item.id)}
                          onToggle={toggleExpanded}
                          expandedFolders={expandedItems}
                          depth={0}
                          isFavorite={false}
                          onContextMenu={handleContextMenu}
                          selectedDocumentId={selectedDocumentId}
                          onDocumentSelect={onDocumentSelect}
                          prefetchFolder={prefetchFolder}
                          cancelPrefetch={cancelPrefetch}
                        />
                      </DraggableItem>
                    ))
                  )}
                </div>
              </DroppableFolder>
            </div>
          )}
        </div>

        <div className="h-4 flex-shrink-0" />
      </div>

      {/* Drag overlay */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {draggedItem ? (
          <div className="bg-[#1a2942]/95 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-emerald-400/20">
            {draggedItem.type === 'folder' ? (
              <Folder className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileText className="w-4 h-4 text-white/60" />
            )}
            <span className="text-sm">{draggedItem.name || 'Moving...'}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}