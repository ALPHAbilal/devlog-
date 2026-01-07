Database initialization failed: RxDB Error-Code: DB6. Hint: Error messages are not included in RxDB core to reduce build size. To show the full error messages and to ensure that you do not make any mistakes when using RxDB, use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error Find out more about this error here: https://rxdb.info/errors.html?console=errors#DB6 -------------------- Parameters: database: "devlog-rxdb" collection: "documents" previousSchemaHash: "e726ddf02a75808c56c65d1cbc65ecb546c84345606cf2153a53df9618c55e99" schemaHash: "9724dc7c14e25339ca7b78bd0a4b56d163a1fadf1f6882eedc781b52482837d8" previousSchema: { "additionalProperties": false, "encrypted": [], "indexes": [ [ "_deleted", "user_id", "id" ], [ "_deleted", "folder_id", "id" ], [ "_deleted", "updated_at", "id" ], [ "_deleted", "_modified", "id" ], [ "_meta.lwt", "id" ] ], "keyCompression": false, "primaryKey": "id", "properties": { "_attachments": { "type": "object" }, "_deleted": { "type": "boolean" }, "_meta": { "additionalProperties": true, "properties": { "lwt": { "maximum": 1000000000000000, "minimum": 1, "multipleOf": 0.01, "type": "number" } }, "required": [ "lwt" ], "type": "object" }, "_modified": { "type": "number" }, "_rev": { "minLength": 1, "type": "string" }, "created_at": { "type": "string" }, "doc_position": { "default": 0, "type": "number" }, "folder_id": { "type": [ "string", "null" ] }, "id": { "maxLength": 36, "type": "string" }, "metadata": { "default": {}, "type": "object" }, "tags": { "default": [], "items": { "type": "string" }, "type": "array" }, "title": { "type": "string" }, "updated_at": { "type": "string" }, "user_id": { "maxLength": 36, "type": "string" } }, "required": [ "id", "user_id", "title", "_deleted", "_rev", "_meta", "_attachments" ], "type": "object", "version": 0 } schema: { "version": 0, "primaryKey": "id", "type": "object", "properties": { "id": { "type": "string", "maxLength": 36 }, "user_id": { "type": "string", "maxLength": 36 }, "title": { "type": "string" }, "folder_id": { "type": [ "string", "null" ] }, "tags": { "type": "array", "items": { "type": "string" }, "default": [] }, "metadata": { "type": "object", "default": {} }, "doc_position": { "type": "number", "default": 0 }, "created_at": { "type": "string" }, "updated_at": { "type": "string" }, "_modified": { "type": "number" }, "_deleted": { "type": "boolean", "default": false } }, "required": [ "id", "user_id", "title" ], "indexes": [ "user_id", "updated_at", "_modified" ] }



---------------
index-B1JPsqs-.js:26 [DEBUG-TIMEOUT-1] 🔧 OptimizedSupabaseClient initialized: {defaultTimeout_ms: 259200000, defaultTimeout_hours: 72, defaultTimeout_days: 3, timestamp: '2026-01-07T12:54:51.564Z'}
index-B1JPsqs-.js:26 IndexedDB initialized successfully
index-B1JPsqs-.js:26 [TAB-RESTORE] {tabCount: 0, activeTabId: undefined, tabIds: Array(0)}
index-B1JPsqs-.js:26 [DEBUG-TIMEOUT-15] ℹ️ No localStorage settings found, using defaults
index-B1JPsqs-.js:26 [DatabaseProvider] Initializing RxDB...
index-B1JPsqs-.js:26 [RxDB] Creating database...
index-B1JPsqs-.js:26 -------------- RxDB Open Core RxStorage -------------------------------
You are using the free Dexie.js based RxStorage implementation from RxDB https://rxdb.info/rx-storage-dexie.html?console=dexie 
While this is a great option, we want to let you know that there are faster storage solutions available in our premium plugins.
For professional users and production environments, we highly recommend considering these premium options to enhance performance and reliability.
 https://rxdb.info/premium/?console=dexie 
