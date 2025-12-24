import { useState, useMemo, useCallback } from 'react';
import { FolderPlus, FilePlus, LayoutGrid, LayoutList, TreePine, RefreshCcw, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import SidebarTreeItemEnhanced from '../SidebarTreeItemEnhanced';

const VIEW_MODES = {
  TREE: 'tree',
  COMPACT: 'compact',
  TABLE: 'table',
};

export function ExplorerView({
  folders,
  documents,
  activeDocumentId,
  onOpenDocument,
  onCreateFolder,
  onCreateDocument,
  onDeleteItem,
  onRefresh,
  isLoading = false,
}) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.TREE);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

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

  // Build tree structure from folders and documents
  const treeData = useMemo(() => {
    // Add documents to their folders or to root
    const rootItems = [];

    // Add folders with their documents as children
    folders.forEach(folder => {
      const folderDocs = documents.filter(doc => doc.folder_id === folder.id);
      const folderWithDocs = {
        ...folder,
        type: 'folder',
        children: [
          ...(folder.children || []).map(child => ({
            ...child,
            type: 'folder',
            children: documents.filter(doc => doc.folder_id === child.id).map(doc => ({
              ...doc,
              type: 'document',
            })),
          })),
          ...folderDocs.map(doc => ({
            ...doc,
            type: 'document',
          })),
        ],
        count: folderDocs.length + (folder.children?.length || 0),
      };
      rootItems.push(folderWithDocs);
    });

    // Add unfiled documents
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

  // DEBUG: Log ExplorerView rendering
  console.log('[DEBUG-EXPLORER-1] 📂 ExplorerView RENDER:', {
    viewMode,
    totalFolders,
    totalDocs,
    treeDataLength: treeData.length,
    expandedFoldersCount: expandedFolders.size,
    timestamp: new Date().toISOString()
  });

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

  // Flatten tree for table view
  const flattenedItems = useMemo(() => {
    if (viewMode !== VIEW_MODES.TABLE) return [];

    const flatten = (items, depth = 0) => {
      return items.flatMap(item => {
        const flattened = [{ ...item, depth }];
        if (item.children && expandedFolders.has(item.id)) {
          flattened.push(...flatten(item.children, depth + 1));
        }
        return flattened;
      });
    };

    return flatten(treeData);
  }, [treeData, viewMode, expandedFolders]);

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
                  {viewMode === VIEW_MODES.TABLE && <LayoutGrid className="w-4 h-4 text-white/40" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode(VIEW_MODES.TREE)}>
                  <TreePine className="w-4 h-4 mr-2" /> Tree View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode(VIEW_MODES.COMPACT)}>
                  <LayoutList className="w-4 h-4 mr-2" /> Compact View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode(VIEW_MODES.TABLE)}>
                  <LayoutGrid className="w-4 h-4 mr-2" /> Table View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Refresh"
              disabled={isLoading}
            >
              <RefreshCcw className={`w-4 h-4 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
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

      {/* Tree/Table Header for Table view */}
      {viewMode === VIEW_MODES.TABLE && (
        <div className="px-3 py-2 border-b border-white/5 flex items-center text-[11px] text-white/40 uppercase tracking-wider">
          <div className="flex-1">Name</div>
          <div className="w-20">Modified</div>
          <div className="w-14">Type</div>
          <div className="w-6"></div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
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
          ) : viewMode === VIEW_MODES.TABLE ? (
            // Table view - flat list
            <div className="w-full min-w-0 overflow-hidden pl-2 pr-1 space-y-0.5">
              {flattenedItems.map((item) => (
                <SidebarTreeItemEnhanced
                  key={item.id}
                  item={item}
                  isExpanded={expandedFolders.has(item.id)}
                  onToggle={toggleFolder}
                  expandedFolders={expandedFolders}
                  onItemClick={onOpenDocument}
                  onContextMenu={handleContextMenu}
                  isSelected={item.id === activeDocumentId}
                  viewMode="table"
                />
              ))}
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
                  isSelected={item.id === activeDocumentId}
                  activeDocumentId={activeDocumentId}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Stats footer */}
      <div className="px-3 py-2 border-t border-white/5 text-[11px] text-white/30 flex justify-between">
        <span>{totalFolders} folder{totalFolders !== 1 ? 's' : ''}</span>
        <span>{totalDocs} document{totalDocs !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
