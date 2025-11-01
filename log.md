index-CrfHtEdh.js:26 Using optimized Supabase client
index-CrfHtEdh.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-CrfHtEdh.js:26 IndexedDB initialized successfully
index-CrfHtEdh.js:26 [Supabase] Restored existing session: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-CrfHtEdh.js:26 [Supabase] Auth event: INITIAL_SESSION
index-CrfHtEdh.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf'}
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 0, filtered: 0, folders: 0, documents: 0}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 0, totalRootDocuments: 0, combinedTotal: 0}
index-CrfHtEdh.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-CrfHtEdh.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Waiting for documents to load: 0
index-CrfHtEdh.js:26 [DEBUG-INIT] Dashboard mounted, user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf paginatedDocs: 0
index-CrfHtEdh.js:26 [DEBUG-INIT] Triggering loadInitial()
index-CrfHtEdh.js:26 usePaginatedDashboard: loadInitial() CALLED {userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf', loadingRef: false, pageSize: 50, orderBy: 'updated_at'}
index-CrfHtEdh.js:26 usePaginatedDashboard: Calling loadDocumentsPaginated with page 0
index-CrfHtEdh.js:26 Using Supabase for storage
index-CrfHtEdh.js:26 Loaded 2 folders (1 root folders)
index-CrfHtEdh.js:26 usePaginatedDashboard: Got result: {documentCount: 3, totalCount: 3, hasMore: false}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 0, combinedTotal: 1}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Combined: 0 folders + 3 documents = 3 total items
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 3, filtered: 3, folders: 0, documents: 3}
index-CrfHtEdh.js:26 Loaded 2 folders (1 root folders)
index-CrfHtEdh.js:26 [DEBUG-FOLDER] Folder "hello": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:12:13.088Z
index-CrfHtEdh.js:26 [DEBUG-FOLDER] Folder "hi": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T05:12:13.088Z
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Combined: 1 folders + 3 documents = 4 total items
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 4, filtered: 4, folders: 1, documents: 3}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Creating nested folder in parent: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Starting folder creation...
index-CrfHtEdh.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/folders?select=* 409 (Conflict)
(anonymous) @ index-CrfHtEdh.js:26
i @ index-CrfHtEdh.js:116
fetch @ index-CrfHtEdh.js:116
(anonymous) @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
u @ index-CrfHtEdh.js:114
Promise.then
h @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
$9 @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
then @ index-CrfHtEdh.js:107
index-CrfHtEdh.js:26 Error creating folder: {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_folder_name_per_parent"'}
(anonymous) @ index-CrfHtEdh.js:26
(anonymous) @ index-CrfHtEdh.js:1190
await in (anonymous)
B @ index-CrfHtEdh.js:1203
L @ index-CrfHtEdh.js:1203
onClick @ index-CrfHtEdh.js:1203
ck @ index-CrfHtEdh.js:106
(anonymous) @ index-CrfHtEdh.js:106
Qi @ index-CrfHtEdh.js:106
U0 @ index-CrfHtEdh.js:106
Q0 @ index-CrfHtEdh.js:107
s5 @ index-CrfHtEdh.js:107
r @ index-CrfHtEdh.js:26
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder creation failed or returned null
(anonymous) @ index-CrfHtEdh.js:26
B @ index-CrfHtEdh.js:1203
await in B
L @ index-CrfHtEdh.js:1203
onClick @ index-CrfHtEdh.js:1203
ck @ index-CrfHtEdh.js:106
(anonymous) @ index-CrfHtEdh.js:106
Qi @ index-CrfHtEdh.js:106
U0 @ index-CrfHtEdh.js:106
Q0 @ index-CrfHtEdh.js:107
s5 @ index-CrfHtEdh.js:107
r @ index-CrfHtEdh.js:26
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Creating nested folder in parent: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Starting folder creation...
index-CrfHtEdh.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder created successfully: 8cc65d89-dff7-4a53-8e8d-001d8c50d4fd
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-CrfHtEdh.js:26 Loaded 3 folders (1 root folders)
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Creating document in folder: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-CrfHtEdh.js:26 New document saved to IndexedDB immediately
index-CrfHtEdh.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/documents?on_conflict=id&columns=%22id%22%2C%22title%22%2C%22preview%22%2C%22blocks%22%2C%22tags%22%2C%22folder_id%22%2C%22createdAt%22%2C%22updatedAt%22%2C%22metadata%22%2C%22updated_at%22 400 (Bad Request)
(anonymous) @ index-CrfHtEdh.js:26
i @ index-CrfHtEdh.js:116
fetch @ index-CrfHtEdh.js:116
(anonymous) @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
u @ index-CrfHtEdh.js:114
Promise.then
h @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
$9 @ index-CrfHtEdh.js:114
(anonymous) @ index-CrfHtEdh.js:114
then @ index-CrfHtEdh.js:107
setTimeout
(anonymous) @ index-CrfHtEdh.js:29
(anonymous) @ index-CrfHtEdh.js:999
saveDocument @ index-CrfHtEdh.js:999
saveDocument @ index-CrfHtEdh.js:999
Bte @ index-CrfHtEdh.js:999
await in Bte
(anonymous) @ index-CrfHtEdh.js:1282
await in (anonymous)
onDocumentSelect @ index-CrfHtEdh.js:1306
F @ index-CrfHtEdh.js:1203
L @ index-CrfHtEdh.js:1203
onClick @ index-CrfHtEdh.js:1203
ck @ index-CrfHtEdh.js:106
(anonymous) @ index-CrfHtEdh.js:106
Qi @ index-CrfHtEdh.js:106
U0 @ index-CrfHtEdh.js:106
Q0 @ index-CrfHtEdh.js:107
s5 @ index-CrfHtEdh.js:107
r @ index-CrfHtEdh.js:26
index-CrfHtEdh.js:26 Error saving new document: {message: "Could not find the 'blocks' column of 'documents' in the schema cache", code: 'PGRST204', details: null, hint: null, status: undefined}
(anonymous) @ index-CrfHtEdh.js:26
(anonymous) @ index-CrfHtEdh.js:1282
await in (anonymous)
onDocumentSelect @ index-CrfHtEdh.js:1306
F @ index-CrfHtEdh.js:1203
L @ index-CrfHtEdh.js:1203
onClick @ index-CrfHtEdh.js:1203
ck @ index-CrfHtEdh.js:106
(anonymous) @ index-CrfHtEdh.js:106
Qi @ index-CrfHtEdh.js:106
U0 @ index-CrfHtEdh.js:106
Q0 @ index-CrfHtEdh.js:107
s5 @ index-CrfHtEdh.js:107
r @ index-CrfHtEdh.js:26
index-CrfHtEdh.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 5, filtered: 5, folders: 1, documents: 3}
index-CrfHtEdh.js:26 Dashboard: Showing ExpandedView instead of grid
index-CrfHtEdh.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-CrfHtEdh.js:26 SessionCache: Cached 1 blocks for document 9971b700-f675-4045-8f83-ce76262198c9
index-CrfHtEdh.js:26 SmartSync: IndexedDB initialized
index-CrfHtEdh.js:26 📝 TextBlock 41393cf6-76ca-4bb4-99e9-3582361d4fa6 rendered at 2025-11-01T05:30:21.359Z
index-CrfHtEdh.js:26 [BLOCK] Component mounted/updated: {blockId: '41393cf6-76ca-4bb4-99e9-3582361d4fa6', blockType: 'text', hasOnMoveUp: true, hasOnMoveDown: true, canMoveUp: false, …}
index-CrfHtEdh.js:26 ExpandedView: Initial load period complete, enabling saves
index-CrfHtEdh.js:26 Dashboard: Showing ExpandedView instead of grid
