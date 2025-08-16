import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  FileText, 
  Folder, 
  Plus, 
  Star, 
  Clock, 
  Command,
  ArrowRight,
  Hash,
  Calendar,
  Filter
} from 'lucide-react';

export default function NavigationCommandPalette({ 
  isOpen, 
  onClose, 
  documents = [], 
  projects = [],
  onNavigate,
  onCreateProject,
  onCreateDocument
}) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef(null);
  const inputRef = useRef(null);

  // Fuzzy search function
  const fuzzySearch = (items, query, keys) => {
    if (!query) return items;
    
    const searchTerms = query.toLowerCase().split(' ');
    
    return items.filter(item => {
      const searchableText = keys
        .map(key => (item[key] || '').toLowerCase())
        .join(' ');
      
      return searchTerms.every(term => searchableText.includes(term));
    }).sort((a, b) => {
      // Sort by relevance (title matches first)
      const aTitle = (a.title || a.name || '').toLowerCase();
      const bTitle = (b.title || b.name || '').toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
      if (!aTitle.startsWith(queryLower) && bTitle.startsWith(queryLower)) return 1;
      
      return 0;
    });
  };

  // Build command list
  const commands = useMemo(() => {
    const cmdList = [];

    // Actions
    cmdList.push({
      id: 'new-document',
      type: 'action',
      icon: Plus,
      title: 'Create New Document',
      description: 'Start a new document',
      action: () => onCreateDocument()
    });

    cmdList.push({
      id: 'new-project',
      type: 'action',
      icon: Folder,
      title: 'Create New Project',
      description: 'Create a new project folder',
      action: () => onCreateProject()
    });

    // Recent documents (top 5)
    const recentDocs = [...documents]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    if (recentDocs.length > 0) {
      cmdList.push({
        id: 'recent-header',
        type: 'header',
        title: 'Recent Documents'
      });

      recentDocs.forEach(doc => {
        cmdList.push({
          id: `doc-${doc.id}`,
          type: 'document',
          icon: FileText,
          title: doc.title,
          description: doc.preview || 'No preview',
          meta: formatDate(doc.updatedAt),
          action: () => onNavigate('document', doc)
        });
      });
    }

    // Projects
    if (projects.length > 0) {
      cmdList.push({
        id: 'projects-header',
        type: 'header',
        title: 'Projects'
      });

      projects.forEach(project => {
        cmdList.push({
          id: `project-${project.id}`,
          type: 'project',
          icon: Folder,
          title: project.title,
          description: `${project.document_count} documents`,
          meta: project.is_favorite ? '★' : '',
          color: project.color,
          action: () => onNavigate('project', project)
        });
      });
    }

    return cmdList;
  }, [documents, projects, onNavigate, onCreateDocument, onCreateProject]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands.filter(cmd => cmd.type !== 'header');
    
    const filtered = [];
    let lastHeader = null;

    commands.forEach(cmd => {
      if (cmd.type === 'header') {
        lastHeader = cmd;
        return;
      }

      const matches = fuzzySearch([cmd], search, ['title', 'description']);
      if (matches.length > 0) {
        // Add header if this is the first match under it
        if (lastHeader && !filtered.find(f => f.id === lastHeader.id)) {
          filtered.push(lastHeader);
        }
        filtered.push(cmd);
      }
    });

    return filtered;
  }, [commands, search]);

  // Get selectable commands (non-headers)
  const selectableCommands = filteredCommands.filter(cmd => cmd.type !== 'header');

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const selectable = selectableCommands;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < selectable.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : selectable.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectable[selectedIndex]) {
            selectable[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, selectableCommands, onClose, isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-primary/80 backdrop-blur-sm" />
      
      {/* Command Palette */}
      <div 
        ref={paletteRef}
        className="relative w-full max-w-2xl bg-surface-1 rounded-xl shadow-2xl 
                   border border-surface-3 overflow-hidden
                   animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-surface-3">
          <Search size={18} className="text-text-secondary mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents, projects, or actions..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary/50
                     focus:outline-none text-base"
          />
          <kbd className="px-2 py-1 text-xs bg-surface-2 rounded text-text-secondary">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-secondary">No results found</p>
              <p className="text-text-secondary/60 text-sm mt-1">
                Try searching for something else
              </p>
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              if (command.type === 'header') {
                return (
                  <div key={command.id} className="px-4 py-2 mt-2 first:mt-0">
                    <h3 className="text-xs font-semibold text-text-secondary/60 uppercase tracking-wider">
                      {command.title}
                    </h3>
                  </div>
                );
              }

              const Icon = command.icon;
              const isSelected = selectableCommands[selectedIndex]?.id === command.id;

              return (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    onClose();
                  }}
                  onMouseEnter={() => {
                    const idx = selectableCommands.findIndex(cmd => cmd.id === command.id);
                    if (idx >= 0) setSelectedIndex(idx);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left
                           transition-colors duration-100
                           ${isSelected 
                             ? 'bg-accent-green/10 text-text-primary' 
                             : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                           }`}
                >
                  <div 
                    className={`mr-3 p-2 rounded-lg ${
                      isSelected ? 'bg-accent-green/20' : 'bg-surface-2'
                    }`}
                    style={{ color: command.color }}
                  >
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium truncate">{command.title}</span>
                      {command.meta && (
                        <span className="ml-2 text-xs text-text-secondary/60">
                          {command.meta}
                        </span>
                      )}
                    </div>
                    {command.description && (
                      <p className="text-sm text-text-secondary/60 truncate mt-0.5">
                        {command.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <ArrowRight size={16} className="text-accent-green ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-surface-3 flex items-center justify-between text-xs text-text-secondary/60">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-surface-2 rounded mr-1">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 bg-surface-2 rounded mr-1">Enter</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center">
            <Command size={12} className="mr-1" />
            <span>Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}