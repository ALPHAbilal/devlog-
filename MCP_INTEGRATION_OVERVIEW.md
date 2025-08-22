# DevLog MCP Integration Overview

## Project Architecture

DevLog is a block-based knowledge management system with MCP (Model Context Protocol) integration for AI assistant connectivity.

### Core Components

1. **Frontend (React + Vite)**
   - Location: `/src/`
   - Block-based document system
   - Supabase integration for storage
   - Multi-layer storage architecture (Memory → IndexedDB → Supabase)

2. **MCP Client (NPM Package)**
   - Location: `/devlog-mcp-client/`
   - Published as `devlog-mcp` npm package v2.0.0
   - Provides MCP server for AI assistants to connect
   - Uses Node.js with @modelcontextprotocol/sdk

3. **MCP Remote Server (Cloudflare Worker)**
   - Location: `/devlog-mcp-remote/`
   - TypeScript-based worker for remote MCP operations
   - Durable Objects for session management
   - KV storage for caching

4. **API Endpoints**
   - Location: `/api/mcp/`
   - Document management endpoints
   - Block creation and editing
   - AI conversation capture

## Key Integration Points

### Supabase Configuration
- **Project URL**: `https://zqcjipwiznesnbgbocnu.supabase.co`
- **Auth**: PKCE flow with secure token storage
- **Storage**: JSONB blocks with Row Level Security (RLS)
- **Real-time**: Limited to 2 events/second for performance

### MCP Server Configuration
The MCP server is configured to use Supabase in read-only mode by default:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=zqcjipwiznesnbgbocnu"
      ]
    }
  }
}
```

### Storage Architecture
```
User Action → Memory Cache (LRU)
    ↓
IndexedDB (1GB+ capacity)
    ↓
Supabase (Cloud with RLS)
```

### Block Types
- TextBlock - Markdown with tag support
- CodeBlock - Syntax highlighting with file paths
- HeadingBlock - Document headings
- TableBlock - Dynamic tables
- FileTreeBlock - Visual project structure
- AIConversationBlock - Preserved AI conversations
- TodoBlock - Task lists
- ImageBlock - Image display
- VersionTrackBlock - Version tracking
- IssueTrackerBlock - Issue tracking

## Available MCP Tools

### Through Supabase MCP Server
- `list_organizations` - List user organizations
- `list_projects` - List Supabase projects
- `get_project` - Get project details
- `create_project` - Create new project (with cost confirmation)
- `list_tables` - List database tables
- `execute_sql` - Execute SQL queries
- `apply_migration` - Apply database migrations
- `list_branches` - List development branches
- `create_branch` - Create development branch
- `merge_branch` - Merge branch to production
- `get_logs` - Get service logs
- `get_advisors` - Get security/performance advisories
- `generate_typescript_types` - Generate TypeScript types
- `search_docs` - Search Supabase documentation
- `list_edge_functions` - List Edge Functions
- `deploy_edge_function` - Deploy Edge Function

## Environment Variables

### Required for Production
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://zqcjipwiznesnbgbocnu.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Analytics 4
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry Error Tracking
VITE_SENTRY_DSN=https://your-key@sentry.io/project
```

### MCP Remote Server (Cloudflare)
```toml
SUPABASE_URL = "https://zqcjipwiznesnbgbocnu.supabase.co"
SUPABASE_ANON_KEY = "your-anon-key"
MCP_SERVER_NAME = "Devlog MCP Server"
MCP_VERSION = "1.0.0"
```

## Security Features

1. **Row Level Security (RLS)** - All database operations respect user permissions
2. **PKCE Authentication Flow** - Secure OAuth implementation
3. **Secure Token Storage** - Custom storage adapter with encryption
4. **Session Monitoring** - Activity tracking and timeout management
5. **Rate Limiting** - Request throttling to prevent abuse
6. **Data Integrity** - SHA-256 checksums for corruption detection

## Performance Optimizations

1. **Virtual Scrolling** - React-window for large document lists
2. **Lazy Loading** - Components loaded on demand
3. **Optimistic Updates** - Instant UI feedback before sync
4. **Debounced Saves** - 1-second delay to prevent overwrites
5. **5-Second Cache** - Document preloading for navigation
6. **Compression** - LZ-String for 50-80% space savings

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Testing MCP Integration

### Local MCP Server
```bash
cd devlog-mcp-client
npm test
```

### Manual Testing
```bash
# Test MCP connection
node test-scripts/test-mcp-comprehensive.js

# Test API endpoints
node test-scripts/test-mcp-api.js
```

## Deployment

### Frontend (Vercel)
- Automatic deployment from GitHub
- Environment variables configured in Vercel dashboard

### MCP Remote (Cloudflare Workers)
```bash
cd devlog-mcp-remote
wrangler deploy --env production
```

### NPM Package
```bash
cd devlog-mcp-client
npm publish
```

## Key Files for MCP Integration

- `/src/lib/supabaseOptimized.js` - Optimized Supabase client
- `/src/utils/storage/MultiLayerStorage.js` - Storage coordination
- `/api/mcp/` - MCP API endpoints
- `/devlog-mcp-client/src/index.js` - MCP server implementation
- `/devlog-mcp-remote/src/index.ts` - Cloudflare Worker entry
- `/docs/mcp/` - MCP documentation and guides

## Notes

- The project uses React 19 with Strict Mode
- Vite for build tooling with optimizations
- Supabase handles authentication and cloud storage
- MCP integration allows AI assistants to interact with DevLog data
- Multi-layer storage ensures offline capability and performance