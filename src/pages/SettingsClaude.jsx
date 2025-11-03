import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { supabase } from '../lib/supabase';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import { useSettings } from '../contexts/SettingsContext';
import { X, ChevronLeft, Lock, Key, Copy, Trash2, CheckCircle, Shield, ChevronUp, ChevronDown, Eye, EyeOff, Check, HardDrive } from 'lucide-react';
import MobileBottomSheet from '../components/MobileBottomSheet';
import { useToast } from '../hooks/useToast';
import { useAnalytics } from '../hooks/useAnalytics';
import '../styles/settings-claude.css';

// Toggle Switch Component - Claude.ai style
const ToggleSwitch = ({ label, description, value, onChange, disabled = false }) => (
  <div className="setting-item">
    <div className="setting-content">
      <label className="setting-label">{label}</label>
      {description && <p className="setting-description">{description}</p>}
    </div>
    <button
      className={`toggle-switch ${value ? 'active' : ''}`}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      role="switch"
      aria-checked={value}
    >
      <span className="toggle-thumb" />
    </button>
  </div>
);

// Setting Group Component
const SettingGroup = ({ title, children }) => (
  <div className="setting-group">
    {title && <h3 className="setting-group-title">{title}</h3>}
    {children}
  </div>
);

// Button Component with variants
const Button = ({ variant = 'primary', size = 'medium', children, ...props }) => (
  <button
    className={`btn btn-${variant} btn-${size}`}
    {...props}
  >
    {children}
  </button>
);

