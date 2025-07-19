[16:11:03.127] Running build in Washington, D.C., USA (East) – iad1
[16:11:03.127] Build machine configuration: 2 cores, 8 GB
[16:11:03.143] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: cad6e59)
[16:11:03.722] Cloning completed: 579.000ms
[16:11:03.857] Restored build cache from previous deployment (Bpuc1XrHMMmx3uzuCqoaXJouD3w6)
[16:11:06.031] Running "vercel build"
[16:11:06.522] Vercel CLI 44.4.3
[16:11:07.153] Installing dependencies...
[16:11:08.258] 
[16:11:08.259] up to date in 864ms
[16:11:08.260] 
[16:11:08.260] 70 packages are looking for funding
[16:11:08.260]   run `npm fund` for details
[16:11:08.403] 
[16:11:08.404] > journey-log-compass@0.0.0 build
[16:11:08.404] > vite build
[16:11:08.404] 
[16:11:08.734] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[16:11:09.158] transforming...
[16:11:09.611] [32m✓[39m 33 modules transformed.
[16:11:09.612] [31m✗[39m Build failed in 521ms
[16:11:09.612] [31merror during build:
[16:11:09.613] [31m[vite:esbuild] Transform failed with 1 error:
[16:11:09.613] /vercel/path0/src/pages/Landing.jsx:47:57: ERROR: Expected "}" but found "s"[31m
[16:11:09.613] file: [36m/vercel/path0/src/pages/Landing.jsx:47:57[31m
[16:11:09.614] [33m
[16:11:09.614] [33mExpected "}" but found "s"[33m
[16:11:09.614] 45 |        icon: <Search className="text-accent-green" size={32} />,
[16:11:09.615] 46 |        title: 'Find anything in 2 seconds',
[16:11:09.615] 47 |        description: 'Remember that fix from last year? It's one search away.'
[16:11:09.615]    |                                                           ^
[16:11:09.616] 48 |      },
[16:11:09.616] 49 |      {
[16:11:09.616] [31m
[16:11:09.616]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[16:11:09.617]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[16:11:09.617]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[16:11:09.617]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[16:11:09.618]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[16:11:09.618]     at Socket.emit (node:events:518:28)
[16:11:09.618]     at addChunk (node:internal/streams/readable:561:12)
[16:11:09.619]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[16:11:09.619]     at Readable.push (node:internal/streams/readable:392:5)
[16:11:09.619]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[16:11:09.654] Error: Command "npm run build" exited with 1
[16:11:09.912] 
[16:11:12.733] Exiting build container