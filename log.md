index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized: {defaultTimeout_ms: 259200000, defaultTimeout_hours: 72, defaultTimeout_days: 3, timestamp: '2026-01-17T19:32:45.964Z'}
index-rWgMQ1DB.js:26 [RxDB Replication] Using singleton Supabase client
index-rWgMQ1DB.js:26 [RxDB Replication] Using replicateRxCollection (custom handlers)
index-rWgMQ1DB.js:26 IndexedDB initialized successfully
index-rWgMQ1DB.js:26 [TAB-RESTORE] {tabCount: 1, activeTabId: 'c227ca13', tabIds: Array(1)}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-14] ⚙️ Settings from LOCALSTORAGE: {source: 'localStorage.devlogSettings', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, timestamp: '2026-01-17T19:32:46.024Z'}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 259200000, oldTimeout_hours: 72, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:46.025Z', timestamp: '2026-01-17T19:32:46.025Z'}
index-rWgMQ1DB.js:26 [DatabaseProvider] Initializing RxDB...
index-rWgMQ1DB.js:26 [RxDB] Creating database...
index-rWgMQ1DB.js:26 -------------- RxDB Open Core RxStorage -------------------------------
You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie 
While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.
For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.
 https://rxdb.info/premium/?console=dexie 
If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.
---------------------------------------------------------------------
(anonymous) @ index-rWgMQ1DB.js:26
e.bulkWrite @ index-rWgMQ1DB.js:831
await in e.bulkWrite
(anonymous) @ index-rWgMQ1DB.js:829
wrapCall @ index-rWgMQ1DB.js:829
e.lockedRun @ index-rWgMQ1DB.js:829
bulkWrite @ index-rWgMQ1DB.js:829
wke @ index-rWgMQ1DB.js:829
t @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
await in (anonymous)
zke @ index-rWgMQ1DB.js:829
_F @ index-rWgMQ1DB.js:832
(anonymous) @ index-rWgMQ1DB.js:832
WTe @ index-rWgMQ1DB.js:832
(anonymous) @ index-rWgMQ1DB.js:832
(anonymous) @ index-rWgMQ1DB.js:832
uv @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
Rl @ index-rWgMQ1DB.js:106
l3 @ index-rWgMQ1DB.js:106
R3 @ index-rWgMQ1DB.js:106
(anonymous) @ index-rWgMQ1DB.js:106
W @ index-rWgMQ1DB.js:91
 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:46.066Z', timestamp: '2026-01-17T19:32:46.066Z'}
 [DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED: {events: Array(4), timeout_hours: 0.5, timestamp: '2026-01-17T19:32:46.066Z'}
 [RxDB] Database ready: (3) ['documents', 'folders', 'blocks']
 [DatabaseProvider] RxDB ready
 [Supabase] Auth event: INITIAL_SESSION
 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
 [DatabaseProvider] Starting replications for user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [RxDB] Pre-insert hooks set up for documents
 [RxDB] Pre-insert hooks set up for folders
 [RxDB] Pre-insert hooks set up for blocks
 [RxDB Replication] Starting replications with replicateRxCollection...
 [RxDB Replication] 🔍 Verifying Supabase schema...
 [DEBUG-TIMEOUT-8] 🔑 JWT Token status: {expiresAt: '2026-01-17T19:54:07.000Z', timeUntilExpiry_seconds: 1281, timeUntilExpiry_minutes: 21, refreshThreshold_seconds: 300, willRefreshSoon: false, …}
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-RXDB-TREE-1] 🌲 Building folder tree from allFolders: {count: 0, folders: Array(0)}
 [DEBUG-RXDB-TREE-5] 🌲 Tree built. Root folders: {count: 0, roots: Array(0)}
 [CACHE-GET] {lookingFor: 'c227ca13', cacheSize: 0, found: false, cachedIds: Array(0)}
 [ACTIVE-DOC] Checking IndexedDB cache: {id: 'c227ca13', found: false}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 0, documentCount: 0, folders: Array(0)}
 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 0, rootItems: Array(0)}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 0, treeDataLength: 0, expandedFoldersCount: 0, …}
 [DEBUG-DASHBOARD] Waiting for documents to load: 0
 [DEBUG-INIT] Dashboard mounted, user: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
 [Dashboard] Loading from IndexedDB cache FIRST...
 [PAGINATION-SCROLL] ⚠️ Scroll container not found
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 0, treeDataLength: 0, expandedFoldersCount: 0, …}
 [CACHE-LOAD] {docCount: 1, loadTime_ms: 42, docIds: Array(1)}
 [Dashboard] Loaded 1 documents from IndexedDB cache
 [Dashboard] Starting background Supabase sync...
 [useRxDocuments] loadInitial called - RxDB is reactive
 [Dashboard] Background Supabase sync complete
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [ACTIVE-DOC] Found in allDocuments: {id: 'c227ca13', title: 'another test '}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 0, documentCount: 1, folders: Array(0)}
 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 0, rootItems: Array(0)}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 1, treeDataLength: 0, expandedFoldersCount: 0, …}
 [SYNC-STATUS-POLL] ⏳ Waiting for SmartSync manager...
 [SYNC-STATUS-POLL] ⚠️ Not ready to start polling: {hasDocumentId: true, managerReady: false, hasManagerRef: false}
 [MULTI-TAB] 🆔 Tab 7FO7S5 initialized for document c227ca13
 [MULTI-TAB] 📄 Document c227ca13 opened in this tab
 [DEBUG-DASHBOARD] Combined: 0 folders + 0 documents = 0 total items
 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: []
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 0, …}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 0, totalDocs: 1, treeDataLength: 0, expandedFoldersCount: 0, …}
 [SYNC-STATUS-POLL] ✅ SmartSync manager ready
 [SYNC-STATUS-POLL] ✅ Starting status polling for document: c227ca13-d9c2-4290-875c-7488c6107104
 SmartSync: IndexedDB initialized
 🔎 BlockSerializer.deserialize INPUT: {id: 'bb566f28-b32d-4ed1-846d-61b2992f1314', type: 'table', hasContent: true, contentType: 'string', contentLength: 116, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '3f0d728b-70cd-4f96-924f-5bbff5e97d5e', type: 'ai', hasContent: true, contentType: 'string', contentLength: 29, …}
 🔎 BlockSerializer.deserialize INPUT: {id: '56f9c8a2-8caf-44c3-949d-3dec4ed8c555', type: 'filetree', hasContent: true, contentType: 'string', contentLength: 88, …}
 🌲 FileTree DESERIALIZE: {treeDataLength: 0, filesWithContent: 0, snapshotCount: 0, hasComments: false}
 🔎 BlockSerializer.deserialize INPUT: {id: 'eac1a4b8-5c60-44a0-b1cd-6d381c3a668c', type: 'text', hasContent: true, contentType: 'string', contentLength: 26, …}
 [VIRTUOSO-RANGE] Visible range changed: {startIndex: 0, endIndex: 3, visibleCount: 4}
 [TABLE-SAVE] Step: Initialization {blockId: 'bb566f28-b32d-4ed1-846d-61b2992f1314', blockType: 'table', hasBlockData: true, receivedData: {…}, willUseDefault: false, …}
 [TABLE-SAVE] Step: Initialization Complete {blockId: 'bb566f28-b32d-4ed1-846d-61b2992f1314', initializedData: {…}}
 📝 TextBlock eac1a4b8-5c60-44a0-b1cd-6d381c3a668c rendered at 2026-01-17T19:32:46.368Z
 [RxDB Replication] ✅ Table "blocks" has required columns. Row count: 2685
 [RxDB Replication] 📊 Sample blocks data: (2) [{…}, {…}]
 [DEBUG-RXDB-SUB-1] 📡 RxDB subscription update: {docCount: 103, folders: Array(103), timestamp: '2026-01-17T19:32:46.401Z'}
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-RXDB-TREE-1] 🌲 Building folder tree from allFolders: {count: 103, folders: Array(103)}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '0b5672c7-3b71-45cd-9810-b3561916e68a', childName: 'hi', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1071e50a-8912-42d0-801c-e591866c8f2f', childName: 'documentation101ee2', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '15f72910-3c3d-4d05-8a27-17698ab940bc', childName: 'New Folder (5)', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1996833f-f6c7-40e8-bd01-ca6038014b30', childName: 'API', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', childName: 'Child Folder', parentId: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b7dce78-648c-4b57-86d7-748be30bf434', childName: 'prompts', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', childName: 'New Folder', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1cb09692-ef54-491f-98ab-b212764a4a6a', childName: 'class', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1db27b1f-e496-49fe-a76a-7ad78267dada', childName: 'problems', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1fd775ce-d7d5-432b-b493-21264e5bd8aa', childName: 'Array Mode Strategy', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2497e4f6-12fa-43bb-9162-663a95d50e12', childName: 'hhhhh', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', childName: 'deep folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ef2f326-4002-49da-9e58-e6d0a785d92d', childName: 'another test', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '35e6e857-0cd7-4dcb-af94-84349819c481', childName: 'API Documentation', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3965e7ad-bb21-4931-8f27-ceca9df4f819', childName: 'ddd', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3a76070f-cd25-4b04-8edd-32821bf048db', childName: 'New Folder (8)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3bf9ad53-e652-4714-a8e3-4c9da9772eb1', childName: 'New Folder', parentId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '43b53e3b-8529-4442-9a0e-1169f13b23b5', childName: 'fff', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4df37232-c960-4768-a27a-155633027e87', childName: 'New Folder', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5c84d5fd-6456-4347-b00c-aa1d94ded6f1', childName: 'google', parentId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', parentName: 'seo thing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5d96ea65-7b5a-4ea7-bb92-b9b7b3d9126c', childName: 'Translation Pipeline Project', parentId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', parentName: '6. Case Studies & Projects'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fad5d30-bcac-451b-92eb-03dda73b984b', childName: 'wow', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', childName: '1. Fundamentals & Concepts', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '629edc8f-6971-45fd-a933-3f0d44b2b943', childName: 'pipeline', parentId: '1db27b1f-e496-49fe-a76a-7ad78267dada', parentName: 'problems'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '63f42a77-ab2a-485f-97d7-a8b2a177e957', childName: 'perfect', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', childName: 'seo thing', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', childName: 'suf folder azure', parentId: 'd7d17345-0614-4caf-b68a-59204d533daf', parentName: 'Azure'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7efb3f18-f7e2-4735-bcf5-b3d899103633', childName: 'New Folder', parentId: '3d979a21-7543-4feb-88dd-4aca26b3178d', parentName: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '825bb222-7f26-434b-900e-d0c5dc76df0b', childName: 'New Folder', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9151a75c-07de-49c6-a07b-4ca46c4112f6', childName: 'fff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '94a95837-1f05-4c4b-bc30-ffd478b65a56', childName: 'Python Implementation', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '96e5391c-1a56-4f07-8f22-767335f94404', childName: 'third one', parentId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9e8db4ee-65f0-42de-8930-bd9caba1a475', childName: 'Core Concepts', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', childName: 'FLASK', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a73869e8-69de-4779-9559-7195b430f9dd', childName: 'New Folderdff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', childName: 'New Folder (2)', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', childName: 'New Folder', parentId: '96e5391c-1a56-4f07-8f22-767335f94404', parentName: 'third one'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', childName: 'introduction', parentId: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', parentName: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', childName: 'Child Folder', parentId: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', childName: 'inspirations', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', childName: 'now better', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'e3c0a491-784e-43c0-997c-6f9385c51fc4', childName: 'fff', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', childName: 'New Folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f095cafa-6c25-46b8-9e44-34e8a199c4ad', childName: 'New Folder (2)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f1a24e04-d07f-407d-9cf7-5edc486aa26e', childName: 'New Folder (3)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', childName: 'vvv', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', childName: 'New Folder', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '19091eff-f88c-4189-a6c1-d7922b1b131a', childName: 'documentation', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '25a99f78-c7b4-4808-a379-d6e11e085ca6', childName: 'JSONL Format', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '28a806ea-a6a5-4a29-b67f-1e5c6bd4a959', childName: 'Monitoring & Tracking', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2b5179fe-73f4-4c07-a1ab-12a8e50812b8', childName: 'Token Management', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '829d1f72-2b9b-4763-8d74-98226df12ca9', childName: '2. Implementation Guides', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', childName: 'Tutorials', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', childName: '3. Cost Optimization', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '55513667-1eab-4477-b2cb-5c4674289f7f', childName: 'Batch Lifecycle', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '6a0bef72-5703-484f-a122-eee412fb7470', childName: 'Examples', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4f9973a2-03a2-4677-bc66-52a48fd6e363', childName: '4. Best Practices', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7af24d44-9784-4002-b51d-294e0aa772e4', childName: 'API Reference', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', childName: '5. Troubleshooting & Debugging', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '984bd7ea-96ef-4c2c-95ea-a645615b8535', childName: 'Best Practices', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', childName: '6. Case Studies & Projects', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ba62e6be-73c5-4487-9e11-ff4942c89b99', childName: 'Azure Chatbot V3 Implementation', parentId: 'd5920de8-febf-4058-b46b-5c4475446d94', parentName: 'can 2'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd5920de8-febf-4058-b46b-5c4475446d94', childName: 'can 2', parentId: '246fc120-6ffc-425d-86d8-e34c402c3dd9', parentName: 'can'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription'}
 [DEBUG-RXDB-TREE-5] 🌲 Tree built. Root folders: {count: 40, roots: Array(40)}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 40, documentCount: 1, folders: Array(40)}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '15f72910-3c3d-4d05-8a27-17698ab940bc', name: 'New Folder (5)', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '825bb222-7f26-434b-900e-d0c5dc76df0b', name: 'New Folder', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', name: 'introduction', parent_id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7efb3f18-f7e2-4735-bcf5-b3d899103633', name: 'New Folder', parent_id: '3d979a21-7543-4feb-88dd-4aca26b3178d'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ef2f326-4002-49da-9e58-e6d0a785d92d', name: 'another test', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fad5d30-bcac-451b-92eb-03dda73b984b', name: 'wow', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals', parent_id: '', existingChildren: 4, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1996833f-f6c7-40e8-bd01-ca6038014b30', name: 'API', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b7dce78-648c-4b57-86d7-748be30bf434', name: 'prompts', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1cb09692-ef54-491f-98ab-b212764a4a6a', name: 'class', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', name: 'FLASK', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1db27b1f-e496-49fe-a76a-7ad78267dada', name: 'problems', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '63f42a77-ab2a-485f-97d7-a8b2a177e957', name: 'perfect', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', name: 'seo thing', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '0b5672c7-3b71-45cd-9810-b3561916e68a', name: 'hi', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '43b53e3b-8529-4442-9a0e-1169f13b23b5', name: 'fff', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', name: 'vvv', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', name: 'New Folder', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', name: 'New Folder (2)', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', name: 'now better', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', name: 'New Folder', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', name: 'suf folder azure', parent_id: 'd7d17345-0614-4caf-b68a-59204d533daf'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', name: 'deep folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', name: 'inspirations', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', name: 'New Folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation', parent_id: '', existingChildren: 5, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '9e8db4ee-65f0-42de-8930-bd9caba1a475', name: 'Core Concepts', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', name: 'Tutorials', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '6a0bef72-5703-484f-a122-eee412fb7470', name: 'Examples', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7af24d44-9784-4002-b51d-294e0aa772e4', name: 'API Reference', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '984bd7ea-96ef-4c2c-95ea-a645615b8535', name: 'Best Practices', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', name: 'Child Folder', parent_id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', name: 'Child Folder', parent_id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning', parent_id: '', existingChildren: 6, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', name: '1. Fundamentals & Concepts', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '829d1f72-2b9b-4763-8d74-98226df12ca9', name: '2. Implementation Guides', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '49811e0d-28a1-47a9-b899-9b5193ece2d6', name: '3. Cost Optimization', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '4f9973a2-03a2-4677-bc66-52a48fd6e363', name: '4. Best Practices', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', name: '5. Troubleshooting & Debugging', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', name: '6. Case Studies & Projects', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd5920de8-febf-4058-b46b-5c4475446d94', name: 'can 2', parent_id: '246fc120-6ffc-425d-86d8-e34c402c3dd9'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 40, rootItems: Array(40)}
 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 1, treeDataLength: 40, expandedFoldersCount: 0, …}
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T19:03:48.047Z
 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 0 documents = 2 items, most recent: 2026-01-14T23:47:14.882Z
 [DEBUG-FOLDER] Folder "New Folder (8)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:57:19.718Z
 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:36.208Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:23.159Z
 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 0 documents = 2 items, most recent: 2026-01-14T23:47:31.155Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T19:25:19.330Z
 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:56:46.807Z
 [DEBUG-FOLDER] Folder "New Folder (5)": 5 subfolders + 0 documents = 5 items, most recent: 2026-01-17T19:25:19.330Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:54:29.374Z
 [DEBUG-FOLDER] Folder "new folder 4": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-17T19:25:19.330Z
 [DEBUG-FOLDER] Folder "New Folder (6)": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T11:11:59.280Z
 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T21:13:51.338Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T10:18:58.469Z
 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-02T10:28:42.169Z
 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-04T21:34:15.563Z
 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-04T21:34:15.563Z
 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T12:10:37.944Z
 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T07:15:16.472Z
 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T21:23:40.667Z
 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-24T21:23:40.667Z
 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:42.460Z
 [DEBUG-FOLDER] Folder "problems": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T23:48:42.460Z
 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
 [DEBUG-FOLDER] Folder "google": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:57.215Z
 [DEBUG-FOLDER] Folder "seo thing": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-17T14:07:21.695Z
 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2026-01-17T14:07:21.695Z
 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-08T09:24:09.176Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-27T21:54:19.336Z
 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T21:14:26.415Z
 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 0 documents = 2 items, most recent: 2026-01-14T21:14:26.415Z
 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-28T08:20:39.989Z
 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
 [DEBUG-FOLDER] Folder "new ui of the folder add": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:24:10.787Z
 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T10:15:42.785Z
 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:34:43.643Z
 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-16T16:34:43.643Z
 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:53:33.052Z
 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-24T22:53:33.052Z
 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:58:39.132Z
 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 0 documents = 2 items, most recent: 2026-01-14T17:53:47.591Z
 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2026-01-14T17:53:47.591Z
 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-16T18:38:02.421Z
 [DEBUG-FOLDER] Folder "can 2": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-16T18:52:45.262Z
 [DEBUG-FOLDER] Folder "can": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-16T18:52:45.262Z
 [DEBUG-FOLDER] Folder "PII encription": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-16T09:01:46.351Z
 [DEBUG-DASHBOARD] Combined: 40 folders + 0 documents = 40 total items
 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
 [PAGINATION-SCROLL] ⚠️ Scroll container not found
 [DEBUG-CREATE-9] Preserving local data (newer or locally created): {id: 'c227ca13', localTitle: 'another test ', serverTitle: 'another test ', localBlocks: 0, reason: 'createdLocally'}
 [DEBUG-CREATE-8] Merging docs: {paginated: 122, locallyCreatedNew: 0, localIds: Array(0)}
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [ACTIVE-DOC] Found in allDocuments: {id: 'c227ca13', title: 'another test '}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 40, documentCount: 122, folders: Array(40)}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '15f72910-3c3d-4d05-8a27-17698ab940bc', name: 'New Folder (5)', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '825bb222-7f26-434b-900e-d0c5dc76df0b', name: 'New Folder', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', name: 'introduction', parent_id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)', parent_id: '', existingChildren: 1, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7efb3f18-f7e2-4735-bcf5-b3d899103633', name: 'New Folder', parent_id: '3d979a21-7543-4feb-88dd-4aca26b3178d'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen', parent_id: '', existingChildren: 0, docsInFolder: 3}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming', parent_id: '', existingChildren: 2, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ef2f326-4002-49da-9e58-e6d0a785d92d', name: 'another test', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fad5d30-bcac-451b-92eb-03dda73b984b', name: 'wow', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals', parent_id: '', existingChildren: 4, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1996833f-f6c7-40e8-bd01-ca6038014b30', name: 'API', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b7dce78-648c-4b57-86d7-748be30bf434', name: 'prompts', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1cb09692-ef54-491f-98ab-b212764a4a6a', name: 'class', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', name: 'FLASK', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1db27b1f-e496-49fe-a76a-7ad78267dada', name: 'problems', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '63f42a77-ab2a-485f-97d7-a8b2a177e957', name: 'perfect', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', name: 'seo thing', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '0b5672c7-3b71-45cd-9810-b3561916e68a', name: 'hi', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '43b53e3b-8529-4442-9a0e-1169f13b23b5', name: 'fff', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', name: 'vvv', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', name: 'New Folder', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', name: 'New Folder (2)', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', name: 'now better', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', name: 'New Folder', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', name: 'suf folder azure', parent_id: 'd7d17345-0614-4caf-b68a-59204d533daf'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest', parent_id: '', existingChildren: 3, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', name: 'deep folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', name: 'inspirations', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', name: 'New Folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation', parent_id: '', existingChildren: 5, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '9e8db4ee-65f0-42de-8930-bd9caba1a475', name: 'Core Concepts', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', name: 'Tutorials', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '6a0bef72-5703-484f-a122-eee412fb7470', name: 'Examples', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7af24d44-9784-4002-b51d-294e0aa772e4', name: 'API Reference', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '984bd7ea-96ef-4c2c-95ea-a645615b8535', name: 'Best Practices', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', name: 'Child Folder', parent_id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', name: 'Child Folder', parent_id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning', parent_id: '', existingChildren: 6, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', name: '1. Fundamentals & Concepts', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '829d1f72-2b9b-4763-8d74-98226df12ca9', name: '2. Implementation Guides', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '49811e0d-28a1-47a9-b899-9b5193ece2d6', name: '3. Cost Optimization', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '4f9973a2-03a2-4677-bc66-52a48fd6e363', name: '4. Best Practices', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', name: '5. Troubleshooting & Debugging', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', name: '6. Case Studies & Projects', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd5920de8-febf-4058-b46b-5c4475446d94', name: 'can 2', parent_id: '246fc120-6ffc-425d-86d8-e34c402c3dd9'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription', parent_id: '', existingChildren: 0, docsInFolder: 2}
index-rWgMQ1DB.js:26 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 133, rootItems: Array(133)}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 5 documents = 5 items, most recent: 2026-01-14T19:03:48.047Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:14.882Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (8)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:57:19.718Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:36.208Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:23.159Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:31.155Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:56:46.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (5)": 5 subfolders + 0 documents = 5 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:54:29.374Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 4": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (6)": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T11:11:59.280Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T21:13:51.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T10:18:58.469Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 3 documents = 3 items, most recent: 2025-08-21T12:10:37.944Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-17T07:15:16.472Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 2 documents = 4 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "problems": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "google": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:57.215Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "seo thing": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-08T09:24:09.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new ui of the folder add": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:24:10.787Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T10:15:42.785Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 2 documents = 5 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-16T18:38:02.421Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can 2": 1 subfolders + 3 documents = 4 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "PII encription": 0 subfolders + 2 documents = 2 items, most recent: 2026-01-16T09:01:46.351Z
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Combined: 40 folders + 93 documents = 133 total items
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-rWgMQ1DB.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-rWgMQ1DB.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 🤖 AIBlock 3f0d728b-70cd-4f96-924f-5bbff5e97d5e rendered at 2026-01-17T19:32:46.690Z
index-rWgMQ1DB.js:26 📁 FileTreeBlock 56f9c8a2-8caf-44c3-949d-3dec4ed8c555 rendered at 2026-01-17T19:32:46.691Z
index-rWgMQ1DB.js:26 [RxDB Replication] ✅ Table "folders" has required columns. Row count: 103
index-rWgMQ1DB.js:26 [RxDB Replication] 📊 Sample folders data: (2) [{…}, {…}]
index-rWgMQ1DB.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-16] 💾 Settings from DATABASE (profiles table): {source: 'profiles.settings', userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 1800000, oldTimeout_hours: 0.5, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:46.737Z', timestamp: '2026-01-17T19:32:46.737Z'}
index-rWgMQ1DB.js:26 [RxDB Replication] ✅ Table "documents" has required columns. Row count: 409
index-rWgMQ1DB.js:26 [RxDB Replication] 📊 Sample documents data: (2) [{…}, {…}]
index-rWgMQ1DB.js:26 [RxDB Replication] ✅ All Supabase tables have required columns
index-rWgMQ1DB.js:26 [RxDB Replication] 🔌 Forcing Supabase Realtime WebSocket initialization...
index-rWgMQ1DB.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-rWgMQ1DB.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-16] 💾 Settings from DATABASE (profiles table): {source: 'profiles.settings', userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b', sessionTimeout_minutes: 30, sessionTimeout_hours: 0.5, allSettings: {…}, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-2] ⚠️ Timeout OVERRIDDEN via setInactivityTimeout(): {oldTimeout_ms: 1800000, oldTimeout_hours: 0.5, newTimeout_minutes: 30, newTimeout_ms: 1800000, newTimeout_hours: 0.5, …}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:46.761Z', timestamp: '2026-01-17T19:32:46.761Z'}
index-rWgMQ1DB.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-rWgMQ1DB.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 ExpandedView: Initial load period complete, enabling saves
index-rWgMQ1DB.js:26 [RxDB Replication] Channel status: SUBSCRIBED 
index-rWgMQ1DB.js:26 [RxDB Replication] ✅ Realtime WebSocket connected and ready!
index-rWgMQ1DB.js:26 [RxDB Replication] Channel status: CLOSED 
index-rWgMQ1DB.js:26 [RxDB Replication] Setting up replication for documents
index-rWgMQ1DB.js:26 [RxDB Replication] DEBUG supabase client check: {supabaseExists: true, hasFrom: true, hasChannel: true}
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Inactive
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Replication object created {isStopped: false, collection: 'documents', identifier: 'supabase-v12-documents-8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Started
index-rWgMQ1DB.js:26 [RxDB Replication] Setting up replication for folders
index-rWgMQ1DB.js:26 [RxDB Replication] DEBUG supabase client check: {supabaseExists: true, hasFrom: true, hasChannel: true}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Inactive
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Replication object created {isStopped: false, collection: 'folders', identifier: 'supabase-v12-folders-8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Started
index-rWgMQ1DB.js:26 [RxDB Replication] Channel status: CLOSED 
index-rWgMQ1DB.js:26 [RxDB Replication] Setting up replication for blocks
index-rWgMQ1DB.js:26 [RxDB Replication] DEBUG supabase client check: {supabaseExists: true, hasFrom: true, hasChannel: true}
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Inactive
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Replication object created {isStopped: false, collection: 'blocks', identifier: 'supabase-v12-blocks-8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Started
index-rWgMQ1DB.js:26 [RxDB Replication] All replications started successfully!
index-rWgMQ1DB.js:26 [DatabaseProvider] Replications started
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Active
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Active
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Active
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Active
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Active
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Active
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Pull starting {checkpoint: {…}, batchSize: 100}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Pull starting {checkpoint: {…}, batchSize: 100}
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Pull starting {checkpoint: {…}, batchSize: 200}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Active
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Active
index-rWgMQ1DB.js:26 [RxDB Replication] blocks: Active
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367212, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-rWgMQ1DB.js:26 [RxDB Replication] documents: Pulled 0 docs {newCheckpoint: {…}, hasMore: false}
 [RxDB Replication] documents: Inactive
 [RxDB Replication] blocks: Pulled 0 docs {newCheckpoint: {…}, hasMore: false}
 [RxDB Replication] blocks: Inactive
 [RxDB Replication] folders: Pulled 1 docs {newCheckpoint: {…}, hasMore: false}
 [RxDB Replication] folders: Active
 [RxDB Replication] folders: Active
 [RxDB Replication] folders: Received 1 docs from pull [{…}]
 [DEBUG-RXDB-SUB-1] 📡 RxDB subscription update: {docCount: 103, folders: Array(103), timestamp: '2026-01-17T19:32:47.480Z'}
 [RxDB Replication] folders: Active
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-RXDB-TREE-1] 🌲 Building folder tree from allFolders: {count: 103, folders: Array(103)}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '0b5672c7-3b71-45cd-9810-b3561916e68a', childName: 'hi', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1071e50a-8912-42d0-801c-e591866c8f2f', childName: 'documentation101ee2', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '15f72910-3c3d-4d05-8a27-17698ab940bc', childName: 'New Folder (5)', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1996833f-f6c7-40e8-bd01-ca6038014b30', childName: 'API', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', childName: 'Child Folder', parentId: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b7dce78-648c-4b57-86d7-748be30bf434', childName: 'prompts', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', childName: 'New Folder', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1cb09692-ef54-491f-98ab-b212764a4a6a', childName: 'class', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1db27b1f-e496-49fe-a76a-7ad78267dada', childName: 'problems', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1fd775ce-d7d5-432b-b493-21264e5bd8aa', childName: 'Array Mode Strategy', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2497e4f6-12fa-43bb-9162-663a95d50e12', childName: 'hhhhh', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', childName: 'deep folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ef2f326-4002-49da-9e58-e6d0a785d92d', childName: 'another test', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '35e6e857-0cd7-4dcb-af94-84349819c481', childName: 'API Documentation', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3965e7ad-bb21-4931-8f27-ceca9df4f819', childName: 'ddd', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3a76070f-cd25-4b04-8edd-32821bf048db', childName: 'New Folder (8)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3bf9ad53-e652-4714-a8e3-4c9da9772eb1', childName: 'New Folder', parentId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '43b53e3b-8529-4442-9a0e-1169f13b23b5', childName: 'fff', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4df37232-c960-4768-a27a-155633027e87', childName: 'New Folder', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5c84d5fd-6456-4347-b00c-aa1d94ded6f1', childName: 'google', parentId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', parentName: 'seo thing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5d96ea65-7b5a-4ea7-bb92-b9b7b3d9126c', childName: 'Translation Pipeline Project', parentId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', parentName: '6. Case Studies & Projects'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fad5d30-bcac-451b-92eb-03dda73b984b', childName: 'wow', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', childName: '1. Fundamentals & Concepts', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '629edc8f-6971-45fd-a933-3f0d44b2b943', childName: 'pipeline', parentId: '1db27b1f-e496-49fe-a76a-7ad78267dada', parentName: 'problems'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '63f42a77-ab2a-485f-97d7-a8b2a177e957', childName: 'perfect', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', childName: 'seo thing', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', childName: 'suf folder azure', parentId: 'd7d17345-0614-4caf-b68a-59204d533daf', parentName: 'Azure'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7efb3f18-f7e2-4735-bcf5-b3d899103633', childName: 'New Folder', parentId: '3d979a21-7543-4feb-88dd-4aca26b3178d', parentName: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '825bb222-7f26-434b-900e-d0c5dc76df0b', childName: 'New Folder', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9151a75c-07de-49c6-a07b-4ca46c4112f6', childName: 'fff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '94a95837-1f05-4c4b-bc30-ffd478b65a56', childName: 'Python Implementation', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '96e5391c-1a56-4f07-8f22-767335f94404', childName: 'third one', parentId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9e8db4ee-65f0-42de-8930-bd9caba1a475', childName: 'Core Concepts', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', childName: 'FLASK', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a73869e8-69de-4779-9559-7195b430f9dd', childName: 'New Folderdff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', childName: 'New Folder (2)', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', childName: 'New Folder', parentId: '96e5391c-1a56-4f07-8f22-767335f94404', parentName: 'third one'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', childName: 'introduction', parentId: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', parentName: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', childName: 'Child Folder', parentId: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', childName: 'inspirations', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', childName: 'now better', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'e3c0a491-784e-43c0-997c-6f9385c51fc4', childName: 'fff', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', childName: 'New Folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f095cafa-6c25-46b8-9e44-34e8a199c4ad', childName: 'New Folder (2)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f1a24e04-d07f-407d-9cf7-5edc486aa26e', childName: 'New Folder (3)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', childName: 'vvv', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', childName: 'New Folder', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '19091eff-f88c-4189-a6c1-d7922b1b131a', childName: 'documentation', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '25a99f78-c7b4-4808-a379-d6e11e085ca6', childName: 'JSONL Format', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '28a806ea-a6a5-4a29-b67f-1e5c6bd4a959', childName: 'Monitoring & Tracking', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2b5179fe-73f4-4c07-a1ab-12a8e50812b8', childName: 'Token Management', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '829d1f72-2b9b-4763-8d74-98226df12ca9', childName: '2. Implementation Guides', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', childName: 'Tutorials', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', childName: '3. Cost Optimization', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '55513667-1eab-4477-b2cb-5c4674289f7f', childName: 'Batch Lifecycle', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '6a0bef72-5703-484f-a122-eee412fb7470', childName: 'Examples', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4f9973a2-03a2-4677-bc66-52a48fd6e363', childName: '4. Best Practices', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7af24d44-9784-4002-b51d-294e0aa772e4', childName: 'API Reference', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', childName: '5. Troubleshooting & Debugging', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '984bd7ea-96ef-4c2c-95ea-a645615b8535', childName: 'Best Practices', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', childName: '6. Case Studies & Projects', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ba62e6be-73c5-4487-9e11-ff4942c89b99', childName: 'Azure Chatbot V3 Implementation', parentId: 'd5920de8-febf-4058-b46b-5c4475446d94', parentName: 'can 2'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd5920de8-febf-4058-b46b-5c4475446d94', childName: 'can 2', parentId: '246fc120-6ffc-425d-86d8-e34c402c3dd9', parentName: 'can'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription'}
 [DEBUG-RXDB-TREE-5] 🌲 Tree built. Root folders: {count: 40, roots: Array(40)}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 40, documentCount: 122, folders: Array(40)}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '15f72910-3c3d-4d05-8a27-17698ab940bc', name: 'New Folder (5)', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '825bb222-7f26-434b-900e-d0c5dc76df0b', name: 'New Folder', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', name: 'introduction', parent_id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)', parent_id: '', existingChildren: 1, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7efb3f18-f7e2-4735-bcf5-b3d899103633', name: 'New Folder', parent_id: '3d979a21-7543-4feb-88dd-4aca26b3178d'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen', parent_id: '', existingChildren: 0, docsInFolder: 3}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming', parent_id: '', existingChildren: 2, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ef2f326-4002-49da-9e58-e6d0a785d92d', name: 'another test', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fad5d30-bcac-451b-92eb-03dda73b984b', name: 'wow', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals', parent_id: '', existingChildren: 4, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1996833f-f6c7-40e8-bd01-ca6038014b30', name: 'API', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b7dce78-648c-4b57-86d7-748be30bf434', name: 'prompts', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1cb09692-ef54-491f-98ab-b212764a4a6a', name: 'class', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', name: 'FLASK', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1db27b1f-e496-49fe-a76a-7ad78267dada', name: 'problems', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '63f42a77-ab2a-485f-97d7-a8b2a177e957', name: 'perfect', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', name: 'seo thing', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '0b5672c7-3b71-45cd-9810-b3561916e68a', name: 'hi', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '43b53e3b-8529-4442-9a0e-1169f13b23b5', name: 'fff', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', name: 'vvv', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', name: 'New Folder', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', name: 'New Folder (2)', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', name: 'now better', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', name: 'New Folder', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', name: 'suf folder azure', parent_id: 'd7d17345-0614-4caf-b68a-59204d533daf'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest', parent_id: '', existingChildren: 3, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', name: 'deep folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', name: 'inspirations', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', name: 'New Folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation', parent_id: '', existingChildren: 5, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '9e8db4ee-65f0-42de-8930-bd9caba1a475', name: 'Core Concepts', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', name: 'Tutorials', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '6a0bef72-5703-484f-a122-eee412fb7470', name: 'Examples', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7af24d44-9784-4002-b51d-294e0aa772e4', name: 'API Reference', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '984bd7ea-96ef-4c2c-95ea-a645615b8535', name: 'Best Practices', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', name: 'Child Folder', parent_id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', name: 'Child Folder', parent_id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning', parent_id: '', existingChildren: 6, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', name: '1. Fundamentals & Concepts', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '829d1f72-2b9b-4763-8d74-98226df12ca9', name: '2. Implementation Guides', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '49811e0d-28a1-47a9-b899-9b5193ece2d6', name: '3. Cost Optimization', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '4f9973a2-03a2-4677-bc66-52a48fd6e363', name: '4. Best Practices', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', name: '5. Troubleshooting & Debugging', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', name: '6. Case Studies & Projects', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd5920de8-febf-4058-b46b-5c4475446d94', name: 'can 2', parent_id: '246fc120-6ffc-425d-86d8-e34c402c3dd9'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription', parent_id: '', existingChildren: 0, docsInFolder: 2}
