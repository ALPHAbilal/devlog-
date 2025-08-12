#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check for required environment variables
const apiKey = process.env.DEVLOG_API_KEY;
const remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp.bilal-kosika.workers.dev';

if (!apiKey) {
  console.error('Error: DEVLOG_API_KEY environment variable is required');
  console.error('Please set it in your Claude Desktop or VS Code configuration');
  process.exit(1);
}

// Handle setup mode
if (process.argv.includes('--setup')) {
  console.log('Devlog MCP Client Setup');
  console.log('======================');
  console.log('');
  console.log('Add this to your Claude Desktop config:');
  console.log('');
  console.log(JSON.stringify({
    mcpServers: {
      devlog: {
        command: 'npx',
        args: ['-y', 'devlog-mcp'],
        env: {
          DEVLOG_API_KEY: 'your-api-key-here',
          DEVLOG_REMOTE_URL: remoteUrl
        }
      }
    }
  }, null, 2));
  console.log('');
  console.log('Get your API key at: https://devlog.design/settings/api-keys');
  process.exit(0);
}

// Start the MCP bridge client
const clientPath = join(__dirname, 'index.js');
const child = spawn('node', [clientPath], {
  env: {
    ...process.env,
    DEVLOG_API_KEY: apiKey,
    DEVLOG_REMOTE_URL: remoteUrl
  },
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start MCP client:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});