#!/bin/bash

echo "Verifying @journey-log/mcp-server NPM package..."
echo "================================================"

# Check if package exists on npm
echo -e "\n1. Checking package on NPM..."
npm view @journey-log/mcp-server version

# Test installation
echo -e "\n2. Testing installation with npx..."
export JOURNEY_LOG_API_KEY="dvlg_sk_test_123"

# Create a test directory
TESTDIR=$(mktemp -d)
cd $TESTDIR

echo -e "\n3. Creating test script..."
cat > test-mcp.js << 'EOF'
const { spawn } = require('child_process');

console.log('Testing MCP server with folder operations...');

const server = spawn('npx', ['-y', '@journey-log/mcp-server'], {
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
        
        if (folderTools.length === 6) {
          console.log('✅ All 6 folder operations found!');
          folderTools.forEach(t => console.log(`   - ${t.name}`));
          process.exit(0);
        } else {
          console.log(`❌ Only ${folderTools.length} folder tools found`);
          process.exit(1);
        }
      }
    } catch (e) {
      // Not JSON
    }
  }
  
  buffer = lines[lines.length - 1];
});

// Send initialize and tools/list
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
  console.log('❌ Timeout - package may not be working correctly');
  process.exit(1);
}, 10000);
EOF

echo -e "\n4. Running test..."
node test-mcp.js

# Cleanup
cd /
rm -rf $TESTDIR

echo -e "\n✨ Verification complete!"