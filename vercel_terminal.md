[12:57:32.833] Running build in Washington, D.C., USA (East) – iad1
[12:57:32.833] Build machine configuration: 2 cores, 8 GB
[12:57:32.849] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 0b5fea2)
[12:57:33.511] Cloning completed: 662.000ms
[12:57:33.702] Restored build cache from previous deployment (AXoN3hUmNiRE6gmohUWt1nMTXi8p)
[12:57:35.512] Running "vercel build"
[12:57:35.974] Vercel CLI 44.5.0
[12:57:36.563] Installing dependencies...
[12:57:37.594] 
[12:57:37.595] up to date in 798ms
[12:57:37.595] 
[12:57:37.596] 75 packages are looking for funding
[12:57:37.596]   run `npm fund` for details
[12:57:37.732] 
[12:57:37.733] > journey-log-compass@0.0.0 build
[12:57:37.733] > vite build
[12:57:37.733] 
[12:57:38.389] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:57:38.428] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[12:57:38.789] transforming...
[12:57:43.196] [32m✓[39m 2414 modules transformed.
[12:57:43.202] [31m✗[39m Build failed in 4.78s
[12:57:43.202] [31merror during build:
[12:57:43.202] [31m[vite]: Rollup failed to resolve import "gsap" from "/vercel/path0/src/components/HeroBackgroundAnimation/MemoryErosionEnhanced.jsx".
[12:57:43.202] This is most likely unintended because it can break your application at runtime.
[12:57:43.203] If you do want to externalize this module explicitly add it to
[12:57:43.203] `build.rollupOptions.external`[31m
[12:57:43.203]     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
[12:57:43.203]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
[12:57:43.205]     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.mjs:104:9)
[12:57:43.205]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
[12:57:43.206]     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
[12:57:43.206]     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
[12:57:43.206]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20803:32
[12:57:43.206]     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22683:9)
[12:57:43.206]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21429:26)
[12:57:43.206]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[12:57:43.270] Error: Command "npm run build" exited with 1
[12:57:43.494] 
[12:57:46.573] Exiting build container