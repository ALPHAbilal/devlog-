/**
 * ShareDialog Component
 * 
 * A comprehensive dialog for sharing documents with various options:
 * - Quick share links
 * - User-specific sharing
 * - Advanced security settings
 * - Active share management
 */

import { useState, useEffect } from 'react';
import { 
  Share2, Copy, Mail, Users, Lock, Calendar, Eye, 
  Shield, Globe, X, Check, AlertCircle, Trash2,
  BarChart, Clock, User
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';

export function ShareDialog({ document, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('quick');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const { showToast } = useToast();

  // Share form state
  const [shareForm, setShareForm] = useState({
    permissions: ['view'],
    password: '',
    expiresIn: '',
    maxViews: '',
    requireAuth: false,
    watermark: false,
    emails: ''
  });

  // Load existing shares
  useEffect(() => {
    if (isOpen && document) {
      loadShares();
    }
  }, [isOpen, document]);

  const loadShares = async () => {
    try {
      const data = await shareService.getDocumentShares(document.id);
      setShares(data);
    } catch (error) {
      showToast('Failed to load shares', 'error');
    }
  };

  const handleQuickShare = async () => {
    setLoading(true);
    try {
      const result = await shareService.createShareLink(document.id, {
        permissions: ['view'],
        expiresIn: '7d'
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareUrl);
      showToast('Share link copied to clipboard!', 'success');
      
      // Reload shares
      loadShares();
    } catch (error) {
      showToast('Failed to create share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedShare = async () => {
    setLoading(true);
    try {
      const options = {
        permissions: shareForm.permissions,
        password: shareForm.password || null,
        expiresIn: shareForm.expiresIn || null,
        maxViews: shareForm.maxViews ? parseInt(shareForm.maxViews) : null,
        requireAuth: shareForm.requireAuth,
        watermark: shareForm.watermark
      };

      let result;
      if (shareForm.emails) {
        // Share with specific users
        const emails = shareForm.emails.split(',').map(e => e.trim());
        result = await shareService.shareWithUsers(document.id, emails, options);
        showToast(`Shared with ${emails.length} users`, 'success');
      } else {
        // Create link share
        result = await shareService.createShareLink(document.id, options);
        await navigator.clipboard.writeText(result.shareUrl);
        showToast('Advanced share link created and copied!', 'success');
      }

      // Reset form and reload
      setShareForm({
        permissions: ['view'],
        password: '',
        expiresIn: '',
        maxViews: '',
        requireAuth: false,
        watermark: false,
        emails: ''
      });
      loadShares();
    } catch (error) {
      showToast('Failed to create share', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (!confirm('Are you sure you want to revoke this share?')) return;

    try {
      await shareService.revokeShare(shareId);
      showToast('Share revoked successfully', 'success');
      loadShares();
    } catch (error) {
      showToast('Failed to revoke share', 'error');
    }
  };

  const loadShareAnalytics = async (shareId) => {
    try {
      const data = await shareService.getShareAnalytics(shareId);
      setAnalytics({ shareId, ...data });
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    }
  };

  const togglePermission = (permission) => {
    setShareForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-lighter rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share "{document.title}"
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Share this document with others securely
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'quick'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Quick Share
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'advanced'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Advanced
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'active'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Active Shares ({shares.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="bg-dark p-4 rounded-lg border border-gray-700">
                <h3 className="font-medium mb-3">Quick Share Options</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleQuickShare}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 
                             text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Copy Share Link</div>
                      <div className="text-sm opacity-75">View-only access, expires in 7 days</div>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 
                                   text-purple-400 rounded-lg transition-colors">
                    <Mail className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Email Invite</div>
                      <div className="text-sm opacity-75">Send invitation via email</div>
                    </div>
                  </button>

                  <button className="w-full flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 
                                   text-green-400 rounded-lg transition-colors">
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Share with Team</div>
                      <div className="text-sm opacity-75">Coming soon</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-medium mb-1">Share Responsibly</p>
                    <p className="opacity-75">
                      Anyone with the link can view this document. Be careful when sharing sensitive information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-4">
              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['view', 'comment', 'edit', 'download'].map(perm => (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        shareForm.permissions.includes(perm)
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'border-gray-600 text-gray-400 hover:text-white'
                      }`}
                    >
                      {perm.charAt(0).toUpperCase() + perm.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share with specific users */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Share with specific users (optional)
                </label>
                <input
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={shareForm.emails}
                  onChange={(e) => setShareForm(prev => ({ ...prev, emails: e.target.value }))}
                  className="w-full px-3 py-2 bg-dark border border-gray-600 rounded-lg 
                           focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Security Settings */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Settings
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Password Protection</label>
                    <input
                      type="password"
                      placeholder="Optional password"
                      value={shareForm.password}
                      onChange={(e) => setShareForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark border border-gray-600 rounded-lg 
                               focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Expiration</label>
                    <select
                      value={shareForm.expiresIn}
                      onChange={(e) => setShareForm(prev => ({ ...prev, expiresIn: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark border border-gray-600 rounded-lg 
                               focus:border-blue-500 focus:outline-none text-sm"
                    >
                      <option value="">Never</option>
                      <option value="1h">1 hour</option>
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">View Limit</label>
                    <input
                      type="number"
                      placeholder="Unlimited"
                      value={shareForm.maxViews}
                      onChange={(e) => setShareForm(prev => ({ ...prev, maxViews: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark border border-gray-600 rounded-lg 
                               focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareForm.requireAuth}
                      onChange={(e) => setShareForm(prev => ({ ...prev, requireAuth: e.target.checked }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-sm">Require authentication</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareForm.watermark}
                      onChange={(e) => setShareForm(prev => ({ ...prev, watermark: e.target.checked }))}
                      className="rounded border-gray-600"
                    />
                    <span className="text-sm">Add watermark</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleAdvancedShare}
                disabled={loading || shareForm.permissions.length === 0}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 
                         disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {loading ? 'Creating Share...' : 'Create Advanced Share'}
              </button>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              {shares.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active shares</p>
                  <p className="text-sm mt-1">Create a share link to get started</p>
                </div>
              ) : (
                shares.map(share => (
                  <div
                    key={share.id}
                    className="bg-dark p-4 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            share.share_type === 'public' ? 'bg-green-500/20 text-green-400' :
                            share.share_type === 'user' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {share.share_type}
                          </span>
                          <span className="text-sm text-gray-400">
                            {share.permissions.join(', ')}
                          </span>
                        </div>

                        <div className="font-mono text-sm text-gray-300 mb-2">
                          {share.share_code}
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          {share.view_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {share.view_count} views
                            </span>
                          )}
                          {share.expires_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Expires {new Date(share.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          {share.password_hash && (
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Password protected
                            </span>
                          )}
                        </div>

                        {share.document_share_users?.length > 0 && (
                          <div className="mt-2 text-xs">
                            Shared with: {share.document_share_users.map(u => u.user_email).join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(share.shareUrl);
                            showToast('Link copied!', 'success');
                          }}
                          className="p-2 hover:bg-dark rounded-lg transition-colors"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => loadShareAnalytics(share.id)}
                          className="p-2 hover:bg-dark rounded-lg transition-colors"
                          title="View analytics"
                        >
                          <BarChart className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="p-2 hover:bg-dark rounded-lg transition-colors text-red-400"
                          title="Revoke share"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Analytics */}
                    {analytics?.shareId === share.id && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <BarChart className="w-4 h-4" />
                          Share Analytics
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-2xl font-bold text-blue-400">
                              {analytics.totalViews}
                            </div>
                            <div className="text-xs text-gray-500">Total Views</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-400">
                              {analytics.uniqueViewers}
                            </div>
                            <div className="text-xs text-gray-500">Unique Viewers</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-400">
                              {Object.keys(analytics.actionBreakdown).length}
                            </div>
                            <div className="text-xs text-gray-500">Action Types</div>
                          </div>
                        </div>

                        {analytics.recentActivity.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-1">Recent Activity</h5>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {analytics.recentActivity.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{activity.user}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{activity.action}</span>
                                  <span className="text-gray-600">•</span>
                                  <span>{new Date(activity.time).toRelativeTimeString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add this helper to Date prototype for relative time
if (!Date.prototype.toRelativeTimeString) {
  Date.prototype.toRelativeTimeString = function() {
    const now = new Date();
    const diff = now - this;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };
}