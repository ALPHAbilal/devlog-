Database initialization failed: RxDB Error-Code: DXE1. Hint: Error messages are not included in RxDB core to reduce build size. To show the full error messages and to ensure that you do not make any mistakes when using RxDB, use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error Find out more about this error here: https://rxdb.info/errors.html?console=errors#DXE1 -------------------- Parameters: field: "folder_id" schema: { "additionalProperties": false, "encrypted": [], "indexes": [ [ "_deleted", "user_id", "id" ], [ "_deleted", "folder_id", "id" ], [ "_deleted", "updated_at", "id" ], [ "_deleted", "_modified", "id" ], [ "_meta.lwt", "id" ] ], "keyCompression": false, "primaryKey": "id", "properties": { "_attachments": { "type": "object" }, "_deleted": { "type": "boolean" }, "_meta": { "additionalProperties": true, "properties": { "lwt": { "maximum": 1000000000000000, "minimum": 1, "multipleOf": 0.01, "type": "number" } }, "required": [ "lwt" ], "type": "object" }, "_modified": { "type": "number" }, "_rev": { "minLength": 1, "type": "string" }, "created_at": { "type": "string" }, "doc_position": { "default": 0, "type": "number" }, "folder_id": { "type": [ "string", "null" ] }, "id": { "maxLength": 36, "type": "string" }, "metadata": { "default": {}, "type": "object" }, "tags": { "default": [], "items": { "type": "string" }, "type": "array" }, "title": { "type": "string" }, "updated_at": { "type": "string" }, "user_id": { "maxLength": 36, "type": "string" } }, "required": [ "id", "user_id", "title", "_deleted", "_rev", "_meta", "_attachments" ], "type": "object", "version": 0 }




---------------
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized: {defaultTimeout_ms: 259200000, defaultTimeout_hours: 72, defaultTimeout_days: 3, timestamp: '2026-01-07T12:49:48.569Z'}
index-D3CFB_c6.js:26 IndexedDB initialized successfully
index-D3CFB_c6.js:26 [TAB-RESTORE] {tabCount: 0, activeTabId: undefined, tabIds: Array(0)}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-15] ℹ️ No localStorage settings found, using defaults
index-D3CFB_c6.js:26 [DatabaseProvider] Initializing RxDB...
index-D3CFB_c6.js:26 [RxDB] Creating database...
index-D3CFB_c6.js:26 -------------- RxDB Open Core RxStorage -------------------------------
You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie 
While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.
For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.
 https://rxdb.info/premium/?console=dexie 
If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.
---------------------------------------------------------------------
(anonymous) @ index-D3CFB_c6.js:26
e.bulkWrite @ index-D3CFB_c6.js:831
await in e.bulkWrite
(anonymous) @ index-D3CFB_c6.js:829
wrapCall @ index-D3CFB_c6.js:829
e.lockedRun @ index-D3CFB_c6.js:829
bulkWrite @ index-D3CFB_c6.js:829
yEe @ index-D3CFB_c6.js:829
t @ index-D3CFB_c6.js:829
(anonymous) @ index-D3CFB_c6.js:829
await in (anonymous)
LEe @ index-D3CFB_c6.js:829
OCe @ index-D3CFB_c6.js:832
(anonymous) @ index-D3CFB_c6.js:832
(anonymous) @ index-D3CFB_c6.js:832
Qy @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
YB @ index-D3CFB_c6.js:106
(anonymous) @ index-D3CFB_c6.js:106
V @ index-D3CFB_c6.js:91
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED: {events: Array(4), timeout_hours: 72, timestamp: '2026-01-07T12:49:48.784Z'}
index-D3CFB_c6.js:26 [Supabase] Auth event: INITIAL_SESSION
index-D3CFB_c6.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: false, userId: undefined}
index-D3CFB_c6.js:26 [DatabaseProvider] Failed to initialize RxDB: RxError (DXE1): 

        RxDB Error-Code: DXE1.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#DXE1 

