index-BDFt4XxE.js:26 Using optimized Supabase client
index-BDFt4XxE.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-BDFt4XxE.js:26 IndexedDB initialized successfully
index-BDFt4XxE.js:26 [Supabase] Restored existing session: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-BDFt4XxE.js:26 [Supabase] Auth event: INITIAL_SESSION
index-BDFt4XxE.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf'}
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 0, filtered: 0, folders: 0, documents: 0}
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 0, totalRootDocuments: 0, combinedTotal: 0}
index-BDFt4XxE.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-BDFt4XxE.js:26 Loading folders for user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Waiting for documents to load: 0
index-BDFt4XxE.js:26 [DEBUG-INIT] Dashboard mounted, user: 6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf paginatedDocs: 0
index-BDFt4XxE.js:26 [DEBUG-INIT] Triggering loadInitial()
index-BDFt4XxE.js:26 usePaginatedDashboard: loadInitial() CALLED {userId: '6c2cacf6-0ec9-40e4-b8aa-170984d1c7bf', loadingRef: false, pageSize: 50, orderBy: 'updated_at'}
index-BDFt4XxE.js:26 usePaginatedDashboard: Calling loadDocumentsPaginated with page 0
index-BDFt4XxE.js:26 Using Supabase for storage
index-BDFt4XxE.js:26 Loaded 2 folders (1 root folders)
index-BDFt4XxE.js:26 usePaginatedDashboard: Got result: {documentCount: 3, totalCount: 3, hasMore: false}
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 0, combinedTotal: 1}
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Folder tree built: {totalFolders: 1, totalRootDocuments: 3, combinedTotal: 4}
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Combined: 0 folders + 3 documents = 3 total items
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 3, filtered: 3, folders: 0, documents: 3}
index-BDFt4XxE.js:26 Loaded 2 folders (1 root folders)
index-BDFt4XxE.js:26 [DEBUG-FOLDER] Folder "hello": 0 subfolders + 0 documents = 0 items, most recent: 2025-11-01T05:12:13.088Z
index-BDFt4XxE.js:26 [DEBUG-FOLDER] Folder "hi": 1 subfolders + 0 documents = 1 items, most recent: 2025-11-01T05:12:13.088Z
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Combined: 1 folders + 3 documents = 4 total items
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Sorted by recent action - first 3 items: (3) [{…}, {…}, {…}]
index-BDFt4XxE.js:26 [DEBUG-DASHBOARD] Filtered results: {totalEntries: 4, filtered: 4, folders: 1, documents: 3}
index-BDFt4XxE.js:26 🔎 BlockSerializer.deserialize INPUT: {id: '0f8499e6-9278-43d4-a36b-f2ed8209a2ae', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-BDFt4XxE.js:26 🔎 BlockSerializer.deserialize INPUT: {id: 'd5c43b3b-2b6d-49cf-b8c2-5a8b7622d425', type: 'text', hasContent: true, contentType: 'string', contentLength: 0, …}
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Creating nested folder in parent: 8359d69f-afc5-47b4-b650-66b3f2d0d69d
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Starting folder creation...
index-BDFt4XxE.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/folders?select=* 409 (Conflict)
(anonymous) @ index-BDFt4XxE.js:26
i @ index-BDFt4XxE.js:116
fetch @ index-BDFt4XxE.js:116
(anonymous) @ index-BDFt4XxE.js:114
(anonymous) @ index-BDFt4XxE.js:114
u @ index-BDFt4XxE.js:114
Promise.then
h @ index-BDFt4XxE.js:114
(anonymous) @ index-BDFt4XxE.js:114
$9 @ index-BDFt4XxE.js:114
(anonymous) @ index-BDFt4XxE.js:114
then @ index-BDFt4XxE.js:107
index-BDFt4XxE.js:26 Error creating folder: {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "unique_folder_name_per_parent"'}
(anonymous) @ index-BDFt4XxE.js:26
(anonymous) @ index-BDFt4XxE.js:1190
await in (anonymous)
B @ index-BDFt4XxE.js:1203
L @ index-BDFt4XxE.js:1203
onClick @ index-BDFt4XxE.js:1203
ck @ index-BDFt4XxE.js:106
(anonymous) @ index-BDFt4XxE.js:106
Qi @ index-BDFt4XxE.js:106
U0 @ index-BDFt4XxE.js:106
Q0 @ index-BDFt4XxE.js:107
s5 @ index-BDFt4XxE.js:107
r @ index-BDFt4XxE.js:26
index-BDFt4XxE.js:26 [DEBUG-SIDEBAR] Folder creation failed or returned null
(anonymous) @ index-BDFt4XxE.js:26
B @ index-BDFt4XxE.js:1203
await in B
L @ index-BDFt4XxE.js:1203
onClick @ index-BDFt4XxE.js:1203
ck @ index-BDFt4XxE.js:106
(anonymous) @ index-BDFt4XxE.js:106
Qi @ index-BDFt4XxE.js:106
U0 @ index-BDFt4XxE.js:106
Q0 @ index-BDFt4XxE.js:107
s5 @ index-BDFt4XxE.js:107
r @ index-BDFt4XxE.js:26
