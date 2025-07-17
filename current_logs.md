[11:53:26.720] Running build in Washington, D.C., USA (East) – iad1
[11:53:26.721] Build machine configuration: 2 cores, 8 GB
[11:53:26.755] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: af70437)
[11:53:27.472] Cloning completed: 717.000ms
[11:53:27.687] Restored build cache from previous deployment (BKagjUSorkGvGURfUHSig4vL5sPz)
[11:53:30.591] Running "vercel build"
[11:53:31.472] Vercel CLI 44.4.3
[11:53:32.381] Installing dependencies...
[11:53:34.143] 
[11:53:34.145] up to date in 1s
[11:53:34.146] 
[11:53:34.147] 70 packages are looking for funding
[11:53:34.148]   run `npm fund` for details
[11:53:34.345] 
[11:53:34.346] > journey-log-compass@0.0.0 build
[11:53:34.346] > vite build
[11:53:34.347] 
[11:53:35.022] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[11:53:35.616] transforming...
[11:53:36.486] [32m✓[39m 58 modules transformed.
[11:53:36.490] [31m✗[39m Build failed in 1.42s
[11:53:36.493] [31merror during build:
[11:53:36.494] [31m[vite:esbuild] Transform failed with 1 error:
[11:53:36.494] /vercel/path0/src/components/ExpandedViewEnhanced.jsx:1088:6: ERROR: Expected ")" but found "{"[31m
[11:53:36.495] file: [36m/vercel/path0/src/components/ExpandedViewEnhanced.jsx:1088:6[31m
[11:53:36.495] [33m
[11:53:36.496] [33mExpected ")" but found "{"[33m
[11:53:36.499] 1086|        </div>
[11:53:36.499] 1087|  
[11:53:36.500] 1088|        {/* Delete Confirmation Modal */}
[11:53:36.500]    |        ^
[11:53:36.501] 1089|        {showDeleteConfirm && (
[11:53:36.501] 1090|          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
[11:53:36.502] [31m
[11:53:36.502]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[11:53:36.503]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[11:53:36.503]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[11:53:36.504]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[11:53:36.504]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[11:53:36.505]     at Socket.emit (node:events:518:28)
[11:53:36.506]     at addChunk (node:internal/streams/readable:561:12)
[11:53:36.506]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[11:53:36.507]     at Readable.push (node:internal/streams/readable:392:5)
[11:53:36.507]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[11:53:36.579] Error: Command "npm run build" exited with 1
[11:53:36.991] 
[11:53:39.868] Exiting build container