--------------------
Parameters:
field: "folder_id"
schema: {
  "additionalProperties": false,
  "encrypted": [],
  "indexes": [
    [
      "_deleted",
      "user_id",
      "id"
    ],
    [
      "_deleted",
      "folder_id",
      "id"
    ],
    [
      "_deleted",
      "updated_at",
      "id"
    ],
    [
      "_deleted",
      "_modified",
      "id"
    ],
    [
      "_meta.lwt",
      "id"
    ]
  ],
  "keyCompression": false,
  "primaryKey": "id",
  "properties": {
    "_attachments": {
      "type": "object"
    },
    "_deleted": {
      "type": "boolean"
    },
    "_meta": {
      "additionalProperties": true,
      "properties": {
        "lwt": {
          "maximum": 1000000000000000,
          "minimum": 1,
          "multipleOf": 0.01,
          "type": "number"
        }
      },
      "required": [
        "lwt"
      ],
      "type": "object"
    },
    "_modified": {
      "type": "number"
    },
    "_rev": {
      "minLength": 1,
      "type": "string"
    },
    "created_at": {
      "type": "string"
    },
    "doc_position": {
      "default": 0,
      "type": "number"
    },
    "folder_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "id": {
      "maxLength": 36,
      "type": "string"
    },
    "metadata": {
      "default": {},
      "type": "object"
    },
    "tags": {
      "default": [],
      "items": {
        "type": "string"
      },
      "type": "array"
    },
    "title": {
      "type": "string"
    },
    "updated_at": {
      "type": "string"
    },
    "user_id": {
      "maxLength": 36,
      "type": "string"
    }
  },
  "required": [
    "id",
    "user_id",
    "title",
    "_deleted",
    "_rev",
    "_meta",
    "_attachments"
  ],
  "type": "object",
  "version": 0
}

    at Dt (index-D3CFB_c6.js:822:27)
    at index-D3CFB_c6.js:832:3279
    at Array.forEach (<anonymous>)
    at e.createStorageInstance (index-D3CFB_c6.js:832:3207)
    at wEe (index-D3CFB_c6.js:829:79098)
    at OEe (index-D3CFB_c6.js:829:92338)
    at index-D3CFB_c6.js:829:97525
    at Array.map (<anonymous>)
    at e.addCollections (index-D3CFB_c6.js:829:97492)
    at async OCe (index-D3CFB_c6.js:832:10877)
    at async index-D3CFB_c6.js:832:27404
(anonymous) @ index-D3CFB_c6.js:26
(anonymous) @ index-D3CFB_c6.js:832
await in (anonymous)
(anonymous) @ index-D3CFB_c6.js:832
Qy @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
vl @ index-D3CFB_c6.js:106
TB @ index-D3CFB_c6.js:106
YB @ index-D3CFB_c6.js:106
(anonymous) @ index-D3CFB_c6.js:106
V @ index-D3CFB_c6.js:91
index-D3CFB_c6.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-7] 🖱️ User activity detected: {activityCount: 1, lastEvent: 'mousedown', timerWillReset: true, timestamp: '2026-01-07T12:49:53.871Z'}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 259200000, timeout_hours: 72, willExpireAt: '2026-01-10T12:49:53.872Z', timestamp: '2026-01-07T12:49:53.872Z'}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 259200000, timeout_hours: 72, willExpireAt: '2026-01-10T12:49:57.601Z', timestamp: '2026-01-07T12:49:57.602Z'}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 259200000, timeout_hours: 72, willExpireAt: '2026-01-10T12:49:57.809Z', timestamp: '2026-01-07T12:49:57.809Z'}
index-D3CFB_c6.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 259200000, timeout_hours: 72, willExpireAt: '2026-01-10T12:50:24.516Z', timestamp: '2026-01-07T12:50:24.516Z'}
