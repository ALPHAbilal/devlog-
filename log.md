index-D5UFI8hX.js:26 [DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized: {defaultTimeout_ms: 259200000, defaultTimeout_hours: 72, defaultTimeout_days: 3, timestamp: '2025-12-21T17:24:23.867Z'}
 Using optimized Supabase client
 [VIRT-DEBUG-IMPORT] Virtuoso component imported: object
 IndexedDB initialized successfully
 [TAB-RESTORE] {tabCount: 3, activeTabId: '88624a64', tabIds: Array(3)}
 [DEBUG-TIMEOUT-14] ⚙️ Settings from LOCALSTORAGE: {source: 'localStorage.devlogSettings', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, timestamp: '2025-12-21T17:24:23.917Z'}
 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 259200000, oldTimeout_hours: 72, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2025-12-21T17:54:23.918Z', timestamp: '2025-12-21T17:24:23.918Z'}
 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2025-12-21T17:54:23.932Z', timestamp: '2025-12-21T17:24:23.932Z'}
 [DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED: {events: Array(4), timeout_hours: 0.5, timestamp: '2025-12-21T17:24:23.933Z'}
 [Supabase] Auth event: INITIAL_SESSION
 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
 [DEBUG-TIMEOUT-8] 🔑 JWT Token status: {expiresAt: '2025-12-21T18:24:02.000Z', timeUntilExpiry_seconds: 3578, timeUntilExpiry_minutes: 59, refreshThreshold_seconds: 300, willRefreshSoon: false, …}
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [CACHE-GET] {lookingFor: '88624a64', cacheSize: 0, found: false, cachedIds: Array(0)}
 [ACTIVE-DOC] Checking IndexedDB cache: {id: '88624a64', found: false}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 0, treeDataLength: 0, expandedFoldersCount: 0, …}
 Loading folders for user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [DEBUG-DASHBOARD] Waiting for documents to load: 0
 [DEBUG-INIT] Dashboard mounted, user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [Dashboard] Loading from IndexedDB cache FIRST...
 [PAGINATION-SCROLL] ⚠️ Scroll container not found
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 0, treeDataLength: 0, expandedFoldersCount: 0, …}
 [CACHE-LOAD] {docCount: 3, loadTime_ms: 78, docIds: Array(3)}
 [Dashboard] Loaded 3 documents from IndexedDB cache
 [Dashboard] Starting background Supabase sync...
 usePaginatedDashboard: loadInitial() CALLED {userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', loadingRef: false, pageSize: 50, orderBy: 'updated_at'}
 usePaginatedDashboard: Calling getDocumentsWithRealActivity with page 0
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [ACTIVE-DOC] Found in allDocuments: {id: '88624a64', title: 'Untitled Document'}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 3, treeDataLength: 1, expandedFoldersCount: 0, …}
 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #1
 [VIRT-DEBUG-0] Render #1 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
 [BLOCKS-MEMO] Blocks array updated: 0 blocks
 [SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...
 [SYNC-STATUS-POLL] ⚠️ Not ready to start polling: {hasDocumentId: true, managerReady: false, hasManagerRef: false}
 [CACHE-TRACK] 📄 ExpandedViewEnhanced: Document 88624a64 {blockCount: 'unknown', hasBlocksInEntry: false, blocksInEntry: 0, loader: 'PAGINATED', expectedSource: 'cache/database', …}
 [CACHE-TRACK] 🚀 usePaginatedBlockLoader: Starting load for document 88624a64
 [CACHE-TRACK] 🔍 CHECKING: paginatedBlockLoader.getCachedBlocks(88624a64)
 [CACHE-TRACK] 🔍 CHECKING: sessionCache.getBlocks(88624a64) as fallback
 [CACHE-TRACK] ❌ MISS: getBlocks(88624a64) - No blocks in cache (lookup: 0.10ms)
 [CACHE-TRACK] ❌ CACHE MISS: No blocks in any cache, loading from database...
 [CACHE-TRACK] 📊 SOURCE TYPE: database (cache miss)
 [RENDER-CAUSE] State changes that triggered this render: (5) ['showBlockSelector: undefined → false', 'selectorPosition: null → null', 'focusedBlockId: null → null', 'blocks: 0 → 0 items', 'viewMode: undefined → blocks']
 [MULTI-TAB] 🆔 Tab 55VJTL initialized for document 88624a64
 [MULTI-TAB] 📄 Document 88624a64 opened in this tab
 [DEBUG-DASHBOARD] Combined: 0 folders + 1 documents = 1 total items
 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: [{…}]
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 3, treeDataLength: 1, expandedFoldersCount: 0, …}
 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #2
 [VIRT-DEBUG-0] Render #2 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
 [BLOCKS-MEMO] Blocks array updated: 0 blocks
 [SYNC-STATUS-POLL] ✅ SmartSync manager ready
 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
 [SYNC-STATUS-POLL] ✅ Starting status polling for document: 88624a64-b26e-48b5-8ef5-c67de26e268f
 SmartSync: IndexedDB initialized
 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
 [DEBUG-TIMEOUT-16] 💾 Settings from DATABASE (profiles table): {source: 'profiles.settings', userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, …}
 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 1800000, oldTimeout_hours: 0.5, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2025-12-21T17:54:24.282Z', timestamp: '2025-12-21T17:24:24.282Z'}
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 3, treeDataLength: 1, expandedFoldersCount: 0, …}
 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #3
 [VIRT-DEBUG-0] Render #3 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
 [BLOCKS-MEMO] Blocks array updated: 0 blocks
 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
 Loaded 99 folders (43 root folders)
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 3, treeDataLength: 44, expandedFoldersCount: 0, …}
 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #4
 [VIRT-DEBUG-0] Render #4 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
 [BLOCKS-MEMO] Blocks array updated: 0 blocks
 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
 [DEBUG-FOLDER] Folder "New Folder (5)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-27T21:28:30.123Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-12-19T05:26:23.586Z
 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-19T05:26:23.586Z
 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-02T10:28:42.169Z
 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-28T11:22:51.739Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:05:49.218Z
 [DEBUG-FOLDER] Folder "New Folder (8)": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T05:05:49.218Z
 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:18:51.656Z
 [DEBUG-FOLDER] Folder "google": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T04:18:51.656Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-08T09:24:09.176Z
 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-21T14:15:13.552Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-16T14:54:36.506Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T12:10:37.944Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-28T13:52:23.039Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-20T14:24:48.758Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:36:39.300Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:12:50.604Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:00:46.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 3 subfolders + 0 documents = 3 items, most recent: 2025-07-20T17:00:46.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-27T21:54:19.336Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "new folder 4": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:53:22.558Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T07:15:16.472Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T21:23:40.667Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-24T21:23:40.667Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "problems": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-29T10:22:16.769Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "seo thing": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-29T20:15:18.803Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-29T10:22:16.769Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-10-25T12:30:33.238Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (6)": 1 subfolders + 0 documents = 1 items, most recent: 2025-10-25T12:30:33.238Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 1 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T10:15:42.785Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:34:43.643Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-16T16:34:43.643Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:45:08.652Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:45:08.652Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-09-02T21:19:36.310Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:58:39.132Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T11:11:07.255Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2025-08-26T06:25:45.292Z
