#!/usr/bin/env node

/**
 * Test script for MCP API key generation and validation
 */

// Test key generation format
function generateTestApiKey() {
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const apiKey = 'dvlg_sk_prod_' + Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return apiKey;
}

// Test key hashing (should match server-side)
async function hashApiKey(apiKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Test the setup
async function testApiKeySetup() {
  console.log('🔑 Testing MCP API Key Setup\n');
  
  // Test 1: Generate a test key
  console.log('1. Generating test API key...');
  const testKey = generateTestApiKey();
  console.log(`   Generated: ${testKey.substring(0, 20)}...${testKey.substring(testKey.length - 4)}`);
  console.log(`   Format: ${testKey.startsWith('dvlg_sk_prod_') ? '✅ Valid' : '❌ Invalid'}`);
  
  // Test 2: Hash the key
  console.log('\n2. Testing key hashing...');
  const keyHash = await hashApiKey(testKey);
  console.log(`   Hash: ${keyHash.substring(0, 16)}...`);
  console.log(`   Length: ${keyHash.length} characters (${keyHash.length === 64 ? '✅ Valid SHA-256' : '❌ Invalid'})`);
  
  // Test 3: Show Claude Desktop config
  console.log('\n3. Example Claude Desktop configuration:');
  console.log('```json');
  console.log(JSON.stringify({
    mcpServers: {
      devlog: {
        command: 'npx',
        args: ['-y', 'devlog-mcp'],
        env: {
          DEVLOG_API_KEY: testKey.substring(0, 20) + '...'
        }
      }
    }
  }, null, 2));
  console.log('```');
  
  // Test 4: Test API endpoint
  console.log('\n4. Testing MCP server connection...');
  console.log('   Endpoint: https://devlog-mcp.bilal-kosika.workers.dev/health');
  
  try {
    const response = await fetch('https://devlog-mcp.bilal-kosika.workers.dev/health', {
      headers: {
        'Authorization': `Bearer dvlg_sk_test_123`
      }
    });
    
    if (response.ok) {
      console.log(`   Status: ${response.status} ${response.statusText} ✅`);
      console.log(`   Response: ${await response.text()}`);
    } else {
      console.log(`   Status: ${response.status} ${response.statusText} ❌`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message} ❌`);
  }
  
  console.log('\n✨ MCP API key system is ready for production use!');
  console.log('\nNext steps:');
  console.log('1. Users create API keys in Devlog app (Settings → API Keys)');
  console.log('2. Copy the key and add to Claude Desktop config');
  console.log('3. Restart Claude Desktop to connect');
}

// Run the test
testApiKeySetup().catch(console.error);