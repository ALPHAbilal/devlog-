import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { ActivityBar, ACTIVITY_VIEWS } from './ActivityBar';
import { SearchView, ExplorerView, RecentView, FavoritesView, InboxView } from './views';

// Panel width constants
const PANEL_WIDTH = 280;
const ACTIVITY_BAR_WIDTH = 48;

export function SidebarEnhanced({
  isOpen,
  onClose,
  isMobile,
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
  isLoading,
  onMoveDocument,
  onMoveFolder,
}) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(ACTIVITY_VIEWS.EXPLORER);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const handleCollapse = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
  }, [isCollapsed]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings');
    if (isMobile) onClose?.();
  }, [navigate, isMobile, onClose]);

  // Mobile overlay sidebar
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex"
              style={{ width: PANEL_WIDTH + ACTIVITY_BAR_WIDTH }}
            >
              <ActivityBar
                activeView={activeView}
                onViewChange={setActiveView}
                onSettingsClick={handleSettingsClick}
              />

              <div className="flex-1 bg-[#0d0d0d] border-r border-white/5 flex flex-col">
                {/* Close button for mobile */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors z-10"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>

                {/* View content */}
                <ViewContent
                  activeView={activeView}
                  folders={folders}
                  documents={documents}
                  activeDocumentId={activeDocumentId}
                  recentlyCreatedFolderId={recentlyCreatedFolderId}
                  onOpenDocument={(doc) => {
                    onOpenDocument?.(doc);
                    onClose?.();
                  }}
                  onCreateFolder={onCreateFolder}
                  onCreateDocument={onCreateDocument}
                  onDeleteItem={onDeleteItem}
                  onToggleFavorite={onToggleFavorite}
                  onRename={onRename}
                  onRefresh={onRefresh}
                  isLoading={isLoading}
                  onMoveDocument={onMoveDocument}
                  onMoveFolder={onMoveFolder}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop sidebar
  return (
    <motion.div
      className="h-full flex bg-[#0a0a0a] border-r border-white/5 relative"
      initial={false}
      animate={{ width: isCollapsed ? ACTIVITY_BAR_WIDTH : PANEL_WIDTH + ACTIVITY_BAR_WIDTH }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      {/* Collapse toggle at TOP - same height in both states */}
      <button
        onClick={handleCollapse}
        className="absolute top-3 right-2 p-1.5 hover:bg-white/10 rounded-lg transition-colors z-20"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          // When collapsed, position relative to activity bar
          // When expanded, position at right edge of panel
          right: isCollapsed ? '8px' : '8px'
        }}
      >
        {isCollapsed ? (
          <ChevronsRight className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
        ) : (
          <ChevronsLeft className="w-4 h-4 text-white/40 hover:text-white/70 transition-colors" />
        )}
      </button>

      <ActivityBar
        activeView={activeView}
        onViewChange={setActiveView}
        onSettingsClick={handleSettingsClick}
      />

      {/* Panel */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: PANEL_WIDTH }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="overflow-hidden bg-[#0d0d0d] border-r border-white/5 flex flex-col min-w-0"
          >
            <ViewContent
              activeView={activeView}
              folders={folders}
              documents={documents}
              activeDocumentId={activeDocumentId}
              recentlyCreatedFolderId={recentlyCreatedFolderId}
              onOpenDocument={onOpenDocument}
              onCreateFolder={onCreateFolder}
              onCreateDocument={onCreateDocument}
              onDeleteItem={onDeleteItem}
              onToggleFavorite={onToggleFavorite}
              onRename={onRename}
              onRefresh={onRefresh}
              isLoading={isLoading}
              onMoveDocument={onMoveDocument}
              onMoveFolder={onMoveFolder}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// View content renderer
function ViewContent({
  activeView,
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
  isLoading,
  onMoveDocument,
  onMoveFolder,
}) {
  switch (activeView) {
    case ACTIVITY_VIEWS.SEARCH:
      return (
        <SearchView
          onOpenDocument={onOpenDocument}
          onOpenFolder={(folder) => {
            // When a folder is clicked from search results, we could:
            // 1. Navigate to explorer view (not implemented yet)
            // 2. Show a toast with the folder name
            // For now, just log it - user can navigate manually
            console.log('[SearchView] Folder selected:', folder);
          }}
        />
      );

    case ACTIVITY_VIEWS.EXPLORER:
      return (
        <ExplorerView
          folders={folders}
          documents={documents}
          activeDocumentId={activeDocumentId}
          recentlyCreatedFolderId={recentlyCreatedFolderId}
          onOpenDocument={onOpenDocument}
          onCreateFolder={onCreateFolder}
          onCreateDocument={onCreateDocument}
          onDeleteItem={onDeleteItem}
          onToggleFavorite={onToggleFavorite}
          onRename={onRename}
          onRefresh={onRefresh}
          isLoading={isLoading}
          onMoveDocument={onMoveDocument}
          onMoveFolder={onMoveFolder}
        />
      );

    case ACTIVITY_VIEWS.RECENT:
      return (
        <RecentView
          documents={documents}
          onOpenDocument={onOpenDocument}
        />
      );

    case ACTIVITY_VIEWS.FAVORITES:
      return (
        <FavoritesView
          documents={documents}
          folders={folders}
          onOpenDocument={onOpenDocument}
          onToggleFavorite={onToggleFavorite}
        />
      );

    case ACTIVITY_VIEWS.INBOX:
      return (
        <InboxView
          documents={documents}
          onOpenDocument={onOpenDocument}
        />
      );

    default:
      return null;
  }
}
