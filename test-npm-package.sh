#!/bin/bash

echo "Testing @journey-log/mcp-server from NPM..."
echo "============================================"

# Create a temporary test script
cat > /tmp/test-mcp.js << 'EOF'
const { spawn } = require('child_process');

console.log('Starting MCP server test...');

const server = spawn('npx', ['-y', '@journey-log/mcp-server@latest'], {
  env: { ...process.env, JOURNEY_LOG_API_KEY: 'dvlg_sk_test_123' },
  stdio: ['pipe', 'pipe', 'inherit']
});

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const response = JSON.parse(line);
      
      if (response.result?.tools) {
        const folderTools = response.result.tools.filter(t => 
          t.name.includes('folder')
        );
        
        console.log(`\n✅ Package installed and running!`);
        console.log(`✅ Found ${folderTools.length} folder operations:`);
        folderTools.forEach(t => console.log(`   - ${t.name}`));
        
        if (folderTools.length === 6) {
          console.log('\n🎉 SUCCESS! All folder operations available in v1.1.0!');
          console.log('\nUsers can now install with:');
          console.log('claude mcp add journey-log -s user -e JOURNEY_LOG_API_KEY="key" -- npx -y @journey-log/mcp-server');
        }
        
        process.exit(0);
      }
    } catch (e) {
      // Not JSON
    }
  }
  
  buffer = lines[lines.length - 1];
});

// Send test requests
setTimeout(() => {
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '1.0.0' }
    },
    id: 1
  }) + '\n');
  
  setTimeout(() => {
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 2
    }) + '\n');
  }, 500);
}, 1000);

setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 5000);
EOF

# Run the test
node /tmp/test-mcp.js

# Clean up
rm /tmp/test-mcp.js