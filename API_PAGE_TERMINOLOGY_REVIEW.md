# API Page Terminology Review

## Current Issues Found:

### 1. ✅ Confusing Terms (Need Fixing):
- **"development environment"** (line 320) - Too technical. Should be "AI tools" or "coding assistant"
- **"descriptive name to identify where you'll use this key"** (line 497) - Wordy. Simplify to "Name this key (e.g., Claude Code)"
- **"Connect Journey Log to your AI coding assistants and development tools"** - Repeated concept, could be simpler

### 2. ✅ Good Clear Terms (Keep):
- "API Keys" - Standard, clear
- "Create New Key" - Simple action
- "Quick Setup Guide" - Clear purpose
- "One-command setup" - Descriptive and simple
- "Active Keys" - Clear status

### 3. ❌ Potentially Confusing:
- **"MCP server"** - User might not know what MCP means
- **"Configure your editor's MCP settings"** - Technical jargon
- **"Hash the key for storage"** - In code comments, but still visible
- **"editor-specific configuration"** - Could be clearer

## Recommendations:

### Simple Replacements:
1. "development environment" → "AI tools"
2. "Configure your editor's MCP settings" → "Add your API key to VS Code/Cursor"
3. "Choose a descriptive name to identify where you'll use this key" → "Name this key (e.g., Claude Code)"
4. "See documentation for editor-specific configuration" → "Check docs for your editor's setup"

### Add Context:
- When mentioning "MCP server", add "(connects AI tools to Journey Log)"
- First mention of API key could include "(your secure access code)"

### Simplify Instructions:
- Current: "Generate a new API key to connect Journey Log to your development environment"
- Better: "Create a key to connect your AI tools to Journey Log"

## Cognitive Load Reduction:
1. Use consistent terms throughout (don't switch between "AI tools", "development tools", "coding assistants")
2. Avoid technical implementation details in user-facing text
3. Lead with benefits, not features ("Save your AI conversations" not "Connect via MCP protocol")
4. Use examples liberally (e.g., "Claude Code, VS Code" instead of just "your tools")