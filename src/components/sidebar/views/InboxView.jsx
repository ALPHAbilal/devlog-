import { useState, useMemo } from 'react';
import { Inbox, FileText, Clock, ArrowRight, CheckCircle, Sparkles, AlertCircle, Archive, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';

// Helper to format relative time
function formatRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function InboxView({ documents, onOpenDocument }) {
  const [filter, setFilter] = useState('unread'); // 'unread' | 'all' | 'archived'

  // Filter and sort inbox items (documents without folder_id that are recent)
  const inboxItems = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return documents
      .filter(doc => {
        // "Inbox" items are unfiled documents created in the last 7 days
        const isUnfiled = !doc.folder_id;
        const isRecent = new Date(doc.created_at) > sevenDaysAgo;
        const isArchived = doc.metadata?.archived;

        if (filter === 'archived') return isUnfiled && isArchived;
        if (filter === 'unread') return isUnfiled && isRecent && !isArchived;
        return isUnfiled && !isArchived;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [documents, filter]);

  // Count unread items
  const unreadCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    return documents.filter(doc =>
      !doc.folder_id &&
      new Date(doc.created_at) > sevenDaysAgo &&
      !doc.metadata?.archived
    ).length;
  }, [documents]);

  return (
    <div className="flex flex-col h-full">
      {/* Header - pt-10 to avoid overlap with collapse button */}
      <div className="p-3 pt-10 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5 text-cyan-400" />
            Inbox
          </h2>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <p className="text-xs text-white/30">Unfiled documents & quick captures</p>

        {/* Filter buttons */}
        <div className="flex gap-1 mt-3">
          {[
            { id: 'unread', label: 'Unread', icon: AlertCircle },
            { id: 'all', label: 'All', icon: Inbox },
            { id: 'archived', label: 'Archived', icon: Archive },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors
                ${filter === f.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03] border border-transparent'
                }
              `}
            >
              <f.icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
        <div className="p-3">
          <AnimatePresence mode="popLayout">
            {inboxItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-400/50 mx-auto mb-3" />
                <div className="text-white/30 text-sm">
                  {filter === 'archived' ? 'No archived items' : 'Inbox is empty'}
                </div>
                <div className="text-white/20 text-xs mt-1">
                  {filter === 'unread'
                    ? 'All caught up!'
                    : 'New unfiled documents will appear here'
                  }
                </div>
              </motion.div>
            ) : (
              <div className="space-y-1">
                {inboxItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => onOpenDocument?.(item)}
                    className="w-full group flex items-start gap-2 p-2 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.03]"
                  >
                    {/* Unread indicator */}
                    <div className={`
                      w-2 h-2 rounded-full flex-shrink-0 mt-1.5
                      ${!item.metadata?.read ? 'bg-cyan-400' : 'bg-white/10'}
                    `} />

                    {/* Icon */}
                    <FileText className="w-4 h-4 text-white/30 group-hover:text-cyan-400/80 transition-colors flex-shrink-0 mt-0.5" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 group-hover:text-white truncate">
                        {item.title || item.name || 'Untitled'}
                      </div>
                      <div className="text-[11px] text-white/30 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/40 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5" />
                  </motion.button>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Tips for empty state */}
      {inboxItems.length === 0 && filter === 'unread' && (
        <div className="px-3 py-2 border-t border-white/5">
          <div className="flex items-start gap-2 p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
            <Sparkles className="w-4 h-4 text-cyan-400/70 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-white/40">
              <span className="text-cyan-400/80 font-medium">Tip:</span> Create documents without selecting a folder to have them appear here
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {inboxItems.length > 0 && (
        <div className="px-3 py-2 border-t border-white/5 text-[11px] text-white/30">
          {inboxItems.length} item{inboxItems.length !== 1 ? 's' : ''} in inbox
        </div>
      )}
    </div>
  );
}
