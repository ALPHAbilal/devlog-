import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContextOptimized';
import { supabase } from '../lib/supabase';
import { exportSupabaseData, importSupabaseData } from '../utils/supabaseDataExport';
import { useSmartDatabaseUsage } from '../hooks/useSmartDatabaseUsage';
import { useSettings } from '../contexts/SettingsContext';
import storageWrapper from '../utils/storage/storageWrapper';

export default function SettingsMinimal() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { databaseSize, storageLimit, usagePercentage } = useSmartDatabaseUsage();
  const { settings, updateSetting } = useSettings();
  
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);

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
      
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswordForm({ new: '', confirm: '' });
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
      setMessage({ type: 'success', text: 'Data exported successfully' });
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
      const result = await importSupabaseData(file);
      setMessage({ type: 'success', text: `Imported ${result.imported} documents` });
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

  return (
    <div className="settings-minimal">
      <div className="settings-container">
        <header className="settings-header">
          <h1>Settings</h1>
          <a href="/dashboard" className="back-link">← Back to Dashboard</a>
        </header>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          {/* Account Section */}
          <section className="settings-section">
            <h2>Account</h2>
            
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
                readOnly
              />
            </div>

            <div className="form-group">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="form-field">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
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
                    required
                  />
                </div>
                <button type="submit" disabled={isLoading}>
                  Update Password
                </button>
              </form>
            </div>

            <div className="form-group danger">
              <h3>Delete Account</h3>
              <p>This action cannot be undone. All your data will be permanently deleted.</p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || isLoading}
                className="danger-button"
              >
                Delete Account
              </button>
            </div>
          </section>

          {/* Data Management Section */}
          <section className="settings-section">
            <h2>Data Management</h2>
            
            <div className="storage-info">
              <p>Storage: {databaseSize} / {storageLimit} ({Math.round(usagePercentage)}%)</p>
            </div>

            <div className="form-group">
              <h3>Export Data</h3>
              <p>Download all your documents as a JSON file.</p>
              <button onClick={handleExport} disabled={isLoading}>
                Export Data
              </button>
            </div>

            <div className="form-group">
              <h3>Import Data</h3>
              <p>Upload a JSON backup file to restore your documents.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <h3>Clear Cache</h3>
              <p>Remove temporary files from your browser.</p>
              <button 
                onClick={() => {
                  storageWrapper.clearLocalCache();
                  setMessage({ type: 'success', text: 'Cache cleared' });
                }} 
                disabled={isLoading}
              >
                Clear Cache
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}