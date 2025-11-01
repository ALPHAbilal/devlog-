22:29:19.183 Running build in Washington, D.C., USA (East) – iad1
22:29:19.184 Build machine configuration: 2 cores, 8 GB
22:29:19.332 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 362a8b8)
22:29:20.037 Warning: Failed to fetch one or more git submodules
22:29:20.037 Cloning completed: 705.000ms
22:29:20.232 Restored build cache from previous deployment (BcrdW5vgvi44sEPE5vv573hNRrsk)
22:29:20.665 Running "vercel build"
22:29:21.048 Vercel CLI 48.6.0
22:29:21.856 Installing dependencies...
22:29:23.064 
22:29:23.065 up to date in 971ms
22:29:23.065 
22:29:23.065 76 packages are looking for funding
22:29:23.066   run `npm fund` for details
22:29:23.198 
22:29:23.199 > journey-log-compass@0.0.0 build
22:29:23.199 > vite build
22:29:23.199 
22:29:23.813 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
22:29:23.858 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
22:29:24.205 transforming...
22:29:34.711 [32m✓[39m 3208 modules transformed.
22:29:36.753 rendering chunks...
22:29:36.876 [33m[esbuild css minify]
22:29:36.877 ▲ [WARNING] Expected "{" but found "," [css-syntax-error]
22:29:36.877 
22:29:36.877     <stdin>:3278:23:
22:29:36.877       3278 │   @keyframes code-float,
22:29:36.878            │                        ^
22:29:36.878            ╵                        {
22:29:36.878 
22:29:36.878 [39m
22:29:39.164 computing gzip size...
22:29:39.443 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
22:29:39.444 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-CKpco3Rq.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
22:29:39.444 [2mdist/[22m[2massets/[22m[35mindex-DosOw2lB.css                    [39m[1m[2m  407.53 kB[22m[1m[22m[2m │ gzip:  53.79 kB[22m
22:29:39.445 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-Ea6_QTQk.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.61 kB[22m[2m │ map:    18.48 kB[22m
22:29:39.445 [2mdist/[22m[2massets/[22m[36mPricingSection-BBcTVdzI.js            [39m[1m[2m   10.47 kB[22m[1m[22m[2m │ gzip:   3.72 kB[22m[2m │ map:    26.06 kB[22m
22:29:39.445 [2mdist/[22m[2massets/[22m[36mNotionAlternative-K8X7f2xX.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.22 kB[22m[2m │ map:    24.16 kB[22m
22:29:39.445 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-DSXcpCl-.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.70 kB[22m[2m │ map:    40.60 kB[22m
22:29:39.446 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-CbSPOkGI.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
22:29:39.446 [2mdist/[22m[2massets/[22m[36mVersionTrackBlock-DcnXi_Wm.js         [39m[1m[2m   36.43 kB[22m[1m[22m[2m │ gzip:  10.93 kB[22m[2m │ map:   145.15 kB[22m
22:29:39.446 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-CePwgEAE.js         [39m[1m[2m   48.74 kB[22m[1m[22m[2m │ gzip:  14.34 kB[22m[2m │ map:   181.29 kB[22m
22:29:39.446 [2mdist/[22m[2massets/[22m[36mindex-C1Xf62P-.js                     [39m[1m[33m1,525.58 kB[39m[22m[2m │ gzip: 455.31 kB[22m[2m │ map: 6,375.25 kB[22m
22:29:39.447 [33m
22:29:39.447 (!) Some chunks are larger than 500 kB after minification. Consider:
22:29:39.447 - Using dynamic import() to code-split the application
22:29:39.447 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
22:29:39.447 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
22:29:39.450 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 362a8b81a8911c5492f8120bea28d99bfd4d5030
22:29:39.450 error: API request failed
22:29:39.450 
22:29:39.451 Caused by:
22:29:39.451     sentry reported an error: You do not have permission to perform this action. (http status: 403)
22:29:39.451 
22:29:39.452 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
22:29:39.453 Please attach the full debug log to all bug reports.
22:29:39.453 
22:29:39.453     at genericNodeError (node:internal/errors:983:15)
22:29:39.453     at wrappedFn (node:internal/errors:537:14)
22:29:39.453     at ChildProcess.exithandler (node:child_process:417:12)
22:29:39.453     at ChildProcess.emit (node:events:519:28)
22:29:39.453     at maybeClose (node:internal/child_process:1101:16)
22:29:39.454     at Socket.<anonymous> (node:internal/child_process:456:11)
22:29:39.454     at Socket.emit (node:events:519:28)
22:29:39.454     at Pipe.<anonymous> (node:net:346:12) {
22:29:39.454   code: 1,
22:29:39.454   killed: false,
22:29:39.454   signal: null,
22:29:39.454   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 362a8b81a8911c5492f8120bea28d99bfd4d5030'
22:29:39.455 }
22:29:39.589 > Found 16 files
22:29:39.592 > Analyzing 16 sources
22:29:39.609 > Adding source map references
22:29:40.115 > Bundled 16 files for upload
22:29:40.115 > Bundle ID: f139c656-beaa-572c-9e8d-6284208353f1
22:29:40.655 error: API request failed
22:29:40.656 
22:29:40.656 Caused by:
22:29:40.656     sentry reported an error: You do not have permission to perform this action. (http status: 403)
22:29:40.657 
22:29:40.657 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
22:29:40.657 Please attach the full debug log to all bug reports.
22:29:40.660 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:27d1c64fa98c4e5d9b45c65737b91e0d-bde6fa7431b446db-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=27d1c64fa98c4e5d9b45c65737b91e0d,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release 362a8b81a8911c5492f8120bea28d99bfd4d5030 /tmp/sentry-bundler-plugin-upload-x6G0Mi --ignore node_modules --no-rewrite failed with exit code 1
22:29:40.663     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:343:18)
22:29:40.663     at ChildProcess.emit (node:events:519:28)
22:29:40.663     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
22:29:40.672 [32m✓ built in 16.82s[39m
22:29:42.767 Build Completed in /vercel/output [21s]
22:29:42.968 Deploying outputs...
22:29:49.819 Deployment completed
22:29:50.602 Creating build cache...
22:30:18.655 Created build cache: 28.052s
22:30:18.656 Uploading build cache [52.91 MB]
22:30:19.403 Build cache uploaded: 747.198ms