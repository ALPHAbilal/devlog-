[11:58:50.145] Running build in Washington, D.C., USA (East) – iad1
[11:58:50.146] Build machine configuration: 2 cores, 8 GB
[11:58:50.222] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 4baed1a)
[11:58:51.121] Cloning completed: 899.000ms
[11:58:51.312] Restored build cache from previous deployment (BrpAgCHwxgp48p7QpDLfwyb4Dq2u)
[11:58:54.530] Running "vercel build"
[11:58:55.444] Vercel CLI 44.3.0
[11:58:56.513] Installing dependencies...
[11:58:59.820] 
[11:58:59.820] changed 8 packages in 3s
[11:58:59.822] 
[11:58:59.822] 70 packages are looking for funding
[11:58:59.823]   run `npm fund` for details
[11:59:00.036] 
[11:59:00.037] > journey-log-compass@0.0.0 build
[11:59:00.037] > vite build
[11:59:00.038] 
[11:59:00.533] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[11:59:01.080] transforming...
[11:59:01.624] [32m✓[39m 31 modules transformed.
[11:59:01.626] [31m✗[39m Build failed in 1.05s
[11:59:01.627] [31merror during build:
[11:59:01.628] [31m[vite:esbuild] Transform failed with 2 errors:
[11:59:01.628] /vercel/path0/src/pages/Dashboard.jsx:1231:6: ERROR: Unexpected closing "DndContext" tag does not match opening "div" tag
[11:59:01.628] /vercel/path0/src/pages/Dashboard.jsx:1233:1: ERROR: Unexpected end of file before a closing "DndContext" tag[31m
[11:59:01.628] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1231:6[31m
[11:59:01.629] [33m
[11:59:01.629] [33mUnexpected closing "DndContext" tag does not match opening "div" tag[33m
[11:59:01.629] 1229|        />
[11:59:01.629] 1230|      </div>
[11:59:01.630] 1231|      </DndContext>
[11:59:01.630]    |        ^
[11:59:01.630] 1232|    );
[11:59:01.631] 1233|  }
[11:59:01.631] 
[11:59:01.631] [33mUnexpected end of file before a closing "DndContext" tag[33m
[11:59:01.631] 1231|      </DndContext>
[11:59:01.632] 1232|    );
[11:59:01.632] 1233|  }
[11:59:01.632]    |   ^
[11:59:01.632] [31m
[11:59:01.632]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[11:59:01.633]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[11:59:01.633]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[11:59:01.633]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[11:59:01.633]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[11:59:01.634]     at Socket.emit (node:events:518:28)
[11:59:01.634]     at addChunk (node:internal/streams/readable:561:12)
[11:59:01.634]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[11:59:01.635]     at Readable.push (node:internal/streams/readable:392:5)
[11:59:01.635]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[11:59:01.704] Error: Command "npm run build" exited with 1
[11:59:02.102] 
[11:59:05.653] Exiting build container