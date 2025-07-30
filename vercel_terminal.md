[22:08:32.206] Running build in Washington, D.C., USA (East) – iad1
[22:08:32.206] Build machine configuration: 2 cores, 8 GB
[22:08:32.260] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 9eb706b)
[22:08:32.920] Cloning completed: 660.000ms
[22:08:33.091] Restored build cache from previous deployment (F2gC45EzKFJMKSBUnVhXxZN33gUq)
[22:08:33.657] Running "vercel build"
[22:08:34.766] Vercel CLI 44.6.4
[22:08:35.974] Installing dependencies...
[22:08:37.797] 
[22:08:37.799] up to date in 1s
[22:08:37.800] 
[22:08:37.801] 75 packages are looking for funding
[22:08:37.801]   run `npm fund` for details
[22:08:37.948] 
[22:08:37.949] > journey-log-compass@0.0.0 build
[22:08:37.949] > vite build
[22:08:37.949] 
[22:08:39.603] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[22:08:39.650] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[22:08:40.024] transforming...
[22:08:41.674] [32m✓[39m 116 modules transformed.
[22:08:41.679] [31m✗[39m Build failed in 2.03s
[22:08:41.680] [31merror during build:
[22:08:41.682] [31m[vite]: Rollup failed to resolve import "next/router" from "/vercel/path0/src/pages/settings/api.tsx".
[22:08:41.682] This is most likely unintended because it can break your application at runtime.
[22:08:41.682] If you do want to externalize this module explicitly add it to
[22:08:41.683] `build.rollupOptions.external`[31m
[22:08:41.683]     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
[22:08:41.683]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
[22:08:41.684]     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.mjs:104:9)
[22:08:41.684]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
[22:08:41.684]     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
[22:08:41.685]     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
[22:08:41.685]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20803:32
[22:08:41.685]     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22683:9)
[22:08:41.686]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21429:26)
[22:08:41.686]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[22:08:41.737] Error: Command "npm run build" exited with 1
[22:08:41.989] 
[22:08:44.988] Exiting build container