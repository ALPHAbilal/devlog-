import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Code,
  MessageSquare,
  Hash,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Plus,
  Star,
  StarOff,
  Clock,
  Archive,
  MoreVertical,
  Grid3X3
} from 'lucide-react';
import TreeNode from './TreeNode';
import SearchBar from './SearchBar';
import ContextMenu from './ContextMenu';
import { useFileTree } from './hooks/useFileTree';
import { useDragDrop } from './hooks/useDragDrop';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import storageWrapper from '../../utils/storage/storageWrapper';
import { useToast } from '../../hooks/useToast';

export default function ProjectExplorer({ 
  onDocumentSelect,
  selectedDocumentId,
  className = '',
  height = 'h-full'
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavorites, setShowFavorites] = useState(true);
  const [showRecent, setShowRecent] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedId, setSelectedId] = useState(selectedDocumentId);
  
  const containerRef = useRef(null);
  const { showToast } = useToast();
  
  // Custom hooks
  const {
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
    refreshTree
  } = useFileTree();
  
  const {
    draggedItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
  } = useDragDrop({
    onMove: moveItem,
    showToast
  });
  
  const { handleKeyDown } = useKeyboardNav({
    selectedId,
    setSelectedId,
    treeData,
    toggleFolder,
    onDocumentSelect,
    onDelete: deleteItem,
    onRename: (id) => {
      const element = containerRef.current?.querySelector(`[data-node-id="${id}"]`);
      if (element) {
        element.querySelector('[data-rename-trigger]')?.click();
      }
    }
  });

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeData;
    
    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        const nameMatch = (node.name || node.title).toLowerCase().includes(searchTerm.toLowerCase());
        const childMatches = node.children ? filterNodes(node.children) : [];
        
        if (nameMatch || childMatches.length > 0) {
          acc.push({
            ...node,
            children: childMatches,
            highlighted: nameMatch
          });
        }
        
        return acc;
      }, []);
    };
    
    return filterNodes(treeData);
  }, [treeData, searchTerm]);

  // Categorize items
  const { favoriteItems, recentItems, allItems, stats } = useMemo(() => {
    const favorites = [];
    const recent = [];
    const all = [];
    let totalDocs = 0;
    let uncategorizedDocs = 0;
    
    const processNode = (node, depth = 0) => {
      if (node.type === 'document') {
        totalDocs++;
        if (!node.folder_id) uncategorizedDocs++;
        
        if (node.updated_at) {
          const daysSinceUpdate = (Date.now() - new Date(node.updated_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceUpdate <= 7) {
            recent.push(node);
          }
        }
      } else if (node.type === 'folder') {
        if (node.is_favorite) {
          favorites.push(node);
        }
        all.push(node);
      }
      
      if (node.children) {
        node.children.forEach(child => processNode(child, depth + 1));
      }
    };
    
    filteredTree.forEach(node => processNode(node));
    
    // Sort recent by date
    recent.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    return {
      favoriteItems: favorites,
      recentItems: recent.slice(0, 5),
      allItems: filteredTree,
      stats: { totalDocs, uncategorizedDocs }
    };
  }, [filteredTree]);

  // Handle selection
  const handleSelect = useCallback((node) => {
    setSelectedId(node.id);
    
    if (node.type === 'document') {
      onDocumentSelect?.(node.id);
    }
  }, [onDocumentSelect]);

  // Handle context menu
  const handleContextMenu = useCallback((e, node) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuItems = [];
    
    if (node.type === 'folder') {
      menuItems.push(
        { label: 'New File', icon: FileText, onClick: () => createDocument(node.id) },
        { label: 'New Folder', icon: Folder, onClick: () => createFolder(node.id) },
        { divider: true },
        { label: 'Rename', icon: MoreVertical, shortcut: 'F2', onClick: () => renameItem(node.id) },
        { label: 'Delete', icon: X, shortcut: 'Del', onClick: () => deleteItem(node.id), danger: true },
        { divider: true },
        { 
          label: node.is_favorite ? 'Remove from Favorites' : 'Add to Favorites', 
          icon: node.is_favorite ? StarOff : Star,
          onClick: () => toggleFavorite(node.id)
        }
      );
    } else {
      menuItems.push(
        { label: 'Open', icon: FileText, onClick: () => handleSelect(node) },
        { label: 'Rename', icon: MoreVertical, shortcut: 'F2', onClick: () => renameItem(node.id) },
        { label: 'Delete', icon: X, shortcut: 'Del', onClick: () => deleteItem(node.id), danger: true }
      );
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: menuItems
    });
  }, [createDocument, createFolder, renameItem, deleteItem, toggleFavorite, handleSelect]);

  // Handle "All Documents" click
  const handleAllDocumentsClick = () => {
    setSelectedId('all-documents');
    // You can implement a view that shows all documents
    onDocumentSelect?.(null);
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      collisionDetection={closestCenter}
    >
      <div 
        ref={containerRef}
        className={`bg-surface-1 rounded-lg p-4 ${height} flex flex-col ${className}`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-text-primary hover:text-accent-green transition-colors group"
          >
            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <ChevronDown size={14} />
            </div>
            <h3 className="font-semibold text-sm">Projects</h3>
          </button>
          <button
            onClick={() => createFolder(null)}
            className="p-1 hover:bg-surface-2 rounded transition-all duration-200 hover:scale-110"
            title="Create new project"
          >
            <Plus size={14} className="text-accent-green" />
          </button>
        </div>

        {isExpanded && (
          <>
            {/* Search */}
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search projects..."
              className="mb-4"
            />

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-surface-3 scrollbar-track-transparent">
              {/* All Documents */}
              <button
                onClick={handleAllDocumentsClick}
                className={`
                  w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200
                  ${selectedId === 'all-documents' 
                    ? 'bg-accent-green/20 text-accent-green' 
                    : 'hover:bg-surface-2 text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <Grid3X3 size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium truncate">All Documents</span>
                </div>
                <span className="text-xs bg-surface-0 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                  {stats.totalDocs}
                </span>
              </button>

              {/* Uncategorized */}
              {stats.uncategorizedDocs > 0 && (
                <TreeNode
                  node={{
                    id: 'uncategorized',
                    type: 'folder',
                    name: 'Uncategorized',
                    document_count: stats.uncategorizedDocs,
                    isSpecial: true
                  }}
                  level={0}
                  isExpanded={expandedFolders.has('uncategorized')}
                  isSelected={selectedId === 'uncategorized'}
                  onToggle={() => toggleFolder('uncategorized')}
                  onSelect={() => setSelectedId('uncategorized')}
                  onContextMenu={() => {}}
                  searchTerm={searchTerm}
                />
              )}

              {/* Favorites Section */}
              {favoriteItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <button
                      onClick={() => setShowFavorites(!showFavorites)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                    >
                      <div className={`transform transition-transform duration-200 ${showFavorites ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown size={12} />
                      </div>
                      <Star size={12} />
                      <span>Favorites</span>
                    </button>
                    <span className="text-xs text-text-secondary/60">{favoriteItems.length}</span>
                  </div>
                  {showFavorites && (
                    <div className="space-y-1 mb-4">
                      <SortableContext items={favoriteItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        {favoriteItems.map(item => (
                          <TreeNode
                            key={item.id}
                            node={item}
                            level={0}
                            isExpanded={expandedFolders.has(item.id)}
                            isSelected={selectedId === item.id}
                            onToggle={() => toggleFolder(item.id)}
                            onSelect={() => handleSelect(item)}
                            onContextMenu={handleContextMenu}
                            onRename={renameItem}
                            searchTerm={searchTerm}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  )}
                </>
              )}

              {/* Recent Section */}
              {recentItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <button
                      onClick={() => setShowRecent(!showRecent)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                    >
                      <div className={`transform transition-transform duration-200 ${showRecent ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown size={12} />
                      </div>
                      <Clock size={12} />
                      <span>Recent</span>
                    </button>
                    <span className="text-xs text-text-secondary/60">{recentItems.length}</span>
                  </div>
                  {showRecent && (
                    <div className="space-y-1 mb-4">
                      {recentItems.map(item => (
                        <TreeNode
                          key={item.id}
                          node={item}
                          level={0}
                          isExpanded={false}
                          isSelected={selectedId === item.id}
                          onToggle={() => {}}
                          onSelect={() => handleSelect(item)}
                          onContextMenu={handleContextMenu}
                          onRename={renameItem}
                          searchTerm={searchTerm}
                          isCompact
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* All Projects Section */}
              {allItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-4 mb-2">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary/80 hover:text-text-primary uppercase tracking-wider transition-colors"
                    >
                      <div className={`transform transition-transform duration-200 ${showAll ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown size={12} />
                      </div>
                      <Archive size={12} />
                      <span>All Projects</span>
                    </button>
                    <span className="text-xs text-text-secondary/60">{allItems.length}</span>
                  </div>
                  {showAll && (
                    <div className="space-y-1">
                      <SortableContext items={allItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                        {allItems.map(item => (
                          <TreeNode
                            key={item.id}
                            node={item}
                            level={0}
                            isExpanded={expandedFolders.has(item.id)}
                            isSelected={selectedId === item.id}
                            onToggle={() => toggleFolder(item.id)}
                            onSelect={() => handleSelect(item)}
                            onContextMenu={handleContextMenu}
                            onRename={renameItem}
                            searchTerm={searchTerm}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  )}
                </>
              )}

              {/* Empty state */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
                  <p className="text-text-secondary text-sm">Loading projects...</p>
                </div>
              ) : allItems.length === 0 && !searchTerm && (
                <div className="text-center py-12">
                  <Folder size={32} className="text-surface-3 mx-auto mb-2 opacity-50" />
                  <p className="text-text-secondary text-sm mb-3">No projects yet</p>
                  <button
                    onClick={() => createFolder(null)}
                    className="text-accent-green hover:text-accent-green/80 text-sm font-medium transition-colors"
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          </>
        )}
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

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedItem ? (
          <div className="bg-surface-2 rounded-lg p-2 shadow-xl opacity-90">
            <span className="text-sm text-text-primary">{draggedItem.name || draggedItem.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}