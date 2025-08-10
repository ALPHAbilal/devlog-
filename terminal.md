chrome give the option to create multiple distinct profiles

in one browser:

sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
sw.js:120 Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
    at networkFirst (sw.js:120:13)
index-moWC13E8.js:26 Using optimized Supabase client
index-moWC13E8.js:26 Global auto-save manager initialized with defensive wrappers
index-moWC13E8.js:26 SW registered: ServiceWorkerRegistration
index-moWC13E8.js:26 Starting auto-save with interval: 1 seconds
index-moWC13E8.js:26 IndexedDB initialized successfully
index-moWC13E8.js:26 [Supabase] Auth event: INITIAL_SESSION
index-moWC13E8.js:26 [AuthContext] Auth state change received: INITIAL_SESSION Object
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms
[Violation] 'requestAnimationFrame' handler took <N>ms


in another profile in the same browser : 
index-moWC13E8.js:26 Using optimized Supabase client
index-moWC13E8.js:26 Global auto-save manager initialized with defensive wrappers
index-moWC13E8.js:26 SW registered: ServiceWorkerRegistration
index-moWC13E8.js:26 Starting auto-save with interval: 1 seconds
index-moWC13E8.js:26 IndexedDB initialized successfully
index-moWC13E8.js:26 Persistent storage granted
index-moWC13E8.js:26 [Supabase] Restored existing session: f85ac5b4-344e-4f78-b6c5-974e73b2fe44
index-moWC13E8.js:26 Dashboard: Starting to load entries...
index-moWC13E8.js:26 [Supabase] Auth event: INITIAL_SESSION
index-moWC13E8.js:26 [AuthContext] Auth state change received: INITIAL_SESSION Object
index-moWC13E8.js:26 Using Supabase for storage
index-moWC13E8.js:26 SupabaseAdapter: Init with provided userId f85ac5b4-344e-4f78-b6c5-974e73b2fe44
index-moWC13E8.js:26 Dashboard: Storage initialized (45ms)
index-moWC13E8.js:26 SupabaseAdapter: getDocuments called
index-moWC13E8.js:26 SupabaseAdapter: Querying documents for user f85ac5b4-344e-4f78-b6c5-974e73b2fe44
index-moWC13E8.js:26 SupabaseAdapter: Documents query completed in 481ms
index-moWC13E8.js:26 SupabaseAdapter: No documents found, returning empty array
index-moWC13E8.js:26 Dashboard: Loaded 0 entries (490ms)
index-moWC13E8.js:26 Dashboard: Total load time: 537ms
index-moWC13E8.js:26 SupabaseAdapter: updateAllDocuments called with 1 documents
index-moWC13E8.js:26 SupabaseAdapter: Saving document 9d13bd3d-2dc2-4dff-b856-d2d384b9a904 with 4 blocks
index-moWC13E8.js:26 SupabaseAdapter: saveDocument called Object
index-moWC13E8.js:26 SupabaseAdapter: Using userId f85ac5b4-344e-4f78-b6c5-974e73b2fe44 for save
index-moWC13E8.js:26 SupabaseAdapter: Saving document to Supabase: Object
zqcjipwiznesnbgbocnu.supabase.co/rest/v1/documents?id=eq.9d13bd3d-2dc2-4dff-b856-d2d384b9a904&user_id=eq.f85ac5b4-344e-4f78-b6c5-974e73b2fe44&deleted_at=is.null&select=*:1  Failed to load resource: the server responded with a status of 406 ()
index-moWC13E8.js:26 Error saving document: Object
(anonymous) @ index-moWC13E8.js:26
index-moWC13E8.js:26 Error loading entries: Object
(anonymous) @ index-moWC13E8.js:26
index-moWC13E8.js:26 Dashboard: Setting isLoading to false
index-moWC13E8.js:26 Loading folders for user: f85ac5b4-344e-4f78-b6c5-974e73b2fe44
index-moWC13E8.js:26 VirtualizedGrid - scroll container: {"totalHeight":120,"containerHeight":790,"hasOverflow":false,"parentIsCardsContainer":true}
index-moWC13E8.js:26 VirtualizedGrid - scroll container: {"totalHeight":160,"containerHeight":790,"hasOverflow":false,"parentIsCardsContainer":true}
index-moWC13E8.js:26 Loaded 0 folders (0 root folders)
index-moWC13E8.js:26 [Supabase] Auth event: SIGNED_OUT
index-moWC13E8.js:26 [AuthContext] Auth state change received: SIGNED_OUT Object
