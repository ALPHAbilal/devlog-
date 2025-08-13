# 🔍 MCP Connection Issue - Expert Research Prompt

## Context
**Date**: December 12, 2025  
**Issue**: MCP (Model Context Protocol) server connection failing between Claude Code and custom MCP implementation
**Current Status**: Server works perfectly via direct HTTP calls, but fails when called through NPM package in Claude Code

## The Problem

We have a fully functional MCP implementation that:
- ✅ **Works perfectly** with direct curl/fetch calls
- ✅ **Passes all tests** when running locally  
- ✅ **Successfully deployed** to Cloudflare Workers
- ❌ **Fails with 404** when called through NPM package (devlog-mcp@1.0.6)
- ❌ **Cannot connect** in Claude Code with error: "MCP error -32000: Connection closed"

## Technical Stack
- **MCP Client**: Node.js package using `@modelcontextprotocol/sdk`
- **MCP Server**: Cloudflare Workers (deployed and working)
- **Protocol**: JSON-RPC 2.0 over HTTP
- **Database**: Supabase PostgreSQL with MCP functions
- **Claude Version**: Claude Code CLI (latest as of Dec 2025)

## Evidence of Working Components

### 1. Server Works Perfectly
```bash
curl -X POST https://devlog-mcp-production.bilal-kosika.workers.dev/mcp \
  -H "Authorization: Bearer API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26"},"id":1}'
# Returns: Success with session ID
```

### 2. Node.js Fetch Works
```javascript
// Direct Node.js fetch works perfectly
const response = await fetch(`${MCP_URL}/mcp`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY', 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
});
// Returns: 200 OK with proper response
```

### 3. NPM Package Fails
```bash
DEVLOG_API_KEY="API_KEY" npx devlog-mcp@latest
# Error: HTTP 404: Not found
# Failed to initialize MCP session
```

### 4. Claude Code Integration Fails
```bash
claude mcp add devlog -- npx -y devlog-mcp@latest
# Result: MCP error -32000: Connection closed
# Server stderr: Failed to initialize MCP session: HTTP 404
```

## What We Need to Research

### 1. **NPM Package Execution Context**
- Why does the same code work locally but fail when executed via NPX?
- Is there a difference in how NPX executes ESM modules in December 2025?
- Are there known issues with `node-fetch` or fetch polyfills in NPX context?

### 2. **Claude Code MCP Integration Specifics**
- What exact environment does Claude Code create for MCP servers?
- Are there undocumented requirements for stdio MCP servers in Claude Code?
- Is there a difference between how Claude Code executes NPX vs direct node commands?

### 3. **Protocol Version Compatibility**
- We're using MCP protocol version "2025-03-26" - is this correct for December 2025?
- Are there breaking changes in the MCP specification between versions?
- Should we be using a different protocol version?

### 4. **Authentication Header Issues**
- Could there be header stripping or modification when going through NPX?
- Are Bearer tokens handled differently in certain Node.js contexts?
- Is there a proxy or middleware interfering with headers?

### 5. **ESM Module Resolution**
- Our package uses ESM (`"type": "module"`) - are there known issues?
- Could there be a module resolution problem specific to NPX in late 2025?
- Is the shebang `#!/usr/bin/env node` working correctly with ESM?

## Research Questions for AI Expert

1. **Find the latest MCP specification** (December 2025) from Anthropic's official documentation
2. **Search for known issues** with `@modelcontextprotocol/sdk` and NPX execution
3. **Look for working examples** of MCP servers deployed to Cloudflare Workers in 2025
4. **Find Claude Code MCP debugging guides** specifically for stdio transport
5. **Research NPX execution context differences** when running ESM modules
6. **Look for similar 404 errors** in MCP implementations from late 2025
7. **Find the correct protocol version** for MCP as of December 2025
8. **Search for header preservation issues** in Node.js fetch through NPX

## Specific Technical Details to Research

### Package.json Configuration
```json
{
  "name": "devlog-mcp",
  "version": "1.0.6",
  "type": "module",
  "bin": {
    "devlog-mcp": "./src/cli.js"
  }
}
```
**Question**: Is this the correct configuration for MCP packages in December 2025?

### MCP SDK Version
```json
"dependencies": {
  "@modelcontextprotocol/sdk": "^1.0.0",
  "node-fetch": "^3.0.0"
}
```
**Question**: Are these the correct versions for December 2025? Has the SDK been updated?

### Error Location
```javascript
// Error occurs at this exact line in NPM package:
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${await response.text()}`);
}
```
**Question**: Why does this return 404 via NPX but 200 via direct execution?

## Resources to Check

1. **Official Anthropic MCP Documentation** (December 2025 version)
2. **Claude Code Integration Guide** (latest version)
3. **Cloudflare Workers MCP Examples** (2025 implementations)
4. **NPX Execution Context Documentation** (Node.js v22+)
5. **GitHub Issues** for @modelcontextprotocol/sdk
6. **Stack Overflow** questions about MCP 404 errors
7. **Discord/Forums** for Claude developers (December 2025 discussions)

## Expected Outcome

We need to find:
1. **The root cause** of why NPX execution gets 404 while direct execution works
2. **A working solution** that makes the NPM package work with Claude Code
3. **Best practices** for MCP implementation as of December 2025
4. **Any configuration changes** needed for the current MCP specification

## Success Criteria

The solution should:
- Make `npx devlog-mcp@latest` work without 404 errors
- Successfully connect to Claude Code without "Connection closed" errors
- Work with the existing Cloudflare Workers deployment
- Be compatible with the latest MCP specification (December 2025)

---

**Please research these specific points and provide practical, implementable solutions based on real-world examples and official documentation from December 2025.**