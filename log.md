21:59:12.212 Running build in Washington, D.C., USA (East) – iad1
21:59:12.213 Build machine configuration: 2 cores, 8 GB
21:59:12.401 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 74bf099)
21:59:13.073 Warning: Failed to fetch one or more git submodules
21:59:13.073 Cloning completed: 672.000ms
21:59:13.244 Restored build cache from previous deployment (4QvGaSzaPH1ycyzPdBDTVEgJHPRG)
21:59:13.662 Running "vercel build"
21:59:14.036 Vercel CLI 48.6.0
21:59:14.853 Installing dependencies...
21:59:16.055 
21:59:16.057 up to date in 959ms
21:59:16.057 
21:59:16.058 76 packages are looking for funding
21:59:16.058   run `npm fund` for details
21:59:16.189 
21:59:16.189 > journey-log-compass@0.0.0 build
21:59:16.189 > vite build
21:59:16.190 
21:59:16.813 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
21:59:16.851 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
21:59:17.189 transforming...
21:59:27.542 [32m✓[39m 3208 modules transformed.
21:59:28.765 rendering chunks...
21:59:28.874 [33m[esbuild css minify]
21:59:28.874 ▲ [WARNING] Expected "{" but found "," [css-syntax-error]
21:59:28.874 
21:59:28.874     <stdin>:3278:23:
21:59:28.874       3278 │   @keyframes code-float,
21:59:28.874            │                        ^
21:59:28.874            ╵                        {
21:59:28.874 
21:59:28.875 [39m
21:59:31.579 computing gzip size...
21:59:31.847 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
21:59:31.848 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-CKpco3Rq.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
21:59:31.849 [2mdist/[22m[2massets/[22m[35mindex-DosOw2lB.css                    [39m[1m[2m  407.53 kB[22m[1m[22m[2m │ gzip:  53.79 kB[22m
21:59:31.849 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-ByzTAiNm.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.61 kB[22m[2m │ map:    18.48 kB[22m
21:59:31.849 [2mdist/[22m[2massets/[22m[36mPricingSection-B3SIoVfy.js            [39m[1m[2m   10.47 kB[22m[1m[22m[2m │ gzip:   3.72 kB[22m[2m │ map:    26.06 kB[22m
21:59:31.849 [2mdist/[22m[2massets/[22m[36mNotionAlternative-DAPWyHUn.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.23 kB[22m[2m │ map:    24.16 kB[22m
21:59:31.850 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-eeH3HH4Z.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.70 kB[22m[2m │ map:    40.60 kB[22m
21:59:31.850 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-CzV0tIw3.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
21:59:31.850 [2mdist/[22m[2massets/[22m[36mVersionTrackBlock-BAjy41hc.js         [39m[1m[2m   36.43 kB[22m[1m[22m[2m │ gzip:  10.93 kB[22m[2m │ map:   145.15 kB[22m
21:59:31.850 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-Cr147cVg.js         [39m[1m[2m   48.74 kB[22m[1m[22m[2m │ gzip:  14.35 kB[22m[2m │ map:   181.29 kB[22m
21:59:31.850 [2mdist/[22m[2massets/[22m[36mindex-RB7HZUAu.js                     [39m[1m[33m1,525.42 kB[39m[22m[2m │ gzip: 455.25 kB[22m[2m │ map: 6,374.90 kB[22m
21:59:31.850 [33m
21:59:31.851 (!) Some chunks are larger than 500 kB after minification. Consider:
21:59:31.851 - Using dynamic import() to code-split the application
21:59:31.851 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
21:59:31.851 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
21:59:31.864 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 74bf0997870c90495cbe584475fe275307aa6086
21:59:31.865 error: API request failed
21:59:31.865 
21:59:31.865 Caused by:
21:59:31.865     sentry reported an error: You do not have permission to perform this action. (http status: 403)
21:59:31.865 
21:59:31.866 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
21:59:31.866 Please attach the full debug log to all bug reports.
21:59:31.866 
21:59:31.866     at genericNodeError (node:internal/errors:983:15)
21:59:31.866     at wrappedFn (node:internal/errors:537:14)
21:59:31.867     at ChildProcess.exithandler (node:child_process:417:12)
21:59:31.867     at ChildProcess.emit (node:events:519:28)
21:59:31.867     at maybeClose (node:internal/child_process:1101:16)
21:59:31.867     at Socket.<anonymous> (node:internal/child_process:456:11)
21:59:31.867     at Socket.emit (node:events:519:28)
21:59:31.867     at Pipe.<anonymous> (node:net:346:12) {
21:59:31.867   code: 1,
21:59:31.867   killed: false,
21:59:31.867   signal: null,
21:59:31.867   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 74bf0997870c90495cbe584475fe275307aa6086'
21:59:31.867 }
21:59:31.964 > Found 16 files
21:59:31.967 > Analyzing 16 sources
21:59:31.983 > Adding source map references
21:59:32.499 > Bundled 16 files for upload
21:59:32.499 > Bundle ID: eaef88bd-74a0-5d1b-ba74-8d7111491615
21:59:32.606 error: API request failed
21:59:32.607 
21:59:32.607 Caused by:
21:59:32.607     sentry reported an error: You do not have permission to perform this action. (http status: 403)
21:59:32.607 
21:59:32.608 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
21:59:32.608 Please attach the full debug log to all bug reports.
21:59:32.611 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:e4a72371a64846e6a6cd632c9851ce49-8e7afe24e1bc1802-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=e4a72371a64846e6a6cd632c9851ce49,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release 74bf0997870c90495cbe584475fe275307aa6086 /tmp/sentry-bundler-plugin-upload-kloCCN --ignore node_modules --no-rewrite failed with exit code 1
21:59:32.612     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:343:18)
21:59:32.615     at ChildProcess.emit (node:events:519:28)
21:59:32.615     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
21:59:32.623 [32m✓ built in 15.78s[39m
21:59:34.815 Build Completed in /vercel/output [20s]
21:59:35.018 Deploying outputs...
21:59:42.030 Deployment completed
21:59:42.836 Creating build cache...
22:00:11.622 Created build cache: 28.778s
22:00:11.623 Uploading build cache [52.91 MB]
22:00:12.312 Build cache uploaded: 696.277ms