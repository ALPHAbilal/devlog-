# Cloudflare Worker Deployment Instructions for devlog-mcp

## Current Situation
We need to deploy the devlog-mcp MCP server to Cloudflare Workers. The Worker has been created in the Cloudflare dashboard with the name `devlog-mcp`, but we need to deploy the actual code with proper Durable Objects configuration.

## Problem
When trying to add Durable Object bindings in the Cloudflare dashboard, we get "No Durable Object found" because the Durable Object class needs to be defined and deployed in the Worker code first.

## What We Need From You

### 1. Complete Worker Code Structure
Please provide the complete TypeScript code for the Worker that includes:

```typescript
// Required: Durable Object class definition
export class MCPSession {
  state: DurableObjectState;
  env: Env;
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }
  
  async fetch(request: Request): Promise<Response> {
    // Your Durable Object logic here
    // This should handle WebSocket connections for MCP
    // Include session management, message routing, etc.
    return new Response("OK");
  }
}

// Required: Main Worker export
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Main Worker logic
    // Should handle:
    // - Routing to Durable Objects for WebSocket connections
    // - API endpoints (/health, /api/info, etc.)
    // - CORS headers
    // - Authentication if needed
    
    const url = new URL(request.url);
    
    // Example routing
    if (url.pathname === "/health") {
      return new Response("OK");
    }
    
    if (url.pathname === "/api/info") {
      return new Response(JSON.stringify({ version: "1.0.0" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // WebSocket upgrade for MCP connections
    if (request.headers.get("Upgrade") === "websocket") {
      // Route to Durable Object for WebSocket handling
      const id = env.SESSION.idFromName("some-session-id");
      const stub = env.SESSION.get(id);
      return stub.fetch(request);
    }
    
    return new Response("Not found", { status: 404 });
  }
};

// Required: Type definitions
interface Env {
  // KV namespace binding
  CACHE: KVNamespace;
  
  // Durable Object binding
  SESSION: DurableObjectNamespace;
  
  // Environment variables
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}
```

### 2. Complete wrangler.toml Configuration
Please provide the complete wrangler.toml file:

```toml
name = "devlog-mcp"
main = "src/index.ts"
compatibility_date = "2025-01-20"
node_compat = true  # If using Node.js APIs

# KV Namespace binding (already created in dashboard)
[[kv_namespaces]]
binding = "CACHE"
id = "ACTUAL_KV_NAMESPACE_ID"  # Need the actual ID from dashboard

# Environment variables (non-sensitive)
[vars]
SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"  # Replace with actual URL

# Durable Objects configuration
[[durable_objects.bindings]]
name = "SESSION"
class_name = "MCPSession"
script_name = "devlog-mcp"  # Optional, defaults to current worker

# Durable Objects migration
[[migrations]]
tag = "v1"
new_classes = ["MCPSession"]

# Optional: if using custom builds
[build]
command = "npm run build"
[build.upload]
format = "modules"
main = "./dist/index.js"

# Optional: for local development
[dev]
port = 8787
local_protocol = "http"
```

### 3. Secrets Configuration
Create a `.dev.vars` file for local development (DO NOT commit this to git):

```bash
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

### 4. Package.json Scripts
Ensure your package.json includes these scripts:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "tail": "wrangler tail",
    "types": "wrangler types"
  }
}
```

## Deployment Steps

### Step 1: Prepare the Code
1. Ensure all TypeScript files are in the `src/` directory
2. The main entry point should be `src/index.ts`
3. Include the Durable Object class export in the same file or import it properly

### Step 2: Get Required IDs from Dashboard
We need:
- **KV Namespace ID**: Already created as `devlog-mcp-cache` (get the actual ID from dashboard)
- **Account ID**: Your Cloudflare account ID (if needed for wrangler.toml)

### Step 3: Deploy Using Wrangler
```bash
# Install dependencies
npm install

# Login to Cloudflare (if not already)
npx wrangler login

# Deploy the Worker with Durable Objects
npx wrangler deploy

# This should:
# 1. Upload your code
# 2. Create the Durable Object class
# 3. Run the migration
# 4. Set up all bindings
```

### Step 4: Add Secret via CLI
After deployment, add the Supabase key as a secret:
```bash
npx wrangler secret put SUPABASE_ANON_KEY
# Paste your key when prompted
```

## Important Requirements

### For MCP Server Functionality
The Worker must handle:
1. **WebSocket connections** for MCP protocol
2. **Session management** via Durable Objects
3. **Message routing** between clients
4. **State persistence** using KV or Durable Object storage
5. **CORS headers** for browser-based clients
6. **Health check endpoint** at `/health`
7. **Info endpoint** at `/api/info`

### For Durable Objects
- Each Durable Object instance represents an MCP session
- Must handle WebSocket upgrade requests
- Should manage connection state and message buffering
- Implement proper error handling and cleanup

### For KV Cache
- Use for caching frequently accessed data
- Consider TTL for cache entries
- Handle cache misses gracefully

## Testing Endpoints
After deployment, test these:
```bash
# Health check
curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/health

# API info
curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/api/info

# WebSocket connection (use wscat or similar)
wscat -c wss://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/ws
```

## Files Needed From Developer

Please provide:
1. **src/index.ts** - Main Worker code with Durable Object class
2. **wrangler.toml** - Complete configuration file
3. **package.json** - With all dependencies and scripts
4. **tsconfig.json** - TypeScript configuration (if using TypeScript)
5. Any additional source files for the MCP server logic

## Additional Notes
- The Worker name must be `devlog-mcp` to match what's created in the dashboard
- Ensure the Durable Object class name matches exactly in both code and config
- The migration tag should be "v1" for initial deployment
- All environment variables should be defined before deployment
- Secrets should be added after deployment via CLI or dashboard

## Questions for Developer
1. Do you need multiple Durable Object classes or just one for sessions?
2. Are there any specific CORS origins that should be allowed?
3. What's the expected WebSocket message format for MCP?
4. Do you need any rate limiting or authentication middleware?
5. Should the KV cache have specific TTL values?

Please provide the complete, deployment-ready code with all these requirements addressed.