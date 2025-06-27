// Diagnostic script to check database performance
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqcjipwiznesnbgbocnu.supabase.co';
const supabaseKey = localStorage.getItem('supabase.auth.token') || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseDatabase() {
  console.log('Starting database diagnostics...\n');
  
  // 1. Check auth
  console.log('1. Checking authentication...');
  const authStart = performance.now();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const authTime = performance.now() - authStart;
  
  if (authError) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log(`✓ Auth check completed in ${authTime.toFixed(2)}ms`);
  console.log(`  User ID: ${user?.id || 'Not authenticated'}\n`);
  
  if (!user) {
    console.error('No authenticated user. Please log in first.');
    return;
  }
  
  // 2. Count documents
  console.log('2. Counting documents...');
  const countStart = performance.now();
  const { count, error: countError } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const countTime = performance.now() - countStart;
  
  if (countError) {
    console.error('Count error:', countError);
  } else {
    console.log(`✓ Count completed in ${countTime.toFixed(2)}ms`);
    console.log(`  Total documents: ${count}\n`);
  }
  
  // 3. Test simple query
  console.log('3. Testing simple query (1 document)...');
  const simpleStart = performance.now();
  const { data: singleDoc, error: simpleError } = await supabase
    .from('documents')
    .select('id, title')
    .eq('user_id', user.id)
    .limit(1);
  const simpleTime = performance.now() - simpleStart;
  
  if (simpleError) {
    console.error('Simple query error:', simpleError);
  } else {
    console.log(`✓ Simple query completed in ${simpleTime.toFixed(2)}ms\n`);
  }
  
  // 4. Test full dashboard query
  console.log('4. Testing full dashboard query...');
  const fullStart = performance.now();
  const { data: documents, error: fullError } = await supabase
    .from('documents')
    .select(`
      id,
      title,
      tags,
      created_at,
      updated_at,
      is_template,
      metadata
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(20);
  const fullTime = performance.now() - fullStart;
  
  if (fullError) {
    console.error('Full query error:', fullError);
  } else {
    console.log(`✓ Full query completed in ${fullTime.toFixed(2)}ms`);
    console.log(`  Retrieved ${documents.length} documents\n`);
  }
  
  // 5. Test blocks query
  console.log('5. Testing blocks query...');
  if (documents && documents.length > 0) {
    const blockStart = performance.now();
    const { data: blocks, error: blockError } = await supabase
      .from('blocks')
      .select('id, type')
      .eq('document_id', documents[0].id)
      .limit(5);
    const blockTime = performance.now() - blockStart;
    
    if (blockError) {
      console.error('Block query error:', blockError);
    } else {
      console.log(`✓ Block query completed in ${blockTime.toFixed(2)}ms`);
      console.log(`  Retrieved ${blocks.length} blocks\n`);
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Auth check: ${authTime.toFixed(2)}ms`);
  console.log(`Document count: ${countTime.toFixed(2)}ms`);
  console.log(`Simple query: ${simpleTime.toFixed(2)}ms`);
  console.log(`Full query: ${fullTime.toFixed(2)}ms`);
  
  if (fullTime > 1000) {
    console.log('\n⚠️  WARNING: Queries are taking too long!');
    console.log('Possible causes:');
    console.log('- Missing database indexes');
    console.log('- Complex RLS policies');
    console.log('- Network issues');
    console.log('- Too many documents');
  }
}

// Run diagnostics
diagnoseDatabase().catch(console.error);