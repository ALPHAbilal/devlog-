# Devlog MCP Deployment Guide

This guide walks through deploying the Devlog MCP server to Cloudflare Workers.

## Prerequisites

- Cloudflare account (free tier works)
- Node.js 18+ installed
- Supabase project (existing Devlog database)
- npm or yarn package manager

## Step 1: Set Up Cloudflare Account

1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Authenticate:
   ```bash
   wrangler login
   ```

## Step 2: Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "CACHE"

# Output will show:
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
# Copy this ID for wrangler.toml
```

## Step 3: Configure Cloudflare Worker

1. Navigate to the remote MCP directory:
   ```bash
   cd devlog-mcp-remote
   ```

2. Update `wrangler.toml`:
   ```toml
   name = "devlog-mcp"
   main = "src/index.ts"
   compatibility_date = "2025-01-10"

   [[kv_namespaces]]
   binding = "CACHE"
   id = "YOUR_KV_NAMESPACE_ID" # Replace with actual ID

   [vars]
   SUPABASE_URL = "https://your-project.supabase.co"
   ```

3. Set secrets:
   ```bash
   wrangler secret put SUPABASE_ANON_KEY
   # Paste your Supabase anon key when prompted
   ```

## Step 4: Deploy to Cloudflare

```bash
# Install dependencies
npm install

# Deploy to production
wrangler deploy

# Output:
# Published devlog-mcp
# https://devlog-mcp.your-account.workers.dev
```

## Step 5: Set Up Custom Domain (Optional)

1. In Cloudflare dashboard, go to Workers & Pages
2. Select your `devlog-mcp` worker
3. Go to Triggers → Custom Domains
4. Add `mcp.devlog.design`
5. Update DNS records in your domain provider

## Step 6: Test the Deployment

```bash
# Test health endpoint
curl https://devlog-mcp.your-account.workers.dev/health

# Test API info
curl https://devlog-mcp.your-account.workers.dev/api/info
```

## Step 7: Publish NPX Client Package

1. Navigate to client directory:
   ```bash
   cd devlog-mcp-client
   ```

2. Update package.json with your npm scope

3. Publish to npm:
   ```bash
   npm login
   npm publish --access public
   ```

## Step 8: Configure API Key System

In your Devlog application, add API key management:

```sql
-- Create API keys table
CREATE TABLE api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  key_hash TEXT NOT NULL,
  name TEXT,
  scopes TEXT[],
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Add RLS policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);
```

## Step 9: Monitor Usage

### Cloudflare Analytics

1. Go to Workers & Pages → Analytics
2. Monitor:
   - Request count
   - Error rate
   - Response times
   - Geographic distribution

### Cost Tracking

```javascript
// Add to your worker for cost tracking
export default {
  async fetch(request, env, ctx) {
    // Track request count
    const date = new Date().toISOString().split('T')[0];
    const countKey = `requests:${date}`;
    await env.CACHE.increment(countKey);
    
    // Rest of your code...
  }
}
```

## Step 10: Production Checklist

- [ ] Enable Cloudflare WAF for security
- [ ] Set up rate limiting rules
- [ ] Configure CORS for your domains
- [ ] Enable Cloudflare Analytics
- [ ] Set up error alerts
- [ ] Test with real API keys
- [ ] Monitor KV storage usage
- [ ] Set up backup regions (optional)

## Pricing Breakdown

### Cloudflare Workers (Pay-as-you-go)
- First 100,000 requests/day: Free
- $0.30 per million requests after
- KV storage: 1GB free, then $0.50/GB

### Estimated Costs
- 1,000 users: ~$5/month
- 10,000 users: ~$150/month
- 100,000 users: ~$1,500/month

## Troubleshooting

### Common Issues

1. **CORS errors**: Add your domain to CORS headers in `index.ts`
2. **Auth failures**: Verify Supabase keys are correct
3. **Rate limits**: Increase limits in `auth.ts`
4. **Cold starts**: Normal, 50-200ms on first request

### Debug Commands

```bash
# View real-time logs
wrangler tail

# Check KV storage
wrangler kv:key list --namespace-id=YOUR_ID

# Test locally
wrangler dev
```

## Next Steps

1. Set up staging environment
2. Implement OAuth for enterprise
3. Add WebSocket support for real-time
4. Create admin dashboard
5. Set up automated testing

## Support

- Cloudflare docs: [developers.cloudflare.com](https://developers.cloudflare.com)
- MCP docs: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- Devlog support: support@devlog.design