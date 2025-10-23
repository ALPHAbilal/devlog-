import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContextOptimized';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AccountSection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Get member since date from user metadata
  const getMemberSince = () => {
    if (!user?.created_at) return 'N/A';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;

    setIsDeleting(true);
    try {
      // Delete user documents first (same as current implementation)
      await supabase.from('documents').delete().eq('user_id', user.id);

      // Sign out and navigate
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="section-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title">Account</h1>
        <p className="section-description">Manage your account information and settings</p>
      </div>

      <hr className="section-divider" />

      {/* Email Address */}
      <div className="input-group">
        <label className="input-label">Email Address</label>
        <input
          type="email"
          className="input-field"
          value={user?.email || ''}
          disabled
        />
      </div>

      {/* Account Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="info-card">
          <span className="card-label">Account Status</span>
          <span className="card-value success">Active</span>
        </div>
        <div className="info-card">
          <span className="card-label">Member Since</span>
          <span className="card-value">{getMemberSince()}</span>
        </div>
      </div>

      <hr className="section-divider" />

      {/* Delete Account Danger Zone */}
      <div className="danger-zone">
        <h3 className="danger-zone-title">Delete Account</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: '20px', margin: 0 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Delete Account</h2>
            <p>This will permanently delete your account and all data. Type <strong>DELETE</strong> to confirm.</p>
            <input
              type="text"
              className="input-field"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
