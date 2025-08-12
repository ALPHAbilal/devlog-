# Devlog MCP Complete Deployment Guide (2025)

This guide provides exact, error-free steps to deploy your Devlog MCP to production. Follow each step carefully.

## Prerequisites Checklist

- [ ] Node.js 18+ installed (check: `node --version`)
- [ ] npm 9+ installed (check: `npm --version`)
- [ ] Cloudflare account created
- [ ] npm account created
- [ ] Supabase project with Devlog database ready

## Part 1: Cloudflare Worker Deployment

### Step 1: Install Wrangler CLI (Latest Version)

```bash
# Install globally
npm install -g wrangler@latest

# Verify installation (should be 3.73.0 or higher)
wrangler --version
```

### Step 2: Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# This will open a browser window - click "Allow"
```

### Step 3: Fix TypeScript Dependencies

Navigate to the remote MCP directory and install missing dependencies:

```bash
cd /home/bilal/devlog-/devlog-mcp-remote

# Install all dependencies including TypeScript types
npm install
npm install --save-dev @cloudflare/workers-types@latest typescript@latest
```

### Step 4: Fix TypeScript Errors

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022", "WebWorker"],
    "types": ["@cloudflare/workers-types/2023-07-01"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "noEmit": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv namespace create "CACHE"

# IMPORTANT: Copy the output ID!
# Example output:
# ✨ Success! Created KV namespace "CACHE" with ID: a1b2c3d4e5f6g7h8i9j0
```

### Step 6: Update wrangler.toml with Your Values

Edit `wrangler.toml` and replace placeholders:

```toml
name = "devlog-mcp"
main = "src/index.ts"
compatibility_date = "2025-01-10"
node_compat = true

# Replace with your actual KV namespace ID from step 5
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_ACTUAL_KV_NAMESPACE_ID"

# Replace with your actual Supabase URL
[vars]
SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"

# Build configuration
[build]
command = "npm install"

# Durable Objects
[[durable_objects.bindings]]
name = "SESSION"
class_name = "MCPSession"

[[migrations]]
tag = "v1"
new_classes = ["MCPSession"]
```

### Step 7: Set Supabase Secret

```bash
# Set your Supabase anon key as a secret
wrangler secret put SUPABASE_ANON_KEY

# Paste your key when prompted (it won't be visible)
# Find your key at: https://app.supabase.com/project/YOUR_PROJECT/settings/api
```

### Step 8: Generate TypeScript Types

```bash
# Generate Cloudflare types
wrangler types

# This creates worker-configuration.d.ts
```

### Step 9: Deploy to Cloudflare

```bash
# First deployment
wrangler deploy

# You should see:
# ✨ Success! Your worker was deployed to:
# https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev
```

### Step 10: Test Your Deployment

```bash
# Test health endpoint
curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/health

# Should return: OK

# Test API info
curl https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/api/info

# Should return JSON with MCP info
```

## Part 2: NPM Package Publishing

### Step 1: Prepare the Client Package

```bash
cd /home/bilal/devlog-/devlog-mcp-client

# Update package.json with your npm scope
# Edit the name field to use your npm username or org
```

Edit `package.json`:

```json
{
  "name": "@YOUR_NPM_USERNAME/devlog-mcp-client",
  "version": "1.0.0",
  "description": "Client for connecting to Devlog MCP remote server",
  "type": "module",
  "main": "src/index.js",
  "bin": {
    "devlog-mcp": "./src/cli.js"
  },
  "scripts": {
    "test": "node --test"
  },
  "keywords": [
    "mcp",
    "devlog",
    "ai",
    "claude",
    "model-context-protocol"
  ],
  "author": "Your Name",
  "license": "MIT",
  "homepage": "https://devlog.design",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/devlog-mcp-client.git"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "node-fetch": "^3.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "files": [
    "src/**/*",
    "README.md"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

### Step 2: Update Remote URL in Client

Edit `src/cli.js` and update the remote URL:

```javascript
const remoteUrl = process.env.DEVLOG_REMOTE_URL || 'https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev';
```

### Step 3: Login to npm

```bash
# Login to npm (creates ~/.npmrc)
npm login

# Enter your npm username, password, and email
# Enable 2FA if prompted
```

### Step 4: Publish to npm

```bash
# For scoped packages, first publish must be public
npm publish --access public

