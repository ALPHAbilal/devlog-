// Re-export from optimized version to maintain backward compatibility
export { 
  supabase, 
  optimizedSupabase, 
  getSession, 
  onAuthStateChange, 
  deduplicateRequest 
} from './supabaseOptimized';

console.log('Using optimized Supabase client');