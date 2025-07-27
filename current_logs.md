[22:13:01.687] Running build in Washington, D.C., USA (East) – iad1
[22:13:01.687] Build machine configuration: 2 cores, 8 GB
[22:13:01.726] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: c3ff514)
[22:13:02.462] Cloning completed: 735.000ms
[22:13:02.657] Restored build cache from previous deployment (8LYMTiuhNkNpUqcdGtYx2pF6YDdq)
[22:13:04.564] Running "vercel build"
[22:13:05.111] Vercel CLI 44.5.0
[22:13:05.703] Installing dependencies...
[22:13:06.774] 
[22:13:06.775] up to date in 807ms
[22:13:06.776] 
[22:13:06.776] 75 packages are looking for funding
[22:13:06.776]   run `npm fund` for details
[22:13:07.112] 
[22:13:07.112] > journey-log-compass@0.0.0 build
[22:13:07.113] > vite build
[22:13:07.114] 
[22:13:07.775] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[22:13:07.819] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[22:13:08.175] transforming...
[22:13:09.206] [32m✓[39m 105 modules transformed.
[22:13:09.208] [31m✗[39m Build failed in 1.39s
[22:13:09.208] [31merror during build:
[22:13:09.209] [31m[vite:define] Transform failed with 1 error:
[22:13:09.209] /vercel/path0/src/lib/supabaseOptimized.js:407:8: ERROR: The symbol "now" has already been declared[31m
[22:13:09.209] file: [36m/vercel/path0/src/lib/supabaseOptimized.js[31m
[22:13:09.210]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[22:13:09.210]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[22:13:09.210]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[22:13:09.211]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[22:13:09.211]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[22:13:09.212]     at Socket.emit (node:events:518:28)
[22:13:09.212]     at addChunk (node:internal/streams/readable:561:12)
[22:13:09.212]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[22:13:09.213]     at Readable.push (node:internal/streams/readable:392:5)
[22:13:09.213]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[22:13:09.260] Error: Command "npm run build" exited with 1
[22:13:09.473] 
[22:13:12.300] Exiting build container