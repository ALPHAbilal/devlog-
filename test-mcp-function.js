#!/usr/bin/env node

/**
 * Test the mcp_create_document function directly
 */

const SUPABASE_URL = 'https://zqcjipwiznesnbgbocnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY2ppcHdpem5lc25iZ2JvY251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjgwOTgsImV4cCI6MjA2NjU0NDA5OH0.GWgZOH0sKP2z2_IGG6_omnJwpefSRnI353hmu729ahg';
const API_KEY = 'dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a';

async function testMCPFunction() {
  console.log('🔍 Testing mcp_create_document function directly\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mcp_create_document`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        p_api_key: API_KEY,
        p_title: 'Direct Function Test',
        p_tags: ['test', 'mcp'],
        p_folder_id: null
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (text) {
      try {
        const result = JSON.parse(text);
        console.log('Parsed response:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('Could not parse as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMCPFunction().catch(console.error);