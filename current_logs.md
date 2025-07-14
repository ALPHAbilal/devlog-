[16:02:53.550] Running build in Washington, D.C., USA (East) – iad1
[16:02:53.551] Build machine configuration: 2 cores, 8 GB
[16:02:53.580] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 190058b)
[16:02:54.170] Cloning completed: 590.000ms
[16:02:54.285] Restored build cache from previous deployment (7VaGX4ebjMJ3iqMrTdawTMdJnPmC)
[16:02:54.685] Running "vercel build"
[16:02:55.100] Vercel CLI 44.3.0
[16:02:55.658] Installing dependencies...
[16:02:56.775] 
[16:02:56.776] up to date in 894ms
[16:02:56.777] 
[16:02:56.777] 70 packages are looking for funding
[16:02:56.777]   run `npm fund` for details
[16:02:56.911] 
[16:02:56.911] > journey-log-compass@0.0.0 build
[16:02:56.912] > vite build
[16:02:56.912] 
[16:02:57.233] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[16:02:57.605] transforming...
[16:02:58.957] [32m✓[39m 73 modules transformed.
[16:02:58.964] [31m✗[39m Build failed in 1.53s
[16:02:58.965] [31merror during build:
[16:02:58.965] [31m[vite]: Rollup failed to resolve import "date-fns" from "/vercel/path0/src/components/ProjectCard.jsx".
[16:02:58.965] This is most likely unintended because it can break your application at runtime.
[16:02:58.966] If you do want to externalize this module explicitly add it to
[16:02:58.966] `build.rollupOptions.external`[31m
[16:02:58.966]     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
[16:02:58.966]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
[16:02:58.967]     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.mjs:104:9)
[16:02:58.967]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
[16:02:58.967]     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
[16:02:58.967]     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
[16:02:58.968]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20803:32
[16:02:58.968]     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22683:9)
[16:02:58.968]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21429:26)
[16:02:58.968]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[16:02:59.008] Error: Command "npm run build" exited with 1
[16:02:59.151] 
[16:03:02.542] Exiting build container