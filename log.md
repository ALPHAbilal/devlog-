12:03:43.445 Running build in Washington, D.C., USA (East) – iad1
12:03:43.455 Build machine configuration: 2 cores, 8 GB
12:03:43.551 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 5d35762)
12:03:44.745 Cloning completed: 1.193s
12:03:44.908 Restored build cache from previous deployment (YCUfwNyj8vPgBoTiwkZ5b8RhrVwh)
12:03:45.322 Running "vercel build"
12:03:45.701 Vercel CLI 48.2.9
12:03:46.484 Installing dependencies...
12:03:47.497 
12:03:47.499 up to date in 780ms
12:03:47.499 
12:03:47.500 75 packages are looking for funding
12:03:47.500   run `npm fund` for details
12:03:47.631 
12:03:47.632 > journey-log-compass@0.0.0 build
12:03:47.632 > vite build
12:03:47.632 
12:03:48.275 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
12:03:48.321 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
12:03:48.669 transforming...
12:03:49.761 [32m✓[39m 91 modules transformed.
12:03:49.766 [31m✗[39m Build failed in 1.45s
12:03:49.767 [31merror during build:
12:03:49.767 [31m[vite]: Rollup failed to resolve import "react-error-boundary" from "/vercel/path0/src/pages/SettingsRedesign.jsx".
12:03:49.767 This is most likely unintended because it can break your application at runtime.
12:03:49.768 If you do want to externalize this module explicitly add it to
12:03:49.768 `build.rollupOptions.external`[31m
12:03:49.768     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
12:03:49.768     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
12:03:49.768     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.js:90:7)
12:03:49.769     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
12:03:49.769     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
12:03:49.769     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
12:03:49.769     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20866:32
12:03:49.770     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22748:9)
12:03:49.770     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21492:26)
12:03:49.770     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21450:26[39m
12:03:49.822 Error: Command "npm run build" exited with 1