import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase Environment Variables:', {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ? 'Present' : 'Missing'
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'journey-log-auth',
    debug: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Accept': 'application/json'
      // Don't set Content-Type globally - let each API set it appropriately
      // This fixes file uploads which need multipart/form-data
    }
  }
})