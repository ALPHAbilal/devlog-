#!/usr/bin/env node

/**
 * Manual test script for debugging MCP bridge issues
 * Run this to test the bridge without Claude
 */

import { spawn } from 'child_process';
import readline from 'readline';

const bridge = spawn('node', ['../src/index.js'], {
  env: {
    ...process.env,
    DEVLOG_API_KEY: process.env.DEVLOG_API_KEY || 'dvlg_sk_test_123',
    DEVLOG_DEBUG: 'true',
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

console.log('🚀 Starting MCP Bridge test...\n');

// Handle stderr (debug output)
bridge.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

// Handle stdout (MCP messages)
bridge.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

// Handle process exit
bridge.on('exit', (code) => {
  console.log(`\n❌ Bridge exited with code ${code}`);
  process.exit(code);
});

// Send test messages
async function sendMessage(message) {
  return new Promise((resolve) => {
    console.log('\n📤 Sending:', JSON.stringify(message, null, 2));
    bridge.stdin.write(JSON.stringify(message) + '\n');
    setTimeout(resolve, 1000);
  });
}

async function runTests() {
  try {
    // Wait for startup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 1: Initialize
    await sendMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    });
    
    // Test 2: List tools
    await sendMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    
    // Test 3: Call a tool
    await sendMessage({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_documents',
        arguments: {
          query: 'test',
          limit: 5,
        },
      },
    });
    
    console.log('\n✅ Tests completed! Press Ctrl+C to exit.');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

// Start tests after a short delay
setTimeout(runTests, 1000);

// Keep process alive
process.stdin.resume();