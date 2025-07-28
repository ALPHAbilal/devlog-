import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { 
  X, User, Database, Download, Upload, Trash2, 
  AlertCircle, HardDrive, Check, Lock, Shield, AlertTriangle,
  FileText, ChevronRight, FileJson, ChevronLeft, Menu, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportSupabaseData, importSupabaseData } from '../utils/supabaseDataExport';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import MobileBottomSheet from '../components/MobileBottomSheet';
import MobileTabNavigation from '../components/MobileTabNavigation';
import CircularProgress from '../components/CircularProgress';
import TouchFeedback from '../components/TouchFeedback';
import MobileFormInput from '../components/MobileFormInput';
import { useToast } from '../hooks/useToast';
import '../styles/settings.css';
import '../styles/settings-mobile-enhanced.css';

// Enhanced Mobile Toggle Switch Component
const ToggleSwitch = ({ id, label, description, checked, onChange }) => (
  <TouchFeedback 
    className="toggle-row-wrapper"
    onClick={() => {
      onChange(!checked);
    }}
    hapticFeedback={true}
  >
    <div className="toggle-row">
      <div className="toggle-content">
        <label htmlFor={id} className="toggle-label">{label}</label>
        {description && <p className="toggle-description">{description}</p>}
      </div>
      <label htmlFor={id} className="toggle-switch">
        <input
          type="checkbox"
          id={id}
          className="toggle-input"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  </TouchFeedback>
);

// Form Input Component
const FormInput = ({ id, label, type = "text", value, onChange, disabled, placeholder, help }) => (
  <div className="form-field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      type={type}
      className="form-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
    {help && <span className="field-help">{help}</span>}
  </div>
);

// Storage Usage Skeleton Component
const StorageUsageSkeleton = () => (
  <div className="storage-usage skeleton">
    <div className="storage-header">
      <div className="skeleton-text" style={{ width: '120px', height: '20px' }} />
      <div className="skeleton-text" style={{ width: '150px', height: '16px' }} />
    </div>
    
    <div className="progress-bar">
      <div className="skeleton-progress" />
    </div>
    
    <div className="storage-breakdown">
      {[1, 2, 3].map(i => (
        <div key={i} className="breakdown-item">
          <div className="item-info">
            <div className="skeleton-color" />
            <div className="skeleton-text" style={{ width: '120px', height: '14px' }} />
          </div>
          <div className="skeleton-text" style={{ width: '60px', height: '14px' }} />
        </div>
      ))}
    </div>
  </div>
);

