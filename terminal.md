14:28:45.108 Running build in Washington, D.C., USA (East) – iad1
14:28:45.109 Build machine configuration: 2 cores, 8 GB
14:28:45.257 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: db7f1d0)
14:28:46.160 Cloning completed: 903.000ms
14:28:46.406 Restored build cache from previous deployment (6GC2UDGLA6UyBvAqdyvJRDFCrMT9)
14:28:47.582 Running "vercel build"
14:28:48.013 Vercel CLI 48.8.2
14:28:49.592 Installing dependencies...
14:28:53.780 
14:28:53.781 changed 36 packages in 4s
14:28:53.781 
14:28:53.782 76 packages are looking for funding
14:28:53.782   run `npm fund` for details
14:28:53.925 
14:28:53.926 > journey-log-compass@0.0.0 build
14:28:53.926 > vite build
14:28:53.927 
14:28:54.702 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
14:28:54.735 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
14:28:55.186 transforming...
14:29:06.677 [32m✓[39m 3266 modules transformed.
14:29:08.049 rendering chunks...
14:29:08.221 [33m[esbuild css minify]
14:29:08.222 ▲ [WARNING] Expected "{" but found "," [css-syntax-error]
14:29:08.222 
14:29:08.222     <stdin>:3278:23:
14:29:08.222       3278 │   @keyframes code-float,
14:29:08.222            │                        ^
14:29:08.222            ╵                        {
14:29:08.222 
14:29:08.222 [39m
14:29:11.024 computing gzip size...
14:29:11.322 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
14:29:11.322 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-CKpco3Rq.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
14:29:11.323 [2mdist/[22m[2massets/[22m[35mindex-BlJ0y0wd.css                    [39m[1m[2m  412.31 kB[22m[1m[22m[2m │ gzip:  54.20 kB[22m
14:29:11.323 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-C1zBXnBA.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.61 kB[22m[2m │ map:    18.48 kB[22m
14:29:11.323 [2mdist/[22m[2massets/[22m[36mPricingSection-CStmsfz2.js            [39m[1m[2m   10.47 kB[22m[1m[22m[2m │ gzip:   3.72 kB[22m[2m │ map:    26.06 kB[22m
14:29:11.323 [2mdist/[22m[2massets/[22m[36mNotionAlternative-uunsgNJh.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.22 kB[22m[2m │ map:    24.16 kB[22m
14:29:11.324 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-LG8BMJ3t.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.70 kB[22m[2m │ map:    40.60 kB[22m
14:29:11.324 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-D9TPB3l3.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
14:29:11.324 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-BZAn1oM6.js         [39m[1m[2m   48.74 kB[22m[1m[22m[2m │ gzip:  14.34 kB[22m[2m │ map:   181.29 kB[22m
14:29:11.324 [2mdist/[22m[2massets/[22m[36mindex-CWg_-G-W.js                     [39m[1m[33m1,678.20 kB[39m[22m[2m │ gzip: 504.85 kB[22m[2m │ map: 7,006.30 kB[22m
14:29:11.325 [33m
14:29:11.325 (!) Some chunks are larger than 500 kB after minification. Consider:
14:29:11.325 - Using dynamic import() to code-split the application
14:29:11.325 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
14:29:11.325 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
14:29:11.326 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new db7f1d0f4191ff5f2a01343d6fd099b1149802d2
14:29:11.327 error: API request failed
14:29:11.327 
14:29:11.327 Caused by:
14:29:11.327     sentry reported an error: You do not have permission to perform this action. (http status: 403)
14:29:11.327 
14:29:11.327 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
14:29:11.327 Please attach the full debug log to all bug reports.
14:29:11.327 
14:29:11.328     at genericNodeError (node:internal/errors:983:15)
14:29:11.328     at wrappedFn (node:internal/errors:537:14)
14:29:11.329     at ChildProcess.exithandler (node:child_process:417:12)
14:29:11.329     at ChildProcess.emit (node:events:519:28)
14:29:11.329     at maybeClose (node:internal/child_process:1101:16)
14:29:11.329     at Socket.<anonymous> (node:internal/child_process:456:11)
14:29:11.329     at Socket.emit (node:events:519:28)
14:29:11.329     at Pipe.<anonymous> (node:net:346:12) {
14:29:11.329   code: 1,
14:29:11.329   killed: false,
14:29:11.329   signal: null,
14:29:11.330   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new db7f1d0f4191ff5f2a01343d6fd099b1149802d2'
14:29:11.330 }
14:29:11.502 > Found 14 files
14:29:11.505 > Analyzing 14 sources
14:29:11.522 > Adding source map references
14:29:12.040 > Bundled 14 files for upload
14:29:12.041 > Bundle ID: dfdbff07-cea6-54fc-ad92-0e2de49d6072
14:29:12.135 error: API request failed
14:29:12.135 
14:29:12.135 Caused by:
14:29:12.136     sentry reported an error: You do not have permission to perform this action. (http status: 403)
14:29:12.136 
14:29:12.136 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
14:29:12.136 Please attach the full debug log to all bug reports.
14:29:12.143 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:6d774136684541e9a3d8bece1d311d59-82dcef484362fd56-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=6d774136684541e9a3d8bece1d311d59,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release db7f1d0f4191ff5f2a01343d6fd099b1149802d2 /tmp/sentry-bundler-plugin-upload-WcC1Mm --ignore node_modules --no-rewrite failed with exit code 1
14:29:12.143     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:343:18)
14:29:12.143     at ChildProcess.emit (node:events:519:28)
14:29:12.143     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
14:29:12.151 [32m✓ built in 17.42s[39m
14:29:14.643 Build Completed in /vercel/output [25s]
14:29:14.844 Deploying outputs...
14:29:21.865 Deployment completed
14:29:22.758 Creating build cache...
14:29:54.529 Created build cache: 31.771s
14:29:54.530 Uploading build cache [53.04 MB]
14:29:55.517 Build cache uploaded: 986.986ms