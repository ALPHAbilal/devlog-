import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (\!supabaseUrl || \!supabaseAnonKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session check:', {
      hasSession: \!\!session,
      userId: session?.user?.id,
      error: error?.message
    });
    
    // Test folders query
    const { data, error: foldersError } = await supabase
      .from('folders')
      .select('*')
      .limit(1);
      
    console.log('Folders query:', {
      success: \!foldersError,
      error: foldersError?.message,
      status: foldersError?.status
    });
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testAuth();
EOF < /dev/null
