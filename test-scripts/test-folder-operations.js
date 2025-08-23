#!/usr/bin/env node

/**
 * Test script for MCP folder operations
 * Tests all 6 folder management functions through the MCP API
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

const MCP_ENDPOINT = process.env.MCP_ENDPOINT || 'https://devlog-mcp.devlog.workers.dev';
const API_KEY = process.env.DEVLOG_API_KEY;

if (!API_KEY) {
  console.error('❌ DEVLOG_API_KEY environment variable is required');
  console.error('Please set it in your .env file or export it:');
  console.error('export DEVLOG_API_KEY="your-api-key-here"');
  process.exit(1);
}

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper function to call MCP tools
async function callMCPTool(toolName, args) {
  const response = await fetch(`${MCP_ENDPOINT}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tool: toolName,
      arguments: args
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MCP call failed: ${error}`);
  }

  return response.json();
}

// Test functions
async function testCreateFolder() {
  console.log(`\n${colors.blue}📁 Testing: Create Folder${colors.reset}`);
  
  try {
    // Create root folder
    const rootFolder = await callMCPTool('create_folder', {
      name: 'Test Project Alpha',
      color: '#3B82F6',
      icon: 'folder'
    });
    console.log(`${colors.green}✅ Created root folder:${colors.reset}`, rootFolder);
    
    // Parse the folder ID from the response
    const folderId = rootFolder.text?.match(/ID: ([a-f0-9-]+)/)?.[1];
    
    if (folderId) {
      // Create subfolder
      const subFolder = await callMCPTool('create_folder', {
        name: 'Documentation',
        parent_id: folderId,
        color: '#10B981',
        icon: 'book'
      });
      console.log(`${colors.green}✅ Created subfolder:${colors.reset}`, subFolder);
    }
    
    return folderId;
  } catch (error) {
    console.error(`${colors.red}❌ Create folder failed:${colors.reset}`, error.message);
    return null;
  }
}

async function testListFolders() {
  console.log(`\n${colors.blue}📋 Testing: List Folders${colors.reset}`);
  
  try {
    // List all folders
    const folders = await callMCPTool('list_folders', {
      recursive: true
    });
    console.log(`${colors.green}✅ Listed folders:${colors.reset}`);
    
    // Parse and display folder structure
    if (folders.text) {
      const folderData = JSON.parse(folders.text);
      console.log(`Found ${folderData.length} folders`);
      folderData.slice(0, 5).forEach(folder => {
        console.log(`  📁 ${folder.name} (${folder.id.substring(0, 8)}...)`);
      });
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ List folders failed:${colors.reset}`, error.message);
    return false;
  }
}

async function testGetFolderContents(folderId) {
  console.log(`\n${colors.blue}📂 Testing: Get Folder Contents${colors.reset}`);
  
  try {
    const contents = await callMCPTool('get_folder_contents', {
      folder_id: folderId,
      include_subfolders: true
    });
    console.log(`${colors.green}✅ Got folder contents:${colors.reset}`);
    
    if (contents.text) {
      const data = JSON.parse(contents.text);
      console.log(`  Folders: ${data.total_folders || 0}`);
      console.log(`  Documents: ${data.total_documents || 0}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Get folder contents failed:${colors.reset}`, error.message);
    return false;
  }
}

async function testMoveDocument(documentId, folderId) {
  console.log(`\n${colors.blue}📄 Testing: Move Document to Folder${colors.reset}`);
  
  try {
    const result = await callMCPTool('move_document_to_folder', {
      document_id: documentId,
      folder_id: folderId
    });
    console.log(`${colors.green}✅ Moved document:${colors.reset}`, result);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Move document failed:${colors.reset}`, error.message);
    return false;
  }
}

async function testUpdateFolder(folderId) {
  console.log(`\n${colors.blue}✏️ Testing: Update Folder${colors.reset}`);
  
  try {
    const result = await callMCPTool('update_folder', {
      folder_id: folderId,
      name: 'Updated Test Project',
      color: '#EF4444',
      is_favorite: true
    });
    console.log(`${colors.green}✅ Updated folder:${colors.reset}`, result);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Update folder failed:${colors.reset}`, error.message);
    return false;
  }
}

async function testDeleteFolder(folderId) {
  console.log(`\n${colors.blue}🗑️ Testing: Delete Folder${colors.reset}`);
  
  try {
    const result = await callMCPTool('delete_folder', {
      folder_id: folderId,
      recursive: true
    });
    console.log(`${colors.green}✅ Deleted folder:${colors.reset}`, result);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Delete folder failed:${colors.reset}`, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════`);
  console.log(`     MCP Folder Operations Test Suite`);
  console.log(`═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Endpoint: ${MCP_ENDPOINT}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);

  let testsPassed = 0;
  let testsFailed = 0;
  let createdFolderId = null;

  // Test 1: Create folder
  createdFolderId = await testCreateFolder();
  if (createdFolderId) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 2: List folders
  if (await testListFolders()) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 3: Get folder contents
  if (createdFolderId && await testGetFolderContents(createdFolderId)) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 4: Move document (skip if no document available)
  console.log(`\n${colors.yellow}⚠️ Skipping move document test (requires existing document)${colors.reset}`);

  // Test 5: Update folder
  if (createdFolderId && await testUpdateFolder(createdFolderId)) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Test 6: Delete folder (cleanup)
  if (createdFolderId && await testDeleteFolder(createdFolderId)) {
    testsPassed++;
  } else {
    testsFailed++;
  }

  // Summary
  console.log(`\n${colors.yellow}═══════════════════════════════════════════════════════`);
  console.log(`                    Test Summary`);
  console.log(`═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed! Folder operations are working correctly.${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️ Some tests failed. Please check the error messages above.${colors.reset}`);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});