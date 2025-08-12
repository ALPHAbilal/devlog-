# Research Request: Cloudflare Workers + Durable Objects + MCP Deployment (2025)

## Context
We're deploying a Model Context Protocol (MCP) server to Cloudflare Workers that requires:
- Durable Objects for session management
- Server-Sent Events (SSE) for real-time communication
- KV namespace for caching
- TypeScript support
- Wrangler 3.x deployment

## Current Issue
When trying to add Durable Object bindings in Cloudflare dashboard, we get "No Durable Object found" because the Durable Object class needs to be deployed first. We need the latest 2025 best practices and any breaking changes.

## Research Questions

### 1. Cloudflare Workers + Durable Objects (2025)
- What are the latest patterns for deploying Workers with Durable Objects in 2025?
- Have there been any breaking changes to the Durable Objects API or deployment process?
- What's the current best practice for exporting Durable Object classes?
- Are there new requirements for wrangler.toml configuration for Durable Objects?
- What's the recommended migration strategy for initial Durable Object deployment?

### 2. Server-Sent Events (SSE) in Workers
- What's the current best practice for implementing SSE in Cloudflare Workers in 2025?
- Are there any limitations or workarounds needed for long-running SSE connections?
- How should WebSocket fallback be implemented for MCP protocol?
- What are the current timeout limits for SSE connections in Workers?

### 3. Wrangler 3.x Updates
- What version of Wrangler is current in January 2025?
- Have there been any changes to the deployment process for Workers with Durable Objects?
- Are there new configuration options or requirements in wrangler.toml?
- What's the current syntax for Durable Object bindings and migrations?

### 4. TypeScript + Workers (2025)
- What's the recommended TypeScript configuration for Workers in 2025?
- Are there any changes to @cloudflare/workers-types?
- What's the current best practice for module format (ESM vs Service Worker)?
- How should TypeScript be configured for Durable Objects?

### 5. Model Context Protocol (MCP) Specifics
- Are there any known implementations of MCP servers on Cloudflare Workers?
- What's the recommended pattern for handling MCP's JSON-RPC over SSE?
- How should session management be implemented for MCP connections?
- Are there any MCP-specific considerations for edge deployments?

### 6. Authentication & Security
- What's the current best practice for API key authentication in Workers?
- How should secrets be managed in 2025 (wrangler secrets vs dashboard)?
- Are there new security features or requirements for Workers?

### 7. Performance & Limits (2025)
- What are the current CPU time limits for Workers?
- What are the memory limits for Durable Objects?
- What's the maximum size for Worker scripts?
- Are there any new performance optimization techniques?

### 8. Deployment Process
- What's the exact order of operations for deploying a Worker with Durable Objects?
- Do you need to deploy the Worker code before creating bindings in the dashboard?
- What's the recommended workflow: dashboard-first or wrangler-first?
- Are there any gotchas with the initial Durable Object migration?

## Specific Code Patterns Needed

### 1. Durable Object Export Pattern
```typescript
// What's the current best practice for this in 2025?
export class MCPSession {
  // Implementation
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Main worker logic
  }
}
```

### 2. Wrangler.toml Configuration
```toml
# Need the latest syntax for:
# - Durable Objects bindings
# - Migrations
# - Node compatibility
# - Build configuration
```

### 3. SSE Implementation
```typescript
// Current best practice for SSE in Workers
// Including proper headers and error handling
```

## Expected Deliverables
1. Updated code patterns that work with 2025 Cloudflare infrastructure
2. Corrected wrangler.toml configuration
3. Step-by-step deployment process that avoids the "No Durable Object found" error
4. Any breaking changes or deprecations we need to handle
5. Performance optimization tips specific to MCP workloads

## Additional Context
- We're building a remote MCP server that AI assistants (Claude Desktop, VS Code) connect to
- The server needs to handle multiple concurrent sessions via Durable Objects
- We're using Supabase as the backend database
- The client will be distributed as an NPX package
- Target audience: developers who want to connect their AI assistants to Devlog

Please search for the most recent information (January 2025) as Cloudflare Workers evolve rapidly and we need current best practices.