---
date: 2025-10-23T15:30:00Z
researcher: Claude Code
git_commit: 61ca8956b051be5959e6c28964f0fa884405addb
branch: main
repository: devlog
topic: "API Keys Settings Migration - Integrate /settings/api into /settings"
tags: [research, codebase, api-keys, settings, migration, refactoring, figma-design]
status: complete
last_updated: 2025-10-23
last_updated_by: Claude Code
---

# API Keys Settings Migration Research

**Date**: 2025-10-23
**Figma Design**: Node-id 11-268
**Target**: Consolidate API Keys management inline in `/settings` page

## Research Question

How do we migrate the API Keys management functionality from the standalone `/settings/api` page into the `/settings` page's API section using the new Figma design? This includes:

1. Removing the "Manage API Keys" button from the current API section
2. Moving all API key creation, management, and deletion logic inline
3. Integrating the new Figma design while maintaining full functionality
4. Consolidating the backend/database interactions
5. Ensuring responsive design for mobile and desktop

## Executive Summary

**Current State**: API Keys management is split across two pages:
- `/settings` has a button that links to `/settings/api`
- `/settings/api` is a standalone page with 1,150+ lines

**Desired State**: All functionality inline in `/settings` API section with new Figma design

### Key Findings

1. **Multiple Settings Implementations**: Three different settings page versions exist
2. **Standalone API Page**: `src/pages/settings/api.jsx` (1,150 lines) - needs to be integrated
3. **Database Ready**: Supabase `api_keys` table with RLS policies is production-ready
4. **No Complex Dependencies**: Uses direct hooks (useAuth, useToast, useAnalytics)
5. **Modular Components Available**: `ApiKeysSection.jsx` exists in SettingsRedesign
6. **Figma Design Provided**: Node-id 11-268 shows the new inline layout

---

## Current Implementation Files

### Pages

| Path | File | Type | Status |
|------|------|------|--------|
| `/settings` | `src/pages/SettingsClaude.jsx` | Main | **ACTIVE** |
| `/settings-redesign` | `src/pages/SettingsRedesign.jsx` | Experimental | Available |
| `/settings/api` | `src/pages/settings/api.jsx` | Standalone | **TARGET** |

### Related Components

- `src/pages/settings-sections/ApiKeysSection.jsx` - Modular API keys component
- `src/pages/settings-sections/AccountSection.jsx` - Account settings
- `src/pages/settings-sections/SecuritySection.jsx` - Security settings
- `src/pages/settings-sections/StorageSection.jsx` - Storage settings

---

## Current /settings/api Page Structure

**Location**: `src/pages/settings/api.jsx`
**Lines**: 1,150 total
**Language**: React + Inline CSS

### Components in api.jsx

1. **ApiKeyCard** (lines 30-87)
   - Display individual API key
   - Delete button with confirmation
   - Metadata (created date, last used date)

2. **CodeBlock** (lines 89-100)
   - Code snippet display
   - Copy button functionality

3. **SetupAccordion** (lines 102-131)
   - Collapsible sections
   - Recommended badge support
   - Toggle mechanism

4. **Helper Components**
   - `SettingGroup` - Reusable group wrapper
   - `Button` - Reusable button component

### Business Logic (Functions)

```javascript
loadApiKeys()          // lines 163-185 - Query user's API keys
createApiKey()         // lines 187-242 - Generate & store new key
deleteApiKey()         // lines 244-274 - Soft delete via is_active flag
copyToClipboard()      // lines 276-291 - Copy with toast notification
copyApiKey()           // lines 287-291 - Copy initial key display
```

### Key Features

#### 1. Create API Keys (lines 187-242)
- Generate cryptographically secure 32-byte keys
- Format: `dvlg_sk_prod_[hex]`
- SHA-256 hash for database storage
- Show full key once, then key preview
- Mobile support via MobileBottomSheet

#### 2. Delete API Keys (lines 244-274)
- Soft delete using `is_active` flag
- Track key age and usage history
- Analytics event tracking
- Confirmation dialog

#### 3. Display Existing Keys (lines 404-414)
- Load from Supabase `api_keys` table
- Display creation date
- Display last used date
- Delete button with confirmation

#### 4. Copy to Clipboard (lines 276-291)
- Full key copy on creation
- Code block copy for setup
- Toast notifications
- Copy success tracking

#### 5. Setup Guides (lines 418-530)
- Claude Code (recommended, expandable by default)
- Claude Desktop
- VS Code & Cursor
- Collapsible accordions
- Code snippets with environment variables

#### 6. Mobile Responsiveness (lines 1091-1146)
- Bottom sheet for key creation on mobile
- Responsive layout adjustments
- Touch-friendly button sizing

