# Deploy MCP Server Using GitHub Codespaces - Step by Step Guide

I'll be your guide, and you'll be my hands and eyes. Let's deploy your MCP server together!

## Step 1: Create GitHub Repository

1. **Go to GitHub.com and log in**
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in:**
   - Repository name: `devlog-mcp-remote`
   - Description: "Devlog MCP Server for Cloudflare Workers"
   - Make it **Public**
   - Do NOT initialize with README
5. **Click "Create repository"**

## Step 2: Upload Your Code to GitHub

Since you have the code locally, we need to get it to GitHub:

### Option A: Upload files through GitHub UI
1. In your new empty repository, click **"uploading an existing file"**
2. Drag and drop these folders/files from `/home/bilal/devlog-/devlog-mcp-remote/`:
   - `src/` folder (with all files inside)
   - `wrangler.toml`
   - `package.json`
   - `tsconfig.json`
   - `.gitignore`
3. Write commit message: "Initial commit"
4. Click **"Commit changes"**

### Option B: If you can use git locally (just these commands):
```bash
cd /home/bilal/devlog-/devlog-mcp-remote
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/devlog-mcp-remote.git
git push -u origin main
```

## Step 3: Open GitHub Codespaces

1. **In your GitHub repository**, click the green **"Code"** button
2. Click on **"Codespaces"** tab
3. Click **"Create codespace on main"**
4. Wait 1-2 minutes for Codespaces to start (it's setting up a full development environment)

## Step 4: Set Up in Codespaces

Once Codespaces opens (looks like VS Code in your browser):

1. **Open the terminal** (Terminal → New Terminal or Ctrl+`)
2. **Run these commands** (I'll tell you what each does):

```bash
# Check you're in the right directory
pwd
# Should show: /workspaces/devlog-mcp-remote

# Install dependencies
npm install

# Check wrangler is installed
npx wrangler --version
# Should show version 4.x.x
```

## Step 5: Login to Cloudflare

In the Codespaces terminal:

```bash
npx wrangler login
```

**What will happen:**
- It will show a URL
- Click the URL (or copy-paste to new tab)
- Authorize wrangler in your Cloudflare account
- Return to Codespaces

## Step 6: Generate TypeScript Types

```bash
npx wrangler types
```

This creates the `worker-configuration.d.ts` file.

## Step 7: Deploy Your Worker

```bash
npx wrangler deploy
```

**What you'll see:**
- Building and bundling your Worker
- Uploading to Cloudflare
- Creating Durable Objects
- Running migrations
- **Your Worker URL** (save this!)

## Step 8: Add Your Secret

```bash
npx wrangler secret put SUPABASE_ANON_KEY
```

When it asks for the value, paste:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY2ppcHdpem5lc25iZ2JvY251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NjgwOTgsImV4cCI6MjA2NjU0NDA5OH0.GWgZOH0sKP2z2_IGG6_omnJwpefSRnI353hmu729ahg
```

## Step 9: Test Your Deployment

In the Codespaces terminal:

```bash
# Replace YOUR-SUBDOMAIN with your actual subdomain from deployment
curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/health

# Should return: OK

curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/api/info

# Should return JSON with server info
```

## Step 10: Monitor Your Worker

```bash
npx wrangler tail
```

This shows real-time logs from your Worker.

## Troubleshooting Commands

If something goes wrong, here are helpful commands:

```bash
# Check your wrangler configuration
cat wrangler.toml

# Check if logged in
npx wrangler whoami

# See deployment details
npx wrangler deployments list

# Delete and redeploy if needed
npx wrangler delete
npx wrangler deploy
```

## What to Tell Me

As we go through each step, tell me:
1. What you see on screen
2. Any errors or warnings
3. When each step completes successfully
4. The URLs or IDs that are generated

## Success Checklist

- [ ] GitHub repository created
- [ ] Code uploaded to GitHub
- [ ] Codespaces opened
- [ ] Dependencies installed
- [ ] Logged into Cloudflare
- [ ] Worker deployed
- [ ] Secret added
- [ ] Health endpoint working
- [ ] API info endpoint working

## Next Steps After Success

1. Save your Worker URL
2. Update your NPX client package with the Worker URL
3. Test with your MCP client
4. Close Codespaces when done (it's free for 60 hours/month)

---

Ready? Start with Step 1 and tell me when you've created the GitHub repository!