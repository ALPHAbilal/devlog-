[21:00:08.955] Running build in Washington, D.C., USA (East) – iad1
[21:00:08.956] Build machine configuration: 2 cores, 8 GB
[21:00:09.014] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 86e0851)
[21:00:09.767] Cloning completed: 753.000ms
[21:00:09.938] Restored build cache from previous deployment (D3hvk6d1V36NSCvYm7rDeNG9WNBv)
[21:00:12.428] Running "vercel build"
[21:00:12.915] Vercel CLI 44.6.4
[21:00:13.533] Installing dependencies...
[21:00:14.614] 
[21:00:14.615] up to date in 833ms
[21:00:14.615] 
[21:00:14.615] 75 packages are looking for funding
[21:00:14.616]   run `npm fund` for details
[21:00:14.756] 
[21:00:14.756] > journey-log-compass@0.0.0 build
[21:00:14.757] > vite build
[21:00:14.757] 
[21:00:15.577] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[21:00:15.618] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[21:00:15.995] transforming...
[21:00:18.265] [32m✓[39m 248 modules transformed.
[21:00:18.266] [31m✗[39m Build failed in 2.65s
[21:00:18.267] [31merror during build:
[21:00:18.267] [31m[vite:esbuild] Transform failed with 2 errors:
[21:00:18.268] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:27:15: ERROR: Unexpected "="
[21:00:18.268] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:30:8: ERROR: Expected ")" but found "{"[31m
[21:00:18.268] file: [36m/vercel/path0/src/components/ExpandedViewEnhanced.jsx:27:15[31m
[21:00:18.269] [33m
[21:00:18.269] [33mUnexpected "="[33m
[21:00:18.269] 25 |    onUpdate, 
[21:00:18.270] 26 |    allEntries = [],
[21:00:18.270] 27 |    isMobileView = false,
[21:00:18.270]    |                 ^
[21:00:18.271] 28 |    scrollContainerRef: externalScrollRef = null,
[21:00:18.271] 29 |    onShowBlockSelector 
[21:00:18.271] 
[21:00:18.272] [33mExpected ")" but found "{"[33m
[21:00:18.272] 28 |    scrollContainerRef: externalScrollRef = null,
[21:00:18.272] 29 |    onShowBlockSelector 
[21:00:18.273] 30 |  }, ref) {
[21:00:18.273]    |          ^
[21:00:18.273] 31 |    // Check if document might have many blocks (use pagination for documents with 50+ blocks)
[21:00:18.274] 32 |    const shouldUsePagination = !entry.blocks || entry.blockCount > 50;
[21:00:18.274] [31m
[21:00:18.274]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[21:00:18.275]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[21:00:18.275]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[21:00:18.275]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[21:00:18.276]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[21:00:18.276]     at Socket.emit (node:events:518:28)
[21:00:18.276]     at addChunk (node:internal/streams/readable:561:12)
[21:00:18.277]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[21:00:18.277]     at Readable.push (node:internal/streams/readable:392:5)
[21:00:18.277]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[21:00:18.328] Error: Command "npm run build" exited with 1
[21:00:18.499] 
[21:00:21.388] Exiting build container