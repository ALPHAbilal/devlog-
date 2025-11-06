14:49:52.271 Running build in Washington, D.C., USA (East) – iad1
14:49:52.272 Build machine configuration: 2 cores, 8 GB
14:49:52.413 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 28f025f)
14:49:53.216 Warning: Failed to fetch one or more git submodules
14:49:53.216 Cloning completed: 802.000ms
14:49:53.543 Restored build cache from previous deployment (392btpPtcrGJ1zzJSZuVTkfBSGtY)
14:49:54.044 Running "vercel build"
14:49:54.455 Vercel CLI 48.8.2
14:49:55.385 Installing dependencies...
14:49:58.927 
14:49:58.928 up to date in 3s
14:49:58.928 
14:49:58.929 76 packages are looking for funding
14:49:58.929   run `npm fund` for details
14:49:59.080 
14:49:59.081 > journey-log-compass@0.0.0 build
14:49:59.081 > vite build
14:49:59.081 
14:50:00.096 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
14:50:00.132 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
14:50:00.514 transforming...
14:50:03.004 [32m✓[39m 286 modules transformed.
14:50:03.005 [31m✗[39m Build failed in 2.88s
14:50:03.006 [31merror during build:
14:50:03.006 [31m[vite:esbuild] Transform failed with 1 error:
14:50:03.006 /vercel/path0/src/components/ExpandedViewEnhanced.jsx:1726:10: ERROR: Expected ":" but found ")"[31m
14:50:03.006 file: [36m/vercel/path0/src/components/ExpandedViewEnhanced.jsx:1726:10[31m
14:50:03.007 [33m
14:50:03.007 [33mExpected ":" but found ")"[33m
14:50:03.007 1724|                })())
14:50:03.007 1725|              )
14:50:03.007 1726|            ) : (
14:50:03.007    |            ^
14:50:03.007 1727|              <div style={{ minHeight: listHeight || 600 }} className="flex items-center justify-center">
14:50:03.008 1728|                <p className="text-text-secondary">No blocks yet. Add one below.</p>
14:50:03.008 [31m
14:50:03.008     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1467:15)
14:50:03.008     at /vercel/path0/node_modules/esbuild/lib/main.js:736:50
14:50:03.008     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:603:9)
14:50:03.008     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:658:12)
14:50:03.008     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:581:7)
14:50:03.009     at Socket.emit (node:events:519:28)
14:50:03.009     at addChunk (node:internal/streams/readable:561:12)
14:50:03.009     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
14:50:03.009     at Readable.push (node:internal/streams/readable:392:5)
14:50:03.013     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
14:50:03.067 Error: Command "npm run build" exited with 1