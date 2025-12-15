import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, FileText, ArrowRight, ChevronRight, Folder, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';

export function SearchView({ documents, onOpenDocument }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches')) || [];
    } catch {
      return [];
    }
  });

  // Filter documents based on search term
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results = documents
      .filter(doc =>
        (doc.title?.toLowerCase().includes(term)) ||
        (doc.name?.toLowerCase().includes(term)) ||
        (doc.content?.toLowerCase().includes(term))
      )
      .slice(0, 20); // Limit results

    // Add relevance sorting - title matches rank higher
    return results.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase();
      const bTitle = (b.title || b.name || '').toLowerCase();

      // Exact title match first
      if (aTitle === term && bTitle !== term) return -1;
      if (bTitle === term && aTitle !== term) return 1;

      // Title starts with term
      if (aTitle.startsWith(term) && !bTitle.startsWith(term)) return -1;
      if (bTitle.startsWith(term) && !aTitle.startsWith(term)) return 1;

      // Title contains term
      if (aTitle.includes(term) && !bTitle.includes(term)) return -1;
      if (bTitle.includes(term) && !aTitle.includes(term)) return 1;

      return 0;
    });
  }, [searchTerm, documents]);

  // Handle selection
  const handleSelect = useCallback((doc) => {
    // Save to recent searches
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    onOpenDocument?.(doc);
    setSearchTerm('');
  }, [searchTerm, recentSearches, onOpenDocument]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (searchResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(searchResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-3">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results Area */}
      <ScrollArea className="flex-1">
        <div className="px-3 pb-3">
          <AnimatePresence mode="wait">
            {searchTerm ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Results count */}
                <div className="text-xs text-white/40 mb-2">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>

                {/* Results list */}
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((doc, index) => (
                      <motion.button
                        key={doc.id}
                        onClick={() => handleSelect(doc)}
                        className={`
                          w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200
                          ${index === selectedIndex
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'hover:bg-white/[0.03] text-white/70 hover:text-white/90'
                          }
                        `}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <FileText className="w-4 h-4 text-white/30 flex-shrink-0" />
                        <span className="flex-1 truncate text-sm">{doc.title || doc.name}</span>
                        <ArrowRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="text-white/30 text-sm">No documents found</div>
                    <div className="text-white/20 text-xs mt-1">Try different keywords</div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Quick actions */}
                <div>
                  <div className="text-xs text-white/40 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Quick search
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSearchTerm('today')}
                      className="px-3 py-2 bg-white/[0.03] rounded-lg text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors border border-white/5"
                    >
                      Today&apos;s docs
                    </button>
                    <button
                      onClick={() => setSearchTerm('recent')}
                      className="px-3 py-2 bg-white/[0.03] rounded-lg text-xs text-white/60 hover:text-white/90 hover:bg-white/[0.06] transition-colors border border-white/5"
                    >
                      Recent edits
                    </button>
                  </div>
                </div>

                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="text-xs text-white/40 mb-2">Recent searches</div>
                    <div className="space-y-1">
                      {recentSearches.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchTerm(term)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          <span className="truncate">{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
