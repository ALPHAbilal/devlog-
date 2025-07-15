[12:12:32.912] Running build in Washington, D.C., USA (East) – iad1
[12:12:32.913] Build machine configuration: 2 cores, 8 GB
[12:12:33.061] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 9fa3a84)
[12:12:33.825] Cloning completed: 764.000ms
[12:12:33.988] Restored build cache from previous deployment (BrpAgCHwxgp48p7QpDLfwyb4Dq2u)
[12:12:36.445] Running "vercel build"
[12:12:37.207] Vercel CLI 44.3.0
[12:12:38.014] Installing dependencies...
[12:12:40.568] 
[12:12:40.569] changed 8 packages in 2s
[12:12:40.569] 
[12:12:40.569] 70 packages are looking for funding
[12:12:40.569]   run `npm fund` for details
[12:12:40.753] 
[12:12:40.753] > journey-log-compass@0.0.0 build
[12:12:40.754] > vite build
[12:12:40.754] 
[12:12:41.178] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:12:41.655] transforming...
[12:12:42.133] [32m✓[39m 29 modules transformed.
[12:12:42.135] [31m✗[39m Build failed in 919ms
[12:12:42.135] [31merror during build:
[12:12:42.136] [31m[vite:esbuild] Transform failed with 2 errors:
[12:12:42.136] /vercel/path0/src/pages/Dashboard.jsx:1231:6: ERROR: Unexpected closing "DndContext" tag does not match opening "div" tag
[12:12:42.137] /vercel/path0/src/pages/Dashboard.jsx:1233:1: ERROR: Unexpected end of file before a closing "DndContext" tag[31m
[12:12:42.137] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1231:6[31m
[12:12:42.137] [33m
[12:12:42.138] [33mUnexpected closing "DndContext" tag does not match opening "div" tag[33m
[12:12:42.138] 1229|          onCreateProject={handleCommandPaletteCreateProject}
[12:12:42.138] 1230|        />
[12:12:42.139] 1231|      </DndContext>
[12:12:42.139]    |        ^
[12:12:42.139] 1232|    );
[12:12:42.140] 1233|  }
[12:12:42.140] 
[12:12:42.140] [33mUnexpected end of file before a closing "DndContext" tag[33m
[12:12:42.141] 1231|      </DndContext>
[12:12:42.141] 1232|    );
[12:12:42.141] 1233|  }
[12:12:42.142]    |   ^
[12:12:42.142] [31m
[12:12:42.142]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[12:12:42.143]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[12:12:42.143]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[12:12:42.143]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[12:12:42.144]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[12:12:42.144]     at Socket.emit (node:events:518:28)
[12:12:42.145]     at addChunk (node:internal/streams/readable:561:12)
[12:12:42.145]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[12:12:42.146]     at Readable.push (node:internal/streams/readable:392:5)
[12:12:42.146]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[12:12:42.187] Error: Command "npm run build" exited with 1
[12:12:43.354] 
[12:12:46.490] Exiting build container