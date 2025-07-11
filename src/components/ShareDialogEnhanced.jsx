/**
 * ShareDialogEnhanced Component
 * 
 * A world-class sharing dialog inspired by Notion, Figma, and Google Docs
 * Features:
 * - Beautiful, intuitive UI with smooth animations
 * - Quick share with one-click copy
 * - Visual permission selector
 * - Real-time user search
 * - Share analytics with visualizations
 * - Smart defaults and templates
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Share2, Copy, Mail, Users, Lock, Calendar, Eye, Link,
  Shield, Globe, X, Check, AlertCircle, Trash2, ChevronDown,
  BarChart, Clock, User, Download, MessageSquare, Edit3,
  Zap, Sparkles, QrCode, UserPlus, Settings, ExternalLink,
  CheckCircle, XCircle, Loader2, Info
} from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../contexts/AuthContextOptimized';
import { ShareAnalytics } from './ShareAnalytics';

export function ShareDialogEnhanced({ document, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [copiedShareId, setCopiedShareId] = useState(null);
  const [quickShareUrl, setQuickShareUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedShare, setSelectedShare] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQR, setShowQR] = useState(false);
  const dialogRef = useRef(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  // Share form state with smart defaults
  const [shareForm, setShareForm] = useState({
    permissions: ['view'],
    password: '',
    expiresIn: '7d',
    maxViews: '',
    requireAuth: false,
    watermark: false,
    emails: '',
    message: ''
  });

  // Animation states
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareCreated, setShareCreated] = useState(false);

  // Load existing shares and create quick share on open
  useEffect(() => {
    if (isOpen && document) {
      loadShares();
      createQuickShare();
    }
  }, [isOpen, document]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const loadShares = async () => {
    try {
      const data = await shareService.getDocumentShares(document.id);
      setShares(data);
    } catch (error) {
      console.error('Failed to load shares:', error);
    }
  };

  const createQuickShare = async () => {
    try {
      // Check if a quick share already exists
      const existingShare = shares.find(s => 
        s.share_type === 'link' && 
        s.permissions.length === 1 && 
        s.permissions[0] === 'view' &&
        !s.password_hash &&
        s.is_active
      );

      if (existingShare) {
        setQuickShareUrl(existingShare.shareUrl);
      } else {
        // Create a new quick share
        const result = await shareService.createShareLink(document.id, {
          permissions: ['view'],
          expiresIn: '7d'
        });
        setQuickShareUrl(result.shareUrl);
        loadShares();
      }
    } catch (error) {
      console.error('Failed to create quick share:', error);
    }
  };

  const handleCopyLink = async (url = quickShareUrl, shareId = null) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedShareId(shareId || 'quick');
      showToast('Link copied to clipboard!', 'success');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedShareId(null), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleAdvancedShare = async () => {
    setIsCreatingShare(true);
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
        const emails = shareForm.emails.split(',').map(e => e.trim()).filter(e => e);
        result = await shareService.shareWithUsers(document.id, emails, options);
        showToast(`Shared with ${emails.length} user${emails.length > 1 ? 's' : ''}`, 'success');
      } else {
        // Create link share
        result = await shareService.createShareLink(document.id, options);
        await handleCopyLink(result.shareUrl, result.shareId);
      }

      setShareCreated(true);
      setTimeout(() => {
        setShareCreated(false);
        setIsCreatingShare(false);
        setShowAdvanced(false);
        // Reset form
        setShareForm({
          permissions: ['view'],
          password: '',
          expiresIn: '7d',
          maxViews: '',
          requireAuth: false,
          watermark: false,
          emails: '',
          message: ''
        });
      }, 1500);

      loadShares();
    } catch (error) {
      showToast('Failed to create share', 'error');
      setIsCreatingShare(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShare = async (shareId) => {
    try {
      await shareService.revokeShare(shareId);
      showToast('Share link revoked', 'success');
      loadShares();
      if (selectedShare?.id === shareId) {
        setSelectedShare(null);
      }
    } catch (error) {
      showToast('Failed to revoke share', 'error');
    }
  };

  const togglePermission = (permission) => {
    setShareForm(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      
      // Ensure at least one permission is selected
      if (newPermissions.length === 0) {
        return prev;
      }
      
      return { ...prev, permissions: newPermissions };
    });
  };

  const getPermissionIcon = (permission) => {
    switch (permission) {
      case 'view': return Eye;
      case 'comment': return MessageSquare;
      case 'edit': return Edit3;
      case 'download': return Download;
      default: return Eye;
    }
  };

  const getPermissionColor = (permission) => {
    switch (permission) {
      case 'view': return 'blue';
      case 'comment': return 'purple';
      case 'edit': return 'orange';
      case 'download': return 'green';
      default: return 'gray';
    }
  };

  const shareTemplates = [
    { name: 'View Only', permissions: ['view'], icon: Eye },
    { name: 'Can Comment', permissions: ['view', 'comment'], icon: MessageSquare },
    { name: 'Can Edit', permissions: ['view', 'edit'], icon: Edit3 },
    { name: 'Full Access', permissions: ['view', 'comment', 'edit', 'download'], icon: Zap }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      <div 
        ref={dialogRef}
        className="bg-dark-secondary rounded-xl w-full max-w-2xl shadow-2xl 
                   transform transition-all duration-300 scale-100 opacity-100
                   flex flex-col overflow-hidden"
        style={{
          animation: 'slideUp 0.3s ease-out',
          maxHeight: 'min(85vh, 800px)'
        }}
      >
        {/* Header - Fixed */}
        <div className="px-6 py-4 border-b border-dark-lighter/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Share2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Share "{document.title}"
                </h2>
                <p className="text-sm text-text-secondary">
                  {shares.length} active share{shares.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-dark-lighter rounded-lg transition-all hover:scale-110"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
          {/* Quick Share Section */}
          <div className="p-6 border-b border-dark-lighter/50">
          <div className="space-y-4">
            {/* Share Link Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={quickShareUrl}
                  readOnly
                  className="w-full px-4 py-3 bg-dark-primary/90 text-text-primary rounded-lg
                           border border-dark-lighter/70 pr-10 font-mono text-sm
                           focus:outline-none focus:border-blue-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Link className="w-4 h-4 text-text-secondary" />
                </div>
              </div>
              <button
                onClick={() => handleCopyLink()}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200
                         flex items-center gap-2 shadow-lg ${
                  copiedShareId === 'quick'
                    ? 'bg-green-500 text-white shadow-green-500/25'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                }`}
              >
                {copiedShareId === 'quick' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-3 py-1.5 text-sm bg-dark-lighter/80 hover:bg-dark-lighter
                         border border-dark-lighter/50 hover:border-dark-lighter
                         text-text-secondary hover:text-text-primary
                         rounded-lg transition-all flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              <button
                className="px-3 py-1.5 text-sm bg-dark-lighter/80 hover:bg-dark-lighter
                         border border-dark-lighter/50 hover:border-dark-lighter
                         text-text-secondary hover:text-text-primary
                         rounded-lg transition-all flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-1.5 text-sm bg-dark-lighter/80 hover:bg-dark-lighter
                         border border-dark-lighter/50 hover:border-dark-lighter
                         text-text-secondary hover:text-text-primary
                         rounded-lg transition-all flex items-center gap-2 ml-auto"
              >
                <Settings className="w-4 h-4" />
                Advanced
                <ChevronDown className={`w-4 h-4 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`} />
              </button>
            </div>

            {/* QR Code Display */}
            {showQR && (
              <div className="mt-4 p-4 bg-dark-lighter/50 border border-dark-lighter/50 rounded-lg text-center">
                <div className="w-48 h-48 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center">
                  <span className="text-dark-primary text-sm font-medium">QR Code Placeholder</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Scan to access on mobile
                </p>
              </div>
            )}
          </div>
          </div>

          {/* Advanced Settings */}
          {showAdvanced && (
            <div className="p-6 border-b border-dark-lighter/50 space-y-6 
                          animate-in slide-in-from-top duration-300">
            {/* Permission Templates */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Permission Templates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {shareTemplates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = JSON.stringify(shareForm.permissions.sort()) === 
                                   JSON.stringify(template.permissions.sort());
                  
                  return (
                    <button
                      key={template.name}
                      onClick={() => setShareForm(prev => ({ 
                        ...prev, 
                        permissions: template.permissions 
                      }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-dark-lighter/70 hover:border-blue-500/50 bg-dark-lighter/30 hover:bg-dark-lighter/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${
                          isSelected ? 'text-blue-400' : 'text-text-secondary'
                        }`} />
                        <div className="text-left">
                          <div className={`font-medium ${
                            isSelected ? 'text-blue-400' : 'text-text-primary'
                          }`}>
                            {template.name}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {template.permissions.join(', ')}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Permissions */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Custom Permissions
              </label>
              <div className="flex flex-wrap gap-2">
                {['view', 'comment', 'edit', 'download'].map(permission => {
                  const Icon = getPermissionIcon(permission);
                  const color = getPermissionColor(permission);
                  const isSelected = shareForm.permissions.includes(permission);
                  
                  return (
                    <button
                      key={permission}
                      onClick={() => togglePermission(permission)}
                      className={`px-3 py-2 rounded-lg border transition-all
                               flex items-center gap-2 ${
                        isSelected
                          ? `bg-${color}-500/30 border-${color}-500/50 text-${color}-400`
                          : 'border-dark-lighter/70 bg-dark-lighter/30 text-text-secondary hover:text-text-primary hover:bg-dark-lighter/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{permission}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Share with Users */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Share with specific people
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Enter email addresses separated by commas"
                  value={shareForm.emails}
                  onChange={(e) => setShareForm(prev => ({ ...prev, emails: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-dark-primary/90 border border-dark-lighter/70
                           rounded-lg focus:border-blue-500 focus:outline-none text-sm
                           placeholder-text-secondary/50"
                />
              </div>
            </div>

            {/* Security Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password Protection
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="password"
                    placeholder="Optional password"
                    value={shareForm.password}
                    onChange={(e) => setShareForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-dark-primary/90 border border-dark-lighter/70
                             rounded-lg focus:border-blue-500 focus:outline-none text-sm
                             placeholder-text-secondary/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Expiration
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <select
                    value={shareForm.expiresIn}
                    onChange={(e) => setShareForm(prev => ({ ...prev, expiresIn: e.target.value }))}
                    className="w-full pl-10 pr-8 py-2 bg-dark-primary/90 border border-dark-lighter/70
                             rounded-lg focus:border-blue-500 focus:outline-none text-sm appearance-none"
                  >
                    <option value="">Never expires</option>
                    <option value="1h">1 hour</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareForm.requireAuth}
                    onChange={(e) => setShareForm(prev => ({ ...prev, requireAuth: e.target.checked }))}
                    className="w-4 h-4 rounded border-dark-lighter text-blue-500 
                             focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-text-primary">Require sign-in</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareForm.watermark}
                    onChange={(e) => setShareForm(prev => ({ ...prev, watermark: e.target.checked }))}
                    className="w-4 h-4 rounded border-dark-lighter text-blue-500 
                             focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-text-primary">Add watermark</span>
                </label>
              </div>

              <button
                onClick={handleAdvancedShare}
                disabled={loading || shareForm.permissions.length === 0}
                className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg
                         flex items-center gap-2 ${
                  isCreatingShare
                    ? shareCreated
                      ? 'bg-green-500 text-white shadow-green-500/25'
                      : 'bg-blue-500/50 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                } disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none`}
              >
                {isCreatingShare ? (
                  shareCreated ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Created!
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  )
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Share
                  </>
                )}
              </button>
            </div>
            </div>
          )}

          {/* Active Shares */}
          <div className="p-6 bg-dark-primary/30">
          <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Active Shares
          </h3>
          
          {shares.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-dark-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-8 h-8 text-text-secondary/50" />
              </div>
              <p className="text-text-secondary">No active shares yet</p>
              <p className="text-sm text-text-secondary/60 mt-1">
                Create a share link to collaborate with others
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {shares.map(share => (
                <ShareItem
                  key={share.id}
                  share={share}
                  onCopy={() => handleCopyLink(share.shareUrl, share.id)}
                  onRevoke={() => handleRevokeShare(share.id)}
                  onSelect={() => setSelectedShare(share)}
                  onAnalytics={() => setShowAnalytics(share.id)}
                  isSelected={selectedShare?.id === share.id}
                  isCopied={copiedShareId === share.id}
                />
              ))}
            </div>
          )}
          </div>
          {/* Bottom padding to ensure last content is visible */}
          <div className="h-4"></div>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t border-dark-lighter/50 bg-dark-primary/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-text-secondary/80">
            <Info className="w-4 h-4 text-blue-400/60" />
            <span>
              Share links are unique and can be revoked at any time. 
              {user?.email && (
                <span className="text-text-secondary">
                  Shared by <span className="text-blue-400/80">{user.email}</span>
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-secondary rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-lighter/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Share Analytics</h2>
              <button
                onClick={() => setShowAnalytics(null)}
                className="p-2 hover:bg-dark-lighter rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <ShareAnalytics shareId={showAnalytics} onClose={() => setShowAnalytics(null)} />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-top {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Share Item Component
function ShareItem({ share, onCopy, onRevoke, onSelect, onAnalytics, isSelected, isCopied }) {
  const getShareTypeColor = (type) => {
    switch (type) {
      case 'public': return 'green';
      case 'user': return 'blue';
      case 'link': return 'purple';
      default: return 'gray';
    }
  };

  const color = getShareTypeColor(share.share_type);

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-dark-lighter/70 hover:border-blue-500/50 hover:bg-dark-lighter/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                           bg-${color}-500/30 text-${color}-400 border border-${color}-500/30`}>
              {share.share_type}
            </span>
            <span className="text-xs text-text-secondary">
              {share.permissions.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
            </span>
            {share.isExpired && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Expired
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-text-secondary mt-1">
            <span className="font-mono text-text-primary/80">{share.share_code}</span>
            {share.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {share.view_count}
              </span>
            )}
            {share.expires_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(share.expires_at).toLocaleDateString()}
              </span>
            )}
            {share.password_hash && (
              <Lock className="w-3 h-3" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onCopy}
            className={`p-1.5 rounded transition-all ${
              isCopied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'hover:bg-dark-lighter/70 text-text-secondary hover:text-text-primary border border-transparent'
            }`}
            title="Copy link"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onAnalytics}
            className="p-1.5 rounded hover:bg-dark-lighter/70 text-text-secondary 
                     hover:text-blue-400 transition-all border border-transparent
                     hover:border-blue-500/30"
            title="View analytics"
          >
            <BarChart className="w-4 h-4" />
          </button>
          <button
            onClick={onRevoke}
            className="p-1.5 rounded hover:bg-red-500/20 text-text-secondary 
                     hover:text-red-400 transition-all border border-transparent
                     hover:border-red-500/30"
            title="Revoke share"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Add relative time helper
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