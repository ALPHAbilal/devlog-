import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CardContainer from './CardContainer';
import FavoriteIndicator from './FavoriteIndicator';
import FolderListItem from './FolderListItem';
import DocumentListItem from './DocumentListItem';

export default function FolderCard({
  folder,
  onDocumentClick,
  onFolderClick
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [navigationPath, setNavigationPath] = useState([]);

  // Current items to display (either root items or items from current subfolder)
  const currentItems = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].items
    : folder.items || [];

  // Current folder title for breadcrumb
  const currentFolderTitle = navigationPath.length > 0
    ? navigationPath[navigationPath.length - 1].title
    : folder.title;

  // Count total items recursively
  const countItems = (itemsList) => {
    if (!Array.isArray(itemsList)) return 0;
    return itemsList.reduce((count, item) => {
      if (item.type === 'folder' && item.items) {
        return count + countItems(item.items);
      }
      return count + 1;
    }, 0);
  };

  const totalCount = countItems(folder.items || []);

  // Navigate into a subfolder
  const navigateInto = (subfolder) => {
    if (subfolder.type === 'folder' && subfolder.items) {
      setNavigationPath([...navigationPath, {
        title: subfolder.title,
        items: subfolder.items
      }]);
    }
  };

  // Navigate back to parent folder
  const navigateBack = () => {
    setNavigationPath(navigationPath.slice(0, -1));
  };

  // Handle item click
  const handleItemClick = (item) => {
    if (item.type === 'folder') {
      navigateInto(item);
    } else {
      onDocumentClick?.(item);
    }
  };

  return (
    <CardContainer>
      {/* Favorite Indicator */}
      <FavoriteIndicator isFavorite={folder.isFavorite} />

      {/* Folder Header */}
      <div
        className="relative p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-0.5">
            {isExpanded ? (
              <FolderOpen className="w-5 h-5 text-emerald-400 transition-all duration-300" />
            ) : (
              <Folder className="w-5 h-5 text-blue-400 transition-all duration-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white/90 group-hover:text-white transition-colors
                           line-clamp-2 mb-2">
              {folder.title}
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-md
                             group-hover:bg-white/10 transition-colors">
                {totalCount} {totalCount === 1 ? 'doc' : 'docs'}
              </span>
            </div>
          </div>

          <ChevronRight
            className={`w-4 h-4 text-white/40 transition-transform duration-300
                       flex-shrink-0 mt-0.5 ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="relative px-5 pb-5 pt-0">
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10
                              to-transparent mb-3" />

              {/* Breadcrumb / Back Navigation */}
              {navigationPath.length > 0 && (
                <div
                  className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-500/10
                             hover:bg-emerald-500/20 rounded-lg cursor-pointer transition-all
                             group/back"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateBack();
                  }}
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-400
                                       group-hover/back:text-emerald-300 transition-colors" />
                  <span className="text-sm text-emerald-400 group-hover/back:text-emerald-300
                                   transition-colors">
                    Back to {navigationPath.length === 1
                      ? folder.title
                      : navigationPath[navigationPath.length - 2].title}
                  </span>
                </div>
              )}

              {/* Current Folder Path Indicator */}
              {navigationPath.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-white/5
                               rounded-lg">
                  <Folder className="w-3 h-3 text-white/40" />
                  <span className="text-xs text-white/50">
                    {folder.title} {navigationPath.map(p => `/ ${p.title}`).join(' ')}
                  </span>
                </div>
              )}

              {/* Items List (Folders and Documents) */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {currentItems.map((item) => (
                  item.type === 'folder' ? (
                    <FolderListItem
                      key={item.id}
                      title={item.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    />
                  ) : (
                    <DocumentListItem
                      key={item.id}
                      title={item.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    />
                  )
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardContainer>
  );
}
