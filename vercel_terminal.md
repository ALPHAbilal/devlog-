[17:05:34.475] Running build in Washington, D.C., USA (East) – iad1
[17:05:34.476] Build machine configuration: 2 cores, 8 GB
[17:05:34.492] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 3c72ee7)
[17:05:35.288] Cloning completed: 796.000ms
[17:05:35.467] Restored build cache from previous deployment (BGAQUg92pyUGfgp1QsLJDXuqDQcJ)
[17:05:37.684] Running "vercel build"
[17:05:38.254] Vercel CLI 44.5.0
[17:05:38.888] Installing dependencies...
[17:05:40.258] 
[17:05:40.258] up to date in 1s
[17:05:40.259] 
[17:05:40.259] 75 packages are looking for funding
[17:05:40.259]   run `npm fund` for details
[17:05:40.401] 
[17:05:40.401] > journey-log-compass@0.0.0 build
[17:05:40.401] > vite build
[17:05:40.402] 
[17:05:41.060] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[17:05:41.106] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[17:05:41.464] transforming...
[17:05:42.790] [32m✓[39m 102 modules transformed.
[17:05:42.800] [31m✗[39m Build failed in 1.70s
[17:05:42.804] [31merror during build:
[17:05:42.804] [31m[vite:css] [postcss] /vercel/path0/src/styles/auth-elite.css:816:3: Unexpected }[31m
[17:05:42.804] file: [36m/vercel/path0/src/styles/auth-elite.css:816:2[31m
[17:05:42.805]     at Input.error (/vercel/path0/node_modules/postcss/lib/input.js:135:16)
[17:05:42.805]     at Parser.unexpectedClose (/vercel/path0/node_modules/postcss/lib/parser.js:587:22)
[17:05:42.805]     at Parser.end (/vercel/path0/node_modules/postcss/lib/parser.js:330:12)
[17:05:42.806]     at Parser.parse (/vercel/path0/node_modules/postcss/lib/parser.js:456:16)
[17:05:42.806]     at parse (/vercel/path0/node_modules/postcss/lib/parse.js:11:12)
[17:05:42.806]     at new LazyResult (/vercel/path0/node_modules/postcss/lib/lazy-result.js:165:16)
[17:05:42.806]     at Processor.process (/vercel/path0/node_modules/postcss/lib/processor.js:53:14)
[17:05:42.807]     at runPostCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43824:52)
[17:05:42.807]     at async compilePostCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43794:18)
[17:05:42.807]     at async compileCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43649:27)[39m
[17:05:42.856] Error: Command "npm run build" exited with 1
[17:05:43.066] 
[17:05:47.241] Exiting build container