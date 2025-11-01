index-Cv875uyd.js:26 Using optimized Supabase client
index-Cv875uyd.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-Cv875uyd.js:26 IndexedDB initialized successfully
index-Cv875uyd.js:26 [Supabase] Restored existing session: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-Cv875uyd.js:26 [Supabase] Auth event: INITIAL_SESSION
index-Cv875uyd.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf'}
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 0, filtered: 0, folders: 0, documents: 0}
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 0, totalRootDocuments: 0, combinedTotal: 0}
index-Cv875uyd.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-Cv875uyd.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Waiting for documents to load: 0
index-Cv875uyd.js:26 [DEBUG-INIT] Dashboard mounted, user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf paginatedDocs: 0
index-Cv875uyd.js:26 [DEBUG-INIT] Triggering loadInitial()
index-Cv875uyd.js:26 usePaginatedDashboard: loadInitial() CALLED {userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf', loadingRef: false, pageSize: 50, orderBy: 'updated_at'}
index-Cv875uyd.js:26 usePaginatedDashboard: Calling loadDocumentsPaginated with page 0
index-Cv875uyd.js:26 Using Supabase for storage
index-Cv875uyd.js:26 usePaginatedDashboard: Got result: {documentCount: 3, totalCount: 3, hasMore: false}
index-Cv875uyd.js:26 Loaded 3 folders (1 root folders)
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 0, combinedTotal: 1}
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Combined: 0 folders + 3 documents = 3 total items
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 3, filtered: 3, folders: 0, documents: 3}
index-Cv875uyd.js:26 Loaded 3 folders (1 root folders)
index-Cv875uyd.js:26 [DEBUG-FOLDER] Folder "hello": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:12:13.088Z
index-Cv875uyd.js:26 [DEBUG-FOLDER] Folder "new": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:29:56.257Z
index-Cv875uyd.js:26 [DEBUG-FOLDER] Folder "hi": 2 subfolders + 0 documents = 2 items, most recent: 2025-11-01T05:29:56.257Z
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Combined: 1 folders + 3 documents = 4 total items
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 4, filtered: 4, folders: 1, documents: 3}
index-Cv875uyd.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-Cv875uyd.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Creating nested folder in parent: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Starting folder creation...
index-Cv875uyd.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/folders?select=* 409 (Conflict)
(anonymous) @ index-Cv875uyd.js:26
i @ index-Cv875uyd.js:116
fetch @ index-Cv875uyd.js:116
(anonymous) @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
u @ index-Cv875uyd.js:114
Promise.then
h @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
$9 @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
then @ index-Cv875uyd.js:107
index-Cv875uyd.js:26 Error creating folder: {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_folder_name_per_parent"'}
(anonymous) @ index-Cv875uyd.js:26
(anonymous) @ index-Cv875uyd.js:1190
await in (anonymous)
B @ index-Cv875uyd.js:1203
L @ index-Cv875uyd.js:1203
onClick @ index-Cv875uyd.js:1203
ck @ index-Cv875uyd.js:106
(anonymous) @ index-Cv875uyd.js:106
Qi @ index-Cv875uyd.js:106
U0 @ index-Cv875uyd.js:106
Q0 @ index-Cv875uyd.js:107
s5 @ index-Cv875uyd.js:107
r @ index-Cv875uyd.js:26
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder creation failed or returned null
(anonymous) @ index-Cv875uyd.js:26
B @ index-Cv875uyd.js:1203
await in B
L @ index-Cv875uyd.js:1203
onClick @ index-Cv875uyd.js:1203
ck @ index-Cv875uyd.js:106
(anonymous) @ index-Cv875uyd.js:106
Qi @ index-Cv875uyd.js:106
U0 @ index-Cv875uyd.js:106
Q0 @ index-Cv875uyd.js:107
s5 @ index-Cv875uyd.js:107
r @ index-Cv875uyd.js:26
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Creating nested folder in parent: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Starting folder creation...
index-Cv875uyd.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder created successfully: a354c578-d9cc-4b4e-a5d2-1f9b593a534e
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-Cv875uyd.js:26 Loaded 4 folders (1 root folders)
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-Cv875uyd.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-Cv875uyd.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Creating document in folder: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-Cv875uyd.js:26 New document saved to IndexedDB immediately
index-Cv875uyd.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/documents?on_conflict=id&columns=%22id%22%2C%22title%22%2C%22preview%22%2C%22tags%22%2C%22folder_id%22%2C%22createdAt%22%2C%22updatedAt%22%2C%22metadata%22%2C%22updated_at%22 400 (Bad Request)
(anonymous) @ index-Cv875uyd.js:26
i @ index-Cv875uyd.js:116
fetch @ index-Cv875uyd.js:116
(anonymous) @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
u @ index-Cv875uyd.js:114
Promise.then
h @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
$9 @ index-Cv875uyd.js:114
(anonymous) @ index-Cv875uyd.js:114
then @ index-Cv875uyd.js:107
setTimeout
(anonymous) @ index-Cv875uyd.js:29
(anonymous) @ index-Cv875uyd.js:999
saveDocument @ index-Cv875uyd.js:999
saveDocument @ index-Cv875uyd.js:999
Bte @ index-Cv875uyd.js:999
await in Bte
(anonymous) @ index-Cv875uyd.js:1282
await in (anonymous)
onDocumentSelect @ index-Cv875uyd.js:1306
F @ index-Cv875uyd.js:1203
L @ index-Cv875uyd.js:1203
onClick @ index-Cv875uyd.js:1203
ck @ index-Cv875uyd.js:106
(anonymous) @ index-Cv875uyd.js:106
Qi @ index-Cv875uyd.js:106
U0 @ index-Cv875uyd.js:106
Q0 @ index-Cv875uyd.js:107
s5 @ index-Cv875uyd.js:107
r @ index-Cv875uyd.js:26
index-Cv875uyd.js:26 Error saving new document: {message: "Could not find the 'createdAt' column of 'documents' in the schema cache", code: 'PGRST204', details: null, hint: null, status: undefined}
(anonymous) @ index-Cv875uyd.js:26
(anonymous) @ index-Cv875uyd.js:1282
await in (anonymous)
onDocumentSelect @ index-Cv875uyd.js:1306
F @ index-Cv875uyd.js:1203
L @ index-Cv875uyd.js:1203
onClick @ index-Cv875uyd.js:1203
ck @ index-Cv875uyd.js:106
(anonymous) @ index-Cv875uyd.js:106
Qi @ index-Cv875uyd.js:106
U0 @ index-Cv875uyd.js:106
Q0 @ index-Cv875uyd.js:107
s5 @ index-Cv875uyd.js:107
r @ index-Cv875uyd.js:26
index-Cv875uyd.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 5, filtered: 5, folders: 1, documents: 3}
index-Cv875uyd.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cv875uyd.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-Cv875uyd.js:26 SessionCache: Cached 1 blocks for document 8508f093-4fe5-45ff-9520-24941c1b5356
index-Cv875uyd.js:26 SmartSync: IndexedDB initialized
index-Cv875uyd.js:26 [INLINE-ACTION] Props received: {blockId: '642c528d-6510-4df0-bf84-3391eb6ede27', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, canMoveDown: false, …}
index-Cv875uyd.js:26 📝 TextBlock 642c528d-6510-4df0-bf84-3391eb6ede27 rendered at 2025-11-01T11:52:59.517Z
index-Cv875uyd.js:26 [BLOCK] Component mounted/updated: {blockId: '642c528d-6510-4df0-bf84-3391eb6ede27', blockType: 'text', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, …}
index-Cv875uyd.js:26 [INLINE-ACTION] Props received: {blockId: '642c528d-6510-4df0-bf84-3391eb6ede27', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, canMoveDown: false, …}
index-Cv875uyd.js:26 [INLINE-ACTION] Props received: {blockId: '642c528d-6510-4df0-bf84-3391eb6ede27', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, canMoveDown: false, …}
index-Cv875uyd.js:26 [INLINE-ACTION] Props received: {blockId: '642c528d-6510-4df0-bf84-3391eb6ede27', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, canMoveDown: false, …}
index-Cv875uyd.js:26 ExpandedView: Initial load period complete, enabling saves
index-Cv875uyd.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cv875uyd.js:26 [Supabase] Auth event: SIGNED_IN
index-Cv875uyd.js:26 [AuthContext] Auth state change received: SIGNED_IN {mounted: true, hasSession: true, userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf'}
index-Cv875uyd.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cv875uyd.js:26 Dashboard: Showing ExpandedView instead of grid
