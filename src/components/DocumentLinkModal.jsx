import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Plus, X } from 'lucide-react';

export default function DocumentLinkModal({ isOpen, onClose, onSelect, entries }) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter entries based on search
  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(search.toLowerCase())
  );

  // Add option to create new document if search doesn't match
  const showCreateOption = search && filteredEntries.length === 0;

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const maxIndex = showCreateOption ? 0 : filteredEntries.length - 1;
        setSelectedIndex(prev => prev < maxIndex ? prev + 1 : prev);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (showCreateOption) {
          handleCreateNew();
        } else if (filteredEntries[selectedIndex]) {
          handleSelect(filteredEntries[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredEntries, showCreateOption]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSelect = (entry) => {
    onSelect(entry);
    onClose();
    setSearch('');
  };

  const handleCreateNew = () => {
    onSelect({ 
      id: 'new', 
      title: search,
      isNew: true 
    });
    onClose();
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-dark-secondary/95 backdrop-blur-sm rounded-lg shadow-xl 
                   border border-dark-secondary/50 w-[500px] max-h-[400px] 
                   flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-dark-primary/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents or create new..."
              className="w-full pl-10 pr-4 py-2 bg-dark-primary/50 text-text-primary
                         rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-green/50
                         placeholder-text-secondary"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {showCreateOption ? (
            <button
              onClick={handleCreateNew}
              className="w-full p-4 flex items-center gap-3 hover:bg-dark-primary/50
                         text-left transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-green/20 flex items-center 
                              justify-center group-hover:bg-accent-green/30 transition-colors">
                <Plus className="w-5 h-5 text-accent-green" />
              </div>
              <div>
                <div className="text-text-primary font-medium">Create "{search}"</div>
                <div className="text-text-secondary text-sm">Create new document and link</div>
              </div>
            </button>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isSelected = index === selectedIndex;
              const preview = entry.preview || 'No preview available';
              
              return (
                <button
                  key={entry.id}
                  onClick={() => handleSelect(entry)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full p-4 flex items-start gap-3 text-left transition-colors ${
                    isSelected ? 'bg-dark-primary/80' : 'hover:bg-dark-primary/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-dark-primary/50 flex items-center 
                                  justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-text-primary font-medium truncate">
                      {entry.title}
                    </div>
                    <div className="text-text-secondary text-sm truncate">
                      {preview}
                    </div>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {entry.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-dark-primary/50 
                                                   rounded-full text-text-secondary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-primary/50 text-xs text-text-secondary 
                        flex items-center justify-between">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}