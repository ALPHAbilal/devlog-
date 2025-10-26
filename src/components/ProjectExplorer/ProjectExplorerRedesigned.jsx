import { useState, useMemo } from 'react';
import { Star, FolderPlus, PanelLeft } from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import SidebarSectionHeader from './SidebarSectionHeader';
import SidebarTreeItem from './SidebarTreeItem';
import SidebarCollapseButton from './SidebarCollapseButton';

export default function ProjectExplorerRedesigned({
  onDocumentSelect,
  selectedDocumentId,
  documents = [],
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  height = 'h-full'
}) {
  // State management
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1']));
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  // Use existing folders hook (no backend changes)
  const { folders, createFolder } = useFolders();

  // Toggle folder expansion
  const toggleFolder = (id) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  // Build folder tree structure from existing data
  const folderTree = useMemo(() => {
    const folderMap = new Map();
    const rootFolders = [];

    // First pass: create map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        type: 'folder',
        children: [],
        count: 0
      });
    });

    // Second pass: build tree structure
    folders.forEach(folder => {
      const node = folderMap.get(folder.id);
      if (folder.parent_id && folderMap.has(folder.parent_id)) {
        folderMap.get(folder.parent_id).children.push(node);
      } else {
        rootFolders.push(node);
      }
    });

    // Add documents to their folders
    documents.forEach(doc => {
      // Skip if this is a folder (from entries array)
      if (doc.type === 'folder') return;

      if (doc.folder_id && folderMap.has(doc.folder_id)) {
        const folder = folderMap.get(doc.folder_id);
        folder.children.push({
          ...doc,
          type: 'document',
          name: doc.title
        });
        folder.count = folder.children.length;
      }
    });

    // Add root documents (documents without folder_id) to root level
    const rootDocuments = documents
      .filter(doc => doc.type !== 'folder' && !doc.folder_id)
      .map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title
      }));

    // Combine root folders and root documents
    const combined = [...rootFolders, ...rootDocuments];
    console.log('[DEBUG-SIDEBAR] Folder tree built:', {
      totalFolders: rootFolders.length,
      totalRootDocuments: rootDocuments.length,
      combinedTotal: combined.length
    });
    return combined;
  }, [folders, documents]);

  // Get favorite folders
  const favoriteFolders = useMemo(() => {
    return folderTree.filter(f => f.isFavorite || f.favorite);
  }, [folderTree]);

  // Handle item click (document or folder)
  const handleItemClick = (item) => {
    if (item.type === 'document') {
      onDocumentSelect?.(item);
    }
  };

  // Handle create new folder
  const handleCreateFolder = async () => {
    console.log('[DEBUG-SIDEBAR] Create folder button clicked');
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      console.log('[DEBUG-SIDEBAR] Creating folder:', folderName.trim());
      await createFolder(folderName.trim(), null); // null = root folder
    }
  };

  // Handle context menu (for now, just show alert - can be expanded later)
  const handleContextMenu = (item) => {
    // TODO: Implement proper context menu with actions like:
    // - Rename folder/document
    // - Delete folder/document
    // - Move to another folder
    // - Add to favorites
    console.log('[DEBUG-SIDEBAR] Context menu clicked for:', item.name || item.title, item);
    alert(`Context menu for: ${item.name || item.title}\n\nActions coming soon:\n- Rename\n- Delete\n- Move\n- Favorite`);
  };

  // Collapsed sidebar view
  if (isCollapsed) {
    return (
      <div className={`w-20 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden flex flex-col relative transition-all duration-300 ease-in-out ${height} ${className}`}>
        {/* Toggle Button at top */}
        <div className="px-2 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full h-11 p-0 text-white/50 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all duration-200 rounded-xl relative group"
            title="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5 mx-auto" />
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-emerald-400 rounded-full group-hover:h-8 transition-all duration-200" />
          </button>
        </div>

        {/* Separator */}
        <div className="bg-white/10 mx-4 mb-2 h-px" />

        {/* Favorites Icon */}
        {favoriteFolders.length > 0 && (
          <div className="px-2 py-1">
            <div
              className="flex items-center justify-center p-3 text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10 rounded-xl cursor-pointer transition-all duration-200 group relative"
              title={`Favorites (${favoriteFolders.length})`}
            >
              <Star className="w-5 h-5 fill-current" />
              {/* Active indicator */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-amber-400 rounded-full group-hover:h-8 transition-all duration-200" />
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-3 flex-shrink-0" />
      </div>
    );
  }

  // Expanded sidebar view
  return (
    <div className={`w-72 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden flex flex-col relative transition-all duration-300 ${height} ${className}`}>
      {/* Collapse Button at top */}
      <SidebarCollapseButton onToggle={onToggleCollapse} />

      {/* Separator */}
      <div className="bg-white/10 mx-4 mb-3 h-px" />

      {/* Favorites Section - No Scroll */}
      <div className="px-4 flex-shrink-0">
        {favoriteFolders.length > 0 && (
          <div className="pb-4">
            <SidebarSectionHeader
              title="Favorites"
              isExpanded={favoritesExpanded}
              onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
              icon={Star}
            />

            {favoritesExpanded && (
              <div className="mt-2 space-y-0.5">
                {favoriteFolders.map((folder, index) => (
                  <SidebarTreeItem
                    key={folder.id}
                    item={folder}
                    isExpanded={expandedFolders.has(folder.id)}
                    onToggle={toggleFolder}
                    expandedFolders={expandedFolders}
                    depth={0}
                    isFavorite={true}
                    isLast={index === favoriteFolders.length - 1}
                    onItemClick={handleItemClick}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Separator */}
        {favoriteFolders.length > 0 && <div className="bg-white/5 my-4 h-px" />}
      </div>

      {/* Explorer Section - With Scroll */}
      <div className="flex-1 px-4 min-h-0 flex flex-col pb-4">
        <SidebarSectionHeader
          title="All Folders"
          isExpanded={explorerExpanded}
          onToggle={() => setExplorerExpanded(!explorerExpanded)}
          count={folderTree.length}
          actionButton={
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFolder();
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-emerald-500/20 rounded p-1 transition-all duration-200 hover:scale-110"
              title="New Folder"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400 hover:text-emerald-300" />
            </button>
          }
        />

        {/* Folder List with Custom Scrollbar */}
        {explorerExpanded && (
          <div className="sidebar-scroll flex-1 h-0 mt-2 overflow-y-auto pr-2">
            <div className="space-y-0.5 pb-4">
              {folderTree.map((folder, index) => (
                <SidebarTreeItem
                  key={folder.id}
                  item={folder}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={toggleFolder}
                  expandedFolders={expandedFolders}
                  depth={0}
                  isFavorite={false}
                  isLast={index === folderTree.length - 1}
                  onItemClick={handleItemClick}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-4 flex-shrink-0" />
    </div>
  );
}