index-rWgMQ1DB.js:26 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 133, rootItems: Array(133)}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 5 documents = 5 items, most recent: 2026-01-14T19:03:48.047Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:14.882Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (8)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:57:19.718Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:36.208Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:23.159Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:31.155Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:56:46.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (5)": 5 subfolders + 0 documents = 5 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:54:29.374Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 4": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (6)": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T11:11:59.280Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T21:13:51.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-17T10:18:58.469Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 3 documents = 3 items, most recent: 2025-08-21T12:10:37.944Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-17T07:15:16.472Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 2 documents = 4 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "problems": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "google": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:57.215Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "seo thing": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-08T09:24:09.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new ui of the folder add": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:24:10.787Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T10:15:42.785Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 2 documents = 5 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-16T18:38:02.421Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can 2": 1 subfolders + 3 documents = 4 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "PII encription": 0 subfolders + 2 documents = 2 items, most recent: 2026-01-16T09:01:46.351Z
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Combined: 40 folders + 93 documents = 133 total items
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-rWgMQ1DB.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-rWgMQ1DB.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 40, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 0, …}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Inactive
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [DatabaseProvider] Replication health check: {documents: 122, folders: 103, replications: 3}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-7] 🖱️ User activity detected: {activityCount: 1, lastEvent: 'mousedown', timerWillReset: true, timestamp: '2026-01-17T19:32:50.839Z'}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:50.839Z', timestamp: '2026-01-17T19:32:50.839Z'}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 1800000, timeout_hours: 0.5, willExpireAt: '2026-01-17T20:02:53.184Z', timestamp: '2026-01-17T19:32:53.184Z'}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 1, …}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: false, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 2, …}
index-rWgMQ1DB.js:26 [DEBUG-DND-1] 🎯 handleDragEnd START: {activeId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', overId: '15f72910-3c3d-4d05-8a27-17698ab940bc', timestamp: '2026-01-17T19:32:55.046Z'}
index-rWgMQ1DB.js:26 [DEBUG-DND-3] 📦 Dragged item found: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', type: 'folder', parent_id: '', found: true}
index-rWgMQ1DB.js:26 [DEBUG-DND-8] 🎯 Target item found: {id: '15f72910-3c3d-4d05-8a27-17698ab940bc', name: 'New Folder (5)', type: 'folder', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2', found: true}
index-rWgMQ1DB.js:26 [DEBUG-DESCENDANT-1] 🔍 Checking isDescendant: {folderId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', folderName: 'New Folder (2)', targetId: '15f72910-3c3d-4d05-8a27-17698ab940bc', hasChildren: false, childrenIds: Array(0)}
index-rWgMQ1DB.js:26 [DEBUG-DND-11] 📁➡️📁 Moving folder to folder: {folderId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', folderName: 'New Folder (2)', targetFolderId: '15f72910-3c3d-4d05-8a27-17698ab940bc', targetFolderName: 'New Folder (5)', isDescendant: false, …}
index-rWgMQ1DB.js:26 [DEBUG-DND-12] ✅ Calling onMoveFolder
index-rWgMQ1DB.js:26 [DEBUG-MOVE-1] 📁 moveFolder START: {folderId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', targetParentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', hasCollection: true, timestamp: '2026-01-17T19:32:55.048Z'}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 40, totalDocs: 122, treeDataLength: 133, expandedFoldersCount: 2, …}
 [DEBUG-MOVE-3] 📄 Found folder document: {found: true, currentName: 'New Folder (2)', currentParentId: '', currentPath: '/27fb330b-1c6b-4253-a19d-344dd5b0bf2f/'}
 [DEBUG-MOVE-5] 📂 Target parent folder: {found: true, parentName: 'New Folder (5)', parentPath: '/18be740c-c477-4d3f-b299-a606838c46f2/15f72910-3c3d-4d05-8a27-17698ab940bc/'}
 [DEBUG-MOVE-6] 🔄 Calling updateFolder with: {folderId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', newParentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', newPath: '/18be740c-c477-4d3f-b299-a606838c46f2/15f72910-3c3d-4d05-8a27-17698ab940bc//New Folder (2)'}
 [DEBUG-UPDATE-1] ✏️ updateFolder START: {folderId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', updates: {…}, hasCollection: true}
 [DEBUG-UPDATE-4] 📄 Found folder, current state: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', parent_id: '', path: '/27fb330b-1c6b-4253-a19d-344dd5b0bf2f/'}
 [DEBUG-UPDATE-5] 🔄 Patching with: {parent_id: '15f72910-3c3d-4d05-8a27-17698ab940bc', path: '/18be740c-c477-4d3f-b299-a606838c46f2/15f72910-3c3d-4d05-8a27-17698ab940bc//New Folder (2)', updated_at: '2026-01-17T19:32:55.071Z', _modified: 1768678375071}
 [RxDB Replication] folders: Active
 [RxDB Replication] folders: Active
 [DEBUG-RXDB-SUB-1] 📡 RxDB subscription update: {docCount: 103, folders: Array(103), timestamp: '2026-01-17T19:32:55.088Z'}
 [DEBUG-UPDATE-6] ✅ Patch complete, new state: {id: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', name: 'New Folder (2)', parent_id: '', path: '/27fb330b-1c6b-4253-a19d-344dd5b0bf2f/'}
 [DEBUG-MOVE-7] ✅ moveFolder COMPLETE - folder should now have new parent
 [DEBUG-DND-13] ✅ onMoveFolder completed
 [DEBUG-DND-15] 🏁 handleDragEnd COMPLETE
 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
 [DEBUG-RXDB-TREE-1] 🌲 Building folder tree from allFolders: {count: 103, folders: Array(103)}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '0b5672c7-3b71-45cd-9810-b3561916e68a', childName: 'hi', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1071e50a-8912-42d0-801c-e591866c8f2f', childName: 'documentation101ee2', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '15f72910-3c3d-4d05-8a27-17698ab940bc', childName: 'New Folder (5)', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1996833f-f6c7-40e8-bd01-ca6038014b30', childName: 'API', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', childName: 'Child Folder', parentId: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1b7dce78-648c-4b57-86d7-748be30bf434', childName: 'prompts', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', childName: 'New Folder', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1cb09692-ef54-491f-98ab-b212764a4a6a', childName: 'class', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1db27b1f-e496-49fe-a76a-7ad78267dada', childName: 'problems', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '1fd775ce-d7d5-432b-b493-21264e5bd8aa', childName: 'Array Mode Strategy', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2497e4f6-12fa-43bb-9162-663a95d50e12', childName: 'hhhhh', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '27fb330b-1c6b-4253-a19d-344dd5b0bf2f', childName: 'New Folder (2)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', childName: 'deep folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2ef2f326-4002-49da-9e58-e6d0a785d92d', childName: 'another test', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '35e6e857-0cd7-4dcb-af94-84349819c481', childName: 'API Documentation', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3965e7ad-bb21-4931-8f27-ceca9df4f819', childName: 'ddd', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3a76070f-cd25-4b04-8edd-32821bf048db', childName: 'New Folder (8)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '3bf9ad53-e652-4714-a8e3-4c9da9772eb1', childName: 'New Folder', parentId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '43b53e3b-8529-4442-9a0e-1169f13b23b5', childName: 'fff', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4df37232-c960-4768-a27a-155633027e87', childName: 'New Folder', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5c84d5fd-6456-4347-b00c-aa1d94ded6f1', childName: 'google', parentId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', parentName: 'seo thing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5d96ea65-7b5a-4ea7-bb92-b9b7b3d9126c', childName: 'Translation Pipeline Project', parentId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', parentName: '6. Case Studies & Projects'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fad5d30-bcac-451b-92eb-03dda73b984b', childName: 'wow', parentId: '40aa8b4f-6791-4936-a36c-c80982802f91', parentName: 'renaming'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', childName: '1. Fundamentals & Concepts', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '629edc8f-6971-45fd-a933-3f0d44b2b943', childName: 'pipeline', parentId: '1db27b1f-e496-49fe-a76a-7ad78267dada', parentName: 'problems'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '63f42a77-ab2a-485f-97d7-a8b2a177e957', childName: 'perfect', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', childName: 'seo thing', parentId: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', parentName: 'devlog'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', childName: 'suf folder azure', parentId: 'd7d17345-0614-4caf-b68a-59204d533daf', parentName: 'Azure'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7efb3f18-f7e2-4735-bcf5-b3d899103633', childName: 'New Folder', parentId: '3d979a21-7543-4feb-88dd-4aca26b3178d', parentName: 'New Folder (4)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '825bb222-7f26-434b-900e-d0c5dc76df0b', childName: 'New Folder', parentId: '18be740c-c477-4d3f-b299-a606838c46f2', parentName: 'new folder 4'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9151a75c-07de-49c6-a07b-4ca46c4112f6', childName: 'fff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '94a95837-1f05-4c4b-bc30-ffd478b65a56', childName: 'Python Implementation', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '96e5391c-1a56-4f07-8f22-767335f94404', childName: 'third one', parentId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '9e8db4ee-65f0-42de-8930-bd9caba1a475', childName: 'Core Concepts', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', childName: 'FLASK', parentId: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', parentName: 'fundamentals'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a73869e8-69de-4779-9559-7195b430f9dd', childName: 'New Folderdff', parentId: '2497e4f6-12fa-43bb-9162-663a95d50e12', parentName: 'hhhhh'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', childName: 'New Folder (2)', parentId: '95088787-07bc-41ea-bc83-7eec45e9587a', parentName: 'New Folder (3)'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b2102817-9bc7-4bd5-ac8c-38eb07ef64d3', childName: 'New Folder', parentId: '96e5391c-1a56-4f07-8f22-767335f94404', parentName: 'third one'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', childName: 'introduction', parentId: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', parentName: 'world of the API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', childName: 'Child Folder', parentId: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', parentName: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', childName: 'inspirations', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', childName: 'now better', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'e3c0a491-784e-43c0-997c-6f9385c51fc4', childName: 'fff', parentId: '4df37232-c960-4768-a27a-155633027e87', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', childName: 'New Folder', parentId: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', parentName: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f095cafa-6c25-46b8-9e44-34e8a199c4ad', childName: 'New Folder (2)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f1a24e04-d07f-407d-9cf7-5edc486aa26e', childName: 'New Folder (3)', parentId: '15f72910-3c3d-4d05-8a27-17698ab940bc', parentName: 'New Folder (5)'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', childName: 'vvv', parentId: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', parentName: 'hello'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', childName: 'New Folder', parentId: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', parentName: 'New Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '19091eff-f88c-4189-a6c1-d7922b1b131a', childName: 'documentation', parentId: '1071e50a-8912-42d0-801c-e591866c8f2f', parentName: 'documentation101ee2'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '25a99f78-c7b4-4808-a379-d6e11e085ca6', childName: 'JSONL Format', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '28a806ea-a6a5-4a29-b67f-1e5c6bd4a959', childName: 'Monitoring & Tracking', parentId: '829d1f72-2b9b-4763-8d74-98226df12ca9', parentName: '2. Implementation Guides'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '2b5179fe-73f4-4c07-a1ab-12a8e50812b8', childName: 'Token Management', parentId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', parentName: '3. Cost Optimization'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '829d1f72-2b9b-4763-8d74-98226df12ca9', childName: '2. Implementation Guides', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', childName: 'Tutorials', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '49811e0d-28a1-47a9-b899-9b5193ece2d6', childName: '3. Cost Optimization', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '55513667-1eab-4477-b2cb-5c4674289f7f', childName: 'Batch Lifecycle', parentId: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', parentName: '1. Fundamentals & Concepts'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '6a0bef72-5703-484f-a122-eee412fb7470', childName: 'Examples', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '4f9973a2-03a2-4677-bc66-52a48fd6e363', childName: '4. Best Practices', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7af24d44-9784-4002-b51d-294e0aa772e4', childName: 'API Reference', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', childName: '5. Troubleshooting & Debugging', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: '984bd7ea-96ef-4c2c-95ea-a645615b8535', childName: 'Best Practices', parentId: '977a0bfd-7453-4380-8806-35628866ecbe', parentName: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', childName: '6. Case Studies & Projects', parentId: '8a31e0ac-21d4-4705-9b69-5093c50a464d', parentName: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'ba62e6be-73c5-4487-9e11-ff4942c89b99', childName: 'Azure Chatbot V3 Implementation', parentId: 'd5920de8-febf-4058-b46b-5c4475446d94', parentName: 'can 2'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can'}
 [DEBUG-RXDB-TREE-2] 📂 Adding child to parent: {childId: 'd5920de8-febf-4058-b46b-5c4475446d94', childName: 'can 2', parentId: '246fc120-6ffc-425d-86d8-e34c402c3dd9', parentName: 'can'}
 [DEBUG-RXDB-TREE-4] 🏠 Root folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription'}
 [DEBUG-RXDB-TREE-5] 🌲 Tree built. Root folders: {count: 39, roots: Array(39)}
 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 39, …}
 [DEBUG-TREE-1] 🌳 Building treeData: {folderCount: 39, documentCount: 122, folders: Array(39)}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '18be740c-c477-4d3f-b299-a606838c46f2', name: 'new folder 4', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '15f72910-3c3d-4d05-8a27-17698ab940bc', name: 'New Folder (5)', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '825bb222-7f26-434b-900e-d0c5dc76df0b', name: 'New Folder', parent_id: '18be740c-c477-4d3f-b299-a606838c46f2'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '1fedaa6e-07b9-4b1a-b863-6088486bb5cf', name: 'New Folder (6)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '218ebbeb-f481-454b-910b-f7d53217decb', name: 'important lessons', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b', name: 'world of the API', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'b9a4edec-4d40-4acb-84f1-bc4788843c0a', name: 'introduction', parent_id: '2afd224c-3c9f-4f0f-bde6-53c58b26500b'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3d979a21-7543-4feb-88dd-4aca26b3178d', name: 'New Folder (4)', parent_id: '', existingChildren: 1, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7efb3f18-f7e2-4735-bcf5-b3d899103633', name: 'New Folder', parent_id: '3d979a21-7543-4feb-88dd-4aca26b3178d'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '3f5e169b-905a-4641-beef-d9699f7876e5', name: 'what should happen', parent_id: '', existingChildren: 0, docsInFolder: 3}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '40aa8b4f-6791-4936-a36c-c80982802f91', name: 'renaming', parent_id: '', existingChildren: 2, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ef2f326-4002-49da-9e58-e6d0a785d92d', name: 'another test', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fad5d30-bcac-451b-92eb-03dda73b984b', name: 'wow', parent_id: '40aa8b4f-6791-4936-a36c-c80982802f91'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '4c45e7d8-2209-483e-92ea-e484dce49cf5', name: 'TRANSLATION', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c', name: 'fundamentals', parent_id: '', existingChildren: 4, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1996833f-f6c7-40e8-bd01-ca6038014b30', name: 'API', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b7dce78-648c-4b57-86d7-748be30bf434', name: 'prompts', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1cb09692-ef54-491f-98ab-b212764a4a6a', name: 'class', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a21a5bb1-3172-4f10-a17e-ce503cf86d62', name: 'FLASK', parent_id: '61b3dfa2-a8f9-4f9c-9b00-687d3424109c'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3', name: 'devlog', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1db27b1f-e496-49fe-a76a-7ad78267dada', name: 'problems', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '63f42a77-ab2a-485f-97d7-a8b2a177e957', name: 'perfect', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7d04b197-6e6e-4f3e-a7bc-2227abcc7ea3', name: 'seo thing', parent_id: '63e6c9dd-be15-481a-90d7-09e3009b4fa3'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '717ba84c-478c-4341-b0be-84f70984a394', name: 'translation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5', name: 'hello', parent_id: '', existingChildren: 3, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '0b5672c7-3b71-45cd-9810-b3561916e68a', name: 'hi', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '43b53e3b-8529-4442-9a0e-1169f13b23b5', name: 'fff', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'f943be0d-c5cd-4420-a28d-ef73d4ddc346', name: 'vvv', parent_id: '7cb0ab3d-b3e6-443c-b0ef-2145870b5cb5'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7cc840da-c61e-415c-9404-1d8de7fb0ac0', name: 'chatbot africawork', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '7ee02fee-bf53-4944-8e18-3ebfa7b25560', name: 'new folder 222', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '904954ce-c170-46df-9c54-d5c1bce595a7', name: 'planing', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '95088787-07bc-41ea-bc83-7eec45e9587a', name: 'New Folder (3)', parent_id: '', existingChildren: 2, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1bcc11a1-aa5e-423a-8078-e5b143cac6d5', name: 'New Folder', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'a8141ab0-00b1-45c1-8067-c07fd5b4925f', name: 'New Folder (2)', parent_id: '95088787-07bc-41ea-bc83-7eec45e9587a'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255', name: 'New Folder', parent_id: '', existingChildren: 2, docsInFolder: 1}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'da95695d-3e2b-408d-97aa-6c7bf6e1728a', name: 'now better', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'faa055f5-a0ae-406c-a359-9bef329f2a6c', name: 'New Folder', parent_id: 'ae1e5233-9bda-4bfa-86e7-71158c4bc255'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ca396b76-ae3d-40c4-949f-528014cc5867', name: 'New Folder (7)', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'ccb7a87d-e67a-4dcc-94ba-6fbc831f2401', name: 'folder 1101', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'd7d17345-0614-4caf-b68a-59204d533daf', name: 'Azure', parent_id: '', existingChildren: 1, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7ec618c2-db8a-4d57-813d-8c70d39a0a99', name: 'suf folder azure', parent_id: 'd7d17345-0614-4caf-b68a-59204d533daf'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'e2684681-829d-408b-8f56-9ee95e02f513', name: 'new ui of the folder add', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04', name: 'another ttest', parent_id: '', existingChildren: 3, docsInFolder: 2}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '2ab69efe-97fe-4cae-85fa-8c3ca59691bd', name: 'deep folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ca698323-6298-4b0d-9dfc-65c489ffefaf', name: 'inspirations', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'ebbdd7ce-9b44-4b6f-9848-a35169962c62', name: 'New Folder', parent_id: 'fbd7a075-1d0f-4460-ac87-a2b610bdea04'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: 'a4db9900-3b8b-4923-8f3a-579dc867f912', name: 'documentation', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '52a4d76d-2795-4c60-b6a9-67ebbe45eec6', name: 'Test Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '53bd0141-3b25-4320-9df5-0f992e8b610b', name: 'Test Folder from API', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5fea3ed2-2394-46ff-9fc7-f4094c39483b', name: 'Test Folder from NPM Package', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '977a0bfd-7453-4380-8806-35628866ecbe', name: 'LangGraph Documentation', parent_id: '', existingChildren: 5, docsInFolder: 0}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '9e8db4ee-65f0-42de-8930-bd9caba1a475', name: 'Core Concepts', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '8ade3b25-85fc-415d-80e6-79d68ff0e8fe', name: 'Tutorials', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '6a0bef72-5703-484f-a122-eee412fb7470', name: 'Examples', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7af24d44-9784-4002-b51d-294e0aa772e4', name: 'API Reference', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-3] 📂 Processing child folder: {id: '984bd7ea-96ef-4c2c-95ea-a645615b8535', name: 'Best Practices', parent_id: '977a0bfd-7453-4380-8806-35628866ecbe'}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '67bb6625-4da1-4ca4-ada8-e4d1b1b23443', name: 'Test Folder for Move', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fd414-b048-40fc-9ef7-9734696b4db9', name: 'MCP Test Folder - Claude Code', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '5967ac8d-d8d4-4f18-8b65-dd4987b7a505', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
 [DEBUG-TREE-2] 📁 Processing folder: {id: '344e82d5-803e-4bfc-9d4f-a63641484a03', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '754f8d0d-63ed-40ac-a74d-3b85bd62b6ad', name: 'Test Debug Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'cd8e2c17-607c-4878-938d-4f05c87dbd98', name: 'Test Folder Suite', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'c5cce2ba-5554-4ea5-b83f-046085d526bb', name: 'Child Folder', parent_id: '1ed5117b-cb68-4638-aaef-1f0a4eacf714'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c0b527a7-9aaf-430b-8b00-65be5b59c455', name: 'Parent Folder', parent_id: '', existingChildren: 0, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4', name: 'Parent Folder', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '1b76ed8f-9a54-46ee-92eb-5ffa9a4ba243', name: 'Child Folder', parent_id: 'c7dd4ec9-0f24-4fb6-a94e-4fdc255e76d4'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '8a31e0ac-21d4-4705-9b69-5093c50a464d', name: 'OpenAI Batch Mode Learning', parent_id: '', existingChildren: 6, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '5fe7f5df-2908-4c3e-9743-b8d6f80887cb', name: '1. Fundamentals & Concepts', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '829d1f72-2b9b-4763-8d74-98226df12ca9', name: '2. Implementation Guides', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '49811e0d-28a1-47a9-b899-9b5193ece2d6', name: '3. Cost Optimization', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '4f9973a2-03a2-4677-bc66-52a48fd6e363', name: '4. Best Practices', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: '7832cb0e-af8d-4066-b099-0c0525bc3bc3', name: '5. Troubleshooting & Debugging', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd07f12a5-debe-4e53-b932-3ace2f015dfd', name: '6. Case Studies & Projects', parent_id: '8a31e0ac-21d4-4705-9b69-5093c50a464d'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '246fc120-6ffc-425d-86d8-e34c402c3dd9', name: 'can', parent_id: '', existingChildren: 1, docsInFolder: 0}
index-rWgMQ1DB.js:26 [DEBUG-TREE-3] 📂 Processing child folder: {id: 'd5920de8-febf-4058-b46b-5c4475446d94', name: 'can 2', parent_id: '246fc120-6ffc-425d-86d8-e34c402c3dd9'}
index-rWgMQ1DB.js:26 [DEBUG-TREE-2] 📁 Processing folder: {id: '1ca99efd-c2a8-47de-8e2e-5a9b128399d3', name: 'PII encription', parent_id: '', existingChildren: 0, docsInFolder: 2}
index-rWgMQ1DB.js:26 [DEBUG-TREE-4] 🌳 treeData BUILT: {rootItemCount: 132, rootItems: Array(132)}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 39, totalDocs: 122, treeDataLength: 132, expandedFoldersCount: 2, …}
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folderdff": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-15T12:50:14.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hhhhh": 2 subfolders + 0 documents = 2 items, most recent: 2025-07-15T13:30:17.265Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 5 documents = 5 items, most recent: 2026-01-14T19:03:48.047Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation101ee2": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:14.882Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T19:32:55.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (8)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:57:19.718Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "ddd": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:36.208Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:26:23.159Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T23:47:31.155Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T19:25:19.330Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:56:46.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (5)": 6 subfolders + 0 documents = 6 items, most recent: 2026-01-17T19:32:55.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-17T18:54:29.374Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 4": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-17T19:32:55.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (6)": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-21T11:11:59.280Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "important lessons": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T21:13:51.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "introduction": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "world of the API": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-02T10:28:42.169Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (4)": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-04T21:34:15.563Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "what should happen": 0 subfolders + 3 documents = 3 items, most recent: 2025-08-21T12:10:37.944Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another test": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-17T07:15:16.472Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "wow": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "renaming": 2 subfolders + 2 documents = 4 items, most recent: 2025-07-24T21:23:40.667Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "TRANSLATION": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-03T10:02:51.181Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-14T13:41:50.071Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "prompts": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "class": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T15:27:29.468Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "FLASK": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-13T16:01:00.271Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fundamentals": 4 subfolders + 0 documents = 4 items, most recent: 2025-11-17T10:54:31.319Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "pipeline": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "problems": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T23:48:42.460Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "perfect": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T14:54:51.375Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "google": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-14T23:48:57.215Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "seo thing": 1 subfolders + 1 documents = 2 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "devlog": 3 subfolders + 0 documents = 3 items, most recent: 2026-01-17T14:07:21.695Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "translation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-26T17:40:41.414Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hi": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "fff": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:14:28.504Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "vvv": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T04:15:24.818Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "hello": 3 subfolders + 0 documents = 3 items, most recent: 2025-11-01T11:51:01.742Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "chatbot africawork": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-11T21:00:03.689Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new folder 222": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:25:37.144Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "planing": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-08T09:24:09.176Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (2)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T17:01:31.529Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (3)": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-27T21:54:19.336Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "now better": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T14:24:48.758Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "third one": 1 subfolders + 0 documents = 1 items, most recent: 2025-07-20T13:49:25.607Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T21:14:26.415Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder (7)": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:25.286Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "folder 1101": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-24T06:33:49.889Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "suf folder azure": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-28T08:20:39.989Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "new ui of the folder add": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:24:10.787Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "deep folder": 0 subfolders + 1 documents = 1 items, most recent: 2025-07-24T10:15:42.785Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "inspirations": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "New Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-07-31T23:14:24.791Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "another ttest": 3 subfolders + 2 documents = 5 items, most recent: 2025-08-16T16:34:43.643Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-16T16:41:23.254Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:26.073Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from API": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T15:56:06.494Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder from NPM Package": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-23T16:56:09.677Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Core Concepts": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:40:35.353Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Tutorials": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:01.416Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Examples": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:07.759Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Reference": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:14.100Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "LangGraph Documentation": 5 subfolders + 0 documents = 5 items, most recent: 2025-08-24T11:41:20.063Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder for Move": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T12:00:17.880Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "MCP Test Folder - Claude Code": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T13:21:01.051Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:20:37.296Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:29.205Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Debug Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:22:50.963Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Test Folder Suite": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:23:17.601Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-12-24T22:53:33.052Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:30.576Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Child Folder": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Parent Folder": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-24T14:58:42.301Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "API Documentation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:52.361Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "JSONL Format": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:54:50.419Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Batch Lifecycle": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:56:51.433Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "1. Fundamentals & Concepts": 3 subfolders + 0 documents = 3 items, most recent: 2025-08-26T06:25:45.292Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Python Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:57:57.807Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Monitoring & Tracking": 0 subfolders + 1 documents = 1 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "2. Implementation Guides": 2 subfolders + 0 documents = 2 items, most recent: 2025-08-25T09:58:39.132Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Array Mode Strategy": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T09:59:18.257Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Token Management": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:10:55.921Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "3. Cost Optimization": 2 subfolders + 1 documents = 3 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "4. Best Practices": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:11:40.166Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "5. Troubleshooting & Debugging": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T10:01:08.863Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Translation Pipeline Project": 0 subfolders + 0 documents = 0 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "6. Case Studies & Projects": 1 subfolders + 0 documents = 1 items, most recent: 2025-08-25T11:12:08.338Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "OpenAI Batch Mode Learning": 6 subfolders + 0 documents = 6 items, most recent: 2026-01-14T17:53:47.591Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "Azure Chatbot V3 Implementation": 0 subfolders + 0 documents = 0 items, most recent: 2026-01-16T18:38:02.421Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can 2": 1 subfolders + 3 documents = 4 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "can": 1 subfolders + 0 documents = 1 items, most recent: 2026-01-16T18:52:45.262Z
index-rWgMQ1DB.js:26 [DEBUG-FOLDER] Folder "PII encription": 0 subfolders + 2 documents = 2 items, most recent: 2026-01-16T09:01:46.351Z
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Combined: 39 folders + 93 documents = 132 total items
index-rWgMQ1DB.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-rWgMQ1DB.js:26 [DASHBOARD-DEBUG] Dashboard render, expandedEntry: undefined
index-rWgMQ1DB.js:26 [DEBUG-SIDEBAR-1] 🗂️ SidebarEnhanced RENDER: {isOpen: false, isMobile: false, isCollapsed: false, activeView: 'explorer', foldersCount: 39, …}
index-rWgMQ1DB.js:26 [DEBUG-EXPLORER-1] 📂 ExplorerView RENDER: {viewMode: 'tree', totalFolders: 39, totalDocs: 122, treeDataLength: 132, expandedFoldersCount: 2, …}
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Push starting {count: 1}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] 🔄 Status changed, updating UI: {from: {…}, to: {…}}
index-rWgMQ1DB.js:26  PATCH https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/folders?id=eq.27fb330b-1c6b-4253-a19d-344dd5b0bf2f&select=* 409 (Conflict)
(anonymous) @ index-rWgMQ1DB.js:26
i @ index-rWgMQ1DB.js:149
fetch @ index-rWgMQ1DB.js:149
(anonymous) @ index-rWgMQ1DB.js:149
(anonymous) @ index-rWgMQ1DB.js:149
await in (anonymous)
then @ index-rWgMQ1DB.js:107
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Update error for 27fb330b-1c6b-4253-a19d-344dd5b0bf2f {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_folder_name_per_parent"'}
(anonymous) @ index-rWgMQ1DB.js:26
i @ index-rWgMQ1DB.js:832
await in i
masterWrite @ index-rWgMQ1DB.js:832
await in masterWrite
(anonymous) @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
m @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
p @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
t.next @ index-rWgMQ1DB.js:829
e._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
l._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
w_ @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
e.bulkWrite @ index-rWgMQ1DB.js:832
await in e.bulkWrite
(anonymous) @ index-rWgMQ1DB.js:829
wrapCall @ index-rWgMQ1DB.js:829
e.lockedRun @ index-rWgMQ1DB.js:829
bulkWrite @ index-rWgMQ1DB.js:829
_saveData @ index-rWgMQ1DB.js:829
await in _saveData
patch @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:1450
(anonymous) @ index-rWgMQ1DB.js:1434
lo.unstable_batchedUpdates @ index-rWgMQ1DB.js:56
(anonymous) @ index-rWgMQ1DB.js:1434
handleEnd @ index-rWgMQ1DB.js:1434
r @ index-rWgMQ1DB.js:26
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Push handler error {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_folder_name_per_parent"'}
(anonymous) @ index-rWgMQ1DB.js:26
i @ index-rWgMQ1DB.js:832
await in i
masterWrite @ index-rWgMQ1DB.js:832
await in masterWrite
(anonymous) @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
m @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
p @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
t.next @ index-rWgMQ1DB.js:829
e._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
l._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
w_ @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
e.bulkWrite @ index-rWgMQ1DB.js:832
await in e.bulkWrite
(anonymous) @ index-rWgMQ1DB.js:829
wrapCall @ index-rWgMQ1DB.js:829
e.lockedRun @ index-rWgMQ1DB.js:829
bulkWrite @ index-rWgMQ1DB.js:829
_saveData @ index-rWgMQ1DB.js:829
await in _saveData
patch @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:1450
(anonymous) @ index-rWgMQ1DB.js:1434
lo.unstable_batchedUpdates @ index-rWgMQ1DB.js:56
(anonymous) @ index-rWgMQ1DB.js:1434
handleEnd @ index-rWgMQ1DB.js:1434
r @ index-rWgMQ1DB.js:26
index-rWgMQ1DB.js:26 [RxDB Replication] folders: Error RxError (RC_PUSH): 

        RxDB Error-Code: RC_PUSH.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#RC_PUSH 

--------------------
Parameters:
pushRows: [
  {
    "assumedMasterState": {
      "id": "27fb330b-1c6b-4253-a19d-344dd5b0bf2f",
      "user_id": "8eac28e6-0127-40d1-ba55-c10cbe52a32b",
      "parent_id": "",
      "name": "New Folder (2)",
      "color": "#6B7280",
      "icon": "folder",
      "is_expanded": false,
      "is_favorite": false,
      "position": 0,
      "created_at": "2025-07-17T10:18:56.162639+00:00",
      "updated_at": "2025-07-17T10:18:58.469+00:00",
      "path": "/27fb330b-1c6b-4253-a19d-344dd5b0bf2f/",
      "_modified": 1767789256613,
      "_deleted": false
    },
    "newDocumentState": {
      "id": "27fb330b-1c6b-4253-a19d-344dd5b0bf2f",
      "user_id": "8eac28e6-0127-40d1-ba55-c10cbe52a32b",
      "parent_id": "15f72910-3c3d-4d05-8a27-17698ab940bc",
      "name": "New Folder (2)",
      "color": "#6B7280",
      "icon": "folder",
      "is_expanded": false,
      "is_favorite": false,
      "position": 0,
      "created_at": "2025-07-17T10:18:56.162639+00:00",
      "updated_at": "2026-01-17T19:32:55.071Z",
      "path": "/18be740c-c477-4d3f-b299-a606838c46f2/15f72910-3c3d-4d05-8a27-17698ab940bc//New Folder (2)",
      "_modified": 1768678375071,
      "_deleted": false
    }
  }
]
errors: {"message":"duplicate key value violates unique constraint \"unique_folder_name_per_parent\"","code":"23505"}
direction: "push"

    at St (index-rWgMQ1DB.js:822:27)
    at Object.masterWrite (index-rWgMQ1DB.js:832:32353)
    at async index-rWgMQ1DB.js:829:112672
    at async Promise.all (index 0)
    at async index-rWgMQ1DB.js:829:112469
    at async index-rWgMQ1DB.js:829:111522
(anonymous) @ index-rWgMQ1DB.js:26
(anonymous) @ index-rWgMQ1DB.js:832
t.next @ index-rWgMQ1DB.js:829
e._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
w_ @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
masterWrite @ index-rWgMQ1DB.js:832
await in masterWrite
(anonymous) @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
m @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
Promise.then
p @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
t.next @ index-rWgMQ1DB.js:829
e._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
l._next @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:829
w_ @ index-rWgMQ1DB.js:829
e.next @ index-rWgMQ1DB.js:829
e.bulkWrite @ index-rWgMQ1DB.js:832
await in e.bulkWrite
(anonymous) @ index-rWgMQ1DB.js:829
wrapCall @ index-rWgMQ1DB.js:829
e.lockedRun @ index-rWgMQ1DB.js:829
bulkWrite @ index-rWgMQ1DB.js:829
_saveData @ index-rWgMQ1DB.js:829
await in _saveData
patch @ index-rWgMQ1DB.js:829
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:838
await in (anonymous)
(anonymous) @ index-rWgMQ1DB.js:1450
(anonymous) @ index-rWgMQ1DB.js:1434
lo.unstable_batchedUpdates @ index-rWgMQ1DB.js:56
(anonymous) @ index-rWgMQ1DB.js:1434
handleEnd @ index-rWgMQ1DB.js:1434
r @ index-rWgMQ1DB.js:26
index-rWgMQ1DB.js:26 FileTreeBlock memo: PREVENTED
index-rWgMQ1DB.js:26 FileTreeBlock memo: PREVENTED
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 FileTreeBlock memo: PREVENTED
index-rWgMQ1DB.js:26 FileTreeBlock memo: PREVENTED
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-GET] 📊 Status requested: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
index-rWgMQ1DB.js:26 [SYNC-STATUS-POLL] ➡️ Status unchanged: {pending: 0, syncing: true, lastSync: 1768678367557, online: true}
