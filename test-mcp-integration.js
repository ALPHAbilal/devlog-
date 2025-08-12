#!/usr/bin/env node

/**
 * Test script for Devlog MCP Integration
 * This tests your production API key with the deployed MCP server
 */

const DEVLOG_API_KEY = 'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a';
const DEVLOG_REMOTE_URL = 'https://devlog-mcp-production.bilal-kosika.workers.dev';

async function testMCPIntegration() {
  console.log('🚀 Testing Devlog MCP Integration...\n');
  
  // Test 1: Check health
  console.log('1️⃣ Testing health endpoint...');
  const healthResponse = await fetch(`${DEVLOG_REMOTE_URL}/health`, {
    headers: {
      'Authorization': `Bearer ${DEVLOG_API_KEY}`
    }
  });
  console.log(`   ✅ Health: ${await healthResponse.text()}\n`);
  
  // Test 2: List tools
  console.log('2️⃣ Testing tools endpoint...');
  const toolsResponse = await fetch(`${DEVLOG_REMOTE_URL}/api/tools`, {
    headers: {
      'Authorization': `Bearer ${DEVLOG_API_KEY}`
    }
  });
  const tools = await toolsResponse.json();
  console.log(`   ✅ Found ${tools.tools.length} tools:`);
  tools.tools.forEach(tool => {
    console.log(`      - ${tool.name}`);
  });
  console.log();
  
  // Test 3: Search documents
  console.log('3️⃣ Testing search...');
  const searchResponse = await fetch(`${DEVLOG_REMOTE_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEVLOG_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'search_documents',
      arguments: {
        query: 'test',
        limit: 5
      }
    })
  });
  const searchResult = await searchResponse.json();
  console.log(`   ✅ Search result: ${searchResult.result[0].text}\n`);
  
  // Test 4: Create a document
  console.log('4️⃣ Testing document creation...');
  const createResponse = await fetch(`${DEVLOG_REMOTE_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEVLOG_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'create_document',
      arguments: {
        title: `MCP Test Document - ${new Date().toISOString()}`,
        blocks: [
          {
            type: 'heading',
            content: '🎉 MCP Integration Test'
          },
          {
            type: 'text',
            content: 'This document was created via the MCP integration test script.'
          },
          {
            type: 'code',
            content: 'console.log("MCP is working!");',
            metadata: { language: 'javascript' }
          }
        ]
      }
    })
  });
  
  if (createResponse.ok) {
    const createResult = await createResponse.json();
    console.log(`   ✅ ${createResult.result[0].text}\n`);
    
    // Extract document ID if present
    const match = createResult.result[0].text.match(/ID: ([a-f0-9-]+)/);
    if (match) {
      const docId = match[1];
      
      // Test 5: Get the created document
      console.log('5️⃣ Testing document retrieval...');
      const getResponse = await fetch(`${DEVLOG_REMOTE_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEVLOG_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'get_document',
          arguments: {
            id: docId,
            semantic: false
          }
        })
      });
      const getResult = await getResponse.json();
      if (getResult.result && getResult.result[0]) {
        const docData = JSON.parse(getResult.result[0].text);
        console.log(`   ✅ Retrieved document: "${docData.document.title}"\n`);
      }
    }
  } else {
    const error = await createResponse.text();
    console.log(`   ❌ Error: ${error}\n`);
  }
  
  console.log('✨ MCP Integration test complete!\n');
  console.log('📝 Configuration for Claude Desktop:');
  console.log(JSON.stringify({
    mcpServers: {
      devlog: {
        command: "node",
        args: ["/path/to/devlog-mcp-client/src/index.js"],
        env: {
          DEVLOG_API_KEY: DEVLOG_API_KEY,
          DEVLOG_REMOTE_URL: DEVLOG_REMOTE_URL
        }
      }
    }
  }, null, 2));
}

// Run the test
testMCPIntegration().catch(console.error);