[20:20:28.342] Running build in Washington, D.C., USA (East) – iad1
[20:20:28.343] Build machine configuration: 2 cores, 8 GB
[20:20:28.395] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: ca4e117)
[20:20:28.983] Cloning completed: 588.000ms
[20:20:29.189] Restored build cache from previous deployment (ELLqJ4P8kXswv1AGSEFPsU1ciFki)
[20:20:31.328] Running "vercel build"
[20:20:31.803] Vercel CLI 44.3.0
[20:20:32.389] Installing dependencies...
[20:20:34.093] 
[20:20:34.094] added 5 packages in 1s
[20:20:34.094] 
[20:20:34.094] 70 packages are looking for funding
[20:20:34.095]   run `npm fund` for details
[20:20:34.232] 
[20:20:34.232] > journey-log-compass@0.0.0 build
[20:20:34.233] > vite build
[20:20:34.233] 
[20:20:34.549] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[20:20:34.940] transforming...
[20:20:35.837] [32m✓[39m 61 modules transformed.
[20:20:35.843] [31m✗[39m Build failed in 1.07s
[20:20:35.843] [31merror during build:
[20:20:35.843] [31m[vite]: Rollup failed to resolve import "zustand" from "/vercel/path0/src/hooks/useDocumentOrganization.js".
[20:20:35.844] This is most likely unintended because it can break your application at runtime.
[20:20:35.844] If you do want to externalize this module explicitly add it to
[20:20:35.844] `build.rollupOptions.external`[31m
[20:20:35.844]     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
[20:20:35.844]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
[20:20:35.845]     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.mjs:104:9)
[20:20:35.845]     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
[20:20:35.845]     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
[20:20:35.845]     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
[20:20:35.846]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20803:32
[20:20:35.846]     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22683:9)
[20:20:35.846]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21429:26)
[20:20:35.846]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[20:20:35.886] Error: Command "npm run build" exited with 1
[20:20:36.185] 
[20:20:39.072] Exiting build container