[14:58:34.057] Running build in Washington, D.C., USA (East) – iad1
[14:58:34.058] Build machine configuration: 2 cores, 8 GB
[14:58:34.073] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: e18ec96)
[14:58:34.777] Cloning completed: 703.000ms
[14:58:34.937] Restored build cache from previous deployment (7mpaKJgPoQmrXhuPLUtsazHV4pzK)
[14:58:35.916] Running "vercel build"
[14:58:37.180] Vercel CLI 44.5.0
[14:58:37.922] Installing dependencies...
[14:58:40.427] 
[14:58:40.428] up to date in 1s
[14:58:40.429] 
[14:58:40.429] 73 packages are looking for funding
[14:58:40.430]   run `npm fund` for details
[14:58:40.576] 
[14:58:40.577] > journey-log-compass@0.0.0 build
[14:58:40.577] > vite build
[14:58:40.577] 
[14:58:41.884] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[14:58:41.932] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[14:58:42.312] transforming...
[14:58:50.999] [32m✓[39m 2453 modules transformed.
[14:58:52.159] rendering chunks...
[14:58:52.643] [33m[plugin vite:reporter] 
[14:58:52.644] (!) /vercel/path0/src/utils/globalAutoSave.js is dynamically imported by /vercel/path0/src/App.jsx, /vercel/path0/src/App.jsx but also statically imported by /vercel/path0/src/hooks/useAutoSave.js, /vercel/path0/src/main.jsx, dynamic import will not move module into another chunk.
[14:58:52.644] [39m
[14:58:52.645] [33m[plugin vite:reporter] 
[14:58:52.645] (!) /vercel/path0/src/utils/storage/IndexedDBAdapter.js is dynamically imported by /vercel/path0/src/utils/storage/SupabaseAdapter.js but also statically imported by /vercel/path0/src/pages/Dashboard.jsx, /vercel/path0/src/utils/storage/storageWrapper.js, dynamic import will not move module into another chunk.
[14:58:52.646] [39m
[14:58:54.076] [31m✗[39m Build failed in 12.15s
[14:58:54.077] [31merror during build:
[14:58:54.078] [31m[vite:css-post] [lightningcss minify] Cannot find package 'lightningcss' imported from /vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js[31m
[14:58:54.078] Error [PLUGIN_ERROR]: [lightningcss minify] Cannot find package 'lightningcss' imported from /vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js
[14:58:54.078]     at Object.getPackageJSONURL (node:internal/modules/package_json_reader:256:9)
[14:58:54.078]     at packageResolve (node:internal/modules/esm/resolve:768:81)
[14:58:54.079]     at moduleResolve (node:internal/modules/esm/resolve:854:18)
[14:58:54.079]     at defaultResolve (node:internal/modules/esm/resolve:984:11)
[14:58:54.079]     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:780:12)
[14:58:54.079]     at #cachedDefaultResolve (node:internal/modules/esm/loader:704:25)
[14:58:54.079]     at ModuleLoader.resolve (node:internal/modules/esm/loader:687:38)
[14:58:54.079]     at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:305:38)
[14:58:54.080]     at onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:643:36)
[14:58:54.080]     at TracingChannel.tracePromise (node:diagnostics_channel:344:14)[39m
[14:58:54.134] Error: Command "npm run build" exited with 1
[14:58:54.322] 
[14:58:57.242] Exiting build container