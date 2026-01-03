/**
 * Enhanced Share Dialog Component
 * 
 * Sophisticated sharing interface with three modes:
 * - Public: Quick sharing with optional security
 * - Team: Domain or team-based access control
 * - Private: Individual user invitations
 */

import { useState, useEffect } from 'react';
import { 
  X, Link, Users, Lock, Globe, Shield, Clock, 
  Eye, Download, MessageSquare, Edit3, Copy,
  ChevronRight, Info, AlertCircle, CheckCircle,
  Mail, Building, User
} from 'lucide-react';
import { sophisticatedShareService } from '@/features/share';
import { useToast } from '@/shared/hooks';

export default function EnhancedShareDialog({ document, isOpen, onClose, onUpdate }) {
  const { showToast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'
  const [shareMode, setShareMode] = useState('public'); // 'public', 'team', 'private'
  const [loading, setLoading] = useState(false);
  const [existingShares, setExistingShares] = useState([]);
  
  // Share creation state
  const [permissions, setPermissions] = useState(['view']);
  const [password, setPassword] = useState('');
  const [requireAuth, setRequireAuth] = useState(false);
  const [expiresIn, setExpiresIn] = useState('');
  const [maxViews, setMaxViews] = useState('');
  
  // Team sharing state
  const [teamDomains, setTeamDomains] = useState(['']);
  
  // Private sharing state
  const [recipientEmails, setRecipientEmails] = useState(['']);
  const [personalMessage, setPersonalMessage] = useState('');
  
  // Advanced settings
  const [watermark, setWatermark] = useState(false);
  const [notifyOnAccess, setNotifyOnAccess] = useState(false);
  
  // Load existing shares
  useEffect(() => {
    if (isOpen && document) {
      loadExistingShares();
    }
  }, [isOpen, document]);

  const loadExistingShares = async () => {
    try {
      const shares = await sophisticatedShareService.getDocumentShares(document.id);
      setExistingShares(shares);
    } catch (error) {
      console.error('Failed to load shares:', error);
    }
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const settings = {
        watermark,
        notifyOnAccess,
        allowedDomains: shareMode === 'public' && teamDomains[0] ? teamDomains.filter(d => d) : []
      };

      const options = {
        mode: shareMode,
        permissions,
        password: password || null,
        requireAuth,
        expiresIn: expiresIn || null,
        maxViews: maxViews ? parseInt(maxViews) : null,
        settings
      };

      // Add mode-specific options
      if (shareMode === 'team') {
        options.teamDomains = teamDomains.filter(d => d);
      } else if (shareMode === 'private') {
        options.recipientEmails = recipientEmails.filter(e => e);
        // Create personal messages object
        const messages = {};
        if (personalMessage) {
          recipientEmails.forEach(email => {
            if (email) messages[email] = personalMessage;
          });
        }
        options.personalMessages = messages;
      }

      const share = await sophisticatedShareService.createShare(document.id, options);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(share.shareUrl);
      showToast('Share link created and copied to clipboard!', 'success');
      
      // Reload shares
      await loadExistingShares();
      
      // Reset form
      resetForm();
      
      // Notify parent
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Share creation failed:', error);
      showToast(error.message || 'Failed to create share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (!confirm('Are you sure you want to revoke this share? This cannot be undone.')) {
      return;
    }

    try {
      await sophisticatedShareService.revokeShare(shareId);
      showToast('Share link revoked successfully', 'success');
      await loadExistingShares();
    } catch (error) {
      console.error('Failed to revoke share:', error);
      showToast('Failed to revoke share link', 'error');
    }
  };

  const resetForm = () => {
    setShareMode('public');
    setPermissions(['view']);
    setPassword('');
    setRequireAuth(false);
    setExpiresIn('');
    setMaxViews('');
    setTeamDomains(['']);
    setRecipientEmails(['']);
    setPersonalMessage('');
    setWatermark(false);
    setNotifyOnAccess(false);
  };

  const togglePermission = (permission) => {
    setPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const addTeamDomain = () => setTeamDomains([...teamDomains, '']);
  const removeTeamDomain = (index) => setTeamDomains(teamDomains.filter((_, i) => i !== index));
  const updateTeamDomain = (index, value) => {
    const updated = [...teamDomains];
    updated[index] = value;
    setTeamDomains(updated);
  };

  const addRecipientEmail = () => setRecipientEmails([...recipientEmails, '']);
  const removeRecipientEmail = (index) => setRecipientEmails(recipientEmails.filter((_, i) => i !== index));
  const updateRecipientEmail = (index, value) => {
    const updated = [...recipientEmails];
    updated[index] = value;
    setRecipientEmails(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-lighter rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-text-primary">
              Share "{document.title}"
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-primary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary'
              }`}
            >
              Create Share
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                activeTab === 'manage'
                  ? 'bg-blue-500 text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-dark-primary'
              }`}
            >
              Manage Shares
              {existingShares.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-green rounded-full text-xs flex items-center justify-center">
                  {existingShares.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'create' ? (
            <div className="space-y-6">
              {/* Share Mode Selection */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Sharing Mode</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setShareMode('public')}
                    className={`p-4 rounded-xl border transition-all ${
                      shareMode === 'public'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Globe className="w-6 h-6 text-blue-400 mb-2" />
                    <h4 className="font-medium text-text-primary">Public</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Anyone with the link
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setShareMode('team')}
                    className={`p-4 rounded-xl border transition-all ${
                      shareMode === 'team'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Building className="w-6 h-6 text-purple-400 mb-2" />
                    <h4 className="font-medium text-text-primary">Team</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Domain-based access
                    </p>
                  </button>
                  
                  <button
                    onClick={() => setShareMode('private')}
                    className={`p-4 rounded-xl border transition-all ${
                      shareMode === 'private'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <User className="w-6 h-6 text-green-400 mb-2" />
                    <h4 className="font-medium text-text-primary">Private</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Specific people only
                    </p>
                  </button>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Permissions</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: 'view', icon: Eye, label: 'View' },
                    { id: 'comment', icon: MessageSquare, label: 'Comment' },
                    { id: 'edit', icon: Edit3, label: 'Edit' },
                    { id: 'download', icon: Download, label: 'Download' }
                  ].map(perm => (
                    <button
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      disabled={perm.id === 'view'} // View is always required
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        permissions.includes(perm.id)
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-700 hover:border-gray-600 text-text-secondary'
                      } ${perm.id === 'view' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <perm.icon className="w-4 h-4" />
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode-specific Options */}
              {shareMode === 'team' && (
                <div>
                  <h3 className="text-lg font-medium text-text-primary mb-4">Team Domains</h3>
                  <div className="space-y-3">
                    {teamDomains.map((domain, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => updateTeamDomain(index, e.target.value)}
                          placeholder="example.com"
                          className="flex-1 px-4 py-2 bg-dark-primary border border-gray-700 
                                   rounded-lg focus:border-blue-500 focus:ring-2 
                                   focus:ring-blue-500/20 focus:outline-none"
                        />
                        <button
                          onClick={() => removeTeamDomain(index)}
                          className="p-2 hover:bg-dark-primary rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-text-secondary" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addTeamDomain}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      + Add another domain
                    </button>
                  </div>
                </div>
              )}

              {shareMode === 'private' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">Recipients</h3>
                    <div className="space-y-3">
                      {recipientEmails.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => updateRecipientEmail(index, e.target.value)}
                            placeholder="email@example.com"
                            className="flex-1 px-4 py-2 bg-dark-primary border border-gray-700 
                                     rounded-lg focus:border-blue-500 focus:ring-2 
                                     focus:ring-blue-500/20 focus:outline-none"
                          />
                          <button
                            onClick={() => removeRecipientEmail(index)}
                            className="p-2 hover:bg-dark-primary rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5 text-text-secondary" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addRecipientEmail}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        + Add another recipient
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Add a message for the recipients..."
                      rows={3}
                      className="w-full px-4 py-2 bg-dark-primary border border-gray-700 
                               rounded-lg focus:border-blue-500 focus:ring-2 
                               focus:ring-blue-500/20 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Security Options */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Security Options</h3>
                <div className="space-y-4">
                  {shareMode !== 'private' && (
                    <div className="flex items-center justify-between p-4 bg-dark-primary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Password Protection</p>
                          <p className="text-sm text-text-secondary">Require a password to access</p>
                        </div>
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-48 px-3 py-1.5 bg-dark-lighter border border-gray-700 
                                 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  {shareMode === 'public' && (
                    <div className="flex items-center justify-between p-4 bg-dark-primary rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-text-secondary" />
                        <div>
                          <p className="font-medium text-text-primary">Require Authentication</p>
                          <p className="text-sm text-text-secondary">Users must sign in to view</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setRequireAuth(!requireAuth)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          requireAuth ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          requireAuth ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-dark-primary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-text-secondary" />
                      <div>
                        <p className="font-medium text-text-primary">Expiration</p>
                        <p className="text-sm text-text-secondary">Auto-expire after duration</p>
                      </div>
                    </div>
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      className="w-48 px-3 py-1.5 bg-dark-lighter border border-gray-700 
                               rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Never</option>
                      <option value="1h">1 hour</option>
                      <option value="24h">24 hours</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="border-t border-gray-700 pt-6">
                <button
                  onClick={() => setWatermark(!watermark)}
                  className="flex items-center justify-between w-full p-4 bg-dark-primary rounded-lg hover:bg-dark-primary/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-text-secondary" />
                    <div className="text-left">
                      <p className="font-medium text-text-primary">Add Watermark</p>
                      <p className="text-sm text-text-secondary">Show viewer info on document</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    watermark ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      watermark ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Manage Shares Tab */
            <div className="space-y-4">
              {existingShares.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary">No active shares for this document</p>
                </div>
              ) : (
                existingShares.map(share => (
                  <div
                    key={share.id}
                    className="p-4 bg-dark-primary rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {share.share_mode === 'public' && <Globe className="w-5 h-5 text-blue-400" />}
                          {share.share_mode === 'team' && <Building className="w-5 h-5 text-purple-400" />}
                          {share.share_mode === 'private' && <User className="w-5 h-5 text-green-400" />}
                          
                          <span className="font-medium text-text-primary capitalize">
                            {share.share_mode} Share
                          </span>
                          
                          {share.isExpired && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-lg">
                              Expired
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-text-secondary">
                          <p>Permissions: {share.permissions.join(', ')}</p>
                          <p>Views: {share.view_count} {share.max_views && `/ ${share.max_views}`}</p>
                          {share.expires_at && (
                            <p>Expires: {new Date(share.expires_at).toLocaleDateString()}</p>
                          )}
                          {share.teams && share.teams.length > 0 && (
                            <p>Teams: {share.teams.map(t => t.team_domain || t.team_name).join(', ')}</p>
                          )}
                          {share.recipients && share.recipients.length > 0 && (
                            <p>Recipients: {share.acceptedRecipients}/{share.totalRecipients} accepted</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(share.shareUrl);
                              showToast('Link copied to clipboard!', 'success');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 
                                     hover:bg-blue-500/30 text-blue-400 rounded-lg 
                                     transition-colors text-sm"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Link
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleRevokeShare(share.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                        title="Revoke share"
                      >
                        <X className="w-5 h-5 text-text-secondary group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'create' && (
          <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateShare}
              disabled={loading || 
                (shareMode === 'team' && !teamDomains.some(d => d)) ||
                (shareMode === 'private' && !recipientEmails.some(e => e))
              }
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 
                       disabled:cursor-not-allowed rounded-lg transition-colors 
                       font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  Create Share Link
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}