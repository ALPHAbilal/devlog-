[21:04:43.668] Running build in Washington, D.C., USA (East) – iad1
[21:04:43.669] Build machine configuration: 2 cores, 8 GB
[21:04:43.685] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 75386d4)
[21:04:44.427] Cloning completed: 741.000ms
[21:04:44.558] Restored build cache from previous deployment (D3hvk6d1V36NSCvYm7rDeNG9WNBv)
[21:04:47.031] Running "vercel build"
[21:04:47.692] Vercel CLI 44.6.4
[21:04:48.457] Installing dependencies...
[21:04:49.570] 
[21:04:49.570] up to date in 829ms
[21:04:49.571] 
[21:04:49.571] 75 packages are looking for funding
[21:04:49.571]   run `npm fund` for details
[21:04:49.848] 
[21:04:49.849] > journey-log-compass@0.0.0 build
[21:04:49.849] > vite build
[21:04:49.849] 
[21:04:50.780] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[21:04:50.822] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[21:04:51.185] transforming...
[21:04:53.007] [32m✓[39m 235 modules transformed.
[21:04:53.009] [31m✗[39m Build failed in 2.19s
[21:04:53.013] [31merror during build:
[21:04:53.014] [31m[vite:esbuild] Transform failed with 2 errors:
[21:04:53.014] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:27:15: ERROR: Unexpected "="
[21:04:53.014] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:30:8: ERROR: Expected ")" but found "{"[31m
[21:04:53.015] file: [36m/vercel/path0/src/components/ExpandedViewEnhanced.jsx:27:15[31m
[21:04:53.015] [33m
[21:04:53.015] [33mUnexpected "="[33m
[21:04:53.015] 25 |    onUpdate, 
[21:04:53.016] 26 |    allEntries = [],
[21:04:53.016] 27 |    isMobileView = false,
[21:04:53.016]    |                 ^
[21:04:53.017] 28 |    scrollContainerRef: externalScrollRef,
[21:04:53.017] 29 |    onShowBlockSelector 
[21:04:53.017] 
[21:04:53.017] [33mExpected ")" but found "{"[33m
[21:04:53.018] 28 |    scrollContainerRef: externalScrollRef,
[21:04:53.018] 29 |    onShowBlockSelector 
[21:04:53.018] 30 |  }, ref) {
[21:04:53.019]    |          ^
[21:04:53.019] 31 |    // Check if document might have many blocks (use pagination for documents with 50+ blocks)
[21:04:53.025] 32 |    const shouldUsePagination = !entry.blocks || entry.blockCount > 50;
[21:04:53.025] [31m
[21:04:53.025]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[21:04:53.026]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[21:04:53.026]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[21:04:53.026]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[21:04:53.027]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[21:04:53.027]     at Socket.emit (node:events:518:28)
[21:04:53.027]     at addChunk (node:internal/streams/readable:561:12)
[21:04:53.028]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[21:04:53.028]     at Readable.push (node:internal/streams/readable:392:5)
[21:04:53.028]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[21:04:53.071] Error: Command "npm run build" exited with 1
[21:04:53.256] 
[21:04:56.285] Exiting build container