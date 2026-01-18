import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, FileText, Folder, Tag, AlignLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '../../ui/scroll-area';
import { useAuth } from '@/app/providers';
import * as storageWrapper from '@/utils/storage/storageWrapper';

// Match reason icons
const MATCH_ICONS = {
  title: FileText,
  tags: Tag,
  blocks: AlignLeft,
  folder_name: Folder,
  all: FileText,
};

// Match reason labels
const MATCH_LABELS = {
  title: 'Title',
  tags: 'Tag',
  blocks: 'Content',
  folder_name: 'Folder',
  all: '',
};

export function SearchView({ onOpenDocument, onOpenFolder }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchTimeoutRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches')) || [];
    } catch {
      return [];
    }
  });

  // Debounced search
  useEffect(() => {
    if (!user?.id) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await storageWrapper.searchAll(user.id, term, { limit: 30 });
        setResults(data || []);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, user?.id]);

  // Handle result selection
  const handleSelect = useCallback((result) => {
    // Save to recent searches
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));

    if (result.result_type === 'folder') {
      onOpenFolder?.({ id: result.id, name: result.title });
    } else {
      onOpenDocument?.({ id: result.id, title: result.title });
    }
    setSearchTerm('');
  }, [searchTerm, recentSearches, onOpenDocument, onOpenFolder]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, handleSelect]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Search Header */}
      <div className="p-3 pt-10">
        <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Search</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents, folders..."
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
      <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
        <div className="px-3 pb-3 w-full min-w-0">
          <AnimatePresence mode="wait">
            {searchTerm ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Loading / Results count */}
                <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    `${results.length} result${results.length !== 1 ? 's' : ''}`
                  )}
                </div>

                {/* Results list */}
                {results.length > 0 ? (
                  <div className="w-full min-w-0 space-y-1">
                    {results.map((result, index) => {
                      const MatchIcon = MATCH_ICONS[result.match_reason] || FileText;
                      const isFolder = result.result_type === 'folder';

                      return (
                        <motion.button
                          key={`${result.result_type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          className={`
                            w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-200
                            ${index === selectedIndex
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'hover:bg-white/[0.03] text-white/70 hover:text-white/90'
                            }
                          `}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                        >
                          {isFolder ? (
                            <Folder className="w-4 h-4 text-amber-400/70 flex-shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-white/30 flex-shrink-0" />
                          )}
                          <span className="flex-1 truncate text-sm">{result.title}</span>
                          {/* Match reason badge */}
                          {result.match_reason !== 'all' && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-white/40">
                              <MatchIcon className="w-2.5 h-2.5" />
                              {MATCH_LABELS[result.match_reason]}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ) : !isLoading ? (
                  <div className="py-8 text-center">
                    <div className="text-white/30 text-sm">No results found</div>
                    <div className="text-white/20 text-xs mt-1">Try different keywords</div>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
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

                {/* Search tips */}
                <div className="text-xs text-white/30 space-y-1">
                  <p>Search across:</p>
                  <ul className="list-disc list-inside text-white/20">
                    <li>Document titles</li>
                    <li>Block content</li>
                    <li>Tags</li>
                    <li>Folder names</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
