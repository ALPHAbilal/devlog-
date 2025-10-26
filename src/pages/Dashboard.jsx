import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import EntryCard from '../components/EntryCard';
import ExpandedView from '../components/ExpandedViewEnhanced';
import MobileDocumentViewer from '../components/MobileDocumentViewer';
import { useResponsive } from '../hooks/useResponsive';
import SearchBar from '../components/SearchBar';
import DocumentLinkModal from '../components/DocumentLinkModal';
import VirtualizedGrid from '../components/VirtualizedGrid';
import DocumentGridRedesigned from '../components/DocumentGridRedesigned';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import ProjectCard from '../components/ProjectCard';
// import ProjectExplorer from '../components/ProjectExplorer/ProjectExplorer';
// import ProjectExplorerV2 from '../components/ProjectExplorer/ProjectExplorerV2';
import ProjectExplorerV2 from '../components/ProjectExplorer/ProjectExplorerRedesigned';
import ProjectModal from '../components/ProjectModal';
import CustomDragOverlay from '../components/DragOverlay';
import NavigationCommandPalette from '../components/NavigationCommandPalette';
import Breadcrumb from '../components/Breadcrumb';
import ScrollToTop from '../components/ScrollToTop';
import MobileFAB from '../components/MobileFAB';
import MobileBottomSheet from '../components/MobileBottomSheet';
import MobileContextMenu from '../components/MobileContextMenu';
import { useTouchGestures, usePullToRefresh } from '../hooks/useTouchGestures';
import { Plus, User, Settings, LogOut, Grid3X3, Menu, FileText, Folder, ChevronRight, ChevronLeft, MoreVertical, Search } from 'lucide-react';
import storageWrapper, { deleteEntry } from '../utils/storage/storageWrapper';
import IndexedDBAdapter from '../utils/storage/IndexedDBAdapter';
import { useAuth } from '../contexts/AuthContextOptimized';
import { sessionCache } from '../utils/sessionCache';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToast } from '../hooks/useToast';
import { useSidebar } from '../contexts/SidebarContext';
import { useAnalytics, useDocumentAnalytics } from '../hooks/useAnalytics';
import TrialBanner from '../components/TrialBanner';
import useDocumentOrganization from '../hooks/useDocumentOrganization';
import { useFolders } from '../hooks/useFolders';
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
  const location = useLocation();
  const { documentId } = useParams();
  const { user, signOut, trialStatus } = useAuth();
  const [entries, setEntries] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]); // All documents for sidebar (includes docs in folders)
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCallback, setLinkCallback] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  
  // Analytics hooks
  const { trackEvent } = useAnalytics();
  const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();

  // Folders hook - folders are auto-loaded by the hook
  const { folders, refreshFolders } = useFolders();

  // Check for expired trial
  useEffect(() => {
    if (!user || !trialStatus) return;
    
    // If trial expired and no active subscription
    if (trialStatus.is_trial && !trialStatus.is_active) {
      navigate('/upgrade');
    }
  }, [user, trialStatus, navigate]);
  
  // Project state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const { isCollapsed: isSidebarCollapsed, toggleCollapsed: toggleSidebarCollapse, showMobileSidebar: showSidebar, toggleMobileSidebar, closeMobileSidebar } = useSidebar();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMobileSidebarSheet, setShowMobileSidebarSheet] = useState(false);
  const [showMobileContextMenu, setShowMobileContextMenu] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const searchBarRef = useRef(null);

  // Check if we're in projects view
  const isProjectsView = location.search.includes('view=projects');
  
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
  
  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Pull to refresh on mobile
  const { elementRef: pullToRefreshRef, isPulling, pullDistance, pullProgress } = usePullToRefresh(
    async () => {
      await loadEntries();
      toast.success('Documents refreshed');
    },
    isMobile ? 80 : 0 // Only enable on mobile
  );
  
  // Handle document expansion with lazy block loading
  const handleDocumentExpand = useCallback((document) => {
    // Open document immediately - ExpandedViewEnhanced will handle progressive loading
    // Clear blocks array to force full reload from database
    const documentForEdit = {
      ...document,
      blocks: undefined // Force block loader to fetch all blocks
    };
    setExpandedEntry(documentForEdit);
    
    // Update URL to reflect the opened document
    navigate(`/dashboard/${document.id}`, { replace: true });
  }, [navigate]);

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
      
      // Track document creation
      trackDocumentEvent('created', newEntry.id, {
        folder_id: folderId || 'root',
        creation_method: 'manual',
        has_folder: !!folderId
      });
    } catch (error) {
      console.error('Error saving new document:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status
      });
    }
    
    // Update local state
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setExpandedEntry(newEntry);
  }, [entries, saveEntries, trackDocumentEvent]);

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
  
  // Mobile navigation event listeners
  useEffect(() => {
    const handleFocusSearch = () => {
      searchBarRef.current?.focus();
    };
    
    const handleCreateNewDocument = () => {
      createNewEntry();
    };
    
    window.addEventListener('focusSearch', handleFocusSearch);
    window.addEventListener('createNewDocument', handleCreateNewDocument);
    
    return () => {
      window.removeEventListener('focusSearch', handleFocusSearch);
      window.removeEventListener('createNewDocument', handleCreateNewDocument);
    };
  }, [createNewEntry]);
  
  // Create a ref to track if we're currently loading
  const loadingRef = useRef(false);
  
  // Load entries function - accessible from multiple places
  const loadEntries = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current || (isInitialized.current && !isPulling)) {
      console.log('Dashboard: Skipping load - already loading or initialized');
      return;
    }
    
    loadingRef.current = true;
    const startTime = performance.now();
    console.log('Dashboard: Starting to load entries...');
    setIsLoading(true);
    
    try {
      // Ensure storage is initialized
      const initStart = performance.now();
      await storageWrapper.init();
      console.log(`Dashboard: Storage initialized (${Math.round(performance.now() - initStart)}ms)`);
      
      // Load documents (folders are auto-loaded by useFolders hook)
      const loadStart = performance.now();
      const savedEntries = await storageWrapper.getEntries();
      console.log(`Dashboard: Loaded ${savedEntries?.length || 0} documents (${Math.round(performance.now() - loadStart)}ms)`);
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

        // Store ALL documents for sidebar (includes documents in folders)
        setAllDocuments(mergedEntries);

        // Note: Folders are combined with documents in the re-combine effect (lines 503-547)
        // This ensures folders are always included regardless of load timing
        // For now, just set root documents - folders will be added by re-combine effect
        const rootDocuments = mergedEntries
          .filter(doc => !doc.folder_id)  // Only root-level documents
          .map(doc => ({ ...doc, type: 'document' }));  // Add type field

        console.log(`[DEBUG-DASHBOARD] Initial load: ${rootDocuments.length} root documents (folders will be combined by re-combine effect)`);
        setEntries(rootDocuments);
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

        // Even with no documents, check if there are folders
        const rootFolders = (folders || [])  // Use folders from hook state
          .filter(folder => !folder.parent_id)
          .map(folder => ({
            ...folder,
            type: 'folder',
            items: folder.children || []
          }));

        // Store initial entries as all documents
        setAllDocuments(initialEntries);

        // Combine initial entries with any existing folders
        const combined = [...rootFolders, ...initialEntries.map(e => ({ ...e, type: 'document' }))]
          .sort((a, b) => (a.position || 0) - (b.position || 0));

        setEntries(combined);
        await storageWrapper.saveEntries(initialEntries);
      }
      
      // Get initial storage info
      await updateStorageInfo();
      
      // Load projects if using Supabase
      if (storageWrapper.isSupabase) {
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
      console.log('Dashboard: Setting isLoading to false');
      setIsLoading(false);
      isInitialized.current = true;
      loadingRef.current = false;
    }
  }, [isPulling, updateStorageInfo]);

  // Combine folders and documents whenever either changes (eliminates race condition)
  useEffect(() => {
    // Wait for both data sources to be ready
    if (!allDocuments || allDocuments.length === 0) {
      console.log(`[DEBUG-DASHBOARD] Waiting for documents to load: ${allDocuments?.length || 0}`);
      return;
    }

    // Get root folders (if any exist)
    const rootFolders = (folders || [])
      .filter(f => !f.parent_id)
      .map(f => ({
        ...f,
        type: 'folder',
        items: f.children || []
      }));

    // Get root documents (not in any folder)
    const rootDocs = allDocuments
      .filter(doc => !doc.folder_id)
      .map(doc => ({ ...doc, type: 'document' }));

    // Combine and sort by position
    const combined = [...rootFolders, ...rootDocs]
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    console.log(`[DEBUG-DASHBOARD] Combined: ${rootFolders.length} folders + ${rootDocs.length} documents = ${combined.length} total items`);
    console.log('[DEBUG-DASHBOARD] Sample:', {
      firstFolder: rootFolders[0]?.name || 'none',
      firstDoc: rootDocs[0]?.title || 'none',
      foldersState: folders?.length || 0
    });

    setEntries(combined);
  }, [folders, allDocuments]); // Re-run whenever folders OR documents change

  // Load entries on mount
  useEffect(() => {
    let isMounted = true;
    
    loadEntries();
    
    return () => {
      isMounted = false;
    };
  }, [loadEntries]);
  
  // Sync URL with document state
  useEffect(() => {
    if (documentId && entries.length > 0) {
      const doc = entries.find(e => e.id === documentId);
      if (doc && !expandedEntry) {
        setExpandedEntry(doc);
        // Don't track here - ExpandedViewEnhanced will track the view event
        // This prevents duplicate tracking
        startDocumentTimer('editing', doc.id);
      } else if (!doc && documentId) {
        // Document not found, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [documentId, entries, expandedEntry, navigate, trackDocumentEvent, startDocumentTimer]);


  // Update entry
  const updateEntry = useCallback(async (entryId, updates) => {
    // Handle deletion when updates is null
    if (updates === null) {
      try {
        // Track document deletion
        const entryToDelete = entries.find(entry => entry.id === entryId);
        if (entryToDelete) {
          trackDocumentEvent('deleted', entryId, {
            had_content: entryToDelete.blocks?.length > 1 || 
                        (entryToDelete.blocks?.[0]?.content?.length > 0),
            document_age_days: Math.floor((Date.now() - new Date(entryToDelete.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          });
        }
        
        // Delete from storage first
        await storageWrapper.deleteEntry(entryId);
        
        // Then update local state
        const updatedEntries = entries.filter(entry => entry.id !== entryId);
        setEntries(updatedEntries);
        
        // If we're deleting the currently expanded entry, close it
        if (expandedEntry && expandedEntry.id === entryId) {
          setExpandedEntry(null);
          endDocumentTimer('editing', entryId);
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
    
    // MILESTONE 1: Skip block saves - let Smart Sync handle them
    if (updates.blocks) {
      console.log('Dashboard: Skipping block save - Smart Sync will handle it');
      // Don't save blocks through storageWrapper, Smart Sync is already handling this
      return;
    }
    
    // Save only this document to storage - use requestIdleCallback for non-blocking save
    const saveOperation = async () => {
      try {
        // Only save non-block updates (title, tags, etc.)
        const documentToSave = { ...updatedEntry, blocks: undefined };
          
        console.log('Dashboard: Saving metadata only (no blocks):', {
          id: documentToSave.id,
          title: documentToSave.title,
          hasBlocks: false
        });
          
        await storageWrapper.saveDocument(documentToSave);
        // Update storage info after save
        updateStorageInfo();
      } catch (error) {
        console.error('Error saving document:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        // If single document save fails, fall back to saving all
        try {
          await storageWrapper.saveEntries(updatedEntries);
        } catch (fallbackError) {
          console.error('Fallback save also failed:', {
            message: fallbackError.message,
            code: fallbackError.code,
            details: fallbackError.details,
            hint: fallbackError.hint,
            status: fallbackError.status
          });
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
      // Find the document by title (skip folders)
      const linkedDoc = entries.find(entry =>
        entry.type !== 'folder' &&
        entry.title?.toLowerCase() === documentTitle.toLowerCase()
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

  // Helper function to extract all searchable text content from blocks
  const getFullTextContent = useCallback((entry) => {
    // If blocks are not loaded (undefined), return empty string
    // This handles the case where documents are loaded without blocks for performance
    if (!entry.blocks) return '';
    
    // If blocks is an empty array, that's valid - the document just has no blocks
    if (entry.blocks.length === 0) return '';
    
    const textParts = [];
    
    entry.blocks.forEach(block => {
      switch (block.type) {
        case 'text':
        case 'heading':
          if (block.content) textParts.push(block.content);
          break;
        case 'code':
          if (block.filePath) textParts.push(block.filePath);
          if (block.content) textParts.push(block.content);
          break;
        case 'ai':
          if (block.messages && Array.isArray(block.messages)) {
            block.messages.forEach(msg => {
              if (msg.content) textParts.push(msg.content);
            });
          }
          break;
        case 'table':
          if (block.data?.rows) {
            block.data.rows.forEach(row => {
              if (Array.isArray(row)) {
                textParts.push(row.join(' '));
              }
            });
          }
          if (block.data?.headers) {
            textParts.push(block.data.headers.join(' '));
          }
          break;
        case 'todo':
          if (block.data?.todos && Array.isArray(block.data.todos)) {
            block.data.todos.forEach(todo => {
              if (todo.text) textParts.push(todo.text);
            });
          }
          break;
        case 'filetree':
          if (block.treeData) {
            const extractFileNames = (items) => {
              items.forEach(item => {
                if (item.name) textParts.push(item.name);
                if (item.children) extractFileNames(item.children);
              });
            };
            extractFileNames(block.treeData);
          }
          break;
      }
      
      // Also check for tags in blocks
      if (block.tags && Array.isArray(block.tags)) {
        textParts.push(block.tags.join(' '));
      }
    });
    
    return textParts.join(' ').toLowerCase();
  }, []);

  // Filter entries based on search, selected tags, and project
  const filteredEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
    // First filter by project
    const matchesProject = 
      selectedProjectId === null || // Show all
      (selectedProjectId === 'uncategorized' && !entry.project_id) || // Uncategorized
      entry.project_id === selectedProjectId; // Specific project
    
    // Then filter by search term
    const matchesSearch = searchTerm === '' || (() => {
      const lowerSearchTerm = searchTerm.toLowerCase();

      // Get the display name (folders use 'name', documents use 'title')
      const displayName = entry.title || entry.name || '';

      // Log search start
      if (searchTerm && searchTerm.length > 0) {
        console.log(`\n📄 Checking ${entry.type || 'document'}: "${displayName}"`);
      }

      // Check title/name
      const titleMatch = displayName && displayName.toLowerCase().includes(lowerSearchTerm);
      if (searchTerm) {
        console.log(`  ✓ Title match: ${titleMatch ? '✅' : '❌'} (title: "${displayName}")`);
      }
      if (titleMatch) return true;

      // Check preview (only for documents)
      const previewMatch = entry.preview && entry.preview.toLowerCase().includes(lowerSearchTerm);
      if (searchTerm) {
        const previewSnippet = entry.preview ? entry.preview.substring(0, 50) + '...' : 'No preview';
        console.log(`  ✓ Preview match: ${previewMatch ? '✅' : '❌'} (preview: "${previewSnippet}")`);
      }
      if (previewMatch) return true;

      // Check tags (only for documents)
      const tagsMatch = entry.tags?.some(tag => tag && tag.toLowerCase().includes(lowerSearchTerm));
      if (searchTerm) {
        console.log(`  ✓ Tags match: ${tagsMatch ? '✅' : '❌'} (tags: [${entry.tags?.join(', ') || 'none'}])`);
      }
      if (tagsMatch) return true;
      
      // Check full content of all blocks (only if blocks are loaded)
      // If blocks are not loaded (undefined), we can't search their content
      let contentMatch = false;
      if (entry.blocks !== undefined) {
        const blocksLoaded = true;
        const fullContent = getFullTextContent(entry);
        contentMatch = fullContent && fullContent.includes(lowerSearchTerm);
        if (searchTerm) {
          console.log(`  ✓ Blocks loaded: ✅ (${entry.blocks.length} blocks)`);
          const contentSnippet = fullContent ? fullContent.substring(0, 100) + '...' : 'No content';
          console.log(`  ✓ Content match: ${contentMatch ? '✅' : '❌'} (content: "${contentSnippet}")`);
        }
      } else {
        if (searchTerm) {
          console.log(`  ✓ Blocks loaded: ❌ (blocks not loaded for performance)`);
          console.log(`  ✓ Content match: ⏭️  (skipped - blocks not loaded)`);
        }
      }
      
      const matched = titleMatch || previewMatch || tagsMatch || contentMatch;
      if (searchTerm) {
        console.log(`  ➡️  Result: ${matched ? '✅ MATCHED' : '❌ NOT MATCHED'}`);
      }
      
      return matched;
    })();
    
    // Finally filter by selected tags (if any)
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => entry.tags?.includes(tag));
    
    return matchesProject && matchesSearch && matchesTags;
  });

    console.log('[DEBUG-DASHBOARD] Filtered results:', {
      totalEntries: entries.length,
      filtered: filtered.length,
      folders: filtered.filter(e => e.type === 'folder').length,
      documents: filtered.filter(e => e.type === 'document').length
    });

    return filtered;
  }, [entries, selectedProjectId, searchTerm, selectedTags]);

  // Log search summary
  useEffect(() => {
    if (searchTerm && searchTerm.length > 0) {
      console.log(`\n🔍 Search Results for: "${searchTerm}"`);
      console.log(`📊 Summary: ${entries.length} documents searched, ${filteredEntries.length} matched`);
      if (filteredEntries.length === 0) {
        console.log(`💡 Tip: Try opening documents to load their full content for deeper search`);
      }
    }
  }, [searchTerm, filteredEntries.length, entries.length]);
  
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

  // Check for expanded document FIRST - it has its own loading skeleton
  if (expandedEntry) {
    console.log('Dashboard: Showing ExpandedView instead of grid');
    return (
      <div 
        className="h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-[auto,1fr]"
        style={{
          '--sidebar-width': isSidebarCollapsed ? '80px' : '280px',
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
            fixed lg:relative inset-y-0 left-0 z-40 w-[280px] lg:w-auto
            bg-dark-primary lg:bg-transparent
            flex flex-col
            transition-all duration-200 ease-out
            h-full overflow-hidden
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:col-start-1
          `}
        >
          {/* Sidebar Content wrapper for spacing */}
          <div className="flex-1 min-h-0 pt-20 pb-7 flex flex-col">
            <ProjectExplorerV2
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
              className="flex-1 min-h-0"
              onDocumentSelect={(data) => {
                if (data?.action === 'create') {
                  createNewEntry(data.folderId);
                } else if (data?.id) {
                  const doc = allDocuments.find(e => e.id === data.id);
                  if (doc) {
                    handleDocumentExpand(doc);
                  }
                } else if (data) {
                  // Direct document object passed
                  handleDocumentExpand(data);
                }
              }}
              selectedDocumentId={expandedEntry?.id}
              documents={allDocuments}
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
            />
          </div>
        </div>
        
        {/* Expanded View Content */}
        <main className="flex flex-col min-w-0 overflow-hidden lg:col-start-2">
          <MobileDocumentViewer 
            entry={expandedEntry} 
            onClose={() => {
              setExpandedEntry(null);
              navigate('/dashboard', { replace: true });
            }}
            onUpdate={updateEntry}
            allEntries={entries}
            onNavigateToDocument={(newEntry) => {
              setExpandedEntry(newEntry);
              navigate(`/dashboard/${newEntry.id}`, { replace: true });
            }}
          />
        </main>
      </div>
    );
  }

  // Show skeleton UI while loading for better perceived performance
  // Show loading skeleton only during initial load
  if (isLoading && !isInitialized.current) {
    return (
      <div className="h-screen overflow-hidden flex flex-col
                      bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32]">
        {/* Header Skeleton */}
        <header className="flex-shrink-0 z-30 relative
                          bg-[#0a1628]/40 backdrop-blur-xl
                          border-b border-white/5
                          shadow-2xl shadow-black/20">
          {/* Top Row */}
          <div className="flex items-center justify-between px-4 md:px-6 py-4">
            <div className="flex items-center gap-3 ml-0 lg:ml-[288px]">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
              <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3 mr-2 md:mr-8">
              <div className="h-9 w-20 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-9 w-9 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        {/* Search Bar Skeleton */}
        <div className="flex-shrink-0 px-4 md:px-6 py-4 ml-0 lg:ml-[288px]">
          <div className="h-12 max-w-3xl bg-white/5 border border-white/10 rounded-xl animate-pulse" />
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 min-h-0 px-4 md:px-6 pb-4 ml-0 lg:ml-[288px]">
          <div className="h-full bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl
                          border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-[#1a2942]/40 to-[#0f1d32]/40
                               rounded-xl border border-white/10 p-5 h-[140px]
                               animate-pulse"
                  >
                    {/* Title skeleton */}
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
                    {/* Chart skeleton */}
                    <div className="mt-auto h-16 flex items-end gap-1">
                      {[...Array(20)].map((_, j) => (
                        <div
                          key={j}
                          className="flex-1 bg-emerald-500/20 rounded-t"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
      {/* Figma Layout: Outer container with padding */}
      <div className="min-h-screen dashboard-container flex flex-col
                      bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32]">
        {/* Trial Banner - Above everything */}
        <TrialBanner trialStatus={trialStatus} />

        {/* Figma Layout: Main content area with padding and max-width */}
        <div className="flex-1 p-6">
          <div className="flex gap-6 h-[calc(100vh-3rem)] max-w-[1800px] mx-auto">
            {/* Mobile Sidebar Overlay */}
            {showSidebar && !isMobile && (
              <div
                className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}

            {/* Sidebar Bento Box - Desktop always visible, mobile overlay */}
            <div className={`
              ${isMobile ? 'fixed inset-y-0 left-0 z-40 transition-transform duration-300' : ''}
              ${isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'}
              ${!isMobile ? 'flex-shrink-0' : ''}
            `}>
              <ProjectExplorerV2
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={toggleSidebarCollapse}
                className="h-full"
                onDocumentSelect={(data) => {
                  if (data?.action === 'create') {
                    createNewEntry(data.folderId);
                  } else if (data?.id) {
                    const doc = allDocuments.find(e => e.id === data.id);
                    if (doc) {
                      handleDocumentExpand(doc);
                    }
                  } else if (data) {
                    handleDocumentExpand(data);
                  }
                  // Close mobile sidebar after selection
                  if (isMobile) setShowSidebar(false);
                }}
                selectedDocumentId={expandedEntry?.id}
                height="h-full"
                documents={allDocuments}
                onDocumentMove={async (docId, folderId) => {
                  await updateEntry(docId, { folder_id: folderId });
                }}
                onDocumentDelete={async (document) => {
                  const docId = document.id || document;
                  if (confirm(`Are you sure you want to delete "${document.title || 'this document'}"?`)) {
                    await deleteEntry(docId);
                    await loadEntries();
                    toast.success('Document deleted successfully');
                  }
                }}
              />
            </div>

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              {/* Header Bento Box */}
              <div className="bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 p-6 flex-shrink-0">
                {/* Top Row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <button
                      onClick={() => {
                        if (isMobile) {
                          setShowMobileSidebarSheet(true);
                        } else {
                          setShowSidebar(!showSidebar);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                    >
                      <Menu size={20} className="text-white/90" />
                    </button>

                    {/* Status indicator and document count */}
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                      <h1 className="text-white/90">
                        All Documents <span className="text-white/40">({entries.length})</span>
                      </h1>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* New Button */}
                    <button
                      onClick={() => createNewEntry()}
                      className="hidden md:flex items-center gap-2 h-9 px-4 bg-white/5 hover:bg-emerald-500/10 text-white/70 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all rounded-lg"
                    >
                      <Plus className="w-4 h-4" />
                      New
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative profile-menu-container">
                      <button
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="h-9 w-9 rounded-lg p-0 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                      >
                        <div className="h-6 w-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {user?.email?.charAt(0).toUpperCase() || 'D'}
                          </span>
                        </div>
                      </button>

                      {/* Profile Menu */}
                      {showProfileMenu && (
                        <div className="absolute right-0 mt-1 w-56 bg-[#1a2942]/95 backdrop-blur-xl border-white/10 border rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="p-3 border-b border-white/10">
                            <p className="text-sm leading-none text-white/90">
                              {user?.user_metadata?.full_name || 'Developer'}
                            </p>
                            <p className="text-xs leading-none text-white/50 mt-1">
                              {user?.email || 'developer@devlog.app'}
                            </p>
                          </div>

                          <div className="p-1">
                            <button
                              onClick={() => navigate('/settings')}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-white/70 hover:text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/90 rounded transition-colors text-sm cursor-pointer"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Settings</span>
                            </button>
                            <div className="my-1 h-px bg-white/10" />
                            <button
                              onClick={() => signOut()}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 rounded transition-colors text-sm cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Bar - Full Width Inside Header */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    ref={searchBarRef}
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Documents Grid Bento Box */}
              <div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
                <div
                  ref={pullToRefreshRef}
                  className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar relative"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(16, 185, 129, 0.3) rgba(255, 255, 255, 0.05)',
                    paddingBottom: isMobile ? '80px' : '1rem'
                  }}
                >
                  {/* Pull to refresh indicator */}
                  {isPulling && (
                    <div
                      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
                      style={{
                        height: `${pullDistance}px`,
                        opacity: pullProgress
                      }}
                    >
                      <div className="text-white/60 text-sm">
                        {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <DocumentGridRedesigned
                      entries={filteredEntries}
                      onExpand={handleDocumentExpand}
                      searchTerm={searchTerm}
                      selectedDocuments={selectedDocuments}
                      onSelectDocument={handleDocumentSelect}
                      selectionMode={selectedDocuments.size > 0}
                      onContextMenu={isMobile ? (entry) => {
                        setContextMenuTarget(entry);
                        setShowMobileContextMenu(true);
                      } : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredEntries.length === 0 && searchTerm && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-text-secondary text-lg mb-2">
              No documents found matching "{searchTerm}"
            </p>
            <p className="text-text-secondary/70 text-sm mb-4">
              Search includes document titles, preview text, and tags. 
              Full document content search requires opening the document first.
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
              onClick={() => createNewEntry()}
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
      
      {/* Mobile FAB */}
      {isMobile && !expandedEntry && (
        <MobileFAB
          onCreateDocument={() => createNewEntry()}
          onCreateFolder={() => {
            // TODO: Implement folder creation
            toast.info('Folder creation coming soon!');
          }}
          onCreateProject={() => {
            setEditingProject(null);
            setShowProjectModal(true);
          }}
        />
      )}
      
      {/* Mobile Bottom Sheet for Sidebar */}
      {isMobile && (
        <MobileBottomSheet
          isOpen={showMobileSidebarSheet}
          onClose={() => setShowMobileSidebarSheet(false)}
          title="Projects & Folders"
          snapPoints={['50%', '90%']}
          defaultSnap={0}
        >
          <ProjectExplorerV2
            isCollapsed={false}
            onToggleCollapse={() => {}}
            className="h-full"
            onDocumentSelect={(data) => {
              if (data?.action === 'create') {
                createNewEntry(data.folderId);
              } else if (data?.id) {
                const doc = allDocuments.find(e => e.id === data.id);
                if (doc) {
                  handleDocumentExpand(doc);
                }
              } else if (data) {
                handleDocumentExpand(data);
              }
              setShowMobileSidebarSheet(false);
            }}
            selectedDocumentId={expandedEntry?.id}
            documents={allDocuments}
            onDocumentMove={async (docId, folderId) => {
              await updateEntry(docId, { folder_id: folderId });
            }}
            onDocumentDelete={async (document) => {
              const docId = document.id || document;
              if (confirm(`Are you sure you want to delete "${document.title || 'this document'}"?`)) {
                await deleteEntry(docId);
                await loadEntries();
                toast.success('Document deleted successfully');
              }
            }}
          />
        </MobileBottomSheet>
      )}
      
      {/* Mobile Context Menu */}
      {isMobile && showMobileContextMenu && contextMenuTarget && (
        <MobileContextMenu
          isOpen={showMobileContextMenu}
          onClose={() => {
            setShowMobileContextMenu(false);
            setContextMenuTarget(null);
          }}
          title={contextMenuTarget.title}
          actions={[
            {
              icon: FileText,
              label: 'Open',
              onClick: () => handleDocumentExpand(contextMenuTarget)
            },
            {
              icon: Folder,
              label: 'Move to Folder',
              onClick: () => {
                // TODO: Implement move to folder
                toast.info('Move to folder coming soon!');
              }
            }
          ]}
          destructiveAction={{
            icon: FileText,
            label: 'Delete Document',
            onClick: async () => {
              if (confirm(`Delete "${contextMenuTarget.title}"?`)) {
                await deleteEntry(contextMenuTarget.id);
                await loadEntries();
                toast.success('Document deleted');
              }
            }
          }}
        />
      )}
    </DndContext>
  );
}