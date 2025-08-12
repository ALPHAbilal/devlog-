#!/usr/bin/env node

import fetch from 'node-fetch';

const REMOTE_URL = 'https://devlog-mcp.bilal-kosika.workers.dev';
const TEST_API_KEY = 'dvlg_sk_test_123';

async function testConnection() {
  console.log('Testing connection to Devlog MCP server...\n');

  // Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthResponse = await fetch(`${REMOTE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`
      }
    });
    const healthText = await healthResponse.text();
    console.log(`   ✅ Health check: ${healthText}`);
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
  }

  // Test API info endpoint
  console.log('\n2. Testing API info endpoint...');
  try {
    const infoResponse = await fetch(`${REMOTE_URL}/api/info`, {
      headers: {
        'Authorization': `Bearer ${TEST_API_KEY}`
      }
    });
    const infoData = await infoResponse.json();
    console.log('   ✅ API info received:');
    console.log(`      - Name: ${infoData.name}`);
    console.log(`      - Version: ${infoData.version}`);
    console.log(`      - Protocol: ${infoData.protocol}`);
    console.log(`      - Tools enabled: ${infoData.capabilities.tools}`);
  } catch (error) {
    console.log(`   ❌ API info failed: ${error.message}`);
  }

  console.log('\n✨ Connection test complete!');
}

testConnection().catch(console.error);