[13:16:11.774] Running build in Washington, D.C., USA (East) – iad1
[13:16:11.775] Build machine configuration: 2 cores, 8 GB
[13:16:11.809] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 293a15d)
[13:16:12.474] Cloning completed: 664.000ms
[13:16:12.914] Restored build cache from previous deployment (AXoN3hUmNiRE6gmohUWt1nMTXi8p)
[13:16:14.910] Running "vercel build"
[13:16:15.392] Vercel CLI 44.5.0
[13:16:16.006] Installing dependencies...
[13:16:17.606] 
[13:16:17.607] added 1 package in 1s
[13:16:17.608] 
[13:16:17.608] 75 packages are looking for funding
[13:16:17.608]   run `npm fund` for details
[13:16:18.733] 
[13:16:18.733] > journey-log-compass@0.0.0 build
[13:16:18.733] > vite build
[13:16:18.733] 
[13:16:19.433] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[13:16:19.474] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[13:16:19.851] transforming...
[13:16:24.377] [32m✓[39m 2442 modules transformed.
[13:16:24.379] [31m✗[39m Build failed in 4.91s
[13:16:24.380] [31merror during build:
[13:16:24.380] [31mCould not resolve "./MemoryErosion.css" from "src/components/HeroBackgroundAnimation/MemoryErosionEnhanced.jsx"[31m
[13:16:24.381] file: [36m/vercel/path0/src/components/HeroBackgroundAnimation/MemoryErosionEnhanced.jsx[31m
[13:16:24.381]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[13:16:24.381]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[13:16:24.382]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21427:24)
[13:16:24.382]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21387:26[39m
[13:16:24.447] Error: Command "npm run build" exited with 1
[13:16:24.662] 
[13:16:27.405] Exiting build container