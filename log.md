index-BFhvjkaI.js:26 [DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized: {defaultTimeout_ms: 259200000, defaultTimeout_hours: 72, defaultTimeout_days: 3, timestamp: '2026-01-07T19:25:37.410Z'}
index-BFhvjkaI.js:26 IndexedDB initialized successfully
index-BFhvjkaI.js:26 [TAB-RESTORE] {tabCount: 0, activeTabId: undefined, tabIds: Array(0)}
index-BFhvjkaI.js:26 [DEBUG-TIMEOUT-15] ℹ️ No localStorage settings found, using defaults
index-BFhvjkaI.js:26 [DatabaseProvider] Initializing RxDB...
index-BFhvjkaI.js:26 [RxDB] Schema version changed, clearing old data...
index-BFhvjkaI.js:26 [RxDB] Clearing all databases...
index-BFhvjkaI.js:26 [DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED: {events: Array(4), timeout_hours: 72, timestamp: '2026-01-07T19:25:37.480Z'}
index-BFhvjkaI.js:26 [Supabase] Auth event: INITIAL_SESSION
index-BFhvjkaI.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: false, userId: undefined}
index-BFhvjkaI.js:26 [RxDB] removeRxDatabase: 

        RxDB Error-Code: DXE1.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#DXE1 

--------------------
Parameters:
field: "updated_at"
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
      "updated_at",
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

index-BFhvjkaI.js:26 [RxDB] Cleanup complete
index-BFhvjkaI.js:26 [RxDB] Creating database...
index-BFhvjkaI.js:26 -------------- RxDB Open Core RxStorage -------------------------------
You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie 
While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.
For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.
 https://rxdb.info/premium/?console=dexie 
If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.
---------------------------------------------------------------------
(anonymous) @ index-BFhvjkaI.js:26
e.bulkWrite @ index-BFhvjkaI.js:831
await in e.bulkWrite
(anonymous) @ index-BFhvjkaI.js:829
wrapCall @ index-BFhvjkaI.js:829
e.lockedRun @ index-BFhvjkaI.js:829
bulkWrite @ index-BFhvjkaI.js:829
TEe @ index-BFhvjkaI.js:829
t @ index-BFhvjkaI.js:829
(anonymous) @ index-BFhvjkaI.js:829
await in (anonymous)
KEe @ index-BFhvjkaI.js:829
zz @ index-BFhvjkaI.js:832
(anonymous) @ index-BFhvjkaI.js:832
await in (anonymous)
UCe @ index-BFhvjkaI.js:832
(anonymous) @ index-BFhvjkaI.js:832
(anonymous) @ index-BFhvjkaI.js:832
Zy @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
ZB @ index-BFhvjkaI.js:106
(anonymous) @ index-BFhvjkaI.js:106
V @ index-BFhvjkaI.js:91
index-BFhvjkaI.js:26 [RxDB] Init failed: DXE1
(anonymous) @ index-BFhvjkaI.js:26
(anonymous) @ index-BFhvjkaI.js:832
await in (anonymous)
UCe @ index-BFhvjkaI.js:832
(anonymous) @ index-BFhvjkaI.js:832
(anonymous) @ index-BFhvjkaI.js:832
Zy @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
ZB @ index-BFhvjkaI.js:106
(anonymous) @ index-BFhvjkaI.js:106
V @ index-BFhvjkaI.js:91
index-BFhvjkaI.js:26 [RxDB] Clearing and retrying...
index-BFhvjkaI.js:26 [RxDB] Clearing all databases...
index-BFhvjkaI.js:26 [RxDB] removeRxDatabase: 

        RxDB Error-Code: DXE1.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#DXE1 

--------------------
Parameters:
field: "updated_at"
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
      "updated_at",
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

index-BFhvjkaI.js:26 [RxDB] Cleanup complete
index-BFhvjkaI.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-BFhvjkaI.js:26 [RxDB] Creating database...
index-BFhvjkaI.js:26 [DatabaseProvider] Failed to initialize RxDB: RxError (DB8): 

        RxDB Error-Code: DB8.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#DB8 

--------------------
Parameters:
name: "devlog-rxdb-v6"
storage: "dexie"
link: "https://rxdb.info/rx-database.html#ignoreduplicate"

    at Dt (index-BFhvjkaI.js:822:27)
    at WEe (index-BFhvjkaI.js:829:99017)
    at index-BFhvjkaI.js:829:100126
    at KEe (index-BFhvjkaI.js:829:100411)
    at zz (index-BFhvjkaI.js:832:11455)
    at index-BFhvjkaI.js:832:12116
    at async index-BFhvjkaI.js:832:28521
(anonymous) @ index-BFhvjkaI.js:26
(anonymous) @ index-BFhvjkaI.js:832
await in (anonymous)
(anonymous) @ index-BFhvjkaI.js:832
Zy @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
vl @ index-BFhvjkaI.js:106
DB @ index-BFhvjkaI.js:106
ZB @ index-BFhvjkaI.js:106
(anonymous) @ index-BFhvjkaI.js:106
V @ index-BFhvjkaI.js:91
