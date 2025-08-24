// Test script for folder tools after fix
const API_KEY = 'dvlg_sk_prod_0b0bbd0ec73171d96fb807262486cd6a2c119d8593e162e01240d9051680f61a';
const MCP_URL = 'https://devlog-mcp.bilal-kosika.workers.dev/mcp';

async function testFolderTools() {
  console.log('Testing folder tools availability after fix...\n');
  
  try {
    // Step 1: Initialize session
    console.log('1. Initializing MCP session...');
    const initResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} }
        },
        id: 1
      })
    });
    
    const initResult = await initResponse.json();
    const sessionId = initResponse.headers.get('mcp-session-id');
    console.log('Session initialized:', sessionId);
    
    // Step 2: List tools with session
    console.log('\n2. Listing available tools...');
    const toolsResponse = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Mcp-Session-Id': sessionId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 2
      })
    });
    
    const toolsResult = await toolsResponse.json();
    
    if (toolsResult.result && toolsResult.result.tools) {
      const tools = toolsResult.result.tools;
      console.log(`Found ${tools.length} tools:\n`);
      
      // Check for folder tools
      const folderTools = [
        'create_folder',
        'list_folders',
        'get_folder_contents',
        'move_document_to_folder',
        'delete_folder',
        'update_folder'
      ];
      
      const availableTools = tools.map(t => t.name);
      console.log('Available tools:', availableTools);
      
      console.log('\nFolder tools status:');
      folderTools.forEach(toolName => {
        const isAvailable = availableTools.includes(toolName);
        console.log(`  ${isAvailable ? '✅' : '❌'} ${toolName}`);
      });
      
      const folderToolsFound = folderTools.filter(t => availableTools.includes(t));
      console.log(`\n${folderToolsFound.length}/${folderTools.length} folder tools available`);
      
      if (folderToolsFound.length === folderTools.length) {
        console.log('\n🎉 SUCCESS! All folder tools are now exposed!');
      } else {
        console.log('\n⚠️  Some folder tools are still missing');
      }
    } else {
      console.error('No tools found in response:', toolsResult);
    }
    
  } catch (error) {
    console.error('Error testing folder tools:', error.message);
  }
}

testFolderTools();