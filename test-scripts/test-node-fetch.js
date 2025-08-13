#!/usr/bin/env node

/**
 * Test Node.js fetch vs curl to debug the difference
 */

import fetch from 'node-fetch';

const API_KEY = 'dvlg_sk_test_123';
const MCP_URL = 'https://devlog-mcp-production.bilal-kosika.workers.dev';

async function testNodeFetch() {
  console.log('🧪 Testing Node.js fetch vs curl\n');
  
  try {
    console.log('Making fetch request...');
    const response = await fetch(`${MCP_URL}/mcp`, {
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
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:', result);
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  }
}

testNodeFetch();