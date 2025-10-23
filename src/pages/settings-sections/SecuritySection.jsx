import React, { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import MobileBottomSheet from '../../components/MobileBottomSheet';

export default function SecuritySection() {
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);

  // Resize handler for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      // Use Supabase auth API (same as current implementation)
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new
      });

      if (error) throw error;

      // Clear form on success
      setPasswordForm({ new: '', confirm: '' });
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setShowPasswordSheet(false);

      // Auto-dismiss success message
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Security</h1>
        <p className="section-description">Manage your password and security settings</p>
      </div>

      <hr className="section-divider" />

      {/* Error/Success Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Change Password Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '18px', lineHeight: '28px', margin: 0 }}>Change Password</h3>

        {isMobile ? (
          <button
            className="btn-primary"
            style={{ width: 'fit-content' }}
            onClick={() => setShowPasswordSheet(true)}
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* New Password */}
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter new password"
                value={passwordForm.new}
                onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Confirm new password"
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: 'fit-content' }}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      <hr className="section-divider" />

      {/* Security Features */}
      <div className="info-card" style={{ padding: '25px', gap: '16px' }}>
        {/* End-to-end encryption */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={20} color="var(--accent-green)" />
          <span style={{ fontSize: '14px' }}>End-to-end encryption enabled</span>
        </div>

        {/* Two-factor authentication */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-green)" />
          <span style={{ fontSize: '14px' }}>Two-factor authentication available</span>
        </div>
      </div>

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
          <div style={{ padding: '16px' }}>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* New Password */}
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter new password"
                  value={passwordForm.new}
                  onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                  required
                />
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Confirm new password"
                  value={passwordForm.confirm}
                  onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowPasswordSheet(false);
                    setPasswordForm({ new: '', confirm: '' });
                  }}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading} style={{ flex: 1 }}>
                  {isLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </MobileBottomSheet>
      )}
    </div>
  );
}
