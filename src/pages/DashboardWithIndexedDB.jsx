import { useState, useEffect, useCallback, useRef } from 'react';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import { Plus, User, Settings, LogOut, Database, AlertCircle } from 'lucide-react';
import storageWrapper from '../utils/storage/storageWrapper';

export default function Dashboard() {
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
      id: Date.now().toString(),
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
          setEntries(savedEntries);
        } else {
          // Initialize with example entry
          const initialEntries = [
            {
              id: '1',
              title: 'Getting Started with Journey Logger',
              preview: 'Welcome to Journey Logger! Click to start documenting your developer journey...',
              blocks: [
                {
                  id: '1-1',
                  type: 'heading',
                  content: 'Welcome to Journey Logger!',
                  level: 1
                },
                {
                  id: '1-2',
                  type: 'text',
                  content: 'This is your personal documentation system. You can create infinite documents with different types of content blocks.'
                },
                {
                  id: '1-3',
                  type: 'heading',
                  content: 'Storage Upgrade',
                  level: 2
                },
                {
                  id: '1-4',
                  type: 'text',
                  content: '🎉 Journey Logger now uses IndexedDB for storage! This means:\n• Store thousands of documents (1GB+ capacity)\n• Faster performance\n• Better reliability\n• Automatic backups to localStorage'
                },
                {
                  id: '1-5',
                  type: 'heading',
                  content: 'Available Block Types',
                  level: 2
                },
                {
                  id: '1-6',
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

  // Delete entry
  const deleteEntry = useCallback((entryId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const filteredEntries = entries.filter(entry => entry.id !== entryId);
      saveEntries(filteredEntries);
      
      // Close expanded view if deleted entry was open
      if (expandedEntry && expandedEntry.id === entryId) {
        setExpandedEntry(null);
      }
    }
  }, [entries, expandedEntry, saveEntries]);

  // Duplicate entry
  const duplicateEntry = useCallback((entryId) => {
    const entryToDuplicate = entries.find(e => e.id === entryId);
    if (entryToDuplicate) {
      const duplicatedEntry = {
        ...entryToDuplicate,
        id: Date.now().toString(),
        title: `${entryToDuplicate.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedEntries = [duplicatedEntry, ...entries];
      saveEntries(updatedEntries);
    }
  }, [entries, saveEntries]);

  // Handle document link selection
  const handleDocumentLink = useCallback((callback) => {
    setLinkCallback(() => callback);
    setShowLinkModal(true);
  }, []);

  // Insert link to selected document
  const insertLink = useCallback((selectedDoc) => {
    if (linkCallback) {
      linkCallback(`[[${selectedDoc.title}]]`);
    }
    setShowLinkModal(false);
    setLinkCallback(null);
  }, [linkCallback]);

  // Filtered entries based on search and tags
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.blocks?.some(block => 
        block.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => entry.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  // Get all unique tags
  const allTags = [...new Set(entries.flatMap(entry => entry.tags || []))];

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
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-blue-400 mb-4 mx-auto animate-pulse" />
          <p className="text-gray-400">Initializing storage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <LogoIcon className="w-8 h-8" />
                <h1 className="text-xl font-medium text-gray-100">Journey Logger</h1>
              </div>
              
              {/* Storage Info */}
              {storageInfo && (
                <div className="flex items-center gap-2 text-sm">
                  <Database className={`w-4 h-4 ${getStorageColor()}`} />
                  <span className={getStorageColor()}>
                    {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                  </span>
                  {getStoragePercentage() > 80 && (
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                  )}
                  {storageWrapper.isUsingIndexedDB() && (
                    <span className="text-xs text-green-400 ml-1">(IndexedDB)</span>
                  )}
                </div>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <SearchBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                allTags={allTags}
              />
              
              {/* New Document Button */}
              <button
                onClick={createNewEntry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150"
                title="New Document (Cmd/Ctrl + N)"
              >
                <Plus className="w-4 h-4" />
                <span>New Document</span>
              </button>

              {/* Profile Menu */}
              <div className="relative profile-menu-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-150"
                >
                  <User className="w-5 h-5 text-gray-400" />
                </button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl py-1">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center gap-2 text-red-400">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedTags.length > 0 
                ? 'No documents match your search criteria' 
                : 'No documents yet'}
            </p>
            {(!searchTerm && selectedTags.length === 0) && (
              <button
                onClick={createNewEntry}
                className="text-blue-400 hover:text-blue-300"
              >
                Create your first document
              </button>
            )}
          </div>
        ) : (
          <VirtualizedGrid 
            entries={filteredEntries}
            onEdit={entry => setExpandedEntry(entry)}
            onDelete={deleteEntry}
            onDuplicate={duplicateEntry}
          />
        )}
      </main>

      {/* Expanded View Modal */}
      {expandedEntry && (
        <ExpandedView
          entry={expandedEntry}
          onClose={() => setExpandedEntry(null)}
          onUpdate={(updates) => updateEntry(expandedEntry.id, updates)}
          onDocumentLink={handleDocumentLink}
          allTags={allTags}
        />
      )}

      {/* Document Link Modal */}
      {showLinkModal && (
        <DocumentLinkModal
          entries={entries.filter(e => e.id !== expandedEntry?.id)}
          onSelect={insertLink}
          onClose={() => {
            setShowLinkModal(false);
            setLinkCallback(null);
          }}
        />
      )}
    </div>
  );
}