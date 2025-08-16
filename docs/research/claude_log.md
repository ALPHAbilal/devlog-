$ claude --debug
[DEBUG] Writing to temp file: /home/bilal/.claude.json.tmp.1689619.1754981007818
[DEBUG] Preserving file permissions: 100644
[DEBUG] Temp file written successfully, size: 530771 bytes
[DEBUG] Applied original permissions to temp file
[DEBUG] Renaming /home/bilal/.claude.json.tmp.1689619.1754981007818 to /home/bilal/.claude.json
[DEBUG] File /home/bilal/.claude.json written atomically
[DEBUG] MCP server "devlog": Starting connection attempt
[DEBUG] Creating shell snapshot for bash (/bin/bash)
[DEBUG] Creating snapshot at: /home/bilal/.claude/shell-snapshots/snapshot-bash-1754981008764-efjuw3.sh
[DEBUG] Writing to temp file: /home/bilal/.claude/todos/dedce676-ae90-4084-8949-37efb96eb0e1-agent-dedce676-ae90-4084-8949-37efb96eb0e1.json.tmp.1689619.1754981008858
[DEBUG] Temp file written successfully, size: 2 bytes
[DEBUG] Renaming /home/bilal/.claude/todos/dedce676-ae90-4084-8949-37efb96eb0e1-agent-dedce676-ae90-4084-8949-37efb96eb0e1.json.tmp.1689619.1754981008858 to /home/bilal/.claude/todos/dedce676-ae90-4084-8949-37efb96eb0e1-agent-dedce676-ae90-4084-8949-37efb96eb0e1.json
[DEBUG] File /home/bilal/.claude/todos/dedce676-ae90-4084-8949-37efb96eb0e1-agent-dedce676-ae90-4084-8949-37efb96eb0e1.json written atomically
[DEBUG] Writing to temp file: /home/bilal/.claude.json.tmp.1689619.1754981008914
[DEBUG] Preserving file permissions: 100644
[DEBUG] Temp file written successfully, size: 530405 bytes
[DEBUG] Applied original permissions to temp file
[DEBUG] Renaming /home/bilal/.claude.json.tmp.1689619.1754981008914 to /home/bilal/.claude.json
[DEBUG] File /home/bilal/.claude.json written atomically
[DEBUG] Shell snapshot created successfully (4749 bytes)
[DEBUG] Writing to temp file: /home/bilal/.claude.json.tmp.1689619.1754981009626
[DEBUG] Preserving file permissions: 100644
[DEBUG] Temp file written successfully, size: 530405 bytes
[DEBUG] Applied original permissions to temp file
[DEBUG] Renaming /home/bilal/.claude.json.tmp.1689619.1754981009626 to /home/bilal/.claude.json
[DEBUG] File /home/bilal/.claude.json written atomically
[DEBUG] Executing hooks for SessionStart:startup
[DEBUG] Getting matching hook commands for SessionStart with query: startup
[DEBUG] Found 0 hook matchers in settings
[DEBUG] Matched 0 unique hooks for query "startup" (0 before deduplication)
[DEBUG] Found 0 hook commands to execute
╭───────────────────────────────────────────────────╮
│ ✻ Welcome to Claude Code!                         │
│                                                   │
│   /help for help, /status for your current setup  │
│                                                   │
│   cwd: /home/bilal/My-Freelancing-Accelerator     │
╰───────────────────────────────────────────────────╯

 Tips for getting started:

 1. Run /init to create a CLAUDE.md file with instructions for Claude
 2. Run /terminal-setup to set up terminal integration
 3. Use Claude to help with file analysis, editing, bash commands and git
 4. Be as specific as you would with another engineer for the best results
[DEBUG] Writing to temp file: /home/bilal/.claude.json.tmp.1689619.1754981009810
[DEBUG] Preserving file permissions: 100644
[DEBUG] Temp file written successfully, size: 530405 bytes
[DEBUG] Applied original permissions to temp file
[DEBUG] Renaming /home/bilal/.claude.json.tmp.1689619.1754981009810 to /home/bilal/.claude.json
[DEBUG] File /home/bilal/.claude.json written atomically
[DEBUG] MCP server "devlog": Starting connection attempt
[DEBUG] AutoUpdaterWrapper: Installation type: npm-global, using native: false
[DEBUG] MCP server "devlog": Starting connection attempt
[DEBUG] MCP server "ide": Starting connection attempt

╭─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ > Try "fix typecheck errors"                                                                                            │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
  ? for shortcuts                                                                                      ◯ IDE disconnected
                                                                                                               Debug mode


[ERROR] MCP server "devlog" Server stderr: Starting Devlog MCP Client...
[DEBUG] MCP server "devlog": Connection failed: McpError: MCP error -32000: Connection closed
[DEBUG] MCP server "devlog": Error message: MCP error -32000: Connection closed
[DEBUG] MCP server "devlog": Error stack: McpError: MCP error -32000: Connection closed
    at IK0._onclose (file:///usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js:1423:12631)
    at _transport.onclose (file:///usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js:1423:11949)
    at ChildProcess.<anonymous> (file:///usr/local/lib/node_modules/@anthropic-ai/claude-code/cli.js:1425:1460)
    at ChildProcess.emit (node:events:524:28)
    at ChildProcess.emit (node:domain:489:12)
    at maybeClose (node:internal/child_process:1104:16)
    at Socket.<anonymous> (node:internal/child_process:456:11)
    at Socket.emit (node:events:524:28)
    at Socket.emit (node:domain:489:12)
    at Pipe.<anonymous> (node:net:343:12)

[DEBUG] MCP server "devlog": Connection attempt completed in 2955ms - status: failed
[DEBUG] MCP server "devlog": Connection attempt completed in 1352ms - status: failed
[DEBUG] MCP server "devlog": Connection attempt completed in 232ms - status: failed
[DEBUG] MCP server "ide": Connection attempt completed in 342ms - status: connected
[DEBUG] AutoUpdater: Detected installation type: npm-global
[DEBUG] AutoUpdater: Using global update method
