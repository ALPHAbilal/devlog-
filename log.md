bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp remove figma-desktop
Removed MCP server "figma-desktop" from local config
File modified: /home/bilal/.claude.json [project: /mnt/c/Users/pc/Desktop/my/devlog-]
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp add --transport sse figma-desktop http://10.255.255.254:3845/sse
Added SSE MCP server figma-desktop with URL: http://10.255.255.254:3845/sse to local config
File modified: /home/bilal/.claude.json [project: /mnt/c/Users/pc/Desktop/my/devlog-]
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp list
Checking MCP server health...

devlog: npx -y devlog-mcp - ✓ Connected
figma-desktop: http://10.255.255.254:3845/sse (SSE) - ✗ Failed to connect
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp remove figma-desktop
Removed MCP server "figma-desktop" from local config
File modified: /home/bilal/.claude.json [project: /mnt/c/Users/pc/Desktop/my/devlog-]
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse~
Added SSE MCP server figma-dev-mode-mcp-server with URL: http://127.0.0.1:3845/sse~ to local config        
File modified: /home/bilal/.claude.json [project: /mnt/c/Users/pc/Desktop/my/devlog-]
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp list
Checking MCP server health...

devlog: npx -y devlog-mcp - ✓ Connected
figma-dev-mode-mcp-server: http://127.0.0.1:3845/sse~ (SSE) - ✗ Failed to connect
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp remove figma-desktop
No MCP server found with name: "figma-desktop"
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp add --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
MCP server figma-dev-mode-mcp-server already exists in local config
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp remove figma-desktop
No MCP server found with name: "figma-desktop"
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$ claude mcp list
Checking MCP server health...

devlog: npx -y devlog-mcp - ✓ Connected
figma-dev-mode-mcp-server: http://127.0.0.1:3845/sse~ (SSE) - ✗ Failed to connect
bilal@DESKTOP-GAAM8KN:/mnt/c/Users/pc/Desktop/my/devlog-$