00:33:06.512 Running build in Washington, D.C., USA (East) – iad1
00:33:06.512 Build machine configuration: 2 cores, 8 GB
00:33:06.629 Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: dd7ca4c)
00:33:07.673 Warning: Failed to fetch one or more git submodules
00:33:07.674 Cloning completed: 1.044s
00:33:07.956 Restored build cache from previous deployment (7xkRd2zuvspnk3CmG8pK85c83KQb)
00:33:08.298 Running "vercel build"
00:33:09.325 Vercel CLI 50.11.0
00:33:10.157 Installing dependencies...
00:33:12.030 
00:33:12.030 removed 12 packages in 2s
00:33:12.031 
00:33:12.031 190 packages are looking for funding
00:33:12.031   run `npm fund` for details
00:33:12.169 
00:33:12.170 > journey-log-compass@0.0.0 build
00:33:12.170 > vite build
00:33:12.170 
00:33:12.852 [36mvite v6.4.1 [32mbuilding for production...[36m[39m
00:33:12.893 [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
00:33:13.306 transforming...
00:33:16.692 [32m✓[39m 1338 modules transformed.
00:33:16.695 [31m✗[39m Build failed in 3.81s
00:33:16.696 [31merror during build:
00:33:16.696 [31mCould not resolve "./ParticleField" from "src/components/HeroSectionV3.jsx"[31m
00:33:16.696 file: [36m/vercel/path0/src/components/HeroSectionV3.jsx[31m
00:33:16.697     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
00:33:16.697     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
00:33:16.697     at ModuleLoader.handleInvalidResolvedId (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21661:24)
00:33:16.697     at file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:21621:26[39m
00:33:16.758 Error: Command "npm run build" exited with 1