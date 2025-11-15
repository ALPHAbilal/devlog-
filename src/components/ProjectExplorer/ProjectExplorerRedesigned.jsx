import { useState, useMemo } from 'react';
import { Star, FolderPlus, PanelLeft, FilePlus, Trash2 } from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import SidebarSectionHeader from './SidebarSectionHeader';
import SidebarTreeItem from './SidebarTreeItem';
import SidebarCollapseButton from './SidebarCollapseButton';
import InputModal from '../InputModal';
import ConfirmDialog from '../ConfirmDialog';

export default function ProjectExplorerRedesigned({
  onDocumentSelect,
  selectedDocumentId,
  documents = [],
  onDocumentDelete,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  height = 'h-full'
}) {
  // State management
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1']));
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  // Modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputModalConfig, setInputModalConfig] = useState({ title: '', onConfirm: null, parentId: null });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', message: '', onConfirm: null });

  // Use existing folders hook (no backend changes)
  const { folders, createFolder, deleteFolder } = useFolders();

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

  // Build folder tree - useFolders already returns a tree structure with children
  // We just need to add documents to the folders and include root documents
  const folderTree = useMemo(() => {
    // Helper to recursively add documents to folders in the tree
    const addDocumentsToFolder = (folder) => {
      // Find documents that belong to this folder
      const folderDocs = documents
        .filter(doc => doc.type !== 'folder' && doc.folder_id === folder.id)
        .map(doc => ({
          ...doc,
          type: 'document',
          name: doc.title
        }));

      // Recursively process children folders
      const updatedChildren = (folder.children || []).map(addDocumentsToFolder);

      // Combine children folders with documents
      return {
        ...folder,
        type: 'folder',
        children: [...updatedChildren, ...folderDocs],
        count: updatedChildren.length + folderDocs.length
      };
    };

    // Process all root folders (useFolders already returns tree structure)
    const rootFoldersWithDocs = folders.map(addDocumentsToFolder);

    // Add root documents (documents without folder_id)
    const rootDocuments = documents
      .filter(doc => doc.type !== 'folder' && !doc.folder_id)
      .map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title
      }));

    // Combine root folders and root documents
    const combined = [...rootFoldersWithDocs, ...rootDocuments];
    console.log('[DEBUG-SIDEBAR] Folder tree built:', {
      totalFolders: rootFoldersWithDocs.length,
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
  const handleCreateFolder = () => {
    console.log('[DEBUG-SIDEBAR] Create folder button clicked');
    setInputModalConfig({
      title: 'Create New Folder',
      onConfirm: async (folderName) => {
        console.log('[DEBUG-SIDEBAR] Creating root folder:', folderName);
        const result = await createFolder(folderName, null); // null = root folder
        if (result) {
          console.log('[DEBUG-SIDEBAR] Root folder created successfully:', result.id);
        } else {
          console.error('[DEBUG-SIDEBAR] Root folder creation failed or returned null');
        }
        setShowInputModal(false);
      },
      parentId: null
    });
    setShowInputModal(true);
  };

  // Handle context menu actions
  const handleContextMenu = (e, item) => {
    // e is a fake event object, item contains the action
    if (item.action === 'newFolder') {
      handleCreateNestedFolder(item.id);
    } else if (item.action === 'newFile') {
      handleCreateDocument(item.id);
    } else if (item.action === 'delete') {
      handleDeleteItem(item);
    }
  };

  // Create nested folder (inside another folder)
  const handleCreateNestedFolder = (parentId) => {
    console.log('[DEBUG-SIDEBAR] Creating nested folder in parent:', parentId);
    setInputModalConfig({
      title: 'Create New Subfolder',
      onConfirm: async (folderName) => {
        console.log('[DEBUG-SIDEBAR] Starting folder creation...');
        const result = await createFolder(folderName, parentId);
        if (result) {
          console.log('[DEBUG-SIDEBAR] Folder created successfully:', result.id);
        } else {
          console.error('[DEBUG-SIDEBAR] Folder creation failed or returned null');
        }
        setShowInputModal(false);
      },
      parentId
    });
    setShowInputModal(true);
  };

  // Create document in folder
  const handleCreateDocument = (folderId) => {
    console.log('[DEBUG-SIDEBAR] Creating document in folder:', folderId);
    // Send action to Dashboard to create document
    onDocumentSelect?.({ action: 'create', folderId: folderId });
  };

  // Delete folder or document
  const handleDeleteItem = (item) => {
    const itemName = item.name || item.title || 'this item';
    const isFolder = item.type === 'folder';

    setConfirmDialogConfig({
      title: isFolder ? 'Delete Folder' : 'Delete Document',
      message: isFolder
        ? `Are you sure you want to delete "${itemName}" and all its contents? This action cannot be undone.`
        : `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm: async () => {
        console.log('[DEBUG-SIDEBAR] Deleting item:', item);

        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else if (item.type === 'document' && onDocumentDelete) {
          await onDocumentDelete(item);
        }
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
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

      {/* Modals */}
      <InputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        onConfirm={inputModalConfig.onConfirm}
        title={inputModalConfig.title}
        placeholder="Enter folder name..."
        confirmText="Create"
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDialogConfig.onConfirm}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
