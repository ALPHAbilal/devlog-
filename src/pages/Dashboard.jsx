import { useState, useEffect, useCallback, useRef } from 'react';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import { Plus, User, Settings, LogOut } from 'lucide-react';
import storageWrapper from '../utils/storage/storageWrapper';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [entries, setEntries] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCallback, setLinkCallback] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await storageWrapper.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Error getting storage info:', error);
    }
  }, []);

  // Save entries using the storage wrapper
  const saveEntries = useCallback(async (updatedEntries) => {
    setEntries(updatedEntries);
    try {
      await storageWrapper.saveEntries(updatedEntries);
      // Update storage info after save
      updateStorageInfo();
    } catch (error) {
      console.error('Error saving entries:', error);
      // Fallback is handled within storageWrapper
    }
  }, [updateStorageInfo]);

  // Create new entry function (moved up for keyboard shortcut access)
  const createNewEntry = useCallback(() => {
    const newEntry = {
      id: crypto.randomUUID(),
      title: 'Untitled Document',
      preview: 'Click to start writing...',
      blocks: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedEntries = [newEntry, ...entries];
    saveEntries(updatedEntries);
    setExpandedEntry(newEntry);
  }, [entries, saveEntries]);

  // Handle click outside for profile menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showProfileMenu && !e.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K - Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Cmd/Ctrl + N - Create new document
      else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewEntry();
      }
      // Slash - Focus search (when not in input)
      else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
      // Escape - Clear search when in search input
      else if (e.key === 'Escape' && e.target.tagName === 'INPUT') {
        setSearchTerm('');
        e.target.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createNewEntry]);

  // Load entries on mount
  useEffect(() => {
    if (isInitialized.current) return;
    
    const loadEntries = async () => {
      setIsLoading(true);
      try {
        // Ensure storage is initialized
        await storageWrapper.init();
        
        // Load entries
        const savedEntries = await storageWrapper.getEntries();
        
        if (savedEntries && savedEntries.length > 0) {
          // Clean up any stale isNew flags in existing documents
          const cleanedEntries = savedEntries.map(entry => {
            if (entry.blocks) {
              return {
                ...entry,
                blocks: entry.blocks.map(block => {
                  if (block.isNew) {
                    const { isNew, ...blockWithoutNew } = block;
                    return blockWithoutNew;
                  }
                  return block;
                })
              };
            }
            return entry;
          });
          
          // Save cleaned entries if any were modified
          const hasChanges = JSON.stringify(savedEntries) !== JSON.stringify(cleanedEntries);
          if (hasChanges) {
            await storageWrapper.saveEntries(cleanedEntries);
          }
          
          setEntries(cleanedEntries);
        } else {
          // Initialize with example entry
          const initialEntries = [
            {
              id: crypto.randomUUID(),
              title: 'Getting Started with Journey Logger',
              preview: 'Welcome to Journey Logger! Click to start documenting your developer journey...',
              blocks: [
                {
                  id: crypto.randomUUID(),
                  type: 'heading',
                  content: 'Welcome to Journey Logger!',
                  level: 1
                },
                {
                  id: crypto.randomUUID(),
                  type: 'text',
                  content: 'This is your personal documentation system powered by Supabase! 🚀\n\n• Cloud storage with real-time sync\n• Secure authentication\n• Access your documents from anywhere'
                },
                {
                  id: crypto.randomUUID(),
                  type: 'heading',
                  content: 'Available Block Types',
                  level: 2
                },
                {
                  id: crypto.randomUUID(),
                  type: 'text',
                  content: '• Text blocks for notes and documentation\n• Code blocks with syntax highlighting\n• AI conversation blocks for saving ChatGPT/Claude discussions\n• Heading blocks for structure\n• Tables for structured data\n• File trees for project structures'
                }
              ],
              tags: ['tutorial', 'getting-started'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          setEntries(initialEntries);
          await storageWrapper.saveEntries(initialEntries);
        }
        
        // Get initial storage info
        await updateStorageInfo();
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setIsLoading(false);
        isInitialized.current = true;
      }
    };

    loadEntries();
  }, [updateStorageInfo]);


  // Update entry
  const updateEntry = useCallback((entryId, updates) => {
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = {
          ...entry,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        
        // Update preview based on blocks
        if (updates.blocks) {
          const firstTextBlock = updates.blocks.find(b => b.type === 'text' && b.content);
          const firstHeading = updates.blocks.find(b => b.type === 'heading' && b.content);
          updatedEntry.preview = firstTextBlock?.content.substring(0, 100) + '...' || 
                                firstHeading?.content || 
                                'Click to start writing...';
        }
        
        // Update expandedEntry if it's the one being edited
        if (expandedEntry && expandedEntry.id === entryId) {
          setExpandedEntry(updatedEntry);
        }
        
        return updatedEntry;
      }
      return entry;
    });
    
    saveEntries(updatedEntries);
  }, [entries, expandedEntry, saveEntries]);

  // Handle document link clicks
  useEffect(() => {
    window.handleDocumentLink = (documentTitle) => {
      // Find the document by title
      const linkedDoc = entries.find(entry => 
        entry.title.toLowerCase() === documentTitle.toLowerCase()
      );
      
      if (linkedDoc) {
        setExpandedEntry(linkedDoc);
      } else {
        // Show modal to create or select document
        setShowLinkModal(true);
        setLinkCallback(() => (selected) => {
          if (selected.isNew) {
            // Create new document with the title
            const newEntry = {
              id: crypto.randomUUID(),
              title: selected.title,
              preview: 'Click to start writing...',
              blocks: [],
              tags: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            const updatedEntries = [newEntry, ...entries];
            saveEntries(updatedEntries);
            setExpandedEntry(newEntry);
          } else {
            setExpandedEntry(selected);
          }
        });
      }
    };

    return () => {
      delete window.handleDocumentLink;
    };
  }, [entries]);

  // Get all unique tags from entries
  const getAllTags = () => {
    const tagSet = new Set();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  // Filter entries based on search and selected tags
  const filteredEntries = entries.filter(entry => {
    // First filter by search term
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then filter by selected tags (if any)
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => entry.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Format bytes for display
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Calculate storage percentage
  const getStoragePercentage = () => {
    if (!storageInfo || !storageInfo.quota) return 0;
    return (storageInfo.usage / storageInfo.quota) * 100;
  };

  // Get storage status color
  const getStorageColor = () => {
    const percentage = getStoragePercentage();
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-primary">
        <div className="flex items-center gap-2">
          <LogoIcon className="w-8 h-8 text-accent-green animate-pulse" />
        </div>
      </div>
    );
  }

  if (expandedEntry) {
    return (
      <div className="h-full flex flex-col">
        <ExpandedView 
          entry={expandedEntry} 
          onClose={() => setExpandedEntry(null)}
          onUpdate={updateEntry}
          allEntries={entries}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Floating Tags */}
      <div className="absolute left-3 top-24 bottom-6 z-30 max-w-[160px]">
        <div className="h-full flex flex-col">
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="self-start text-xs text-text-secondary/50 hover:text-accent-green 
                         transition-colors mb-2"
            >
              Clear filters
            </button>
          )}
          <div className="flex-1 overflow-y-auto pr-2 minimal-scrollbar">
            <div className="flex flex-col gap-2">
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`
                    text-left px-3 py-2 text-sm
                    border border-dashed rounded
                    transition-all duration-200
                    ${selectedTags.includes(tag)
                      ? 'border-accent-green text-accent-green bg-accent-green/5'
                      : 'border-dark-secondary/40 text-text-secondary/70 hover:text-text-primary hover:border-text-secondary/50'
                    }
                  `}
                >
                  <span className="block truncate">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex-shrink-0">
        {/* Top Navigation Bar - Compact and Efficient */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-dark-secondary/20">
          {/* Logo and Brand - Professional Design */}
          <div className="flex items-center gap-2.5 ml-8">
            <LogoMinimal size={32} />
            <h1 className="text-xl font-semibold text-text-primary">Devlog</h1>
          </div>

          {/* Stats and Profile - Compact and Functional */}
          <div className="flex items-center gap-4 mr-8">
            {/* Document Stats - Inline and Minimal */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-text-secondary/70">
                <span className="text-text-primary font-medium">{entries.length}</span> docs
              </span>
              <span className="text-text-secondary/40">•</span>
              <span className="text-text-secondary/70">
                <span className="text-text-primary font-medium">{entries.reduce((acc, e) => acc + (e.blocks?.length || 0), 0)}</span> blocks
              </span>
              {/* Subtle storage indicator - only show when concerning */}
              {storageInfo && getStoragePercentage() > 70 && (
                <>
                  <span className="text-text-secondary/40">•</span>
                  <span className={`${getStoragePercentage() > 80 ? 'text-yellow-500/70' : 'text-text-secondary/70'}`}>
                    {Math.round(getStoragePercentage())}% storage
                  </span>
                </>
              )}
            </div>

            {/* Profile Dropdown - Smaller but Accessible */}
            <div className="relative profile-menu-container">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1.5 hover:bg-dark-secondary/40 
                          rounded transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-accent-green/20 to-accent-green/10 
                                rounded-full flex items-center justify-center border border-accent-green/20
                                group-hover:border-accent-green/40 transition-colors">
                  <User size={16} className="text-accent-green" />
                </div>
                <div className="w-1.5 h-1.5 border-l border-b border-text-secondary/40 
                                transform rotate-[-45deg] transition-transform duration-200
                                group-hover:border-text-primary/60"
                      style={{ transform: showProfileMenu ? 'rotate(135deg)' : 'rotate(-45deg)' }}
                />
              </button>

              {/* Profile Menu - Compact */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-dark-secondary rounded 
                                shadow-xl border border-dark-primary/50 overflow-hidden z-50
                                animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-3 border-b border-dark-primary/50">
                    <p className="text-sm font-medium text-text-primary">Developer</p>
                    <p className="text-xs text-text-secondary/70">{user?.email || 'developer@journey.log'}</p>
                  </div>
                  
                  <div className="p-1">
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 text-left 
                                     text-text-secondary hover:text-text-primary hover:bg-dark-primary/50 
                                     rounded transition-colors text-sm">
                      <Settings size={14} />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left 
                                     text-text-secondary hover:text-text-primary hover:bg-dark-primary/50 
                                     rounded transition-colors text-sm">
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Actions Bar - Compact and Efficient */}
        <div className="px-6 py-3 ml-40">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
              <button
                onClick={createNewEntry}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 
                           bg-dark-secondary/40 hover:bg-dark-secondary/60
                           text-text-primary rounded transition-all
                           border border-dark-secondary/50 hover:border-accent-green/40
                           group relative overflow-hidden text-sm"
                title="Create new document (⌘N)"
              >
                <div className="absolute inset-0 bg-accent-green/10 transform -translate-x-full 
                                group-hover:translate-x-0 transition-transform duration-300" />
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="font-medium relative z-10">New</span>
                <kbd className="hidden sm:inline-block ml-1.5 text-xs text-text-secondary/70 
                                bg-dark-primary/30 px-1 py-0.5 rounded relative z-10">
                  ⌘N
                </kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Virtualized Grid - Maximized Space */}
      <div className="flex-grow overflow-hidden px-6 ml-40">
        <VirtualizedGrid 
          entries={filteredEntries}
          onExpand={setExpandedEntry}
          searchTerm={searchTerm}
        />
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && searchTerm && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-text-secondary text-lg mb-2">
              No documents found matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-accent-green hover:text-accent-green/80 text-sm"
            >
              Clear search
            </button>
          </div>
        </div>
      )}

      {/* Initial Empty State */}
      {entries.length === 0 && !searchTerm && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-light text-text-primary mb-4">
              Welcome to Journey Logger
            </h2>
            <p className="text-text-secondary mb-8 max-w-md">
              Start documenting your developer journey with powerful blocks, 
              markdown support, and interconnected knowledge.
            </p>
            <button
              onClick={createNewEntry}
              className="inline-flex items-center gap-2 px-6 py-3 
                         bg-accent-green text-dark-primary rounded-lg
                         hover:bg-accent-green/80 transition-colors"
            >
              <Plus size={20} />
              Create Your First Document
            </button>
          </div>
        </div>
      )}

      {/* Document Link Modal */}
      <DocumentLinkModal
        isOpen={showLinkModal}
        onClose={() => {
          setShowLinkModal(false);
          setLinkCallback(null);
        }}
        onSelect={(selected) => {
          if (linkCallback) {
            linkCallback(selected);
          }
          setShowLinkModal(false);
          setLinkCallback(null);
        }}
        entries={entries}
      />
    </div>
  );
}