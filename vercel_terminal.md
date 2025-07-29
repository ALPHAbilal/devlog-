[20:50:36.475] Running build in Washington, D.C., USA (East) – iad1
[20:50:36.482] Build machine configuration: 2 cores, 8 GB
[20:50:36.504] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 342c8dc)
[20:50:37.175] Cloning completed: 671.000ms
[20:50:37.382] Restored build cache from previous deployment (D3hvk6d1V36NSCvYm7rDeNG9WNBv)
[20:50:38.346] Running "vercel build"
[20:50:39.430] Vercel CLI 44.6.4
[20:50:40.837] Installing dependencies...
[20:50:42.004] 
[20:50:42.005] up to date in 901ms
[20:50:42.005] 
[20:50:42.006] 75 packages are looking for funding
[20:50:42.006]   run `npm fund` for details
[20:50:42.153] 
[20:50:42.153] > journey-log-compass@0.0.0 build
[20:50:42.154] > vite build
[20:50:42.154] 
[20:50:42.974] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[20:50:43.021] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[20:50:43.395] transforming...
[20:50:44.703] [32m✓[39m 88 modules transformed.
[20:50:44.705] [31m✗[39m Build failed in 1.69s
[20:50:44.707] [31merror during build:
[20:50:44.708] [31m[vite:esbuild] Transform failed with 1 error:
[20:50:44.708] /vercel/path0/src/pages/compare/DevLogVsNotion.jsx:392:18: ERROR: Expected identifier but found "1"[31m
[20:50:44.708] file: [36m/vercel/path0/src/pages/compare/DevLogVsNotion.jsx:392:18[31m
[20:50:44.708] [33m
[20:50:44.709] [33mExpected identifier but found "1"[33m
[20:50:44.709] 390|                </h3>
[20:50:44.709] 391|                <p className="text-gray-400 mb-4">
[20:50:44.709] 392|                  < 1 second load times. No waiting for servers. Instant search across 
[20:50:44.709]    |                    ^
[20:50:44.709] 393|                  thousands of documents.
[20:50:44.709] 394|                </p>
[20:50:44.710] [31m
[20:50:44.710]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[20:50:44.710]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[20:50:44.710]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[20:50:44.710]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[20:50:44.710]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[20:50:44.710]     at Socket.emit (node:events:518:28)
[20:50:44.710]     at addChunk (node:internal/streams/readable:561:12)
[20:50:44.711]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[20:50:44.711]     at Readable.push (node:internal/streams/readable:392:5)
[20:50:44.711]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[20:50:44.765] Error: Command "npm run build" exited with 1
[20:50:44.967] 
[20:50:47.684] Exiting build container