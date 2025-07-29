[16:53:40.293] Running build in Washington, D.C., USA (East) – iad1
[16:53:40.294] Build machine configuration: 2 cores, 8 GB
[16:53:40.313] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: dbc3a27)
[16:53:41.504] Cloning completed: 1.190s
[16:53:41.934] Restored build cache from previous deployment (BGAQUg92pyUGfgp1QsLJDXuqDQcJ)
[16:53:43.923] Running "vercel build"
[16:53:44.419] Vercel CLI 44.5.0
[16:53:45.461] Installing dependencies...
[16:53:48.075] 
[16:53:48.076] up to date in 2s
[16:53:48.076] 
[16:53:48.077] 75 packages are looking for funding
[16:53:48.077]   run `npm fund` for details
[16:53:48.222] 
[16:53:48.222] > journey-log-compass@0.0.0 build
[16:53:48.222] > vite build
[16:53:48.222] 
[16:53:48.890] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[16:53:48.933] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[16:53:49.304] transforming...
[16:53:51.083] [32m✓[39m 120 modules transformed.
[16:53:51.088] [31m✗[39m Build failed in 2.16s
[16:53:51.088] [31merror during build:
[16:53:51.089] [31m[vite:css] [postcss] /vercel/path0/src/styles/auth-elite.css:775:1: Unexpected }[31m
[16:53:51.089] file: [36m/vercel/path0/src/styles/auth-elite.css:775:0[31m
[16:53:51.089]     at Input.error (/vercel/path0/node_modules/postcss/lib/input.js:135:16)
[16:53:51.089]     at Parser.unexpectedClose (/vercel/path0/node_modules/postcss/lib/parser.js:587:22)
[16:53:51.089]     at Parser.end (/vercel/path0/node_modules/postcss/lib/parser.js:330:12)
[16:53:51.090]     at Parser.parse (/vercel/path0/node_modules/postcss/lib/parser.js:456:16)
[16:53:51.090]     at parse (/vercel/path0/node_modules/postcss/lib/parse.js:11:12)
[16:53:51.090]     at new LazyResult (/vercel/path0/node_modules/postcss/lib/lazy-result.js:165:16)
[16:53:51.090]     at Processor.process (/vercel/path0/node_modules/postcss/lib/processor.js:53:14)
[16:53:51.090]     at runPostCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43824:52)
[16:53:51.091]     at async compilePostCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43794:18)
[16:53:51.091]     at async compileCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43649:27)[39m
[16:53:51.146] Error: Command "npm run build" exited with 1
[16:53:51.358] 
[16:53:54.128] Exiting build container