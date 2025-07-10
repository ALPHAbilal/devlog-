import { supabase } from '../lib/supabase';

// Export all user data from Supabase
export const exportSupabaseData = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch all documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (docsError) throw docsError;

    // Fetch all blocks for the user's documents
    const documentIds = documents.map(doc => doc.id);
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .in('document_id', documentIds)
      .order('document_id')
      .order('position');

    if (blocksError) throw blocksError;

    // Group blocks by document
    const blocksByDocument = blocks.reduce((acc, block) => {
      if (!acc[block.document_id]) {
        acc[block.document_id] = [];
      }
      acc[block.document_id].push(block);
      return acc;
    }, {});

    // Combine documents with their blocks
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        id: user.id
      },
      documents: documents.map(doc => ({
        ...doc,
        blocks: blocksByDocument[doc.id] || []
      })),
      settings: user.user_metadata?.settings || {}
    };

    // Create and download the file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devlog-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

// Import data to Supabase
export const importSupabaseData = async (file, onProgress) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validate data structure
        if (!data.version || !data.documents) {
          throw new Error('Invalid backup file format');
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        let imported = 0;
        const total = data.documents.length;

        // Import documents one by one
        for (const doc of data.documents) {
          // Extract blocks from document
          const { blocks, ...documentData } = doc;

          // Create new document with new ID
          const newDocId = crypto.randomUUID();
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              ...documentData,
              id: newDocId,
              user_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (docError) {
            console.error('Error importing document:', docError);
            continue;
          }

          // Import blocks for this document
          if (blocks && blocks.length > 0) {
            const newBlocks = blocks.map(block => ({
              ...block,
              id: crypto.randomUUID(),
              document_id: newDocId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));

            const { error: blocksError } = await supabase
              .from('blocks')
              .insert(newBlocks);

            if (blocksError) {
              console.error('Error importing blocks:', blocksError);
            }
          }

          imported++;
          if (onProgress) {
            onProgress(Math.round((imported / total) * 100));
          }
        }

        // Import settings if available
        if (data.settings) {
          try {
            await supabase.auth.updateUser({
              data: { settings: data.settings }
            });
          } catch (err) {
            console.error('Error importing settings:', err);
          }
        }

        resolve({ imported });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};