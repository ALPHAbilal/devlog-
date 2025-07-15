[13:02:30.041] Running build in Washington, D.C., USA (East) – iad1
[13:02:30.041] Build machine configuration: 2 cores, 8 GB
[13:02:30.058] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 64e297f)
[13:02:30.691] Cloning completed: 632.000ms
[13:02:30.839] Restored build cache from previous deployment (6KhBLxrxkbULHVRZGBubpPMmFyw9)
[13:02:32.855] Running "vercel build"
[13:02:33.384] Vercel CLI 44.3.0
[13:02:34.039] Installing dependencies...
[13:02:36.267] 
[13:02:36.267] changed 8 packages in 2s
[13:02:36.268] 
[13:02:36.268] 70 packages are looking for funding
[13:02:36.268]   run `npm fund` for details
[13:02:36.422] 
[13:02:36.422] > journey-log-compass@0.0.0 build
[13:02:36.422] > vite build
[13:02:36.422] 
[13:02:36.753] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[13:02:37.138] transforming...
[13:02:37.472] [32m✓[39m 26 modules transformed.
[13:02:37.474] [31m✗[39m Build failed in 375ms
[13:02:37.474] [31merror during build:
[13:02:37.475] [31m[vite:esbuild] Transform failed with 2 errors:
[13:02:37.475] /vercel/path0/src/pages/Dashboard.jsx:1232:6: ERROR: Unexpected closing "DndContext" tag does not match opening "div" tag
[13:02:37.476] /vercel/path0/src/pages/Dashboard.jsx:1233:6: ERROR: Unexpected closing "div" tag does not match opening "DndContext" tag[31m
[13:02:37.476] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1232:6[31m
[13:02:37.476] [33m
[13:02:37.476] [33mUnexpected closing "DndContext" tag does not match opening "div" tag[33m
[13:02:37.477] 1230|          onCreateProject={handleCommandPaletteCreateProject}
[13:02:37.477] 1231|        />
[13:02:37.477] 1232|      </DndContext>
[13:02:37.478]    |        ^
[13:02:37.478] 1233|      </div>
[13:02:37.478] 1234|    );
[13:02:37.479] 
[13:02:37.479] [33mUnexpected closing "div" tag does not match opening "DndContext" tag[33m
[13:02:37.479] 1231|        />
[13:02:37.479] 1232|      </DndContext>
[13:02:37.480] 1233|      </div>
[13:02:37.480]    |        ^
[13:02:37.480] 1234|    );
[13:02:37.480] 1235|  }
[13:02:37.481] [31m
[13:02:37.481]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[13:02:37.481]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[13:02:37.482]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[13:02:37.482]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[13:02:37.482]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[13:02:37.483]     at Socket.emit (node:events:518:28)
[13:02:37.483]     at addChunk (node:internal/streams/readable:561:12)
[13:02:37.483]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[13:02:37.484]     at Readable.push (node:internal/streams/readable:392:5)
[13:02:37.484]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[13:02:37.520] Error: Command "npm run build" exited with 1
[13:02:37.693] 
[13:02:40.534] Exiting build container