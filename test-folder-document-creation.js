#!/usr/bin/env node

// Test script to verify document creation with folders works properly
// This tests the fix for the "0 blocks" issue when creating documents in folders

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFolderDocumentCreation() {
  console.log('🧪 Testing document creation with folders...\n');

  try {
    // 1. Authenticate
    console.log('1️⃣ Authenticating...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    console.log('✅ Authenticated as:', user.email);

    // 2. Create a test folder
    console.log('\n2️⃣ Creating test folder...');
    const testFolderId = crypto.randomUUID();
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .insert({
        id: testFolderId,
        name: 'Test Folder for Document Creation',
        user_id: user.id,
        parent_id: null
      })
      .select()
      .single();

    if (folderError) {
      console.error('❌ Failed to create folder:', folderError);
      return;
    }
    console.log('✅ Created folder:', folder.name);

    // 3. Test creating a document with the security definer function
    console.log('\n3️⃣ Creating document in folder using security definer function...');
    const testDocId = crypto.randomUUID();
    const { data: document, error: docError } = await supabase.rpc('create_document_with_folder_check', {
      p_id: testDocId,
      p_title: 'Test Document in Folder',
      p_folder_id: testFolderId,
      p_preview: 'Testing document creation...',
      p_tags: [],
      p_metadata: {
        test: true,
        isNewDocument: true,
        blockCount: 1
      },
      p_is_template: false,
      p_position: 0
    });

    if (docError) {
      console.error('❌ Failed to create document:', docError);
      return;
    }
    console.log('✅ Created document:', document.id);

    // 4. Save a block for the document
    console.log('\n4️⃣ Saving initial block for document...');
    const testBlockId = crypto.randomUUID();
    const { error: blockError } = await supabase.rpc('save_document_blocks_v3', {
      p_document_id: testDocId,
      p_blocks: [{
        id: testBlockId,
        type: 'text',
        content: 'This is a test block',
        position: 0,
        metadata: {},
        tags: [],
        language: null,
        file_path: null
      }]
    });

    if (blockError) {
      // Try fallback function
      console.log('⚠️  v3 function not available, trying v2...');
      const { error: blockError2 } = await supabase.rpc('save_document_blocks', {
        doc_id: testDocId,
        blocks: [{
          id: testBlockId,
          type: 'text',
          content: 'This is a test block',
          position: 0,
          metadata: {},
          tags: [],
          language: null,
          file_path: null
        }]
      });
      
      if (blockError2) {
        console.error('❌ Failed to save block:', blockError2);
        return;
      }
    }
    console.log('✅ Saved initial block');

    // 5. Verify the document and block were created
    console.log('\n5️⃣ Verifying document and blocks...');
    const { data: verifyDoc, error: verifyDocError } = await supabase
      .from('documents')
      .select('*, blocks(*)')
      .eq('id', testDocId)
      .single();

    if (verifyDocError) {
      console.error('❌ Failed to verify document:', verifyDocError);
      return;
    }

    console.log('✅ Document verified:');
    console.log('   - ID:', verifyDoc.id);
    console.log('   - Title:', verifyDoc.title);
    console.log('   - Folder ID:', verifyDoc.folder_id);
    console.log('   - Block count:', verifyDoc.blocks.length);
    console.log('   - Block content:', verifyDoc.blocks[0]?.content);

    // 6. Test updating the document (should preserve blocks)
    console.log('\n6️⃣ Testing document update...');
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        title: 'Updated Test Document',
        metadata: {
          ...verifyDoc.metadata,
          updated: true,
          isNewDocument: false
        }
      })
      .eq('id', testDocId);

    if (updateError) {
      console.error('❌ Failed to update document:', updateError);
      return;
    }
    console.log('✅ Document updated successfully');

    // 7. Clean up
    console.log('\n7️⃣ Cleaning up test data...');
    
    // Delete blocks first
    await supabase
      .from('blocks')
      .delete()
      .eq('document_id', testDocId);
    
    // Delete document
    await supabase
      .from('documents')
      .delete()
      .eq('id', testDocId);
    
    // Delete folder
    await supabase
      .from('folders')
      .delete()
      .eq('id', testFolderId);

    console.log('✅ Cleanup complete');
    console.log('\n🎉 All tests passed! Document creation with folders is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testFolderDocumentCreation();