# Devlog MCP User Setup Guide

Connect your AI assistant to Devlog in under 2 minutes! 🚀

## Quick Start (30 seconds)

### For Claude Desktop Users

1. **Get your API key** from [devlog.design/settings/api-keys](https://devlog.design/settings/api-keys)

2. **Add to Claude Desktop config**:
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. **Add this configuration**:
   ```json
   {
     "mcpServers": {
       "devlog": {
         "command": "npx",
         "args": ["-y", "@devlog/mcp-client"],
         "env": {
           "DEVLOG_API_KEY": "dvlg_sk_live_YOUR_KEY_HERE"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop** - That's it! 🎉

## What You Can Do Now

Ask Claude to help with your Devlog:

### 📝 Document Management
- "Create a new document about React performance optimization"
- "Show me all my documents tagged with 'api'"
- "Find my Python tutorial documents"

### 💻 Code Blocks
- "Add this TypeScript code to my utils document"
- "Show me all code blocks with JavaScript"
- "Update the auth code in my backend guide"

### 🤖 AI Conversations
- "Save this conversation about database design"
- "Show me my previous AI discussions about algorithms"
- "Add our chat about React hooks to my learning journal"

### 📁 Project Structure
- "Analyze the file structure in my project documentation"
- "Show me the filetree from my app architecture doc"
- "What files are in my React project structure?"

### ✅ Task Management
- "List all todos from my sprint planning"
- "Show incomplete tasks across all documents"
- "Add a todo for refactoring the auth system"

### 🔄 Version Tracking
- "Compare versions of my API implementation"
- "Show version history for the database schema"
- "Track changes in my config files"

## Advanced Features

### Semantic Mode (90% Faster)

For large documents, use semantic mode:
```
"Get my complete tutorial in semantic mode"
```

This returns an AI-optimized summary that's 90% smaller but retains all key information.

### Batch Operations

Process multiple items at once:
```
"Add these 5 code examples to my snippets document"
"Update all todos in my project planning doc"
```

### Cross-Document Search

Search across your entire knowledge base:
```
"Find all mentions of Redux across my documents"
"Show me every document with Python code blocks"
```

## VS Code / Cursor Setup

### Option 1: Command Palette (Coming Soon)
```bash
Cmd/Ctrl + Shift + P → "MCP: Add Devlog"
```

### Option 2: Manual Setup
Add to your `settings.json`:
```json
{
  "mcp.servers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "@devlog/mcp-client"],
      "env": {
        "DEVLOG_API_KEY": "dvlg_sk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

## Pricing & Limits

### Free Tier
- ✅ 10,000 requests/month
- ✅ All block types
- ✅ 5 documents
- ⚡ 10 requests/minute

### Pro Tier ($12/month)
- ✅ 1,000,000 requests/month
- ✅ Unlimited documents
- ✅ Priority support
- ⚡ 100 requests/minute

### Team Tier ($29/month)
- ✅ 5,000,000 requests/month
- ✅ Real-time collaboration
- ✅ Admin dashboard
- ⚡ 500 requests/minute

## Troubleshooting

### "Connection failed"
1. Check your API key is correct
2. Ensure you have internet connection
3. Try regenerating your API key

### "Rate limit exceeded"
- Free users: Wait 1 minute
- Consider upgrading to Pro

### "Document not found"
- Ensure you're using the correct document ID
- Check the document hasn't been deleted

### Debug Mode
Add to your config for detailed logs:
```json
"env": {
  "DEVLOG_API_KEY": "your-key",
  "DEVLOG_DEBUG": "true"
}
```

## Security Best Practices

1. **Never share your API key**
2. **Regenerate keys periodically**
3. **Use read-only keys for shared systems**
4. **Monitor usage in your dashboard**

## Pro Tips

### 1. Natural Language Works Best
Instead of: "create_document title='Test'"
Say: "Create a new document called Test"

### 2. Be Specific with Searches
Instead of: "Show documents"
Say: "Show my React tutorials from last week"

### 3. Use Tags Effectively
"Create a document about Python with tags: tutorial, backend, api"

### 4. Leverage AI Memory
Claude remembers your conversation, so you can reference previous items:
"Add that code example to the document we just created"

## Getting Help

- 📚 **Docs**: [devlog.design/docs](https://devlog.design/docs)
- 💬 **Discord**: [discord.gg/devlog](https://discord.gg/devlog)
- 📧 **Email**: support@devlog.design
- 🐛 **Issues**: [github.com/devlog/mcp-client](https://github.com/devlog/mcp-client)

## What's Next?

1. **Explore all block types** - Try tables, images, and issue tracking
2. **Build your knowledge base** - Document your projects and learnings
3. **Share with your team** - Collaborate on documentation
4. **Automate workflows** - Use MCP in your CI/CD pipeline

Welcome to the future of AI-assisted documentation! 🚀