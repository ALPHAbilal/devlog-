[12:31:06.901] Running build in Washington, D.C., USA (East) – iad1
[12:31:06.902] Build machine configuration: 2 cores, 8 GB
[12:31:06.937] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 5f10d2c)
[12:31:07.609] Cloning completed: 671.000ms
[12:31:07.747] Restored build cache from previous deployment (H3hECTUVGfpg69FhSRkQVpnpEL7t)
[12:31:09.758] Running "vercel build"
[12:31:10.807] Vercel CLI 44.5.0
[12:31:11.402] Installing dependencies...
[12:31:12.598] 
[12:31:12.598] up to date in 892ms
[12:31:12.598] 
[12:31:12.598] 75 packages are looking for funding
[12:31:12.599]   run `npm fund` for details
[12:31:12.736] 
[12:31:12.736] > journey-log-compass@0.0.0 build
[12:31:12.736] > vite build
[12:31:12.736] 
[12:31:13.398] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:31:13.442] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[12:31:13.804] transforming...
[12:31:18.115] [31mUnable to resolve `@import "./styles/settings-minimal.css"` from /vercel/path0/src[39m
[12:31:18.130] [32m✓[39m 2433 modules transformed.
[12:31:18.134] [31m✗[39m Build failed in 4.70s
[12:31:18.134] [31merror during build:
[12:31:18.135] [31m[vite:css] [postcss] ENOENT: no such file or directory, open './styles/settings-minimal.css'[31m
[12:31:18.135] file: [36m/vercel/path0/src/index.css:undefined:NaN[31m
[12:31:18.135]     at async open (node:internal/fs/promises:639:25)
[12:31:18.136]     at async Object.readFile (node:internal/fs/promises:1243:14)
[12:31:18.136]     at async Object.load (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43727:25)
[12:31:18.137]     at async loadImportContent (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-AiMcmC_f.js:673:19)
[12:31:18.137]     at async Promise.all (index 0)
[12:31:18.137]     at async resolveImportId (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-AiMcmC_f.js:629:27)
[12:31:18.137]     at async parseStyles$1 (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-AiMcmC_f.js:537:5)
[12:31:18.138]     at async Object.Once (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-AiMcmC_f.js:794:22)
[12:31:18.138]     at async LazyResult.runAsync (/vercel/path0/node_modules/postcss/lib/lazy-result.js:293:11)
[12:31:18.139]     at async runPostCSS (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:43824:21)[39m
[12:31:18.199] Error: Command "npm run build" exited with 1
[12:31:18.392] 
[12:31:21.243] Exiting build container