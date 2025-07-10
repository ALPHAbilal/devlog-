# Step-by-Step Vercel Deployment Guide for Devlog

Follow these steps in order to successfully deploy your app to Vercel and set up OAuth.

## Phase 1: Prepare and Deploy to Vercel

### Step 1: Check Git Status
First, let's make sure all your changes are committed:
```bash
git status
```

### Step 2: Commit Your Changes
If you have uncommitted changes:
```bash
git add .
git commit -m "Add Vercel deployment configuration and OAuth setup"
```

### Step 3: Push to GitHub
Push your code to GitHub (make sure you have a GitHub repository):
```bash
git push origin main
```

### Step 4: Deploy to Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect that it's a Vite project
5. **IMPORTANT**: Add these environment variables before deploying:
   - Click "Environment Variables"
   - Add each variable:
     ```
     VITE_SUPABASE_URL = https://zqcjipwiznesnbgbocnu.supabase.co
     VITE_SUPABASE_ANON_KEY = [your anon key from Supabase]
     VITE_SITE_URL = https://devlog.design
     ```
6. Click "Deploy"

### Step 5: Add Custom Domain
After deployment succeeds:
1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain: `devlog.design`
4. Follow Vercel's instructions to update your DNS records

## Phase 2: Update Supabase Settings

### Step 6: Update Supabase URL Configuration
1. Go to your Supabase Dashboard
2. Navigate to Authentication → URL Configuration
3. Update these settings:
   - **Site URL**: `https://devlog.design`
   - **Redirect URLs**: Add these (one per line):
     ```
     https://devlog.design/auth/callback
     http://localhost:5173/**
     https://*.vercel.app/**
     ```
4. Click "Save"

## Phase 3: Configure Google OAuth

### Step 7: Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Update these settings:

   **Authorized JavaScript origins:**
   ```
   https://devlog.design
   https://zqcjipwiznesnbgbocnu.supabase.co
   ```

   **Authorized redirect URIs:**
   ```
   https://zqcjipwiznesnbgbocnu.supabase.co/auth/v1/callback
   https://devlog.design/auth/callback
   ```
6. Click "Save"

## Phase 4: Test Your Deployment

### Step 8: Verify Deployment
1. Visit your site at `https://devlog.design`
2. Click on the sign-in button
3. Try signing in with Google
4. You should be redirected back to your app after authentication

## Troubleshooting

### If OAuth doesn't work:
1. **Check Vercel Environment Variables**: 
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify all variables are set correctly

2. **Check DNS Propagation**:
   - Your domain might take up to 48 hours to propagate
   - You can check status at: https://www.whatsmydns.net/

3. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Check for any error messages

4. **Verify Supabase Settings**:
   - Double-check the Site URL is exactly `https://devlog.design`
   - Make sure redirect URLs include the wildcards for localhost and Vercel

### Common Issues:
- **redirect_uri_mismatch**: Your Google OAuth redirect URIs don't match exactly
- **Invalid site URL**: Your Supabase Site URL doesn't match your actual domain
- **CORS errors**: Usually means environment variables are not set correctly

## Next Steps

Once everything is working:
1. Test sign-in flow thoroughly
2. Test on different browsers
3. Test on mobile devices
4. Monitor for any errors in Vercel's function logs

## Important Notes

- Keep your `.env` file local and never commit it to Git
- Always use environment variables in Vercel for sensitive data
- Your `VITE_SUPABASE_ANON_KEY` is safe to expose (it's meant to be public)
- Never expose your service role key in frontend code