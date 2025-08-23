#!/usr/bin/env node

// Final test for Journey Log MCP folder operations
const API_KEY = 'dvlg_sk_test_123';

async function testFolderOperations() {
  // Import the API client
  const { ApiClient } = await import('./src/api-client.js');
  
  const client = new ApiClient(API_KEY);
  
  console.log('Testing Journey Log MCP Folder Operations\n');
  console.log('Using API Key:', API_KEY);
  console.log('Remote URL:', client.remoteUrl);
  console.log('\n' + '='.repeat(50) + '\n');
  
  try {
    // Test 1: Create a folder
    console.log('1. Creating folder...');
    const folder = await client.createFolder({
      name: 'Test Folder from NPM Package',
      color: '#10B981',
      icon: 'folder'
    });
    console.log('✅ Folder created:', folder);
    console.log('\n');
    
    // Test 2: List folders
    console.log('2. Listing folders...');
    const folders = await client.listFolders();
    console.log(`✅ Found ${folders.length} folders`);
    if (folders.length > 0) {
      console.log('First 5 folders:');
      folders.slice(0, 5).forEach(f => 
        console.log(`  - ${f.name} (${f.id})`)
      );
    }
    console.log('\n');
    
    // Test 3: Create a document for testing
    console.log('3. Creating test document...');
    const doc = await client.createDocument({
      title: 'Test Document for Folder Operations',
      content: 'This document will be moved to a folder'
    });
    console.log('✅ Document created:', doc.id);
    console.log('\n');
    
    // Test 4: Move document to folder
    if (folders.length > 0 && doc.id) {
      console.log('4. Moving document to folder...');
      const moveResult = await client.moveDocumentToFolder({
        document_id: doc.id,
        folder_id: folders[0].id
      });
      console.log('✅ Document moved to folder');
      console.log('\n');
    }
    
    console.log('='.repeat(50));
    console.log('✨ All tests passed! Folder operations work!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testFolderOperations().catch(console.error);