If you already purchased premium access you can disable this log by calling the setPremiumFlag() function from rxdb-premium/plugins/shared.
---------------------------------------------------------------------
(anonymous) @ index-B1JPsqs-.js:26
e.bulkWrite @ index-B1JPsqs-.js:831
await in e.bulkWrite
(anonymous) @ index-B1JPsqs-.js:829
wrapCall @ index-B1JPsqs-.js:829
e.lockedRun @ index-B1JPsqs-.js:829
bulkWrite @ index-B1JPsqs-.js:829
yEe @ index-B1JPsqs-.js:829
t @ index-B1JPsqs-.js:829
(anonymous) @ index-B1JPsqs-.js:829
await in (anonymous)
LEe @ index-B1JPsqs-.js:829
OCe @ index-B1JPsqs-.js:832
(anonymous) @ index-B1JPsqs-.js:832
(anonymous) @ index-B1JPsqs-.js:832
Qy @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
YB @ index-B1JPsqs-.js:106
(anonymous) @ index-B1JPsqs-.js:106
V @ index-B1JPsqs-.js:91
index-B1JPsqs-.js:26 [DEBUG-TIMEOUT-6] 👀 Activity monitoring ENABLED: {events: Array(4), timeout_hours: 72, timestamp: '2026-01-07T12:54:51.742Z'}
index-B1JPsqs-.js:26 [DatabaseProvider] Failed to initialize RxDB: RxError (DB6): 

        RxDB Error-Code: DB6.
        Hint: Error messages are not included in RxDB core to reduce build size.
        To show the full error messages and to ensure that you do not make any mistakes when using RxDB,
        use the dev-mode plugin when you are in development mode: https://rxdb.info/dev-mode.html?console=error
        
Find out more about this error here: https://rxdb.info/errors.html?console=errors#DB6 

--------------------
Parameters:
database: "devlog-rxdb"
collection: "documents"
previousSchemaHash: "e726ddf02a75808c56c65d1cbc65ecb546c84345606cf2153a53df9618c55e99"
schemaHash: "9724dc7c14e25339ca7b78bd0a4b56d163a1fadf1f6882eedc781b52482837d8"
previousSchema: {
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
schema: {
  "version": 0,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 36
    },
    "user_id": {
      "type": "string",
      "maxLength": 36
    },
    "title": {
      "type": "string"
    },
    "folder_id": {
      "type": [
        "string",
        "null"
      ]
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "default": []
    },
    "metadata": {
      "type": "object",
      "default": {}
    },
    "doc_position": {
      "type": "number",
      "default": 0
    },
    "created_at": {
      "type": "string"
    },
    "updated_at": {
      "type": "string"
    },
    "_modified": {
      "type": "number"
    },
    "_deleted": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [
    "id",
    "user_id",
    "title"
  ],
  "indexes": [
    "user_id",
    "updated_at",
    "_modified"
  ]
}

    at Dt (index-B1JPsqs-.js:822:27)
    at index-B1JPsqs-.js:829:97290
    at async Promise.all (/index 0)
    at async e.addCollections (index-B1JPsqs-.js:829:97093)
    at async OCe (index-B1JPsqs-.js:832:10853)
    at async index-B1JPsqs-.js:832:27380
(anonymous) @ index-B1JPsqs-.js:26
(anonymous) @ index-B1JPsqs-.js:832
await in (anonymous)
(anonymous) @ index-B1JPsqs-.js:832
Qy @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
vl @ index-B1JPsqs-.js:106
TB @ index-B1JPsqs-.js:106
YB @ index-B1JPsqs-.js:106
(anonymous) @ index-B1JPsqs-.js:106
V @ index-B1JPsqs-.js:91
index-B1JPsqs-.js:26 [Supabase] Auth event: INITIAL_SESSION
index-B1JPsqs-.js:26 [AuthContext] Auth state change received: INITIAL_SESSION {mounted: true, hasSession: false, userId: undefined}
index-B1JPsqs-.js:26 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://www.devlog.design/', …}
index-B1JPsqs-.js:26 [DEBUG-TIMEOUT-7] 🖱️ User activity detected: {activityCount: 1, lastEvent: 'mousedown', timerWillReset: true, timestamp: '2026-01-07T12:54:52.846Z'}
index-B1JPsqs-.js:26 [DEBUG-TIMEOUT-4] 🔄 Inactivity timer RESET: {timeout_ms: 259200000, timeout_hours: 72, willExpireAt: '2026-01-10T12:54:52.847Z', timestamp: '2026-01-07T12:54:52.847Z'}