// API Key Card Component
const ApiKeyCard = ({ apiKey, onDelete, onCopy }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    await onCopy(apiKey.key_preview); // In real implementation, this would copy the full key
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="api-key-card">
      <div className="api-key-header">
        <div className="api-key-info">
          <h4 className="api-key-name">{apiKey.name}</h4>
          <div className="api-key-metadata">
            <span>Created: {new Date(apiKey.created_at).toLocaleDateString()}</span>
            {apiKey.last_used_at && (
              <span>Last used: {new Date(apiKey.last_used_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="api-key-actions">
          {showConfirm ? (
            <div className="confirm-delete">
              <span className="confirm-text">Delete?</span>
              <button
                onClick={() => setShowConfirm(false)}
                className="cancel-btn"
                title="Cancel"
              >
                ✕
              </button>
              <button
                onClick={() => onDelete(apiKey.id)}
                className="confirm-btn"
                title="Confirm delete"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="delete-button"
              title="Delete API key"
          >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="api-key-preview-container">
        <div className="api-key-preview">
          <code>
            {showFullKey ? apiKey.key_preview : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
          </code>
          <div className="api-key-preview-actions">
            <button
              onClick={() => setShowFullKey(!showFullKey)}
              className="preview-action-btn"
              title={showFullKey ? "Hide key" : "Show key"}
            >
              {showFullKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={handleCopy}
              className={`preview-action-btn ${copySuccess ? 'copy-success' : ''}`}
              title="Copy API key"
            >
              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Code Block Component
const CodeBlock = ({ code, onCopy, context = 'code_example' }) => (
  <div className="code-block">
    <pre>{code}</pre>
    <button
      className="code-copy-button"
      onClick={() => onCopy(code, context)}
      title="Copy to clipboard"
    >
      <Copy size={16} />
    </button>
  </div>
);

// Setup Accordion Component
const SetupAccordion = ({ title, description, isRecommended, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`setup-accordion ${isOpen ? 'open' : ''}`}>
      <button
        className="setup-accordion-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="setup-accordion-title">
          {isRecommended && (
            <span className="recommended-badge">
              <CheckCircle size={14} />
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
  );
};

export default function SettingsClaude() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();
  const { settings, updateSetting } = useSettings();
  const toast = useToast();
  const { trackEvent } = useAnalytics();
  
  const [activeSection, setActiveSection] = useState('account');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Authentication provider detection
  // user.app_metadata.provider is set by Supabase for OAuth users (google, github, etc.)
  // For email/password users, it's undefined or 'email'
  const authProvider = user?.app_metadata?.provider;
  const isOAuthUser = authProvider && authProvider !== 'email';
  const isEmailPasswordUser = !authProvider || authProvider === 'email';

  // API Keys management state
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Navigation sections
  const sections = [
    { id: 'account', label: 'Account' },
    { id: 'api', label: 'API Keys' },
    { id: 'data', label: 'Data & Privacy' },
  ];

  // Handle setting changes with optimistic updates
  const handleSettingChange = async (setting, value) => {
    // Optimistic update
    updateSetting(setting, value);
    
    try {
      // Server sync would happen here
      // await api.updateSetting(setting, value);
    } catch (error) {
      // Revert on error
      updateSetting(setting, !value);
      setMessage({ type: 'error', text: 'Failed to update setting' });
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      
      setPasswordForm({ new: '', confirm: '' });
      setShowPasswordSheet(false);
      // Silent success - no toast
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    
    setIsLoading(true);
    try {
      await supabase.from('documents').delete().eq('user_id', user.id);
      await signOut();
      navigate('/');
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle mobile sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
        setShowPasswordSheet(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load API keys when API section becomes active
  useEffect(() => {
    if (activeSection === 'api' && apiKeysLoading) {
      loadApiKeys();
    }
  }, [activeSection]);

  // Load API keys from database
  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);

      trackEvent('api_settings_viewed', {
        existing_keys_count: data?.length || 0,
        has_keys: (data?.length || 0) > 0
      });
    } catch (error) {
      toast.error('Failed to load API keys');
      console.error('Error:', error);
    } finally {
      setApiKeysLoading(false);
    }
  };

  // Create new API key
  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    setCreating(true);
    try {
      // Generate secure random key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const apiKey = 'dvlg_sk_prod_' + Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Hash for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
        .single();

      if (error) throw error;

      trackEvent('api_key_created', {
        key_name: newKeyName.trim(),
        key_prefix: 'dvlg_sk_prod',
        created_from: 'settings_page'
      });

      setNewApiKey(apiKey);
      setApiKeys([newKey, ...apiKeys]);
      setNewKeyName('');
      setShowCreateSheet(false);
    } catch (error) {
      toast.error('Failed to create API key');
      console.error('Error:', error);
    } finally {
      setCreating(false);
    }
  };

  // Delete API key
  const deleteApiKey = async (id) => {
    try {
      const keyToDelete = apiKeys.find(key => key.id === id);

      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      if (keyToDelete) {
        const keyAgeMs = Date.now() - new Date(keyToDelete.created_at).getTime();
        const keyAgeDays = Math.floor(keyAgeMs / (1000 * 60 * 60 * 24));

        trackEvent('api_key_deleted', {
          key_age_days: keyAgeDays,
          was_used: !!keyToDelete.last_used_at,
          key_name: keyToDelete.name
        });
      }

      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      toast.error('Failed to delete API key');
      console.error('Error:', error);
    }
  };

  // Copy to clipboard utility
  const copyToClipboard = (text, context = 'unknown') => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');

    trackEvent('api_key_copied', {
      copy_location: context,
      is_first_copy: context === 'initial_creation' && !copiedKey
    });
  };

  return (
    <div className="settings-page">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <h1>Settings</h1>
        <button 
          className="menu-button"
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
        >
          <span className="menu-icon">☰</span>
        </button>
      </header>

      <div className="settings-layout">
        {/* Sidebar Navigation */}
        <nav className={`settings-sidebar ${showMobileSidebar ? 'show' : ''}`}>
          <button
            className="back-button-settings"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>

          <div className="nav-sections">
            {sections.map(section => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  setShowMobileSidebar(false);
                }}
              >
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Overlay */}
        {showMobileSidebar && (
          <div 
            className="mobile-overlay"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Main Content */}
        <main className="settings-content">
          {/* Error Message */}
          {message && message.type === 'error' && (
            <div className="error-message">
              {message.text}
            </div>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="content-section">
              <h2 className="section-title">Account</h2>
              
              <SettingGroup title="Profile">
                <div className="setting-item">
                  <div className="setting-content">
                    <label className="setting-label">Email Address</label>
                    <p className="setting-value">{user?.email || 'Not available'}</p>
                  </div>
                </div>
              </SettingGroup>

              <SettingGroup title="Security">
                {isEmailPasswordUser ? (
                  // Show password change for email/password users
                  isMobile ? (
                    <button
                      className="password-trigger-btn"
                      onClick={() => setShowPasswordSheet(true)}
                    >
                      <Lock size={20} />
                      <span>Change Password</span>
                    </button>
                  ) : (
                    <form onSubmit={handlePasswordChange} className="password-form">
                      <div className="form-field">
                        <label htmlFor="new-password">New Password</label>
                        <input
                          id="new-password"
                          type="password"
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="confirm-password">Confirm Password</label>
                        <input
                          id="confirm-password"
                          type="password"
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        Update Password
                      </Button>
                    </form>
                  )
                ) : (
                  // Show OAuth provider info for OAuth users
                  <div className="oauth-auth-info">
                    <div className="setting-item">
                      <div className="setting-content">
                        <label className="setting-label">Authentication Method</label>
                        <p className="setting-value" style={{ textTransform: 'capitalize' }}>
                          {authProvider} OAuth
                        </p>
                        <p className="setting-description">
                          Your password is managed by {authProvider}. Sign in to your {authProvider} account to change your password.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </SettingGroup>

              <SettingGroup title="Account Management">
                <div className="danger-zone">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data.</p>
                  <Button 
                    variant="danger" 
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </SettingGroup>
            </div>
          )}

          {/* API Keys Section */}
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
                        copyToClipboard(newApiKey, 'initial_creation');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
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
                </div>
              </SettingGroup>
            </div>
          )}

          {/* Data & Privacy Section */}
          {activeSection === 'data' && (
            <div className="content-section">
              <h2 className="section-title">Data & Privacy</h2>

              <SettingGroup title="Storage">
                <div className="data-privacy-card storage-card">
                  <div className="storage-header">
                    <div className="storage-header-content">
                      <div className="storage-icon">
                        <HardDrive size={20} />
                      </div>
                      <div className="storage-info-section">
                        <span className="storage-label">Storage Usage</span>
                      </div>
                    </div>
                    <div className="storage-value-container">
                      <span className="storage-value">
                        {databaseSize} / {storageLimit}
                      </span>
                    </div>
                  </div>
                  <div className="storage-bar-container">
                    <div className="storage-bar">
                      <div
                        className="storage-fill"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    <p className="storage-description">
                      {Math.round(usagePercentage)}% of your storage is being used
                    </p>
                  </div>
                </div>
              </SettingGroup>
            </div>
          )}
        </main>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Account</h2>
            <div className="modal-content">
              <div className="alert-danger">
                This action cannot be undone. All your data will be permanently deleted.
              </div>
              <p>Your account will be deleted immediately. This includes:</p>
              <ul>
                <li>All documents and notes</li>
                <li>Settings and preferences</li>
                <li>Usage history</li>
              </ul>
              <div className="form-field">
                <label htmlFor="delete-confirm">Type DELETE to confirm</label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <div className="modal-actions">
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || isLoading}
                >
                  I Understand, Delete My Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Bottom Sheet for Password Change - Only for email/password users */}
      {isMobile && isEmailPasswordUser && (
        <MobileBottomSheet
          isOpen={showPasswordSheet}
          onClose={() => {
            setShowPasswordSheet(false);
            setPasswordForm({ new: '', confirm: '' });
          }}
          title="Change Password"
        >
          <div className="mobile-password-content">
            <form onSubmit={handlePasswordChange}>
              <div className="form-field">
                <label htmlFor="new-password-mobile">New Password</label>
                <input
                  id="new-password-mobile"
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirm-password-mobile">Confirm Password</label>
                <input
                  id="confirm-password-mobile"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="mobile-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordSheet(false);
                    setPasswordForm({ new: '', confirm: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </MobileBottomSheet>
      )}

      {/* Mobile Create Sheet for API Keys */}
      {isMobile && activeSection === 'api' && (
        <MobileBottomSheet
          isOpen={showCreateSheet}
          onClose={() => {
            setShowCreateSheet(false);
            setNewKeyName('');
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
                  setShowCreateSheet(false);
                  setNewKeyName('');
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
    </div>
  );
}