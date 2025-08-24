#!/usr/bin/env node

/**
 * Debug MCP Session and Response Format
 * Simplified test to understand exactly how the MCP protocol works
 */

import https from 'https';

const API_KEY = 'dvlg_sk_test_123';
const ENDPOINT = 'https://devlog-mcp.bilal-kosika.workers.dev';

let requestId = 1;
let sessionId = null;

function makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const requestData = {
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: requestId++
        };

        const options = {
            hostname: 'devlog-mcp.bilal-kosika.workers.dev',
            port: 443,
            path: '/mcp',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'X-API-Key': API_KEY
            }
        };

        if (sessionId) {
            options.headers['Mcp-Session-Id'] = sessionId;
        }

        const jsonData = JSON.stringify(requestData);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);

        console.log(`📤 Request: ${method}`);
        console.log(`📄 Data: ${jsonData}`);

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    console.log(`📥 Response (${res.statusCode}):`, JSON.stringify(parsedData, null, 2));
                    
                    // Update session ID from headers
                    if (res.headers['mcp-session-id']) {
                        sessionId = res.headers['mcp-session-id'];
                        console.log(`🔗 Session ID updated: ${sessionId}`);
                    }
                    
                    resolve(parsedData);
                } catch (e) {
                    console.log(`❌ JSON Parse Error: ${e.message}`);
                    console.log(`Raw response: ${responseData}`);
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            console.log(`❌ Request Error: ${err.message}`);
            reject(err);
        });

        req.write(jsonData);
        req.end();
    });
}

async function main() {
    console.log('🚀 Debugging MCP Session');
    console.log('═'.repeat(50));

    try {
        // 1. Initialize session
        console.log('\n1. Initializing session...');
        const initResponse = await makeRequest('initialize', {});
        
        if (initResponse.error) {
            throw new Error(`Init failed: ${initResponse.error.message}`);
        }

        // 2. Test list_folders (should work according to patterns)
        console.log('\n2. Testing list_folders...');
        const listResponse = await makeRequest('tools/call', {
            name: 'list_folders',
            arguments: { recursive: true }
        });

        // 3. Test create_document 
        console.log('\n3. Testing create_document...');
        const createResponse = await makeRequest('tools/call', {
            name: 'create_document',
            arguments: {
                title: 'Debug Test Document',
                blocks: [
                    {
                        type: 'text',
                        content: 'This is a debug test document',
                        metadata: {}
                    }
                ]
            }
        });

        // 4. Test get_folder_contents (worked in test)
        console.log('\n4. Testing get_folder_contents...');
        const contentsResponse = await makeRequest('tools/call', {
            name: 'get_folder_contents',
            arguments: { 
                folder_id: null,
                include_subfolders: true 
            }
        });

    } catch (error) {
        console.log(`💥 Error: ${error.message}`);
    }
}

main();