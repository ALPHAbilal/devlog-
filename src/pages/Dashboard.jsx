import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import ProjectCard from '../components/ProjectCard';
import ProjectExplorer from '../components/ProjectExplorer/ProjectExplorer';
import ProjectModal from '../components/ProjectModal';
import CustomDragOverlay from '../components/DragOverlay';
import NavigationCommandPalette from '../components/NavigationCommandPalette';
import Breadcrumb from '../components/Breadcrumb';
import ScrollToTop from '../components/ScrollToTop';
import { Plus, User, Settings, LogOut, Grid3X3, Menu, FileText, Folder, ChevronRight, ChevronLeft } from 'lucide-react';
import storageWrapper from '../utils/storage/storageWrapper';
import IndexedDBAdapter from '../utils/storage/IndexedDBAdapter';
import { useAuth } from '../contexts/AuthContextOptimized';
import { sessionCache } from '../utils/sessionCache';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToast } from '../hooks/useToast';
import { useSidebar } from '../contexts/SidebarContext';
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

export default function Dashboard() {
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
  
  // Project state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { isCollapsed: isSidebarCollapsed, toggleCollapsed: toggleSidebarCollapse, showMobileSidebar: showSidebar, toggleMobileSidebar, closeMobileSidebar } = useSidebar();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
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
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // Currently dragged item
  const [activeId, setActiveId] = useState(null);
  
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
      console.error('Error getting storage info:', error);
    }
  }, []);

  // Save entries using the storage wrapper
  const saveEntries = useCallback(async (updatedEntries) => {
    // Update UI immediately for responsiveness
    setEntries(updatedEntries);
    
    // Save to storage immediately
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
  const createNewEntry = useCallback(async (folderId = null) => {
    // Create a default text block for new documents
    const defaultBlock = {
      id: crypto.randomUUID(),
      type: 'text',
      content: '',
      position: 0
    };
    
    // Check for duplicate names and generate unique title
    let baseTitle = 'Untitled Document';
    let title = baseTitle;
    let counter = 2;
    
    // Get all documents in the same folder (or root if no folder)
    const documentsInSameLevel = entries.filter(doc => 
      doc.folder_id === folderId && 
      !doc.deleted_at
    );
    
    // Keep checking until we find a unique name
    while (documentsInSameLevel.some(doc => doc.title === title)) {
      title = `${baseTitle} (${counter})`;
      counter++;
    }
    
    const newEntry = {
      id: crypto.randomUUID(),
      title: title,
      preview: 'Click to start writing...',
      blocks: [defaultBlock], // Always start with at least one block
      tags: [],
      folder_id: folderId, // Add folder_id to the document
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        syncStatus: 'pending', // Track sync status
        createdLocally: true,
        isNewDocument: true // Flag to indicate this is a brand new document
      }
    };
    
    // Immediately save to IndexedDB for safety
    try {
      await IndexedDBAdapter.saveDocument(newEntry);
      console.log('New document saved to IndexedDB immediately');
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
    
    // Invalidate cache to ensure new document appears
    try {
      const adapter = await storageWrapper.getAdapter();
      if (adapter && typeof adapter.invalidateCache === 'function') {
        adapter.invalidateCache();
      } else if (adapter && adapter.supabaseAdapter && typeof adapter.supabaseAdapter.invalidateCache === 'function') {
        // For wrapped adapters
        adapter.supabaseAdapter.invalidateCache();
      }
    } catch (error) {
      console.warn('Could not invalidate cache:', error);
    }
    
    // Save the new document directly to avoid triggering updateAllDocuments
    try {
      await storageWrapper.saveDocument(newEntry);
      console.log('New document saved successfully');
    } catch (error) {
      console.error('Error saving new document:', error);
    }
    
    // Update local state
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
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
      // Cmd/Ctrl + K - Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
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
    let isMounted = true;
    let loadingInProgress = false;
    
    const loadEntries = async () => {
      // Prevent concurrent loads
      if (loadingInProgress || isInitialized.current) {
        console.log('Dashboard: Skipping load - already in progress or initialized');
        return;
      }
      
      loadingInProgress = true;
      const startTime = performance.now();
      console.log('Dashboard: Starting to load entries...');
      setIsLoading(true);
      
      try {
        // Ensure storage is initialized
        const initStart = performance.now();
        await storageWrapper.init();
        if (!isMounted) return;
        console.log(`Dashboard: Storage initialized (${Math.round(performance.now() - initStart)}ms)`);
        
        // Load entries
        const loadStart = performance.now();
        const savedEntries = await storageWrapper.getEntries();
        if (!isMounted) return;
        console.log(`Dashboard: Loaded ${savedEntries?.length || 0} entries (${Math.round(performance.now() - loadStart)}ms)`);
        console.log(`Dashboard: Total load time: ${Math.round(performance.now() - startTime)}ms`);
        
        if (savedEntries && savedEntries.length > 0) {
          // Check session cache first for any cached documents
          const cachedDocs = sessionCache.getAllDocuments();
          const cachedMap = new Map(cachedDocs.map(doc => [doc.id, doc]));
          
          // Merge cached data with saved entries
          const mergedEntries = savedEntries.map(entry => {
            const cached = cachedMap.get(entry.id);
            if (cached) {
              // Use cached version but update with any newer fields
              return {
                ...entry,
                ...cached,
                updatedAt: entry.updatedAt > cached.updatedAt ? entry.updatedAt : cached.updatedAt
              };
            }
            
            // Clean up any stale isNew flags
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
          
          setEntries(mergedEntries);
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
        if (isMounted) {
          await updateStorageInfo();
        }
        
        // Load projects if using Supabase
        if (storageWrapper.isSupabase && isMounted) {
          try {
            const projectList = await storageWrapper.getProjects();
            console.log(`Dashboard: Loaded ${projectList?.length || 0} projects`);
            setProjects(projectList || []);
          } catch (error) {
            console.error('Error loading projects:', error);
          }
        }
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        if (isMounted) {
          console.log('Dashboard: Setting isLoading to false');
          setIsLoading(false);
          isInitialized.current = true;
          loadingInProgress = false;
        }
      }
    };

    loadEntries();
    
    return () => {
      isMounted = false;
    };
  }, [updateStorageInfo]);
  


  // Update entry
  const updateEntry = useCallback(async (entryId, updates) => {
    // Handle deletion when updates is null
    if (updates === null) {
      try {
        // Delete from storage first
        await storageWrapper.deleteEntry(entryId);
        
        // Then update local state
        const updatedEntries = entries.filter(entry => entry.id !== entryId);
        setEntries(updatedEntries);
        
        // If we're deleting the currently expanded entry, close it
        if (expandedEntry && expandedEntry.id === entryId) {
          setExpandedEntry(null);
        }
        
        // Update storage info after deletion
        updateStorageInfo();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
      
      return;
    }
    
    // Find the entry being updated
    const entryToUpdate = entries.find(entry => entry.id === entryId);
    if (!entryToUpdate) return;
    
    // Create updated entry
    const updatedEntry = {
      ...entryToUpdate,
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
    
    // Update local state
    const updatedEntries = entries.map(entry => 
      entry.id === entryId ? updatedEntry : entry
    );
    setEntries(updatedEntries);
    
    // Update expandedEntry if it's the one being edited
    if (expandedEntry && expandedEntry.id === entryId) {
      setExpandedEntry(updatedEntry);
    }
    
    // Save only this document to storage - use requestIdleCallback for non-blocking save
    const saveOperation = async () => {
      try {
        // CRITICAL FIX: Don't send blocks if they weren't in the update
        // This prevents overwriting blocks with empty array when updating tags/title
        const documentToSave = updates.blocks !== undefined 
          ? updatedEntry 
          : { ...updatedEntry, blocks: undefined };
          
        await storageWrapper.saveDocument(documentToSave);
        // Update storage info after save
        updateStorageInfo();
      } catch (error) {
        console.error('Error saving document:', error);
        // If single document save fails, fall back to saving all
        try {
          await storageWrapper.saveEntries(updatedEntries);
        } catch (fallbackError) {
          console.error('Fallback save also failed:', fallbackError);
        }
      }
    };
    
    // Use requestIdleCallback for truly non-blocking saves
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        saveOperation();
      }, { timeout: 2000 }); // Fallback to 2 seconds if idle time not available
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        requestAnimationFrame(() => {
          saveOperation();
        });
      }, 16); // Wait for next frame
    }
  }, [entries, expandedEntry, updateStorageInfo]);

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
        setLinkCallback(() => async (selected) => {
          if (selected.isNew) {
            // Create new document with the title
            const newEntry = {
              id: crypto.randomUUID(),
              title: selected.title,
              preview: 'Click to start writing...',
              blocks: [],
              tags: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {
                syncStatus: 'pending',
                createdLocally: true
              }
            };
            
            // Immediately save to IndexedDB
            try {
              await IndexedDBAdapter.saveDocument(newEntry);
              console.log('New linked document saved to IndexedDB');
            } catch (error) {
              console.error('Failed to save to IndexedDB:', error);
            }
            
            // Invalidate cache
            try {
              const adapter = await storageWrapper.getAdapter();
              if (adapter && typeof adapter.invalidateCache === 'function') {
                adapter.invalidateCache();
              } else if (adapter && adapter.supabaseAdapter && typeof adapter.supabaseAdapter.invalidateCache === 'function') {
                adapter.supabaseAdapter.invalidateCache();
              }
            } catch (error) {
              console.warn('Could not invalidate cache:', error);
            }
            
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
  
  // Project CRUD handlers
  const handleCreateProject = useCallback(async (projectData) => {
    try {
      const newProject = await storageWrapper.createProject(projectData);
      setProjects([...projects, newProject]);
      toast.success('Project created successfully');
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  }, [projects, toast]);
  
  const handleUpdateProject = useCallback(async (projectId, updates) => {
    try {
      const updatedProject = await storageWrapper.updateProject(projectId, updates);
      setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
      toast.success('Project updated successfully');
      setShowProjectModal(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  }, [projects, toast]);
  
  const handleDeleteProject = useCallback(async (project) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? Documents will be moved to uncategorized.`)) {
      return;
    }
    
    try {
      await storageWrapper.deleteProject(project.id);
      setProjects(projects.filter(p => p.id !== project.id));
      if (selectedProjectId === project.id) {
        setSelectedProjectId(null);
      }
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  }, [projects, selectedProjectId, toast]);

  const handleToggleFavorite = useCallback(async (project) => {
    try {
      const updatedProject = {
        ...project,
        is_favorite: !project.is_favorite
      };
      
      await storageWrapper.updateProject(project.id, { is_favorite: updatedProject.is_favorite });
      setProjects(projects.map(p => p.id === project.id ? updatedProject : p));
      
      toast.success(updatedProject.is_favorite ? 'Added to favorites' : 'Removed from favorites', 2000);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  }, [projects, toast]);
  
  const handleProjectSelect = useCallback((projectId) => {
    setSelectedProjectId(projectId);
    setViewMode('documents');
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      closeMobileSidebar();
    }
  }, []);

  // Handle document selection for multi-select
  const handleDocumentSelect = useCallback((docId, event) => {
    const { toggleSelection, selectRange } = useDocumentOrganization.getState();
    
    if (event.shiftKey && useDocumentOrganization.getState().lastSelectedId) {
      // Range selection
      selectRange(useDocumentOrganization.getState().lastSelectedId, docId, entries);
    } else {
      // Toggle selection
      toggleSelection(docId);
    }
  }, [entries]);

  // Command palette navigation handlers
  const handleCommandPaletteNavigate = useCallback((type, item) => {
    setShowCommandPalette(false);
    
    if (type === 'document') {
      handleDocumentExpand(item);
    } else if (type === 'project') {
      setSelectedProjectId(item.id);
      setViewMode('documents');
    }
  }, [handleDocumentExpand]);

  const handleCommandPaletteCreateDocument = useCallback(() => {
    setShowCommandPalette(false);
    createNewEntry();
  }, [createNewEntry]);

  const handleCommandPaletteCreateProject = useCallback(() => {
    setShowCommandPalette(false);
    setEditingProject(null);
    setShowProjectModal(true);
  }, []);

  // Filter entries based on search, selected tags, and project
  const filteredEntries = entries.filter(entry => {
    // First filter by project
    const matchesProject = 
      selectedProjectId === null || // Show all
      (selectedProjectId === 'uncategorized' && !entry.project_id) || // Uncategorized
      entry.project_id === selectedProjectId; // Specific project
    
    // Then filter by search term
    const matchesSearch = searchTerm === '' || 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Finally filter by selected tags (if any)
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => entry.tags?.includes(tag));
    
    return matchesProject && matchesSearch && matchesTags;
  });
  
  // Count uncategorized documents
  const uncategorizedCount = entries.filter(entry => !entry.project_id).length;
  
  // Drag and drop handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setActiveId(active.id);
    
    // Check if this document is part of a selection
    if (selectedDocuments.has(active.id)) {
      // Drag all selected documents
      const selectedDocs = entries.filter(e => selectedDocuments.has(e.id));
      startDrag(selectedDocs);
    } else {
      // Drag only this document
      const doc = entries.find(e => e.id === active.id);
      if (doc) {
        startDrag([doc]);
      }
    }
  }, [entries, selectedDocuments, startDrag]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over || !over.id.startsWith('project-')) {
      endDrag();
      return;
    }
    
    // Extract project ID from drop zone ID
    const targetProjectId = over.id === 'project-uncategorized' 
      ? null 
      : over.id.replace('project-', '');
    
    // Get documents to move
    let documentsToMove = [];
    if (selectedDocuments.has(active.id)) {
      documentsToMove = Array.from(selectedDocuments);
    } else {
      documentsToMove = [active.id];
    }
    
    // Filter out documents that are already in the target project
    const documentsToActuallyMove = documentsToMove.filter(docId => {
      const doc = entries.find(e => e.id === docId);
      return doc && doc.project_id !== targetProjectId;
    });
    
    // If no documents need to be moved, just end the drag
    if (documentsToActuallyMove.length === 0) {
      endDrag();
      return;
    }
    
    // Move documents
    await moveDocuments(documentsToActuallyMove, targetProjectId, async (count) => {
      toast.success(`Moved ${count} ${count === 1 ? 'document' : 'documents'}`, 3000);
      
      // Update local state immediately for responsive UI
      const updatedEntries = entries.map(entry => {
        if (documentsToMove.includes(entry.id)) {
          return { ...entry, project_id: targetProjectId };
        }
        return entry;
      });
      setEntries(updatedEntries);
      
      // Refresh projects to update counts
      const refreshedProjects = await storageWrapper.getProjects();
      setProjects(refreshedProjects);
    });
    
    endDrag();
  }, [selectedDocuments, entries, moveDocuments, endDrag, toast]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    endDrag();
  }, [endDrag]);

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

  // Show skeleton UI while loading for better perceived performance
  // Show loading skeleton only during initial load
  if (isLoading && !isInitialized.current) {
    return (
      <div className="flex flex-col h-full relative bg-dark-primary">
        {/* Floating Tags Skeleton */}
        <div className="absolute left-3 top-24 bottom-6 z-30 max-w-[160px]">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-10 bg-gray-800/30 rounded border border-dashed border-dark-secondary/40 animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Header Skeleton */}
        <div className="flex-shrink-0">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-dark-secondary/20">
            {/* Logo and Brand */}
            <div className="flex items-center gap-2.5 ml-56">
              <LogoMinimal size={32} />
              <div className="h-7 w-16 bg-gray-800/50 rounded animate-pulse" />
            </div>
            
            {/* Stats and Profile */}
            <div className="flex items-center gap-4 mr-8">
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-800/50 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-800/50 rounded animate-pulse" />
              </div>
              <div className="w-8 h-8 bg-gray-800/50 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Search and Actions Bar */}
          <div className="px-6 py-3 ml-56">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 bg-gray-800/30 rounded animate-pulse" />
                <div className="w-20 h-10 bg-gray-800/30 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton with margin for tags */}
        <div className="flex-grow overflow-hidden px-6 ml-56">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="group">
                <div className="bg-dark-secondary/30 rounded-lg p-4 h-[140px] 
                                border border-dark-secondary/50">
                  {/* Title skeleton */}
                  <div className="h-5 bg-gray-800/50 rounded w-3/4 mb-3 animate-pulse" />
                  
                  {/* Preview skeleton */}
                  <div className="space-y-2 mb-3">
                    <div className="h-3 bg-gray-800/30 rounded animate-pulse" />
                    <div className="h-3 bg-gray-800/30 rounded w-5/6 animate-pulse" />
                  </div>
                  
                  {/* Tags skeleton */}
                  <div className="flex gap-2 mt-auto">
                    <div className="h-5 w-16 bg-gray-800/30 rounded-full animate-pulse" />
                    <div className="h-5 w-20 bg-gray-800/30 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (expandedEntry) {
    console.log('Dashboard: Showing ExpandedView instead of grid');
    return (
      <div 
        className="h-screen overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `${isSidebarCollapsed ? '80px' : '280px'} 1fr`,
          gridTemplateRows: '1fr',
          transition: 'grid-template-columns 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'grid-template-columns',
          contain: 'layout style'
        }}
      >
        {/* Mobile overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => closeMobileSidebar()}
          />
        )}
        
        {/* Project Sidebar */}
        <div 
          className={`
            bg-dark-primary lg:bg-transparent
            flex flex-col
            transition-all duration-200 ease-out
            h-full overflow-hidden
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
          style={{ gridColumn: '1' }}
        >
          {/* Sidebar Content wrapper for spacing */}
          <div className="flex-1 min-h-0 pt-20 pb-7 flex flex-col">
            <ProjectExplorer
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
              className="flex-1 min-h-0"
            onDocumentSelect={(data) => {
              if (data?.action === 'create') {
                createNewEntry(data.folderId);
              } else if (data?.id) {
                const doc = entries.find(e => e.id === data.id);
                if (doc) {
                  handleDocumentExpand(doc);
                }
              } else if (data) {
                // Direct document object passed
                handleDocumentExpand(data);
              }
            }}
            selectedDocumentId={expandedEntry?.id}
            projects={projects}
            documents={entries}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
            onDocumentMove={async (docId, folderId) => {
              // Update the document's folder_id
              await updateEntry(docId, { folder_id: folderId });
            }}
            onDocumentDelete={async (document) => {
              const docId = document.id || document;
              if (confirm(`Are you sure you want to delete "${document.title || 'this document'}"?`)) {
                await deleteEntry(docId);
                // Refresh the entries list
                await loadEntries();
                toast.success('Document deleted successfully');
              }
            }}
            onCreateProject={() => {
              setEditingProject(null);
              setShowProjectModal(true);
            }}
            onUpdateProject={(project) => {
              setEditingProject(project);
              setShowProjectModal(true);
            }}
            onDeleteProject={handleDeleteProject}
            onToggleFavorite={handleToggleFavorite}
            totalDocuments={entries.length}
            uncategorizedCount={entries.filter(e => !e.project_id).length}
          />
          </div>
        </div>
        
        {/* Expanded View Content */}
        <main className="flex flex-col min-w-0 overflow-hidden" style={{ gridColumn: '2' }}>
          <ExpandedView 
            entry={expandedEntry} 
            onClose={() => setExpandedEntry(null)}
            onUpdate={updateEntry}
            allEntries={entries}
          />
        </main>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      modifiers={[restrictToWindowEdges]}
    >
      <div className="h-screen overflow-hidden dashboard-container flex flex-col">
        {/* Fixed Header - Outside Grid */}
        <header className="flex-shrink-0 border-b border-dark-secondary/20 bg-dark-primary z-30">
          {/* Top Navigation Bar - Compact and Efficient */}
          <div className="flex items-center justify-between px-4 md:px-6 py-2">
            {/* Logo and Brand - Fixed Position */}
            <div className="flex items-center gap-2.5" style={{ marginLeft: '288px' }}>
              {/* Mobile menu button */}
              <button
                onClick={() => toggleMobileSidebar()}
                className="p-2 hover:bg-dark-secondary/40 rounded transition-colors lg:hidden absolute left-4"
              >
                <Menu size={20} className="text-text-primary" />
              </button>
              <LogoMinimal size={32} />
              <h1 className="text-xl font-semibold text-text-primary">Devlog</h1>
            </div>

            {/* Stats and Profile - Moved from main content */}
            <div className="flex items-center gap-4 mr-8">
              {/* Document Stats - Inline and Minimal */}
              <div className="hidden sm:flex items-center gap-3 text-xs">
                <span className="text-text-secondary/70">
                  <span className="text-text-primary font-medium">{entries.length}</span> docs
                </span>
                <span className="text-text-secondary/40">•</span>
                <span className="text-text-secondary/70">
                  <span className="text-text-primary font-medium">{entries.reduce((acc, e) => acc + (e.blocks?.length || e.blockCount || 0), 0)}</span> blocks
                </span>
              </div>
              
              {/* Profile Dropdown - Full Functionality */}
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
                      <button 
                        onClick={() => navigate('/settings')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-left 
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
        </header>

        {/* Grid Container - Below Header */}
        <div 
          className="flex-1 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `${isSidebarCollapsed ? '80px' : '280px'} 1fr`,
            gridTemplateRows: '1fr',
            transition: 'grid-template-columns 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'grid-template-columns',
            contain: 'layout style'
          }}
        >
      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Project Sidebar */}
      <div 
        className={`
          bg-dark-primary lg:bg-transparent
          flex flex-col
          transition-all duration-300 ease-cubic
          h-full overflow-hidden
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ gridColumn: '1' }}
      >
        {/* Sidebar Content wrapper for spacing */}
        <div className="flex-1 min-h-0 pb-7 flex flex-col">
          <ProjectExplorer
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            className="flex-1 min-h-0"
          onDocumentSelect={(data) => {
            if (data?.action === 'create') {
              createNewEntry(data.folderId);
            } else if (data?.id) {
              const doc = entries.find(e => e.id === data.id);
              if (doc) {
                handleDocumentExpand(doc);
              }
            } else if (data) {
              // Direct document object passed
              handleDocumentExpand(data);
            }
          }}
          selectedDocumentId={expandedEntry?.id}
          height="h-full"
          projects={projects}
          documents={entries}
          selectedProjectId={selectedProjectId}
          onProjectSelect={handleProjectSelect}
          onDocumentMove={async (docId, folderId) => {
            // Update the document's folder_id
            await updateEntry(docId, { folder_id: folderId });
          }}
          onDocumentDelete={async (document) => {
            const docId = document.id || document;
            if (confirm(`Are you sure you want to delete "${document.title || 'this document'}"?`)) {
              await deleteEntry(docId);
              // Refresh the entries list
              await loadEntries();
              toast.success('Document deleted successfully');
            }
          }}
          onCreateProject={() => {
            setEditingProject(null);
            setShowProjectModal(true);
          }}
          onUpdateProject={(project) => {
            setEditingProject(project);
            setShowProjectModal(true);
          }}
          onDeleteProject={handleDeleteProject}
          onToggleFavorite={handleToggleFavorite}
          totalDocuments={entries.length}
          uncategorizedCount={entries.filter(e => !e.project_id).length}
        />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-out" style={{ gridColumn: '2' }}>
        {/* Content Header - Search and Actions Only */}
        <div className="flex-shrink-0">

        {/* Search and Actions Bar - Compact and Efficient */}
        <div className="px-4 md:px-6 py-3">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-3">
              <Breadcrumb
                viewMode="documents"
                selectedProject={selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null}
                documentTitle={expandedEntry?.title}
                totalDocuments={entries.length}
                onNavigateHome={() => {
                  setSelectedProjectId(null);
                }}
                onNavigateProjects={() => {}}
              />
            </div>
            
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

        {/* Main Content - Documents Grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pb-4 min-h-0 custom-scrollbar"
             style={{ 
               scrollbarWidth: 'thin',
               scrollbarColor: 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
             }}>
          <VirtualizedGrid 
            entries={filteredEntries}
            onExpand={handleDocumentExpand}
            searchTerm={searchTerm}
            selectedDocuments={selectedDocuments}
            onSelectDocument={handleDocumentSelect}
            selectionMode={selectedDocuments.size > 0}
            sidebarCollapsed={isSidebarCollapsed}
          />
        </div>
      </main>

        </div>
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
      
      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSave={async (projectData) => {
            if (editingProject) {
              await handleUpdateProject(editingProject.id, projectData);
            } else {
              await handleCreateProject(projectData);
            }
          }}
          project={editingProject}
          title={editingProject ? 'Edit Project' : 'Create New Project'}
        />
      )}
      
      {/* Drag Overlay */}
      <DragOverlay 
        modifiers={[snapCenterToCursor, restrictToWindowEdges]}
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
        style={{ cursor: 'grabbing' }}
      >
        {activeId && (
          <CustomDragOverlay 
            documents={
              selectedDocuments.has(activeId) && selectedDocuments.size > 1
                ? entries.filter(e => selectedDocuments.has(e.id))
                : entries.filter(e => e.id === activeId)
            }
          />
        )}
      </DragOverlay>

      {/* Navigation Command Palette */}
      <NavigationCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        documents={entries}
        projects={projects}
        onNavigate={handleCommandPaletteNavigate}
        onCreateDocument={handleCommandPaletteCreateDocument}
        onCreateProject={handleCommandPaletteCreateProject}
      />
    </DndContext>
  );
}