# Journey Log MCP Server

Connect your AI coding assistants (Claude Desktop, Cursor, VS Code) to Journey Log and automatically document your development journey.

## What is Journey Log?

Journey Log Compass is a platform that helps developers document their AI-assisted coding journeys. With this MCP server, you can:

- 📝 Create documentation directly from your AI conversations
- 💾 Save code snippets and debugging sessions
- 🔄 Capture entire AI conversations with context
- 🏷️ Organize with tags and searchable content
- 🚀 Build a knowledge base from your development work

## Installation

```bash
npm install -g @journey-log/mcp-server
```

## Quick Start

### 1. Get your API Key

1. Sign in to [Journey Log](https://devlog.design)
2. Go to Settings → API Keys
3. Create a new API key
4. Copy the key (you'll only see it once!)

### 2. Configure Your AI Tool

<details>
<summary><b>Claude Code (Recommended - One Command!)</b></summary>

Simply run this command in your terminal:

```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_key_here" -- npx -y @journey-log/mcp-server
```

**Windows users (not WSL):**
```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_key_here" -- cmd /c npx -y @journey-log/mcp-server
```

That's it! Type `/mcp` in Claude Code to verify it's connected.

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Add to your Claude Desktop configuration:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "journey-log": {
      "command": "npx",
      "args": ["-y", "@journey-log/mcp-server"],
      "env": {
        "JOURNEY_LOG_API_KEY": "jl_your-api-key-here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

</details>

<details>
<summary><b>Cursor</b></summary>

Add to your Cursor settings:

```json
{
  "mcp.servers": {
    "journey-log": {
      "command": "npx",
      "args": ["-y", "@journey-log/mcp-server"],
      "env": {
        "JOURNEY_LOG_API_KEY": "jl_your-api-key-here"
      }
    }
  }
}
```

Restart Cursor after saving.

</details>

## Available Commands

Once configured, you can use these commands in your AI conversations:

### Create a new document
```
"Create a new Journey Log document about implementing authentication"
```

### Add content to a document
```
"Add this code snippet to my authentication document"
```

### Capture AI conversations
```
"Save this entire debugging session to my Journey Log"
```

### List your documents
```
"Show me my recent Journey Log documents"
```

### Get a specific document
```
"Get my document about React hooks"
```

## Example Usage

### In Claude Code:

**You**: "I need to document this React hooks implementation. Create a journey log."

**Claude**: "I'll create a new Journey Log document for your React hooks implementation..."
*[Creates document with title "React Hooks Implementation"]*

**You**: "Perfect! Now save our entire conversation about useEffect optimization."

**Claude**: "I'll capture our conversation about useEffect optimization to your document..."
*[Saves the full conversation with code examples]*

### In Claude Desktop:

**You**: "I'm working on a new feature for user authentication. Create a Journey Log document to track this."

**Claude**: "I'll create a new Journey Log document for your authentication feature..."
*[Creates document automatically]*

**You**: "Great! Now add the JWT implementation code we just discussed."

**Claude**: "I'll add the JWT implementation to your document..."
*[Adds code block automatically]*

### In Cursor:

While coding, you can ask Cursor to:
- Document bug fixes: "Save this bug fix to Journey Log with the solution"
- Track learning: "Create a Journey Log entry about what I learned with React hooks"
- Save snippets: "Add this utility function to my Journey Log snippets document"

## Tool Reference

### create_document
Create a new Journey Log document.

**Parameters:**
- `title` (required): Document title
- `content` (optional): Initial content
- `tags` (optional): Array of tags for organization

### add_block
Add content blocks to existing documents.

**Parameters:**
- `document_id` (required): Target document ID
- `type` (required): Block type (text, code, heading, list, checkbox, ai_conversation)
- `content` (required): Block content
- `metadata` (optional): Additional metadata (e.g., language for code blocks)

### capture_conversation
Save AI conversations with full context.

**Parameters:**
- `document_id` (required): Target document ID
- `conversation` (required): Array of messages with role and content
- `context` (optional): Additional context
- `summary` (optional): Conversation summary

### list_documents
List your Journey Log documents.

**Parameters:**
- `limit` (optional): Maximum documents to return (default: 50)
- `tags` (optional): Filter by tags
- `search` (optional): Search in titles

### get_document
Retrieve a specific document with all its content.

**Parameters:**
- `document_id` (required): Document ID to retrieve

## Troubleshooting

### Claude Code Specific

**Check MCP status:**
```bash
# In Claude Code, type:
/mcp
```

**View all MCP servers:**
```bash
claude mcp list
```

**Remove and reinstall:**
```bash
claude mcp remove journey-log
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_key" -- npx -y @journey-log/mcp-server
```

### "API key not found" error
Make sure `JOURNEY_LOG_API_KEY` is set correctly:
- Claude Code: Re-run the `claude mcp add` command with your key
- Claude Desktop/Cursor: Check your configuration JSON

### "Tool not available" error
1. Verify the MCP server is properly configured
2. Restart the application
3. Check if Journey Log appears when you ask "What MCP tools are available?"
4. For Claude Code, ensure the server shows up in `claude mcp list`

### Connection errors
- Check your internet connection
- Verify your API key is valid at https://devlog.design/settings/api
- Ensure you haven't exceeded rate limits
- Try removing and re-adding the MCP server

## Development

To contribute or modify the MCP server:

```bash
git clone https://github.com/journey-log/mcp-server
cd mcp-server
npm install
npm link
```

## Security

- API keys are stored locally in your MCP configuration
- All communication uses HTTPS
- Keys are never exposed in documents or logs
- Rate limiting prevents abuse

## Support

- 📧 Email: support@devlog.design
- 🐛 Issues: [GitHub Issues](https://github.com/journey-log/mcp-server/issues)
- 📖 Docs: [Journey Log Documentation](https://devlog.design/docs)

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ by the Journey Log team. Happy documenting!