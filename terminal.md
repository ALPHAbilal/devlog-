[14:30:33.528] Running build in Washington, D.C., USA (East) – iad1
[14:30:33.529] Build machine configuration: 2 cores, 8 GB
[14:30:33.564] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 4a838a7)
[14:30:34.372] Cloning completed: 808.000ms
[14:30:34.570] Restored build cache from previous deployment (9Z92gxNkwKL7YWuLM6ftHdRnCUWJ)
[14:30:37.646] Running "vercel build"
[14:30:38.063] Vercel CLI 45.0.10
[14:30:38.899] Installing dependencies...
[14:30:40.576] 
[14:30:40.577] added 2 packages in 1s
[14:30:40.577] 
[14:30:40.577] 75 packages are looking for funding
[14:30:40.578]   run `npm fund` for details
[14:30:40.723] 
[14:30:40.724] > journey-log-compass@0.0.0 build
[14:30:40.724] > vite build
[14:30:40.725] 
[14:30:41.379] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[14:30:41.413] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[14:30:41.809] transforming...
[14:30:42.181] [32m✓[39m 6 modules transformed.
[14:30:42.185] [31m✗[39m Build failed in 775ms
[14:30:42.186] [31merror during build:
[14:30:42.186] [31mCould not resolve "./utils/globalAutoSave" from "src/main.jsx"[31m
[14:30:42.186] file: [36m/vercel/path0/src/main.jsx[31m
[14:30:42.187]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[14:30:42.187]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[14:30:42.187]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21490:24)
[14:30:42.188]     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21450:26[39m
[14:30:42.237] Error: Command "npm run build" exited with 1