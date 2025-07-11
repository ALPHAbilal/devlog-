[08:33:54.687] Running build in Washington, D.C., USA (East) – iad1
[08:33:54.687] Build machine configuration: 2 cores, 8 GB
[08:33:54.703] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 093ba91)
[08:33:55.246] Cloning completed: 543.000ms
[08:33:55.427] Restored build cache from previous deployment (3ZXqRW3EgYd4f1hYHE25bgedM56r)
[08:33:55.796] Running "vercel build"
[08:33:56.407] Vercel CLI 44.3.0
[08:33:57.100] Installing dependencies...
[08:33:58.537] 
[08:33:58.538] up to date in 918ms
[08:33:58.539] 
[08:33:58.539] 63 packages are looking for funding
[08:33:58.540]   run `npm fund` for details
[08:33:58.683] 
[08:33:58.684] > journey-log-compass@0.0.0 build
[08:33:58.684] > vite build
[08:33:58.685] 
[08:33:59.025] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[08:33:59.428] transforming...
[08:34:01.929] [32m✓[39m 1682 modules transformed.
[08:34:01.931] [31m✗[39m Build failed in 2.87s
[08:34:01.931] [31merror during build:
[08:34:01.932] [31m[vite:define] Transform failed with 1 error:
[08:34:01.932] /vercel/path0/src/utils/storage/SupabaseAdapter.js:374:12: ERROR: The symbol "blocks" has already been declared[31m
[08:34:01.932] file: [36m/vercel/path0/src/utils/storage/SupabaseAdapter.js[31m
[08:34:01.932]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[08:34:01.932]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[08:34:01.932]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[08:34:01.932]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[08:34:01.932]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[08:34:01.932]     at Socket.emit (node:events:518:28)
[08:34:01.932]     at addChunk (node:internal/streams/readable:561:12)
[08:34:01.933]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[08:34:01.933]     at Readable.push (node:internal/streams/readable:392:5)
[08:34:01.933]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[08:34:01.980] Error: Command "npm run build" exited with 1
[08:34:02.311] 
[08:34:05.394] Exiting build container