# You should see:
# + @YOUR_USERNAME/devlog-mcp-client@1.0.0
```

### Step 5: Test the Published Package

```bash
# Test installation in a different directory
cd /tmp
npx @YOUR_USERNAME/devlog-mcp-client --setup

# Should show the setup instructions
```

## Part 3: API Key Management in Devlog App

### Step 1: Create Database Tables

Run this SQL in your Supabase SQL editor:

```sql
-- Create API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key_prefix TEXT NOT NULL, -- Store only first 8 chars for display
  key_hash TEXT NOT NULL, -- Store hashed version of full key
  name TEXT,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Create index for fast lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to verify API key
CREATE OR REPLACE FUNCTION verify_api_key(api_key TEXT)
RETURNS TABLE(user_id UUID, tier TEXT, scopes TEXT[]) AS $$
DECLARE
  key_hash TEXT;
BEGIN
  -- Hash the provided key
  key_hash := encode(digest(api_key, 'sha256'), 'hex');
  
  -- Update last used timestamp and return user info
  UPDATE api_keys 
  SET last_used_at = NOW()
  WHERE api_keys.key_hash = verify_api_key.key_hash
    AND revoked_at IS NULL
  RETURNING api_keys.user_id, api_keys.tier, api_keys.scopes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 2: Create API Key Generation Utility

Create `src/utils/apiKeys.js` in your Devlog app:

```javascript
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Generate a secure API key
export function generateApiKey() {
  const prefix = 'dvlg_sk_live';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}_${randomBytes}`;
}

// Hash API key for storage
export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Get key prefix for display (first 8 chars after prefix)
export function getKeyPrefix(apiKey) {
  const parts = apiKey.split('_');
  const lastPart = parts[parts.length - 1];
  return `${parts.slice(0, -1).join('_')}_${lastPart.substring(0, 8)}...`;
}

// Create API key for user
export async function createApiKey(supabase, { name, tier = 'free', scopes = ['read', 'write'] }) {
  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = getKeyPrefix(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      key_prefix: keyPrefix,
      key_hash: keyHash,
      name,
      tier,
      scopes
    })
    .select()
    .single();

  if (error) throw error;

  // Return the full key only once (user must save it)
  return {
    ...data,
    key: apiKey // This is shown only once!
  };
}

// List user's API keys (without the actual keys)
export async function listApiKeys(supabase) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Revoke an API key
export async function revokeApiKey(supabase, keyId) {
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId);

  if (error) throw error;
}
```

### Step 3: Create API Key Management UI

Create `src/pages/ApiKeys.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiKey, listApiKeys, revokeApiKey } from '../utils/apiKeys';
import { Copy, Trash2, Plus } from 'lucide-react';

