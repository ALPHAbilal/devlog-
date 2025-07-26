import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Link2, Check, ChevronDown, Lock, Calendar, Eye, Edit3, Sparkles } from 'lucide-react';
import { shareService } from '../services/shareService';
import { useToast } from '../hooks/useToast';

export function ShareDialogPro({ document, isOpen, onClose }) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [permission, setPermission] = useState('view');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
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

  // Auto-select link when ready
  useEffect(() => {
    if (isOpen && shareUrl && linkInputRef.current) {
      const timer = setTimeout(() => {
        linkInputRef.current.select();
        linkInputRef.current.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shareUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      
      // Cmd/Ctrl + C to copy
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && shareUrl) {
        e.preventDefault();
        handleCopy();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shareUrl]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const createOrGetShareLink = async () => {
    setLoading(true);
    try {
      const shares = await shareService.getDocumentShares(document.id);
      
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

  const handleCopy = useCallback(async () => {
    if (!shareUrl || copied) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied!', 'success');
      
      // Reset after animation
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
  }, [shareUrl, copied, showToast]);

  const handleUpdateShare = async () => {
    setIsUpdating(true);
    try {
      const result = await shareService.createShareLink(document.id, {
        permissions: [permission],
        password: password || null,
        expiresIn: expiresIn || null
      });
      
      setShareUrl(result.shareUrl);
      showToast('Share settings updated', 'success');
      
      // Copy the new link automatically
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      
    } catch (error) {
      showToast('Failed to update share settings', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 share-dialog-wrapper ${
        isClosing ? 'closing' : ''
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm share-backdrop" />
      
      {/* Dialog */}
      <div 
        ref={dialogRef}
        className="relative bg-surface-2 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden share-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Share Document
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/5 rounded-xl transition-all hover:scale-110 close-button"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-400 font-medium truncate">
            {document.title}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Share Link Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Share link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 link-input-wrapper">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  ref={linkInputRef}
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full pl-11 pr-4 py-3 bg-surface-1 text-white rounded-xl
                           border border-white/10 focus:outline-none focus:border-blue-500/50
                           focus:ring-2 focus:ring-blue-500/20 transition-all
                           text-sm font-mono selection:bg-blue-500/30 share-link-input"
                  placeholder={loading ? "Creating link..." : ""}
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handleCopy}
                disabled={!shareUrl || loading}
                className={`px-5 py-3 rounded-xl font-medium transition-all
                         flex items-center gap-2.5 shadow-lg relative overflow-hidden
                         copy-button ${copied ? 'copied' : ''} ${
                  copied 
                    ? 'bg-green-500 text-white shadow-green-500/25' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                } disabled:bg-gray-700 disabled:shadow-none disabled:cursor-not-allowed`}
              >
                {copied ? (
                  <div className="flex items-center gap-2 copy-success">
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                    <Sparkles className="w-4 h-4 sparkle-icon" />
                  </div>
                ) : (
                  <span>Copy link</span>
                )}
              </button>
            </div>
          </div>

          {/* Permission Level */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Permission level
            </label>
            <div className="relative permission-selector">
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full px-4 py-3 bg-surface-1 text-white rounded-xl
                         border border-white/10 focus:outline-none focus:border-blue-500/50
                         focus:ring-2 focus:ring-blue-500/20 transition-all
                         appearance-none cursor-pointer pr-12"
              >
                <option value="view">👁 View only</option>
                <option value="edit">✏️ Can edit</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none permission-icon">
                {permission === 'view' ? (
                  <Eye className="w-5 h-5 text-blue-400" />
                ) : (
                  <Edit3 className="w-5 h-5 text-orange-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {permission === 'view' 
                ? 'Recipients can view but not modify the document'
                : 'Recipients can view and make changes to the document'
              }
            </p>
          </div>

          {/* Advanced Settings */}
          <div className="advanced-section">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full flex items-center justify-between px-4 py-3
                       text-sm text-gray-400 hover:text-white
                       bg-surface-1/50 hover:bg-surface-1 rounded-xl
                       transition-all group advanced-toggle ${showAdvanced ? 'active' : ''}`}
            >
              <span className="font-medium">Advanced settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${
                showAdvanced ? 'rotate-180' : ''
              } group-hover:text-blue-400`} />
            </button>

            <div className={`advanced-content ${showAdvanced ? 'show' : ''}`}>
              <div className="pt-4 space-y-4">
                {/* Password Protection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password protection
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Optional password"
                      className="w-full pl-11 pr-4 py-3 bg-surface-1 text-white rounded-xl
                               border border-white/10 focus:outline-none focus:border-blue-500/50
                               focus:ring-2 focus:ring-blue-500/20 transition-all
                               placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Expiration */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Link expiration
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 bg-surface-1 text-white rounded-xl
                               border border-white/10 focus:outline-none focus:border-blue-500/50
                               focus:ring-2 focus:ring-blue-500/20 transition-all
                               appearance-none cursor-pointer"
                    >
                      <option value="">Never expires</option>
                      <option value="1d">1 day</option>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                {/* Update Button */}
                <button
                  onClick={handleUpdateShare}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600
                           hover:from-blue-600 hover:to-blue-700 text-white
                           rounded-xl font-medium transition-all shadow-lg
                           shadow-blue-500/25 hover:shadow-blue-500/40
                           disabled:from-gray-700 disabled:to-gray-700
                           disabled:shadow-none disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 update-button"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Apply changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface-1/30 border-t border-white/5">
          <p className="text-xs text-gray-500 text-center">
            Share links can be revoked anytime from your document settings
          </p>
        </div>
      </div>

      <style jsx>{`
        .share-dialog-wrapper {
          animation: fadeIn 0.2s ease-out;
        }

        .share-dialog-wrapper.closing {
          animation: fadeOut 0.2s ease-out forwards;
        }

        .share-backdrop {
          animation: backdropIn 0.3s ease-out;
        }

        .closing .share-backdrop {
          animation: backdropOut 0.2s ease-out forwards;
        }

        .share-dialog {
          animation: dialogIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .closing .share-dialog {
          animation: dialogOut 0.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes backdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes backdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes dialogIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes dialogOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
        }

        .close-button {
          transition: all 0.2s ease;
        }

        .close-button:hover {
          transform: scale(1.1) rotate(90deg);
        }

        .copy-button {
          position: relative;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .copy-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
        }

        .copy-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .copy-button.copied {
          animation: copySuccess 0.5s ease-out;
        }

        @keyframes copySuccess {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .copy-success {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sparkle-icon {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .share-link-input {
          transition: all 0.3s ease;
        }

        .share-link-input:focus {
          transform: translateX(2px);
        }

        .permission-selector select {
          transition: all 0.2s ease;
        }

        .permission-selector select:focus {
          background-color: rgba(30, 41, 59, 0.8);
        }

        .permission-icon {
          transition: all 0.3s ease;
        }

        .permission-selector:hover .permission-icon {
          transform: translateY(-50%) scale(1.1);
        }

        .advanced-content {
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease-out;
        }

        .advanced-content.show {
          max-height: 500px;
          opacity: 1;
        }

        .advanced-toggle {
          transition: all 0.2s ease;
        }

        .advanced-toggle:hover {
          background-color: rgba(30, 41, 59, 0.8);
        }

        .advanced-toggle.active {
          background-color: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .update-button {
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .update-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -5px rgba(59, 130, 246, 0.5);
        }

        .update-button:active:not(:disabled) {
          transform: translateY(0);
        }

        /* Focus styles for accessibility */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }

        /* Loading shimmer effect */
        .link-input-wrapper:has(input:placeholder-shown) input {
          background: linear-gradient(
            90deg,
            rgba(30, 41, 59, 0.5) 0%,
            rgba(30, 41, 59, 0.8) 50%,
            rgba(30, 41, 59, 0.5) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}