import { useState, useEffect } from 'react';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCallback, setLinkCallback] = useState(null);

  // Save entries to localStorage whenever they change
  const saveEntries = (updatedEntries) => {
    setEntries(updatedEntries);
    localStorage.setItem('journeyLoggerEntries', JSON.stringify(updatedEntries));
  };

  // Create new entry function (moved up for keyboard shortcut access)
  const createNewEntry = () => {
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
  };

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
  }, [entries]);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('journeyLoggerEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    } else {
      // Initialize with some example entries
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
              content: 'Available Block Types',
              level: 2
            },
            {
              id: '1-4',
              type: 'text',
              content: '• Text blocks for notes and documentation\n• Code blocks with syntax highlighting\n• AI conversation blocks for saving ChatGPT/Claude discussions\n• Heading blocks for structure'
            }
          ],
          tags: ['tutorial', 'getting-started'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setEntries(initialEntries);
      localStorage.setItem('journeyLoggerEntries', JSON.stringify(initialEntries));
    }
  }, []);


  // Update entry
  const updateEntry = (entryId, updates) => {
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
  };

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
              id: Date.now().toString(),
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

  // Filter entries based on search
  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="flex flex-col h-full">
      {/* Header with Search */}
      <div className="flex-shrink-0 pt-6 pb-4 px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Title and Stats */}
          <div className="text-center mb-4">
            <h1 className="text-3xl font-light text-text-primary mb-2">
              Your Journey
            </h1>
            <p className="text-text-secondary text-sm">
              {entries.length} {entries.length === 1 ? 'document' : 'documents'} • 
              {entries.reduce((acc, e) => acc + (e.blocks?.length || 0), 0)} blocks
            </p>
          </div>
          
          {/* Search Bar with Create Button */}
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            <button
              onClick={createNewEntry}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 
                         bg-dark-secondary/50 hover:bg-dark-secondary/70
                         text-text-primary rounded-lg transition-all
                         border border-dark-secondary hover:border-accent-green/50
                         group relative overflow-hidden"
              title="Create new document (⌘N)"
            >
              <div className="absolute inset-0 bg-accent-green/10 transform -translate-x-full 
                              group-hover:translate-x-0 transition-transform duration-300" />
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300 relative z-10" />
              <span className="font-medium relative z-10">New</span>
              <kbd className="hidden sm:inline-block ml-2 text-xs text-text-secondary 
                              bg-dark-primary/50 px-1.5 py-0.5 rounded relative z-10">
                ⌘N
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized Grid */}
      <div className="flex-grow overflow-hidden px-8">
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