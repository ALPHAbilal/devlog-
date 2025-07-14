[20:46:58.863] Running build in Washington, D.C., USA (East) – iad1
[20:46:58.863] Build machine configuration: 2 cores, 8 GB
[20:46:58.877] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: 76109f1)
[20:46:59.413] Cloning completed: 535.000ms
[20:46:59.545] Restored build cache from previous deployment (D2SW1aAwfeHUtUi6xAyXHjsJa38h)
[20:46:59.919] Running "vercel build"
[20:47:00.863] Vercel CLI 44.3.0
[20:47:02.199] Installing dependencies...
[20:47:03.803] 
[20:47:03.805] up to date in 1s
[20:47:03.805] 
[20:47:03.805] 70 packages are looking for funding
[20:47:03.806]   run `npm fund` for details
[20:47:03.974] 
[20:47:03.974] > journey-log-compass@0.0.0 build
[20:47:03.974] > vite build
[20:47:03.975] 
[20:47:04.304] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[20:47:04.715] transforming...
[20:47:05.019] [32m✓[39m 26 modules transformed.
[20:47:05.021] [31m✗[39m Build failed in 685ms
[20:47:05.021] [31merror during build:
[20:47:05.022] [31m[vite:esbuild] Transform failed with 1 error:
[20:47:05.022] /vercel/path0/src/pages/Dashboard.jsx:702:32: ERROR: "await" can only be used inside an "async" function[31m
[20:47:05.022] file: [36m/vercel/path0/src/pages/Dashboard.jsx:702:32[31m
[20:47:05.023] [33m
[20:47:05.023] [33m"await" can only be used inside an "async" function[33m
[20:47:05.023] 700|        
[20:47:05.023] 701|        // Refresh projects to update counts
[20:47:05.024] 702|        const refreshedProjects = await storageWrapper.getProjects();
[20:47:05.024]    |                                  ^
[20:47:05.024] 703|        setProjects(refreshedProjects);
[20:47:05.025] 704|      });
[20:47:05.025] [31m
[20:47:05.025]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[20:47:05.025]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[20:47:05.026]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[20:47:05.026]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[20:47:05.026]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[20:47:05.026]     at Socket.emit (node:events:518:28)
[20:47:05.027]     at addChunk (node:internal/streams/readable:561:12)
[20:47:05.027]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[20:47:05.027]     at Readable.push (node:internal/streams/readable:392:5)
[20:47:05.028]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[20:47:05.070] Error: Command "npm run build" exited with 1
[20:47:05.857] 
[20:47:08.640] Exiting build container