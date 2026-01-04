11:51:28.377 Running build in Washington, D.C., USA (East) – iad1
11:51:28.378 Build machine configuration: 2 cores, 8 GB
11:51:28.499 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 2ccdf97)
11:51:29.857 Warning: Failed to fetch one or more git submodules
11:51:29.858 Cloning completed: 1.358s
11:51:30.342 Restored build cache from previous deployment (9XmPCB4DR4sWny7EM6idsoHGhsFf)
11:51:30.968 Running "vercel build"
11:51:31.601 Vercel CLI 50.1.3
11:51:32.752 Installing dependencies...
11:51:41.270 
11:51:41.271 added 239 packages, removed 39 packages, and changed 103 packages in 8s
11:51:41.271 
11:51:41.271 179 packages are looking for funding
11:51:41.271   run `npm fund` for details
11:51:41.421 
11:51:41.421 > journey-log-compass@0.0.0 build
11:51:41.421 > vite build
11:51:41.421 
11:51:43.243 [36mvite v6.4.1 [32mbuilding for production...[36m[39m
11:51:43.273 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
11:51:43.611 transforming...
11:51:48.056 [33m[plugin vite:resolve] Module "crypto" has been externalized for browser compatibility, imported by "/vercel/path0/src/shared/api/auth.ts". See https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility for more details.[39m
11:51:58.205 [32m✓[39m 3503 modules transformed.
11:52:00.039 rendering chunks...
11:52:01.007 [33m[plugin vite:reporter] 
11:52:01.008 (!) /vercel/path0/src/shared/lib/markdown/converter.ts is dynamically imported by /vercel/path0/src/shared/lib/index.ts, /vercel/path0/src/shared/lib/index.ts but also statically imported by /vercel/path0/src/shared/lib/index.ts, dynamic import will not move module into another chunk.
11:52:01.008 [39m
11:52:01.008 [33m[plugin vite:reporter] 
11:52:01.009 (!) /vercel/path0/src/shared/lib/index.ts is dynamically imported by /vercel/path0/src/features/storage/lib/smart-sync.ts but also statically imported by /vercel/path0/src/App.jsx, /vercel/path0/src/app/providers/auth-provider.tsx, /vercel/path0/src/components/AuthPageRedesign.jsx, /vercel/path0/src/components/ErrorBoundary.jsx, /vercel/path0/src/components/HeroSectionV3.jsx, /vercel/path0/src/components/HowItWorksVideo.jsx, /vercel/path0/src/components/PricingSection.jsx, /vercel/path0/src/components/ProblemSection.jsx, /vercel/path0/src/components/blocks/AIBlockRefined.jsx, /vercel/path0/src/components/blocks/ImageBlock.jsx, /vercel/path0/src/components/blocks/InlineImageBlock.jsx, /vercel/path0/src/components/blocks/TextBlock.jsx, /vercel/path0/src/components/ui/dropdown-menu.jsx, /vercel/path0/src/components/ui/scroll-area.jsx, /vercel/path0/src/components/ui/tooltip.jsx, /vercel/path0/src/features/block/hooks/use-optimized-loader.ts, /vercel/path0/src/features/block/hooks/use-paginated-loader.ts, /vercel/path0/src/features/document/hooks/use-document-state.ts, /vercel/path0/src/features/document/hooks/use-organization.ts, /vercel/path0/src/features/document/hooks/use-paginated-dashboard.ts, /vercel/path0/src/features/share/api/share-service.ts, /vercel/path0/src/features/share/api/sophisticated-share.ts, /vercel/path0/src/features/storage/hooks/use-database-usage.ts, /vercel/path0/src/features/storage/hooks/use-multi-layer.ts, /vercel/path0/src/features/storage/lib/realtime-manager.ts, /vercel/path0/src/features/storage/lib/smart-sync.ts, /vercel/path0/src/pages/Dashboard.jsx, /vercel/path0/src/pages/DocumentPage.jsx, /vercel/path0/src/pages/Landing.jsx, /vercel/path0/src/pages/Privacy.jsx, /vercel/path0/src/pages/Terms.jsx, /vercel/path0/src/pages/Upgrade.jsx, /vercel/path0/src/shared/hooks/use-performance.ts, dynamic import will not move module into another chunk.
11:52:01.012 [39m
11:52:01.012 [33m[plugin vite:reporter] 
11:52:01.013 (!) /vercel/path0/src/features/block/lib/serializer.ts is dynamically imported by /vercel/path0/src/features/block/hooks/use-optimized-loader.ts, /vercel/path0/src/features/block/hooks/use-paginated-loader.ts but also statically imported by /vercel/path0/src/features/block/index.ts, dynamic import will not move module into another chunk.
11:52:01.013 [39m
11:52:04.333 computing gzip size...
11:52:04.637 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command failed: /vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 2ccdf974f98684f50acfa0aba66f50988b1851a8
11:52:04.638 error: API request failed
11:52:04.638 
11:52:04.638 Caused by:
11:52:04.638     sentry reported an error: You do not have permission to perform this action. (http status: 403)
11:52:04.638 
11:52:04.638 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
11:52:04.638 Please attach the full debug log to all bug reports.
11:52:04.638 
11:52:04.638     at genericNodeError (node:internal/errors:983:15)
11:52:04.638     at wrappedFn (node:internal/errors:537:14)
11:52:04.638     at ChildProcess.exithandler (node:child_process:417:12)
11:52:04.639     at ChildProcess.emit (node:events:519:28)
11:52:04.639     at maybeClose (node:internal/child_process:1101:16)
11:52:04.639     at Socket.<anonymous> (node:internal/child_process:456:11)
11:52:04.639     at Socket.emit (node:events:519:28)
11:52:04.639     at Pipe.<anonymous> (node:net:346:12) {
11:52:04.639   code: 1,
11:52:04.639   killed: false,
11:52:04.639   signal: null,
11:52:04.640   cmd: '/vercel/path0/node_modules/@sentry/cli-linux-x64/bin/sentry-cli releases new 2ccdf974f98684f50acfa0aba66f50988b1851a8'
11:52:04.640 }
11:52:04.745 [2mdist/[22m[32mindex.html                                   [39m[1m[2m    9.39 kB[22m[1m[22m[2m │ gzip:   2.74 kB[22m
11:52:04.745 [2mdist/[22m[2massets/[22m[35mIssueTrackerBlock-Bfhw57nf.css        [39m[1m[2m    6.25 kB[22m[1m[22m[2m │ gzip:   1.59 kB[22m
11:52:04.745 [2mdist/[22m[2massets/[22m[35mindex-C-LPQ4p7.css                    [39m[1m[2m  414.56 kB[22m[1m[22m[2m │ gzip:  55.19 kB[22m
11:52:04.745 [2mdist/[22m[2massets/[22m[36mAIConversationSaver-vFLRsQha.js       [39m[1m[2m   10.30 kB[22m[1m[22m[2m │ gzip:   2.61 kB[22m[2m │ map:    18.48 kB[22m
11:52:04.745 [2mdist/[22m[2massets/[22m[36mPricingSection-BHNQJon5.js            [39m[1m[2m   10.78 kB[22m[1m[22m[2m │ gzip:   3.97 kB[22m[2m │ map:    25.88 kB[22m
11:52:04.745 [2mdist/[22m[2massets/[22m[36mNotionAlternative-BTUCtzKQ.js         [39m[1m[2m   12.11 kB[22m[1m[22m[2m │ gzip:   3.22 kB[22m[2m │ map:    24.16 kB[22m
11:52:04.746 [2mdist/[22m[2massets/[22m[36mAIConversationManagement-Dk-OTDDd.js  [39m[1m[2m   21.27 kB[22m[1m[22m[2m │ gzip:   4.69 kB[22m[2m │ map:    40.60 kB[22m
11:52:04.746 [2mdist/[22m[2massets/[22m[36mDevLogVsNotion-CPGjGFEb.js            [39m[1m[2m   25.55 kB[22m[1m[22m[2m │ gzip:   4.76 kB[22m[2m │ map:    52.15 kB[22m
11:52:04.746 [2mdist/[22m[2massets/[22m[36mIssueTrackerBlock-CYEyNztX.js         [39m[1m[2m   48.84 kB[22m[1m[22m[2m │ gzip:  14.33 kB[22m[2m │ map:   182.40 kB[22m
11:52:04.746 [2mdist/[22m[2massets/[22m[36mindex-qm_bkoa6.js                     [39m[1m[33m2,305.50 kB[39m[22m[2m │ gzip: 690.75 kB[22m[2m │ map: 9,834.30 kB[22m
11:52:04.746 [33m
11:52:04.746 (!) Some chunks are larger than 500 kB after minification. Consider:
11:52:04.746 - Using dynamic import() to code-split the application
11:52:04.746 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
11:52:04.746 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
11:52:04.835 > Found 14 files
11:52:04.838 > Analyzing 14 sources
11:52:04.851 > Analyzing completed in 0.013s
11:52:04.853 > Adding source map references
11:52:05.372 > Bundling completed in 0.518s
11:52:05.372 > Bundled 14 files for upload
11:52:05.372 > Bundle ID: 146c9fc0-f1c6-5d4b-b028-85dd87bd3eb7
11:52:05.384 > Optimizing completed in 0.012s
11:52:05.476 error: API request failed
11:52:05.476 
11:52:05.476 Caused by:
11:52:05.476     sentry reported an error: You do not have permission to perform this action. (http status: 403)
11:52:05.482 
11:52:05.483 Add --log-level=[info|debug] or export SENTRY_LOG_LEVEL=[info|debug] to see more output.
11:52:05.483 Please attach the full debug log to all bug reports.
11:52:05.483 [sentry-vite-plugin] Error: An error occurred. Couldn't finish all operations: Error: Command --header sentry-trace:6a749e5cdbc14fd0a61c0acc91dc4bf7-86f1d1fffec0942f-1 --header baggage:sentry-environment=production,sentry-release=3.6.1,sentry-public_key=4c2bae7d9fbc413e8f7385f55c515d51,sentry-trace_id=6a749e5cdbc14fd0a61c0acc91dc4bf7,sentry-sample_rate=1,sentry-transaction=Sentry%20Bundler%20Plugin%20execution,sentry-sampled=true sourcemaps upload --release 2ccdf974f98684f50acfa0aba66f50988b1851a8 /tmp/sentry-bundler-plugin-upload-BeuyVx --ignore node_modules --no-rewrite failed with exit code 1
11:52:05.485     at ChildProcess.<anonymous> (/vercel/path0/node_modules/@sentry/cli/js/helper.js:321:32)
11:52:05.485     at ChildProcess.emit (node:events:519:28)
11:52:05.485     at ChildProcess._handle.onexit (node:internal/child_process:293:12)
11:52:05.493 [32m✓ built in 22.22s[39m
11:52:08.429 Build Completed in /vercel/output [36s]
11:52:08.610 Deploying outputs...
11:52:14.548 Deployment completed
11:52:15.513 Creating build cache...
11:53:05.390 Created build cache: 49.865s
11:53:05.391 Uploading build cache [80.88 MB]
11:53:06.375 Build cache uploaded: 994.682ms