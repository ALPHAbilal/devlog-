# MCP Integration Debug Research - Expert AI Prompt

## Context
I have successfully built and deployed a Model Context Protocol (MCP) integration for my Devlog platform. The technical components are working:

- ✅ **Remote Server**: Live at `https://devlog-mcp-production.bilal-kosika.workers.dev` (tested, returns proper responses)
- ✅ **Database Functions**: All SQL functions created and working (can create documents via direct API calls)
- ✅ **MCP Client**: Bridge successfully connects and shows "status: connected" in Claude Code debug logs
- ✅ **Authentication**: API key validation working perfectly

## The Issue
However, when I try to actually USE the MCP in Claude Code with natural language commands, I get:
```
Remote server error (404): Not found
```

## Debug Evidence

### ✅ What's Working:
```bash
# Direct API calls work perfectly:
curl -H "Authorization: Bearer [API_KEY]" https://devlog-mcp-production.bilal-kosika.workers.dev/api/tools
# Returns: {"tools":[{"name":"create_document",...}]}

# MCP client connects successfully:
[DEBUG] MCP server "devlog": Connection attempt completed in 671ms - status: connected
```

### ❌ What's Failing:
When Claude Code tries to use the MCP, it gets 404 errors, suggesting a mismatch between what Claude Code expects and what my server provides.

## My Architecture

### MCP Client (`/devlog-mcp-client/`)
- Node.js bridge that implements MCP protocol via stdio
- Connects to remote server using REST API calls to `/api/tools` and `/api/execute`
- Uses environment variables: `DEVLOG_API_KEY`, `DEVLOG_REMOTE_URL`

### Remote Server (Cloudflare Workers)
- Handles authentication via API key validation
- Provides REST endpoints: `/api/tools` (GET/POST) and `/api/execute` (POST)
- Connects to Supabase database with proper RLS policies

### Claude Code Configuration
Claude Code successfully connects to the MCP client and shows "connected" status, but fails when actually trying to use the tools.

## Research Questions

**I need you to research and find answers to:**

1. **MCP Protocol Compliance**: Are there specific requirements for MCP servers that I might be missing? What are the exact protocol specifications for 2025/08/12?
2. **Claude Code Integration**: How should MCP servers specifically work with Claude Code? Are there particular endpoints or response formats Claude Code expects?

3. **Error Diagnosis**: What are the most common causes of "404 Not found" errors in MCP integrations, and how should they be debugged?

4. **Best Practices**: What are the proven patterns for MCP server architecture? Should I be using stdio directly, or is the REST bridge approach correct?

5. **Endpoint Requirements**: Are there specific MCP endpoints beyond `/api/tools` and `/api/execute` that Claude Code might be trying to access?

6. **Response Format**: Are there specific response formats or headers that MCP servers must provide for Claude Code compatibility?

## Technical Details for Your Research

### Current MCP Client Implementation:
- Uses `@modelcontextprotocol/sdk` package
- Implements stdio transport to communicate with Claude
- Makes REST calls to remote server
- Returns proper MCP protocol responses

### Remote Server Endpoints:
- `GET/POST /api/tools` - Returns available tools
- `POST /api/execute` - Executes tool commands
- `GET /health` - Health check
- All support CORS and proper authentication

### Error Pattern:
- Connection establishes successfully
- Tools are listed properly in Claude Code UI
- But actual tool execution results in 404 errors

## What I Need from You

Please search for:
1. **Official MCP documentation** for Claude Code integration
2. **Common troubleshooting guides** for MCP 404 errors
3. **Working examples** of MCP servers that integrate with Claude Code
4. **Protocol specifications** for MCP 2025 month 8 day 12
5. **Best practices** for MCP server architecture and debugging

Focus on practical, actionable solutions that can help diagnose why Claude Code shows "connected" but fails with 404 on actual usage.

## Expected Deliverable

Please provide:
1. **Root cause analysis** of the 404 issue
2. **Step-by-step debugging approach**
3. **Specific fixes** or configuration changes needed
4. **Alternative architectures** if the current approach has flaws
5. **Testing methodology** to verify the fix

The goal is to move from "connected" status to actually working MCP commands in Claude Code.