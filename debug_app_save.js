// Debug script to run in browser console

// 1. Check if documents are being saved with blocks
const checkStorage = async () => {
  console.log('=== DEBUGGING SAVE ISSUE ===');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id);
  
  // Get documents from app's storage
  const entries = await storageWrapper.getEntries();
  console.log('Documents in app:', entries?.length);
  
  // Check first document's blocks
  if (entries && entries.length > 0) {
    console.log('First document:', {
      id: entries[0].id,
      title: entries[0].title,
      blocksCount: entries[0].blocks?.length,
      blocks: entries[0].blocks
    });
  }
  
  // Test save directly
  if (entries && entries.length > 0 && entries[0].blocks) {
    console.log('Testing direct save of first document...');
    try {
      const adapter = new SupabaseAdapter();
      await adapter.init(user.id);
      await adapter.saveDocument(entries[0]);
      console.log('Direct save completed');
    } catch (error) {
      console.error('Direct save error:', error);
    }
  }
};

// Run the check
checkStorage();

// 2. Monitor the next save operation
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  if (args[0] && args[0].includes && (args[0].includes('SupabaseAdapter') || args[0].includes('blocks'))) {
    originalConsoleLog('🔍 SAVE DEBUG:', ...args);
  }
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  if (args[0] && args[0].includes && (args[0].includes('block') || args[0].includes('SupabaseAdapter'))) {
    originalConsoleError('❌ SAVE ERROR:', ...args);
  }
  originalConsoleError.apply(console, args);
};