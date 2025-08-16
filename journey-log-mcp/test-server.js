#!/usr/bin/env node

// Test script for Journey Log MCP Server
// This simulates MCP protocol messages to verify the server works correctly

import { spawn } from 'child_process';

const testMessages = [
  // Initialize
  {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    },
    id: 1
  },
  // List tools
  {
    jsonrpc: '2.0',
    method: 'tools/list',
    id: 2
  },
  // Test create document (will fail without API key)
  {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'create_document',
      arguments: {
        title: 'Test Document',
        content: 'This is a test',
        tags: ['test']
      }
    },
    id: 3
  }
];

async function testServer() {
  console.log('Starting Journey Log MCP Server test...\n');

  // Set a test API key (this will fail with actual API calls but tests protocol)
  const env = { ...process.env, JOURNEY_LOG_API_KEY: 'test-key' };
  
  const server = spawn('node', ['src/server.js'], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseBuffer = '';

  server.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // Try to parse complete JSON responses
    const lines = responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const response = JSON.parse(line);
          console.log('Response:', JSON.stringify(response, null, 2));
          console.log('---');
        } catch (e) {
          // Not valid JSON yet, continue buffering
        }
      }
    }
    // Keep the last incomplete line in the buffer
    responseBuffer = lines[lines.length - 1];
  });

  server.stderr.on('data', (data) => {
    console.error('Server log:', data.toString().trim());
  });

  // Send test messages
  for (const message of testMessages) {
    console.log('Sending:', JSON.stringify(message, null, 2));
    server.stdin.write(JSON.stringify(message) + '\n');
    
    // Wait a bit between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Wait for responses
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Clean shutdown
  server.kill();
  console.log('\nTest completed!');
}

testServer().catch(console.error);