# Devlog MCP Client

Connect AI assistants like Claude Code, Claude Desktop, and VS Code to your Devlog knowledge base using the Model Context Protocol (MCP).

## Features

- 🚀 **One-command setup** - Get connected instantly with Claude CLI
- 🌐 **Production ready** - Deployed on Cloudflare global network
- 🔒 **Secure** - API key authentication with Row Level Security
- ⚡ **Fast** - Semantic snapshots reduce data by 90%
- 🎯 **Complete coverage** - All 13+ block types supported
- 🔄 **Protocol compliant** - Follows MCP 2025-03-26 specification

## Quick Start

### 1. Get Your API Key

Visit your **Devlog platform** → **Settings** → **API Keys** and generate a production API key.

Your key will look like: `dvlg_sk_prod_xxxxxxxxx...`

### 2. Add to Claude Code (Recommended)

```bash
claude mcp add devlog -s user -e DEVLOG_API_KEY="your_production_api_key_here" -- npx -y devlog-mcp
```

That's it! 🎉

### 3. Alternative: Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp@latest"],
      "env": {
        "DEVLOG_API_KEY": "your_production_api_key_here"
      }
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### 4. Alternative: VS Code/Cursor

```json
{
  "mcp.servers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp@latest"],
      "env": {
        "DEVLOG_API_KEY": "your_production_api_key_here"
      }
    }
  }
}
```

## Usage

Once connected, you can ask your AI assistant to:

### Document Management
- **"Create a new document called 'API Integration Guide'"**
- **"Get document ID abc123-xyz789"**
- **"Search my documents for 'React hooks'"**
- **"Update document 'Project Notes' with new content"**
- **"Delete document 'Old Draft'"**

### Content Operations
- **"Add a code block with this TypeScript example"**
- **"Create a table showing API endpoints"**
- **"Add a filetree showing project structure"**
- **"Create todos for sprint planning"**
- **"Save this AI conversation to my notes"**

### Smart Features
- **"Get document in semantic mode for faster processing"**
- **"Search documents tagged with 'architecture'"**
- **"Find all documents updated this week"**

## Supported Block Types

All 13+ Devlog block types are fully supported:

| Type | Description | Use Case |
|------|-------------|----------|
| 📝 **text** | Markdown with inline tags | Notes, documentation |
| 💻 **code** | Syntax highlighting + file paths | Code snippets, examples |
| 🤖 **ai** | AI conversation preservation | Chat logs, AI insights |
| 📑 **heading** | Document structure | Section headers, TOCs |
| 📁 **filetree** | Visual project structure | Project overviews |
| 📊 **table** | Dynamic data tables | API docs, comparisons |
| ✅ **todo** | Interactive task lists | Sprint planning, checklists |
| 🖼️ **image** | Multi-image galleries | Screenshots, diagrams |
| 🏞️ **inline-image** | Images within text | Embedded visuals |
| 📐 **template** | Reusable templates | Project scaffolds |
| 🧮 **math** | LaTeX mathematical expressions | Formulas, equations |
| 🔄 **version-track** | Code version tracking | Git-like versioning |
| 🐛 **issue-tracker** | Issue management | Bug tracking, features |

## Architecture

```
Claude Code ↔ MCP Client (Bridge) ↔ MCP Server (Cloudflare) ↔ Supabase Database
```

- **MCP Client**: Local bridge handling stdio ↔ HTTP translation
- **MCP Server**: Global Cloudflare Workers deployment
- **Database**: Supabase PostgreSQL with Row Level Security
- **Protocol**: JSON-RPC 2.0 over HTTP (MCP 2025-03-26 compliant)

## Advanced Configuration

### Enable Debug Mode

```bash
claude mcp add devlog -s user -e DEVLOG_API_KEY="your_key" -e DEVLOG_DEBUG="true" -- npx -y devlog-mcp
```

### Custom Remote URL

```bash
claude mcp add devlog -s user -e DEVLOG_API_KEY="your_key" -e DEVLOG_REMOTE_URL="https://custom-server.com" -- npx -y devlog-mcp
```

### Semantic Mode (90% Data Reduction)

When requesting documents, add "in semantic mode":
```
"Get my React tutorial document in semantic mode"
```

## Troubleshooting

### 404 Errors (Fixed in v1.0.3+)

If you see "Remote server error (404): Not found":

1. **Update to latest version**:
   ```bash
   claude mcp remove devlog
   claude mcp add devlog -s user -e DEVLOG_API_KEY="your_key" -- npx -y devlog-mcp@latest
   ```

2. **Verify API key** is production key (`dvlg_sk_prod_...`)

3. **Check server status**: https://devlog-mcp-production.bilal-kosika.workers.dev/health

### Connection Issues

1. **Test manually**:
   ```bash
   DEVLOG_API_KEY=your_key DEVLOG_DEBUG=true npx devlog-mcp@latest
   ```

2. **Check Claude logs** for detailed error messages

3. **Verify internet connection** and firewall settings

### Authentication Errors

- Ensure API key starts with `dvlg_sk_prod_`
- Regenerate API key if needed
- Check key hasn't been revoked in Devlog settings

## Rate Limits & Performance

| Tier | Requests/Minute | Use Case |
|------|----------------|----------|
| **Free** | 10/min | Personal projects |
| **Pro** | 100/min | Professional use |
| **Team** | 500/min | Team collaboration |
| **Enterprise** | 1000/min | Large organizations |

## Testing

Run the test suite:

```bash
npm test
```

Run manual integration test:
```bash
DEVLOG_API_KEY=your_key npm run test:manual
```

## API Status

- **Health Check**: https://devlog-mcp-production.bilal-kosika.workers.dev/health
- **Server Info**: https://devlog-mcp-production.bilal-kosika.workers.dev/info
- **Protocol Version**: MCP 2025-03-26
- **Uptime**: 99.99% (Cloudflare SLA)

## Support & Contributing

- **Issues**: [GitHub Issues](https://github.com/ALPHAbilal/devlog-mcp-client/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ALPHAbilal/devlog-mcp-client/discussions)
- **Documentation**: [MCP Complete Explanation](https://github.com/ALPHAbilal/devlog/blob/main/MCP_COMPLETE_EXPLANATION.md)
- **Status Page**: [Server Status](https://devlog-mcp-production.bilal-kosika.workers.dev/health)

## License

MIT © [Bilal Koşika](https://github.com/ALPHAbilal)

---

🚀 **Ready to connect your Devlog to AI? Run the quick start command above!**