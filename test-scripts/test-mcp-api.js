// Test script for MCP API endpoints
// Run with: node test-mcp-api.js

const API_URL = 'https://devlog.design/api/mcp';
const API_KEY = 'your-api-key-here'; // Replace with actual API key

async function testEndpoint(name, method, path, body = null) {
  console.log(`\nTesting ${name}...`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return { success: false, error };
  }
}

async function runTests() {
  console.log('MCP API Test Suite');
  console.log('==================');
  
  // Test health endpoint (no auth required)
  await testEndpoint('Health Check', 'GET', '/health');
  
  if (API_KEY === 'your-api-key-here') {
    console.log('\n⚠️  Please set your API key in the script before running authenticated tests');
    return;
  }
  
  // Test create document
  const createResult = await testEndpoint('Create Document', 'POST', '/documents/create', {
    title: 'Test Document from API',
    content: 'This is a test document created via the MCP API',
    tags: ['test', 'api', 'mcp']
  });
  
  if (createResult.success && createResult.data.id) {
    const docId = createResult.data.id;
    
    // Test get document
    await testEndpoint('Get Document', 'GET', `/documents/${docId}`);
    
    // Test add block
    await testEndpoint('Add Block', 'POST', '/blocks/create', {
      document_id: docId,
      type: 'code',
      content: 'console.log("Hello from MCP API!");',
      metadata: { language: 'javascript' }
    });
    
    // Test capture conversation
    await testEndpoint('Capture Conversation', 'POST', '/conversations/capture', {
      document_id: docId,
      conversation: [
        { role: 'user', content: 'How do I create a React component?' },
        { role: 'assistant', content: 'Here\'s how to create a React component...' }
      ],
      context: 'Learning React basics'
    });
  }
  
  // Test list documents
  await testEndpoint('List Documents', 'GET', '/documents/list?limit=5');
}

// Run tests
runTests().then(() => {
  console.log('\n✅ Tests completed');
}).catch(error => {
  console.error('\n❌ Test suite failed:', error);
});