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
import DocumentCardSkeleton from '../components/DocumentCardSkeleton';
import FolderCardSkeleton from '../components/FolderCardSkeleton';
import SidebarSkeleton from '../components/SidebarSkeleton';
import LogoMinimal, { LogoIcon } from '../components/LogoMinimal';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ConfirmDialog from '../components/ConfirmDialog';
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
import { usePaginatedDashboard } from '../hooks/usePaginatedDashboard';
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
  // Server-side search state
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
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

  // Initialize pagination hook for documents
  const {
    documents: paginatedDocuments,
    documentsWithSkeletons,
    isLoading: isLoadingDocuments,
    isLoadingMore,
    hasMore,
    loadMore,
    loadInitial,
    checkLoadMore,
    progress,
    currentPage
  } = usePaginatedDashboard({
    pageSize: 50,
    orderBy: 'updated_at',
    ascending: false,
    enableInfiniteScroll: true,
    preloadNextPage: true
  });

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

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', message: '', onConfirm: null });

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
    navigate(`/document/${document.id}`, { replace: true });
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
      user_id: user.id, // CRITICAL: Required for RLS policy
      title: title,
      blocks: [defaultBlock], // Always start with at least one block
      tags: [],
      folder_id: folderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        syncStatus: 'syncing',
        createdLocally: true,
        isNewDocument: true
      }
    };

    // ✅ OPTIMISTIC UPDATE: Update UI immediately (instant response!)
    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setExpandedEntry(newEntry);

    // Save to IndexedDB for local backup (fast - ~22ms)
    try {
      await IndexedDBAdapter.saveDocument(newEntry);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }

    // Invalidate cache
    try {
      const adapter = await storageWrapper.getAdapter();
      if (adapter?.invalidateCache) {
        adapter.invalidateCache();
      } else if (adapter?.supabaseAdapter?.invalidateCache) {
        adapter.supabaseAdapter.invalidateCache();
      }
    } catch (error) {
      console.warn('Could not invalidate cache:', error);
    }

    // 🔄 BACKGROUND SYNC: Save to Supabase without blocking UI
    storageWrapper.saveDocument(newEntry)
      .then(() => {
        // Update metadata to mark as synced
        newEntry.metadata.syncStatus = 'synced';
        toast.success('Document synced to cloud');

        // Track document creation
        trackDocumentEvent('created', newEntry.id, {
          folder_id: folderId || 'root',
          creation_method: 'manual',
          has_folder: !!folderId
        });
      })
      .catch((error) => {
        console.error('Background sync failed:', error);
        newEntry.metadata.syncStatus = 'failed';
        toast.error('Failed to sync document. Changes saved locally.');

        // TODO: Implement retry logic
        // Could add to a sync queue for automatic retry
      });
  }, [entries, trackDocumentEvent]);

  // NOTE: Click-outside handler removed - now handled by DashboardHeader component
  // The old handler was using mousedown and looking for .profile-menu-container class
  // which no longer exists after moving to Portal-based menu rendering

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
  
  // Load entries function - now uses pagination hook internally
  const loadEntries = useCallback(async () => {
    console.log('Dashboard: loadEntries() called - triggering paginated load');

    // Call loadInitial directly - it's already a stable reference from the hook
    if (loadInitial) {
      console.log('Dashboard: Calling loadInitial from hook');
      await loadInitial();
    } else {
      console.error('Dashboard: loadInitial is undefined!');
    }

    // DON'T refresh folders here - causes race condition with optimistic updates
    // Folders are auto-loaded by useFolders hook and updated optimistically
    // if (refreshFolders) {
    //   await refreshFolders();
    // }
  }, [loadInitial]);

  // OLD IMPLEMENTATION - REMOVED (now using pagination)
  const loadEntriesOLD = useCallback(async () => {
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
        // For now, just set root documents sorted by recent action - folders will be added by re-combine effect
        const rootDocuments = mergedEntries
          .filter(doc => !doc.folder_id)  // Only root-level documents
          .map(doc => ({ ...doc, type: 'document' }))  // Add type field
          .sort((a, b) => {
            // Sort by most recent activity
            const aTime = new Date(a.updatedAt || a.createdAt || 0);
            const bTime = new Date(b.updatedAt || b.createdAt || 0);
            return bTime - aTime;  // Descending (most recent first)
          });

        console.log(`[DEBUG-DASHBOARD] Initial load: ${rootDocuments.length} root documents sorted by recent action (folders will be combined by re-combine effect)`);
        setEntries(rootDocuments);
      } else {
        // Initialize with example entry
        const initialEntries = [
          {
            id: crypto.randomUUID(),
            title: 'Getting Started with Journey Logger',
            // preview removed - will be calculated from blocks when needed
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

  // Sync paginated documents to allDocuments state
  useEffect(() => {
    if (paginatedDocuments && paginatedDocuments.length > 0) {
      setAllDocuments(paginatedDocuments);
    }
  }, [paginatedDocuments]);

  // Combine folders and documents whenever either changes (eliminates race condition)
  useEffect(() => {
    // Wait for both data sources to be ready
    if (!allDocuments || allDocuments.length === 0) {
      console.log(`[DEBUG-DASHBOARD] Waiting for documents to load: ${allDocuments?.length || 0}`);
      return;
    }

    // Helper function to populate folder with its documents recursively
    const populateFolderWithDocuments = (folder) => {
      // Get documents that belong to this folder
      const folderDocs = allDocuments
        .filter(doc => doc.folder_id === folder.id)
        .map(doc => ({ ...doc, type: 'document' }));

      // Recursively populate children folders
      const populatedChildren = (folder.children || []).map(populateFolderWithDocuments);

      // Combine subfolder children with documents
      const combinedItems = [
        ...populatedChildren,  // Subfolders (now with their documents)
        ...folderDocs          // Documents in this folder
      ];

      // Find the most recent activity in this folder (either folder update or any document/subfolder update)
      const allTimestamps = [
        folder.updated_at,
        folder.created_at,
        ...folderDocs.map(doc => doc.updatedAt || doc.createdAt),
        ...populatedChildren.map(child => child.effectiveUpdatedAt || child.updated_at || child.created_at)
      ].filter(Boolean).map(t => new Date(t));

      const mostRecentActivity = allTimestamps.length > 0
        ? new Date(Math.max(...allTimestamps))
        : new Date(folder.created_at || 0);

      console.log(`[DEBUG-FOLDER] Folder "${folder.name}": ${populatedChildren.length} subfolders + ${folderDocs.length} documents = ${combinedItems.length} items, most recent: ${mostRecentActivity.toISOString()}`);

      return {
        ...folder,
        type: 'folder',
        title: folder.name,  // FolderCard expects 'title' field
        items: combinedItems,
        effectiveUpdatedAt: mostRecentActivity  // Used for sorting - reflects most recent activity in folder or its contents
      };
    };

    // Get root folders and populate with documents
    const rootFolders = (folders || [])
      .filter(f => !f.parent_id)
      .map(populateFolderWithDocuments);

    // Get root documents (not in any folder)
    const rootDocs = allDocuments
      .filter(doc => !doc.folder_id)
      .map(doc => ({ ...doc, type: 'document' }));

    // Sort by most recent action (updated/created, NOT opened)
    // For documents: updatedAt, createdAt
    // For folders: effectiveUpdatedAt (includes activity from documents inside)
    const combined = [...rootFolders, ...rootDocs].sort((a, b) => {
      // Get the most recent timestamp for each item
      // Folders use effectiveUpdatedAt which includes their contents' activity
      const aTime = new Date(
        a.effectiveUpdatedAt || a.updatedAt || a.updated_at || a.createdAt || a.created_at || 0
      );
      const bTime = new Date(
        b.effectiveUpdatedAt || b.updatedAt || b.updated_at || b.createdAt || b.created_at || 0
      );

      // Sort descending (most recent first)
      return bTime - aTime;
    });

    console.log(`[DEBUG-DASHBOARD] Combined: ${rootFolders.length} folders + ${rootDocs.length} documents = ${combined.length} total items`);
    console.log('[DEBUG-DASHBOARD] Sorted by recent action - first 3 items:',
      combined.slice(0, 3).map(item => ({
        name: item.title || item.name,
        type: item.type,
        updated: item.updatedAt || item.updated_at,
        created: item.createdAt || item.created_at
      }))
    );

    setEntries(combined);
  }, [folders, allDocuments]); // Re-run whenever folders OR documents change

  // Load initial documents on mount - moved to hook initialization
  useEffect(() => {
    console.log('[DEBUG-INIT] Dashboard mounted, user:', user?.id, 'paginatedDocs:', paginatedDocuments.length);
    if (user?.id && paginatedDocuments.length === 0 && !isLoadingDocuments) {
      console.log('[DEBUG-INIT] Triggering loadInitial()');
      loadInitial();
    }
  }, [user?.id]);

  // Server-side search effect
  useEffect(() => {
    // Clear results when search term is empty
    if (!searchTerm || searchTerm.trim() === '') {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    // Debounce search by 300ms
    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        // Call searchDocuments directly on storageWrapper (not on adapter)
        const results = await storageWrapper.searchDocuments(user.id, searchTerm.trim(), {
          limit: 100,
          offset: 0
        });

        // Convert results to match entry format (add type field)
        const formattedResults = results.map(doc => ({
          ...doc,
          type: 'document',
          updatedAt: doc.updated_at,
          createdAt: doc.created_at
        }));

        setSearchResults(formattedResults);
      } catch (error) {
        setSearchError(error.message);
        // Fallback: keep showing paginated documents
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimer);
  }, [searchTerm, user?.id]);

  // Add infinite scroll event listener
  useEffect(() => {
    const scrollElement = document.querySelector('.dashboard-scroll-container');
    if (!scrollElement) {
      console.log('[PAGINATION-SCROLL] ⚠️ Scroll container not found');
      return;
    }

    console.log('[PAGINATION-SCROLL] ✅ Scroll listener attached to:', {
      element: '.dashboard-scroll-container',
      hasMore,
      currentPage,
      totalDocuments: paginatedDocuments?.length
    });

    let scrollCount = 0;
    const handleScroll = () => {
      scrollCount++;
      if (scrollCount % 10 === 0) { // Log every 10th scroll to avoid spam
        console.log(`[PAGINATION-SCROLL] 📜 Scroll event #${scrollCount}:`, {
          scrollTop: scrollElement.scrollTop,
          scrollHeight: scrollElement.scrollHeight,
          clientHeight: scrollElement.clientHeight,
          distanceFromBottom: scrollElement.scrollHeight - (scrollElement.scrollTop + scrollElement.clientHeight)
        });
      }
      checkLoadMore(scrollElement);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      console.log('[PAGINATION-SCROLL] 🔌 Scroll listener detached');
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [checkLoadMore, hasMore, currentPage, paginatedDocuments?.length]);

  // Redirect old /dashboard/:id URLs to new /document/:id route for backwards compatibility
  useEffect(() => {
    if (documentId) {
      // Redirect to new document route
      navigate(`/document/${documentId}`, { replace: true });
    }
  }, [documentId, navigate]);


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
        // Remove blocks, updatedAt (camelCase), and any other non-database fields
        const { blocks, updatedAt, ...documentToSave } = updatedEntry;

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
              // preview removed - not stored in database
              blocks: [],
              tags: [],
              created_at: new Date().toISOString(), // Use snake_case for database
              updated_at: new Date().toISOString(), // Use snake_case for database
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
  
  const handleDeleteProject = useCallback((project) => {
    setConfirmDialogConfig({
      title: 'Delete Project',
      message: `Are you sure you want to delete "${project.title}"? Documents will be moved to uncategorized. This action cannot be undone.`,
      onConfirm: async () => {
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
        setShowConfirmDialog(false);
      }
    });
    setShowConfirmDialog(true);
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

  // Determine which entries to display: search results or paginated documents
  const displayEntries = useMemo(() => {
    // If searching, use search results (already filtered server-side)
    if (searchTerm && searchTerm.trim() !== '') {
      // Apply client-side filters (project, tag) to search results
      return searchResults.filter(entry => {
        // Apply project filter
        if (selectedProjectId !== null) {
          if (selectedProjectId === 'uncategorized' && entry.project_id) return false;
          if (selectedProjectId !== 'uncategorized' && entry.project_id !== selectedProjectId) return false;
        }
        
        // Apply tag filter
        if (selectedTags.length > 0) {
          if (!selectedTags.every(tag => entry.tags?.includes(tag))) return false;
        }
        
        return true;
      });
    }

    // Otherwise, use regular paginated documents with filters
    return entries.filter(entry => {
      // Apply project filter
      if (selectedProjectId !== null) {
        if (selectedProjectId === 'uncategorized' && entry.project_id) return false;
        if (selectedProjectId !== 'uncategorized' && entry.project_id !== selectedProjectId) return false;
      }
      
      // Apply tag filter
      if (selectedTags.length > 0) {
        if (!selectedTags.every(tag => entry.tags?.includes(tag))) return false;
      }
      
      return true;
    });
  }, [searchTerm, searchResults, entries, selectedProjectId, selectedTags]);
  
  // Keep filteredEntries for compatibility (alias to displayEntries)
  const filteredEntries = displayEntries;
  
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
              onDocumentDelete={(document) => {
                const docId = document.id || document;
                setConfirmDialogConfig({
                  title: 'Delete Document',
                  message: `Are you sure you want to delete "${document.title || 'this document'}"? This action cannot be undone.`,
                  onConfirm: async () => {
                    await deleteEntry(docId);
                    // Refresh the entries list
                    await loadEntries();
                    toast.success('Document deleted successfully');
                    setShowConfirmDialog(false);
                  }
                });
                setShowConfirmDialog(true);
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
              navigate(`/document/${newEntry.id}`, { replace: true });
            }}
          />
        </main>
      </div>
    );
  }

  // Show skeleton UI while loading for better perceived performance
  // Show loading skeleton only during initial load (when no documents yet)
  if (isLoadingDocuments && paginatedDocuments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0a1628] to-[#0f1d32] p-6">
        <div className="flex gap-6 h-[calc(100vh-3rem)] max-w-[1800px] mx-auto">
          {/* Sidebar Skeleton */}
          <SidebarSkeleton />

          {/* Main Content */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Header Skeleton */}
            <div className="bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                  <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-20 bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-9 w-9 bg-white/10 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            {/* Documents Grid Skeleton */}
            <div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
              <div className="p-6 h-full overflow-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 items-start auto-rows-max">
                  {/* Mix of folders and documents like in real dashboard */}
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <FolderCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                  <DocumentCardSkeleton />
                </div>
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
                onDocumentDelete={(document) => {
                  const docId = document.id || document;
                  setConfirmDialogConfig({
                    title: 'Delete Document',
                    message: `Are you sure you want to delete "${document.title || 'this document'}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      await deleteEntry(docId);
                      await loadEntries();
                      toast.success('Document deleted successfully');
                      setShowConfirmDialog(false);
                    }
                  });
                  setShowConfirmDialog(true);
                }}
              />
            </div>

            {/* Main Content Column */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              {/* Header Component with Portal-based Profile Menu */}
              <DashboardHeader
                entries={entries}
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                searchBarRef={searchBarRef}
                user={user}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onSignOut={signOut}
                onCreateNew={() => createNewEntry()}
                onToggleMobileSidebar={() => {
                  if (isMobile) {
                    setShowMobileSidebarSheet(true);
                  } else {
                    setShowSidebar(!showSidebar);
                  }
                }}
                isMobile={isMobile}
              />

              {/* Documents Grid Bento Box */}
              <div className="flex-1 bg-[#0a1628]/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl shadow-black/20 overflow-hidden">
                <div
                  ref={pullToRefreshRef}
                  className="dashboard-scroll-container h-full overflow-y-auto overflow-x-hidden custom-scrollbar relative"
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

                    {/* Infinite Scroll Loading State */}
                    {isLoadingMore && (
                      <div className="py-6 flex justify-center">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          <span>Loading more documents...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {displayEntries.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-md">
            {isSearching ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                <p className="text-text-secondary">Searching...</p>
              </div>
            ) : searchTerm && searchTerm.trim() !== '' ? (
              <div className="flex flex-col items-center gap-4">
                <Search className="w-16 h-16 text-gray-400" />
                <h3 className="text-lg font-medium text-text-primary">No documents found</h3>
                <p className="text-text-secondary">
                  No documents match your search for "<strong>{searchTerm}</strong>"
                </p>
                <p className="text-sm text-text-secondary/70">
                  Try different keywords or clear your search to see all documents.
                </p>
                {searchError && (
                  <p className="text-sm text-red-500 mt-2">Error: {searchError}</p>
                )}
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-accent-green hover:text-accent-green/80 text-sm mt-2"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <FileText className="w-16 h-16 text-gray-400" />
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
            )}
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
            onDocumentDelete={(document) => {
              const docId = document.id || document;
              setConfirmDialogConfig({
                title: 'Delete Document',
                message: `Are you sure you want to delete "${document.title || 'this document'}"? This action cannot be undone.`,
                onConfirm: async () => {
                  await deleteEntry(docId);
                  await loadEntries();
                  toast.success('Document deleted successfully');
                  setShowConfirmDialog(false);
                }
              });
              setShowConfirmDialog(true);
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
            onClick: () => {
              setConfirmDialogConfig({
                title: 'Delete Document',
                message: `Are you sure you want to delete "${contextMenuTarget.title}"? This action cannot be undone.`,
                onConfirm: async () => {
                  await deleteEntry(contextMenuTarget.id);
                  await loadEntries();
                  toast.success('Document deleted');
                  setShowConfirmDialog(false);
                }
              });
              setShowConfirmDialog(true);
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDialogConfig.onConfirm}
        title={confirmDialogConfig.title}
        message={confirmDialogConfig.message}
        confirmText="Delete"
        variant="danger"
      />
    </DndContext>
  );
}