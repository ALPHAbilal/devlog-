I'll research the current MCP configuration methods for Claude Code to give you the exact installation commands and best practices.Perfect! I now have comprehensive information about Claude Code MCP configuration. Let me provide you with the exact commands and syntax you need.

# Claude Code MCP Configuration Research Results

Based on the latest information from 2025, here are the exact commands and best practices for configuring your Journey Log MCP server in Claude Code:

## 1. Exact Command Syntax

### Basic NPM Package Installation
```bash
claude mcp add journey-log -s user -- npx -y @journey-log/mcp-server
```

### With Environment Variables (Your Use Case)
```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="user_api_key_here" -- npx -y @journey-log/mcp-server
```

### Alternative Using `add-json` (More Flexible)
```bash
claude mcp add-json journey-log -s user '{
  "command": "npx",
  "args": ["-y", "@journey-log/mcp-server"],
  "env": {
    "JOURNEY_LOG_API_KEY": "user_api_key_here",
    "JOURNEY_LOG_BASE_URL": "https://api.devlog.design"
  }
}'
```

## 2. Command Breakdown

- **`claude mcp add`** - Base command for adding MCP servers
- **`journey-log`** - Your chosen server name (appears in Claude Code)
- **`-s user`** - Scope: `local` (project only), `project` (shared), or `user` (all projects)
- **`-e KEY=value`** - Environment variable flag (can use multiple times)
- **`--`** - Separator between Claude Code flags and the actual server command
- **`npx -y @journey-log/mcp-server`** - Your NPM package execution command

## 3. Environment Variable Options

### Method 1: Inline with command
```bash
claude mcp add journey-log -s user \
  -e JOURNEY_LOG_API_KEY="user_api_key" \
  -e JOURNEY_LOG_BASE_URL="https://api.devlog.design" \
  -- npx -y @journey-log/mcp-server
```

### Method 2: Using add-json (Recommended for complex configs)
```bash
claude mcp add-json journey-log -s user '{
  "command": "npx",
  "args": ["-y", "@journey-log/mcp-server"],
  "env": {
    "JOURNEY_LOG_API_KEY": "user_api_key_here",
    "JOURNEY_LOG_BASE_URL": "https://api.devlog.design",
    "DEBUG": "false"
  }
}'
```

## 4. Complete User Installation Instructions

### For Your README.md:

```markdown
## Installation in Claude Code

1. **Get your API key** from [Journey Log Compass](https://devlog.design/settings/api)

2. **Install the MCP server** (choose one method):

   **Option A: Simple command**
   ```bash
   claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_api_key_here" -- npx -y @journey-log/mcp-server
   ```

   **Option B: Full configuration**
   ```bash
   claude mcp add-json journey-log -s user '{
     "command": "npx",
     "args": ["-y", "@journey-log/mcp-server"],
     "env": {
       "JOURNEY_LOG_API_KEY": "your_api_key_here"
     }
   }'
   ```

3. **Verify installation**
   ```bash
   claude mcp list
   ```
   You should see `journey-log` in the list.

4. **Test in Claude Code**
   Start Claude Code and try: *"Create a journey log about setting up MCP"*
```

## 5. Management Commands

```bash
# List all MCP servers
claude mcp list

# Check specific server details
claude mcp get journey-log

# Remove server
claude mcp remove journey-log

# Check MCP status inside Claude Code
/mcp
```

## 6. Scopes Explained

- **`-s local`** (default): Available only in current project
- **`-s project`**: Shared with team via `.mcp.json` file
- **`-s user`**: Available across all your projects (recommended for your use case)

## 7. Windows Users Special Note

On Windows (not WSL), use the `cmd /c` wrapper:
```bash
claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="your_key" -- cmd /c npx -y @journey-log/mcp-server
```

## 8. Troubleshooting Commands

```bash
# Check if server is connected
/mcp

# View server logs (inside Claude Code)
# The /mcp command will show connection status

# Debug mode (set before running Claude Code)
export ANTHROPIC_LOG=debug
claude
```

## 9. Update Process

**Users can update without removing and re-adding:**
- NPM packages with `npx` automatically use the latest version
- For forced updates: `npx clear-npx-cache` then restart Claude Code
- Or users can manually remove and re-add: `claude mcp remove journey-log` then re-add

## 10. Configuration File Location

Claude Code stores MCP configurations in:
- **macOS/Linux**: `~/.claude/claude.json`
- **Windows**: `%USERPROFILE%\.claude\claude.json`

Users can manually edit this file, but the CLI commands are safer.

## 11. Your Setup Wizard Integration

For your `@journey-log/setup` package, you can automate the Claude Code detection and setup:

```javascript
// In your setup wizard
async function setupClaudeCode(apiKey) {
  const { execSync } = require('child_process');
  
  try {
    // Check if Claude Code is installed
    execSync('claude --version', { stdio: 'pipe' });
    
    // Add the MCP server
    const command = `claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="${apiKey}" -- npx -y @journey-log/mcp-server`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Claude Code configured successfully!');
    console.log('Try: "Create a journey log about this setup"');
    
    return true;
  } catch (error) {
    console.log('ℹ️  Claude Code not found or not installed');
    return false;
  }
}
```

## Key Differences from Claude Desktop

- **Claude Code**: Single command line installation (much simpler!)
- **Claude Desktop**: JSON file editing required
- **Claude Code**: Built-in MCP management commands
- **Claude Desktop**: Manual configuration file management

The Claude Code approach is significantly more user-friendly for your Journey Log Compass users!