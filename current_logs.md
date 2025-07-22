[21:55:37.955] Running build in Washington, D.C., USA (East) – iad1
[21:55:37.955] Build machine configuration: 2 cores, 8 GB
[21:55:37.973] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: e43069a)
[21:55:38.566] Cloning completed: 592.000ms
[21:55:39.149] Restored build cache from previous deployment (Gh5fxPueUDhJ78gteV6h1qNVPt8Y)
[21:55:39.646] Running "vercel build"
[21:55:40.566] Vercel CLI 44.5.0
[21:55:41.908] Installing dependencies...
[21:55:43.343] 
[21:55:43.344] up to date in 1s
[21:55:43.345] 
[21:55:43.345] 75 packages are looking for funding
[21:55:43.345]   run `npm fund` for details
[21:55:43.485] 
[21:55:43.486] > journey-log-compass@0.0.0 build
[21:55:43.487] > vite build
[21:55:43.487] 
[21:55:45.485] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[21:55:45.528] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[21:55:45.881] transforming...
[21:55:50.156] [32m✓[39m 2302 modules transformed.
[21:55:50.166] [31m✗[39m Build failed in 4.64s
[21:55:50.168] [31merror during build:
[21:55:50.168] [31m[vite:esbuild] Transform failed with 1 error:
[21:55:50.169] /vercel/path0/src/components/blocks/VersionTrackBlock.jsx:1385:4: ERROR: Expected ")" but found "{"[31m
[21:55:50.169] file: [36m/vercel/path0/src/components/blocks/VersionTrackBlock.jsx:1385:4[31m
[21:55:50.169] [33m
[21:55:50.169] [33mExpected ")" but found "{"[33m
[21:55:50.170] 1383|      </div>
[21:55:50.170] 1384|      
[21:55:50.170] 1385|      {/* Context Menu */}
[21:55:50.171]    |      ^
[21:55:50.171] 1386|      {contextMenu && (
[21:55:50.171] 1387|        <ContextMenu
[21:55:50.171] [31m
[21:55:50.172]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[21:55:50.172]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[21:55:50.172]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[21:55:50.172]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[21:55:50.173]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[21:55:50.173]     at Socket.emit (node:events:518:28)
[21:55:50.173]     at addChunk (node:internal/streams/readable:561:12)
[21:55:50.173]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[21:55:50.174]     at Readable.push (node:internal/streams/readable:392:5)
[21:55:50.174]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[21:55:50.261] Error: Command "npm run build" exited with 1
[21:55:50.476] 
[21:55:53.243] Exiting build container