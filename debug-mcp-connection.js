#!/usr/bin/env node

/**
 * Debug MCP connection issues
 */

const API_KEY = 'dvlg_sk_prod_fc1cf9ace84ab4a47cb67a1e0ee75e6964eedfa04716a48330d020d231caf70e';
const MCP_URL = 'https://devlog-mcp-production.bilal-kosika.workers.dev';

async function debugConnection() {
  console.log('🔍 MCP CONNECTION DEBUG\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${MCP_URL}/health`);
    console.log(`   Status: ${healthResponse.status} - ${await healthResponse.text()}`);
    
    // Test 2: Initialize MCP session
    console.log('\n2. Testing MCP initialization...');
    const initResponse = await fetch(`${MCP_URL}/mcp`, {
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
            name: 'debug-test',
            version: '1.0.0'
          }
        },
        id: 1
      })
    });
    
    console.log(`   Status: ${initResponse.status}`);
    if (initResponse.ok) {
      const result = await initResponse.json();
      console.log(`   ✅ Success! Session ID: ${initResponse.headers.get('Mcp-Session-Id')}`);
      console.log(`   Server: ${result.result.serverInfo.name} v${result.result.serverInfo.version}`);
      
      const sessionId = initResponse.headers.get('Mcp-Session-Id');
      
      // Test 3: Tools list
      console.log('\n3. Testing tools list...');
      const toolsResponse = await fetch(`${MCP_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Mcp-Session-Id': sessionId
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2
        })
      });
      
      if (toolsResponse.ok) {
        const toolsResult = await toolsResponse.json();
        console.log(`   ✅ Tools available: ${toolsResult.result.tools.length}`);
        toolsResult.result.tools.forEach(tool => {
          console.log(`     - ${tool.name}`);
        });
        
        // Test 4: Search documents (this should work with production API)
        console.log('\n4. Testing search documents...');
        const searchResponse = await fetch(`${MCP_URL}/mcp`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Mcp-Session-Id': sessionId
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'search_documents',
              arguments: { query: '', limit: 3 }
            },
            id: 3
          })
        });
        
        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.error) {
            console.log(`   ❌ Error: ${searchResult.error.message}`);
          } else {
            console.log('   ✅ Search successful!');
            console.log(`   Result: ${searchResult.result.content[0].text.substring(0, 100)}...`);
          }
        } else {
          console.log(`   ❌ Search failed: ${searchResponse.status}`);
        }
      } else {
        console.log(`   ❌ Tools list failed: ${toolsResponse.status}`);
      }
      
    } else {
      const error = await initResponse.text();
      console.log(`   ❌ Failed: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugConnection().catch(console.error);