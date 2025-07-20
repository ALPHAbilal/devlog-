[14:39:56.165] Running build in Washington, D.C., USA (East) – iad1
[14:39:56.181] Build machine configuration: 2 cores, 8 GB
[14:39:56.219] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: c8e2824)
[14:39:57.519] Cloning completed: 1.299s
[14:39:57.931] Restored build cache from previous deployment (2zFy8z8giPe3Txnw7RRbCXzLa6nh)
[14:40:00.110] Running "vercel build"
[14:40:00.572] Vercel CLI 44.4.3
[14:40:01.735] Installing dependencies...
[14:40:03.013] 
[14:40:03.014] up to date in 1s
[14:40:03.014] 
[14:40:03.015] 73 packages are looking for funding
[14:40:03.015]   run `npm fund` for details
[14:40:03.146] 
[14:40:03.146] > journey-log-compass@0.0.0 build
[14:40:03.147] > vite build
[14:40:03.147] 
[14:40:03.786] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[14:40:03.827] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[14:40:04.180] transforming...
[14:40:05.300] [32m✓[39m 117 modules transformed.
[14:40:05.302] [31m✗[39m Build failed in 1.48s
[14:40:05.305] [31merror during build:
[14:40:05.305] [31m[vite:esbuild] Transform failed with 1 error:
[14:40:05.305] /vercel/path0/src/components/ProjectExplorer/ProjectExplorer.jsx:446:10: ERROR: The symbol "findItem" has already been declared[31m
[14:40:05.305] file: [36m/vercel/path0/src/components/ProjectExplorer/ProjectExplorer.jsx:446:10[31m
[14:40:05.305] [33m
[14:40:05.306] [33mThe symbol "findItem" has already been declared[33m
[14:40:05.306] 444|      };
[14:40:05.306] 445|      
[14:40:05.306] 446|      const findItem = (items, id) => {
[14:40:05.306]    |            ^
[14:40:05.306] 447|        for (const item of items) {
[14:40:05.306] 448|          if (item.id === id) return item;
[14:40:05.306] [31m
[14:40:05.306]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[14:40:05.306]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[14:40:05.307]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[14:40:05.307]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[14:40:05.307]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[14:40:05.307]     at Socket.emit (node:events:518:28)
[14:40:05.307]     at addChunk (node:internal/streams/readable:561:12)
[14:40:05.307]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[14:40:05.307]     at Readable.push (node:internal/streams/readable:392:5)
[14:40:05.307]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[14:40:05.363] Error: Command "npm run build" exited with 1
[14:40:05.552] 
[14:40:08.215] Exiting build container