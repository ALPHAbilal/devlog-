[22:16:14.408] Running build in Washington, D.C., USA (East) – iad1
[22:16:14.409] Build machine configuration: 2 cores, 8 GB
[22:16:14.454] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 6bcf0c1)
[22:16:15.185] Cloning completed: 730.000ms
[22:16:15.322] Restored build cache from previous deployment (8LYMTiuhNkNpUqcdGtYx2pF6YDdq)
[22:16:17.294] Running "vercel build"
[22:16:17.785] Vercel CLI 44.5.0
[22:16:18.399] Installing dependencies...
[22:16:19.657] 
[22:16:19.658] up to date in 896ms
[22:16:19.659] 
[22:16:19.659] 75 packages are looking for funding
[22:16:19.660]   run `npm fund` for details
[22:16:19.802] 
[22:16:19.803] > journey-log-compass@0.0.0 build
[22:16:19.803] > vite build
[22:16:19.804] 
[22:16:20.507] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[22:16:20.577] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[22:16:20.943] transforming...
[22:16:22.157] [33m[plugin vite:esbuild] src/components/VirtualizedGrid.jsx: [33mDuplicate "onContextMenu" attribute in JSX element[33m
[22:16:22.158] 314|                onSelect={onSelectDocument}
[22:16:22.158] 315|                selectionMode={selectionMode}
[22:16:22.159] 316|                onContextMenu={onContextMenu}
[22:16:22.159]    |                ^
[22:16:22.159] 317|              />
[22:16:22.160] 318|            </div>
[22:16:22.160] [39m
[22:16:27.709] [32m✓[39m 2464 modules transformed.
[22:16:27.711] [31m✗[39m Build failed in 7.14s
[22:16:27.712] [31merror during build:
[22:16:27.713] [31msrc/pages/Dashboard.jsx (19:27): "usePullToRefresh" is not exported by "src/hooks/useTouchGestures.js", imported by "src/pages/Dashboard.jsx".[31m
[22:16:27.713] file: [36m/vercel/path0/src/pages/Dashboard.jsx:19:27[31m
[22:16:27.714] [33m
[22:16:27.714] 17: import MobileBottomSheet from '../components/MobileBottomSheet';
[22:16:27.714] 18: import MobileContextMenu from '../components/MobileContextMenu';
[22:16:27.715] 19: import { useTouchGestures, usePullToRefresh } from '../hooks/useTouchGestures';
[22:16:27.715]                                ^
[22:16:27.715] 20: import { Plus, User, Settings, LogOut, Grid3X3, Menu, FileText, Folder, ChevronRight, ChevronLeft, MoreVertical } fro...
[22:16:27.716] 21: import storageWrapper, { deleteEntry } from '../utils/storage/storageWrapper';
[22:16:27.716] [31m
[22:16:27.717]     at getRollupError (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
[22:16:27.717]     at error (file:///vercel/path0/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
[22:16:27.717]     at Module.error (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:16815:16)
[22:16:27.717]     at Module.traceVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:17264:29)
[22:16:27.718]     at ModuleScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:14913:39)
[22:16:27.718]     at FunctionScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5633:38)
[22:16:27.719]     at FunctionBodyScope.findVariable (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5633:38)
[22:16:27.719]     at Identifier.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:5407:40)
[22:16:27.719]     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:2798:23)
[22:16:27.720]     at CallExpression.bind (file:///vercel/path0/node_modules/rollup/dist/es/shared/node-entry.js:11998:15)[39m
[22:16:27.785] Error: Command "npm run build" exited with 1
[22:16:27.992] 
[22:16:30.800] Exiting build container