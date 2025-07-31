# Claude Code MCP Setup Guide

This guide provides comprehensive instructions for setting up Journey Log MCP server in Claude Code.

## Prerequisites

- Claude Code installed and working
- A Journey Log account at [devlog.design](https://devlog.design)
- Your Journey Log API key

## Installation Methods

### Method 1: Simple Command (Recommended)

This is the easiest way to get started:

```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_api_key_here" -- npx -y @journey-log/mcp-server
```

**For Windows (not WSL):**
```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_api_key_here" -- cmd /c npx -y @journey-log/mcp-server
```

### Method 2: Advanced Configuration (add-json)

For more control over the configuration:

```bash
claude mcp add-json journey-log -s user '{
  "command": "npx",
  "args": ["-y", "@journey-log/mcp-server"],
  "env": {
    "JOURNEY_LOG_API_KEY": "your_api_key_here",
    "JOURNEY_LOG_BASE_URL": "https://api.devlog.design",
    "DEBUG": "false"
  }
}'
```

## Command Breakdown

Understanding each part of the command:

- `claude mcp add` - Base command for adding MCP servers
- `journey-log` - The name you'll see in Claude Code
- `-s user` - Scope (user = all projects, project = current project, local = project-specific)
- `-e KEY=value` - Environment variable (your API key)
- `--` - Separator between Claude flags and server command
- `npx -y @journey-log/mcp-server` - Execute the NPM package

## Verification Steps

### 1. Check Installation

List all installed MCP servers:
```bash
claude mcp list
```

You should see `journey-log` in the list.

### 2. Verify in Claude Code

Type this in Claude Code:
```
/mcp
```

You should see Journey Log listed as a connected server.

### 3. Test the Tools

Ask Claude Code:
```
"What Journey Log tools are available?"
```

Claude should list:
- create_document
- add_block
- capture_conversation
- list_documents
- get_document

## Management Commands

### View Server Details
```bash
claude mcp get journey-log
```

### Update API Key
Remove and re-add with new key:
```bash
claude mcp remove journey-log
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="new_key" -- npx -y @journey-log/mcp-server
```

### Remove Server
```bash
claude mcp remove journey-log
```

### Check Configuration File
Your configuration is stored in:
- **macOS/Linux**: `~/.claude/claude.json`
- **Windows**: `%USERPROFILE%\.claude\claude.json`

## Scope Options Explained

### User Scope (-s user) - Recommended
```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="key" -- npx -y @journey-log/mcp-server
```
- Available in ALL your projects
- Configuration stored in user settings
- Perfect for personal tools like Journey Log

### Project Scope (-s project)
```bash
claude mcp add journey-log -s project -e JOURNEY_LOG_API_KEY="key" -- npx -y @journey-log/mcp-server
```
- Shared with team via `.mcp.json` in project
- Good for team-specific configurations
- API key visible to all team members

### Local Scope (-s local)
```bash
claude mcp add journey-log -s local -e JOURNEY_LOG_API_KEY="key" -- npx -y @journey-log/mcp-server
```
- Only for current project
- Not shared with team
- Stored in local project settings

## Advanced Usage

### Multiple Environment Variables
```bash
claude mcp add journey-log -s user \
  -e JOURNEY_LOG_API_KEY="your_key" \
  -e JOURNEY_LOG_DEBUG="true" \
  -e JOURNEY_LOG_TIMEOUT="30000" \
  -- npx -y @journey-log/mcp-server
```

### Custom Base URL (for self-hosted)
```bash
claude mcp add-json journey-log -s user '{
  "command": "npx",
  "args": ["-y", "@journey-log/mcp-server"],
  "env": {
    "JOURNEY_LOG_API_KEY": "your_key",
    "JOURNEY_LOG_BASE_URL": "https://your-domain.com/api/mcp"
  }
}'
```

## Troubleshooting

### "Command not found: claude"
- Ensure Claude Code is installed
- Try restarting your terminal
- Check if `claude` is in your PATH

### "MCP server failed to start"
1. Check your API key is valid
2. Ensure you have internet connection
3. Try with debug mode:
```bash
claude mcp add journey-log -s user \
  -e JOURNEY_LOG_API_KEY="your_key" \
  -e DEBUG="true" \
  -- npx -y @journey-log/mcp-server
```

### "Permission denied"
- On macOS/Linux, you might need to use `sudo` for global installations
- Consider using user scope instead of system scope

### Server Not Appearing in /mcp
1. Restart Claude Code completely
2. Check `claude mcp list` output
3. Remove and re-add the server

### API Key Issues
- Ensure your key starts with `jl_`
- Check for extra spaces or quotes
- Verify key at https://devlog.design/settings/api

## Best Practices

1. **Use User Scope**: Unless you need project-specific settings, use `-s user`
2. **Secure Your Keys**: Never commit API keys to version control
3. **Regular Updates**: NPM packages auto-update with npx
4. **Test First**: Use `/mcp` to verify connection before heavy usage

## Quick Reference

```bash
# Add Journey Log MCP
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="key" -- npx -y @journey-log/mcp-server

# List all MCPs
claude mcp list

# Check specific MCP
claude mcp get journey-log

# Remove MCP
claude mcp remove journey-log

# Check in Claude Code
/mcp
```

## Need Help?

- Documentation: https://devlog.design/docs
- Support: support@devlog.design
- GitHub Issues: https://github.com/journey-log/mcp-server/issues

Happy documenting! 🚀