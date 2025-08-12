#!/usr/bin/env node

/**
 * Minimal replication of what the NPM package does
 */

import fetch from 'node-fetch';

const API_KEY = process.env.DEVLOG_API_KEY;
const REMOTE_URL = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp-production.bilal-kosika.workers.dev';
const DEBUG = process.env.DEVLOG_DEBUG === 'true';

function log(...args) {
  if (DEBUG) {
    console.error('[DEBUG]', ...args);
  }
}

async function initializeMCPSession() {
  try {
    log('Initializing MCP session with remote server...');
    
    const response = await fetch(`${REMOTE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: {
            name: 'devlog-mcp-client',
            version: '1.0.2'
          }
        },
        id: 1
      })
    });

    log('Response status:', response.status);
    log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      log('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Extract session ID from headers
    const sessionId = response.headers.get('Mcp-Session-Id');
    const result = await response.json();
    
    if (result.error) {
      throw new Error(`MCP initialization failed: ${result.error.message}`);
    }

    log('MCP session initialized successfully');
    log('Session ID:', sessionId);
    log('Server info:', result.result.serverInfo);
    
    console.log('✅ SUCCESS! MCP initialization working');
    return { sessionId, result };
    
  } catch (error) {
    console.error('❌ Failed to initialize MCP session:', error.message);
    throw error;
  }
}

// Run the test
initializeMCPSession().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});