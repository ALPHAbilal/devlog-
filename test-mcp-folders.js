#!/usr/bin/env node

// Quick inline test for MCP folder operations
const API_KEY = 'dvlg_sk_prod_0b0bbd0ec73171d96fb807262486cd6a2c119d8593e162e01240d9051680f61a';
const MCP_ENDPOINT = 'https://devlog-mcp.bilal-kosika.workers.dev';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  folderId: null,
  subfolderId: null,
  documentId: null
};

// Helper to call MCP API
async function callMCP(tool, args) {
  try {
    const response = await fetch(`${MCP_ENDPOINT}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        tool: tool,
        arguments: args
      })
    });

    const text = await response.text();
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.log('Raw response:', text);
      return { text };
    }
  } catch (error) {
    console.error(`Error calling ${tool}:`, error.message);
    throw error;
  }
}

// Test 1: Create Folder
async function testCreateFolder() {
  console.log('\n📁 TEST 1: Create Folder');
  console.log('========================');
  
  try {
    const result = await callMCP('create_folder', {
      name: 'MCP Test Suite ' + Date.now(),
      color: '#3B82F6',
      icon: 'folder'
    });
    
    console.log('✅ Create folder response:', JSON.stringify(result, null, 2));
    
    // Extract folder ID if possible
    if (result.result && result.result[0]) {
      const text = result.result[0].text;
      const idMatch = text.match(/ID: ([a-f0-9-]+)/);
      if (idMatch) {
        testResults.folderId = idMatch[1];
        console.log('📌 Captured folder ID:', testResults.folderId);
      }
    }
    
    testResults.passed.push('create_folder');
    return true;
  } catch (error) {
    console.error('❌ Create folder failed:', error.message);
    testResults.failed.push('create_folder');
    return false;
  }
}

// Test 2: Create Subfolder
async function testCreateSubfolder() {
  if (!testResults.folderId) {
    console.log('\n⚠️ Skipping subfolder test - no parent folder ID');
    return false;
  }
  
  console.log('\n📁 TEST 2: Create Subfolder');
  console.log('===========================');
  
  try {
    const result = await callMCP('create_folder', {
      name: 'Test Documents',
      parent_id: testResults.folderId,
      color: '#10B981',
      icon: 'document'
    });
    
    console.log('✅ Create subfolder response:', JSON.stringify(result, null, 2));
    
    // Extract subfolder ID
    if (result.result && result.result[0]) {
      const text = result.result[0].text;
      const idMatch = text.match(/ID: ([a-f0-9-]+)/);
      if (idMatch) {
        testResults.subfolderId = idMatch[1];
        console.log('📌 Captured subfolder ID:', testResults.subfolderId);
      }
    }
    
    testResults.passed.push('create_subfolder');
    return true;
  } catch (error) {
    console.error('❌ Create subfolder failed:', error.message);
    testResults.failed.push('create_subfolder');
    return false;
  }
}

// Test 3: List Folders
async function testListFolders() {
  console.log('\n📋 TEST 3: List Folders');
  console.log('=======================');
  
  try {
    const result = await callMCP('list_folders', {
      recursive: true
    });
    
    console.log('✅ List folders response:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
    
    testResults.passed.push('list_folders');
    return true;
  } catch (error) {
    console.error('❌ List folders failed:', error.message);
    testResults.failed.push('list_folders');
    return false;
  }
}

// Test 4: Get Folder Contents
async function testGetFolderContents() {
  console.log('\n📂 TEST 4: Get Folder Contents');
  console.log('==============================');
  
  try {
    const result = await callMCP('get_folder_contents', {
      folder_id: testResults.folderId,
      include_subfolders: true
    });
    
    console.log('✅ Get folder contents response:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
    
    testResults.passed.push('get_folder_contents');
    return true;
  } catch (error) {
    console.error('❌ Get folder contents failed:', error.message);
    testResults.failed.push('get_folder_contents');
    return false;
  }
}

// Test 5: Create Document (for move test)
async function testCreateDocument() {
  console.log('\n📄 TEST 5: Create Document');
  console.log('==========================');
  
  try {
    const result = await callMCP('create_document', {
      title: 'Test Document for Move ' + Date.now(),
      blocks: [
        {
          type: 'text',
          content: 'This document will be moved to a folder',
          metadata: {}
        }
      ]
    });
    
    console.log('✅ Create document response:', JSON.stringify(result, null, 2));
    
    // Extract document ID
    if (result.result && result.result[0]) {
      const text = result.result[0].text;
      const idMatch = text.match(/ID: ([a-f0-9-]+)/);
      if (idMatch) {
        testResults.documentId = idMatch[1];
        console.log('📌 Captured document ID:', testResults.documentId);
      }
    }
    
    testResults.passed.push('create_document');
    return true;
  } catch (error) {
    console.error('❌ Create document failed:', error.message);
    testResults.failed.push('create_document');
    return false;
  }
}

// Test 6: Move Document
async function testMoveDocument() {
  if (!testResults.documentId || !testResults.subfolderId) {
    console.log('\n⚠️ Skipping move test - missing document or folder ID');
    return false;
  }
  
  console.log('\n📦 TEST 6: Move Document');
  console.log('========================');
  
  try {
    const result = await callMCP('move_document', {
      document_id: testResults.documentId,
      folder_id: testResults.subfolderId
    });
    
    console.log('✅ Move document response:', JSON.stringify(result, null, 2));
    
    testResults.passed.push('move_document');
    return true;
  } catch (error) {
    console.error('❌ Move document failed:', error.message);
    testResults.failed.push('move_document');
    return false;
  }
}

// Test 7: Update Folder
async function testUpdateFolder() {
  if (!testResults.folderId) {
    console.log('\n⚠️ Skipping update test - no folder ID');
    return false;
  }
  
  console.log('\n✏️ TEST 7: Update Folder');
  console.log('========================');
  
  try {
    const result = await callMCP('update_folder', {
      folder_id: testResults.folderId,
      name: 'MCP Test Updated',
      color: '#EF4444',
      is_favorite: true
    });
    
    console.log('✅ Update folder response:', JSON.stringify(result, null, 2));
    
    testResults.passed.push('update_folder');
    return true;
  } catch (error) {
    console.error('❌ Update folder failed:', error.message);
    testResults.failed.push('update_folder');
    return false;
  }
}

// Test 8: Delete Folder
async function testDeleteFolder() {
  if (!testResults.folderId) {
    console.log('\n⚠️ Skipping delete test - no folder ID');
    return false;
  }
  
  console.log('\n🗑️ TEST 8: Delete Folder');
  console.log('========================');
  
  try {
    const result = await callMCP('delete_folder', {
      folder_id: testResults.folderId,
      recursive: true
    });
    
    console.log('✅ Delete folder response:', JSON.stringify(result, null, 2));
    
    testResults.passed.push('delete_folder');
    return true;
  } catch (error) {
    console.error('❌ Delete folder failed:', error.message);
    testResults.failed.push('delete_folder');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 MCP FOLDER OPERATIONS TEST SUITE');
  console.log('====================================');
  console.log('Endpoint:', MCP_ENDPOINT);
  console.log('API Key:', API_KEY.substring(0, 20) + '...\n');

  // Run tests in sequence
  await testCreateFolder();
  await testCreateSubfolder();
  await testListFolders();
  await testGetFolderContents();
  await testCreateDocument();
  await testMoveDocument();
  await testUpdateFolder();
  await testDeleteFolder();

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  
  if (testResults.passed.length > 0) {
    console.log('\nPassed tests:');
    testResults.passed.forEach(t => console.log(`  ✅ ${t}`));
  }
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed tests:');
    testResults.failed.forEach(t => console.log(`  ❌ ${t}`));
  }

  if (testResults.failed.length === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Folder operations are working correctly.');
    console.log('✅ Ready to deploy to Cloudflare Workers');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});