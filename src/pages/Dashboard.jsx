import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ExpandedView from '../components/ExpandedViewEnhanced';
import MobileDocumentViewer from '../components/MobileDocumentViewer';
import { useResponsive } from '../hooks/useResponsive';
import DocumentLinkModal from '../components/DocumentLinkModal';
import SidebarSkeleton from '../components/SidebarSkeleton';
import TabBar from '../components/TabBar';
import EmptyState from '../components/EmptyState';
import { useTabContext } from '../contexts/TabContext';
import ConfirmDialog from '../components/ConfirmDialog';
import InputModal from '../components/InputModal';
import ProjectCard from '../components/ProjectCard';
// Old sidebar (kept for reference)
// import ProjectExplorerV2 from '../components/ProjectExplorer/ProjectExplorerRedesigned';
import { SidebarEnhanced } from '../components/sidebar';
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
import { useIndexedDBCache } from '../hooks/useIndexedDBCache';
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

  // [DASHBOARD-DEBUG] Log re-renders to find the loop
  console.log('[DASHBOARD-DEBUG] Dashboard render, expandedEntry:', expandedEntry?.id);
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

  // Ref to hold pending document during creation (prevents race condition)
  // This ensures activeDocument can find new documents immediately
  const pendingDocumentRef = useRef(null);
  
  // Analytics hooks
  const { trackEvent } = useAnalytics();
  const { trackDocumentEvent, startDocumentTimer, endDocumentTimer } = useDocumentAnalytics();

  // Folders hook - folders are auto-loaded by the hook
  const { folders, refreshFolders, createFolder, deleteFolder } = useFolders();

  // IndexedDB cache for instant document access across navigation
  const {
    cachedDocuments,
    isCacheLoaded,
    loadFromCache,
    updateCache,
    updateDocumentInCache,
    removeFromCache,
    getDocument: getCachedDocument
  } = useIndexedDBCache();

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

  // Tab management
  const {
    tabs,
    activeTabId,
    openTab,
    closeTab,
    updateTabTitle,
    isInitialized: tabsInitialized
  } = useTabContext();

  // Find the active document based on activeTabId
  // Falls back to pendingDocumentRef (for new documents) and IndexedDB cache (for navigation)
  const activeDocument = useMemo(() => {
    if (!activeTabId) {
      console.log('[ACTIVE-DOC] No activeTabId');
      return null;
    }

    // Check pending document first (handles race condition during creation)
    if (pendingDocumentRef.current?.id === activeTabId) {
      console.log('[ACTIVE-DOC] Found in pendingDocumentRef');
      return pendingDocumentRef.current;
    }

    // Try main documents (from Supabase/state)
    const fromMain = allDocuments.find(doc => doc.id === activeTabId);
    if (fromMain) {
      console.log('[ACTIVE-DOC] Found in allDocuments:', { id: activeTabId.substring(0, 8), title: fromMain.title });
      // Clear pending ref if document is now in allDocuments
      if (pendingDocumentRef.current?.id === activeTabId) {
        pendingDocumentRef.current = null;
      }
      return fromMain;
    }

    // Fallback to IndexedDB cache (handles navigation race condition)
    const fromCache = getCachedDocument(activeTabId);
    console.log('[ACTIVE-DOC] Checking IndexedDB cache:', { id: activeTabId.substring(0, 8), found: !!fromCache });
    return fromCache;
  }, [activeTabId, allDocuments, getCachedDocument]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showMobileSidebarSheet, setShowMobileSidebarSheet] = useState(false);
  const [showMobileContextMenu, setShowMobileContextMenu] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const searchBarRef = useRef(null);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = useState({ title: '', message: '', onConfirm: null });

  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderParentId, setFolderParentId] = useState(null);
  const [recentlyCreatedFolderId, setRecentlyCreatedFolderId] = useState(null);

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
  
  // Handle document expansion with tab system
  const handleDocumentExpand = useCallback((document) => {
    // Open document in tab (or switch to existing tab)
    // No navigation - tabs stay on dashboard
    openTab(document);
    // Cache the document for instant access on reload
    updateDocumentInCache(document);
    // Clear recently created folder highlight when opening a document
    setRecentlyCreatedFolderId(null);
  }, [openTab, updateDocumentInCache]);

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
    console.log('[DEBUG-CREATE-6] createNewEntry called with folderId:', folderId);
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
    // Set pending ref FIRST (synchronous) - ensures activeDocument finds it immediately
    pendingDocumentRef.current = newEntry;

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setAllDocuments(prev => [newEntry, ...prev]);

    // Open in tab - pendingDocumentRef ensures document is found immediately
    openTab(newEntry);

    // Clear recently created folder highlight when creating a document
    setRecentlyCreatedFolderId(null);

    // Save to IndexedDB cache for local backup (fast - ~22ms)
    // Using cache hook for consistent state management
    updateDocumentInCache(newEntry);

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
  }, [entries, openTab, trackDocumentEvent, updateDocumentInCache]);

  // Handle new tab creation (creates document and opens in tab)
  const handleCreateNewTab = useCallback(async () => {
    console.log('[DEBUG-CREATE-4] handleCreateNewTab called - this always creates in INBOX (null folder_id)');
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

    // Get all documents without folder (Inbox behavior)
    const documentsInInbox = entries.filter(doc =>
      !doc.folder_id &&
      !doc.deleted_at
    );

    // Keep checking until we find a unique name
    while (documentsInInbox.some(doc => doc.title === title)) {
      title = `${baseTitle} (${counter})`;
      counter++;
    }

    const newEntry = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title,
      blocks: [defaultBlock],
      tags: [],
      folder_id: null, // New docs go to Inbox (no folder)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        syncStatus: 'syncing',
        createdLocally: true,
        isNewDocument: true
      }
    };

    // Update UI immediately - update both entries and allDocuments
    // Set pending ref FIRST (synchronous) - ensures activeDocument finds it immediately
    pendingDocumentRef.current = newEntry;

    const updatedEntries = [newEntry, ...entries];
    setEntries(updatedEntries);
    setAllDocuments(prev => [newEntry, ...prev]);

    // Open in tab - pendingDocumentRef ensures document is found immediately
    openTab(newEntry);

    // Clear recently created folder highlight when creating a document
    setRecentlyCreatedFolderId(null);

    // Save to IndexedDB cache for local backup
    // Using cache hook for consistent state management
    updateDocumentInCache(newEntry);

    // Background sync to Supabase
    storageWrapper.saveDocument(newEntry)
      .then(() => {
        newEntry.metadata.syncStatus = 'synced';
        toast.success('Document synced to cloud');
      })
      .catch((error) => {
        console.error('Background sync failed:', error);
        newEntry.metadata.syncStatus = 'failed';
        toast.error('Failed to sync document. Changes saved locally.');
      });

    return newEntry;
  }, [entries, user?.id, openTab, toast, updateDocumentInCache]);

  // Handle closing a tab - removes from caches since document no longer needs instant access
  const handleCloseTab = useCallback((tabId) => {
    closeTab(tabId);
    removeFromCache(tabId);
    // CRITICAL: Also clear from sessionCache to free memory immediately
    sessionCache.removeDocument(tabId);
    console.log(`[MULTI-TAB] 🗑️ Tab closed, cache cleared for document ${tabId?.substring(0, 8)}`);
  }, [closeTab, removeFromCache]);

  // Listen for keyboard shortcut to create new tab (from TabContext)
  useEffect(() => {
    const handleNewTab = () => {
      handleCreateNewTab();
    };

    window.addEventListener('devlog:newTab', handleNewTab);
    return () => window.removeEventListener('devlog:newTab', handleNewTab);
  }, [handleCreateNewTab]);

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

  // Sync paginated documents to both allDocuments state AND IndexedDB cache
  useEffect(() => {
    if (paginatedDocuments && paginatedDocuments.length > 0) {
      // Merge: Preserve locally-created documents with their blocks
      setAllDocuments(prev => {
        const paginatedIds = new Set(paginatedDocuments.map(d => d.id));

        // Keep locally-created documents that aren't synced yet
        const locallyCreatedNew = prev.filter(d => d.metadata?.createdLocally && !paginatedIds.has(d.id));

        // For documents that exist in both, preserve LOCAL data (blocks, title, etc.)
        // This prevents Supabase data from overwriting unsaved local changes
        const mergedPaginated = paginatedDocuments.map(pDoc => {
          const localDoc = prev.find(d => d.id === pDoc.id);
          if (localDoc) {
            // CRITICAL: Preserve local title and blocks if local is newer
            const localUpdated = new Date(localDoc.updatedAt || localDoc.updated_at || 0).getTime();
            const serverUpdated = new Date(pDoc.updatedAt || pDoc.updated_at || 0).getTime();

            if (localUpdated >= serverUpdated || localDoc.metadata?.createdLocally) {
              console.log('[DEBUG-CREATE-9] Preserving local data (newer or locally created):', {
                id: pDoc.id.substring(0, 8),
                localTitle: localDoc.title,
                serverTitle: pDoc.title,
                localBlocks: localDoc.blocks?.length || 0,
                reason: localDoc.metadata?.createdLocally ? 'createdLocally' : 'localNewer'
              });
              return {
                ...pDoc,
                title: localDoc.title,  // CRITICAL: Preserve local title
                blocks: localDoc.blocks || pDoc.blocks,
                metadata: { ...pDoc.metadata, ...localDoc.metadata }
              };
            }
          }
          return pDoc;
        });

        console.log('[DEBUG-CREATE-8] Merging docs:', {
          paginated: mergedPaginated.length,
          locallyCreatedNew: locallyCreatedNew.length,
          localIds: locallyCreatedNew.map(d => d.id.substring(0, 8))
        });
        return [...locallyCreatedNew, ...mergedPaginated];
      });
      // NOTE: We no longer overwrite IndexedDB cache with pagination data
      // Cache is now tab-based: documents cached when opened, removed when tab closed
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

  // Load initial documents on mount - IndexedDB FIRST, then background Supabase sync
  useEffect(() => {
    const initializeDocuments = async () => {
      console.log('[DEBUG-INIT] Dashboard mounted, user:', user?.id);

      // Step 1: Load from IndexedDB immediately (5-20ms) - provides instant UI
      console.log('[Dashboard] Loading from IndexedDB cache FIRST...');
      const cached = await loadFromCache();

      if (cached && cached.length > 0) {
        console.log(`[Dashboard] Loaded ${cached.length} documents from IndexedDB cache`);
        setAllDocuments(cached);
      }

      // Step 2: Background sync with Supabase (don't block UI)
      if (user?.id) {
        console.log('[Dashboard] Starting background Supabase sync...');
        loadInitial().then(() => {
          console.log('[Dashboard] Background Supabase sync complete');
        }).catch(error => {
          console.error('[Dashboard] Background sync failed:', error);
        });
      }
    };

    initializeDocuments();
  }, [user?.id, loadFromCache, loadInitial]);

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

        // Remove from IndexedDB cache
        removeFromCache(entryId);

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
    if (!entryToUpdate) {
      return;
    }
    
    // Create updated entry
    const updatedEntry = {
      ...entryToUpdate,
      ...updates,
      id: entryToUpdate.id, // CRITICAL: Always preserve id - updates should never override it
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
    
    // MILESTONE 1: Skip block updates entirely - ExpandedView manages its own blocks
    if (updates.blocks) {
      console.log('Dashboard: Skipping block update - ExpandedView manages blocks internally');
      // Don't update entries or expandedEntry for block changes
      // ExpandedView has its own block state that's already updated
      return;
    }

    // Update local state (only for non-block updates like title, tags)
    const updatedEntries = entries.map(entry =>
      entry.id === entryId ? updatedEntry : entry
    );
    setEntries(updatedEntries);

    // CRITICAL: Also update allDocuments (used by sidebar)
    setAllDocuments(prev => prev.map(doc =>
      doc.id === entryId ? { ...doc, ...updates, updated_at: new Date().toISOString() } : doc
    ));

    // Update IndexedDB cache for instant access across navigation
    updateDocumentInCache(updatedEntry);

    // CRITICAL: Update tab title if title changed
    if (updates.title) {
      console.log('[DEBUG-TITLE-1] Updating tab title:', { entryId: entryId.substring(0, 8), newTitle: updates.title });
      updateTabTitle(entryId, updates.title);
    }

    // Update expandedEntry if it's the one being edited (only for non-block updates)
    if (expandedEntry && expandedEntry.id === entryId) {
      if (!updatedEntry.id) {
        return; // Don't update if id is missing
      }
      setExpandedEntry(updatedEntry);
    }
    
    // Save only this document to storage - use requestIdleCallback for non-blocking save
    const saveOperation = async () => {
      try {
        // Only save non-block updates (title, tags, etc.)
        // Remove blocks, updatedAt (camelCase), and client-side only fields
        const {
          blocks,
          updatedAt,
          blockCount,  // Not a database column (computed field)
          type,        // Not a database column (documents don't have 'type')
          ...documentToSave
        } = updatedEntry;

        // Clean metadata: remove client-side only flags like createdLocally
        if (documentToSave.metadata) {
          const { createdLocally, ...cleanMetadata } = documentToSave.metadata;
          documentToSave.metadata = Object.keys(cleanMetadata).length > 0 ? cleanMetadata : null;
        }

        console.log('[DEBUG-TITLE-2] Dashboard: Saving metadata only (no blocks):', {
          id: documentToSave.id?.substring(0, 8),
          title: documentToSave.title,
          hasBlocks: false
        });

        await storageWrapper.saveDocument(documentToSave);
        console.log('[DEBUG-TITLE-3] Document saved successfully:', { id: documentToSave.id?.substring(0, 8), title: documentToSave.title });
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
  }, [entries, expandedEntry, updateStorageInfo, removeFromCache, updateDocumentInCache]);

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

  // Show simple loading state during initial load
  if (isLoadingDocuments && paginatedDocuments.length === 0 && !tabsInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-db-dark-base via-db-dark-primary to-db-dark-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Loading...</span>
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
      {/* Tab-based Layout: Outer container fills viewport, no page scroll */}
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-db-dark-base via-db-dark-primary to-db-dark-secondary">
        {/* Green accent line at very top */}
        <div className="h-0.5 bg-emerald-500 flex-shrink-0" />

        {/* Tab Bar - fixed height, stays at top */}
        <TabBar onNewTab={handleCreateNewTab} onCloseTab={handleCloseTab} />

        {/* Main area - fills remaining height */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Enhanced Sidebar with Activity Bar */}
          <SidebarEnhanced
            isOpen={showSidebar}
            onClose={closeMobileSidebar}
            isMobile={isMobile}
            folders={folders}
            documents={allDocuments}
            activeDocumentId={activeTabId}
            recentlyCreatedFolderId={recentlyCreatedFolderId}
            onOpenDocument={(doc) => {
              if (doc?.id) {
                handleDocumentExpand(doc);
              }
              if (isMobile) closeMobileSidebar();
            }}
            onCreateFolder={(parentId = null) => {
              setFolderParentId(parentId);
              setShowFolderModal(true);
            }}
            onCreateDocument={(folderId = null) => {
              createNewEntry(folderId);
            }}
            onDeleteItem={(item) => {
              const itemId = item.id;
              const isDocument = item.type === 'document' || !item.type;
              setConfirmDialogConfig({
                title: isDocument ? 'Delete Document' : 'Delete Folder',
                message: `Are you sure you want to delete "${item.title || item.name || 'this item'}"? This action cannot be undone.`,
                onConfirm: async () => {
                  if (isDocument) {
                    await deleteEntry(itemId);
                    if (tabs.find(t => t.id === itemId)) {
                      closeTab(itemId);
                    }
                  } else {
                    await deleteFolder(itemId);
                  }
                  await loadEntries();
                  toast.success(`${isDocument ? 'Document' : 'Folder'} deleted successfully`);
                  setShowConfirmDialog(false);
                }
              });
              setShowConfirmDialog(true);
            }}
            onToggleFavorite={async (item, isFavorite) => {
              if (item.type === 'document') {
                await updateEntry(item.id, { is_favorite: isFavorite });
              }
              // TODO: Implement folder favorites
            }}
            onRefresh={loadEntries}
            isLoading={isLoadingDocuments}
          />

          {/* Document area - takes remaining width, scrolls internally */}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            {activeTabId && activeDocument ? (
              <ExpandedView
                key={activeTabId}
                entry={activeDocument}
                onClose={() => handleCloseTab(activeTabId)}
                onUpdate={updateEntry}
                allEntries={allDocuments}
                onNavigateToDocument={(doc) => openTab(doc)}
              />
            ) : (
              <EmptyState onCreateNew={handleCreateNewTab} />
            )}
          </div>
        </div>
      </div>

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
      {isMobile && !activeTabId && (
        <MobileFAB
          onCreateDocument={() => handleCreateNewTab()}
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
      
      {/* Mobile Bottom Sheet for Sidebar - Now handled by SidebarEnhanced */}
      {/* The SidebarEnhanced component handles mobile mode internally with its own overlay */}
      
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

      {/* Folder Creation Modal */}
      <InputModal
        isOpen={showFolderModal}
        onClose={() => {
          setShowFolderModal(false);
          setFolderParentId(null);
        }}
        onConfirm={async (name) => {
          const newFolder = await createFolder(name, folderParentId);
          if (newFolder?.id) {
            setRecentlyCreatedFolderId(newFolder.id);
          }
          setShowFolderModal(false);
          setFolderParentId(null);
          await loadEntries();
          toast.success('Folder created successfully');
        }}
        title="Create New Folder"
        placeholder="Enter folder name..."
        confirmText="Create Folder"
      />

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