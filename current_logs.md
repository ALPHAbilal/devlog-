[12:46:07.093] Running build in Washington, D.C., USA (East) – iad1
[12:46:07.093] Build machine configuration: 2 cores, 8 GB
[12:46:07.145] Cloning github.com/ALPHAbilal/devlog- (Branch: main, Commit: d6c3fe7)
[12:46:07.794] Cloning completed: 648.000ms
[12:46:08.245] Restored build cache from previous deployment (DPnEUBZxeJjUmNg5VDtzNPtZP4sA)
[12:46:11.267] Running "vercel build"
[12:46:12.903] Vercel CLI 44.3.0
[12:46:13.732] Installing dependencies...
[12:46:15.483] 
[12:46:15.483] up to date in 1s
[12:46:15.483] 
[12:46:15.484] 70 packages are looking for funding
[12:46:15.484]   run `npm fund` for details
[12:46:15.690] 
[12:46:15.691] > journey-log-compass@0.0.0 build
[12:46:15.691] > vite build
[12:46:15.692] 
[12:46:16.168] [36mvite v6.3.5 [32mbuilding for production...[36m[39m
[12:46:16.736] transforming...
[12:46:17.152] [32m✓[39m 24 modules transformed.
[12:46:17.155] [31m✗[39m Build failed in 941ms
[12:46:17.155] [31merror during build:
[12:46:17.156] [31m[vite:esbuild] Transform failed with 4 errors:
[12:46:17.156] /vercel/path0/src/pages/Dashboard.jsx:1143:8: ERROR: Unexpected closing "main" tag does not match opening "div" tag
[12:46:17.157] /vercel/path0/src/pages/Dashboard.jsx:1222:8: ERROR: Unexpected closing "div" tag does not match opening "main" tag
[12:46:17.157] /vercel/path0/src/pages/Dashboard.jsx:1255:6: ERROR: Unexpected closing "div" tag does not match opening "DndContext" tag
[12:46:17.157] /vercel/path0/src/pages/Dashboard.jsx:1256:17: ERROR: Unterminated regular expression[31m
[12:46:17.158] file: [36m/vercel/path0/src/pages/Dashboard.jsx:1143:8[31m
[12:46:17.158] [33m
[12:46:17.158] [33mUnexpected closing "main" tag does not match opening "div" tag[33m
[12:46:17.159] 1141|            />
[12:46:17.159] 1142|          </div>
[12:46:17.159] 1143|        </main>
[12:46:17.159]    |          ^
[12:46:17.160] 1144|  
[12:46:17.160] 1145|        {/* Empty State */}
[12:46:17.160] 
[12:46:17.161] [33mUnexpected closing "div" tag does not match opening "main" tag[33m
[12:46:17.161] 1220|          />
[12:46:17.161] 1221|        )}
[12:46:17.162] 1222|        </div>
[12:46:17.162]    |          ^
[12:46:17.162] 1223|        </div>
[12:46:17.163] 1224|        
[12:46:17.163] 
[12:46:17.163] [33mUnexpected closing "div" tag does not match opening "DndContext" tag[33m
[12:46:17.164] 1253|          onCreateProject={handleCommandPaletteCreateProject}
[12:46:17.164] 1254|        />
[12:46:17.164] 1255|      </div>
[12:46:17.165]    |        ^
[12:46:17.165] 1256|      </DndContext>
[12:46:17.166] 1257|    );
[12:46:17.166] 
[12:46:17.166] [33mUnterminated regular expression[33m
[12:46:17.166] 1254|        />
[12:46:17.167] 1255|      </div>
[12:46:17.167] 1256|      </DndContext>
[12:46:17.167]    |                   ^
[12:46:17.168] 1257|    );
[12:46:17.168] 1258|  }
[12:46:17.168] [31m
[12:46:17.169]     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1463:15)
[12:46:17.169]     at /vercel/path0/node_modules/esbuild/lib/main.js:734:50
[12:46:17.169]     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:601:9)
[12:46:17.171]     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:656:12)
[12:46:17.171]     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:579:7)
[12:46:17.172]     at Socket.emit (node:events:518:28)
[12:46:17.172]     at addChunk (node:internal/streams/readable:561:12)
[12:46:17.172]     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
[12:46:17.172]     at Readable.push (node:internal/streams/readable:392:5)
[12:46:17.173]     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)[39m
[12:46:17.243] Error: Command "npm run build" exited with 1
[12:46:17.576] 
[12:46:20.357] Exiting build container