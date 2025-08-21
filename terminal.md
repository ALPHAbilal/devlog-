[11:12:58.557] Running build in Washington, D.C., USA (East) – iad1
[11:12:58.557] Build machine configuration: 2 cores, 8 GB
[11:12:58.599] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 34c03ca)
[11:12:59.359] Cloning completed: 759.000ms
[11:12:59.592] Restored build cache from previous deployment (2XLUQvhopHWE3CEZctTWSVkFLJmH)
[11:13:00.233] Running "vercel build"
[11:13:00.632] Vercel CLI 46.0.2
[11:13:01.457] Installing dependencies...
[11:13:02.806] 
[11:13:02.807] up to date in 1s
[11:13:02.808] 
[11:13:02.809] 75 packages are looking for funding
[11:13:02.809]   run `npm fund` for details
[11:13:02.943] 
[11:13:02.943] > journey-log-compass@0.0.0 build
[11:13:02.943] > vite build
[11:13:02.943] 
[11:13:03.584] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[11:13:03.618] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[11:13:04.002] transforming...
[11:13:05.952] [32m✓[39m 244 modules transformed.
[11:13:05.957] [31m✗[39m Build failed in 2.34s
[11:13:05.958] [31merror during build:
[11:13:05.958] [31m[vite:build-import-analysis] [plugin vite:build-import-analysis] src/utils/paginatedBlockLoader.js (50:7): Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.[31m
[11:13:05.959] file: [36m/vercel/path0/src/utils/paginatedBlockLoader.js:50:7[31m
[11:13:05.961] [33m
[11:13:05.961] 48:         cacheKey,
[11:13:05.961] 49:         reason: 'No cached data or TTL expired'
[11:13:05.962] 50:       });
[11:13:05.962]            ^
[11:13:05.962] 51:     }
[11:13:05.962] [31m
[11:13:05.963]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[11:13:05.963]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[11:13:05.963]     at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22029:20)
[11:13:05.964]     at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21091:42)
[11:13:05.964]     at Object.handler (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:45389:16)[39m
[11:13:06.016] Error: Command "npm run build" exited with 1