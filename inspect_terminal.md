sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
networkFirst @ sw.js:120
index-Cl7aejrX.js:26 Using optimized Supabase client
index-Cl7aejrX.js:26 Global auto-save manager initialized with defensive wrappers
index-Cl7aejrX.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-Cl7aejrX.js:26 IndexedDB initialized successfully
index-Cl7aejrX.js:26 Starting auto-save with interval: 1 seconds
index-Cl7aejrX.js:26 [Supabase] Restored existing session: 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-Cl7aejrX.js:26 [Supabase] Auth event: INITIAL_SESSION
index-Cl7aejrX.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: true, userId: '8eac28e6-0127-40d1-ba55-c10cbe52a32b'}
index-Cl7aejrX.js:26 Dashboard: Starting to load entries...
index-Cl7aejrX.js:26 Using Supabase for storage
index-Cl7aejrX.js:26 SupabaseAdapter: Init with provided userId 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-Cl7aejrX.js:26 Dashboard: Storage initialized (47ms)
index-Cl7aejrX.js:26 SupabaseAdapter: getDocuments called
index-Cl7aejrX.js:26 SupabaseAdapter: Querying documents for user 8eac28e6-0127-40d1-ba55-c10cbe52a32b
index-Cl7aejrX.js:26 SupabaseAdapter: Documents query completed in 413ms
index-Cl7aejrX.js:26 SupabaseAdapter: Found 59 documents
index-Cl7aejrX.js:26 SupabaseAdapter: Found 13 unsynced documents in IndexedDB
index-Cl7aejrX.js:26 SupabaseAdapter: Total documents after merge: 66
index-Cl7aejrX.js:26 SupabaseAdapter: Returning 66 documents
index-Cl7aejrX.js:26 Dashboard: Loaded 66 entries (439ms)
index-Cl7aejrX.js:26 Dashboard: Total load time: 490ms
index-Cl7aejrX.js:26 SupabaseAdapter: Getting projects...
index-Cl7aejrX.js:26 SupabaseAdapter: Found 3 projects
index-Cl7aejrX.js:26 Dashboard: Loaded 3 projects
index-Cl7aejrX.js:26 Dashboard: Setting isLoading to false
index-Cl7aejrX.js:26 VirtualizedGrid - scroll container: {"totalHeight":8700,"containerHeight":755,"hasOverflow":true,"parentIsCardsContainer":true}
index-Cl7aejrX.js:26 VirtualizedGrid - scroll container: {"totalHeight":5132,"containerHeight":755,"hasOverflow":true,"parentIsCardsContainer":true}
index-Cl7aejrX.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cl7aejrX.js:26 PaginatedBlockLoader: Loading page 0 (offset: 0, limit: 50) for document a68df8fd-e369-4d40-802e-537a7931eb08
index-Cl7aejrX.js:26 PaginatedBlockLoader: Loaded 4 blocks for page 0 of document a68df8fd-e369-4d40-802e-537a7931eb08
index-Cl7aejrX.js:26 ExpandedView: Initial load period complete, enabling saves
/dashboard:1 [DOM] Password field is not contained in a form: (More info: https://goo.gl/9p2vKq) <input placeholder=​"Enter password" class=​"w-48 px-3 py-1.5 bg-dark-lighter border border-gray-700 
                                 rounded-lg focus:​border-blue-500 focus:​outline-none" type=​"password" value>​
index-Cl7aejrX.js:26  GET https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/document_shares?select=*&document_id=eq.a68df8fd-e369-4d40-802e-537a7931eb08&is_active=eq.true&order=created_at.desc 500 (Internal Server Error)
(anonymous) @ index-Cl7aejrX.js:26
(anonymous) @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
d @ index-Cl7aejrX.js:112
Promise.then
h @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
MF @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
then @ index-Cl7aejrX.js:107
index-Cl7aejrX.js:26 {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'} {context: 'getDocumentShares', documentId: 'a68df8fd-e369-4d40-802e-537a7931eb08'}
(anonymous) @ index-Cl7aejrX.js:26
Zr @ index-Cl7aejrX.js:114
getDocumentShares @ index-Cl7aejrX.js:1019
await in getDocumentShares
D @ index-Cl7aejrX.js:1046
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
gf @ index-Cl7aejrX.js:106
_1 @ index-Cl7aejrX.js:106
b1 @ index-Cl7aejrX.js:106
h1 @ index-Cl7aejrX.js:106
f1 @ index-Cl7aejrX.js:106
D1 @ index-Cl7aejrX.js:106
Nc @ index-Cl7aejrX.js:106
N1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
index-Cl7aejrX.js:26 Failed to load shares: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'}
(anonymous) @ index-Cl7aejrX.js:26
D @ index-Cl7aejrX.js:1046
await in D
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
gf @ index-Cl7aejrX.js:106
_1 @ index-Cl7aejrX.js:106
b1 @ index-Cl7aejrX.js:106
h1 @ index-Cl7aejrX.js:106
f1 @ index-Cl7aejrX.js:106
D1 @ index-Cl7aejrX.js:106
Nc @ index-Cl7aejrX.js:106
N1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
/dashboard:1 [DOM] Password field is not contained in a form: (More info: https://goo.gl/9p2vKq) <input placeholder=​"Enter password" class=​"w-48 px-3 py-1.5 bg-dark-lighter border border-gray-700 
                                 rounded-lg focus:​border-blue-500 focus:​outline-none" type=​"password" value>​
index-Cl7aejrX.js:26  POST https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/rpc/create_document_share 400 (Bad Request)
(anonymous) @ index-Cl7aejrX.js:26
(anonymous) @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
d @ index-Cl7aejrX.js:112
Promise.then
h @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
MF @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
then @ index-Cl7aejrX.js:107
index-Cl7aejrX.js:26 {code: '42702', details: 'It could refer to either a PL/pgSQL variable or a table column.', hint: null, message: 'column reference "share_code" is ambiguous'} {context: 'createShare', documentId: 'a68df8fd-e369-4d40-802e-537a7931eb08'}
(anonymous) @ index-Cl7aejrX.js:26
Zr @ index-Cl7aejrX.js:114
createShare @ index-Cl7aejrX.js:1019
await in createShare
M @ index-Cl7aejrX.js:1046
O1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
Fb @ index-Cl7aejrX.js:106
Xg @ index-Cl7aejrX.js:106
cy @ index-Cl7aejrX.js:107
X5 @ index-Cl7aejrX.js:107
s @ index-Cl7aejrX.js:26
index-Cl7aejrX.js:26 Share creation failed: {code: '42702', details: 'It could refer to either a PL/pgSQL variable or a table column.', hint: null, message: 'column reference "share_code" is ambiguous'}
(anonymous) @ index-Cl7aejrX.js:26
M @ index-Cl7aejrX.js:1046
await in M
O1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
Fb @ index-Cl7aejrX.js:106
Xg @ index-Cl7aejrX.js:106
cy @ index-Cl7aejrX.js:107
X5 @ index-Cl7aejrX.js:107
s @ index-Cl7aejrX.js:26
index-Cl7aejrX.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cl7aejrX.js:26  GET https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/document_shares?select=*&document_id=eq.a68df8fd-e369-4d40-802e-537a7931eb08&is_active=eq.true&order=created_at.desc 500 (Internal Server Error)
(anonymous) @ index-Cl7aejrX.js:26
(anonymous) @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
d @ index-Cl7aejrX.js:112
Promise.then
h @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
MF @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
then @ index-Cl7aejrX.js:107
index-Cl7aejrX.js:26 {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'} {context: 'getDocumentShares', documentId: 'a68df8fd-e369-4d40-802e-537a7931eb08'}
(anonymous) @ index-Cl7aejrX.js:26
Zr @ index-Cl7aejrX.js:114
getDocumentShares @ index-Cl7aejrX.js:1019
await in getDocumentShares
D @ index-Cl7aejrX.js:1046
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
F @ index-Cl7aejrX.js:91
index-Cl7aejrX.js:26 Failed to load shares: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'}
(anonymous) @ index-Cl7aejrX.js:26
D @ index-Cl7aejrX.js:1046
await in D
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
F @ index-Cl7aejrX.js:91
index-Cl7aejrX.js:26 Dashboard: Showing ExpandedView instead of grid
index-Cl7aejrX.js:26  GET https://zqcjipwiznesnbgbocnu.supabase.co/rest/v1/document_shares?select=*&document_id=eq.a68df8fd-e369-4d40-802e-537a7931eb08&is_active=eq.true&order=created_at.desc 500 (Internal Server Error)
(anonymous) @ index-Cl7aejrX.js:26
(anonymous) @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
d @ index-Cl7aejrX.js:112
Promise.then
h @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
MF @ index-Cl7aejrX.js:112
(anonymous) @ index-Cl7aejrX.js:112
then @ index-Cl7aejrX.js:107
index-Cl7aejrX.js:26 {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'} {context: 'getDocumentShares', documentId: 'a68df8fd-e369-4d40-802e-537a7931eb08'}
(anonymous) @ index-Cl7aejrX.js:26
Zr @ index-Cl7aejrX.js:114
getDocumentShares @ index-Cl7aejrX.js:1019
await in getDocumentShares
D @ index-Cl7aejrX.js:1046
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
F @ index-Cl7aejrX.js:91
index-Cl7aejrX.js:26 Failed to load shares: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "document_shares"'}
(anonymous) @ index-Cl7aejrX.js:26
D @ index-Cl7aejrX.js:1046
await in D
(anonymous) @ index-Cl7aejrX.js:1046
wc @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
br @ index-Cl7aejrX.js:106
a1 @ index-Cl7aejrX.js:106
k1 @ index-Cl7aejrX.js:106
(anonymous) @ index-Cl7aejrX.js:106
F @ index-Cl7aejrX.js:91
