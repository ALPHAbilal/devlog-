import { useState, useEffect } from 'react';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedView';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCallback, setLinkCallback] = useState(null);

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
          preview: 'Welcome to Journey Logger! Click to start documenting...',
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

  // Save entries to localStorage whenever they change
  const saveEntries = (updatedEntries) => {
    setEntries(updatedEntries);
    localStorage.setItem('journeyLoggerEntries', JSON.stringify(updatedEntries));
  };

  // Create new entry
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
      <ExpandedView 
        entry={expandedEntry} 
        onClose={() => setExpandedEntry(null)}
        onUpdate={updateEntry}
        allEntries={entries}
      />
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {/* Entry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* New Entry Card */}
        <button
          onClick={createNewEntry}
          className="bg-card-gradient rounded-lg p-6 
                     transition-all duration-300 hover:scale-105 hover:shadow-xl
                     border-2 border-dashed border-dark-secondary/50
                     hover:border-accent-green/50 group"
        >
          <div className="flex flex-col items-center justify-center h-full min-h-[150px]">
            <Plus size={48} className="text-text-secondary group-hover:text-accent-green 
                                       transition-colors mb-2" />
            <span className="text-text-secondary group-hover:text-text-primary 
                            transition-colors font-medium">
              Create New Document
            </span>
          </div>
        </button>

        {/* Existing Entries */}
        {filteredEntries.map(entry => (
          <EntryCard 
            key={entry.id} 
            entry={entry} 
            onExpand={setExpandedEntry}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-text-secondary text-lg">
            No documents found matching "{searchTerm}"
          </p>
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