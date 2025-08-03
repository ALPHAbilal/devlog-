[21:50:41.020] Running build in Washington, D.C., USA (East) – iad1
[21:50:41.020] Build machine configuration: 2 cores, 8 GB
[21:50:41.060] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 01d3958)
[21:50:41.764] Cloning completed: 703.000ms
[21:50:41.920] Restored build cache from previous deployment (5SS1V9iGZnHVoLGwBRHeqxG2DsaV)
[21:50:44.063] Running "vercel build"
[21:50:44.549] Vercel CLI 44.6.4
[21:50:45.304] Installing dependencies...
[21:50:46.406] 
[21:50:46.408] up to date in 859ms
[21:50:46.408] 
[21:50:46.409] 75 packages are looking for funding
[21:50:46.409]   run `npm fund` for details
[21:50:46.548] 
[21:50:46.549] > journey-log-compass@0.0.0 build
[21:50:46.549] > vite build
[21:50:46.550] 
[21:50:47.218] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[21:50:47.555] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[21:50:47.627] transforming...
[21:50:51.545] [32m✓[39m 2217 modules transformed.
[21:50:51.550] [31m✗[39m Build failed in 4.00s
[21:50:51.551] [31merror during build:
[21:50:51.552] [31m[vite]: Rollup failed to resolve import "react-syntax-highlighter" from "/vercel/path0/src/components/blocks/IssueTrackerBlock.jsx".
[21:50:51.553] This is most likely unintended because it can break your application at runtime.
[21:50:51.553] If you do want to externalize this module explicitly add it to
[21:50:51.553] `build.rollupOptions.external`[31m
[21:50:51.553]     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
[21:50:51.554]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
[21:50:51.554]     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.mjs:104:9)
[21:50:51.554]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
[21:50:51.555]     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
[21:50:51.555]     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
[21:50:51.555]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20803:32
[21:50:51.555]     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22683:9)
[21:50:51.556]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21429:26)
[21:50:51.556]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[21:50:51.613] Error: Command "npm run build" exited with 1
[21:50:55.481] Exiting build container