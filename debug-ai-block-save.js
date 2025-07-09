// Debug script to test AI block saving
import { supabase } from './src/lib/supabase.js';

async function testAIBlockSave() {
  console.log('Testing AI block save...');
  
  // Get auth session
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    console.error('Auth error:', authError);
    return;
  }
  
  console.log('Authenticated as:', session.user.email);
  
  // Get a document to test with
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select('id, title')
    .limit(1);
    
  if (docsError || !documents.length) {
    console.error('No documents found:', docsError);
    return;
  }
  
  const testDoc = documents[0];
  console.log('Using document:', testDoc);
  
  // Create a test AI block
  const testAIBlock = {
    id: crypto.randomUUID(),
    type: 'ai',
    content: '',
    position: 999,
    messages: [
      { role: 'user', content: 'Test user message' },
      { role: 'ai', content: 'Test AI response' }
    ]
  };
  
  console.log('Test AI block:', JSON.stringify(testAIBlock, null, 2));
  
  // Test the extractBlockData logic
  const extractBlockData = (block) => {
    const metadata = {};
    const excludedProps = ['id', 'type', 'content', 'position', 'tags', 'language', 'filePath', 'isNew', 'createdAt', 'updatedAt'];
    
    Object.keys(block).forEach(key => {
      if (!excludedProps.includes(key) && block[key] !== undefined) {
        metadata[key] = block[key];
      }
    });
    
    if (block.data) {
      Object.assign(metadata, block.data);
    }
    if (block.metadata) {
      Object.assign(metadata, block.metadata);
    }
    
    return metadata;
  };
  
  const metadata = extractBlockData(testAIBlock);
  console.log('Extracted metadata:', JSON.stringify(metadata, null, 2));
  
  // Prepare block for save
  const blockToSave = {
    id: testAIBlock.id,
    type: testAIBlock.type,
    content: testAIBlock.content || '',
    position: testAIBlock.position,
    metadata: metadata,
    tags: [],
    language: null,
    file_path: null
  };
  
  console.log('Block to save:', JSON.stringify(blockToSave, null, 2));
  
  // Test save using RPC
  const { error: saveError } = await supabase.rpc('save_document_blocks', {
    doc_id: testDoc.id,
    blocks: [blockToSave]
  });
  
  if (saveError) {
    console.error('Save error:', saveError);
    return;
  }
  
  console.log('Save successful!');
  
  // Verify the save
  const { data: savedBlock, error: verifyError } = await supabase
    .from('blocks')
    .select('*')
    .eq('id', testAIBlock.id)
    .single();
    
  if (verifyError) {
    console.error('Verify error:', verifyError);
    return;
  }
  
  console.log('Saved block from DB:', JSON.stringify(savedBlock, null, 2));
  console.log('Messages in metadata:', savedBlock.metadata?.messages);
}

testAIBlockSave().catch(console.error);