18:17:02.303 Running build in Washington, D.C., USA (East) – iad1
18:17:02.304 Build machine configuration: 2 cores, 8 GB
18:17:02.534 Cloning github.com/ALPHAbilal/devlog- (Branch: refactor/phase-0-cleanup, Commit: d7b5a9c)
18:17:03.550 Warning: Failed to fetch one or more git submodules
18:17:03.551 Cloning completed: 1.016s
18:17:03.747 Restored build cache from previous deployment (6gDHu7vBuxtHG4buCfMbBpaZ3Wyb)
18:17:04.282 Running "vercel build"
18:17:04.722 Vercel CLI 50.1.3
18:17:05.542 Installing dependencies...
18:17:34.383 
18:17:34.384 added 207 packages, and changed 139 packages in 29s
18:17:34.384 
18:17:34.384 186 packages are looking for funding
18:17:34.385   run `npm fund` for details
18:17:34.916 
18:17:34.917 > journey-log-compass@0.0.0 build
18:17:34.917 > vite build
18:17:34.917 
18:17:35.670 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
18:17:35.701 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
18:17:36.082 transforming...
18:17:48.976 [32m✓[39m 3465 modules transformed.
18:17:50.655 rendering chunks...
18:17:50.757 [33m[esbuild css minify]
18:17:50.757 ▲ [WARNING] Expected "{" but found "," [css-syntax-error]
18:17:50.758 
18:17:50.758     <stdin>:3282:23:
18:17:50.758       3282 │   @keyframes code-float,
18:17:50.758            │                        ^
18:17:50.758            ╵                        {
18:17:50.758 
18:17:50.758 [39m
18:17:51.541 [33m[plugin vite:reporter] 
18:17:51.541 (!) /vercel/path0/src/utils/blockSerializer.js is dynamically imported by /vercel/path0/src/hooks/useOptimizedBlockLoader.js, /vercel/path0/src/hooks/usePaginatedBlockLoader.js but also statically imported by /vercel/path0/src/components/ExpandedViewEnhanced.jsx, /vercel/path0/src/services/shareService.js, /vercel/path0/src/utils/optimizedBlockLoader.js, dynamic import will not move module into another chunk.
18:17:51.542 [39m
18:17:51.543 [33m[plugin vite:reporter] 
18:17:51.544 (!) /vercel/path0/src/utils/storage/IndexedDBAdapter.js is dynamically imported by /vercel/path0/src/utils/smartSync.js but also statically imported by /vercel/path0/src/hooks/useIndexedDBCache.js, /vercel/path0/src/pages/Dashboard.jsx, /vercel/path0/src/utils/storage/storageWrapper.js, dynamic import will not move module into another chunk.
18:17:51.544 [39m
18:17:54.441 computing gzip size...
18:17:54.744 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new d7b5a9c096d4853e9f792f441d2564a150c556c2
18:17:54.746 error: API request failed
18:17:54.746 
18:17:54.746 Caused by:
18:17:54.747     sentry reported an error: You do not have permission to perform this action. (http status: 403)
18:17:54.747 
18:17:54.747 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
18:17:54.747 Please attach the full debug log to all bug reports.
18:17:54.747 
18:17:54.747     at genericNodeError (node:internal/errors:983:15)
18:17:54.748     at wrappedFn (node:internal/errors:537:14)
18:17:54.748     at ChildProcess.exithandler (node:child_process:417:12)
18:17:54.748     at ChildProcess.emit (node:events:519:28)
18:17:54.748     at maybeClose (node:internal/child_process:1101:16)
18:17:54.749     at Socket.<anonymous> (node:internal/child_process:456:11)
18:17:54.749     at Socket.emit (node:events:519:28)
18:17:54.749     at Pipe.<anonymous> (node:net:346:12) {
18:17:54.749   code: 1,
18:17:54.749   killed: false,
18:17:54.749   signal: null,
18:17:54.749   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new d7b5a9c096d4853e9f792f441d2564a150c556c2'
18:17:54.749 }
18:17:54.991 > Found 14 files
18:17:54.995 > Analyzing 14 sources
18:17:55.017 > Adding source map references
18:17:55.586 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
18:17:55.587 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-CKpco3Rq.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[35mindex-Brz1GrpC.css                    [39m[1m[2m  410.71 kB[22m[1m[22m[2m │ gzip:  54.65 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-Cth70mh9.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.61 kB[22m[2m │ map:    18.48 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[36mPricingSection-BHOohl-Y.js            [39m[1m[2m   10.47 kB[22m[1m[22m[2m │ gzip:   3.72 kB[22m[2m │ map:    26.06 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[36mNotionAlternative-0mXYW7Zf.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.22 kB[22m[2m │ map:    24.16 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-mdBU9U7U.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.70 kB[22m[2m │ map:    40.60 kB[22m
18:17:55.588 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-DNd1CiRi.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
18:17:55.589 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-LzD83pWw.js         [39m[1m[2m   49.16 kB[22m[1m[22m[2m │ gzip:  14.51 kB[22m[2m │ map:   183.38 kB[22m
18:17:55.589 [2mdist/[22m[2massets/[22m[36mindex-BlBi_BBv.js                     [39m[1m[33m2,171.71 kB[39m[22m[2m │ gzip: 652.67 kB[22m[2m │ map: 9,232.99 kB[22m
18:17:55.589 [33m
18:17:55.589 (!) Some chunks are larger than 500 kB after minification. Consider:
18:17:55.589 - Using dynamic import() to code-split the application
18:17:55.589 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
18:17:55.589 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
18:17:56.122 > Bundled 14 files for upload
18:17:56.123 > Bundle ID: 96285b80-2c1d-5d6c-aca5-fb3aa4bda45c
18:17:56.219 error: API request failed
18:17:56.220 
18:17:56.220 Caused by:
18:17:56.220     sentry reported an error: You do not have permission to perform this action. (http status: 403)
18:17:56.220 
18:17:56.220 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
18:17:56.220 Please attach the full debug log to all bug reports.
18:17:56.224 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:7a85a7aecc644aa3babef49b9f7280ee-ba440cc70b531058-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=7a85a7aecc644aa3babef49b9f7280ee,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release d7b5a9c096d4853e9f792f441d2564a150c556c2 /tmp/sentry-bundler-plugin-upload-5CqV75 --ignore node_modules --no-rewrite failed with exit code 1
18:17:56.226     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:343:18)
18:17:56.226     at ChildProcess.emit (node:events:519:28)
18:17:56.226     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
18:17:56.235 [32m✓ built in 20.54s[39m
18:17:58.538 Build Completed in /vercel/output [53s]
18:17:58.735 Deploying outputs...
18:18:06.818 Deployment completed
18:18:07.748 Creating build cache...
18:18:54.955 Created build cache: 47.206s
18:18:54.956 Uploading build cache [73.71 MB]
18:18:56.508 Build cache uploaded: 1.553s