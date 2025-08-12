#!/usr/bin/env node

/**
 * Test API key validation directly
 */

const API_KEY = 'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a';
const MCP_URL = 'https://devlog-mcp-production.bilal-kosika.workers.dev';

async function testValidation() {
  console.log('🔍 Testing API Key Validation\n');
  console.log('=====================================\n');
  
  try {
    // Test 1: Direct validation test
    console.log('1️⃣ Testing API key validation...');
    const response = await fetch(`${MCP_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('   ✅ API key is valid\n');
    } else {
      console.log('   ❌ API key validation failed:', response.status);
      const text = await response.text();
      console.log('   Response:', text, '\n');
    }
    
    // Test 2: Try to get user documents
    console.log('2️⃣ Testing document search (should return user\'s documents)...');
    const searchRes = await fetch(`${MCP_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'search_documents',
        arguments: { query: '', limit: 10 }
      })
    });
    
    if (searchRes.ok) {
      const result = await searchRes.json();
      console.log('   ✅ Search works:', result.result[0].text.split('\n')[0], '\n');
    } else {
      const error = await searchRes.text();
      console.log('   ❌ Search failed:', error, '\n');
    }
    
    // Test 3: Check what user_id is being used
    console.log('3️⃣ Debugging: Create with explicit user_id...');
    console.log('   Expected user_id: 8eac28e6-0127-40d1-ba55-c10cbe52a32b');
    
    const createRes = await fetch(`${MCP_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'create_document',
        arguments: {
          title: `Debug Test - ${new Date().toISOString()}`,
          blocks: [
            { type: 'text', content: 'Testing user_id assignment' }
          ]
        }
      })
    });
    
    if (createRes.ok) {
      const result = await createRes.json();
      console.log('   ✅ Document created:', result.result[0].text);
    } else {
      const error = await createRes.text();
      console.log('   ❌ Create failed:', error);
      
      // Parse the error to understand what's happening
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.error && errorObj.error.includes('row-level security')) {
          console.log('\n   📝 RLS Issue Detected!');
          console.log('   The user_id might not be properly set in the database operation.');
          console.log('   This suggests the MCP server is not passing the correct user_id.');
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n=====================================');
  console.log('✨ Validation test complete!\n');
}

testValidation().catch(console.error);