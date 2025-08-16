# Journey Log MCP Deployment Guide

## Overview
This guide will walk you through deploying the MCP integration for Journey Log Compass. The deployment consists of:
1. Deploying API endpoints to Vercel
2. Publishing the MCP server to NPM
3. Setting up user authentication

## Step 1: Deploy API Endpoints to Vercel

### Prerequisites
- Vercel account connected to your GitHub repository
- Supabase service key available

### Deployment Steps

1. **Set Environment Variables in Vercel**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. **Create the API Keys Table in Supabase**
   - Go to Supabase SQL Editor
   - Run the SQL from `/src/lib/sql/create_api_keys_table.sql`
   - Run the SQL from `/src/lib/sql/decrement_block_positions.sql`

3. **Push Changes to GitHub**
   ```bash
   cd /mnt/f/my/devlog-
   git add .
   git commit -m "Add MCP API endpoints and API key management"
   git push origin main
   ```

4. **Verify Deployment**
   - Wait for Vercel to deploy
   - Test the health endpoint: `https://devlog.design/api/mcp/health`
   - You should see: `{"status":"ok","message":"MCP API is running"}`

## Step 2: Publish MCP Server to NPM

### Prerequisites
- NPM account (create at npmjs.com)
- Access to publish under @journey-log organization

### Publishing Steps

1. **Build the MCP Server**
   ```bash
   cd /mnt/f/my/devlog-/mcp-server
   npm install
   npm run build
   ```

2. **Test Locally**
   ```bash
   npm run inspect
   ```

3. **Login to NPM**
   ```bash
   npm login
   # Enter your credentials
   ```

4. **Publish to NPM**
   ```bash
   npm publish --access public
   ```

   The package will be available at: `@journey-log/mcp-server`

## Step 3: User Setup Instructions

### For End Users

1. **Get API Key**
   - Visit https://devlog.design/settings
   - Click on "API Keys" section
   - Create a new API key
   - Copy the key (you won't see it again!)

2. **Install MCP Server**
   ```bash
   npm install -g @journey-log/mcp-server
   ```

3. **Configure Claude Desktop**
   
   Edit Claude Desktop config:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "journey-log": {
         "command": "npx",
         "args": ["@journey-log/mcp-server"],
         "env": {
           "JOURNEY_LOG_API_KEY": "your-api-key-here"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**

## API Endpoints Created

All endpoints require Bearer token authentication with API key.

### Documents
- `POST /api/mcp/documents/create` - Create new document
- `GET /api/mcp/documents/list` - List documents
- `GET /api/mcp/documents/[id]` - Get specific document
- `PATCH /api/mcp/documents/[id]/update` - Update document

### Blocks
- `POST /api/mcp/blocks/create` - Add block to document
- `DELETE /api/mcp/blocks/[id]/delete` - Delete block

### Conversations
- `POST /api/mcp/conversations/capture` - Capture AI conversation

### System
- `GET /api/mcp/health` - Health check

## Security Features

1. **API Key Security**
   - Keys are hashed using SHA-256 before storage
   - Only key preview (first 8 + last 4 chars) is stored
   - Keys can be revoked by soft delete

2. **Rate Limiting**
   - In-memory rate limiting per user
   - Different limits for different operations
   - Prevents abuse

3. **Row Level Security**
   - All operations respect Supabase RLS
   - Users can only access their own data
   - Service key used server-side only

## Monitoring

1. **Check API Health**
   ```bash
   curl https://devlog.design/api/mcp/health
   ```

2. **View Logs in Vercel**
   - Go to Vercel dashboard
   - Select your project
   - View Functions tab for API logs

3. **Monitor NPM Downloads**
   - Visit https://www.npmjs.com/package/@journey-log/mcp-server
   - Check weekly downloads

## Troubleshooting

### API Endpoints Not Working
- Check Vercel environment variables
- Verify Supabase service key is correct
- Check function logs in Vercel

### MCP Server Connection Issues
- Ensure API key is valid
- Check Claude Desktop was restarted
- Verify config file syntax is correct

### NPM Publishing Issues
- Ensure you're logged in: `npm whoami`
- Check package version isn't already published
- Verify you have publish permissions

## Next Steps

1. **Monitor Usage**
   - Track API key usage in database
   - Set up alerts for high usage

2. **Add Features**
   - Webhook support for real-time updates
   - Batch operations for efficiency
   - More AI tool integrations

3. **Documentation**
   - Create video tutorials
   - Add to main documentation site
   - Create integration examples