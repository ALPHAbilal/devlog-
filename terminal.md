[14:38:53.987] Running build in Washington, D.C., USA (East) – iad1
[14:38:53.988] Build machine configuration: 2 cores, 8 GB
[14:38:54.011] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: bb50591)
[14:38:54.959] Cloning completed: 948.000ms
[14:38:55.133] Restored build cache from previous deployment (9Z92gxNkwKL7YWuLM6ftHdRnCUWJ)
[14:38:58.404] Running "vercel build"
[14:38:58.961] Vercel CLI 45.0.10
[14:38:59.909] Installing dependencies...
[14:39:01.422] 
[14:39:01.423] added 2 packages in 1s
[14:39:01.423] 
[14:39:01.424] 75 packages are looking for funding
[14:39:01.424]   run `npm fund` for details
[14:39:01.565] 
[14:39:01.565] > journey-log-compass@0.0.0 build
[14:39:01.566] > vite build
[14:39:01.566] 
[14:39:02.341] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[14:39:02.375] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[14:39:02.740] transforming...
[14:39:03.549] [32m✓[39m 77 modules transformed.
[14:39:03.552] [31m✗[39m Build failed in 1.18s
[14:39:03.552] [31merror during build:
[14:39:03.553] [31mCould not resolve "./utils/globalAutoSave" from "src/App.jsx"[31m
[14:39:03.553] file: [36m/vercel/path0/src/App.jsx[31m
[14:39:03.553]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[14:39:03.554]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[14:39:03.554]     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21490:24)
[14:39:03.554]     at ModuleLoader.resolveDynamicImport (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21550:58)
[14:39:03.555]     at async file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21438:32[39m
[14:39:03.603] Error: Command "npm run build" exited with 1