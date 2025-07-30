[22:31:54.053] Running build in Washington, D.C., USA (East) – iad1
[22:31:54.054] Build machine configuration: 2 cores, 8 GB
[22:31:54.116] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 502e1d6)
[22:31:55.903] Cloning completed: 1.787s
[22:31:56.323] Restored build cache from previous deployment (F2gC45EzKFJMKSBUnVhXxZN33gUq)
[22:31:58.524] Running "vercel build"
[22:31:59.016] Vercel CLI 44.6.4
[22:31:59.779] Installing dependencies...
[22:32:00.850] 
[22:32:00.850] up to date in 844ms
[22:32:00.851] 
[22:32:00.851] 75 packages are looking for funding
[22:32:00.851]   run `npm fund` for details
[22:32:00.991] 
[22:32:00.991] > journey-log-compass@0.0.0 build
[22:32:00.991] > vite build
[22:32:00.992] 
[22:32:01.825] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[22:32:01.871] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[22:32:02.236] transforming...
[22:32:03.632] [32m✓[39m 204 modules transformed.
[22:32:03.635] [31m✗[39m Build failed in 1.77s
[22:32:03.635] [31merror during build:
[22:32:03.635] [31m[vite:esbuild] Transform failed with 1 error:
[22:32:03.638] /vercel/path0/src/pages/settings/api.jsx:70:23: ERROR: Unexpected "!"[31m
[22:32:03.638] file: [36m/vercel/path0/src/pages/settings/api.jsx:70:23[31m
[22:32:03.638] [33m
[22:32:03.638] [33mUnexpected "!"[33m
[22:32:03.639] 68 |          .from('api_keys')
[22:32:03.639] 69 |          .insert({
[22:32:03.639] 70 |            user_id: user!.id,
[22:32:03.639]    |                         ^
[22:32:03.639] 71 |            name: newKeyName.trim(),
[22:32:03.639] 72 |            key_hash: keyHash,
[22:32:03.639] [31m
[22:32:03.640]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[22:32:03.640]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[22:32:03.640]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[22:32:03.640]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[22:32:03.640]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[22:32:03.640]     at Socket.emit (node:events:518:28)
[22:32:03.640]     at addChunk (node:internal/streams/readable:561:12)
[22:32:03.641]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[22:32:03.641]     at Readable.push (node:internal/streams/readable:392:5)
[22:32:03.643]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[22:32:03.691] Error: Command "npm run build" exited with 1
[22:32:03.956] 
[22:32:06.787] Exiting build container