[11:56:25.888] Running build in Washington, D.C., USA (East) – iad1
[11:56:25.889] Build machine configuration: 2 cores, 8 GB
[11:56:25.906] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 28e8e13)
[11:56:26.474] Cloning completed: 568.000ms
[11:56:26.658] Restored build cache from previous deployment (BKagjUSorkGvGURfUHSig4vL5sPz)
[11:56:28.575] Running "vercel build"
[11:56:29.084] Vercel CLI 44.4.3
[11:56:29.684] Installing dependencies...
[11:56:30.839] 
[11:56:30.839] up to date in 936ms
[11:56:30.840] 
[11:56:30.840] 70 packages are looking for funding
[11:56:30.840]   run `npm fund` for details
[11:56:30.979] 
[11:56:30.980] > journey-log-compass@0.0.0 build
[11:56:30.980] > vite build
[11:56:30.981] 
[11:56:31.304] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[11:56:31.703] transforming...
[11:56:32.324] [32m✓[39m 51 modules transformed.
[11:56:32.328] [31m✗[39m Build failed in 679ms
[11:56:32.332] [31merror during build:
[11:56:32.333] [31m[vite:esbuild] Transform failed with 1 error:
[11:56:32.333] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:1191:10: ERROR: Unterminated regular expression[31m
[11:56:32.333] file: [36m/vercel/path0/src/components/ExpandedViewEnhanced.jsx:1191:10[31m
[11:56:32.333] [33m
[11:56:32.334] [33mUnterminated regular expression[33m
[11:56:32.335] 1189|        
[11:56:32.335] 1190|        </div>
[11:56:32.335] 1191|      </div>
[11:56:32.335]    |            ^
[11:56:32.335] 1192|    );
[11:56:32.336] 1193|  }
[11:56:32.336] [31m
[11:56:32.336]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[11:56:32.336]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[11:56:32.336]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[11:56:32.337]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[11:56:32.337]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[11:56:32.337]     at Socket.emit (node:events:518:28)
[11:56:32.337]     at addChunk (node:internal/streams/readable:561:12)
[11:56:32.337]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[11:56:32.338]     at Readable.push (node:internal/streams/readable:392:5)
[11:56:32.338]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[11:56:32.395] Error: Command "npm run build" exited with 1
[11:56:32.656] 
[11:56:36.083] Exiting build container