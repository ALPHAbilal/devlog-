#!/usr/bin/env node

/**
 * Test the search fix for MCP
 */

const API_KEY = 'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a';
const MCP_URL = 'https://devlog-mcp-production.bilal-kosika.workers.dev';

async function testSearch() {
  console.log('🔍 Testing MCP Search Fix\n');
  console.log('=====================================\n');
  
  try {
    // Test 1: Search with empty query (list all)
    console.log('1️⃣ Testing search with empty query...');
    const searchRes1 = await fetch(`${MCP_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'search_documents',
        arguments: { query: '', limit: 3 }
      })
    });
    
    if (searchRes1.ok) {
      const result1 = await searchRes1.json();
      console.log('   ✅ Empty query works:', result1.result[0].text.split('\n')[0]);
    } else {
      const error1 = await searchRes1.text();
      console.log('   ❌ Empty query failed:', error1);
    }
    
    // Test 2: Search with specific query
    console.log('\n2️⃣ Testing search with specific query...');
    const searchRes2 = await fetch(`${MCP_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'search_documents',
        arguments: { query: 'MCP', limit: 5 }
      })
    });
    
    if (searchRes2.ok) {
      const result2 = await searchRes2.json();
      console.log('   ✅ Query search works:', result2.result[0].text.split('\n')[0]);
    } else {
      const error2 = await searchRes2.text();
      console.log('   ❌ Query search failed:', error2);
    }
    
    // Test 3: Create and soft delete test
    console.log('\n3️⃣ Testing create and soft delete...');
    
    // Create test document
    const createRes = await fetch(`${MCP_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'create_document',
        arguments: {
          title: `Soft Delete Test - ${new Date().toISOString()}`,
          blocks: [
            { type: 'text', content: 'Testing soft delete functionality' }
          ]
        }
      })
    });
    
    if (createRes.ok) {
      const createResult = await createRes.json();
      console.log('   ✅ Document created:', createResult.result[0].text);
      
      // Extract document ID
      const match = createResult.result[0].text.match(/ID: ([a-f0-9-]+)/);
      if (match) {
        const docId = match[1];
        
        // Test soft delete
        const deleteRes = await fetch(`${MCP_URL}/api/execute`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tool: 'delete_document',
            arguments: { id: docId, hard_delete: false }
          })
        });
        
        if (deleteRes.ok) {
          const deleteResult = await deleteRes.json();
          console.log('   ✅ Soft delete works:', deleteResult.result[0].text);
        } else {
          const error = await deleteRes.text();
          console.log('   ❌ Soft delete failed:', error);
        }
      }
    } else {
      const error = await createRes.text();
      console.log('   ❌ Create failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n=====================================');
  console.log('✨ Test complete!\n');
}

testSearch().catch(console.error);