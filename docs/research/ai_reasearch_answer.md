I'll conduct thorough research to diagnose why your NPM package fails while direct calls work perfectly. This is a critical issue affecting the NPX execution context specifically in December 2025.Based on my research, I've identified the root cause of your issue. The problem is a **critical environment variable and execution context issue** that occurs when NPX executes your package versus direct Node.js execution.

## Root Cause Analysis

The 404 error occurs because **environment variables are not being properly passed through the NPX execution chain** to your MCP client code. Here's what's happening:

1. **NPX creates a new process context** that doesn't inherit all environment variables
2. MCP servers inherit only a subset of environment variables automatically, like USER, HOME, and PATH
3. Your `DEVLOG_API_KEY` environment variable is likely not reaching your actual code when executed via NPX

## The Critical Issue

When you run:
```bash
DEVLOG_API_KEY="API_KEY" npx devlog-mcp@latest
```

The environment variable is set for the NPX process, but **NPX spawns a child process** to execute your package, and the environment variable may not be passed through properly, especially with ESM modules.

## Immediate Solutions

### Solution 1: Explicit Environment Variable Passing in CLI.js

Update your `src/cli.js` to explicitly capture and pass environment variables:

```javascript
#!/usr/bin/env node

import { MCPClient } from './index.js';

// Debug: Log what environment variables are actually available
console.error('Environment variables received:', {
  DEVLOG_API_KEY: process.env.DEVLOG_API_KEY ? 'SET' : 'NOT SET',
  DEVLOG_REMOTE_URL: process.env.DEVLOG_REMOTE_URL || 'NOT SET'
});

async function main() {
  // Explicitly check for required environment variables
  const apiKey = process.env.DEVLOG_API_KEY;
  const remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp-production.bilal-kosika.workers.dev';
  
  if (!apiKey) {
    console.error('ERROR: DEVLOG_API_KEY environment variable is required');
    console.error('Please set it before running the MCP server:');
    console.error('export DEVLOG_API_KEY="your-api-key"');
    process.exit(1);
  }
  
  try {
    const client = new MCPClient(remoteUrl, apiKey);
    await client.run();
  } catch (error) {
    console.error('Failed to start MCP client:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### Solution 2: Fix the Fetch Implementation

The actual 404 might be occurring because headers are not being properly set. Update your `MCPClient` class:

```javascript
class MCPClient {
  constructor(remoteUrl, apiKey) {
    this.remoteUrl = remoteUrl;
    this.apiKey = apiKey;
    this.sessionId = null;
  }
  
  async initializeSession() {
    const url = `${this.remoteUrl}/mcp`;
    
    // Debug logging
    console.error(`Initializing MCP session at: ${url}`);
    console.error(`Using API key: ${this.apiKey ? 'PROVIDED' : 'MISSING'}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${this.apiKey}`
    };
    
    // Log the actual headers being sent
    console.error('Request headers:', JSON.stringify(headers, null, 2));
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2025-03-26',
            capabilities: {},
            clientInfo: {
              name: 'devlog-mcp',
              version: '1.0.6'
            }
          },
          id: 1
        })
      });
      
      console.error(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`Response body: ${text}`);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      this.sessionId = response.headers.get('Mcp-Session-Id');
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }
}
```

### Solution 3: Use a Wrapper Script (Most Reliable)

Create a new file `bin/devlog-mcp.js`:

```javascript
#!/usr/bin/env node

// This wrapper ensures environment variables are properly passed
const { spawn } = require('child_process');
const path = require('path');

// Preserve all environment variables
const env = {
  ...process.env,
  DEVLOG_API_KEY: process.env.DEVLOG_API_KEY,
  DEVLOG_REMOTE_URL: process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp-production.bilal-kosika.workers.dev'
};

// Path to the actual CLI script
const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

// Spawn node with the CLI script
const child = spawn('node', [cliPath], {
  env,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code);
});
```

Update your `package.json`:

```json
{
  "name": "devlog-mcp",
  "version": "1.0.7",
  "type": "module",
  "bin": {
    "devlog-mcp": "./bin/devlog-mcp.js"
  }
}
```

### Solution 4: Claude Code Configuration Fix

For Claude Code specifically, environment variables must be passed in the configuration file itself:

```bash
claude mcp add devlog --env DEVLOG_API_KEY=YOUR_KEY -- npx -y devlog-mcp@latest
```

Or directly edit the configuration:

```json
{
  "mcpServers": {
    "devlog": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "devlog-mcp@latest"],
      "env": {
        "DEVLOG_API_KEY": "YOUR_ACTUAL_API_KEY",
        "DEVLOG_REMOTE_URL": "https://devlog-mcp-production.bilal-kosika.workers.dev"
      }
    }
  }
}
```

## Protocol Version Issue

Also update your protocol version. The latest MCP specification as of December 2025 is version "2025-06-18", not "2025-03-26":

```javascript
params: {
  protocolVersion: '2025-06-18',  // Updated version
  capabilities: {},
  clientInfo: {
    name: 'devlog-mcp',
    version: '1.0.7'
  }
}
```

## Testing Steps

1. **Test with debug logging**:
```bash
export DEVLOG_API_KEY="your-key"
export DEBUG=1
npx devlog-mcp@latest
```

2. **Test direct node execution**:
```bash
DEVLOG_API_KEY="your-key" node ./node_modules/devlog-mcp/src/cli.js
```

3. **Test in Claude Code with explicit env**:
```bash
claude mcp add devlog --env DEVLOG_API_KEY=your-key -- npx -y devlog-mcp@latest
```

## Why This Happens

NPX execution in 2025 has specific behaviors with ESM modules where environment variables and module resolution can be problematic. The combination of:
- ESM modules (`"type": "module"`)
- NPX execution context
- Stdio transport for MCP
- Environment variable inheritance

Creates a perfect storm where environment variables don't properly reach your code.

## Verification

After implementing these fixes:

1. Bump your version to 1.0.7
2. Publish to NPM
3. Test with: `DEVLOG_API_KEY="key" npx devlog-mcp@1.0.7`
4. Check the debug output to confirm the API key is received
5. Verify the correct protocol version is being used

The core issue is that NPX doesn't guarantee environment variable inheritance, especially with ESM modules, which is why your direct execution works but NPX execution fails.