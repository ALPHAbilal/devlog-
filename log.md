21:32:27.498 Running build in Washington, D.C., USA (East) – iad1
21:32:27.499 Build machine configuration: 2 cores, 8 GB
21:32:27.641 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 580e90f)
21:32:28.463 Warning: Failed to fetch one or more git submodules
21:32:28.464 Cloning completed: 822.000ms
21:32:28.683 Restored build cache from previous deployment (G2xiqNwEgb1HA8ctxGMt2z9dHdke)
21:32:29.326 Running "vercel build"
21:32:29.718 Vercel CLI 48.8.0
21:32:30.622 Installing dependencies...
21:32:32.014 
21:32:32.015 up to date in 1s
21:32:32.015 
21:32:32.016 76 packages are looking for funding
21:32:32.016   run `npm fund` for details
21:32:32.154 
21:32:32.155 > journey-log-compass@0.0.0 build
21:32:32.155 > vite build
21:32:32.155 
21:32:32.788 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
21:32:32.828 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
21:32:33.178 transforming...
21:32:44.343 [32m✓[39m 3211 modules transformed.
21:32:45.665 rendering chunks...
21:32:45.796 [33m[esbuild css minify]
21:32:45.797 ▲ [WARNING] Expected "{" but found "," [css-syntax-error]
21:32:45.797 
21:32:45.797     <stdin>:3278:23:
21:32:45.797       3278 │   @keyframes code-float,
21:32:45.797            │                        ^
21:32:45.797            ╵                        {
21:32:45.798 
21:32:45.798 [39m
21:32:48.744 computing gzip size...
21:32:49.037 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
21:32:49.038 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-CKpco3Rq.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
21:32:49.038 [2mdist/[22m[2massets/[22m[35mindex-Bl1sVkJJ.css                    [39m[1m[2m  407.71 kB[22m[1m[22m[2m │ gzip:  53.82 kB[22m
21:32:49.038 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-BeZCew4i.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.60 kB[22m[2m │ map:    18.48 kB[22m
21:32:49.038 [2mdist/[22m[2massets/[22m[36mPricingSection-sGlks89U.js            [39m[1m[2m   10.47 kB[22m[1m[22m[2m │ gzip:   3.72 kB[22m[2m │ map:    26.06 kB[22m
21:32:49.039 [2mdist/[22m[2massets/[22m[36mNotionAlternative-DqlcyENx.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.22 kB[22m[2m │ map:    24.16 kB[22m
21:32:49.039 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-TsTMyYd7.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.70 kB[22m[2m │ map:    40.60 kB[22m
21:32:49.039 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-1XIKY7A1.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
21:32:49.039 [2mdist/[22m[2massets/[22m[36mVersionTrackBlock-CQZDSgpj.js         [39m[1m[2m   36.01 kB[22m[1m[22m[2m │ gzip:  10.70 kB[22m[2m │ map:   144.06 kB[22m
21:32:49.040 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-C66eg98g.js         [39m[1m[2m   48.74 kB[22m[1m[22m[2m │ gzip:  14.34 kB[22m[2m │ map:   181.29 kB[22m
21:32:49.040 [2mdist/[22m[2massets/[22m[36mindex-D0tIb0TX.js                     [39m[1m[33m1,536.21 kB[39m[22m[2m │ gzip: 457.32 kB[22m[2m │ map: 6,406.53 kB[22m
21:32:49.040 [33m
21:32:49.040 (!) Some chunks are larger than 500 kB after minification. Consider:
21:32:49.040 - Using dynamic import() to code-split the application
21:32:49.041 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
21:32:49.041 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
21:32:49.044 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 580e90f35b03ac79709ecaacb89413c577e1704b
21:32:49.044 error: API request failed
21:32:49.044 
21:32:49.044 Caused by:
21:32:49.044     sentry reported an error: You do not have permission to perform this action. (http status: 403)
21:32:49.045 
21:32:49.045 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
21:32:49.045 Please attach the full debug log to all bug reports.
21:32:49.046 
21:32:49.046     at genericNodeError (node:internal/errors:983:15)
21:32:49.046     at wrappedFn (node:internal/errors:537:14)
21:32:49.046     at ChildProcess.exithandler (node:child_process:417:12)
21:32:49.046     at ChildProcess.emit (node:events:519:28)
21:32:49.046     at maybeClose (node:internal/child_process:1101:16)
21:32:49.046     at Socket.<anonymous> (node:internal/child_process:456:11)
21:32:49.046     at Socket.emit (node:events:519:28)
21:32:49.046     at Pipe.<anonymous> (node:net:346:12) {
21:32:49.046   code: 1,
21:32:49.047   killed: false,
21:32:49.047   signal: null,
21:32:49.047   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 580e90f35b03ac79709ecaacb89413c577e1704b'
21:32:49.047 }
21:32:49.195 > Found 16 files
21:32:49.198 > Analyzing 16 sources
21:32:49.214 > Adding source map references
21:32:49.715 > Bundled 16 files for upload
21:32:49.716 > Bundle ID: c345544f-3f9a-5a23-9610-ba4086885953
21:32:49.815 error: API request failed
21:32:49.816 
21:32:49.816 Caused by:
21:32:49.817     sentry reported an error: You do not have permission to perform this action. (http status: 403)
21:32:49.817 
21:32:49.817 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
21:32:49.817 Please attach the full debug log to all bug reports.
21:32:49.820 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:51cc3883bdcd44fc973fbb14c206f7ae-9c5266b3c2893791-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=51cc3883bdcd44fc973fbb14c206f7ae,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release 580e90f35b03ac79709ecaacb89413c577e1704b /tmp/sentry-bundler-plugin-upload-qfEg1L --ignore node_modules --no-rewrite failed with exit code 1
21:32:49.821     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:343:18)
21:32:49.821     at ChildProcess.emit (node:events:519:28)
21:32:49.825     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
21:32:49.837 [32m✓ built in 17.01s[39m
21:32:52.080 Build Completed in /vercel/output [21s]
21:32:52.283 Deploying outputs...
21:32:59.261 Deployment completed
21:33:00.098 Creating build cache...
21:33:29.942 Created build cache: 29.841s
21:33:29.943 Uploading build cache [52.91 MB]
21:33:30.722 Build cache uploaded: 781.298ms