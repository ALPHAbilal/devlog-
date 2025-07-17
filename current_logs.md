[09:35:53.141] Running build in Washington, D.C., USA (East) – iad1
[09:35:53.141] Build machine configuration: 2 cores, 8 GB
[09:35:53.158] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: b45982b)
[09:35:53.863] Cloning completed: 704.000ms
[09:35:54.454] Restored build cache from previous deployment (6Zk9bk1RxL2tuEgkhG161xge9YfE)
[09:35:57.061] Running "vercel build"
[09:35:57.531] Vercel CLI 44.3.0
[09:35:58.393] Installing dependencies...
[09:35:59.588] 
[09:35:59.589] up to date in 898ms
[09:35:59.589] 
[09:35:59.589] 70 packages are looking for funding
[09:35:59.590]   run `npm fund` for details
[09:35:59.735] 
[09:35:59.736] > journey-log-compass@0.0.0 build
[09:35:59.736] > vite build
[09:35:59.736] 
[09:36:00.109] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[09:36:00.505] transforming...
[09:36:04.221] [32m✓[39m 1709 modules transformed.
[09:36:04.223] [31m✗[39m Build failed in 3.91s
[09:36:04.223] [31merror during build:
[09:36:04.223] [31m[vite:define] Transform failed with 1 error:
[09:36:04.224] /vercel/path0/src/utils/storage/SupabaseAdapter.js:456:10: ERROR: The symbol "isNewDocument" has already been declared[31m
[09:36:04.224] file: [36m/vercel/path0/src/utils/storage/SupabaseAdapter.js[31m
[09:36:04.224]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[09:36:04.225]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[09:36:04.225]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[09:36:04.225]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[09:36:04.226]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[09:36:04.226]     at Socket.emit (node:events:518:28)
[09:36:04.226]     at addChunk (node:internal/streams/readable:561:12)
[09:36:04.226]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[09:36:04.227]     at Readable.push (node:internal/streams/readable:392:5)
[09:36:04.227]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[09:36:04.274] Error: Command "npm run build" exited with 1
[09:36:04.813] 
[09:36:08.532] Exiting build container