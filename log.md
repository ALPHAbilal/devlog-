20:37:24.989 Running build in Washington, D.C., USA (East) – iad1
20:37:24.989 Build machine configuration: 2 cores, 8 GB
20:37:25.010 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: a0a76cf)
20:37:25.911 Cloning completed: 901.000ms
20:37:26.193 Restored build cache from previous deployment (BmAwoxHgyU7WoBTeBsRr29vVDToy)
20:37:26.793 Running "vercel build"
20:37:27.305 Vercel CLI 48.1.6
20:37:28.417 Installing dependencies...
20:37:29.923 
20:37:29.924 up to date in 1s
20:37:29.925 
20:37:29.925 75 packages are looking for funding
20:37:29.926   run `npm fund` for details
20:37:30.120 
20:37:30.120 > journey-log-compass@0.0.0 build
20:37:30.121 > vite build
20:37:30.121 
20:37:31.115 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
20:37:31.163 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
20:37:31.678 transforming...
20:37:37.724 [32m✓[39m 2364 modules transformed.
20:37:37.729 [31m✗[39m Build failed in 6.57s
20:37:37.730 [31merror during build:
20:37:37.731 [31m[vite]: Rollup failed to resolve import "tailwind-merge" from "/vercel/path0/src/utils/cn.js".
20:37:37.731 This is most likely unintended because it can break your application at runtime.
20:37:37.732 If you do want to externalize this module explicitly add it to
20:37:37.732 `build.rollupOptions.external`[31m
20:37:37.733     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
20:37:37.733     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
20:37:37.733     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.js:90:7)
20:37:37.734     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
20:37:37.734     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
20:37:37.735     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
20:37:37.735     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20866:32
20:37:37.736     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22748:9)
20:37:37.736     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21492:26)
20:37:37.737     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21450:26[39m
20:37:37.828 Error: Command "npm run build" exited with 1