index-D5UFI8hX.js:26 [DEBUG-DASHBOARD] Combined: 43 folders + 1 documents = 44 total items
index-D5UFI8hX.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-D5UFI8hX.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-D5UFI8hX.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
index-D5UFI8hX.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 3, treeDataLength: 44, expandedFoldersCount: 0, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #5
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #5 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 PaginatedBlockLoader: Loading page 0 (offset: 0, limit: 50) for document 88624a64-b26e-48b5-8ef5-c67de26e268f
index-D5UFI8hX.js:26 [BLOCKS-LOAD-DEBUG] Querying blocks table for document: 88624a64-b26e-48b5-8ef5-c67de26e268f
index-D5UFI8hX.js:26 [DEBUG-TIMEOUT-16] 💾 Settings from DATABASE (profiles table): {source: 'profiles.settings', userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, …}
index-D5UFI8hX.js:26 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 1800000, oldTimeout_hours: 0.5, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
index-D5UFI8hX.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2025-12-21T17:54:24.607Z', timestamp: '2025-12-21T17:24:24.607Z'}
index-D5UFI8hX.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-D5UFI8hX.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
index-D5UFI8hX.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 3, treeDataLength: 44, expandedFoldersCount: 0, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #6
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #6 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 ExpandedView: Initial load period complete, enabling saves
index-D5UFI8hX.js:26 usePaginatedDashboard: Got real activity documents: {documentCount: 50, sampleActivity: Array(20), documentsWithActivity: 32, allDocumentIds: Array(50)}
index-D5UFI8hX.js:26 PaginatedBlockLoader: Loaded 0 blocks for page 0 of document 88624a64-b26e-48b5-8ef5-c67de26e268f
index-D5UFI8hX.js:26 [BLOCKS-LOAD-DEBUG] No blocks found in blocks table
index-D5UFI8hX.js:26 [CACHE-TRACK] 📊 DATABASE: Loaded from DB in 591.90ms (fromCache: false)
index-D5UFI8hX.js:26 [CACHE-TRACK] ⚡ PERFORMANCE: Database load 591.90ms
index-D5UFI8hX.js:26 [CACHE-TRACK] 📦 RECEIVED: 0 blocks from loader (totalCount: 0, hasMore: false, fromCache: false)
index-D5UFI8hX.js:26 [CACHE-TRACK] 💾 CACHING: Storing 0 blocks in sessionCache
index-D5UFI8hX.js:26 [CACHE-TRACK] 💾 SET: cacheBlocks(88624a64) - Caching 0 blocks
index-D5UFI8hX.js:26 SessionCache: Cached 0 blocks for document 88624a64-b26e-48b5-8ef5-c67de26e268f (write: 0.30ms)
index-D5UFI8hX.js:26 [CACHE-TRACK] ⏱️ COMPLETE: Total load time: 598.70ms (DB: 591.90ms)
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #7
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #7 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #8
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #8 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
 [Dashboard] Background Supabase sync complete
