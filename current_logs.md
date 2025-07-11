[18:01:55.651] Running build in Washington, D.C., USA (East) – iad1
[18:01:55.655] Build machine configuration: 2 cores, 8 GB
[18:01:55.676] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: fb83711)
[18:01:56.208] Cloning completed: 532.000ms
[18:01:56.323] Restored build cache from previous deployment (9f9Qqi7ZKHMnmZXjNPxEQcJGVjrf)
[18:01:56.732] Running "vercel build"
[18:01:57.158] Vercel CLI 44.3.0
[18:01:57.743] Installing dependencies...
[18:02:00.602] 
[18:02:00.603] up to date in 3s
[18:02:00.603] 
[18:02:00.604] 70 packages are looking for funding
[18:02:00.604]   run `npm fund` for details
[18:02:00.742] 
[18:02:00.742] > journey-log-compass@0.0.0 build
[18:02:00.742] > vite build
[18:02:00.742] 
[18:02:01.049] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[18:02:01.433] transforming...
[18:02:02.483] [32m✓[39m 53 modules transformed.
[18:02:02.486] [31m✗[39m Build failed in 1.39s
[18:02:02.486] [31merror during build:
[18:02:02.486] [31mCould not resolve "../components/LoadingSpinner" from "src/pages/SharedDocument.jsx"[31m
[18:02:02.486] file: [36m/vercel/path0/src/pages/SharedDocument.jsx[31m
[18:02:02.486]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[18:02:02.486]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[18:02:02.486]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21427:24)
[18:02:02.486]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[18:02:02.543] Error: Command "npm run build" exited with 1
[18:02:02.711] 
[18:02:05.679] Exiting build container