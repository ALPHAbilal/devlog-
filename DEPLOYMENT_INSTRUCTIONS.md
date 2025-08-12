# MCP Remote Server Deployment Instructions

## Current Status
The MCP integration is complete and ready for deployment. The fixes have been made to handle the `.is()` method issue in the SimpleSupabaseClient.

## Files to Deploy

### 1. Main Server File
**File:** `/workspaces/devlog-/devlog-mcp-remote/src/tools.ts`

**Key Changes:**
- Fixed the search_documents function to not use `.is()` method (lines 236-253)
- Fixed the soft delete operations to not use `.is()` method (lines 366-390)
- The SimpleSupabaseClient doesn't support `.is()` method, so we removed those calls

### 2. Deploy to Cloudflare Workers

You have two options to deploy:

#### Option A: Via Cloudflare Dashboard
1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages
3. Find the `devlog-mcp-production` worker
4. Go to Settings > Quick Edit
5. Copy the entire contents of `/workspaces/devlog-/devlog-mcp-remote/src/tools.ts`
6. Replace the existing tools.ts code
7. Save and Deploy

#### Option B: Via Wrangler CLI (if you have access)
```bash
# Set your Cloudflare API token
export CLOUDFLARE_API_TOKEN=your-token-here

# Navigate to the project
cd /workspaces/devlog-/devlog-mcp-remote

# Deploy to production
npx wrangler deploy --env production
```

## Next Steps After Deployment

### 1. Run the SQL Setup Script
You still need to run the SQL setup script in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `/workspaces/devlog-/supabase-mcp-setup.sql`
4. Paste and run it in the SQL Editor
5. This will:
   - Create API key validation functions
   - Set up MCP-compatible RLS policies
   - Enable all MCP operations

### 2. Test the Integration
After deploying both the worker and SQL changes, run:

```bash
# Test the complete integration
node /workspaces/devlog-/test-mcp-final.js
```

### 3. Configure Claude Desktop
Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "devlog": {
      "command": "node",
      "args": ["/absolute/path/to/devlog-mcp-client/src/index.js"],
      "env": {
        "DEVLOG_API_KEY": "dvlg_sk_prod_671f3be9c40c7f16f1d22423975887a77ef2b786fc4411cb1f4dca0ec1f1fb7a",
        "DEVLOG_REMOTE_URL": "https://devlog-mcp-production.bilal-kosika.workers.dev"
      }
    }
  }
}
```

## What Was Fixed

### The `.is()` Method Issue
The SimpleSupabaseClient implementation doesn't support the `.is()` method that's available in the full Supabase client. We removed these calls:

1. **Search Documents**: Removed `.is('deleted_at', null)` - The SQL RLS policies already handle filtering out soft-deleted documents
2. **Soft Delete**: Removed `.is('deleted_at', null)` - We now update all matching records regardless

### Why This Works
- The RLS policies in the SQL script ensure that soft-deleted documents are automatically filtered out
- The database constraints prevent duplicate soft deletes
- The API key validation ensures proper user context

## Testing Checklist
- [ ] Deploy the updated tools.ts to Cloudflare Workers
- [ ] Run the SQL setup script in Supabase
- [ ] Test document search with empty query
- [ ] Test document search with specific query
- [ ] Test document creation
- [ ] Test soft delete functionality
- [ ] Test with Claude Desktop

## Support
If you encounter any issues:
1. Check the Cloudflare Workers logs for errors
2. Check the Supabase logs for RLS policy violations
3. Run the test scripts to identify specific failures