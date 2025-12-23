import { useState, useMemo, useCallback } from 'react';
import { Star, StarOff, FileText, Folder, ArrowRight, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';

export function FavoritesView({
  documents,
  folders,
  onOpenDocument,
  onToggleFavorite,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'documents' | 'folders'

  // Get favorited items
  const favorites = useMemo(() => {
    const favDocs = documents.filter(doc => doc.favorite || doc.isFavorite);
    const favFolders = folders.filter(folder => folder.favorite || folder.isFavorite);

    if (filter === 'documents') return favDocs.map(d => ({ ...d, type: 'document' }));
    if (filter === 'folders') return favFolders.map(f => ({ ...f, type: 'folder' }));

    return [
      ...favFolders.map(f => ({ ...f, type: 'folder' })),
      ...favDocs.map(d => ({ ...d, type: 'document' })),
    ];
  }, [documents, folders, filter]);

  // Handle unfavorite
  const handleUnfavorite = useCallback((e, item) => {
    e.stopPropagation();
    onToggleFavorite?.(item, false);
  }, [onToggleFavorite]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header - pt-10 to avoid overlap with collapse button */}
      <div className="p-3 pt-10 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          Favorites
        </h2>
        <p className="text-xs text-white/30 mt-1">Quick access to important items</p>

        {/* Filter buttons */}
        <div className="flex gap-1 mt-3">
          {[
            { id: 'all', label: 'All' },
            { id: 'documents', label: 'Docs' },
            { id: 'folders', label: 'Folders' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                px-2.5 py-1 rounded-md text-xs transition-colors
                ${filter === f.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03] border border-transparent'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
        <div className="p-3 w-full min-w-0">
          <AnimatePresence mode="popLayout">
            {favorites.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <Star className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <div className="text-white/30 text-sm">No favorites yet</div>
                <div className="text-white/20 text-xs mt-1">
                  Star documents or folders to add them here
                </div>
              </motion.div>
            ) : (
              <div className="w-full min-w-0 space-y-1">
                {favorites.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => item.type === 'document' && onOpenDocument?.(item)}
                    className={`
                      group flex items-center gap-2 p-2 rounded-lg transition-all duration-200
                      ${item.type === 'document'
                        ? 'cursor-pointer hover:bg-white/[0.03]'
                        : 'hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    {/* Icon */}
                    {item.type === 'folder' ? (
                      <Folder className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-white/30 group-hover:text-emerald-400/80 transition-colors flex-shrink-0" />
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 group-hover:text-white truncate">
                        {item.name || item.title || 'Untitled'}
                      </div>
                      <div className="text-[11px] text-white/30 capitalize">
                        {item.type}
                      </div>
                    </div>

                    {/* Unfavorite button */}
                    <button
                      onClick={(e) => handleUnfavorite(e, item)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      title="Remove from favorites"
                    >
                      <X className="w-3 h-3 text-white/40 hover:text-white/70" />
                    </button>

                    {/* Arrow for documents */}
                    {item.type === 'document' && (
                      <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/40 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Tips */}
      {favorites.length === 0 && (
        <div className="px-3 py-2 border-t border-white/5">
          <div className="flex items-start gap-2 p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-white/40">
              <span className="text-amber-400/80 font-medium">Tip:</span> Right-click on any document or folder and select &quot;Add to Favorites&quot;
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {favorites.length > 0 && (
        <div className="px-3 py-2 border-t border-white/5 text-[11px] text-white/30">
          {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
