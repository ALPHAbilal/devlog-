import { useMemo } from 'react';
import { FileText, Clock, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
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

// Helper to group by date
function groupByDate(documents) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  documents.forEach(doc => {
    const docDate = new Date(doc.updated_at || doc.created_at);
    docDate.setHours(0, 0, 0, 0);

    if (docDate >= today) {
      groups.today.push(doc);
    } else if (docDate >= yesterday) {
      groups.yesterday.push(doc);
    } else if (docDate >= lastWeek) {
      groups.thisWeek.push(doc);
    } else {
      groups.older.push(doc);
    }
  });

  return groups;
}

function DocumentItem({ doc, onOpenDocument, index }) {
  return (
    <motion.button
      onClick={() => onOpenDocument?.(doc)}
      className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200 hover:bg-white/[0.03] group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <FileText className="w-4 h-4 text-white/30 group-hover:text-emerald-400/80 transition-colors flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/80 group-hover:text-white truncate">
          {doc.title || doc.name || 'Untitled'}
        </div>
        <div className="text-[11px] text-white/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(doc.updated_at || doc.created_at)}
        </div>
      </div>
      <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/40 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" />
    </motion.button>
  );
}

function DateGroup({ title, documents, onOpenDocument, startIndex = 0 }) {
  if (documents.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-2 mb-2">
        <Calendar className="w-3 h-3 text-white/30" />
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
          {documents.length}
        </span>
      </div>
      <div className="w-full min-w-0 space-y-0.5">
        {documents.map((doc, index) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            onOpenDocument={onOpenDocument}
            index={startIndex + index}
          />
        ))}
      </div>
    </div>
  );
}

export function RecentView({ documents, onOpenDocument }) {
  // Sort by updated_at and limit to recent
  const recentDocs = useMemo(() => {
    return [...documents]
      .sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0);
        const bDate = new Date(b.updated_at || b.created_at || 0);
        return bDate - aDate;
      })
      .slice(0, 50); // Limit to 50 most recent
  }, [documents]);

  // Group by date
  const groups = useMemo(() => groupByDate(recentDocs), [recentDocs]);

  // Calculate running indices for animation
  let runningIndex = 0;

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header - pt-10 to avoid overlap with collapse button */}
      <div className="p-3 pt-10 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recent</h2>
        <p className="text-xs text-white/30 mt-1">Recently edited documents</p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
        <div className="p-3 w-full min-w-0">
          {recentDocs.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <div className="text-white/30 text-sm">No recent documents</div>
              <div className="text-white/20 text-xs mt-1">
                Documents you edit will appear here
              </div>
            </div>
          ) : (
            <>
              <DateGroup
                title="Today"
                documents={groups.today}
                onOpenDocument={onOpenDocument}
                startIndex={(runningIndex += 0, runningIndex)}
              />
              <DateGroup
                title="Yesterday"
                documents={groups.yesterday}
                onOpenDocument={onOpenDocument}
                startIndex={(runningIndex += groups.today.length, runningIndex)}
              />
              <DateGroup
                title="This Week"
                documents={groups.thisWeek}
                onOpenDocument={onOpenDocument}
                startIndex={(runningIndex += groups.yesterday.length, runningIndex)}
              />
              <DateGroup
                title="Older"
                documents={groups.older}
                onOpenDocument={onOpenDocument}
                startIndex={(runningIndex += groups.thisWeek.length, runningIndex)}
              />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {recentDocs.length > 0 && (
        <div className="px-3 py-2 border-t border-white/5 text-[11px] text-white/30">
          Showing {recentDocs.length} recent document{recentDocs.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
