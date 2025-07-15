[12:06:46.631] Running build in Washington, D.C., USA (East) – iad1
[12:06:46.632] Build machine configuration: 2 cores, 8 GB
[12:06:46.655] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 2cc76fe)
[12:06:47.216] Cloning completed: 560.000ms
[12:06:47.328] Restored build cache from previous deployment (BrpAgCHwxgp48p7QpDLfwyb4Dq2u)
[12:06:49.016] Running "vercel build"
[12:06:49.610] Vercel CLI 44.3.0
[12:06:50.188] Installing dependencies...
[12:06:52.052] 
[12:06:52.053] changed 8 packages in 2s
[12:06:52.053] 
[12:06:52.053] 70 packages are looking for funding
[12:06:52.053]   run `npm fund` for details
[12:06:52.193] 
[12:06:52.194] > journey-log-compass@0.0.0 build
[12:06:52.194] > vite build
[12:06:52.195] 
[12:06:52.517] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:06:52.911] transforming...
[12:06:53.204] [32m✓[39m 21 modules transformed.
[12:06:53.206] [31m✗[39m Build failed in 644ms
[12:06:53.206] [31merror during build:
[12:06:53.207] [31m[vite:esbuild] Transform failed with 2 errors:
[12:06:53.207] /vercel/path0/src/pages/Dashboard.jsx:1231:6: ERROR: Unexpected closing "DndContext" tag does not match opening "div" tag
[12:06:53.207] /vercel/path0/src/pages/Dashboard.jsx:1233:1: ERROR: Unexpected end of file before a closing "DndContext" tag[31m
[12:06:53.208] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1231:6[31m
[12:06:53.208] [33m
[12:06:53.208] [33mUnexpected closing "DndContext" tag does not match opening "div" tag[33m
[12:06:53.209] 1229|          onCreateProject={handleCommandPaletteCreateProject}
[12:06:53.209] 1230|        />
[12:06:53.209] 1231|      </DndContext>
[12:06:53.209]    |        ^
[12:06:53.210] 1232|    );
[12:06:53.210] 1233|  }
[12:06:53.210] 
[12:06:53.211] [33mUnexpected end of file before a closing "DndContext" tag[33m
[12:06:53.211] 1231|      </DndContext>
[12:06:53.211] 1232|    );
[12:06:53.211] 1233|  }
[12:06:53.212]    |   ^
[12:06:53.212] [31m
[12:06:53.212]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[12:06:53.213]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[12:06:53.213]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[12:06:53.213]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[12:06:53.213]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[12:06:53.214]     at Socket.emit (node:events:518:28)
[12:06:53.214]     at addChunk (node:internal/streams/readable:561:12)
[12:06:53.215]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[12:06:53.215]     at Readable.push (node:internal/streams/readable:392:5)
[12:06:53.215]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[12:06:53.247] Error: Command "npm run build" exited with 1
[12:06:53.438] 
[12:06:56.166] Exiting build container