---

## Supabase Database Schema

### api_keys Table

```sql
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,              -- Key display name
  key_hash text not null,          -- SHA-256 hash of full key
  key_preview text not null,       -- Preview: first8...last4
  created_at timestamp default now(),
  last_used_at timestamp,
  is_active boolean default true
);
```

### RLS Policies

- Users can only view their own keys
- Users can only create keys for themselves
- Users can only delete their own keys
- Hard delete not allowed (maintains audit trail)

---

## Current SettingsClaude.jsx API Section

**Location**: `src/pages/SettingsClaude.jsx` lines 277-321

### Current Code Problem

```jsx
{activeSection === 'api' && (
  <div className="content-section">
    <h2 className="section-title">API Keys</h2>
    <SettingGroup title="Manage API Keys">
      <p className="setting-description">
        API keys allow you to connect Journey Log to your AI tools...
      </p>
      <Button onClick={() => navigate('/settings/api')} variant="primary">
        Manage API Keys  {/* ❌ Navigates away */}
      </Button>
    </SettingGroup>
    <SettingGroup title="Quick Setup">
      {/* Basic setup info */}
    </SettingGroup>
  </div>
)}
```

### Issues to Fix

- Button navigates away from `/settings`
- Breaks user context
- Inconsistent UX
- Duplicates setup guide information
- Not matching new Figma design

---

## Files to Modify

### Frontend (Priority: HIGH)

| File | Path | Changes Required |
|------|------|-------------------|
| **SettingsClaude.jsx** | `src/pages/` | Replace API section with inline components |
| **settings-claude.css** | `src/styles/` | Add new API key card & setup styles |
| **App.jsx** | `src/` | Remove `/settings/api` route definition |

### Optional Refactoring (Priority: MEDIUM)

| File | Path | Purpose |
|------|------|---------|
| **ApiKeyCard.jsx** | `src/components/` | Extract component (optional) |
| **CodeBlock.jsx** | `src/components/` | Extract component (optional) |
| **SetupAccordion.jsx** | `src/components/` | Extract component (optional) |
| **useApiKeys.js** | `src/hooks/` | Extract business logic (optional) |

### Backend (Priority: NONE)

- Supabase `api_keys` table: **No changes needed**
- RLS Policies: **No changes needed**
- API endpoints: **No changes needed** (already use auth validation)

---

## Required Hooks & Dependencies

### Hooks to Add

```javascript
import { useToast } from '../hooks/useToast'
import { useAnalytics } from '../hooks/useAnalytics'
```

### Browser APIs (Already Available)

```javascript
crypto.getRandomValues()     // Generate secure random bytes
crypto.subtle.digest()       // SHA-256 hashing
navigator.clipboard.writeText() // Copy to clipboard
```

### Already Imported in SettingsClaude.jsx

```javascript
import { useAuth } from '../contexts/AuthContextOptimized'
import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
```

---

## State Management Plan

### New State Variables to Add

```javascript
// In SettingsClaude.jsx, in the function body:

// API Keys management
const [apiKeys, setApiKeys] = useState([])
const [apiKeysLoading, setApiKeysLoading] = useState(true)
const [newApiKey, setNewApiKey] = useState(null)        // Newly created key
const [showCreateSheet, setShowCreateSheet] = useState(false) // Mobile sheet
const [creating, setCreating] = useState(false)         // Creation loading
const [newKeyName, setNewKeyName] = useState('')        // Form input
const [copiedKey, setCopiedKey] = useState(false)       // Copy success state
```

### Load Keys on Section Change

```javascript
useEffect(() => {
  if (activeSection === 'api') {
    loadApiKeys()
  }
}, [activeSection])
```

---

## Implementation Flow

### Phase 1: Component Extraction (Optional)

1. Extract `ApiKeyCard` component from api.jsx
2. Extract `CodeBlock` component from api.jsx
3. Extract `SetupAccordion` component from api.jsx
4. Create `useApiKeys()` hook with all business logic

### Phase 2: Integration into SettingsClaude.jsx

1. Add state variables listed above
2. Add imports for useToast, useAnalytics
3. Copy business logic functions from api.jsx:
   - `loadApiKeys()`
   - `createApiKey()`
   - `deleteApiKey()`
   - `copyToClipboard()`
4. Replace API section JSX (lines 277-321)
5. Add useEffect hooks for loading

### Phase 3: Styling

1. Extract API-specific styles from api.jsx (lines 582-1147)
2. Add to `src/styles/settings-claude.css`
3. Update styles to match Figma design (node-id: 11-268)
4. Ensure mobile responsive styles

