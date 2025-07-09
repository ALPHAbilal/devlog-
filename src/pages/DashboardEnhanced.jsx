import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStorage } from '../utils/storage/useStorage';
import { DocumentSaveManager, useSaveStatus } from '../utils/documentSaveManager';
import { realtimeSync, useRealtimeDocument } from '../utils/realtimeSync';
import { createImagesBucketIfNotExists } from '../utils/imageUploader';
import SaveIndicator from '../components/SaveIndicator';
import ExpandedViewEnhanced from '../components/ExpandedViewEnhanced';
import TextBlockEnhanced from '../components/blocks/TextBlockEnhanced';

export default function DashboardEnhanced() {
  const { user } = useAuth();
  const { loadEntries, saveEntries, isSupabase } = useStorage();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [lastSync, setLastSync] = useState(null);

  // Initialize save manager
  const saveManager = useMemo(() => {
    return new DocumentSaveManager(async (documentId, data) => {
      await saveEntries(data);
    }, {
      debounceDelay: 1000,
      maxRetries: 3,
      showSaveIndicator: true
    });
  }, [saveEntries]);

  // Initialize image storage bucket
  useEffect(() => {
    if (isSupabase && user) {
      createImagesBucketIfNotExists();
    }
  }, [isSupabase, user]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user]);

  // Set up real-time sync
  useEffect(() => {
    if (!isSupabase || !user) return;

    // Subscribe to user's documents
    const channelName = realtimeSync.subscribeToUserDocuments(user.id, (payload) => {
      handleRealtimeUpdate(payload);
    });

    // Monitor connection status
    const unsubscribe = realtimeSync.onConnectionChange((status) => {
      setSyncStatus(status);
    });

    // Set up beforeunload handler
    const handleBeforeUnload = (e) => {
      if (saveManager.hasPendingSaves()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to flush saves
        saveManager.flush();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      realtimeSync.unsubscribe(channelName);
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSupabase, user, saveManager]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const data = await loadEntries();
      setEntries(data || []);
      setLastSync(Date.now());
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload) => {
    const { event, old: oldRecord, new: newRecord } = payload;

    setEntries(prevEntries => {
      switch (event) {
        case 'INSERT':
          // Add new entry if it doesn't exist
          if (!prevEntries.find(e => e.id === newRecord.id)) {
            return [...prevEntries, newRecord];
          }
          return prevEntries;

        case 'UPDATE':
          // Update existing entry
          return prevEntries.map(entry =>
            entry.id === newRecord.id ? { ...entry, ...newRecord } : entry
          );

        case 'DELETE':
          // Remove deleted entry
          return prevEntries.filter(entry => entry.id !== oldRecord.id);

        default:
          return prevEntries;
      }
    });

    setLastSync(Date.now());
  };

  const updateEntry = useCallback((entryId, updates, immediate = false) => {
    // Optimistic update
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.id === entryId ? { ...entry, ...updates, updated_at: new Date().toISOString() } : entry
      )
    );

    // Queue save
    const entryData = entries.find(e => e.id === entryId);
    if (entryData) {
      saveManager.save(entryId, { ...entryData, ...updates }, immediate);
    }
  }, [entries, saveManager]);

  const createNewDocument = async () => {
    const newDoc = {
      id: crypto.randomUUID(),
      title: `Untitled ${new Date().toLocaleDateString()}`,
      blocks: [{
        id: crypto.randomUUID(),
        type: 'text',
        content: '',
        isNew: true
      }],
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id
    };

    // Optimistic update
    setEntries(prev => [newDoc, ...prev]);
    
    // Save immediately
    saveManager.save(newDoc.id, newDoc, true);
    
    // Open the new document
    setSelectedEntry(newDoc);
  };

  const deleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    // Optimistic update
    setEntries(prev => prev.filter(e => e.id !== documentId));
    
    // Queue deletion
    const deletedDoc = entries.find(e => e.id === documentId);
    if (deletedDoc) {
      saveManager.save(documentId, { ...deletedDoc, deleted_at: new Date().toISOString() }, true);
    }

    if (selectedEntry?.id === documentId) {
      setSelectedEntry(null);
    }
  };

  // Get save status for selected document
  const selectedDocSaveStatus = useSaveStatus(saveManager, selectedEntry?.id);

  // Connection indicator
  const getConnectionIndicator = () => {
    if (!isSupabase) return null;

    const statusConfig = {
      connected: { color: 'text-accent-green', text: 'Connected' },
      connecting: { color: 'text-accent-yellow', text: 'Connecting...' },
      disconnected: { color: 'text-text-secondary', text: 'Disconnected' },
      error: { color: 'text-accent-red', text: 'Connection Error' }
    };

    const config = statusConfig[syncStatus] || statusConfig.disconnected;

    return (
      <div className={`flex items-center gap-2 text-sm ${config.color}`}>
        <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
        <span>{config.text}</span>
        {lastSync && (
          <span className="text-text-secondary">
            (Last sync: {new Date(lastSync).toLocaleTimeString()})
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-text-secondary">Loading your documents...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="border-b border-dark-secondary/30 bg-dark-primary/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-text-primary">Journey Log</h1>
            <div className="flex items-center gap-4">
              {selectedDocSaveStatus && (
                <SaveIndicator status={selectedDocSaveStatus} />
              )}
              {getConnectionIndicator()}
              <button
                onClick={createNewDocument}
                className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg
                         hover:bg-accent-green-hover transition-colors"
              >
                New Document
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {selectedEntry ? (
          <ExpandedViewEnhanced
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            onUpdate={(id, updates) => updateEntry(id, updates)}
            allEntries={entries}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-text-secondary mb-4">No documents yet</p>
                <button
                  onClick={createNewDocument}
                  className="text-accent-green hover:text-accent-green-hover"
                >
                  Create your first document
                </button>
              </div>
            ) : (
              entries.map(entry => (
                <DocumentCard
                  key={entry.id}
                  document={entry}
                  onClick={() => setSelectedEntry(entry)}
                  onDelete={() => deleteDocument(entry.id)}
                  saveStatus={useSaveStatus(saveManager, entry.id)}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Document Card Component
function DocumentCard({ document, onClick, onDelete, saveStatus }) {
  const { syncStatus, lastUpdate } = useRealtimeDocument(document.id, document.user_id);

  return (
    <div
      className="bg-dark-secondary/50 rounded-lg p-4 hover:bg-dark-secondary/70
                 transition-all cursor-pointer border border-dark-secondary/30
                 hover:border-accent-green/30 group relative"
      onClick={onClick}
    >
      {/* Save status indicator */}
      {saveStatus && (
        <div className="absolute top-2 right-2">
          <SaveIndicator status={saveStatus} className="text-xs" />
        </div>
      )}

      <h3 className="text-text-primary font-medium mb-2 pr-8">{document.title}</h3>
      
      {/* Preview */}
      <div className="text-text-secondary text-sm line-clamp-3 mb-3">
        {document.preview || 'No content yet...'}
      </div>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {document.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-dark-primary/50 rounded text-xs text-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>{new Date(document.updated_at).toLocaleDateString()}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-accent-red hover:text-accent-red/80
                   transition-opacity"
        >
          Delete
        </button>
      </div>

      {/* Real-time sync indicator */}
      {lastUpdate && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-accent-green rounded-full
                      animate-pulse" />
      )}
    </div>
  );
}