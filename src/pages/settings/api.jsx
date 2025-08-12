import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContextOptimized'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'
import { Key, Copy, Trash2, Plus, ChevronLeft, Shield, Sparkles, Code2, Terminal, ChevronDown, ChevronUp, ExternalLink, CheckCircle } from 'lucide-react'
import MobileBottomSheet from '../../components/MobileBottomSheet'
import '../../styles/settings-claude.css'

// Reusable components from main settings
const SettingGroup = ({ title, children }) => (
  <div className="setting-group">
    {title && <h3 className="setting-group-title">{title}</h3>}
    {children}
  </div>
)

const Button = ({ variant = 'primary', size = 'medium', children, icon: Icon, ...props }) => (
  <button 
    className={`btn btn-${variant} btn-${size}`}
    {...props}
  >
    {Icon && <Icon size={18} />}
    {children}
  </button>
)

// Custom components for API page
const ApiKeyCard = ({ apiKey, onDelete, onCopy }) => {
  const [showConfirm, setShowConfirm] = useState(false)
  
  return (
    <div className="api-key-card">
      <div className="api-key-header">
        <div className="api-key-icon">
          <Key size={20} />
        </div>
        <div className="api-key-info">
          <h4 className="api-key-name">{apiKey.name}</h4>
          <code className="api-key-preview">{apiKey.key_preview}</code>
        </div>
      </div>
      
      <div className="api-key-meta">
        <span className="api-key-date">
          Created {new Date(apiKey.created_at).toLocaleDateString()}
        </span>
        {apiKey.last_used_at && (
          <span className="api-key-date">
            Last used {new Date(apiKey.last_used_at).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="api-key-actions">
        {showConfirm ? (
          <>
            <span className="confirm-text">Delete this key?</span>
            <Button 
              variant="secondary" 
              size="small"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              size="small"
              onClick={() => onDelete(apiKey.id)}
            >
              Delete
            </Button>
          </>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="delete-button"
            title="Delete API key"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

const CodeBlock = ({ code, onCopy }) => (
  <div className="code-block">
    <pre>{code}</pre>
    <button 
      className="code-copy-button"
      onClick={() => onCopy(code)}
      title="Copy to clipboard"
    >
      <Copy size={16} />
    </button>
  </div>
)

const SetupAccordion = ({ title, description, isRecommended, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className={`setup-accordion ${isOpen ? 'open' : ''}`}>
      <button 
        className="setup-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="setup-accordion-title">
          {isRecommended && (
            <span className="recommended-badge">
              <Sparkles size={14} />
              Recommended
            </span>
          )}
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {isOpen && (
        <div className="setup-accordion-content">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ApiKeysPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newApiKey, setNewApiKey] = useState(null)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    loadApiKeys()
  }, [user, navigate])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      toast.error('Failed to load API keys')
      console.error('Error loading API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    setCreating(true)
    try {
      // Generate a secure random API key in MCP format
      const keyBytes = new Uint8Array(32)
      crypto.getRandomValues(keyBytes)
      const apiKey = 'dvlg_sk_prod_' + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Hash the key for storage
      const encoder = new TextEncoder()
      const data = encoder.encode(apiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Store the key
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

      // Show the full key once
      setNewApiKey(apiKey)
      setApiKeys([newKey, ...apiKeys])
      setNewKeyName('')
      setShowCreateSheet(false)
      setCopiedKey(false)
    } catch (error) {
      toast.error('Failed to create API key')
      console.error('Error creating API key:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteApiKey = async (id) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      setApiKeys(apiKeys.filter(key => key.id !== id))
      toast.success('API key deleted')
    } catch (error) {
      toast.error('Failed to delete API key')
      console.error('Error deleting API key:', error)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const copyApiKey = (key) => {
    copyToClipboard(key)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (!user) return null

  return (
    <div className="settings-page">
      {/* Header */}
      <header className="api-header">
        <button 
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          <ChevronLeft size={20} />
          <span>Settings</span>
        </button>
        <h1>API Keys</h1>
        <div className="header-spacer" />
      </header>

      <div className="settings-content api-content">
        <div className="content-section">
          {/* Page Description */}
          <div className="page-header">
            <p className="section-description">
              Connect Claude Desktop, VS Code, and other AI tools to Devlog with secure API keys
            </p>
          </div>

          {/* New API Key Success */}
          {newApiKey && (
            <div className="api-key-success">
              <div className="success-header">
                <div className="success-icon">
                  <CheckCircle size={24} />
                </div>
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
                  onClick={() => copyApiKey(newApiKey)}
                  icon={copiedKey ? CheckCircle : Copy}
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

          {/* Create New Key */}
          <SettingGroup title="Create API Key">
            <div className="create-key-section">
              <p className="setting-description">
                Create a key to connect your AI tools to Journey Log
              </p>
              {isMobile ? (
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateSheet(true)}
                  icon={Plus}
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
                    icon={Plus}
                  >
                    Create Key
                  </Button>
                </div>
              )}
            </div>
          </SettingGroup>

          {/* Active Keys */}
          <SettingGroup title="Active Keys">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading API keys...</p>
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Shield size={48} />
                </div>
                <h3>No API keys yet</h3>
                <p>Create your first API key to connect AI assistants to your Devlog knowledge base</p>
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

          {/* Quick Setup Guide */}
          <SettingGroup title="Quick Setup Guide">
            <div className="setup-guide">
              <p className="setup-intro">
                Pick your AI tool to see simple setup steps:
              </p>

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

              <SetupAccordion
                title="Claude Desktop"
                description="Configure the desktop app with MCP"
              >
                <div className="setup-content">
                  <div className="setup-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>Add this to your Claude Desktop config file:</p>
                      <CodeBlock
                        code={`{
  "mcpServers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp"],
      "env": {
        "DEVLOG_API_KEY": "${newApiKey || 'your_api_key'}"
      }
    }
  }
}`}
                        onCopy={copyToClipboard}
                      />
                    </div>
                  </div>
                  <div className="setup-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>Restart Claude Desktop and you're ready!</p>
                      <p className="text-xs text-secondary mt-1">Config location: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)</p>
                    </div>
                  </div>
                </div>
              </SetupAccordion>

              <SetupAccordion
                title="VS Code & Cursor"
                description="Connect via MCP server"
              >
                <div className="setup-content">
                  <div className="setup-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <p>Add this to your VS Code or Cursor settings.json:</p>
                      <CodeBlock
                        code={`{
  "mcp.servers": {
    "devlog": {
      "command": "npx",
      "args": ["-y", "devlog-mcp"],
      "env": {
        "DEVLOG_API_KEY": "${newApiKey || 'your_api_key'}"
      }
    }
  }
}`}
                        onCopy={copyToClipboard}
                      />
                    </div>
                  </div>
                  <div className="setup-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <p>Restart your editor and the MCP extension will connect!</p>
                    </div>
                  </div>
                </div>
              </SetupAccordion>

              <a
                href="https://github.com/ALPHAbilal/devlog-mcp-client"
                target="_blank"
                rel="noopener noreferrer"
                className="docs-link"
              >
                <Code2 size={18} />
                View full MCP documentation
                <ExternalLink size={16} />
              </a>
            </div>
          </SettingGroup>
        </div>
      </div>

      {/* Mobile Create Key Sheet */}
      {isMobile && (
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
              <p className="field-hint">
                Name this key (e.g., Claude Code)
              </p>
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

      <style jsx>{`
        /* API Page Specific Styles */
        .api-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: 80px;
        }

        .api-header h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .header-spacer {
          width: 120px;
        }

        .api-content {
          padding-top: 80px;
          height: 100vh;
          overflow-y: auto;
        }

        .page-header {
          margin-bottom: var(--space-8);
        }

        .section-description {
          font-size: 1.125rem;
          color: var(--text-secondary);
          margin-top: var(--space-2);
        }

        /* API Key Success */
        .api-key-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: var(--space-6);
          margin-bottom: var(--space-6);
          position: relative;
        }

        .success-header {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .success-icon {
          color: var(--brand-primary);
          flex-shrink: 0;
        }

        .success-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 var(--space-1) 0;
          color: var(--text-primary);
        }

        .success-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .api-key-display {
          display: flex;
          gap: var(--space-3);
          align-items: center;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: var(--space-3);
        }

        .api-key-full {
          flex: 1;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          color: var(--brand-primary);
          word-break: break-all;
          background: none;
          padding: 0;
        }

        .close-success {
          position: absolute;
          top: var(--space-4);
          right: var(--space-4);
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all var(--transition);
        }

        .close-success:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        /* Create Key Section */
        .create-key-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .create-key-inline {
          display: flex;
          gap: var(--space-3);
        }

        .key-name-input {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 1rem;
          font-family: inherit;
          transition: all var(--transition);
        }

        .key-name-input:focus {
          outline: 2px solid var(--brand-primary);
          outline-offset: 2px;
        }

        .key-name-input::placeholder {
          color: var(--text-disabled);
        }

        /* API Key Card */
        .api-key-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: var(--space-4);
          margin-bottom: var(--space-3);
          transition: all var(--transition);
        }

        .api-key-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .api-key-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .api-key-icon {
          width: 40px;
          height: 40px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-primary);
        }

        .api-key-info {
          flex: 1;
        }

        .api-key-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 var(--space-1) 0;
          color: var(--text-primary);
        }

        .api-key-preview {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.875rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .api-key-meta {
          display: flex;
          gap: var(--space-4);
          margin-bottom: var(--space-3);
          padding-left: calc(40px + var(--space-3));
        }

        .api-key-date {
          font-size: 0.875rem;
          color: var(--text-disabled);
        }

        .api-key-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-2);
          min-height: 32px;
        }

        .confirm-text {
          font-size: 0.875rem;
          color: var(--color-error);
          margin-right: var(--space-2);
        }

        .delete-button {
          background: rgba(239, 68, 68, 0.1);
          border: none;
          color: var(--color-error);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition);
        }

        .delete-button:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.05);
        }

        /* Empty & Loading States */
        .empty-state, .loading-state {
          text-align: center;
          padding: var(--space-8) var(--space-4);
        }

        .empty-icon {
          margin: 0 auto var(--space-4);
          color: var(--text-disabled);
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 var(--space-2) 0;
          color: var(--text-primary);
        }

        .empty-state p {
          color: var(--text-secondary);
          margin: 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--brand-primary);
          border-radius: 50%;
          margin: 0 auto var(--space-4);
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p {
          color: var(--text-secondary);
        }

        /* Setup Guide */
        .setup-guide {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          padding: var(--space-6);
        }

        .setup-intro {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: var(--space-4);
        }

        /* Setup Accordion */
        .setup-accordion {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: var(--space-3);
          overflow: hidden;
          transition: all var(--transition);
        }

        .setup-accordion.open {
          border-color: rgba(16, 185, 129, 0.3);
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

        .setup-accordion-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .setup-accordion-title h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 var(--space-1) 0;
        }

        .setup-accordion-title p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .recommended-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          background: rgba(16, 185, 129, 0.1);
          color: var(--brand-primary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .setup-accordion-content {
          padding: 0 var(--space-4) var(--space-4);
          border-top: 1px solid var(--border-color);
        }

        .setup-content {
          padding-top: var(--space-4);
        }

        .setup-step {
          display: flex;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .step-number {
          width: 28px;
          height: 28px;
          background: var(--brand-primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 var(--space-2) 0;
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

        .code-copy-button {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: var(--space-2);
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition);
        }

        .code-copy-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        /* Docs Link */
        .docs-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--brand-primary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: var(--space-4);
          padding: var(--space-2) var(--space-3);
          border-radius: 8px;
          transition: all var(--transition);
        }

        .docs-link:hover {
          background: rgba(16, 185, 129, 0.1);
          text-decoration: none;
        }

        /* Mobile Specific */
        .mobile-create-content {
          padding: var(--space-6) var(--space-4);
        }

        .field-hint {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: var(--space-2);
        }

        @media (max-width: 768px) {
          .api-header {
            padding: var(--space-4);
            height: 60px;
          }

          .api-header h1 {
            font-size: 1.125rem;
          }

          .header-spacer {
            display: none;
          }

          .api-content {
            padding-top: 60px;
          }

          .content-section {
            padding: var(--space-4);
          }

          .section-title {
            font-size: 1.5rem;
          }

          .api-key-success {
            padding: var(--space-4);
          }

          .api-key-display {
            flex-direction: column;
            align-items: stretch;
          }

          .api-key-full {
            padding: var(--space-2);
            margin-bottom: var(--space-2);
          }

          .setup-guide {
            padding: var(--space-4);
          }

          .api-key-meta {
            flex-direction: column;
            gap: var(--space-1);
          }

          .api-keys-list {
            margin: 0 calc(-1 * var(--space-2));
          }

          .api-key-card {
            border-radius: 0;
            border-left: none;
            border-right: none;
            margin-bottom: 1px;
          }
        }
      `}</style>
    </div>
  )
}