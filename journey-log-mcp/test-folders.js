#!/usr/bin/env node

import { spawn } from 'child_process';

const API_KEY = 'dvlg_sk_test_123';

// Set environment variable
process.env.JOURNEY_LOG_API_KEY = API_KEY;

console.log('Testing Journey Log MCP Server with folder operations...\n');

const server = spawn('node', ['src/server.js'], {
  env: { ...process.env, JOURNEY_LOG_API_KEY: API_KEY },
  stdio: ['pipe', 'pipe', 'inherit']
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const response = JSON.parse(line);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      // Check if we got the tools list
      if (response.result?.tools) {
        const folderTools = response.result.tools.filter(t => 
          t.name.includes('folder')
        );
        console.log(`\n✅ Found ${folderTools.length} folder tools:`);
        folderTools.forEach(t => console.log(`   - ${t.name}`));
        
        if (folderTools.length === 6) {
          console.log('\n✨ All 6 folder operations are available!');
        }
        
        // Now test creating a folder
        console.log('\n3. Testing create_folder...');
        const createFolderRequest = {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'create_folder',
            arguments: {
              name: 'Test Folder from NPM Package',
              color: '#10B981',
              icon: 'folder'
            }
          },
          id: 3
        };
        server.stdin.write(JSON.stringify(createFolderRequest) + '\n');
      }
      
      // Check folder creation response
      if (response.id === 3) {
        if (response.result) {
          console.log('\n✅ Folder created successfully!');
          
          // Test listing folders
          console.log('\n4. Testing list_folders...');
          const listRequest = {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'list_folders',
              arguments: {}
            },
            id: 4
          };
          server.stdin.write(JSON.stringify(listRequest) + '\n');
        } else if (response.error) {
          console.error('\n❌ Folder creation failed:', response.error);
        }
      }
      
      // Check list folders response
      if (response.id === 4) {
        if (response.result) {
          console.log('\n✅ Folders listed successfully!');
          console.log('\n✨ All tests passed! Folder operations work!');
          process.exit(0);
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  
  responseBuffer = lines[lines.length - 1];
});

// Send initial requests
setTimeout(() => {
  console.log('1. Initializing...');
  const initRequest = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    },
    id: 1
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  setTimeout(() => {
    console.log('2. Getting tools list...');
    const toolsRequest = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 2
    };
    server.stdin.write(JSON.stringify(toolsRequest) + '\n');
  }, 500);
}, 1000);

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out');
  server.kill();
  process.exit(1);
}, 10000);