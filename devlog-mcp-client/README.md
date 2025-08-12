# Devlog MCP Client

Connect AI assistants like Claude Desktop and VS Code to your Devlog knowledge base using the Model Context Protocol (MCP).

> **Note**: This is a beta version. API key management is coming soon to the Devlog app. For now, use test API keys.

## Features

- 🚀 **One-line setup** - Get connected in seconds
- 🌐 **Remote server** - No local resources needed
- 🔒 **Secure** - API key authentication
- ⚡ **Fast** - Semantic snapshots reduce data by 90%
- 🎯 **All 11 block types** - Full Devlog feature support

## Quick Start

### 1. Get Your API Key

**For Beta Testing**: Use any test API key in this format: `dvlg_sk_test_anything`

**Coming Soon**: Visit your Devlog app settings to create production API keys.

### 2. Install for Claude Desktop

Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp"],
      "env": {
        "DEVLOG_API_KEY": "dvlg_sk_test_anything"
      }
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

### 3. Install for VS Code/Cursor

```bash
# Add to settings.json
{
  "mcp.servers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp"],
      "env": {
        "DEVLOG_API_KEY": "dvlg_sk_test_anything"
      }
    }
  }
}
```

## Usage

Once connected, you can ask your AI assistant to:

- **Create documents**: "Create a new Devlog document about React hooks"
- **Add blocks**: "Add a code block with this TypeScript example"
- **Search documents**: "Show me all my documents tagged with 'api'"
- **Analyze code**: "Analyze the filetree structure in my project docs"
- **Manage todos**: "List all todos from my sprint planning document"
- **Capture conversations**: "Save this conversation to my AI learnings document"

## Supported Block Types

All 11 Devlog block types are supported:

- 📝 **text** - Markdown with inline tags
- 💻 **code** - Syntax highlighting with file paths
- 🤖 **ai** - AI conversation preservation
- 📑 **heading** - Document structure
- 📁 **filetree** - Visual project structure
- 📊 **table** - Dynamic tables
- ✅ **todo** - Task lists
- 🖼️ **image** - Image galleries
- 🏞️ **inline-image** - Embedded images
- 🔄 **version-track** - Code version tracking
- 🐛 **issue-tracker** - Issue management

## Advanced Features

### Semantic Mode

For faster AI operations, use semantic mode which reduces data by 90%:

```
"Get my React tutorial document in semantic mode"
```

### Direct Connection (Advanced)

Skip the NPX wrapper and connect directly:

```json
{
  "mcpServers": {
    "devlog": {
      "uri": "https://devlog-mcp.bilal-kosika.workers.dev/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer dvlg_sk_test_anything"
      }
    }
  }
}
```

## Troubleshooting

### Connection Issues

1. Verify your API key is valid
2. Check your internet connection
3. Ensure you're using the latest client: `npx devlog-mcp@latest`

### MCP Connection Failed

If you see "Connection closed" errors:

1. **Enable debug mode** to see detailed logs:
   ```json
   {
     "mcpServers": {
       "devlog": {
         "command": "npx",
         "args": ["-y", "devlog-mcp@latest"],
         "env": {
           "DEVLOG_API_KEY": "your-api-key",
           "DEVLOG_DEBUG": "true"
         }
       }
     }
   }
   ```

2. **Test manually** to diagnose issues:
   ```bash
   DEVLOG_API_KEY=your-api-key DEVLOG_DEBUG=true npx devlog-mcp@latest
   ```

3. **Check Claude logs** for detailed error messages

### Rate Limits

- Free: 10 requests/minute
- Pro: 100 requests/minute
- Team: 500 requests/minute
- Enterprise: 1000 requests/minute

### Debug Mode

Set `DEVLOG_DEBUG=true` in your environment for detailed logs.

## Support

- Documentation: Coming soon
- Issues: [github.com/ALPHAbilal/devlog-mcp-client/issues](https://github.com/ALPHAbilal/devlog-mcp-client/issues)
- Server Status: [devlog-mcp.bilal-kosika.workers.dev/health](https://devlog-mcp.bilal-kosika.workers.dev/health)

## License

MIT © Devlog Team