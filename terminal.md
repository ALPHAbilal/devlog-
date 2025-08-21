[11:20:12.806] Running build in Washington, D.C., USA (East) – iad1
[11:20:12.806] Build machine configuration: 2 cores, 8 GB
[11:20:12.844] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 14e4556)
[11:20:13.705] Cloning completed: 860.000ms
[11:20:13.962] Restored build cache from previous deployment (2XLUQvhopHWE3CEZctTWSVkFLJmH)
[11:20:14.396] Running "vercel build"
[11:20:14.785] Vercel CLI 46.0.2
[11:20:16.225] Installing dependencies...
[11:20:17.382] 
[11:20:17.383] up to date in 917ms
[11:20:17.384] 
[11:20:17.384] 75 packages are looking for funding
[11:20:17.384]   run `npm fund` for details
[11:20:17.524] 
[11:20:17.525] > journey-log-compass@0.0.0 build
[11:20:17.525] > vite build
[11:20:17.525] 
[11:20:18.178] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[11:20:18.213] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[11:20:18.590] transforming...
[11:20:22.636] [32m✓[39m 2274 modules transformed.
[11:20:22.638] [31m✗[39m Build failed in 4.43s
[11:20:22.639] [31merror during build:
[11:20:22.639] [31m[vite:define] Transform failed with 1 error:
[11:20:22.640] /vercel/path0/src/utils/optimizedBlockLoader.js:22:19: ERROR: Expected ";" but found ":"[31m
[11:20:22.640] file: [36m/vercel/path0/src/utils/optimizedBlockLoader.js[31m
[11:20:22.640]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1467:15)
[11:20:22.640]     at /vercel/path0/node_modules/esbuild/lib/main.js:736:50
[11:20:22.641]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:603:9)
[11:20:22.641]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:658:12)
[11:20:22.641]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:581:7)
[11:20:22.641]     at Socket.emit (node:events:518:28)
[11:20:22.642]     at addChunk (node:internal/streams/readable:561:12)
[11:20:22.642]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[11:20:22.642]     at Readable.push (node:internal/streams/readable:392:5)
[11:20:22.642]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[11:20:22.704] Error: Command "npm run build" exited with 1