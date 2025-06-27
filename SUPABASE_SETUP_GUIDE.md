# Supabase Setup Guide

## Quick Start

### 1. Create Environment File
Create a `.env.local` file in the root directory:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API**
4. Copy:
   - **Project URL** → paste as `VITE_SUPABASE_URL`
   - **anon public** key → paste as `VITE_SUPABASE_ANON_KEY`

### 3. Enable Authentication Providers (Optional)
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)
3. Configure email settings if needed

### 4. Create Storage Buckets (Future Enhancement)
If you want to use Supabase Storage for images later:
1. Go to **Storage**
2. Create buckets:
   - `avatars` - for user profile pictures
   - `documents` - for document attachments
   - `images` - for inline images

## Testing the Integration

### 1. Run the Application
```bash
npm install
npm run dev
```

### 2. Create an Account
1. Open the app in your browser
2. Sign up with email and password
3. Check your email for confirmation (if email confirmations are enabled)

### 3. Verify Database
1. Go to Supabase dashboard → **Table Editor**
2. You should see:
   - `profiles` table with your user
   - `documents` table (will populate when you create documents)
   - `blocks` table (will populate with document content)

## Migration from Local Storage

The app automatically migrates your existing data when you first sign in:
1. Detects data in localStorage/IndexedDB
2. Uploads all documents to Supabase
3. Clears local storage after successful migration

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure `.env.local` file exists (not `.env`)
- Restart the development server after creating the file

### Authentication Issues
- Check that your Supabase project is not paused
- Verify the anon key is correct
- Check browser console for specific error messages

### Data Not Saving
- Check Table Editor → ensure RLS policies are created
- Verify you're signed in (check for user session)
- Look for errors in browser console

### Performance Issues
- The app uses indexes for optimal performance
- Large documents are handled efficiently with separate blocks table
- Search is powered by PostgreSQL full-text search

## Security Notes

1. **Never commit `.env.local`** - it's already in `.gitignore`
2. **RLS is enabled** - users can only see their own data
3. **Anon key is safe to use** - it only works with RLS policies
4. **All data is scoped to authenticated users**

## Next Steps

1. **Monitor Usage**: Check Supabase dashboard for:
   - Database size
   - API requests
   - Active users

2. **Set Up Backups**: Configure automatic backups in Supabase

3. **Enable Realtime** (Future): For collaborative features

4. **Add Social Auth** (Optional): Enable GitHub, Google, etc.