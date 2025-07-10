# Supabase Google OAuth Setup with Custom Domain on Vercel - Complete 2025 Guide

Setting up Google OAuth with Supabase on a custom domain requires careful configuration across multiple services. Based on the latest research, here's a comprehensive guide to resolve your redirect_uri_mismatch errors and implement a production-ready authentication system.

## Critical Discovery: OAuth Provider Configuration

The most important finding is that when using custom domains with Supabase, you must update OAuth provider configurations **in the provider's developer console** (Google Cloud Console), not just in the Supabase dashboard. This is the primary cause of redirect_uri_mismatch errors.

## Step-by-Step Configuration Guide

### 1. Google Cloud Console Configuration

In your Google Cloud Console, you need to configure **both** URLs during the transition period:

**Authorized redirect URIs:**
```
https://zqcjipwiznesnbgbocnu.supabase.co/auth/v1/callback
https://api.devlog.design/auth/v1/callback  (if using subdomain)
```

**Authorized JavaScript origins:**
```
https://devlog.design
https://zqcjipwiznesnbgbocnu.supabase.co
```

**Important:** Once your custom domain is fully activated, OAuth flows will automatically use the custom domain, making your consent screens show "devlog.design" instead of the Supabase subdomain.

### 2. Supabase Custom Domain Setup

First, ensure your custom domain is properly configured:

```bash
# Using Supabase CLI
supabase domains create --project-ref zqcjipwiznesnbgbocnu --custom-hostname api.devlog.design

# Add DNS records:
# CNAME: api.devlog.design → zqcjipwiznesnbgbocnu.supabase.co
# TXT: _acme-challenge.api.devlog.design → [verification-code]

# Verify and activate
supabase domains reverify --project-ref zqcjipwiznesnbgbocnu
supabase domains activate --project-ref zqcjipwiznesnbgbocnu
```

### 3. Supabase Dashboard Configuration

In your Supabase Dashboard under Authentication → URL Configuration:

**Site URL:**
```
https://devlog.design
```

**Additional Redirect URLs:**
```
https://devlog.design/auth/callback
http://localhost:3000/**
https://*.vercel.app/**
```

### 4. Vercel Environment Variables

Update your Vercel environment variables to use the custom domain:

```bash
# Production environment
VITE_SUPABASE_URL=https://api.devlog.design  # Yes, update this!
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=https://devlog.design

# For dynamic environments
VITE_VERCEL_URL=auto-set-by-vercel
```

### 5. React + Vite Implementation

Update your Supabase client configuration:

```javascript
// src/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

Implement dynamic redirect URL handling:

```javascript
// src/utils/auth.js
const getURL = () => {
  let url = 
    import.meta.env.VITE_SITE_URL ?? 
    import.meta.env.VITE_VERCEL_URL ?? 
    'http://localhost:3000/'
  
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  return url
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getURL() + 'auth/callback',
    },
  })
  
  if (error) throw error
  return data
}
```

### 6. Auth Callback Handler

Create an auth callback handler:

```javascript
// src/pages/auth/callback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../config/supabaseClient'

export default function AuthCallback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard')
      }
    })
  }, [navigate])
  
  return <div>Loading...</div>
}
```

## Solving Common Issues

### redirect_uri_mismatch Error

This error occurs when the redirect URI doesn't match exactly. The solution:

1. **In Google Console**, add both URLs:
   - `https://zqcjipwiznesnbgbocnu.supabase.co/auth/v1/callback`
   - `https://api.devlog.design/auth/v1/callback` (if using subdomain)

2. **Important:** OAuth callbacks automatically use your custom domain once activated. You don't control this directly - Supabase handles it.

### CORS Configuration

If you're using Supabase Edge Functions, add CORS headers:

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

### Session Handling

For proper session management across domains:

```javascript
// Add to your Supabase client config
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    flowType: 'pkce', // Enhanced security
  },
})
```

## Production Checklist

Before going live:

- ✅ Custom domain DNS records configured and verified
- ✅ Google Cloud Console has both callback URLs
- ✅ Supabase Site URL set to `https://devlog.design`
- ✅ Additional redirect URLs configured for all environments
- ✅ Environment variables updated to use custom domain
- ✅ Client code uses dynamic redirect URL handling
- ✅ Auth callback route implemented
- ✅ Test OAuth flow in production environment

## Key Insights

1. **Custom Domain Impact**: Once activated, Supabase Auth automatically uses your custom domain for OAuth callbacks. This improves user trust by showing "devlog.design" instead of a random Supabase subdomain.

2. **Environment Variables**: Yes, you should update `VITE_SUPABASE_URL` to use your custom domain (`https://api.devlog.design`).

3. **OAuth Configuration**: Configure both the original Supabase URL and custom domain URL in Google Console during setup. After verification, you can remove the Supabase URL if desired.

4. **Vercel Deployment**: Use dynamic URL detection to handle different environments (local, preview, production) seamlessly.

This setup ensures your OAuth flow works correctly with your custom domain while maintaining flexibility for development and preview deployments.