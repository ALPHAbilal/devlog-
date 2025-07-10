import { supabase } from '../lib/supabaseOptimized'

// Helper function to get the correct URL for redirects
export const getURL = () => {
  let url = 
    import.meta.env.VITE_SITE_URL ?? 
    import.meta.env.VITE_VERCEL_URL ?? 
    'http://localhost:3000/'
  
  // Make sure the URL has https://
  url = url.startsWith('http') ? url : `https://${url}`
  // Make sure to include trailing /
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

// Sign in with OAuth provider
export const signInWithProvider = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL() + 'auth/callback',
    },
  })
  
  if (error) throw error
  return data
}

// Sign in with Google
export const signInWithGoogle = async () => {
  return signInWithProvider('google')
}

// Sign in with GitHub
export const signInWithGitHub = async () => {
  return signInWithProvider('github')
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}