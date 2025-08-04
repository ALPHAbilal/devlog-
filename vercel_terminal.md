[23:46:32.184] Running build in Washington, D.C., USA (East) – iad1
[23:46:32.185] Build machine configuration: 2 cores, 8 GB
[23:46:32.199] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: ab7108d)
[23:46:33.029] Cloning completed: 830.000ms
[23:46:33.179] Restored build cache from previous deployment (B8PbAxWVf7R75HqNgo63QicFP88i)
[23:46:33.653] Running "vercel build"
[23:46:34.614] Vercel CLI 44.6.4
[23:46:36.232] Installing dependencies...
[23:46:37.429] 
[23:46:37.430] up to date in 950ms
[23:46:37.430] 
[23:46:37.431] 75 packages are looking for funding
[23:46:37.431]   run `npm fund` for details
[23:46:37.578] 
[23:46:37.579] > journey-log-compass@0.0.0 build
[23:46:37.579] > vite build
[23:46:37.580] 
[23:46:38.261] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[23:46:38.307] [sentry-vite-plugin] Info: Sending telemetry data on issues and performance to Sentry. To disable telemetry, set `options.telemetry` to `false`.
[23:46:38.693] transforming...
[23:46:42.719] [32m✓[39m 2194 modules transformed.
[23:46:42.722] [31m✗[39m Build failed in 4.42s
[23:46:42.722] [31merror during build:
[23:46:42.723] [31m[vite:esbuild] Transform failed with 1 error:
[23:46:42.723] /vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:196:10: ERROR: Unterminated regular expression[31m
[23:46:42.724] file: [36m/vercel/path0/src/components/blocks/IssueTrackerBlock.jsx:196:10[31m
[23:46:42.724] [33m
[23:46:42.724] [33mUnterminated regular expression[33m
[23:46:42.725] 194|          </div>
[23:46:42.725] 195|        </div>
[23:46:42.725] 196|      </div>
[23:46:42.726]    |            ^
[23:46:42.726] 197|    );
[23:46:42.726] 198|  };
[23:46:42.727] [31m
[23:46:42.727]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[23:46:42.727]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[23:46:42.728]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[23:46:42.728]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[23:46:42.728]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[23:46:42.729]     at Socket.emit (node:events:518:28)
[23:46:42.729]     at addChunk (node:internal/streams/readable:561:12)
[23:46:42.729]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[23:46:42.730]     at Readable.push (node:internal/streams/readable:392:5)
[23:46:42.730]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[23:46:42.788] Error: Command "npm run build" exited with 1
[23:46:46.375] Exiting build container