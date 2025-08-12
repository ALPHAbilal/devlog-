#!/usr/bin/env node

/**
 * CommonJS wrapper to ensure environment variables are properly passed
 * This solves the NPX + ESM environment variable inheritance issue
 */

const { spawn } = require('child_process');
const path = require('path');

// Debug logging
if (process.env.DEVLOG_DEBUG === 'true') {
  console.error('[WRAPPER DEBUG] Environment variables in wrapper:', {
    DEVLOG_API_KEY: process.env.DEVLOG_API_KEY ? 'SET' : 'NOT SET',
    DEVLOG_REMOTE_URL: process.env.DEVLOG_REMOTE_URL || 'NOT SET',
    DEVLOG_DEBUG: process.env.DEVLOG_DEBUG || 'NOT SET',
    execPath: process.execPath,
    cwd: process.cwd()
  });
}

// Preserve ALL environment variables and ensure our specific ones are set
const env = {
  ...process.env,
  DEVLOG_API_KEY: process.env.DEVLOG_API_KEY,
  DEVLOG_REMOTE_URL: process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp-production.bilal-kosika.workers.dev',
  DEVLOG_DEBUG: process.env.DEVLOG_DEBUG || 'false'
};

// Check for API key
if (!env.DEVLOG_API_KEY) {
  console.error('Error: DEVLOG_API_KEY environment variable is required');
  console.error('Please set it in your Claude Desktop or VS Code configuration');
  console.error('');
  console.error('Example for Claude Code:');
  console.error('claude mcp add devlog -e DEVLOG_API_KEY="your-key" -- npx -y devlog-mcp');
  process.exit(1);
}

// Path to the actual ESM CLI script
const cliPath = path.join(__dirname, '..', 'src', 'cli.js');

if (process.env.DEVLOG_DEBUG === 'true') {
  console.error('[WRAPPER DEBUG] Spawning Node with:', {
    cliPath,
    apiKeyProvided: !!env.DEVLOG_API_KEY,
    remoteUrl: env.DEVLOG_REMOTE_URL
  });
}

// Spawn node with the ESM CLI script and ensure environment is passed
const child = spawn(process.execPath, [cliPath], {
  env: env,
  stdio: 'inherit',
  shell: false
});

child.on('error', (error) => {
  console.error('Failed to start MCP client:', error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});