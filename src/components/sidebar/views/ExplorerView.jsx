import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FolderPlus, FilePlus, LayoutList, TreePine, ChevronDown, Folder as FolderIcon, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import SidebarTreeItemEnhanced from '../SidebarTreeItemEnhanced';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// Droppable root area component
function DroppableRoot({ children }) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: 'root',
    data: { type: 'root' }
  });

  const canDrop = active !== null;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-full transition-all duration-200 ${
        isOver && canDrop ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20 ring-inset rounded-lg' : ''
      }`}
    >
      {children}
    </div>
  );
}

const VIEW_MODES = {
  TREE: 'tree',
  COMPACT: 'compact',
};

export function ExplorerView({
  folders,
  documents,
  activeDocumentId,
  recentlyCreatedFolderId,
  onOpenDocument,
  onCreateFolder,
  onCreateDocument,
  onDeleteItem,
  onToggleFavorite,
  onRename,
  onRefresh,
  isLoading = false,
  onMoveDocument,
  onMoveFolder,
  targetFolderId,
  onTargetFolderReached,
}) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.TREE);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [highlightedFolderId, setHighlightedFolderId] = useState(null);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);
  const hoverTimerRef = useRef(null);
  const targetFolderRef = useRef(null);

  // Add sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px minimum before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Handle target folder navigation from search
  useEffect(() => {
    if (!targetFolderId || !folders || folders.length === 0) return;

    // Build a map of folder id -> folder for quick lookup
    const folderMap = new Map();
    const buildFolderMap = (folderList) => {
      for (const folder of folderList) {
        folderMap.set(folder.id, folder);
        if (folder.children?.length) {
          buildFolderMap(folder.children);
        }
      }
    };
    buildFolderMap(folders);

    // Find the path to the target folder (all parent IDs)
    const findPath = (folderId) => {
      const path = [];
      let current = folderMap.get(folderId);
      while (current) {
        path.unshift(current.id);
        current = current.parent_id ? folderMap.get(current.parent_id) : null;
      }
      return path;
    };

    const pathToTarget = findPath(targetFolderId);

    if (pathToTarget.length > 0) {
      // Expand all folders in the path (except the target itself)
      setExpandedFolders(prev => {
        const next = new Set(prev);
        pathToTarget.forEach(id => next.add(id));
        return next;
      });

      // Highlight the target folder
      setHighlightedFolderId(targetFolderId);

      // Scroll to the target folder after a short delay (to allow expansion)
      setTimeout(() => {
        if (targetFolderRef.current) {
          targetFolderRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedFolderId(null);
      }, 2000);

      // Notify parent that we've reached the target
      onTargetFolderReached?.();
    }
  }, [targetFolderId, folders, onTargetFolderReached]);

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

  // Build tree structure from folders and documents - RECURSIVE to handle any depth
  const treeData = useMemo(() => {
    // DEBUG: Log what ExplorerView receives
    console.log('[EXPLORER-DEBUG] Building treeData:', {
      foldersCount: folders?.length || 0,
      documentsCount: documents?.length || 0,
      firstDoc: documents?.[0]?.id?.substring(0, 8),
      lastDoc: documents?.[documents?.length - 1]?.id?.substring(0, 8),
    });

    // Recursive function to process folders at any depth
    const processFolder = (folder, depth = 0) => {
      const folderDocs = documents.filter(doc => doc.folder_id === folder.id);

      // Recursively process child folders (preserving the full hierarchy)
      const processedChildren = (folder.children || []).map(child => processFolder(child, depth + 1));

      return {
        ...folder,
        type: 'folder',
        children: [
          ...processedChildren,  // Nested folders (recursively processed)
          ...folderDocs.map(doc => ({ ...doc, type: 'document' })),  // Documents in this folder
        ],
        count: folderDocs.length + (folder.children?.length || 0),
      };
    };

    // Process all root folders
    const rootItems = folders.map(folder => processFolder(folder, 0));

    // Add unfiled documents (documents without a folder)
    const unfiledDocs = documents.filter(doc => !doc.folder_id);
    unfiledDocs.forEach(doc => {
      rootItems.push({
        ...doc,
        type: 'document',
      });
    });

    return rootItems;
  }, [folders, documents]);

  // Get total counts
  const totalFolders = folders.length;
  const totalDocs = documents.length;

  // Handle context menu actions
  const handleContextMenu = useCallback((event, item) => {
    if (item.action === 'newFolder') {
      onCreateFolder?.(item.id);
    } else if (item.action === 'newFile') {
      onCreateDocument?.(item.id);
    } else if (item.action === 'delete') {
      onDeleteItem?.(item);
    }
  }, [onCreateFolder, onCreateDocument, onDeleteItem]);

  // Helper to find item by ID in tree
  const findItemById = useCallback((items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper to check if targetId is a descendant of folder
  const isDescendant = useCallback((folder, targetId) => {
    if (folder.id === targetId) return true;
    if (folder.children) {
      return folder.children.some(child => isDescendant(child, targetId));
    }
    return false;
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const item = findItemById(treeData, active.id);
    setDraggedItem(item);
  }, [treeData, findItemById]);

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

      // Auto-expand collapsed folders after 700ms hover
      const targetItem = findItemById(treeData, over.id);
      if (targetItem && targetItem.type === 'folder' && !expandedFolders.has(over.id)) {
        hoverTimerRef.current = setTimeout(() => {
          setExpandedFolders(prev => new Set([...prev, over.id]));
          hoverTimerRef.current = null;
        }, 700);
      }
    }
  }, [dragOverFolderId, treeData, expandedFolders, findItemById]);

  const handleDragEnd = useCallback(async (event) => {
    // Clear hover state
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

    const draggedItemData = findItemById(treeData, active.id);
    if (!draggedItemData) {
      setDraggedItem(null);
      return;
    }

    // Handle drop on root
    if (over.id === 'root') {
      if (draggedItemData.type === 'document') {
        await onMoveDocument?.(draggedItemData.id, null);
      } else if (draggedItemData.type === 'folder') {
        await onMoveFolder?.(draggedItemData.id, null);
      }
    } else {
      const targetItem = findItemById(treeData, over.id);
      if (!targetItem) {
        setDraggedItem(null);
        return;
      }

      // Document to folder
      if (draggedItemData.type === 'document' && targetItem.type === 'folder') {
        await onMoveDocument?.(draggedItemData.id, targetItem.id);
      }
      // Folder to folder (prevent dropping folder on itself or its descendants)
      else if (draggedItemData.type === 'folder' && targetItem.type === 'folder') {
        if (!isDescendant(draggedItemData, targetItem.id)) {
          await onMoveFolder?.(draggedItemData.id, targetItem.id);
        }
      }
    }

    setDraggedItem(null);
  }, [treeData, onMoveDocument, onMoveFolder, findItemById, isDescendant]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header - pt-10 to avoid overlap with collapse button */}
      <div className="p-3 pt-10 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Explorer</h2>
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-white/10 rounded transition-colors" title="View mode">
                  {viewMode === VIEW_MODES.TREE && <TreePine className="w-4 h-4 text-white/40" />}
                  {viewMode === VIEW_MODES.COMPACT && <LayoutList className="w-4 h-4 text-white/40" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode(VIEW_MODES.TREE)}>
                  <TreePine className="w-4 h-4 mr-2" /> Tree View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode(VIEW_MODES.COMPACT)}>
                  <LayoutList className="w-4 h-4 mr-2" /> Compact View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onCreateFolder?.()}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-lg text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Folder</span>
          </button>
          <button
            onClick={() => onCreateDocument?.()}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Document</span>
          </button>
        </div>
      </div>

      {/* Content with DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
          <DroppableRoot>
            <div className={`w-full min-w-0 overflow-hidden ${viewMode === VIEW_MODES.COMPACT ? 'py-1' : 'py-2'}`}>
              {isLoading && treeData.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <div className="animate-pulse text-white/30 text-sm">Loading...</div>
                </div>
              ) : treeData.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <div className="text-white/30 text-sm">No documents yet</div>
                  <div className="text-white/20 text-xs mt-1">Create your first document to get started</div>
                </div>
              ) : (
                // Tree/Compact view - hierarchical
                <div className={`w-full min-w-0 overflow-hidden pl-2 pr-1 ${viewMode === VIEW_MODES.COMPACT ? 'space-y-0' : 'space-y-0.5'}`}>
                  {treeData.map((item, index) => (
                    <SidebarTreeItemEnhanced
                      key={item.id}
                      item={item}
                      isExpanded={expandedFolders.has(item.id)}
                      onToggle={toggleFolder}
                      expandedFolders={expandedFolders}
                      isLast={index === treeData.length - 1}
                      onItemClick={onOpenDocument}
                      onContextMenu={handleContextMenu}
                      onToggleFavorite={onToggleFavorite}
                      onRename={onRename}
                      isSelected={item.id === activeDocumentId}
                      activeDocumentId={activeDocumentId}
                      recentlyCreatedFolderId={recentlyCreatedFolderId}
                      viewMode={viewMode}
                      highlightedFolderId={highlightedFolderId}
                      targetFolderRef={item.id === targetFolderId ? targetFolderRef : null}
                    />
                  ))}
                </div>
              )}
            </div>
          </DroppableRoot>
        </ScrollArea>

        {/* Drag overlay */}
        <DragOverlay
          modifiers={[snapCenterToCursor]}
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {draggedItem ? (
            <div className="bg-[#0d0d0d] text-white px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-emerald-500/30">
              {draggedItem.type === 'folder' ? (
                <FolderIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <FileText className="w-4 h-4 text-white/60" />
              )}
              <span className="text-sm">{draggedItem.name || draggedItem.title || 'Moving...'}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Stats footer */}
      <div className="px-3 py-2 border-t border-white/5 text-[11px] text-white/30 flex justify-between">
        <span>{totalFolders} folder{totalFolders !== 1 ? 's' : ''}</span>
        <span>{totalDocs} document{totalDocs !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
