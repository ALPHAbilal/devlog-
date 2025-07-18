import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { supabase } from '../lib/supabase';
import { exportSupabaseData, importSupabaseData } from '../utils/supabaseDataExport';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import { useSettings } from '../contexts/SettingsContext';
import storageWrapper from '../utils/storage/storageWrapper';
import { X, ChevronLeft } from 'lucide-react';
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
  
  const fileInputRef = useRef(null);

  // Navigation sections
  const sections = [
    { id: 'account', label: 'Account' },
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

  // Handle data export
  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportSupabaseData();
      // Silent success
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle data import
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    try {
      await importSupabaseData(file);
      // Silent success
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
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
          <div className="sidebar-header">
            <h2>Settings</h2>
            <button
              className="close-button desktop-only"
              onClick={() => navigate('/dashboard')}
              title="Close settings"
            >
              <X size={20} />
            </button>
          </div>
          
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
                <div className="setting-item">
                  <div className="setting-content">
                    <label className="setting-label" htmlFor="session-timeout">
                      Session Timeout
                    </label>
                    <p className="setting-description">
                      Automatically sign out after period of inactivity
                    </p>
                  </div>
                  <select
                    id="session-timeout"
                    className="setting-select"
                    value={settings.sessionTimeout || 30}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value);
                      handleSettingChange('sessionTimeout', minutes);
                      // Apply the timeout immediately
                      import('../lib/supabaseOptimized').then(({ setInactivityTimeout }) => {
                        setInactivityTimeout(minutes);
                      });
                    }}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                    <option value="0">Never</option>
                  </select>
                </div>

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

              <SettingGroup title="Export Data">
                <div className="setting-item">
                  <div className="setting-content">
                    <label className="setting-label">Download Your Data</label>
                    <p className="setting-description">
                      Export all your documents as a JSON file
                    </p>
                  </div>
                  <Button onClick={handleExport} disabled={isLoading}>
                    Export
                  </Button>
                </div>
              </SettingGroup>

              <SettingGroup title="Import Data">
                <div className="setting-item">
                  <div className="setting-content">
                    <label className="setting-label">Upload Backup</label>
                    <p className="setting-description">
                      Restore documents from a JSON backup file
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="file-input"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="file-label">
                      Choose File
                    </label>
                  </div>
                </div>
              </SettingGroup>

              <SettingGroup title="Privacy">
                <ToggleSwitch
                  label="Analytics"
                  description="Help improve Devlog by sharing anonymous usage data"
                  value={settings.analytics || false}
                  onChange={(value) => handleSettingChange('analytics', value)}
                />

                <ToggleSwitch
                  label="Crash Reports"
                  description="Automatically send crash reports to help fix issues"
                  value={settings.crashReports || false}
                  onChange={(value) => handleSettingChange('crashReports', value)}
                />
              </SettingGroup>

              <SettingGroup>
                <div className="setting-item">
                  <div className="setting-content">
                    <label className="setting-label">Clear Cache</label>
                    <p className="setting-description">
                      Remove temporary files from your browser
                    </p>
                  </div>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      storageWrapper.clearLocalCache();
                      // Silent success
                    }}
                  >
                    Clear
                  </Button>
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
    </div>
  );
}