### Phase 4: Cleanup

1. Remove `/settings/api` route from `App.jsx`
2. Archive/remove `src/pages/settings/api.jsx` (optional)
3. Update any navigation links pointing to `/settings/api`
4. Test all flows

---

## Code to Move

### Key Generation Function

```javascript
const createApiKey = async () => {
  if (!newKeyName.trim()) {
    toast.error('Please enter a name for the API key')
    return
  }

  setCreating(true)
  try {
    // Generate secure random key
    const keyBytes = new Uint8Array(32)
    crypto.getRandomValues(keyBytes)
    const apiKey = 'dvlg_sk_prod_' + Array.from(keyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Hash for storage
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Store in Supabase
    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: newKeyName.trim(),
        key_hash: keyHash,
        key_preview: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
      })
      .select()
      .single()

    if (error) throw error

    trackEvent('api_key_created', {
      key_name: newKeyName.trim(),
      key_prefix: 'dvlg_sk_prod',
      created_from: 'settings_page'
    })

    setNewApiKey(apiKey)
    setApiKeys([newKey, ...apiKeys])
    setNewKeyName('')
    setShowCreateSheet(false)
  } catch (error) {
    toast.error('Failed to create API key')
    console.error('Error:', error)
  } finally {
    setCreating(false)
  }
}
```

### Load Keys Function

```javascript
const loadApiKeys = async () => {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    setApiKeys(data || [])

    trackEvent('api_settings_viewed', {
      existing_keys_count: data?.length || 0,
      has_keys: (data?.length || 0) > 0
    })
  } catch (error) {
    toast.error('Failed to load API keys')
    console.error('Error:', error)
  } finally {
    setApiKeysLoading(false)
  }
}
```

### Delete Key Function

```javascript
const deleteApiKey = async (id) => {
  try {
    const keyToDelete = apiKeys.find(key => key.id === id)

    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error

    if (keyToDelete) {
      const keyAgeMs = Date.now() - new Date(keyToDelete.created_at).getTime()
      const keyAgeDays = Math.floor(keyAgeMs / (1000 * 60 * 60 * 24))

      trackEvent('api_key_deleted', {
        key_age_days: keyAgeDays,
        was_used: !!keyToDelete.last_used_at,
        key_name: keyToDelete.name
      })
    }

    setApiKeys(apiKeys.filter(key => key.id !== id))
    toast.success('API key deleted')
  } catch (error) {
    toast.error('Failed to delete API key')
    console.error('Error:', error)
  }
}
```

### Copy Function

```javascript
const copyToClipboard = (text, context = 'unknown') => {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard')

  trackEvent('api_key_copied', {
    copy_location: context,
    is_first_copy: context === 'initial_creation' && !copiedKey
  })
}
```

---

## New JSX Structure for API Section

Replace lines 277-321 in SettingsClaude.jsx with:

