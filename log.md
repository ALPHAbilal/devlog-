18:09:47.032 Running build in Washington, D.C., USA (East) – iad1
18:09:47.032 Build machine configuration: 2 cores, 8 GB
18:09:47.190 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 0258820)
18:09:48.134 Warning: Failed to fetch one or more git submodules
18:09:48.135 Cloning completed: 944.000ms
18:09:48.667 Restored build cache from previous deployment (3xj5Gju4ibejfDoKKhgWpv24XqAv)
18:09:49.496 Running "vercel build"
18:09:50.513 Vercel CLI 48.8.2
18:09:51.497 Installing dependencies...
18:09:53.903 
18:09:53.904 up to date in 1s
18:09:53.905 
18:09:53.905 76 packages are looking for funding
18:09:53.905   run `npm fund` for details
18:09:54.059 
18:09:54.060 > journey-log-compass@0.0.0 build
18:09:54.060 > vite build
18:09:54.060 
18:09:54.766 [36mvite v6.3.5 [32mbuilding for production...[36m[39m
18:09:54.808 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
18:09:55.193 transforming...
18:10:00.578 [32m✓[39m 2945 modules transformed.
18:10:00.584 [31m✗[39m Build failed in 5.78s
18:10:00.584 [31merror during build:
18:10:00.585 [31m[vite]: Rollup failed to resolve import "@radix-ui/react-popover" from "/vercel/path0/src/components/blocks/FileTreeBlock.jsx".
18:10:00.585 This is most likely unintended because it can break your application at runtime.
18:10:00.585 If you do want to externalize this module explicitly add it to
18:10:00.585 `build.rollupOptions.external`[31m
18:10:00.585     at viteLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46345:15)
18:10:00.586     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46403:18
18:10:00.586     at onwarn (file:///vercel/path0/node_modules/@vitejs/plugin-react/dist/index.js:90:7)
18:10:00.586     at file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46401:7
18:10:00.586     at onRollupLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46393:5)
18:10:00.587     at onLog (file:///vercel/path0/node_modules/vite/dist/node/chunks/dep-DBxKXgDP.js:46043:7)
18:10:00.587     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:20866:32
18:10:00.587     at Object.logger [as onLog] (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:22748:9)
18:10:00.587     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21492:26)
18:10:00.588     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21450:26[39m
18:10:00.651 Error: Command "npm run build" exited with 1