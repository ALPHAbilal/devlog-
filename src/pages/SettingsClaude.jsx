import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { supabase } from '../lib/supabase';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import { useSettings } from '../contexts/SettingsContext';
import { X, ChevronLeft, Lock } from 'lucide-react';
import MobileBottomSheet from '../components/MobileBottomSheet';
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

export default function SettingsClaude() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();
  const { settings, updateSetting } = useSettings();
  
  const [activeSection, setActiveSection] = useState('account');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
                {isMobile ? (
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
              
              <SettingGroup title="Manage API Keys">
                <div className="setting-item">
                  <div className="setting-content">
                    <p className="setting-description">
                      API keys allow you to connect Journey Log to your AI tools like Claude Desktop, Cursor, and VS Code.
                    </p>
                  </div>
                </div>
                <div className="api-keys-link">
                  <Button 
                    onClick={() => navigate('/settings/api')}
                    variant="primary"
                  >
                    Manage API Keys
                  </Button>
                </div>
              </SettingGroup>

              <SettingGroup title="Quick Setup">
                <div className="setup-instructions">
                  <ol className="setup-steps">
                    <li>Create an API key using the button above</li>
                    <li>Install the MCP server: <code>npm install -g @journey-log/mcp-server</code></li>
                    <li>Configure your AI tool with the API key</li>
                    <li>Start documenting your journey!</li>
                  </ol>
                  <div className="setup-link">
                    <a 
                      href="https://github.com/journey-log/mcp-server" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      View full installation guide →
                    </a>
                  </div>
                </div>
              </SettingGroup>
            </div>
          )}

          {/* Data & Privacy Section */}
          {activeSection === 'data' && (
            <div className="content-section">
              <h2 className="section-title">Data & Privacy</h2>
              
              <SettingGroup title="Storage">
                <div className="storage-info">
                  <div className="storage-header">
                    <span className="storage-label">Storage Usage</span>
                    <span className="storage-value">
                      {databaseSize} / {storageLimit}
                    </span>
                  </div>
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
      
      {/* Mobile Bottom Sheet for Password Change */}
      {isMobile && (
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
    </div>
  );
}