```jsx
{activeSection === 'api' && (
  <div className="content-section">
    <h2 className="section-title">API Keys</h2>
    <p className="section-description">
      Connect Claude Desktop, VS Code, and other AI tools to Devlog with secure API keys
    </p>

    {/* New API Key Success */}
    {newApiKey && (
      <div className="api-key-success">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <div className="success-content">
            <h3>Your new API key is ready!</h3>
            <p>Make sure to copy it now. You won't be able to see it again.</p>
          </div>
        </div>

        <div className="api-key-display">
          <code className="api-key-full">{newApiKey}</code>
          <Button
            variant={copiedKey ? "secondary" : "primary"}
            size="small"
            onClick={() => {
              copyToClipboard(newApiKey, 'initial_creation')
              setCopiedKey(true)
              setTimeout(() => setCopiedKey(false), 2000)
            }}
          >
            {copiedKey ? "Copied!" : "Copy"}
          </Button>
        </div>

        <button
          onClick={() => setNewApiKey(null)}
          className="close-success"
        >
          ×
        </button>
      </div>
    )}

    {/* Create API Key */}
    <SettingGroup title="Create API Key">
      <div className="create-key-section">
        <p className="setting-description">
          Create a key to connect your AI tools to Devlog
        </p>
        {isMobile ? (
          <Button
            variant="primary"
            onClick={() => setShowCreateSheet(true)}
          >
            Create New Key
          </Button>
        ) : (
          <div className="create-key-inline">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g., Claude Code, VS Code)"
              className="key-name-input"
              disabled={creating}
            />
            <Button
              onClick={createApiKey}
              disabled={creating || !newKeyName.trim()}
            >
              Create Key
            </Button>
          </div>
        )}
      </div>
    </SettingGroup>

    {/* Active Keys */}
    <SettingGroup title="Active Keys">
      {apiKeysLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading API keys...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="empty-state">
          <h3>No API keys yet</h3>
          <p>Create your first API key to connect AI assistants to your Devlog</p>
        </div>
      ) : (
        <div className="api-keys-list">
          {apiKeys.map((key) => (
            <ApiKeyCard
              key={key.id}
              apiKey={key}
              onDelete={deleteApiKey}
              onCopy={copyToClipboard}
            />
          ))}
        </div>
      )}
    </SettingGroup>

    {/* Setup Guide */}
    <SettingGroup title="Quick Setup Guide">
      <div className="setup-guide">
        <p className="setup-intro">Pick your AI tool to see simple setup steps:</p>

        {/* Claude Code Accordion */}
        <SetupAccordion
          title="Claude Code"
          description="One-command setup for Claude's official CLI"
          isRecommended={true}
          defaultOpen={true}
        >
          <div className="setup-content">
            <div className="setup-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <p>Run this command in your terminal:</p>
                <CodeBlock
                  code={`claude mcp add devlog -s user -e DEVLOG_API_KEY="${newApiKey || 'your_api_key'}" -- npx -y devlog-mcp`}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
            <div className="setup-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <p>Restart Claude Code and you're ready to go!</p>
              </div>
            </div>
          </div>
        </SetupAccordion>

        {/* Additional accordions for Claude Desktop, VS Code, etc. */}
      </div>
    </SettingGroup>
  </div>
)}

{/* Mobile Create Sheet */}
{isMobile && activeSection === 'api' && (
  <MobileBottomSheet
    isOpen={showCreateSheet}
    onClose={() => {
      setShowCreateSheet(false)
      setNewKeyName('')
    }}
    title="Create API Key"
  >
    <div className="mobile-create-content">
      <div className="form-field">
        <label htmlFor="key-name-mobile">Key Name</label>
        <input
          id="key-name-mobile"
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="e.g., Claude Code, VS Code"
          required
        />
      </div>

      <div className="mobile-actions">
        <Button
          variant="secondary"
          onClick={() => {
            setShowCreateSheet(false)
            setNewKeyName('')
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={createApiKey}
          disabled={creating || !newKeyName.trim()}
        >
          {creating ? 'Creating...' : 'Create Key'}
        </Button>
      </div>
    </div>
  </MobileBottomSheet>
)}
```

---

## CSS Classes to Add

Add to `src/styles/settings-claude.css`:

```css
/* API Key Card */
.api-key-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.api-key-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Setup Accordion */
.setup-accordion {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: var(--space-3);
  overflow: hidden;
}

.setup-accordion-header {
  width: 100%;
  padding: var(--space-4);
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  transition: all var(--transition);
}

/* Code Block */
.code-block {
  position: relative;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: var(--space-3);
  margin-top: var(--space-2);
}

.code-block pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.875rem;
  color: var(--text-primary);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Success Message */
.api-key-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  position: relative;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .api-key-display {
    flex-direction: column;
    align-items: stretch;
  }

  .api-key-card {
    border-radius: 12px;
    margin-bottom: var(--space-3);
  }
}
```

---

## Migration Checklist

- [ ] Extract ApiKeyCard component (optional)
- [ ] Extract CodeBlock component (optional)
- [ ] Extract SetupAccordion component (optional)
- [ ] Create useApiKeys hook (optional)
- [ ] Add useToast hook import
- [ ] Add useAnalytics hook import
- [ ] Add state variables to SettingsClaude.jsx
- [ ] Copy loadApiKeys function
- [ ] Copy createApiKey function
- [ ] Copy deleteApiKey function
- [ ] Copy copyToClipboard function
- [ ] Replace API section JSX
- [ ] Add API key styles to CSS
- [ ] Add mobile responsive styles
- [ ] Test desktop layout
- [ ] Test mobile layout
- [ ] Test create key workflow
- [ ] Test delete key workflow
- [ ] Test copy functionality
- [ ] Remove /settings/api route from App.jsx
- [ ] Remove or archive api.jsx file
- [ ] Verify Figma design compliance

---

## Success Criteria

✅ All API key functionality available from `/settings` API section
✅ No navigation to separate page required
✅ Matches Figma design (node-id: 11-268)
✅ Mobile and desktop responsive
✅ All CRUD operations working
✅ Copy-to-clipboard functionality
✅ Setup guides visible and usable
✅ Proper error handling and notifications
✅ Analytics events tracked
✅ `/settings/api` route removed
✅ Code quality and maintainability improved
✅ No breaking changes to API key schema or backend endpoints