// Storage Usage Component
const StorageUsage = ({ used, total, breakdown }) => {
  const percentage = Math.min((used / total) * 100, 100);
  
  const getProgressColor = () => {
    if (percentage >= 90) return '#dc2626';
    if (percentage >= 80) return '#f59e0b';
    return '#10b981';
  };
  
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  return (
    <div className="storage-usage">
      <div className="storage-header">
        <h3>Storage Usage</h3>
        <span className="usage-text">
          {formatBytes(used)} of {formatBytes(total)} used
        </span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            background: getProgressColor()
          }}
        />
      </div>
      
      {breakdown && (
        <div className="storage-breakdown">
          {breakdown.map(item => (
            <div key={item.type} className="breakdown-item">
              <div className="item-info">
                <div className="item-color" style={{ background: item.color }} />
                <span className="item-label">{item.label}</span>
              </div>
              <span className="item-size">{formatBytes(item.size)}</span>
            </div>
          ))}
        </div>
      )}
      
      {percentage >= 80 && (
        <div className={`storage-warning ${percentage >= 90 ? 'critical' : 'warning'}`}>
          <AlertCircle size={16} />
          <span>
            {percentage >= 90 
              ? 'Database nearly full. Consider upgrading or removing old data.'
              : 'Database usage is high. Monitor your usage to avoid hitting limits.'}
          </span>
        </div>
      )}
    </div>
  );
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { databaseSize, storageLimit, usagePercentage, isLoading: usageLoading, error: usageError, dataBreakdown, refresh: refreshUsage } = useSmartDatabaseUsage();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('account');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  
  // Mobile specific state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  
  const fileInputRef = useRef(null);

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data Management', icon: Database }
  ];

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ new: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await supabase.from('documents').delete().eq('user_id', user.id);
      await signOut();
      setMessage({ type: 'success', text: 'Account deleted successfully' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle data export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const success = await exportSupabaseData();
      if (success) {
        setMessage({ type: 'success', text: 'Data exported successfully' });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle data import
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setImportProgress(0);
    try {
      const result = await importSupabaseData(file, (progress) => {
        setImportProgress(progress);
      });
      
      setMessage({ type: 'success', text: `Imported ${result.imported} documents successfully` });
      setImportProgress(null);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setImportProgress(null);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // Calculate storage usage
  const calculateStorageUsage = () => {
    // Parse database size to bytes
    let usedBytes = 0;
    const sizeMatch = databaseSize.match(/^([\d.]+)\s*(\w+)?$/);
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1]) || 0;
      const unit = sizeMatch[2] || 'bytes';
      
      switch (unit.toLowerCase()) {
        case 'bytes':
        case 'b':
          usedBytes = value;
          break;
        case 'kb':
          usedBytes = value * 1024;
          break;
        case 'mb':
          usedBytes = value * 1024 * 1024;
          break;
        case 'gb':
          usedBytes = value * 1024 * 1024 * 1024;
          break;
        default:
          usedBytes = value;
      }
    }
    
    // Parse storage limit to bytes
    let totalBytes = 500 * 1024 * 1024; // Default 500MB
    const limitMatch = storageLimit.match(/^([\d.]+)\s*(\w+)?$/);
    if (limitMatch) {
      const value = parseFloat(limitMatch[1]) || 500;
      const unit = limitMatch[2] || 'MB';
      
      if (unit.toUpperCase() === 'GB') {
        totalBytes = value * 1024 * 1024 * 1024;
      } else {
        totalBytes = value * 1024 * 1024; // MB
      }
    }
    
    return {
      used: usedBytes,
      total: totalBytes
    };
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`settings-page ${isMobile ? 'mobile' : ''}`}>
      <div className={`settings-container ${isMobile ? 'mobile' : ''}`}>
        {/* Enhanced Mobile Header */}
        <div className={`settings-header ${isMobile ? 'mobile-header' : ''}`}>
          {isMobile ? (
            <TouchFeedback
              onClick={() => navigate('/dashboard')}
              className="mobile-back-btn-wrapper"
            >
              <button
                className="mobile-back-btn enhanced"
                title="Back to dashboard"
              >
                <ArrowLeft size={24} />
              </button>
            </TouchFeedback>
          ) : null}
          <h1 className="settings-title">Settings</h1>
          {!isMobile && (
            <button
              onClick={() => navigate('/dashboard')}
              className="close-btn"
              title="Close settings"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Enhanced Mobile Tabs */}
        {isMobile ? (
          <MobileTabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <div className="settings-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`settings-message ${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="settings-content">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Account Settings</h2>
                <p>Manage your account information and preferences</p>
              </div>

              {/* Profile Information */}
              <div className="settings-group">
                <h3>Profile Information</h3>
                
                <div className="form-row">
                  {isMobile ? (
                    <MobileFormInput
                      id="email"
                      label="Email Address"
                      type="email"
                      value={user?.email || ''}
                      onChange={() => {}}
                      disabled={true}
                      placeholder="your@email.com"
                      inputMode="email"
                    />
                  ) : (
                    <FormInput
                      id="email"
                      label="Email Address"
                      type="email"
                      value={user?.email || ''}
                      onChange={() => {}}
                      disabled={true}
                      help="Your email address is used for login and notifications"
                    />
                  )}
                </div>
              </div>

              {/* Security */}
              <div className="settings-group">
                <h3>Security</h3>
                
                {!showPasswordForm ? (
                  isMobile ? (
                    <TouchFeedback
                      onClick={() => setShowPasswordSheet(true)}
                      className="action-button-wrapper"
                    >
                      <button className="action-button mobile-enhanced">
                        <div className="action-icon-wrapper">
                          <Lock size={24} />
                        </div>
                        <div className="action-content">
                          <span className="action-title">Change Password</span>
                          <span className="action-subtitle">
                            Update your password to keep your account secure
                          </span>
                        </div>
                        <ChevronRight size={20} className="action-chevron" />
                      </button>
                    </TouchFeedback>
                  ) : (
                    <button 
                      className="action-button"
                      onClick={() => setShowPasswordForm(true)}
                    >
                      <Lock size={20} />
                      <div className="action-content">
                        <span className="action-title">Change Password</span>
                        <span className="action-subtitle">
                          Update your password to keep your account secure
                        </span>
                      </div>
                      <ChevronRight size={16} />
                    </button>
                  )
                ) : (
                  <form onSubmit={handlePasswordChange} className="password-form">
                    <FormInput
                      id="new-password"
                      label="New Password"
                      type="password"
                      value={passwordForm.new}
                      onChange={(value) => setPasswordForm({ ...passwordForm, new: value })}
                      placeholder="Enter new password"
                    />
                    <FormInput
                      id="confirm-password"
                      label="Confirm Password"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(value) => setPasswordForm({ ...passwordForm, confirm: value })}
                      placeholder="Confirm new password"
                    />
                    <div className="form-actions">
                      <button type="submit" className="btn-primary" disabled={isChangingPassword}>
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({ new: '', confirm: '' });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Danger Zone */}
              <div className="settings-group danger-zone">
                <div className="danger-header">
                  <AlertTriangle size={20} />
                  <h3>Danger Zone</h3>
                </div>
                <p className="danger-description">These actions cannot be undone</p>
                
                <div className="danger-content">
                  <div className="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  
                  {isMobile ? (
                    <button
                      onClick={() => setShowDeleteSheet(true)}
                      className="btn-danger mobile-danger-btn"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="danger-actions">
                      <input
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="danger-input"
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== 'DELETE' || isDeleting}
                      className="danger-button"
                    >
                      <Trash2 size={16} />
                      {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Data Management</h2>
                <p>Export, import, and manage your application data</p>
              </div>

              {/* Enhanced Mobile Storage Usage */}
              {usageLoading ? (
                <StorageUsageSkeleton />
              ) : !usageError ? (
                isMobile ? (
                  <div className="mobile-storage-section">
                    <h3>Storage Usage</h3>
                    <div className="mobile-storage-content">
                      <CircularProgress
                        value={calculateStorageUsage().used}
                        max={calculateStorageUsage().total}
                        size={140}
                        strokeWidth={10}
                        animated={true}
                      />
                      
                      {dataBreakdown && (
                        <div className="storage-breakdown-cards">
                          {[
                            { 
                              type: 'documents', 
                              label: 'Documents', 
                              count: dataBreakdown.documents.count,
                              size: dataBreakdown.documents.size || 0, 
                              color: '#10b981',
                              icon: FileText
                            },
                            { 
                              type: 'blocks', 
                              label: 'Content', 
                              count: dataBreakdown.blocks.count,
                              size: dataBreakdown.blocks.size || 0, 
                              color: '#3b82f6',
                              icon: Database
                            },
                            { 
                              type: 'images', 
                              label: 'Images', 
                              count: dataBreakdown.images.count,
                              size: dataBreakdown.images.size || 0, 
                              color: '#f59e0b',
                              icon: FileText
                            }
                          ].map(item => (
                            <TouchFeedback key={item.type} className="storage-card-wrapper">
                              <div className="storage-card">
                                <div className="storage-card-icon" style={{ backgroundColor: `${item.color}20` }}>
                                  <item.icon size={20} color={item.color} />
                                </div>
                                <div className="storage-card-content">
                                  <span className="storage-card-label">{item.label}</span>
                                  <span className="storage-card-count">{item.count} items</span>
                                </div>
                              </div>
                            </TouchFeedback>
                          ))}
                        </div>
                      )}
                      
                      {usagePercentage >= 80 && (
                        <div className={`mobile-storage-warning ${usagePercentage >= 90 ? 'critical' : 'warning'}`}>
                          <AlertCircle size={20} />
                          <p>
                            {usagePercentage >= 90 
                              ? 'Storage nearly full. Consider upgrading.'
                              : 'Storage usage is high.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <StorageUsage 
                    {...calculateStorageUsage()}
                    breakdown={dataBreakdown ? [
                      { 
                        type: 'documents', 
                        label: `Documents (${dataBreakdown.documents.count})`, 
                        size: dataBreakdown.documents.size || 0, 
                        color: '#10b981' 
                      },
                      { 
                        type: 'blocks', 
                        label: `Content Blocks (${dataBreakdown.blocks.count})`, 
                        size: dataBreakdown.blocks.size || 0, 
                        color: '#3b82f6' 
                      },
                      { 
                        type: 'images', 
                        label: `Images (${dataBreakdown.images.count})`, 
                        size: dataBreakdown.images.size || 0, 
                        color: '#f59e0b' 
                      }
                    ] : [
                      { type: 'documents', label: 'Documents & Notes', size: calculateStorageUsage().used, color: '#10b981' }
                    ]}
                  />
                )
              ) : null}

              {/* Export Data */}
              <div className="settings-group">
                <h3>Export Data</h3>
                
                <div className="export-options">
                  <div className="export-option">
                    <div className="option-icon">
                      <FileJson size={32} />
                    </div>
                    <div className="option-content">
                      <h4>Export All Data</h4>
                      <p>Download a complete backup of all your documents and settings</p>
                      <button 
                        className="btn-primary"
                        onClick={handleExport}
                        disabled={isExporting}
                      >
                        <Download size={16} />
                        {isExporting ? 'Exporting...' : 'Export to JSON'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Data */}
              <div className="settings-group">
                <h3>Import Data</h3>
                
                <div className="import-zone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Upload size={40} />
                  <h4>Drop files to import</h4>
                  <p>Supports JSON backup files from Journey Log Compass</p>
                  <button 
                    className="btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? `Importing... ${importProgress || 0}%` : 'Choose File'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
      
      {/* Mobile Bottom Sheets */}
      {isMobile && (
        <>
          {/* Delete Account Bottom Sheet */}
          <MobileBottomSheet
            isOpen={showDeleteSheet}
            onClose={() => {
              setShowDeleteSheet(false);
              setDeleteConfirm('');
            }}
            title="Delete Account"
          >
            <div className="mobile-delete-content">
              <div className="delete-warning">
                <div className="warning-icon-wrapper">
                  <AlertTriangle size={56} className="warning-icon" />
                </div>
                <h3>This action cannot be undone</h3>
                <p>All your documents, settings, and data will be permanently deleted.</p>
              </div>
              
              <div className="delete-confirm-section">
                <MobileFormInput
                  id="delete-confirm-mobile"
                  label="Type DELETE to confirm"
                  type="text"
                  value={deleteConfirm}
                  onChange={setDeleteConfirm}
                  placeholder="DELETE"
                  autoComplete="off"
                  error={deleteConfirm && deleteConfirm !== 'DELETE' ? 'Please type DELETE exactly' : ''}
                  success={deleteConfirm === 'DELETE'}
                />
              </div>
              
              <div className="mobile-actions">
                <button
                  onClick={() => {
                    setShowDeleteSheet(false);
                    setDeleteConfirm('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteAccount();
                    setShowDeleteSheet(false);
                  }}
                  disabled={deleteConfirm !== 'DELETE' || isDeleting}
                  className="btn-danger"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </MobileBottomSheet>
          
          {/* Enhanced Password Change Bottom Sheet */}
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
                <MobileFormInput
                  id="new-password-mobile"
                  label="New Password"
                  type="password"
                  value={passwordForm.new}
                  onChange={(value) => setPasswordForm({ ...passwordForm, new: value })}
                  placeholder="At least 6 characters"
                  minLength={6}
                  required
                  showPasswordToggle={true}
                  validationFn={(value) => {
                    if (value.length < 6) return 'Password must be at least 6 characters';
                    return true;
                  }}
                />
                
                <MobileFormInput
                  id="confirm-password-mobile"
                  label="Confirm Password"
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(value) => setPasswordForm({ ...passwordForm, confirm: value })}
                  placeholder="Re-enter your password"
                  required
                  showPasswordToggle={true}
                  error={passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm ? 'Passwords do not match' : ''}
                  success={passwordForm.new && passwordForm.confirm && passwordForm.new === passwordForm.confirm}
                />
                
                <div className="mobile-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSheet(false);
                      setPasswordForm({ new: '', confirm: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword || !passwordForm.new || passwordForm.new !== passwordForm.confirm}
                    className="btn-primary"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </MobileBottomSheet>
        </>
      )}
    </div>
  );
}