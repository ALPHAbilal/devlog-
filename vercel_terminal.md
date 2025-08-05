[08:03:56.209] Running build in Washington, D.C., USA (East) – iad1
[08:03:56.209] Build machine configuration: 2 cores, 8 GB
[08:03:56.233] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: d45bdca)
[08:03:57.002] Cloning completed: 769.000ms
[08:03:57.499] Restored build cache from previous deployment (8sLAotWXq3y8m9WcMB6cvuJ3qN7Q)
[08:03:57.915] Running "vercel build"
[08:03:58.988] Vercel CLI 44.6.4
[08:04:00.309] Installing dependencies...
[08:04:01.666] 
[08:04:01.668] up to date in 1s
[08:04:01.668] 
[08:04:01.669] 75 packages are looking for funding
[08:04:01.669]   run `npm fund` for details
[08:04:01.812] 
[08:04:01.812] > journey-log-compass@0.0.0 build
[08:04:01.813] > vite build
[08:04:01.813] 
[08:04:02.475] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[08:04:02.520] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[08:04:02.957] transforming...
[08:04:06.965] [32m✓[39m 2185 modules transformed.
[08:04:06.969] [31m✗[39m Build failed in 4.45s
[08:04:06.970] [31merror during build:
[08:04:06.970] [31m[vite:esbuild] Transform failed with 1 error:
[08:04:06.971] /vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:275:47: ERROR: Unexpected ">"[31m
[08:04:06.971] file: [36m/vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:275:47[31m
[08:04:06.971] [33m
[08:04:06.972] [33mUnexpected ">"[33m
[08:04:06.972] 273|        </div>
[08:04:06.972] 274|        
[08:04:06.972] 275|        {/* Content column with modern wrapper */>
[08:04:06.973]    |                                                 ^
[08:04:06.973] 276|        <div className="flex-1 pl-1">
[08:04:06.973] 277|          <div className="issue-content-wrapper">
[08:04:06.974] [31m
[08:04:06.974]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[08:04:06.974]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[08:04:06.975]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[08:04:06.975]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[08:04:06.975]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[08:04:06.975]     at Socket.emit (node:events:518:28)
[08:04:06.976]     at addChunk (node:internal/streams/readable:561:12)
[08:04:06.976]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[08:04:06.977]     at Readable.push (node:internal/streams/readable:392:5)
[08:04:06.977]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[08:04:07.034] Error: Command "npm run build" exited with 1
[08:04:10.620] Exiting build container