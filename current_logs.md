[14:41:35.422] Running build in Washington, D.C., USA (East) – iad1
[14:41:35.422] Build machine configuration: 2 cores, 8 GB
[14:41:35.453] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 9944b94)
[14:41:36.459] Cloning completed: 1.006s
[14:41:36.588] Restored build cache from previous deployment (HHHT33STg3VtU8eVAiugEh9FWWc7)
[14:41:38.478] Running "vercel build"
[14:41:38.945] Vercel CLI 44.4.3
[14:41:39.538] Installing dependencies...
[14:41:40.718] 
[14:41:40.719] up to date in 940ms
[14:41:40.719] 
[14:41:40.720] 70 packages are looking for funding
[14:41:40.720]   run `npm fund` for details
[14:41:40.857] 
[14:41:40.858] > journey-log-compass@0.0.0 build
[14:41:40.858] > vite build
[14:41:40.859] 
[14:41:41.224] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[14:41:41.623] transforming...
[14:41:41.954] [32m✓[39m 22 modules transformed.
[14:41:41.956] [31m✗[39m Build failed in 388ms
[14:41:41.956] [31merror during build:
[14:41:41.957] [31m[vite:esbuild] Transform failed with 2 errors:
[14:41:41.957] /vercel/path0/src/pages/Dashboard.jsx:1374:6: ERROR: Unexpected closing "div" tag does not match opening "DndContext" tag
[14:41:41.957] /vercel/path0/src/pages/Dashboard.jsx:1375:17: ERROR: Unterminated regular expression[31m
[14:41:41.957] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1374:6[31m
[14:41:41.958] [33m
[14:41:41.958] [33mUnexpected closing "div" tag does not match opening "DndContext" tag[33m
[14:41:41.958] 1372|          onCreateProject={handleCommandPaletteCreateProject}
[14:41:41.958] 1373|        />
[14:41:41.958] 1374|      </div>
[14:41:41.959]    |        ^
[14:41:41.959] 1375|      </DndContext>
[14:41:41.959] 1376|    );
[14:41:41.959] 
[14:41:41.959] [33mUnterminated regular expression[33m
[14:41:41.960] 1373|        />
[14:41:41.960] 1374|      </div>
[14:41:41.960] 1375|      </DndContext>
[14:41:41.960]    |                   ^
[14:41:41.960] 1376|    );
[14:41:41.972] 1377|  }
[14:41:41.972] [31m
[14:41:41.973]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[14:41:41.973]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[14:41:41.973]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[14:41:41.973]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[14:41:41.973]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[14:41:41.974]     at Socket.emit (node:events:518:28)
[14:41:41.974]     at addChunk (node:internal/streams/readable:561:12)
[14:41:41.974]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[14:41:41.975]     at Readable.push (node:internal/streams/readable:392:5)
[14:41:41.975]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[14:41:42.028] Error: Command "npm run build" exited with 1
[14:41:42.215] 
[14:41:44.975] Exiting build container