index-D5UFI8hX.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-D5UFI8hX.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
index-D5UFI8hX.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 3, treeDataLength: 44, expandedFoldersCount: 0, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #9
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #9 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 [PAGINATION-SCROLL] ⚠️ Scroll container not found
index-D5UFI8hX.js:26 [DEBUG-CREATE-9] Preserving local data (newer or locally created): {id: '5d2e90e6', localTitle: 'Untitled Document', serverTitle: 'Untitled Document', localBlocks: 0, reason: 'createdLocally'}
index-D5UFI8hX.js:26 [DEBUG-CREATE-9] Preserving local data (newer or locally created): {id: '88624a64', localTitle: 'Untitled Document', serverTitle: 'Untitled Document', localBlocks: 0, reason: 'createdLocally'}
index-D5UFI8hX.js:26 [DEBUG-CREATE-8] Merging docs: {paginated: 50, locallyCreatedNew: 0, localIds: Array(0)}
index-D5UFI8hX.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-D5UFI8hX.js:26 [ACTIVE-DOC] Found in allDocuments: {id: '88624a64', title: 'Untitled Document'}
index-D5UFI8hX.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
index-D5UFI8hX.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 50, treeDataLength: 88, expandedFoldersCount: 0, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ⚠️ entry reference ACTUALLY changed: {renderNumber: 10, oldId: '88624a64-b26e-48b5-8ef5-c67de26e268f', newId: '88624a64-b26e-48b5-8ef5-c67de26e268f', idChanged: false, titleChanged: false, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #10 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (5)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-27T21:28:30.123Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-12-19T05:26:23.586Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-19T05:26:23.586Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 1 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-28T11:22:51.739Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:05:49.218Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (8)": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T05:05:49.218Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:18:51.656Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "google": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T04:18:51.656Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 1 documents = 1 items, most recent: 2025-12-08T09:24:09.176Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-21T14:15:13.552Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-16T14:54:36.506Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T12:10:37.944Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-28T13:52:23.039Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-20T14:24:48.758Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:36:39.300Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:12:50.604Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:00:46.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 3 subfolders + 0 documents = 3 items, most recent: 2025-07-20T17:00:46.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-11-27T21:54:19.336Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "new folder 4": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:53:22.558Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T07:15:16.472Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T21:23:40.667Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-24T21:23:40.667Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "problems": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-29T10:22:16.769Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "seo thing": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-29T20:15:18.803Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-29T10:22:16.769Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-10-25T12:30:33.238Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (6)": 1 subfolders + 0 documents = 1 items, most recent: 2025-10-25T12:30:33.238Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 1 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T10:15:42.785Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:34:43.643Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-16T16:34:43.643Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:45:08.652Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:45:08.652Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-09-02T21:19:36.310Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:58:39.132Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T11:11:07.255Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
index-D5UFI8hX.js:26 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2025-08-26T06:25:45.292Z
index-D5UFI8hX.js:26 [DEBUG-DASHBOARD] Combined: 43 folders + 45 documents = 88 total items
index-D5UFI8hX.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-D5UFI8hX.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-D5UFI8hX.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 43, …}
index-D5UFI8hX.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 43, totalDocs: 50, treeDataLength: 88, expandedFoldersCount: 0, …}
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] ✅ entry reference STABLE (same object) - Render #11
index-D5UFI8hX.js:26 [VIRT-DEBUG-0] Render #11 {documentId: '88624a64-b26e-48b5-8ef5-c67de26e268f', blockCount: 'unknown', loader: 'PAGINATED', stableEntryWorks: true, hasEntry: true, …}
index-D5UFI8hX.js:26 [BLOCKS-MEMO] Blocks array updated: 0 blocks
index-D5UFI8hX.js:26 [RENDER-CAUSE] State changes that triggered this render: ['blocks: 0 → 0 items']
index-D5UFI8hX.js:26 ExpandedView: Initial load period complete, enabling saves
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'translation', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'translation'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'New Folder (8)', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'New Folder (8)'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'pipeline', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'pipeline'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'world of the API', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'world of the API'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'New Folder (4)', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'New Folder (4)'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'New Folder (5)', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'New Folder (5)'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'chatbot africawork', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'chatbot africawork'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'New Folder (5)', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'New Folder (5)'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'New Folder (4)', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'New Folder (4)'}
index-D5UFI8hX.js:26 [DEBUG-ROW] 🟡 TREE ROW - Mouse ENTER (group should activate): {item: 'world of the API', viewMode: 'tree', depth: 0}
index-D5UFI8hX.js:26 [DEBUG-ROW] ⚪ TREE ROW - Mouse LEAVE: {item: 'world of the API'}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
index-D5UFI8hX.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1766337864232, online: true}
