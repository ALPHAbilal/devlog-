# Research Prompt: MCP Configuration in Claude Code

## Context
I'm building an MCP (Model Context Protocol) server for Journey Log, a SaaS platform that helps developers document their AI-assisted coding journeys. We've created an NPM package `@journey-log/mcp-server` that needs to be installed and configured in Claude Code.

## What I Need to Know

### 1. Claude Code MCP Installation Command
- What is the EXACT command syntax to add an MCP server in Claude Code?
- I know it's a single command line (not JSON editing like Claude Desktop)
- Need the format for adding an NPM-based MCP server
- How to pass environment variables (like API keys) in the command

### 2. Current Best Practices (2024/2025)
- Latest MCP configuration methods for Claude Code
- Any recent changes to the command syntax
- Differences between local file MCPs vs NPM package MCPs
- How Claude Code handles MCP server updates

### 3. Specific Questions
- If my NPM package is `@journey-log/mcp-server`, what's the exact command?
- How do I pass the `JOURNEY_LOG_API_KEY` environment variable?
- Can users update the MCP server without removing and re-adding?
- Are there any flags or options I should know about?

### 4. Examples I'm Looking For
- Real examples of adding NPM-based MCP servers to Claude Code
- Examples showing environment variable configuration
- Any troubleshooting commands for MCP in Claude Code

## Background Info
- Our MCP server will be published as: `@journey-log/mcp-server`
- It requires an API key: `JOURNEY_LOG_API_KEY`
- It implements standard MCP protocol with 5 tools
- Users should be able to install it in under 2 minutes

## Expected Output Format
Please provide:
1. The exact command(s) with clear syntax
2. Step-by-step instructions if needed
3. Any important notes or warnings
4. Links to official documentation if available

## Why This Matters
We need to update our README and documentation with the correct Claude Code installation instructions. Many developers prefer Claude Code over Claude Desktop, so accurate instructions are crucial for adoption.