export default function ApiKeys() {
  const { supabase } = useAuth();
  const [keys, setKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState('');

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const data = await listApiKeys(supabase);
      setKeys(data);
    } catch (error) {
      console.error('Error loading keys:', error);
    }
  }

  async function handleCreateKey() {
    if (!keyName) return;
    
    setLoading(true);
    try {
      const keyData = await createApiKey(supabase, { name: keyName });
      setNewKey(keyData);
      setKeyName('');
      await loadKeys();
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeKey(keyId) {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    
    try {
      await revokeApiKey(supabase, keyId);
      await loadKeys();
    } catch (error) {
      console.error('Error revoking key:', error);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Keys</h1>
      
      {/* New Key Alert */}
      {newKey && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <p className="font-semibold mb-2">⚠️ Save your API key now!</p>
          <p className="text-sm mb-3">This is the only time you'll see this key. Store it securely.</p>
          <div className="flex items-center gap-2 bg-white p-2 rounded border">
            <code className="flex-1 text-sm">{newKey.key}</code>
            <button
              onClick={() => copyToClipboard(newKey.key)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            I've saved my key
          </button>
        </div>
      )}

      {/* Create New Key */}
      <div className="bg-white p-4 rounded border mb-6">
        <h2 className="font-semibold mb-3">Create New API Key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Key name (e.g., Claude Desktop)"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={handleCreateKey}
            disabled={loading || !keyName}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>
      </div>

      {/* Existing Keys */}
      <div className="bg-white rounded border">
        <h2 className="font-semibold p-4 border-b">Your API Keys</h2>
        {keys.length === 0 ? (
          <p className="p-4 text-gray-500">No API keys yet</p>
        ) : (
          <div className="divide-y">
            {keys.map((key) => (
              <div key={key.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-gray-500">
                    {key.key_prefix} • Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevokeKey(key.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-2">Quick Setup</h3>
        <p className="text-sm mb-2">Add to your Claude Desktop config:</p>
        <code className="block bg-white p-2 rounded text-xs">
          npx @{process.env.VITE_NPM_SCOPE || 'devlog'}/devlog-mcp-client --setup
        </code>
      </div>
    </div>
  );
}
```

### Step 4: Add Route to Your App

Add the API keys page to your router:

```jsx
// In your main App.jsx or router configuration
import ApiKeys from './pages/ApiKeys';

// Add route
<Route path="/settings/api-keys" element={<ApiKeys />} />
```

### Step 5: Update Worker to Verify Keys

Update your Cloudflare Worker `auth.ts` to verify against Supabase:

```typescript
export async function authenticateRequest(request: Request, env: any): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const apiKey = authHeader.substring(7);
  
  if (!apiKey.startsWith('dvlg_sk_')) {
    return { valid: false, error: 'Invalid API key format' };
  }

  try {
    // Call Supabase to verify the key
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/verify_api_key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Invalid API key' };
    }

    const [result] = await response.json();
    
    if (!result) {
      return { valid: false, error: 'Invalid or revoked API key' };
    }

    return {
      valid: true,
      userId: result.user_id,
      tier: result.tier,
      projectId: result.user_id, // Use user_id as project_id for now
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { valid: false, error: 'Authentication failed' };
  }
}
```

## Part 4: Final Testing

### Test 1: API Key Generation

1. Login to your Devlog app
2. Navigate to `/settings/api-keys`
3. Create a new API key named "Test Key"
4. Copy the key immediately

### Test 2: MCP Connection

```bash
# Set your API key
export DEVLOG_API_KEY="dvlg_sk_live_YOUR_KEY_HERE"

# Test with curl
curl -H "Authorization: Bearer $DEVLOG_API_KEY" \
  https://devlog-mcp.YOUR-SUBDOMAIN.workers.dev/api/info
```

### Test 3: Claude Desktop Integration

1. Edit Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "devlog": {
         "command": "npx",
         "args": ["-y", "@YOUR_USERNAME/devlog-mcp-client"],
         "env": {
           "DEVLOG_API_KEY": "dvlg_sk_live_YOUR_KEY_HERE"
         }
       }
     }
   }
   ```

2. Restart Claude Desktop
3. Ask Claude: "Can you list my Devlog documents?"

## Troubleshooting

### Cloudflare Deployment Issues

**Error: "compatibility_date is required"**
- Update wrangler.toml with today's date: `compatibility_date = "2025-01-10"`

**Error: "Durable Object class not found"**
- Ensure your index.ts exports the class: `export { MCPSession }`

**Error: "KV namespace not found"**
- Run `wrangler kv namespace list` and use the correct ID

### NPM Publishing Issues

**Error: "402 Payment Required"**
- Ensure package.json has: `"publishConfig": { "access": "public" }`

**Error: "ENEEDAUTH"**
- Run `npm login` again
- Check ~/.npmrc exists

### API Key Issues

**Error: "Invalid API key"**
- Ensure key starts with `dvlg_sk_live_`
- Check key hasn't been revoked
- Verify Supabase RPC function exists

## Success Checklist

- [ ] Cloudflare Worker deployed and accessible
- [ ] Health endpoint returns "OK"
- [ ] NPM package published successfully
- [ ] API key generation working in Devlog app
- [ ] Claude Desktop can connect and list documents
- [ ] No TypeScript errors in build

## Next Steps

1. **Add monitoring**: Set up Cloudflare Analytics
2. **Custom domain**: Add mcp.devlog.design in Cloudflare
3. **Rate limiting**: Implement tier-based limits
4. **OAuth support**: Add for enterprise customers
5. **WebSocket upgrade**: For real-time features

Congratulations! Your Devlog MCP is now live and ready for users! 🎉