# How to Update Your GitHub Repository with Recent Changes

## Step 1: Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd C:\Users\MYC\Desktop\devlog-
```

## Step 2: Check Git Status
See what files have changed:
```bash
git status
```

## Step 3: Add All Changes
Add all your new and modified files:
```bash
git add .
```

Or if you want to add specific files:
```bash
git add vercel.json
git add src/pages/auth/callback.jsx
git add src/utils/auth.js
git add src/components/Auth.jsx
git add src/App.jsx
git add src/lib/supabaseOptimized.js
git add .env.example
git add VERCEL_DEPLOYMENT_GUIDE.md
```

## Step 4: Commit Your Changes
Create a commit with a descriptive message:
```bash
git commit -m "Add Vercel deployment config and OAuth setup with custom domain support"
```

## Step 5: Push to GitHub
Push your changes to the main branch:
```bash
git push origin main
```

If you get an error about upstream, use:
```bash
git push -u origin main
```

## Step 6: Verify on GitHub
1. Go to your GitHub repository (github.com/yourusername/devlog-)
2. Check that all files are updated

## Common Issues and Solutions:

### If you get "not a git repository" error:
First initialize git and connect to your repo:
```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/devlog-.git
```

### If you get "rejected" error when pushing:
Pull first then push:
```bash
git pull origin main --allow-unrelated-histories
git push origin main
```

### If you want to see what remote is configured:
```bash
git remote -v
```

## After Pushing to GitHub:

Now you can go to Vercel and import your repository:
1. Go to vercel.com
2. Click "Add New Project"
3. You'll see your "devlog-" repository in the list
4. Click "Import"
5. Add the environment variables as mentioned in the deployment guide
6. Deploy!

## Quick All-in-One Command:
If you just want to update everything quickly:
```bash
git add . && git commit -m "Add Vercel deployment config and OAuth setup" && git push origin main
```