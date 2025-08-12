# Cloudflare Dashboard Setup Guide (2025)

Follow these exact steps in your Cloudflare dashboard to deploy the Devlog MCP server.

## 📍 Current Status
You're logged into the Cloudflare dashboard. Let's set everything up step by step.

## Step 1: Create KV Namespace (For Caching)

1. **Navigate to KV**:
   - In the left sidebar, click **Workers & Pages**
   - Under "Storage", click **KV**
   - OR directly go to: **Storage & Databases** → **KV**

2. **Create Namespace**:
   - Click the **"Create namespace"** button
   - **Name**: `devlog-mcp-cache`
   - Click **"Add"**

3. **Copy the ID**:
   - After creation, you'll see your namespace with an ID like: `a1b2c3d4e5f6g7h8i9j0`
   - **COPY THIS ID** - you'll need it later!

## Step 2: Create Your Worker

1. **Navigate to Workers**:
   - Go to **Workers & Pages** → **Overview**
   - Click **"Create application"**

2. **Create Worker**:
   - Select **"Create Worker"**
   - **Name**: `devlog-mcp`
   - Click **"Deploy"**

3. **Initial Deployment**:
   - You'll see a default "Hello World" worker
   - Click **"Continue to project"**

## Step 3: Configure Worker Settings

### 3.1 Add KV Namespace Binding

1. In your worker dashboard, click **"Settings"** tab
2. Scroll down to **"Bindings"** section
3. Click **"Add binding"**
4. Select **"KV Namespace"**
5. Configure:
   - **Variable name**: `CACHE`
   - **KV namespace**: Select `devlog-mcp-cache` from dropdown
6. Click **"Save"**

### 3.2 Add Environment Variables

1. Still in Settings → Bindings
2. Click **"Add binding"**
3. Select **"Environment variable"**
4. Add:
   - **Variable name**: `SUPABASE_URL`
   - **Value**: `https://YOUR_PROJECT.supabase.co` (replace with your actual URL)
5. Click **"Save"**

### 3.3 Add Secret (Supabase Key)

1. In Settings → **"Variables and Secrets"**
2. Click **"+ Add"**
3. Select **"Secret"**
4. Configure:
   - **Secret name**: `SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key (find it in Supabase dashboard → Settings → API)
5. Click **"Encrypt and save"**

## Step 4: Enable Durable Objects

1. **Navigate to Worker Settings**:
   - Still in your worker's Settings tab
   - Look for **"Durable Objects"** section

2. **Create Durable Object Namespace**:
   - Click **"Create namespace"**
   - **Namespace name**: `SESSION`
   - **Class name**: `MCPSession`
   - Click **"Create"**

## Step 5: Deploy Your Code

### Option A: Deploy via Dashboard (Quick Edit)

1. Click **"Quick edit"** button in your worker
2. Replace all code with your TypeScript code from `devlog-mcp-remote/src/index.ts`
3. Click **"Save and deploy"**

### Option B: Deploy via Wrangler (Recommended)

1. Open your terminal
2. Navigate to your project:
   ```bash
   cd /home/bilal/devlog-/devlog-mcp-remote
   ```

3. Update `wrangler.toml` with your KV namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "CACHE"
   id = "YOUR_ACTUAL_KV_ID_FROM_STEP_1"
   ```

4. Deploy:
   ```bash
   wrangler deploy
   ```

## Step 6: Set Up Custom Domain (Optional)

1. In your worker, go to **"Triggers"** tab
2. Under **"Custom Domains"**, click **"Add Custom Domain"**
3. Enter: `mcp.devlog.design`
4. Follow DNS configuration instructions

## Step 7: Test Your Deployment

1. **Find your worker URL**:
   - In the worker dashboard, look for your URL
   - Format: `https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev`

2. **Test endpoints**:
   ```bash
   # Test health
   curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/health
   
   # Test info
   curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/api/info
   ```

## Step 8: Monitor Your Worker

1. Go to **"Analytics"** tab in your worker
2. You can see:
   - Request count
   - Error rates
   - Response times
   - Subrequest count

## 🎯 Success Checklist

- [ ] KV namespace created and ID copied
- [ ] Worker created with name `devlog-mcp`
- [ ] KV namespace bound as `CACHE`
- [ ] Environment variable `SUPABASE_URL` set
- [ ] Secret `SUPABASE_ANON_KEY` encrypted and saved
- [ ] Durable Objects namespace created
- [ ] Code deployed successfully
- [ ] Health endpoint returns "OK"
- [ ] API info endpoint returns JSON

## 💰 Pricing Notes

With your deployed worker:
- **First 100,000 requests/day**: Free
- **After that**: $0.30 per million requests
- **KV Storage**: 1GB free, then $0.50/GB
- **Durable Objects**: 
  - Free plan: 5GB total storage
  - Paid plan: 10GB per Durable Object

## 🚨 Common Issues

### "Script not found" Error
- Make sure you deployed your code (Step 5)
- Check that `main = "src/index.ts"` in wrangler.toml

### "KV namespace not found"
- Verify the KV namespace ID is correct
- Ensure binding name is `CACHE` (case-sensitive)

### "Authentication failed"
- Double-check your `SUPABASE_ANON_KEY` is correct
- Verify `SUPABASE_URL` includes `https://`

## Next Steps

1. **Publish NPM Package**: Follow the NPM publishing guide
2. **Set up API Keys**: Add the API key system to your Devlog app
3. **Test with Users**: Share the setup guide with beta users

Your Cloudflare Worker is now live! 🎉