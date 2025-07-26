import { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, ChevronDown, Lock, Calendar } from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';

export function ShareDialogSimple({ document, isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [permission, setPermission] = useState('view');
  
  // Advanced options
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  
  const dialogRef = useRef(null);
  const linkInputRef = useRef(null);
  const { showToast } = useToast();

  // Create or get share link when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      createOrGetShareLink();
    }
  }, [isOpen, document]);

  // Auto-select link when dialog opens
  useEffect(() => {
    if (isOpen && shareUrl && linkInputRef.current) {
      setTimeout(() => {
        linkInputRef.current.select();
      }, 100);
    }
  }, [isOpen, shareUrl]);

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

  const createOrGetShareLink = async () => {
    setLoading(true);
    try {
      // Get existing shares first
      const shares = await shareService.getDocumentShares(document.id);
      
      // Look for an existing simple share
      const existingShare = shares.find(s => 
        s.share_type === 'link' && 
        s.permissions.length === 1 && 
        s.permissions[0] === 'view' &&
        !s.password_hash &&
        s.is_active
      );

      if (existingShare) {
        setShareUrl(existingShare.shareUrl);
      } else {
        // Create a new share
        const result = await shareService.createShareLink(document.id, {
          permissions: ['view']
        });
        setShareUrl(result.shareUrl);
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      showToast('Failed to create share link', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied!', 'success');
      
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleUpdateShare = async () => {
    setLoading(true);
    try {
      // Create a new share with updated settings
      const result = await shareService.createShareLink(document.id, {
        permissions: [permission],
        password: password || null,
        expiresIn: expiresIn || null
      });
      
      setShareUrl(result.shareUrl);
      showToast('Share settings updated', 'success');
      setShowOptions(false);
    } catch (error) {
      showToast('Failed to update share settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        ref={dialogRef}
        className="bg-dark-secondary rounded-lg w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-lighter/30">
          <h2 className="text-lg font-medium text-text-primary">
            Share "{document.title}"
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-dark-lighter/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Share Link */}
          <div className="flex gap-2">
            <input
              ref={linkInputRef}
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-dark-primary/50 text-text-primary rounded-lg
                       border border-dark-lighter/30 focus:outline-none focus:border-blue-500/50
                       text-sm font-mono"
              placeholder={loading ? "Creating link..." : ""}
            />
            <button
              onClick={handleCopy}
              disabled={!shareUrl || loading}
              className={`px-4 py-2 rounded-lg font-medium transition-all
                       flex items-center gap-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Permission Notice */}
          <div className="text-sm text-text-secondary">
            Anyone with this link can {permission === 'edit' ? 'edit' : 'view'} this document
          </div>

          {/* Options Toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between px-3 py-2 
                     text-sm text-text-secondary hover:text-text-primary
                     hover:bg-dark-lighter/30 rounded-lg transition-all"
          >
            <span>Options</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${
              showOptions ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Advanced Options */}
          {showOptions && (
            <div className="space-y-3 pt-2 border-t border-dark-lighter/30">
              {/* Permission Selector */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Permission
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-primary/50 text-text-primary rounded-lg
                           border border-dark-lighter/30 focus:outline-none focus:border-blue-500/50
                           text-sm"
                >
                  <option value="view">Can view</option>
                  <option value="edit">Can edit</option>
                </select>
              </div>

              {/* Password Protection */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Password (optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Add password"
                    className="w-full pl-10 pr-3 py-2 bg-dark-primary/50 text-text-primary rounded-lg
                             border border-dark-lighter/30 focus:outline-none focus:border-blue-500/50
                             text-sm placeholder-text-secondary/50"
                  />
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Expires after
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-primary/50 text-text-primary rounded-lg
                             border border-dark-lighter/30 focus:outline-none focus:border-blue-500/50
                             text-sm appearance-none"
                  >
                    <option value="">Never</option>
                    <option value="1d">1 day</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50 pointer-events-none" />
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handleUpdateShare}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white
                         rounded-lg font-medium transition-colors disabled:bg-gray-600
                         disabled:cursor-not-allowed"
              >
                Update Share Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}