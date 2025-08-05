[08:01:35.835] Running build in Washington, D.C., USA (East) – iad1
[08:01:35.835] Build machine configuration: 2 cores, 8 GB
[08:01:35.886] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: f80bcce)
[08:01:36.795] Cloning completed: 909.000ms
[08:01:36.947] Restored build cache from previous deployment (8sLAotWXq3y8m9WcMB6cvuJ3qN7Q)
[08:01:38.936] Running "vercel build"
[08:01:39.407] Vercel CLI 44.6.4
[08:01:40.293] Installing dependencies...
[08:01:41.974] 
[08:01:41.975] up to date in 1s
[08:01:41.976] 
[08:01:41.976] 75 packages are looking for funding
[08:01:41.977]   run `npm fund` for details
[08:01:42.124] 
[08:01:42.125] > journey-log-compass@0.0.0 build
[08:01:42.126] > vite build
[08:01:42.126] 
[08:01:42.827] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[08:01:42.869] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[08:01:43.252] transforming...
[08:01:47.457] [32m✓[39m 2294 modules transformed.
[08:01:47.460] [31m✗[39m Build failed in 4.59s
[08:01:47.461] [31merror during build:
[08:01:47.461] [31m[vite:esbuild] Transform failed with 1 error:
[08:01:47.462] /vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:70:20: ERROR: Unexpected ">"[31m
[08:01:47.462] file: [36m/vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:70:20[31m
[08:01:47.462] [33m
[08:01:47.463] [33mUnexpected ">"[33m
[08:01:47.463] 68 |        </div>
[08:01:47.463] 69 |        
[08:01:47.464] 70 |        {/* Content */>
[08:01:47.464]    |                      ^
[08:01:47.464] 71 |        <div className="flex-1 pl-1">
[08:01:47.465] 72 |            {isEditing ? (
[08:01:47.465] [31m
[08:01:47.465]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[08:01:47.466]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[08:01:47.466]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[08:01:47.466]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[08:01:47.466]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[08:01:47.467]     at Socket.emit (node:events:518:28)
[08:01:47.467]     at addChunk (node:internal/streams/readable:561:12)
[08:01:47.467]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[08:01:47.468]     at Readable.push (node:internal/streams/readable:392:5)
[08:01:47.468]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[08:01:47.530] Error: Command "npm run build" exited with 1
[08:01:50.682] Exiting build container