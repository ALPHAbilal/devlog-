import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import VSCodeExplorer from '../components/VSCodeExplorer';
import CustomDragOverlay from '../components/DragOverlay';
import NavigationCommandPalette from '../components/NavigationCommandPalette';
import Breadcrumb from '../components/Breadcrumb';
import { Plus, User, Settings, LogOut, Grid3X3, Menu, FileText, Folder } from 'lucide-react';
import storageWrapper from '../utils/storage/storageWrapper';
import IndexedDBAdapter from '../utils/storage/IndexedDBAdapter';
import { useAuth } from '../contexts/AuthContextOptimized';
import { sessionCache } from '../utils/sessionCache';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToast } from '../hooks/useToast';
import useDocumentOrganization from '../hooks/useDocumentOrganization';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges, snapCenterToCursor } from '@dnd-kit/modifiers';

export default function DashboardVSCode() {
  const navigate = useNavigate();
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
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderPath, setCurrentFolderPath] = useState([]);
  
  // Initialize auto-save functionality
  const { performAutoSave } = useAutoSave();
  const toast = useToast();
  
  // Document organization state
  const {
    selectedDocuments,
    isDragging,
    draggedDocuments,
    startDrag,
    endDrag,
    moveDocuments,
    clearSelection
  } = useDocumentOrganization();
  
  // Handle document selection from explorer
  const handleDocumentSelect = useCallback(async (documentId) => {
    setSelectedDocumentId(documentId);
    
    try {
      // Load the full document
      const document = await storageWrapper.getDocument(documentId);
      
      // Open document in expanded view
      const documentForEdit = {
        ...document,
        blocks: undefined // Force block loader to fetch all blocks
      };
      setExpandedEntry(documentForEdit);
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.showToast('Failed to load document', 'error');
    }
  }, [toast]);

  // Handle document expansion with lazy block loading
  const handleDocumentExpand = useCallback((document) => {
    // Open document immediately - ExpandedViewEnhanced will handle progressive loading
    // Clear blocks array to force full reload from database
    const documentForEdit = {
      ...document,
      blocks: undefined // Force block loader to fetch all blocks
    };
    setExpandedEntry(documentForEdit);
  }, []);

  // Update storage info
  const updateStorageInfo = useCallback(async () => {
    try {
      const info = await storageWrapper.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.warn('Failed to get storage info:', error);
    }
  }, []);

  // Load initial data
  const loadDocuments = useCallback(async (folderId = null) => {
    try {
      setIsLoading(true);
      let documents;
      
      if (folderId) {
        // Load documents in specific folder
        documents = await storageWrapper.getDocumentsInFolder(folderId);
        setCurrentFolderId(folderId);
      } else {
        // Load all documents at root level
        documents = await storageWrapper.getDocuments();
        // Filter to only show root-level documents (no folder_id)
        documents = documents.filter(doc => !doc.folder_id);
        setCurrentFolderId(null);
      }
      
      setEntries(documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.showToast('Failed to load documents', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      loadDocuments();
      updateStorageInfo();
    }
  }, [loadDocuments, updateStorageInfo]);

  // Handle creating new document
  const handleCreateEntry = useCallback(async () => {
    try {
      const newDoc = await storageWrapper.createDocument({
        title: 'Untitled',
        folder_id: currentFolderId
      });
      
      toast.showToast('Document created', 'success');
      
      // Reload documents in current folder
      await loadDocuments(currentFolderId);
      
      // Open the new document
      handleDocumentExpand(newDoc);
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.showToast('Failed to create document', 'error');
    }
  }, [currentFolderId, loadDocuments, handleDocumentExpand, toast]);

  // Handle saving a document
  const handleSaveEntry = useCallback(async (updatedEntry) => {
    try {
      // Perform the save
      await performAutoSave(updatedEntry);
      
      // Refresh the document list
      await loadDocuments(currentFolderId);
      
      // Keep the document open with updated data
      setExpandedEntry(updatedEntry);
      
      toast.showToast('Document saved', 'success');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.showToast('Failed to save document', 'error');
    }
  }, [performAutoSave, loadDocuments, currentFolderId, toast]);

  // Handle deleting a document
  const handleDeleteEntry = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await storageWrapper.deleteDocument(id);
      
      // Close if currently open
      if (expandedEntry?.id === id) {
        setExpandedEntry(null);
      }
      
      // Reload documents
      await loadDocuments(currentFolderId);
      
      toast.showToast('Document deleted', 'success');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.showToast('Failed to delete document', 'error');
    }
  }, [expandedEntry, loadDocuments, currentFolderId, toast]);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.showToast('Failed to sign out', 'error');
    }
  }, [signOut, navigate, toast]);

  // Handle navigation
  const handleNavigation = useCallback((result) => {
    if (result.type === 'document') {
      handleDocumentExpand(result.item);
    } else if (result.type === 'settings') {
      navigate('/settings');
    }
  }, [handleDocumentExpand, navigate]);

  // Get filtered documents based on search
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesTags = selectedTags.length === 0 || 
      (entry.tags && selectedTags.every(tag => entry.tags.includes(tag)));
    
    return matchesSearch && matchesTags;
  });

  // Get all unique tags
  const allTags = [...new Set(entries.flatMap(entry => entry.tags || []))];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + N: New document
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateEntry();
      }
      // Cmd/Ctrl + K: Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Cmd/Ctrl + B: Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowSidebar(!showSidebar);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateEntry, showSidebar]);

  if (!user) return null;

  return (
    <div className="h-screen bg-surface-0 text-text-primary overflow-hidden">
      <NavigationCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={handleNavigation}
        documents={entries}
      />
      
      <div className="flex flex-col h-full relative">
        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* VSCode Explorer Sidebar */}
        <div className={`
          fixed lg:absolute left-0 top-0 bottom-0 z-30 w-64
          ${showSidebar ? 'block' : 'hidden'}
          lg:block
          bg-surface-1 border-r border-surface-2
        `}>
          <VSCodeExplorer
            onDocumentSelect={handleDocumentSelect}
            selectedDocumentId={selectedDocumentId}
            height="h-full"
          />
        </div>

        {/* Main content area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'lg:ml-64' : ''}`}>
          {/* Header */}
          <header className="bg-surface-1 border-b border-surface-2 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile menu button */}
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 hover:bg-surface-2 rounded transition-colors lg:hidden"
                  >
                    <Menu size={20} />
                  </button>
                  
                  <LogoMinimal size="text-2xl" variant="glow" />
                  
                  {/* New document button */}
                  <button
                    onClick={handleCreateEntry}
                    className="flex items-center gap-2 px-4 py-2 bg-accent-green text-dark-primary 
                             rounded-lg hover:bg-accent-green/90 transition-colors font-medium"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New Document</span>
                  </button>
                </div>

                {/* Search and profile section */}
                <div className="flex items-center gap-4">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Search documents..."
                    className="hidden md:block w-64"
                  />
                  
                  {/* Profile menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 p-2 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 bg-accent-green/20 rounded-full flex items-center justify-center">
                        <User size={16} className="text-accent-green" />
                      </div>
                    </button>
                    
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-surface-2 rounded-lg shadow-xl 
                                    border border-surface-3 overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-surface-3">
                          <p className="text-sm font-medium">{user.email}</p>
                        </div>
                        <button
                          onClick={() => navigate('/settings')}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-3 
                                   transition-colors text-left"
                        >
                          <Settings size={16} />
                          <span className="text-sm">Settings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-3 
                                   transition-colors text-left text-red-400"
                        >
                          <LogOut size={16} />
                          <span className="text-sm">Sign out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {expandedEntry ? (
              <ExpandedView
                document={expandedEntry}
                onClose={() => setExpandedEntry(null)}
                onSave={handleSaveEntry}
                onLinkClick={(callback) => {
                  setLinkCallback(() => callback);
                  setShowLinkModal(true);
                }}
                entries={entries}
              />
            ) : (
              <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Mobile search */}
                <div className="mb-6 md:hidden">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    placeholder="Search documents..."
                  />
                </div>

                {/* Tag filter */}
                {allTags.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-accent-green text-dark-primary'
                            : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="px-3 py-1 rounded-full text-sm bg-surface-2 text-text-secondary 
                                 hover:bg-surface-3 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Document grid */}
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading documents...</p>
                  </div>
                ) : filteredEntries.length > 0 ? (
                  <VirtualizedGrid
                    entries={filteredEntries}
                    onEntryClick={handleDocumentExpand}
                    onEntryDelete={handleDeleteEntry}
                    itemHeight={180}
                    className="pb-8"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="text-surface-3 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-text-secondary mb-2">
                      {searchTerm || selectedTags.length > 0 ? 'No documents found' : 'No documents yet'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                      {searchTerm || selectedTags.length > 0 
                        ? 'Try adjusting your search or filters'
                        : 'Create your first document to get started'}
                    </p>
                    {!searchTerm && selectedTags.length === 0 && (
                      <button
                        onClick={handleCreateEntry}
                        className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg 
                                 hover:bg-accent-green/90 transition-colors font-medium"
                      >
                        Create Document
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Document link modal */}
      {showLinkModal && linkCallback && (
        <DocumentLinkModal
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setLinkCallback(null);
          }}
          onSelectDocument={(doc) => {
            linkCallback(doc.id, doc.title);
            setShowLinkModal(false);
            setLinkCallback(null);
          }}
          documents={entries}
        />
      )}
    </div>
  );
}