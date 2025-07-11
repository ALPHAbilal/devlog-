[16:54:00.117] Running build in Washington, D.C., USA (East) – iad1
[16:54:00.118] Build machine configuration: 2 cores, 8 GB
[16:54:00.141] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: a1f4f4f)
[16:54:00.713] Cloning completed: 571.000ms
[16:54:00.823] Restored build cache from previous deployment (9f9Qqi7ZKHMnmZXjNPxEQcJGVjrf)
[16:54:01.187] Running "vercel build"
[16:54:01.619] Vercel CLI 44.3.0
[16:54:02.211] Installing dependencies...
[16:54:04.819] 
[16:54:04.820] up to date in 2s
[16:54:04.821] 
[16:54:04.822] 70 packages are looking for funding
[16:54:04.822]   run `npm fund` for details
[16:54:04.968] 
[16:54:04.969] > journey-log-compass@0.0.0 build
[16:54:04.969] > vite build
[16:54:04.970] 
[16:54:05.284] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[16:54:05.370] transforming...
[16:54:05.791] [32m✓[39m 10 modules transformed.
[16:54:05.800] [31m✗[39m Build failed in 485ms
[16:54:05.800] [31merror during build:
[16:54:05.801] [31m[vite:build-import-analysis] [plugin vite:build-import-analysis] src/hooks/useToast.js (39:28): Failed to parse source for import analysis because the content contains invalid JS syntax. If you are using JSX, make sure to name the file with the .jsx or .tsx extension.[31m
[16:54:05.801] file: [36m/vercel/path0/src/hooks/useToast.js:39:28[31m
[16:54:05.801] [33m
[16:54:05.801] 37:       {children}
[16:54:05.802] 38:       <ToastContainer toasts={toasts} onDismiss={dismissToast} />
[16:54:05.802] 39:     </ToastContext.Provider>
[16:54:05.802]                                 ^
[16:54:05.802] 40:   );
[16:54:05.803] 41: }
[16:54:05.803] [31m
[16:54:05.803]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[16:54:05.803]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[16:54:05.804]     at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21966:20)
[16:54:05.804]     at Object.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21028:42)
[16:54:05.804]     at Object.handler (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:45389:16)[39m
[16:54:05.857] Error: Command "npm run build" exited with 1
[16:54:06.049] 
[16:54:09.027] Exiting build container