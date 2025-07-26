[10:21:04.154] Running build in Washington, D.C., USA (East) – iad1
[10:21:04.154] Build machine configuration: 2 cores, 8 GB
[10:21:04.171] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 329f237)
[10:21:04.832] Cloning completed: 661.000ms
[10:21:04.996] Restored build cache from previous deployment (BzHXkW9DWcm7MjqJzbu8ZhRbiYyq)
[10:21:07.309] Running "vercel build"
[10:21:07.771] Vercel CLI 44.5.0
[10:21:08.426] Installing dependencies...
[10:21:09.693] 
[10:21:09.694] up to date in 1s
[10:21:09.695] 
[10:21:09.696] 75 packages are looking for funding
[10:21:09.696]   run `npm fund` for details
[10:21:09.832] 
[10:21:09.832] > journey-log-compass@0.0.0 build
[10:21:09.833] > vite build
[10:21:09.833] 
[10:21:10.452] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[10:21:10.490] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[10:21:10.827] transforming...
[10:21:14.302] [32m✓[39m 2032 modules transformed.
[10:21:14.305] [31m✗[39m Build failed in 3.82s
[10:21:14.306] [31merror during build:
[10:21:14.306] [31m[vite:esbuild] Transform failed with 1 error:
[10:21:14.306] /vercel/path0/src/components/blocks/VersionTrackBlock.jsx:752:10: ERROR: The symbol "branchLanes" has already been declared[31m
[10:21:14.306] file: [36m/vercel/path0/src/components/blocks/VersionTrackBlock.jsx:752:10[31m
[10:21:14.307] [33m
[10:21:14.307] [33mThe symbol "branchLanes" has already been declared[33m
[10:21:14.307] 750|      
[10:21:14.308] 751|      // Draw branch labels aligned with their lanes
[10:21:14.308] 752|      const branchLanes = {};
[10:21:14.308]    |            ^
[10:21:14.308] 753|      Object.values(repository.versions).forEach(version => {
[10:21:14.309] 754|        const branch = version.branch || 'main';
[10:21:14.309] [31m
[10:21:14.309]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[10:21:14.310]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[10:21:14.310]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[10:21:14.310]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[10:21:14.311]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[10:21:14.311]     at Socket.emit (node:events:518:28)
[10:21:14.311]     at addChunk (node:internal/streams/readable:561:12)
[10:21:14.312]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[10:21:14.312]     at Readable.push (node:internal/streams/readable:392:5)
[10:21:14.312]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[10:21:14.368] Error: Command "npm run build" exited with 1
[10:21:14.822] 
[10:21:17.753] Exiting build container