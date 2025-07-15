[12:09:05.740] Running build in Washington, D.C., USA (East) – iad1
[12:09:05.741] Build machine configuration: 2 cores, 8 GB
[12:09:05.761] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 71548f8)
[12:09:06.359] Cloning completed: 598.000ms
[12:09:06.556] Restored build cache from previous deployment (BrpAgCHwxgp48p7QpDLfwyb4Dq2u)
[12:09:09.125] Running "vercel build"
[12:09:09.710] Vercel CLI 44.3.0
[12:09:10.463] Installing dependencies...
[12:09:12.725] 
[12:09:12.726] changed 8 packages in 2s
[12:09:12.726] 
[12:09:12.727] 70 packages are looking for funding
[12:09:12.727]   run `npm fund` for details
[12:09:12.922] 
[12:09:12.922] > journey-log-compass@0.0.0 build
[12:09:12.923] > vite build
[12:09:12.923] 
[12:09:14.045] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:09:14.538] transforming...
[12:09:14.914] [32m✓[39m 13 modules transformed.
[12:09:14.916] [31m✗[39m Build failed in 834ms
[12:09:14.917] [31merror during build:
[12:09:14.917] [31m[vite:esbuild] Transform failed with 2 errors:
[12:09:14.917] /vercel/path0/src/pages/Dashboard.jsx:1231:6: ERROR: Unexpected closing "DndContext" tag does not match opening "div" tag
[12:09:14.918] /vercel/path0/src/pages/Dashboard.jsx:1233:1: ERROR: Unexpected end of file before a closing "DndContext" tag[31m
[12:09:14.918] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1231:6[31m
[12:09:14.919] [33m
[12:09:14.919] [33mUnexpected closing "DndContext" tag does not match opening "div" tag[33m
[12:09:14.919] 1229|          onCreateProject={handleCommandPaletteCreateProject}
[12:09:14.920] 1230|        />
[12:09:14.920] 1231|      </DndContext>
[12:09:14.920]    |        ^
[12:09:14.921] 1232|    );
[12:09:14.921] 1233|  }
[12:09:14.921] 
[12:09:14.922] [33mUnexpected end of file before a closing "DndContext" tag[33m
[12:09:14.922] 1231|      </DndContext>
[12:09:14.922] 1232|    );
[12:09:14.923] 1233|  }
[12:09:14.923]    |   ^
[12:09:14.923] [31m
[12:09:14.924]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[12:09:14.924]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[12:09:14.924]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[12:09:14.925]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[12:09:14.925]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[12:09:14.925]     at Socket.emit (node:events:518:28)
[12:09:14.926]     at addChunk (node:internal/streams/readable:561:12)
[12:09:14.926]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[12:09:14.926]     at Readable.push (node:internal/streams/readable:392:5)
[12:09:14.927]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[12:09:14.968] Error: Command "npm run build" exited with 1
[12:09:15.237] 
[12:09:17.987] Exiting build container