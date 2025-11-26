import { useState, useMemo } from 'react';
import { Star, FolderPlus, PanelLeft, FilePlus, Trash2, Inbox, User, Settings, Search, X } from 'lucide-react';
import { useFolders } from '../../hooks/useFolders';
import SidebarSectionHeader from './SidebarSectionHeader';
import SidebarTreeItem from './SidebarTreeItem';
import SidebarCollapseButton from './SidebarCollapseButton';
import InputModal from '../InputModal';
import ConfirmDialog from '../ConfirmDialog';
import { useNavigate } from 'react-router-dom';

export default function ProjectExplorerRedesigned({
  onDocumentSelect,
  selectedDocumentId,
  documents = [],
  onDocumentDelete,
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  height = 'h-full',
  onCreateDocument
}) {
  const navigate = useNavigate();

  // State management
  const [expandedFolders, setExpandedFolders] = useState(new Set(['1']));
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);
  const [inboxExpanded, setInboxExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Get Inbox documents (documents without folder_id)
  const inboxDocuments = useMemo(() => {
    return documents
      .filter(doc => doc.type !== 'folder' && !doc.folder_id && !doc.deleted_at)
      .map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title
      }));
  }, [documents]);

  // Get favorite documents (documents with is_favorite = true)
  const favoriteDocuments = useMemo(() => {
    return documents
      .filter(doc => doc.type !== 'folder' && doc.is_favorite && !doc.deleted_at)
      .map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title
      }));
  }, [documents]);

  // Get favorite folders (keep existing behavior)
  const favoriteFolders = useMemo(() => {
    return folderTree.filter(f => f.isFavorite || f.favorite);
  }, [folderTree]);

  // Combined favorites (folders + documents)
  const allFavorites = useMemo(() => {
    return [...favoriteFolders, ...favoriteDocuments];
  }, [favoriteFolders, favoriteDocuments]);

  // Search filtered documents
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return documents
      .filter(doc =>
        doc.type !== 'folder' &&
        !doc.deleted_at &&
        (doc.title?.toLowerCase().includes(query) || doc.name?.toLowerCase().includes(query))
      )
      .map(doc => ({
        ...doc,
        type: 'document',
        name: doc.title
      }))
      .slice(0, 10); // Limit to 10 results
  }, [documents, searchQuery]);

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

        {/* Search Icon - Expands sidebar on click */}
        <div className="px-2 py-1">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 group relative"
            title="Search documents"
          >
            <Search className="w-5 h-5" />
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-full group-hover:h-8 transition-all duration-200" />
          </button>
        </div>

        {/* Inbox Icon */}
        <div className="px-2 py-1">
          <div
            className="flex items-center justify-center p-3 text-blue-400/70 hover:text-blue-300 hover:bg-blue-400/10 rounded-xl cursor-pointer transition-all duration-200 group relative"
            title={`Inbox (${inboxDocuments.length})`}
          >
            <Inbox className="w-5 h-5" />
            {inboxDocuments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {inboxDocuments.length > 9 ? '9+' : inboxDocuments.length}
              </span>
            )}
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-400 rounded-full group-hover:h-8 transition-all duration-200" />
          </div>
        </div>

        {/* Favorites Icon - Always visible */}
        <div className="px-2 py-1">
          <div
            className={`flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${
              allFavorites.length > 0
                ? 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-400/10'
                : 'text-white/30 hover:text-white/50 hover:bg-white/5'
            }`}
            title={`Favorites (${allFavorites.length})`}
            onClick={onToggleCollapse}
          >
            <Star className={`w-5 h-5 ${allFavorites.length > 0 ? 'fill-current' : ''}`} />
            {allFavorites.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {allFavorites.length > 9 ? '9+' : allFavorites.length}
              </span>
            )}
            {/* Active indicator */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 rounded-full group-hover:h-8 transition-all duration-200 ${
              allFavorites.length > 0 ? 'bg-amber-400' : 'bg-white/30'
            }`} />
          </div>
        </div>

        {/* Spacer to push profile to bottom */}
        <div className="flex-1" />

        {/* Profile Icon at bottom */}
        <div className="px-2 py-3 flex-shrink-0 border-t border-white/5">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center justify-center p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 group relative"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-white rounded-full group-hover:h-8 transition-all duration-200" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded sidebar view
  return (
    <div className={`w-72 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden flex flex-col relative transition-all duration-300 ${height} ${className}`}>
      {/* Collapse Button at top */}
      <SidebarCollapseButton onToggle={onToggleCollapse} />

      {/* Search Bar */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-8 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-2 space-y-0.5 max-h-40 overflow-y-auto sidebar-scroll">
            {searchResults.length > 0 ? (
              searchResults.map((doc, index) => (
                <SidebarTreeItem
                  key={doc.id}
                  item={doc}
                  isExpanded={false}
                  onToggle={() => {}}
                  expandedFolders={expandedFolders}
                  depth={0}
                  isFavorite={false}
                  isLast={index === searchResults.length - 1}
                  onItemClick={handleItemClick}
                  onContextMenu={handleContextMenu}
                  isSelected={selectedDocumentId === doc.id}
                />
              ))
            ) : (
              <div className="text-xs text-white/30 text-center py-3">
                No documents found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <div className="bg-white/10 mx-4 mb-3 h-px" />

      {/* Inbox Section - Quick Capture Area */}
      <div className="px-4 flex-shrink-0">
        <div className="pb-3">
          <SidebarSectionHeader
            title="Inbox"
            isExpanded={inboxExpanded}
            onToggle={() => setInboxExpanded(!inboxExpanded)}
            icon={Inbox}
            count={inboxDocuments.length}
            actionButton={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateDocument?.();
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-blue-500/20 rounded p-1 transition-all duration-200 hover:scale-110"
                title="New Document"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-400 hover:text-blue-300" />
              </button>
            }
          />

          {inboxExpanded && inboxDocuments.length > 0 && (
            <div className="mt-2 space-y-0.5 max-h-32 overflow-y-auto sidebar-scroll pr-1">
              {inboxDocuments.map((doc, index) => (
                <SidebarTreeItem
                  key={doc.id}
                  item={doc}
                  isExpanded={false}
                  onToggle={() => {}}
                  expandedFolders={expandedFolders}
                  depth={0}
                  isFavorite={false}
                  isLast={index === inboxDocuments.length - 1}
                  onItemClick={handleItemClick}
                  onContextMenu={handleContextMenu}
                  isSelected={selectedDocumentId === doc.id}
                />
              ))}
            </div>
          )}

          {inboxExpanded && inboxDocuments.length === 0 && (
            <div className="mt-2 text-xs text-white/30 text-center py-2">
              No documents in inbox
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="bg-white/5 mb-3 h-px" />
      </div>

      {/* Favorites Section - Always Visible */}
      <div className="px-4 flex-shrink-0">
        <div className="pb-3">
          <SidebarSectionHeader
            title="Favorites"
            isExpanded={favoritesExpanded}
            onToggle={() => setFavoritesExpanded(!favoritesExpanded)}
            icon={Star}
            count={allFavorites.length}
          />

          {favoritesExpanded && allFavorites.length > 0 && (
            <div className="mt-2 space-y-0.5 max-h-32 overflow-y-auto sidebar-scroll pr-1">
              {allFavorites.map((item, index) => (
                <SidebarTreeItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedFolders.has(item.id)}
                  onToggle={toggleFolder}
                  expandedFolders={expandedFolders}
                  depth={0}
                  isFavorite={true}
                  isLast={index === allFavorites.length - 1}
                  onItemClick={handleItemClick}
                  onContextMenu={handleContextMenu}
                  isSelected={selectedDocumentId === item.id}
                />
              ))}
            </div>
          )}

          {favoritesExpanded && allFavorites.length === 0 && (
            <div className="mt-2 text-xs text-white/30 text-center py-2">
              No favorites yet
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="bg-white/5 mb-3 h-px" />
      </div>

      {/* Explorer Section - With Scroll */}
      <div className="flex-1 px-4 min-h-0 flex flex-col">
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
            <div className="space-y-0.5 pb-2">
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
                  isSelected={selectedDocumentId === folder.id}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile/Settings Section at bottom */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 group"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>

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
